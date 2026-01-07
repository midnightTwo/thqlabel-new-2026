import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Debug endpoint для проверки структуры таблицы transactions
 * GET /api/balance/transactions/debug
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем структуру таблицы
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'transactions' });

    // Пробуем получить все транзакции (админским клиентом)
    const { data: allTransactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Пробуем создать тестовую транзакцию
    const testUserId = request.headers.get('x-user-id');
    let testInsert = null;
    let testInsertError = null;

    if (testUserId) {
      const result = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: testUserId,
          type: 'deposit',
          amount: 1,
          currency: 'RUB',
          balance_before: 0,
          balance_after: 1,
          status: 'completed',
          description: 'Debug test',
          payment_method: 'debug',
        })
        .select()
        .single();
      
      testInsert = result.data;
      testInsertError = result.error;

      // Удаляем тестовую транзакцию если создалась
      if (result.data?.id) {
        await supabaseAdmin
          .from('transactions')
          .delete()
          .eq('id', result.data.id);
      }
    }

    return NextResponse.json({
      message: 'Debug info for transactions table',
      columns: columns || 'Unable to get columns (RPC not available)',
      columnsError,
      recentTransactions: allTransactions,
      transactionsError: txError,
      testInsert: testInsert ? 'SUCCESS - deposit type works!' : null,
      testInsertError: testInsertError?.message || testInsertError,
      hint: testInsertError?.message?.includes('check constraint') 
        ? 'CONSTRAINT ISSUE: Run sql/FIX_TRANSACTIONS_TYPES.sql in Supabase SQL Editor'
        : null,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
