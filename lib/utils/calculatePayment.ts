/**
 * Утилита для расчёта стоимости релиза для Basic пользователей
 * 
 * Тарифы:
 * - Сингл (1 трек): 500 ₽ фиксированно
 * - EP (2-7 треков): 150 ₽ за трек (без скидок)
 * - Альбом (8+ треков): 150 ₽ за трек (без скидок)
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
      // EP: 2-7 треков по 150₽
      return { min: 300, max: 1050, description: '300 - 1 050 ₽' };
    case 'album':
      // Альбом: 8-50 треков по 150₽
      return { min: 1200, max: 7500, description: '1 200 - 7 500 ₽' };
    default:
      return { min: 150, max: 7500, description: 'от 150 ₽' };
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

  // EP (2-7 треков) - все по 150₽ без скидок
  if (releaseType === 'ep' || (tracksCount >= 2 && tracksCount <= 7)) {
    const total = tracksCount * 150;
    return {
      total,
      breakdown: [
        { range: 'EP', count: tracksCount, pricePerTrack: 150, subtotal: total }
      ],
      tracksCount,
      releaseType: 'ep'
    };
  }

  // Альбом (8+ треков) - все по 150₽ без скидок
  const total = tracksCount * 150;
  return {
    total,
    breakdown: [
      { range: 'Альбом', count: tracksCount, pricePerTrack: 150, subtotal: total }
    ],
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
