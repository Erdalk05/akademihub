// ============================================================================
// SPECTRA - EXAM READINESS VALIDATION
// DB-backed readiness check for exam activation
// ============================================================================

import { getServiceRoleClient } from '@/lib/supabase/server';

export interface ExamReadinessResult {
  ready: boolean;
  blockingErrors: string[];
  checks: {
    examExists: boolean;
    answerKeyComplete: boolean;
    answerKeyStats: {
      expected: number;
      actual: number;
      percentage: number;
    };
    lessonsComplete: boolean;
    organizationLinked: boolean;
  };
}

/**
 * Validates if exam is ready for activation based on DB state
 * SINGLE SOURCE OF TRUTH - uses only DB, never wizard state
 */
export async function validateExamReadiness(
  examId: string
): Promise<ExamReadinessResult> {
  const supabase = getServiceRoleClient();
  const blockingErrors: string[] = [];

  // 1. Check exam exists
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, total_questions, organization_id, status')
    .eq('id', examId)
    .single();

  if (examError || !exam) {
    blockingErrors.push('Sınav kaydı bulunamadı');
    return {
      ready: false,
      blockingErrors,
      checks: {
        examExists: false,
        answerKeyComplete: false,
        answerKeyStats: { expected: 0, actual: 0, percentage: 0 },
        lessonsComplete: false,
        organizationLinked: false,
      },
    };
  }

  // 2. Check organization linked
  if (!exam.organization_id) {
    blockingErrors.push('Kurum bağlantısı eksik');
  }

  // 3. Check answer key (DB-backed)
  const { data: answerKeys, count: answerKeyCount } = await supabase
    .from('exam_answer_keys')
    .select('question_number, correct_answer', { count: 'exact' })
    .eq('exam_id', examId)
    .not('correct_answer', 'is', null); // Only count non-null answers

  const expected = exam.total_questions || 0;
  const actual = answerKeyCount || 0;
  const percentage = expected > 0 ? Math.round((actual / expected) * 100) : 0;

  const answerKeyComplete = actual === expected && expected > 0;

  if (!answerKeyComplete) {
    if (actual === 0) {
      blockingErrors.push('Cevap anahtarı tanımlanmadı');
    } else {
      blockingErrors.push(`Cevap anahtarı eksik: ${actual}/${expected} (${percentage}%)`);
    }
  }

  // 4. Check lessons (optional, but good to have)
  const { data: sections, count: sectionsCount } = await supabase
    .from('exam_sections')
    .select('id', { count: 'exact' })
    .eq('exam_id', examId);

  const lessonsComplete = (sectionsCount || 0) > 0;

  if (!lessonsComplete) {
    blockingErrors.push('Ders dağılımı tanımlanmadı');
  }

  // Final readiness
  const ready = blockingErrors.length === 0;

  if (process.env.NODE_ENV === 'development') {
    console.log('[ExamReadiness] Validation result:', {
      examId,
      ready,
      blockingErrors,
      answerKeyStats: { expected, actual, percentage },
    });
  }

  return {
    ready,
    blockingErrors,
    checks: {
      examExists: true,
      answerKeyComplete,
      answerKeyStats: { expected, actual, percentage },
      lessonsComplete,
      organizationLinked: !!exam.organization_id,
    },
  };
}
