import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const BodySchema = z.object({
  student_id: z.string().uuid(),
  total_amount: z.number().positive(),
  installment_count: z.number().int().min(1).max(60),
  first_due_date: z.string(),
  reason: z.string().optional(), // Yeniden yapılandırma sebebi
});

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// POST /api/installments/restructure
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { student_id, total_amount, installment_count, first_due_date, reason } = parsed.data;

    const accessToken = getAccessTokenFromRequest(req);
    const supabase = accessToken ? getServiceRoleClient() : getServiceRoleClient();

    // 1. Bu öğrencinin TÜM taksitlerini al
    const { data: allInstallments, error: fetchError } = await supabase
      .from('finance_installments')
      .select('id, installment_no, amount, paid_amount, due_date, paid_at, is_paid, status, payment_method')
      .eq('student_id', student_id)
      .order('installment_no', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    // 2. Mevcut toplam ve taksit sayısını hesapla
    const previousTotal = (allInstallments || []).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    const previousInstallmentCount = (allInstallments || []).length;

    // 3. ✅ ESKİ TAKSİTLERİ GEÇMİŞ TABLOSUNA KAYDET
    if (allInstallments && allInstallments.length > 0) {
      const historyRecords = allInstallments.map(inst => ({
        student_id,
        original_installment_id: inst.id,
        installment_no: inst.installment_no,
        amount: Number(inst.amount) || 0,
        paid_amount: Number(inst.paid_amount) || 0,
        due_date: inst.due_date,
        paid_at: inst.paid_at,
        is_paid: inst.is_paid || false,
        status: 'archived',
        payment_method: inst.payment_method,
        restructure_reason: reason || 'yeniden_taksitlendirme',
        previous_total: previousTotal,
        new_total: total_amount,
        previous_installment_count: previousInstallmentCount,
        new_installment_count: installment_count,
      }));

      const { error: historyError } = await supabase
        .from('installment_history')
        .insert(historyRecords);

      if (historyError) {
        console.error('Geçmiş kaydı hatası:', historyError);
        // Geçmiş kaydedilemese bile devam et (kritik değil)
      } else {
        console.log(`✅ ${historyRecords.length} taksit geçmişe kaydedildi`);
      }
    }

    // 4. Taksitleri kategorilere ayır
    const toDeleteIds: string[] = [];
    const toKeepIds: string[] = [];
    let totalPaidAmount = 0;

    for (const inst of allInstallments || []) {
      const paidAmount = Number(inst.paid_amount) || 0;
      
      if (paidAmount > 0) {
        toKeepIds.push(inst.id);
        totalPaidAmount += paidAmount;
      } else {
        toDeleteIds.push(inst.id);
      }
    }

    const effectiveTotal = Math.round(total_amount * 100) / 100;

    // 5. Ödenmemiş taksitleri sil
    if (toDeleteIds.length > 0) {
      const { error: delError } = await supabase
        .from('finance_installments')
        .delete()
        .in('id', toDeleteIds);
      if (delError) {
        console.error('Taksit silme hatası:', delError);
        return NextResponse.json({ success: false, error: 'Eski taksitler silinemedi: ' + delError.message }, { status: 500 });
      }
      console.log(`✅ ${toDeleteIds.length} eski taksit silindi`);
    }

    // 6. Yeni Taksitleri Oluştur
    const totalCents = Math.round(effectiveTotal * 100);
    const baseAmountCents = Math.floor(totalCents / installment_count);
    const remainderCents = totalCents - (baseAmountCents * installment_count);

    const newInstallments = [];
    const startDate = new Date(first_due_date);

    for (let i = 0; i < installment_count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const amountCents =
          i === installment_count - 1 ? baseAmountCents + remainderCents : baseAmountCents;
        const amount = amountCents / 100;

        newInstallments.push({
          student_id,
          installment_no: i + 1,
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
        throw new Error('Yeni taksitler oluşturulamadı: ' + insertError.message);
    }

    return NextResponse.json({ 
      success: true,
      message: `${previousInstallmentCount} taksit geçmişe kaydedildi, ${installment_count} yeni taksit oluşturuldu.`
    }, { status: 200 });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
