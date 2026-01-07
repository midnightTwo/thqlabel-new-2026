'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  type: 'single' | 'bulk' | 'publish';
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  type
}: DeleteConfirmModalProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  if (!isOpen) return null;

  const isPublish = type === 'publish';

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center sm:items-start justify-center sm:pt-[15vh] backdrop-blur-sm p-4 animate-in fade-in duration-200 ${
      isLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div className={`admin-dark-modal rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in duration-200 border-2 ${
        isLight 
          ? `bg-white ${isPublish ? 'border-emerald-300 shadow-emerald-200/50' : 'border-red-300 shadow-red-200/50'}` 
          : `bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] ${isPublish ? 'border-emerald-500/30 shadow-emerald-500/20' : 'border-red-500/30 shadow-red-500/20'}`
      }`}>
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${
            isLight
              ? isPublish ? 'bg-emerald-100 border-emerald-300' : 'bg-red-100 border-red-300'
              : isPublish ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-red-500/20 border-red-500/40'
          }`}>
            {isPublish ? (
              <svg className={`w-6 h-6 sm:w-7 sm:h-7 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className={`w-6 h-6 sm:w-7 sm:h-7 ${isLight ? 'text-red-600' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <h3 className={`text-lg sm:text-xl font-black uppercase ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {isPublish ? 'Подтвердите выкладывание' : 'Подтвердите удаление'}
            </h3>
            <p className={`text-xs sm:text-sm ${
              isLight
                ? isPublish ? 'text-emerald-600' : 'text-red-600'
                : isPublish ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {isPublish 
                ? `Будет выложено ${count} релизов`
                : type === 'single' 
                  ? 'Это действие нельзя отменить' 
                  : `Будет удалено ${count} релизов`
              }
            </p>
          </div>
        </div>
        
        <p className={`text-sm sm:text-base mb-5 sm:mb-6 leading-relaxed ${isLight ? 'text-gray-600' : 'text-zinc-300'}`}>
          {isPublish 
            ? `Вы уверены, что хотите выложить ${count} выбранных релизов? Они станут доступны публично.`
            : type === 'single' 
              ? 'Вы уверены, что хотите удалить этот релиз? Все связанные данные будут потеряны.'
              : `Вы уверены, что хотите удалить ${count} выбранных релизов? Все связанные данные будут потеряны.`
          }
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 sm:px-6 py-3 border-2 rounded-xl font-bold transition-all min-h-[44px] ${
              isLight 
                ? 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border-gray-200 hover:border-gray-300 text-gray-700' 
                : 'bg-white/5 hover:bg-white/10 active:bg-white/15 border-white/10 hover:border-white/20 text-white'
            }`}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 sm:px-6 py-3 text-white rounded-xl font-black transition-all shadow-lg min-h-[44px] active:scale-[0.98] ${
              isPublish 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/30' 
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/30'
            }`}
          >
            {isPublish ? 'Выложить' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
