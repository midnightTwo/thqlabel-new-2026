import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// СПИСАНИЕ С БАЛАНСА ЗА ПОКУПКУ (РЕЛИЗ)
// С защитой от повторной оплаты
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Получаем токен из заголовка
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Проверяем токен
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      amount, 
      description, 
      releaseId, 
      releaseTitle, 
      releaseArtist,
      releaseType = 'basic',
      tracksCount = 1 
    } = body;

    // Валидация
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма' },
        { status: 400 }
      );
    }

    // Если есть releaseId - проверяем что релиз не оплачен и используем безопасную функцию
    if (releaseId) {
      // Сначала проверяем не оплачен ли уже релиз
      const table = releaseType === 'basic' ? 'releases_basic' : 'releases';
      const { data: existingRelease, error: checkError } = await supabaseAdmin
        .from(table)
        .select('id, is_paid, payment_transaction_id, title')
        .eq('id', releaseId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Release check error:', checkError);
      }

      // Если релиз уже оплачен - возвращаем информацию
      if (existingRelease?.is_paid) {
        return NextResponse.json({
          success: true,
          alreadyPaid: true,
          message: 'Релиз уже был оплачен ранее',
          transactionId: existingRelease.payment_transaction_id
        });
      }

      // Пробуем использовать RPC функцию для атомарной оплаты
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('pay_for_release', {
        p_user_id: user.id,
        p_release_id: releaseId,
        p_release_type: releaseType,
        p_release_title: releaseTitle || existingRelease?.title || 'Релиз',
        p_release_artist: releaseArtist || '',
        p_tracks_count: tracksCount,
        p_amount: amount
      });

      // Если RPC работает - возвращаем результат
      if (!rpcError && rpcResult) {
        if (rpcResult.success === false) {
          // RPC вернул ошибку (недостаточно средств, уже оплачен)
          return NextResponse.json({
            success: false,
            error: rpcResult.error,
            code: rpcResult.code,
            currentBalance: rpcResult.current_balance,
            requiredAmount: rpcResult.required_amount
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Оплата успешно произведена',
          transactionId: rpcResult.transaction_id,
          paymentId: rpcResult.payment_id,
          newBalance: rpcResult.balance_after,
          amount
        });
      }

      // Если RPC не работает (функция не создана) - используем fallback
      console.log('RPC not available, using fallback:', rpcError?.message);
    }

    // FALLBACK: старая логика без RPC (для совместимости)
    // Получаем текущий баланс
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('balance, total_spent')
      .eq('user_id', user.id)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Balance fetch error:', balanceError);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения баланса' },
        { status: 500 }
      );
    }

    const currentBalance = balanceData ? parseFloat(balanceData.balance) : 0;
    const currentSpent = balanceData ? parseFloat(balanceData.total_spent || '0') : 0;

    // Проверяем достаточно ли средств
    if (currentBalance < amount) {
      return NextResponse.json({
        success: false,
        error: 'Недостаточно средств на балансе',
        code: 'INSUFFICIENT_BALANCE',
        currentBalance,
        requiredAmount: amount,
        shortage: amount - currentBalance
      }, { status: 400 });
    }

    // Списываем с баланса
    const newBalance = currentBalance - amount;
    const newSpent = currentSpent + amount;

    // Обновляем баланс
    const { error: updateError } = await supabaseAdmin
      .from('user_balances')
      .update({
        balance: newBalance,
        total_spent: newSpent,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Balance update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Ошибка списания с баланса' },
        { status: 500 }
      );
    }

    // Записываем транзакцию
    const transactionData = {
      user_id: user.id,
      type: 'purchase',
      amount: amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      currency: 'RUB',
      status: 'completed',
      description: description || `Оплата релиза${releaseTitle ? `: ${releaseTitle}` : ''}`,
      metadata: {
        release_id: releaseId,
        release_type: releaseType,
        release_title: releaseTitle,
        tracks_count: tracksCount,
        payment_method: 'balance'
      }
    };

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
    }

    // Если есть releaseId - помечаем релиз как оплаченный
    if (releaseId && transaction?.id) {
      const table = releaseType === 'basic' ? 'releases_basic' : 'releases';
      
      // Генерируем URL чека (ссылка на транзакцию)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thqlabel.ru';
      const receiptUrl = `${baseUrl}/api/receipt/${transaction.id}`;
      
      await supabaseAdmin
        .from(table)
        .update({
          is_paid: true,
          payment_transaction_id: transaction.id,
          payment_amount: amount,
          payment_receipt_url: receiptUrl,
          payment_date: new Date().toISOString(),
          paid_at: new Date().toISOString()
        })
        .eq('id', releaseId)
        .eq('user_id', user.id);

      // Записываем в историю оплат релизов (если таблица существует)
      await supabaseAdmin
        .from('release_payments')
        .insert({
          user_id: user.id,
          release_id: releaseId,
          release_type: releaseType,
          transaction_id: transaction.id,
          release_title: releaseTitle || 'Релиз',
          release_artist: releaseArtist,
          tracks_count: tracksCount,
          amount,
          payment_method: 'balance',
          status: 'completed'
        })
        .then(({ error }) => {
          if (error) console.log('release_payments insert skipped:', error.message);
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Оплата успешно произведена',
      newBalance,
      transactionId: transaction?.id,
      amount
    });

  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
