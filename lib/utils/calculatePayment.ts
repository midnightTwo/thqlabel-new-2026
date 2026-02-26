/**
 * Утилита для расчёта стоимости релиза для Basic пользователей
 * 
 * Тарифы:
 * - Первый трек: 500 ₽
 * - Каждый последующий трек: 150 ₽
 * 
 * Примеры:
 * - Сингл (1 трек): 500 ₽
 * - EP (2 трека): 650 ₽
 * - EP (7 треков): 1 400 ₽
 * - Альбом (8 треков): 1 550 ₽
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
      // EP: 2-7 треков — 500 + (n-1)*150
      return { min: 650, max: 1400, description: '650 - 1 400 ₽' };
    case 'album':
      // Альбом: 8-50 треков — 500 + (n-1)*150
      return { min: 1550, max: 7850, description: '1 550 - 7 850 ₽' };
    default:
      return { min: 500, max: 7850, description: 'от 500 ₽' };
  }
}

/**
 * Рассчитывает стоимость релиза на основе типа и количества треков
 */
export function calculatePaymentAmount(
  releaseType: ReleaseType | null | undefined,
  tracksCount: number
): PaymentCalculation {
  // Формула: первый трек 500₽, каждый последующий 150₽
  const firstTrackPrice = 500;
  const additionalTrackPrice = 150;

  // Сингл - фиксированная цена 500 ₽
  if (releaseType === 'single' || tracksCount === 1) {
    return {
      total: firstTrackPrice,
      breakdown: [
        { range: '1-й трек', count: 1, pricePerTrack: firstTrackPrice, subtotal: firstTrackPrice }
      ],
      tracksCount: 1,
      releaseType: 'single'
    };
  }

  // EP (2-7 треков) — 500 + (n-1) * 150
  if (releaseType === 'ep' || (tracksCount >= 2 && tracksCount <= 7)) {
    const additionalCount = tracksCount - 1;
    const total = firstTrackPrice + additionalCount * additionalTrackPrice;
    return {
      total,
      breakdown: [
        { range: '1-й трек', count: 1, pricePerTrack: firstTrackPrice, subtotal: firstTrackPrice },
        { range: 'Доп. треки', count: additionalCount, pricePerTrack: additionalTrackPrice, subtotal: additionalCount * additionalTrackPrice }
      ],
      tracksCount,
      releaseType: 'ep'
    };
  }

  // Альбом (8+ треков) — 500 + (n-1) * 150
  const additionalCount = tracksCount - 1;
  const total = firstTrackPrice + additionalCount * additionalTrackPrice;
  return {
    total,
    breakdown: [
      { range: '1-й трек', count: 1, pricePerTrack: firstTrackPrice, subtotal: firstTrackPrice },
      { range: 'Доп. треки', count: additionalCount, pricePerTrack: additionalTrackPrice, subtotal: additionalCount * additionalTrackPrice }
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
