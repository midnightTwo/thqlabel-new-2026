"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

/**
 * SmartLink - умная ссылка с мгновенным prefetch
 * Делает prefetch при наведении мыши для мгновенных переходов
 * Работает с любыми URL включая динамические (с UUID)
 */
export function SmartLink({ 
  href, 
  children, 
  onMouseEnter,
  onTouchStart,
  prefetch = true,
  ...props 
}: LinkProps) {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  
  const handlePrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    
    const url = typeof href === 'string' ? href : href.pathname || '';
    if (url) {
      router.prefetch(url);
      prefetchedRef.current = true;
    }
  }, [href, router]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    handlePrefetch();
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  }, [handlePrefetch, onMouseEnter]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLAnchorElement>) => {
    handlePrefetch();
    if (onTouchStart) {
      onTouchStart(e);
    }
  }, [handlePrefetch, onTouchStart]);

  return (
    <Link 
      href={href} 
      prefetch={prefetch}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
    </Link>
  );
}

export default SmartLink;
