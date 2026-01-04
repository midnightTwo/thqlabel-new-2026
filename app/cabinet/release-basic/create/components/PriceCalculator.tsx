import React from 'react';
import { 
  calculatePaymentAmount, 
  formatPrice,
  type ReleaseType 
} from '@/lib/utils/calculatePayment';

interface PriceCalculatorProps {
  releaseType: ReleaseType | null;
  tracksCount: number;
  userRole: 'basic' | 'exclusive';
}

export default function PriceCalculator({ releaseType, tracksCount, userRole }: PriceCalculatorProps) {
  // Не показываем калькулятор для Exclusive пользователей
  if (userRole === 'exclusive') {
    return null;
  }

  // Не показываем калькулятор, если нет треков
  if (tracksCount === 0) {
    return null;
  }

  // Используем единую утилиту расчёта
  const { total, breakdown } = calculatePaymentAmount(releaseType, tracksCount);

  return (
    <div className="p-4 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 border border-green-500/20 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-300" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm">Оплата</h3>
        </div>
      </div>

      <div className="pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm">Треков:</span>
          <span className="text-white font-semibold">{tracksCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white font-bold">Итого:</span>
          <span className="text-xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {total.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>
    </div>
  );
}
