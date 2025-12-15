import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-posta adresi gerekli' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Kullanıcıyı bul
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, email, name, organization_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    // Güvenlik: Kullanıcı bulunamasa bile aynı mesajı döndür
    if (userError || !user) {
      // Güvenlik için aynı başarı mesajı
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.'
      });
    }

    // Token oluştur (64 karakter hex)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token'ın geçerlilik süresi: 1 saat
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Eski tokenları sil
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // Yeni token kaydet
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Token kaydetme hatası:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Token oluşturulamadı' },
        { status: 500 }
      );
    }

    // Reset URL oluştur
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akademihub.vercel.app';
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    // E-posta gönder
    try {
      // Resend API kullan (veya başka bir servis)
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'AkademiHub <noreply@akademihub.com>',
          to: [user.email],
          subject: 'Şifre Sıfırlama - AkademiHub',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #075E54 0%, #25D366 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">🎓 AkademiHub</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Merhaba ${user.name},</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: #25D366; color: white; padding: 15px 40px; 
                            text-decoration: none; border-radius: 8px; font-weight: bold;
                            display: inline-block;">
                    Şifremi Sıfırla
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px;">
                  Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.
                </p>
                
                <p style="color: #999; font-size: 14px;">
                  Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  Bu otomatik bir e-postadır. Lütfen yanıtlamayın.<br>
                  © 2025 AkademiHub - Eğitim Yönetim Sistemi
                </p>
              </div>
            </div>
          `
        })
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.text();
        console.error('E-posta gönderme hatası:', emailError);
        
        // E-posta gönderilemese bile token oluşturuldu
        // Geliştirme ortamında URL'yi console'a yazdır
        if (process.env.NODE_ENV === 'development') {
          console.log('🔗 Şifre sıfırlama linki:', resetUrl);
        }
      }
    } catch (emailErr) {
      console.error('E-posta servisi hatası:', emailErr);
      // Geliştirme ortamında URL'yi göster
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Şifre sıfırlama linki:', resetUrl);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Eğer bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.',
      // Development modda token'ı da döndür (test için)
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
