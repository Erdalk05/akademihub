import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth/security';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Şifre validasyonu
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Şifre en az 6 karakter olmalı' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Token'ı kontrol et
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veya süresi dolmuş bağlantı' },
        { status: 400 }
      );
    }

    // Token kullanılmış mı?
    if (tokenData.used_at) {
      return NextResponse.json(
        { success: false, error: 'Bu bağlantı daha önce kullanılmış' },
        { status: 400 }
      );
    }

    // Token süresi dolmuş mu?
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Bağlantının süresi dolmuş. Lütfen yeni bir istek oluşturun.' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await hashPassword(password);

    // Kullanıcının şifresini güncelle
    const { error: updateError } = await supabase
      .from('app_users')
      .update({ password_hash: hashedPassword })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('Şifre güncelleme hatası:', updateError);
      return NextResponse.json(
        { success: false, error: 'Şifre güncellenemedi' },
        { status: 500 }
      );
    }

    // Token'ı kullanıldı olarak işaretle
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.'
    });

  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Token geçerliliğini kontrol et
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token gerekli' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: tokenData, error } = await supabase
      .from('password_reset_tokens')
      .select('id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (error || !tokenData) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Geçersiz bağlantı'
      });
    }

    if (tokenData.used_at) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Bu bağlantı daha önce kullanılmış'
      });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Bağlantının süresi dolmuş'
      });
    }

    return NextResponse.json({
      success: true,
      valid: true
    });

  } catch (error) {
    console.error('Token kontrol hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
