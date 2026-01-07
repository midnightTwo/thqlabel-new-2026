"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface FloatingTrashBinProps {
  isActive: boolean;
  isOver?: boolean;
  onDrop?: () => void;
  itemCount?: number;
  isLight?: boolean;
  label?: string;
  className?: string;
}

/**
 * Плавающая корзина для удаления (Drag & Drop)
 * Позиционируется в нижнем левом углу с учётом safe-area
 */
export default function FloatingTrashBin({
  isActive,
  isOver = false,
  onDrop,
  itemCount = 0,
  isLight = false,
  label = 'Удалить',
  className = ''
}: FloatingTrashBinProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  // Анимация при активации
  const [showPulse, setShowPulse] = useState(false);
  useEffect(() => {
    if (isActive) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!portalContainer || !isActive) return null;

  const trashBin = (
    <div
      className={`
        fixed z-[150] transition-all duration-300 ease-out
        ${isOver 
          ? 'scale-110' 
          : isHovered 
            ? 'scale-105' 
            : 'scale-100'
        }
        ${showPulse ? 'animate-bounce' : ''}
        ${className}
      `}
      style={{
        left: '16px',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Glow Effect */}
      {isOver && (
        <div 
          className="absolute inset-0 rounded-2xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
            transform: 'scale(1.5)',
          }}
        />
      )}

      {/* Main Container */}
      <div
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-2xl
          transition-all duration-300 cursor-pointer
          ${isOver
            ? 'bg-red-500 text-white shadow-2xl shadow-red-500/50'
            : isLight
              ? 'bg-white/90 text-gray-700 border border-red-200/50 shadow-xl shadow-red-500/10 hover:border-red-300'
              : 'bg-[#1a1730]/95 text-zinc-300 border border-red-500/20 shadow-xl shadow-red-500/20 hover:border-red-500/40'
          }
        `}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          minHeight: '52px',
        }}
      >
        {/* Trash Icon */}
        <div 
          className={`
            flex items-center justify-center w-10 h-10 rounded-xl
            transition-all duration-200
            ${isOver
              ? 'bg-white/20'
              : isLight
                ? 'bg-red-100 text-red-500'
                : 'bg-red-500/20 text-red-400'
            }
          `}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-200 ${isOver ? 'scale-110' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
        </div>

        {/* Label - скрываем на мобильных */}
        <span className={`
          hidden sm:block font-semibold text-sm whitespace-nowrap
          ${isOver ? 'text-white' : ''}
        `}>
          {isOver ? 'Отпустите для удаления' : label}
        </span>

        {/* Count Badge */}
        {itemCount > 0 && !isOver && (
          <span className={`
            absolute -top-2 -right-2 min-w-[22px] h-[22px] 
            flex items-center justify-center px-1.5
            text-[10px] font-bold rounded-full
            ${isLight
              ? 'bg-red-500 text-white'
              : 'bg-red-500 text-white'
            }
            shadow-lg shadow-red-500/30
            animate-in zoom-in duration-200
          `}>
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>

      {/* Tooltip on mobile when not over */}
      {isActive && !isOver && (
        <div 
          className="sm:hidden absolute left-1/2 -translate-x-1/2 -top-10 
          px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap
          bg-zinc-800 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          Перетащите сюда для удаления
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-zinc-800 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );

  return createPortal(trashBin, portalContainer);
}

/**
 * Кнопка архива с адаптивным дизайном
 * На десктопе - текст + иконка, на мобильных - только иконка
 */
interface ArchiveButtonProps {
  onClick: () => void;
  isActive?: boolean;
  count?: number;
  isLight?: boolean;
  label?: string;
  className?: string;
}

export function ArchiveButton({
  onClick,
  isActive = false,
  count = 0,
  isLight = false,
  label = 'Архив',
  className = ''
}: ArchiveButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center gap-2 
        transition-all duration-200 rounded-xl font-medium
        ${isActive
          ? isLight
            ? 'bg-purple-100 text-purple-700 border border-purple-300'
            : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
          : isLight
            ? 'bg-white/80 text-gray-600 border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-purple-500/30 hover:bg-white/10'
        }
        /* Desktop */
        sm:px-4 sm:py-2.5 sm:min-h-[44px]
        /* Mobile - compact icon only */
        px-3 py-2.5 min-h-[44px] min-w-[44px]
        ${className}
      `}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Icon */}
      <svg 
        className="w-5 h-5 shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" 
        />
      </svg>

      {/* Label - скрыт на мобильных */}
      <span className="hidden sm:inline text-sm">{label}</span>

      {/* Count Badge */}
      {count > 0 && (
        <span className={`
          absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] 
          flex items-center justify-center px-1
          text-[9px] font-bold rounded-full
          ${isLight
            ? 'bg-purple-500 text-white'
            : 'bg-purple-500 text-white'
          }
          shadow-md shadow-purple-500/30
        `}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
