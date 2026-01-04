"use client";

import Image, { ImageProps } from 'next/image';
import { useState, useCallback } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
}

/**
 * Оптимизированный компонент изображения с:
 * - Автоматическим lazy loading
 * - Placeholder при загрузке
 * - Fallback при ошибке
 * - Оптимизированные форматы (webp/avif)
 */
export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.png',
  showSkeleton = true,
  className = '',
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setIsLoading(false);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Skeleton placeholder */}
      {showSkeleton && isLoading && (
        <div 
          className="absolute inset-0 bg-zinc-800/50 animate-pulse rounded-inherit"
          style={{ borderRadius: 'inherit' }}
        />
      )}
      
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        {...props}
      />
    </div>
  );
}
