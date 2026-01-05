export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const response = {
  success: (data: any = null, status = 200) =>
    NextResponse.json({ success: true, data }, { status }),
  fail: (error: string, status = 500) =>
    NextResponse.json({ success: false, error }, { status }),
};

function log(message: string, meta: any = {}) {
  console.log(
    `[${new Date().toISOString()}] [EXPENSES:STATS]`,
    message,
    meta || '',
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);

    const organizationId = searchParams.get('organization_id');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate') || searchParams.get('minDate');
    const endDate = searchParams.get('endDate') || searchParams.get('maxDate');

    log('Incoming stats request', { organizationId, category, status, startDate, endDate });

    if (!organizationId) {
      return response.fail('organization_id zorunludur.', 400);
    }

    let base = supabase.from('expenses').select('*');
    base = base.eq('organization_id', organizationId);

    if (category && category !== 'all') base = base.eq('category', category);
    if (status && status !== 'all') base = base.eq('status', status);
    if (startDate) base = base.gte('date', startDate);
    if (endDate) base = base.lte('date', endDate);

    const { data, error } = await base;

    if (error) {
      log('Supabase error', error);
      return response.fail(error.message, 500);
    }

    const rows = data || [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let totalAmount = 0;
    let pendingTotal = 0;
    const byCategory: Record<string, number> = {};
    const byMonthKey: Record<string, number> = {};

    rows.forEach((e: any) => {
      const d = new Date(e.date);
      const amount = Number(e.amount || 0);
      if (!Number.isFinite(amount)) return;

      totalAmount += amount;
      if (e.status === 'pending') pendingTotal += amount;

      const catKey = String(e.category || 'other');
      byCategory[catKey] = (byCategory[catKey] || 0) + amount;

      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      byMonthKey[key] = (byMonthKey[key] || 0) + amount;
    });

    let topCategory: { category: string; amount: number } | null = null;
    Object.entries(byCategory).forEach(([cat, amount]) => {
      if (!topCategory || amount > topCategory.amount) {
        topCategory = { category: cat, amount };
      }
    });

    const monthlySeries = Object.entries(byMonthKey)
      .map(([key, amount]) => {
        const [year, month] = key.split('-').map(Number);
        return { key, year, month, amount };
      })
      .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
      .slice(-12);

    const thisMonthKey = `${thisYear}-${thisMonth + 1}`;
    const lastMonthKey = `${thisYear}-${thisMonth}`;
    const thisMonthTotal = byMonthKey[thisMonthKey] || 0;
    const lastMonthTotal = byMonthKey[lastMonthKey] || 0;

    const monthChange =
      thisMonthTotal === 0 && lastMonthTotal === 0
        ? 0
        : ((thisMonthTotal - lastMonthTotal) / (lastMonthTotal || thisMonthTotal || 1)) * 100;

    const payload = {
      totalAmount,
      pendingTotal,
      topCategory,
      monthlySeries,
      thisMonthTotal,
      lastMonthTotal,
      monthChange,
      byCategory,
    };

    log('Stats success', {
      totalAmount,
      pendingTotal,
      topCategory,
      points: monthlySeries.length,
    });

    return response.success(payload, 200);
  } catch (e: any) {
    log('Fatal error', { error: e.message });
    return response.fail(
      e.message || 'Gider istatistikleri alınırken beklenmeyen hata.',
      500,
    );
  }
}


