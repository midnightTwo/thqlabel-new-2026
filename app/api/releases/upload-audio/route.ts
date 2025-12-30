import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/releases/upload-audio - загрузка аудио файла трека
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const releaseId = formData.get('releaseId') as string;
    const trackId = formData.get('trackId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Проверка формата (только WAV и FLAC)
    const allowedTypes = ['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only WAV and FLAC are allowed' 
      }, { status: 400 });
    }

    // Загружаем файл в Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${releaseId}/${trackId || 'track'}-${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('release-audio')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message 
      }, { status: 500 });
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('release-audio')
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true,
      audioUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      message: 'Audio file uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading audio:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
