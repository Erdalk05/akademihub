/**
 * ============================================
 * AkademiHub - Analytics Orchestrator Types
 * ============================================
 * 
 * PHASE 3.3 - Orchestrator için tip tanımları
 * 
 * Bu dosya:
 * - Orchestrator'ın girdi/çıktı sözleşmelerini tanımlar
 * - UI, PDF, WhatsApp, AI için ortak formatta çıktı sağlar
 * - Türkiye sınav sistemi (MEB/ÖSYM) ile uyumludur
 */

import type { 
  FullAnalyticsResult,
  RiskLevel,
  TrendDirection,
  OverallAssessment,
  TopicStatus
} from '../engine/types';

// ==================== ORCHESTRATOR OUTPUT ====================

/**
 * Analytics Orchestrator'ın ana çıktısı
 * Bu format:
 * - UI render
 * - PDF karne
 * - WhatsApp mesaj
 * - AI Coach
 * tarafından kullanılır
 */
export interface StudentAnalyticsOutput {
  // Tanımlayıcılar
  student_id: string;
  exam_id: string;
  
  // Özet (hızlı okuma için)
  summary: AnalyticsSummary;
  
  // Detaylı analitikler
  analytics: AnalyticsDetails;
  
  // Trend verileri
  trends: TrendData;
  
  // Risk değerlendirmesi
  risk: RiskData;
  
  // Güçlü yönler (AI-ready)
  strengths: StrengthData[];
  
  // Zayıf yönler (AI-ready)
  weaknesses: WeaknessData[];
  
  // İyileştirme öncelikleri (AI-ready)
  improvement_priorities: ImprovementData[];
  
  // Çalışma önerileri
  study_recommendations: string[];
  
  // AI metadata (korunur, üzerine yazılmaz)
  ai_metadata: Record<string, any>;
  
  // Hesaplama metadata
  calculation_metadata: CalculationMeta;
  
  // Cache bilgisi
  cache_info: CacheInfo;
}

// ==================== SUMMARY ====================

export interface AnalyticsSummary {
  // Net ve sıralama
  total_net: number;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  
  // Sıralama
  rank_in_exam: number | null;
  rank_in_class: number | null;
  percentile: number | null;
  
  // Genel değerlendirme
  overall_assessment: OverallAssessment | null;
  assessment_summary: string | null;
  
  // Karşılaştırmalar
  vs_class_avg: number | null;
  vs_school_avg: number | null;
  vs_previous_exam: number | null;
}

// ==================== ANALYTICS DETAILS ====================

export interface AnalyticsDetails {
  // Ders performansı
  subject_performance: Record<string, SubjectPerformance>;
  
  // Konu performansı
  topic_performance: Record<string, TopicPerformance>;
  
  // Zorluk performansı
  difficulty_performance: DifficultyPerformance;
  
  // Tutarlılık
  consistency_score: number | null;
}

export interface SubjectPerformance {
  code: string;
  name?: string;
  net: number;
  correct: number;
  wrong: number;
  empty: number;
  rate: number;           // 0-1
  rank?: number;
  class_avg?: number;
}

export interface TopicPerformance {
  id: string;
  name: string;
  subject_code?: string;
  correct: number;
  total: number;
  rate: number;           // 0-1
  status: TopicStatus;
}

export interface DifficultyPerformance {
  easy: { correct: number; total: number; rate: number };
  medium: { correct: number; total: number; rate: number };
  hard: { correct: number; total: number; rate: number };
}

// ==================== TREND ====================

export interface TrendData {
  // Trend yönü
  direction: TrendDirection | null;
  change: number | null;          // Son 2 sınav farkı
  
  // Trend verileri
  net_trend: number[] | null;     // Son N sınavın netleri
  rank_trend: number[] | null;    // Son N sınavın sıralamaları
  
  // İstatistikler
  slope: number | null;           // Eğim
  is_significant: boolean;        // Anlamlı değişim var mı
}

// ==================== RISK ====================

export interface RiskData {
  level: RiskLevel | null;
  score: number | null;           // 0-1
  factors: string[];
  action_required: boolean;
}

// ==================== STRENGTHS / WEAKNESSES ====================

export interface StrengthData {
  topic: string;
  topic_id?: string;
  subject?: string;
  rate: number;
  rank?: number;
  description?: string;
}

export interface WeaknessData {
  topic: string;
  topic_id?: string;
  subject?: string;
  rate: number;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export interface ImprovementData {
  topic: string;
  topic_id?: string;
  priority: number;               // 1 = en yüksek
  reason: string;
  estimated_impact?: number;
}

// ==================== METADATA ====================

export interface CalculationMeta {
  analytics_version: string;
  calculated_at: string;          // ISO 8601
  calculation_duration_ms: number;
  engine_version: string;
  data_completeness: number;      // 0-1
  confidence_score: number;       // 0-1
}

export interface CacheInfo {
  is_cached: boolean;
  is_stale: boolean;
  cached_at: string | null;
  stale_reason?: string;
}

// ==================== SNAPSHOT (DB ROW) ====================

/**
 * exam_student_analytics tablosundaki satır yapısı
 */
export interface AnalyticsSnapshot {
  id: string;
  exam_id: string;
  student_id: string;
  result_id?: string;
  
  // Denormalize öğrenci bilgileri
  student_no?: string;
  student_name?: string;
  class_name?: string;
  
  // Temel metrikler
  total_net: number;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  
  // Sıralama
  rank_in_exam?: number;
  rank_in_class?: number;
  rank_in_school?: number;
  percentile?: number;
  
  // JSONB alanları
  subject_performance: Record<string, any>;
  topic_performance: Record<string, any>;
  outcome_performance: Record<string, any>;
  difficulty_performance: Record<string, any>;
  
  // Tutarlılık
  consistency_score?: number;
  
  // AI-ready alanlar
  strengths: any[];
  weaknesses: any[];
  improvement_priorities: any[];
  study_recommendations: any[];
  
  // Risk
  risk_level?: RiskLevel;
  risk_score?: number;
  risk_factors: any[];
  
  // Karşılaştırmalar
  vs_class_avg?: number;
  vs_school_avg?: number;
  vs_previous_exam?: number;
  
  // Trend
  net_trend?: number[];
  rank_trend?: number[];
  trend_direction?: TrendDirection;
  trend_change?: number;
  
  // Genel değerlendirme
  overall_assessment?: OverallAssessment;
  assessment_summary?: string;
  
  // Metadata
  ai_metadata: Record<string, any>;
  calculation_metadata: Record<string, any>;
  calculation_version: string;
  calculated_at: string;
  calculation_duration_ms?: number;
  
  // Cache kontrolü
  is_stale: boolean;
  invalidated_at?: string;
  invalidation_reason?: string;
  
  // Multi-tenant
  organization_id?: string;
  academic_year_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ==================== ORCHESTRATOR CONFIG ====================

export interface OrchestratorConfig {
  // Cache ayarları
  max_stale_age_hours: number;    // Varsayılan: 24
  enable_async_recompute: boolean;
  
  // Trend ayarları
  trend_window_size: number;      // Varsayılan: 5
  
  // Hesaplama ayarları
  include_trends: boolean;
  include_risk: boolean;
  include_recommendations: boolean;
  
  // Hata ayıklama
  debug_mode: boolean;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  max_stale_age_hours: 24,
  enable_async_recompute: true,
  trend_window_size: 5,
  include_trends: true,
  include_risk: true,
  include_recommendations: true,
  debug_mode: false
};

// ==================== ORCHESTRATOR RESULT ====================

export interface OrchestratorResult {
  success: boolean;
  data?: StudentAnalyticsOutput;
  error?: OrchestratorError;
  timing: {
    total_ms: number;
    cache_read_ms?: number;
    calculation_ms?: number;
    cache_write_ms?: number;
  };
}

export interface OrchestratorError {
  code: string;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
}

// ==================== INPUT ASSEMBLER ====================

/**
 * inputAssembler tarafından toplanan ham veriler
 */
export interface AssembledInput {
  // Öğrenci bilgileri
  student: {
    id: string;
    student_no?: string;
    name?: string;
    class_name?: string;
  };
  
  // Sınav bilgileri
  exam: {
    id: string;
    name: string;
    exam_type_code: string;
    total_questions: number;
    wrong_penalty_divisor: number;
    exam_date: string;
    answer_key: Record<number, string>;
  };
  
  // Öğrenci cevapları
  answers: Array<{
    question_no: number;
    given_answer: string | null;
    is_correct?: boolean;
  }>;
  
  // Sonuç (varsa)
  result?: {
    total_correct: number;
    total_wrong: number;
    total_empty: number;
    total_net: number;
    rank_in_exam?: number;
    rank_in_class?: number;
    subject_results?: Record<string, any>;
  };
  
  // Sınıf verileri (karşılaştırma için)
  class_data?: {
    class_name: string;
    avg_net: number;
    student_count: number;
    all_nets?: number[];          // Percentile için
  };
  
  // Okul verileri
  school_data?: {
    avg_net: number;
    student_count: number;
  };
  
  // Ders yapılandırması
  subject_config: Array<{
    code: string;
    name: string;
    start_no: number;
    end_no: number;
    weight: number;
  }>;
  
  // Konu yapılandırması
  topic_config?: Array<{
    topic_id: string;
    topic_name: string;
    subject_code: string;
    question_range: { start: number; end: number };
  }>;
  
  // Önceki sınavlar (trend için)
  previous_exams?: Array<{
    exam_id: string;
    exam_date: string;
    total_net: number;
    rank_in_exam?: number;
    rank_in_class?: number;
  }>;
  
  // Mevcut AI metadata (korunacak)
  existing_ai_metadata?: Record<string, any>;
}

// ==================== QUEUE ====================

export interface AnalyticsQueueJob {
  job_id: string;
  job_type: 'student_analytics' | 'exam_analytics' | 'class_analytics' | 'bulk_recalculate';
  exam_id: string;
  student_id?: string;
  class_name?: string;
  priority: number;               // 1 = en yüksek
  params?: Record<string, any>;
  created_at: string;
}
