"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBackground from '@/components/ui/PageBackground';
import { useSupportWidget } from '@/lib/hooks/useSupportWidget';
import { supabase } from '@/lib/supabase/client';

/**
 * FAQPage - Refactored with PageBackground and semantic classes
 * Removed getIcons helper and inline theme conditionals
 * Icons now use semantic CSS classes that auto-adapt to theme
 */

// Reusable Icon component that uses semantic classes
const Icon = ({ children, variant = 'accent' }: { children: React.ReactNode; variant?: 'accent' | 'warning' | 'error' | 'success' | 'info' }) => {
  const colorClasses = {
    accent: 'text-accent',
    warning: 'text-warning',
    error: 'text-error',
    success: 'text-success',
    info: 'text-foreground-muted'
  };
  return <span className={`${colorClasses[variant]} flex-shrink-0`}>{children}</span>;
};

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
        a: 'Войдите в личный кабинет, перейдите в раздел "Релизы" и нажмите "Загрузить демо". Заполните все поля, прикрепите аудиофайлы и обложку. После модерации ваш релиз будет опубликован на всех платформах.',
        component: null
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
        a: 'Да! При загрузке демо укажите желаемую дату релиза. Рекомендуем указывать дату минимум за 2 недели до публикации.',
        component: null
      },
    ]
  },
  {
    category: 'Финансы',
    questions: [
      {
        q: 'Как работают выплаты?',
        a: 'Выплаты производятся ежеквартально. Вы получаете 85% от всех доходов. Минимальная сумма для вывода — 1000 рублей.',
        component: null
      },
      {
        q: 'Когда я получу отчёты с продаж?',
        a: '',
        component: 'reports'
      },
      {
        q: 'Какие способы вывода доступны?',
        a: 'Вывод доступен на банковские карты РФ (Сбербанк, Тинькофф, Альфа и др.), а также на ЮMoney и QIWI.',
        component: null
      },
    ]
  },
  {
    category: 'Аккаунт',
    questions: [
      {
        q: 'Как изменить никнейм артиста?',
        a: 'Перейдите в раздел "Настройки" в личном кабинете. Там вы можете изменить никнейм, аватар и другие данные профиля.',
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
        q: 'Кто может присоединиться к THQ Label?',
        a: 'Мы работаем со всеми артистами независимо от уровня. Зарегистрируйтесь, загрузите демо — и мы рассмотрим вашу заявку.',
        component: null
      },
      {
        q: 'Есть ли контракт?',
        a: 'Да, мы заключаем неэксклюзивный лицензионный договор. Вы сохраняете все права на музыку и можете выйти из сотрудничества в любой момент.',
        component: null
      },
      {
        q: 'Что такое Exclusive статус?',
        a: 'Exclusive артисты получают приоритетную поддержку, продвижение в соцсетях лейбла и повышенный процент выплат (до 90%).',
        component: null
      },
    ]
  },
];

// Custom rendered components for complex FAQ answers
const RolesComponent = () => {
  return (
    <div className="space-y-4">
      <p className="text-body">Артисты и контрибуторы указывают роли, требуемые музыкальными площадками, особенно Spotify и Apple Music/iTunes.</p>
      
      <IconItem icon={
        <Icon>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </Icon>
      }>
        <span className="font-medium text-accent-soft">Основной артист</span>
        <span className="text-body"> — тот, чьё имя указывается как исполнителя, и чей профиль пополняется новыми релизами.</span>
      </IconItem>
      
      <IconItem icon={
        <Icon>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Icon>
      }>
        <span className="font-medium text-accent-soft">Контрибутор</span>
        <span className="text-body"> — участник процесса создания, не отображаемый как исполнитель.</span>
      </IconItem>
      
      <IconItem icon={
        <Icon>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Icon>
      }>
        <span className="text-body">Обязательно указывать реальные имена авторов текста, композиторов и аранжировщиков, остальные могут использовать псевдонимы.</span>
      </IconItem>
      
      <IconItem icon={
        <Icon>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Icon>
      }>
        <span className="text-body">Добавляются в соответствующем разделе при редактировании релиза кнопками "Добавить артиста" и "Добавить контрибутора".</span>
      </IconItem>
    </div>
  );
};

const BeatsComponent = () => {
  return (
    <div className="space-y-4">
      <IconItem icon={
        <Icon>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </Icon>
      }>
        <span className="font-medium text-accent-soft">Бесплатные биты и биты в аренде рискованны</span>
      </IconItem>
      
      <IconItem icon={
        <Icon variant="warning">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </Icon>
      }>
        <span className="text-body">Они могут использоваться другими артистами, вызывая юридические споры и потерю дохода.</span>
      </IconItem>
      
      <div className="ml-0">
        <IconItem icon={
          <Icon variant="error">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Icon>
        } className="mb-2">
          <span className="font-medium text-accent-soft">Проблемы:</span>
        </IconItem>
        <ul className="ml-8 space-y-1 text-body">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Трек получает чужую обложку или название
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Юридические конфликты из-за отсутствия прав
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Потеря денег и времени на создание и продвижение трека
          </li>
        </ul>
      </div>
    
      <div className="ml-0">
        <IconItem icon={
          <Icon variant="success">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </Icon>
        } className="mb-2">
          <span className="font-medium text-accent-soft">Решения:</span>
        </IconItem>
        <ul className="ml-8 space-y-1 text-body">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            Создавайте собственные биты
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            Покупайте эксклюзивные биты с полной передачей прав
          </li>
        </ul>
      </div>
      
      <IconItem icon={
        <Icon variant="warning">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </Icon>
      }>
        <span className="text-body">Используйте бесплатные или арендованные биты только для тестовых записей, но не выкладывайте их публично.</span>
      </IconItem>
    </div>
  );
};

const ReportsComponent = () => {
  return (
    <div className="space-y-4">
      <p className="text-body">
        Отчеты публикуются в кабинеты каждый квартал в течение 30 дней после его окончания. 
        Выплаты производятся примерно через 10 дней после публикации отчетов.
      </p>
      
      <div>
        <p className="font-medium mb-3 text-accent-soft">График получения отчетов:</p>
        <div className="grid gap-2">
          <div className="flex items-center gap-3 text-body">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span className="text-accent-soft font-medium">Q1</span>
            <span className="text-foreground-muted">(янв.-мар.)</span>
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>конец апреля</span>
          </div>
          <div className="flex items-center gap-3 text-body">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span className="text-accent-soft font-medium">Q2</span>
            <span className="text-foreground-muted">(апр.-июнь)</span>
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>конец июля</span>
          </div>
          <div className="flex items-center gap-3 text-body">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span className="text-accent-soft font-medium">Q3</span>
            <span className="text-foreground-muted">(июл.-сен.)</span>
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>конец октября</span>
          </div>
          <div className="flex items-center gap-3 text-body">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span className="text-accent-soft font-medium">Q4</span>
            <span className="text-foreground-muted">(окт.-дек.)</span>
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>конец января</span>
          </div>
        </div>
      </div>
      
      <p className="text-sm italic text-foreground-muted">
        Запаздывание связано с необходимостью получать отчёты от магазинов, которые предоставляются с задержкой в 29-30 дней.
      </p>
    </div>
  );
};

// Map of custom components - no longer need isLight prop
const customComponents: { [key: string]: React.FC } = {
  roles: RolesComponent,
  beats: BeatsComponent,
  reports: ReportsComponent,
};

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supportWidget = useSupportWidget();
  const router = useRouter();

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
      router.push('/auth');
    } else {
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
      {/* Unified PageBackground component */}
      <PageBackground variant="full" shapeCount={6} particleCount={30} />
      
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-wide mb-3 sm:mb-4">
            <span className="text-heading-gradient">FAQ</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-body">Часто задаваемые вопросы</p>
        </div>

        <div className="mb-6 sm:mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам..."
              className="input-glass w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base"
            />
            <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {filteredData.map((category, catIndex) => (
            <div key={catIndex} className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-accent-soft">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                {category.category}
              </h2>
              
              <div className="space-y-2 sm:space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  
                  return (
                    <div 
                      key={key}
                      className={`glass-panel transition-all duration-300 overflow-hidden ${
                        isOpen ? 'shadow-lg border-accent/50' : 'border-border hover:border-accent/40'
                      }`}
                    >
                      <button
                        onClick={() => toggleQuestion(key)}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left"
                      >
                        <span className="font-bold text-sm sm:text-base pr-3 sm:pr-4 text-heading">{item.q}</span>
                        <span className={`text-xl sm:text-2xl transition-transform duration-300 flex-shrink-0 text-accent ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px]' : 'max-h-0'}`}>
                        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
                          {item.component && customComponents[item.component] ? (
                            React.createElement(customComponents[item.component])
                          ) : (
                            <p className="text-xs sm:text-sm md:text-base leading-relaxed text-body">
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

        <div className="mt-12 sm:mt-16 text-center glass-panel p-6 sm:p-8 md:p-12 border-accent/40">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-heading">Не нашли ответ?</h3>
          <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-body">
            {isAuthenticated 
              ? 'Создайте тикет в поддержку — мы ответим в течение 24 часов'
              : 'Войдите в аккаунт, чтобы написать в поддержку'}
          </p>
          <button 
            onClick={handleSupportClick}
            className="btn-primary inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-xl"
          >
            {isAuthenticated ? 'Написать в поддержку' : 'Войти в аккаунт'}
          </button>
        </div>
      </div>
    </main>
  );
}
