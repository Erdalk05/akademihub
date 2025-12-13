import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/installments/bulk-postpone
 * Toplu taksit öteleme - Seçilen taksitlerin vadelerini belirtilen gün kadar öteler
 * 
 * Body:
 * {
 *   installment_ids: string[],   // Ötelenecek taksit ID'leri
 *   days: number,                // Kaç gün ötelenecek
 *   reason?: string              // Öteleme nedeni (opsiyonel)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { installment_ids, days, reason } = body;

    // Validasyon
    if (!installment_ids || !Array.isArray(installment_ids) || installment_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ötelenecek taksit seçilmedi' },
        { status: 400 }
      );
    }

    if (!days || typeof days !== 'number' || days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz gün sayısı (1-365 arası olmalı)' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Mevcut taksitleri çek
    const { data: installments, error: fetchError } = await supabase
      .from('finance_installments')
      .select('id, due_date, is_paid, status')
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

    // Ödenmiş veya iptal edilmiş taksitleri filtrele
    const postponableInstallments = installments.filter(
      (i) => !i.is_paid && i.status !== 'cancelled'
    );

    if (postponableInstallments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ötelenebilecek taksit bulunamadı (ödenmiş veya iptal edilmiş olabilir)' },
        { status: 400 }
      );
    }

    // Her taksiti öteleyeceğiz
    const updates = postponableInstallments.map((inst) => {
      const currentDueDate = new Date(inst.due_date);
      currentDueDate.setDate(currentDueDate.getDate() + days);
      
      return {
        id: inst.id,
        due_date: currentDueDate.toISOString().split('T')[0], // YYYY-MM-DD
        postpone_reason: reason || null,
        postponed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // Toplu güncelleme
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('finance_installments')
        .update({
          due_date: update.due_date,
          postpone_reason: update.postpone_reason,
          postponed_at: update.postponed_at,
          updated_at: update.updated_at,
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Taksit ${update.id} öteleme hatası:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    // Aktivite logu ekle
    const logEntry = {
      action: 'bulk_postpone',
      entity_type: 'installment',
      details: {
        installment_count: successCount,
        days_postponed: days,
        reason: reason || null,
        installment_ids: postponableInstallments.map(i => i.id),
      },
      created_at: new Date().toISOString(),
    };

    await supabase.from('activity_logs').insert(logEntry).catch(() => {
      // Log hatası kritik değil
    });

    return NextResponse.json({
      success: true,
      message: `${successCount} taksit ${days} gün ötelendi`,
      data: {
        postponed_count: successCount,
        error_count: errorCount,
        days: days,
      },
    });

  } catch (error: any) {
    console.error('Toplu taksit öteleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

