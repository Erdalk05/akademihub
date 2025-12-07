import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient, getServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const BodySchema = z.object({
  student_id: z.string().uuid(),
  total_amount: z.number().positive(),
  installment_count: z.number().int().min(1).max(60),
  first_due_date: z.string(),
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
    const { student_id, total_amount, installment_count, first_due_date } = parsed.data;

    const accessToken = getAccessTokenFromRequest(req);
    // Oturum varsa RLS client, yoksa service role client kullan
    const supabase = accessToken ? createRlsServerClient(accessToken) : getServiceRoleClient();

    // 1. Bu öğrencinin TÜM taksitlerini al
    const { data: allInstallments, error: fetchError } = await supabase
      .from('finance_installments')
      .select('id, installment_no, amount, paid_amount, is_paid')
      .eq('student_id', student_id);

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    // 2. Taksitleri kategorilere ayır
    const toDeleteIds: string[] = [];      // Silinecekler (ödenmemiş veya ₺0 tutarlı)
    const toKeepIds: string[] = [];        // Korunacaklar (gerçekten ödenmiş)
    let totalPaidAmount = 0;               // Toplam ödenen miktar

    for (const inst of allInstallments || []) {
      const paidAmount = Number(inst.paid_amount) || 0;
      const amount = Number(inst.amount) || 0;
      
      // Gerçekten ödeme yapılmış mı? (paid_amount > 0)
      if (paidAmount > 0) {
        // Gerçekten ödenmiş taksit - koru
        toKeepIds.push(inst.id);
        totalPaidAmount += paidAmount;
      } else {
        // Hiç ödeme yapılmamış veya ₺0 tutarlı - sil
        toDeleteIds.push(inst.id);
      }
    }

    // Kullanıcının gönderdiği total_amount'u kullan
    // (Modal'dan gelen effectiveTotal değeri)
    const effectiveTotal = Math.round(total_amount * 100) / 100;

    // 3. Gereksiz taksitleri sil (ödenmemişler ve ₺0 tutarlılar)
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

    // 4. Yeni taksitler 1'den başlasın (temiz başlangıç)
    // Eski ödenmiş taksitler "E1, E2..." olarak kalabilir ama yeni taksitler "Y1, Y2..." olacak
    const baseInstallmentNo = 0;

    // 5. Yeni Taksitleri Oluştur
    // Taksit tutarını hesapla (Kuruş tabanlı)
    const totalCents = Math.round(effectiveTotal * 100);
    const baseAmountCents = Math.floor(totalCents / installment_count);
    const remainderCents = totalCents - (baseAmountCents * installment_count);

    const newInstallments = [];
    // first_due_date, BodySchema içinde string (YYYY-MM-DD) olarak geliyor
    const startDate = new Date(first_due_date);

    for (let i = 0; i < installment_count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        // Son takside kalan kuruşları ekle
        const amountCents =
          i === installment_count - 1 ? baseAmountCents + remainderCents : baseAmountCents;
        const amount = amountCents / 100;

        newInstallments.push({
          student_id,
          installment_no: i + 1,
          amount: Number(amount.toFixed(2)),
          due_date: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
          is_paid: false,
          paid_amount: 0,
          status: 'pending',
          is_new: true,  // Yeni taksit olarak işaretle
          source: 'education',
        });
    }

    const { error: insertError } = await supabase
        .from('finance_installments')
        .insert(newInstallments);

    if (insertError) {
        throw new Error('Yeni taksitler oluşturulamadı: ' + insertError.message);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

