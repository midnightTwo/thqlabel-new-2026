'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleasesFiltersProps {
  viewMode: 'moderation' | 'archive' | 'create';
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  filterUserRole: string;
  setFilterUserRole: (role: string) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onReset: () => void;
}

export default function ReleasesFiltersPanel({
  viewMode,
  statusFilter,
  setStatusFilter,
  filterUserRole,
  setFilterUserRole,
  filterDate,
  setFilterDate,
  searchQuery,
  setSearchQuery,
  onReset
}: ReleasesFiltersProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const hasFilters = searchQuery || filterDate || filterUserRole !== 'all' || (viewMode === 'archive' && statusFilter !== 'all');

  return (
    <div className="w-full lg:w-96 relative">
      <div className="space-y-3">
        {/* Поиск */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition ${
              isLight 
                ? 'bg-gray-100 border border-gray-200 placeholder:text-gray-400 focus:border-[#6050ba]/50 text-gray-800' 
                : 'bg-black/30 border border-white/10 placeholder:text-zinc-500 focus:border-[#6050ba]/50'
            }`}
          />
          <svg 
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2"/>
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition ${
                isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
              </svg>
            </button>
          )}
        </div>

        {/* Кнопка показать фильтры */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm hover:border-[#6050ba]/50 transition ${
            isLight 
              ? 'bg-gray-100 border border-gray-200 text-gray-700' 
              : 'bg-black/30 border border-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeWidth="2"/>
            </svg>
            <span>Фильтры и сортировка</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {/* Выпадающая панель фильтров */}
      {showFilters && (
        <div className={`admin-dark-modal absolute top-full left-0 right-0 mt-3 space-y-4 p-5 rounded-2xl shadow-2xl backdrop-blur-xl z-50 ${
          isLight 
            ? 'bg-white border border-gray-200' 
            : 'bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/10'
        }`}>
          {/* Фильтр по статусу (только в архиве) */}
          {viewMode === 'archive' && (
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-xs uppercase tracking-wider font-bold ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Статус релиза
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'Все', icon: 'M4 6h16M4 12h16M4 18h16', color: 'from-violet-500 to-purple-600' },
                  { value: 'approved', label: 'Одобрен', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-violet-500 to-purple-500' },
                  { value: 'published', label: 'Выложен', icon: 'M5 13l4 4L19 7', color: 'from-emerald-500 to-green-500' },
                  { value: 'rejected', label: 'Отклонён', icon: 'M6 18L18 6M6 6l12 12', color: 'from-red-500 to-rose-500' }
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      statusFilter === status.value
                        ? `bg-gradient-to-r ${status.color} text-white shadow-lg shadow-violet-500/20`
                        : isLight 
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-200' 
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={status.icon}/>
                    </svg>
                    <span className="truncate">{status.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Фильтр по типу пользователя */}
          <div className="space-y-2">
            <label className={`flex items-center gap-2 text-xs uppercase tracking-wider font-bold ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Тип подписки
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'all', label: 'Все', icon: 'M4 6h16M4 12h16M4 18h16' },
                { value: 'basic', label: 'Basic', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
                { value: 'exclusive', label: 'Exclusive', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterUserRole(type.value)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    filterUserRole === type.value
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                      : isLight 
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-200' 
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={type.icon}/>
                  </svg>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Фильтр по дате */}
          <div className="space-y-2">
            <label className={`flex items-center gap-2 text-xs uppercase tracking-wider font-bold ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Дата релиза
            </label>
            <div className="relative inline-block w-full">
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className={`w-full inline-flex px-4 py-2.5 rounded-xl border cursor-pointer items-center gap-2 text-sm hover:border-[#6050ba]/50 transition ${
                  isLight 
                    ? 'bg-gray-100 border-gray-200' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span className={filterDate ? (isLight ? 'text-gray-800' : 'text-white') : (isLight ? 'text-gray-400' : 'text-zinc-500')}>
                  {filterDate ? new Date(filterDate + 'T00:00:00').toLocaleDateString('ru-RU') : 'Выберите дату'}
                </span>
                {filterDate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFilterDate(''); }}
                    className={`ml-auto transition ${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {showCalendar && (
                <div className={`absolute z-50 mt-1 p-3 rounded-xl shadow-2xl w-72 ${
                  isLight 
                    ? 'bg-white border border-gray-200' 
                    : 'bg-[#0d0d0f] border border-[#6050ba]/30'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }} className={`p-1 rounded-md ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
                    </button>
                    <div className={`font-bold text-sm ${isLight ? 'text-gray-800' : ''}`}>{new Date(calendarYear, calendarMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    }} className={`p-1 rounded-md ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className={`text-center text-[10px] font-bold py-1 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {(() => {
                      const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                      const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                      const startDay = firstDay === 0 ? 6 : firstDay - 1;
                      const days = [];
                      
                      for (let i = 0; i < startDay; i++) {
                        days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
                      }
                      
                      for (let day = 1; day <= daysInMonth; day++) {
                        const month = calendarMonth + 1;
                        const monthStr = month < 10 ? `0${month}` : `${month}`;
                        const dayStr = day < 10 ? `0${day}` : `${day}`;
                        const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;
                        const isSelected = filterDate === dateStr;
                        
                        days.push(
                          <button 
                            key={`day-${day}`} 
                            onClick={() => { setFilterDate(dateStr); setShowCalendar(false); }}
                            className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] text-white' 
                                : isLight 
                                  ? 'text-gray-700 hover:bg-gray-100' 
                                  : 'text-white hover:bg-white/10'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      }
                      
                      return days;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопка сброса */}
          {hasFilters && (
            <button
              onClick={onReset}
              className={`w-full mt-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                isLight 
                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300' 
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Сбросить все фильтры
            </button>
          )}
        </div>
      )}
    </div>
  );
}
