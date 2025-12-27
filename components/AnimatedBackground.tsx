"use client";
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Функция для генерации детерминированных значений на основе индекса
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Оптимизированные летающие 3D фигуры (уменьшено количество)
export const FloatingShapes = memo(() => {
  const { themeName } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Генерируем формы с детерминированными значениями для SSR
  const shapes = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: seededRandom(i + 1) * 100,
      y: seededRandom(i + 100) * 100,
      size: 30 + seededRandom(i + 200) * 50,
      duration: 20 + seededRandom(i + 300) * 20,
      delay: seededRandom(i + 400) * -15,
      type: seededRandom(i + 500) > 0.5 ? 'circle' : 'square',
    })),
  []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {shapes.map(shape => (
        <div
          key={shape.id}
          className={`absolute ${shape.type === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            border: themeName === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(96, 80, 186, 0.15)',
            background: themeName === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(96, 80, 186, 0.02)',
            animation: `float-shape ${shape.duration}s ease-in-out infinite`,
            animationDelay: `${shape.delay}s`,
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-shape {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(20px, -30px, 0); }
          50% { transform: translate3d(-15px, 20px, 0); }
          75% { transform: translate3d(25px, 15px, 0); }
        }
      `}</style>
    </div>
  );
});

FloatingShapes.displayName = 'FloatingShapes';

// Оптимизированные частицы (уменьшено количество с 80 до 25)
export const FloatingParticles = memo(() => {
  const { themeName } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Генерируем частицы с детерминированными значениями для SSR
  const particles = useMemo(() => 
    Array.from({ length: 25 }, (_, i) => ({
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
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute rounded-full ${themeName === 'light' ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: themeName === 'light' ? '0 0 8px rgba(0,0,0,0.15)' : '0 0 8px rgba(157, 141, 241, 0.5)',
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
          25% { transform: translate3d(40px, -50px, 0); opacity: 0.6; }
          50% { transform: translate3d(-25px, 40px, 0); opacity: 0.4; }
          75% { transform: translate3d(50px, 25px, 0); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// Оптимизированный градиентный фон БЕЗ параллакса (убирает layout thrashing)
export const ParallaxGradient = memo(() => {
  const { themeName } = useTheme();
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
      <div 
        className={`absolute top-0 left-1/4 w-[600px] h-[600px] ${themeName === 'light' ? 'bg-gray-300/15' : 'bg-[#6050ba]/08'} rounded-full`}
        style={{ 
          filter: 'blur(150px)',
          willChange: 'opacity',
          animation: 'gradient-pulse 8s ease-in-out infinite',
        }}
      />
      <div 
        className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] ${themeName === 'light' ? 'bg-gray-400/10' : 'bg-[#9d8df1]/08'} rounded-full`}
        style={{ 
          filter: 'blur(120px)',
          willChange: 'opacity',
          animation: 'gradient-pulse 8s ease-in-out infinite 2s',
        }}
      />
      <style jsx>{`
        @keyframes gradient-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
});

ParallaxGradient.displayName = 'ParallaxGradient';

// Оптимизированный эффект стекла
export const GlassOverlay = memo(() => {
  const { themeName } = useTheme();
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" style={{ transform: 'translateZ(0)' }}>
      {themeName === 'dark' ? (
        <>
          <div 
            className="absolute inset-0 bg-black/40" 
            style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} 
          />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%)',
          }} />
        </>
      ) : (
        <>
          <div 
            className="absolute inset-0 bg-white/30" 
            style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} 
          />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,255,255,0.2) 100%)',
          }} />
        </>
      )}
    </div>
  );
});

GlassOverlay.displayName = 'GlassOverlay';

// Оптимизированный комплексный анимированный фон
const AnimatedBackground = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Проверяем настройки пользователя на уменьшенную анимацию
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Отложенное появление для оптимизации First Paint
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    
    return () => {
      cancelAnimationFrame(timer);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Если пользователь предпочитает уменьшенную анимацию - показываем только статичный фон
  if (reducedMotion) {
    return <GlassOverlay />;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <FloatingShapes />
      <FloatingParticles />
      <ParallaxGradient />
      <GlassOverlay />
    </>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;
