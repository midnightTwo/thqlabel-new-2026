import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Токен и новый пароль обязательны' },
        { status: 400 }
      );
    }

    // Создаем admin клиент
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Получаем токен из базы данных
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'password_reset')
      .eq('used', false)
      .single();
    
    console.log('Проверка токена:', token);
    console.log('Данные токена:', tokenData);
    
    if (tokenError || !tokenData) {
      console.error('Токен не найден:', tokenError);
      return NextResponse.json(
        { error: 'Недействительный или истекший токен восстановления' },
        { status: 400 }
      );
    }
    
    // Проверяем не истек ли токен
    if (new Date(tokenData.expires_at) < new Date()) {
      // Удаляем истекший токен
      await supabase.from('email_tokens').delete().eq('id', tokenData.id);
      return NextResponse.json(
        { error: 'Токен восстановления истек. Запросите новую ссылку.' },
        { status: 400 }
      );
    }

    // Находим пользователя по email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Ошибка получения пользователей:', listError);
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
    
    const user = users?.find(u => u.email === tokenData.email);
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }
    
    // Обновляем пароль через Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Ошибка обновления пароля:', updateError);
      return NextResponse.json(
        { error: 'Не удалось обновить пароль' },
        { status: 500 }
      );
    }

    // Помечаем токен как использованный
    await supabase.from('email_tokens').update({ used: true }).eq('id', tokenData.id);
    
    console.log('Пароль успешно обновлен для:', tokenData.email);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Ошибка сброса пароля:', error);
    return NextResponse.json(
      { error: error.message || 'Произошла ошибка при сбросе пароля' },
      { status: 500 }
    );
  }
}
