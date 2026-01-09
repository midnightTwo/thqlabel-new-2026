'use client';

import React, { useState } from 'react';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { Ticket } from '../types';
import { useTheme } from '@/contexts/ThemeContext';

interface TicketDetailProps {
  ticket: Ticket;
  onStatusChange: (ticketId: string, status: string) => void;
  onViewRelease: (release: any) => void;
}

export default function TicketDetail({ ticket, onStatusChange, onViewRelease }: TicketDetailProps) {
  const [showUserInfo, setShowUserInfo] = useState(false);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  return (
    <div className={`p-2 sm:p-4 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-zinc-800'}`}>
      {/* Мобильная компактная версия */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2">
          {/* Аватар с раскрываемой информацией */}
          <button 
            onClick={() => setShowUserInfo(!showUserInfo)}
            className="relative flex-shrink-0"
          >
            <TicketAvatar
              src={ticket.user_avatar}
              name={ticket.user_nickname}
              email={ticket.user_email}
              size="sm"
              role={ticket.user_role}
              showRing
            />
            {/* Индикатор раскрытия */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border rounded-full flex items-center justify-center transition-transform ${showUserInfo ? 'rotate-180' : ''} ${isLight ? 'bg-gray-100 border-gray-300' : 'bg-zinc-800 border-zinc-700'}`}>
              <svg className={`w-2 h-2 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm line-clamp-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{ticket.subject}</h3>
            <span className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>#{ticket.id.slice(0, 6)}</span>
          </div>
          
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange(ticket.id, e.target.value)}
            className={`px-2 py-1 border rounded text-xs focus:outline-none focus:border-blue-500 ${isLight ? 'bg-white text-gray-900 border-gray-300' : 'bg-zinc-800 border-zinc-700 text-white'}`}
          >
            <option value="open">Открыт</option>
            <option value="in_progress">В работе</option>
            <option value="pending">Ожидание</option>
            <option value="closed">Закрыт</option>
          </select>
        </div>
        
        {/* Раскрываемая информация о пользователе */}
        {showUserInfo && (
          <div className={`mt-2 p-2 rounded-lg border animate-fade-in ${isLight ? 'bg-gray-100/90 border-gray-300' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <p className={`text-xs font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {ticket.user_nickname || 'Без никнейма'}
              </p>
              <UserRoleBadge role={ticket.user_role} compact />
            </div>
            {ticket.user_email && (
              <p className={`text-[10px] truncate ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{ticket.user_email}</p>
            )}
            {ticket.user_telegram && (
              <p className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>@{ticket.user_telegram}</p>
            )}
            <p className={`text-[10px] mt-1 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
              Создан: {new Date(ticket.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
        )}
        
        {/* Релиз компактно на мобильных */}
        {ticket.release && (
          <div 
            onClick={() => onViewRelease(ticket.release)}
            className="mt-2 flex items-center gap-2 p-1.5 bg-purple-900/20 border border-purple-500/30 rounded cursor-pointer"
          >
            {ticket.release.artwork_url ? (
              <img src={ticket.release.artwork_url} alt="" className="w-8 h-8 rounded object-cover" />
            ) : (
              <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[10px] text-purple-400">Релиз</p>
                {ticket.release.release_code && (
                  <span className="text-[8px] font-mono text-purple-300/70 bg-purple-500/10 px-1 rounded">
                    {ticket.release.release_code}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{ticket.release.artist} – {ticket.release.title}</p>
            </div>
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
        
        {/* Транзакция компактно на мобильных */}
        {ticket.transaction && (
          <TransactionCardCompact transaction={ticket.transaction} isLight={isLight} />
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:block">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>{ticket.subject}</h3>
            
            {/* Информация о пользователе */}
            <div className="flex items-center gap-3 mb-2">
              <TicketAvatar
                src={ticket.user_avatar}
                name={ticket.user_nickname}
                email={ticket.user_email}
                size="md"
                role={ticket.user_role}
                showRing
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {ticket.user_nickname || ticket.user_email?.split('@')[0] || 'Пользователь'}
                </p>
                <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                  {ticket.user_email && <span>{ticket.user_email}</span>}
                  {ticket.user_telegram && (
                    <>
                      <span>•</span>
                      <span>@{ticket.user_telegram}</span>
                    </>
                  )}
                </div>
                <UserRoleBadge role={ticket.user_role} />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={ticket.status}
              onChange={(e) => onStatusChange(ticket.id, e.target.value)}
              className={`px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-blue-500 ${isLight ? 'bg-white text-gray-900 border-gray-300' : 'bg-zinc-800 border-zinc-700 text-white'}`}
            >
              <option value="open">Открыт</option>
              <option value="in_progress">В работе</option>
              <option value="pending">Ожидание</option>
              <option value="closed">Закрыт</option>
            </select>
          </div>
        </div>

        <div className={`flex items-center gap-3 text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
          <span>ID: {ticket.id.slice(0, 8)}</span>
          <span>•</span>
          <span>Создан: {new Date(ticket.created_at).toLocaleString('ru-RU')}</span>
        </div>

        {/* Информация о релизе */}
        {ticket.release && (
          <ReleaseCard release={ticket.release} onClick={() => onViewRelease(ticket.release)} />
        )}
        
        {/* Информация о транзакции */}
        {ticket.transaction && (
          <TransactionCard transaction={ticket.transaction} />
        )}
      </div>
    </div>
  );
}

function UserRoleBadge({ role, compact }: { role?: string; compact?: boolean }) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const config = isLight ? {
    owner: { bg: 'bg-purple-200 text-purple-800 border-purple-400', label: 'OWNER' },
    admin: { bg: 'bg-red-200 text-red-800 border-red-400', label: 'ADMIN' },
    exclusive: { bg: 'bg-amber-200 text-amber-800 border-amber-400', label: 'EXCLUSIVE' },
  }[role || ''] || { bg: 'bg-gray-200 text-gray-700 border-gray-400', label: 'BASIC' }
  : {
    owner: { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'OWNER' },
    admin: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'ADMIN' },
    exclusive: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'EXCLUSIVE' },
  }[role || ''] || { bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', label: 'BASIC' };

  if (compact) {
    return (
      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${config.bg}`}>
        {config.label}
      </span>
    );
  }

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block mt-1 border ${config.bg}`}>
      {config.label}
    </span>
  );
}

interface ReleaseCardProps {
  release: {
    id: string;
    artist: string;
    title: string;
    artwork_url?: string;
    status: string;
    release_code?: string;
  };
  onClick: () => void;
}

function ReleaseCard({ release, onClick }: ReleaseCardProps) {
  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'На модерации', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' },
    approved: { label: 'Одобрен', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
    rejected: { label: 'Отклонен', color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.15)' },
    published: { label: 'Опубликован', color: '#c4b5fd', bgColor: 'rgba(196, 181, 253, 0.15)' },
    distributed: { label: 'На дистрибьюции', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
  };

  const status = statusConfig[release.status] || { label: release.status, color: '#9d8df1', bgColor: 'rgba(157, 141, 241, 0.15)' };

  // SVG иконки для статусов
  const StatusIcon = () => {
    switch (release.status) {
      case 'pending':
        return (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'approved':
        return (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'published':
        return (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
        );
      case 'distributed':
        return (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        );
      default:
        return (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13" />
          </svg>
        );
    }
  };

  return (
    <div 
      onClick={onClick}
      className="mt-2 p-2 bg-gradient-to-br from-purple-900/15 to-blue-900/15 border border-purple-500/20 rounded-lg cursor-pointer hover:border-purple-400/40 hover:from-purple-900/25 hover:to-blue-900/25 transition-all duration-200 group"
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {release.artwork_url ? (
            <img 
              src={release.artwork_url} 
              alt={release.title}
              className="w-9 h-9 rounded object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] font-medium text-purple-400/80">Релиз по теме</p>
            {release.release_code && (
              <span className="text-[8px] font-mono text-purple-300/70 bg-purple-500/10 px-1 py-0.5 rounded">
                {release.release_code}
              </span>
            )}
          </div>
          <h4 className="text-[11px] font-bold text-white truncate">{release.title}</h4>
          <p className="text-[9px] text-zinc-400 truncate">{release.artist}</p>
        </div>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span 
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium"
            style={{ 
              background: status.bgColor, 
              color: status.color,
              border: `1px solid ${status.color}40`
            }}
          >
            <StatusIcon />
            <span>{status.label}</span>
          </span>
          <svg className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Компактная карточка транзакции для мобильных
function TransactionCardCompact({ transaction, isLight }: { transaction: any; isLight: boolean }) {
  const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    deposit: { label: 'Пополнение', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
    withdrawal: { label: 'Вывод', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
    purchase: { label: 'Покупка', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
    payout: { label: 'Роялти', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
    bonus: { label: 'Бонус', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
    refund: { label: 'Возврат', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)' },
    freeze: { label: 'Заморозка', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
    unfreeze: { label: 'Разморозка', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
    adjustment: { label: 'Корректировка', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' }
  };
  const typeInfo = typeConfig[transaction.type] || { label: transaction.type, color: '#9d8df1', bgColor: 'rgba(157, 141, 241, 0.15)' };
  const isPositive = ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(transaction.type);

  return (
    <div className="mt-2 flex items-center gap-2 p-1.5 bg-emerald-900/20 border border-emerald-500/30 rounded">
      <div 
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: typeInfo.bgColor, color: typeInfo.color }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-emerald-400">Транзакция</p>
        <div className="flex items-center gap-2">
          <span 
            className={`text-xs font-bold`}
            style={{ color: isPositive ? '#10b981' : '#ef4444' }}
          >
            {isPositive ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString('ru-RU')} ₽
          </span>
          <span 
            className="text-[9px] px-1 py-0.5 rounded"
            style={{ background: typeInfo.bgColor, color: typeInfo.color }}
          >
            {typeInfo.label}
          </span>
        </div>
      </div>
      <span className="text-[9px] font-mono text-zinc-500">#{transaction.id?.slice(0, 8)}</span>
    </div>
  );
}

// Полная карточка транзакции для десктопа
function TransactionCard({ transaction }: { transaction: any }) {
  const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    deposit: { label: 'Пополнение', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
    withdrawal: { label: 'Вывод', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
    purchase: { label: 'Покупка', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
    payout: { label: 'Роялти', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
    bonus: { label: 'Бонус', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
    refund: { label: 'Возврат', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)' },
    freeze: { label: 'Заморозка', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
    unfreeze: { label: 'Разморозка', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
    adjustment: { label: 'Корректировка', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' }
  };
  const typeInfo = typeConfig[transaction.type] || { label: transaction.type, color: '#9d8df1', bgColor: 'rgba(157, 141, 241, 0.15)' };
  const isPositive = ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(transaction.type);

  return (
    <div className="mt-2 p-2 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-lg">
      <div className="flex items-center gap-2.5">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: typeInfo.bgColor, color: typeInfo.color, border: `1px solid ${typeInfo.color}40` }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-medium text-emerald-400 mb-0.5">Транзакция по теме</p>
              <div className="flex items-center gap-2 mb-0.5">
                <span 
                  className="text-sm font-bold"
                  style={{ color: isPositive ? '#10b981' : '#ef4444' }}
                >
                  {isPositive ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString('ru-RU')} ₽
                </span>
                <span 
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: typeInfo.bgColor, color: typeInfo.color, border: `1px solid ${typeInfo.color}40` }}
                >
                  {typeInfo.label}
                </span>
              </div>
              {transaction.description && (
                <p className="text-[10px] text-zinc-400 truncate">{transaction.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-500">
            <span className="font-mono">#{transaction.id?.slice(0, 8)}</span>
            <span>•</span>
            <span>{new Date(transaction.created_at).toLocaleString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
