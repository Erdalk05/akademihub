import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/migration/execute
 * Geçmiş yıldan yeni yıla veri aktarımı yapar
 * 
 * Body: { sourceYear, targetYear, organizationId }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();
    const { sourceYear, targetYear, organizationId } = body;

    if (!sourceYear || !targetYear) {
      return NextResponse.json(
        { success: false, error: 'sourceYear ve targetYear parametreleri gerekli' },
        { status: 400 }
      );
    }

    if (sourceYear === targetYear) {
      return NextResponse.json(
        { success: false, error: 'Kaynak ve hedef yıl aynı olamaz' },
        { status: 400 }
      );
    }

    console.log(`[Migration] ${sourceYear} → ${targetYear} aktarımı başlıyor...`);
    console.log(`[Migration] Organization: ${organizationId || 'ALL'}`);

    // 1. Kaynak yıldaki öğrencileri bul
    let studentsQuery = supabase
      .from('students')
      .select('id, first_name, last_name, class')
      .eq('academic_year', sourceYear)
      .neq('status', 'deleted');
    
    if (organizationId) {
      studentsQuery = studentsQuery.eq('organization_id', organizationId);
    }

    const { data: students, error: fetchError } = await studentsQuery;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          studentsUpdated: 0,
          installmentsUpdated: 0,
          message: 'Aktarılacak öğrenci bulunamadı'
        }
      });
    }

    const studentIds = students.map(s => s.id);
    console.log(`[Migration] ${students.length} öğrenci bulundu`);

    // 2. Öğrencilerin academic_year'ını güncelle
    let updateQuery = supabase
      .from('students')
      .update({ 
        academic_year: targetYear,
        updated_at: new Date().toISOString()
      })
      .eq('academic_year', sourceYear)
      .neq('status', 'deleted');
    
    if (organizationId) {
      updateQuery = updateQuery.eq('organization_id', organizationId);
    }

    const { error: updateError, count: updatedCount } = await updateQuery;

    if (updateError) {
      throw new Error(`Öğrenci güncelleme hatası: ${updateError.message}`);
    }

    console.log(`[Migration] ${updatedCount || students.length} öğrenci güncellendi`);

    // 3. Sınıf geçişi (opsiyonel - bir üst sınıfa geçir)
    // Bu kısım şimdilik devre dışı - istenirse aktif edilebilir
    /*
    for (const student of students) {
      const currentClass = parseInt(student.class) || 1;
      const newClass = Math.min(currentClass + 1, 12).toString();
      
      await supabase
        .from('students')
        .update({ class: newClass })
        .eq('id', student.id);
    }
    */

    // 4. Log kaydı oluştur
    try {
      await supabase
        .from('activity_logs')
        .insert({
          action: 'data_migration',
          details: {
            sourceYear,
            targetYear,
            studentsCount: students.length,
            organizationId
          },
          created_at: new Date().toISOString()
        });
    } catch (e) {
      console.warn('[Migration] Log kaydı oluşturulamadı:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        studentsUpdated: updatedCount || students.length,
        installmentsUpdated: 0, // Taksitler otomatik öğrenci ile birlikte gelir
        message: `${students.length} öğrenci ${targetYear} yılına aktarıldı`
      }
    });

  } catch (error: any) {
    console.error('[Migration Execute Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Aktarım hatası' },
      { status: 500 }
    );
  }
}
