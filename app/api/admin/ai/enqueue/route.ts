import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { computeAnalyticsHash } from '@/lib/ai/examAiHash';
import { writeExamAuditLog } from '@/lib/audit/examAudit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function assertAuthorized(req: NextRequest) {
  const expected = process.env.ADMIN_AI_TOKEN;
  const given = req.headers.get('x-admin-ai-token');
  if (!expected) throw new Error('ADMIN_AI_TOKEN env tanımlı değil');
  if (!given || given !== expected) {
    const err: any = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

/**
 * AI snapshot enqueue:
 * - exam_student_analytics snapshot'ına göre analytics_hash üretir
 * - exam_student_ai_snapshots kaydını computing durumuna alır (race lock)
 */
export async function POST(req: NextRequest) {
  try {
    assertAuthorized(req);
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));

    const examId = String(body?.examId || '').trim();
    const studentId = String(body?.studentId || '').trim();
    const role = (String(body?.role || 'teacher').trim() as 'student' | 'parent' | 'teacher') || 'teacher';
    const triggerReason = String(body?.triggerReason || 'manual');

    if (!examId) return NextResponse.json({ ok: false, error: 'examId gerekli' }, { status: 400 });
    if (!studentId) return NextResponse.json({ ok: false, error: 'studentId gerekli' }, { status: 400 });

    const { data: exam, error: exErr } = await supabase.from('exams').select('id, organization_id, name, exam_type').eq('id', examId).single();
    if (exErr || !exam) return NextResponse.json({ ok: false, error: exErr?.message || 'exam not found' }, { status: 404 });

    const { data: analytics, error: aErr } = await supabase
      .from('exam_student_analytics')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (aErr) return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });
    if (!analytics) {
      return NextResponse.json({ ok: false, error: 'exam_student_analytics yok (önce analytics üretin)' }, { status: 409 });
    }

    const analyticsHash = computeAnalyticsHash({
      exam_id: analytics.exam_id,
      student_id: analytics.student_id,
      total_net: analytics.total_net,
      subject_performance: analytics.subject_performance,
      weaknesses: analytics.weaknesses,
      strengths: analytics.strengths,
      risk_level: analytics.risk_level,
      risk_score: analytics.risk_score,
      trend_direction: analytics.trend_direction,
      net_trend: analytics.net_trend,
      updated_at: analytics.updated_at,
      calculation_version: analytics.calculation_version,
    });

    // mevcut snapshot kontrolü
    const { data: existing } = await supabase
      .from('exam_student_ai_snapshots')
      .select('status, analytics_hash')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .eq('role', role)
      .maybeSingle();

    if (existing?.status === 'ready' && existing.analytics_hash === analyticsHash) {
      return NextResponse.json({ ok: true, data: { enqueued: false, reason: 'hit' } }, { status: 200 });
    }

    // upsert computing (lock)
    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from('exam_student_ai_snapshots')
      .upsert(
        {
          exam_id: examId,
          student_id: studentId,
          role,
          analytics_hash: analyticsHash,
          model: 'pending',
          content: {},
          message: null,
          tone: 'balanced',
          confidence_score: 0,
          source: 'ai',
          status: 'computing',
          trigger_reason: triggerReason,
          metadata: { trigger: triggerReason, at: now },
          generation_duration_ms: null,
          token_usage: null,
          updated_at: now,
          organization_id: exam.organization_id ?? null,
        } as any,
        { onConflict: 'exam_id,student_id,role' },
      );

    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

    writeExamAuditLog({
      action: 'AI_REQUEST',
      entityType: 'exam_student_ai_snapshots',
      entityId: null,
      description: `AI snapshot enqueued: examId=${examId} studentId=${studentId} role=${role}`,
      organizationId: exam.organization_id ?? null,
      examId,
      studentId,
      metadata: { analyticsHash },
    });

    return NextResponse.json({ ok: true, data: { enqueued: true, analyticsHash } }, { status: 200 });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Sunucu hatası' }, { status });
  }
}


