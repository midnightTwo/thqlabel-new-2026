"use client";
import React, { memo, useId } from 'react';

// Компонент четырёхконечной серебряной звезды с 3D эффектом
export const SilverStar = memo(({ 
  size = 40, 
  className = "",
  style = {},
  animate = true,
  delay = 0
}: { 
  size?: number; 
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
  delay?: number;
}) => {
  // Используем useId для стабильного ID между сервером и клиентом
  const reactId = useId();
  const uniqueId = `star-gradient-${reactId.replace(/:/g, '')}`;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={`${animate ? 'animate-star-float' : ''} ${className}`}
      style={{ 
        filter: 'drop-shadow(0 4px 12px rgba(200, 200, 220, 0.4))',
        animationDelay: `${delay}s`,
        ...style 
      }}
    >
      <defs>
        {/* Главный градиент для металлического эффекта */}
        <linearGradient id={`${uniqueId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8f9fa" />
          <stop offset="25%" stopColor="#e9ecef" />
          <stop offset="50%" stopColor="#dee2e6" />
          <stop offset="75%" stopColor="#ced4da" />
          <stop offset="100%" stopColor="#adb5bd" />
        </linearGradient>
        
        {/* Блик */}
        <linearGradient id={`${uniqueId}-shine`} x1="0%" y1="0%" x2="50%" y2="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="50%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
        
        {/* Тень для объёма */}
        <radialGradient id={`${uniqueId}-shadow`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e9ecef" />
          <stop offset="100%" stopColor="#868e96" />
        </radialGradient>
      </defs>
      
      {/* Основная форма звезды - четырёхконечная */}
      <path 
        d="M50 5 
           C52 25, 75 48, 95 50
           C75 52, 52 75, 50 95
           C48 75, 25 52, 5 50
           C25 48, 48 25, 50 5Z"
        fill={`url(#${uniqueId}-main)`}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="0.5"
      />
      
      {/* Внутренняя тень для 3D эффекта */}
      <path 
        d="M50 15 
           C51 30, 70 49, 85 50
           C70 51, 51 70, 50 85
           C49 70, 30 51, 15 50
           C30 49, 49 30, 50 15Z"
        fill={`url(#${uniqueId}-shadow)`}
        opacity="0.3"
      />
      
      {/* Блик сверху */}
      <ellipse 
        cx="35" 
        cy="35" 
        rx="15" 
        ry="10" 
        fill={`url(#${uniqueId}-shine)`}
        transform="rotate(-45, 35, 35)"
      />
    </svg>
  );
});

SilverStar.displayName = 'SilverStar';

// Группа декоративных звёзд для разных мест
export const SilverStarsGroup = memo(({ 
  variant = 'default',
  className = "" 
}: { 
  variant?: 'default' | 'header' | 'sidebar' | 'card' | 'auth' | 'modal' | 'hero';
  className?: string;
}) => {
  const configs = {
    default: [
      { size: 24, top: '10%', left: '5%', delay: 0 },
      { size: 16, top: '20%', right: '8%', delay: 0.5 },
      { size: 20, bottom: '15%', left: '10%', delay: 1 },
    ],
    header: [
      { size: 14, top: '20%', left: '2%', delay: 0 },
      { size: 10, top: '60%', left: '5%', delay: 0.3 },
      { size: 12, top: '30%', right: '3%', delay: 0.6 },
      { size: 8, top: '70%', right: '6%', delay: 0.9 },
    ],
    sidebar: [
      { size: 18, top: '5%', right: '10%', delay: 0 },
      { size: 12, top: '30%', left: '5%', delay: 0.4 },
      { size: 14, bottom: '20%', right: '15%', delay: 0.8 },
    ],
    card: [
      { size: 12, top: '-5px', right: '-5px', delay: 0 },
      { size: 8, bottom: '10%', left: '5%', delay: 0.3 },
    ],
    auth: [
      { size: 50, top: '10%', left: '5%', delay: 0 },
      { size: 35, top: '5%', right: '10%', delay: 0.3 },
      { size: 40, bottom: '20%', left: '8%', delay: 0.6 },
      { size: 30, bottom: '15%', right: '5%', delay: 0.9 },
      { size: 25, top: '40%', left: '3%', delay: 1.2 },
      { size: 20, top: '60%', right: '8%', delay: 1.5 },
    ],
    modal: [
      { size: 20, top: '-10px', left: '20%', delay: 0 },
      { size: 16, top: '-5px', right: '25%', delay: 0.2 },
      { size: 12, bottom: '-5px', left: '30%', delay: 0.4 },
    ],
    hero: [
      { size: 60, top: '15%', left: '8%', delay: 0 },
      { size: 45, top: '10%', right: '12%', delay: 0.4 },
      { size: 35, top: '50%', left: '5%', delay: 0.8 },
      { size: 50, bottom: '20%', right: '10%', delay: 1.2 },
      { size: 25, top: '35%', right: '5%', delay: 1.6 },
      { size: 30, bottom: '30%', left: '15%', delay: 2 },
    ],
  };

  const stars = configs[variant] || configs.default;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            top: star.top,
            left: star.left,
            right: star.right,
            bottom: star.bottom,
          }}
        >
          <SilverStar size={star.size} delay={star.delay} />
        </div>
      ))}
      
      <style jsx global>{`
        @keyframes star-float {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0.9;
          }
          25% {
            transform: translateY(-8px) rotate(5deg) scale(1.05);
            opacity: 1;
          }
          50% {
            transform: translateY(-4px) rotate(0deg) scale(1);
            opacity: 0.95;
          }
          75% {
            transform: translateY(-10px) rotate(-5deg) scale(1.03);
            opacity: 1;
          }
        }
        
        .animate-star-float {
          animation: star-float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
});

SilverStarsGroup.displayName = 'SilverStarsGroup';

export default SilverStarsGroup;
