import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * POST /api/upload/student-photo
 * Öğrenci fotoğrafı yükle
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dosya tipi. JPG, PNG veya WEBP olmalı' },
        { status: 400 }
      );
    }

    // Boyut kontrolü
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 5MB\'dan küçük olmalı' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Dosya adı oluştur (unique)
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId || randomBytes(16).toString('hex')}_${Date.now()}.${fileExt}`;
    const filePath = `students/${fileName}`;

    // Dosyayı buffer'a çevir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Supabase Storage'a yükle
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('student-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Yükleme hatası: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Public URL al
    const { data: urlData } = supabase
      .storage
      .from('student-photos')
      .getPublicUrl(filePath);

    // Eğer studentId varsa, öğrenci tablosunu güncelle
    if (studentId) {
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', studentId);

      if (updateError) {
        console.error('Student update error:', updateError);
        // Fotoğraf yüklendi ama DB güncellenemedi - warning ver ama başarılı say
      }
    }

    return NextResponse.json(
      {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        message: 'Fotoğraf başarıyla yüklendi',
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/student-photo
 * Fotoğrafı sil
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Dosya yolu gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .storage
      .from('student-photos')
      .remove([filePath]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Fotoğraf silindi' },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}





