import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type HistoryStatus = 'completed' | 'processing';

type HistoryReport = {
  id: string;
  name: string;
  category: string;
  period: string;
  createdAt: string;
  createdBy: string;
  status: HistoryStatus;
  size: string;
};

type HistoryResponse = {
  success: boolean;
  data: HistoryReport[];
};

export async function GET() {
  const mockReports: HistoryReport[] = [
    {
      id: 'r1',
      name: 'Aylık Finans Raporu - Kasım 2025',
      category: 'Analiz',
      period: '01.11.2025 - 30.11.2025',
      createdAt: '5 dakika önce',
      createdBy: 'Finans Admin',
      status: 'completed',
      size: '1.2 MB',
    },
    {
      id: 'r2',
      name: 'Kategori Bazlı Gider Raporu',
      category: 'Gider',
      period: '01.10.2025 - 31.10.2025',
      createdAt: '2 gün önce',
      createdBy: 'Muhasebe',
      status: 'completed',
      size: '850 KB',
    },
    {
      id: 'r3',
      name: 'Ödeme Davranışı & Risk Analizi',
      category: 'Risk',
      period: 'Son 3 Ay',
      createdAt: '1 hafta önce',
      createdBy: 'Finans Analist',
      status: 'processing',
      size: 'İşleniyor...',
    },
  ];

  const payload: HistoryResponse = {
    success: true,
    data: mockReports,
  };

  return NextResponse.json(payload, { status: 200 });
}


