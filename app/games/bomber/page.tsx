"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Типы
interface Cell {
  id: number;
  revealed: boolean;
  hasBomb: boolean;
  isPath: boolean;
  isStart: boolean;
  isEnd: boolean;
  isSelected: boolean;
}

interface GameState {
  status: 'idle' | 'playing' | 'won' | 'lost';
  currentRow: number;
  multiplier: number;
  winnings: number;
  bet: number;
}

// Конфигурация игры
const ROWS = 8;
const COLS = 5;
const BASE_MULTIPLIERS = [1.2, 1.5, 1.9, 2.4, 3.1, 4.0, 5.2, 6.8];
const BOMB_CHANCES = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55]; // Увеличивается с каждым рядом

// SVG Иконки
const BombIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <radialGradient id="bomb-grad" cx="30%" cy="30%">
        <stop offset="0%" stopColor="#4a4a4a" />
        <stop offset="100%" stopColor="#1a1a1a" />
      </radialGradient>
      <linearGradient id="fuse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8b4513" />
        <stop offset="100%" stopColor="#d2691e" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="36" r="22" fill="url(#bomb-grad)" stroke="#333" strokeWidth="2"/>
    <ellipse cx="28" cy="30" rx="6" ry="4" fill="#666" opacity="0.5"/>
    <path d="M32 14 L32 8 Q36 4 40 8" stroke="url(#fuse-grad)" strokeWidth="3" fill="none"/>
    <circle cx="40" cy="6" r="4" fill="#ff6600">
      <animate attributeName="r" values="4;6;4" dur="0.3s" repeatCount="indefinite"/>
      <animate attributeName="fill" values="#ff6600;#ffff00;#ff6600" dur="0.3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="42" cy="4" r="2" fill="#ffff00" opacity="0.8"/>
  </svg>
);

const GemIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id={`gem-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} />
        <stop offset="50%" stopColor={color} stopOpacity="0.8" />
        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <polygon points="32,8 52,24 44,56 20,56 12,24" fill={`url(#gem-grad-${color})`} stroke={color} strokeWidth="2"/>
    <polygon points="32,8 44,24 32,32 20,24" fill="white" opacity="0.3"/>
    <polygon points="32,8 38,20 32,26 26,20" fill="white" opacity="0.2"/>
    <line x1="20" y1="24" x2="44" y2="24" stroke="white" strokeWidth="1" opacity="0.3"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    <polygon 
      points="32,4 38,24 60,24 42,38 48,58 32,46 16,58 22,38 4,24 26,24" 
      fill="url(#star-grad)" 
      stroke="#d97706" 
      strokeWidth="2"
    />
    <polygon 
      points="32,10 36,24 48,24 38,32 42,46 32,38 22,46 26,32 16,24 28,24" 
      fill="white" 
      opacity="0.3"
    />
  </svg>
);

const FlagIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <rect x="16" y="12" width="4" height="44" fill="#78350f" rx="1"/>
    <path d="M20 12 L52 12 L44 24 L52 36 L20 36 Z" fill="#dc2626"/>
    <path d="M20 12 L40 12 L32 24 L40 36 L20 36 Z" fill="#ef4444" opacity="0.7"/>
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id="trophy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <path d="M20 8 L44 8 L44 16 Q44 32 32 40 Q20 32 20 16 Z" fill="url(#trophy-grad)" stroke="#b45309" strokeWidth="2"/>
    <path d="M20 12 Q8 12 8 24 Q8 32 20 32" fill="none" stroke="url(#trophy-grad)" strokeWidth="4"/>
    <path d="M44 12 Q56 12 56 24 Q56 32 44 32" fill="none" stroke="url(#trophy-grad)" strokeWidth="4"/>
    <rect x="28" y="40" width="8" height="8" fill="url(#trophy-grad)"/>
    <rect x="22" y="48" width="20" height="6" rx="2" fill="url(#trophy-grad)" stroke="#b45309" strokeWidth="1"/>
    <ellipse cx="32" cy="20" rx="6" ry="4" fill="white" opacity="0.3"/>
  </svg>
);

// Компонент ячейки
interface CellComponentProps {
  cell: Cell;
  rowIndex: number;
  currentRow: number;
  gameStatus: GameState['status'];
  onSelect: (cellId: number) => void;
}

const CellComponent: React.FC<CellComponentProps> = ({ 
  cell, 
  rowIndex, 
  currentRow, 
  gameStatus, 
  onSelect 
}) => {
  const isClickable = gameStatus === 'playing' && rowIndex === currentRow && !cell.revealed;
  const showContent = cell.revealed || gameStatus === 'lost' || gameStatus === 'won';
  
  // Определяем стиль ячейки
  let cellStyle = 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600';
  let hoverStyle = '';
  
  if (cell.isStart) {
    cellStyle = 'bg-gradient-to-br from-green-600 to-green-700 border-green-500';
  } else if (cell.isEnd) {
    cellStyle = 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-400';
  } else if (cell.revealed) {
    if (cell.hasBomb) {
      cellStyle = 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 animate-pulse';
    } else if (cell.isPath) {
      cellStyle = 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400';
    }
  } else if (isClickable) {
    cellStyle = 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400';
    hoverStyle = 'hover:from-blue-500 hover:to-indigo-600 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 cursor-pointer';
  } else if (gameStatus === 'lost' && cell.hasBomb && !cell.revealed) {
    cellStyle = 'bg-gradient-to-br from-red-900/50 to-red-950/50 border-red-800/50';
  }
  
  return (
    <button
      onClick={() => isClickable && onSelect(cell.id)}
      disabled={!isClickable}
      className={`
        relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 
        transition-all duration-300 transform
        ${cellStyle} ${hoverStyle}
        ${cell.isSelected ? 'ring-4 ring-white/50' : ''}
        flex items-center justify-center
      `}
    >
      {/* Контент ячейки */}
      {cell.isStart && (
        <div className="w-10 h-10 sm:w-12 sm:h-12">
          <FlagIcon />
        </div>
      )}
      
      {cell.isEnd && !cell.revealed && (
        <div className="w-10 h-10 sm:w-12 sm:h-12">
          <TrophyIcon />
        </div>
      )}
      
      {showContent && !cell.isStart && !cell.isEnd && (
        <div className="w-10 h-10 sm:w-12 sm:h-12">
          {cell.hasBomb ? (
            <BombIcon />
          ) : cell.isPath ? (
            <GemIcon color={rowIndex < 3 ? '#22c55e' : rowIndex < 6 ? '#3b82f6' : '#a855f7'} />
          ) : null}
        </div>
      )}
      
      {/* Индикатор возможности клика */}
      {isClickable && !showContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white/30 animate-pulse" />
        </div>
      )}
      
      {/* Блик */}
      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/20" />
    </button>
  );
};

// Главный компонент игры
const BomberGame: React.FC = () => {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    currentRow: 0,
    multiplier: 1,
    winnings: 0,
    bet: 10,
  });
  const [history, setHistory] = useState<{ won: boolean; amount: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Инициализация сетки
  const initializeGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    
    for (let row = 0; row < ROWS; row++) {
      const rowCells: Cell[] = [];
      const bombCount = Math.floor(COLS * BOMB_CHANCES[row]);
      const bombPositions = new Set<number>();
      
      // Размещаем бомбы случайно
      while (bombPositions.size < bombCount) {
        bombPositions.add(Math.floor(Math.random() * COLS));
      }
      
      for (let col = 0; col < COLS; col++) {
        rowCells.push({
          id: row * COLS + col,
          revealed: false,
          hasBomb: bombPositions.has(col),
          isPath: false,
          isStart: row === 0,
          isEnd: row === ROWS - 1,
          isSelected: false,
        });
      }
      
      newGrid.push(rowCells);
    }
    
    setGrid(newGrid);
  }, []);
  
  // Начало игры
  const startGame = useCallback(() => {
    if (balance < bet) return;
    
    setBalance(prev => prev - bet);
    initializeGrid();
    setGameState({
      status: 'playing',
      currentRow: 0,
      multiplier: 1,
      winnings: 0,
      bet,
    });
  }, [balance, bet, initializeGrid]);
  
  // Выбор ячейки
  const selectCell = useCallback((cellId: number) => {
    if (gameState.status !== 'playing') return;
    
    const row = Math.floor(cellId / COLS);
    const col = cellId % COLS;
    
    if (row !== gameState.currentRow) return;
    
    const cell = grid[row][col];
    
    // Обновляем сетку
    setGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      newGrid[row][col].revealed = true;
      newGrid[row][col].isSelected = true;
      
      if (!cell.hasBomb) {
        newGrid[row][col].isPath = true;
      }
      
      return newGrid;
    });
    
    if (cell.hasBomb) {
      // Проигрыш
      setGameState(prev => ({
        ...prev,
        status: 'lost',
      }));
      setHistory(prev => [...prev, { won: false, amount: -bet }].slice(-10));
      
      // Показываем все бомбы
      setTimeout(() => {
        setGrid(prev => prev.map(r => r.map(c => ({
          ...c,
          revealed: c.hasBomb ? true : c.revealed,
        }))));
      }, 500);
    } else {
      // Успешный шаг
      const newMultiplier = BASE_MULTIPLIERS[row];
      const newWinnings = Math.floor(bet * newMultiplier);
      
      if (row === ROWS - 1) {
        // Победа!
        setGameState(prev => ({
          ...prev,
          status: 'won',
          multiplier: newMultiplier,
          winnings: newWinnings,
        }));
        setBalance(prev => prev + newWinnings);
        setHistory(prev => [...prev, { won: true, amount: newWinnings }].slice(-10));
      } else {
        // Продолжаем
        setGameState(prev => ({
          ...prev,
          currentRow: row + 1,
          multiplier: newMultiplier,
          winnings: newWinnings,
        }));
      }
    }
  }, [gameState, grid, bet]);
  
  // Забрать выигрыш
  const cashOut = useCallback(() => {
    if (gameState.status !== 'playing' || gameState.currentRow === 0) return;
    
    const winnings = gameState.winnings;
    setBalance(prev => prev + winnings);
    setHistory(prev => [...prev, { won: true, amount: winnings }].slice(-10));
    setGameState(prev => ({
      ...prev,
      status: 'won',
    }));
  }, [gameState]);
  
  // Сброс игры
  const resetGame = useCallback(() => {
    setGameState({
      status: 'idle',
      currentRow: 0,
      multiplier: 1,
      winnings: 0,
      bet,
    });
    setGrid([]);
  }, [bet]);
  
  // Изменение ставки
  const adjustBet = (amount: number) => {
    const newBet = Math.max(1, Math.min(balance, bet + amount));
    setBet(newBet);
  };
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="w-10 h-10"><BombIcon /></span>
            Бомбер
            <span className="w-10 h-10"><BombIcon /></span>
          </h1>
          <p className="text-white/60">Дойди до финиша, избегая бомб!</p>
        </div>
        
        {/* Stats Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-3 text-center">
            <p className="text-yellow-400/70 text-xs mb-1">Баланс</p>
            <p className="text-yellow-400 font-bold text-xl">💰 {balance.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-3 text-center">
            <p className="text-blue-400/70 text-xs mb-1">Ставка</p>
            <p className="text-blue-400 font-bold text-xl">🎯 {bet}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-green-400/70 text-xs mb-1">Множитель</p>
            <p className="text-green-400 font-bold text-xl">×{gameState.multiplier.toFixed(1)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-3 text-center">
            <p className="text-purple-400/70 text-xs mb-1">Выигрыш</p>
            <p className="text-purple-400 font-bold text-xl">✨ {gameState.winnings}</p>
          </div>
        </div>
        
        {/* Game Board */}
        <div className="bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-4 sm:p-6 mb-6">
          {gameState.status === 'idle' ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6">
                <TrophyIcon />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Готов к игре?</h2>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                Выбирай путь от старта до финиша. Каждый ряд увеличивает множитель, 
                но и шанс нарваться на бомбу растёт! Можешь забрать выигрыш в любой момент.
              </p>
              
              {/* Bet Controls */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <button
                  onClick={() => adjustBet(-10)}
                  className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 font-bold hover:bg-red-500/30 transition-colors"
                >
                  -10
                </button>
                <button
                  onClick={() => adjustBet(-1)}
                  className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 font-bold hover:bg-red-500/30 transition-colors"
                >
                  -1
                </button>
                <div className="px-6 py-2 rounded-lg bg-white/10 border border-white/20">
                  <span className="text-white font-bold text-xl">{bet}</span>
                </div>
                <button
                  onClick={() => adjustBet(1)}
                  className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 font-bold hover:bg-green-500/30 transition-colors"
                >
                  +1
                </button>
                <button
                  onClick={() => adjustBet(10)}
                  className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 font-bold hover:bg-green-500/30 transition-colors"
                >
                  +10
                </button>
              </div>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setBet(Math.floor(balance / 2))}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                >
                  1/2
                </button>
                <button
                  onClick={() => setBet(balance)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Multiplier Scale */}
              <div className="w-full flex justify-between items-center mb-4 px-4">
                {BASE_MULTIPLIERS.map((mult, index) => (
                  <div 
                    key={index}
                    className={`text-center transition-all ${
                      index < gameState.currentRow 
                        ? 'text-green-400 scale-90' 
                        : index === gameState.currentRow 
                          ? 'text-yellow-400 scale-110 font-bold' 
                          : 'text-white/40'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">×{mult}</div>
                  </div>
                ))}
              </div>
              
              {/* Grid - reversed to show finish at top */}
              <div className="flex flex-col-reverse gap-2">
                {grid.map((row, rowIndex) => (
                  <div 
                    key={rowIndex} 
                    className={`flex gap-2 justify-center transition-all duration-300 ${
                      rowIndex === gameState.currentRow && gameState.status === 'playing'
                        ? 'scale-105'
                        : rowIndex < gameState.currentRow
                          ? 'opacity-60 scale-95'
                          : ''
                    }`}
                  >
                    {row.map((cell) => (
                      <CellComponent
                        key={cell.id}
                        cell={cell}
                        rowIndex={rowIndex}
                        currentRow={gameState.currentRow}
                        gameStatus={gameState.status}
                        onSelect={selectCell}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          {gameState.status === 'idle' && (
            <button
              onClick={startGame}
              disabled={balance < bet}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:from-green-400 hover:to-emerald-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              🎮 Начать игру
            </button>
          )}
          
          {gameState.status === 'playing' && gameState.currentRow > 0 && (
            <button
              onClick={cashOut}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-lg hover:from-yellow-400 hover:to-orange-500 transition-all transform hover:scale-105 animate-pulse"
            >
              💰 Забрать {gameState.winnings}
            </button>
          )}
          
          {(gameState.status === 'won' || gameState.status === 'lost') && (
            <button
              onClick={resetGame}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg hover:from-blue-400 hover:to-indigo-500 transition-all transform hover:scale-105"
            >
              🔄 Играть снова
            </button>
          )}
        </div>
        
        {/* Result Message */}
        {gameState.status === 'won' && (
          <div className="text-center mb-6 animate-bounce">
            <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-2 border-green-500">
              <div className="w-16 h-16 mx-auto mb-2">
                <TrophyIcon />
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-1">Победа!</h3>
              <p className="text-green-300">Вы выиграли {gameState.winnings} монет!</p>
            </div>
          </div>
        )}
        
        {gameState.status === 'lost' && (
          <div className="text-center mb-6">
            <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500">
              <div className="w-16 h-16 mx-auto mb-2">
                <BombIcon />
              </div>
              <h3 className="text-2xl font-bold text-red-400 mb-1">Бум!</h3>
              <p className="text-red-300">Вы попали на бомбу</p>
            </div>
          </div>
        )}
        
        {/* Multiplier Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6">
          <h3 className="text-white font-bold mb-3 text-center">📊 Множители по рядам</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {BASE_MULTIPLIERS.map((mult, index) => (
              <div 
                key={index}
                className={`p-2 rounded-lg text-center ${
                  index < 3 ? 'bg-green-500/20 text-green-400' :
                  index < 6 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}
              >
                <div className="text-xs opacity-70">Ряд {index + 1}</div>
                <div className="font-bold">×{mult}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* History */}
        {history.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <h3 className="text-white font-bold mb-3">📜 История игр</h3>
            <div className="flex flex-wrap gap-2">
              {history.map((game, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    game.won 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {game.won ? '+' : ''}{game.amount}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BomberGame;
