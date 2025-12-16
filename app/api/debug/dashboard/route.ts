import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEBUG API - Dashboard verilerini kontrol et
 * GET /api/debug/dashboard?organization_id=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organization_id');

    // 1. Tüm öğrencileri say
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, status, total_amount, paid_amount, organization_id')
      .neq('status', 'deleted');

    // 2. Tüm taksitleri say
    const { data: allInstallments, error: installmentsError } = await supabase
      .from('finance_installments')
      .select('id, student_id, amount, paid_amount, is_paid, organization_id');

    // 3. Tüm diğer gelirleri say
    const { data: allOtherIncome, error: otherIncomeError } = await supabase
      .from('other_income')
      .select('id, amount, paid_amount, is_paid, organization_id');

    // 4. Tüm organizasyonları listele
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name');

    // Filtrelenmiş veriler (organization_id varsa)
    let filteredStudents = allStudents || [];
    let filteredInstallments = allInstallments || [];
    let filteredOtherIncome = allOtherIncome || [];

    if (organizationId) {
      filteredStudents = (allStudents || []).filter(s => s.organization_id === organizationId);
      filteredInstallments = (allInstallments || []).filter(i => i.organization_id === organizationId);
      filteredOtherIncome = (allOtherIncome || []).filter(o => o.organization_id === organizationId);
    }

    // Hesaplamalar
    const studentIds = new Set(filteredStudents.map(s => s.id));
    const studentInstallments = filteredInstallments.filter(i => studentIds.has(i.student_id));

    const totalContract = studentInstallments.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalRevenue = studentInstallments.filter(i => i.is_paid).reduce((sum, i) => sum + (i.paid_amount || i.amount || 0), 0);
    const totalStudentAmount = filteredStudents.reduce((sum, s) => sum + (s.total_amount || 0), 0);

    const otherIncomeTotal = filteredOtherIncome.reduce((sum, o) => sum + (o.amount || 0), 0);
    const otherIncomePaid = filteredOtherIncome.reduce((sum, o) => sum + (o.paid_amount || 0), 0);

    return NextResponse.json({
      success: true,
      debug: {
        requestedOrgId: organizationId || 'ALL',
        timestamp: new Date().toISOString(),
      },
      organizations: organizations || [],
      counts: {
        allStudents: (allStudents || []).length,
        allInstallments: (allInstallments || []).length,
        allOtherIncome: (allOtherIncome || []).length,
        filteredStudents: filteredStudents.length,
        filteredInstallments: filteredInstallments.length,
        filteredOtherIncome: filteredOtherIncome.length,
        studentInstallments: studentInstallments.length,
      },
      calculations: {
        // Eğitim (finance_installments'tan)
        totalContract_fromInstallments: totalContract,
        totalRevenue_fromInstallments: totalRevenue,
        // Eğitim (students tablosundan)
        totalAmount_fromStudents: totalStudentAmount,
        // Satışlar (other_income'dan)
        otherIncomeTotal: otherIncomeTotal,
        otherIncomePaid: otherIncomePaid,
      },
      sampleData: {
        students: filteredStudents.slice(0, 5).map(s => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          total_amount: s.total_amount,
          organization_id: s.organization_id,
        })),
        installments: studentInstallments.slice(0, 5).map(i => ({
          id: i.id,
          student_id: i.student_id,
          amount: i.amount,
          is_paid: i.is_paid,
          organization_id: i.organization_id,
        })),
        otherIncome: filteredOtherIncome.slice(0, 5).map(o => ({
          id: o.id,
          amount: o.amount,
          paid_amount: o.paid_amount,
          organization_id: o.organization_id,
        })),
      },
      errors: {
        students: studentsError?.message || null,
        installments: installmentsError?.message || null,
        otherIncome: otherIncomeError?.message || null,
        organizations: orgsError?.message || null,
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
