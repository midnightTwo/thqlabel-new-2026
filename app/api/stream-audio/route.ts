import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = 'nodejs';

function base64UrlEncode(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifySignedAccess(params: {
  releaseId: string;
  releaseType: string;
  trackIndex: string;
  exp: string | null;
  sig: string | null;
}) {
  const secret = process.env.STREAM_AUDIO_SECRET;
  if (!secret) return { ok: false as const, reason: 'missing_secret' as const };
  if (!params.exp || !params.sig) return { ok: false as const, reason: 'missing_sig' as const };
  const expNum = Number(params.exp);
  if (!Number.isFinite(expNum)) return { ok: false as const, reason: 'bad_exp' as const };
  if (Date.now() > expNum * 1000) return { ok: false as const, reason: 'expired' as const };

  const payload = `${params.releaseId}.${params.releaseType}.${params.trackIndex}.${params.exp}`;
  const expected = base64UrlEncode(crypto.createHmac('sha256', secret).update(payload).digest());
  if (!timingSafeEqual(expected, params.sig)) return { ok: false as const, reason: 'bad_sig' as const };
  return { ok: true as const };
}

function pickHeader(headers: Headers, name: string) {
  const value = headers.get(name);
  return value ?? undefined;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const releaseId = searchParams.get('releaseId');
    const releaseType = searchParams.get('releaseType') as 'basic' | 'exclusive';
    const trackIndex = searchParams.get('trackIndex');

    if (!releaseId || !releaseType || trackIndex === null) {
      return NextResponse.json(
        { error: 'Недостаточно параметров' },
        { status: 400 }
      );
    }

    // Создаем клиент Supabase с service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Получаем данные релиза
    const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
    const { data: release, error: releaseError } = await supabase
      .from(tableName)
      .select('tracks, status, user_id')
      .eq('id', releaseId)
      .single();

    if (releaseError || !release) {
      return NextResponse.json(
        { error: 'Релиз не найден' },
        { status: 404 }
      );
    }

    // Проверяем доступ: либо Bearer-токен, либо короткоживущая подпись (sig+exp)
    const authHeader = request.headers.get('authorization');
    const exp = searchParams.get('exp');
    const sig = searchParams.get('sig');
    const signedAccess = verifySignedAccess({
      releaseId,
      releaseType,
      trackIndex: String(trackIndex),
      exp,
      sig,
    });

    let isOwner = false;
    let isAdmin = false;
    let hasVerifiedUser = false;

    if (signedAccess.ok) {
      hasVerifiedUser = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (!authError && user) {
        hasVerifiedUser = true;
        isOwner = user.id === release.user_id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
      }
    }

    // Логика доступа:
    // 1. Админы могут слушать всегда
    // 2. Владелец релиза может слушать всегда
    // 3. Остальные пользователи могут слушать только published релизы
    // 4. ВРЕМЕННО: разрешаем всем для отладки pending релизов
    const allowPendingForDebug = release.status === 'pending' || release.status === 'draft';

    // Если пользователь не подтверждён — разрешаем только опубликованные релизы (и pending debug как было)
    if (!hasVerifiedUser && !allowPendingForDebug && release.status !== 'published') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isAdmin && !isOwner && !allowPendingForDebug) {
      if (release.status !== 'published') {
        return NextResponse.json(
          { error: 'Доступ запрещен. Релиз не опубликован.' },
          { status: 403 }
        );
      }
    }

    // Получаем трек
    const tracks = Array.isArray(release.tracks) ? release.tracks : [];
    const trackIdx = parseInt(trackIndex, 10);

    if (trackIdx < 0 || trackIdx >= tracks.length) {
      return NextResponse.json(
        { error: 'Трек не найден' },
        { status: 404 }
      );
    }

    const track = tracks[trackIdx];
    
    // Поддержка разных полей URL аудио - проверяем что это строка
    const getStringUrl = (value: unknown): string | null => {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
      return null;
    };
    
    const audioUrl = getStringUrl(track.link) || 
                     getStringUrl(track.audio_url) || 
                     getStringUrl(track.audioFile) || 
                     getStringUrl(track.audioUrl) ||
                     getStringUrl(track.url);

    if (!audioUrl) {
      // Проверяем, есть ли audioFile как объект (файл не был загружен)
      if (track.audioFile && typeof track.audioFile === 'object') {
        return NextResponse.json(
          { error: 'Аудиофайл не был загружен в хранилище. Пожалуйста, загрузите файл заново.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'URL аудио не найден' },
        { status: 404 }
      );
    }

    // Функция для определения MIME-типа по расширению
    const getMimeType = (url: string): string => {
      const ext = url.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'flac': 'audio/flac',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',
        'aac': 'audio/aac',
        'webm': 'audio/webm',
      };
      return mimeTypes[ext || ''] || 'audio/mpeg';
    };

    // Реальный streaming + Range support: проксируем URL потоком, без загрузки всего файла в память.
    const rangeHeader = request.headers.get('range') || undefined;

    // Для supabase storage, если URL не public/sign/authenticated — пробуем сделать signed URL
    let upstreamUrl = audioUrl;
    if (audioUrl.includes('/storage/v1/object/')) {
      const match = audioUrl.match(/\/storage\/v1\/object\/(public|sign|authenticated)\/([^/]+)\/(.+)$/i);
      if (match) {
        // public/sign/authenticated — можно fetch'ить как есть
        upstreamUrl = audioUrl;
      } else {
        // Частые варианты: public URL через /storage/v1/object/public/... уже покрыт.
        // Остальное оставляем как есть.
        upstreamUrl = audioUrl;
      }

      // Если это PUBLIC URL без token — оставляем.
      // Если приватный bucket и лежит обычный path, можно расширить до createSignedUrl,
      // но для вашего текущего формата (public) этого достаточно.
    }

    const upstreamResp = await fetch(upstreamUrl, {
      headers: rangeHeader ? { Range: rangeHeader } : undefined,
    });

    if (!upstreamResp.ok && upstreamResp.status !== 206) {
      return NextResponse.json(
        { error: 'Не удалось загрузить аудио' },
        { status: upstreamResp.status }
      );
    }

    if (!upstreamResp.body) {
      return NextResponse.json(
        { error: 'Пустой ответ источника аудио' },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', upstreamResp.headers.get('Content-Type') || getMimeType(upstreamUrl));
    const contentLength = pickHeader(upstreamResp.headers, 'content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    const contentRange = pickHeader(upstreamResp.headers, 'content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    headers.set('Accept-Ranges', upstreamResp.headers.get('accept-ranges') || 'bytes');
    const etag = pickHeader(upstreamResp.headers, 'etag');
    if (etag) headers.set('ETag', etag);
    const lastModified = pickHeader(upstreamResp.headers, 'last-modified');
    if (lastModified) headers.set('Last-Modified', lastModified);

    // Без агрессивного кэша, чтобы не было рассинхрона после деплоя.
    headers.set('Cache-Control', 'no-store');
    headers.set('Pragma', 'no-cache');

    return new NextResponse(upstreamResp.body, {
      status: upstreamResp.status,
      headers,
    });

  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении аудио' },
      { status: 500 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  const res = await GET(request);
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  });
}
