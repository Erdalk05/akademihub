/* =========================================================
   SPECTRA DOMAIN TYPES
   Tek kaynak – tek gerçek
   ========================================================= */

/** Katılımcı tipi */
export type SpectraParticipantType = 'institution' | 'guest';

/** Sınav seviyesi */
export type SpectraGradeLevel =
  | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'mezun';

/** Ders bazlı sonuç */
export interface SpectraSectionResult {
  sectionId: string;
  sectionName: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
}

/** Öğrenci bazlı sınav sonucu */
export interface SpectraStudentResult {
  participantId: string;
  studentId?: string;

  name: string;
  studentNo?: string;
  className?: string;

  participantType: SpectraParticipantType;

  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalNet: number;

  rank?: number;
  percentile?: number;

  sectionResults: SpectraSectionResult[];
}

/** Genel istatistikler */
export interface SpectraStatistics {
  totalParticipants: number;
  institutionCount: number;
  guestCount: number;

  averageNet: number;
  maxNet: number;
  minNet: number;
  medianNet: number;
  standardDeviation: number;

  pendingMatchCount: number;
}

/** Net dağılımı (histogram için) */
export interface SpectraNetDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

/** Cevap dağılımı */
export interface SpectraAnswerDistribution {
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
}

/** Sınav detayının tamamı (tek response modeli) */
export interface SpectraExamDetail {
  examId: string;
  examName: string;
  examType: string;
  gradeLevel: SpectraGradeLevel;
  examDate: string;

  statistics: SpectraStatistics;

  netDistribution: SpectraNetDistributionItem[];
  answerDistribution: SpectraAnswerDistribution;

  students: SpectraStudentResult[];
}

/** Filtreleme & sıralama */
export interface SpectraFilters {
  search: string;
  className?: string;
  participantType?: 'institution' | 'guest' | 'all';

  sortBy: 'rank' | 'name' | 'net' | 'percentile';
  sortOrder: 'asc' | 'desc';
}
