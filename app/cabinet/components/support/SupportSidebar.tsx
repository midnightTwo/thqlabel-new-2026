'use client';

import React, { useState, useEffect } from 'react';
import SupportContent from './SupportContent';
import { useTheme } from '@/contexts/ThemeContext';

interface SupportSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  unreadCount: number;
  onUpdateUnreadCount?: () => void;
  isMobile?: boolean;
}

export default function SupportSidebar({ isOpen, onClose, onOpen, unreadCount, onUpdateUnreadCount, isMobile = false }: SupportSidebarProps) {
  const [isWidgetHidden, setIsWidgetHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Блокировка скролла body когда виджет открыт
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Виджет поддержки - Glass Button */}
      {!isOpen && !isWidgetHidden && !isMobile && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <div 
            onClick={onOpen}
            className="relative rounded-full p-3.5 cursor-pointer transition-all duration-300 hover:scale-110 group"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.85) 0%, rgba(157, 141, 241, 0.9) 100%)' 
                : 'linear-gradient(135deg, rgba(157, 141, 241, 0.35) 0%, rgba(200, 180, 255, 0.25) 50%, rgba(157, 141, 241, 0.3) 100%)',
              boxShadow: isLight 
                ? '0 8px 32px rgba(96, 80, 186, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.4)' 
                : '0 6px 20px rgba(157, 141, 241, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -1px 10px rgba(157, 141, 241, 0.4)',
              border: isLight ? '1px solid rgba(255, 255, 255, 0.5)' : '1.5px solid rgba(157, 141, 241, 0.5)',
              backdropFilter: 'blur(50px) saturate(220%) brightness(1.15)',
            }}
            title="Открыть поддержку"
          >
            {/* Animated glow effect */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(157, 141, 241, 0.4) 0%, transparent 70%)',
              }}
            />
            <svg className="w-6 h-6 relative z-10" style={{ color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-bold rounded-full animate-pulse" 
                style={{ 
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  border: '2px solid rgba(24, 24, 27, 0.8)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overlay - Liquid Glass Backdrop (как в мобильном меню) */}
      {isOpen && (
        <div 
          className="liquid-glass-backdrop fixed inset-0 z-[9998] transition-all duration-500"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Liquid Glass Modal (как в мобильном меню) */}
      <div
        className={`liquid-glass-modal support-sidebar fixed top-0 right-0 h-full w-[380px] z-[9999] transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Header - Glass Effect */}
        <div 
          className="flex-shrink-0 flex items-center justify-between p-4 border-b"
          style={{
            background: isLight 
              ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 245, 255, 0.3) 100%)' 
              : 'linear-gradient(180deg, rgba(30, 28, 45, 0.6) 0%, rgba(20, 18, 35, 0.4) 100%)',
            borderColor: isLight ? 'rgba(157, 141, 241, 0.2)' : 'rgba(157, 141, 241, 0.15)',
            boxShadow: isLight 
              ? 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' 
              : 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(157, 141, 241, 0.25) 0%, rgba(157, 141, 241, 0.4) 100%)' 
                  : 'linear-gradient(135deg, rgba(96, 80, 186, 0.4) 0%, rgba(157, 141, 241, 0.5) 100%)',
                boxShadow: isLight 
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 16px rgba(157, 141, 241, 0.25)' 
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 16px rgba(96, 80, 186, 0.4)',
                border: isLight ? '1px solid rgba(157, 141, 241, 0.35)' : '1px solid rgba(157, 141, 241, 0.25)',
              }}
            >
              <svg className={`w-4 h-4 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span 
              className="font-bold"
              style={{
                color: isLight ? '#5b21b6' : '#c4b5fd',
              }}
            >
              Поддержка
            </span>
            {unreadCount > 0 && (
              <span 
                className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ease-in-out animate-pulse" 
                style={{ 
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </h2>
          
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(96,80,186,0.3), rgba(157,141,241,0.2))',
              color: '#9d8df1',
              boxShadow: '0 4px 16px rgba(96,80,186,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            title="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <SupportContent onClose={onClose} onUpdateUnreadCount={onUpdateUnreadCount} isLight={isLight} />
        </div>
      </div>
    </>
  );
}
