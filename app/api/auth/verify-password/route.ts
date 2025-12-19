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
    const body = await request.json();
    const { password, email: providedEmail } = body;

    console.log('Verify password request:', { email: providedEmail, hasPassword: !!password });

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Şifre gerekli' },
        { status: 400 }
      );
    }

    let email = providedEmail;

    // Eğer email verilmediyse, cookie'den almaya çalış
    if (!email) {
      const cookieStore = cookies();
      const accessToken = cookieStore.get('sb-access-token')?.value || 
                          cookieStore.get('supabase-auth-token')?.value;
      
      if (accessToken) {
        try {
          const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
          email = user?.email;
        } catch {
          // Token geçersiz olabilir
        }
      }
    }

    if (!email) {
      console.log('Email not found in request or cookies');
      return NextResponse.json(
        { success: false, error: 'Kullanıcı e-postası bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 400 }
      );
    }

    console.log('Verifying password for email:', email);

    // Şifreyi doğrula - kullanıcıyı giriş yaptırarak
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log('Sign in error:', signInError.message);
      return NextResponse.json(
        { success: false, error: 'Şifre yanlış' },
        { status: 401 }
      );
    }

    console.log('Password verified successfully for:', email);

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
