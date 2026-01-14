// ============================================================================
// SPECTRA RECALCULATE API v2.0
// Tüm öğrenciler için puanları yeniden hesaplar — ANAYASA UYUMLU
// ============================================================================
// BU DOSYA:
// - Core engine'i kullanır (hesaplama burada YOK)
// - Supabase'den veri okur
// - Sonuçları JSON döner (backward compat)
// - Sonuçları exam_results tablosuna YAZAR (v2.0 yeni özellik)
// - ANAYASA + EK PROTOKOL kararlarına uygun
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateBatchScores,
  type AnswerKey,
  type StudentAnswers,
  type ScoringConfig,
} from '@/lib/spectra-scoring/engine';

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────────────────────────────────────
// POST: RECALCULATE
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const startTime = Date.now();
  const examId = params.examId;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1️⃣ AUTH KONTROLÜ
    // ─────────────────────────────────────────────────────────────────────────

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'MISSING_AUTH' },
        { status: 401 }
      );
    }

    // Token'dan user bilgisi al (Supabase auth)
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2️⃣ EXAM VAR MI KONTROLÜ
    // ─────────────────────────────────────────────────────────────────────────

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, organization_id')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found', code: 'EXAM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3️⃣ CEVAP ANAHTARINI ÇEK (exam_answer_keys)
    // ─────────────────────────────────────────────────────────────────────────

    const { data: answerKeysRaw, error: keysError } = await supabase
      .from('exam_answer_keys')
      .select('lesson_id, question_number, correct_answer, booklet_type')
      .eq('exam_id', examId)
      .order('question_number', { ascending: true });

    if (keysError || !answerKeysRaw || answerKeysRaw.length === 0) {
      return NextResponse.json(
        {
          error: 'Answer keys not found',
          code: 'MISSING_ANSWER_KEYS',
          message: 'Bu sınav için cevap anahtarı tanımlanmamış',
        },
        { status: 400 }
      );
    }

    const answerKeys: AnswerKey[] = answerKeysRaw.map((key: any) => ({
      lesson_id: key.lesson_id,
      question_number: key.question_number,
      correct_answer: key.correct_answer,
      booklet_type: key.booklet_type,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // 4️⃣ PUANLAMA CONFIG'İNİ ÇEK (exam_scoring_configs)
    // ─────────────────────────────────────────────────────────────────────────

    const { data: scoringRaw, error: scoringError } = await supabase
      .from('exam_scoring_configs')
      .select('*')
      .eq('exam_id', examId)
      .single();

    if (scoringError || !scoringRaw) {
      return NextResponse.json(
        {
          error: 'Scoring config not found',
          code: 'MISSING_SCORING_CONFIG',
          message: 'Bu sınav için puanlama kuralları tanımlanmamış',
        },
        { status: 400 }
      );
    }

    const scoringConfig: ScoringConfig = {
      scoring_type: scoringRaw.scoring_type || 'preset',
      preset_name: scoringRaw.preset_name || null,
      correct_score: scoringRaw.correct_score || 1.0,
      wrong_penalty: scoringRaw.wrong_penalty || 0.25,
      empty_score: scoringRaw.empty_score || 0,
      cancelled_question_policy: scoringRaw.cancelled_question_policy || 'count_as_correct',
      lesson_weights: scoringRaw.lesson_weights || null,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 5️⃣ ÖĞRENCİ CEVAPLARINI ÇEK (exam_student_answers)
    // ─────────────────────────────────────────────────────────────────────────

    const { data: studentsRaw, error: studentsError } = await supabase
      .from('exam_student_answers')
      .select('id, student_id, participant_name, participant_identifier, booklet_type, answers')
      .eq('exam_id', examId);

    if (studentsError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch student answers',
          code: 'STUDENT_FETCH_ERROR',
          details: studentsError.message,
        },
        { status: 500 }
      );
    }

    if (!studentsRaw || studentsRaw.length === 0) {
      return NextResponse.json(
        {
          error: 'No student answers found',
          code: 'NO_STUDENTS',
          message: 'Bu sınav için öğrenci cevabı bulunmuyor',
        },
        { status: 400 }
      );
    }

    // student_answer_id'yi de sakla (exam_results için gerekli)
    const studentsAnswers: (StudentAnswers & { student_answer_id: string })[] = studentsRaw.map((s: any) => ({
      student_answer_id: s.id,
      student_id: s.student_id,
      participant_name: s.participant_name,
      participant_identifier: s.participant_identifier,
      booklet_type: s.booklet_type,
      answers: s.answers, // JSON array
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // 6️⃣ CORE ENGINE İLE HESAPLAMA (lib/spectra-scoring/engine.ts)
    // ─────────────────────────────────────────────────────────────────────────

    const results = calculateBatchScores(answerKeys, studentsAnswers, scoringConfig);

    // Başarılı ve hatalı sonuçları ayır
    const successful = results.filter((r: any) => r.calculation_timestamp);
    const failed = results.filter((r: any) => r.error_code);

    // ─────────────────────────────────────────────────────────────────────────
    // 7️⃣ SONUÇLARI exam_results TABLOSUNA YAZ (v2.0 YENİ)
    // ─────────────────────────────────────────────────────────────────────────

    // Scoring snapshot oluştur
    const scoringSnapshot = {
      scoring_type: scoringConfig.scoring_type,
      preset_name: scoringConfig.preset_name,
      correct_score: scoringConfig.correct_score,
      wrong_penalty: scoringConfig.wrong_penalty,
      empty_score: scoringConfig.empty_score,
      cancelled_question_policy: scoringConfig.cancelled_question_policy,
      lesson_weights: scoringConfig.lesson_weights,
    };

    // Önce mevcut sonuçları sil (DELETE)
    const { error: deleteError } = await supabase
      .from('exam_results')
      .delete()
      .eq('exam_id', examId);

    if (deleteError) {
      console.error('[Recalculate] Delete error:', deleteError);
      // Devam et - yeni kayıt eklenebilir
    }

    // Başarılı sonuçları INSERT
    if (successful.length > 0) {
      const examResultsRows = successful.map((result: any, index: number) => {
        const studentData = studentsAnswers[index];
        return {
          exam_id: examId,
          student_answer_id: studentData.student_answer_id,
          student_id: result.student_id || null,
          participant_name: studentData.participant_name,
          participant_identifier: result.participant_identifier,
          booklet_type: studentData.booklet_type,
          total_correct: result.total_correct,
          total_wrong: result.total_wrong,
          total_empty: result.total_empty,
          total_cancelled: result.total_cancelled || 0,
          total_net: result.total_net,
          total_score: result.total_score,
          lesson_breakdown: result.lesson_breakdown,
          scoring_snapshot: scoringSnapshot,
          calculated_at: result.calculation_timestamp,
        };
      });

      const { error: insertError } = await supabase
        .from('exam_results')
        .insert(examResultsRows);

      if (insertError) {
        console.error('[Recalculate] Insert error:', insertError);
        // Hata logla ama response'u bozma (backward compat)
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8️⃣ JSON RESPONSE DÖNÜŞÜ (backward compatibility)
    // ─────────────────────────────────────────────────────────────────────────

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      exam_id: examId,
      calculation_timestamp: new Date().toISOString(),
      duration_ms: duration,
      stats: {
        total_students: studentsRaw.length,
        calculated: successful.length,
        failed: failed.length,
      },
      results: {
        successful,
        failed,
      },
      meta: {
        total_questions: answerKeys.length,
        scoring_type: scoringConfig.scoring_type,
        preset_name: scoringConfig.preset_name,
      },
    });
  } catch (error) {
    console.error('[Recalculate API] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: RECALCULATION STATUS (opsiyonel — gelecek için)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  // Gelecekte: Son hesaplama zamanı, durum, vs. döndürülebilir
  return NextResponse.json({
    message: 'Recalculate status endpoint — coming soon',
    exam_id: params.examId,
  });
}
