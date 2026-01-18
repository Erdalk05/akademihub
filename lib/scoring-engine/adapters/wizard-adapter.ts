// ============================================================================
// SCORING ENGINE - WIZARD ADAPTER (v1.0)
// Converts wizard-like payloads into ScoringInput format
// Pure TypeScript, no side effects, no scoring logic
// ============================================================================

import type { ScoringInput, QuestionAnswer, StudentAnswer, BookletType } from '@/types/scoring-engine.types';
import { getPresetByName } from '../presets';

/**
 * Wizard payload structure (mock, not real DB)
 * This represents data coming from a wizard-like interface
 */
interface WizardPayload {
  /** Preset name (e.g. "LGS", "TYT") */
  presetName: string;
  
  /** Student's booklet type */
  bookletType: 'A' | 'B' | 'C' | 'D';
  
  /** Answer key (correct answers) */
  answerKey: Array<{
    questionNo: number;
    correctOption: string;
    lessonCode?: string;
  }>;
  
  /** Student's answers */
  studentAnswers: Array<{
    questionNo: number;
    markedOption: string | null;
  }>;
  
  /** Cancelled questions (optional) */
  cancelledQuestions?: Array<{
    questionNo: number;
    policy?: 'exclude_from_total' | 'count_as_correct';
  }>;
  
  /** Student ID (optional) */
  studentId?: string;
}

/**
 * Adapts wizard payload to ScoringInput format
 * 
 * This is a pure transformation function that:
 * - Maps presetName to ScoringPreset
 * - Converts answerKey format
 * - Converts studentAnswers format
 * - Applies cancelled questions
 * - Does NOT perform any scoring
 * 
 * @param payload - Wizard payload
 * @returns ScoringInput ready for scoreExam()
 * @throws Error if presetName is invalid
 */
export function adaptWizardPayloadToScoringInput(payload: WizardPayload): ScoringInput {
  // Get preset by name
  const preset = getPresetByName(payload.presetName);
  
  if (!preset) {
    throw new Error(`Invalid preset name: "${payload.presetName}". Available: LGS, TYT, AYT_SAY, AYT_EA, AYT_SOZ, CUSTOM_NO_PENALTY`);
  }

  // Build cancelled questions set
  const cancelledSet = new Set<number>();
  if (payload.cancelledQuestions) {
    for (const cancelled of payload.cancelledQuestions) {
      // FAZ 1 only supports "exclude_from_total" (default)
      // "count_as_correct" will be implemented in future phase
      cancelledSet.add(cancelled.questionNo);
    }
  }

  // Convert answer key format
  const answerKey: QuestionAnswer[] = payload.answerKey.map(item => ({
    questionNumber: item.questionNo,
    correctAnswer: normalizeAnswerOption(item.correctOption),
    lessonCode: item.lessonCode || 'UNKNOWN',
    isCancelled: cancelledSet.has(item.questionNo),
  }));

  // Convert student answers format
  const studentAnswers: StudentAnswer[] = payload.studentAnswers.map(item => ({
    questionNumber: item.questionNo,
    markedAnswer: normalizeAnswerOption(item.markedOption),
    bookletType: payload.bookletType,
  }));

  return {
    answerKey,
    studentAnswers,
    preset,
    studentId: payload.studentId,
  };
}

/**
 * Normalizes answer option string to AnswerOption type
 * 
 * @param option - Raw string option (e.g. "A", "a", "null", null)
 * @returns Normalized AnswerOption ('A' | 'B' | 'C' | 'D' | 'E' | null)
 */
function normalizeAnswerOption(option: string | null | undefined): 'A' | 'B' | 'C' | 'D' | 'E' | null {
  if (!option || option === 'null' || option === '') {
    return null;
  }

  const normalized = option.toUpperCase().trim();

  if (['A', 'B', 'C', 'D', 'E'].includes(normalized)) {
    return normalized as 'A' | 'B' | 'C' | 'D' | 'E';
  }

  return null;
}
