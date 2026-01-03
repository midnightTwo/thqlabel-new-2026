'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { UserRole, ROLE_CONFIG } from '../../lib/types';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  nickname: string;
  memberId: string;
  role: UserRole;
  avatar: string;
  activeTab: 'releases' | 'finance' | 'settings';
  unreadTicketsCount: number;
  onTabChange: (tab: 'releases' | 'finance' | 'settings') => void;
  onShowAvatarModal: () => void;
  onSupportToggle: () => void;
  showToast: () => void;
  isLight?: boolean;
}

export default function MobileSidebar({
  isOpen,
  onClose,
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
}: MobileSidebarProps) {
  const config = ROLE_CONFIG[role];

  // Блокируем скролл body при открытии и скрываем элементы хедера
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-mobile-sidebar-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-mobile-sidebar-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-mobile-sidebar-open');
    };
  }, [isOpen]);

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

  const handleTabChange = (tab: 'releases' | 'finance' | 'settings') => {
    onTabChange(tab);
    onClose();
  };

  const handleSupportClick = () => {
    onSupportToggle();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`lg:hidden fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Slide-in Panel */}
      <div 
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-[201] w-[85%] max-w-[320px] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,245,255,0.98) 100%)'
            : 'linear-gradient(135deg, rgba(13,13,15,0.98) 0%, rgba(20,18,30,0.98) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderLeft: isLight 
            ? '1px solid rgba(138,99,210,0.15)'
            : '1px solid rgba(157,141,241,0.15)',
          boxShadow: isLight
            ? '-8px 0 32px rgba(138,99,210,0.1)'
            : '-8px 0 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Декоративный фон */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(157,141,241,0.4) 0%, transparent 70%)',
              filter: 'blur(40px)'
            }}
          />
          <div 
            className="absolute bottom-20 -left-10 w-40 h-40 rounded-full opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(96,80,186,0.5) 0%, transparent 70%)',
              filter: 'blur(30px)'
            }}
          />
        </div>

        <div className="flex flex-col h-full p-5 relative z-10 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <span className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-[#3d3660]' : 'text-white/70'}`}>
              Профиль
            </span>
          </div>

          {/* Профиль */}
          <div className="mb-6">
            {/* Аватар + Ник + Роль */}
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => {
                  onShowAvatarModal();
                  onClose();
                }}
                className={`relative w-16 h-16 flex-shrink-0 rounded-xl ${avatar ? '' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-2xl font-black border-2 ${config.borderColor} ${role === 'exclusive' ? 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0d0d0f]' : role === 'admin' ? 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-[#0d0d0f]' : ''} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
                style={{ 
                  boxShadow: `0 0 20px ${config.glowColor}`,
                }}
              >
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-white">
                    {nickname.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">Изменить</span>
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-black mb-1.5 text-left truncate ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                  {nickname}
                </h3>
                
                <div 
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${config.bgColor} ${config.textColor} border ${config.borderColor} ${role === 'exclusive' ? 'animate-pulse' : ''}`}
                  style={{ boxShadow: `0 0 12px ${config.glowColor}` }}
                >
                  <span>{config.shortLabel}</span>
                </div>
              </div>
            </div>

            {/* ID участника */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 ${isLight ? 'bg-white/60 text-[#1a1535] border-white/70' : 'bg-black/40 text-zinc-400 border-white/5'} rounded-lg text-[9px] font-mono border`}>
                {memberId || 'Загрузка...'}
              </span>
              <button 
                onClick={() => copyToClipboard(memberId)}
                className={`px-2 py-1 ${isLight ? 'bg-white/60 hover:bg-[#8a63d2]/15' : 'bg-white/5 hover:bg-[#6050ba]/30'} rounded-lg transition`}
                title="Копировать тэг"
                disabled={!memberId}
              >
                <svg className={`w-3.5 h-3.5 ${isLight ? 'text-[#3d3660]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <p className={`text-[10px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-600'} mt-2 text-left truncate`}>
              {user?.email}
            </p>
          </div>

          {/* Разделитель */}
          <div className={`h-[1px] ${isLight ? 'bg-gradient-to-r from-transparent via-[#8a63d2]/20 to-transparent' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'} mb-4`} />

          {/* Навигация */}
          <nav className="space-y-2 flex-1">
            {/* Релизы */}
            <button 
              onClick={() => handleTabChange('releases')} 
              className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 border ${
                activeTab === 'releases' 
                  ? isLight 
                    ? 'bg-gradient-to-r from-[#8a63d2]/20 to-[#a78bfa]/15 text-[#8a63d2] border-[#8a63d2]/25' 
                    : 'bg-gradient-to-r from-[#6050ba]/40 to-[#7c6dd6]/30 text-white border-[#9d8df1]/30'
                  : isLight 
                    ? 'text-[#3d3660] bg-white/50 hover:bg-white/70 border-white/60' 
                    : 'text-zinc-300 bg-white/5 hover:bg-white/10 border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${activeTab === 'releases' ? (isLight ? 'text-[#8a63d2]' : 'text-white') : isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="text-sm font-bold">Релизы</span>
              </div>
            </button>
            
            {/* Финансы */}
            <button 
              onClick={() => handleTabChange('finance')} 
              className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 border ${
                activeTab === 'finance' 
                  ? isLight 
                    ? 'bg-gradient-to-r from-[#8a63d2]/20 to-[#a78bfa]/15 text-[#8a63d2] border-[#8a63d2]/25' 
                    : 'bg-gradient-to-r from-[#6050ba]/40 to-[#7c6dd6]/30 text-white border-[#9d8df1]/30'
                  : isLight 
                    ? 'text-[#3d3660] bg-white/50 hover:bg-white/70 border-white/60' 
                    : 'text-zinc-300 bg-white/5 hover:bg-white/10 border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${activeTab === 'finance' ? (isLight ? 'text-[#8a63d2]' : 'text-white') : isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold">Финансы</span>
              </div>
            </button>
            
            {/* Поддержка */}
            <button 
              onClick={handleSupportClick} 
              className={`relative w-full text-left py-3 px-4 rounded-xl transition-all duration-300 border ${
                isLight 
                  ? 'text-[#3d3660] bg-white/50 hover:bg-white/70 border-white/60' 
                  : 'text-zinc-300 bg-white/5 hover:bg-white/10 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className={`w-5 h-5 ${isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-sm font-bold">Поддержка</span>
                </div>
                {unreadTicketsCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadTicketsCount}
                  </span>
                )}
              </div>
            </button>

            {/* Настройки */}
            <button 
              onClick={() => handleTabChange('settings')} 
              className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 border ${
                activeTab === 'settings' 
                  ? isLight 
                    ? 'bg-gradient-to-r from-[#8a63d2]/20 to-[#a78bfa]/15 text-[#8a63d2] border-[#8a63d2]/25' 
                    : 'bg-gradient-to-r from-[#6050ba]/40 to-[#7c6dd6]/30 text-white border-[#9d8df1]/30'
                  : isLight 
                    ? 'text-[#3d3660] bg-white/50 hover:bg-white/70 border-white/60' 
                    : 'text-zinc-300 bg-white/5 hover:bg-white/10 border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${activeTab === 'settings' ? (isLight ? 'text-[#8a63d2]' : 'text-white') : isLight ? 'text-[#8a85a0]' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-bold">Настройки</span>
              </div>
            </button>
            
            {/* Админ ссылка */}
            {(role === 'admin' || role === 'owner') && (
              <Link 
                href="/admin"
                onClick={onClose}
                className={`w-full block text-left py-3 px-4 rounded-xl transition-all duration-300 border ${
                  isLight 
                    ? role === 'owner' 
                      ? 'bg-gradient-to-r from-[#8a63d2]/25 to-violet-500/20 text-[#8a63d2] border-[#8a63d2]/30' 
                      : 'bg-gradient-to-r from-rose-500/25 to-red-500/20 text-rose-600 border-rose-400/40'
                    : role === 'owner' 
                      ? 'bg-gradient-to-r from-purple-600/20 to-violet-600/20 text-purple-300 border-purple-500/30' 
                      : 'bg-gradient-to-r from-rose-600/20 to-red-600/20 text-rose-300 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className={`w-5 h-5 ${isLight ? (role === 'owner' ? 'text-[#8a63d2]' : 'text-rose-600') : (role === 'owner' ? 'text-purple-300' : 'text-rose-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-bold">Админ панель</span>
                </div>
              </Link>
            )}
          </nav>

          {/* Footer */}
          <div className={`mt-4 pt-4 ${isLight ? 'border-t border-[#8a63d2]/10' : 'border-t border-white/5'}`}>
            <p className={`text-[9px] ${isLight ? 'text-[#8a85a0]' : 'text-zinc-700'} text-center`}>
              thqlabel © 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
