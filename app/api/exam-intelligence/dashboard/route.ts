import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

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

export async function GET(request: NextRequest) {
  const supabase = await getSupabase();
  const organizationId = new URL(request.url).searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({
      totalStudents: 0,
      averageNet: 0,
      maxNet: 0,
      stdDeviation: 0,
      riskStudentCount: 0,
    });
  }

  // Sınavları al
  const { data: exams } = await supabase
    .from('exams')
    .select('id')
    .eq('organization_id', organizationId);

  const examIds = (exams || []).map((e: { id: string }) => e.id);

  if (examIds.length === 0) {
    return NextResponse.json({
      totalStudents: 0,
      averageNet: 0,
      maxNet: 0,
      stdDeviation: 0,
      riskStudentCount: 0,
    });
  }

  // student_exam_results'tan verileri çek
  const { data: results } = await supabase
    .from('student_exam_results')
    .select('student_id, total_net')
    .in('exam_id', examIds);

  const rows = results || [];

  if (rows.length === 0) {
    return NextResponse.json({
      totalStudents: 0,
      averageNet: 0,
      maxNet: 0,
      stdDeviation: 0,
      riskStudentCount: 0,
    });
  }

  // Hesaplamalar
  const nets = rows.map((r: { total_net: number | null }) => Number(r.total_net) || 0);
  const uniqueStudents = new Set(rows.map((r: { student_id: string }) => r.student_id));

  const totalStudents = uniqueStudents.size;
  const sum = nets.reduce((a, b) => a + b, 0);
  const averageNet = nets.length > 0 ? Math.round((sum / nets.length) * 100) / 100 : 0;
  const maxNet = nets.length > 0 ? Math.max(...nets) : 0;

  // Standard deviation
  const mean = sum / nets.length;
  const squaredDiffs = nets.map(n => Math.pow(n - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / nets.length;
  const stdDeviation = nets.length > 0 ? Math.round(Math.sqrt(avgSquaredDiff) * 100) / 100 : 0;

  // Risk öğrenci (net < 20)
  const riskStudentCount = nets.filter(n => n < 20).length;

  return NextResponse.json({
    totalStudents,
    averageNet,
    maxNet,
    stdDeviation,
    riskStudentCount,
  });
}
// ✅ ready
