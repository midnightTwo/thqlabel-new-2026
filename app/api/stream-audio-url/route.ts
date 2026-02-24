import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function base64UrlEncode(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signAccess(payload: string) {
  const secret = process.env.STREAM_AUDIO_SECRET;
  if (!secret) return null;
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(payload).digest());
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const releaseId = searchParams.get('releaseId');
    const releaseType = searchParams.get('releaseType') as 'basic' | 'exclusive' | null;
    const trackIndex = searchParams.get('trackIndex');

    if (!releaseId || !releaseType || trackIndex === null) {
      return NextResponse.json({ error: 'Недостаточно параметров' }, { status: 400 });
    }

    const secret = process.env.STREAM_AUDIO_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'STREAM_AUDIO_SECRET is not configured' },
        { status: 500 }
      );
    }

    // Проверяем авторизацию (Bearer)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Получаем релиз
    const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
    const { data: release, error: releaseError } = await supabase
      .from(tableName)
      .select('status, user_id')
      .eq('id', releaseId)
      .single();

    if (releaseError || !release) {
      return NextResponse.json({ error: 'Релиз не найден' }, { status: 404 });
    }

    const isOwner = user.id === release.user_id;
    let isAdmin = false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    const allowPendingForDebug = release.status === 'pending' || release.status === 'draft';

    if (!isAdmin && !isOwner && !allowPendingForDebug) {
      if (release.status !== 'published') {
        return NextResponse.json(
          { error: 'Доступ запрещен. Релиз не опубликован.' },
          { status: 403 }
        );
      }
    }

    // Подписываем короткий доступ на 5 минут
    const exp = Math.floor(Date.now() / 1000) + 5 * 60;
    const payload = `${releaseId}.${releaseType}.${trackIndex}.${exp}`;
    const sig = signAccess(payload);

    if (!sig) {
      return NextResponse.json({ error: 'Failed to sign' }, { status: 500 });
    }

    const url = `/api/stream-audio?releaseId=${encodeURIComponent(releaseId)}` +
      `&releaseType=${encodeURIComponent(releaseType)}` +
      `&trackIndex=${encodeURIComponent(trackIndex)}` +
      `&exp=${exp}` +
      `&sig=${encodeURIComponent(sig)}`;

    return NextResponse.json({ success: true, url, exp });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка при создании stream URL' }, { status: 500 });
  }
}
