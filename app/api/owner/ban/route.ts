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
  const { email, action } = await request.json(); // action: 'ban' | 'unban'

  if (!email || !action) {
    return NextResponse.json({ error: 'email и action обязательны' }, { status: 400 });
  }

  if (email === OWNER_EMAIL) {
    return NextResponse.json({ error: 'Нельзя банить самого себя 😅' }, { status: 400 });
  }

  // Найти пользователя
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const target = users?.find(u => u.email === email);
  if (!target) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

  if (action === 'ban') {
    const { error } = await supabase.auth.admin.updateUserById(target.id, {
      ban_duration: '87600h', // 10 лет
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: `${email} забанен` });
  } else {
    const { error } = await supabase.auth.admin.updateUserById(target.id, {
      ban_duration: 'none',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: `${email} разбанен` });
  }
}
