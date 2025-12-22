import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// GET /api/finance/dashboard
// SQL agregasyonu ile SÜPER HIZLI finans özeti
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('organization_id');
    
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);

    // TEK PARALEL SORGU SETİ - Minimum veri transferi
    const [
      summaryRes,
      expenseSummaryRes,
      studentCountRes,
      classDataRes
    ] = await Promise.all([
      // 1. Taksit özeti - SQL agregasyonu
      supabase.rpc('get_installment_summary', { 
        p_today: today,
        p_this_month: thisMonth
      }).maybeSingle(),
      
      // 2. Gider özeti - SQL agregasyonu
      supabase.rpc('get_expense_summary', {
        p_this_month: thisMonth
      }).maybeSingle(),
      
      // 3. Aktif öğrenci sayısı - sadece count
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // 4. Sınıf bazında veriler - SQL agregasyonu
      supabase.rpc('get_class_finance_data')
    ]);

    // Fallback: RPC yoksa eski yöntemi kullan
    if (summaryRes.error?.code === '42883' || expenseSummaryRes.error?.code === '42883') {
      return await fallbackMethod(supabase, today, thisMonth, startTime);
    }

    const installmentSummary = summaryRes.data || {
      total_income: 0,
      total_amount: 0,
      paid_count: 0,
      pending_count: 0,
      overdue_count: 0,
      this_month_income: 0
    };

    const expenseSummary = expenseSummaryRes.data || {
      total_expense: 0,
      this_month_expense: 0
    };

    const studentCount = studentCountRes.count || 0;
    const classData = (classDataRes.data || []).map((row: any) => ({
      class: row.class_name,
      averageFee: Math.round(row.average_fee || 0),
      studentCount: row.student_count || 0,
      totalAmount: row.total_amount || 0
    }));

    const totalIncome = Number(installmentSummary.total_income) || 0;
    const totalAmount = Number(installmentSummary.total_amount) || 0;
    const totalExpense = Number(expenseSummary.total_expense) || 0;

    const payload = {
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        collectionRate: totalAmount > 0 ? (totalIncome / totalAmount) * 100 : 0,
        totalStudents: studentCount,
        overdueCount: installmentSummary.overdue_count || 0,
        paidCount: installmentSummary.paid_count || 0,
        pendingCount: installmentSummary.pending_count || 0,
        thisMonthIncome: Number(installmentSummary.this_month_income) || 0,
        thisMonthExpense: Number(expenseSummary.this_month_expense) || 0
      },
      classData
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      { success: true, data: payload },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
          'X-Response-Time': `${responseTime}ms`
        }
      }
    );
  } catch (e: any) {
    console.error('Finance dashboard error:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Fallback: RPC fonksiyonları yoksa bu metodu kullan
async function fallbackMethod(supabase: any, today: string, thisMonth: string, startTime: number) {
  // Minimal veri çekimi - sadece gerekli alanlar
  const [installmentsRes, expensesRes, studentsRes] = await Promise.all([
    supabase
      .from('finance_installments')
      .select('student_id, amount, is_paid, due_date, paid_at'),
    supabase
      .from('expenses')
      .select('amount, date'),
    supabase
      .from('students')
      .select('id, class')
      .eq('status', 'active')
  ]);

  const installments = installmentsRes.data || [];
  const expenses = expensesRes.data || [];
  const students = studentsRes.data || [];

  // Tek döngüde tüm hesaplamalar
  let totalIncome = 0, totalInstallments = 0, overdueCount = 0, paidCount = 0, pendingCount = 0, thisMonthIncome = 0;
  const classMap = new Map<string, { students: Set<string>; totalAmount: number }>();
  const studentClassMap = new Map<string, string>();

  for (const s of students) {
    studentClassMap.set(s.id, s.class || 'Belirsiz');
  }

  for (const inst of installments) {
    const amount = Number(inst.amount) || 0;
    totalInstallments += amount;
    
    if (inst.is_paid) {
      totalIncome += amount;
      paidCount++;
      if (inst.paid_at?.startsWith(thisMonth)) thisMonthIncome += amount;
    } else {
      pendingCount++;
      if (inst.due_date && inst.due_date < today) overdueCount++;
    }

    // Sınıf bazında gruplama
    const studentClass = studentClassMap.get(inst.student_id);
    if (studentClass) {
      if (!classMap.has(studentClass)) {
        classMap.set(studentClass, { students: new Set(), totalAmount: 0 });
      }
      const info = classMap.get(studentClass)!;
      info.students.add(inst.student_id);
      info.totalAmount += amount;
    }
  }

  let totalExpense = 0, thisMonthExpense = 0;
  for (const exp of expenses) {
    const amount = Number(exp.amount) || 0;
    totalExpense += amount;
    if (exp.date?.startsWith(thisMonth)) thisMonthExpense += amount;
  }

  const classData = Array.from(classMap.entries())
    .map(([className, info]) => ({
      class: className,
      averageFee: info.students.size > 0 ? Math.round(info.totalAmount / info.students.size) : 0,
      studentCount: info.students.size,
      totalAmount: info.totalAmount
    }))
    .filter(d => d.averageFee > 0)
    .sort((a, b) => {
      const aNum = parseInt(a.class);
      const bNum = parseInt(b.class);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.class.localeCompare(b.class);
    });

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    { 
      success: true, 
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
          collectionRate: totalInstallments > 0 ? (totalIncome / totalInstallments) * 100 : 0,
          totalStudents: students.length,
          overdueCount,
          paidCount,
          pendingCount,
          thisMonthIncome,
          thisMonthExpense
        },
        classData
      }
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        'X-Response-Time': `${responseTime}ms`,
        'X-Method': 'fallback'
      }
    }
  );
}
