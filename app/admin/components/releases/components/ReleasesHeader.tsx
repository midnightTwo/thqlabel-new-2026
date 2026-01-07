'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleasesHeaderProps {
  viewMode: 'moderation' | 'archive' | 'create';
  setViewMode: (mode: 'moderation' | 'archive' | 'create') => void;
  setStatusFilter: (status: string) => void;
  totalCount: number;
  filteredCount: number;
}

export default function ReleasesHeader({
  viewMode,
  setViewMode,
  setStatusFilter,
  totalCount,
  filteredCount
}: ReleasesHeaderProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  return (
    <div className="flex-1">
      <h2 className={`text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight mb-1 sm:mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
        Управление релизами
      </h2>
      <p className={`text-xs sm:text-sm mb-2 sm:mb-3 lg:mb-4 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
        Найдено: {filteredCount} из {totalCount}
      </p>
      
      {/* Переключатель режимов */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
        <button
          onClick={() => {
            setViewMode('moderation');
            setStatusFilter('pending');
          }}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[40px] ${
            viewMode === 'moderation' 
              ? 'bg-[#6050ba] !text-white' 
              : isLight 
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Модерация
        </button>
        <button
          onClick={() => {
            setViewMode('archive');
            setStatusFilter('all');
          }}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[40px] ${
            viewMode === 'archive' 
              ? 'bg-[#6050ba] !text-white' 
              : isLight 
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Архив
        </button>
        <button
          onClick={() => setViewMode('create')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            viewMode === 'create' 
              ? 'bg-emerald-500 !text-white' 
              : isLight 
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8m-4-4h8" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Добавить релиз</span>
          <span className="sm:hidden">Добавить</span>
        </button>
      </div>
    </div>
  );
}
