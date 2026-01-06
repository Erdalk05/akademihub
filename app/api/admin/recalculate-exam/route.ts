import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { calculateFullExamResults } from '@/lib/exam/calculationEngine';
import { writeExamAuditLog } from '@/lib/audit/examAudit';

export const dynamic = 'force-dynamic';

function assertAuthorized(req: NextRequest) {
  const expected = process.env.ADMIN_RECALC_TOKEN;
  const given = req.headers.get('x-admin-recalc-token');

  if (!expected) {
    throw new Error('ADMIN_RECALC_TOKEN env tanımlı değil');
  }
  if (!given || given !== expected) {
    const err: any = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  try {
    assertAuthorized(req);

    const body = await req.json();
    const examId = body?.examId as string | undefined;

    if (!examId) {
      return NextResponse.json({ ok: false, error: 'examId gerekli' }, { status: 400 });
    }

    console.log(`🧮 [RECALC] START examId=${examId}`);

    const supabase = getServiceRoleClient();

    // 1) Exam + ExamType
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('id, organization_id, exam_type_id, exam_type:exam_types(*)')
      .eq('id', examId)
      .single();

    if (examErr || !exam) {
      return NextResponse.json(
        { ok: false, error: examErr?.message || 'exam not found' },
        { status: 404 },
      );
    }

    const examType: any = (exam as any).exam_type;
    if (!examType) {
      return NextResponse.json({ ok: false, error: 'exam_type bulunamadı' }, { status: 500 });
    }

    // 2) Subject ranges (exam_type’a göre)
    const { data: subjects, error: subjErr } = await supabase
      .from('exam_subjects')
      .select('code, name, question_start_no, question_end_no, weight')
      .eq('exam_type_id', (exam as any).exam_type_id)
      .order('display_order', { ascending: true });

    if (subjErr) {
      return NextResponse.json({ ok: false, error: subjErr.message }, { status: 500 });
    }

    const subjectRanges = (subjects || [])
      .filter((s: any) => s.question_start_no && s.question_end_no)
      .map((s: any) => ({
        code: s.code,
        name: s.name,
        startNo: Number(s.question_start_no),
        endNo: Number(s.question_end_no),
        weight: s.weight ? Number(s.weight) : undefined,
      }));

    // 3) Exam questions → answerKey + topic mapping
    const { data: questions, error: qErr } = await supabase
      .from('exam_questions')
      .select('question_no, correct_answer, topic_id')
      .eq('exam_id', examId)
      .order('question_no', { ascending: true });

    if (qErr) {
      return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
    }

    const answerKey: Record<number, string | null> = {};
    const questionTopicMapping: Array<{ questionNo: number; topicId: string }> = [];

    for (const q of questions || []) {
      answerKey[Number((q as any).question_no)] = (q as any).correct_answer ?? null;
      if ((q as any).topic_id) {
        questionTopicMapping.push({
          questionNo: Number((q as any).question_no),
          topicId: String((q as any).topic_id),
        });
      }
    }

    // 4) Student answers (DB’de mevcut olanlar)
    const { data: ansRows, error: aErr } = await supabase
      .from('exam_student_answers')
      .select('student_id, question_no, given_answer')
      .eq('exam_id', examId)
      .order('student_id', { ascending: true })
      .order('question_no', { ascending: true });

    if (aErr) {
      return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });
    }

    const byStudent = new Map<string, Array<{ questionNo: number; givenAnswer: string | null }>>();
    for (const row of ansRows || []) {
      const sid = String((row as any).student_id);
      if (!byStudent.has(sid)) byStudent.set(sid, []);
      byStudent.get(sid)!.push({
        questionNo: Number((row as any).question_no),
        givenAnswer: (row as any).given_answer ?? null,
      });
    }

    const studentAnswers = Array.from(byStudent.entries()).map(([studentId, answers]) => ({
      studentId,
      className: undefined as string | undefined,
      answers,
    }));

    console.log(
      `🧮 [RECALC] input students=${studentAnswers.length}, questions=${Object.keys(answerKey).length}`,
    );

    // 5) Hesapla (mevcut motor)
    const calc = calculateFullExamResults({
      examId,
      examType,
      answerKey,
      subjectRanges,
      questionTopicMapping,
      studentAnswers,
    } as any);

    // 6) Sonuçları overwrite et (temizle → insert)
    await supabase.from('exam_student_results').delete().eq('exam_id', examId);

    const now = new Date().toISOString();
    const insertRows = (calc.studentResults || []).map((r: any) => ({
      exam_id: examId,
      student_id: r.studentId,
      total_correct: r.correct,
      total_wrong: r.wrong,
      total_empty: r.empty,
      total_net: r.net,
      raw_score: null,
      scaled_score: null,
      rank_in_exam: r.rankInExam,
      rank_in_class: r.rankInClass ?? null,
      rank_in_school: null,
      percentile: r.percentile,
      subject_results: r.subjectResults,
      topic_results: r.topicResults,
      learning_outcome_results: null,
      ai_analysis: null,
      calculated_at: now,
      organization_id: (exam as any).organization_id ?? null,
      created_at: now,
      updated_at: now,
    }));

    if (insertRows.length > 0) {
      const { error: insErr } = await supabase.from('exam_student_results').insert(insertRows);
      if (insErr) {
        return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
      }
    }

    // 7) Exam stats (opsiyonel) güncelle
    await supabase
      .from('exams')
      .update({
        stats_calculated_at: now,
        stats_cache: {
          totalStudents: insertRows.length,
          calculatedAt: now,
        },
        updated_at: now,
      })
      .eq('id', examId);

    // 7.1) Analytics job enqueue (best-effort)
    try {
      await supabase.from('exam_analytics_queue').insert({
        job_type: 'exam_analytics',
        exam_id: examId,
        status: 'pending',
        priority: 3,
        params: { reason: 'recalc' },
        organization_id: (exam as any).organization_id ?? null,
        created_by: null,
        scheduled_at: now,
      } as any);
    } catch {
      // queue tablosu yoksa / policy varsa ana akışı bozma
    }

    const durationMs = Date.now() - startedAt;
    console.log(`✅ [RECALC] DONE examId=${examId} students=${insertRows.length} durationMs=${durationMs}`);

    // 8) Audit (best-effort)
    writeExamAuditLog({
      action: 'RECALC',
      entityType: 'exam',
      entityId: examId,
      description: `Sınav yeniden hesaplandı (exam_student_results): öğrenci=${insertRows.length}, süre=${durationMs}ms`,
      organizationId: (exam as any).organization_id ?? null,
      examId,
      metadata: { students: insertRows.length, durationMs },
    });

    return NextResponse.json({ ok: true, count: insertRows.length, durationMs });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    console.error('❌ [RECALC] ERROR', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Sunucu hatası' }, { status });
  }
}


