"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface AdminMobileNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  userEmail?: string | null;
  userRole?: 'admin' | 'owner';
  isLight?: boolean;
}

export default function AdminMobileNav({
  currentTab,
  onTabChange,
  tabs,
  userEmail,
  userRole = 'admin',
  isLight = false
}: AdminMobileNavProps) {
  const router = useRouter();
  const logoSrc = '/logo.png?v=' + (process.env.NEXT_PUBLIC_BUILD_TIME || '');
  const [isOpen, setIsOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  // Блокируем скролл при открытом меню
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-admin-sidebar-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-admin-sidebar-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-admin-sidebar-open');
    };
  }, [isOpen]);

  const handleTabSelect = useCallback((tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  }, [onTabChange]);

  const mobileHeader = (
    <>
      {/* Top Navigation Bar - только на мобильных, скрывается когда открыт тикет */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 h-14 transition-transform duration-300"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: isLight 
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
            : 'linear-gradient(to bottom, rgba(13,13,15,0.95) 0%, rgba(13,13,15,0.85) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: isLight ? '1px solid rgba(139,92,246,0.15)' : '1px solid rgba(157,141,241,0.15)',
        }}
        data-mobile-header="true"
      >
        {/* Left: Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 active:scale-95 ${
            isLight
              ? 'bg-purple-100/80 text-purple-600 active:bg-purple-200'
              : 'bg-white/10 text-white active:bg-white/20'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Открыть меню"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: Logo & Title */}
        <div className="flex items-center gap-2">
          <img 
            src={logoSrc} 
            alt="thqlabel" 
            className="h-8 w-auto"
            style={{ filter: isLight ? 'brightness(0) saturate(100%)' : 'drop-shadow(0 0 15px rgba(160,141,241,0.6))' }}
          />
          <span 
            className="text-[9px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
          >
            Admin
          </span>
        </div>

        {/* Right: Home Button */}
        <button
          onClick={() => router.push('/cabinet')}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30 transition-all duration-200 active:scale-95"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="В кабинет"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      {/* Spacer for fixed header - скрывается когда открыт тикет */}
      <div 
        className="lg:hidden h-14" 
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        data-mobile-spacer="true"
      />
    </>
  );

  const sidebarDrawer = portalContainer && isOpen ? createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Drawer */}
      <div 
        className="fixed top-0 left-0 bottom-0 z-[201] w-[85%] max-w-[320px] animate-in slide-in-from-left duration-300"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,248,255,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(20,18,35,0.98) 0%, rgba(13,11,22,0.95) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRight: isLight 
            ? '1px solid rgba(139,92,246,0.2)' 
            : '1px solid rgba(157,141,241,0.2)',
          boxShadow: isLight
            ? '8px 0 40px rgba(139,92,246,0.15)'
            : '8px 0 40px rgba(0,0,0,0.5), 0 0 60px rgba(157,141,241,0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            isLight
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className={`p-5 pt-6 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={logoSrc} 
              alt="thqlabel" 
              className="h-12 w-auto"
              style={{ filter: isLight ? 'brightness(0) saturate(100%)' : 'drop-shadow(0 0 20px rgba(160,141,241,0.8))' }}
            />
            <div>
              <span 
                className="text-[10px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 block"
              >
                Админ панель
              </span>
              <p className={`text-[10px] truncate max-w-[150px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                {userEmail}
              </p>
            </div>
          </div>
          <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase inline-block ${
            userRole === 'owner' 
              ? 'bg-purple-500/20 text-purple-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {userRole === 'owner' ? '♛ OWNER' : '★ ADMIN'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const isMainTab = ['users', 'releases', 'tickets', 'transactions', 'withdrawals', 'news'].includes(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`w-full text-left py-3.5 px-4 rounded-2xl flex items-center gap-3 transition-all duration-200 ${
                  isActive
                    ? isLight
                      ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg shadow-purple-500/20 border border-[#6050ba]/30'
                      : 'bg-gradient-to-r from-[#6050ba]/40 to-[#8070da]/30 text-white shadow-lg shadow-purple-500/20 border border-[#9d8df1]/40'
                    : isLight
                      ? 'text-gray-600 hover:bg-gray-100 border border-transparent'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
                style={{ minHeight: '52px' }}
              >
                <span className={`shrink-0 ${isActive ? '' : isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
                  {tab.icon}
                </span>
                <span className={`text-sm font-semibold ${isMainTab ? 'tracking-wide' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer - Home Button */}
        <div 
          className="p-4 border-t border-white/10"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <button
            onClick={() => {
              router.push('/cabinet');
              setIsOpen(false);
            }}
            className="w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/30 transition-all active:scale-[0.98]"
            style={{ minHeight: '52px' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Назад в кабинет
          </button>
        </div>
      </div>
    </>,
    portalContainer
  ) : null;

  return (
    <>
      {mobileHeader}
      {sidebarDrawer}
    </>
  );
}
