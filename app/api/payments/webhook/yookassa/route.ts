import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// YOOKASSA WEBHOOK
// URL в кабинете YooKassa: https://thqlabel.ru/api/payments/webhook/yookassa
// События: payment.succeeded, refund.succeeded
// ============================================

// Зачисление баланса
async function creditBalance(order: any, payment: any): Promise<boolean> {
  // Атомарно помечаем ордер как paid
  const { data: updated, error: upErr } = await supabaseAdmin
    .from('payment_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString(), provider_data: payment })
    .eq('id', order.id)
    .neq('status', 'paid')
    .neq('status', 'refunded')
    .select('id');

  if (upErr || !updated || updated.length === 0) {
    console.log('Order already paid/refunded:', order.id);
    return false;
  }

  const methodType = payment.payment_method?.type;
  let method = 'yookassa';
  if (methodType === 'sbp') method = 'sbp';
  else if (methodType === 'bank_card') method = 'card_ru';
  else if (methodType === 'yoo_money') method = 'yoomoney';

  let balRow = await supabaseAdmin.from('user_balances').select('balance, total_deposited').eq('user_id', order.user_id).single();
  if (!balRow.data) {
    await supabaseAdmin.from('user_balances').insert({ user_id: order.user_id, balance: 0, total_deposited: 0 });
    balRow = await supabaseAdmin.from('user_balances').select('balance, total_deposited').eq('user_id', order.user_id).single();
  }

  const curBal = parseFloat(balRow.data!.balance);
  const newBal = curBal + order.amount;

  const { error: txErr } = await supabaseAdmin.from('transactions').insert({
    user_id: order.user_id, type: 'deposit', amount: order.amount, currency: 'RUB',
    balance_before: curBal, balance_after: newBal, status: 'completed',
    description: `Пополнение через YooKassa (${method === 'sbp' ? 'СБП' : method === 'card_ru' ? 'Карта' : 'YooKassa'})`,
    payment_method: method, reference_id: order.id,
    metadata: { payment_order_id: order.id, provider: 'yookassa', provider_payment_id: payment.id },
  });

  if (txErr) {
    console.error('CRITICAL: Transaction insert failed!', txErr, 'Order:', order.id);
    return false;
  }

  await supabaseAdmin.from('user_balances').update({
    balance: newBal, total_deposited: parseFloat(balRow.data!.total_deposited) + order.amount, updated_at: new Date().toISOString(),
  }).eq('user_id', order.user_id);

  console.log('CREDITED:', order.id, 'User:', order.user_id, 'Amount:', order.amount, 'Method:', method);
  return true;
}

// Возврат средств — отнимаем с баланса
async function processRefund(orderId: string, refundAmount: number, refundData: any): Promise<boolean> {
  // Находим ордер
  const { data: order } = await supabaseAdmin.from('payment_orders').select('*').eq('id', orderId).single();
  if (!order) {
    console.error('Refund: order not found:', orderId);
    return false;
  }

  // Атомарно помечаем ордер как refunded (защита от двойного списания)
  const { data: updated, error: upErr } = await supabaseAdmin
    .from('payment_orders')
    .update({ status: 'refunded', provider_data: refundData })
    .eq('id', orderId)
    .neq('status', 'refunded')
    .select('id');

  if (upErr || !updated || updated.length === 0) {
    console.log('Refund: order already refunded:', orderId);
    return false;
  }

  // Получаем баланс
  const { data: balRow } = await supabaseAdmin.from('user_balances').select('balance, total_deposited').eq('user_id', order.user_id).single();
  if (!balRow) {
    console.error('Refund: no balance row for user:', order.user_id);
    return false;
  }

  const curBal = parseFloat(balRow.balance);
  const newBal = Math.max(0, curBal - refundAmount); // не уходим в минус

  // Транзакция возврата
  const { error: txErr } = await supabaseAdmin.from('transactions').insert({
    user_id: order.user_id, type: 'refund', amount: -refundAmount, currency: 'RUB',
    balance_before: curBal, balance_after: newBal, status: 'completed',
    description: `Возврат YooKassa #${orderId.slice(0, 8)}`,
    payment_method: order.payment_method || 'yookassa', reference_id: order.id,
    metadata: { payment_order_id: orderId, reason: 'yookassa_refund', refund_data: refundData },
  });

  if (txErr) {
    console.error('CRITICAL: Refund transaction insert failed!', txErr);
    return false;
  }

  // Обновляем баланс
  await supabaseAdmin.from('user_balances').update({
    balance: newBal,
    total_deposited: Math.max(0, parseFloat(balRow.total_deposited) - refundAmount),
    updated_at: new Date().toISOString(),
  }).eq('user_id', order.user_id);

  console.log('REFUNDED:', orderId, 'User:', order.user_id, 'Amount:', refundAmount, 'Balance:', curBal, '->', newBal);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('YooKassa webhook:', body.event, JSON.stringify(body.object?.id || ''));

    // ========== ВОЗВРАТ (refund.succeeded) ==========
    if (body.event === 'refund.succeeded') {
      const refund = body.object;
      const orderId = refund.metadata?.order_id || refund.payment_id;
      const refundAmount = parseFloat(refund.amount?.value || '0');

      if (!orderId || !refundAmount) {
        console.error('Refund webhook: missing orderId or amount');
        return NextResponse.json({ status: 'error' }, { status: 400 });
      }

      // Ищем ордер по provider_order_id (refund.payment_id — это ID платежа YooKassa)
      let realOrderId = orderId;
      if (!orderId.includes('-')) {
        // Это YooKassa payment ID, ищем наш order
        const { data: found } = await supabaseAdmin.from('payment_orders').select('id').eq('provider_order_id', orderId).single();
        if (found) realOrderId = found.id;
      }

      const ok = await processRefund(realOrderId, refundAmount, refund);
      return NextResponse.json({ status: ok ? 'refunded' : 'already_refunded' });
    }

    // ========== ОПЛАТА (payment.succeeded) ==========
    if (body.event !== 'payment.succeeded' && body.event !== 'payment.waiting_for_capture') {
      return NextResponse.json({ status: 'ignored' });
    }

    const payment = body.object;
    const orderId = payment.metadata?.order_id;
    if (!orderId) {
      console.error('No order_id in payment metadata');
      return NextResponse.json({ error: 'No order_id' }, { status: 400 });
    }

    if (payment.status !== 'succeeded') {
      return NextResponse.json({ status: 'waiting' });
    }

    const { data: order } = await supabaseAdmin.from('payment_orders').select('*').eq('id', orderId).single();
    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const ok = await creditBalance(order, payment);
    return NextResponse.json({ status: ok ? 'success' : 'already_paid', orderId });

  } catch (error) {
    console.error('YooKassa webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
