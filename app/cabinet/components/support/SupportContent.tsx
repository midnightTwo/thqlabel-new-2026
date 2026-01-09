'use client';
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../lib/fetchWithAuth';
import TicketCard from './TicketCard';
import CreateTicketForm from './CreateTicketForm';
import TicketView from './TicketView';

interface SupportContentProps {
  onClose: () => void;
  onUpdateUnreadCount?: () => void;
  isLight?: boolean;
}

export default function SupportContent({ onClose, onUpdateUnreadCount, isLight = false }: SupportContentProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTickets = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setLoading(true);
      }
      const response = await fetchWithAuth('/api/support/tickets');
      const data = await response.json();
      
      if (data.success) {
        // Сортируем тикеты: новые первыми
        const sortedTickets = (data.tickets || []).sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setTickets(sortedTickets);
        setError('');
      } else {
        setError(data.error || 'Не удалось загрузить тикеты');
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Ошибка при загрузке тикетов');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = (newTicket: any) => {
    setShowCreateForm(false);
    loadTickets();
    setSelectedTicket(newTicket);
  };

  if (selectedTicket) {
    return (
      <div className="h-full flex flex-col">
        <TicketView
          ticket={selectedTicket}
          onBack={() => {
            setSelectedTicket(null);
            loadTickets();
          }}
          onUpdate={loadTickets}
          onClose={onClose}
          onUpdateUnreadCount={onUpdateUnreadCount}
          isLight={isLight}
        />
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <CreateTicketForm
        onCancel={() => setShowCreateForm(false)}
        onCreated={handleTicketCreated}
        isLight={isLight}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Кнопка создания тикета - Liquid Glass Style */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="sidebar-nav-btn active w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 group"
        >
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            background: isLight 
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          <svg className={`w-4 h-4 ${isLight ? 'text-[#7c3aed]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className={`font-semibold ${isLight ? 'text-[#5b21b6]' : ''}`}>Создать тикет</span>
      </button>

      {/* Заголовок - Liquid Glass Title */}
      <div className="flex items-center justify-between">
        <span 
          className="mobile-sidebar-title text-sm font-bold uppercase tracking-wider"
        >
          Ваши тикеты
        </span>
        <button
          onClick={() => loadTickets(true)}
          disabled={loading}
          className="sidebar-nav-btn w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          title="Обновить"
        >
          <svg className={`w-4 h-4 sidebar-nav-icon ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Список тикетов */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-10 w-10 border-2"
            style={{
              borderColor: isLight ? 'rgba(96, 80, 186, 0.3)' : 'rgba(157, 141, 241, 0.3)',
              borderTopColor: isLight ? '#6050ba' : '#9d8df1',
            }}
          />
        </div>
      ) : error ? (
        <div 
          className="p-4 rounded-2xl text-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(248, 113, 113, 0.2) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div 
          className="text-center py-12 space-y-3 rounded-2xl"
          style={{
            background: isLight 
              ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.08) 0%, rgba(157, 141, 241, 0.12) 100%)' 
              : 'linear-gradient(135deg, rgba(10, 10, 12, 0.6) 0%, rgba(20, 18, 35, 0.7) 100%)',
            border: isLight ? '1px solid rgba(157, 141, 241, 0.2)' : '1.5px solid rgba(157, 141, 241, 0.2)',
            boxShadow: isLight 
              ? 'inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
              : 'inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          <div className="text-4xl">📭</div>
          <p className={`text-sm font-medium ${isLight ? 'text-[#6050ba]' : 'text-purple-300'}`}>У вас пока нет тикетов</p>
          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Создайте первый тикет, чтобы связаться с поддержкой</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
              isLight={isLight}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
