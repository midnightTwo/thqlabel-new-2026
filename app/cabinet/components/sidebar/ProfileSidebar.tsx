'use client';
import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { UserRole, ROLE_CONFIG } from '../../lib/types';

interface ProfileSidebarProps {
  user: any;
  nickname: string;
  memberId: string;
  role: UserRole;
  avatar: string;
  activeTab: 'releases' | 'cases' | 'finance' | 'settings';
  unreadTicketsCount: number;
  onTabChange: (tab: 'releases' | 'cases' | 'finance' | 'settings') => void;
  onShowAvatarModal: () => void;
  onSupportToggle: () => void;
  showToast: () => void;
  isLight?: boolean;
}

export default function ProfileSidebar({
  user,
  nickname,
  memberId,
  role,
  avatar,
  activeTab,
  unreadTicketsCount,
  onTabChange,
  onShowAvatarModal,
  onSupportToggle,
  showToast,
  isLight = false,
}: ProfileSidebarProps) {
  const config = ROLE_CONFIG[role];
  const sidebarRef = useRef<HTMLDivElement>(null);

  // DEBUG: Логируем memberId
  React.useEffect(() => {
    console.log('📊 ProfileSidebar получил memberId:', memberId);
  }, [memberId]);

  // Интерактивный эффект подсветки при движении мыши
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = sidebar.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      sidebar.style.setProperty('--mouse-x', `${x}%`);
      sidebar.style.setProperty('--mouse-y', `${y}%`);
    };

    sidebar.addEventListener('mousemove', handleMouseMove);
    return () => sidebar.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast();
  };

  // Определяем градиенты для разных ролей
  const roleGradients: Record<UserRole, string> = {
    basic: 'from-zinc-500 to-zinc-600',
    pro: 'from-blue-500 to-cyan-500',
    exclusive: 'from-amber-400 to-yellow-500',
    admin: 'from-rose-500 to-pink-500',
    owner: 'from-purple-500 to-violet-600',
  };

  return (
    <div ref={sidebarRef} className="cabinet-sidebar-interactive">
      {/* Профиль с анимированным фоном */}
      <div className="mb-6 cabinet-fade-in">
        {/* Аватар + Ник + Роль в одну строку */}
        <div className="flex items-center gap-4 mb-4">
          {/* Аватар с неоновым свечением */}
          <button 
            onClick={onShowAvatarModal}
            className={`cabinet-avatar-glow relative w-20 h-20 flex-shrink-0 rounded-xl ${avatar ? '' : `bg-gradient-to-br ${roleGradients[role]}`} flex items-center justify-center text-3xl font-black border-2 ${config.borderColor} ${role === 'exclusive' ? 'ring-2 ring-amber-400/50 ring-offset-2 ring-offset-transparent' : role === 'admin' ? 'ring-2 ring-rose-400/50 ring-offset-2 ring-offset-transparent' : role === 'owner' ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-transparent' : ''} overflow-hidden cursor-pointer group`}
            style={{ 
              boxShadow: `0 0 30px ${config.glowColor}, 0 10px 40px rgba(0,0,0,0.3)`,
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            {avatar ? (
              <img 
                src={avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <span className="transition-transform duration-300 group-hover:scale-110">
                {nickname.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2">
              <span className="text-white text-[10px] font-bold tracking-wider uppercase">Изменить</span>
            </div>
            {/* Анимированное кольцо */}
            <div className="absolute inset-0 rounded-xl border-2 border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
          </button>

          {/* Никнейм и роль */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-black mb-2 text-left truncate cabinet-gradient-text`}>{nickname}</h3>
            
            {/* Статус с пульсацией */}
            <div 
              className={`cabinet-badge-pulse inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${roleGradients[role]} text-white shadow-lg`}
              style={{ boxShadow: `0 4px 20px ${config.glowColor}` }}
            >
              <span className="relative z-10">{config.shortLabel}</span>
            </div>
          </div>
        </div>

        {/* ID участника с копированием */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`px-3 py-2 ${isLight ? 'bg-white/70 text-[#1a1535] border-white/80' : 'bg-white/5 text-zinc-400 border-white/10'} rounded-xl text-[10px] font-mono border backdrop-blur-xl shadow-inner`}>
            {memberId || 'Загрузка...'}
          </span>
          <button 
            onClick={() => copyToClipboard(memberId)}
            className={`cabinet-btn-wave px-3 py-2 ${isLight ? 'bg-white/70 hover:bg-purple-100 border-white/80' : 'bg-white/5 hover:bg-purple-500/20 border-white/10'} rounded-xl transition-all duration-300 group backdrop-blur-xl border hover:scale-105 active:scale-95`}
            title="Копировать тэг"
            disabled={!memberId}
          >
            <svg className={`w-4 h-4 ${isLight ? 'text-[#3d3660] group-hover:text-purple-600' : 'text-zinc-400 group-hover:text-purple-400'} transition-colors duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <p className={`text-[10px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'} mt-3 text-left font-medium`}>{user?.email}</p>
      </div>

      {/* Неоновая разделительная линия */}
      <div className="cabinet-neon-line mb-5 rounded-full" />

      {/* Навигация с улучшенными эффектами */}
      <nav className="space-y-2">
        {/* РЕЛИЗЫ */}
        <button 
          onClick={() => onTabChange('releases')} 
          className={`cabinet-btn-wave w-full text-left py-3.5 px-5 rounded-2xl transition-all duration-300 border cabinet-fade-in cabinet-fade-in-delay-1 ${
            activeTab === 'releases' 
              ? isLight 
                ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/15 text-purple-700 shadow-lg scale-[1.02] border-purple-300/50 backdrop-blur-xl' 
                : 'bg-gradient-to-r from-purple-600/30 to-violet-600/20 text-white shadow-lg shadow-purple-500/20 scale-[1.02] border-purple-500/30'
              : isLight 
                ? 'text-[#3d3660] bg-white/50 hover:bg-purple-50/80 hover:text-purple-600 hover:scale-[1.01] cursor-pointer border-white/60 backdrop-blur-lg hover:shadow-md hover:border-purple-200/50' 
                : 'text-zinc-300 bg-white/5 hover:bg-purple-500/10 hover:text-white hover:scale-[1.01] cursor-pointer border-white/5 hover:border-purple-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeTab === 'releases' ? (isLight ? 'bg-purple-500/20' : 'bg-purple-500/30') : (isLight ? 'bg-gray-100' : 'bg-white/5')} transition-colors duration-300`}>
              <svg className={`w-5 h-5 ${activeTab === 'releases' ? (isLight ? 'text-purple-600' : 'text-purple-300') : isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-sm font-bold">Релизы</span>
          </div>
        </button>

        {/* КЕЙСЫ */}
        <button 
          onClick={() => onTabChange('cases')} 
          className={`cabinet-btn-wave w-full text-left py-3.5 px-5 rounded-2xl transition-all duration-300 border cabinet-fade-in cabinet-fade-in-delay-1 ${
            activeTab === 'cases' 
              ? isLight 
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-700 shadow-lg scale-[1.02] border-amber-300/50 backdrop-blur-xl' 
                : 'bg-gradient-to-r from-amber-600/30 to-orange-600/20 text-white shadow-lg shadow-amber-500/20 scale-[1.02] border-amber-500/30'
              : isLight 
                ? 'text-[#3d3660] bg-white/50 hover:bg-amber-50/80 hover:text-amber-600 hover:scale-[1.01] cursor-pointer border-white/60 backdrop-blur-lg hover:shadow-md hover:border-amber-200/50' 
                : 'text-zinc-300 bg-white/5 hover:bg-amber-500/10 hover:text-white hover:scale-[1.01] cursor-pointer border-white/5 hover:border-amber-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeTab === 'cases' ? (isLight ? 'bg-amber-500/20' : 'bg-amber-500/30') : (isLight ? 'bg-gray-100' : 'bg-white/5')} transition-colors duration-300`}>
              <svg className={`w-5 h-5 ${activeTab === 'cases' ? (isLight ? 'text-amber-600' : 'text-amber-300') : isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-bold">Кейсы</span>
            <span className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              isLight 
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
            } animate-pulse`}>
              NEW
            </span>
          </div>
        </button>
        
        {/* ФИНАНСЫ */}
        <button 
          onClick={() => onTabChange('finance')} 
          className={`cabinet-btn-wave w-full text-left py-3.5 px-5 rounded-2xl transition-all duration-300 border cabinet-fade-in cabinet-fade-in-delay-2 ${
            activeTab === 'finance' 
              ? isLight 
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 shadow-lg scale-[1.02] border-emerald-300/50 backdrop-blur-xl' 
                : 'bg-gradient-to-r from-emerald-600/30 to-teal-600/20 text-white shadow-lg shadow-emerald-500/20 scale-[1.02] border-emerald-500/30'
              : isLight 
                ? 'text-[#3d3660] bg-white/50 hover:bg-emerald-50/80 hover:text-emerald-600 hover:scale-[1.01] cursor-pointer border-white/60 backdrop-blur-lg hover:shadow-md hover:border-emerald-200/50' 
                : 'text-zinc-300 bg-white/5 hover:bg-emerald-500/10 hover:text-white hover:scale-[1.01] cursor-pointer border-white/5 hover:border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeTab === 'finance' ? (isLight ? 'bg-emerald-500/20' : 'bg-emerald-500/30') : (isLight ? 'bg-gray-100' : 'bg-white/5')} transition-colors duration-300`}>
              <svg className={`w-5 h-5 ${activeTab === 'finance' ? (isLight ? 'text-emerald-600' : 'text-emerald-300') : isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-bold">Финансы</span>
          </div>
        </button>
        
        {/* ПОДДЕРЖКА */}
        <button 
          onClick={onSupportToggle} 
          className={`cabinet-btn-wave relative w-full text-left py-3.5 px-5 rounded-2xl transition-all duration-300 border cabinet-fade-in cabinet-fade-in-delay-3 ${
            isLight 
              ? 'text-[#3d3660] bg-white/50 hover:bg-blue-50/80 hover:text-blue-600 hover:scale-[1.01] cursor-pointer border-white/60 backdrop-blur-lg hover:shadow-md hover:border-blue-200/50' 
              : 'text-zinc-300 bg-white/5 hover:bg-blue-500/10 hover:text-white hover:scale-[1.01] cursor-pointer border-white/5 hover:border-blue-500/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isLight ? 'bg-gray-100' : 'bg-white/5'} transition-colors duration-300`}>
                <svg className={`w-5 h-5 ${isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-sm font-bold">Поддержка</span>
            </div>
            {unreadTicketsCount > 0 && (
              <span className="cabinet-badge-pulse flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30 transition-all duration-300 ease-in-out">
                {unreadTicketsCount}
              </span>
            )}
          </div>
        </button>

        {/* НАСТРОЙКИ */}
        <button 
          onClick={() => onTabChange('settings')} 
          className={`cabinet-btn-wave w-full text-left py-3.5 px-5 rounded-2xl transition-all duration-300 border cabinet-fade-in cabinet-fade-in-delay-4 ${
            activeTab === 'settings' 
              ? isLight 
                ? 'bg-gradient-to-r from-slate-500/20 to-gray-500/15 text-slate-700 shadow-lg scale-[1.02] border-slate-300/50 backdrop-blur-xl' 
                : 'bg-gradient-to-r from-slate-600/30 to-gray-600/20 text-white shadow-lg shadow-slate-500/20 scale-[1.02] border-slate-500/30'
              : isLight 
                ? 'text-[#3d3660] bg-white/50 hover:bg-slate-50/80 hover:text-slate-600 hover:scale-[1.01] cursor-pointer border-white/60 backdrop-blur-lg hover:shadow-md hover:border-slate-200/50' 
                : 'text-zinc-300 bg-white/5 hover:bg-slate-500/10 hover:text-white hover:scale-[1.01] cursor-pointer border-white/5 hover:border-slate-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeTab === 'settings' ? (isLight ? 'bg-slate-500/20' : 'bg-slate-500/30') : (isLight ? 'bg-gray-100' : 'bg-white/5')} transition-colors duration-300`}>
              <svg className={`w-5 h-5 ${activeTab === 'settings' ? (isLight ? 'text-slate-600' : 'text-slate-300') : isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-bold">Настройки</span>
          </div>
        </button>
        
        {/* АДМИН ПАНЕЛЬ */}
        {(role === 'admin' || role === 'owner') && (
          <Link 
            href="/admin"
            className={`cabinet-btn-wave w-full block text-left py-3.5 px-5 rounded-2xl transition-all duration-300 border ${
              isLight 
                ? role === 'owner' 
                  ? 'bg-gradient-to-r from-purple-500/25 to-violet-500/20 text-purple-700 border-purple-300/50 hover:from-purple-500/35 hover:to-violet-500/30 shadow-lg shadow-purple-500/15 backdrop-blur-xl' 
                  : 'bg-gradient-to-r from-rose-500/25 to-red-500/20 text-rose-600 border-rose-300/50 hover:from-rose-500/35 hover:to-red-500/30 shadow-lg shadow-rose-500/15 backdrop-blur-xl'
                : role === 'owner' 
                  ? 'bg-gradient-to-r from-purple-600/25 to-violet-600/20 text-purple-300 border-purple-500/30 hover:from-purple-600/35 hover:to-violet-600/30 hover:text-purple-200 hover:border-purple-500/40 shadow-lg shadow-purple-500/15' 
                  : 'bg-gradient-to-r from-rose-600/25 to-red-600/20 text-rose-300 border-rose-500/30 hover:from-rose-600/35 hover:to-red-600/30 hover:text-rose-200 hover:border-rose-500/40 shadow-lg shadow-rose-500/15'
            } hover:scale-[1.02] cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isLight ? (role === 'owner' ? 'bg-purple-500/20' : 'bg-rose-500/20') : (role === 'owner' ? 'bg-purple-500/30' : 'bg-rose-500/30')} transition-colors duration-300`}>
                <svg className={`w-5 h-5 ${isLight ? (role === 'owner' ? 'text-purple-600' : 'text-rose-600') : (role === 'owner' ? 'text-purple-300' : 'text-rose-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm font-bold">Админ панель</span>
            </div>
          </Link>
        )}
      </nav>

      {/* Завершающий блок с информацией */}
      <div className={`mt-6 pt-4 ${isLight ? 'border-t border-purple-200/30' : 'border-t border-white/5'}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse" />
          <span className={`text-[9px] ${isLight ? 'text-emerald-600' : 'text-emerald-400'} font-medium`}>Online</span>
        </div>
        <p className={`text-[9px] ${isLight ? 'text-[#8a85a0]' : 'text-zinc-600'} text-center font-medium`}>
          thqlabel © 2025
        </p>
      </div>
    </div>
  );
}
