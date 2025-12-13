import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Gecikme cezası/faiz hesaplama ayarları
 */
interface PenaltySettings {
  enabled: boolean;
  type: 'fixed' | 'percentage' | 'daily_percentage';
  fixed_amount: number;        // Sabit tutar (TL)
  percentage: number;          // Yüzde (%)
  daily_rate: number;          // Günlük oran (%)
  grace_period_days: number;   // Tolerans süresi (gün)
  max_penalty_percentage: number; // Maksimum ceza oranı (%)
}

// Varsayılan ceza ayarları
const DEFAULT_PENALTY_SETTINGS: PenaltySettings = {
  enabled: true,
  type: 'daily_percentage',
  fixed_amount: 50,           // 50 TL sabit
  percentage: 5,              // %5 toplam
  daily_rate: 0.1,            // Günlük %0.1
  grace_period_days: 3,       // 3 gün tolerans
  max_penalty_percentage: 20, // Maksimum %20
};

/**
 * GET /api/installments/calculate-penalty
 * Gecikmiş taksitler için ceza/faiz hesapla
 * 
 * Query params:
 * - student_id?: string        // Belirli öğrenci için
 * - installment_id?: string    // Belirli taksit için
 * - apply?: boolean            // true ise cezayı uygula
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');
    const installmentId = searchParams.get('installment_id');
    const applyPenalty = searchParams.get('apply') === 'true';

    const supabase = getServiceRoleClient();

    // Ceza ayarlarını çek (settings tablosundan veya varsayılan)
    let penaltySettings = DEFAULT_PENALTY_SETTINGS;
    
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'penalty_settings')
      .single();

    if (settingsData?.value) {
      penaltySettings = { ...DEFAULT_PENALTY_SETTINGS, ...settingsData.value };
    }

    if (!penaltySettings.enabled) {
      return NextResponse.json({
        success: true,
        message: 'Gecikme cezası sistemi devre dışı',
        data: { penalties: [], total_penalty: 0 },
      });
    }

    // Gecikmiş taksitleri çek
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from('finance_installments')
      .select('id, student_id, amount, paid_amount, due_date, is_paid, status, penalty_amount')
      .eq('is_paid', false)
      .neq('status', 'cancelled')
      .lt('due_date', today.toISOString());

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (installmentId) {
      query = query.eq('id', installmentId);
    }

    const { data: overdueInstallments, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!overdueInstallments || overdueInstallments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Gecikmiş taksit bulunamadı',
        data: { penalties: [], total_penalty: 0 },
      });
    }

    // Her taksit için ceza hesapla
    const penalties: any[] = [];
    let totalPenalty = 0;

    for (const inst of overdueInstallments) {
      const dueDate = new Date(inst.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Tolerans süresi kontrolü
      if (daysOverdue <= penaltySettings.grace_period_days) {
        continue;
      }

      const effectiveDaysOverdue = daysOverdue - penaltySettings.grace_period_days;
      const remainingAmount = (inst.amount || 0) - (inst.paid_amount || 0);
      
      let penaltyAmount = 0;

      switch (penaltySettings.type) {
        case 'fixed':
          penaltyAmount = penaltySettings.fixed_amount;
          break;
        case 'percentage':
          penaltyAmount = remainingAmount * (penaltySettings.percentage / 100);
          break;
        case 'daily_percentage':
          penaltyAmount = remainingAmount * (penaltySettings.daily_rate / 100) * effectiveDaysOverdue;
          break;
      }

      // Maksimum ceza kontrolü
      const maxPenalty = remainingAmount * (penaltySettings.max_penalty_percentage / 100);
      penaltyAmount = Math.min(penaltyAmount, maxPenalty);

      // Yuvarla
      penaltyAmount = Math.round(penaltyAmount * 100) / 100;

      penalties.push({
        installment_id: inst.id,
        student_id: inst.student_id,
        original_amount: inst.amount,
        remaining_amount: remainingAmount,
        due_date: inst.due_date,
        days_overdue: daysOverdue,
        effective_days: effectiveDaysOverdue,
        penalty_amount: penaltyAmount,
        existing_penalty: inst.penalty_amount || 0,
        total_with_penalty: remainingAmount + penaltyAmount,
      });

      totalPenalty += penaltyAmount;
    }

    // Cezayı uygula (isteğe bağlı)
    if (applyPenalty && penalties.length > 0) {
      for (const penalty of penalties) {
        await supabase
          .from('finance_installments')
          .update({
            penalty_amount: penalty.penalty_amount,
            penalty_calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', penalty.installment_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: applyPenalty 
        ? `${penalties.length} taksit için ceza uygulandı` 
        : `${penalties.length} gecikmiş taksit için ceza hesaplandı`,
      data: {
        penalties,
        total_penalty: Math.round(totalPenalty * 100) / 100,
        settings: penaltySettings,
        applied: applyPenalty,
      },
    });

  } catch (error: any) {
    console.error('Ceza hesaplama hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/installments/calculate-penalty
 * Ceza ayarlarını güncelle
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Ayarlar gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Ayarları kaydet
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'penalty_settings',
        value: settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gecikme cezası ayarları güncellendi',
      data: settings,
    });

  } catch (error: any) {
    console.error('Ceza ayarları güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

