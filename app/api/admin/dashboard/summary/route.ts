import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();
  const url = new URL(request.url);
  const orgId = url.searchParams.get('organizationId');
  const selectedExamId = url.searchParams.get('selectedExamId');

  const empty = {
    examMeta: { examType: 'MEB', gradeGroup: '8', year: new Date().getFullYear() },
    exams: [],
    selectedExamId: null,
    last5ExamComparisons: [],
    topStudents: []
  };

  if (!orgId) return NextResponse.json(empty);

  const { data: exams } = await supabase
    .from('exams')
    .select('id, name, exam_date, exam_type, grade_level')
    .eq('organization_id', orgId)
    .order('exam_date', { ascending: false })
    .limit(5);

  if (!exams || exams.length === 0) return NextResponse.json(empty);

  const examIds = exams.map((e: any) => e.id);
  const activeExamId = selectedExamId || exams[0].id;

  const { data: results } = await supabase
    .from('student_exam_results')
    .select('exam_id, student_id, student_name, class_name, total_net')
    .in('exam_id', examIds);

  const allResults = results || [];

  const examMeta = {
    examType: exams[0].exam_type || 'MEB',
    gradeGroup: exams[0].grade_level || '8',
    year: exams[0].exam_date ? new Date(exams[0].exam_date).getFullYear() : new Date().getFullYear()
  };

  const examList = exams.map((e: any) => {
    const examResults = allResults.filter((r: any) => r.exam_id === e.id);
    const nets = examResults.map((r: any) => Number(r.total_net) || 0);
    const avg = nets.length > 0 ? Math.round((nets.reduce((a: number, b: number) => a + b, 0) / nets.length) * 10) / 10 : 0;
    return {
      id: e.id,
      name: e.name,
      date: e.exam_date,
      lessonAverages: { turkce: avg, matematik: 0, fen: 0, sosyal: 0, ingilizce: 0, din: 0, inkilap: 0 }
    };
  });

  const last5ExamComparisons = exams.map((e: any) => {
    const examResults = allResults.filter((r: any) => r.exam_id === e.id);
    const nets = examResults.map((r: any) => Number(r.total_net) || 0);
    const avg = nets.length > 0 ? Math.round((nets.reduce((a: number, b: number) => a + b, 0) / nets.length) * 10) / 10 : 0;
    return {
      examId: e.id,
      examName: e.name,
      avgNet: avg,
      studentCount: examResults.length,
      lessons: { turkce: avg, matematik: 0, fen: 0, sosyal: 0, ingilizce: 0, din: 0, inkilap: 0 }
    };
  });

  const activeExamResults = allResults.filter((r: any) => r.exam_id === activeExamId);
  const studentMap: Record<string, any> = {};
  
  activeExamResults.forEach((r: any) => {
    const key = r.student_name || r.student_id;
    if (!studentMap[key] || (Number(r.total_net) || 0) > (Number(studentMap[key].total_net) || 0)) {
      studentMap[key] = r;
    }
  });

  const topStudents = Object.values(studentMap)
    .sort((a: any, b: any) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0))
    .slice(0, 5)
    .map((s: any, i: number) => {
      const studentAllResults = allResults.filter((r: any) => r.student_name === s.student_name);
      const studentNets = studentAllResults.map((r: any) => Number(r.total_net) || 0);
      const studentAvg = studentNets.length > 0 ? Math.round((studentNets.reduce((a: number, b: number) => a + b, 0) / studentNets.length) * 10) / 10 : 0;
      
      return {
        id: s.student_id || i,
        name: s.student_name || 'Bilinmiyor',
        classOrGroup: s.class_name || '-',
        net: Number(s.total_net) || 0,
        badges: i === 0 ? ['🥇'] : i === 1 ? ['🥈'] : i === 2 ? ['🥉'] : [],
        initials: (s.student_name || 'X').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        last5ExamAvg: studentAvg,
        last5ExamLessons: { turkce: studentAvg, matematik: 0, fen: 0, sosyal: 0, ingilizce: 0, din: 0, inkilap: 0 }
      };
    });

  return NextResponse.json({
    examMeta,
    exams: examList,
    selectedExamId: activeExamId,
    last5ExamComparisons,
    topStudents
  });
}
