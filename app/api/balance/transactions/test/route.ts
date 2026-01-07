import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Простой тест - показывает последние 10 транзакций для пользователя
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token', transactions: [] });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Auth error: ' + authError?.message, userId: null, transactions: [] });
    }

    // Получаем все транзакции пользователя без фильтров
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, type, amount, status, description, created_at, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Также получаем общее количество для этого user_id
    const { count } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      userEmail: user.email,
      totalCount: count,
      transactionsCount: transactions?.length || 0,
      transactions: transactions || [],
      error: txError?.message || null
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Exception: ' + error.message,
      transactions: [] 
    });
  }
}
