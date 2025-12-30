'use client';
import { useEffect, useRef, useState } from 'react';

interface ScrollEffectOptions {
  speed?: number; // Скорость эффекта (0.1 - очень медленно, 1 - быстро)
  threshold?: number; // Порог срабатывания IntersectionObserver
}

export function useScrollEffect(options: ScrollEffectOptions = {}) {
  const { speed = 0.3, threshold = 0.1 } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);
  const lastScrollY = useRef(0);
  const lastTouchY = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // IntersectionObserver для определения видимости элемента
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);

    const updateScrollProgress = () => {
      if (!isVisible || !element) return;

      const rect = element.getBoundingClientRect();
      const elementHeight = rect.height;
      const elementTop = rect.top;
      const windowHeight = window.innerHeight;

      // Вычисляем прогресс скролла от 0 до 1
      // 0 = элемент внизу экрана, 1 = элемент вверху экрана
      let progress = 0;

      if (elementTop < windowHeight && elementTop > -elementHeight) {
        progress = 1 - (elementTop + elementHeight) / (windowHeight + elementHeight);
      } else if (elementTop <= -elementHeight) {
        progress = 1;
      }

      // Применяем замедление
      const adjustedProgress = Math.max(0, Math.min(1, progress * speed));
      setScrollProgress(adjustedProgress);
    };

    // Обработчик скролла с debounce через RAF
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateScrollProgress);
    };

    // Обработчик touch событий для мобильных
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY;
      const deltaY = lastTouchY.current - currentTouchY;
      
      // Эмулируем скролл
      if (Math.abs(deltaY) > 1) {
        lastTouchY.current = currentTouchY;
        handleScroll();
      }
    };

    // Инициализация
    updateScrollProgress();
    lastScrollY.current = window.scrollY;

    // Добавляем слушатели событий (passive для производительности)
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', updateScrollProgress);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed, threshold, isVisible]);

  return { elementRef, scrollProgress };
}

/**
 * Генерирует CSS стили для эффекта медленного отрезания
 */
export function getClipPathStyle(progress: number, direction: 'top' | 'bottom' = 'top') {
  const clipPercentage = Math.round(progress * 100);
  
  if (direction === 'top') {
    // Отрезание сверху
    return {
      clipPath: `inset(${clipPercentage}% 0 0 0)`,
      transform: `translateY(${progress * 20}px)`, // Небольшое смещение для плавности
    };
  } else {
    // Отрезание снизу
    return {
      clipPath: `inset(0 0 ${clipPercentage}% 0)`,
      transform: `translateY(-${progress * 20}px)`,
    };
  }
}

/**
 * Альтернативный эффект с opacity
 */
export function getFadeStyle(progress: number) {
  return {
    opacity: Math.max(0, 1 - progress),
    transform: `translateY(${progress * 30}px) scale(${1 - progress * 0.1})`,
  };
}
