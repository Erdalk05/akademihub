import twilio from 'twilio';
import { NextRequest, NextResponse } from 'next/server';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

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
    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: 'Twilio yapılandırması eksik. .env.local dosyasını kontrol et.' },
        { status: 500 }
      );
    }

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
    // eslint-disable-next-line no-console
    console.error('SMS Gönderme Hatası:', error);

    return NextResponse.json(
      {
        error: 'SMS API hatası',
        details: error.message,
        // Twilio hatası ise daha detaylı bilgi ver
        code: error.code,
      },
      { status: 500 }
    );
  }
}
