'use client';
import React, { useState, useCallback } from 'react';

// SVG Иконки для наград
const RewardIcons = {
  coin: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#fbbf24"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold">$</text></svg>,
  star: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  music: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>,
  heart: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  diamond: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#60a5fa"><path d="M6 2l-6 8 12 12 12-12-6-8H6zm1.5 2h9l4 5.33L12 18.67 3.5 9.33 7.5 4z"/><path d="M12 18.67L3.5 9.33h17L12 18.67z" fill="#93c5fd"/></svg>,
  crown: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#fbbf24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/><rect x="5" y="18" width="14" height="3" rx="1"/></svg>,
  fire: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#f97316"><path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.71 5.25-8.22.89-.42 1.91.37 1.72 1.33-.16.8-.22 1.63-.18 2.44.04.76.65 1.35 1.38 1.38 1.6.07 3.03-.71 3.83-2.05.36-.6 1.17-.73 1.7-.28C19.3 10.67 21 13.33 21 16c0 4.42-4.03 8-9 9z"/></svg>,
  bolt: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#fbbf24"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.1-.16L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15L11 21z"/></svg>,
};

// Темы кейсов
const CASE_THEMES = [
  { id: 'japan', name: '🇯🇵 Япония', gradient: 'from-red-500 to-pink-500', bg: 'bg-gradient-to-br from-red-900/20 to-pink-900/20' },
  { id: 'kpop', name: '🎤 K-Pop', gradient: 'from-purple-500 to-pink-500', bg: 'bg-gradient-to-br from-purple-900/20 to-pink-900/20' },
  { id: 'hiphop', name: '🎧 Hip-Hop', gradient: 'from-amber-500 to-orange-600', bg: 'bg-gradient-to-br from-amber-900/20 to-orange-900/20' },
  { id: 'rock', name: '🎸 Rock', gradient: 'from-gray-600 to-red-600', bg: 'bg-gradient-to-br from-gray-900/20 to-red-900/20' },
  { id: 'electronic', name: '⚡ Electronic', gradient: 'from-cyan-500 to-blue-600', bg: 'bg-gradient-to-br from-cyan-900/20 to-blue-900/20' },
  { id: 'jazz', name: '🎷 Jazz', gradient: 'from-yellow-600 to-amber-700', bg: 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20' },
  { id: 'classical', name: '🎻 Classical', gradient: 'from-slate-500 to-zinc-600', bg: 'bg-gradient-to-br from-slate-900/20 to-zinc-900/20' },
  { id: 'latin', name: '💃 Latin', gradient: 'from-orange-500 to-red-500', bg: 'bg-gradient-to-br from-orange-900/20 to-red-900/20' },
  { id: 'indie', name: '🌿 Indie', gradient: 'from-green-500 to-emerald-600', bg: 'bg-gradient-to-br from-green-900/20 to-emerald-900/20' },
  { id: 'rnb', name: '💜 R&B', gradient: 'from-violet-500 to-purple-600', bg: 'bg-gradient-to-br from-violet-900/20 to-purple-900/20' },
  { id: 'country', name: '🤠 Country', gradient: 'from-amber-600 to-yellow-700', bg: 'bg-gradient-to-br from-amber-900/20 to-yellow-900/20' },
  { id: 'reggae', name: '🌴 Reggae', gradient: 'from-green-500 to-yellow-500', bg: 'bg-gradient-to-br from-green-900/20 to-yellow-900/20' },
  { id: 'metal', name: '🤘 Metal', gradient: 'from-zinc-700 to-black', bg: 'bg-gradient-to-br from-zinc-900/30 to-black/30' },
  { id: 'disco', name: '🪩 Disco', gradient: 'from-pink-500 to-purple-500', bg: 'bg-gradient-to-br from-pink-900/20 to-purple-900/20' },
  { id: 'soul', name: '🎙️ Soul', gradient: 'from-rose-600 to-red-700', bg: 'bg-gradient-to-br from-rose-900/20 to-red-900/20' },
  { id: 'anime', name: '🌸 Anime', gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-900/20 to-rose-900/20' },
  { id: 'lofi', name: '🌙 Lo-Fi', gradient: 'from-indigo-500 to-purple-600', bg: 'bg-gradient-to-br from-indigo-900/20 to-purple-900/20' },
  { id: 'trap', name: '🔥 Trap', gradient: 'from-red-600 to-orange-500', bg: 'bg-gradient-to-br from-red-900/20 to-orange-900/20' },
  { id: 'phonk', name: '🏎️ Phonk', gradient: 'from-purple-700 to-red-600', bg: 'bg-gradient-to-br from-purple-900/20 to-red-900/20' },
  { id: 'bts', name: '💜 BTS', gradient: 'from-purple-500 to-violet-600', bg: 'bg-gradient-to-br from-purple-900/20 to-violet-900/20' },
];

// Награды
const REWARDS = [
  { name: 'Монетка', icon: 'coin', rarity: 'common', color: '#fbbf24' },
  { name: 'Звезда', icon: 'star', rarity: 'common', color: '#fbbf24' },
  { name: 'Нота', icon: 'music', rarity: 'uncommon', color: '#8b5cf6' },
  { name: 'Сердце', icon: 'heart', rarity: 'uncommon', color: '#ef4444' },
  { name: 'Молния', icon: 'bolt', rarity: 'rare', color: '#f59e0b' },
  { name: 'Огонь', icon: 'fire', rarity: 'rare', color: '#f97316' },
  { name: 'Алмаз', icon: 'diamond', rarity: 'epic', color: '#60a5fa' },
  { name: 'Корона', icon: 'crown', rarity: 'legendary', color: '#fbbf24' },
];

interface CasesGameProps {
  isLight?: boolean;
}

export default function CasesGame({ isLight = false }: CasesGameProps) {
  const [selectedTheme, setSelectedTheme] = useState(CASE_THEMES[0]);
  const [isOpening, setIsOpening] = useState(false);
  const [wonReward, setWonReward] = useState<typeof REWARDS[0] | null>(null);
  const [stats, setStats] = useState({ opened: 0, legendary: 0, epic: 0 });

  const getRandomReward = useCallback(() => {
    const rand = Math.random() * 100;
    if (rand < 1) return REWARDS[7]; // legendary 1%
    if (rand < 5) return REWARDS[6]; // epic 4%
    if (rand < 15) return REWARDS[Math.random() > 0.5 ? 4 : 5]; // rare 10%
    if (rand < 40) return REWARDS[Math.random() > 0.5 ? 2 : 3]; // uncommon 25%
    return REWARDS[Math.random() > 0.5 ? 0 : 1]; // common 60%
  }, []);

  const openCase = () => {
    if (isOpening) return;
    setIsOpening(true);
    setWonReward(null);

    setTimeout(() => {
      const reward = getRandomReward();
      setWonReward(reward);
      setIsOpening(false);
      setStats(prev => ({
        opened: prev.opened + 1,
        legendary: prev.legendary + (reward.rarity === 'legendary' ? 1 : 0),
        epic: prev.epic + (reward.rarity === 'epic' ? 1 : 0),
      }));
    }, 2000);
  };

  const rarityColors: Record<string, string> = {
    common: 'text-gray-400 border-gray-400',
    uncommon: 'text-green-400 border-green-400',
    rare: 'text-blue-400 border-blue-400',
    epic: 'text-purple-400 border-purple-400',
    legendary: 'text-amber-400 border-amber-400',
  };

  const rarityNames: Record<string, string> = {
    common: 'Обычный',
    uncommon: 'Необычный',
    rare: 'Редкий',
    epic: 'Эпический',
    legendary: 'Легендарный',
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className={`grid grid-cols-3 gap-4`}>
        {[
          { label: 'Открыто', value: stats.opened, color: 'purple' },
          { label: 'Эпических', value: stats.epic, color: 'violet' },
          { label: 'Легендарных', value: stats.legendary, color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl ${isLight ? 'bg-white/60' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'} text-center`}>
            <div className={`text-2xl font-black text-${stat.color}-500`}>{stat.value}</div>
            <div className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Выбор темы кейса */}
      <div className={`p-4 rounded-2xl ${isLight ? 'bg-white/50' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'}`}>
        <h3 className={`font-bold mb-3 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Выбери тему кейса</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {CASE_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme)}
              className={`p-2 rounded-xl text-center transition-all ${
                selectedTheme.id === theme.id
                  ? `bg-gradient-to-r ${theme.gradient} text-white scale-105 shadow-lg`
                  : isLight ? 'bg-white/70 hover:bg-white' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={theme.name}
            >
              <span className="text-lg">{theme.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Кейс */}
      <div className={`relative p-8 rounded-3xl ${selectedTheme.bg} backdrop-blur-xl border-2 ${isLight ? 'border-white/50' : 'border-white/10'} overflow-hidden`}>
        {/* Анимированный фон */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute inset-0 bg-gradient-to-r ${selectedTheme.gradient} animate-pulse`} />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Кейс */}
          <div 
            className={`w-40 h-40 rounded-3xl bg-gradient-to-br ${selectedTheme.gradient} flex items-center justify-center shadow-2xl transition-transform duration-300 ${isOpening ? 'animate-bounce scale-110' : 'hover:scale-105'}`}
            style={{ boxShadow: `0 0 60px ${selectedTheme.gradient.includes('amber') ? '#f59e0b' : '#8b5cf6'}40` }}
          >
            {isOpening ? (
              <div className="animate-spin">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : wonReward ? (
              <div className="text-center">
                <div style={{ color: wonReward.color }}>
                  {RewardIcons[wonReward.icon as keyof typeof RewardIcons]}
                </div>
              </div>
            ) : (
              <svg className="w-20 h-20 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>

          {/* Название темы */}
          <h3 className={`mt-4 text-xl font-black ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>{selectedTheme.name}</h3>

          {/* Результат */}
          {wonReward && !isOpening && (
            <div className={`mt-4 px-6 py-3 rounded-2xl ${isLight ? 'bg-white/80' : 'bg-black/40'} border-2 ${rarityColors[wonReward.rarity]} text-center`}>
              <div className={`text-lg font-bold ${rarityColors[wonReward.rarity].split(' ')[0]}`}>{wonReward.name}</div>
              <div className={`text-xs ${rarityColors[wonReward.rarity].split(' ')[0]}`}>{rarityNames[wonReward.rarity]}</div>
            </div>
          )}

          {/* Кнопка */}
          <button
            onClick={openCase}
            disabled={isOpening}
            className={`mt-6 px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
              isOpening
                ? 'bg-gray-500 cursor-not-allowed'
                : `bg-gradient-to-r ${selectedTheme.gradient} hover:scale-105 hover:shadow-xl`
            } text-white`}
          >
            {isOpening ? 'Открывается...' : '🎁 Открыть бесплатно'}
          </button>
        </div>
      </div>

      {/* Возможные награды */}
      <div className={`p-4 rounded-2xl ${isLight ? 'bg-white/50' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'}`}>
        <h3 className={`font-bold mb-3 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Возможные награды</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {REWARDS.map((reward, i) => (
            <div key={i} className={`p-3 rounded-xl ${isLight ? 'bg-white/70' : 'bg-black/30'} border ${rarityColors[reward.rarity].split(' ')[1]} text-center`}>
              <div style={{ color: reward.color }} className="flex justify-center">
                {RewardIcons[reward.icon as keyof typeof RewardIcons]}
              </div>
              <div className={`text-[10px] mt-1 ${rarityColors[reward.rarity].split(' ')[0]}`}>{rarityNames[reward.rarity]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
