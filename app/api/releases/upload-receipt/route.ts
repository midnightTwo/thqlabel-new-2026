import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/releases/upload-receipt - загрузка чека оплаты (только для Basic)
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

    // Проверяем роль пользователя
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'basic') {
      return NextResponse.json({ 
        error: 'Only Basic users need to upload payment receipt' 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const releaseId = formData.get('releaseId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!releaseId) {
      return NextResponse.json({ error: 'No release ID provided' }, { status: 400 });
    }

    // Проверка размера (10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10 MB' 
      }, { status: 400 });
    }

    // Проверка формата
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG, and PDF are allowed' 
      }, { status: 400 });
    }

    // Загружаем файл в Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${releaseId}/receipt-${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-receipts')
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
      .from('payment-receipts')
      .getPublicUrl(fileName);

    // Обновляем релиз с URL чека
    const { error: updateError } = await supabase
      .from('releases_basic')
      .update({ 
        payment_receipt_url: publicUrl,
        payment_status: 'pending'
      })
      .eq('id', releaseId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update release',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      receiptUrl: publicUrl,
      message: 'Payment receipt uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
