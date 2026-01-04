import { supabase } from '@/lib/supabase/client';

// Вспомогательная функция для fetch с токеном
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  // Для FormData не добавляем Content-Type (браузер сам установит с boundary)
  const headers: Record<string, string> = {
    ...( options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Добавляем Content-Type только если это не FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}
