import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OWNER_EMAIL = 'maksbroska@gmail.com';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verifyOwner(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user || user.email !== OWNER_EMAIL) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const owner = await verifyOwner(request);
  if (!owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { title, message } = await request.json();

  if (!title || !message) {
    return NextResponse.json({ error: 'title и message обязательны' }, { status: 400 });
  }

  // Получаем всех пользователей
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id');

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ error: 'Нет пользователей' }, { status: 400 });
  }

  // Создаём уведомления для всех
  const notifications = profiles.map((p: { id: string }) => ({
    user_id: p.id,
    title,
    message,
    type: 'system',
    read: false,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('notifications').insert(notifications);

  if (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: profiles.length });
}
