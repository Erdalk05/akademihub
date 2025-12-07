import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BodySchema = z.object({
  saleId: z.string().uuid(),
  studentId: z.string().uuid(),
  installmentNo: z.number().int().positive(),
  amount: z.number().positive(),
  dueDate: z.string(), // YYYY-MM-DD
});

// POST /api/finance/sales/installments/add
// Belirli bir satışa (source = 'sale') tek bir ek taksit ekler.
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { saleId, studentId, installmentNo, amount, dueDate } = parsed.data;

    const supabase = getServiceRoleClient();

    const { error } = await supabase.from('finance_installments').insert({
      student_id: studentId,
      sale_id: saleId,
      agreement_id: saleId,
      source: 'sale',
      installment_no: installmentNo,
      amount,
      due_date: dueDate,
      is_paid: false,
      paid_amount: 0,
      status: 'pending',
      note: 'Satış için manuel ek taksit',
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Taksit eklenemedi' },
      { status: 500 },
    );
  }
}


