import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Bu endpoint eski payments akışının parçasıydı.
// Yeni finans sistemi finance_installments ve /api/installments* rotaları üzerinden çalışıyor.
// Güvenli temizlik için burada her zaman 410 dönüyoruz.
export async function GET() {
  return NextResponse.json(
    { deprecated: true, message: 'Bu endpoint kaldırıldı. Lütfen /api/installments tabanlı finans APIlerini kullanın.' },
    { status: 410 },
  );
}
