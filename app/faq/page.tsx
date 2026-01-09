"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useSupportWidget } from '@/lib/hooks/useSupportWidget';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';

// SVG Icons as components - используем функции для динамических классов
const getIcons = (isLight: boolean) => ({
  microphone: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  user: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  search: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  edit: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  music: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  warning: (
    <svg className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  xCircle: (
    <svg className={`w-5 h-5 ${isLight ? 'text-red-600' : 'text-red-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trendingUp: (
    <svg className={`w-5 h-5 ${isLight ? 'text-green-600' : 'text-green-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  lightBulb: (
    <svg className={`w-5 h-5 ${isLight ? 'text-yellow-600' : 'text-yellow-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  searchIcon: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  arrowRight: (isLight: boolean) => (
    <svg className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
});

// Custom component for rendering FAQ answers with icons
const FAQAnswer = ({ content }: { content: React.ReactNode }) => (
  <div className="text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed">
    {content}
  </div>
);

// Item with icon component
const IconItem = ({ icon, children, className = "" }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <span className="mt-0.5">{icon}</span>
    <span>{children}</span>
  </div>
);

const FAQ_DATA = [
  {
    category: 'Дистрибуция',
    questions: [
      {
        q: 'Как загрузить релиз на платформы?',
        a: '',
        component: 'uploadRelease'
      },
      {
        q: 'Требования к аудио',
        a: '',
        component: 'audioRequirements'
      },
      {
        q: 'Требования к обложке',
        a: '',
        component: 'coverRequirements'
      },
      {
        q: 'Сколько времени занимает публикация?',
        a: 'Обычно релиз появляется на платформах в течение 2-5 рабочих дней после одобрения модерацией. Spotify и Apple Music могут требовать до 7 дней.',
        component: null
      },
      {
        q: 'На какие платформы вы дистрибутируете?',
        a: 'Мы дистрибутируем на все основные платформы: Spotify, Apple Music, YouTube Music, Яндекс Музыка, VK Music, Deezer, Tidal, Amazon Music и более 150 других.',
        component: null
      },
      {
        q: 'Могу ли я выбрать дату релиза?',
        a: 'Да! При загрузке укажите желаемую дату релиза. Рекомендуем указывать дату минимум за 2 недели до публикации для попадания в плейлисты.',
        component: null
      },
      {
        q: 'Что такое ISRC и UPC коды?',
        a: '',
        component: 'isrcUpc'
      },
    ]
  },
  {
    category: 'Финансы',
    questions: [
      {
        q: 'Как работают выплаты?',
        a: '',
        component: 'payouts'
      },
      {
        q: 'Когда я получу отчёты с продаж?',
        a: '',
        component: 'reports'
      },
    ]
  },
  {
    category: 'Аккаунт',
    questions: [
      {
        q: 'Как изменить никнейм артиста?',
        a: 'Никнейм артиста нельзя изменить самостоятельно после регистрации. Если вы случайно ввели неправильный никнейм, обратитесь в поддержку — мы поможем решить этот вопрос.',
        component: null
      },
      {
        q: 'Забыл пароль, что делать?',
        a: 'На странице входа нажмите "Забыли пароль?" и введите email. Вам придёт ссылка для восстановления.',
        component: null
      },
      {
        q: 'Как связаться с поддержкой?',
        a: 'Нажмите на кнопку "Написать в поддержку" внизу страницы или используйте виджет поддержки в правом нижнем углу. Мы отвечаем в течение 24 часов.',
        component: null
      },
    ]
  },
  {
    category: 'Роли и Контрибуторы',
    questions: [
      {
        q: 'Роли артистов и контрибуторов',
        a: '',
        component: 'roles'
      },
    ]
  },
  {
    category: 'Биты и Права',
    questions: [
      {
        q: 'Почему не стоит использовать фришные биты с ютуба',
        a: '',
        component: 'beats'
      },
    ]
  },
  {
    category: 'Сотрудничество',
    questions: [
      {
        q: 'Кто может присоединиться к thqlabel?',
        a: 'Мы работаем со всеми артистами независимо от уровня. Зарегистрируйтесь, загрузите демо — и мы рассмотрим вашу заявку.',
        component: null
      },
      {
        q: 'Есть ли контракт?',
        a: 'Да, мы заключаем неэксклюзивный лицензионный договор. Вы сохраняете все права на музыку и можете выйти из сотрудничества в любой момент.',
        component: null
      },
    ]
  },
  {
    category: 'Аналитика',
    questions: [
      {
        q: 'Где смотреть статистику?',
        a: '',
        component: 'analytics'
      },
    ]
  },
];

// Custom rendered components for complex FAQ answers
const RolesComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <p className={isLight ? 'text-gray-700' : 'text-white/80'}>Артисты и контрибуторы указывают роли, требуемые музыкальными площадками, особенно Spotify и Apple Music/iTunes.</p>
      
      <IconItem icon={Icons.microphone}>
        <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Основной артист</span>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}> — тот, чьё имя указывается как исполнителя, и чей профиль пополняется новыми релизами.</span>
      </IconItem>
      
      <IconItem icon={Icons.user}>
        <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Контрибутор</span>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}> — участник процесса создания, не отображаемый как исполнитель.</span>
      </IconItem>
      
      <IconItem icon={Icons.search}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Обязательно указывать реальные имена авторов текста, композиторов и аранжировщиков, остальные могут использовать псевдонимы.</span>
      </IconItem>
      
      <IconItem icon={Icons.edit}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Добавляются в соответствующем разделе при редактировании релиза кнопками "Добавить артиста" и "Добавить контрибутора".</span>
      </IconItem>
    </div>
  );
};

const BeatsComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <IconItem icon={Icons.music}>
        <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Бесплатные биты и биты в аренде рискованны</span>
      </IconItem>
      
      <IconItem icon={Icons.warning}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Они могут использоваться другими артистами, вызывая юридические споры и потерю дохода.</span>
      </IconItem>
      
      <div className="ml-0">
        <IconItem icon={Icons.xCircle} className="mb-2">
          <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Проблемы:</span>
        </IconItem>
        <ul className={`ml-8 space-y-1 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400/80'}`}></span>
            Трек получает чужую обложку или название
          </li>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400/80'}`}></span>
            Юридические конфликты из-за отсутствия прав
          </li>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400/80'}`}></span>
            Потеря денег и времени на создание и продвижение трека
          </li>
        </ul>
      </div>
    
      <div className="ml-0">
        <IconItem icon={Icons.trendingUp} className="mb-2">
          <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Решения:</span>
        </IconItem>
        <ul className={`ml-8 space-y-1 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400/80'}`}></span>
            Создавайте собственные биты
          </li>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400/80'}`}></span>
            Покупайте эксклюзивные биты с полной передачей прав
          </li>
        </ul>
      </div>
      
      <IconItem icon={Icons.lightBulb}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Используйте бесплатные или арендованные биты только для тестовых записей, но не выкладывайте их публично.</span>
      </IconItem>
    </div>
  );
};

const ReportsComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <p className={isLight ? 'text-gray-700' : 'text-white/80'}>
        Отчеты публикуются в кабинеты каждый квартал в течение 30 дней после его окончания. 
        Выплаты производятся примерно через 10 дней после публикации отчетов.
      </p>
      
      <div>
        <p className={`font-medium mb-3 ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>График получения отчетов:</p>
        <div className="grid gap-2">
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q1</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(янв.-мар.)</span>
            {Icons.arrowRight(isLight)}
            <span>конец апреля</span>
          </div>
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q2</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(апр.-июнь)</span>
            {Icons.arrowRight(isLight)}
            <span>конец июля</span>
          </div>
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q3</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(июл.-сен.)</span>
            {Icons.arrowRight(isLight)}
            <span>конец октября</span>
          </div>
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q4</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(окт.-дек.)</span>
            {Icons.arrowRight(isLight)}
            <span>конец января</span>
          </div>
        </div>
      </div>
      
      <p className={`text-sm italic ${isLight ? 'text-gray-500' : 'text-white/60'}`}>
        Запаздывание связано с необходимостью получать отчёты от магазинов, которые предоставляются с задержкой в 29-30 дней.
      </p>
    </div>
  );
};

// Компонент для подробного описания загрузки релиза
const UploadReleaseComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Пошаговая инструкция:</p>
      
      <div className="space-y-3">
        <div className={`flex items-start gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-[#6050ba] text-white' : 'bg-[#6050ba]/50 text-white'}`}>1</span>
          <div>
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Войдите в личный кабинет</span>
            <p className="text-sm mt-0.5">Авторизуйтесь на сайте и перейдите в раздел «Релизы»</p>
          </div>
        </div>
        
        <div className={`flex items-start gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-[#6050ba] text-white' : 'bg-[#6050ba]/50 text-white'}`}>2</span>
          <div>
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Нажмите «Создать релиз»</span>
            <p className="text-sm mt-0.5">Выберите тип релиза: сингл, EP или альбом</p>
          </div>
        </div>
        
        <div className={`flex items-start gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-[#6050ba] text-white' : 'bg-[#6050ba]/50 text-white'}`}>3</span>
          <div>
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Заполните информацию о релизе</span>
            <p className="text-sm mt-0.5">Название, имя артиста, жанр, дата релиза</p>
          </div>
        </div>
        
        <div className={`flex items-start gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-[#6050ba] text-white' : 'bg-[#6050ba]/50 text-white'}`}>4</span>
          <div>
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Загрузите обложку</span>
            <p className="text-sm mt-0.5">Размер не менее 3000×3000 пикселей, формат JPG или PNG</p>
          </div>
        </div>
        
        <div className={`flex items-start gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-[#6050ba] text-white' : 'bg-[#6050ba]/50 text-white'}`}>5</span>
          <div>
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Добавьте треки</span>
            <p className="text-sm mt-0.5">Загрузите аудиофайлы в формате WAV, укажите названия, авторов текста и музыки</p>
          </div>
        </div>
        
        <div className={`flex items-start gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-[#6050ba] text-white' : 'bg-[#6050ba]/50 text-white'}`}>6</span>
          <div>
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Выберите платформы и страны</span>
            <p className="text-sm mt-0.5">Укажите на какие платформы и в каких странах публиковать</p>
          </div>
        </div>
        
        <div className={`flex items-start gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-[#6050ba] text-white' : 'bg-[#6050ba]/50 text-white'}`}>7</span>
          <div>
            <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Отправьте на модерацию</span>
            <p className="text-sm mt-0.5">Проверьте все данные и нажмите «Отправить». Модерация занимает 1-3 дня</p>
          </div>
        </div>
      </div>
      
      <div className={`mt-4 p-3 rounded-xl ${isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'}`}>
        <IconItem icon={Icons.lightBulb}>
          <span className={isLight ? 'text-amber-800' : 'text-amber-300'}>
            <span className="font-medium">Совет:</span> Отправляйте релиз за 2-3 недели до желаемой даты, чтобы было время на модерацию и попадание в плейлисты!
          </span>
        </IconItem>
      </div>
    </div>
  );
};

// Компонент для описания выплат
const PayoutsComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-2xl font-black ${isLight ? 'text-green-600' : 'text-green-400'}`}>80%</span>
          <span className={isLight ? 'text-green-700' : 'text-green-300'}>— ваша доля от всех доходов</span>
        </div>
        <p className={`text-sm ${isLight ? 'text-green-600' : 'text-green-400/80'}`}>
          Вы получаете 80% от всех роялти со стримингов и продаж
        </p>
      </div>
      
      <div>
        <p className={`font-medium mb-3 ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Как это работает:</p>
        <ul className={`space-y-2 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <li className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-[#6050ba]' : 'bg-[#9d8df1]'}`}></span>
            <span>Выплаты производятся <span className="font-medium">ежеквартально</span></span>
          </li>
          <li className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-[#6050ba]' : 'bg-[#9d8df1]'}`}></span>
            <span>Минимальная сумма для вывода — <span className="font-medium">1000 рублей</span></span>
          </li>
          <li className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-[#6050ba]' : 'bg-[#9d8df1]'}`}></span>
            <span>Доступен вывод на карты РФ и ЮMoney</span>
          </li>
          <li className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-[#6050ba]' : 'bg-[#9d8df1]'}`}></span>
            <span>Выплаты приходят в течение <span className="font-medium">3-5 рабочих дней</span> после запроса</span>
          </li>
        </ul>
      </div>
      
      <IconItem icon={Icons.trendingUp}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>
          Чем больше прослушиваний — тем больше ваш доход. Продвигайте свою музыку и зарабатывайте!
        </span>
      </IconItem>
    </div>
  );
};

// Компонент для требований к аудио
const AudioRequirementsComponent = ({ isLight }: { isLight: boolean }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className={`w-5 h-5 ${isLight ? 'text-violet-600' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Принимаемый формат:</p>
        </div>
        <div className={`p-4 rounded-xl ${isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'}`}>
          <div className="flex items-center gap-3">
            <svg className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <div className={`font-bold text-lg ${isLight ? 'text-green-700' : 'text-green-400'}`}>WAV</div>
              <div className={`text-sm ${isLight ? 'text-green-600' : 'text-green-400/70'}`}>Рекомендуемый формат для лучшего качества</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className={`w-5 h-5 ${isLight ? 'text-violet-600' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Технические параметры:</p>
        </div>
        <div className={`rounded-xl overflow-hidden border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
          <div className={`grid grid-cols-3 gap-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}>
            <div className={`p-3 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Частота</div>
              <div className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>44.1 / 48 kHz</div>
            </div>
            <div className={`p-3 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Битность</div>
              <div className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>16 / 24 bit</div>
            </div>
            <div className={`p-3 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Каналы</div>
              <div className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Стерео</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-3 rounded-xl ${isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'}`}>
        <div className="flex items-start gap-2">
          <svg className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className={`text-sm ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
            <span className="font-medium">Совет:</span> Не перекомпрессируйте трек — оставьте динамику для качественного звука на стриминге!
          </span>
        </div>
      </div>
    </div>
  );
};

// Компонент для требований к обложке
const CoverRequirementsComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className={`w-5 h-5 ${isLight ? 'text-violet-600' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Технические требования:</p>
        </div>
        <div className={`rounded-xl overflow-hidden border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
          <div className={`grid grid-cols-2 gap-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}>
            <div className={`p-2.5 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Размер</div>
              <div className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>3000×3000 px</div>
            </div>
            <div className={`p-2.5 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Соотношение</div>
              <div className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>1:1 (квадрат)</div>
            </div>
            <div className={`p-2.5 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Формат</div>
              <div className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>JPG / PNG</div>
            </div>
            <div className={`p-2.5 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Цвет</div>
              <div className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>RGB</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <svg className={`w-4 h-4 ${isLight ? 'text-green-600' : 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className={`font-medium text-sm ${isLight ? 'text-green-600' : 'text-green-400'}`}>Можно:</p>
          </div>
          <ul className={`space-y-1 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400'}`}></span>
              Имя артиста
            </li>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400'}`}></span>
              Название релиза
            </li>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400'}`}></span>
              Оригинальные фото
            </li>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400'}`}></span>
              Стоки с лицензией
            </li>
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <svg className={`w-4 h-4 ${isLight ? 'text-red-600' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className={`font-medium text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>Нельзя:</p>
          </div>
          <ul className={`space-y-1 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'}`}></span>
              URL и email
            </li>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'}`}></span>
              Логотипы соцсетей
            </li>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'}`}></span>
              QR-коды
            </li>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'}`}></span>
              Чужие фото без прав
            </li>
          </ul>
        </div>
      </div>

      <div className={`p-3 rounded-xl ${isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'}`}>
        <IconItem icon={Icons.lightBulb}>
          <span className={`text-sm ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
            <span className="font-medium">Совет:</span> Проверьте как обложка смотрится в маленьком размере 50×50 px — так она отображается в плейлистах!
          </span>
        </IconItem>
      </div>
    </div>
  );
};

// Компонент для ISRC и UPC
const IsrcUpcComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <div className={`p-4 rounded-xl ${isLight ? 'bg-violet-50 border border-violet-200' : 'bg-violet-500/10 border border-violet-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg font-black ${isLight ? 'text-violet-600' : 'text-violet-400'}`}>ISRC</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isLight ? 'bg-violet-200 text-violet-700' : 'bg-violet-500/20 text-violet-300'}`}>для треков</span>
          </div>
          <p className={`text-sm ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
            International Standard Recording Code — уникальный код для каждого трека
          </p>
          <div className={`mt-2 text-xs font-mono ${isLight ? 'text-violet-500' : 'text-violet-400/70'}`}>
            Пример: RU-AB1-24-00001
          </div>
        </div>

        <div className={`p-4 rounded-xl ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg font-black ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>UPC</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isLight ? 'bg-blue-200 text-blue-700' : 'bg-blue-500/20 text-blue-300'}`}>для релизов</span>
          </div>
          <p className={`text-sm ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
            Universal Product Code — штрих-код для всего релиза (12-13 цифр)
          </p>
        </div>
      </div>

      <div className={`p-3 rounded-xl ${isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'}`}>
        <div className="flex items-center gap-2">
          <svg className={`w-5 h-5 ${isLight ? 'text-green-600' : 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className={`font-medium ${isLight ? 'text-green-700' : 'text-green-300'}`}>Мы генерируем коды автоматически и бесплатно!</span>
        </div>
      </div>
    </div>
  );
};

// Компонент для аналитики
const AnalyticsComponent = ({ isLight }: { isLight: boolean }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className={`w-5 h-5 ${isLight ? 'text-violet-600' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Где смотреть статистику:</p>
        </div>
        <div className="space-y-2">
          <div className={`p-3 rounded-xl flex items-center gap-3 ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-violet-100' : 'bg-violet-500/20'}`}>
              <svg className={`w-4 h-4 ${isLight ? 'text-violet-600' : 'text-violet-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <div className={`font-medium text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>Личный кабинет</div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Общая статистика, доходы, география</div>
            </div>
          </div>
          <div className={`p-3 rounded-xl flex items-center gap-3 ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}>
              <svg className={`w-4 h-4 ${isLight ? 'text-green-600' : 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <div className={`font-medium text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>Spotify for Artists</div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Детальная аналитика Spotify</div>
            </div>
          </div>
          <div className={`p-3 rounded-xl flex items-center gap-3 ${isLight ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-red-100' : 'bg-red-500/20'}`}>
              <svg className={`w-4 h-4 ${isLight ? 'text-red-600' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <div className={`font-medium text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>Apple Music for Artists</div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Статистика Apple Music</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className={`w-5 h-5 ${isLight ? 'text-violet-600' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Важные метрики:</p>
        </div>
        <div className={`rounded-xl overflow-hidden border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
          <div className={`grid gap-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}>
            <div className={`p-3 flex items-center gap-3 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <svg className={`w-5 h-5 ${isLight ? 'text-violet-600' : 'text-violet-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Streams</span>
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}> — прослушивания</span>
              </div>
            </div>
            <div className={`p-3 flex items-center gap-3 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <svg className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <span className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Listeners</span>
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}> — уникальные слушатели</span>
              </div>
            </div>
            <div className={`p-3 flex items-center gap-3 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <svg className={`w-5 h-5 ${isLight ? 'text-green-600' : 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <div>
                <span className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Save Rate</span>
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}> — % сохранений в библиотеку</span>
              </div>
            </div>
            <div className={`p-3 flex items-center gap-3 ${isLight ? 'bg-white' : 'bg-[#1a1a1f]'}`}>
              <svg className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
              <div>
                <span className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Skip Rate</span>
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-white/50'}`}> — % пропусков трека</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'}`}>
        <div className="flex items-center gap-2 mb-1">
          <svg className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`font-medium text-sm ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>Когда обновляется:</span>
        </div>
        <ul className={`space-y-1 text-xs ${isLight ? 'text-blue-600' : 'text-blue-400/80'}`}>
          <li>• Личный кабинет — каждый квартал</li>
          <li>• Spotify for Artists — почти в реальном времени</li>
          <li>• Финансовые отчёты — каждый квартал</li>
        </ul>
      </div>
    </div>
  );
};

// Map of custom components - теперь принимают isLight
const customComponents: { [key: string]: React.FC<{ isLight: boolean }> } = {
  roles: RolesComponent,
  beats: BeatsComponent,
  reports: ReportsComponent,
  uploadRelease: UploadReleaseComponent,
  payouts: PayoutsComponent,
  audioRequirements: AudioRequirementsComponent,
  coverRequirements: CoverRequirementsComponent,
  isrcUpc: IsrcUpcComponent,
  analytics: AnalyticsComponent,
};

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supportWidget = useSupportWidget();
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsAuthenticated(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();
  }, []);

  const handleSupportClick = () => {
    if (!isAuthenticated) {
      // Перенаправляем на страницу авторизации
      router.push('/auth');
    } else {
      // Открываем виджет поддержки для авторизованных пользователей
      supportWidget.open();
    }
  };

  const filteredData = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleQuestion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 relative">
      {/* Тёмная тема - AnimatedBackground */}
      {!isLight && <AnimatedBackground />}
      
      {/* Голографический фон для светлой темы как на фиде */}
      {isLight && (
        <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0)' }}>
          {/* Основной мягкий градиент */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255,200,210,0.3) 0%, 
                  rgba(255,230,200,0.25) 20%, 
                  rgba(230,255,230,0.25) 40%, 
                  rgba(200,230,255,0.3) 60%, 
                  rgba(230,200,240,0.3) 80%, 
                  rgba(255,200,210,0.3) 100%
                )
              `,
              animation: 'holographic-bg-shift 20s ease-in-out infinite',
            }}
          />
          {/* Мягкие радужные переливы */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 15% 25%, rgba(255,180,210,0.35) 0%, transparent 50%),
                radial-gradient(ellipse at 85% 75%, rgba(180,210,255,0.35) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(210,180,240,0.3) 0%, transparent 60%)
              `,
              animation: 'holographic-bg-glow 15s ease-in-out infinite',
            }}
          />
          {/* Лёгкие блики */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(45deg, 
                  transparent 0%, 
                  rgba(255,255,255,0.2) 30%, 
                  transparent 50%, 
                  rgba(255,255,255,0.15) 70%, 
                  transparent 100%
                )
              `,
              backgroundSize: '300% 300%',
              animation: 'shimmer-bg 12s linear infinite',
            }}
          />
          {/* Плавающие мягкие пятна */}
          <div 
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              top: '-10%',
              left: '-10%',
              background: 'radial-gradient(circle, rgba(255,150,180,0.3) 0%, rgba(255,200,150,0.15) 50%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'float-bg-blob 25s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-[450px] h-[450px] rounded-full"
            style={{
              bottom: '-5%',
              right: '-10%',
              background: 'radial-gradient(circle, rgba(150,200,255,0.3) 0%, rgba(200,150,240,0.15) 50%, transparent 70%)',
              filter: 'blur(70px)',
              animation: 'float-bg-blob 30s ease-in-out infinite reverse',
            }}
          />
          {/* Звёздочки/блёстки */}
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${(i % 3) + 2}px`,
                height: `${(i % 3) + 2}px`,
                left: `${(i * 37) % 100}%`,
                top: `${(i * 23) % 100}%`,
                background: 'linear-gradient(135deg, rgba(180,140,220,0.8) 0%, rgba(140,180,220,0.8) 50%, rgba(200,160,200,0.8) 100%)',
                boxShadow: '0 0 6px rgba(180,140,220,0.5)',
                animation: `twinkle-light ${2 + (i % 3)}s ease-in-out infinite ${(i % 10) * 0.2}s`,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes holographic-bg-shift {
              0%, 100% { filter: hue-rotate(0deg) brightness(1); }
              50% { filter: hue-rotate(10deg) brightness(1.02); }
            }
            @keyframes holographic-bg-glow {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 0.9; }
            }
            @keyframes shimmer-bg {
              0% { background-position: 300% 300%; }
              100% { background-position: -300% -300%; }
            }
            @keyframes float-bg-blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(15px, -10px) scale(1.02); }
              66% { transform: translate(-10px, 10px) scale(0.98); }
            }
            @keyframes twinkle-light {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.3); }
            }
          `}</style>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-wide mb-3 sm:mb-4">
            <span className={`inline-block ${
              isLight 
                ? 'text-gray-800' 
                : 'bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient bg-gradient-to-r from-[#6050ba] via-[#c4b5fd] to-[#6050ba]'
            }`}>FAQ</span>
          </h1>
          <p className={`text-sm sm:text-base md:text-lg ${isLight ? 'text-gray-600' : 'text-white/70'}`}>Часто задаваемые вопросы</p>
        </div>

        <div className="mb-6 sm:mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам..."
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-2xl text-sm sm:text-base outline-none transition-all backdrop-blur-xl ${
                isLight 
                  ? 'bg-white/60 border-gray-300 text-gray-800 placeholder-gray-400 focus:border-gray-400'
                  : 'bg-[#0a0a0f]/80 border-[#6050ba]/30 text-white placeholder-white/40 focus:border-[#6050ba]/60'
              }`}
            />
            <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
              <svg className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {filteredData.map((category, catIndex) => (
            <div key={catIndex} className="space-y-3 sm:space-y-4">
              <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>
                <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#6050ba]'}`}></span>
                {category.category}
              </h2>
              
              <div className="space-y-2 sm:space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  
                  return (
                    <div 
                      key={key}
                      className={`rounded-xl sm:rounded-2xl border-2 transition-all duration-300 overflow-hidden backdrop-blur-xl ${
                        isLight
                          ? (isOpen 
                              ? 'bg-white/70 border-gray-300 shadow-lg' 
                              : 'bg-white/50 border-gray-200 hover:border-gray-300 shadow-md')
                          : (isOpen 
                              ? 'bg-[#0a0a0f]/90 border-[#6050ba]/50' 
                              : 'bg-[#0a0a0f]/70 border-[#6050ba]/20 hover:border-[#6050ba]/40')
                      }`}
                    >
                      <button
                        onClick={() => toggleQuestion(key)}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left"
                      >
                        <span className={`font-bold text-sm sm:text-base pr-3 sm:pr-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>{item.q}</span>
                        <span className={`text-xl sm:text-2xl transition-transform duration-300 flex-shrink-0 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px]' : 'max-h-0'}`}>
                        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
                          {item.component && customComponents[item.component] ? (
                            React.createElement(customComponents[item.component], { isLight })
                          ) : (
                            <p className={`text-xs sm:text-sm md:text-base leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/80'}`}>
                              {item.a}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-12 sm:mt-16 text-center p-6 sm:p-8 md:p-12 border-2 rounded-2xl sm:rounded-3xl backdrop-blur-xl ${
          isLight 
            ? 'bg-white/60 border-gray-200 shadow-xl'
            : 'bg-gradient-to-br from-[#0a0a0f]/90 via-[#6050ba]/10 to-[#0a0a0f]/90 border-[#6050ba]/40'
        }`}>
          <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>Не нашли ответ?</h3>
          <p className={`text-sm sm:text-base md:text-lg mb-6 sm:mb-8 ${isLight ? 'text-gray-600' : 'text-white/80'}`}>
            {isAuthenticated 
              ? 'Создайте тикет в поддержку — мы ответим в течение 24 часов'
              : 'Войдите в аккаунт, чтобы написать в поддержку'}
          </p>
          <button 
            onClick={handleSupportClick}
            className={`inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-xl transition-all hover:scale-105 hover:shadow-2xl ${
              isLight 
                ? 'bg-gray-800 !text-white hover:bg-gray-700 hover:shadow-gray-400/40'
                : 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white hover:shadow-[#6050ba]/40'
            }`}
          >
            {isAuthenticated ? 'Написать в поддержку' : 'Войти в аккаунт'}
          </button>
        </div>
      </div>
    </main>
  );
}
