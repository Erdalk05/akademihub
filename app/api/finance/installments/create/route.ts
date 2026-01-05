import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

type IncomingInstallment = {
  number?: number;
  installment_no?: number;
  amount: number;
  due_date?: string;
  dueDate?: string;
  note?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));

    const source = (body.source as string | undefined) || 'education';
    const saleId = body.sale_id as string | undefined;
    const studentId = body.student_id as string | undefined;
    const agreementId = body.agreement_id as string | undefined | null;
    const organizationId = body.organization_id as string | undefined;
    const installments = Array.isArray(body.installments)
      ? (body.installments as IncomingInstallment[])
      : [];

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organization_id zorunludur' },
        { status: 400 },
      );
    }

    if (!studentId || installments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'student_id ve installments alanlari zorunludur' },
        { status: 400 },
      );
    }

    // Mevcut en yüksek installment_no'yu bul (varsa)
    const { data: existing, error: existingErr } = await supabase
      .from('finance_installments')
      .select('installment_no')
      .eq('student_id', studentId)
      .eq('organization_id', organizationId);

    if (existingErr) {
      return NextResponse.json(
        { success: false, error: existingErr.message },
        { status: 500 },
      );
    }

    let maxNo = 0;
    (existing || []).forEach((row: any) => {
      const no = Number(row.installment_no || 0);
      if (!Number.isNaN(no)) {
        maxNo = Math.max(maxNo, no);
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const rowsToInsert = installments.map((inst, index) => {
      const amount = Number(inst.amount || 0);
      const dueDate = inst.due_date || inst.dueDate || todayStr;

      const installmentNo =
        typeof inst.number === 'number'
          ? inst.number
          : typeof inst.installment_no === 'number'
          ? inst.installment_no
          : maxNo + index + 1;

      return {
        student_id: studentId,
        organization_id: organizationId,
        source,
        sale_id: saleId || null,
        agreement_id: agreementId || saleId || null,
        installment_no: installmentNo,
        amount,
        due_date: dueDate,
        is_paid: false,
        status: 'active',
        payment_method: null,
        paid_at: null,
        note: inst.note ?? null,
      };
    });

    const { error: insertErr } = await supabase
      .from('finance_installments')
      .insert(rowsToInsert);

    if (insertErr) {
      return NextResponse.json(
        { success: false, error: insertErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: { count: rowsToInsert.length } },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Taksitler olusturulamadi' },
      { status: 500 },
    );
  }
}


