"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CaseIcon } from '../../../components/icons/CaseIcons';

// Определения кейсов
export interface CaseItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  theme: string;
  rewards: CaseReward[];
  cost: number; // Фейковая валюта
  cooldown: number; // Время ожидания в секундах
}

export interface CaseReward {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  chance: number; // Шанс выпадения в процентах
  value: number; // Фейковые монеты
}

// Цвета редкости
export const rarityColors = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500', text: 'text-gray-400', glow: 'shadow-gray-500/30' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
};

export const rarityNames = {
  common: 'Обычный',
  uncommon: 'Необычный', 
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
};

// Генерация наград для кейса
const generateRewards = (theme: string): CaseReward[] => {
  const baseRewards = [
    { name: `${theme} Стикер`, icon: '🎨', rarity: 'common' as const, chance: 40, value: 10 },
    { name: `${theme} Аватар`, icon: '👤', rarity: 'common' as const, chance: 25, value: 25 },
    { name: `${theme} Рамка`, icon: '🖼️', rarity: 'uncommon' as const, chance: 15, value: 50 },
    { name: `${theme} Баннер`, icon: '🏳️', rarity: 'rare' as const, chance: 10, value: 100 },
    { name: `${theme} Эффект`, icon: '✨', rarity: 'epic' as const, chance: 7, value: 250 },
    { name: `${theme} Уникальный`, icon: '💎', rarity: 'legendary' as const, chance: 3, value: 500 },
  ];
  
  return baseRewards.map((r, i) => ({ ...r, id: `${theme}-${i}` }));
};

// Все кейсы
export const allCases: CaseItem[] = [
  {
    id: 'japan',
    name: 'Японский Кейс',
    description: 'Погрузитесь в атмосферу Страны восходящего солнца',
    icon: 'Japan',
    rarity: 'rare',
    theme: 'Японский',
    rewards: generateRewards('Японский'),
    cost: 0,
    cooldown: 30,
  },
  {
    id: 'bts',
    name: 'K-Pop Кейс',
    description: 'Всё для фанатов корейской поп-музыки',
    icon: 'BTS',
    rarity: 'epic',
    theme: 'K-Pop',
    rewards: generateRewards('K-Pop'),
    cost: 0,
    cooldown: 45,
  },
  {
    id: 'retro',
    name: 'Ретро 80s Кейс',
    description: 'Неоновые огни и синтвейв вайбы',
    icon: 'Retro',
    rarity: 'rare',
    theme: 'Ретро',
    rewards: generateRewards('Ретро'),
    cost: 0,
    cooldown: 30,
  },
  {
    id: 'space',
    name: 'Космический Кейс',
    description: 'Исследуйте галактики и туманности',
    icon: 'Space',
    rarity: 'epic',
    theme: 'Космический',
    rewards: generateRewards('Космический'),
    cost: 0,
    cooldown: 60,
  },
  {
    id: 'cyberpunk',
    name: 'Киберпанк Кейс',
    description: 'Высокие технологии, низкая жизнь',
    icon: 'Cyberpunk',
    rarity: 'legendary',
    theme: 'Киберпанк',
    rewards: generateRewards('Киберпанк'),
    cost: 0,
    cooldown: 90,
  },
  {
    id: 'nature',
    name: 'Природный Кейс',
    description: 'Красота дикой природы',
    icon: 'Nature',
    rarity: 'common',
    theme: 'Природный',
    rewards: generateRewards('Природный'),
    cost: 0,
    cooldown: 15,
  },
  {
    id: 'fire',
    name: 'Огненный Кейс',
    description: 'Пламя и страсть',
    icon: 'Fire',
    rarity: 'rare',
    theme: 'Огненный',
    rewards: generateRewards('Огненный'),
    cost: 0,
    cooldown: 30,
  },
  {
    id: 'ocean',
    name: 'Океанский Кейс',
    description: 'Глубины морей',
    icon: 'Ocean',
    rarity: 'uncommon',
    theme: 'Океанский',
    rewards: generateRewards('Океанский'),
    cost: 0,
    cooldown: 20,
  },
  {
    id: 'gold',
    name: 'Золотой Кейс',
    description: 'Роскошь и богатство',
    icon: 'Gold',
    rarity: 'legendary',
    theme: 'Золотой',
    rewards: generateRewards('Золотой'),
    cost: 0,
    cooldown: 120,
  },
  {
    id: 'neon',
    name: 'Неоновый Кейс',
    description: 'Светящиеся в темноте',
    icon: 'Neon',
    rarity: 'epic',
    theme: 'Неоновый',
    rewards: generateRewards('Неоновый'),
    cost: 0,
    cooldown: 45,
  },
  {
    id: 'gothic',
    name: 'Готический Кейс',
    description: 'Тёмная эстетика',
    icon: 'Gothic',
    rarity: 'rare',
    theme: 'Готический',
    rewards: generateRewards('Готический'),
    cost: 0,
    cooldown: 35,
  },
  {
    id: 'minimal',
    name: 'Минималистичный Кейс',
    description: 'Простота - это элегантность',
    icon: 'Minimal',
    rarity: 'common',
    theme: 'Минимал',
    rewards: generateRewards('Минимал'),
    cost: 0,
    cooldown: 10,
  },
  {
    id: 'graffiti',
    name: 'Граффити Кейс',
    description: 'Уличное искусство',
    icon: 'Graffiti',
    rarity: 'uncommon',
    theme: 'Граффити',
    rewards: generateRewards('Граффити'),
    cost: 0,
    cooldown: 25,
  },
  {
    id: 'egypt',
    name: 'Египетский Кейс',
    description: 'Тайны древних пирамид',
    icon: 'Egypt',
    rarity: 'epic',
    theme: 'Египетский',
    rewards: generateRewards('Египетский'),
    cost: 0,
    cooldown: 50,
  },
  {
    id: 'viking',
    name: 'Кейс Викингов',
    description: 'Северные воины',
    icon: 'Viking',
    rarity: 'rare',
    theme: 'Викинг',
    rewards: generateRewards('Викинг'),
    cost: 0,
    cooldown: 40,
  },
  {
    id: 'samurai',
    name: 'Кейс Самурая',
    description: 'Путь воина',
    icon: 'Samurai',
    rarity: 'epic',
    theme: 'Самурай',
    rewards: generateRewards('Самурай'),
    cost: 0,
    cooldown: 55,
  },
  {
    id: 'dragon',
    name: 'Кейс Дракона',
    description: 'Мифические существа',
    icon: 'Dragon',
    rarity: 'legendary',
    theme: 'Дракон',
    rewards: generateRewards('Дракон'),
    cost: 0,
    cooldown: 100,
  },
  {
    id: 'gaming',
    name: 'Игровой Кейс',
    description: 'Для настоящих геймеров',
    icon: 'Gaming',
    rarity: 'rare',
    theme: 'Игровой',
    rewards: generateRewards('Игровой'),
    cost: 0,
    cooldown: 30,
  },
  {
    id: 'music',
    name: 'Музыкальный Кейс',
    description: 'Ритмы и мелодии',
    icon: 'Music',
    rarity: 'uncommon',
    theme: 'Музыкальный',
    rewards: generateRewards('Музыкальный'),
    cost: 0,
    cooldown: 20,
  },
  {
    id: 'crystal',
    name: 'Кристальный Кейс',
    description: 'Драгоценные камни',
    icon: 'Crystal',
    rarity: 'epic',
    theme: 'Кристальный',
    rewards: generateRewards('Кристальный'),
    cost: 0,
    cooldown: 60,
  },
  {
    id: 'christmas',
    name: 'Рождественский Кейс',
    description: 'Праздничное настроение',
    icon: 'Christmas',
    rarity: 'rare',
    theme: 'Рождественский',
    rewards: generateRewards('Рождественский'),
    cost: 0,
    cooldown: 30,
  },
  {
    id: 'halloween',
    name: 'Хэллоуин Кейс',
    description: 'Жуткие сюрпризы',
    icon: 'Halloween',
    rarity: 'epic',
    theme: 'Хэллоуин',
    rewards: generateRewards('Хэллоуин'),
    cost: 0,
    cooldown: 45,
  },
  {
    id: 'sakura',
    name: 'Сакура Кейс',
    description: 'Весеннее цветение',
    icon: 'Sakura',
    rarity: 'rare',
    theme: 'Сакура',
    rewards: generateRewards('Сакура'),
    cost: 0,
    cooldown: 35,
  },
  {
    id: 'steampunk',
    name: 'Стимпанк Кейс',
    description: 'Механика и пар',
    icon: 'Steampunk',
    rarity: 'legendary',
    theme: 'Стимпанк',
    rewards: generateRewards('Стимпанк'),
    cost: 0,
    cooldown: 80,
  },
];

// Компонент рулетки
interface CaseRouletteProps {
  rewards: CaseReward[];
  isSpinning: boolean;
  wonReward: CaseReward | null;
  onSpinEnd: () => void;
}

const CaseRoulette: React.FC<CaseRouletteProps> = ({ rewards, isSpinning, wonReward, onSpinEnd }) => {
  const [offset, setOffset] = useState(0);
  const itemWidth = 120;
  const visibleItems = 7;
  
  // Создаём длинный список для рулетки
  const extendedRewards = React.useMemo(() => {
    const extended: CaseReward[] = [];
    for (let i = 0; i < 50; i++) {
      extended.push(...rewards.sort(() => Math.random() - 0.5));
    }
    if (wonReward) {
      extended[Math.floor(extended.length * 0.8)] = wonReward;
    }
    return extended;
  }, [rewards, wonReward]);
  
  useEffect(() => {
    if (isSpinning && wonReward) {
      const targetIndex = Math.floor(extendedRewards.length * 0.8);
      const targetOffset = targetIndex * itemWidth - (visibleItems * itemWidth) / 2 + itemWidth / 2;
      
      // Анимация
      setOffset(0);
      setTimeout(() => {
        setOffset(targetOffset);
      }, 50);
      
      // Конец анимации
      setTimeout(() => {
        onSpinEnd();
      }, 4000);
    }
  }, [isSpinning, wonReward, extendedRewards.length, itemWidth, visibleItems, onSpinEnd]);
  
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 p-4">
      {/* Указатель */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400" />
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-l-transparent border-r-transparent border-b-yellow-400" />
      </div>
      
      {/* Градиенты по краям */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />
      
      {/* Рулетка */}
      <div 
        className="flex gap-2 py-4"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)' : 'none',
        }}
      >
        {extendedRewards.map((reward, index) => {
          const colors = rarityColors[reward.rarity];
          return (
            <div
              key={index}
              className={`flex-shrink-0 w-[110px] h-[130px] rounded-lg border-2 ${colors.border} ${colors.bg} flex flex-col items-center justify-center gap-2 transition-all`}
            >
              <span className="text-3xl">{reward.icon}</span>
              <span className="text-xs text-white/80 text-center px-2 line-clamp-2">{reward.name}</span>
              <span className={`text-xs ${colors.text}`}>+{reward.value} 💰</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Компонент карточки кейса
interface CaseCardProps {
  caseItem: CaseItem;
  onOpen: (caseItem: CaseItem) => void;
  cooldowns: Record<string, number>;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseItem, onOpen, cooldowns }) => {
  const colors = rarityColors[caseItem.rarity];
  const cooldownRemaining = cooldowns[caseItem.id] || 0;
  const isOnCooldown = cooldownRemaining > 0;
  
  return (
    <div 
      className={`group relative rounded-2xl border-2 ${colors.border} ${colors.bg} backdrop-blur-sm p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg ${colors.glow} cursor-pointer`}
      onClick={() => !isOnCooldown && onOpen(caseItem)}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl ${colors.bg}`} />
      
      <div className="relative z-10">
        {/* Иконка */}
        <div className="w-20 h-20 mx-auto mb-3">
          <CaseIcon type={caseItem.icon as any} className="w-full h-full" />
        </div>
        
        {/* Название */}
        <h3 className="text-white font-bold text-center mb-1">{caseItem.name}</h3>
        
        {/* Редкость */}
        <div className={`text-xs ${colors.text} text-center mb-2`}>
          {rarityNames[caseItem.rarity]}
        </div>
        
        {/* Описание */}
        <p className="text-white/60 text-xs text-center mb-3 line-clamp-2">{caseItem.description}</p>
        
        {/* Кнопка */}
        {isOnCooldown ? (
          <div className="w-full py-2 px-4 rounded-lg bg-gray-600/50 text-gray-400 text-center text-sm">
            ⏱️ {Math.ceil(cooldownRemaining)}с
          </div>
        ) : (
          <button className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:from-green-400 hover:to-emerald-500 transition-all`}>
            🎁 Открыть бесплатно
          </button>
        )}
      </div>
    </div>
  );
};

// Модальное окно открытия кейса
interface CaseModalProps {
  caseItem: CaseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onClaim: (reward: CaseReward, caseId: string) => void;
}

const CaseModal: React.FC<CaseModalProps> = ({ caseItem, isOpen, onClose, onClaim }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<CaseReward | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const spinCase = useCallback(() => {
    if (!caseItem || isSpinning) return;
    
    // Выбираем награду на основе шансов
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedReward = caseItem.rewards[0];
    
    for (const reward of caseItem.rewards) {
      cumulative += reward.chance;
      if (random <= cumulative) {
        selectedReward = reward;
        break;
      }
    }
    
    setWonReward(selectedReward);
    setIsSpinning(true);
    setShowResult(false);
  }, [caseItem, isSpinning]);
  
  const handleSpinEnd = useCallback(() => {
    setIsSpinning(false);
    setShowResult(true);
  }, []);
  
  const handleClaim = useCallback(() => {
    if (wonReward && caseItem) {
      onClaim(wonReward, caseItem.id);
      setWonReward(null);
      setShowResult(false);
      onClose();
    }
  }, [wonReward, caseItem, onClaim, onClose]);
  
  const handleClose = useCallback(() => {
    if (!isSpinning) {
      setWonReward(null);
      setShowResult(false);
      onClose();
    }
  }, [isSpinning, onClose]);
  
  if (!isOpen || !caseItem) return null;
  
  const colors = rarityColors[caseItem.rarity];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-3xl bg-gradient-to-b from-gray-900 to-black rounded-3xl border-2 ${colors.border} p-6 shadow-2xl ${colors.glow}`}>
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          disabled={isSpinning}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3">
            <CaseIcon type={caseItem.icon as any} className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-white">{caseItem.name}</h2>
          <p className={`text-sm ${colors.text}`}>{rarityNames[caseItem.rarity]}</p>
        </div>
        
        {/* Roulette */}
        <CaseRoulette 
          rewards={caseItem.rewards}
          isSpinning={isSpinning}
          wonReward={wonReward}
          onSpinEnd={handleSpinEnd}
        />
        
        {/* Result */}
        {showResult && wonReward && (
          <div className="mt-6 text-center animate-bounce-in">
            <div className={`inline-block p-6 rounded-2xl border-2 ${rarityColors[wonReward.rarity].border} ${rarityColors[wonReward.rarity].bg}`}>
              <span className="text-5xl block mb-3">{wonReward.icon}</span>
              <h3 className="text-xl font-bold text-white mb-1">{wonReward.name}</h3>
              <p className={`text-lg ${rarityColors[wonReward.rarity].text}`}>+{wonReward.value} 💰</p>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          {!isSpinning && !showResult && (
            <button
              onClick={spinCase}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:from-green-400 hover:to-emerald-500 transition-all transform hover:scale-105"
            >
              🎰 Крутить!
            </button>
          )}
          
          {showResult && (
            <button
              onClick={handleClaim}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-lg hover:from-yellow-400 hover:to-orange-500 transition-all transform hover:scale-105"
            >
              ✨ Забрать награду
            </button>
          )}
        </div>
        
        {/* Шансы */}
        {!isSpinning && !showResult && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {caseItem.rewards.map((reward) => (
              <div key={reward.id} className={`p-2 rounded-lg ${rarityColors[reward.rarity].bg} border ${rarityColors[reward.rarity].border} flex items-center gap-2`}>
                <span className="text-lg">{reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{reward.name}</p>
                  <p className={`text-xs ${rarityColors[reward.rarity].text}`}>{reward.chance}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Главный компонент кейсов
const CasesGame: React.FC = () => {
  const [balance, setBalance] = useState(1000);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [inventory, setInventory] = useState<CaseReward[]>([]);
  const [filter, setFilter] = useState<'all' | CaseItem['rarity']>('all');
  
  // Обновление кулдаунов
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns(prev => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key] > 0) {
            updated[key] -= 1;
          }
        }
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleOpenCase = (caseItem: CaseItem) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
  };
  
  const handleClaimReward = (reward: CaseReward, caseId: string) => {
    setBalance(prev => prev + reward.value);
    setInventory(prev => [...prev, reward]);
    setCooldowns(prev => ({
      ...prev,
      [caseId]: allCases.find(c => c.id === caseId)?.cooldown || 30,
    }));
  };
  
  const filteredCases = filter === 'all' 
    ? allCases 
    : allCases.filter(c => c.rarity === filter);
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🎁 Кейсы
          </h1>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/50">
              <span className="text-yellow-400 font-bold">💰 {balance.toLocaleString()}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/50">
              <span className="text-purple-400 font-bold">📦 {inventory.length} предметов</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all' 
                ? 'bg-white text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Все ({allCases.length})
          </button>
          {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map((rarity) => {
            const count = allCases.filter(c => c.rarity === rarity).length;
            return (
              <button
                key={rarity}
                onClick={() => setFilter(rarity)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === rarity 
                    ? `${rarityColors[rarity].bg} ${rarityColors[rarity].text} border ${rarityColors[rarity].border}` 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {rarityNames[rarity]} ({count})
              </button>
            );
          })}
        </div>
        
        {/* Cases Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCases.map((caseItem) => (
            <CaseCard 
              key={caseItem.id}
              caseItem={caseItem}
              onOpen={handleOpenCase}
              cooldowns={cooldowns}
            />
          ))}
        </div>
        
        {/* Inventory */}
        {inventory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">📦 Ваш инвентарь</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {inventory.slice(-24).reverse().map((item, index) => {
                const colors = rarityColors[item.rarity];
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${colors.border} ${colors.bg} flex flex-col items-center`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs text-white/60 text-center mt-1 line-clamp-1">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal */}
      <CaseModal
        caseItem={selectedCase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClaim={handleClaimReward}
      />
      
      {/* Custom styles */}
      <style jsx global>{`
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CasesGame;
