import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// NOTE:
// Bu dosya artık PROMPT 1'de istenen yeni endpoint'e yönlendirildi.
// Gerçek implementation app/api/installments/overdue/route.ts içinde.
// Geriye dönük uyumluluk için, burada sadece yeni endpoint'e 302 redirect veriyoruz.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = '/api/installments/overdue';
  return NextResponse.redirect(url, 302);
}


