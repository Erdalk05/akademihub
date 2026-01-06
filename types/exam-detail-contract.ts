/**
 * Exam Intelligence - UI/Report Data Contract (v1)
 * ------------------------------------------------
 * Amaç: UI + PDF/Excel export + API arasında tek sözleşme (tek gerçek contract).
 * Not: Veri kaynağı (legacy/new snapshot) bu contract'ın arkasında değişebilir.
 */

export type StudentType = 'asil' | 'misafir';

export type ExamDetailSubject = {
  code: string; // TUR, MAT, FEN...
  label: string; // Türkçe, Matematik...
  key: string; // tablo kolon anahtarı (legacy: dinamik net kolonları)
};

export type NetHistogramBucket = {
  label: string; // "0-20"
  min: number;
  max: number | null; // null => "80+"
  count: number;
  percentage: number; // 0-100
};

export type ExamDetailStudentRowV1 = {
  /** Legacy student_exam_results.id veya exam_student_results.student_id bazlı sentetik id */
  rowId: string;

  /** Kurum öğrencisi ise dolu; misafir ise null olabilir */
  studentId: string | null;
  studentNo: string | null;
  fullName: string;
  className: string | null;

  studentType: StudentType;

  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalNet: number;
  totalScore: number | null;

  rankSchool: number | null;
  rankClass: number | null;

  /** Ders bazlı netler: { TUR: 15.5, MAT: 12.0, ... } */
  subjectNets: Record<string, number>;

  /** Finans: sadece asil öğrencilerde beklenir */
  finance?: {
    totalAmount: number;
    paidAmount: number;
    balance: number;
    overdueCount: number;
    pendingCount: number;
  };

  /** AI: hazır/pending/fallback gibi */
  ai?: {
    status: 'ready' | 'pending' | 'failed' | 'not_configured';
    summary?: string;
    confidenceScore?: number;
    source?: 'ai' | 'fallback';
    updatedAt?: string;
  };
};

export type ExamDetailContractV1 = {
  version: 'v1';
  meta: {
    organizationId: string;
    examId: string;
    generatedAt: string;
    source: 'legacy_student_exam_results' | 'exam_student_analytics' | 'mixed';
    warnings: string[];
  };
  exam: {
    id: string;
    name: string;
    examDate: string | null;
    examType: string | null;
    gradeLevel: string | null;
    booklets?: string[];
  };
  summary: {
    participantCount: number;
    asilCount: number;
    misafirCount: number;
    avgNet: number;
    minNet: number;
    maxNet: number;
    medianNet: number;
    stdDev: number;
  };
  distributions: {
    netHistogram: NetHistogramBucket[];
    avgCorrect: number;
    avgWrong: number;
    avgBlank: number;
  };
  subjects: ExamDetailSubject[];
  classComparison: Array<{ className: string; avgNet: number; studentCount: number }>;
  students: ExamDetailStudentRowV1[];
};


