import React from 'react';

// =============================================
// КРАСИВЫЕ SVG ИКОНКИ ДЛЯ РЕГИОНОВ
// =============================================

// Компонент иконки региона "Европа и СНГ" - синий глобус со звёздами ЕС
export const EuropeRegionIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="europeRegionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#60a5fa" />
      </linearGradient>
      <filter id="europeShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#europeRegionGrad)" filter="url(#europeShadow)" />
    {/* Кольцо звёзд ЕС */}
    <g fill="#ffd700">
      <polygon points="12,4.5 12.4,5.7 13.6,5.7 12.6,6.4 13,7.6 12,6.9 11,7.6 11.4,6.4 10.4,5.7 11.6,5.7" />
      <polygon points="16,6 16.4,7.2 17.6,7.2 16.6,7.9 17,9.1 16,8.4 15,9.1 15.4,7.9 14.4,7.2 15.6,7.2" />
      <polygon points="18,10 18.4,11.2 19.6,11.2 18.6,11.9 19,13.1 18,12.4 17,13.1 17.4,11.9 16.4,11.2 17.6,11.2" />
      <polygon points="16,14 16.4,15.2 17.6,15.2 16.6,15.9 17,17.1 16,16.4 15,17.1 15.4,15.9 14.4,15.2 15.6,15.2" />
      <polygon points="12,17 12.4,18.2 13.6,18.2 12.6,18.9 13,20.1 12,19.4 11,20.1 11.4,18.9 10.4,18.2 11.6,18.2" />
      <polygon points="8,14 8.4,15.2 9.6,15.2 8.6,15.9 9,17.1 8,16.4 7,17.1 7.4,15.9 6.4,15.2 7.6,15.2" />
      <polygon points="6,10 6.4,11.2 7.6,11.2 6.6,11.9 7,13.1 6,12.4 5,13.1 5.4,11.9 4.4,11.2 5.6,11.2" />
      <polygon points="8,6 8.4,7.2 9.6,7.2 8.6,7.9 9,9.1 8,8.4 7,9.1 7.4,7.9 6.4,7.2 7.6,7.2" />
    </g>
  </svg>
);

// Компонент иконки региона "Америка и Океания" - зелёный глобус с континентами
export const AmericaRegionIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="americaRegionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#065f46" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
      <filter id="americaShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#americaRegionGrad)" filter="url(#americaShadow)" />
    {/* Океан */}
    <circle cx="12" cy="12" r="8" fill="none" stroke="#a7f3d0" strokeWidth="0.3" opacity="0.5" />
    <ellipse cx="12" cy="12" rx="4" ry="8" fill="none" stroke="#a7f3d0" strokeWidth="0.3" opacity="0.5" />
    {/* Северная Америка */}
    <path d="M7 4.5 Q5 6 5.5 8 Q6 10 8 9.5 Q10 9 11 7 Q11 5 9 4 Q8 4 7 4.5" fill="#86efac" opacity="0.9" />
    {/* Южная Америка */}
    <path d="M9 12 Q8 14 8.5 17 Q9 19 10.5 18.5 Q12 17 11 14 Q10.5 12 9 12" fill="#86efac" opacity="0.9" />
    {/* Австралия */}
    <ellipse cx="17" cy="16" rx="2" ry="1.5" fill="#86efac" opacity="0.8" />
  </svg>
);

// Компонент иконки региона "Азия и Ближний Восток" - оранжевый с восходящим солнцем
export const AsiaRegionIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="asiaRegionGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9a3412" />
        <stop offset="50%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#fb923c" />
      </linearGradient>
      <linearGradient id="asiaSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <filter id="asiaShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#asiaRegionGrad)" filter="url(#asiaShadow)" />
    {/* Восходящее солнце */}
    <circle cx="12" cy="10" r="4" fill="url(#asiaSunGrad)" />
    {/* Лучи солнца */}
    <g stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="4" x2="12" y2="5" />
      <line x1="16.5" y1="5.5" x2="15.8" y2="6.2" />
      <line x1="18" y1="10" x2="17" y2="10" />
      <line x1="7.5" y1="5.5" x2="8.2" y2="6.2" />
      <line x1="6" y1="10" x2="7" y2="10" />
    </g>
    {/* Горизонт */}
    <path d="M4 14 Q8 12 12 14 Q16 16 20 14" stroke="#fcd34d" strokeWidth="1.5" fill="none" opacity="0.8" />
    {/* Пагода силуэт */}
    <path d="M15 15 L14 17 L13 15.5 L12 18 L11 15.5 L10 17 L9 15 L10 14 L14 14 Z" fill="#7c2d12" opacity="0.7" />
  </svg>
);

// Компонент иконки региона "Африка" - тёплый с контуром континента
export const AfricaRegionIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="africaRegionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <filter id="africaShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#africaRegionGrad)" filter="url(#africaShadow)" />
    {/* Контур Африки */}
    <path 
      d="M11 3.5 Q14 3.5 15.5 5 Q17 6.5 17 8 Q17.5 9 17 10.5 Q17.5 12 17 14 Q16 16 15 18 Q14 19.5 12 20 Q10 19.5 9.5 18 Q8.5 16 8 14 Q7.5 12 8 10.5 Q7.5 9 8 8 Q8 6.5 9.5 5 Q11 3.5 11 3.5" 
      fill="#fef3c7" 
      opacity="0.85"
    />
    {/* Закат */}
    <circle cx="12" cy="8" r="2.5" fill="#f97316" opacity="0.9" />
    {/* Саванна */}
    <path d="M9 15 Q10 13 12 14 Q14 15 15 14" stroke="#92400e" strokeWidth="1" fill="none" opacity="0.6" />
    {/* Дерево акация */}
    <path d="M13.5 12 L13.5 14 M12 11.5 Q13.5 10 15 11.5" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.6" />
  </svg>
);

// =============================================
// SVG ИКОНКИ ДЛЯ ГРУПП ПЛОЩАДОК  
// =============================================

// Стриминг - иконка с волнами звука
export const StreamingGroupIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="streamingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
      <filter id="streamingShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#streamingGrad)" filter="url(#streamingShadow)" />
    {/* Звуковые волны */}
    <g stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.95">
      <line x1="6" y1="9" x2="6" y2="15" />
      <line x1="9" y1="7" x2="9" y2="17" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="15" y1="7" x2="15" y2="17" />
      <line x1="18" y1="9" x2="18" y2="15" />
    </g>
  </svg>
);

// Социальные сети - иконка с людьми/сетью
export const SocialGroupIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="socialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
      <filter id="socialShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#socialGrad)" filter="url(#socialShadow)" />
    {/* Центральная камера/видео */}
    <rect x="8" y="8" width="8" height="6" rx="1" fill="white" opacity="0.95" />
    <circle cx="12" cy="11" r="1.5" fill="#7c3aed" />
    {/* Кнопка записи */}
    <circle cx="16" cy="16" r="2.5" fill="#ef4444" opacity="0.9" />
    <circle cx="16" cy="16" r="1" fill="white" />
    {/* Звук */}
    <path d="M5 10 Q4 12 5 14" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
    <path d="M19 10 Q20 12 19 14" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// Магазины - иконка с корзиной и нотой
export const StoreGroupIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <filter id="storeShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#storeGrad)" filter="url(#storeShadow)" />
    {/* Сумка для покупок */}
    <path d="M6 9 L7 17 L17 17 L18 9 L6 9" fill="white" opacity="0.95" stroke="white" strokeWidth="0.5" />
    <path d="M9 9 L9 7 Q9 5 12 5 Q15 5 15 7 L15 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Нота внутри */}
    <path d="M11 11 L11 14.5 M11 11 L14 10.5 L14 14" stroke="#d97706" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="10" cy="14.5" r="1.3" fill="#d97706" />
    <circle cx="13" cy="14" r="1.3" fill="#d97706" />
  </svg>
);

// =============================================
// ЭКСПОРТЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В КОМПОНЕНТАХ
// =============================================

// Иконки регионов как Record
export const RegionIcons: Record<string, React.ReactNode> = {
  'europe': <EuropeRegionIcon className="w-full h-full" />,
  'Европа и СНГ': <EuropeRegionIcon className="w-full h-full" />,
  'america': <AmericaRegionIcon className="w-full h-full" />,
  'Америка и Океания': <AmericaRegionIcon className="w-full h-full" />,
  'asia': <AsiaRegionIcon className="w-full h-full" />,
  'Азия и Ближний Восток': <AsiaRegionIcon className="w-full h-full" />,
  'africa': <AfricaRegionIcon className="w-full h-full" />,
  'Африка': <AfricaRegionIcon className="w-full h-full" />,
};

// Иконки для групп площадок как Record
export const PlatformGroupIcons: Record<string, React.ReactNode> = {
  'streaming': <StreamingGroupIcon className="w-full h-full" />,
  'Стриминг': <StreamingGroupIcon className="w-full h-full" />,
  'social': <SocialGroupIcon className="w-full h-full" />,
  'Социальные сети и видео': <SocialGroupIcon className="w-full h-full" />,
  'stores': <StoreGroupIcon className="w-full h-full" />,
  'Магазины и другие': <StoreGroupIcon className="w-full h-full" />,
};

// Компонент иконки региона
export const RegionIcon: React.FC<{ region: string; className?: string }> = ({ region, className = 'w-6 h-6' }) => {
  const IconComponent = {
    'europe': EuropeRegionIcon,
    'Европа и СНГ': EuropeRegionIcon,
    'america': AmericaRegionIcon,
    'Америка и Океания': AmericaRegionIcon,
    'asia': AsiaRegionIcon,
    'Азия и Ближний Восток': AsiaRegionIcon,
    'africa': AfricaRegionIcon,
    'Африка': AfricaRegionIcon,
  }[region] || EuropeRegionIcon;
  
  return <IconComponent className={className} />;
};

// Компонент иконки группы площадок
export const PlatformGroupIcon: React.FC<{ group: string; className?: string }> = ({ group, className = 'w-6 h-6' }) => {
  const IconComponent = {
    'streaming': StreamingGroupIcon,
    'Стриминг': StreamingGroupIcon,
    'social': SocialGroupIcon,
    'Социальные сети и видео': SocialGroupIcon,
    'stores': StoreGroupIcon,
    'Магазины и другие': StoreGroupIcon,
  }[group] || StreamingGroupIcon;
  
  return <IconComponent className={className} />;
};
