'use client';
import React, { memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AccountManagerProps {
  userId: string;
  currentEmail: string;
}

/**
 * AccountManager - компонент для управления учетной записью
 * Liquid Glass Design - оптимизированный с memo
 */
const AccountManager = memo(function AccountManager({ userId, currentEmail }: AccountManagerProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  return (
    <div className="space-y-4">
      {/* Информационный блок */}
      <div 
        className="p-4 rounded-xl"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(34,211,238,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(34,211,238,0.08) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${isLight ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)'}`,
          boxShadow: '0 0 20px rgba(59,130,246,0.08)',
        }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(34,211,238,0.15) 100%)',
            }}
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className={`text-xs font-bold mb-1 ${isLight ? 'text-blue-600' : 'text-blue-300'}`}>
              Управление учетной записью
            </h4>
            <p className={`text-[10px] leading-relaxed ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
              Здесь будут добавлены дополнительные функции управления учетной записью.
            </p>
          </div>
        </div>
      </div>

      {/* Данные аккаунта */}
      <div 
        className="p-4 rounded-xl"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)'
            : 'linear-gradient(135deg, rgba(30,28,50,0.5) 0%, rgba(20,18,35,0.6) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
              Email учетной записи
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
              {currentEmail}
            </span>
          </div>
          <div 
            className="h-px"
            style={{
              background: isLight 
                ? 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            }}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
              ID пользователя
            </span>
            <span className={`text-[10px] font-mono truncate max-w-[180px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-500'}`}>
              {userId}
            </span>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      <div 
        className="p-3 rounded-xl text-center"
        style={{
          background: isLight 
            ? 'rgba(255,255,255,0.3)'
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.04)'}`,
        }}
      >
        <p className={`text-[10px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>
          Дополнительные функции появятся в будущих обновлениях
        </p>
      </div>
    </div>
  );
});

export default AccountManager;
