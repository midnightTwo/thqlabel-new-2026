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
  const { email } = await request.json();

  if (!email) return NextResponse.json({ error: 'email обязателен' }, { status: 400 });
  if (email === OWNER_EMAIL) return NextResponse.json({ error: 'Это вы сами 😄' }, { status: 400 });

  // Генерируем magic link для входа за пользователя
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message || 'Не удалось создать ссылку' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    link: data.properties.action_link,
    email,
  });
}
