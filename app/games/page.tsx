"use client";

import React from 'react';
import Link from 'next/link';

// SVG иконки для игр
const CaseIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id="case-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="case-shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x="8" y="16" width="48" height="40" rx="6" fill="url(#case-main)" />
    <rect x="8" y="16" width="48" height="16" rx="6" fill="url(#case-shine)" />
    <rect x="26" y="8" width="12" height="12" rx="2" fill="#fbbf24" />
    <rect x="28" y="10" width="8" height="8" rx="1" fill="#f59e0b" />
    <circle cx="32" cy="40" r="8" fill="white" opacity="0.2" />
    <text x="32" y="44" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">?</text>
    <path d="M16 56 L20 52 L44 52 L48 56" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
  </svg>
);

const BomberIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <radialGradient id="bomb-main" cx="30%" cy="30%">
        <stop offset="0%" stopColor="#4a4a4a" />
        <stop offset="100%" stopColor="#1a1a1a" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="36" r="22" fill="url(#bomb-main)" stroke="#333" strokeWidth="2"/>
    <ellipse cx="26" cy="28" rx="8" ry="5" fill="#666" opacity="0.4"/>
    <path d="M32 14 L32 6 Q38 2 44 8" stroke="#8b4513" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <circle cx="46" cy="6" r="5" fill="#ff6600">
      <animate attributeName="r" values="5;7;5" dur="0.4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="48" cy="4" r="3" fill="#ffff00" opacity="0.8"/>
    <circle cx="44" cy="8" r="2" fill="#ff9900" opacity="0.6"/>
  </svg>
);

const ComingSoonIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id="coming-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#374151" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="48" height="48" rx="8" fill="url(#coming-grad)" opacity="0.5"/>
    <circle cx="32" cy="28" r="12" fill="none" stroke="#9ca3af" strokeWidth="3" strokeDasharray="4 2"/>
    <text x="32" y="50" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">СКОРО</text>
  </svg>
);

// Данные игр
const games = [
  {
    id: 'cases',
    name: 'Кейсы',
    description: 'Открывай тематические кейсы и получай уникальные награды! 24 разных стиля: от Японии до Киберпанка.',
    icon: CaseIcon,
    href: '/games/cases',
    color: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-500',
    stats: { cases: 24, rewards: '144+' },
    tags: ['Бесплатно', 'Рулетка', 'Награды'],
    available: true,
  },
  {
    id: 'bomber',
    name: 'Бомбер',
    description: 'Пройди путь от старта до финиша, избегая бомб! Каждый шаг увеличивает множитель.',
    icon: BomberIcon,
    href: '/games/bomber',
    color: 'from-red-500 to-orange-600',
    borderColor: 'border-red-500',
    stats: { rows: 8, maxMultiplier: '×6.8' },
    tags: ['Стратегия', 'Риск', 'Множители'],
    available: true,
  },
  {
    id: 'wheel',
    name: 'Колесо Фортуны',
    description: 'Крути колесо и выигрывай призы! Разные сектора с разными наградами.',
    icon: ComingSoonIcon,
    href: '#',
    color: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-500',
    stats: { sectors: '?', prizes: '?' },
    tags: ['Скоро'],
    available: false,
  },
  {
    id: 'dice',
    name: 'Кости',
    description: 'Классическая игра в кости с современным дизайном.',
    icon: ComingSoonIcon,
    href: '#',
    color: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-500',
    stats: { modes: '?', dice: '?' },
    tags: ['Скоро'],
    available: false,
  },
];

// Компонент карточки игры
interface GameCardProps {
  game: typeof games[0];
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const Icon = game.icon;
  
  const content = (
    <div 
      className={`group relative rounded-3xl border-2 ${game.borderColor} bg-gradient-to-br ${game.color} p-1 transition-all duration-300 ${
        game.available ? 'hover:scale-105 hover:shadow-2xl cursor-pointer' : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="relative rounded-2xl bg-black/60 backdrop-blur-xl p-6 h-full">
        {/* Badge */}
        {!game.available && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gray-500/50 text-gray-300 text-xs font-medium">
            Скоро
          </div>
        )}
        
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
          <Icon />
        </div>
        
        {/* Title */}
        <h3 className="text-2xl font-bold text-white text-center mb-2">{game.name}</h3>
        
        {/* Description */}
        <p className="text-white/70 text-center text-sm mb-4 line-clamp-2">{game.description}</p>
        
        {/* Stats */}
        <div className="flex justify-center gap-4 mb-4">
          {Object.entries(game.stats).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-white/50 capitalize">{key}</div>
            </div>
          ))}
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                tag === 'Скоро' 
                  ? 'bg-gray-500/30 text-gray-400' 
                  : 'bg-white/10 text-white/80'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Play Button */}
        {game.available && (
          <div className="mt-4 text-center">
            <span className="inline-block px-6 py-2 rounded-xl bg-white/20 text-white font-bold group-hover:bg-white/30 transition-colors">
              Играть →
            </span>
          </div>
        )}
        
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-20 transition-opacity blur-xl -z-10`} />
      </div>
    </div>
  );
  
  if (game.available) {
    return <Link href={game.href}>{content}</Link>;
  }
  
  return content;
};

// Главная страница игр
const GamesPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            🎮 Игровая Зона
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Бесплатные мини-игры для развлечения. Открывай кейсы, избегай бомб и 
            получай виртуальные награды!
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="text-2xl font-bold text-white">24</span>
              <span className="text-white/70 ml-2">кейса</span>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="text-2xl font-bold text-white">2</span>
              <span className="text-white/70 ml-2">игры</span>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="text-2xl font-bold text-green-400">100%</span>
              <span className="text-white/70 ml-2">бесплатно</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Games Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
      
      {/* Info Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">ℹ️ Информация</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-white/70">
            <div>
              <h3 className="text-white font-semibold mb-2">🎁 Кейсы</h3>
              <p className="text-sm">
                24 уникальных тематических кейса: Япония, K-Pop, Ретро 80s, Космос, Киберпанк, 
                Природа, Огонь, Океан, Золото, Неон, Готика, Минимализм, Граффити, Египет, 
                Викинги, Самураи, Драконы, Игры, Музыка, Кристаллы, Рождество, Хэллоуин, 
                Сакура и Стимпанк!
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">💣 Бомбер</h3>
              <p className="text-sm">
                Стратегическая игра на риск. Выбирай путь через 8 рядов, избегая бомб. 
                Множитель растёт с каждым рядом до ×6.8! Забери выигрыш в любой момент 
                или рискни ради большего.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-yellow-400 text-sm text-center">
              ⚠️ Все награды и валюта виртуальные и не имеют реальной ценности. 
              Игры созданы исключительно для развлечения!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
