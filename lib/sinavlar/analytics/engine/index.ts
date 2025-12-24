/**
 * ============================================
 * AkademiHub - Analytics Engine Index
 * ============================================
 * 
 * Pure Function Analytics Engine
 * DB çağrısı YOK, API çağrısı YOK, Side-effect YOK
 * Sadece input → output
 * 
 * Tüm fonksiyonlar test edilebilir ve bağımsız
 */

// ==================== TYPES ====================

export type {
  // Temel tipler
  RiskLevel,
  TrendDirection,
  TopicStatus,
  OverallAssessment,
  DifficultyLevel,
  
  // Girdi tipleri
  TrendInput,
  RiskScoreInput,
  RiskWeights,
  RiskThresholds,
  TopicAnalysisInput,
  TopicInput,
  TopicAnalysisConfig,
  FullAnalyticsInput,
  SubjectResultInput,
  OutcomeResultInput,
  DifficultyResultInput,
  PreviousExamInput,
  
  // Çıktı tipleri
  TrendResult,
  RiskScoreResult,
  RiskFactor,
  TopicAnalysisResult,
  TopicResultItem,
  StrengthItem,
  WeaknessItem,
  ImprovementPriority,
  FullAnalyticsResult
} from './types';

export {
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  DEFAULT_TOPIC_CONFIG,
  DEFAULT_TREND_CONFIG
} from './types';

// ==================== STATISTICS ====================

export {
  calculateStandardDeviation,
  calculatePercentile,
  calculatePercentileByValue,
  getValueAtPercentile,
  calculateStatistics,
  calculateConsistencyScore
} from './statistics';

export type { StatisticsResult } from './statistics';

// ==================== TREND ====================

export {
  calculateTrend,
  calculateSimpleTrend,
  calculateTrendScore
} from './trend';

// ==================== RISK ====================

export { calculateRiskScore } from './risk';

// ==================== TOPICS ====================

export {
  analyzeTopics,
  calculateOverallAssessment
} from './topics';

// ==================== MAIN ENGINE ====================

export {
  calculateFullAnalytics
} from './analyticsEngine';

// ==================== DEFAULT EXPORT ====================

import { calculateFullAnalytics } from './analyticsEngine';
import { calculateStandardDeviation, calculatePercentile, calculateConsistencyScore, calculateStatistics } from './statistics';
import { calculateTrend, calculateSimpleTrend, calculateTrendScore } from './trend';
import { calculateRiskScore } from './risk';
import { analyzeTopics, calculateOverallAssessment } from './topics';

/**
 * Analytics Engine - Pure Functions
 * 
 * @example
 * import AnalyticsEngine from '@/lib/sinavlar/analytics/engine';
 * 
 * const result = AnalyticsEngine.calculateFullAnalytics(input);
 * const trend = AnalyticsEngine.calculateTrend({ values: [40, 45, 50] });
 * const risk = AnalyticsEngine.calculateRiskScore({ ... });
 */
export default {
  // Ana fonksiyon
  calculateFullAnalytics,
  
  // İstatistik fonksiyonları
  calculateStandardDeviation,
  calculatePercentile,
  calculateConsistencyScore,
  calculateStatistics,
  
  // Trend fonksiyonları
  calculateTrend,
  calculateSimpleTrend,
  calculateTrendScore,
  
  // Risk fonksiyonu
  calculateRiskScore,
  
  // Konu analizi
  analyzeTopics,
  calculateOverallAssessment
};
