import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// CRYPTOCLOUD WEBHOOK
// Настроить в личном кабинете CryptoCloud:
// URL: https://yourdomain.com/api/payments/webhook/cryptocloud
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('CryptoCloud webhook received:', JSON.stringify(body, null, 2));

    // Проверяем статус
    if (body.status !== 'success') {
      console.log('Payment not successful:', body.status);
      return NextResponse.json({ status: 'ignored' });
    }

    // Получаем order_id
    const orderId = body.order_id;
    
    if (!orderId) {
      console.error('No order_id in webhook');
      return NextResponse.json({ error: 'No order_id' }, { status: 400 });
    }

    // Проверка подписи
    const signature = request.headers.get('Hmac');
    if (!verifyCryptoCloudSignature(body, signature)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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

    // Получаем сумму в RUB (CryptoCloud конвертирует автоматически)
    const paidAmountRub = parseFloat(body.amount_in_fiat || body.amount);

    // Зачисляем на баланс
    const { data: depositResult, error: depositError } = await supabaseAdmin
      .rpc('deposit_balance', {
        p_user_id: order.user_id,
        p_amount: order.amount, // зачисляем оригинальную сумму заказа
        p_description: `Пополнение криптовалютой (${body.currency || 'CRYPTO'})`,
        p_metadata: {
          payment_order_id: orderId,
          provider: 'cryptocloud',
          provider_payment_id: body.uuid || body.invoice_id,
          crypto_currency: body.currency,
          crypto_amount: body.amount_crypto,
          rate: body.rate,
        },
      });

    if (depositError) {
      console.error('Deposit error:', depositError);
      return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
    }

    // Обновляем статус ордера
    await supabaseAdmin
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        provider_data: body,
      })
      .eq('id', orderId);

    console.log('Crypto payment successful:', orderId, 'Amount:', order.amount);

    return NextResponse.json({ 
      status: 'success',
      orderId: orderId,
    });

  } catch (error) {
    console.error('CryptoCloud webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Проверка подписи CryptoCloud
function verifyCryptoCloudSignature(body: any, signature: string | null): boolean {
  if (!signature) return false;
  
  const secretKey = process.env.CRYPTOCLOUD_API_KEY!;
  const data = JSON.stringify(body);
  const hash = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  
  return hash === signature;
}
