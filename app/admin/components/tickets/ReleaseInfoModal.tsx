'use client';

import React from 'react';

interface ReleaseInfoModalProps {
  release: any;
  onClose: () => void;
}

export default function ReleaseInfoModal({ release, onClose }: ReleaseInfoModalProps) {
  if (!release) return null;

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'На модерации', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' },
    distributed: { label: 'На дистрибьюции', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
    rejected: { label: 'Отклонен', color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.15)' },
    published: { label: 'Опубликован', color: '#c4b5fd', bgColor: 'rgba(196, 181, 253, 0.15)' },
    approved: { label: 'Одобрен', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' }
  };

  const status = statusConfig[release.status] || { 
    label: release.status, 
    color: '#9d8df1',
    bgColor: 'rgba(157, 141, 241, 0.15)'
  };

  // Функция для получения иконки статуса
  const getStatusIcon = (statusKey: string) => {
    switch (statusKey) {
      case 'pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'approved':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'published':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
        );
      case 'distributed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8" onClick={onClose}>
      <div className="admin-dark-modal bg-zinc-900 border border-purple-500/30 rounded-2xl shadow-2xl max-w-2xl w-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900" onClick={(e) => e.stopPropagation()}>
        {/* Хедер */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-b border-purple-500/30 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Информация о релизе</h3>
              <p className="text-sm text-purple-300">Полные данные</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
          >
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 space-y-6">
          {/* Обложка и основная информация */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              {release.artwork_url ? (
                <img 
                  src={release.artwork_url} 
                  alt={release.title}
                  className="w-48 h-48 rounded-xl object-cover shadow-2xl shadow-purple-500/20"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl">
                  <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-black text-white mb-2">{release.title}</h2>
              <p className="text-xl text-purple-300 mb-4">{release.artist}</p>
              
              {/* Статус */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ 
                  background: status.bgColor, 
                  color: status.color,
                  border: `2px solid ${status.color}40`
                }}
              >
                {getStatusIcon(release.status)}
                <span className="font-bold">{status.label}</span>
              </div>
            </div>
          </div>

          {/* Детали */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <p className="text-xs text-zinc-500 mb-1">Код релиза</p>
              <p className="text-sm font-mono text-purple-400 font-bold">{release.release_code || `thqrel-${release.id?.slice(0, 8)}`}</p>
            </div>
            
            {release.created_at && (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <p className="text-xs text-zinc-500 mb-1">Дата создания</p>
                <p className="text-sm text-white">
                  {new Date(release.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Дополнительная информация */}
          <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-xl">
            <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Дополнительная информация
            </h4>
            <div className="text-sm text-zinc-300 space-y-2">
              <p>• Этот релиз был выбран пользователем при создании тикета</p>
              <p>• Вы можете посмотреть полную информацию о релизе в разделе модерации</p>
              {release.status === 'pending' && (
                <p className="text-yellow-300">• Релиз находится на модерации и ожидает проверки</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
