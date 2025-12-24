// ============================================
// AkademiHub - Exam Assessment Types
// Version: 1.0
// ============================================

// ==================== TEMEL TİPLER ====================

export type ExamTypeCode = 'LGS' | 'TYT' | 'AYT_SAY' | 'AYT_EA' | 'AYT_SOZ' | 'AYT_DIL' | 'DENEME' | 'KURS';
export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E' | null;
export type EntryMethod = 'manual' | 'optical' | 'api';
export type CognitiveLevel = 1 | 2 | 3 | 4 | 5 | 6; // Bloom Taksonomisi

// ==================== SINAV TİPİ ====================

export interface ExamType {
  id: string;
  code: ExamTypeCode;
  name: string;
  description?: string;
  
  // Net Hesaplama
  wrongPenaltyDivisor: number; // 3 (LGS) veya 4 (TYT/AYT)
  
  // Puan Ağırlıkları
  scoreWeights?: Record<string, number>;
  
  // Yapı
  totalQuestions?: number;
  totalDurationMinutes?: number;
  
  isActive: boolean;
  organizationId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== DERS ====================

export interface ExamSubject {
  id: string;
  examTypeId: string;
  
  code: string; // 'TUR', 'MAT', 'FEN'
  name: string;
  shortName?: string;
  
  // Soru Dağılımı
  questionCount: number;
  questionStartNo: number;
  questionEndNo: number;
  
  // Ağırlık ve Görsel
  weight: number;
  displayOrder: number;
  color?: string;
  icon?: string;
  
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== KONU ====================

export interface ExamTopic {
  id: string;
  subjectId: string;
  parentId?: string; // Hiyerarşi için
  
  code: string;
  name: string;
  description?: string;
  
  level: number; // 0 = ana, 1 = alt, 2 = detay
  gradeLevel?: string;
  displayOrder: number;
  avgDifficulty?: number;
  
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // İlişkiler
  children?: ExamTopic[];
  learningOutcomes?: ExamLearningOutcome[];
}

// ==================== KAZANIM ====================

export interface ExamLearningOutcome {
  id: string;
  topicId: string;
  
  code: string; // 'T.8.1.2'
  name: string;
  description?: string;
  
  cognitiveLevel: CognitiveLevel;
  displayOrder: number;
  
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SINAV ====================

export interface Exam {
  id: string;
  examTypeId: string;
  academicYearId?: string;
  
  name: string;
  code?: string;
  description?: string;
  
  // Tarih/Saat
  examDate: Date;
  startTime?: string;
  endTime?: string;
  
  // Yapı
  totalQuestions: number;
  durationMinutes?: number;
  
  // Cevap Anahtarı
  answerKey?: Record<number, AnswerOption>;
  
  // Soru-Konu Eşleştirme
  questionMapping?: Record<number, {
    topicId?: string;
    difficulty?: number;
    learningOutcomeId?: string;
  }>;
  
  // Durum
  status: ExamStatus;
  isPublished: boolean;
  publishedAt?: Date;
  
  // İstatistik Cache
  statsCalculatedAt?: Date;
  statsCache?: ExamStatsCache;
  
  // Hedef Sınıflar
  targetClasses?: string[];
  
  organizationId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // İlişkiler
  examType?: ExamType;
  questions?: ExamQuestion[];
}

// ==================== SORU ====================

export interface ExamQuestion {
  id: string;
  examId: string;
  subjectId?: string;
  topicId?: string;
  learningOutcomeId?: string;
  
  questionNo: number;
  correctAnswer: AnswerOption;
  
  difficulty: number; // 0.0 - 1.0
  discrimination?: number; // -1.0 - 1.0
  
  // Soru İçeriği (opsiyonel)
  questionText?: string;
  questionImageUrl?: string;
  options?: Record<AnswerOption, string>;
  
  // İstatistikler
  totalAnswers: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  optionDistribution?: Record<AnswerOption, number>;
  
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // İlişkiler
  subject?: ExamSubject;
  topic?: ExamTopic;
  learningOutcome?: ExamLearningOutcome;
}

// ==================== ÖĞRENCİ CEVABI ====================

export interface ExamStudentAnswer {
  id: string;
  examId: string;
  studentId: string;
  questionId?: string;
  
  questionNo: number;
  givenAnswer: AnswerOption;
  
  isCorrect?: boolean;
  isEmpty: boolean;
  
  answerTimeSeconds?: number;
  
  organizationId?: string;
  createdAt: Date;
}

// ==================== ÖĞRENCİ SONUCU ====================

export interface ExamStudentResult {
  id: string;
  examId: string;
  studentId: string;
  
  // Genel Sonuçlar
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNet: number;
  
  // Puanlar
  rawScore?: number;
  scaledScore?: number;
  
  // Sıralama
  rankInExam?: number;
  rankInClass?: number;
  rankInSchool?: number;
  percentile?: number;
  
  // Detaylı Sonuçlar
  subjectResults?: SubjectResult;
  topicResults?: TopicResult;
  learningOutcomeResults?: LearningOutcomeResult;
  
  // AI Analiz
  aiAnalysis?: AIAnalysis;
  
  calculatedAt: Date;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // İlişkiler
  student?: StudentBasic;
  exam?: Exam;
}

// ==================== DETAYLI SONUÇ TİPLERİ ====================

export interface SubjectResult {
  [subjectCode: string]: {
    correct: number;
    wrong: number;
    empty: number;
    net: number;
    score?: number;
    rank?: number;
    percentile?: number;
  };
}

export interface TopicResult {
  [topicId: string]: {
    correct: number;
    wrong: number;
    total: number;
    rate: number; // 0.0 - 1.0
    status: 'excellent' | 'good' | 'average' | 'weak' | 'critical';
  };
}

export interface LearningOutcomeResult {
  [outcomeId: string]: {
    correct: number;
    total: number;
    rate: number;
    achieved: boolean;
  };
}

export interface AIAnalysis {
  overallAssessment: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  focusAreas: Array<{
    topicId: string;
    topicName: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  predictedScore?: {
    min: number;
    max: number;
    expected: number;
  };
  comparisons?: {
    vsClassAvg: number; // Sınıf ortalamasına göre fark
    vsSchoolAvg: number;
    vsPreviousExam?: number;
  };
}

// ==================== SINIF ANALİTİĞİ ====================

export interface ExamClassAnalytics {
  id: string;
  examId: string;
  className: string;
  
  // Katılım
  totalStudents: number;
  participatedStudents: number;
  participationRate: number;
  
  // İstatistikler
  avgCorrect: number;
  avgWrong: number;
  avgEmpty: number;
  avgNet: number;
  avgScore?: number;
  
  // Dağılım
  minNet: number;
  maxNet: number;
  medianNet: number;
  stdDeviation: number;
  
  // Detaylar
  subjectAverages?: Record<string, number>;
  topicSuccessRates?: Record<string, number>;
  difficultyAnalysis?: DifficultyAnalysis;
  
  calculatedAt: Date;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DifficultyAnalysis {
  easy: { count: number; avgCorrectRate: number };
  medium: { count: number; avgCorrectRate: number };
  hard: { count: number; avgCorrectRate: number };
}

// ==================== SORU ANALİTİĞİ ====================

export interface ExamQuestionAnalytics {
  id: string;
  examId: string;
  questionId: string;
  
  // Yanıt İstatistikleri
  totalAnswers: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  
  // Oranlar
  correctRate: number;
  emptyRate: number;
  
  // Seçenek Dağılımı
  optionACcount: number;
  optionBCount: number;
  optionCCount: number;
  optionDCount: number;
  optionECount: number;
  optionRates?: Record<AnswerOption, number>;
  
  // Analiz
  discriminationIndex: number;
  difficultyIndex: number;
  classBreakdown?: Record<string, number>;
  
  calculatedAt: Date;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== OPTİK FORM ====================

export interface ExamAnswerSheet {
  id: string;
  examId: string;
  studentId: string;
  
  // Cevaplar
  answersJson?: Record<number, AnswerOption>;
  answersString?: string;
  
  // Giriş Bilgileri
  entryMethod: EntryMethod;
  entryDevice?: string;
  
  // Optik Veri
  opticalScanData?: any;
  opticalConfidence?: number;
  
  // İşlem
  isProcessed: boolean;
  processedAt?: Date;
  
  // Hatalar
  validationErrors?: any[];
  warnings?: string[];
  
  organizationId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CACHE TİPLERİ ====================

export interface ExamStatsCache {
  participantCount: number;
  avgNet: number;
  avgScore?: number;
  maxNet: number;
  minNet: number;
  medianNet: number;
  stdDeviation: number;
  
  subjectStats: Record<string, {
    avgNet: number;
    avgCorrectRate: number;
    hardestQuestions: number[];
    easiestQuestions: number[];
  }>;
  
  classRankings: Array<{
    className: string;
    avgNet: number;
    participantCount: number;
    rank: number;
  }>;
  
  questionStats: Array<{
    questionNo: number;
    correctRate: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  
  calculatedAt: Date;
}

// ==================== INPUT TİPLERİ ====================

export interface CreateExamInput {
  examTypeId: string;
  academicYearId?: string;
  name: string;
  code?: string;
  description?: string;
  examDate: Date;
  startTime?: string;
  endTime?: string;
  totalQuestions: number;
  durationMinutes?: number;
  targetClasses?: string[];
  organizationId: string;
}

export interface UpdateExamInput {
  name?: string;
  code?: string;
  description?: string;
  examDate?: Date;
  startTime?: string;
  endTime?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  status?: ExamStatus;
  targetClasses?: string[];
  answerKey?: Record<number, AnswerOption>;
  questionMapping?: Record<number, any>;
}

export interface BulkAnswerInput {
  examId: string;
  studentId: string;
  answers: Array<{
    questionNo: number;
    answer: AnswerOption;
  }>;
  entryMethod?: EntryMethod;
}

export interface OpticalScanInput {
  examId: string;
  studentId: string;
  answersString: string; // "ABCD_ABCD..." boş için _
  opticalConfidence?: number;
  opticalScanData?: any;
}

// ==================== RAPOR TİPLERİ ====================

export interface StudentExamReport {
  student: StudentBasic;
  exam: Exam;
  result: ExamStudentResult;
  
  subjectDetails: Array<{
    subject: ExamSubject;
    correct: number;
    wrong: number;
    empty: number;
    net: number;
    rank: number;
    percentile: number;
  }>;
  
  topicAnalysis: Array<{
    topic: ExamTopic;
    correct: number;
    total: number;
    successRate: number;
    status: string;
  }>;
  
  comparisons: {
    classAvg: number;
    schoolAvg: number;
    ranking: {
      class: { rank: number; total: number };
      school: { rank: number; total: number };
    };
  };
  
  recommendations: string[];
}

export interface ClassExamReport {
  exam: Exam;
  className: string;
  analytics: ExamClassAnalytics;
  
  topPerformers: Array<{
    student: StudentBasic;
    net: number;
    rank: number;
  }>;
  
  needsAttention: Array<{
    student: StudentBasic;
    net: number;
    weakTopics: string[];
  }>;
  
  subjectBreakdown: Array<{
    subject: ExamSubject;
    avgNet: number;
    avgCorrectRate: number;
  }>;
  
  difficultQuestions: Array<{
    questionNo: number;
    correctRate: number;
    topic: ExamTopic;
  }>;
}

// ==================== YARDIMCI TİPLER ====================

export interface StudentBasic {
  id: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  enrolledClass?: string;
}

// ==================== NET HESAPLAMA ====================

export interface NetCalculation {
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  wrongPenaltyDivisor: number;
  formula: string;
}

export function calculateNet(
  correct: number,
  wrong: number,
  wrongPenaltyDivisor: number = 4
): NetCalculation {
  const penalty = wrong / wrongPenaltyDivisor;
  const net = correct - penalty;
  
  return {
    correct,
    wrong,
    empty: 0, // Caller tarafından set edilmeli
    net: Math.round(net * 100) / 100,
    wrongPenaltyDivisor,
    formula: `${correct} - (${wrong} / ${wrongPenaltyDivisor}) = ${net.toFixed(2)}`
  };
}

// ==================== EXPORT ====================

export default {
  calculateNet
};
