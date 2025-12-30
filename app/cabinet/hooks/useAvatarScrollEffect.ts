'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Специальный хук для эффекта медленного "отрезания" аватара при скролле
 * Работает как на desktop (scroll), так и на мобильных (touch)
 */
export function useAvatarScrollEffect() {
  const avatarRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({
    clipPath: 'inset(0% 0 0 0)',
    translateY: 0,
    opacity: 1,
  });

  useEffect(() => {
    const avatar = avatarRef.current;
    if (!avatar) return;

    let ticking = false;
    let lastKnownScrollPosition = 0;

    const updateAvatarEffect = (scrollPos: number) => {
      if (!avatar) return;

      const rect = avatar.getBoundingClientRect();
      const elementTop = rect.top;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Вычисляем прогресс скролла
      // 0 = элемент полностью виден, 1 = элемент ушел вверх
      let progress = 0;

      if (elementTop < windowHeight && elementTop > -elementHeight) {
        // Элемент виден на экране
        const visibleHeight = Math.min(windowHeight - elementTop, elementHeight);
        progress = 1 - (visibleHeight / elementHeight);
        
        // Применяем замедление (делаем эффект очень медленным)
        progress = Math.pow(progress, 2) * 0.3; // квадратичная функция + коэффициент замедления
      } else if (elementTop <= -elementHeight) {
        progress = 0.3; // Максимальное значение эффекта
      }

      // Вычисляем параметры анимации с округлением для уменьшения частоты обновлений
      const clipPercentage = Math.round(Math.min(progress * 100, 30) * 10) / 10; // Округляем до 1 десятичного знака
      const translateY = Math.round(progress * 15 * 10) / 10;
      const opacity = Math.round(Math.max(1 - progress * 1.5, 0.7) * 100) / 100;

      // Обновляем только если значения реально изменились
      setTransform(prev => {
        if (
          Math.abs(parseFloat(prev.clipPath.match(/[\d.]+/)?.[0] || '0') - clipPercentage) < 0.5 &&
          Math.abs(prev.translateY - translateY) < 0.5 &&
          Math.abs(prev.opacity - opacity) < 0.01
        ) {
          return prev; // Не обновляем если изменения минимальны
        }
        return {
          clipPath: `inset(${clipPercentage}% 0 0 0)`,
          translateY,
          opacity,
        };
      });
    };

    // Обработчик скролла с RAF для производительности и дебаунсингом
    const handleScroll = () => {
      lastKnownScrollPosition = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateAvatarEffect(lastKnownScrollPosition);
          ticking = false;
        });

        ticking = true;
      }
    };

    // Touch события для мобильных
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      
      // Эмулируем скролл для обновления эффекта
      if (Math.abs(diff) > 10) { // Увеличен порог для уменьшения частоты обновлений
        handleScroll();
      }
    };

    // Инициализация
    updateAvatarEffect(window.scrollY);

    // Добавляем слушатели (passive для производительности)
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Touch события только на мобильных
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      
      if ('ontouchstart' in window) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, []);

  return { avatarRef, transform };
}
