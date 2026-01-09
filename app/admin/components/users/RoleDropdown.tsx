'use client';

import { useState, useRef, useEffect } from 'react';

type Role = 'basic' | 'exclusive' | 'admin' | 'owner';

interface RoleDropdownProps {
  currentRole: Role;
  currentUserRole: string;
  onRoleChange: (newRole: Role) => void;
  isLight: boolean;
}

const roleConfig: Record<Role, { label: string; icon: string; color: string; lightColor: string }> = {
  basic: { 
    label: 'BASIC', 
    icon: '○',
    color: 'text-zinc-400',
    lightColor: 'text-gray-500'
  },
  exclusive: { 
    label: 'EXCLUSIVE', 
    icon: '◆',
    color: 'text-amber-400',
    lightColor: 'text-amber-600'
  },
  admin: { 
    label: 'ADMIN', 
    icon: '★',
    color: 'text-red-400',
    lightColor: 'text-red-600'
  },
  owner: { 
    label: 'OWNER', 
    icon: '♛',
    color: 'text-purple-400',
    lightColor: 'text-purple-600'
  },
};

export function RoleDropdown({ currentRole, currentUserRole, onRoleChange, isLight }: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const config = roleConfig[currentRole];

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Определяем доступные роли
  const availableRoles: Role[] = ['basic', 'exclusive'];
  if (currentUserRole === 'owner') {
    availableRoles.push('admin', 'owner');
  } else if (currentUserRole === 'admin') {
    // Админ может видеть admin/owner только если пользователь уже имеет эту роль
    if (currentRole === 'admin') availableRoles.push('admin');
    if (currentRole === 'owner') availableRoles.push('owner');
  }

  const isDisabled = currentUserRole === 'admin' && (currentRole === 'admin' || currentRole === 'owner');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Кнопка-триггер */}
      <button
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full font-bold transition-all ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'
        } ${
          isLight 
            ? 'bg-white/80 border border-gray-200 hover:bg-white hover:shadow-md'
            : 'bg-black/40 border border-white/10 hover:bg-black/60 hover:border-white/20'
        }`}
      >
        <span className={`text-xs ${isLight ? config.lightColor : config.color}`}>{config.icon}</span>
        <span className={isLight ? 'text-gray-700' : 'text-white/90'}>{config.label}</span>
        {!isDisabled && (
          <svg className={`w-3 h-3 ml-0.5 transition-transform ${isOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-400' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 z-50 min-w-[180px] rounded-xl shadow-2xl overflow-hidden ${
          isLight 
            ? 'bg-white border border-gray-200'
            : 'bg-zinc-900/95 border border-white/10 backdrop-blur-xl'
        }`}
        style={{ animation: 'fadeInScale 0.15s ease-out' }}
        >
          {availableRoles.map((role) => {
            const rc = roleConfig[role];
            const isSelected = role === currentRole;
            
            return (
              <button
                key={role}
                onClick={() => {
                  onRoleChange(role);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                  isSelected 
                    ? isLight ? 'bg-purple-50' : 'bg-white/10'
                    : isLight ? 'hover:bg-gray-50 active:bg-gray-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <span className={`text-base ${isLight ? rc.lightColor : rc.color}`}>{rc.icon}</span>
                <span className={isLight ? 'text-gray-700' : 'text-white/90'}>{rc.label}</span>
                {isSelected && (
                  <svg className={`w-4 h-4 ml-auto ${isLight ? 'text-purple-500' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
