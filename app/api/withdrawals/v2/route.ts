import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET - Получить информацию о доступном балансе для вывода
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

    // Вызываем функцию получения баланса
    const { data, error } = await supabaseAdmin.rpc('get_available_balance', {
      p_user_id: user.id
    });

    if (error) {
      // Если функция не существует - получаем данные напрямую
      const { data: balanceData } = await supabaseAdmin
        .from('user_balances')
        .select('balance, frozen_balance, total_deposited, total_withdrawn, total_spent')
        .eq('user_id', user.id)
        .single();

      const balance = parseFloat(balanceData?.balance) || 0;
      const frozen = parseFloat(balanceData?.frozen_balance) || 0;

      return NextResponse.json({
        success: true,
        balance,
        frozen_balance: frozen,
        available_balance: balance - frozen,
        total_deposited: parseFloat(balanceData?.total_deposited) || 0,
        total_withdrawn: parseFloat(balanceData?.total_withdrawn) || 0,
        total_spent: parseFloat(balanceData?.total_spent) || 0,
        min_withdrawal: 1000
      });
    }

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error: any) {
    console.error('Get available balance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Создать заявку на вывод
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
    const { amount, bankName, cardNumber, recipientName, method = 'card', additionalInfo } = body;

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

    // Пробуем вызвать функцию БД
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('create_withdrawal_request', {
      p_user_id: user.id,
      p_amount: amount,
      p_bank_name: bankName.trim(),
      p_card_number: cardNumber.trim(),
      p_recipient_name: recipientName.trim(),
      p_method: method,
      p_additional_info: additionalInfo?.trim() || null
    });

    if (rpcError) {
      console.log('RPC not available, using direct insert:', rpcError.message);
      
      // Fallback - прямая логика
      const { data: balanceData } = await supabaseAdmin
        .from('user_balances')
        .select('balance, frozen_balance')
        .eq('user_id', user.id)
        .single();

      const balance = parseFloat(balanceData?.balance) || 0;
      const frozen = parseFloat(balanceData?.frozen_balance) || 0;
      const available = balance - frozen;

      if (amount > available) {
        return NextResponse.json({
          error: `Недостаточно средств. Доступно: ${available.toLocaleString('ru')} ₽`,
          available
        }, { status: 400 });
      }

      // Создаём заявку
      const { data: withdrawal, error: insertError } = await supabaseAdmin
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount,
          fee: 0,
          net_amount: amount,
          method,
          currency: 'RUB',
          bank_name: bankName.trim(),
          card_number: cardNumber.trim(),
          recipient_name: recipientName.trim(),
          additional_info: additionalInfo?.trim() || null,
          status: 'pending',
          payment_details: {
            bank_name: bankName.trim(),
            card_masked: `****${cardNumber.slice(-4)}`,
            recipient: recipientName.trim()
          }
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Обновляем балансы
      const newBalance = balance - amount;
      const newFrozen = frozen + amount;

      await supabaseAdmin
        .from('user_balances')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          frozen_balance: newFrozen,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      // Создаём транзакцию заморозки
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'freeze',
          amount,
          currency: 'RUB',
          balance_before: balance,
          balance_after: newBalance,
          status: 'completed',
          description: `Заморозка средств для вывода #${withdrawal.id}`,
          reference_id: withdrawal.id,
          reference_table: 'withdrawal_requests',
          payment_method: `${bankName} (****${cardNumber.slice(-4)})`,
          metadata: {
            withdrawal_id: withdrawal.id,
            bank_name: bankName,
            card_masked: `****${cardNumber.slice(-4)}`
          }
        })
        .select()
        .single();

      // Обновляем заявку с ID транзакции
      if (tx) {
        await supabaseAdmin
          .from('withdrawal_requests')
          .update({ freeze_transaction_id: tx.id })
          .eq('id', withdrawal.id);
      }

      return NextResponse.json({
        success: true,
        withdrawal_id: withdrawal.id,
        transaction_id: tx?.id,
        amount,
        balance_after: newBalance,
        frozen_balance: newFrozen
      });
    }

    // Если RPC вернул ошибку в результате
    if (result && !result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Create withdrawal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
