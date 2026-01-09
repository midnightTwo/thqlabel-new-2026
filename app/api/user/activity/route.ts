import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// POST - Обновить время активности пользователя
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

    // Обновляем время активности
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating activity:', error);
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activity update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
