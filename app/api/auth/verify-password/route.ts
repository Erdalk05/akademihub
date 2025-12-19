import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * POST /api/auth/verify-password
 * 
 * Mevcut oturumlu kullanıcının şifresini doğrular.
 * Kritik işlemler (silme vb.) için kullanılır.
 */
export async function POST(request: NextRequest) {
  try {
    const { password, email: providedEmail } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Şifre gerekli' },
        { status: 400 }
      );
    }

    // Cookie'den session token al
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value || 
                        cookieStore.get('supabase-auth-token')?.value;

    let email = providedEmail;

    // Eğer email verilmediyse, token'dan kullanıcıyı bul
    if (!email && accessToken) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
        email = user?.email;
      } catch {
        // Token geçersiz olabilir
      }
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı e-postası bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 400 }
      );
    }

    // Şifreyi doğrula - kullanıcıyı giriş yaptırarak
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('Password verification error:', message);
    return NextResponse.json(
      { success: false, error: 'Doğrulama sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
