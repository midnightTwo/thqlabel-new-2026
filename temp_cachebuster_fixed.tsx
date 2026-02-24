"use client";

import { useCallback, useEffect } from 'react';

const BUILD_VERSION =
  process.env.NEXT_PUBLIC_BUILD_TIME ||
  (process.env.NEXT_PUBLIC_BUILD_ID as string | undefined) ||
  'unknown';

export default function CacheBuster() {
  const forceCacheBust = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const STORAGE_KEY = 'thqlabel_build_version';

    let savedVersion: string | null = null;
    try {
      savedVersion = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }

    if (savedVersion === BUILD_VERSION) return;

    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      if ('performance' in window && (performance as any).clearResourceTimings) {
        (performance as any).clearResourceTimings();
      }
    } catch {
      // ignore
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, BUILD_VERSION);
    } catch {
      // ignore
    }

    window.location.reload();
  }, []);

  useEffect(() => {
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
