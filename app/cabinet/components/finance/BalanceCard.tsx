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
    <div 
      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl"
      style={{
        background: isLight 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 255, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(30, 27, 45, 0.95) 0%, rgba(45, 40, 70, 0.9) 100%)',
        border: isLight 
          ? '1px solid rgba(255, 255, 255, 0.9)' 
          : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isLight 
          ? '0 4px 24px rgba(157, 141, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' 
          : '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Desktop: row layout with buttons on right | Mobile: column layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Balance Display - компактнее */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(34, 197, 94, 0.15) 100%)',
              border: isLight ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </div>
          <div>
            <div className={`text-[9px] sm:text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
              Баланс
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-500">
              {balance.toFixed(2)} ₽
            </div>
          </div>
        </div>

        {/* Action Buttons - справа на ПК */}
        {!showWithdrawalForm && (
          <div className="flex gap-2">
            {/* Deposit Button */}
            <button 
              onClick={onDepositClick}
              className="group flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.97]"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(167, 139, 250, 0.15) 100%)',
                border: isLight ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(139, 92, 246, 0.3)',
                color: isLight ? '#7c3aed' : '#a78bfa',
              }}
            >
              {/* Wallet Icon - Кошелёк */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
              className={`group flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                balance < 1000 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                background: balance >= 1000
                  ? isLight 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(34, 197, 94, 0.15) 100%)'
                  : isLight 
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.03)',
                border: balance >= 1000
                  ? isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.3)'
                  : isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: balance >= 1000
                  ? isLight ? '#059669' : '#34d399'
                  : isLight ? '#9ca3af' : '#52525b',
              }}
            >
              {/* Bank Icon - Банк */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"/>
                <path d="M3 10h18"/>
                <path d="M5 6l7-3 7 3"/>
                <path d="M4 10v11"/>
                <path d="M20 10v11"/>
                <path d="M8 14v3"/>
                <path d="M12 14v3"/>
                <path d="M16 14v3"/>
              </svg>
              <span>Вывести</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
