import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// GET /api/finance/dashboard
// Finans özet sayfası için tüm verileri tek seferde döner - OPTIMIZED
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('organization_id');
    
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Parallel queries for speed
    const [installmentsRes, expensesRes, studentsRes] = await Promise.all([
      // Taksitler - sadece gerekli alanlar
      supabase
        .from('finance_installments')
        .select('amount, is_paid, due_date, paid_at')
        .order('due_date', { ascending: false }),
      
      // Giderler - sadece gerekli alanlar
      supabase
        .from('finance_expenses')
        .select('amount, date'),
      
      // Öğrenci sayısı - sadece count
      supabase
        .from('students')
        .select('id, class', { count: 'exact', head: false })
        .eq('status', 'active')
    ]);

    const installments = installmentsRes.data || [];
    const expenses = expensesRes.data || [];
    const students = studentsRes.data || [];
    const studentCount = studentsRes.count || students.length;

    // Tek döngüde tüm hesaplamaları yap
    let totalIncome = 0;
    let totalInstallments = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let thisMonthIncome = 0;

    for (const inst of installments as any[]) {
      const amount = Number(inst.amount) || 0;
      totalInstallments += amount;
      
      if (inst.is_paid) {
        totalIncome += amount;
        paidCount++;
        if (inst.paid_at?.startsWith(thisMonth)) {
          thisMonthIncome += amount;
        }
      } else {
        pendingCount++;
        if (inst.due_date && inst.due_date < today) {
          overdueCount++;
        }
      }
    }

    // Gider hesaplaması
    let totalExpense = 0;
    let thisMonthExpense = 0;
    for (const exp of expenses as any[]) {
      const amount = Number(exp.amount) || 0;
      totalExpense += amount;
      if (exp.date?.startsWith(thisMonth)) {
        thisMonthExpense += amount;
      }
    }

    // Sınıf bazında ortalama ücret hesapla
    const classMap = new Map<string, { students: Set<string>; totalAmount: number }>();
    
    // Önce öğrencileri sınıflara ayır
    const studentClassMap = new Map<string, string>();
    for (const student of students as any[]) {
      studentClassMap.set(student.id, student.class || 'Belirsiz');
    }

    // Şimdi taksitleri al ve sınıf bazında grupla (ayrı sorgu gerekli)
    const { data: installmentsWithStudent } = await supabase
      .from('finance_installments')
      .select('student_id, amount');

    for (const inst of (installmentsWithStudent || []) as any[]) {
      const studentClass = studentClassMap.get(inst.student_id);
      if (!studentClass) continue;

      if (!classMap.has(studentClass)) {
        classMap.set(studentClass, { students: new Set(), totalAmount: 0 });
      }
      const classInfo = classMap.get(studentClass)!;
      classInfo.students.add(inst.student_id);
      classInfo.totalAmount += Number(inst.amount) || 0;
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
        if (!isNaN(aNum)) return -1;
        if (!isNaN(bNum)) return 1;
        return a.class.localeCompare(b.class);
      });

    const payload = {
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        collectionRate: totalInstallments > 0 ? (totalIncome / totalInstallments) * 100 : 0,
        totalStudents: studentCount,
        overdueCount,
        paidCount,
        pendingCount,
        thisMonthIncome,
        thisMonthExpense
      },
      classData
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      { success: true, data: payload },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
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
