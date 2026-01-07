'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Ticket, statusColors, statusLabels, categoryLabels } from './types';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  searchQuery: string;
  onSelect: (ticket: Ticket) => void;
  onViewProfile: (ticket: Ticket) => void;
}

export default function TicketListItem({
  ticket,
  isSelected,
  searchQuery,
  onSelect,
  onViewProfile
}: TicketListItemProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const highlightMatch = (text: string | undefined, query: string) => {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query.toLowerCase());
  };

  const getStatusBg = () => {
    if (ticket.status === 'in_progress' || ticket.status === 'open') {
      return isLight 
        ? 'bg-red-50/80 border-red-300/50 hover:border-red-400/60'
        : 'bg-red-500/10 border-red-500/30 hover:border-red-500/50';
    }
    if (ticket.status === 'pending') {
      return isLight
        ? 'bg-yellow-50/80 border-yellow-300/50 hover:border-yellow-400/60'
        : 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50';
    }
    if (ticket.status === 'closed') {
      return isLight
        ? 'bg-gray-50/80 border-gray-300/50 hover:border-gray-400/60'
        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700';
    }
    return isLight
      ? 'bg-white/80 border-gray-200/50 hover:border-gray-300/60'
      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700';
  };

  return (
    <button
      onClick={() => {
        onSelect(ticket);
        fetchWithAuth(`/api/support/tickets/${ticket.id}/read`, { method: 'POST' });
      }}
      className={`w-full p-4 rounded-xl transition-all text-left ${getStatusBg()} ${
        isSelected
          ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border'
      }`}
    >
      {/* Код тикета, категория и статус */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            highlightMatch(ticket.id, searchQuery)
              ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50 ring-2 ring-yellow-500/30'
              : isLight 
                ? 'bg-gray-100 text-gray-600 border-gray-300'
                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700'
          }`}>
            #{ticket.id.substring(0, 8)}
          </span>
          {ticket.category && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              highlightMatch(categoryLabels[ticket.category as keyof typeof categoryLabels], searchQuery)
                ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50 ring-2 ring-yellow-500/30'
                : isLight
                  ? 'bg-purple-100 text-purple-700 border-purple-300/50'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}>
              {categoryLabels[ticket.category as keyof typeof categoryLabels] || ticket.category}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
          statusColors[ticket.status as keyof typeof statusColors] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
        }`}>
          {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status || 'Неизвестно'}
        </span>
      </div>

      <div className="mb-2">
        <h3 className={`font-bold text-sm line-clamp-1 ${
          isLight ? 'text-gray-800' : 'text-white'
        } ${
          highlightMatch(ticket.subject, searchQuery) 
            ? isLight ? 'bg-yellow-100 px-1 rounded' : 'bg-yellow-500/10 px-1 rounded' 
            : ''
        }`}>
          {ticket.subject}
        </h3>
      </div>

      {/* Информация о пользователе */}
      <div className="flex items-center gap-2 mb-2">
        {ticket.user_avatar ? (
          <div 
            className={`w-7 h-7 rounded-full bg-cover bg-center flex-shrink-0 border ${isLight ? 'border-gray-300' : 'border-zinc-700'}`}
            style={{ backgroundImage: `url(${ticket.user_avatar})` }}
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {(ticket.user_nickname || ticket.user_email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${
            isLight ? 'text-gray-800' : 'text-white'
          } ${
            highlightMatch(ticket.user_nickname, searchQuery) || highlightMatch(ticket.user_email, searchQuery)
              ? isLight ? 'bg-yellow-100 px-1 rounded' : 'bg-yellow-500/20 px-1 rounded'
              : ''
          }`}>
            {ticket.user_nickname || ticket.user_email?.split('@')[0] || 'Пользователь'}
          </p>
          {ticket.user_email && (
            <p className={`text-[10px] truncate ${isLight ? 'text-gray-500' : 'text-zinc-400'} ${
              highlightMatch(ticket.user_email, searchQuery) 
                ? isLight ? 'bg-yellow-100 px-1 rounded' : 'bg-yellow-500/20 px-1 rounded' 
                : ''
            }`}>{ticket.user_email}</p>
          )}
          <UserRoleBadge role={ticket.user_role} size="small" isLight={isLight} />
        </div>
        
        {/* Кнопка просмотра профиля */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(ticket);
          }}
          className={`p-2 sm:p-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
            isLight 
              ? 'bg-purple-100/60 hover:bg-purple-200/60 border border-purple-200/50'
              : 'bg-[#6050ba]/20 hover:bg-[#6050ba]/40 border border-[#6050ba]/30'
          }`}
          title="Просмотреть профиль"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onViewProfile(ticket);
            }
          }}
        >
          <svg className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
          {ticket.ticket_messages?.length || 0} сообщений
        </span>
      </div>

      <div className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
        {new Date(ticket.created_at).toLocaleString('ru-RU')}
      </div>
    </button>
  );
}

// Компонент бейджа роли пользователя
export function UserRoleBadge({ role, size = 'normal', isLight = false }: { role?: string; size?: 'small' | 'normal'; isLight?: boolean }) {
  const sizeClasses = size === 'small' 
    ? 'text-[9px] px-1.5 py-0.5' 
    : 'text-[10px] px-2 py-0.5';

  const roleConfig: Record<string, { bg: string; bgLight: string; label: string }> = {
    owner: { 
      bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', 
      bgLight: 'bg-purple-100 text-purple-700 border-purple-300/50',
      label: 'OWNER' 
    },
    admin: { 
      bg: 'bg-red-500/20 text-red-300 border-red-500/30', 
      bgLight: 'bg-red-100 text-red-600 border-red-300/50',
      label: 'ADMIN' 
    },
    exclusive: { 
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', 
      bgLight: 'bg-amber-100 text-amber-700 border-amber-300/50',
      label: 'EXCLUSIVE' 
    },
    basic: { 
      bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', 
      bgLight: 'bg-gray-100 text-gray-600 border-gray-300/50',
      label: 'BASIC' 
    },
  };

  const config = roleConfig[role || 'basic'] || roleConfig.basic;

  return (
    <span className={`${sizeClasses} rounded-full font-bold inline-block mt-0.5 border ${isLight ? config.bgLight : config.bg}`}>
      {config.label}
    </span>
  );
}
