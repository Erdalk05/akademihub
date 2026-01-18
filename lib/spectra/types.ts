// ============================================================================
// SPECTRA - SHARED TYPES (v2.0)
// Wizard + API + UI için ortak tipler
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// EXAM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ExamType = 'LGS' | 'TYT' | 'AYT' | 'DENEME' | 'KONU_TEST' | 'YAZILI';
export type ExamStatus = 'draft' | 'ready' | 'active' | 'archived';
export type GradeLevel = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'mezun';

export interface Exam {
  id: string;
  organization_id: string;
  name: string;
  exam_date: string;
  exam_type: ExamType;
  grade_level?: GradeLevel;
  total_questions?: number;
  description?: string;
  status: ExamStatus;
  created_at: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface LessonConfig {
  lesson_id?: string;
  code: string;
  name: string;
  question_count: number;
  start_index: number;
  end_index: number;
  weight?: number;
}

export interface ExamLessonConfig {
  exam_id: string;
  lessons: LessonConfig[];
  total_questions: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER KEY
// ─────────────────────────────────────────────────────────────────────────────

export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E' | null;

export interface AnswerKeyItem {
  question_number: number;
  correct_answer: AnswerOption;
  lesson_code: string;
  is_cancelled?: boolean;
  booklet_answers?: Record<string, AnswerOption>; // { A: 'A', B: 'C', ... }
}

export interface ExamAnswerKey {
  exam_id: string;
  items: AnswerKeyItem[];
  total_questions: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT
// ─────────────────────────────────────────────────────────────────────────────

export type ParticipantType = 'institution' | 'guest';
export type MatchStatus = 'matched' | 'pending' | 'not_found' | 'error';

export interface ExamParticipant {
  id: string;
  exam_id: string;
  organization_id: string;
  student_id?: string;
  participant_type: ParticipantType;
  participant_name: string;
  guest_name?: string;
  guest_class?: string;
  class_name?: string;
  match_status: MatchStatus;
  answers?: string; // JSON array of answers
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAM RESULT
// ─────────────────────────────────────────────────────────────────────────────

export interface LessonBreakdown {
  lesson_id?: string;
  lesson_code: string;
  lesson_name: string;
  correct: number;
  wrong: number;
  empty: number;
  cancelled?: number;
  net: number;
  weighted_score?: number;
}

export interface ExamResult {
  id: string;
  exam_participant_id: string;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  total_cancelled?: number;
  total_net: number;
  total_score: number;
  lesson_breakdown: LessonBreakdown[];
  scoring_snapshot?: object;
  calculated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD STEP DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardStep1Data {
  examName: string;
  examDate: string;
  examType: ExamType;
  gradeLevel: GradeLevel | null;
  description?: string;
}

export interface WizardStep2Data {
  lessons: LessonConfig[];
  totalQuestions: number;
}

export interface WizardStep3Data {
  answerKey: AnswerKeyItem[];
  source: 'manual' | 'template' | 'excel';
  templateId?: string;
}

export interface WizardStep4Data {
  confirmed: boolean;
  notes?: string;
}

export interface WizardState {
  examId?: string;
  organizationId: string;
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: number[];
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  step3: WizardStep3Data;
  step4: WizardStep4Data;
  isDraft: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamSummary {
  exam: {
    id: string;
    name: string;
    exam_date: string;
    exam_type: ExamType;
    status: ExamStatus;
    total_questions?: number;
  };
  organization: {
    id: string;
    name: string;
  };
  participantCount: number;
  resultsCount: number;
  statistics?: {
    averageNet: number;
    maxNet: number;
    minNet: number;
    medianNet?: number;
  };
}

export interface ResultsRow {
  rank: number;
  participantId: string;
  resultId: string; // exam_results.id for replay
  participantName: string;
  className?: string;
  participantType: ParticipantType;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNet: number;
  totalScore: number;
  lessonBreakdown: LessonBreakdown[];
}

export interface ResultsResponse {
  rows: ResultsRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta: {
    examId: string;
    examName: string;
    examDate: string;
    organizationName: string;
    participantCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTICAL PARSING
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedParticipant {
  lineNumber: number;
  rawData: string;
  studentNo?: string;
  studentName: string;
  tcNo?: string;
  className?: string;
  booklet?: 'A' | 'B' | 'C' | 'D';
  answers: AnswerOption[];
  errors: string[];
  matchStatus: MatchStatus;
}

export interface OpticalParseResult {
  success: boolean;
  fileName?: string;
  templateName?: string;
  totalLines: number;
  successfulLines: number;
  errorLines: number;
  participants: ParsedParticipant[];
  errors: string[];
  warnings: string[];
}

export interface OpticalUploadResult {
  insertedParticipants: number;
  insertedResults: number;
  updatedResults: number;
  errors: string[];
  warnings: string[];
}
