'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterRole: string;
  setFilterRole: (value: string) => void;
  sortBy: string;
  setSortBy: (value: 'created_at' | 'email' | 'nickname' | 'role') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
}

export function UserFilters({
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: UserFiltersProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const inputClass = isLight 
    ? 'bg-white/70 border border-purple-200/50 text-gray-800 placeholder:text-gray-400'
    : 'bg-black/30 border border-white/10 text-white placeholder:text-zinc-500';
  
  const buttonClass = isLight
    ? 'bg-purple-100/60 hover:bg-purple-200/60 text-purple-700'
    : 'bg-white/5 hover:bg-white/10 text-white';
  
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-stretch sm:items-center">
      {/* Поиск */}
      <div className="relative flex-1 w-full sm:min-w-[200px]">
        <input
          type="text"
          placeholder="Поиск..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-2 pl-9 sm:pl-10 text-sm min-h-[44px] transition-colors ${inputClass}`}
        />
        <svg className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {/* Строка фильтров на мобильных */}
      <div className="flex gap-2 w-full sm:w-auto">
        {/* Фильтр по роли */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className={`flex-1 sm:flex-none rounded-xl px-3 py-2.5 sm:py-2 text-sm min-h-[44px] transition-colors ${inputClass}`}
        >
          <option value="all">Все роли</option>
          <option value="owner">Владельцы</option>
          <option value="admin">Администраторы</option>
          <option value="exclusive">Exclusive</option>
          <option value="basic">Basic</option>
        </select>
        
        {/* Сортировка */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`flex-1 sm:flex-none rounded-xl px-3 py-2.5 sm:py-2 text-sm min-h-[44px] transition-colors ${inputClass}`}
          >
            <option value="role">Роль</option>
            <option value="created_at">Дата</option>
            <option value="email">Email</option>
            <option value="nickname">Ник</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`p-2.5 sm:px-3 sm:py-2 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center ${buttonClass}`}
            title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
    </div>
  );
}
