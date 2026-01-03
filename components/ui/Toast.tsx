"use client";
import React, { useEffect } from 'react';

export interface ToastProps {
  show?: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ show = true, message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const colors = {
    success: {
      bgGradient: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-500/40',
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-100',
      glow: 'shadow-emerald-500/20',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bgGradient: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/40',
      iconBg: 'bg-red-500',
      text: 'text-red-100',
      glow: 'shadow-red-500/20',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    info: {
      bgGradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/40',
      iconBg: 'bg-blue-500',
      text: 'text-blue-100',
      glow: 'shadow-blue-500/20',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bgGradient: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/40',
      iconBg: 'bg-amber-500',
      text: 'text-amber-100',
      glow: 'shadow-amber-500/20',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  };

  const config = colors[type];

  return (
    <div className="fixed top-6 right-6 z-[99999] animate-slide-in-right">
      <div className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-2xl bg-gradient-to-r ${config.bgGradient} ${config.border} shadow-2xl ${config.glow} min-w-[300px] max-w-[450px]`}>
        <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center text-white shrink-0 shadow-lg`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${config.text} leading-relaxed`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-8 h-8 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center text-white/40 hover:text-white/80 hover:scale-110"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-5 right-5 h-1 rounded-full overflow-hidden bg-white/10">
          <div 
            className={`h-full ${config.iconBg} rounded-full`}
            style={{
              animation: `toastProgress ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
