// ============================================================================
// SCORING ENGINE - OPTICAL + SUPABASE ADAPTER (v1.0)
// Merges optical parsed answers with Supabase exam data
// Pure TypeScript, READ-ONLY Supabase, no scoring logic
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { parseOpticalJson, parseOpticalText } from './optical-adapter';

/**
 * OpticalJsonPayload type (re-declared for clarity)
 */
interface OpticalJsonPayload {
  bookletType: 'A' | 'B' | 'C' | 'D';
  answers: Array<{
    questionNo: number;
    markedOption: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    confidence?: number;
  }>;
}

/**
 * WizardPayload type (re-declared for clarity)
 */
interface WizardPayload {
  presetName: string;
  bookletType: 'A' | 'B' | 'C' | 'D';
  answerKey: Array<{
    questionNo: number;
    correctOption: string;
    lessonCode?: string;
  }>;
  studentAnswers: Array<{
    questionNo: number;
    markedOption: string | null;
  }>;
  cancelledQuestions?: Array<{
    questionNo: number;
    policy?: 'exclude_from_total' | 'count_as_correct';
  }>;
  studentId?: string;
}

/**
 * Builds WizardPayload from optical output + Supabase exam data
 * 
 * Data Flow:
 * 1. Parse optical payload (JSON or text)
 * 2. Read exam meta from Supabase (preset_name)
 * 3. Read answer key from Supabase
 * 4. Read cancelled questions from Supabase (if any)
 * 5. Merge: booklet + studentAnswers from optical, rest from Supabase
 * 6. Return WizardPayload
 * 
 * Merge Rules:
 * - bookletType: FROM optical
 * - studentAnswers: FROM optical
 * - answerKey: FROM Supabase
 * - cancelledQuestions: FROM Supabase
 * - presetName: FROM Supabase
 * 
 * @param supabaseClient - Supabase client instance
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @param optical - Optical payload (JSON or text)
 * @returns WizardPayload ready for adapter
 * @throws Error if exam not found or answer key missing
 */
export async function buildWizardPayloadFromOpticalAndSupabase(
  supabaseClient: SupabaseClient<any>,
  examId: string,
  studentId: string,
  optical:
    | { type: 'json'; payload: OpticalJsonPayload }
    | { type: 'text'; payload: string }
): Promise<WizardPayload> {
  
  // ========================================
  // 1. Parse Optical Payload
  // ========================================
  const parsedOptical =
    optical.type === 'json'
      ? parseOpticalJson(optical.payload)
      : parseOpticalText(optical.payload);

  const { bookletType, studentAnswers: opticalAnswers } = parsedOptical;

  // ========================================
  // 2. Fetch Exam Meta from Supabase
  // ========================================
  const { data: exam, error: examError } = await supabaseClient
    .from('exams')
    .select('id, exam_type, grade_level')
    .eq('id', examId)
    .single();

  if (examError || !exam) {
    throw new Error('Exam not found');
  }

  // Map exam_type to presetName
  const presetName = exam.exam_type || 'LGS';

  // ========================================
  // 3. Fetch Answer Key from Supabase
  // ========================================
  const { data: answerKeyData, error: answerKeyError } = await supabaseClient
    .from('exam_answer_keys')
    .select('question_number, correct_answer, section_code')
    .eq('exam_id', examId)
    .order('question_number');

  if (answerKeyError) {
    throw new Error(`Failed to fetch answer key: ${answerKeyError.message}`);
  }

  if (!answerKeyData || answerKeyData.length === 0) {
    throw new Error('Answer key missing');
  }

  const answerKey = answerKeyData.map((item: any) => ({
    questionNo: item.question_number,
    correctOption: item.correct_answer || 'A',
    lessonCode: item.section_code || 'UNKNOWN',
  }));

  // ========================================
  // 4. Fetch Cancelled Questions from Supabase
  // ========================================
  const { data: cancelledData } = await supabaseClient
    .from('exam_answer_keys')
    .select('question_number, is_cancelled')
    .eq('exam_id', examId)
    .eq('is_cancelled', true);

  const cancelledQuestions = cancelledData?.map((item: any) => ({
    questionNo: item.question_number,
    policy: 'exclude_from_total' as const,
  })) || [];

  // ========================================
  // 5. Convert Optical Answers to WizardPayload Format
  // ========================================
  const studentAnswers = opticalAnswers.map(answer => ({
    questionNo: answer.questionNumber,
    markedOption: answer.markedAnswer,
  }));

  // ========================================
  // 6. Assemble WizardPayload
  // ========================================
  return {
    presetName,
    bookletType,
    answerKey,
    studentAnswers,
    cancelledQuestions: cancelledQuestions.length > 0 ? cancelledQuestions : undefined,
    studentId,
  };
}
