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
          <div className={`mt-2 p-2 rounded-lg border animate-fade-in ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
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
              <p className="text-[10px] text-purple-400">Релиз</p>
              <p className={`text-xs truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{ticket.release.artist} – {ticket.release.title}</p>
            </div>
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
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
      </div>
    </div>
  );
}

function UserRoleBadge({ role, compact }: { role?: string; compact?: boolean }) {
  const config = {
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
  };
  onClick: () => void;
}

function ReleaseCard({ release, onClick }: ReleaseCardProps) {
  const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
    pending: { label: 'На модерации', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', emoji: '⏳' },
    approved: { label: 'Одобрен', color: 'bg-green-500/20 text-green-300 border-green-500/40', emoji: '✅' },
    rejected: { label: 'Отклонен', color: 'bg-red-500/20 text-red-300 border-red-500/40', emoji: '❌' },
    published: { label: 'Опубликован', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', emoji: '🎵' },
  };

  const status = statusConfig[release.status] || { label: release.status, color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40', emoji: '📀' };

  return (
    <div 
      onClick={onClick}
      className="mt-2 p-2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all duration-200 group"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0">
          {release.artwork_url ? (
            <img 
              src={release.artwork_url} 
              alt={release.title}
              className="w-12 h-12 rounded object-cover group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-medium text-purple-400 mb-0.5">Релиз по теме</p>
              <h4 className="text-xs font-bold text-white truncate">{release.title}</h4>
              <p className="text-[10px] text-zinc-400 truncate">{release.artist}</p>
            </div>
            <div className="ml-2 text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium border mt-0.5 ${status.color}`}>
            <span>{status.emoji}</span>
            <span>{status.label}</span>
          </span>
        </div>
      </div>
      <p className="mt-1 text-[9px] text-center text-purple-400/70 group-hover:text-purple-400 transition-colors">
        Нажмите для подробной информации
      </p>
    </div>
  );
}
