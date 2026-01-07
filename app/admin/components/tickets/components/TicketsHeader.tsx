'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { TicketFilter } from '../types';

interface TicketsHeaderProps {
  totalCount: number;
  activeCount: number;
  filter: TicketFilter;
  setFilter: (filter: TicketFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function TicketsHeader({
  totalCount,
  activeCount,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  loading,
  onRefresh,
}: TicketsHeaderProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const filters: { id: TicketFilter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'in_progress', label: 'В работе' },
    { id: 'pending', label: 'Ожидание' },
    { id: 'closed', label: 'Закрыто' },
  ];

  return (
    <>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className={`text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Тикеты поддержки
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            {totalCount} тикетов • {activeCount} активных
          </p>
        </div>

        {/* Поиск и кнопка обновления */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className={`w-full px-4 py-2.5 sm:py-2 pl-10 rounded-lg text-sm focus:outline-none transition-colors min-h-[44px] ${
                isLight 
                  ? 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500'
              }`}
            />
            <svg className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-2.5 sm:p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isLight 
                ? 'bg-white border border-gray-200 hover:border-gray-300 text-gray-600' 
                : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400'
            }`}
            title="Обновить тикеты"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
        <div className="flex gap-2 pb-2 sm:pb-0 sm:flex-wrap">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[40px] ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : isLight 
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
