"use client";
import React, { useState, useRef } from 'react';
import { Release } from './types';
import { STATUS_COLORS, formatDate } from './constants';
import { useTheme } from '@/contexts/ThemeContext';

// Компонент красивого бейджа статуса
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; className: string; icon?: React.ReactNode }> = {
    published: { 
      text: 'Выложен', 
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
    },
    approved: { 
      text: 'Одобрен', 
      className: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
    },
    pending: { 
      text: 'На модерации', 
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
    },
    rejected: { 
      text: 'Отклонён', 
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
    },
    draft: { 
      text: 'Черновик', 
      className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
    }
  };
  
  const cfg = config[status] || { text: status, className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
  
  return (
    <div className={`text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap border backdrop-blur-sm transition-all duration-300 group-hover:scale-105 ${cfg.className}`}>
      {cfg.icon}
      <span className="hidden sm:inline">{cfg.text}</span>
      <span className="inline sm:hidden">{cfg.text.length > 8 ? cfg.text.slice(0, 7) + '.' : cfg.text}</span>
    </div>
  );
}

interface ReleaseCardProps {
  release: Release;
  onClick: () => void;
  onDelete?: (releaseId: string) => void;
  onDragStart?: (releaseId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  onDragEnter?: (releaseId: string) => void;
  isDropTarget?: boolean;
}

export default function ReleaseCard({ release, onClick, onDelete, onDragStart, onDragEnd, isDragging, onDragEnter, isDropTarget }: ReleaseCardProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const statusColor = STATUS_COLORS[release.status] || 'bg-zinc-500';
  const isDraft = release.status === 'draft';
  const canDrag = isDraft;
  const lastEnterTimeRef = useRef<number>(0);
  const [isDragStarting, setIsDragStarting] = useState(false);
  
  // Проверяем есть ли explicit контент в релизе
  const hasExplicitContent = release.tracks?.some(track => 
    track.explicit || track.hasDrugs
  ) ?? false;
  
  const statusLabel = {
    pending: 'На модерации',
    rejected: 'Отклонён',
    approved: 'Одобрен',
    published: 'Выложен',
    draft: 'Черновик'
  }[release.status] || release.status;

  // Кружок для статуса
  const getStatusDot = () => {
    const colors = {
      pending: 'bg-yellow-400',
      approved: 'bg-violet-400',
      published: 'bg-green-400',
      rejected: 'bg-red-400',
      draft: 'bg-zinc-400'
    };
    return colors[release.status as keyof typeof colors] || 'bg-zinc-400';
  };

  const shouldAnimate = release.status === 'pending' || release.status === 'approved';

  const dragImageRef = React.useRef<HTMLElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={cardRef}
      draggable={canDrag}
      onDragStart={(e) => {
        if (canDrag) {
          setIsDragStarting(true);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('releaseId', release.id);
          
          // Создаем улучшенное кастомное изображение для перетаскивания
          const card = e.currentTarget as HTMLElement;
          const dragImage = card.cloneNode(true) as HTMLElement;
          
          // Стили для drag preview - как на мобильных устройствах
          dragImage.style.position = 'fixed';
          dragImage.style.top = '-9999px';
          dragImage.style.left = '-9999px';
          dragImage.style.width = card.offsetWidth + 'px';
          dragImage.style.height = card.offsetHeight + 'px';
          dragImage.style.opacity = '0.95';
          dragImage.style.transform = 'rotate(3deg) scale(1.1)';
          dragImage.style.pointerEvents = 'none';
          dragImage.style.zIndex = '10000';
          dragImage.style.borderRadius = '1rem';
          dragImage.style.border = '2px solid rgba(168, 85, 247, 0.6)';
          dragImage.style.boxShadow = `
            0 25px 50px -12px rgba(168, 85, 247, 0.8),
            0 0 0 1px rgba(168, 85, 247, 0.4),
            0 0 30px rgba(168, 85, 247, 0.6),
            inset 0 2px 4px rgba(255, 255, 255, 0.2)
          `;
          dragImage.style.filter = 'brightness(1.2) saturate(1.2)';
          dragImage.style.backdropFilter = 'blur(10px)';
          
          document.body.appendChild(dragImage);
          dragImageRef.current = dragImage;
          
          // Устанавливаем изображение перетаскивания с центрированием
          try {
            const rect = card.getBoundingClientRect();
            e.dataTransfer.setDragImage(
              dragImage, 
              rect.width / 2, 
              rect.height / 2
            );
          } catch (error) {
            console.warn('Drag image setup failed:', error);
          }
          
          // Запускаем onDragStart немного позже для плавности
          requestAnimationFrame(() => {
            onDragStart?.(release.id);
            setTimeout(() => setIsDragStarting(false), 50);
          });
        }
      }}
      onDragEnd={() => {
        if (canDrag) {
          setIsDragStarting(false);
          // Удаляем drag image с небольшой задержкой для плавности
          setTimeout(() => {
            if (dragImageRef.current && document.body.contains(dragImageRef.current)) {
              document.body.removeChild(dragImageRef.current);
              dragImageRef.current = null;
            }
          }, 100);
          onDragEnd?.();
        }
      }}
      onDragEnter={(e) => {
        if (!isDragging && !isDragStarting) {
          e.preventDefault();
          // Throttle для производительности: не чаще раза в 50ms
          const now = Date.now();
          if (now - lastEnterTimeRef.current > 50) {
            lastEnterTimeRef.current = now;
            onDragEnter?.(release.id);
          }
        }
      }}
      onDragOver={(e) => {
        if (!isDragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      className={`relative group p-3 sm:p-4 rounded-xl sm:rounded-2xl overflow-hidden w-full ${
        isDraft ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isDragging ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
      } ${
        isDropTarget && !isDragging
          ? 'ring-2 ring-purple-400 bg-purple-500/10 scale-[0.95] glow-element'
          : !isDragging ? 'hover:scale-[1.03]' : ''
      }`}
      style={{
        transition: isDragging 
          ? 'opacity 0.15s ease-out, transform 0.15s ease-out' 
          : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transformStyle: 'preserve-3d',
        willChange: isDragging ? 'transform, opacity' : 'auto',
        background: isLight 
          ? 'rgba(255, 255, 255, 0.65)' 
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0.005) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: isLight 
          ? '1px solid rgba(255, 255, 255, 0.8)' 
          : '1px solid rgba(255, 255, 255, 0.03)',
        boxShadow: isLight 
          ? '0 8px 32px rgba(138, 99, 210, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
          : '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
      onMouseEnter={(e) => {
        if (isDragging) return;
        const target = e.currentTarget;
        target.style.boxShadow = isLight 
          ? '0 16px 48px rgba(138, 99, 210, 0.2), 0 0 30px rgba(138, 99, 210, 0.1)' 
          : '0 30px 60px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.2)';
        target.style.borderColor = isLight ? 'rgba(138, 99, 210, 0.4)' : 'rgba(168, 85, 247, 0.3)';
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget;
        target.style.boxShadow = isLight 
          ? '0 8px 32px rgba(138, 99, 210, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
          : '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
        target.style.borderColor = isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.03)';
      }}
      onClick={(e) => {
        // Предотвращаем клик при перетаскивании
        if (isDragging || isDragStarting) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick();
      }}
    >
      {/* Фоновые эффекты для красоты */}
      {!isLight && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-pink-400/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        </>
      )}
      {isLight && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-pink-400/3 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-xl sm:rounded-2xl" />
      )}
      
      {/* Обложка с улучшенными эффектами */}
      <div 
        className="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center relative group/cover"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(138, 99, 210, 0.08) 0%, rgba(167, 139, 250, 0.05) 100%)' 
            : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        {release.cover_url ? (
          <img 
            src={release.cover_url} 
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" 
            alt="" 
            draggable="false" 
          />
        ) : (
          <div 
            className="text-2xl sm:text-3xl transition-all duration-300 group-hover:scale-125"
            style={{ color: isLight ? '#8a63d2' : undefined }}
          >
            🎵
          </div>
        )}
        {/* Overlay при наведении на обложку */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Информация с анимационными эффектами */}
      <div className="mt-2 sm:mt-3 relative">
        <div className={`font-bold truncate text-sm sm:text-base transition-all duration-300 ${isLight ? 'text-[#1a1535] group-hover:text-[#8a63d2]' : 'text-white group-hover:text-purple-300'}`}>
          {release.title}
        </div>
        <div className={`text-xs sm:text-sm truncate transition-colors duration-300 ${isLight ? 'text-[#5c5580] group-hover:text-[#3d3660]' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
          {release.artist_name || release.artist}
        </div>
      </div>

      {/* Статус и дата с улучшенным стилем */}
      <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2">
        <StatusBadge status={release.status} />
        
        {/* Бейдж E для explicit контента (в footer справа) */}
        {hasExplicitContent && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-rose-500/20 backdrop-blur-sm rounded-md text-[11px] sm:text-xs font-bold text-rose-400 border border-rose-500/30 flex items-center justify-center">
            E
          </div>
        )}
      </div>
      
      {/* Индикатор редактирования для pending релизов с улучшенной анимацией */}
      {release.status === 'pending' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl sm:rounded-2xl flex items-end justify-center pb-3 sm:pb-4">
          <div className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="transition-all duration-300 group-hover:text-purple-300">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
            </svg>
            Редактировать
          </div>
        </div>
      )}
      
      {/* Индикатор перетаскивания для черновиков */}
      {isDraft && (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg border border-purple-400/30 shadow-lg shadow-purple-500/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-300 sm:w-4 sm:h-4">
              <circle cx="9" cy="5" r="1" fill="currentColor"/>
              <circle cx="9" cy="12" r="1" fill="currentColor"/>
              <circle cx="9" cy="19" r="1" fill="currentColor"/>
              <circle cx="15" cy="5" r="1" fill="currentColor"/>
              <circle cx="15" cy="12" r="1" fill="currentColor"/>
              <circle cx="15" cy="19" r="1" fill="currentColor"/>
            </svg>
          </div>
        </div>
      )}

    </div>
  );
}

// Карточка добавления релиза
interface AddReleaseCardProps {
  onClick: () => void;
}

export function AddReleaseCard({ onClick }: AddReleaseCardProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  return (
    <div 
      className={`relative group p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer hover:scale-[1.03] transition-all duration-200 ease-out w-full`}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        background: isLight 
          ? 'rgba(255, 255, 255, 0.6)' 
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0.005) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: isLight 
          ? '1px solid rgba(255, 255, 255, 0.7)' 
          : '1px solid rgba(255, 255, 255, 0.03)',
        boxShadow: isLight 
          ? '0 8px 32px rgba(138, 99, 210, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
          : '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget;
        target.style.boxShadow = isLight 
          ? '0 16px 48px rgba(138, 99, 210, 0.2), 0 0 30px rgba(138, 99, 210, 0.1)' 
          : '0 30px 60px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.2)';
        target.style.borderColor = 'rgba(138, 99, 210, 0.4)';
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget;
        target.style.boxShadow = isLight 
          ? '0 8px 32px rgba(138, 99, 210, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
          : '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
        target.style.borderColor = isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.03)';
      }}
    >
      {/* Обложка */}
      <div 
        className={`w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-105`}
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(138, 99, 210, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)' 
            : 'linear-gradient(135deg, rgba(138, 99, 210, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)'
        }}
      >
        <div 
          className="text-3xl sm:text-4xl font-light transition-all duration-300 group-hover:scale-125"
          style={{ color: isLight ? '#8a63d2' : '#a78bfa' }}
        >
          +
        </div>
      </div>

      {/* Информация */}
      <div className="mt-2 sm:mt-3 text-center">
        <div className={`font-bold text-sm sm:text-base transition-colors duration-300 ${isLight ? 'text-[#1a1535] group-hover:text-[#8a63d2]' : 'text-white group-hover:text-purple-300'}`}>
          Добавить релиз
        </div>
        <div className="text-xs sm:text-sm text-zinc-400 truncate" style={{ visibility: 'hidden' }}>.</div>
      </div>

      {/* Статус и дата */}
      <div className="mt-2 sm:mt-3 flex items-center justify-between">
        <div className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white font-bold bg-zinc-500`} style={{ visibility: 'hidden' }}>
          .
        </div>
        <div className="text-[9px] sm:text-[11px] text-zinc-400" style={{ visibility: 'hidden' }}>
          .
        </div>
      </div>
    </div>
  );
}
