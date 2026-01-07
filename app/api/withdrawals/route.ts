import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// POST - Создать заявку на вывод средств
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankName, cardNumber, recipientName, additionalInfo } = body;

    // Валидация
    if (!amount || amount < 1000) {
      return NextResponse.json({ 
        error: 'Минимальная сумма вывода: 1000 ₽' 
      }, { status: 400 });
    }

    if (!bankName?.trim() || !cardNumber?.trim() || !recipientName?.trim()) {
      return NextResponse.json({ 
        error: 'Заполните все обязательные поля' 
      }, { status: 400 });
    }

    // Получаем текущий баланс из ОБЕИХ таблиц
    const [profileResult, userBalanceResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single(),
      supabaseAdmin
        .from('user_balances')
        .select('balance, frozen_balance')
        .eq('user_id', user.id)
        .single()
    ]);

    // Используем больший из балансов или profiles как основной
    const profileBalance = parseFloat(profileResult.data?.balance) || 0;
    const userBalance = parseFloat(userBalanceResult.data?.balance) || 0;
    const frozenBalance = parseFloat(userBalanceResult.data?.frozen_balance) || 0;
    
    // Текущий доступный баланс
    const currentBalance = Math.max(profileBalance, userBalance);
    const availableBalance = currentBalance - frozenBalance;

    if (amount > availableBalance) {
      return NextResponse.json({ 
        error: `Недостаточно средств. Доступно: ${availableBalance.toLocaleString('ru')} ₽`,
        currentBalance,
        frozenBalance,
        availableBalance
      }, { status: 400 });
    }

    // Начинаем транзакцию
    // 1. Создаём заявку на вывод
    const { data: withdrawalRequest, error: insertError } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: amount,
        bank_name: bankName.trim(),
        card_number: cardNumber.trim(),
        recipient_name: recipientName.trim(),
        additional_info: additionalInfo?.trim() || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert withdrawal error:', insertError);
      return NextResponse.json({ 
        error: 'Ошибка создания заявки' 
      }, { status: 500 });
    }

    // 2. Списываем с баланса и замораживаем
    const newBalance = currentBalance - amount;
    const newFrozenBalance = frozenBalance + amount;

    // Обновляем profiles
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Update profile error:', updateProfileError);
      // Откатываем заявку
      await supabaseAdmin.from('withdrawal_requests').delete().eq('id', withdrawalRequest.id);
      return NextResponse.json({ error: 'Ошибка обновления баланса' }, { status: 500 });
    }

    // Обновляем или создаём user_balances
    const { error: upsertBalanceError } = await supabaseAdmin
      .from('user_balances')
      .upsert({
        user_id: user.id,
        balance: newBalance,
        frozen_balance: newFrozenBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertBalanceError) {
      console.error('Upsert balance error:', upsertBalanceError);
    }

    // 3. Создаём запись транзакции (заморозка)
    const transactionData = {
      user_id: user.id,
      type: 'freeze',
      amount: amount,
      currency: 'RUB',
      balance_before: currentBalance,
      balance_after: newBalance,
      status: 'completed',
      description: `Заморозка средств для вывода: ${amount.toLocaleString('ru')} ₽`,
      reference_id: withdrawalRequest.id,
      reference_table: 'withdrawal_requests',
      payment_method: `${bankName} (${cardNumber.slice(-4)})`,
      metadata: {
        withdrawal_request_id: withdrawalRequest.id,
        bank_name: bankName,
        card_number_masked: `****${cardNumber.slice(-4)}`,
        recipient_name: recipientName,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    };

    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) {
      console.error('Transaction insert error:', txError);
      // Транзакция создана даже если запись не удалась
    }

    return NextResponse.json({
      success: true,
      withdrawalRequest,
      transaction,
      newBalance,
      frozenAmount: amount,
      message: `Заявка создана! ${amount.toLocaleString('ru')} ₽ заморожено до рассмотрения`
    });

  } catch (error: any) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Получить заявки пользователя
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: requests, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch withdrawals error:', error);
      return NextResponse.json({ error: 'Ошибка загрузки заявок' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requests: requests || []
    });

  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
