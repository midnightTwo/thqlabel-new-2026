// Константы и утилиты для релизов

export const STATUS_LABELS: Record<string, string> = {
  pending: 'На модерации',
  rejected: 'Отклонён',
  approved: 'Одобрен',
  published: 'Выложен',
  draft: 'Черновик',
  awaiting_payment: 'Ожидает оплаты'
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  rejected: 'bg-red-500',
  approved: 'bg-violet-500',
  published: 'bg-green-500',
  draft: 'bg-zinc-500',
  awaiting_payment: 'bg-orange-500'
};

export const STATUS_BADGE_STYLES: Record<string, string> = {
  rejected: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
  approved: 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30',
  draft: 'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30',
  published: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
  awaiting_payment: 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
};

export const FILTER_OPTIONS = [
  { value: 'all', label: 'Все', icon: 'M4 6h16M4 12h16M4 18h16' },
  { value: 'published', label: 'Выложен', icon: 'M5 13l4 4L19 7' },
  { value: 'approved', label: 'Одобрен', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'pending', label: 'На модерации', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'rejected', label: 'Отклонён', icon: 'M6 18L18 6M6 6l12 12' },
  { value: 'draft', label: 'Черновик', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
];

export const SORT_OPTIONS = [
  { value: 'date', label: 'По дате' },
  { value: 'title', label: 'По названию' },
  { value: 'status', label: 'По статусу' }
];

// Утилиты форматирования
export function formatDate(date: string | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU');
}

export function formatDateFull(date: string | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function getTracksWord(count: number): string {
  if (count === 1) return 'трек';
  if (count > 1 && count < 5) return 'трека';
  return 'треков';
}

// Копирование в буфер обмена
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    return true;
  } catch (err) {
    console.error('Ошибка копирования:', err);
    return false;
  }
}
