// ============================================
// SPECTRA MODULE TYPES
// ============================================

export interface SpectraStats {
  totalExams: number;
  totalParticipants: number;
  avgNet: number;
  avgNetChange: number; // % change from last period
  topClass: string;
  topClassAvg: number;
  lastExamDate: string;
  lastExamName: string;
  pendingMatches: number;
  asilCount: number;
  misafirCount: number;
  avgSuccess: number; // percentage
  thisMonthExams: number;
}

export interface SpectraExam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  grade_level: string;
  total_questions: number;
  participant_count: number;
  avg_net: number;
  created_at: string;
}

export interface SpectraParticipant {
  id: string;
  exam_id: string;
  student_id: string | null; // null = misafir
  guest_name: string | null;
  guest_tc: string | null;
  class_name: string;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  net: number;
  score: number;
  rank: number;
  is_asil: boolean;
}

export interface SpectraClassComparison {
  className: string;
  avgNet: number;
  studentCount: number;
  topNet: number;
  bottomNet: number;
}

export interface SpectraExamDetail {
  exam: SpectraExam;
  participants: SpectraParticipant[];
  classComparison: SpectraClassComparison[];
  statistics: {
    avgNet: number;
    medianNet: number;
    stdDev: number;
    maxNet: number;
    minNet: number;
    asilCount: number;
    misafirCount: number;
  };
}

// Dashboard kart tipleri
export interface SpectraDashboardCard {
  id: string;
  icon: string; // Lucide icon name
  title: string;
  description: string;
  href: string;
  color?: 'default' | 'primary' | 'warning' | 'danger';
}

