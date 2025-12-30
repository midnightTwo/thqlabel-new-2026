import React from 'react';

interface PriceCalculatorProps {
  releaseType: 'single' | 'ep' | 'album' | null;
  tracksCount: number;
  userRole: 'basic' | 'exclusive';
}

export default function PriceCalculator({ releaseType, tracksCount, userRole }: PriceCalculatorProps) {
  // Не показываем калькулятор для Exclusive пользователей
  if (userRole === 'exclusive') {
    return null;
  }

  const calculatePrice = (): { details: Array<{ range: string; count: number; price: number; total: number }>; total: number } => {
    // Сингл - фиксированная цена
    if (releaseType === 'single') {
      return {
        details: [{ range: 'Сингл', count: 1, price: 500, total: 500 }],
        total: 500
      };
    }

    // Альбом/EP - динамический расчет
    const details: Array<{ range: string; count: number; price: number; total: number }> = [];
    let total = 0;
    let remaining = tracksCount;

    // Треки 1-20: 300 ₽ за трек
    if (remaining > 0) {
      const count = Math.min(remaining, 20);
      const price = 300;
      const subtotal = count * price;
      details.push({ range: '1-20', count, price, total: subtotal });
      total += subtotal;
      remaining -= count;
    }

    // Треки 21-30: 250 ₽ за трек
    if (remaining > 0) {
      const count = Math.min(remaining, 10);
      const price = 250;
      const subtotal = count * price;
      details.push({ range: '21-30', count, price, total: subtotal });
      total += subtotal;
      remaining -= count;
    }

    // Треки 31-50: 200 ₽ за трек
    if (remaining > 0) {
      const count = Math.min(remaining, 20);
      const price = 200;
      const subtotal = count * price;
      details.push({ range: '31-50', count, price, total: subtotal });
      total += subtotal;
    }

    return { details, total };
  };

  // Не показываем калькулятор, если нет треков
  if (tracksCount === 0) {
    return null;
  }

  const { details, total } = calculatePrice();

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
