/**
 * ============================================
 * AkademiHub - Analytics Engine Types
 * ============================================
 * 
 * PURE TYPES - No imports from external modules
 * Tüm analytics engine için ortak tipler
 * 
 * KURALLAR:
 * - Sadece type tanımları
 * - Side-effect YOK
 * - Runtime kod YOK
 */

// ==================== TEMEL TİPLER ====================

export type RiskLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'up' | 'down' | 'stable';
export type TopicStatus = 'excellent' | 'good' | 'average' | 'weak' | 'critical';
export type OverallAssessment = 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// ==================== GİRDİ TİPLERİ ====================

/**
 * Trend hesaplama girdisi
 */
export interface TrendInput {
  values: number[];                    // Net değerleri (eski -> yeni)
  weights?: number[];                  // Ağırlıklar (opsiyonel)
  thresholdUp?: number;                // Yukarı eşik (varsayılan: 3.0)
  thresholdDown?: number;              // Aşağı eşik (varsayılan: -3.0)
  thresholdStable?: number;            // Stabil aralık (varsayılan: 1.5)
}

/**
 * Risk skoru hesaplama girdisi
 */
export interface RiskScoreInput {
  // Net performansı
  currentNet: number;
  previousNet?: number;                 // Önceki sınav
  classAvgNet?: number;
  schoolAvgNet?: number;
  
  // Tutarlılık
  consistencyScore?: number;            // 0-1 arası
  
  // Konu analizi
  weakTopicCount: number;
  totalTopicCount: number;
  
  // Zorluk performansı
  easySuccessRate?: number;             // 0-1
  hardSuccessRate?: number;             // 0-1
  
  // Sıralama
  currentRank?: number;
  previousRank?: number;
  totalStudents?: number;
  
  // Boş bırakma
  emptyRate?: number;                   // 0-1
  
  // Config (opsiyonel)
  weights?: RiskWeights;
  thresholds?: RiskThresholds;
}

export interface RiskWeights {
  netDrop: number;                      // Varsayılan: 0.25
  consistency: number;                  // Varsayılan: 0.20
  weakTopics: number;                   // Varsayılan: 0.20
  difficultyGap: number;                // Varsayılan: 0.15
  rankDrop: number;                     // Varsayılan: 0.10
  emptyRate: number;                    // Varsayılan: 0.10
}

export interface RiskThresholds {
  netDropCritical: number;              // Varsayılan: 5.0
  netDropWarning: number;               // Varsayılan: 2.0
  weakTopicRate: number;                // Varsayılan: 0.40
  consistencyLow: number;               // Varsayılan: 0.60
  riskHigh: number;                     // Varsayılan: 0.70
  riskMedium: number;                   // Varsayılan: 0.40
}

/**
 * Konu analizi girdisi
 */
export interface TopicAnalysisInput {
  topics: TopicInput[];
  subjectCode?: string;
  config?: TopicAnalysisConfig;
}

export interface TopicInput {
  topicId: string;
  topicName: string;
  subjectCode?: string;
  
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  
  difficulty?: number;                  // 0-1 ortalama zorluk
  questionWeight?: number;              // Soru ağırlığı
}

export interface TopicAnalysisConfig {
  excellentThreshold: number;           // Varsayılan: 0.80
  goodThreshold: number;                // Varsayılan: 0.60
  averageThreshold: number;             // Varsayılan: 0.40
  weakThreshold: number;                // Varsayılan: 0.20
  minQuestionsForAnalysis: number;      // Varsayılan: 1
}

/**
 * Tam analytics hesaplama girdisi
 */
export interface FullAnalyticsInput {
  // Öğrenci bilgileri
  studentId: string;
  studentNo?: string;
  studentName?: string;
  className?: string;
  
  // Sınav bilgileri
  examId: string;
  examTypeCode: string;
  wrongPenaltyDivisor: number;
  
  // Sonuçlar
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNet: number;
  
  // Sıralama
  rankInExam?: number;
  rankInClass?: number;
  rankInSchool?: number;
  totalStudentsInExam?: number;
  totalStudentsInClass?: number;
  
  // Ders sonuçları
  subjectResults: SubjectResultInput[];
  
  // Konu sonuçları
  topicResults: TopicInput[];
  
  // Kazanım sonuçları (opsiyonel)
  outcomeResults?: OutcomeResultInput[];
  
  // Zorluk bazlı sonuçlar
  difficultyResults?: DifficultyResultInput;
  
  // Önceki sınavlar (trend için)
  previousExams?: PreviousExamInput[];
  
  // Karşılaştırma verileri
  classAvgNet?: number;
  schoolAvgNet?: number;
  
  // Config
  riskConfig?: Partial<RiskWeights & RiskThresholds>;
  trendConfig?: Partial<TrendInput>;
  topicConfig?: Partial<TopicAnalysisConfig>;
}

export interface SubjectResultInput {
  subjectCode: string;
  subjectName?: string;
  
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  
  rank?: number;
  classAvg?: number;
}

export interface OutcomeResultInput {
  outcomeId: string;
  outcomeName: string;
  outcomeCode?: string;
  
  correct: number;
  total: number;
}

export interface DifficultyResultInput {
  easy: { correct: number; total: number };
  medium: { correct: number; total: number };
  hard: { correct: number; total: number };
}

export interface PreviousExamInput {
  examId: string;
  examDate: Date | string;
  totalNet: number;
  rankInExam?: number;
  rankInClass?: number;
}

// ==================== ÇIKTI TİPLERİ ====================

/**
 * Trend hesaplama çıktısı
 */
export interface TrendResult {
  direction: TrendDirection;
  change: number;                       // Son 2 sınav farkı
  weightedChange: number;               // Ağırlıklı değişim
  trend: number[];                      // Orijinal değerler
  normalizedTrend: number[];            // Normalize edilmiş (0-100)
  slope: number;                        // Eğim
  isSignificant: boolean;               // Anlamlı değişim var mı
}

/**
 * Risk skoru çıktısı
 */
export interface RiskScoreResult {
  level: RiskLevel;
  score: number;                        // 0-1 arası
  factors: RiskFactor[];
  summary: string;
}

export interface RiskFactor {
  code: string;
  name: string;
  contribution: number;                 // 0-1 arası
  severity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Konu analizi çıktısı
 */
export interface TopicAnalysisResult {
  topics: TopicResultItem[];
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  improvementPriorities: ImprovementPriority[];
  studyRecommendations: string[];
}

export interface TopicResultItem {
  topicId: string;
  topicName: string;
  subjectCode?: string;
  
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  
  rate: number;                         // 0-1
  status: TopicStatus;
}

export interface StrengthItem {
  topic: string;
  topicId?: string;
  subject?: string;
  rate: number;
  rank?: number;
  description?: string;
}

export interface WeaknessItem {
  topic: string;
  topicId?: string;
  subject?: string;
  rate: number;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export interface ImprovementPriority {
  topic: string;
  topicId?: string;
  priority: number;                     // 1 = en yüksek
  reason: string;
  estimatedImpact?: number;             // Beklenen net artışı
}

/**
 * Tam analytics çıktısı - exam_student_analytics ile %100 uyumlu
 */
export interface FullAnalyticsResult {
  // Temel metrikler
  totalNet: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  
  // Sıralama
  rankInExam: number | null;
  rankInClass: number | null;
  rankInSchool: number | null;
  percentile: number | null;
  
  // Ders performansı
  subjectPerformance: Record<string, {
    net: number;
    correct: number;
    wrong: number;
    empty: number;
    rate: number;
    rank?: number;
  }>;
  
  // Konu performansı
  topicPerformance: Record<string, {
    name: string;
    correct: number;
    total: number;
    rate: number;
    status: TopicStatus;
  }>;
  
  // Kazanım performansı
  outcomePerformance: Record<string, {
    name: string;
    achieved: boolean;
    rate: number;
  }>;
  
  // Zorluk performansı
  difficultyPerformance: {
    easy: { correct: number; total: number; rate: number };
    medium: { correct: number; total: number; rate: number };
    hard: { correct: number; total: number; rate: number };
  };
  
  // Tutarlılık
  consistencyScore: number | null;
  
  // AI-ready alanlar
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  improvementPriorities: ImprovementPriority[];
  studyRecommendations: string[];
  
  // Risk
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  riskFactors: string[];
  
  // Karşılaştırmalar
  vsClassAvg: number | null;
  vsSchoolAvg: number | null;
  vsPreviousExam: number | null;
  
  // Trend
  netTrend: number[] | null;
  rankTrend: number[] | null;
  trendDirection: TrendDirection | null;
  trendChange: number | null;
  
  // Genel değerlendirme
  overallAssessment: OverallAssessment | null;
  assessmentSummary: string | null;
  
  // Metadata
  aiMetadata: Record<string, any>;
  calculationMetadata: Record<string, any>;
}

// ==================== VARSAYILAN DEĞERLER ====================

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  netDrop: 0.25,
  consistency: 0.20,
  weakTopics: 0.20,
  difficultyGap: 0.15,
  rankDrop: 0.10,
  emptyRate: 0.10
};

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  netDropCritical: 5.0,
  netDropWarning: 2.0,
  weakTopicRate: 0.40,
  consistencyLow: 0.60,
  riskHigh: 0.70,
  riskMedium: 0.40
};

export const DEFAULT_TOPIC_CONFIG: TopicAnalysisConfig = {
  excellentThreshold: 0.80,
  goodThreshold: 0.60,
  averageThreshold: 0.40,
  weakThreshold: 0.20,
  minQuestionsForAnalysis: 1
};

export const DEFAULT_TREND_CONFIG = {
  thresholdUp: 3.0,
  thresholdDown: -3.0,
  thresholdStable: 1.5,
  weights: [0.1, 0.15, 0.2, 0.25, 0.3]
};
