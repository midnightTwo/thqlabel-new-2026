"use client";
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { createPortal } from 'react-dom';

interface TrashZoneProps {
  isActive: boolean; // Есть ли активное перетаскивание
  isOver: boolean;   // Находится ли элемент над корзиной
}

export function TrashZone({ isActive, isOver }: TrashZoneProps) {
  const { setNodeRef } = useDroppable({
    id: 'trash-zone',
  });
  
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Показываем корзину только когда идет перетаскивание
  if (!isActive || !mounted) {
    return null;
  }

  const trashContent = (
    <div
      ref={setNodeRef}
      className={`
        fixed z-[9999] transition-all duration-300 ease-out
        pointer-events-auto left-1/2 -translate-x-1/2
        ${isOver ? 'scale-110' : 'scale-100'}
      `}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
      }}
    >
      {/* Контейнер корзины */}
      <div className="relative flex flex-col items-center gap-2">
        {/* Иконка корзины */}
        <div className={`
          relative p-3 sm:p-4 rounded-xl sm:rounded-2xl
          transition-all duration-200 ease-out
          min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px]
          flex items-center justify-center
          ${isOver 
            ? 'bg-red-500 shadow-2xl shadow-red-500/60' 
            : 'bg-red-500/20 backdrop-blur-xl border-2 border-red-500/40'
          }
        `}>
          {/* Свечение при hover */}
          {isOver && (
            <div className="absolute inset-0 bg-red-400 rounded-xl sm:rounded-2xl blur-xl opacity-50 -z-10" />
          )}

          {/* Иконка */}
          <svg
            className={`
              w-6 h-6 sm:w-8 sm:h-8
              transition-colors duration-200
              ${isOver ? 'text-white' : 'text-red-400'}
            `}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>

        {/* Текст подсказки - сверху */}
        <div className={`
          absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap
          transition-all duration-200
          ${isOver ? 'opacity-100' : 'opacity-100'}
        `}>
          <div className={`
            text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg
            ${isOver 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-zinc-900/95 text-white backdrop-blur-md border border-white/20'
            }
          `}>
            {isOver ? 'Отпустите!' : 'Удалить'}
          </div>
        </div>
      </div>
    </div>
  );

  // Рендерим через портал в body, чтобы быть поверх всего
  return createPortal(trashContent, document.body);
}
