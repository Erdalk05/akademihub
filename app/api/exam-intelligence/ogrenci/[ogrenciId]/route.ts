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

  const { data: results } = await supabase
    .from('student_exam_results')
    .select('id, exam_id, total_net, exams(name, exam_date)')
    .eq('student_id', ogrenciId)
    .order('created_at', { ascending: false });

  const sinavlar = (results || []).map((r: { exam_id: string; total_net: number | null; exams: { name: string; exam_date: string } | null }) => ({
    exam_id: r.exam_id,
    sinav_adi: r.exams?.name || 'Bilinmiyor',
    tarih: r.exams?.exam_date || null,
    net: r.total_net || 0,
  }));

  const nets = sinavlar.map(s => s.net);
  const ortalamaNet = nets.length > 0 ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 100) / 100 : 0;

  // Genel sıralama
  const { data: allResults } = await supabase
    .from('student_exam_results')
    .select('student_id, total_net');

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
      sinavlar,
    },
  });
}
// ✅ ready

