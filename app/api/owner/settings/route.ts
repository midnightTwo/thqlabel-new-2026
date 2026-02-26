import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OWNER_EMAIL = 'maksbroska@gmail.com';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET — получить настройки (публично для проверки maintenance)
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('site_settings')
      .select('maintenance_mode, maintenance_message')
      .eq('id', 1)
      .single();

    if (error) {
      // Если таблицы нет — возвращаем дефолт (не блокируем сайт)
      return NextResponse.json({ maintenance_mode: false, maintenance_message: '' });
    }

    return NextResponse.json(data || { maintenance_mode: false });
  } catch {
    return NextResponse.json({ maintenance_mode: false });
  }
}

// POST — переключить maintenance mode (только owner)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Проверяем токен пользователя
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || user.email !== OWNER_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { maintenance_mode, maintenance_message } = body;

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        id: 1,
        maintenance_mode: !!maintenance_mode,
        maintenance_message: maintenance_message || 'Ведутся технические работы',
        updated_at: new Date().toISOString(),
        updated_by: user.email,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Ошибка обновления настроек:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, maintenance_mode: !!maintenance_mode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
