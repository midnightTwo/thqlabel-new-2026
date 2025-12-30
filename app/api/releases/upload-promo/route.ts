import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/releases/upload-promo - загрузка промо-фотографий релиза
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
    const files = formData.getAll('files') as File[];
    const releaseId = formData.get('releaseId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ 
        error: 'Too many files. Maximum 5 promo photos allowed' 
      }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Проверка формата
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPG and PNG are allowed`);
        continue;
      }

      // Проверка размера (10 МБ)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large. Maximum size is 10 MB`);
        continue;
      }

      // Загружаем файл
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${releaseId}/promo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('release-promo')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        errors.push(`${file.name}: ${uploadError.message}`);
        continue;
      }

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('release-promo')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to upload any files',
        details: errors 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      promoUrls: uploadedUrls,
      uploadedCount: uploadedUrls.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedUrls.length} promo photo(s)`
    });

  } catch (error: any) {
    console.error('Error uploading promo photos:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
