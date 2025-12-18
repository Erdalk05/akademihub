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
 * academic_year_id (UUID) kullanarak güncelleme yapar
 */
export async function POST(request: NextRequest) {
  try {
    const { sourceYear = '2024-2025', targetYear = '2025-2026' } = await request.json().catch(() => ({}));

    // 1. Hedef yılın ID'sini bul
    const { data: targetYearData, error: targetYearError } = await supabaseAdmin
      .from('academic_years')
      .select('id, name')
      .eq('name', targetYear)
      .single();

    if (targetYearError || !targetYearData) {
      // Hedef yıl yoksa oluştur
      const { data: newYear, error: createError } = await supabaseAdmin
        .from('academic_years')
        .insert({
          name: targetYear,
          display_name: `Eğitim Öğretim Yılı ${targetYear}`,
          start_date: `${targetYear.split('-')[0]}-09-01`,
          end_date: `${targetYear.split('-')[1]}-08-31`,
          is_active: true,
          is_current: true,
          is_closed: false
        })
        .select()
        .single();
      
      if (createError) {
        console.log('Year create warning:', createError.message);
      }
    }

    // 2. Kaynak yılın ID'sini bul
    const { data: sourceYearData } = await supabaseAdmin
      .from('academic_years')
      .select('id')
      .eq('name', sourceYear)
      .single();

    const sourceYearId = sourceYearData?.id;

    // 3. Hedef yılın ID'sini tekrar al
    const { data: finalTargetYear } = await supabaseAdmin
      .from('academic_years')
      .select('id')
      .eq('name', targetYear)
      .single();

    const targetYearId = finalTargetYear?.id;

    if (!targetYearId) {
      throw new Error('Hedef akademik yıl bulunamadı veya oluşturulamadı');
    }

    // 4. academic_years tablosunda aktif yılı güncelle
    await supabaseAdmin
      .from('academic_years')
      .update({ is_active: false, is_current: false })
      .eq('name', sourceYear);

    await supabaseAdmin
      .from('academic_years')
      .update({ is_active: true, is_current: true })
      .eq('name', targetYear);

    // 5. Öğrencilerin academic_year_id'sini güncelle
    let studentsUpdated = 0;
    
    if (sourceYearId) {
      // Kaynak yıldaki öğrencileri hedef yıla taşı
      const { data, error } = await supabaseAdmin
        .from('students')
        .update({ academic_year_id: targetYearId })
        .eq('academic_year_id', sourceYearId)
        .select('id');
      
      if (!error) studentsUpdated = data?.length || 0;
    }
    
    // NULL olanları da güncelle
    const { data: nullStudents, error: nullError } = await supabaseAdmin
      .from('students')
      .update({ academic_year_id: targetYearId })
      .is('academic_year_id', null)
      .select('id');
    
    if (!nullError) studentsUpdated += nullStudents?.length || 0;

    // 6. Taksitlerin academic_year_id'sini güncelle
    let installmentsUpdated = 0;
    
    if (sourceYearId) {
      const { data, error } = await supabaseAdmin
        .from('finance_installments')
        .update({ academic_year_id: targetYearId })
        .eq('academic_year_id', sourceYearId)
        .select('id');
      
      if (!error) installmentsUpdated = data?.length || 0;
    }
    
    const { data: nullInstallments, error: nullInstError } = await supabaseAdmin
      .from('finance_installments')
      .update({ academic_year_id: targetYearId })
      .is('academic_year_id', null)
      .select('id');
    
    if (!nullInstError) installmentsUpdated += nullInstallments?.length || 0;

    return NextResponse.json({
      success: true,
      message: `Akademik yıl ${sourceYear} → ${targetYear} olarak güncellendi`,
      details: {
        studentsUpdated,
        installmentsUpdated,
        activeYear: targetYear,
        targetYearId
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
