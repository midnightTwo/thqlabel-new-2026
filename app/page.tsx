"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';

export default function HomePage() {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [introReady, setIntroReady] = useState(false);
  
  useEffect(() => {
    // Мгновенно запускаем анимации
    requestAnimationFrame(() => {
      setIntroReady(true);
    });
    
    const timer = setTimeout(() => {
      router.replace('/feed');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div 
      className="intro-screen fixed inset-0 z-[100] flex items-center justify-center"
      style={{ 
        pointerEvents: 'none' // Intro экран не должен блокировать клики
      }}
    >
      {/* Тёмный фон - показывается по умолчанию (тёмная тема) */}
      <div className="intro-dark-bg absolute inset-0" />
      
      {/* Голографический фон - показывается через CSS когда html.light */}
      <div className="intro-holographic absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 intro-gradient-1" />
        <div className="absolute inset-0 intro-gradient-2" />
        <div className="absolute inset-0 intro-shimmer" />
        <div className="intro-blob-1" />
        <div className="intro-blob-2" />
        <div className="intro-blob-3" />
      </div>
      
      {/* Градиентные пятна - для тёмной темы */}
      <div className="intro-dark-spots absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full top-[10%] left-[15%] bg-[radial-gradient(circle,rgba(96,80,186,0.2)_0%,transparent_60%)] blur-[60px]" />
        <div className="absolute w-80 h-80 rounded-full bottom-[20%] right-[15%] bg-[radial-gradient(circle,rgba(157,141,241,0.2)_0%,transparent_60%)] blur-[50px]" />
      </div>
      
      {/* Звёзды/блёстки - всегда показываем */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        {Array.from({ length: 60 }, (_, i) => {
          const size = (i % 3) + 2;
          const left = ((i * 37) % 100);
          const top = ((i * 23) % 100);
          const delay = (i % 20) * 0.12;
          return (
            <div
              key={i}
              className="intro-star absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {/* Центральный контейнер */}
      <div className="flex flex-col items-center justify-center relative z-10">
        {/* Контейнер для Сатурна - показываем СРАЗУ */}
        <div 
          className="relative flex items-center justify-center"
          style={{
            width: '350px',
            height: '350px',
          }}
        >
          {/* БОЛЬШОЕ ЛОГО - ПОВЕРХ ВСЕГО - видно сразу */}
          <img 
            src="/logo.png?v=2" 
            alt="thq" 
            className={`absolute z-50 object-contain ${isLight ? 'invert brightness-0' : ''}`}
            style={{
              width: '400px',
              height: '400px',
              filter: isLight ? 'invert(1) brightness(0)' : 'drop-shadow(0 0 30px rgba(157, 141, 241, 0.8))',
            }}
          />

          {/* Мощное внешнее свечение - сразу */}
          <div 
            className="intro-outer-glow absolute rounded-full blur-3xl pointer-events-none"
            style={{
              width: '200px',
              height: '200px',
              animation: 'glow-pulse 3s ease-in-out infinite',
            }}
          />
          
          {/* Планета Сатурн - маленькая, за лого - видна сразу */}
          <div 
            className="intro-planet absolute rounded-full overflow-hidden z-10"
            style={{
              width: '120px',
              height: '120px',
              animation: 'planet-pulse 4s ease-in-out infinite',
            }}
          >
            {/* Яркий блик */}
            <div 
              className="absolute w-8 h-8 rounded-full top-2 left-2 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 30%, transparent 70%)',
              }}
            />
          </div>

          {/* Контейнер для колец */}
          <div 
            className="absolute z-20"
            style={{
              width: '280px',
              height: '80px',
              perspective: '1000px',
            }}
          >
            {/* Основное кольцо - вращается сразу */}
            <div
              className="intro-ring-1 absolute inset-0"
              style={{
                borderRadius: '50%',
                border: '16px solid transparent',
                animation: 'ring-spin 8s linear infinite',
              }}
            />
            {/* Второе кольцо - вращается сразу */}
            <div
              className="intro-ring-2 absolute"
              style={{
                top: '-12px',
                left: '-12px',
                right: '-12px',
                bottom: '-12px',
                borderRadius: '50%',
                border: '8px solid transparent',
                animation: 'ring-spin 12s linear infinite reverse',
              }}
            />
            {/* Третье пунктирное кольцо - вращается сразу */}
            <div
              className="intro-ring-3 absolute"
              style={{
                top: '-25px',
                left: '-25px',
                right: '-25px',
                bottom: '-25px',
                borderRadius: '50%',
                animation: 'ring-spin 16s linear infinite',
              }}
            />
          </div>

          {/* Летающие частицы */}
          {introReady && [...Array(10)].map((_, i) => (
            <div
              key={i}
              className="intro-particle absolute w-2 h-2 rounded-full"
              style={{
                animationName: 'particle-orbit',
                animationDuration: `${5 + i * 0.6}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Анимированные точки загрузки - показываем СРАЗУ */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="intro-loading-text text-xs uppercase tracking-[0.3em] font-bold">Загрузка</span>
          <span className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="intro-loading-dot w-1.5 h-1.5 rounded-full"
                style={{
                  animationName: 'loading-dot',
                  animationDuration: '1.4s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
