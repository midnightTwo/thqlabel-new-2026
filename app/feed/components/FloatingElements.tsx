'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';

// Функция для детерминированных псевдослучайных значений
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Оптимизированные летающие 3D фигуры
export const FloatingShapes = memo(({ isLight }: { isLight?: boolean }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
            border: isLight 
              ? '1px solid rgba(96, 80, 186, 0.2)'
              : '1px solid rgba(96, 80, 186, 0.15)',
            background: isLight 
              ? 'rgba(255, 255, 255, 0.4)'
              : 'rgba(96, 80, 186, 0.02)',
            backdropFilter: isLight ? 'blur(8px)' : 'none',
            animationName: 'float-shape',
            animationDuration: `${shape.duration}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
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

// Оптимизированные летающие частицы
export const FloatingParticles = memo(({ isLight }: { isLight?: boolean }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: seededRandom(i + 600) * 100,
      y: seededRandom(i + 700) * 100,
      size: 2 + seededRandom(i + 800) * 4,
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
          className={`absolute rounded-full ${isLight ? 'page-sparkle' : 'bg-[#9d8df1]'}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: isLight ? p.size * 1.5 : p.size,
            height: isLight ? p.size * 1.5 : p.size,
            opacity: 1,
            border: isLight ? '1px solid rgba(100,80,140,0.4)' : undefined,
            boxShadow: isLight 
              ? '0 0 2px rgba(100,80,140,0.5), 0 0 6px rgba(180,140,220,0.4), 0 0 12px rgba(140,180,220,0.3)'
              : '0 0 8px rgba(157, 141, 241, 0.5)',
            background: isLight 
              ? 'linear-gradient(135deg, rgba(180,140,220,0.9) 0%, rgba(140,180,220,0.9) 50%, rgba(200,160,200,0.9) 100%)'
              : undefined,
            animationName: isLight ? 'sparkle-float' : 'particle-fly',
            animationDuration: `${p.duration}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
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
        @keyframes sparkle-float {
          0%, 100% { 
            transform: translate3d(0, 0, 0) scale(1); 
            opacity: 0.5;
            box-shadow: 0 0 2px rgba(100,80,140,0.4), 0 0 5px rgba(180,140,220,0.3);
          }
          25% { 
            transform: translate3d(20px, -30px, 0) scale(1.2); 
            opacity: 0.8;
            box-shadow: 0 0 3px rgba(100,80,140,0.5), 0 0 8px rgba(180,140,220,0.4);
          }
          50% { 
            transform: translate3d(-12px, 20px, 0) scale(1.1); 
            opacity: 0.6;
          }
          75% { 
            transform: translate3d(25px, 12px, 0) scale(1.3); 
            opacity: 0.9;
            box-shadow: 0 0 4px rgba(100,80,140,0.5), 0 0 10px rgba(140,180,220,0.4);
          }
        }
      `}</style>
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';
