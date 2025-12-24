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

// ==================== SINAV ŞABLONU ====================

export interface ExamTemplate {
  id: string;
  examTypeId: string;
  name: string;
  code?: string;
  description?: string;
  
  // Soru Yapısı
  questionStructure: Array<{
    subjectCode: string;
    count: number;
    startNo: number;
    endNo: number;
  }>;
  
  totalQuestions: number;
  defaultDurationMinutes?: number;
  defaultTopicMapping?: Record<number, string>;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  
  isActive: boolean;
  isDefault: boolean;
  
  organizationId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== OPTİK HAM VERİ ====================

export interface ExamOpticalRawData {
  id: string;
  examId: string;
  studentId: string;
  
  // Ham Veri
  rawDataString?: string;
  rawDataJson?: Record<number, string>;
  
  // Optik Bilgileri
  scannerDevice?: string;
  scannerVersion?: string;
  scanTimestamp?: Date;
  scanQualityScore?: number;
  
  // Form Bilgileri
  formType?: 'A' | 'B' | 'C' | 'D';
  formSerial?: string;
  studentIdOnForm?: string;
  
  // Kalite Metrikleri
  totalMarksDetected?: number;
  ambiguousMarksCount: number;
  doubleMarksCount: number;
  emptyMarksCount: number;
  invalidMarksCount: number;
  
  // Hata Detayları
  markIssues?: Array<{
    question: number;
    type: 'double_mark' | 'ambiguous' | 'invalid' | 'empty';
    values?: string[];
  }>;
  
  // Durum
  processingStatus: 'pending' | 'processed' | 'error' | 'manual_review';
  processedAt?: Date;
  
  scanImageUrl?: string;
  
  organizationId?: string;
  receivedAt: Date;
  receivedBy?: string;
}

// ==================== VALİDASYON HATASI ====================

export interface ExamValidationError {
  id: string;
  examId: string;
  studentId?: string;
  opticalRawDataId?: string;
  
  errorCode: string;
  errorType: 'critical' | 'warning' | 'info';
  errorMessage: string;
  
  questionNo?: number;
  subjectCode?: string;
  fieldName?: string;
  
  receivedValue?: string;
  expectedValue?: string;
  
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionAction?: 'corrected' | 'ignored' | 'deleted';
  resolutionNote?: string;
  
  organizationId?: string;
  createdAt: Date;
}

// ==================== ANALİTİK SNAPSHOT ====================

export interface ExamAnalyticsSnapshot {
  id: string;
  
  scopeType: 'student' | 'class' | 'school' | 'exam';
  scopeId: string;
  
  snapshotDate: Date;
  snapshotPeriod?: 'daily' | 'weekly' | 'monthly' | 'exam';
  
  examId?: string;
  academicYearId?: string;
  
  // Metrikler
  examCount: number;
  avgNet?: number;
  avgScore?: number;
  avgPercentile?: number;
  
  // Trendler
  netTrend?: number;
  scoreTrend?: number;
  rankTrend?: number;
  
  // Performans Detayları
  subjectPerformance?: Record<string, {
    avgNet: number;
    trend: number;
  }>;
  
  topicPerformance?: Record<string, {
    successRate: number;
    trend: number;
  }>;
  
  // AI-Ready Veriler
  strengths?: string[];
  weaknesses?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  riskFactors?: string[];
  improvementPriorities?: Array<{
    topic: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  studyRecommendations?: string[];
  
  consistencyScore?: number;
  vsClassAvg?: number;
  vsSchoolAvg?: number;
  vsPrevious?: number;
  
  organizationId?: string;
  calculatedAt: Date;
  createdAt: Date;
}

// ==================== AUDIT LOG ====================

export interface ExamAuditLog {
  id: string;
  
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CALCULATE' | 'PUBLISH' | 'IMPORT';
  entityType: 'exam' | 'answer' | 'result' | 'answer_key' | 'template';
  entityId?: string;
  
  examId?: string;
  studentId?: string;
  
  oldValue?: any;
  newValue?: any;
  changedFields?: string[];
  
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  
  performedBy?: string;
  performedAt: Date;
  
  organizationId?: string;
}

// ==================== VALİDASYON KURALI ====================

export interface ExamValidationRule {
  id: string;
  examTypeId?: string;
  
  ruleCode: string;
  ruleName: string;
  description?: string;
  
  fieldName?: string;
  ruleType: 'range' | 'enum' | 'regex' | 'custom';
  params: any;
  
  errorCode: string;
  errorMessageTemplate: string;
  errorSeverity: 'error' | 'warning' | 'info';
  
  isBlocking: boolean;
  autoFixAction?: 'set_null' | 'set_default' | 'skip';
  
  isActive: boolean;
  displayOrder: number;
  
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SORU-KONU CONFIG ====================

export interface ExamQuestionTopicConfig {
  id: string;
  examTypeId?: string;
  subjectId?: string;
  templateId?: string;
  
  configName: string;
  description?: string;
  
  // Soru aralığı -> Konu eşleştirme
  questionRanges: Array<{
    start: number;
    end: number;
    topicId?: string;
    topicCode?: string;
    topicName?: string;
  }>;
  
  // Tekil soru eşleştirme
  questionMapping: Record<number, string>;
  
  // Zorluk eşleştirme
  difficultyMapping: Record<number, number>;
  
  // Kazanım eşleştirme
  outcomeMapping: Record<number, string>;
  
  isActive: boolean;
  isDefault: boolean;
  
  organizationId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== TREND CONFIG ====================

export interface ExamTrendConfig {
  id: string;
  configName: string;
  description?: string;
  
  // Trend penceresi
  windowSize: number;
  minExamsRequired: number;
  
  // Ağırlık dağılımı [eski -> yeni]
  weightDistribution: number[];
  
  // Normalizasyon
  normalizeByClass: boolean;
  normalizeByExamType: boolean;
  
  // Eşikler
  thresholdSignificantUp: number;
  thresholdSignificantDown: number;
  thresholdStableRange: number;
  
  isActive: boolean;
  isDefault: boolean;
  
  organizationId?: string;
  examTypeId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== STUDENT ANALYTICS (SNAPSHOT) ====================

export interface ExamStudentAnalytics {
  id: string;
  examId: string;
  studentId: string;
  resultId?: string;
  
  // Denormalize öğrenci bilgileri
  studentNo?: string;
  studentName?: string;
  className?: string;
  
  // Temel metrikler
  totalNet: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  
  // Sıralama
  rankInExam?: number;
  rankInClass?: number;
  rankInSchool?: number;
  percentile?: number;
  
  // Performans (JSONB)
  subjectPerformance: Record<string, {
    net: number;
    correct: number;
    wrong: number;
    empty: number;
    rate: number;
    rank?: number;
  }>;
  
  topicPerformance: Record<string, {
    name: string;
    correct: number;
    total: number;
    rate: number;
    status: 'excellent' | 'good' | 'average' | 'weak' | 'critical';
  }>;
  
  outcomePerformance: Record<string, {
    name: string;
    achieved: boolean;
    rate: number;
  }>;
  
  difficultyPerformance: {
    easy: { correct: number; total: number; rate: number };
    medium: { correct: number; total: number; rate: number };
    hard: { correct: number; total: number; rate: number };
  };
  
  // Tutarlılık
  consistencyScore?: number;
  
  // AI-ready alanlar
  strengths: Array<{
    topic?: string;
    subject?: string;
    rate: number;
    rank?: number;
  }>;
  
  weaknesses: Array<{
    topic?: string;
    subject?: string;
    rate: number;
    priority?: 'high' | 'medium' | 'low';
  }>;
  
  improvementPriorities: Array<{
    topic: string;
    priority: number;
    reason: string;
  }>;
  
  studyRecommendations: string[];
  
  // Risk
  riskLevel?: 'low' | 'medium' | 'high';
  riskScore?: number;
  riskFactors: string[];
  
  // Karşılaştırmalar
  vsClassAvg?: number;
  vsSchoolAvg?: number;
  vsPreviousExam?: number;
  
  // Trend
  netTrend?: number[];
  rankTrend?: number[];
  trendDirection?: 'up' | 'down' | 'stable';
  trendChange?: number;
  
  // Genel değerlendirme
  overallAssessment?: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
  assessmentSummary?: string;
  
  // AI Metadata
  aiMetadata: Record<string, any>;
  calculationMetadata: Record<string, any>;
  
  // Cache kontrolü
  calculationVersion: string;
  calculatedAt: Date;
  calculationDurationMs?: number;
  isStale: boolean;
  invalidatedAt?: Date;
  invalidationReason?: string;
  
  organizationId?: string;
  academicYearId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== RISK CONFIG ====================

export interface ExamRiskConfig {
  id: string;
  configName: string;
  configVersion: string;
  description?: string;
  
  // Ağırlıklar
  weightNetDrop: number;
  weightConsistency: number;
  weightWeakTopics: number;
  weightDifficultyGap: number;
  weightRankDrop: number;
  weightEmptyRate: number;
  
  // Eşikler
  thresholdNetDropCritical: number;
  thresholdNetDropWarning: number;
  thresholdWeakTopicRate: number;
  thresholdConsistencyLow: number;
  thresholdRiskHigh: number;
  thresholdRiskMedium: number;
  
  // Trend
  trendPeriodCount: number;
  trendSignificantChange: number;
  
  isActive: boolean;
  isDefault: boolean;
  
  organizationId?: string;
  examTypeId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ANALYTICS QUEUE ====================

export type AnalyticsJobType = 
  | 'student_analytics'
  | 'exam_analytics'
  | 'class_analytics'
  | 'trend_update'
  | 'bulk_recalculate';

export type AnalyticsJobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExamAnalyticsQueue {
  id: string;
  jobType: AnalyticsJobType;
  
  examId?: string;
  studentId?: string;
  className?: string;
  
  params: Record<string, any>;
  
  status: AnalyticsJobStatus;
  priority: number;
  
  progressPercent: number;
  progressMessage?: string;
  
  result?: Record<string, any>;
  errorMessage?: string;
  errorStack?: string;
  
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  
  organizationId?: string;
  createdBy?: string;
  createdAt: Date;
}

// ==================== EXPORT ====================

export default {
  calculateNet
};
