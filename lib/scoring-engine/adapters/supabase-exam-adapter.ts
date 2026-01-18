// ============================================================================
// SCORING ENGINE - SUPABASE EXAM ADAPTER (v1.0)
// READ-ONLY Supabase integration for exam data
// Fetches exam data and converts to WizardPayload format
// Pure TypeScript, no scoring logic, no writes
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * WizardPayload type (re-declared for clarity, matches wizard-adapter.ts)
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
 * Builds WizardPayload from Supabase exam data (READ-ONLY)
 * 
 * Data Flow:
 * 1. Fetch exam meta (preset_name, booklet_type)
 * 2. Fetch answer key (correct_option for each question)
 * 3. Fetch cancelled questions (if any)
 * 4. Fetch student answers
 * 5. Assemble WizardPayload
 * 
 * @param supabaseClient - Supabase client instance
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns WizardPayload ready for adapter
 * @throws Error if exam not found or answer key missing
 */
export async function buildWizardPayloadFromSupabaseExam(
  supabaseClient: SupabaseClient<any>,
  examId: string,
  studentId: string
): Promise<WizardPayload> {
  
  // ========================================
  // 1. Fetch Exam Meta
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
  // Assume exam_type values: "LGS", "TYT", "AYT_SAY", etc.
  const presetName = exam.exam_type || 'LGS';

  // Default booklet type (will be overridden by student-specific booklet if available)
  let bookletType: 'A' | 'B' | 'C' | 'D' = 'A';

  // ========================================
  // 2. Fetch Answer Key
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
  // 3. Fetch Cancelled Questions (optional)
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
  // 4. Fetch Student Answers
  // ========================================
  
  // First, try to get student's booklet type from exam_participants
  const { data: participantData } = await supabaseClient
    .from('exam_participants')
    .select('booklet_type')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .single();

  if (participantData?.booklet_type) {
    bookletType = participantData.booklet_type as 'A' | 'B' | 'C' | 'D';
  }

  // Fetch student's marked answers from exam_results or exam_student_answers
  // (Assuming exam_student_answers table exists based on prompt)
  const { data: studentAnswersData } = await supabaseClient
    .from('exam_student_answers')
    .select('question_no, marked_option')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .order('question_no');

  // If exam_student_answers doesn't exist, try alternative: raw_answers JSON from exam_results
  let studentAnswers: Array<{ questionNo: number; markedOption: string | null }> = [];

  if (studentAnswersData && studentAnswersData.length > 0) {
    studentAnswers = studentAnswersData.map((item: any) => ({
      questionNo: item.question_no,
      markedOption: item.marked_option,
    }));
  } else {
    // Fallback: try to get raw_answers from exam_results
    const { data: resultData } = await supabaseClient
      .from('exam_results')
      .select('raw_answers')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();

    if (resultData?.raw_answers && Array.isArray(resultData.raw_answers)) {
      studentAnswers = resultData.raw_answers.map((ans: any, index: number) => ({
        questionNo: index + 1,
        markedOption: ans,
      }));
    }
  }

  // If still no student answers, return empty array (allowed)
  if (studentAnswers.length === 0) {
    studentAnswers = answerKey.map(q => ({
      questionNo: q.questionNo,
      markedOption: null,
    }));
  }

  // ========================================
  // 5. Assemble WizardPayload
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
