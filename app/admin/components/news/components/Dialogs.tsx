'use client';

import React from 'react';

interface NotificationProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export function Notification({ show, message, type }: NotificationProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[150] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`px-4 sm:px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
        type === 'success' 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
          : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="font-medium text-sm sm:text-base">{message}</span>
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ show, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center sm:items-start justify-center overflow-y-auto p-4 sm:pt-16 pb-8">
      <div className="admin-dark-modal bg-[#1a1a1f] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Подтверждение</h3>
        <p className="text-zinc-400 text-sm sm:text-base mb-5 sm:mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl font-bold transition min-h-[44px]"
          >
            Нет
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] active:bg-[#8070da] rounded-xl font-bold transition min-h-[44px]"
          >
            Да
          </button>
        </div>
      </div>
    </div>
  );
}

interface LinkDialogProps {
  show: boolean;
  linkText: string;
  setLinkText: (text: string) => void;
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  onInsert: () => void;
  onCancel: () => void;
}

export function LinkDialog({ show, linkText, setLinkText, linkUrl, setLinkUrl, onInsert, onCancel }: LinkDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center sm:items-start justify-center overflow-y-auto p-4 sm:pt-16 pb-8">
      <div className="admin-dark-modal bg-[#1a1a1f] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-base sm:text-lg font-bold mb-4">Вставить ссылку</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">ТЕКСТ ССЫЛКИ</label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Например: Подробнее"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] min-h-[44px]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">URL АДРЕС</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] min-h-[44px]"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl font-bold transition min-h-[44px]"
          >
            Отмена
          </button>
          <button
            onClick={onInsert}
            className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] active:bg-[#8070da] rounded-xl font-bold transition min-h-[44px]"
          >
            Вставить
          </button>
        </div>
      </div>
    </div>
  );
}
