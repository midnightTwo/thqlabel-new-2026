import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// YOOKASSA WEBHOOK
// Настроить в личном кабинете YooKassa:
// URL: https://yourdomain.com/api/payments/webhook/yookassa
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('YooKassa webhook received:', JSON.stringify(body, null, 2));

    // Проверяем тип события
    if (body.event !== 'payment.succeeded' && body.event !== 'payment.waiting_for_capture') {
      // Игнорируем другие события
      return NextResponse.json({ status: 'ignored' });
    }

    const payment = body.object;
    
    // Проверка подписи (опционально, но рекомендуется)
    // const signature = request.headers.get('X-YooKassa-Signature');
    // if (!verifyYooKassaSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Получаем order_id из metadata
    const orderId = payment.metadata?.order_id;
    
    if (!orderId) {
      console.error('No order_id in payment metadata');
      return NextResponse.json({ error: 'No order_id' }, { status: 400 });
    }

    // Проверяем статус платежа
    if (payment.status !== 'succeeded') {
      console.log('Payment not succeeded yet:', payment.status);
      return NextResponse.json({ status: 'waiting' });
    }

    // Находим ордер
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Проверяем что ордер ещё не оплачен
    if (order.status === 'paid') {
      console.log('Order already paid:', orderId);
      return NextResponse.json({ status: 'already_paid' });
    }

    // Проверяем сумму
    const paidAmount = parseFloat(payment.amount.value);
    if (paidAmount < order.amount) {
      console.error('Amount mismatch:', paidAmount, 'vs', order.amount);
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // ========== АТОМАРНАЯ ЗАЩИТА ОТ ДВОЙНОГО ЗАЧИСЛЕНИЯ ==========
    // Сначала атомарно помечаем ордер как 'paid'.
    // Если другой webhook уже его пометил — update вернёт 0 строк и мы не зачислим повторно.
    const { data: updatedOrders, error: updateError } = await supabaseAdmin
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        provider_data: payment,
      })
      .eq('id', orderId)
      .neq('status', 'paid')        // только если ещё НЕ оплачен
      .select('id');

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json({ error: 'Order update failed' }, { status: 500 });
    }

    // Если ни одной строки не обновилось — значит уже оплачен (другой webhook успел раньше)
    if (!updatedOrders || updatedOrders.length === 0) {
      console.log('Order already claimed by another webhook:', orderId);
      return NextResponse.json({ status: 'already_paid' });
    }

    // Определяем метод оплаты
    const paymentMethodType = payment.payment_method?.type;
    let paymentMethodLabel = 'yookassa';
    if (paymentMethodType === 'sbp') paymentMethodLabel = 'sbp';
    else if (paymentMethodType === 'bank_card') paymentMethodLabel = 'card_ru';
    else if (paymentMethodType === 'yoo_money') paymentMethodLabel = 'yoomoney';

    // Зачисляем на баланс (ордер уже помечен как paid, повторного зачисления не будет)
    const { data: depositResult, error: depositError } = await supabaseAdmin
      .rpc('deposit_balance', {
        p_user_id: order.user_id,
        p_amount: order.amount,
        p_description: `Пополнение через YooKassa`,
        p_metadata: {
          payment_order_id: orderId,
          provider: 'yookassa',
          provider_payment_id: payment.id,
        },
        p_payment_method: paymentMethodLabel,
        p_reference_id: orderId,
      });

    if (depositError) {
      console.error('Deposit error:', depositError);
      // ВАЖНО: ордер уже помечен paid, но баланс не зачислен — логируем для ручного разбора
      console.error('CRITICAL: Order marked as paid but deposit failed! Order:', orderId, 'User:', order.user_id, 'Amount:', order.amount);
      return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
    }

    console.log('Payment successful:', orderId, 'Amount:', order.amount, 'Method:', paymentMethodLabel);

    return NextResponse.json({ 
      status: 'success',
      orderId: orderId,
      amount: order.amount,
    });

  } catch (error) {
    console.error('YooKassa webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Проверка подписи YooKassa (опционально)
function verifyYooKassaSignature(body: any, signature: string | null): boolean {
  if (!signature) return false;
  
  const secretKey = process.env.YOOKASSA_SECRET_KEY!;
  const data = JSON.stringify(body);
  const hash = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  
  return hash === signature;
}
