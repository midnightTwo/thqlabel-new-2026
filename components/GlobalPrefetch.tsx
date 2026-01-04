"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * GlobalPrefetch - автоматический prefetch ВСЕХ ссылок на странице
 * 
 * Стратегия:
 * 1. При наведении на любую ссылку - мгновенный prefetch
 * 2. При появлении ссылки в viewport - фоновый prefetch
 * 3. Кэширование уже загруженных URL
 */

// Глобальный кэш загруженных URL
const prefetchedUrls = new Set<string>();

export function GlobalPrefetch() {
  const router = useRouter();

  const prefetchUrl = useCallback((url: string) => {
    // Проверяем что это внутренняя ссылка и ещё не загружена
    if (
      url && 
      !prefetchedUrls.has(url) && 
      (url.startsWith('/') || url.startsWith(window.location.origin))
    ) {
      // Нормализуем URL
      const normalizedUrl = url.startsWith('/') ? url : new URL(url).pathname;
      
      if (!prefetchedUrls.has(normalizedUrl)) {
        prefetchedUrls.add(normalizedUrl);
        router.prefetch(normalizedUrl);
      }
    }
  }, [router]);

  useEffect(() => {
    // Обработчик наведения мыши на ссылки
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link?.href) {
        prefetchUrl(link.href);
      }
    };

    // Обработчик касания для мобильных
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link?.href) {
        prefetchUrl(link.href);
      }
    };

    // Intersection Observer для prefetch ссылок в viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            if (link.href) {
              // Загружаем в фоне с небольшой задержкой
              setTimeout(() => prefetchUrl(link.href), 100);
            }
          }
        });
      },
      { rootMargin: '50px' } // Начинаем загрузку когда ссылка почти в viewport
    );

    // Функция для наблюдения за всеми ссылками
    const observeLinks = () => {
      document.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        // Наблюдаем только за внутренними ссылками
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          observer.observe(link);
        }
      });
    };

    // Наблюдаем за изменениями DOM для новых ссылок
    const mutationObserver = new MutationObserver(() => {
      observeLinks();
    });

    // Слушаем события
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    // Запускаем наблюдение
    observeLinks();
    mutationObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('touchstart', handleTouchStart);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [prefetchUrl]);

  return null;
}

export default GlobalPrefetch;
