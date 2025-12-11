import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// POST /api/installments/cleanup
// Belirli bir öğrencinin gereksiz taksitlerini temizler
// - ₺0 tutarlı taksitler
// - Hiç ödeme yapılmamış (paid_amount = 0) VE is_paid = true olan taksitler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id } = body;

    if (!student_id) {
      return NextResponse.json({ success: false, error: 'student_id gerekli' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // 1. Tüm taksitleri al
    const { data: allInstallments, error: fetchError } = await supabase
      .from('finance_installments')
      .select('id, installment_no, amount, paid_amount, is_paid, status')
      .eq('student_id', student_id);

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    // 2. Silinecek taksitleri belirle
    const toDeleteIds: string[] = [];
    const toKeepCount = { paid: 0, pending: 0 };

    for (const inst of allInstallments || []) {
      const amount = Number(inst.amount) || 0;
      const paidAmount = Number(inst.paid_amount) || 0;

      // Silme kriterleri:
      // 1. Tutar ₺0 olan
      // 2. Hiç ödeme yapılmamış (paid_amount = 0) VE "Ödendi" olarak işaretlenmiş (hatalı veri)
      if (amount === 0 || (paidAmount === 0 && inst.is_paid === true)) {
        toDeleteIds.push(inst.id);
      } else if (paidAmount > 0 || inst.is_paid) {
        toKeepCount.paid++;
      } else {
        toKeepCount.pending++;
      }
    }

    // 3. Gereksiz taksitleri sil
    let deletedCount = 0;
    if (toDeleteIds.length > 0) {
      const { error: delError } = await supabase
        .from('finance_installments')
        .delete()
        .in('id', toDeleteIds);

      if (delError) {
        return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
      }
      deletedCount = toDeleteIds.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: deletedCount,
        kept: {
          paid: toKeepCount.paid,
          pending: toKeepCount.pending,
          total: toKeepCount.paid + toKeepCount.pending,
        },
        message: `${deletedCount} gereksiz taksit silindi. ${toKeepCount.paid + toKeepCount.pending} taksit korundu.`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE /api/installments/cleanup?student_id=xxx
// Alternatif: Tüm ödenmemiş taksitleri sil (sıfırdan başlamak için)
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const student_id = url.searchParams.get('student_id');

    if (!student_id) {
      return NextResponse.json({ success: false, error: 'student_id gerekli' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Sadece ödenmemiş (is_paid = false VEYA paid_amount = 0) taksitleri sil
    const { data: deleted, error } = await supabase
      .from('finance_installments')
      .delete()
      .eq('student_id', student_id)
      .or('is_paid.eq.false,paid_amount.eq.0')
      .select('id');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: deleted?.length || 0,
        message: `${deleted?.length || 0} taksit silindi.`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}



