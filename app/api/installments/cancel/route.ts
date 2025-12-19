import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/installments/cancel
 * Taksit iptali - Tek veya çoklu taksit iptal eder
 * 
 * Body:
 * {
 *   installment_ids: string[],   // İptal edilecek taksit ID'leri
 *   reason: string,              // İptal nedeni (zorunlu)
 *   refund_amount?: number       // Geri iade tutarı (opsiyonel)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { installment_ids, reason, refund_amount } = body;

    // Validasyon
    if (!installment_ids || !Array.isArray(installment_ids) || installment_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'İptal edilecek taksit seçilmedi' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'İptal nedeni zorunludur (en az 3 karakter)' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Mevcut taksitleri çek
    const { data: installments, error: fetchError } = await supabase
      .from('finance_installments')
      .select('id, student_id, amount, paid_amount, is_paid, status')
      .in('id', installment_ids);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!installments || installments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Seçilen taksitler bulunamadı' },
        { status: 404 }
      );
    }

    // Zaten iptal edilmiş taksitleri filtrele
    const cancellableInstallments = installments.filter(
      (i) => i.status !== 'cancelled'
    );

    if (cancellableInstallments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'İptal edilebilecek taksit bulunamadı (zaten iptal edilmiş olabilir)' },
        { status: 400 }
      );
    }

    // Geri iade hesaplama
    let totalRefund = 0;
    const refundDetails: any[] = [];

    for (const inst of cancellableInstallments) {
      const paidAmount = inst.paid_amount || 0;
      
      if (paidAmount > 0) {
        totalRefund += paidAmount;
        refundDetails.push({
          installment_id: inst.id,
          student_id: inst.student_id,
          refund_amount: paidAmount,
        });
      }
    }

    // Taksitleri iptal et
    const now = new Date().toISOString();
    let successCount = 0;
    let errorCount = 0;

    for (const inst of cancellableInstallments) {
      const { error: updateError } = await supabase
        .from('finance_installments')
        .update({
          status: 'cancelled',
          cancel_reason: reason.trim(),
          cancelled_at: now,
          updated_at: now,
          // İptal edildiğinde ödenmiş tutarı koruyoruz (geri iade takibi için)
        })
        .eq('id', inst.id);

      if (updateError) {
        console.error(`Taksit ${inst.id} iptal hatası:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    // Geri iade kaydı oluştur (eğer iade varsa)
    if (totalRefund > 0 && refundDetails.length > 0) {
      const refundRecord = {
        type: 'refund',
        amount: refund_amount || totalRefund,
        description: `Taksit iptali - ${reason}`,
        category: 'İade',
        refund_details: refundDetails,
        created_at: now,
      };

      // other_income tablosuna negatif kayıt veya ayrı refunds tablosuna
      try {
        await supabase.from('finance_refunds').insert(refundRecord);
      } catch { /* Tablo yoksa oluşturulmamış olabilir - kritik değil */ }
    }

    // Aktivite logu
    const logEntry = {
      action: 'installment_cancel',
      entity_type: 'installment',
      details: {
        cancelled_count: successCount,
        reason: reason,
        total_refund: totalRefund,
        installment_ids: cancellableInstallments.map(i => i.id),
      },
      created_at: now,
    };

    try {
      await supabase.from('activity_logs').insert(logEntry);
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      message: `${successCount} taksit iptal edildi`,
      data: {
        cancelled_count: successCount,
        error_count: errorCount,
        total_refund: totalRefund,
        refund_details: refundDetails,
      },
    });

  } catch (error: any) {
    console.error('Taksit iptal hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

