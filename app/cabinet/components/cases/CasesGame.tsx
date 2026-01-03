'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

// Типы наград
interface Reward {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
  icon: string;
  color: string;
  gradient: string;
  chance: number;
}

// Награды музыкального лейбла
const REWARDS: Reward[] = [
  { id: '1', name: '+10 ₽', rarity: 'common', value: 10, icon: '💰', color: '#9ca3af', gradient: 'from-gray-400 to-gray-500', chance: 35 },
  { id: '2', name: '+25 ₽', rarity: 'common', value: 25, icon: '💵', color: '#9ca3af', gradient: 'from-gray-400 to-gray-600', chance: 25 },
  { id: '3', name: '+50 ₽', rarity: 'uncommon', value: 50, icon: '🎵', color: '#22c55e', gradient: 'from-green-400 to-emerald-500', chance: 18 },
  { id: '4', name: '+100 ₽', rarity: 'uncommon', value: 100, icon: '🎶', color: '#22c55e', gradient: 'from-emerald-400 to-teal-500', chance: 10 },
  { id: '5', name: '+250 ₽', rarity: 'rare', value: 250, icon: '🎤', color: '#3b82f6', gradient: 'from-blue-400 to-indigo-500', chance: 6 },
  { id: '6', name: '+500 ₽', rarity: 'rare', value: 500, icon: '🎧', color: '#3b82f6', gradient: 'from-indigo-400 to-purple-500', chance: 3 },
  { id: '7', name: '+1000 ₽', rarity: 'epic', value: 1000, icon: '🏆', color: '#a855f7', gradient: 'from-purple-400 to-pink-500', chance: 2 },
  { id: '8', name: '+2500 ₽', rarity: 'legendary', value: 2500, icon: '💎', color: '#f59e0b', gradient: 'from-amber-400 to-orange-500', chance: 0.8 },
  { id: '9', name: '+5000 ₽', rarity: 'legendary', value: 5000, icon: '👑', color: '#f59e0b', gradient: 'from-yellow-400 to-amber-500', chance: 0.2 },
];

// Типы кейсов
interface CaseType {
  id: string;
  name: string;
  price: number;
  icon: string;
  gradient: string;
  rewards: Reward[];
  multiplier: number;
}

const CASE_TYPES: CaseType[] = [
  {
    id: 'basic',
    name: 'Базовый кейс',
    price: 50,
    icon: '📦',
    gradient: 'from-gray-500 to-zinc-600',
    rewards: REWARDS.filter(r => ['common', 'uncommon'].includes(r.rarity)),
    multiplier: 1,
  },
  {
    id: 'premium',
    name: 'Премиум кейс',
    price: 150,
    icon: '🎁',
    gradient: 'from-purple-500 to-violet-600',
    rewards: REWARDS.filter(r => ['uncommon', 'rare', 'epic'].includes(r.rarity)),
    multiplier: 2,
  },
  {
    id: 'legendary',
    name: 'Легендарный кейс',
    price: 500,
    icon: '✨',
    gradient: 'from-amber-400 to-orange-500',
    rewards: REWARDS,
    multiplier: 3,
  },
];

interface CasesGameProps {
  userId: string;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  isLight?: boolean;
}

export default function CasesGame({ 
  userId, 
  balance, 
  onBalanceChange, 
  showNotification,
  isLight = false 
}: CasesGameProps) {
  const [selectedCase, setSelectedCase] = useState<CaseType>(CASE_TYPES[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wonReward, setWonReward] = useState<Reward | null>(null);
  const [reelItems, setReelItems] = useState<Reward[]>([]);
  const [history, setHistory] = useState<{ reward: Reward; timestamp: Date }[]>([]);
  const reelRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  // Генерация случайной награды на основе шансов
  const getRandomReward = useCallback((caseType: CaseType): Reward => {
    const rewards = caseType.rewards;
    const totalChance = rewards.reduce((sum, r) => sum + r.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const reward of rewards) {
      random -= reward.chance;
      if (random <= 0) {
        return { ...reward, value: Math.round(reward.value * caseType.multiplier) };
      }
    }
    return { ...rewards[0], value: Math.round(rewards[0].value * caseType.multiplier) };
  }, []);

  // Генерация элементов для барабана
  const generateReelItems = useCallback((winningReward: Reward, caseType: CaseType): Reward[] => {
    const items: Reward[] = [];
    const totalItems = 50;
    const winPosition = 42; // Позиция выигрыша ближе к концу

    for (let i = 0; i < totalItems; i++) {
      if (i === winPosition) {
        items.push(winningReward);
      } else {
        const randomReward = caseType.rewards[Math.floor(Math.random() * caseType.rewards.length)];
        items.push({ ...randomReward, value: Math.round(randomReward.value * caseType.multiplier) });
      }
    }
    return items;
  }, []);

  // Открытие кейса
  const openCase = async () => {
    if (balance < selectedCase.price) {
      showNotification('Недостаточно средств!', 'error');
      return;
    }

    if (isSpinning) return;

    // Списываем стоимость
    const newBalance = balance - selectedCase.price;
    onBalanceChange(newBalance);

    setIsSpinning(true);
    setShowResult(false);
    setWonReward(null);

    // Определяем выигрыш
    const reward = getRandomReward(selectedCase);
    const items = generateReelItems(reward, selectedCase);
    setReelItems(items);

    // Сбрасываем позицию
    setOffset(0);

    // Запускаем анимацию после небольшой задержки
    await new Promise(resolve => setTimeout(resolve, 100));

    // Вычисляем финальную позицию (42-й элемент по центру)
    const itemWidth = 120;
    const containerWidth = 600;
    const winPosition = 42;
    const finalOffset = (winPosition * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
    
    setOffset(finalOffset);

    // Ждем окончания анимации
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      setWonReward(reward);
      
      // Начисляем выигрыш
      const finalBalance = newBalance + reward.value;
      onBalanceChange(finalBalance);
      
      // Добавляем в историю
      setHistory(prev => [{ reward, timestamp: new Date() }, ...prev.slice(0, 9)]);
      
      // Уведомление
      if (reward.rarity === 'legendary' || reward.rarity === 'epic') {
        showNotification(`🎉 Поздравляем! Вы выиграли ${reward.name}!`, 'success');
      }
    }, 5000);
  };

  // Быстрое открытие (без анимации)
  const quickOpen = () => {
    if (balance < selectedCase.price) {
      showNotification('Недостаточно средств!', 'error');
      return;
    }

    if (isSpinning) return;

    const newBalance = balance - selectedCase.price;
    const reward = getRandomReward(selectedCase);
    const finalBalance = newBalance + reward.value;
    
    onBalanceChange(finalBalance);
    setWonReward(reward);
    setShowResult(true);
    setHistory(prev => [{ reward, timestamp: new Date() }, ...prev.slice(0, 9)]);

    if (reward.rarity === 'legendary' || reward.rarity === 'epic') {
      showNotification(`🎉 Поздравляем! Вы выиграли ${reward.name}!`, 'success');
    }
  };

  const getRarityLabel = (rarity: string) => {
    const labels: Record<string, string> = {
      common: 'Обычный',
      uncommon: 'Необычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный',
    };
    return labels[rarity] || rarity;
  };

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black ${isLight ? 'text-[#1a1535]' : 'text-white'} cabinet-gradient-text`}>
            🎰 Музыкальные кейсы
          </h2>
          <p className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'} mt-1`}>
            Испытай удачу и выиграй бонусы на баланс!
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl ${isLight ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/50' : 'border-purple-500/20'}`}>
          <span className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>Баланс:</span>
          <span className={`ml-2 text-lg font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{balance.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Выбор кейса */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CASE_TYPES.map((caseType) => (
          <button
            key={caseType.id}
            onClick={() => !isSpinning && setSelectedCase(caseType)}
            disabled={isSpinning}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedCase.id === caseType.id
                ? isLight
                  ? 'border-purple-400 bg-purple-50/80 scale-105 shadow-xl shadow-purple-500/20'
                  : 'border-purple-500 bg-purple-500/10 scale-105 shadow-xl shadow-purple-500/30'
                : isLight
                  ? 'border-white/60 bg-white/50 hover:border-purple-300 hover:bg-purple-50/50'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/5'
            } ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Блик */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${caseType.gradient} opacity-10`} />
            
            <div className="relative z-10">
              <div className="text-5xl mb-3">{caseType.icon}</div>
              <h3 className={`font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>{caseType.name}</h3>
              <p className={`text-2xl font-black mt-2 bg-gradient-to-r ${caseType.gradient} bg-clip-text text-transparent`}>
                {caseType.price} ₽
              </p>
              {caseType.multiplier > 1 && (
                <span className={`inline-block mt-2 px-2 py-1 rounded-lg text-xs font-bold ${
                  isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  x{caseType.multiplier} множитель
                </span>
              )}
            </div>

            {/* Индикатор выбора */}
            {selectedCase.id === caseType.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Рулетка */}
      <div className={`relative rounded-3xl overflow-hidden ${isLight ? 'bg-white/70' : 'bg-black/40'} backdrop-blur-xl border ${isLight ? 'border-purple-200/50' : 'border-purple-500/20'} p-6`}>
        {/* Указатель */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
          <div className={`w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent ${
            isLight ? 'border-t-purple-500' : 'border-t-purple-400'
          } drop-shadow-lg`} />
        </div>

        {/* Лента с наградами */}
        <div className="relative h-32 overflow-hidden rounded-2xl bg-gradient-to-r from-black/20 via-transparent to-black/20">
          {/* Градиентные края */}
          <div className={`absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r ${isLight ? 'from-white/90 to-transparent' : 'from-black/90 to-transparent'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l ${isLight ? 'from-white/90 to-transparent' : 'from-black/90 to-transparent'}`} />
          
          {/* Барабан */}
          <div 
            ref={reelRef}
            className="flex items-center h-full"
            style={{
              transform: `translateX(-${offset}px)`,
              transition: isSpinning ? 'transform 5s cubic-bezier(0.15, 0.85, 0.3, 1)' : 'none',
            }}
          >
            {reelItems.map((item, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-[120px] h-28 mx-1 rounded-xl flex flex-col items-center justify-center border-2 ${
                  isLight ? 'bg-white/80 border-gray-200' : 'bg-zinc-800/80 border-zinc-700'
                }`}
                style={{
                  borderColor: item.color,
                  boxShadow: `0 0 20px ${item.color}40`,
                }}
              >
                <span className="text-3xl">{item.icon}</span>
                <span className={`text-sm font-bold mt-1 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                  {item.name}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 bg-gradient-to-r ${item.gradient} text-white`}>
                  {getRarityLabel(item.rarity)}
                </span>
              </div>
            ))}
          </div>

          {/* Центральная линия */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-purple-500 to-transparent z-10 opacity-50" />
        </div>

        {/* Результат */}
        {showResult && wonReward && (
          <div className="mt-6 text-center">
            <div 
              className={`inline-block px-8 py-4 rounded-2xl ${isLight ? 'bg-white/80' : 'bg-black/40'} border-2`}
              style={{ 
                borderColor: wonReward.color,
                boxShadow: `0 0 40px ${wonReward.color}60`,
              }}
            >
              <div className="text-4xl mb-2">{wonReward.icon}</div>
              <div className={`text-2xl font-black bg-gradient-to-r ${wonReward.gradient} bg-clip-text text-transparent`}>
                {wonReward.name}
              </div>
              <div className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'} mt-1`}>
                {getRarityLabel(wonReward.rarity)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={openCase}
          disabled={isSpinning || balance < selectedCase.price}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
            isSpinning || balance < selectedCase.price
              ? 'bg-gray-500 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30'
          } text-white`}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Крутится...
            </span>
          ) : (
            `🎰 Открыть за ${selectedCase.price} ₽`
          )}
        </button>

        <button
          onClick={quickOpen}
          disabled={isSpinning || balance < selectedCase.price}
          className={`px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
            isSpinning || balance < selectedCase.price
              ? 'bg-gray-500 cursor-not-allowed opacity-50'
              : isLight
                ? 'bg-white/70 hover:bg-white border border-purple-200 text-purple-600 hover:scale-105'
                : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white hover:scale-105'
          }`}
        >
          ⚡ Быстро
        </button>
      </div>

      {/* Шансы выпадения */}
      <div className={`rounded-2xl p-6 ${isLight ? 'bg-white/50' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'}`}>
        <h3 className={`font-bold mb-4 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>📊 Возможные награды ({selectedCase.name})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {selectedCase.rewards.map((reward) => (
            <div 
              key={reward.id}
              className={`p-3 rounded-xl text-center ${isLight ? 'bg-white/70' : 'bg-black/30'} border`}
              style={{ borderColor: `${reward.color}40` }}
            >
              <div className="text-2xl">{reward.icon}</div>
              <div className={`text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                +{Math.round(reward.value * selectedCase.multiplier)} ₽
              </div>
              <div className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block bg-gradient-to-r ${reward.gradient} text-white`}>
                {reward.chance}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* История */}
      {history.length > 0 && (
        <div className={`rounded-2xl p-6 ${isLight ? 'bg-white/50' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'}`}>
          <h3 className={`font-bold mb-4 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>📜 История открытий</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isLight ? 'bg-white/70' : 'bg-black/30'} border`}
                style={{ borderColor: `${item.reward.color}40` }}
              >
                <span className="text-xl">{item.reward.icon}</span>
                <span className={`font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>{item.reward.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Предупреждение */}
      <div className={`text-center text-xs ${isLight ? 'text-[#8a85a0]' : 'text-zinc-600'}`}>
        ⚠️ Игра предназначена только для развлечения. Выигрыши начисляются на внутренний баланс.
      </div>
    </div>
  );
}
