import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 });
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Код должен состоять из 6 цифр' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ищем запись по email и OTP коду
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_tokens')
      .select('*')
      .eq('email', email)
      .eq('token_type', 'verification')
      .eq('otp_code', code)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Неверный код. Проверьте и попробуйте снова.' }, { status: 400 });
    }

    // Проверяем срок действия (15 минут)
    if (new Date(tokenData.expires_at) < new Date()) {
      await supabase.from('email_tokens').delete().eq('id', tokenData.id);
      return NextResponse.json({ error: 'Код истёк. Запросите новый.' }, { status: 400 });
    }

    // Создаём пользователя в Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tokenData.email,
      password: tokenData.password_hash,
      email_confirm: true,
      user_metadata: {
        nickname: tokenData.nickname,
        display_name: tokenData.nickname,
        full_name: tokenData.nickname,
        telegram: tokenData.telegram || null,
      },
    });

    if (authError) {
      console.error('Ошибка создания пользователя:', authError);
      await supabase.from('email_tokens').update({ used: true }).eq('id', tokenData.id);
      return NextResponse.json({ error: 'Ошибка создания аккаунта: ' + authError.message }, { status: 500 });
    }

    // Создаём профиль
    if (authData?.user) {
      const memberId = 'THQ-' + Math.floor(1000 + Math.random() * 9000).toString();

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: tokenData.email,
          nickname: tokenData.nickname || tokenData.email.split('@')[0],
          telegram: tokenData.telegram || null,
          member_id: memberId,
          role: 'basic',
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Ошибка создания профиля:', profileError);
      } else {
        console.log('✅ Профиль создан через OTP:', tokenData.email, 'member_id:', memberId);
      }
    }

    // Помечаем токен как использованный
    await supabase.from('email_tokens').update({ used: true }).eq('id', tokenData.id);

    // Возвращаем успех — клиент сам войдёт с паролем
    return NextResponse.json({
      success: true,
      message: 'Аккаунт создан! Выполняем вход...',
      email: tokenData.email,
      password: tokenData.password_hash, // нужен для авто-логина на клиенте
    });

  } catch (error: any) {
    console.error('Ошибка OTP верификации:', error);
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 500 });
  }
}
