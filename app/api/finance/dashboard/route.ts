import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// GET /api/finance/dashboard
// finance_installments tablosundan temel özet verileri üretir.
export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('finance_installments')
      .select('amount, is_paid, due_date, paid_at');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = data || [];
    const today = new Date();

    let totalRevenue = 0;
    let totalExpected = 0;
    let latePayments = 0;
    let overdueAmount = 0;

    // Aylık trend için { key: { income, expense } } şeklinde bir harita kullanılır
    const monthlyMap: Record<string, { income: number; expense: number }> = {};

    for (const row of rows as any[]) {
      const amount = Number(row.amount) || 0;
      const isPaid = !!row.is_paid;
      const dueDate = row.due_date ? new Date(row.due_date) : undefined;
      const paidAt = row.paid_at ? new Date(row.paid_at) : undefined;

      // Toplam beklenen tutar
      totalExpected += amount;

      // Gelir (ödenmiş taksitler)
      if (isPaid) {
        totalRevenue += amount;
      }

      // Gecikmiş taksitler
      const isOverdue = !isPaid && dueDate && dueDate < today;
      if (isOverdue) {
        latePayments += 1;
        overdueAmount += amount;
      }

      // Aylık trend:
      // - income: paidAt ayına göre
      // - expense: şimdilik 0 (ileride gider verileri eklenecek)
      if (paidAt) {
        const key = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[key]) {
          monthlyMap[key] = { income: 0, expense: 0 };
        }
        monthlyMap[key].income += amount;
      }
    }

    const paymentRate =
      totalExpected > 0 ? Number(((totalRevenue / totalExpected) * 100).toFixed(2)) : 0;

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => ({
        month: key,
        income: value.income,
        expense: value.expense,
      }));

    const payload = {
      totalRevenue,
      paymentRate,
      latePayments,
      overdueAmount,
      monthlyTrend,
    };

    return NextResponse.json(
      { success: true, data: payload },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}


