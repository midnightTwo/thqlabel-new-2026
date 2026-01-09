import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/change-email?error=missing_token', request.url));
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Ищем токен в базе
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'email_change')
      .eq('used', false)
      .single();
    
    if (tokenError || !tokenData) {
      console.error('Токен не найден:', tokenError);
      return NextResponse.redirect(new URL('/change-email?error=invalid_token', request.url));
    }
    
    // Проверяем срок действия
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/change-email?error=expired_token', request.url));
    }
    
    const newEmail = tokenData.new_email;
    const userId = tokenData.user_id;
    
    if (!newEmail || !userId) {
      return NextResponse.redirect(new URL('/change-email?error=invalid_data', request.url));
    }
    
    // Меняем email пользователя через admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { email: newEmail, email_confirm: true }
    );
    
    if (updateError) {
      console.error('Ошибка обновления email:', updateError);
      return NextResponse.redirect(new URL('/change-email?error=update_failed', request.url));
    }
    
    // Обновляем профиль
    await supabase
      .from('profiles')
      .update({ 
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    // Помечаем токен как использованный
    await supabase
      .from('email_tokens')
      .update({ used: true })
      .eq('token', token);
    
    console.log('Email успешно изменён на:', newEmail);
    
    // Перенаправляем на страницу успеха
    return NextResponse.redirect(new URL(`/change-email?success=true&email=${encodeURIComponent(newEmail)}`, request.url));

  } catch (error: any) {
    console.error('Ошибка подтверждения смены email:', error);
    return NextResponse.redirect(new URL('/change-email?error=server_error', request.url));
  }
}
