import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();
  const url = new URL(request.url);
  const orgId = url.searchParams.get('organizationId');
  const scope = url.searchParams.get('scope') || 'all';

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
    .select('exam_id, student_id, student_name, class_name, total_net, turkce_net, matematik_net, fen_net, sosyal_net, ingilizce_net, din_net, is_guest')
    .in('exam_id', examIds);

  let filtered = results || [];
  if (scope === 'institution') filtered = filtered.filter((r: any) => !r.is_guest);
  else if (scope === 'guest') filtered = filtered.filter((r: any) => r.is_guest);

  const uniqueNames = new Set(filtered.map((r: any) => r.student_name).filter(Boolean));
  const totalStudents = uniqueNames.size;

  const nets = filtered.map((r: any) => Number(r.total_net) || 0);
  const avgNet = nets.length > 0 ? Math.round((nets.reduce((a: number, b: number) => a + b, 0) / nets.length) * 10) / 10 : 0;
  const maxNet = nets.length > 0 ? Math.max(...nets) : 0;
  const mean = nets.length > 0 ? nets.reduce((a: number, b: number) => a + b, 0) / nets.length : 0;
  const stdDev = nets.length > 0 ? Math.round(Math.sqrt(nets.reduce((s: number, n: number) => s + Math.pow(n - mean, 2), 0) / nets.length) * 10) / 10 : 0;
  const riskCount = nets.filter((n: number) => n < 30).length;

  const healthScore = Math.min(100, Math.max(0, Math.round(avgNet * 1.2 + (100 - stdDev * 2))));

  const classStats: Record<string, { total: number; count: number; turkce: number; mat: number; fen: number; sos: number; ing: number }> = {};
  filtered.forEach((r: any) => {
    const cn = r.class_name || 'Belirsiz';
    if (!classStats[cn]) classStats[cn] = { total: 0, count: 0, turkce: 0, mat: 0, fen: 0, sos: 0, ing: 0 };
    classStats[cn].total += Number(r.total_net) || 0;
    classStats[cn].count += 1;
    classStats[cn].turkce += Number(r.turkce_net) || 0;
    classStats[cn].mat += Number(r.matematik_net) || 0;
    classStats[cn].fen += Number(r.fen_net) || 0;
    classStats[cn].sos += Number(r.sosyal_net) || 0;
    classStats[cn].ing += Number(r.ingilizce_net) || 0;
  });

  const classPerformance = Object.entries(classStats).map(([name, s]) => ({
    name,
    avgNet: Math.round((s.total / s.count) * 10) / 10,
    studentCount: s.count,
    subjects: {
      turkce: Math.round((s.turkce / s.count) * 10) / 10,
      matematik: Math.round((s.mat / s.count) * 10) / 10,
      fen: Math.round((s.fen / s.count) * 10) / 10,
      sosyal: Math.round((s.sos / s.count) * 10) / 10,
      ingilizce: Math.round((s.ing / s.count) * 10) / 10
    }
  })).sort((a, b) => b.avgNet - a.avgNet);

  const avg = (field: string) => {
    const vals = filtered.map((r: any) => Number(r[field]) || 0);
    return vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0;
  };

  const subjectAverages = {
    turkce: avg('turkce_net'),
    matematik: avg('matematik_net'),
    fen: avg('fen_net'),
    sosyal: avg('sosyal_net'),
    ingilizce: avg('ingilizce_net'),
    din: avg('din_net')
  };

  const top5Students = [...filtered]
    .sort((a: any, b: any) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0))
    .slice(0, 5)
    .map((s: any, i: number) => ({
      rank: i + 1,
      name: s.student_name || 'Bilinmiyor',
      class: s.class_name || '-',
      net: Number(s.total_net) || 0,
      initials: (s.student_name || 'X').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      subjects: {
        turkce: Number(s.turkce_net) || 0,
        matematik: Number(s.matematik_net) || 0,
        fen: Number(s.fen_net) || 0,
        sosyal: Number(s.sosyal_net) || 0,
        ingilizce: Number(s.ingilizce_net) || 0
      }
    }));

  const examTimeline = (exams || []).slice(0, 5).map((e: any) => {
    const examResults = filtered.filter((r: any) => r.exam_id === e.id);
    const eAvg = (field: string) => {
      const vals = examResults.map((r: any) => Number(r[field]) || 0);
      return vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0;
    };
    return {
      id: e.id,
      name: e.name,
      date: e.exam_date,
      type: e.exam_type,
      subjects: {
        turkce: eAvg('turkce_net'),
        matematik: eAvg('matematik_net'),
        fen: eAvg('fen_net'),
        sosyal: eAvg('sosyal_net'),
        ingilizce: eAvg('ingilizce_net'),
        din: eAvg('din_net')
      }
    };
  });

  const aiComments = [
    stdDev > 15 ? 'Matematik dersinde seviye farkı yüksek, gruplar arası destek önerilir.' : null,
    riskCount > totalStudents * 0.2 ? `${riskCount} öğrenci risk altında. Bireysel takip başlatılmalı.` : null,
    avgNet > 50 ? 'Genel performans ortalamanın üzerinde, başarı trendi olumlu.' : null
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

