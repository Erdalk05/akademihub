import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  const supabase = getServiceRoleClient();
  const { examId } = params;

  const { data: exam } = await supabase
    .from('exams')
    .select('id, name, exam_date')
    .eq('id', examId)
    .single();

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  const { data: results } = await supabase
    .from('student_exam_results')
    .select('student_id, student_name, class_name, total_net, turkce_net, matematik_net, fen_net, ingilizce_net, sosyal_net')
    .eq('exam_id', examId);

  const rows = results || [];

  const avg = (field: string) => {
    const vals = rows.map((r: any) => Number(r[field]) || 0).filter((v: number) => v > 0);
    return vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0;
  };

  const averages = {
    turkce: avg('turkce_net'),
    matematik: avg('matematik_net'),
    fen: avg('fen_net'),
    ingilizce: avg('ingilizce_net'),
    sosyal: avg('sosyal_net'),
  };

  const topStudents = rows
    .sort((a: any, b: any) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0))
    .slice(0, 10)
    .map((s: any) => ({
      id: s.student_id,
      name: s.student_name,
      net: Number(s.total_net) || 0,
      class: s.class_name,
    }));

  return NextResponse.json({
    exam: { id: exam.id, name: exam.name, date: exam.exam_date },
    averages,
    topStudents,
  });
}

