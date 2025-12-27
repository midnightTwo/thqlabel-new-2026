"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useSupportWidget } from '@/lib/useSupportWidget';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const FAQ_DATA = [
  {
    category: 'Дистрибуция',
    questions: [
      {
        q: 'Как загрузить релиз на платформы?',
        a: 'Войдите в личный кабинет, перейдите в раздел "Релизы" и нажмите "Загрузить демо". Заполните все поля, прикрепите аудиофайлы и обложку. После модерации ваш релиз будет опубликован на всех платформах.'
      },
      {
        q: 'Сколько времени занимает публикация?',
        a: 'Обычно релиз появляется на платформах в течение 2-5 рабочих дней после одобрения модерацией. Spotify и Apple Music могут требовать до 7 дней.'
      },
      {
        q: 'На какие платформы вы дистрибутируете?',
        a: 'Мы дистрибутируем на все основные платформы: Spotify, Apple Music, YouTube Music, Яндекс Музыка, VK Music, Deezer, Tidal, Amazon Music и более 150 других.'
      },
      {
        q: 'Могу ли я выбрать дату релиза?',
        a: 'Да! При загрузке демо укажите желаемую дату релиза. Рекомендуем указывать дату минимум за 2 недели до публикации.'
      },
    ]
  },
  {
    category: 'Финансы',
    questions: [
      {
        q: 'Как работают выплаты?',
        a: 'Выплаты производятся ежеквартально. Вы получаете 85% от всех доходов. Минимальная сумма для вывода — 1000 рублей.'
      },
      {
        q: 'Когда я получу отчёты с продаж?',
        a: `Отчеты публикуются в кабинеты каждый квартал в течение 30 дней после его окончания. Выплаты производятся примерно через 10 дней после публикации отчетов. График получения отчетов:
• Q1 (янв.-мар.) → конец апреля
• Q2 (апр.-июнь) → конец июля
• Q3 (июл.-сен.) → конец октября
• Q4 (окт.-дек.) → конец января

Запаздывание связано с необходимостью получать отчёты от магазинов, которые предоставляются с задержкой в 29-30 дней.`
      },
      {
        q: 'Какие способы вывода доступны?',
        a: 'Вывод доступен на банковские карты РФ (Сбербанк, Тинькофф, Альфа и др.), а также на ЮMoney и QIWI.'
      },
    ]
  },
  {
    category: 'Аккаунт',
    questions: [
      {
        q: 'Как изменить никнейм артиста?',
        a: 'Перейдите в раздел "Настройки" в личном кабинете. Там вы можете изменить никнейм, аватар и другие данные профиля.'
      },
      {
        q: 'Забыл пароль, что делать?',
        a: 'На странице входа нажмите "Забыли пароль?" и введите email. Вам придёт ссылка для восстановления.'
      },
      {
        q: 'Как связаться с поддержкой?',
        a: 'Нажмите на кнопку "Написать в поддержку" внизу страницы или используйте виджет поддержки в правом нижнем углу. Мы отвечаем в течение 24 часов.'
      },
    ]
  },
  {
    category: 'Роли и Контрибуторы',
    questions: [
      {
        q: 'Роли артистов и контрибуторов',
        a: `Артисты и контрибуторы указывают роли, требуемые музыкальными площадками, особенно Spotify и Apple Music/iTunes.

🎤 Основной артист — тот, чьё имя указывается как исполнителя, и чей профиль пополняется новыми релизами.

👨‍🎤 Контрибутор — участник процесса создания, не отображаемый как исполнитель.

🔍 Обязательно указывать реальные имена авторов текста, композиторов и аранжировщиков, остальные могут использовать псевдонимы.

✏️ Добавляются в соответствующем разделе при редактировании релиза кнопками "Добавить артиста" и "Добавить контрибутора".`
      },
    ]
  },
  {
    category: 'Биты и Права',
    questions: [
      {
        q: 'Почему не стоит использовать фришные биты с ютуба',
        a: `🎵 Бесплатные биты и биты в аренде рискованны:

⚠️ Они могут использоваться другими артистами, вызывая юридические споры и потерю дохода.

❌ Проблемы:
• Трек получает чужую обложку или название
• Юридические конфликты из-за отсутствия прав
• Потеря денег и времени на создание и продвижение трека

📈 Решения:
• Создавайте собственные биты
• Покупайте эксклюзивные биты с полной передачей прав

💡 Используйте бесплатные или арендованные биты только для тестовых записей, но не выкладывайте их публично.`
      },
    ]
  },
  {
    category: 'Сотрудничество',
    questions: [
      {
        q: 'Кто может присоединиться к thqlabel?',
        a: 'Мы работаем со всеми артистами независимо от уровня. Зарегистрируйтесь, загрузите демо — и мы рассмотрим вашу заявку.'
      },
      {
        q: 'Есть ли контракт?',
        a: 'Да, мы заключаем неэксклюзивный лицензионный договор. Вы сохраняете все права на музыку и можете выйти из сотрудничества в любой момент.'
      },
      {
        q: 'Что такое Exclusive статус?',
        a: 'Exclusive артисты получают приоритетную поддержку, продвижение в соцсетях лейбла и повышенный процент выплат (до 90%).'
      },
    ]
  },
];

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
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#9d8df1]">FAQ</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-400">Часто задаваемые вопросы</p>
        </div>

        <div className="mb-6 sm:mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-sm sm:text-base text-white placeholder-zinc-500 outline-none focus:border-[#6050ba]/50 transition-all"
            />
            <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {filteredData.map((category, catIndex) => (
            <div key={catIndex} className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#9d8df1] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6050ba]"></span>
                {category.category}
              </h2>
              
              <div className="space-y-2 sm:space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  
                  return (
                    <div 
                      key={key}
                      className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isOpen 
                          ? 'bg-[#6050ba]/10 border-[#6050ba]/30' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <button
                        onClick={() => toggleQuestion(key)}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left"
                      >
                        <span className="font-bold text-sm sm:text-base text-white pr-3 sm:pr-4">{item.q}</span>
                        <span className={`text-xl sm:text-2xl text-[#9d8df1] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px]' : 'max-h-0'}`}>
                        <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed whitespace-pre-line">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center p-6 sm:p-8 md:p-12 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent border-2 border-purple-500/40 rounded-2xl sm:rounded-3xl backdrop-blur-sm">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white">Не нашли ответ?</h3>
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-6 sm:mb-8">
            {isAuthenticated 
              ? 'Создайте тикет в поддержку — мы ответим в течение 24 часов'
              : 'Войдите в аккаунт, чтобы написать в поддержку'}
          </p>
          <button 
            onClick={handleSupportClick}
            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 rounded-xl sm:rounded-2xl font-bold text-white text-sm sm:text-base md:text-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/60"
          >
            {isAuthenticated ? 'Написать в поддержку' : 'Войти в аккаунт'}
          </button>
        </div>
      </div>
    </main>
  );
}
