import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Проверяем авторизацию пользователя
    const authHeader = request.headers.get('authorization');
    let isAuthorized = false;
    let isOwner = false;
    let isAdmin = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        isAuthorized = true;
        isOwner = user.id === release.user_id;

        // Проверяем, является ли пользователь админом
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

    // Если это Supabase Storage URL, получаем signed URL
    if (audioUrl.includes('supabase')) {
      try {
        // Извлекаем путь из URL
        const urlParts = audioUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const [bucket, ...pathParts] = urlParts[1].split('/');
          const path = decodeURIComponent(pathParts.join('/'));

          // Пробуем загрузить файл напрямую через download
          const { data: fileData, error: downloadError } = await supabase
            .storage
            .from(bucket)
            .download(path);

          if (downloadError || !fileData) {
            return NextResponse.json(
              { error: 'Не удалось загрузить аудио файл' },
              { status: 404 }
            );
          }

          // Определяем MIME-тип по расширению файла
          const contentType = getMimeType(path);
          const arrayBuffer = await fileData.arrayBuffer();

          return new NextResponse(arrayBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Length': arrayBuffer.byteLength.toString(),
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          });
        } else {
          // Пробуем получить напрямую через fetch
        }
      } catch {
        // Продолжаем и пробуем fetch напрямую
      }
    }

    // Для остальных URL или fallback проксируем напрямую
    try {
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        return NextResponse.json(
          { error: 'Не удалось загрузить аудио' },
          { status: audioResponse.status }
        );
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const contentType = audioResponse.headers.get('Content-Type') || getMimeType(audioUrl);

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': audioBuffer.byteLength.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Ошибка загрузки внешнего аудио' },
        { status: 500 }
      );
    }

  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении аудио' },
      { status: 500 }
    );
  }
}
