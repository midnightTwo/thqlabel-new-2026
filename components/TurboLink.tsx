"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, ComponentProps, forwardRef, MouseEvent, TouchEvent } from 'react';

type LinkProps = ComponentProps<typeof Link>;

// Глобальный кэш prefetch для всех ссылок - с ограничением размера!
const globalPrefetchCache = new Set<string>();
const MAX_CACHE_SIZE = 50;

// Ограничение размера кэша для предотвращения утечки памяти
function limitCache() {
  if (globalPrefetchCache.size > MAX_CACHE_SIZE) {
    const arr = Array.from(globalPrefetchCache);
    arr.slice(0, arr.length - MAX_CACHE_SIZE).forEach(url => globalPrefetchCache.delete(url));
  }
}

/**
 * TurboLink - ссылка с МГНОВЕННЫМ переходом
 * 
 * Оптимизации:
 * 1. Prefetch при первом рендере (если в viewport)
 * 2. Prefetch при наведении мыши (mouseenter)
 * 3. Prefetch при касании (touchstart) 
 * 4. Prefetch при фокусе (focus)
 * 5. Optimistic navigation - переход начинается мгновенно
 */
export const TurboLink = forwardRef<HTMLAnchorElement, LinkProps>(({
  href,
  children,
  onMouseEnter,
  onTouchStart,
  onFocus,
  onClick,
  prefetch = true,
  ...props
}, ref) => {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const elementRef = useRef<HTMLAnchorElement | null>(null);
  
  // Получаем URL строку
  const url = typeof href === 'string' ? href : href?.pathname || '';
  
  // Мгновенный prefetch
  const doPrefetch = useCallback(() => {
    if (prefetchedRef.current || !url || globalPrefetchCache.has(url)) return;
    
    // Проверяем что это внутренняя ссылка
    if (!url.startsWith('/') && !url.startsWith(window.location.origin)) return;
    
    prefetchedRef.current = true;
    globalPrefetchCache.add(url);
    limitCache(); // Ограничиваем размер кэша
    
    // Используем микротаск для мгновенного выполнения
    queueMicrotask(() => {
      router.prefetch(url);
    });
  }, [url, router]);
  
  // Mouse enter - мгновенный prefetch
  const handleMouseEnter = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    doPrefetch();
    onMouseEnter?.(e);
  }, [doPrefetch, onMouseEnter]);
  
  // Touch start - мгновенный prefetch для мобильных
  const handleTouchStart = useCallback((e: TouchEvent<HTMLAnchorElement>) => {
    doPrefetch();
    onTouchStart?.(e);
  }, [doPrefetch, onTouchStart]);
  
  // Focus - prefetch для keyboard navigation
  const handleFocus = useCallback((e: React.FocusEvent<HTMLAnchorElement>) => {
    doPrefetch();
    onFocus?.(e);
  }, [doPrefetch, onFocus]);
  
  // Click - оптимистичная навигация
  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // Если это внутренняя ссылка без модификаторов - делаем оптимистичный переход
    if (
      url.startsWith('/') &&
      !e.ctrlKey && 
      !e.metaKey && 
      !e.shiftKey && 
      e.button === 0
    ) {
      // Prefetch на всякий случай
      doPrefetch();
    }
    
    onClick?.(e);
  }, [url, doPrefetch, onClick]);
  
  // Объединяем refs
  const setRef = useCallback((node: HTMLAnchorElement | null) => {
    elementRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  return (
    <Link
      ref={setRef}
      href={href}
      prefetch={prefetch}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onFocus={handleFocus}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
});

TurboLink.displayName = 'TurboLink';

/**
 * useInstantLink - хук для добавления instant navigation к любому элементу
 */
export function useInstantLink(href: string) {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  
  const doPrefetch = useCallback(() => {
    if (prefetchedRef.current || !href || globalPrefetchCache.has(href)) return;
    if (!href.startsWith('/')) return;
    
    prefetchedRef.current = true;
    globalPrefetchCache.add(href);
    limitCache(); // Ограничиваем размер кэша
    router.prefetch(href);
  }, [href, router]);
  
  const navigate = useCallback(() => {
    router.push(href);
  }, [href, router]);
  
  return {
    onMouseEnter: doPrefetch,
    onTouchStart: doPrefetch,
    onFocus: doPrefetch,
    onClick: navigate,
    navigate,
    prefetch: doPrefetch
  };
}

export default TurboLink;
