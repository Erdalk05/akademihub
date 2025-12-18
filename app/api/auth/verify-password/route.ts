import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * POST /api/auth/verify-password
 * 
 * Mevcut oturumlu kullanıcının şifresini doğrular.
 * Kritik işlemler (silme vb.) için kullanılır.
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Şifre gerekli' },
        { status: 400 }
      );
    }

    // Supabase client oluştur
    const supabase = createServerComponentClient({ cookies });

    // Mevcut oturumu al
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Kullanıcının e-postasını al
    const email = session.user.email;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı e-postası bulunamadı' },
        { status: 400 }
      );
    }

    // Şifreyi doğrula - kullanıcıyı tekrar giriş yaptırarak
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: 'Şifre yanlış' },
        { status: 401 }
      );
    }

    // Şifre doğru
    return NextResponse.json({
      success: true,
      message: 'Şifre doğrulandı'
    });

  } catch (error: any) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Doğrulama sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
