/**
 * Утилита для расчёта стоимости релиза для Basic пользователей
 * 
 * Тарифы:
 * - Сингл (1 трек): 500 ₽ фиксированно
 * - EP (2-7 треков): 300 ₽ за трек (без скидок)
 * - Альбом (8+ треков):
 *   - Треки 1-20: 300 ₽ за трек
 *   - Треки 21-30: 250 ₽ за трек  
 *   - Треки 31-50: 200 ₽ за трек
 */

export type ReleaseType = 'single' | 'ep' | 'album';

export interface PriceBreakdown {
  range: string;
  count: number;
  pricePerTrack: number;
  subtotal: number;
}

export interface PaymentCalculation {
  total: number;
  breakdown: PriceBreakdown[];
  tracksCount: number;
  releaseType: ReleaseType | null;
}

/**
 * Получить диапазон цен для типа релиза (для предпросмотра)
 */
export function getPriceRange(releaseType: ReleaseType | null | undefined): { min: number; max: number; description: string } {
  switch (releaseType) {
    case 'single':
      return { min: 500, max: 500, description: '500 ₽' };
    case 'ep':
      // EP: 2-7 треков по 300₽
      return { min: 600, max: 2100, description: '600 - 2 100 ₽' };
    case 'album':
      // Альбом: 8-50 треков со скидками
      // Мин (8 треков): 8 × 300 = 2400
      // Макс (50 треков): 20×300 + 10×250 + 20×200 = 6000 + 2500 + 4000 = 12500
      return { min: 2400, max: 12500, description: '2 400 - 12 500 ₽' };
    default:
      return { min: 500, max: 12500, description: 'от 500 ₽' };
  }
}

/**
 * Рассчитывает стоимость релиза на основе типа и количества треков
 */
export function calculatePaymentAmount(
  releaseType: ReleaseType | null | undefined,
  tracksCount: number
): PaymentCalculation {
  // Сингл - фиксированная цена 500 ₽
  if (releaseType === 'single' || tracksCount === 1) {
    return {
      total: 500,
      breakdown: [
        { range: 'Сингл', count: 1, pricePerTrack: 500, subtotal: 500 }
      ],
      tracksCount: 1,
      releaseType: 'single'
    };
  }

  // EP (2-7 треков) - все по 300₽ без скидок
  if (releaseType === 'ep' || (tracksCount >= 2 && tracksCount <= 7)) {
    const total = tracksCount * 300;
    return {
      total,
      breakdown: [
        { range: 'EP', count: tracksCount, pricePerTrack: 300, subtotal: total }
      ],
      tracksCount,
      releaseType: 'ep'
    };
  }

  // Альбом (8+ треков) - динамический расчёт со скидками
  const breakdown: PriceBreakdown[] = [];
  let total = 0;
  let remaining = tracksCount;

  // Треки 1-20: 300 ₽ за трек
  if (remaining > 0) {
    const count = Math.min(remaining, 20);
    const pricePerTrack = 300;
    const subtotal = count * pricePerTrack;
    breakdown.push({ 
      range: '1-20', 
      count, 
      pricePerTrack, 
      subtotal 
    });
    total += subtotal;
    remaining -= count;
  }

  // Треки 21-30: 250 ₽ за трек
  if (remaining > 0) {
    const count = Math.min(remaining, 10);
    const pricePerTrack = 250;
    const subtotal = count * pricePerTrack;
    breakdown.push({ 
      range: '21-30', 
      count, 
      pricePerTrack, 
      subtotal 
    });
    total += subtotal;
    remaining -= count;
  }

  // Треки 31-50: 200 ₽ за трек
  if (remaining > 0) {
    const count = Math.min(remaining, 20);
    const pricePerTrack = 200;
    const subtotal = count * pricePerTrack;
    breakdown.push({ 
      range: '31-50', 
      count, 
      pricePerTrack, 
      subtotal 
    });
    total += subtotal;
  }

  return {
    total,
    breakdown,
    tracksCount,
    releaseType: 'album'
  };
}

/**
 * Получить только сумму оплаты (для краткого использования)
 */
export function getPaymentTotal(
  releaseType: ReleaseType | null | undefined,
  tracksCount: number
): number {
  return calculatePaymentAmount(releaseType, tracksCount).total;
}

/**
 * Форматирует сумму в рублях
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

/**
 * Получает название типа релиза на русском
 */
export function getReleaseTypeName(type: ReleaseType | null | undefined): string {
  switch (type) {
    case 'single': return 'Сингл';
    case 'ep': return 'EP';
    case 'album': return 'Альбом';
    default: return 'Релиз';
  }
}

/**
 * Получает описание количества треков для типа релиза
 */
export function getTracksDescription(type: ReleaseType | null | undefined): string {
  switch (type) {
    case 'single': return '1 трек';
    case 'ep': return '2-7 треков';
    case 'album': return '8-50 треков';
    default: return '';
  }
}
