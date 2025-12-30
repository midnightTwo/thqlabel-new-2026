"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Релизы thq label
const RELEASES = [
  { id: 1, title: 'Neon Dreams', artist: 'Night Drive', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fd4892b6202a4051f807a8a847f44adc0.1000x1000x1.png' },
  { id: 2, title: 'Apex', artist: 'The Summit', cover: 'https://t2.genius.com/unsafe/600x600/https%3A%2F%2Fimages.genius.com%2F9fa9951f735a169c17e47baf71ab45c7.1000x1000x1.png' },
  { id: 3, title: 'Luna', artist: 'Stardust', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fa4b2333f9c0768cf4f07d1252caff125.1000x1000x1.png' },
  { id: 4, title: 'девчачий рок-альбом', artist: 'тенденция', cover: 'https://images.genius.com/2fa8d85da644fad7afc1ba3d40d0d513.1000x1000x1.png' },
  { id: 5, title: 'tired of you / what pain is', artist: 'breakfall', cover: 'https://cdn-images.dzcdn.net/images/cover/7101d738b828553e74b9f0035a6dfa1a/500x500-000000-80-0-0.jpg' },
  { id: 6, title: 'LABEL', artist: 'YUUKKII', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2F4dbc0ecc8a3f9924cc950ec1ae1390c4.600x600x1.webp' },
  { id: 7, title: 'кейон', artist: 'ева киллер', cover: 'https://m.media-amazon.com/images/I/51knFhnMP0L._UX716_FMwebp_QL85_.jpg' },
  { id: 8, title: 'Холодно', artist: 'qqdie', cover: 'https://images.genius.com/ece70e671b3422967c2012217763c557.807x807x1.jpg' },
];

// Услуги лейбла
const SERVICES = [
  'Дистрибуция на все платформы',
  'Маркетинг и PR',
  'Синхронизация с соцсетями',
  'Защита авторских прав',
  'Аналитика и отчетность',
  'Продвижение в плейлистах',
  'Создание контента',
  'Консультации по развитию карьеры',
];

// Оптимизированный анимированный счетчик
const AnimatedCounter = memo(({ end, duration = 2500, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const endRef = useRef(end);
  const durationRef = useRef(duration);

  useEffect(() => {
    endRef.current = end;
    durationRef.current = duration;
  });

  useEffect(() => {
    startTimeRef.current = null;
    countRef.current = 0;
    setCount(0);
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationRef.current, 1);
      
      // Плавный easeOutQuart
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(endRef.current * easeOut);
      
      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endRef.current);
      }
    };
    
    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, 200);
    
    return () => {
      clearTimeout(timer);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Форматирование числа с разделителями
  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }, []);

  return <span className="tabular-nums">{formatNumber(count)}{suffix}</span>;
});

AnimatedCounter.displayName = 'AnimatedCounter';

// Функция для очистки Markdown-разметки из текста
const cleanMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '') // Удаляем заголовки (# ## ### и т.д.)
    .replace(/\*\*(.+?)\*\*/g, '$1') // Удаляем жирный текст
    .replace(/\*(.+?)\*/g, '$1') // Удаляем курсив
    .replace(/`(.+?)`/g, '$1') // Удаляем код
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Заменяем ссылки на текст
    .replace(/^>\s+/gm, '') // Удаляем цитаты
    .replace(/^-\s+/gm, '') // Удаляем маркеры списка
    .replace(/\n+/g, ' ') // Заменяем переносы строк на пробелы
    .trim();
};

// Функция для детерминированных псевдослучайных значений
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Оптимизированные летающие 3D фигуры (уменьшено количество)
const FloatingShapes = memo(() => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Детерминированные значения для SSR
  const shapes = useMemo(() => 
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: seededRandom(i + 1) * 100,
      y: seededRandom(i + 100) * 100,
      size: 25 + seededRandom(i + 200) * 50,
      duration: 18 + seededRandom(i + 300) * 20,
      delay: seededRandom(i + 400) * -15,
      type: seededRandom(i + 500) > 0.5 ? 'circle' : 'square',
    })),
  []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'strict' }}>
      {shapes.map(shape => (
        <div
          key={shape.id}
          className={`absolute ${shape.type === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            border: '1px solid rgba(96, 80, 186, 0.15)',
            background: 'rgba(96, 80, 186, 0.02)',
            animation: `float-shape ${shape.duration}s ease-in-out infinite`,
            animationDelay: `${shape.delay}s`,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-shape {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(25px, -30px, 0); }
          50% { transform: translate3d(-15px, 25px, 0); }
          75% { transform: translate3d(30px, 15px, 0); }
        }
      `}</style>
    </div>
  );
});

FloatingShapes.displayName = 'FloatingShapes';

// Оптимизированные летающие частицы (уменьшено количество с 40 до 20)
const FloatingParticles = memo(() => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: seededRandom(i + 600) * 100,
      y: seededRandom(i + 700) * 100,
      size: 2 + seededRandom(i + 800) * 3,
      duration: 25 + seededRandom(i + 900) * 25,
      delay: seededRandom(i + 1000) * -20,
      opacity: 0.3 + seededRandom(i + 1100) * 0.4,
    })),
  []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'strict' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#9d8df1]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: '0 0 8px rgba(157, 141, 241, 0.5)',
            animation: `particle-fly ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particle-fly {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.3; }
          25% { transform: translate3d(45px, -60px, 0); opacity: 0.7; }
          50% { transform: translate3d(-30px, 45px, 0); opacity: 0.4; }
          75% { transform: translate3d(60px, 30px, 0); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// Оптимизированная 3D летающая карточка релиза
const FloatingReleaseCard = memo(({ release, index, isMobile }: { release: any; index: number; isMobile: boolean }) => {
  // Мемоизированные позиции
  const positions = useMemo(() => {
    const positionsDesktop = [
      { x: '6%', y: '15%', rotate: -10 },
      { x: '86%', y: '15%', rotate: 10 },
      { x: '6%', y: '35%', rotate: 8 },
      { x: '86%', y: '35%', rotate: -8 },
      { x: '6%', y: '55%', rotate: -12 },
      { x: '86%', y: '55%', rotate: 12 },
      { x: '6%', y: '75%', rotate: 10 },
      { x: '86%', y: '75%', rotate: -10 },
    ];
    
    const positionsMobile = [
      { x: '2%', y: '20%', rotate: -8 },
      { x: '75%', y: '28%', rotate: 6 },
      { x: '3%', y: '38%', rotate: -5 },
      { x: '78%', y: '50%', rotate: 7 },
      { x: '4%', y: '58%', rotate: 8 },
      { x: '76%', y: '65%', rotate: -7 },
      { x: '1%', y: '75%', rotate: 5 },
      { x: '77%', y: '82%', rotate: -6 },
    ];
    
    return isMobile ? positionsMobile : positionsDesktop;
  }, [isMobile]);
  
  const pos = positions[index % positions.length];
  
  // Статический transform без mousemove для оптимизации
  const transformStyle = useMemo(() => ({
    left: pos.x,
    top: pos.y,
    transform: `perspective(1000px) rotateY(${pos.rotate}deg) translateZ(0)`,
    zIndex: isMobile ? -1 : 10,
  }), [pos, isMobile]);

  // Показываем все 8 релизов на мобилке
  if (isMobile && index >= 8) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={transformStyle}
    >
      <div 
        className="relative w-20 h-28 sm:w-24 sm:h-32 lg:w-32 lg:h-40 xl:w-36 xl:h-44 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-md group"
        style={{
          animation: `float-card ${6 + index}s ease-in-out infinite`,
          animationDelay: `${index * 0.3}s`,
          background: isMobile 
            ? 'rgba(0, 0, 0, 0.15)'
            : 'rgba(96, 80, 186, 0.08)',
          border: '1px solid rgba(157, 141, 241, 0.25)',
          boxShadow: isMobile
            ? '0 10px 25px -10px rgba(0, 0, 0, 0.15)'
            : '0 15px 50px -15px rgba(96, 80, 186, 0.4)',
          opacity: isMobile ? 0.25 : 1,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {/* Картинка обложки с оверлеем */}
        <div className="relative w-full h-16 sm:h-20 lg:h-28 xl:h-32 overflow-hidden">
          <img 
            src={release.cover} 
            alt={release.title}
            className="w-full h-full object-cover opacity-90"
            loading="lazy"
            decoding="async"
          />
          {/* Градиентный оверлей */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#6050ba]/20 via-transparent to-black/80" />
        </div>

        {/* Инфо блок */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 lg:p-3 border-t border-[#6050ba]/30"
          style={{
            background: isMobile ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <p className="text-[8px] sm:text-[9px] lg:text-[11px] font-black text-white truncate uppercase tracking-wide">{release.title}</p>
          <p className="text-[7px] sm:text-[8px] lg:text-[10px] text-[#9d8df1] font-bold mt-0.5">{release.artist}</p>
          <div className="mt-1 sm:mt-1.5 lg:mt-2 h-0.5 w-4 sm:w-6 lg:w-8 bg-gradient-to-r from-[#9d8df1] to-transparent rounded-full" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float-card {
          0% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(5px, -8px, 0); }
          50% { transform: translate3d(0, -15px, 0); }
          75% { transform: translate3d(-5px, -8px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </div>
  );
});

FloatingReleaseCard.displayName = 'FloatingReleaseCard';

// Модальное окно для услуг
const ServicesModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl p-8 border border-[#9d8df1]/30 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all hover:scale-110 border border-white/10"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Заголовок */}
        <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">
          Услуги <span className="text-[#9d8df1]">Лейбла</span>
        </h3>
        <p className="text-sm text-white/60 mb-8">Полный спектр услуг для артистов</p>

        {/* Список услуг */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((service, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#9d8df1]/30 transition-all group"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                ✓
              </div>
              <p className="text-white text-sm font-semibold">{service}</p>
            </div>
          ))}
        </div>

        {/* Кнопка закрыть внизу */}
        <button
          onClick={onClose}
          className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-[#6050ba] to-[#9d8df1] text-white font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-lg hover:shadow-[#6050ba]/50"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
});

ServicesModal.displayName = 'ServicesModal';

export default function FeedPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const rafRef = useRef<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Оптимизированная проверка размера экрана
  const checkMobile = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setIsMobile(window.innerWidth < 1024);
      rafRef.current = null;
    });
  }, []);

  useEffect(() => {
    // Принудительная прокрутка в самый верх
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    
    // Таймер для скрытия intro и показа контента
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      setMounted(true);
    }, 1500);
    
    // Проверяем размер экрана
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    
    // Проверяем авторизацию
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();

    // Загружаем новости
    const loadNews = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3);
        if (data && !error) {
          setNews(data);
        }
      } catch (e) {
        console.error('Ошибка загрузки новостей:', e);
      }
    };
    loadNews();
    
    return () => {
      clearTimeout(introTimer);
      window.removeEventListener('resize', checkMobile);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [checkMobile]);

  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Intro анимация с большим логотипом */}
      {showIntro && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, #08080a 0%, #0d0d1a 50%, #08080a 100%)',
            animation: 'fade-out 0.5s ease-out 1s forwards',
          }}
        >
          <img 
            src="/logo.png" 
            alt="thqlabel" 
            className="w-[80vw] max-w-[1200px] h-auto"
            style={{
              filter: 'drop-shadow(0 0 60px rgba(96,80,186,0.9))',
              animation: 'logo-intro 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
      )}
      
      {/* Модальное окно услуг */}
      <ServicesModal isOpen={servicesModalOpen} onClose={() => setServicesModalOpen(false)} />

      {/* Летающие 3D фигуры и частицы */}
      <FloatingShapes />
      <FloatingParticles />
      
      {/* Усиленный градиентный фон */}
      <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#6050ba]/12 rounded-full" 
          style={{ filter: 'blur(150px)', animation: 'gradient-pulse 8s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9d8df1]/12 rounded-full" 
          style={{ filter: 'blur(120px)', animation: 'gradient-pulse 8s ease-in-out infinite 2s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#c4b5fd]/08 rounded-full" 
          style={{ filter: 'blur(180px)', animation: 'gradient-pulse 10s ease-in-out infinite 1s' }}
        />
        <style jsx>{`
          @keyframes gradient-pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>

      {/* Основной контент */}
      <div className="relative z-20 w-full h-screen px-4 md:px-6 lg:px-8">
        
        {/* Grid layout - фиксированная высота экрана */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full py-4">
          
          {/* Левая колонка - Текст, кнопки и релизы (компактно) */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full">
            <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              {/* Текст и кнопки с стеклянным эффектом */}
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 lg:p-6 border border-white/10 shadow-2xl">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-white via-[#c4b5fd] to-white bg-clip-text text-transparent mb-3 lg:mb-4 leading-tight">
                  Продвигаем вашу музыку на новый уровень
                </h1>
                <p className="text-xs md:text-sm lg:text-base text-white/90 mb-4 lg:mb-5 leading-relaxed">
                  Полный спектр услуг для артистов: дистрибуция, маркетинг, PR и синхронизация.
                </p>

                {/* Кнопки в одну строку */}
                <div className="flex gap-2 lg:gap-3">
                  <Link 
                    href="/cabinet"
                    className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 hover:shadow-2xl text-white shadow-lg text-center"
                    style={{
                      background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)',
                      boxShadow: '0 10px 40px rgba(96, 80, 186, 0.4)',
                    }}
                  >
                    Кабинет
                  </Link>
                  
                  <button 
                    onClick={() => setServicesModalOpen(true)}
                    className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 backdrop-blur-md bg-white/10 border border-white/30 rounded-xl text-xs lg:text-sm font-bold uppercase tracking-wider hover:bg-white/20 transition-all text-white hover:scale-105 shadow-lg"
                  >
                    Услуги
                  </button>
                </div>
              </div>
            </div>

            {/* Релизы - подняты выше */}
            <div className={`mb-8 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-3 lg:p-4 border border-white/10 shadow-xl">
                <h2 className="text-xs font-black bg-gradient-to-r from-[#9d8df1] to-[#c4b5fd] bg-clip-text text-transparent uppercase mb-3">
                  Популярные Релизы
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {RELEASES.slice(0, 6).map((release) => (
                    <div 
                      key={release.id}
                      className="group rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl"
                      style={{
                        background: 'rgba(96, 80, 186, 0.15)',
                        border: '1px solid rgba(157, 141, 241, 0.3)',
                        boxShadow: '0 4px 15px rgba(96, 80, 186, 0.2)',
                      }}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img 
                          src={release.cover} 
                          alt={release.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-2 bg-gradient-to-b from-black/60 to-black/80">
                        <p className="text-[10px] font-bold text-white truncate leading-tight">{release.title}</p>
                        <p className="text-[9px] text-[#c4b5fd] font-semibold truncate leading-tight">{release.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Центральная колонка - Логотип и информация */}
          <div className="lg:col-span-6 flex flex-col justify-center items-center">
            {/* Логотип чуть выше центра */}
            <div className={`relative mb-6 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div 
                className="absolute inset-0 blur-[120px] opacity-70 bg-gradient-to-br from-[#6050ba] via-[#9d8df1] to-[#c4b5fd]" 
                style={{ animation: 'logo-glow 4s ease-in-out infinite' }} 
              />
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className="relative z-10 w-full max-w-[700px] lg:max-w-[900px] h-auto object-contain"
                style={{ 
                  filter: 'drop-shadow(0 0 60px rgba(96,80,186,0.9))',
                  animation: 'logo-float 6s ease-in-out infinite, logo-pulse 3s ease-in-out infinite',
                }}
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Информация под логотипом - по центру снизу */}
            <div className={`text-center w-full transition-all duration-1000 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-white text-sm md:text-base mb-5 leading-relaxed max-w-2xl mx-auto">
                Дистрибуция музыки на все платформы мира.<br/>
                Мы помогаем артистам стать услышанными.
              </p>
              
              {/* Статистика */}
              <div className="flex flex-wrap justify-center gap-8 md:gap-10 lg:gap-12 mb-4">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white">
                    <AnimatedCounter end={150} suffix="+" />
                  </div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Релизов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white">
                    <AnimatedCounter end={50} suffix="+" />
                  </div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Артистов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white">
                    <AnimatedCounter end={1000000} suffix="+" />
                  </div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Прослушиваний</div>
                </div>
              </div>

              {/* Кнопка "В лейбл ждёт тебя" */}
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 text-[10px] text-white uppercase tracking-wider font-black px-4 py-2 border-2 border-[#9d8df1]/80 rounded-full bg-gradient-to-r from-[#6050ba]/30 to-[#9d8df1]/30 shadow-xl backdrop-blur-sm">
                  <span className="relative">
                    <span className="w-1.5 h-1.5 rounded-full bg-white block animate-pulse" />
                    <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </span>
                  В лейбл ждёт тебя
                </div>
              </div>

              {/* Футер ссылки */}
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { href: '/faq', label: 'FAQ' },
                  { href: '/contacts', label: 'Контакты' },
                  { href: '/news', label: 'Новости' },
                ].map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className="text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка - Новости */}
          <div className="lg:col-span-3">
            <div className={`transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h2 className="text-sm font-black text-white mb-2 uppercase">
                Новости и События
              </h2>
              <div className="space-y-2">
                {news.length > 0 ? news.map((item) => (
                  <Link
                    key={item.id}
                    href="/news"
                    className="block p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#9d8df1]/30 transition-all group"
                  >
                    <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">
                      {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}
                    </div>
                    <h3 className="text-white font-bold text-xs mb-0.5 group-hover:text-[#c4b5fd] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.content && (
                      <p className="text-white/60 text-[10px] line-clamp-2">{cleanMarkdown(item.content).substring(0, 80)}...</p>
                    )}
                  </Link>
                )) : (
                  <>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">28.10</div>
                      <h3 className="text-white font-bold text-xs mb-0.5">Анонс нового альбома</h3>
                      <p className="text-white/60 text-[10px]">Скоро релиз от группы Spectrum</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">25.10</div>
                      <h3 className="text-white font-bold text-xs mb-0.5">"Luna" на премию</h3>
                      <p className="text-white/60 text-[10px]">Номинация в категории</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">20.10</div>
                      <h3 className="text-white font-bold text-xs mb-0.5">Расширение сети</h3>
                      <p className="text-white/60 text-[10px]">Новые партнеры для артистов</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}