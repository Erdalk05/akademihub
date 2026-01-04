import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();
  const url = new URL(request.url);
  const orgId = url.searchParams.get('organizationId');
  const grade = url.searchParams.get('grade'); // '4'..'12' | 'mezun' | 'all' | null

  const empty = { stats: { totalExams: 0, totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0, riskCount: 0 }, recentExams: [], classPerformance: [], topStudents: [] };
  if (!orgId) return NextResponse.json(empty);

  // Supabase'de filter metodları select sonrası gelir; bu yüzden select(...).eq(...) patterni kullanıyoruz.
  const countQuery =
    grade && grade !== 'all'
      ? supabase.from('exams').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('grade_level', grade)
      : supabase.from('exams').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
  const { count: totalExams } = await countQuery;

  const examsQuery =
    grade && grade !== 'all'
      ? supabase.from('exams').select('id').eq('organization_id', orgId).eq('grade_level', grade)
      : supabase.from('exams').select('id').eq('organization_id', orgId);
  const { data: exams } = await examsQuery;
  const examIds = (exams || []).map((e: { id: string }) => e.id);

  if (examIds.length === 0) return NextResponse.json(empty);

  const { data } = await supabase.from('student_exam_results').select('total_net, student_id, student_name, student_no, class_name, total_score, general_rank').in('exam_id', examIds);
  const results = data || [];

  // Benzersiz öğrenci sayısı (student_name bazlı)
  const uniqueNames = new Set(results.map(r => r.student_name).filter(Boolean));
  const totalStudents = uniqueNames.size;

  const nets = results.map(r => Number(r.total_net) || 0);
  const avgNet = nets.length > 0 ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 10) / 10 : 0;
  const maxNet = nets.length > 0 ? Math.max(...nets) : 0;
  const mean = nets.length > 0 ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;
  const stdDev = nets.length > 0 ? Math.round(Math.sqrt(nets.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nets.length) * 10) / 10 : 0;
  const riskCount = nets.filter(n => n < 30).length;

  const recentExamsQuery =
    grade && grade !== 'all'
      ? supabase.from('exams').select('id, name, exam_date, exam_type, grade_level').eq('organization_id', orgId).eq('grade_level', grade)
      : supabase.from('exams').select('id, name, exam_date, exam_type, grade_level').eq('organization_id', orgId);
  const { data: recentExams } = await recentExamsQuery.order('exam_date', { ascending: false }).limit(5);

  // Sınıf performansı
  const classStats: Record<string, { total: number; count: number }> = {};
  results.forEach(r => {
    const cn = r.class_name || 'Belirsiz';
    if (!classStats[cn]) classStats[cn] = { total: 0, count: 0 };
    classStats[cn].total += Number(r.total_net) || 0;
    classStats[cn].count += 1;
  });
  const classPerformance = Object.entries(classStats).map(([name, s]) => ({ name, avgNet: Math.round((s.total / s.count) * 10) / 10, studentCount: s.count })).sort((a, b) => b.avgNet - a.avgNet);

  // Top 10 öğrenci
  const topStudents = [...results].sort((a, b) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0)).slice(0, 10).map((s: any, i) => ({
    rank: i + 1,
    studentId: s.student_id || null,
    name: s.student_name || 'Bilinmiyor',
    class: s.class_name || '-',
    net: Number(s.total_net) || 0,
    score: Number(s.total_score) || 0,
    initials: (s.student_name || 'X').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  }));

  return NextResponse.json({ stats: { totalExams: totalExams || 0, totalStudents, avgNet, maxNet, stdDev, riskCount }, recentExams: recentExams || [], classPerformance, topStudents });
}
