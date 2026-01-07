'use client';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface BalanceCardProps {
  balance: number;
  onWithdrawClick: () => void;
  onDepositClick: () => void;
  showWithdrawalForm: boolean;
}

/**
 * BalanceCard - Refactored with semantic CSS classes
 * Uses design tokens from globals.css for automatic theme switching
 */
export default function BalanceCard({ balance, onWithdrawClick, onDepositClick, showWithdrawalForm }: BalanceCardProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  return (
    <div className="glass-panel p-3 sm:p-5 rounded-xl sm:rounded-2xl">
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Balance Display */}
        <div>
          <div className="text-[9px] sm:text-xs uppercase tracking-wider mb-0.5 sm:mb-1 text-caption">
            Доступно
          </div>
          <div className="text-xl sm:text-3xl font-black text-emerald-500">
            {balance.toFixed(2)} ₽
          </div>
          <div className="text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 text-hint">
            Мин. для вывода: 1000 ₽
          </div>
        </div>

        {/* Action Buttons - в столбик на мобилках, в ряд на десктопе */}
        {!showWithdrawalForm && (
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
            {/* Deposit Button */}
            <button 
              onClick={onDepositClick}
              className={`group w-full sm:w-auto px-3 py-2.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] active:scale-[0.98] ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-200/80'
                  : 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08]'
              }`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
              </svg>
              <span>Пополнить</span>
            </button>

            {/* Withdraw Button */}
            <button 
              onClick={onWithdrawClick}
              disabled={balance < 1000}
              className={`group w-full sm:w-auto px-3 py-2.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] active:scale-[0.98] ${
                balance >= 1000 
                  ? isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : isLight 
                    ? 'bg-zinc-100 text-zinc-400 border border-zinc-200/60 cursor-not-allowed'
                    : 'bg-white/[0.04] text-zinc-600 border border-white/[0.06] cursor-not-allowed'
              }`}
            >
              <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${balance >= 1000 ? 'text-emerald-500' : isLight ? 'text-zinc-400' : 'text-zinc-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" x2="21" y1="22" y2="22"/>
                <line x1="6" x2="6" y1="18" y2="11"/>
                <line x1="10" x2="10" y1="18" y2="11"/>
                <line x1="14" x2="14" y1="18" y2="11"/>
                <line x1="18" x2="18" y1="18" y2="11"/>
                <polygon points="12 2 20 7 4 7"/>
              </svg>
              <span>Вывести</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
