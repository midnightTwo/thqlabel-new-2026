import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// PATCH - Скрыть транзакцию из списка (без изменения баланса), только owner
export async function PATCH(request: NextRequest) {
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

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Доступ запрещён. Только владелец может скрывать транзакции.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) {
      return NextResponse.json({ error: 'ID транзакции не указан' }, { status: 400 });
    }

    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, metadata')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Транзакция не найдена' }, { status: 404 });
    }

    const existingMetadata = (transaction.metadata && typeof transaction.metadata === 'object')
      ? transaction.metadata
      : {};

    const newMetadata = {
      ...existingMetadata,
      hidden: true,
      hidden_at: new Date().toISOString(),
      hidden_by: user.id,
    };

    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ metadata: newMetadata })
      .eq('id', transactionId);

    if (updateError) {
      return NextResponse.json({ error: 'Ошибка скрытия транзакции' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Транзакция скрыта (баланс не изменён)',
      details: { transactionId }
    });
  } catch (error) {
    console.error('Hide transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
