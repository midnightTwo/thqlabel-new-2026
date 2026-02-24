"use client";
import React from 'react';
import Link from 'next/link';
import { UserRole, ROLE_CONFIG } from '@/app/cabinet/lib/types';

interface SidebarProps {
  nickname: string;
  memberId: string;
  email: string;
  role: UserRole;
  avatar: string;
  tab: 'releases' | 'finance' | 'support' | 'settings';
  setTab: (tab: 'releases' | 'finance' | 'support' | 'settings') => void;
  creatingRelease: boolean;
  setCreatingRelease: (val: boolean) => void;
  createTab: string;
  setCreateTab: (tab: any) => void;
  onSignOut: () => void;
  onCopyMemberId: () => void;
  onOpenAvatarModal: () => void;
}

// Боковая панель кабинета
export default function Sidebar({
  nickname,
  memberId,
  email,
  role,
  avatar,
  tab,
  setTab,
  creatingRelease,
  setCreatingRelease,
  createTab,
  setCreateTab,
  onSignOut,
  onCopyMemberId,
  onOpenAvatarModal
}: SidebarProps) {
  const config = ROLE_CONFIG[role];
  
  return (
    <aside className="lg:w-64 w-full bg-[#0d0d0f] border border-white/5 rounded-3xl p-6 flex flex-col lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {creatingRelease ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold">Создание релиза</div>
            <button onClick={() => { setCreatingRelease(false); setCreateTab('release'); }} className="text-sm text-zinc-400 hover:text-white">← Назад</button>
          </div>
          <div className="space-y-2">
            {[
              { id: 'release', label: 'Релиз' },
              { id: 'tracklist', label: 'Треклист' },
              { id: 'countries', label: 'Страны' },
              { id: 'contract', label: 'Договор' },
              { id: 'platforms', label: 'Площадки' },
              { id: 'localization', label: 'Локализация' },
              { id: 'send', label: 'Отправка' },
              { id: 'events', label: 'События' },
              { id: 'promo', label: 'Промо' },
            ].map((it) => (
              <button key={it.id} onClick={() => setCreateTab(it.id as any)} className={`w-full text-left py-3 px-4 rounded-xl ${createTab === (it.id as any) ? 'bg-[#6050ba] text-white' : 'text-zinc-400 hover:bg-white/5'}`}>
                {it.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Профиль */}
          <div className="mb-6">
            {/* Аватар - кликабельный */}
            <div className="relative mb-5 flex justify-start">
              <button 
                onClick={onOpenAvatarModal}
                className={`relative w-20 h-20 rounded-xl ${avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-3xl font-black border-2 ${config.borderColor} ${role === 'exclusive' ? 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0d0d0f]' : role === 'admin' ? 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-[#0d0d0f]' : ''} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
                style={{ 
                  boxShadow: `0 0 30px ${config.glowColor}`,
                  backgroundImage: avatar ? `url(${avatar})` : 'none'
                }}
              >
                {!avatar && nickname.charAt(0).toUpperCase()}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Изменить</span>
                </div>
              </button>
            </div>

            {/* Никнейм */}
            <h3 className="text-xl font-black mb-3 text-left">{nickname}</h3>

            {/* Красивый статус */}
            <div 
              className={`inline-flex items-center px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider ${config.bgColor} ${config.textColor} border ${config.borderColor} ${role === 'exclusive' ? 'animate-pulse' : ''}`}
              style={{ boxShadow: `0 0 15px ${config.glowColor}` }}
            >
              <span>{config.shortLabel}</span>
            </div>

            {/* ID участника с копированием */}
            <div className="mt-4 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-black/40 rounded-lg text-[10px] font-mono text-zinc-400 border border-white/5">
                {memberId}
              </span>
              <button 
                onClick={onCopyMemberId}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-[#6050ba]/30 rounded-lg transition group"
                title="Копировать тэг"
              >
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-zinc-600 mt-3 text-left">{email}</p>
          </div>

          {/* Разделитель */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>

          {/* Навигация */}
          <nav className="space-y-2">
            {[
              { id: 'releases', label: 'Релизы', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
              { id: 'finance', label: 'Финансы', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { id: 'support', label: 'Поддержка', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
              { id: 'settings', label: 'Настройки', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setTab(item.id as any)} 
                className={`w-full text-left py-3.5 px-5 rounded-xl transition-all duration-200 border flex items-center gap-3 ${
                  tab === item.id 
                    ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/30 border-[#6050ba] scale-[1.02]' 
                    : 'text-zinc-300 bg-white/[0.02] hover:bg-white/[0.08] hover:text-white hover:border-white/10 border-white/5 hover:scale-[1.01] cursor-pointer'
                }`}
              >
                <span className={`shrink-0 ${tab === item.id ? 'text-white' : 'text-zinc-400'}`}>{item.icon}</span>
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
            
            {/* Админ ссылка */}
            {(role === 'admin' || role === 'owner') && (
              <Link 
                href="/admin"
                className={`w-full flex items-center gap-3 text-left py-3.5 px-5 rounded-xl transition-all duration-200 border ${role === 'owner' ? 'text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-200 border-purple-500/20 hover:border-purple-500/30' : 'text-[#ff6b81] bg-red-500/5 hover:bg-[#ff4757]/10 hover:text-red-400 border-red-500/20 hover:border-red-500/30'} hover:scale-[1.01] cursor-pointer`}
              >
                <span className={`shrink-0 ${role === 'owner' ? 'text-purple-400' : 'text-[#ff6b81]'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <span className="text-sm font-bold">Админ панель</span>
              </Link>
            )}

          </nav>

          {/* Завершающий элемент */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[9px] text-zinc-700 text-center">
              thqlabel © 2026
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
