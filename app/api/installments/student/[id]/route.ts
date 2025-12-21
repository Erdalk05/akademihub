import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient } from '@/lib/supabase/server';
import type { FinanceInstallment, FinanceSummary } from '@/lib/types/finance';

export const runtime = 'nodejs';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// Basit UUID kontrolü (Postgres uuid formatı için)
const isValidUuid = (value: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
};

// GET /api/installments/student/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const studentId = params.id;

    // Eğer gelen id geçerli bir UUID değilse, Supabase'e sorgu atma,
    // boş bir özet dön ve hata mesajı göstermeden UI'nin çalışmasını sağla.
    if (!isValidUuid(studentId)) {
      const empty: FinanceSummary = {
        total: 0,
        paid: 0,
        unpaid: 0,
        balance: 0,
        installments: [],
      };
      return NextResponse.json({ success: true, data: empty }, { status: 200 });
    }

    const accessToken = getAccessTokenFromRequest(req);
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('finance_installments')
      .select('*')
      .eq('student_id', studentId)
      .order('installment_no', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}








