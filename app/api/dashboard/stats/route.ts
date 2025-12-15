import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: Mevcut akademik yılı hesapla
function getCurrentAcademicYear() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/**
 * Akademik yılın başlangıç ve bitiş tarihlerini hesapla
 * Örn: "2024-2025" → { start: "2024-09-01", end: "2025-08-31" }
 */
function getAcademicYearDates(academicYear: string) {
  const [startYear, endYear] = academicYear.split('-').map(Number);
  
  // Akademik yıl: Eylül 1 - Ağustos 31
  const start = new Date(startYear, 8, 1, 0, 0, 0); // Eylül 1
  const end = new Date(endYear, 7, 31, 23, 59, 59); // Ağustos 31
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

/**
 * GET /api/dashboard/stats
 * Tüm dashboard verilerini tek seferde döndürür
 * PERFORMANS OPTIMIZATION: Paralel fetch + cache
 * 
 * Query Params:
 * - academicYear: "2024-2025" formatında akademik yıl
 * - organization_id: Kurum ID (çoklu kurum desteği)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organization_id');
    
    // Akademik yıl parametresi
    const academicYear = searchParams.get('academicYear') || getCurrentAcademicYear();
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    // Organization filtreli sorgular oluştur
    const buildStudentsQuery = (statusFilter: 'active' | 'deleted' | 'all') => {
      let query = supabase.from('students').select('id, created_at, status, academic_year');
      
      if (statusFilter === 'deleted') {
        query = query.eq('status', 'deleted');
      } else if (statusFilter === 'active') {
        // Aktif öğrenciler: status 'active' veya null/boş olanlar (deleted ve inactive hariç)
        query = query.or('status.eq.active,status.is.null');
      }
      // 'all' durumunda filtre yok
      
      if (organizationId) query = query.eq('organization_id', organizationId);
      return query;
    };

    const buildInstallmentsQuery = () => {
      let query = supabase.from('finance_installments').select('*');
      if (organizationId) query = query.eq('organization_id', organizationId);
      return query;
    };

    const buildOtherIncomeQuery = () => {
      let query = supabase.from('other_income').select('amount, paid_amount, is_paid');
      if (organizationId) query = query.eq('organization_id', organizationId);
      return query;
    };

    const buildExpensesQuery = () => {
      let query = supabase.from('expenses').select('amount');
      if (organizationId) query = query.eq('organization_id', organizationId);
      return query;
    };

    // PARALEL FETCH (Hız x5!)
    // Sadece aktif öğrencileri getir (deleted olanları hariç tut)
    const [
      studentsResult,
      deletedStudentsResult,
      installmentsResult,
      otherIncomeResult,
      expensesResult
    ] = await Promise.all([
      buildStudentsQuery('active'),
      buildStudentsQuery('deleted'),
      buildInstallmentsQuery(),
      buildOtherIncomeQuery(),
      buildExpensesQuery()
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (installmentsResult.error) throw installmentsResult.error;

    // TÜM AKTİF öğrenciler (deleted olmayanlar)
    // Öğrenci listesi sayfasıyla uyumlu: Tüm aktif öğrencileri al (academic_year filtresi yok)
    const students = studentsResult.data || [];
    
    const allInstallments = installmentsResult.data || [];
    
    // Debug log
    console.log(`Dashboard Stats: academicYear=${academicYear}, totalStudents=${allStudents.length}, filteredStudents=${students.length}`);
    
    // Kaydı silinen öğrenciler
    const deletedStudents = deletedStudentsResult.data?.length || 0;
    
    // Diğer gelirler toplamı (ödenen tutarlar)
    const otherIncomeData = otherIncomeResult.data || [];
    const otherIncomeTotal = otherIncomeData.reduce((sum, item) => sum + (item.paid_amount || 0), 0);
    const otherIncomePending = otherIncomeData.reduce((sum, item) => {
      const remaining = (item.amount || 0) - (item.paid_amount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);
    
    // Toplam giderler
    const totalExpenses = (expensesResult.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Tüm öğrencilerin ID'lerini al
    const studentIds = new Set(students.map(s => s.id));
    
    // Taksitleri filtrele: sadece aktif öğrencilerin taksitleri
    const installments = allInstallments.filter(inst => studentIds.has(inst.student_id));

    // KPI HESAPLAMALARI (Seçilen yıla ait verilerden)
    const activeStudents = students.length;
    
    // Toplam ödenen tutarı installments'tan hesapla
    const paidInstallments = installments.filter(inst => inst.is_paid);
    const totalRevenue = paidInstallments.reduce((sum, inst) => sum + (inst.paid_amount || inst.amount || 0), 0);
    
    // Toplam sözleşme tutarı
    const totalContract = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
    
    const paymentRate = totalContract > 0 ? ((totalRevenue / totalContract) * 100).toFixed(1) : '0';
    
    // Borçlu öğrenci sayısı (ödenmemiş taksiti olan)
    const unpaidInstallments = installments.filter(inst => !inst.is_paid);
    const debtorStudentIds = new Set(unpaidInstallments.map(inst => inst.student_id));
    const debtorStudents = debtorStudentIds.size;
    
    // Toplam alacak (borç)
    const totalDebt = unpaidInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

    // BUGÜNKÜ TAHSİLAT
    const todayPayments = installments.filter(inst => {
      if (!inst.is_paid || !inst.paid_at) return false;
      return inst.paid_at >= todayStart && inst.paid_at <= todayEnd;
    });
    const todayCollected = todayPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    const todayPaymentCount = todayPayments.length;
    const todayStudentCount = new Set(todayPayments.map(p => p.student_id)).size;
    
    // BU AY TAHSİLAT
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const monthlyPayments = installments.filter(inst => {
      if (!inst.is_paid || !inst.paid_at) return false;
      return inst.paid_at >= monthStart && inst.paid_at <= monthEnd;
    });
    const monthlyCollection = monthlyPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);

    // BEKLEYEN ÖDEMELER
    const overdue = unpaidInstallments.filter(inst => inst.due_date && new Date(inst.due_date) < now);
    const overdueAmount = overdue.reduce((sum, i) => sum + (i.amount || 0), 0);
    const overdueCount = overdue.length;

    // 6 AYLIK FİNANS DATA
    const monthlyData = [];
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const monthPayments = installments.filter(inst => {
        if (!inst.is_paid || !inst.paid_at) return false;
        const paidDate = new Date(inst.paid_at);
        return `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}` === monthKey;
      });
      
      const income = monthPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
      
      monthlyData.push({
        month: monthNames[d.getMonth()],
        income,
        expense: 0, // Placeholder
        net: income
      });
    }

    // RESPONSE
    return NextResponse.json({
      success: true,
      data: {
        academicYear, // Hangi yılın verisi olduğunu belirt
        kpi: {
          activeStudents,
          totalRevenue, // Eğitim ödemeleri - ödenen tutar
          totalContract, // Toplam sözleşme tutarı
          paymentRate: parseFloat(paymentRate),
          debtorStudents,
          totalDebt,
          monthlyCollection,
          deletedStudents,
          overduePayments: overdueCount,
          // Diğer gelirler
          otherIncome: otherIncomeTotal, // Diğer gelirler - tahsil edilen
          otherIncomePending: otherIncomePending, // Diğer gelirler - bekleyen
          // Giderler ve net durum
          totalExpenses,
          // Toplam ciro = Eğitim ödemeleri + Diğer gelirler
          totalCiro: totalRevenue + otherIncomeTotal,
          cashBalance: totalRevenue + otherIncomeTotal - totalExpenses // Net kasa durumu
        },
        todayCollection: {
          totalCollected: todayCollected,
          paymentCount: todayPaymentCount,
          studentCount: todayStudentCount,
          dailyTarget: 16667, // 500K/30
          targetPercentage: (todayCollected / 16667) * 100
        },
        pendingPayments: {
          overdueAmount,
          overdueCount,
          overdueStudents: new Set(overdue.map(i => i.student_id)).size
        },
        monthlyFinance: monthlyData
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

