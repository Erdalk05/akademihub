import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import type { FinanceInstallment, FinanceSummary } from '@/lib/types/finance';

export const runtime = 'edge';

// GET /api/finance/sales/installments?saleId=UUID
// Belirli bir satışa (agreement_id = saleId, source = 'sale') ait taksit özetini döner.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const saleId = searchParams.get('saleId');

    if (!saleId) {
      return NextResponse.json(
        { success: false, error: 'saleId parametresi zorunludur' },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('finance_installments')
      .select('*')
      .eq('agreement_id', saleId)
      .eq('source', 'sale')
      .order('installment_no', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const installments = (data || []) as FinanceInstallment[];

    const total = installments.reduce((s, it) => s + Number(it.amount || 0), 0);
    const paid = installments.reduce(
      (s, it) => s + Number((it.paid_amount ?? (it.is_paid ? it.amount : 0)) || 0),
      0,
    );
    const unpaid = total - paid;
    const balance = unpaid;

    const summary: FinanceSummary = {
      total,
      paid,
      unpaid,
      balance,
      installments,
    };

    return NextResponse.json({ success: true, data: summary }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Satış taksitleri alınamadı' },
      { status: 500 },
    );
  }
}


