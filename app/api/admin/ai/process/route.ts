import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { buildCoachPrompt } from '@/lib/ai/examAiPrompt';
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

type SnapshotRow = {
  exam_id: string;
  student_id: string;
  role: 'student' | 'parent' | 'teacher';
  analytics_hash: string;
  status: 'ready' | 'computing' | 'failed';
};

function fallbackCoach(analytics: any, role: string) {
  const net = Number(analytics?.total_net ?? 0);
  const risk = String(analytics?.risk_level || 'low');
  const weak = Array.isArray(analytics?.weaknesses) ? analytics.weaknesses.slice(0, 3) : [];
  const strong = Array.isArray(analytics?.strengths) ? analytics.strengths.slice(0, 3) : [];

  const greeting = role === 'parent' ? 'Merhaba,' : 'Merhaba,';
  const perf = `Bu sınavda toplam net: ${net.toFixed(2)}. Risk seviyesi: ${risk}.`;
  const strengthsAnalysis = strong.length ? `Güçlü alanlar: ${strong.map((x: any) => x?.topic || x?.subject || x).join(', ')}.` : 'Güçlü alanlar: veri yetersiz.';
  const areas = weak.length ? `Gelişim alanları: ${weak.map((x: any) => x?.topic || x?.subject || x).join(', ')}.` : 'Gelişim alanları: veri yetersiz.';

  return {
    greeting,
    performanceSummary: perf,
    strengthsAnalysis,
    areasForImprovement: areas,
    trendAnalysis: null,
    riskAnalysis: risk === 'high' ? 'Kısa vadede bireysel takip önerilir.' : null,
    actionableAdvice: [
      { title: 'Konu Tekrarı', description: 'En zayıf 2 konu için günlük 20-30 dk tekrar + 20 soru.', priority: 1 },
      { title: 'Hata Analizi', description: 'Yanlışların nedenlerini (bilgi eksikliği/okuma hatası/süre) etiketleyin.', priority: 2 },
    ],
    motivationalClosing: 'Düzenli ve ölçülü tekrarlarla hızlı toparlanma mümkündür.',
    additionalInsights: null,
    evidence: [`analytics.total_net=${net}`, `analytics.risk_level=${risk}`],
  };
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'OPENAI_API_KEY yok' };

  const startedAt = Date.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false as const, error: json?.error?.message || `OpenAI HTTP ${res.status}` };

  const content = json?.choices?.[0]?.message?.content || '';
  return {
    ok: true as const,
    content,
    durationMs: Date.now() - startedAt,
    tokenUsage: json?.usage ? { prompt: json.usage.prompt_tokens, completion: json.usage.completion_tokens, total: json.usage.total_tokens } : null,
    model: json?.model || null,
  };
}

/**
 * AI snapshot processor:
 * - exam_student_ai_snapshots status=computing kayıtlarını alır
 * - üretir (OpenAI varsa) yoksa fallback üretir
 * - status=ready yazar
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    assertAuthorized(req);
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit || 5), 1), 25);

    const { data: rows, error } = await supabase
      .from('exam_student_ai_snapshots')
      .select('exam_id, student_id, role, analytics_hash, status')
      .eq('status', 'computing')
      .order('updated_at', { ascending: true })
      .limit(limit);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const queue = (rows as SnapshotRow[]) || [];
    if (queue.length === 0) return NextResponse.json({ ok: true, processed: 0, durationMs: Date.now() - startedAt }, { status: 200 });

    let processed = 0;
    const failures: any[] = [];

    for (const s of queue) {
      try {
        // analytics
        const { data: analytics, error: aErr } = await supabase
          .from('exam_student_analytics')
          .select('*')
          .eq('exam_id', s.exam_id)
          .eq('student_id', s.student_id)
          .maybeSingle();
        if (aErr) throw new Error(aErr.message);
        if (!analytics) throw new Error('analytics bulunamadı');

        // student + exam names
        const [{ data: stu }, { data: ex }] = await Promise.all([
          supabase.from('students').select('first_name, last_name, full_name').eq('id', s.student_id).maybeSingle(),
          supabase.from('exams').select('name, exam_type').eq('id', s.exam_id).maybeSingle(),
        ]);

        const studentName =
          String(stu?.full_name || '').trim() ||
          `${String(stu?.first_name || '').trim()} ${String(stu?.last_name || '').trim()}`.trim() ||
          'Bilinmeyen';
        const examName = String(ex?.name || 'Sınav');
        const examType = String(ex?.exam_type || 'LGS');

        const prompt = buildCoachPrompt({ role: s.role, studentName, examName, examType, analytics });

        const ai = await callOpenAI(prompt);
        let structured: any;
        let message: string;
        let source: 'ai' | 'fallback' = 'ai';
        let confidence = Number(analytics?.confidence_score ?? 0);
        let tokenUsage = null;
        let model = null;
        let durationMs = null;

        if (ai.ok) {
          durationMs = ai.durationMs;
          tokenUsage = ai.tokenUsage;
          model = ai.model;
          try {
            structured = JSON.parse(ai.content);
            message = String(structured?.performanceSummary || structured?.greeting || 'AI raporu hazır');
          } catch {
            // JSON parse başarısızsa fallback
            structured = fallbackCoach(analytics, s.role);
            message = structured.performanceSummary;
            source = 'fallback';
          }
        } else {
          structured = fallbackCoach(analytics, s.role);
          message = structured.performanceSummary;
          source = 'fallback';
        }

        const now = new Date().toISOString();
        const { error: upErr } = await supabase
          .from('exam_student_ai_snapshots')
          .update({
            status: 'ready',
            content: structured,
            message,
            source,
            model: model || (source === 'fallback' ? 'fallback' : 'unknown'),
            confidence_score: confidence,
            token_usage: tokenUsage,
            generation_duration_ms: durationMs,
            metadata: { evidence: structured?.evidence || [], at: now },
            updated_at: now,
          } as any)
          .eq('exam_id', s.exam_id)
          .eq('student_id', s.student_id)
          .eq('role', s.role)
          .eq('analytics_hash', s.analytics_hash);

        if (upErr) throw new Error(upErr.message);

        writeExamAuditLog({
          action: 'AI_READY',
          entityType: 'exam_student_ai_snapshots',
          description: `AI snapshot ready: examId=${s.exam_id} studentId=${s.student_id} role=${s.role} source=${source}`,
          organizationId: null,
          examId: s.exam_id,
          studentId: s.student_id,
          metadata: { source, model, tokenUsage },
        });

        processed += 1;
      } catch (e: any) {
        failures.push({ examId: s.exam_id, studentId: s.student_id, role: s.role, error: e?.message || 'unknown' });
        await supabase
          .from('exam_student_ai_snapshots')
          .update({ status: 'failed', metadata: { error: e?.message || 'unknown' }, updated_at: new Date().toISOString() } as any)
          .eq('exam_id', s.exam_id)
          .eq('student_id', s.student_id)
          .eq('role', s.role);
      }
    }

    return NextResponse.json(
      { ok: true, processed, failed: failures.length, failures, durationMs: Date.now() - startedAt },
      { status: 200 },
    );
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Sunucu hatası' }, { status });
  }
}


