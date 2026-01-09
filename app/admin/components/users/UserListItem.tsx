'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Profile, RoleColors, roleColors, roleColorsLight, getUserRole } from './types';
import { RoleDropdown } from './RoleDropdown';

// Функция форматирования времени активности
function formatLastActive(lastActive: string | null | undefined): { text: string; color: string; isOnline: boolean } {
  if (!lastActive) {
    return { text: 'Неизвестно', color: 'text-zinc-600', isOnline: false };
  }

  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffMs = now.getTime() - lastActiveDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 5) {
    return { text: 'Онлайн', color: 'text-emerald-400', isOnline: true };
  } else if (diffMinutes < 60) {
    return { text: `${diffMinutes} мин назад`, color: 'text-emerald-400/70', isOnline: false };
  } else if (diffHours < 24) {
    return { text: `${diffHours} ч назад`, color: 'text-amber-400/70', isOnline: false };
  } else if (diffDays < 7) {
    return { text: `${diffDays} д назад`, color: 'text-zinc-500', isOnline: false };
  } else {
    return { text: lastActiveDate.toLocaleDateString('ru-RU'), color: 'text-zinc-600', isOnline: false };
  }
}

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
  
  // Информация об активности
  const activityInfo = formatLastActive(user.last_active);

  return (
    <div className={`p-3 sm:p-4 ${rc.bg} border ${rc.border} rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-all active:scale-[0.99] ${
      isLight ? 'hover:bg-purple-50/50' : 'hover:bg-white/[0.02]'
    }`}>
      {/* Верхняя строка на мобильных: аватар + инфо + кнопка */}
      <div className="flex items-center gap-3 sm:contents">
        {/* Аватар с индикатором онлайн */}
        <div className="relative shrink-0">
          <div 
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${!user.avatar && rc.bg} flex items-center justify-center text-lg sm:text-xl ${rc.text} font-black border ${rc.border} ${user.avatar ? 'bg-cover bg-center' : ''}`}
            style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : {}}
          >
            {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?')}
          </div>
          {/* Индикатор онлайн */}
          {activityInfo.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1a1a1f] animate-pulse" />
          )}
        </div>
        
        {/* Инфо - мобильная и десктоп версия */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm sm:text-base truncate max-w-[140px] sm:max-w-none ${isLight ? 'text-gray-800' : 'text-white'}`}>{user.nickname || 'Без никнейма'}</span>
            <RoleDropdown
              currentRole={role as 'basic' | 'exclusive' | 'admin' | 'owner'}
              currentUserRole={currentUserRole}
              onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
              isLight={isLight}
            />
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
      
      {/* Баланс и активность - десктоп */}
      <div className="hidden sm:block text-right min-w-[100px]">
        <div className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Баланс</div>
        <div className={`text-lg font-black ${isLight ? 'text-purple-600' : 'text-[#9d8df1]'}`}>
          {Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2}).replace(/\s/g, '.')} ₽
        </div>
        {/* Статус активности */}
        <div className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 ${activityInfo.color}`}>
          {activityInfo.isOnline && (
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
          )}
          {activityInfo.text}
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
