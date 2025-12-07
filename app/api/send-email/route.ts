import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body } = await req.json();

    // Parametreleri kontrol et
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'to, subject ve body parametreleri gereklidir' },
        { status: 400 }
      );
    }

    // API Key kontrolü
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'E-posta servisi yapılandırılmamış (RESEND_API_KEY eksik)' },
        { status: 503 }
      );
    }

    // Dinamik import - sadece çalışma zamanında
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    // E-posta gönder
    const response = await resend.emails.send({
      from: 'AkademiHub <info@akademihub.com>',
      to,
      subject,
      html: body,
    });

    if (response.error) {
      return NextResponse.json(
        { error: 'E-posta gönderilirken hata oluştu', details: response.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'E-posta gönderildi', id: response.data?.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('E-posta Gönderme Hatası:', error);

    return NextResponse.json(
      { error: 'E-posta API hatası', details: error.message },
      { status: 500 }
    );
  }
}
