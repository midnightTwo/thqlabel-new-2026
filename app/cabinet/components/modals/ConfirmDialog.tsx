'use client';
import React, { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  show: boolean;
  message: string;
  description?: string;
  type?: 'standard' | 'danger';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ 
  show, 
  message, 
  description,
  type = 'standard',
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm, 
  onCancel 
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [show]);
  
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onCancel();
      }
    };
    
    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [show, onCancel]);
  
  if (!show) return null;
  
  const isDanger = type === 'danger';
  
  return (
    <div 
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-4
        bg-black/70 backdrop-blur-md
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onCancel}
    >
      <div 
        className={`
          relative bg-[#18181b] backdrop-blur-xl
          border ${isDanger ? 'border-red-500/30' : 'border-white/10'}
          rounded-2xl shadow-2xl
          p-6 max-w-sm w-full
          transition-all duration-300
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Иконка */}
        <div className={`flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full ${
          isDanger ? 'bg-red-500/20' : 'bg-blue-500/20'
        }`}>
          {isDanger ? (
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-2xl blur-2xl -z-10 opacity-20
          ${isDanger ? 'bg-red-500' : 'bg-blue-500'}
        `} />
        
        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-2 text-center">
          {message}
        </h3>
        
        {description && (
          <p className="text-sm text-zinc-400 mb-5 text-center leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="
              flex-1 px-4 py-3 rounded-xl font-semibold
              bg-white/5 hover:bg-white/10
              border border-white/10
              text-zinc-300 hover:text-white
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white/20
            "
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`
              flex-1 px-4 py-3 rounded-xl font-semibold
              transition-all duration-200
              focus:outline-none focus:ring-2
              ${isDanger
                ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500/50 shadow-lg shadow-red-500/25'
                : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white focus:ring-purple-500/50 shadow-lg shadow-purple-500/25'
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
