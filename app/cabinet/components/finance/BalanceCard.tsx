'use client';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface BalanceCardProps {
  balance: number;
  onWithdrawClick: () => void;
  showWithdrawalForm: boolean;
}

export default function BalanceCard({ balance, onWithdrawClick, showWithdrawalForm }: BalanceCardProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  return (
    <div 
      className="p-4 sm:p-5 rounded-2xl transition-all duration-300"
      style={{
        background: isLight 
          ? 'rgba(255, 255, 255, 0.65)' 
          : 'rgba(255, 255, 255, 0.02)',
        backdropFilter: isLight ? 'blur(20px) saturate(180%)' : 'none',
        border: isLight 
          ? '1px solid rgba(255, 255, 255, 0.8)' 
          : '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: isLight 
          ? '0 8px 32px rgba(138, 99, 210, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
          : 'none'
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="w-full sm:w-auto">
          <div className={`text-[10px] sm:text-xs uppercase tracking-wider mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Доступно</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500">{balance.toFixed(2)} ₽</div>
          <div className={`text-[9px] sm:text-[10px] mt-1 ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>Мин. для вывода: 1000 ₽</div>
        </div>
        {!showWithdrawalForm && (
          <button 
            onClick={onWithdrawClick}
            disabled={balance < 1000}
            className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              balance >= 1000 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-lg hover:shadow-emerald-500/30' 
                : isLight 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Вывести
          </button>
        )}
      </div>
    </div>
  );
}
