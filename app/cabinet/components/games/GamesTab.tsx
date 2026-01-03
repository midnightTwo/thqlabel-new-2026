'use client';
import React, { useState } from 'react';
import CasesGame from './CasesGame';
import BomberGame from './BomberGame';

interface GamesTabProps {
  isLight?: boolean;
}

export default function GamesTab({ isLight = false }: GamesTabProps) {
  const [activeGame, setActiveGame] = useState<'cases' | 'bomber'>('cases');

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-black ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
            🎮 Мини-игры
          </h2>
          <p className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'} mt-1`}>
            Бесплатные игры для развлечения
          </p>
        </div>
        
        {/* Переключатель игр */}
        <div className={`flex gap-2 p-1 rounded-2xl ${isLight ? 'bg-white/60' : 'bg-white/5'} backdrop-blur-xl`}>
          <button
            onClick={() => setActiveGame('cases')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              activeGame === 'cases'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                : isLight ? 'text-[#5c5580] hover:bg-white/50' : 'text-zinc-400 hover:bg-white/10'
            }`}
          >
            🎰 Кейсы
          </button>
          <button
            onClick={() => setActiveGame('bomber')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              activeGame === 'bomber'
                ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
                : isLight ? 'text-[#5c5580] hover:bg-white/50' : 'text-zinc-400 hover:bg-white/10'
            }`}
          >
            💣 Бомбер
          </button>
        </div>
      </div>

      {/* Активная игра */}
      {activeGame === 'cases' && <CasesGame isLight={isLight} />}
      {activeGame === 'bomber' && <BomberGame isLight={isLight} />}
    </div>
  );
}
