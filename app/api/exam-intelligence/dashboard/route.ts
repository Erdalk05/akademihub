import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { buildStudentIndex, classifyStudent } from '../_utils/studentMatch';
import { inferSubjectsFromKeys, pickSubjectNetKeys } from '../_utils/subjects';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();
  const url = new URL(request.url);
  const orgId = url.searchParams.get('organizationId');
  const grade = url.searchParams.get('grade'); // '4'..'12' | 'mezun' | 'all' | null

  const emptyData = {
    stats: { totalExams: 0, totalStudents: 0, asilStudents: 0, misafirStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0, riskCount: 0 },
    recentExams: [],
    examSubjectTimeline: [],
    subjectAverages: {},
    classPerformance: [],
    topStudents: [],
  };
  if (!orgId) {
    return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 });
  }

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

  if (examIds.length === 0) {
    return NextResponse.json({ 
      ok: true, 
      data: emptyData,
      meta: { organizationId: orgId, count: 0 }
    });
  }

  // Kurumdaki kayıtlı öğrenciler (asil eşleştirme için)
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('organization_id', orgId)
    .neq('status', 'deleted')
    .limit(2000);
  const studentIndex = buildStudentIndex(students || []);

  const { data } = await supabase
    .from('student_exam_results')
    // ders kolonlarını dinamik okumak için select(*) (UI için gerekli)
    .select('*')
    .in('exam_id', examIds);
  const results = (data as any[]) || [];

  // Ders kolonlarını tespit (1 satırdan)
  const subjectNetKeys = pickSubjectNetKeys(results[0]);
  const subjects = inferSubjectsFromKeys(subjectNetKeys);

  // Öğrenci türü sınıflandırma (asil/misafir)
  const uniqueStudentKey = (r: any) => String(r.student_id || r.student_no || r.student_name || '');
  const uniques = new Map<string, { type: 'asil' | 'misafir' }>();
  for (const r of results) {
    const key = uniqueStudentKey(r);
    if (!key) continue;
    if (uniques.has(key)) continue;
    const cls = classifyStudent(studentIndex, {
      student_id: r.student_id,
      student_no: r.student_no,
      student_name: r.student_name,
      tc: r.tc_no || r.tc_id || r.tckn || null,
    });
    uniques.set(key, { type: cls.studentType });
  }
  const totalStudents = uniques.size;
  const asilStudents = [...uniques.values()].filter((x) => x.type === 'asil').length;
  const misafirStudents = totalStudents - asilStudents;

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
  const recentExamIds = (recentExams || []).map((e: any) => e.id);

  // Sınıf performansı
  const classStats: Record<string, { total: number; count: number; subjects: Record<string, { sum: number; count: number }> }> = {};
  results.forEach(r => {
    const cn = r.class_name || 'Belirsiz';
    if (!classStats[cn]) classStats[cn] = { total: 0, count: 0, subjects: {} };
    classStats[cn].total += Number(r.total_net) || 0;
    classStats[cn].count += 1;

    for (const s of subjects) {
      const v = Number(r[s.key]) || 0;
      if (!classStats[cn].subjects[s.code]) classStats[cn].subjects[s.code] = { sum: 0, count: 0 };
      classStats[cn].subjects[s.code].sum += v;
      classStats[cn].subjects[s.code].count += 1;
    }
  });
  const classPerformance = Object.entries(classStats)
    .map(([name, s]) => ({
      name,
      avgNet: Math.round((s.total / s.count) * 10) / 10,
      studentCount: s.count,
      subjects: Object.fromEntries(
        subjects.map((sub) => {
          const a = s.subjects[sub.code] || { sum: 0, count: 0 };
          return [sub.code, a.count ? Math.round((a.sum / a.count) * 10) / 10 : 0];
        })
      ),
    }))
    .sort((a, b) => b.avgNet - a.avgNet);

  // Top 10 öğrenci
  const topStudents = [...results].sort((a, b) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0)).slice(0, 10).map((s: any, i) => ({
    rank: i + 1,
    studentId: s.student_id || null,
    name: s.student_name || 'Bilinmiyor',
    class: s.class_name || '-',
    net: Number(s.total_net) || 0,
    score: Number(s.total_score) || 0,
    initials: (s.student_name || 'X').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    studentType: classifyStudent(studentIndex, { student_id: s.student_id, student_no: s.student_no, student_name: s.student_name, tc: s.tc_no || s.tc_id || null }).studentType,
    subjects: Object.fromEntries(subjects.map((sub) => [sub.code, Number(s[sub.key]) || 0])),
  }));

  // Kurum genel ders ortalamaları
  const subjectAverages: Record<string, number> = {};
  for (const sub of subjects) {
    const vals = results.map((r) => Number(r[sub.key]) || 0);
    subjectAverages[sub.code] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  }

  // Son 5 sınav için ders ortalamaları timeline (grafik)
  const examSubjectTimeline = (recentExams || []).map((ex: any) => {
    const exRows = results.filter((r) => r.exam_id === ex.id);
    const out: any = {
      id: ex.id,
      name: ex.name,
      exam_date: ex.exam_date,
      exam_type: ex.exam_type,
      grade_level: ex.grade_level,
      total_students: exRows.length,
      total_avg_net: exRows.length ? Math.round((exRows.reduce((s, r) => s + (Number(r.total_net) || 0), 0) / exRows.length) * 10) / 10 : 0,
      subjects: {},
    };
    for (const sub of subjects) {
      const vals = exRows.map((r) => Number(r[sub.key]) || 0);
      out.subjects[sub.code] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    }
    return out;
  });

  return NextResponse.json({
    ok: true,
    data: {
      stats: { totalExams: totalExams || 0, totalStudents, asilStudents, misafirStudents, avgNet, maxNet, stdDev, riskCount },
      subjects,
      subjectAverages,
      recentExams: recentExams || [],
      examSubjectTimeline,
      classPerformance,
      topStudents,
    },
    meta: { organizationId: orgId }
  });
}
