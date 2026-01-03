"use client";

import React from 'react';

// SVG иконки для разных тем кейсов
export const CaseIcons = {
  // Япония / Аниме
  Japan: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="japan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#ee5a5a" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="white" stroke="#ddd" strokeWidth="2"/>
      <circle cx="32" cy="32" r="14" fill="url(#japan-grad)"/>
      <path d="M20 48 L32 20 L44 48" stroke="#333" strokeWidth="2" fill="none" opacity="0.3"/>
    </svg>
  ),
  
  // BTS / K-Pop
  BTS: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="bts-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="8" fill="url(#bts-grad)"/>
      <path d="M20 32 L32 20 L44 32 L32 44 Z" fill="white" opacity="0.9"/>
      <circle cx="32" cy="32" r="6" fill="#a855f7"/>
      <path d="M16 24 L24 16" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M40 16 L48 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  
  // Ретро / 80s
  Retro: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="retro-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff00ff" />
          <stop offset="50%" stopColor="#00ffff" />
          <stop offset="100%" stopColor="#ff6600" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="4" fill="#1a1a2e"/>
      <path d="M4 48 L32 20 L60 48" stroke="url(#retro-grad)" strokeWidth="3" fill="none"/>
      <circle cx="20" cy="16" r="4" fill="#ff00ff"/>
      <circle cx="44" cy="16" r="4" fill="#00ffff"/>
      <line x1="8" y1="56" x2="56" y2="56" stroke="#ff6600" strokeWidth="2"/>
    </svg>
  ),
  
  // Космос
  Space: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="space-grad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f0a1a" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#space-grad)"/>
      <circle cx="20" cy="20" r="2" fill="white"/>
      <circle cx="44" cy="16" r="1.5" fill="white"/>
      <circle cx="48" cy="40" r="2" fill="white"/>
      <circle cx="16" cy="44" r="1" fill="white"/>
      <circle cx="36" cy="28" r="1.5" fill="#ffd700"/>
      <ellipse cx="32" cy="50" rx="12" ry="4" fill="#4c1d95" opacity="0.6"/>
      <circle cx="32" cy="36" r="8" fill="#7c3aed"/>
      <ellipse cx="32" cy="36" rx="14" ry="3" stroke="#a78bfa" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  
  // Киберпанк
  Cyberpunk: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="#ff00ff" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="2" fill="#0a0a0a"/>
      <path d="M12 32 L20 24 L28 32 L20 40 Z" stroke="#00f5ff" strokeWidth="2" fill="none"/>
      <path d="M36 32 L44 24 L52 32 L44 40 Z" stroke="#ff00ff" strokeWidth="2" fill="none"/>
      <line x1="28" y1="32" x2="36" y2="32" stroke="url(#cyber-grad)" strokeWidth="2"/>
      <rect x="8" y="8" width="8" height="8" fill="none" stroke="#00f5ff" strokeWidth="1" opacity="0.5"/>
      <rect x="48" y="48" width="8" height="8" fill="none" stroke="#ff00ff" strokeWidth="1" opacity="0.5"/>
    </svg>
  ),
  
  // Природа
  Nature: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="nature-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#dcfce7"/>
      <path d="M32 52 L32 28" stroke="#854d0e" strokeWidth="4"/>
      <ellipse cx="32" cy="24" rx="16" ry="14" fill="url(#nature-grad)"/>
      <ellipse cx="24" cy="20" rx="8" ry="8" fill="#4ade80"/>
      <ellipse cx="40" cy="20" rx="8" ry="8" fill="#4ade80"/>
      <circle cx="48" cy="12" r="6" fill="#fbbf24"/>
    </svg>
  ),
  
  // Огонь
  Fire: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="fire-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#1a1a1a"/>
      <path d="M32 56 C16 56 12 40 20 28 C20 36 24 40 28 36 C24 32 26 24 32 16 C38 24 40 32 36 36 C40 40 44 36 44 28 C52 40 48 56 32 56" fill="url(#fire-grad)"/>
      <ellipse cx="32" cy="44" rx="6" ry="8" fill="#fbbf24"/>
    </svg>
  ),
  
  // Океан
  Ocean: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="ocean-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#ocean-grad)"/>
      <path d="M4 32 Q12 28 20 32 T36 32 T52 32 T60 32" stroke="white" strokeWidth="2" fill="none" opacity="0.6"/>
      <path d="M4 40 Q12 36 20 40 T36 40 T52 40 T60 40" stroke="white" strokeWidth="2" fill="none" opacity="0.4"/>
      <path d="M4 48 Q12 44 20 48 T36 48 T52 48 T60 48" stroke="white" strokeWidth="2" fill="none" opacity="0.2"/>
      <circle cx="24" cy="24" r="4" fill="white" opacity="0.3"/>
    </svg>
  ),
  
  // Золото / Luxury
  Gold: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="4" fill="url(#gold-grad)"/>
      <polygon points="32,16 36,28 48,28 38,36 42,48 32,40 22,48 26,36 16,28 28,28" fill="white"/>
      <circle cx="32" cy="32" r="4" fill="#f59e0b"/>
    </svg>
  ),
  
  // Неон
  Neon: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="4" y="4" width="56" height="56" rx="8" fill="#0f0f23"/>
      <rect x="12" y="12" width="40" height="40" rx="4" stroke="#39ff14" strokeWidth="2" fill="none">
        <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
      </rect>
      <circle cx="32" cy="32" r="12" stroke="#ff073a" strokeWidth="2" fill="none">
        <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <line x1="20" y1="32" x2="44" y2="32" stroke="#00fff5" strokeWidth="2">
        <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
      </line>
    </svg>
  ),
  
  // Готика
  Gothic: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="gothic-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a1942" />
          <stop offset="100%" stopColor="#1a0a1a" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="2" fill="url(#gothic-grad)"/>
      <path d="M32 8 L32 20 M24 12 L40 12" stroke="#8b5cf6" strokeWidth="2"/>
      <path d="M20 56 L20 36 Q20 28 32 20 Q44 28 44 36 L44 56" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
      <circle cx="32" cy="40" r="6" fill="#8b5cf6" opacity="0.5"/>
      <path d="M28 48 L28 56 M36 48 L36 56" stroke="#8b5cf6" strokeWidth="2"/>
    </svg>
  ),
  
  // Минимализм
  Minimal: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2"/>
      <circle cx="32" cy="32" r="16" fill="#171717"/>
    </svg>
  ),
  
  // Граффити
  Graffiti: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="4" y="4" width="56" height="56" rx="4" fill="#262626"/>
      <text x="10" y="36" fontFamily="Arial Black" fontSize="18" fill="#ef4444" fontWeight="bold">T</text>
      <text x="22" y="40" fontFamily="Arial Black" fontSize="20" fill="#22c55e" fontWeight="bold">H</text>
      <text x="38" y="38" fontFamily="Arial Black" fontSize="22" fill="#3b82f6" fontWeight="bold">Q</text>
      <circle cx="50" cy="16" r="4" fill="#fbbf24"/>
      <path d="M8 48 Q20 44 32 48 T56 48" stroke="#ec4899" strokeWidth="3" fill="none"/>
    </svg>
  ),
  
  // Египет
  Egypt: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="egypt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#c2850c" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="4" fill="#0ea5e9"/>
      <polygon points="32,12 52,52 12,52" fill="url(#egypt-grad)"/>
      <polygon points="32,20 44,52 20,52" fill="#d97706" opacity="0.5"/>
      <circle cx="50" cy="14" r="6" fill="#fbbf24"/>
      <ellipse cx="32" cy="36" rx="3" ry="4" fill="#1a1a1a"/>
    </svg>
  ),
  
  // Викинги
  Viking: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="viking-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#1e293b"/>
      <ellipse cx="32" cy="40" rx="18" ry="10" fill="#78350f"/>
      <path d="M14 40 L14 28 M50 40 L50 28" stroke="#78350f" strokeWidth="4"/>
      <circle cx="14" cy="24" r="4" fill="url(#viking-grad)"/>
      <circle cx="50" cy="24" r="4" fill="url(#viking-grad)"/>
      <path d="M24 32 L24 24 Q32 16 40 24 L40 32" stroke="url(#viking-grad)" strokeWidth="3" fill="none"/>
      <circle cx="28" cy="28" r="2" fill="#60a5fa"/>
      <circle cx="36" cy="28" r="2" fill="#60a5fa"/>
    </svg>
  ),
  
  // Самурай
  Samurai: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="samurai-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#1a1a1a"/>
      <path d="M8 32 L56 32" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M12 30 L12 34 Q12 36 14 36 L50 36 Q52 36 52 34 L52 30 Q52 28 50 28 L14 28 Q12 28 12 30" fill="url(#samurai-grad)"/>
      <rect x="8" y="29" width="8" height="6" rx="1" fill="#78350f"/>
      <circle cx="32" cy="18" r="8" fill="#dc2626"/>
      <path d="M28 16 L32 12 L36 16" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  
  // Драконы
  Dragon: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="dragon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#14532d"/>
      <path d="M20 44 Q16 36 20 28 Q28 20 36 24 Q44 20 48 28 Q52 36 48 44 Q44 52 32 52 Q20 52 20 44" fill="url(#dragon-grad)"/>
      <circle cx="26" cy="32" r="3" fill="#fbbf24"/>
      <circle cx="38" cy="32" r="3" fill="#fbbf24"/>
      <circle cx="26" cy="32" r="1.5" fill="#1a1a1a"/>
      <circle cx="38" cy="32" r="1.5" fill="#1a1a1a"/>
      <path d="M28 40 Q32 44 36 40" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
      <path d="M20 24 L16 16 L24 20" fill="url(#dragon-grad)"/>
      <path d="M44 24 L48 16 L40 20" fill="url(#dragon-grad)"/>
    </svg>
  ),
  
  // Игры
  Gaming: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="gaming-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="12" fill="url(#gaming-grad)"/>
      <rect x="12" y="24" width="16" height="16" rx="4" fill="white" opacity="0.2"/>
      <line x1="20" y1="28" x2="20" y2="36" stroke="white" strokeWidth="2"/>
      <line x1="16" y1="32" x2="24" y2="32" stroke="white" strokeWidth="2"/>
      <circle cx="40" cy="28" r="3" fill="#ef4444"/>
      <circle cx="48" cy="32" r="3" fill="#22c55e"/>
      <circle cx="40" cy="36" r="3" fill="#3b82f6"/>
      <circle cx="32" cy="32" r="3" fill="#fbbf24"/>
    </svg>
  ),
  
  // Музыка
  Music: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="music-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#music-grad)"/>
      <circle cx="32" cy="32" r="20" fill="#1a1a1a"/>
      <circle cx="32" cy="32" r="8" fill="#f43f5e"/>
      <circle cx="32" cy="32" r="3" fill="#1a1a1a"/>
      <path d="M32 12 L32 8" stroke="white" strokeWidth="2"/>
      <path d="M32 56 L32 52" stroke="white" strokeWidth="2"/>
      <path d="M12 32 L8 32" stroke="white" strokeWidth="2"/>
      <path d="M56 32 L52 32" stroke="white" strokeWidth="2"/>
    </svg>
  ),
  
  // Кристаллы
  Crystal: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="crystal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="8" fill="#0f172a"/>
      <polygon points="32,8 44,24 44,48 32,56 20,48 20,24" fill="url(#crystal-grad)" opacity="0.8"/>
      <polygon points="32,8 44,24 32,32 20,24" fill="white" opacity="0.3"/>
      <line x1="32" y1="8" x2="32" y2="56" stroke="white" strokeWidth="1" opacity="0.3"/>
      <polygon points="24,16 28,12 32,20" fill="#fff" opacity="0.5"/>
    </svg>
  ),
  
  // Рождество
  Christmas: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#dc2626"/>
      <polygon points="32,12 40,28 48,28 42,36 46,52 32,44 18,52 22,36 16,28 24,28" fill="#fbbf24"/>
      <polygon points="32,16 38,28 46,28 40,34 43,46 32,40 21,46 24,34 18,28 26,28" fill="#fef08a"/>
      <circle cx="32" cy="28" r="2" fill="#dc2626"/>
    </svg>
  ),
  
  // Хэллоуин
  Halloween: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#1a1a1a"/>
      <ellipse cx="32" cy="36" rx="20" ry="16" fill="#f97316"/>
      <polygon points="24,28 28,20 32,28" fill="#1a1a1a"/>
      <polygon points="36,28 40,20 44,28" fill="#1a1a1a"/>
      <path d="M24 40 L28 44 L32 40 L36 44 L40 40" stroke="#1a1a1a" strokeWidth="3" fill="none"/>
      <path d="M32 20 Q28 16 32 12 Q36 16 32 20" fill="#16a34a"/>
    </svg>
  ),
  
  // Сакура
  Sakura: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="sakura-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="100%" stopColor="#fbcfe8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#sakura-grad)"/>
      <ellipse cx="32" cy="24" rx="6" ry="10" fill="#f9a8d4"/>
      <ellipse cx="24" cy="32" rx="6" ry="10" fill="#f9a8d4" transform="rotate(-72 24 32)"/>
      <ellipse cx="26" cy="42" rx="6" ry="10" fill="#f9a8d4" transform="rotate(-144 26 42)"/>
      <ellipse cx="38" cy="42" rx="6" ry="10" fill="#f9a8d4" transform="rotate(144 38 42)"/>
      <ellipse cx="40" cy="32" rx="6" ry="10" fill="#f9a8d4" transform="rotate(72 40 32)"/>
      <circle cx="32" cy="34" r="4" fill="#fbbf24"/>
    </svg>
  ),
  
  // Стимпанк
  Steampunk: () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="steam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#292524"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke="url(#steam-grad)" strokeWidth="4"/>
      <circle cx="32" cy="32" r="12" fill="none" stroke="#d97706" strokeWidth="2"/>
      <circle cx="32" cy="32" r="4" fill="#d97706"/>
      <line x1="32" y1="20" x2="32" y2="12" stroke="#d97706" strokeWidth="3"/>
      <line x1="32" y1="52" x2="32" y2="44" stroke="#d97706" strokeWidth="3"/>
      <line x1="20" y1="32" x2="12" y2="32" stroke="#d97706" strokeWidth="3"/>
      <line x1="52" y1="32" x2="44" y2="32" stroke="#d97706" strokeWidth="3"/>
      <circle cx="20" cy="20" r="6" fill="none" stroke="#92400e" strokeWidth="2"/>
      <circle cx="44" cy="44" r="6" fill="none" stroke="#92400e" strokeWidth="2"/>
    </svg>
  ),
};

// Компонент иконки для конкретного кейса
export const CaseIcon: React.FC<{ type: keyof typeof CaseIcons; className?: string }> = ({ type, className }) => {
  const IconComponent = CaseIcons[type];
  return IconComponent ? (
    <div className={className}>
      <IconComponent />
    </div>
  ) : null;
};

export default CaseIcons;
