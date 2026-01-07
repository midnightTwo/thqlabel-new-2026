'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Profile, RoleColors, roleColors, roleColorsLight, getUserRole } from './types';

interface UserListItemProps {
  user: Profile;
  currentUserRole: string;
  onRoleChange: (userId: string, newRole: 'admin' | 'exclusive' | 'basic' | 'owner') => void;
  onViewProfile: (user: Profile) => void;
  onCopyEmail: (email: string) => void;
  onCopyId: (id: string) => void;
}

export function UserListItem({
  user,
  currentUserRole,
  onRoleChange,
  onViewProfile,
  onCopyEmail,
  onCopyId,
}: UserListItemProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const role = getUserRole(user) || 'basic';
  const rc = isLight 
    ? (roleColorsLight[role] || roleColorsLight.basic)
    : (roleColors[role] || roleColors.basic);

  return (
    <div className={`p-3 sm:p-4 ${rc.bg} border ${rc.border} rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-all active:scale-[0.99] ${
      isLight ? 'hover:bg-purple-50/50' : 'hover:bg-white/[0.02]'
    }`}>
      {/* Верхняя строка на мобильных: аватар + инфо + кнопка */}
      <div className="flex items-center gap-3 sm:contents">
        {/* Аватар */}
        <div 
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${!user.avatar && rc.bg} flex items-center justify-center text-lg sm:text-xl ${rc.text} font-black border ${rc.border} ${user.avatar ? 'bg-cover bg-center' : ''} shrink-0`}
          style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : {}}
        >
          {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?')}
        </div>
        
        {/* Инфо - мобильная и десктоп версия */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm sm:text-base truncate max-w-[140px] sm:max-w-none ${isLight ? 'text-gray-800' : 'text-white'}`}>{user.nickname || 'Без никнейма'}</span>
            <select 
              value={role}
              onChange={(e) => onRoleChange(user.id, e.target.value as 'admin' | 'exclusive' | 'basic' | 'owner')}
              className={`text-[9px] px-2 py-1 rounded-full font-bold cursor-pointer transition min-h-[28px] ${
                isLight 
                  ? 'bg-white/70 border border-purple-200/50 text-gray-700 hover:bg-white'
                  : 'bg-black/30 border border-white/20 hover:bg-black/50'
              }`}
              disabled={currentUserRole === 'admin' && (role === 'admin' || role === 'owner')}
            >
              <option value="basic">○ BASIC</option>
              <option value="exclusive">◆ EXCLUSIVE</option>
              {currentUserRole === 'owner' && <option value="admin">★ ADMIN</option>}
              {currentUserRole === 'owner' && <option value="owner">♛ OWNER</option>}
              {currentUserRole === 'admin' && role === 'admin' && <option value="admin">★ ADMIN</option>}
              {currentUserRole === 'admin' && role === 'owner' && <option value="owner">♛ OWNER</option>}
            </select>
          </div>
          
          {/* Email с кнопкой копирования */}
          <div className="flex items-center gap-2 mt-0.5">
            <p className={`text-[11px] sm:text-xs truncate ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{user.email}</p>
            <button
              onClick={() => onCopyEmail(user.email)}
              className="hover:opacity-70 transition flex-shrink-0 p-1 -m-1 touch-target"
              title="Копировать email"
            >
              <svg className={`w-3.5 h-3.5 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          {/* ID - скрыт на мобильных в верхней строке */}
          <div className="hidden sm:flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>ID: {user.member_id || user.id?.slice(0, 8)}</span>
            <button
              onClick={() => onCopyId(user.member_id || user.id)}
              className="hover:opacity-70 transition flex-shrink-0"
              title="Копировать ID"
            >
              <svg className={`w-3 h-3 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Кнопка просмотра - справа на мобильных */}
        <button
          onClick={() => onViewProfile(user)}
          className={`p-2.5 sm:p-3 rounded-xl transition-all sm:hidden ${
            isLight 
              ? 'bg-purple-100/60 hover:bg-purple-200/60 border border-purple-200/50'
              : 'bg-[#6050ba]/20 hover:bg-[#6050ba]/40 border border-[#6050ba]/30'
          }`}
          title="Просмотреть профиль"
        >
          <svg className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
      
      {/* Нижняя строка на мобильных: ID + баланс */}
      <div className="flex items-center justify-between sm:hidden pl-14">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>ID: {user.member_id || user.id?.slice(0, 8)}</span>
          <button
            onClick={() => onCopyId(user.member_id || user.id)}
            className="hover:opacity-70 transition flex-shrink-0 p-1 -m-1"
            title="Копировать ID"
          >
            <svg className={`w-3 h-3 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold ${isLight ? 'text-purple-600' : 'text-[#9d8df1]'}`}>
            {Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2}).replace(/\s/g, '.')} ₽
          </div>
        </div>
      </div>
      
      {/* Баланс - десктоп */}
      <div className="hidden sm:block text-right">
        <div className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Баланс</div>
        <div className={`text-lg font-black ${isLight ? 'text-purple-600' : 'text-[#9d8df1]'}`}>
          {Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2}).replace(/\s/g, '.')} ₽
        </div>
        <div className={`text-[9px] mt-0.5 ${isLight ? 'text-gray-400' : 'text-zinc-700'}`}>
          {user.created_at && new Date(user.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>
      
      {/* Кнопка просмотра профиля - десктоп */}
      <button
        onClick={() => onViewProfile(user)}
        className={`hidden sm:flex p-3 rounded-xl transition-all items-center justify-center ${
          isLight 
            ? 'bg-purple-100/60 hover:bg-purple-200/60 border border-purple-200/50'
            : 'bg-[#6050ba]/20 hover:bg-[#6050ba]/40 border border-[#6050ba]/30'
        }`}
        title="Просмотреть профиль"
      >
        <svg className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
  );
}
