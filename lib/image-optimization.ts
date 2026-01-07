"use client";

/**
 * Система оптимизации изображений для THQ Label
 * 
 * Особенности:
 * - Автоматическое сжатие при загрузке
 * - Генерация thumbnail для кабинета
 * - Сохранение оригинала для админа
 * - Поддержка WebP/AVIF
 */

// Размеры для разных целей
export const IMAGE_SIZES = {
  thumbnail: { width: 64, height: 64, quality: 60 },
  small: { width: 128, height: 128, quality: 70 },
  medium: { width: 256, height: 256, quality: 75 },
  large: { width: 512, height: 512, quality: 80 },
  cover: { width: 1000, height: 1000, quality: 85 },
  original: { width: 3000, height: 3000, quality: 95 },
} as const;

export type ImageSizeKey = keyof typeof IMAGE_SIZES;

/**
 * Сжатие изображения на клиенте
 * Работает в браузере без сервера
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Создаём canvas для сжатия
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Не удалось создать контекст canvas'));
        return;
      }

      // Улучшаем качество масштабирования
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Рисуем изображение
      ctx.drawImage(img, 0, 0, width, height);

      // Конвертируем в blob
      const mimeType = format === 'webp' ? 'image/webp' : 
                       format === 'png' ? 'image/png' : 'image/jpeg';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Не удалось создать blob'));
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Генерация набора размеров изображения
 */
export async function generateImageSet(
  file: File,
  sizes: ImageSizeKey[] = ['thumbnail', 'medium', 'original']
): Promise<Map<ImageSizeKey, Blob>> {
  const results = new Map<ImageSizeKey, Blob>();

  for (const sizeKey of sizes) {
    const config = IMAGE_SIZES[sizeKey];
    const compressed = await compressImage(file, {
      maxWidth: config.width,
      maxHeight: config.height,
      quality: config.quality / 100,
      format: sizeKey === 'original' ? 'jpeg' : 'webp',
    });
    results.set(sizeKey, compressed);
  }

  return results;
}

/**
 * Получить оптимизированный URL изображения
 * Для внешних URL возвращает как есть (Supabase сам оптимизирует)
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  size: ImageSizeKey = 'medium'
): string {
  if (!originalUrl) return '';
  
  // Если это data URL - возвращаем как есть
  if (originalUrl.startsWith('data:')) return originalUrl;
  
  // Для внешних URL (Supabase и т.д.) - возвращаем как есть
  // Next.js Image Optimization может не работать с внешними URL без конфигурации
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    return originalUrl;
  }
  
  const config = IMAGE_SIZES[size];
  
  // Только для локальных изображений используем Next.js Image Optimization
  const encodedUrl = encodeURIComponent(originalUrl);
  return `/_next/image?url=${encodedUrl}&w=${config.width}&q=${config.quality}`;
}

/**
 * Проверка поддержки WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Проверка поддержки AVIF
 */
export async function supportsAVIF(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    // Минимальный AVIF
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABc0WAABoPoAyiGEAgACkCIigA=';
  });
}

/**
 * Получить лучший формат для браузера
 */
export function getBestImageFormat(): 'avif' | 'webp' | 'jpeg' {
  // AVIF проверяется асинхронно, поэтому fallback на WebP
  if (supportsWebP()) return 'webp';
  return 'jpeg';
}

/**
 * Предзагрузка изображения
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Предзагрузка массива изображений
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map(preloadImage));
}
