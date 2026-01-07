'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Profile } from './types';
import { UserListItem } from './UserListItem';

interface UserListProps {
  users: Profile[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentUserRole: string;
  onRoleChange: (userId: string, newRole: 'admin' | 'exclusive' | 'basic' | 'owner') => void;
  onViewProfile: (user: Profile) => void;
  onCopyEmail: (email: string) => void;
  onCopyId: (id: string) => void;
  onRefresh: () => void;
}

export function UserList({
  users,
  loading,
  error,
  totalCount,
  currentUserRole,
  onRoleChange,
  onViewProfile,
  onCopyEmail,
  onCopyId,
  onRefresh,
}: UserListProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-bold text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>Пользователи ({users.length})</h3>
        <button 
          onClick={onRefresh} 
          className={`text-[10px] px-3 py-2 rounded-lg transition min-h-[36px] flex items-center ${
            isLight 
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
              : 'bg-white/5 hover:bg-white/10 text-white'
          }`}
        >
          Обновить
        </button>
      </div>
      
      {error && (
        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
          <p className={`text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>Ошибка: {error}</p>
        </div>
      )}
      
      {loading ? (
        <div className={`py-8 text-center ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>Загрузка пользователей...</div>
      ) : users.length === 0 ? (
        <div className={`py-8 text-center ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>
          <p>Пользователей не найдено</p>
          <p className={`text-xs mt-2 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>Всего в базе: {totalCount}</p>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-300px)] sm:max-h-[600px] overflow-y-auto space-y-2 pr-1 sm:pr-2 -mr-1 sm:-mr-2" style={{ scrollbarWidth: 'thin' }}>
          {users.map(user => (
            <UserListItem
              key={user.id}
              user={user}
              currentUserRole={currentUserRole}
              onRoleChange={onRoleChange}
              onViewProfile={onViewProfile}
              onCopyEmail={onCopyEmail}
              onCopyId={onCopyId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
