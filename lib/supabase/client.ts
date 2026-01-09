"use client";

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Синглтон для браузерного клиента Supabase
// Это предотвращает создание множественных экземпляров GoTrueClient
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    
    // 🔄 Подписка на изменения состояния авторизации
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed successfully');
      }
      if (event === 'SIGNED_OUT') {
        // Очищаем localStorage при выходе
        if (typeof window !== 'undefined') {
          const storageKey = 'sb-' + supabaseUrl.split('//')[1]?.split('.')[0] + '-auth-token';
          localStorage.removeItem(storageKey);
        }
      }
    });
    
    // 🛡️ Глобальный обработчик ошибок refresh token
    if (typeof window !== 'undefined') {
      // Перехватываем ошибки Supabase Auth
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        
        // Проверяем URL на Supabase Auth endpoints
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url;
        if (url && url.includes('supabase') && url.includes('/auth/')) {
          // Клонируем response для чтения body
          const clonedResponse = response.clone();
          try {
            const data = await clonedResponse.json();
            
            // Если ошибка refresh token - делаем logout
            if (data?.error?.message?.includes('Refresh Token') || 
                data?.error?.message?.includes('Invalid Refresh Token') ||
                data?.error_code === 'refresh_token_not_found') {
              console.warn('⚠️ Invalid Refresh Token detected, signing out...');
              
              // Очищаем сессию
              supabaseInstance?.auth.signOut();
              
              // Очищаем localStorage
              const keys = Object.keys(localStorage);
              keys.forEach(key => {
                if (key.startsWith('sb-') && key.includes('-auth-token')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Перезагружаем страницу для очистки состояния
              if (!window.location.pathname.includes('/auth')) {
                window.location.href = '/auth';
              }
            }
          } catch {
            // Игнорируем ошибки парсинга JSON
          }
        }
        
        return response;
      };
    }
  }
  
  return supabaseInstance;
}

// Экспорт для обратной совместимости
export const supabase = getSupabaseClient();

// Утилита для проверки и обновления сессии
export async function ensureValidSession(): Promise<boolean> {
  if (!supabaseInstance) return false;
  
  try {
    const { data: { session }, error } = await supabaseInstance.auth.getSession();
    
    if (error) {
      console.error('Session error:', error.message);
      
      // Если ошибка связана с refresh token - logout
      if (error.message.includes('Refresh Token') || error.message.includes('refresh_token')) {
        await supabaseInstance.auth.signOut();
        return false;
      }
    }
    
    if (!session) {
      return false;
    }
    
    // Проверяем, не истекает ли токен в ближайшие 5 минут
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiresAt - Date.now() < fiveMinutes) {
      // Пробуем обновить токен
      const { error: refreshError } = await supabaseInstance.auth.refreshSession();
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError.message);
        await supabaseInstance.auth.signOut();
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('ensureValidSession error:', err);
    return false;
  }
}
