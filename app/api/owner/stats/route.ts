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

export async function GET(request: NextRequest) {
  const user = await verifyOwner(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const [
    { count: usersCount },
    { count: releasesBasicCount },
    { count: releasesExclusiveCount },
    { data: recentUsers },
    { data: payments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('releases_basic').select('*', { count: 'exact', head: true }),
    supabase.from('releases_exclusive').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('email, nickname, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions').select('amount, type, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  return NextResponse.json({
    users: usersCount || 0,
    releases: (releasesBasicCount || 0) + (releasesExclusiveCount || 0),
    releasesBasic: releasesBasicCount || 0,
    releasesExclusive: releasesExclusiveCount || 0,
    recentUsers: recentUsers || [],
    recentPayments: payments || [],
  });
}
