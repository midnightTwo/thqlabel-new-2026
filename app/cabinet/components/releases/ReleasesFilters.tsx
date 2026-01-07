"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Release, FilterState } from './types';
import { FILTER_OPTIONS, SORT_OPTIONS } from './constants';
import { useTheme } from '@/contexts/ThemeContext';

// Кастомный красивый Select компонент
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isLight: boolean;
  placeholder?: string;
}

function CustomSelect({ value, onChange, options, isLight, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm rounded-xl transition-all duration-200 flex items-center justify-between gap-2 ${
          isLight
            ? 'bg-white/80 border border-purple-200/50 text-[#1a1535] hover:border-purple-300/70 hover:bg-white/95'
            : 'bg-[#1e1b32]/90 border border-[#9d8df1]/20 text-white hover:border-[#9d8df1]/40 hover:bg-[#1e1b32]'
        } ${isOpen ? (isLight ? 'border-purple-400/70 shadow-lg shadow-purple-500/10' : 'border-[#9d8df1]/50 shadow-lg shadow-purple-500/20') : ''}`}
      >
        <span className={!selectedOption ? (isLight ? 'text-gray-400' : 'text-zinc-500') : ''}>
          {selectedOption?.label || placeholder || 'Выберите...'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isLight ? 'text-purple-500' : 'text-[#9d8df1]'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 w-full mt-2 py-1 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
          isLight
            ? 'bg-white/95 backdrop-blur-xl border border-purple-200/50 shadow-xl shadow-purple-500/15'
            : 'bg-[#1a1730]/95 backdrop-blur-xl border border-[#9d8df1]/25 shadow-2xl shadow-purple-900/40'
        }`}>
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 ${
                  value === option.value
                    ? isLight
                      ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 font-medium'
                      : 'bg-gradient-to-r from-[#9d8df1]/25 to-[#6050ba]/20 text-[#c4b5fd] font-medium'
                    : isLight
                      ? 'text-[#1a1535] hover:bg-purple-50/80'
                      : 'text-zinc-300 hover:bg-[#9d8df1]/10'
                }`}
              >
                {value === option.value && (
                  <svg className={`w-4 h-4 ${isLight ? 'text-purple-500' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={value === option.value ? '' : 'ml-6'}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className={`p-4 sm:p-5 rounded-2xl space-y-4 sm:space-y-5 transition-all duration-300 ${
      isLight 
        ? 'bg-gradient-to-br from-white/70 to-purple-50/50 border border-purple-200/30 shadow-lg shadow-purple-500/5' 
        : 'bg-gradient-to-br from-[#1e1b32]/90 to-[#0d0b16]/80 border border-[#9d8df1]/15 shadow-xl shadow-purple-900/20 backdrop-blur-xl'
    }`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Фильтр по статусу */}
        <div>
          <label className={`block text-xs font-medium mb-1.5 sm:mb-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>Статус</label>
          <CustomSelect
            value={filters.filterStatus}
            onChange={(value) => setFilters(prev => ({ ...prev, filterStatus: value }))}
            options={FILTER_OPTIONS}
            isLight={isLight}
          />
        </div>

        {/* Фильтр по типу релиза */}
        <div>
          <label className={`block text-xs font-medium mb-1.5 sm:mb-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>Тип</label>
          <CustomSelect
            value={filters.filterReleaseType || 'all'}
            onChange={(value) => setFilters(prev => ({ ...prev, filterReleaseType: value as any }))}
            options={[
              { value: 'all', label: 'Все типы' },
              { value: 'basic', label: 'Basic' },
              { value: 'exclusive', label: 'Exclusive' }
            ]}
            isLight={isLight}
          />
        </div>

        {/* Фильтр по жанру */}
        <div>
          <label className={`block text-xs font-medium mb-1.5 sm:mb-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>Жанр</label>
          <CustomSelect
            value={filters.filterGenre}
            onChange={(value) => setFilters(prev => ({ ...prev, filterGenre: value }))}
            options={[
              { value: 'all', label: 'Все жанры' },
              ...genres.map(genre => ({ value: genre, label: genre }))
            ]}
            isLight={isLight}
          />
        </div>

        {/* Сортировка */}
        <div>
          <label className={`block text-xs font-medium mb-1.5 sm:mb-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>Сортировка</label>
          <CustomSelect
            value={filters.sortBy}
            onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
            options={SORT_OPTIONS}
            isLight={isLight}
          />
        </div>
      </div>

      {/* Порядок сортировки и кнопка сброса */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-1">
        <div className="flex items-center gap-3">
          <label className={`text-xs font-medium ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>Порядок:</label>
          <button
            onClick={() => setFilters(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
              isLight 
                ? 'bg-white/70 border border-purple-200/50 text-[#5b21b6] hover:bg-white/90 hover:border-purple-300/70 hover:shadow-md hover:shadow-purple-500/10' 
                : 'bg-[#1e1b32]/80 border border-[#9d8df1]/20 text-[#c4b5fd] hover:bg-[#1e1b32] hover:border-[#9d8df1]/40 hover:shadow-lg hover:shadow-purple-500/10'
            }`}
          >
            <span className="text-sm">{filters.order === 'desc' ? '↓' : '↑'}</span>
            {filters.order === 'desc' ? 'Сначала новые' : 'Сначала старые'}
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
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isLight
              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 hover:border-red-300/70 hover:shadow-md hover:shadow-red-500/10'
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10'
          }`}
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
