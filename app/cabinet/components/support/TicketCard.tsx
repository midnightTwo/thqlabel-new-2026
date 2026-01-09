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
  const hasUnread = ticket.has_unread_admin_reply === true;

  return (
    <div
      onClick={onClick}
      className="p-3.5 rounded-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] group"
      style={{
        background: hasUnread
          ? isLight 
            ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(147, 197, 253, 0.3) 100%)' 
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(96, 165, 250, 0.35) 100%)'
          : isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 245, 255, 0.4) 100%)'
            : 'linear-gradient(135deg, rgba(10, 10, 12, 0.6) 0%, rgba(20, 18, 35, 0.7) 100%)',
        border: hasUnread
          ? isLight ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid rgba(96, 165, 250, 0.35)'
          : isLight ? '1px solid rgba(157, 141, 241, 0.25)' : '1.5px solid rgba(157, 141, 241, 0.2)',
        boxShadow: hasUnread 
          ? isLight
            ? '0 4px 20px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)' 
            : '0 4px 20px rgba(59, 130, 246, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
          : isLight 
            ? '0 2px 12px rgba(157, 141, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)' 
            : 'inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(40px) saturate(180%)',
        willChange: 'transform',
        contain: 'layout style paint',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h3 className={`text-sm font-semibold flex-1 line-clamp-1 transition-colors duration-200 ${
          isLight 
            ? 'text-[#1a1535] group-hover:text-[#6050ba]' 
            : 'text-white group-hover:text-purple-200'
        }`}>
          {ticket.subject}
        </h3>
        {hasUnread && (
          <span 
            className="flex-shrink-0 w-3 h-3 rounded-full animate-pulse" 
            style={{ 
              background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
            }}
            title="Новый ответ от поддержки"
          />
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span 
          className="text-[10px] px-2.5 py-1 rounded-full font-medium"
          style={{
            background: ticket.status === 'open' 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(74, 222, 128, 0.3) 100%)'
              : ticket.status === 'in_progress'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.3) 100%)'
              : ticket.status === 'pending'
              ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(250, 204, 21, 0.3) 100%)'
              : 'linear-gradient(135deg, rgba(113, 113, 122, 0.2) 0%, rgba(161, 161, 170, 0.3) 100%)',
            border: ticket.status === 'open' 
              ? '1px solid rgba(34, 197, 94, 0.35)'
              : ticket.status === 'in_progress'
              ? '1px solid rgba(59, 130, 246, 0.35)'
              : ticket.status === 'pending'
              ? '1px solid rgba(234, 179, 8, 0.35)'
              : '1px solid rgba(113, 113, 122, 0.35)',
            color: ticket.status === 'open' 
              ? isLight ? '#15803d' : '#4ade80'
              : ticket.status === 'in_progress'
              ? isLight ? '#1d4ed8' : '#60a5fa'
              : ticket.status === 'pending'
              ? isLight ? '#a16207' : '#facc15'
              : isLight ? '#52525b' : '#a1a1aa',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        >
          {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status}
        </span>
        
        {ticket.category && (
          <span 
            className="text-[10px] px-2.5 py-1 rounded-full font-medium"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(157, 141, 241, 0.2) 0%, rgba(157, 141, 241, 0.3) 100%)' 
                : 'linear-gradient(135deg, rgba(96, 80, 186, 0.3) 0%, rgba(157, 141, 241, 0.4) 100%)',
              border: isLight ? '1px solid rgba(157, 141, 241, 0.35)' : '1px solid rgba(157, 141, 241, 0.3)',
              color: isLight ? '#6050ba' : '#9d8df1',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            {categoryLabels[ticket.category] || ticket.category}
          </span>
        )}

        <span className={`text-[10px] font-mono ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
          #{ticket.id.slice(0, 8)}
        </span>
        
        <span className={`text-[10px] ml-auto ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
          {new Date(ticket.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}
