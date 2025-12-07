import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // Dosya boyutu kontrolü (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Dosya boyutu 2MB\'dan küçük olmalı' }, { status: 400 });
    }

    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Sadece JPEG, PNG, WebP veya SVG dosyası yüklenebilir' }, { status: 400 });
    }

    // Dosyayı buffer'a çevir
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya adı oluştur
    const fileName = `logo-${Date.now()}.${file.type.split('/')[1]}`;

    // Supabase Storage'a yükle
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      // Storage bucket yoksa public URL kullan
      console.error('Storage upload error:', uploadError);
      
      // Base64 olarak kaydet (fallback)
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      // Settings'e kaydet
      await supabase
        .from('school_settings')
        .upsert({ key: 'school_logo', value: dataUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      return NextResponse.json({ 
        success: true, 
        data: { url: dataUrl },
        message: 'Logo kaydedildi (base64)'
      });
    }

    // Public URL oluştur
    const { data: { publicUrl } } = supabase.storage
      .from('school-assets')
      .getPublicUrl(fileName);

    // Settings'e kaydet
    await supabase
      .from('school_settings')
      .upsert({ key: 'school_logo', value: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    return NextResponse.json({ 
      success: true, 
      data: { url: publicUrl },
      message: 'Logo yüklendi'
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


