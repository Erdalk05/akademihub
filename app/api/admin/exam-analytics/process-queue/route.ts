import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { writeExamAuditLog } from '@/lib/audit/examAudit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function assertAuthorized(req: NextRequest) {
  const expected = process.env.ADMIN_ANALYTICS_TOKEN;
  const given = req.headers.get('x-admin-analytics-token');
  if (!expected) throw new Error('ADMIN_ANALYTICS_TOKEN env tanımlı değil');
  if (!given || given !== expected) {
    const err: any = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

type QueueJob = {
  id: string;
  job_type: string;
  exam_id: string | null;
  student_id: string | null;
  class_name: string | null;
  params: any;
  status: string;
  priority: number | null;
  organization_id: string | null;
};

/**
 * Basit worker: exam_analytics_queue içindeki işleri işler ve exam_student_analytics snapshot yazar.
 * Not: Bu ilk sürüm, yalnızca exam_student_results -> exam_student_analytics “temel alanlar”ını doldurur.
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    assertAuthorized(req);

    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit || 10), 1), 50);

    // 1) Pending işleri çek
    const { data: jobs, error: qErr } = await supabase
      .from('exam_analytics_queue')
      .select('id, job_type, exam_id, student_id, class_name, params, status, priority, organization_id')
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
    const queue = (jobs as QueueJob[]) || [];
    if (queue.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, durationMs: Date.now() - startedAt }, { status: 200 });
    }

    let processed = 0;
    const errors: Array<{ jobId: string; error: string }> = [];

    for (const job of queue) {
      // 2) Lock job
      await supabase.from('exam_analytics_queue').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', job.id);

      try {
        if (!job.exam_id) throw new Error('job.exam_id eksik');

        // Exam meta
        const { data: exam, error: exErr } = await supabase
          .from('exams')
          .select('id, organization_id, academic_year_id')
          .eq('id', job.exam_id)
          .single();
        if (exErr || !exam) throw new Error(exErr?.message || 'exam not found');

        if (job.job_type === 'student_analytics') {
          if (!job.student_id) throw new Error('job.student_id eksik');
          await upsertStudentSnapshot(supabase, {
            examId: job.exam_id,
            studentId: job.student_id,
            organizationId: exam.organization_id,
            academicYearId: exam.academic_year_id,
          });
        } else if (job.job_type === 'exam_analytics') {
          // Tüm öğrenciler için snapshot üret
          const { data: results, error: rErr } = await supabase
            .from('exam_student_results')
            .select('student_id')
            .eq('exam_id', job.exam_id);
          if (rErr) throw new Error(rErr.message);

          const studentIds = Array.from(new Set((results || []).map((r: any) => String(r.student_id || '')).filter(Boolean)));
          let done = 0;
          for (const sid of studentIds) {
            await upsertStudentSnapshot(supabase, {
              examId: job.exam_id,
              studentId: sid,
              organizationId: exam.organization_id,
              academicYearId: exam.academic_year_id,
            });
            done += 1;
            if (done % 25 === 0) {
              await supabase
                .from('exam_analytics_queue')
                .update({ progress_percent: Math.round((done / Math.max(studentIds.length, 1)) * 100), progress_message: `Processed ${done}/${studentIds.length}` })
                .eq('id', job.id);
            }
          }
        } else {
          // İlk sürümde desteklenmeyenler: completed + not
          await supabase
            .from('exam_analytics_queue')
            .update({ status: 'completed', result: { skipped: true, reason: `unsupported job_type=${job.job_type}` }, completed_at: new Date().toISOString() })
            .eq('id', job.id);
          processed += 1;
          continue;
        }

        await supabase
          .from('exam_analytics_queue')
          .update({ status: 'completed', progress_percent: 100, completed_at: new Date().toISOString() })
          .eq('id', job.id);

        writeExamAuditLog({
          action: 'UPDATE',
          entityType: 'exam_student_analytics',
          entityId: job.id,
          description: `Analytics job completed: ${job.job_type} examId=${job.exam_id} studentId=${job.student_id || ''}`,
          organizationId: exam.organization_id,
          examId: job.exam_id,
          studentId: job.student_id,
        });

        processed += 1;
      } catch (e: any) {
        const msg = e?.message || 'unknown error';
        errors.push({ jobId: job.id, error: msg });
        await supabase
          .from('exam_analytics_queue')
          .update({ status: 'failed', error_message: msg, completed_at: new Date().toISOString() })
          .eq('id', job.id);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        processed,
        failed: errors.length,
        errors,
        durationMs: Date.now() - startedAt,
      },
      { status: 200 },
    );
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Sunucu hatası' }, { status });
  }
}

async function upsertStudentSnapshot(
  supabase: any,
  input: { examId: string; studentId: string; organizationId: string | null; academicYearId: string | null },
) {
  // result + student
  const [{ data: res }, { data: stu }] = await Promise.all([
    supabase
      .from('exam_student_results')
      .select('id, total_net, total_correct, total_wrong, total_empty, rank_in_exam, rank_in_class, percentile, subject_results, topic_results')
      .eq('exam_id', input.examId)
      .eq('student_id', input.studentId)
      .maybeSingle(),
    supabase.from('students').select('student_no, first_name, last_name, class, section').eq('id', input.studentId).maybeSingle(),
  ]);

  if (!res) return; // sonuç yoksa snapshot üretmeyelim

  const fullName = `${String(stu?.first_name || '').trim()} ${String(stu?.last_name || '').trim()}`.trim();
  const className = stu?.class ? `${stu.class}${stu.section ? `-${stu.section}` : ''}` : null;

  const subjectPerf: any = {};
  const subj = (res.subject_results || {}) as Record<string, any>;
  for (const [code, v] of Object.entries(subj)) {
    subjectPerf[code] = {
      net: Number((v as any)?.net ?? 0),
      correct: Number((v as any)?.correct ?? 0),
      wrong: Number((v as any)?.wrong ?? 0),
      empty: Number((v as any)?.empty ?? 0),
      rate: (v as any)?.rate ?? null,
      rank: (v as any)?.rank ?? null,
    };
  }

  const now = new Date().toISOString();
  await supabase
    .from('exam_student_analytics')
    .upsert(
      {
        exam_id: input.examId,
        student_id: input.studentId,
        result_id: res.id ?? null,
        student_no: stu?.student_no ?? null,
        student_name: fullName || null,
        class_name: className,
        total_net: Number(res.total_net ?? 0),
        total_correct: Number(res.total_correct ?? 0),
        total_wrong: Number(res.total_wrong ?? 0),
        total_empty: Number(res.total_empty ?? 0),
        rank_in_exam: res.rank_in_exam ?? null,
        rank_in_class: res.rank_in_class ?? null,
        rank_in_school: res.rank_in_school ?? null,
        percentile: res.percentile ?? null,
        subject_performance: subjectPerf,
        topic_performance: res.topic_results ?? {},
        outcome_performance: {},
        difficulty_performance: {},
        strengths: [],
        weaknesses: [],
        improvement_priorities: [],
        study_recommendations: [],
        risk_factors: [],
        ai_metadata: {},
        calculation_metadata: { source: 'process-queue', at: now },
        calculation_version: '1.0',
        calculated_at: now,
        is_stale: false,
        organization_id: input.organizationId,
        academic_year_id: input.academicYearId,
        updated_at: now,
      },
      { onConflict: 'exam_id,student_id' },
    );
}


