import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// ПРОВЕРКА СТАТУСА ПЛАТЕЖА + ЗАЧИСЛЕНИЕ/ВОЗВРАТ БАЛАНСА
// Вызывается когда пользователь возвращается с YooKassa
// Это основной механизм зачисления (не полагаемся только на webhook)
// ============================================

async function creditBalanceIfNeeded(order: any, payment: any): Promise<boolean> {
  const { data: updated, error: upErr } = await supabaseAdmin
    .from('payment_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString(), provider_data: payment })
    .eq('id', order.id)
    .neq('status', 'paid')
    .neq('status', 'refunded')
    .select('id');

  if (upErr || !updated || updated.length === 0) {
    console.log('Check: order already paid/refunded:', order.id);
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

  if (txErr) { console.error('Check credit: txn error', txErr); return false; }

  await supabaseAdmin.from('user_balances').update({
    balance: newBal, total_deposited: parseFloat(balRow.data!.total_deposited) + order.amount, updated_at: new Date().toISOString(),
  }).eq('user_id', order.user_id);

  console.log('Check CREDITED:', order.id, 'User:', order.user_id, 'Amount:', order.amount);
  return true;
}

// Обработка возврата — проверяем, есть ли refunded_amount у платежа
async function processRefundIfNeeded(order: any, payment: any): Promise<boolean> {
  const refundedAmount = parseFloat(payment.refunded_amount?.value || '0');
  if (refundedAmount <= 0) return false;

  // Ордер должен быть paid чтобы возвращать
  if (order.status !== 'paid') return false;

  // Атомарно помечаем ордер как refunded
  const { data: updated, error: upErr } = await supabaseAdmin
    .from('payment_orders')
    .update({ status: 'refunded', provider_data: payment })
    .eq('id', order.id)
    .eq('status', 'paid')
    .select('id');

  if (upErr || !updated || updated.length === 0) {
    return false;
  }

  const { data: balRow } = await supabaseAdmin.from('user_balances').select('balance, total_deposited').eq('user_id', order.user_id).single();
  if (!balRow) return false;

  const curBal = parseFloat(balRow.balance);
  const newBal = Math.max(0, curBal - refundedAmount);

  await supabaseAdmin.from('transactions').insert({
    user_id: order.user_id, type: 'refund', amount: -refundedAmount, currency: 'RUB',
    balance_before: curBal, balance_after: newBal, status: 'completed',
    description: `Возврат YooKassa #${order.id.slice(0, 8)}`,
    payment_method: order.payment_method || 'yookassa', reference_id: order.id,
    metadata: { payment_order_id: order.id, reason: 'yookassa_refund' },
  });

  await supabaseAdmin.from('user_balances').update({
    balance: newBal, total_deposited: Math.max(0, parseFloat(balRow.total_deposited) - refundedAmount), updated_at: new Date().toISOString(),
  }).eq('user_id', order.user_id);

  console.log('Check REFUNDED:', order.id, 'Amount:', refundedAmount, 'Balance:', curBal, '->', newBal);
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin.from('payment_orders').select('*').eq('id', orderId).single();
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Уже оплачен — проверяем не было ли возврата
    if (order.status === 'paid' || order.status === 'completed') {
      // Дополнительно проверяем у YooKassa — может быть возврат
      if (order.provider === 'yookassa' && order.provider_order_id) {
        try {
          const shopId = process.env.YOOKASSA_SHOP_ID;
          const secretKey = process.env.YOOKASSA_SECRET_KEY;
          if (shopId && secretKey) {
            const resp = await fetch(`https://api.yookassa.ru/v3/payments/${order.provider_order_id}`, {
              headers: { 'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64') },
            });
            if (resp.ok) {
              const payment = await resp.json();
              const refundedAmt = parseFloat(payment.refunded_amount?.value || '0');
              if (refundedAmt > 0) {
                const refunded = await processRefundIfNeeded(order, payment);
                if (refunded) {
                  return NextResponse.json({ status: 'refunded', orderId: order.id, refundedAmount: refundedAmt });
                }
              }
            }
          }
        } catch (e) { console.error('Check refund error:', e); }
      }
      return NextResponse.json({ status: 'succeeded', orderId: order.id, credited: true });
    }

    if (order.status === 'refunded') {
      return NextResponse.json({ status: 'refunded', orderId: order.id });
    }
    if (order.status === 'cancelled' || order.status === 'failed') {
      return NextResponse.json({ status: 'canceled', orderId: order.id });
    }

    // Заказ ещё не оплачен — проверяем у YooKassa
    if (order.provider === 'yookassa' && order.provider_order_id) {
      const shopId = process.env.YOOKASSA_SHOP_ID;
      const secretKey = process.env.YOOKASSA_SECRET_KEY;

      if (shopId && secretKey) {
        try {
          const resp = await fetch(`https://api.yookassa.ru/v3/payments/${order.provider_order_id}`, {
            headers: { 'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64') },
          });

          if (resp.ok) {
            const payment = await resp.json();

            if (payment.status === 'succeeded') {
              // Проверяем — может уже есть возврат
              const refundedAmt = parseFloat(payment.refunded_amount?.value || '0');
              if (refundedAmt > 0 && refundedAmt >= parseFloat(payment.amount?.value || '0')) {
                // Полный возврат — не зачисляем, сразу refunded
                await supabaseAdmin.from('payment_orders').update({ status: 'refunded', provider_data: payment }).eq('id', order.id);
                return NextResponse.json({ status: 'refunded', orderId: order.id });
              }
              const credited = await creditBalanceIfNeeded(order, payment);
              return NextResponse.json({ status: 'succeeded', orderId: order.id, credited });
            }

            if (payment.status === 'canceled') {
              await supabaseAdmin.from('payment_orders').update({ status: 'cancelled' }).eq('id', order.id);
              return NextResponse.json({ status: 'canceled', orderId: order.id });
            }

            return NextResponse.json({ status: payment.status, orderId: order.id });
          }
        } catch (e) { console.error('YooKassa check error:', e); }
      }
    }

    return NextResponse.json({ status: order.status === 'waiting' ? 'pending' : order.status, orderId: order.id });

  } catch (error) {
    console.error('Payment check error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
