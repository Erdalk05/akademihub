import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // E-posta gönder
    const response = await resend.emails.send({
      from: 'AkademiHub <info@onayli-domainim.com>',
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
    // eslint-disable-next-line no-console
    console.error('E-posta Gönderme Hatası:', error);

    return NextResponse.json(
      { error: 'E-posta API hatası', details: error.message },
      { status: 500 }
    );
  }
}
