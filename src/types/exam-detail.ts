// src/types/exam-detail.ts

// =========================
// 1) Exam
// =========================
export interface Exam {
    id: string;
    organization_id: string;
    name: string;
    exam_type: 'LGS' | 'TYT' | 'AYT' | 'deneme';
    exam_date: string | null;
    total_questions: number;
    is_published: boolean;
    created_at: string;
  }
  
  // =========================
  // 2) ExamSection
  // =========================
  export interface ExamSection {
    id: string;
    exam_id: string;
    name: string;
    code: string;
    question_count: number;
    sort_order: number;
  }
  
  // =========================
  // 3) ExamParticipant
  // =========================
  export interface ExamParticipant {
    id: string;
    exam_id: string;
    organization_id: string;
    person_id: string | null;
    student_id: string | null;
    participant_type: 'institution' | 'guest';
    guest_name: string | null;
    match_status: 'pending' | 'matched' | 'guest' | 'conflict';
    match_confidence: number | null;
    created_at: string;
  }
  
  // =========================
  // 4) ExamResult
  // =========================
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
  
  // =========================
  // 5) ExamResultSection
  // =========================
  export interface ExamResultSection {
    id: string;
    exam_result_id: string;
    exam_section_id: string;
    correct_count: number;
    wrong_count: number;
    blank_count: number;
    net: number;
  }
  
  // =========================
  // 6) StudentTableRow
  // (UI için birleşik tip)
  // =========================
  export interface StudentTableRow {
    rank: number;
    participantId: string;
    studentId: string | null;
    studentNo: string;
    name: string;
    className: string;
    participantType: 'institution' | 'guest';
    matchStatus: 'pending' | 'matched' | 'guest' | 'conflict';
    totalCorrect: number;
    totalWrong: number;
    totalBlank: number;
    totalNet: number;
    percentile: number | null;
  }
  
  // =========================
  // 7) ExamStatistics
  // =========================
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
  
  // =========================
  // 8) StudentFilters
  // =========================
  export interface StudentFilters {
    search: string;
    classId: string | null;
    participantType: 'all' | 'institution' | 'guest';
    sortBy: 'rank' | 'name' | 'net' | 'class';
    sortOrder: 'asc' | 'desc';
  }
  ÇŞÇ