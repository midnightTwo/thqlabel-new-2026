"use client";

import { useEffect, useCallback } from 'react';

// ⚡ ВЕРСИЯ БИЛДА — меняй это значение при каждом деплое чтобы форсировать обновление у всех
const BUILD_VERSION = '2026-02-16-v2';

/**
 * Компонент для одноразовой очистки кэша при обновлении версии
 * НЕ трогает localStorage (кроме своего ключа) и cookies — аккаунт останется
 */
export default function CacheBuster() {
  const forceCacheBust = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const STORAGE_KEY = 'thqlabel_build_version';
    const savedVersion = localStorage.getItem(STORAGE_KEY);

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
    localStorage.setItem(STORAGE_KEY, BUILD_VERSION);

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
