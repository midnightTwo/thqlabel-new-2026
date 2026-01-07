/**
 * Утилиты для управления кэшем
 * Используй эти функции после сохранения данных
 */

/**
 * Очищает весь кэш браузера (кроме авторизации)
 */
export async function clearAllCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Очищаем Service Worker кэши
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Удаляем Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // Очищаем localStorage кроме auth
    const authKeys = ['sb-', 'supabase', 'thqlabel_theme'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !authKeys.some(authKey => key.includes(authKey))) {
        localStorage.removeItem(key);
      }
    }

    // Очищаем sessionStorage кроме auth
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && !authKeys.some(authKey => key.includes(authKey))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Cache clearing failed silently
  }
}

/**
 * Добавляет timestamp к URL для обхода кэша
 */
export function bustCache(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
}

/**
 * Создаёт fetch с отключённым кэшем
 */
export async function fetchNoCache(url: string, options?: RequestInit): Promise<Response> {
  return fetch(bustCache(url), {
    ...options,
    cache: 'no-store',
    headers: {
      ...options?.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

/**
 * Принудительное обновление страницы без кэша
 */
export function hardRefresh(): void {
  if (typeof window !== 'undefined') {
    // Очищаем кэш и перезагружаем
    clearAllCache().then(() => {
      window.location.reload();
    });
  }
}

/**
 * Мягкое обновление через Next.js router
 */
export function softRefresh(router: any): void {
  if (router && typeof router.refresh === 'function') {
    router.refresh();
  }
}
