import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();
  const url = new URL(request.url);
  const orgId = url.searchParams.get('organizationId');

  const empty = {
    kpis: { totalExams: 0, totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0, riskCount: 0 },
    healthScore: 0,
    classPerformance: [],
    subjectAverages: { turkce: 0, matematik: 0, fen: 0, sosyal: 0, ingilizce: 0, din: 0 },
    top5Students: [],
    examTimeline: [],
    aiComments: [],
    risks: []
  };

  if (!orgId) return NextResponse.json(empty);

  const { count: totalExams } = await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
  const { data: exams } = await supabase.from('exams').select('id, name, exam_date, exam_type').eq('organization_id', orgId).order('exam_date', { ascending: false });
  const examIds = (exams || []).map((e: any) => e.id);

  if (examIds.length === 0) return NextResponse.json(empty);

  const { data: results } = await supabase
    .from('student_exam_results')
    .select('exam_id, student_id, student_name, class_name, total_net, total_score')
    .in('exam_id', examIds);

  const filtered = results || [];

  const uniqueNames = new Set(filtered.map((r: any) => r.student_name).filter(Boolean));
  const totalStudents = uniqueNames.size;

  const nets = filtered.map((r: any) => Number(r.total_net) || 0);
  const avgNet = nets.length > 0 ? Math.round((nets.reduce((a: number, b: number) => a + b, 0) / nets.length) * 10) / 10 : 0;
  const maxNet = nets.length > 0 ? Math.max(...nets) : 0;
  const mean = nets.length > 0 ? nets.reduce((a: number, b: number) => a + b, 0) / nets.length : 0;
  const stdDev = nets.length > 0 ? Math.round(Math.sqrt(nets.reduce((s: number, n: number) => s + Math.pow(n - mean, 2), 0) / nets.length) * 10) / 10 : 0;
  const riskCount = nets.filter((n: number) => n < 30).length;

  const healthScore = Math.min(100, Math.max(0, Math.round(avgNet * 1.2 + (100 - stdDev * 2))));

  const classStats: Record<string, { total: number; count: number }> = {};
  filtered.forEach((r: any) => {
    const cn = r.class_name || 'Belirsiz';
    if (!classStats[cn]) classStats[cn] = { total: 0, count: 0 };
    classStats[cn].total += Number(r.total_net) || 0;
    classStats[cn].count += 1;
  });

  const classPerformance = Object.entries(classStats).map(([name, s]) => ({
    name,
    avgNet: Math.round((s.total / s.count) * 10) / 10,
    studentCount: s.count,
    subjects: {}
  })).sort((a, b) => b.avgNet - a.avgNet);

  const subjectAverages = { turkce: 0, matematik: 0, fen: 0, sosyal: 0, ingilizce: 0, din: 0 };

  const top5Students = [...filtered]
    .sort((a: any, b: any) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0))
    .slice(0, 5)
    .map((s: any, i: number) => ({
      rank: i + 1,
      name: s.student_name || 'Bilinmiyor',
      class: s.class_name || '-',
      net: Number(s.total_net) || 0,
      initials: (s.student_name || 'X').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      subjects: {}
    }));

  const examTimeline = (exams || []).slice(0, 5).map((e: any) => {
    const examResults = filtered.filter((r: any) => r.exam_id === e.id);
    const examNets = examResults.map((r: any) => Number(r.total_net) || 0);
    const examAvg = examNets.length > 0 ? Math.round((examNets.reduce((a: number, b: number) => a + b, 0) / examNets.length) * 10) / 10 : 0;
    return {
      id: e.id,
      name: e.name,
      date: e.exam_date,
      type: e.exam_type,
      avgNet: examAvg,
      studentCount: examResults.length,
      subjects: {}
    };
  });

  const aiComments = [
    stdDev > 15 ? 'Sınıflar arası seviye farkı yüksek, gruplar arası destek önerilir.' : null,
    riskCount > totalStudents * 0.2 ? `${riskCount} öğrenci risk altında. Bireysel takip başlatılmalı.` : null,
    avgNet > 50 ? 'Genel performans ortalamanın üzerinde, başarı trendi olumlu.' : null,
    avgNet < 40 ? 'Genel ortalama düşük, müfredat takviyesi önerilir.' : null
  ].filter(Boolean);

  const risks = filtered
    .filter((r: any) => (Number(r.total_net) || 0) < 30)
    .slice(0, 5)
    .map((r: any) => ({
      name: r.student_name,
      class: r.class_name,
      net: Number(r.total_net) || 0
    }));

  return NextResponse.json({
    kpis: { totalExams: totalExams || 0, totalStudents, avgNet, maxNet, stdDev, riskCount },
    healthScore,
    classPerformance,
    subjectAverages,
    top5Students,
    examTimeline,
    aiComments,
    risks
  });
}
