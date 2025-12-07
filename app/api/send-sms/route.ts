import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json();

    // Parametreleri kontrol et
    if (!to || !body) {
      return NextResponse.json(
        { error: 'to ve body parametreleri gereklidir' },
        { status: 400 }
      );
    }

    // Twilio credentials kontrol et
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: 'SMS servisi yapılandırılmamış (Twilio ayarları eksik)' },
        { status: 503 }
      );
    }

    // Dinamik import - sadece çalışma zamanında
    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    // SMS gönder
    const message = await client.messages.create({
      from: fromNumber,
      to,
      body,
    });

    return NextResponse.json(
      { message: 'SMS gönderildi', sid: message.sid },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('SMS Gönderme Hatası:', error);

    return NextResponse.json(
      {
        error: 'SMS API hatası',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
