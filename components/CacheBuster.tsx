"use client";

import { useCallback, useEffect } from 'react';

// Авто-версия билда: Next.js подставляет это значение на этапе сборки.
// Меняется при каждом `next build`, что устраняет рассинхрон чанков/Server Actions у части клиентов.
const BUILD_VERSION =
  process.env.NEXT_PUBLIC_BUILD_TIME ||
  (process.env.NEXT_PUBLIC_BUILD_ID as string | undefined) ||
  'unknown';

/**
 * Компонент для одноразовой очистки кэша при обновлении версии
 * НЕ трогает localStorage (кроме своего ключа) и cookies — аккаунт останется
 */
export default function CacheBuster() {
  const forceCacheBust = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const STORAGE_KEY = 'thqlabel_build_version';
    let savedVersion: string | null = null;
    try {
      savedVersion = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Если localStorage заблокирован (редкие браузеры/режимы) — не рискуем зациклить reload.
      return;
    }

    // Если версия совпадает — ничего не делаем
    if (savedVersion === BUILD_VERSION) return;

    console.log(`[CacheBuster] Обновление: ${savedVersion || 'нет'} → ${BUILD_VERSION}`);

    try {
      // 1. Очищаем Service Worker кэш
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }

      // 2. Отключаем Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }

      // 3. Очищаем performance cache
      if ('performance' in window && (performance as any).clearResourceTimings) {
        (performance as any).clearResourceTimings();
      }
    } catch (e) {
      // Silent fail
    }

    // Сохраняем новую версию ПЕРЕД перезагрузкой (чтобы не зациклиться)
    try {
      window.localStorage.setItem(STORAGE_KEY, BUILD_VERSION);
    } catch {
      // ignore
    }

    // Жёсткая перезагрузка — браузер заново скачает все JS/CSS
    window.location.reload();
  }, []);

  useEffect(() => {
    // Проверяем версию один раз при загрузке
    forceCacheBust();
  }, [forceCacheBust]);

  return (
    <>
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="-1" />
    </>
  );
}
