import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET - Получить статистику транзакций для админ-панели
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Проверяем роль
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 24h, 7d, 30d, all

    // Определяем диапазон дат
    let dateFilter = '';
    switch (period) {
      case '24h':
        dateFilter = `AND created_at > NOW() - INTERVAL '24 hours'`;
        break;
      case '7d':
        dateFilter = `AND created_at > NOW() - INTERVAL '7 days'`;
        break;
      case '30d':
        dateFilter = `AND created_at > NOW() - INTERVAL '30 days'`;
        break;
      case 'all':
      default:
        dateFilter = '';
    }

    // Общая статистика
    const { data: totalStats } = await supabaseAdmin.rpc('get_finance_overview', { 
      date_filter: dateFilter 
    }).maybeSingle();

    // Если нет RPC функции, делаем запросы напрямую
    const [
      { count: totalTransactions },
      { data: typeStats },
      { data: recentTransactions },
      { data: topUsers },
      { data: dailyStats }
    ] = await Promise.all([
      // Общее количество транзакций
      supabaseAdmin
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),

      // Статистика по типам
      supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('status', 'completed'),

      // Последние 10 транзакций
      supabaseAdmin
        .from('transactions')
        .select(`
          *,
          user:profiles!user_id (
            display_name,
            nickname,
            email,
            avatar
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10),

      // Топ пользователей по объёму операций
      supabaseAdmin
        .from('transactions')
        .select(`
          user_id,
          amount,
          user:profiles!user_id (
            display_name,
            nickname,
            email,
            avatar
          )
        `)
        .eq('status', 'completed')
        .order('amount', { ascending: false })
        .limit(100),

      // Статистика по дням за последние 30 дней
      supabaseAdmin
        .from('transactions')
        .select('created_at, type, amount')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Агрегируем статистику по типам
    const statsByType: Record<string, { count: number; total: number }> = {};
    typeStats?.forEach((t: any) => {
      if (!statsByType[t.type]) {
        statsByType[t.type] = { count: 0, total: 0 };
      }
      statsByType[t.type].count++;
      statsByType[t.type].total += parseFloat(t.amount) || 0;
    });

    // Агрегируем топ пользователей
    const userTotals: Record<string, { user: any; total: number; count: number }> = {};
    topUsers?.forEach((t: any) => {
      if (!userTotals[t.user_id]) {
        userTotals[t.user_id] = { user: t.user, total: 0, count: 0 };
      }
      userTotals[t.user_id].total += parseFloat(t.amount) || 0;
      userTotals[t.user_id].count++;
    });

    const topUsersList = Object.values(userTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Агрегируем по дням
    const dailyData: Record<string, { 
      deposits: number; 
      withdrawals: number; 
      purchases: number;
      payouts: number;
    }> = {};
    
    dailyStats?.forEach((t: any) => {
      const date = new Date(t.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { deposits: 0, withdrawals: 0, purchases: 0, payouts: 0 };
      }
      const amount = parseFloat(t.amount) || 0;
      if (t.type === 'deposit') dailyData[date].deposits += amount;
      if (t.type === 'withdrawal') dailyData[date].withdrawals += amount;
      if (t.type === 'purchase') dailyData[date].purchases += amount;
      if (t.type === 'payout') dailyData[date].payouts += amount;
    });

    // Получаем общий баланс всех пользователей
    const { data: totalBalances } = await supabaseAdmin
      .from('profiles')
      .select('balance');

    const totalSystemBalance = totalBalances?.reduce((sum, p) => sum + (parseFloat(p.balance) || 0), 0) || 0;

    // Заявки на вывод
    const { data: pendingWithdrawals, count: pendingCount } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('amount', { count: 'exact' })
      .eq('status', 'pending');

    const pendingWithdrawalSum = pendingWithdrawals?.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalTransactions: totalTransactions || 0,
        totalSystemBalance,
        pendingWithdrawals: {
          count: pendingCount || 0,
          sum: pendingWithdrawalSum
        },
        byType: statsByType,
        recentTransactions,
        topUsers: topUsersList,
        dailyChart: Object.entries(dailyData)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }
    });

  } catch (error: any) {
    console.error('Finance stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
