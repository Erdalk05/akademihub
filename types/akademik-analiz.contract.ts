// Ortak type tanımlamaları

export interface Exam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: 'LGS' | 'TYT' | 'AYT';
  created_at: string;
  organization_id: string;
  total_students: number;
  average_net: number;
  status: 'completed' | 'processing' | 'draft';
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  student_no: string;
  grade_level: string;
  class_id: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  booklet_type: string;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  total_net: number;
  rank_in_school?: number;
  rank_in_class?: number;
  subjects?: SubjectResult[];
}

export interface SubjectResult {
  subject_name: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  percentage: number;
}

export interface DashboardStats {
  totalExams: number;
  totalStudents: number;
  averageNet: number;
  thisMonthExams: number;
  topStudents: Array<{
    student: Student;
    averageNet: number;
    examCount: number;
  }>;
  riskStudents: Array<{
    student: Student;
    lastNet: number;
    trend: number;
  }>;
}
