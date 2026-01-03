'use client';
import React, { useState, useCallback } from 'react';

interface BomberGameProps {
  isLight?: boolean;
}

const GRID_SIZE = 5;
const BOMB_COUNT = 5;

export default function BomberGame({ isLight = false }: BomberGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [bombs, setBombs] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [currentRow, setCurrentRow] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [stats, setStats] = useState({ games: 0, wins: 0, maxMultiplier: 1 });

  const startGame = useCallback(() => {
    const newBombs = new Set<number>();
    for (let row = 0; row < GRID_SIZE; row++) {
      const bombCol = Math.floor(Math.random() * GRID_SIZE);
      newBombs.add(row * GRID_SIZE + bombCol);
    }
    setBombs(newBombs);
    setRevealed(new Set());
    setCurrentRow(0);
    setMultiplier(1);
    setGameState('playing');
  }, []);

  const revealCell = (index: number) => {
    if (gameState !== 'playing') return;
    const row = Math.floor(index / GRID_SIZE);
    if (row !== currentRow) return;

    const newRevealed = new Set(revealed);
    newRevealed.add(index);
    setRevealed(newRevealed);

    if (bombs.has(index)) {
      setGameState('lost');
      // Показать все бомбы
      const allRevealed = new Set(revealed);
      bombs.forEach(b => allRevealed.add(b));
      setRevealed(allRevealed);
      setStats(prev => ({ ...prev, games: prev.games + 1 }));
    } else {
      const newMultiplier = parseFloat((multiplier * 1.2).toFixed(2));
      setMultiplier(newMultiplier);
      
      if (currentRow === GRID_SIZE - 1) {
        setGameState('won');
        setStats(prev => ({
          games: prev.games + 1,
          wins: prev.wins + 1,
          maxMultiplier: Math.max(prev.maxMultiplier, newMultiplier),
        }));
      } else {
        setCurrentRow(currentRow + 1);
      }
    }
  };

  const cashOut = () => {
    if (gameState === 'playing' && currentRow > 0) {
      setGameState('won');
      setStats(prev => ({
        games: prev.games + 1,
        wins: prev.wins + 1,
        maxMultiplier: Math.max(prev.maxMultiplier, multiplier),
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Игр', value: stats.games, color: 'purple' },
          { label: 'Побед', value: stats.wins, color: 'emerald' },
          { label: 'Макс ×', value: stats.maxMultiplier.toFixed(2), color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl ${isLight ? 'bg-white/60' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'} text-center`}>
            <div className={`text-2xl font-black text-${stat.color}-500`}>{stat.value}</div>
            <div className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Игровое поле */}
      <div className={`p-6 rounded-3xl ${isLight ? 'bg-white/50' : 'bg-gradient-to-br from-gray-900/50 to-black/50'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'}`}>
        {/* Множитель */}
        <div className="text-center mb-4">
          <div className={`text-4xl font-black ${gameState === 'won' ? 'text-emerald-400' : gameState === 'lost' ? 'text-red-400' : 'text-amber-400'}`}>
            ×{multiplier.toFixed(2)}
          </div>
          <div className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
            {gameState === 'won' ? '🎉 Победа!' : gameState === 'lost' ? '💥 Бум!' : 'Множитель'}
          </div>
        </div>

        {/* Сетка */}
        <div className="flex flex-col gap-2 max-w-md mx-auto">
          {Array.from({ length: GRID_SIZE }, (_, row) => (
            <div key={row} className="flex gap-2 justify-center">
              {Array.from({ length: GRID_SIZE }, (_, col) => {
                const index = row * GRID_SIZE + col;
                const isRevealed = revealed.has(index);
                const isBomb = bombs.has(index);
                const isCurrentRow = row === currentRow && gameState === 'playing';
                const isPastRow = row < currentRow;
                const isFutureRow = row > currentRow;

                return (
                  <button
                    key={col}
                    onClick={() => revealCell(index)}
                    disabled={!isCurrentRow || isRevealed}
                    className={`w-14 h-14 rounded-xl font-bold text-xl transition-all ${
                      isRevealed
                        ? isBomb
                          ? 'bg-gradient-to-br from-red-500 to-red-700 text-white scale-110'
                          : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                        : isCurrentRow
                          ? isLight
                            ? 'bg-gradient-to-br from-purple-400 to-violet-500 text-white hover:scale-105 cursor-pointer animate-pulse'
                            : 'bg-gradient-to-br from-purple-600 to-violet-700 text-white hover:scale-105 cursor-pointer animate-pulse'
                          : isPastRow
                            ? isLight ? 'bg-gray-200' : 'bg-gray-800'
                            : isFutureRow
                              ? isLight ? 'bg-white/50 border-2 border-dashed border-purple-300' : 'bg-white/5 border-2 border-dashed border-white/20'
                              : isLight ? 'bg-gray-100' : 'bg-gray-700'
                    } ${isCurrentRow && !isRevealed ? 'shadow-lg shadow-purple-500/30' : ''}`}
                  >
                    {isRevealed ? (
                      isBomb ? '💣' : '✓'
                    ) : isCurrentRow ? (
                      '?'
                    ) : isPastRow && !isRevealed ? (
                      <span className="text-xs opacity-50">×</span>
                    ) : (
                      ''
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Прогресс */}
        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: GRID_SIZE }, (_, i) => (
            <div
              key={i}
              className={`w-8 h-2 rounded-full transition-all ${
                i < currentRow
                  ? 'bg-emerald-500'
                  : i === currentRow && gameState === 'playing'
                    ? 'bg-purple-500 animate-pulse'
                    : isLight ? 'bg-gray-200' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Кнопки */}
        <div className="mt-6 flex gap-4 justify-center">
          {gameState === 'idle' || gameState === 'won' || gameState === 'lost' ? (
            <button
              onClick={startGame}
              className="px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:scale-105 transition-all shadow-lg"
            >
              {gameState === 'idle' ? '🎮 Начать игру' : '🔄 Играть снова'}
            </button>
          ) : (
            <button
              onClick={cashOut}
              disabled={currentRow === 0}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                currentRow === 0
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-105 shadow-lg'
              }`}
            >
              💰 Забрать (×{multiplier.toFixed(2)})
            </button>
          )}
        </div>
      </div>

      {/* Правила */}
      <div className={`p-4 rounded-2xl ${isLight ? 'bg-white/50' : 'bg-white/5'} backdrop-blur-xl border ${isLight ? 'border-purple-200/30' : 'border-white/10'}`}>
        <h3 className={`font-bold mb-2 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>📋 Правила</h3>
        <ul className={`text-sm space-y-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
          <li>• Выбирай ячейку в текущем ряду (подсвечен фиолетовым)</li>
          <li>• В каждом ряду спрятана 1 бомба из 5 ячеек</li>
          <li>• Каждый безопасный шаг увеличивает множитель на ×1.2</li>
          <li>• Можешь забрать награду в любой момент или рискнуть дойти до конца</li>
          <li>• Наступишь на бомбу — игра окончена!</li>
        </ul>
      </div>
    </div>
  );
}
