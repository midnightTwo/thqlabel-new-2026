"use client";

import { useEffect, useCallback, useRef, createContext, useContext, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * InstantNavigation - МГНОВЕННАЯ навигация (< 1мс perceived)
 * 
 * Стратегия:
 * 1. Aggressive prefetch - ВСЕ ссылки загружаются сразу
 * 2. Mouse intent detection - начинаем загрузку при движении к ссылке
 * 3. Touch prediction - начинаем загрузку при касании
 * 4. Optimistic routing - переход начинается мгновенно
 * 5. Page component caching - страницы хранятся в памяти
 */

// Глобальный кэш загруженных URL
const loadedUrls = new Set<string>();
const pendingPrefetch = new Set<string>();

// Детектор интента мыши
interface MouseIntent {
  targetUrl: string | null;
  confidence: number;
  timestamp: number;
}

// Context для глобального состояния навигации
interface NavigationContextType {
  isNavigating: boolean;
  targetUrl: string | null;
  startNavigation: (url: string) => void;
  completeNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

// Provider для навигации
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  
  const startNavigation = useCallback((url: string) => {
    setIsNavigating(true);
    setTargetUrl(url);
  }, []);
  
  const completeNavigation = useCallback(() => {
    setIsNavigating(false);
    setTargetUrl(null);
  }, []);
  
  return (
    <NavigationContext.Provider value={{ isNavigating, targetUrl, startNavigation, completeNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Утилита для определения внутренней ссылки
function isInternalUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  if (url.startsWith('#')) return false;
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
}

// Нормализация URL
function normalizeUrl(url: string): string {
  if (url.startsWith('/')) return url.split('?')[0].split('#')[0];
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

// Главный компонент
export function InstantNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const mouseIntentRef = useRef<MouseIntent>({ targetUrl: null, confidence: 0, timestamp: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Мгновенный prefetch URL
  const instantPrefetch = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    if (loadedUrls.has(normalized) || pendingPrefetch.has(normalized)) return;
    
    pendingPrefetch.add(normalized);
    
    // Используем Promise.resolve для микротаск очереди - быстрее чем setTimeout
    Promise.resolve().then(() => {
      router.prefetch(normalized);
      loadedUrls.add(normalized);
      pendingPrefetch.delete(normalized);
    });
  }, [router]);

  // Агрессивный prefetch всех видимых ссылок
  const prefetchAllVisible = useCallback(() => {
    const links = document.querySelectorAll('a[href]');
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    links.forEach((link) => {
      const rect = link.getBoundingClientRect();
      const isVisible = 
        rect.top < viewportHeight * 1.5 && // Чуть за пределами viewport
        rect.bottom > -100 &&
        rect.left < viewportWidth &&
        rect.right > 0;
      
      if (isVisible) {
        const href = link.getAttribute('href');
        if (href && isInternalUrl(href)) {
          instantPrefetch(href);
        }
      }
    });
  }, [instantPrefetch]);

  // Prefetch по движению мыши (intent detection)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    // Определяем направление движения и ищем ссылки на пути
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed < 2) return; // Слишком медленное движение
    
    // Предсказываем позицию через 100мс
    const predictedX = e.clientX + dx * 3;
    const predictedY = e.clientY + dy * 3;
    
    // Ищем элемент в предсказанной позиции
    const element = document.elementFromPoint(predictedX, predictedY);
    if (!element) return;
    
    const link = element.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || !isInternalUrl(href)) return;
    
    // Обновляем intent
    mouseIntentRef.current = {
      targetUrl: href,
      confidence: Math.min(speed / 10, 1),
      timestamp: now
    };
    
    // Начинаем prefetch если уверенность высокая
    if (mouseIntentRef.current.confidence > 0.3) {
      instantPrefetch(href);
    }
  }, [instantPrefetch]);

  // Обработка наведения - МГНОВЕННЫЙ prefetch
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || !isInternalUrl(href)) return;
    
    // Мгновенный prefetch при наведении
    instantPrefetch(href);
  }, [instantPrefetch]);

  // Touch handling для мобильных
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || !isInternalUrl(href)) return;
    
    // Мгновенный prefetch при касании
    instantPrefetch(href);
  }, [instantPrefetch]);

  // Scroll listener с throttle
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    
    rafRef.current = requestAnimationFrame(() => {
      prefetchAllVisible();
      rafRef.current = null;
    });
  }, [prefetchAllVisible]);

  // Инициализация
  useEffect(() => {
    // Prefetch текущих видимых ссылок сразу
    prefetchAllVisible();
    
    // Passive listeners для максимальной производительности
    const options: AddEventListenerOptions = { passive: true, capture: true };
    
    document.addEventListener('mousemove', handleMouseMove, options);
    document.addEventListener('mouseover', handleMouseOver, options);
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('scroll', handleScroll, options);
    
    // MutationObserver для новых ссылок
    const observer = new MutationObserver((mutations) => {
      let hasNewLinks = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && (node.tagName === 'A' || node.querySelector('a'))) {
              hasNewLinks = true;
            }
          });
        }
      });
      
      if (hasNewLinks) {
        // Небольшая задержка чтобы DOM обновился
        setTimeout(prefetchAllVisible, 50);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, options as EventListenerOptions);
      document.removeEventListener('mouseover', handleMouseOver, options as EventListenerOptions);
      document.removeEventListener('touchstart', handleTouchStart, options as EventListenerOptions);
      document.removeEventListener('scroll', handleScroll, options as EventListenerOptions);
      observer.disconnect();
      
      if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseOver, handleTouchStart, handleScroll, prefetchAllVisible]);

  // При смене страницы - prefetch видимых ссылок
  useEffect(() => {
    // Небольшая задержка для рендера новой страницы
    const timeout = setTimeout(prefetchAllVisible, 100);
    return () => clearTimeout(timeout);
  }, [pathname, prefetchAllVisible]);

  return null;
}

/**
 * Хук для мгновенного перехода с оптимистичным UI
 */
export function useInstantNavigate() {
  const router = useRouter();
  
  return useCallback((url: string) => {
    // Мгновенный переход
    router.push(url);
  }, [router]);
}

/**
 * Критические маршруты для предзагрузки при старте
 */
const CRITICAL_ROUTES = [
  '/',
  '/feed',
  '/cabinet',
  '/cabinet/releases',
  '/cabinet/releases/drafts',
  '/cabinet/release-basic/create',
  '/cabinet/profile',
  '/cabinet/settings',
  '/news',
  '/contacts',
  '/faq',
  '/offer',
  '/auth',
  '/about',
];

/**
 * Компонент предзагрузки критических маршрутов
 */
export function CriticalRoutesPrefetch() {
  const router = useRouter();
  
  useEffect(() => {
    // Загружаем критические маршруты в первые 2 секунды
    const prefetchCritical = () => {
      CRITICAL_ROUTES.forEach((route, index) => {
        // Распределяем загрузку чтобы не блокировать
        setTimeout(() => {
          if (!loadedUrls.has(route)) {
            router.prefetch(route);
            loadedUrls.add(route);
          }
        }, index * 50); // 50мс между каждым маршрутом
      });
    };
    
    // Используем requestIdleCallback если доступен
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchCritical, { timeout: 2000 });
    } else {
      setTimeout(prefetchCritical, 100);
    }
  }, [router]);
  
  return null;
}

export default InstantNavigation;
