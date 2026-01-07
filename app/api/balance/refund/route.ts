import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// ВОЗВРАТ СРЕДСТВ ЗА РЕЛИЗ
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Получаем токен из заголовка
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Проверяем токен
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, releaseId, amount } = body;

    // Валидация
    if (!releaseId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Не указан релиз или сумма' },
        { status: 400 }
      );
    }

    // Проверяем что релиз принадлежит пользователю и можно вернуть средства
    const { data: release, error: releaseError } = await supabaseAdmin
      .from('releases_basic')
      .select('id, status, is_paid, payment_transaction_id, title, user_id')
      .eq('id', releaseId)
      .single();

    if (releaseError || !release) {
      return NextResponse.json(
        { success: false, error: 'Релиз не найден' },
        { status: 404 }
      );
    }

    // Проверяем владельца
    if (release.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа к этому релизу' },
        { status: 403 }
      );
    }

    // Проверяем статус - можно вернуть только для draft или awaiting_payment
    if (!['draft', 'awaiting_payment'].includes(release.status)) {
      return NextResponse.json(
        { success: false, error: 'Возврат невозможен - релиз уже отправлен на модерацию' },
        { status: 400 }
      );
    }

    // Проверяем что релиз был оплачен
    if (!release.is_paid) {
      return NextResponse.json(
        { success: false, error: 'Релиз не был оплачен' },
        { status: 400 }
      );
    }

    // Получаем текущий баланс
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('balance, total_spent')
      .eq('user_id', user.id)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Balance fetch error:', balanceError);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения баланса' },
        { status: 500 }
      );
    }

    const currentBalance = balanceData ? parseFloat(balanceData.balance) : 0;
    const currentSpent = balanceData ? parseFloat(balanceData.total_spent || '0') : 0;
    const newBalance = currentBalance + amount;
    const newSpent = Math.max(0, currentSpent - amount);

    // Начинаем транзакцию возврата
    // 1. Обновляем баланс пользователя
    const { error: updateBalanceError } = await supabaseAdmin
      .from('user_balances')
      .upsert({
        user_id: user.id,
        balance: newBalance,
        total_spent: newSpent,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (updateBalanceError) {
      console.error('Update balance error:', updateBalanceError);
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления баланса' },
        { status: 500 }
      );
    }

    // 2. Создаём транзакцию возврата
    const { data: refundTx, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'refund',
        amount: amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        currency: 'RUB',
        status: 'completed',
        description: `Возврат за релиз: ${release.title}`,
        metadata: {
          release_id: releaseId,
          release_title: release.title,
          original_payment_id: paymentId,
          original_transaction_id: release.payment_transaction_id
        }
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction error:', txError);
      // Откатываем баланс
      await supabaseAdmin
        .from('user_balances')
        .update({ balance: currentBalance, total_spent: currentSpent })
        .eq('user_id', user.id);
      
      return NextResponse.json(
        { success: false, error: 'Ошибка создания транзакции возврата' },
        { status: 500 }
      );
    }

    // 3. Обновляем релиз - снимаем флаг оплаты
    const { error: updateReleaseError } = await supabaseAdmin
      .from('releases_basic')
      .update({
        is_paid: false,
        payment_transaction_id: null,
        payment_amount: null,
        paid_at: null
      })
      .eq('id', releaseId);

    if (updateReleaseError) {
      console.error('Update release error:', updateReleaseError);
    }

    // 4. Обновляем запись в release_payments если она есть
    if (paymentId) {
      const { error: updatePaymentError } = await supabaseAdmin
        .from('release_payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updatePaymentError && updatePaymentError.code !== '42P01') {
        console.error('Update payment error:', updatePaymentError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Средства возвращены на баланс',
      transactionId: refundTx.id,
      newBalance: newBalance,
      refundedAmount: amount
    });

  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
