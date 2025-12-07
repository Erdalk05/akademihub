import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient, getServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const BodySchema = z.object({
  installment_id: z.string().uuid(),
  payment_method: z.enum(['cash', 'card', 'bank']),
  amount_paid: z.number().positive().optional(),
  payment_date: z.string().optional(),
  note: z.string().max(1000).optional(),
  student_id: z.string().uuid().optional(),
});

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// Helper for precision math
const safeRound = (num: number) => Math.round(num * 100) / 100;

// PATCH /api/installments/pay
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { installment_id, payment_method, amount_paid, payment_date, note } = parsed.data;

    const accessToken = getAccessTokenFromRequest(req);
    const supabase = accessToken ? createRlsServerClient(accessToken) : getServiceRoleClient();

    // Ödemeyi alan kullanıcı (varsa)
    let collectedBy: string | null = null;
    if (accessToken) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        collectedBy = authData?.user?.id ?? null;
      } catch {
        collectedBy = null;
      }
    }

    const paymentId = randomUUID();
    const paidAt =
      payment_date && payment_date.length > 0 ? payment_date : new Date().toISOString();

    // İlgili taksidi oku
    const { data: existing, error: existingError } = await supabase
      .from('finance_installments')
      .select('id, student_id, installment_no, amount, paid_amount, is_paid, status')
      .eq('id', installment_id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { success: false, error: existingError?.message || 'Taksit bulunamadı' },
        { status: 404 },
      );
    }

    const installmentAmount = Number(existing.amount || 0);
    const alreadyPaid = Number(existing.paid_amount || 0);
    
    // Varsayılan olarak bu taksitin kalan borcunu hesapla
    const remainingForCurrent = safeRound(installmentAmount - alreadyPaid);

    // Eğer hem bu taksitte borç kalmamış, hem de amount_paid gelmemişse kullanıcıya bilgi ver
    if (remainingForCurrent <= 0.01 && amount_paid === undefined) {
      return NextResponse.json(
        { success: false, error: 'Bu taksit zaten tamamen ödenmiş görünüyor.' },
        { status: 400 },
      );
    }

    // Kullanıcının bu işlemde kasaya verdiği toplam para
    // (Bu tutar, seçili taksitten başlayarak gerekirse sonraki taksitlere de yayılacak)
    let remainingToAllocate =
      amount_paid !== undefined ? amount_paid : remainingForCurrent;

    if (remainingToAllocate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Ödeme tutarı pozitif olmalıdır' },
        { status: 400 },
      );
    }

    // İlgili öğrencinin, seçili taksit numarasından itibaren tüm taksitlerini al
    const studentId = existing.student_id;
    const { data: allInstallments, error: listError } = await supabase
      .from('finance_installments')
      .select(
        'id, student_id, installment_no, amount, paid_amount, due_date, is_paid, paid_at, payment_method, note, collected_by, payment_id, status, created_at',
      )
      .eq('student_id', studentId)
      .gte('installment_no', existing.installment_no)
      .order('installment_no', { ascending: true });

    if (listError || !allInstallments) {
      return NextResponse.json(
        { success: false, error: listError?.message || 'Taksit listesi okunamadı' },
        { status: 500 },
      );
    }

    const updatedRows: any[] = [];

    for (const inst of allInstallments) {
      if (remainingToAllocate <= 0.01) break;

      const instAmount = Number(inst.amount || 0);
      const instPaid = Number(inst.paid_amount || 0);
      const instRemaining = safeRound(instAmount - instPaid);
    
      // Zaten tamamen ödenmiş taksitleri atla
      if (instRemaining <= 0.01) continue;

      // Bu taksit için ayrılacak tutar
      const paymentForThis = Math.min(remainingToAllocate, instRemaining);
      const newPaidTotal = safeRound(instPaid + paymentForThis);
      const newRemaining = safeRound(instAmount - newPaidTotal);
    const isFullyPaid = newRemaining <= 0.01;
    const status = isFullyPaid ? 'paid' : 'partial';

      const { data: updated, error: updError } = await supabase
      .from('finance_installments')
      .update({
        is_paid: isFullyPaid,
        paid_at: paidAt,
        payment_method,
        note: note || null,
        payment_id: paymentId,
        collected_by: collectedBy,
        paid_amount: newPaidTotal,
        status,
      })
        .eq('id', inst.id)
      .select(
        'id, student_id, installment_no, amount, paid_amount, due_date, is_paid, paid_at, payment_method, note, collected_by, payment_id, status, created_at',
      )
      .single();

      if (updError || !updated) {
        return NextResponse.json(
          { success: false, error: updError?.message || 'Ödeme güncellenemedi' },
          { status: 500 },
        );
    }

      updatedRows.push(updated);
      remainingToAllocate = safeRound(remainingToAllocate - paymentForThis);
    }

    return NextResponse.json({ success: true, data: updatedRows }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
