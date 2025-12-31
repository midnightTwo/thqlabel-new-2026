import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Читаем тему из cookie
  const themeCookie = request.cookies.get('thqlabel_theme');
  const theme = themeCookie?.value || 'dark';
  
  // Добавляем header с темой для использования в layout
  const response = NextResponse.next();
  response.headers.set('x-theme', theme);
  
  // Принудительное отключение кэширования для всех страниц
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and api
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
