import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();
  const orgId = new URL(request.url).searchParams.get('organizationId');

  if (!orgId) {
    return NextResponse.json({ stats: { totalExams: 0, totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0 }, recentExams: [], classPerformance: [] });
  }

  const { count: totalExams } = await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
  const { data: exams } = await supabase.from('exams').select('id').eq('organization_id', orgId);
  const examIds = (exams || []).map((e: { id: string }) => e.id);

  let results: { total_net: number | null; student_id: string; class_name: string | null }[] = [];
  if (examIds.length > 0) {
    const { data } = await supabase.from('student_exam_results').select('total_net, student_id, class_name').in('exam_id', examIds);
    results = data || [];
  }

  const uniqueStudents = new Set(results.map(r => r.student_id));
  const nets = results.map(r => Number(r.total_net) || 0);
  const totalStudents = uniqueStudents.size;
  const avgNet = nets.length > 0 ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 10) / 10 : 0;
  const maxNet = nets.length > 0 ? Math.max(...nets) : 0;
  const mean = nets.length > 0 ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;
  const stdDev = nets.length > 0 ? Math.round(Math.sqrt(nets.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nets.length) * 10) / 10 : 0;

  const { data: recentExams } = await supabase.from('exams').select('id, name, exam_date, exam_type, grade_level').eq('organization_id', orgId).order('exam_date', { ascending: false }).limit(5);

  const classStats: Record<string, { total: number; count: number }> = {};
  results.forEach(r => {
    const cn = r.class_name || 'Belirsiz';
    if (!classStats[cn]) classStats[cn] = { total: 0, count: 0 };
    classStats[cn].total += Number(r.total_net) || 0;
    classStats[cn].count += 1;
  });

  const classPerformance = Object.entries(classStats).map(([name, s]) => ({ name, avgNet: Math.round((s.total / s.count) * 10) / 10, studentCount: s.count })).sort((a, b) => b.avgNet - a.avgNet);

  return NextResponse.json({ stats: { totalExams: totalExams || 0, totalStudents, avgNet, maxNet, stdDev }, recentExams: recentExams || [], classPerformance });
}
