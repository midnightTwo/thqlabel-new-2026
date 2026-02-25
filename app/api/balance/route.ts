import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// ПОЛУЧЕНИЕ БАЛАНСА ПОЛЬЗОВАТЕЛЯ
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Получаем токен из заголовка
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Проверяем токен
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Получаем баланс
    const { data: balance, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Balance fetch error:', balanceError);
      return NextResponse.json(
        { error: 'Ошибка получения баланса' },
        { status: 500 }
      );
    }

    // Если баланса нет - создаём и возвращаем нули
    if (!balance) {
      // Создаём запись баланса
      await supabaseAdmin
        .from('user_balances')
        .insert({ user_id: user.id })
        .single();
        
      return NextResponse.json({
        balance: 0,
        frozen_balance: 0,
        total_deposited: 0,
        total_spent: 0,
        currency: 'RUB',
      });
    }

    return NextResponse.json({
      balance: Number(balance.balance ?? 0),
      frozen_balance: Number(balance.frozen_balance ?? 0),
      total_deposited: Number(balance.total_deposited ?? 0),
      total_spent: Number(balance.total_spent ?? 0),
      currency: balance.currency || 'RUB',
    });

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
