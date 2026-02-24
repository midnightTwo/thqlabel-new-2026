import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Supabase admin client (для webhook'ов - без проверки auth)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe client (для международных платежей)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
  : null;

// ============================================
// КОНФИГУРАЦИЯ ПРОВАЙДЕРОВ
// ============================================

const PROVIDERS = {
  // YooKassa (основной для РФ)
  yookassa: {
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY,
    testMode: process.env.YOOKASSA_TEST_MODE === 'true',
  },
  // CryptoCloud (для крипты)
  cryptocloud: {
    shopId: process.env.CRYPTOCLOUD_SHOP_ID,
    apiKey: process.env.CRYPTOCLOUD_API_KEY,
  },
  // Stripe (международные платежи)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  // LiqPay (Украина)
  liqpay: {
    publicKey: process.env.LIQPAY_PUBLIC_KEY,
    privateKey: process.env.LIQPAY_PRIVATE_KEY,
  },
};

// ============================================
// СОЗДАНИЕ ПЛАТЕЖА
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency: requestCurrency, provider, paymentMethod, userId } = body;

    // Определяем минимальную сумму и валюту в зависимости от провайдера
    const currencyMap: Record<string, { min: number; currency: string }> = {
      yookassa: { min: 100, currency: 'RUB' },
    };

    const providerConfig = currencyMap[provider] || { min: 100, currency: 'RUB' };
    const displayCurrency = providerConfig.currency === 'RUB' ? '₽' : providerConfig.currency;

    // Валидация
    if (!amount || amount < providerConfig.min) {
      return NextResponse.json(
        { error: `Минимальная сумма: ${providerConfig.min}${displayCurrency}` },
        { status: 400 }
      );
    }

    if (!provider || provider !== 'yookassa') {
      return NextResponse.json(
        { error: 'Провайдер временно отключен' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const normalizedPaymentMethod = paymentMethod === 'sbp' ? 'sbp' : paymentMethod === 'card_ru' ? 'card' : paymentMethod;

    if (!['sbp', 'card'].includes(normalizedPaymentMethod)) {
      return NextResponse.json(
        { error: 'Метод оплаты временно недоступен' },
        { status: 400 }
      );
    }

    // Создаём ордер в БД
    const currency = 'RUB';
    console.log('Creating payment order:', { userId, amount, currency, provider, paymentMethod: normalizedPaymentMethod });

    // Пытаемся получить email пользователя (для чеков/уведомлений YooKassa)
    let userEmail: string | null = null;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.email && typeof profile.email === 'string') {
        userEmail = profile.email;
      }
    } catch {
      // ignore
    }
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        user_id: userId,
        amount: amount,
        currency: currency,
        provider: provider,
        payment_method: normalizedPaymentMethod,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 минут
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      console.error('Order creation details:', { userId, amount, currency, provider });
      return NextResponse.json(
        { error: `Ошибка создания заказа: ${orderError.message}` },
        { status: 500 }
      );
    }

    // Создаём платёж у провайдера
    let confirmationUrl: string;
    let providerOrderId: string;

    if (provider === 'yookassa') {
      const result = await createYooKassaPayment(order.id, amount, normalizedPaymentMethod, userEmail);
      confirmationUrl = result.confirmation.confirmation_url;
      providerOrderId = result.id;
    } else {
      throw new Error('Unknown provider');
    }

    // Обновляем ордер с данными провайдера
    await supabaseAdmin
      .from('payment_orders')
      .update({
        provider_order_id: providerOrderId,
        provider_payment_url: confirmationUrl,
        status: 'waiting',
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      confirmationUrl: confirmationUrl,
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    const message = error instanceof Error && error.message
      ? error.message
      : 'Ошибка создания платежа';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// ============================================
// YOOKASSA
// ============================================

async function createYooKassaPayment(
  orderId: string,
  amount: number,
  paymentMethod?: string,
  userEmail?: string | null
) {
  const { shopId, secretKey } = PROVIDERS.yookassa;
  
  // Проверяем настройку
  if (!shopId || !secretKey) {
    throw new Error('YooKassa не настроена. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.local');
  }

  // OAuth ключи (начинаются с *) не работают с Payments API
  if (secretKey.startsWith('*')) {
    throw new Error('YOOKASSA_SECRET_KEY выглядит как OAuth-ключ (начинается с "*"). Нужен Secret key из YooKassa (для API платежей).');
  }
  
  const idempotenceKey = `${orderId}-${Date.now()}`;
  
  const paymentData: any = {
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/cabinet?status=success&provider=yookassa&method=${encodeURIComponent(paymentMethod || 'auto')}`,
    },
    capture: true,
    description: `Пополнение баланса THQ Label #${orderId.slice(0, 8)}`,
    metadata: {
      order_id: orderId,
    },
  };

  // Для чеков/уведомлений (если включено в кабинете YooKassa)
  if (userEmail) {
    paymentData.customer = { email: userEmail };
  }

  // Указываем метод оплаты если задан
  if (paymentMethod === 'sbp') {
    paymentData.payment_method_data = { type: 'sbp' };
  } else if (paymentMethod === 'card') {
    paymentData.payment_method_data = { type: 'bank_card' };
  }

  const doRequest = async (data: any) => {
    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
      },
      body: JSON.stringify(data),
    });
    const text = await resp.text();
    return { resp, text };
  };

  // 1) Пробуем с выбранным методом
  let { resp, text } = await doRequest(paymentData);

  // Метод оплаты (СБП / карта) задаётся явно — НЕ убираем payment_method_data при ошибке,
  // чтобы пользователь гарантированно оплатил выбранным способом.

  if (!resp.ok) {
    console.error('YooKassa error:', text);
    const shortDetails = text.length > 500 ? text.slice(0, 500) + '…' : text;
    throw new Error(`YooKassa payment creation failed (HTTP ${resp.status}): ${shortDetails}`);
  }

  return JSON.parse(text);
}

// ============================================
// CRYPTOCLOUD
// ============================================

async function createCryptoCloudPayment(orderId: string, amount: number) {
  const { shopId, apiKey } = PROVIDERS.cryptocloud;

  if (!shopId || !apiKey) {
    throw new Error('CryptoCloud не настроен. Добавьте CRYPTOCLOUD_SHOP_ID и CRYPTOCLOUD_API_KEY в .env.local');
  }

  console.log('CryptoCloud: Creating payment', { orderId, amount, shopId: shopId?.slice(0, 8) });

  const response = await fetch('https://api.cryptocloud.plus/v2/invoice/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`,
    },
    body: JSON.stringify({
      shop_id: shopId,
      amount: amount.toString(),
      currency: 'USD',
      order_id: orderId,
    }),
  });

  const responseText = await response.text();
  console.log('CryptoCloud response:', responseText);

  if (!response.ok) {
    console.error('CryptoCloud error:', responseText);
    throw new Error('Ошибка создания платежа CryptoCloud');
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('CryptoCloud: Invalid JSON response');
    throw new Error('Неверный ответ от CryptoCloud');
  }

  if (data.status === 'error') {
    console.error('CryptoCloud error:', data);
    throw new Error(data.message || 'Ошибка CryptoCloud');
  }

  // CryptoCloud v2 возвращает result с полями uuid и link
  const result = data.result || data;
  
  return {
    uuid: result.uuid || result.invoice_id,
    pay_url: result.link || result.pay_url,
  };
}

// ============================================
// STRIPE (Международные платежи)
// ============================================

async function createStripePayment(orderId: string, amount: number, userId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  // Создаём Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'THQ Label Balance Top-up',
            description: `Adding $${amount} to your account balance`,
          },
          unit_amount: amount * 100, // Stripe принимает в центах
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cabinet/balance?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cabinet/balance?status=cancelled`,
    metadata: {
      order_id: orderId,
      user_id: userId,
    },
  });

  return session;
}

// ============================================
// LIQPAY (Украина)
// ============================================

async function createLiqPayPayment(orderId: string, amount: number, currency: string = 'UAH') {
  const { publicKey, privateKey } = PROVIDERS.liqpay;

  if (!publicKey || !privateKey) {
    throw new Error('LiqPay not configured');
  }

  const data = {
    public_key: publicKey,
    version: '3',
    action: 'pay',
    amount: amount,
    currency: currency,
    description: `Поповнення балансу THQ Label #${orderId.slice(0, 8)}`,
    order_id: orderId,
    result_url: `${process.env.NEXT_PUBLIC_APP_URL}/cabinet/balance?status=success`,
    server_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/liqpay`,
  };

  // Кодируем данные в Base64
  const dataBase64 = Buffer.from(JSON.stringify(data)).toString('base64');
  
  // Создаём подпись
  const signString = privateKey + dataBase64 + privateKey;
  const signature = crypto.createHash('sha1').update(signString).digest('base64');

  // Формируем URL для оплаты
  const paymentUrl = `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(dataBase64)}&signature=${encodeURIComponent(signature)}`;

  return {
    paymentUrl,
    orderId,
    data: dataBase64,
    signature,
  };
}
