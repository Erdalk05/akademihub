import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/migration/analyze?sourceYear=2023-2024&organizationId=xxx
 * Kaynak yıldaki verileri analiz eder
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const sourceYear = searchParams.get('sourceYear');
    const organizationId = searchParams.get('organizationId');

    if (!sourceYear) {
      return NextResponse.json(
        { success: false, error: 'sourceYear parametresi gerekli' },
        { status: 400 }
      );
    }

    // Öğrenci sayısı
    let studentsQuery = supabase
      .from('students')
      .select('id', { count: 'exact' })
      .eq('academic_year', sourceYear)
      .neq('status', 'deleted');
    
    if (organizationId) {
      studentsQuery = studentsQuery.eq('organization_id', organizationId);
    }

    const { count: studentsCount, error: studentsError } = await studentsQuery;
    
    if (studentsError) {
      throw new Error(studentsError.message);
    }

    // Taksit sayısı (bu yıldaki öğrencilere ait)
    let installmentsCount = 0;
    if (studentsCount && studentsCount > 0) {
      // Önce bu yıldaki öğrenci ID'lerini al
      let studentIdsQuery = supabase
        .from('students')
        .select('id')
        .eq('academic_year', sourceYear)
        .neq('status', 'deleted');
      
      if (organizationId) {
        studentIdsQuery = studentIdsQuery.eq('organization_id', organizationId);
      }

      const { data: studentIds } = await studentIdsQuery;
      
      if (studentIds && studentIds.length > 0) {
        const ids = studentIds.map(s => s.id);
        const { count } = await supabase
          .from('finance_installments')
          .select('id', { count: 'exact' })
          .in('student_id', ids);
        
        installmentsCount = count || 0;
      }
    }

    // Diğer gelirler (tarih bazlı kontrol)
    // Akademik yıl: Eylül 1 - Ağustos 31
    const [startYear, endYear] = sourceYear.split('-').map(Number);
    const startDate = `${startYear}-09-01`;
    const endDate = `${endYear}-08-31`;

    let otherIncomeQuery = supabase
      .from('other_income')
      .select('id', { count: 'exact' })
      .gte('due_date', startDate)
      .lte('due_date', endDate);
    
    if (organizationId) {
      otherIncomeQuery = otherIncomeQuery.eq('organization_id', organizationId);
    }

    const { count: otherIncomeCount } = await otherIncomeQuery;

    return NextResponse.json({
      success: true,
      data: {
        students: studentsCount || 0,
        installments: installmentsCount,
        otherIncome: otherIncomeCount || 0,
      }
    });

  } catch (error: any) {
    console.error('[Migration Analyze Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analiz hatası' },
      { status: 500 }
    );
  }
}
