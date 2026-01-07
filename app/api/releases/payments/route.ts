import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// ИСТОРИЯ ОПЛАТ РЕЛИЗОВ
// Используется для доказательства оплаты
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

    // Параметры
    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get('releaseId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Запрос истории оплат
    let query = supabaseAdmin
      .from('release_payments')
      .select(`
        id,
        release_id,
        release_type,
        transaction_id,
        release_title,
        release_artist,
        tracks_count,
        amount,
        currency,
        payment_method,
        status,
        created_at,
        refunded_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Фильтр по конкретному релизу
    if (releaseId) {
      query = query.eq('release_id', releaseId);
    }

    const { data: payments, error: paymentsError } = await query;

    // Если таблица не существует - пробуем получить из transactions
    if (paymentsError?.code === '42P01') {
      // Таблица не существует - fallback на transactions
      const { data: transactions, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'purchase')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (txError) {
        return NextResponse.json({ error: txError.message }, { status: 500 });
      }

      // Преобразуем транзакции в формат оплат
      const fallbackPayments = (transactions || []).map(tx => ({
        id: tx.id,
        release_id: tx.metadata?.release_id,
        release_type: tx.metadata?.release_type || 'basic',
        transaction_id: tx.id,
        release_title: tx.metadata?.release_title || tx.description?.replace('Оплата релиза: ', '') || 'Релиз',
        release_artist: tx.metadata?.release_artist,
        tracks_count: tx.metadata?.tracks_count || 1,
        amount: tx.amount,
        currency: tx.currency || 'RUB',
        payment_method: tx.metadata?.payment_method || 'balance',
        status: tx.status,
        created_at: tx.created_at,
        refunded_at: null
      }));

      return NextResponse.json({
        payments: fallbackPayments,
        source: 'transactions_fallback',
        message: 'Таблица release_payments не создана. Выполните sql/RELEASE_PAYMENT_SYSTEM.sql'
      });
    }

    if (paymentsError) {
      console.error('Payments fetch error:', paymentsError);
      return NextResponse.json(
        { error: 'Ошибка получения истории оплат' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payments: payments || [],
      total: payments?.length || 0
    });

  } catch (error: any) {
    console.error('Release payments API error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
