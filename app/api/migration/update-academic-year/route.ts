import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client - RLS bypass
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * POST /api/migration/update-academic-year
 * Tüm 2024-2025 kayıtlarını 2025-2026 olarak günceller
 */
export async function POST(request: NextRequest) {
  try {
    const { sourceYear = '2024-2025', targetYear = '2025-2026' } = await request.json().catch(() => ({}));

    // 1. academic_years tablosunda aktif yılı güncelle
    // Önce eski yılı pasif yap
    await supabaseAdmin
      .from('academic_years')
      .update({ is_active: false, is_current: false })
      .eq('name', sourceYear);

    // Yeni yılı aktif yap
    const { error: yearError } = await supabaseAdmin
      .from('academic_years')
      .update({ is_active: true, is_current: true })
      .eq('name', targetYear);

    if (yearError) {
      console.log('Academic year update warning:', yearError.message);
    }

    // 2. Öğrencilerin academic_year alanını güncelle
    const { data: studentsUpdated, error: studentsError } = await supabaseAdmin
      .from('students')
      .update({ academic_year: targetYear })
      .or(`academic_year.eq.${sourceYear},academic_year.is.null`)
      .select('id');

    if (studentsError) {
      throw new Error(`Öğrenci güncellemesi başarısız: ${studentsError.message}`);
    }

    // 3. Taksitlerin academic_year alanını güncelle
    const { data: installmentsUpdated, error: installmentsError } = await supabaseAdmin
      .from('finance_installments')
      .update({ academic_year: targetYear })
      .or(`academic_year.eq.${sourceYear},academic_year.is.null`)
      .select('id');

    if (installmentsError) {
      console.log('Installment update warning:', installmentsError.message);
    }

    // 4. Sonuç bilgisi
    const studentCount = studentsUpdated?.length || 0;
    const installmentCount = installmentsUpdated?.length || 0;

    return NextResponse.json({
      success: true,
      message: `Akademik yıl ${sourceYear} → ${targetYear} olarak güncellendi`,
      details: {
        studentsUpdated: studentCount,
        installmentsUpdated: installmentCount,
        activeYear: targetYear
      }
    });

  } catch (error: any) {
    console.error('Academic year migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migration/update-academic-year
 * Mevcut akademik yıl durumunu gösterir
 */
export async function GET() {
  try {
    // Aktif akademik yılı getir
    const { data: activeYear } = await supabaseAdmin
      .from('academic_years')
      .select('*')
      .eq('is_active', true)
      .single();

    // Yıllara göre öğrenci sayıları
    const { data: studentCounts } = await supabaseAdmin
      .from('students')
      .select('academic_year')
      .not('academic_year', 'is', null);

    // Sayıları grupla
    const yearCounts: Record<string, number> = {};
    studentCounts?.forEach(s => {
      const year = s.academic_year || 'belirsiz';
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    return NextResponse.json({
      activeYear: activeYear?.name || 'Belirlenmemiş',
      studentsByYear: yearCounts
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
