/**
 * Exam Analytics V2 - Data Contract
 * 
 * Foundational type definitions for exam-based analytics engine.
 * Supports 20+ exams/year across grade levels 4–12 + graduates.
 */

// ============================================================================
// EXAM CONTEXT
// ============================================================================

export interface ExamContext {
  examId: string;
  examName: string;
  examDate: string;
  examType: string;
  gradeLevel: string;
  totalQuestions: number;
  participantCount: number;
}

export interface ComparisonContext {
  type: 'previous' | 'average' | null;
  examId?: string;
  examName?: string;
  examDate?: string;
}

// ============================================================================
// SUMMARY KPIs
// ============================================================================

export interface ExamSummaryKPIs {
  totalParticipants: number;
  averageNet: number;
  averageScore: number;
  strongestSubject: {
    code: string;
    name: string;
    average: number;
  } | null;
  weakestSubject: {
    code: string;
    name: string;
    average: number;
  } | null;
  // Comparison deltas (null if no comparison)
  deltaParticipants?: number | null;
  deltaAverageNet?: number | null;
  deltaPercentage?: number | null;
}

// ============================================================================
// CLASS-LEVEL DATA
// ============================================================================

export interface ClassPerformance {
  className: string;
  participantCount: number;
  averageNet: number;
  averageScore: number;
  rank: number;
  // Comparison deltas (null if no comparison)
  deltaNet?: number | null;
  deltaRank?: number | null;
}

// ============================================================================
// SUBJECT-LEVEL DATA
// ============================================================================

export interface SubjectPerformance {
  subjectCode: string;
  subjectName: string;
  averageNet: number;
  averageCorrect: number;
  averageWrong: number;
  averageEmpty: number;
  maxQuestions: number;
  successRate: number; // percentage
  // Comparison deltas (null if no comparison)
  deltaNet?: number | null;
  deltaSuccessRate?: number | null;
}

// ============================================================================
// TIME DIMENSION (V2.1)
// ============================================================================

export interface ExamTrendPoint {
  examId: string;
  examName: string;
  examDate: string;
  averageNet: number;
}

export interface ExamTrends {
  lastExams: ExamTrendPoint[];   // ordered by date asc
  windowSize: number;              // e.g. 3, 5, 10
}

// ============================================================================
// MAIN RESPONSE CONTRACT
// ============================================================================

export interface ExamDashboardResponse {
  examContext: ExamContext;
  comparisonContext: ComparisonContext;
  summary: ExamSummaryKPIs;
  classByClass: ClassPerformance[];
  subjectBySubject: SubjectPerformance[];
  trends?: ExamTrends;
  // Metadata
  meta: {
    calculatedAt: string;
    dataSource: 'student_exam_results' | 'exam_student_results';
    hasComparison: boolean;
  };
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface ExamAnalyticsRequest {
  examId: string;
  gradeLevel: string;
  compareWith?: 'previous' | 'average';
}

