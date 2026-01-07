'use client';
import React from 'react';

interface TicketCardProps {
  ticket: any;
  onClick: () => void;
  isLight?: boolean;
}

export const statusColors = {
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
};

export const statusColorsLight = {
  open: 'bg-green-100 text-green-600 border-green-300',
  in_progress: 'bg-blue-100 text-blue-600 border-blue-300',
  pending: 'bg-yellow-100 text-yellow-600 border-yellow-300',
  closed: 'bg-gray-100 text-gray-600 border-gray-300'
};

export const statusLabels = {
  open: 'Открыт',
  in_progress: 'В работе',
  pending: 'Ожидание',
  closed: 'Закрыт'
};

export const categoryLabels: Record<string, string> = {
  general: 'Общий вопрос',
  problem: 'Проблема',
  payout: 'Выплаты',
  account: 'Аккаунт',
  releases: 'Релизы',
  other: 'Другое'
};

export default function TicketCard({ ticket, onClick, isLight = false }: TicketCardProps) {
  const hasUnread = ticket.unread_count > 0;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border backdrop-blur-md transition-all cursor-pointer ${
        hasUnread
          ? isLight 
            ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
            : 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30'
          : isLight
            ? 'bg-white border-gray-200 hover:bg-gray-50'
            : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
      style={{ boxShadow: hasUnread ? '0 4px 16px 0 rgba(59, 130, 246, 0.2)' : isLight ? '0 2px 8px 0 rgba(0, 0, 0, 0.05)' : '0 4px 16px 0 rgba(0, 0, 0, 0.1)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`text-sm font-medium flex-1 line-clamp-1 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
          {ticket.subject}
        </h3>
        {hasUnread && (
          <span className="flex-shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 rounded-full" style={{ color: '#ffffff' }}>
            {ticket.unread_count}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          isLight 
            ? (statusColorsLight[ticket.status as keyof typeof statusColorsLight] || 'bg-gray-100 text-gray-600 border-gray-300')
            : (statusColors[ticket.status as keyof typeof statusColors] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30')
        }`}>
          {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status}
        </span>
        
        {ticket.category && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            isLight 
              ? 'bg-purple-100 text-purple-600 border-purple-300'
              : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
          }`}>
            {categoryLabels[ticket.category] || ticket.category}
          </span>
        )}

        <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
          #{ticket.id.slice(0, 8)}
        </span>
        
        <span className={`text-[10px] ml-auto ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
          {new Date(ticket.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}
