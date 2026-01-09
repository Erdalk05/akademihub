// ============================================================================
// SPECTRA MODULE - TYPE DEFINITIONS
// Sınav Detay Sayfası için Tüm Tipler
// ============================================================================

// Sınav bilgisi
export interface Exam {
  id: string;
  organization_id: string;
  name: string;
  exam_type: string; // 'LGS', 'YKS', 'TYT', 'AYT', 'deneme'
  exam_date: string | null;
  total_questions: number;
  source: string; // 'optik', 'manual', 'import'
  is_published: boolean;
  created_at: string;
}

// Sınav bölümü (ders)
export interface ExamSection {
  id: string;
  exam_id: string;
  name: string; // 'Türkçe', 'Matematik'
  code: string; // 'TUR', 'MAT', 'FEN', 'SOS', 'ING', 'DIN'
  question_count: number;
  sort_order: number;
}

// Katılımcı
export interface ExamParticipant {
  id: string;
  exam_id: string;
  organization_id: string;
  person_id: string | null;
  student_id: string | null;
  participant_type: 'institution' | 'guest';
  guest_name: string | null;
  guest_school: string | null;
  guest_class: string | null;
  match_status: 'pending' | 'matched' | 'guest' | 'conflict';
  match_confidence: number | null;
  optical_student_no: string | null;
  optical_name: string | null;

  // İlişkili veriler (join)
  person?: {
    first_name: string;
    last_name: string;
    tc_no: string;
  };
  student?: {
    id: string;
    student_no: string;
    class?: {
      id: string;
      name: string;
    };
  };
  exam_results?: ExamResult[];
}

// Sonuç
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
  ai_analysis: any | null;

  // İlişkili veriler
  exam_result_sections?: ExamResultSection[];
}

// Ders bazlı sonuç
export interface ExamResultSection {
  id: string;
  exam_result_id: string;
  exam_section_id: string;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  net: number;

  // İlişkili
  exam_section?: ExamSection;
}

// Tablo satırı (birleştirilmiş veri)
export interface StudentTableRow {
  rank: number;
  participantId: string;
  studentId: string | null;
  studentNo: string;
  name: string;
  className: string;
  participantType: 'institution' | 'guest';
  matchStatus: string;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalNet: number;
  lgsScore: number; // Hesaplanmış
  percentile: number;
  sections: {
    sectionId: string;
    sectionName: string;
    sectionCode: string;
    correct: number;
    wrong: number;
    blank: number;
    net: number;
  }[];
}

// İstatistikler
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

  // Yeni alanlar
  successRate: number; // Başarı oranı (%)
  averageLGSScore: number; // Ortalama LGS tahmini

  maxNetStudent: { name: string; net: number; className?: string } | null;
  minNetStudent: { name: string; net: number; className?: string } | null;

  // En iyi/kötü 3 öğrenci
  topStudents: { name: string; net: number; className: string }[];
  bottomStudents: { name: string; net: number; className: string }[];

  sectionAverages: {
    sectionId: string;
    sectionName: string;
    sectionCode: string;
    questionCount: number; // Soru sayısı
    averageNet: number;
    averageCorrect: number;
    averageWrong: number;
    averageBlank: number; // Ortalama boş
    successRate: number; // Başarı oranı (%)
    maxNet: number; // En yüksek net
    minNet: number; // En düşük net
  }[];

  classAverages: {
    classId: string;
    className: string;
    studentCount: number;
    averageNet: number;
    sectionAverages: Record<string, number>; // Ders bazlı ortalamalar
  }[];

  netDistribution: {
    range: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
  }[];
}

// Kurum trend verisi
export interface OrganizationTrend {
  examId: string;
  examName: string;
  examDate: string;
  averageNet: number;
  participantCount: number;
}

// En iyi/kötü performans kartları için
export interface TopPerformer {
  name: string;
  net: number;
  className: string;
  rank: number;
}

// Filtreler
export interface StudentFilters {
  search: string;
  classId: string | null;
  participantType: 'all' | 'institution' | 'guest';
  sortBy: 'rank' | 'name' | 'net' | 'class';
  sortOrder: 'asc' | 'desc';
}

// Spectra Detail Page Data
export interface SpectraDetailData {
  exam: Exam;
  sections: ExamSection[];
  participants: ExamParticipant[];
  statistics: ExamStatistics;
  tableRows: StudentTableRow[];
}

// Export Options
export interface ExportOptions {
  type: 'excel' | 'pdf';
  includeCharts: boolean;
  includeSections: boolean;
  includeClassComparison: boolean;
  fileName?: string;
}

// Matching Modal Types
export interface MatchCandidate {
  studentId: string;
  studentNo: string;
  name: string;
  className: string;
  confidence: number;
}

export interface MatchingState {
  participantId: string;
  opticalName: string;
  opticalStudentNo: string;
  candidates: MatchCandidate[];
  selectedStudentId: string | null;
  isGuest: boolean;
}

