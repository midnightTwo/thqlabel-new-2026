import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// PATCH - Обновить статус заявки (для админов)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: withdrawalId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Проверяем права админа
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || !['admin', 'owner'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status, adminComment, expectedPayoutDate } = body;

    // Валидация статуса
    const validStatuses = ['approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Недопустимый статус. Допустимые: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    let result;

    // Пробуем использовать функции БД
    if (status === 'approved') {
      const { data, error } = await supabaseAdmin.rpc('approve_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: user.id,
        p_comment: adminComment || null,
        p_expected_payout_date: expectedPayoutDate || null
      });
      
      if (!error && data?.success) {
        result = data;
      }
    } else if (status === 'rejected') {
      const { data, error } = await supabaseAdmin.rpc('reject_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: user.id,
        p_comment: adminComment || null
      });
      
      if (!error && data?.success) {
        result = data;
      }
    } else if (status === 'completed') {
      const { data, error } = await supabaseAdmin.rpc('complete_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: user.id,
        p_comment: adminComment || null
      });
      
      if (!error && data?.success) {
        result = data;
      }
    }

    // Если RPC не сработал или вернул ошибку - используем прямую логику
    if (!result) {
      console.log('RPC not available or failed, using direct logic');
      
      // Получаем заявку
      const { data: withdrawal, error: fetchError } = await supabaseAdmin
        .from('withdrawal_requests')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (fetchError || !withdrawal) {
        return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
      }

      if (withdrawal.status === 'completed') {
        return NextResponse.json({ error: 'Заявка уже завершена' }, { status: 400 });
      }

      if (withdrawal.status === 'rejected') {
        return NextResponse.json({ error: 'Заявка уже отклонена' }, { status: 400 });
      }

      const amount = parseFloat(withdrawal.amount);
      const userId = withdrawal.user_id;

      // Получаем балансы
      const { data: balanceData } = await supabaseAdmin
        .from('user_balances')
        .select('balance, frozen_balance, total_withdrawn')
        .eq('user_id', userId)
        .single();

      let balance = parseFloat(balanceData?.balance) || 0;
      let frozen = parseFloat(balanceData?.frozen_balance) || 0;
      let totalWithdrawn = parseFloat(balanceData?.total_withdrawn) || 0;

      let txType: string;
      let txDescription: string;
      let newBalance = balance;
      let newFrozen = frozen;

      if (status === 'rejected') {
        // Возвращаем средства
        txType = 'unfreeze';
        txDescription = `Возврат средств - заявка #${withdrawalId} отклонена${adminComment ? `: ${adminComment}` : ''}`;
        newBalance = balance + amount;
        newFrozen = Math.max(0, frozen - amount);
      } else if (status === 'completed') {
        // Снимаем заморозку, добавляем к выведенным
        txType = 'withdrawal';
        txDescription = `Вывод #${withdrawalId} выполнен: ${amount.toLocaleString('ru')} ₽`;
        newFrozen = Math.max(0, frozen - amount);
        totalWithdrawn += amount;
      } else {
        // approved - просто меняем статус
        txType = 'approve';
        txDescription = `Заявка на вывод #${withdrawalId} одобрена`;
      }

      // Обновляем заявку
      const updateData: any = {
        status,
        admin_comment: adminComment || null,
        processed_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.actual_payout_date = new Date().toISOString();
      }

      if (status === 'approved' && expectedPayoutDate) {
        updateData.expected_payout_date = expectedPayoutDate;
      }

      await supabaseAdmin
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', withdrawalId);

      // Обновляем балансы если нужно
      if (status === 'rejected' || status === 'completed') {
        await supabaseAdmin
          .from('user_balances')
          .update({
            balance: newBalance,
            frozen_balance: newFrozen,
            total_withdrawn: totalWithdrawn,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        await supabaseAdmin
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);

        // Создаём транзакцию
        await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            type: txType,
            amount,
            currency: 'RUB',
            balance_before: balance,
            balance_after: newBalance,
            status: 'completed',
            description: txDescription,
            reference_id: withdrawalId,
            reference_table: 'withdrawal_requests',
            metadata: {
              withdrawal_id: withdrawalId,
              admin_id: user.id,
              status
            }
          });
      }

      result = {
        success: true,
        message: status === 'approved' ? 'Заявка одобрена' 
               : status === 'rejected' ? 'Заявка отклонена, средства возвращены'
               : 'Выплата выполнена',
        withdrawal_id: withdrawalId,
        new_balance: newBalance
      };
    }

    // Проверяем результат
    if (result && !result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Update withdrawal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Получить детали заявки
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: withdrawalId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Проверяем права
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role && ['admin', 'owner'].includes(profile.role);

    // Получаем заявку с данными пользователя
    let query = supabaseAdmin
      .from('withdrawal_requests')
      .select(`
        *,
        user:profiles!user_id (
          nickname, email, avatar, member_id, role
        )
      `)
      .eq('id', withdrawalId);

    // Не-админы видят только свои заявки
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: withdrawal, error } = await query.single();

    if (error || !withdrawal) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    // Получаем связанные транзакции
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('reference_id', withdrawalId)
      .eq('reference_table', 'withdrawal_requests')
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      withdrawal,
      transactions: transactions || []
    });
  } catch (error: any) {
    console.error('Get withdrawal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
