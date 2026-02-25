import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// АВТОМАТИЧЕСКАЯ ПРОВЕРКА ВОЗВРАТОВ
// Проверяет все paid-ордера в YooKassa и обрабатывает возвраты
// Вызывается: 
//   1) По cron (каждую минуту с сервера)
//   2) При открытии страницы баланса
// ============================================

async function processRefund(order: any, refundAmount: number, paymentData: any): Promise<boolean> {
  // Атомарно помечаем ордер как refunded
  const { data: updated, error: upErr } = await supabaseAdmin
    .from('payment_orders')
    .update({ status: 'refunded', provider_data: paymentData })
    .eq('id', order.id)
    .eq('status', 'paid')
    .select('id');

  if (upErr || !updated || updated.length === 0) {
    return false; // уже обработан
  }

  // Получаем баланс
  const { data: balRow } = await supabaseAdmin
    .from('user_balances')
    .select('balance, total_deposited')
    .eq('user_id', order.user_id)
    .single();

  if (!balRow) return false;

  const curBal = parseFloat(balRow.balance);
  const newBal = Math.max(0, curBal - refundAmount);

  // Транзакция возврата
  await supabaseAdmin.from('transactions').insert({
    user_id: order.user_id,
    type: 'refund',
    amount: -refundAmount,
    currency: 'RUB',
    balance_before: curBal,
    balance_after: newBal,
    status: 'completed',
    description: `Возврат YooKassa #${order.id.slice(0, 8)}`,
    payment_method: order.payment_method || 'yookassa',
    reference_id: order.id,
    metadata: { payment_order_id: order.id, reason: 'yookassa_refund_auto' },
  });

  // Обновляем баланс
  await supabaseAdmin.from('user_balances').update({
    balance: newBal,
    total_deposited: Math.max(0, parseFloat(balRow.total_deposited) - refundAmount),
    updated_at: new Date().toISOString(),
  }).eq('user_id', order.user_id);

  console.log('AUTO-REFUND:', order.id.slice(0, 8), 'User:', order.user_id.slice(0, 8), 'Amount:', refundAmount, 'Balance:', curBal, '->', newBal);
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      return NextResponse.json({ error: 'YooKassa not configured' }, { status: 500 });
    }

    // Берём все paid ордера (за последние 24 часа)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: paidOrders } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('status', 'paid')
      .eq('provider', 'yookassa')
      .gte('paid_at', oneDayAgo);

    if (!paidOrders || paidOrders.length === 0) {
      return NextResponse.json({ status: 'ok', checked: 0, refunded: 0 });
    }

    const authHeader = 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    let refundedCount = 0;

    for (const order of paidOrders) {
      if (!order.provider_order_id) continue;

      try {
        const resp = await fetch(`https://api.yookassa.ru/v3/payments/${order.provider_order_id}`, {
          headers: { 'Authorization': authHeader },
        });

        if (!resp.ok) continue;

        const payment = await resp.json();
        const refundedAmt = parseFloat(payment.refunded_amount?.value || '0');

        if (refundedAmt > 0) {
          const ok = await processRefund(order, refundedAmt, payment);
          if (ok) refundedCount++;
        }
      } catch (e) {
        console.error('Check refund error for order:', order.id, e);
      }
    }

    return NextResponse.json({
      status: 'ok',
      checked: paidOrders.length,
      refunded: refundedCount,
    });

  } catch (error) {
    console.error('Check refunds error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
