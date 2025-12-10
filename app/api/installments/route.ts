import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient, getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

/**
 * Akademik yılın başlangıç ve bitiş tarihlerini hesapla
 * Örn: "2024-2025" → { start: "2024-09-01", end: "2025-08-31" }
 */
function getAcademicYearDates(academicYear: string) {
  const [startYear, endYear] = academicYear.split('-').map(Number);
  const start = new Date(startYear, 8, 1, 0, 0, 0); // Eylül 1
  const end = new Date(endYear, 7, 31, 23, 59, 59); // Ağustos 31
  return { start: start.toISOString(), end: end.toISOString() };
}

// GET /api/installments?studentId=UUID&academicYear=2024-2025
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // student_id veya studentId parametresini kabul et (geriye uyumluluk)
    const studentId = searchParams.get('student_id') || searchParams.get('studentId');
    const academicYear = searchParams.get('academicYear');
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = accessToken
      ? createRlsServerClient(accessToken)
      : getServiceRoleClient();
    
    // 1. Taksitleri çek
    let q = supabase
      .from('finance_installments')
      .select('*');
    if (studentId) q = q.eq('student_id', studentId);
    
    // Akademik yıl filtresi
    if (academicYear) {
      const { start, end } = getAcademicYearDates(academicYear);
      q = q.gte('due_date', start).lte('due_date', end);
    }
    
    const { data: installments, error: instError } = await q.order('due_date', { ascending: true });
    if (instError) return NextResponse.json({ success: false, error: instError.message }, { status: 500 });

    // 2. Öğrenci bilgilerini ayrı çek
    const studentIds = [...new Set((installments || []).map((i: any) => i.student_id).filter(Boolean))];
    
    let studentsMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_no, class, section')
        .in('id', studentIds);
      
      (studentsData || []).forEach((s: any) => {
        studentsMap[s.id] = s;
      });
    }

    // 3. Verileri birleştir
    const today = new Date();
    const list = (installments || []).map((r: any) => {
      const student = studentsMap[r.student_id];
      const studentName = student 
        ? `${student.first_name || ''} ${student.last_name || ''}`.trim() 
        : null;
      const studentNo = student?.student_no || null;
      const studentClass = student?.class ? `${student.class}-${student.section || 'A'}` : null;

      // Status hesapla: paid, pending, overdue
      let calculatedStatus: 'paid' | 'pending' | 'overdue' = 'pending';
      if (r.is_paid) {
        calculatedStatus = 'paid';
      } else if (r.status === 'cancelled') {
        calculatedStatus = 'pending'; // İptal edilen beklemede gösterilsin
      } else if (r.due_date && new Date(r.due_date) < today) {
        calculatedStatus = 'overdue';
      }

      return {
        id: r.id,
        student_id: r.student_id,
        studentName,
        studentNo,
        studentClass,
        installment_no: r.installment_no,
        agreement_id: r.agreement_id || null,
        sale_id: r.sale_id || null,
        source: r.source || 'education',
        amount: Number(r.amount),
        paid_amount: r.paid_amount !== null && r.paid_amount !== undefined
            ? Number(r.paid_amount)
            : 0,
        due_date: r.due_date,
        is_paid: r.is_paid,
        paid_at: r.paid_at || null,
        payment_method: r.payment_method || null,
        payment_id: r.payment_id || null,
        status: calculatedStatus,
        db_status: r.status || 'active', // Veritabanındaki orijinal status
        note: r.note || null,
        collected_by: r.collected_by || null,
        is_old: typeof r.is_old === 'boolean' ? r.is_old : undefined,
        is_new: typeof r.is_new === 'boolean' ? r.is_new : undefined,
      };
    });

    return NextResponse.json({ success: true, data: list }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST /api/installments
// body: { student_id, installment_no, amount, due_date }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = accessToken
      ? createRlsServerClient(accessToken)
      : getServiceRoleClient();
    if (!body?.student_id || !body?.installment_no || body.amount === undefined) {
      return NextResponse.json({ success: false, error: 'student_id, installment_no ve amount zorunlu' }, { status: 400 });
    }
    const payload = {
      student_id: body.student_id,
      installment_no: Number(body.installment_no),
      amount: Number(body.amount),
      due_date: body.due_date || null,
      is_paid: false,
      payment_id: null,
    };
    const { data, error } = await (supabase as any)
      .from('finance_installments')
      .insert([payload])
      .select('id, student_id, installment_no, amount, due_date, is_paid, payment_id, created_at')
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// PATCH /api/installments
// body: { id, is_paid?, payment_id?, paid_at?, payment_method? }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = accessToken
      ? createRlsServerClient(accessToken)
      : getServiceRoleClient();
    if (!body?.id) return NextResponse.json({ success: false, error: 'id zorunlu' }, { status: 400 });
    
    const update: any = {};
    if (typeof body.is_paid === 'boolean') update.is_paid = body.is_paid;
    if (body.payment_id !== undefined) update.payment_id = body.payment_id;
    if (body.paid_at !== undefined) update.paid_at = body.paid_at;
    if (body.payment_method !== undefined) update.payment_method = body.payment_method;
    if (body.paid_amount !== undefined) update.paid_amount = body.paid_amount;
    
    const { data, error } = await (supabase as any)
      .from('finance_installments')
      .update(update)
      .eq('id', body.id)
      .select('id, student_id, installment_no, amount, due_date, is_paid, paid_at, payment_id, payment_method, created_at')
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE /api/installments?id=UUID
export async function DELETE(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = accessToken
      ? createRlsServerClient(accessToken)
      : getServiceRoleClient();
    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');
    let id = idParam;
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }
    if (!id) {
      return NextResponse.json({ success: false, error: 'id zorunludur' }, { status: 400 });
    }
    const { error } = await supabase.from('finance_installments').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}


