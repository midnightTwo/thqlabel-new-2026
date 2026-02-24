import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Типы транзакций для фильтрации
const TRANSACTION_TYPES = [
  'deposit', 'withdrawal', 'payout', 'purchase', 
  'refund', 'correction', 'adjustment', 'bonus', 'fee', 'freeze', 'unfreeze'
] as const;

// GET - Получить все транзакции с фильтрами и поиском
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

    // Параметры фильтрации
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const type = searchParams.get('type'); // deposit, withdrawal, etc
    const status = searchParams.get('status'); // completed, pending, etc
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeHidden = searchParams.get('includeHidden') === 'true';

    // Строим запрос
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        user:profiles!user_id (
          id,
          display_name,
          nickname,
          email,
          avatar,
          member_id,
          role
        ),
        admin:profiles!admin_id (
          id,
          display_name,
          email
        )
      `, { count: 'exact' });

    // Применяем фильтры
    if (!includeHidden) {
      // по умолчанию скрытые транзакции не показываем
      // важно: включаем и NULL (metadata отсутствует)
      query = query.or('metadata->>hidden.is.null,metadata->>hidden.neq.true');
    }

    if (type && TRANSACTION_TYPES.includes(type as any)) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Поиск по описанию, email, никнейму, ID транзакции
    if (search) {
      const searchTrimmed = search.trim();
      
      // Проверяем, является ли поиск UUID (ID транзакции) - полный или частичный
      const fullUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const partialUuidRegex = /^[0-9a-f-]{8,}$/i;
      
      if (fullUuidRegex.test(searchTrimmed)) {
        // Поиск по полному ID транзакции напрямую
        query = query.eq('id', searchTrimmed);
      } else if (partialUuidRegex.test(searchTrimmed)) {
        // Поиск по частичному UUID - ищем id который начинается с этой строки или содержит её
        // Сначала ищем пользователей
        const { data: matchedUsers } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .or(`email.ilike.%${searchTrimmed}%,nickname.ilike.%${searchTrimmed}%,display_name.ilike.%${searchTrimmed}%,member_id.ilike.%${searchTrimmed}%`);
        
        const userIds = matchedUsers?.map(u => u.id) || [];
        
        // Строим условие поиска: по ID транзакции ИЛИ по пользователям ИЛИ по описанию
        let orConditions = [`id.ilike.${searchTrimmed}%`, `description.ilike.%${searchTrimmed}%`, `reference_id.ilike.%${searchTrimmed}%`];
        if (userIds.length > 0) {
          orConditions.push(`user_id.in.(${userIds.join(',')})`);
        }
        query = query.or(orConditions.join(','));
      } else {
        // Обычный текстовый поиск - по email, никнейму, описанию
        const { data: matchedUsers } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .or(`email.ilike.%${searchTrimmed}%,nickname.ilike.%${searchTrimmed}%,display_name.ilike.%${searchTrimmed}%,member_id.ilike.%${searchTrimmed}%`);
        
        const userIds = matchedUsers?.map(u => u.id) || [];
        
        let orConditions = [`description.ilike.%${searchTrimmed}%`, `reference_id.ilike.%${searchTrimmed}%`];
        if (userIds.length > 0) {
          orConditions.push(`user_id.in.(${userIds.join(',')})`);
        }
        query = query.or(orConditions.join(','));
      }
    }

    // Сортировка
    const validSortFields = ['created_at', 'amount', 'type', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Пагинация
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Transactions fetch error:', error);
      return NextResponse.json({ error: 'Ошибка загрузки транзакций' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Admin transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Создать ручную транзакцию (коррекция, бонус)
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

    // Проверяем роль admin/owner
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!adminProfile || !['admin', 'owner'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      userId, 
      type, 
      amount, 
      description, 
      adminComment,
      referenceId,
      referenceTable
    } = body;

    // Валидация
    if (!userId || !type || !amount) {
      return NextResponse.json({ 
        error: 'Требуются поля: userId, type, amount' 
      }, { status: 400 });
    }

    // Только определённые типы можно создавать вручную
    const allowedManualTypes = ['correction', 'adjustment', 'bonus', 'refund', 'payout'];
    if (!allowedManualTypes.includes(type)) {
      return NextResponse.json({ 
        error: `Тип "${type}" нельзя создать вручную. Доступные: ${allowedManualTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Получаем текущий баланс пользователя
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance, display_name, email')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const currentBalance = parseFloat(userProfile.balance) || 0;
    const txAmount = parseFloat(amount);

    // Для коррекций/adjustment amount может быть отрицательным
    let balanceChange = txAmount;
    if ((type === 'correction' || type === 'adjustment') && txAmount < 0) {
      balanceChange = txAmount; // уменьшаем баланс
    }

    const newBalance = currentBalance + balanceChange;

    // Проверяем что баланс не станет отрицательным (если это не correction/adjustment с флагом allow_negative)
    if (newBalance < 0 && type !== 'correction' && type !== 'adjustment') {
      return NextResponse.json({ 
        error: `Недостаточно средств. Текущий баланс: ${currentBalance}₽, изменение: ${balanceChange}₽` 
      }, { status: 400 });
    }

    // Создаём транзакцию
    const typeNames: Record<string, string> = {
      correction: 'Коррекция',
      adjustment: 'Корректировка',
      bonus: 'Бонус',
      refund: 'Возврат',
      payout: 'Роялти'
    };
    const transactionData = {
      user_id: userId,
      type,
      amount: Math.abs(txAmount),
      currency: 'RUB',
      balance_before: currentBalance,
      balance_after: newBalance,
      status: 'completed',
      description: description || `${typeNames[type] || 'Начисление'} от администратора`,
      admin_id: user.id,
      admin_comment: adminComment || null,
      reference_id: referenceId || null,
      reference_table: referenceTable || null,
      metadata: {
        manual: true,
        admin_email: adminProfile.email,
        created_via: 'admin_panel',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    };

    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) {
      console.error('Transaction create error:', txError);
      return NextResponse.json({ error: 'Ошибка создания транзакции' }, { status: 500 });
    }

    // Обновляем баланс в profiles
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateProfileError) {
      console.error('Profile balance update error:', updateProfileError);
      // Откатываем транзакцию
      await supabaseAdmin.from('transactions').delete().eq('id', transaction.id);
      return NextResponse.json({ error: 'Ошибка обновления баланса' }, { status: 500 });
    }

    // Обновляем баланс в user_balances
    await supabaseAdmin
      .from('user_balances')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    return NextResponse.json({
      success: true,
      transaction,
      user: {
        id: userId,
        name: userProfile.display_name,
        email: userProfile.email,
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      }
    });

  } catch (error: any) {
    console.error('Admin transaction create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
