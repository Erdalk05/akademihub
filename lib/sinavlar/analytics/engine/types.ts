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

// ==================== AI-READY INTERFACES ====================

/**
 * Genel Analytics Girdisi (AI-ready)
 * Tüm hesaplamalar için ortak girdi formatı
 */
export interface AnalyticsInput {
  // Net değerleri (ders koduna göre)
  nets: Record<string, number>;
  
  // Yanlış sayıları (ders koduna göre)
  wrong: Record<string, number>;
  
  // Boş sayıları (ders koduna göre)
  blank: Record<string, number>;
  
  // Toplam soru sayısı
  totalQuestions: number;
  
  // Opsiyonel metrikler
  difficultyIndex?: number;         // 0-1 arası sınav zorluğu
  trendData?: number[];             // Geçmiş net değerleri
  classAverage?: number;            // Sınıf ortalaması
  schoolAverage?: number;           // Okul ortalaması
  
  // Sınav tipi
  examType?: 'LGS' | 'TYT' | 'AYT_SAY' | 'AYT_EA' | 'AYT_SOZ';
  wrongPenaltyDivisor?: number;     // 3 veya 4
}

/**
 * Tam Analytics Sonucu (AI-ready)
 * exam_student_analytics JSONB ile uyumlu
 */
export interface AnalyticsResult {
  // Versiyon
  analytics_version: string;
  
  // Özet metrikler
  summary: SummaryMetrics;
  
  // İstatistikler
  statistics: StatisticsMetrics;
  
  // Trend analizi
  trends: TrendMetrics;
  
  // Öğrenme açıkları
  learning_gaps: LearningGapItem[];
  
  // Risk değerlendirmesi
  risk: RiskMetrics;
  
  // Güvenilirlik metrikleri
  confidence: ConfidenceMetrics;
  
  // AI için öneriler
  recommendations: RecommendationItem[];
  
  // Hesaplama metadata
  metadata: CalculationMetadata;
}

export interface SummaryMetrics {
  // Genel sonuçlar
  total_net: number;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  
  // Yüzdelik
  success_rate: number;             // 0-1
  percentile: number | null;        // 0-100
  
  // Değerlendirme
  overall_assessment: OverallAssessment;
  assessment_summary: string;
  
  // Karşılaştırmalar
  vs_class_avg: number | null;
  vs_school_avg: number | null;
  vs_previous: number | null;
}

export interface StatisticsMetrics {
  // Temel istatistikler
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  
  // Ders bazlı
  subject_stats: Record<string, {
    net: number;
    rate: number;
    rank?: number;
  }>;
  
  // Zorluk bazlı
  difficulty_stats: {
    easy: { rate: number; count: number };
    medium: { rate: number; count: number };
    hard: { rate: number; count: number };
  };
}

export interface TrendMetrics {
  // Yön ve değişim
  direction: TrendDirection;
  change: number;
  weighted_change: number;
  
  // Eğim ve tahmin
  slope: number;
  forecast_next: number | null;
  
  // Geçmiş veriler
  history: number[];
  is_significant: boolean;
  
  // Tutarlılık
  consistency_score: number;
}

export interface LearningGapItem {
  // Tanımlama
  topic_id: string;
  topic_name: string;
  subject_code: string;
  
  // Performans
  success_rate: number;
  questions_count: number;
  
  // Değerlendirme
  severity: 'critical' | 'moderate' | 'minor';
  priority: number;
  
  // Öneri
  recommendation: string;
}

export interface RiskMetrics {
  // Seviye ve skor
  level: RiskLevel;
  score: number;
  
  // Faktörler
  factors: Array<{
    name: string;
    contribution: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  // Özet
  summary: string;
  action_required: boolean;
}

export interface ConfidenceMetrics {
  // Genel güven
  overall: number;
  level: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  
  // Alt faktörler
  data_quality: number;
  sample_size_adequate: boolean;
  consistency: number;
  
  // Hata payı
  margin_of_error: number;
  
  // Uyarılar
  warnings: string[];
  is_reliable: boolean;
}

export interface RecommendationItem {
  // Tanımlama
  id: string;
  category: 'study' | 'practice' | 'review' | 'urgent';
  
  // İçerik
  action: string;
  reason: string;
  
  // Öncelik
  priority: number;
  effort_level: 'low' | 'medium' | 'high';
  
  // Beklenen etki
  expected_impact: string;
  estimated_net_gain?: number;
}

export interface CalculationMetadata {
  // Versiyon bilgileri
  version: string;
  schema_version: string;
  engine_version: string;
  
  // Zaman
  calculated_at: string;            // ISO 8601
  calculation_duration_ms: number;
  
  // Kaynak
  data_source: string;
  input_hash?: string;
  
  // Kalite
  data_completeness: number;
  confidence_score: number;
  
  // AI flags
  ai_ready: boolean;
  recommendation_enabled: boolean;
}
