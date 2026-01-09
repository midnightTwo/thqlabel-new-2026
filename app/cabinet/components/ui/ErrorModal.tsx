"use client";
import React from 'react';

interface ErrorModalProps {
  show: boolean;
  title?: string;
  message: string;
  details?: string[];
  onClose: () => void;
}

export default function ErrorModal({ show, title = 'Ошибка', message, details, onClose }: ErrorModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-red-500/30 rounded-3xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300"
        style={{ boxShadow: '0 0 60px rgba(239, 68, 68, 0.2)' }}
      >
        {/* Иконка */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center border border-red-500/30">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Заголовок */}
        <h2 className="text-2xl font-black text-center mb-2 text-red-400">{title}</h2>
        
        {/* Сообщение */}
        <p className="text-zinc-300 text-center mb-4">{message}</p>

        {/* Детали (опционально) */}
        {details && details.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <ul className="space-y-2">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-300">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Кнопка */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-black rounded-xl transition-all hover:scale-105"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
