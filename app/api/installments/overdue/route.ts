import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// GET /api/installments/overdue
// finance_installments tablosunda:
//  - is_paid = false
//  - due_date < NOW()
// kayıtlarını students tablosu ile join ederek döner.
export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = createRlsServerClient(accessToken);

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    // 1) Gecikmiş ve ödenmemiş taksitler
    const { data: installments, error: instError } = await supabase
      .from('finance_installments')
      .select('id, student_id, amount, due_date, is_paid')
      .eq('is_paid', false)
      .lt('due_date', todayIso);

    if (instError) {
      return NextResponse.json(
        { success: false, error: instError.message },
        { status: 500 },
      );
    }

    const list = installments || [];
    if (list.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    // 2) İlgili öğrencileri çek
    const studentIds = Array.from(new Set(list.map((r: any) => r.student_id).filter(Boolean)));

    const { data: students, error: stuError } = await supabase
      .from('students')
      .select('id, student_no, parent_name, class, section')
      .in('id', studentIds);

    if (stuError) {
      return NextResponse.json(
        { success: false, error: stuError.message },
        { status: 500 },
      );
    }

    const studentMap = new Map<string, any>(
      (students || []).map((s: any) => [s.id as string, s]),
    );

    const todayMs = today.getTime();

    const data = list.map((r: any) => {
      const stu = studentMap.get(r.student_id as string);
      const due = r.due_date ? new Date(r.due_date) : today;
      const diffMs = todayMs - due.getTime();
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      const baseName =
        (stu?.parent_name as string | undefined)?.trim() ||
        (stu?.student_no as string | undefined) ||
        'Öğrenci';

      const classLabel =
        stu?.class && stu?.section ? `${stu.class}-${stu.section}` : stu?.class || '';

      const studentName = classLabel ? `${baseName} (${classLabel})` : baseName;

      return {
        student_id: r.student_id as string,
        student_name: studentName,
        installment_id: r.id as string,
        amount: Number(r.amount || 0),
        due_date: r.due_date as string,
        days_overdue: daysOverdue,
      };
    });

    // days_overdue DESC sıralama
    data.sort((a, b) => b.days_overdue - a.days_overdue);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 },
    );
  }
}



