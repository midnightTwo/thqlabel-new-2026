import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Читаем тему из cookie
  const themeCookie = request.cookies.get('thqlabel_theme');
  const theme = themeCookie?.value || 'dark';
  
  // Создаём response
  let response = NextResponse.next();
  
  // Добавляем header с темой для использования в layout
  response.headers.set('x-theme', theme);
  
  // ПОЛНОЕ ОТКЛЮЧЕНИЕ КЭШИРОВАНИЯ - всегда свежие данные
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  response.headers.set('X-Accel-Expires', '0');
  response.headers.set('Vary', '*');
  response.headers.set('ETag', Date.now().toString());
  
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and api
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
