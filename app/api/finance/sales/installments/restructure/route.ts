import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BodySchema = z.object({
  sale_id: z.string().uuid(),
  student_id: z.string().uuid(),
  total_amount: z.number().positive(),
  installment_count: z.number().int().min(1).max(60),
  first_due_date: z.string(),
});

// POST /api/finance/sales/installments/restructure
// Belirli bir satışa ait (source = 'sale') taksit planını yeniden oluşturur.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { sale_id, student_id, total_amount, installment_count, first_due_date } =
      parsed.data;

    const supabase = getServiceRoleClient();

    // 1) Bu satışa ait ödenmemiş tüm taksitleri çek (yalnızca satış kaynağı)
    const { data: installments, error: fetchError } = await supabase
      .from('finance_installments')
      .select('id, installment_no, amount, paid_amount, is_paid')
      .or(`sale_id.eq.${sale_id},agreement_id.eq.${sale_id}`)
      .eq('source', 'sale')
      .eq('is_paid', false);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 },
      );
    }

    const toDeleteIds: string[] = [];
    const toUpdate: { id: string; amount: number }[] = [];
    let calculatedTotalDebt = 0;

    for (const inst of installments || []) {
      const paid = Number(inst.paid_amount) || 0;
      const original = Number(inst.amount) || 0;
      const remaining = Math.round((original - paid) * 100) / 100;

      if (remaining > 0) {
        calculatedTotalDebt += remaining;

        if (paid === 0) {
          toDeleteIds.push(inst.id);
        } else {
          toUpdate.push({ id: inst.id, amount: paid });
        }
      }
    }

    const effectiveTotal =
      calculatedTotalDebt > 0
        ? Math.round(calculatedTotalDebt * 100) / 100
        : Math.round(total_amount * 100) / 100;

    // 3) Eski taksitleri temizle / kapat
    if (toDeleteIds.length > 0) {
      const { error: delError } = await supabase
        .from('finance_installments')
        .delete()
        .in('id', toDeleteIds);
      if (delError) {
        return NextResponse.json(
          { success: false, error: delError.message },
          { status: 500 },
        );
      }
    }

    for (const item of toUpdate) {
      const { error: updError } = await supabase
        .from('finance_installments')
        .update({
          amount: item.amount,
          paid_amount: item.amount,
          is_paid: true,
          status: 'paid',
        })
        .eq('id', item.id);
      if (updError) {
        return NextResponse.json(
          { success: false, error: updError.message },
          { status: 500 },
        );
      }
    }

    // 4) Bu satışa ait en büyük installment_no'yu bul (sadece satış kaydı için)
    const { data: lastRow, error: lastError } = await supabase
      .from('finance_installments')
      .select('installment_no')
      .or(`sale_id.eq.${sale_id},agreement_id.eq.${sale_id}`)
      .eq('source', 'sale')
      .order('installment_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    const baseInstallmentNo =
      lastError || !lastRow || !lastRow.installment_no
        ? 0
        : Number(lastRow.installment_no) || 0;

    // 5) Yeni taksitleri oluştur (kuruş hassasiyeti)
    const totalCents = Math.round(effectiveTotal * 100);
    const baseAmountCents = Math.floor(totalCents / installment_count);
    const remainderCents = totalCents - baseAmountCents * installment_count;

    const newInstallments = [];
    const startDate = new Date(first_due_date);

    for (let i = 0; i < installment_count; i += 1) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const amountCents =
        i === installment_count - 1 ? baseAmountCents + remainderCents : baseAmountCents;
      const amount = amountCents / 100;

      newInstallments.push({
        student_id,
        sale_id,
        agreement_id: sale_id,
        source: 'sale',
        installment_no: baseInstallmentNo + i + 1,
        amount: Number(amount.toFixed(2)),
        due_date: dueDate.toISOString().split('T')[0],
        is_paid: false,
        paid_amount: 0,
        status: 'pending',
      });
    }

    const { error: insertError } = await supabase
      .from('finance_installments')
      .insert(newInstallments);

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Satış taksitleri yeniden yapılandırılamadı' },
      { status: 500 },
    );
  }
}


