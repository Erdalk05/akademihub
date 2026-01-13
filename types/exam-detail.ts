// ============================================================================
// EXAM DETAIL - TYPE DEFINITIONS
// Sınav detay ekranı için interface tanımları
// ============================================================================

/**
 * Sınav temel bilgileri
 */
export interface Exam {
  id: string;
  organization_id: string;
  name: string;
  exam_type: 'LGS' | 'TYT' | 'AYT' | 'deneme';
  exam_date: string;
  total_questions: number;
  is_published: boolean;
  created_at: string;
}

/**
 * Sınav bölümü (ders bazlı)
 */
export interface ExamSection {
  id: string;
  exam_id: string;
  name: string;
  code: string;
  question_count: number;
  sort_order: number;
}

/**
 * Sınav katılımcısı
 */
export interface ExamParticipant {
  id: string;
  exam_id: string;
  organization_id: string;
  person_id: string | null;
  student_id: string | null;
  participant_type: 'institution' | 'guest';
  guest_name: string | null;
  match_status?: string;
  match_confidence?: number;
  created_at: string;
}

/**
 * Katılımcı sonucu
 */
export interface ExamResult {
  id: string;
  exam_participant_id: string;
  total_correct: number;
  total_wrong: number;
  total_blank: number;
  total_net: number;
  class_rank: number | null;
  organization_rank: number | null;
  percentile: number | null;
  created_at: string;
}

/**
 * Bölüm bazlı sonuç (ders bazlı)
 */
export interface ExamResultSection {
  id: string;
  exam_result_id: string;
  exam_section_id: string;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  net: number;
}

/**
 * UI için birleşik öğrenci satırı
 */
export interface StudentTableRow {
  rank: number | null;
  participantId: string;
  studentId: string | null;
  studentNo: string | null;
  name: string;
  className: string | null;
  participantType: 'institution' | 'guest';
  matchStatus: string | null;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalNet: number;
  percentile: number | null;
}

/**
 * Sınav istatistikleri
 */
export interface ExamStatistics {
  totalParticipants: number;
  institutionCount: number;
  guestCount: number;
  pendingMatchCount: number;
  averageNet: number;
  maxNet: number;
  minNet: number;
  medianNet: number;
  stdDeviation: number;
}

/**
 * Filtreleme ve sıralama kriterleri
 */
export interface StudentFilters {
  search?: string;
  classId?: string;
  participantType?: 'institution' | 'guest' | 'all';
  sortBy?: 'rank' | 'name' | 'net' | 'percentile';
  sortOrder?: 'asc' | 'desc';
}
