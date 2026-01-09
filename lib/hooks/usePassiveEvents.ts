"use client";

/**
 * 🔇 PASSIVE EVENT LISTENERS OPTIMIZATION
 * 
 * Проблема: scroll, touchstart, wheel события блокируют основной поток,
 * ожидая, не вызовет ли JS preventDefault().
 * 
 * Решение: { passive: true } говорит браузеру:
 * "Не жди JS, крути скролл сразу"
 * 
 * Результат: Мгновенный отклик на touch и scroll
 */

import { useEffect, useCallback, useRef } from 'react';

type EventType = 'scroll' | 'touchstart' | 'touchmove' | 'touchend' | 'wheel' | 'resize';

interface PassiveEventOptions {
  target?: 'window' | 'document' | HTMLElement | null;
  passive?: boolean;
  capture?: boolean;
}

/**
 * Хук для добавления passive event listeners
 * Автоматически очищает listener при unmount
 */
export function usePassiveEvent<T extends Event>(
  eventType: EventType,
  handler: (event: T) => void,
  options: PassiveEventOptions = {}
) {
  const { target = 'window', passive = true, capture = false } = options;
  const savedHandler = useRef(handler);
  
  // Обновляем ref при изменении handler
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    // Определяем target element
    const targetElement = 
      target === 'window' ? window :
      target === 'document' ? document :
      target;
    
    if (!targetElement) return;
    
    // Создаём wrapper который вызывает актуальный handler
    const eventListener = (event: Event) => {
      savedHandler.current(event as T);
    };
    
    // Добавляем listener с passive: true
    targetElement.addEventListener(eventType, eventListener, {
      passive,
      capture,
    });
    
    return () => {
      targetElement.removeEventListener(eventType, eventListener, {
        capture,
      } as EventListenerOptions);
    };
  }, [eventType, target, passive, capture]);
}

/**
 * Хук для оптимизированного scroll listener
 * Включает throttling для дополнительной производительности
 */
export function usePassiveScroll(
  handler: (scrollY: number, scrollX: number) => void,
  throttleMs: number = 16 // ~60fps
) {
  const lastCall = useRef(0);
  const rafId = useRef<number | null>(null);
  
  const throttledHandler = useCallback(() => {
    const now = performance.now();
    if (now - lastCall.current >= throttleMs) {
      lastCall.current = now;
      handler(window.scrollY, window.scrollX);
    }
  }, [handler, throttleMs]);
  
  const scrollHandler = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(throttledHandler);
  }, [throttledHandler]);
  
  usePassiveEvent('scroll', scrollHandler, { target: 'window', passive: true });
  
  // Очистка RAF при unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);
}

/**
 * Хук для touch events (мобильные устройства)
 * Все touch события passive по умолчанию
 */
export function usePassiveTouch(handlers: {
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
}) {
  usePassiveEvent('touchstart', handlers.onTouchStart || (() => {}), { 
    target: 'document', 
    passive: true 
  });
  
  usePassiveEvent('touchmove', handlers.onTouchMove || (() => {}), { 
    target: 'document', 
    passive: true 
  });
  
  usePassiveEvent('touchend', handlers.onTouchEnd || (() => {}), { 
    target: 'document', 
    passive: true 
  });
}

/**
 * Глобальная инициализация passive listeners
 * Вызывается один раз в layout.tsx
 */
export function initGlobalPassiveListeners() {
  if (typeof window === 'undefined') return;
  
  // Переопределяем дефолтные опции для addEventListener
  // Это заставит ВСЕ scroll/touch listeners быть passive по умолчанию
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  EventTarget.prototype.addEventListener = function(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel', 'mousewheel'];
    
    if (passiveEvents.includes(type)) {
      if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      } else if (typeof options === 'object' || options === undefined) {
        options = { ...options, passive: options?.passive ?? true };
      }
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Добавляем CSS для улучшения производительности touch
  const style = document.createElement('style');
  style.textContent = `
    /* 🚀 Touch optimization */
    * {
      touch-action: manipulation;
    }
    
    /* Убираем задержку tap на мобильных */
    a, button, input, select, textarea, [role="button"] {
      touch-action: manipulation;
    }
    
    /* Предотвращаем случайный zoom на double-tap */
    html {
      touch-action: pan-x pan-y;
    }
  `;
  document.head.appendChild(style);
}

export default usePassiveEvent;
