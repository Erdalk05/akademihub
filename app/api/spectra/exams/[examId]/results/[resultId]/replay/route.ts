// ============================================================================
// SPECTRA - REPLAY API
// Route: /api/spectra/exams/[examId]/results/[resultId]/replay
// Puanın nasıl hesaplandığını adım adım yeniden oynatır
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { replayScore } from '@/lib/replay-engine/replayEngine';
import { writeExamAuditLog } from '@/lib/audit/examAudit';
import type { ExamResultRow } from '@/lib/replay-engine/replayTypes';
import {
  SnapshotMissingError,
  EngineVersionMismatchError,
  InvalidSnapshotError,
} from '@/lib/replay-engine/replayErrors';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string; resultId: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Replay Score (Puanı yeniden hesapla ve karşılaştır)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();

  try {
    const { examId, resultId } = await params;

    if (!examId || !resultId) {
      return NextResponse.json(
        { success: false, message: 'examId ve resultId gerekli' },
        { status: 400 }
      );
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const includeSteps = searchParams.get('include_steps') === 'true';
    const validateVersion = searchParams.get('validate_version') === 'true';

    const supabase = getServiceRoleClient();

    // 1. exam_results kaydını al
    const { data: result, error: resultError } = await supabase
      .from('exam_results')
      .select(`
        id,
        exam_participant_id,
        total_correct,
        total_wrong,
        total_empty,
        total_cancelled,
        total_net,
        total_score,
        lesson_breakdown,
        scoring_snapshot,
        calculated_at
      `)
      .eq('id', resultId)
      .single();

    if (resultError || !result) {
      return NextResponse.json(
        { success: false, message: 'Sonuç bulunamadı' },
        { status: 404 }
      );
    }

    // 2. Participant bilgisini al (audit için)
    const { data: participant } = await supabase
      .from('exam_participants')
      .select('student_id, organization_id')
      .eq('id', result.exam_participant_id)
      .single();

    // 3. Replay çalıştır
    try {
      const replayResult = replayScore(result as ExamResultRow, {
        includeSteps,
        validateVersion,
      });

      const processingTime = Date.now() - startTime;

      // 4. Audit log yaz
      await writeExamAuditLog({
        action: 'RECALC',
        entityType: 'exam_result',
        entityId: resultId,
        examId: examId,
        studentId: participant?.student_id || null,
        organizationId: participant?.organization_id || null,
        description: `Replay executed: ${replayResult.status}`,
        metadata: {
          status: replayResult.status,
          engine_version: replayResult.metadata.engine_version,
          preset: replayResult.metadata.preset,
          hasDiff: replayResult.status === 'INCONSISTENT',
          diff: replayResult.diff,
          processing_time_ms: processingTime,
        },
      });

      // 5. Başarılı response
      return NextResponse.json({
        success: true,
        replay: replayResult,
        processing_time_ms: processingTime,
      });

    } catch (error: any) {
      // Replay-specific hatalar
      if (error instanceof SnapshotMissingError) {
        return NextResponse.json({
          success: false,
          error: 'SNAPSHOT_MISSING',
          message: 'Bu sonuç için scoring snapshot bulunamadı. Replay yapılamaz.',
          detail: error.message,
        }, { status: 404 });
      }

      if (error instanceof EngineVersionMismatchError) {
        return NextResponse.json({
          success: false,
          error: 'VERSION_MISMATCH',
          message: 'Engine version uyuşmazlığı tespit edildi.',
          detail: error.message,
        }, { status: 409 });
      }

      if (error instanceof InvalidSnapshotError) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_SNAPSHOT',
          message: 'Snapshot formatı geçersiz.',
          detail: error.message,
        }, { status: 422 });
      }

      throw error; // Diğer hatalar için genel handler'a düş
    }

  } catch (error: unknown) {
    console.error('[REPLAY] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    
    return NextResponse.json({
      success: false,
      error: 'REPLAY_FAILED',
      message: 'Replay işlemi başarısız oldu',
      detail: errorMessage,
    }, { status: 500 });
  }
}
