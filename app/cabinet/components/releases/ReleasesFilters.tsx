"use client";
import React from 'react';
import { Release, FilterState } from './types';
import { FILTER_OPTIONS, SORT_OPTIONS } from './constants';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleasesFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  releases: Release[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  totalCount: number;
  filteredCount: number;
}

export default function ReleasesFilters({
  filters,
  setFilters,
  releases,
  showFilters,
  setShowFilters,
  totalCount,
  filteredCount
}: ReleasesFiltersProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const genres = Array.from(new Set(releases.map(r => r.genre).filter(Boolean))) as string[];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Поиск и кнопка фильтров */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Поиск..."
            className={`w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8a63d2] transition-colors ${
              isLight 
                ? 'bg-white/60 border-white/70 text-[#1a1535] placeholder-[#7a7596]' 
                : 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500'
            }`}
          />
          <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {filters.searchQuery && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className={`absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#5c5580] hover:text-[#3d3660]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
            showFilters 
              ? 'bg-[#8a63d2] text-white' 
              : isLight 
                ? 'bg-white/50 text-[#3d3660] hover:bg-white/70 border border-white/70' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="hidden sm:inline">Фильтры</span>
        </button>
      </div>

      {/* Расширенные фильтры */}
      {showFilters && (
        <FilterPanel 
          filters={filters}
          setFilters={setFilters}
          genres={genres}
          isLight={isLight}
        />
      )}
    </div>
  );
}

// Панель фильтров
interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  genres: string[];
  isLight: boolean;
}

function FilterPanel({ filters, setFilters, genres, isLight }: FilterPanelProps) {
  const hasActiveFilters = filters.searchQuery || filters.filterStatus !== 'all' || filters.filterGenre !== 'all' || filters.filterReleaseType !== 'all';

  return (
    <div className={`p-3 sm:p-4 border rounded-2xl space-y-3 sm:space-y-4 ${
      isLight 
        ? 'bg-white/50 border-white/70' 
        : 'bg-zinc-900/50 border-zinc-800'
    }`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Фильтр по статусу */}
        <div>
          <label className={`block text-xs mb-1.5 sm:mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Статус</label>
          <select
            value={filters.filterStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, filterStatus: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8a63d2] ${
              isLight 
                ? 'bg-white/60 border-white/70 text-[#1a1535]' 
                : 'bg-zinc-800 border-zinc-700 text-white'
            }`}
          >
            {FILTER_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по типу релиза */}
        <div>
          <label className={`block text-xs mb-1.5 sm:mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Тип</label>
          <select
            value={filters.filterReleaseType || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, filterReleaseType: e.target.value as any }))}
            className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8a63d2] ${
              isLight 
                ? 'bg-white/60 border-white/70 text-[#1a1535]' 
                : 'bg-zinc-800 border-zinc-700 text-white'
            }`}
          >
            <option value="all">Все типы</option>
            <option value="basic">Basic</option>
            <option value="exclusive">Exclusive</option>
          </select>
        </div>

        {/* Фильтр по жанру */}
        <div>
          <label className={`block text-xs mb-1.5 sm:mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Жанр</label>
          <select 
            value={filters.filterGenre} 
            onChange={(e) => setFilters(prev => ({ ...prev, filterGenre: e.target.value }))} 
            className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8a63d2] ${
              isLight 
                ? 'bg-white/60 border-white/70 text-[#1a1535]' 
                : 'bg-zinc-800 border-zinc-700 text-white'
            }`}
          >
            <option value="all">Все жанры</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Сортировка */}
        <div>
          <label className={`block text-xs mb-1.5 sm:mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Сортировка</label>
          <select 
            value={filters.sortBy} 
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))} 
            className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8a63d2] ${
              isLight 
                ? 'bg-white/60 border-white/70 text-[#1a1535]' 
                : 'bg-zinc-800 border-zinc-700 text-white'
            }`}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Порядок сортировки и кнопка сброса */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <label className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Порядок:</label>
          <button
            onClick={() => setFilters(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))}
            className={`px-3 py-1.5 border rounded-xl text-xs transition-colors ${
              isLight 
                ? 'bg-white/60 border-white/70 text-[#1a1535] hover:bg-white/80' 
                : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
            }`}
          >
            {filters.order === 'desc' ? '↓ Сначала новые' : '↑ Сначала старые'}
          </button>
        </div>

        {/* Кнопка сброса */}
        <button
          onClick={() => setFilters(prev => ({
            ...prev,
            searchQuery: '',
            filterStatus: 'all',
            filterGenre: 'all',
            filterReleaseType: 'all',
            sortBy: 'date',
            order: 'desc'
          }))}
          className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
}
