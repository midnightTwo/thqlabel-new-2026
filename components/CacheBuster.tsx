"use client";

import { useEffect } from 'react';

/**
 * Компонент для агрессивной очистки кэша в dev режиме
 * НЕ трогает localStorage и sessionStorage (чтобы не разлогинивать)
 */
export default function CacheBuster() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const clearAllCaches = async () => {
      // 1. Очищаем Service Worker кэш
      if ('caches' in window) {
        try {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
          console.log('🧹 Service Worker caches cleared');
        } catch (e) {
          console.warn('Failed to clear caches:', e);
        }
      }
      
      // 2. Отключаем и удаляем Service Workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(r => r.unregister()));
          if (registrations.length > 0) {
            console.log('🧹 Service Workers unregistered:', registrations.length);
          }
        } catch (e) {
          console.warn('Failed to unregister service workers:', e);
        }
      }
    };
    
    clearAllCaches();
    
    // Также очищаем при каждом фокусе окна (когда возвращаешься на вкладку)
    const handleFocus = () => clearAllCaches();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <>
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
    </>
  );
}
