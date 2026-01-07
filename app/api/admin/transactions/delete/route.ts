import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// DELETE - Удалить транзакцию (только owner)
export async function DELETE(request: NextRequest) {
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

    // Проверяем роль - ТОЛЬКО OWNER может удалять транзакции
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'owner') {
      return NextResponse.json({ 
        error: 'Доступ запрещён. Только владелец может удалять транзакции.' 
      }, { status: 403 });
    }

    // Получаем ID транзакции из URL
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) {
      return NextResponse.json({ error: 'ID транзакции не указан' }, { status: 400 });
    }

    // Получаем транзакцию
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Транзакция не найдена' }, { status: 404 });
    }

    // Вычисляем откат баланса
    const balanceChange = transaction.balance_after - transaction.balance_before;
    
    // Получаем текущий баланс пользователя
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance, email, display_name')
      .eq('id', transaction.user_id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const currentBalance = parseFloat(userProfile.balance) || 0;
    const newBalance = currentBalance - balanceChange;

    // Обновляем баланс пользователя (откат)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', transaction.user_id);

    if (updateError) {
      console.error('Balance update error:', updateError);
      return NextResponse.json({ error: 'Ошибка обновления баланса' }, { status: 500 });
    }

    // Обновляем user_balances если есть
    await supabaseAdmin
      .from('user_balances')
      .upsert({
        user_id: transaction.user_id,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Удаляем транзакцию
    const { error: deleteError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) {
      console.error('Transaction delete error:', deleteError);
      // Откатываем баланс обратно
      await supabaseAdmin
        .from('profiles')
        .update({ balance: currentBalance })
        .eq('id', transaction.user_id);
      return NextResponse.json({ error: 'Ошибка удаления транзакции' }, { status: 500 });
    }

    // Логируем действие
    console.log(`[TRANSACTION DELETED] Admin: ${adminProfile.email}, TX: ${transactionId}, User: ${userProfile.email}, Amount: ${transaction.amount}, Balance change: ${balanceChange} -> ${newBalance}`);

    return NextResponse.json({
      success: true,
      message: 'Транзакция удалена',
      details: {
        transactionId,
        userId: transaction.user_id,
        userEmail: userProfile.email,
        type: transaction.type,
        amount: transaction.amount,
        balanceChange: -balanceChange,
        oldBalance: currentBalance,
        newBalance: newBalance,
        deletedBy: adminProfile.email
      }
    });

  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
