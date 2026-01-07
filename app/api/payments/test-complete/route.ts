import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Тестовый endpoint для завершения платежа
 * Используется только в тестовом режиме для проверки UI
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Отсутствует ID заказа' }, { status: 400 });
    }

    // Получаем ордер
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Test payment: Order not found', orderId, orderError);
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    // Проверяем что ордер ещё не оплачен
    if (order.status === 'paid' || order.status === 'completed') {
      return NextResponse.json({ success: true, status: 'already_paid' });
    }

    // Получаем или создаём баланс пользователя
    let { data: balance, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('*')
      .eq('user_id', order.user_id)
      .single();

    if (balanceError || !balance) {
      // Создаём баланс если нет
      const { data: newBalance, error: createError } = await supabaseAdmin
        .from('user_balances')
        .insert({ user_id: order.user_id, balance: 0 })
        .select()
        .single();
      
      if (createError) {
        console.error('Test payment: Create balance error', createError);
        return NextResponse.json({ error: 'Ошибка создания баланса' }, { status: 500 });
      }
      balance = newBalance;
    }

    const balanceBefore = Number(balance.balance);
    const depositAmount = Number(order.amount);
    const balanceAfter = balanceBefore + depositAmount;

    // Обновляем баланс
    const { error: updateError } = await supabaseAdmin
      .from('user_balances')
      .update({
        balance: balanceAfter,
        total_deposited: Number(balance.total_deposited || 0) + depositAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', order.user_id);

    if (updateError) {
      console.error('Test payment: Update balance error', updateError);
      return NextResponse.json({ error: 'Ошибка обновления баланса' }, { status: 500 });
    }

    // Создаём транзакцию в истории
    const { data: txData, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: order.user_id,
        type: 'deposit',
        amount: depositAmount,
        currency: order.currency || 'RUB',
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: 'completed',
        description: `Тестовое пополнение #${orderId.slice(0, 8)}`,
        payment_method: order.payment_method || 'test',
        reference_id: orderId,
        metadata: {
          payment_order_id: orderId,
          provider: 'test',
          test_mode: true,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error('Test payment: Transaction insert error:', txError);
      // Пробуем понять почему не создаётся
      console.error('Transaction data:', {
        user_id: order.user_id,
        type: 'deposit',
        amount: depositAmount,
        currency: order.currency,
      });
    } else {
      console.log('Test payment: Transaction created:', txData?.id);
    }

    // Обновляем статус ордера
    await supabaseAdmin
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        provider_data: { test_mode: true, completed_at: new Date().toISOString() },
      })
      .eq('id', orderId);

    console.log('Test payment completed:', {
      orderId,
      userId: order.user_id,
      amount: depositAmount,
      balanceBefore,
      balanceAfter,
    });

    return NextResponse.json({
      success: true,
      amount: depositAmount,
      balanceBefore,
      balanceAfter,
    });

  } catch (error) {
    console.error('Test payment error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
