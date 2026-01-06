import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { ogrenciId: string } }
) {
  const supabase = await getSupabase();
  const { ogrenciId } = params;

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, class, organization_id')
    .eq('id', ogrenciId)
    .single();

  if (!student) {
    return NextResponse.json({ error: 'Öğrenci bulunamadı', data: null });
  }

  // ✅ Sadece öğrencinin kurumundaki sınavlarla ilişkili sonuçlar
  const { data: results } = await supabase
    .from('student_exam_results')
    .select('id, exam_id, total_net, exams!inner(name, exam_date, organization_id)')
    .eq('student_id', ogrenciId)
    .eq('exams.organization_id', student.organization_id)
    .order('created_at', { ascending: false });

  const sinavlar = (results || []).map((r: { exam_id: string; total_net: number | null; exams: { name: string; exam_date: string } | null }) => ({
    exam_id: r.exam_id,
    sinav_adi: r.exams?.name || 'Bilinmiyor',
    tarih: r.exams?.exam_date || null,
    net: r.total_net || 0,
  }));

  const nets = sinavlar.map(s => s.net);
  const ortalamaNet = nets.length > 0 ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 100) / 100 : 0;

  // ✅ Genel sıralama: kurum bazında (100 kurum ölçeğinde zorunlu)
  // join sayesinde tüm kurumları çekmiyoruz.
  const { data: allResults } = await supabase
    .from('student_exam_results')
    .select('student_id, total_net, students!inner(organization_id)')
    .eq('students.organization_id', student.organization_id);

  const studentAvg: Record<string, { total: number; count: number }> = {};
  (allResults || []).forEach((r: { student_id: string; total_net: number | null }) => {
    if (!studentAvg[r.student_id]) studentAvg[r.student_id] = { total: 0, count: 0 };
    studentAvg[r.student_id].total += r.total_net || 0;
    studentAvg[r.student_id].count += 1;
  });

  const sorted = Object.entries(studentAvg)
    .map(([id, s]) => ({ id, avg: s.count > 0 ? s.total / s.count : 0 }))
    .sort((a, b) => b.avg - a.avg);

  const genelSira = sorted.findIndex(s => s.id === ogrenciId) + 1;

  // Sınıf sıralaması
  const { data: classmates } = await supabase
    .from('students')
    .select('id')
    .eq('class', student.class)
    .eq('organization_id', student.organization_id);

  const classmateIds = new Set((classmates || []).map((c: { id: string }) => c.id));
  const classSorted = sorted.filter(s => classmateIds.has(s.id));
  const sinifSira = classSorted.findIndex(s => s.id === ogrenciId) + 1;

  // Finans özeti (finance_installments)
  const today = new Date().toISOString().slice(0, 10);
  const { data: instRows } = await supabase
    .from('finance_installments')
    .select('amount, paid_amount, is_paid, due_date, status')
    .eq('organization_id', student.organization_id)
    .eq('student_id', ogrenciId);

  let totalAmount = 0;
  let paidAmount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  for (const row of (instRows as any[]) || []) {
    const amount = Number(row.amount) || 0;
    const paid = row.paid_amount !== null && row.paid_amount !== undefined ? Number(row.paid_amount) : (row.is_paid ? amount : 0);
    totalAmount += amount;
    paidAmount += paid;

    const isPaid = Boolean(row.is_paid);
    if (!isPaid) {
      pendingCount += 1;
      const status = String(row.status || 'active');
      const isCancelled = status === 'cancelled' || status === 'void' || status === 'deleted';
      const dueDate = row.due_date ? String(row.due_date) : null;
      if (!isCancelled && dueDate && dueDate < today) overdueCount += 1;
    }
  }

  const balance = totalAmount - paidAmount;

  return NextResponse.json({
    data: {
      student_id: student.id,
      ad_soyad: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      sinif: student.class || 'Bilinmiyor',
      ortalama_net: ortalamaNet,
      sinav_sayisi: sinavlar.length,
      genel_sira: genelSira,
      sinif_sira: sinifSira,
      sinif_toplam: classSorted.length,
      genel_toplam: sorted.length,
      finans: {
        totalAmount,
        paidAmount,
        balance,
        overdueCount,
        pendingCount,
      },
      sinavlar,
    },
  });
}
// ✅ ready

