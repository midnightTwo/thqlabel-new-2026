import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LIQPAY_PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY;

/**
 * LiqPay Webhook Handler
 * Обрабатывает подтверждения платежей из Украины
 * 
 * LiqPay отправляет POST с:
 * - data: base64 encoded JSON
 * - signature: SHA1 подпись
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = formData.get('data') as string;
    const signature = formData.get('signature') as string;

    if (!data || !signature) {
      console.error('LiqPay Webhook: Missing data or signature');
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Верификация подписи
    const expectedSignature = crypto
      .createHash('sha1')
      .update(LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY)
      .digest('base64');

    if (signature !== expectedSignature) {
      console.error('LiqPay Webhook: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Декодируем данные
    const paymentData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    
    console.log('LiqPay webhook received:', {
      order_id: paymentData.order_id,
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
    });

    const orderId = paymentData.order_id;
    const status = paymentData.status;
    const amount = paymentData.amount;
    const currency = paymentData.currency;

    // Получаем ордер из БД
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('LiqPay Webhook: Order not found', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Проверяем, не обработан ли уже платёж
    if (order.status === 'completed') {
      console.log('LiqPay Webhook: Payment already processed', orderId);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Обрабатываем статусы LiqPay
    // success - успешный платёж
    // sandbox - тестовый успешный платёж
    // failure - неуспешный платёж
    // error - ошибка
    // reversed - возврат
    // wait_accept - ожидает подтверждения
    // processing - в обработке

    if (status === 'success' || status === 'sandbox') {
      // Конвертируем UAH в RUB (примерный курс, в реальности нужно API)
      // 1 UAH ≈ 2.4 RUB
      const UAH_TO_RUB_RATE = 2.4;
      let amountInRub = amount;
      
      if (currency === 'UAH') {
        amountInRub = Math.round(amount * UAH_TO_RUB_RATE * 100) / 100;
      }

      // Зачисляем баланс
      const { error: depositError } = await supabaseAdmin.rpc('deposit_balance', {
        p_user_id: order.user_id,
        p_amount: amountInRub,
        p_description: `Пополнение через LiqPay (${amount} ${currency})`,
        p_metadata: {
          provider: 'liqpay',
          liqpay_order_id: paymentData.liqpay_order_id,
          original_amount: amount,
          original_currency: currency,
          payment_id: paymentData.payment_id,
          sender_phone: paymentData.sender_phone,
        },
      });

      if (depositError) {
        console.error('LiqPay Webhook: Deposit error', depositError);
        return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
      }

      // Обновляем статус ордера
      await supabaseAdmin
        .from('payment_orders')
        .update({
          status: 'completed',
          provider_order_id: paymentData.liqpay_order_id,
          completed_at: new Date().toISOString(),
          provider_response: paymentData,
        })
        .eq('id', orderId);

      console.log('LiqPay payment completed:', {
        orderId,
        userId: order.user_id,
        amount: amountInRub,
        originalAmount: amount,
        originalCurrency: currency,
      });

    } else if (status === 'failure' || status === 'error' || status === 'reversed') {
      // Отмечаем как неуспешный
      await supabaseAdmin
        .from('payment_orders')
        .update({
          status: 'failed',
          provider_response: paymentData,
        })
        .eq('id', orderId);

      console.log('LiqPay payment failed:', {
        orderId,
        status,
        error: paymentData.err_code,
        errorDescription: paymentData.err_description,
      });
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('LiqPay Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET для проверки работоспособности
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    provider: 'liqpay',
    message: 'LiqPay webhook endpoint is ready'
  });
}
