'use client';

import React from 'react';

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
  if (!isOpen) return null;

  const isPublish = type === 'publish';
  const borderColor = isPublish ? 'border-emerald-500/30' : 'border-red-500/30';
  const shadowColor = isPublish ? 'shadow-emerald-500/20' : 'shadow-red-500/20';
  const iconBg = isPublish ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-red-500/20 border-red-500/40';
  const iconColor = isPublish ? 'text-emerald-400' : 'text-red-400';
  const subtitleColor = isPublish ? 'text-emerald-300' : 'text-red-300';
  const btnGradient = isPublish 
    ? 'from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/30' 
    : 'from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/30';

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`admin-dark-modal bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border-2 ${borderColor} rounded-2xl p-6 max-w-md w-full shadow-2xl ${shadowColor} animate-in zoom-in duration-200`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl ${iconBg} border-2 flex items-center justify-center`}>
            {isPublish ? (
              <svg className={`w-7 h-7 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className={`w-7 h-7 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-white">
              {isPublish ? 'Подтвердите выкладывание' : 'Подтвердите удаление'}
            </h3>
            <p className={`text-sm ${subtitleColor}`}>
              {isPublish 
                ? `Будет выложено ${count} релизов`
                : type === 'single' 
                  ? 'Это действие нельзя отменить' 
                  : `Будет удалено ${count} релизов`
              }
            </p>
          </div>
        </div>
        
        <p className="text-zinc-300 mb-6 leading-relaxed">
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
            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 rounded-xl font-bold text-white transition-all"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 bg-gradient-to-r ${btnGradient} text-white rounded-xl font-black transition-all shadow-lg`}
          >
            {isPublish ? 'Выложить' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
