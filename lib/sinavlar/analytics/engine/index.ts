/**
 * ============================================
 * AkademiHub - Analytics Engine Index
 * ============================================
 * 
 * PURE FUNCTION ANALYTICS ENGINE
 * Version: 1.0.0
 * 
 * KURALLAR:
 * ❌ No DB calls
 * ❌ No Supabase imports
 * ❌ No mutations (immutability only)
 * ✅ Deterministic input → output
 * ✅ Senior-level clean code
 * ✅ Defensive programming
 * ✅ Fully typed (TypeScript)
 * 
 * Bu engine şunları besler:
 * - exam_student_analytics JSONB fields
 * - AI interpretation layers
 * - PDF / WhatsApp reports
 * - School & class dashboards
 */

// ==================== VERSION INFO ====================

export { 
  ANALYTICS_VERSION, 
  ANALYTICS_SCHEMA_VERSION, 
  ENGINE_VERSION,
  VERSION_HISTORY 
} from './versioning';

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

// ==================== NORMALIZATION ====================

export {
  calculateZScore,
  zScoreToValue,
  minMaxNormalize,
  minMaxNormalizeToRange,
  adjustForDifficulty,
  calculateDifficultyIndex,
  normalizeScores,
  normalizeScore,
  normalizeCrossExam,
  normalizeNet,
  calculatePercentileRank
} from './normalization';

export type {
  NormalizationInput,
  DifficultyAdjustmentInput,
  ScoreNormalizationInput,
  CrossExamNormalizationInput,
  NetNormalizationInput
} from './normalization';

// ==================== TREND ====================

export {
  calculateTrend,
  calculateSimpleTrend,
  calculateTrendScore
} from './trend';

// ==================== WEIGHTING (LGS/TYT/AYT) ====================

export {
  calculateWeightedScore,
  calculateLGSScore,
  calculateTYTScore,
  calculateAYTScore,
  getWeight,
  analyzeSubjectImpact,
  predictRequiredNets,
  LGS_WEIGHTS,
  TYT_WEIGHTS,
  AYT_SAY_WEIGHTS,
  AYT_EA_WEIGHTS,
  AYT_SOZ_WEIGHTS,
  LGS_QUESTION_COUNTS,
  TYT_QUESTION_COUNTS
} from './weighting';

export type {
  ExamType,
  SubjectNet,
  WeightedScoreInput,
  WeightedScoreResult,
  SubjectContribution,
  SubjectImpactAnalysis,
  ScorePredictionInput,
  ScorePredictionResult,
  SubjectSuggestion
} from './weighting';

// ==================== LEARNING GAPS ====================

export { detectLearningGaps } from './gaps';

export type {
  LearningGapInput,
  TopicPerformance,
  OutcomePerformance,
  PrerequisiteMapping,
  GapDetectionConfig,
  LearningGapResult,
  LearningGap,
  GapCluster,
  CascadingRisk,
  GapSummary
} from './gaps';

// ==================== RISK ====================

export { calculateRiskScore } from './risk';

// ==================== CONFIDENCE ====================

export {
  calculateConfidence,
  calculatePredictionConfidence,
  calculateAnalyticsReliability,
  calculateMarginOfError
} from './confidence';

export type {
  ConfidenceInput,
  ConfidenceResult,
  ConfidenceFactor,
  PredictionConfidenceInput,
  AnalyticsReliabilityInput
} from './confidence';

// ==================== VERSIONING ====================

export {
  createMetadata,
  wrapWithVersion,
  withCalculationContext,
  isVersionCompatible,
  compareVersions,
  formatForAI,
  calculateChangelog
} from './versioning';

export type {
  AnalyticsMetadata,
  VersionedAnalytics,
  CalculationContext,
  CalculationResult,
  AIReadyOutput,
  AIReadyItem,
  AIReadyRecommendation
} from './versioning';

// ==================== TOPICS ====================

export {
  analyzeTopics,
  calculateOverallAssessment
} from './topics';

// ==================== TREND NORMALIZER (PHASE 3.4) ====================

export {
  normalizeTrend,
  normalizeTrendBatch,
  compareTrends
} from './trendNormalizer';

export type {
  TrendNormalizerInput,
  NormalizedTrendResult
} from './trendNormalizer';

// ==================== RISK NORMALIZER (PHASE 3.4) ====================

export {
  normalizeRisk,
  normalizeRiskBatch,
  compareRisks
} from './riskNormalizer';

export type {
  RiskNormalizerInput,
  RiskFactorExplanation,
  NormalizedRiskResult
} from './riskNormalizer';

// ==================== MAIN ENGINE ====================

export {
  calculateFullAnalytics
} from './analyticsEngine';

// ==================== DEFAULT EXPORT ====================

import { calculateFullAnalytics } from './analyticsEngine';
import { calculateStandardDeviation, calculatePercentile, calculateConsistencyScore, calculateStatistics } from './statistics';
import { calculateZScore, normalizeScores, adjustForDifficulty, normalizeNet, calculatePercentileRank } from './normalization';
import { calculateTrend, calculateSimpleTrend, calculateTrendScore } from './trend';
import { calculateWeightedScore, analyzeSubjectImpact, predictRequiredNets } from './weighting';
import { detectLearningGaps } from './gaps';
import { calculateRiskScore } from './risk';
import { calculateConfidence, calculatePredictionConfidence, calculateAnalyticsReliability, calculateMarginOfError } from './confidence';
import { createMetadata, wrapWithVersion, formatForAI, ANALYTICS_VERSION } from './versioning';
import { analyzeTopics, calculateOverallAssessment } from './topics';
import { normalizeTrend, normalizeTrendBatch, compareTrends } from './trendNormalizer';
import { normalizeRisk, normalizeRiskBatch, compareRisks } from './riskNormalizer';

/**
 * Analytics Engine - Pure Functions
 * 
 * @example
 * import AnalyticsEngine from '@/lib/sinavlar/analytics/engine';
 * 
 * // Tam analiz
 * const result = AnalyticsEngine.calculateFullAnalytics(input);
 * 
 * // LGS puan hesaplama
 * const score = AnalyticsEngine.calculateWeightedScore({ examType: 'LGS', subjectNets });
 * 
 * // Öğrenme açığı tespiti
 * const gaps = AnalyticsEngine.detectLearningGaps({ topics });
 * 
 * // Risk analizi (DB config ile)
 * const risk = AnalyticsEngine.normalizeRisk({ ... });
 * 
 * // Trend analizi (DB config ile)
 * const trend = AnalyticsEngine.normalizeTrend({ nets: [...] });
 * 
 * // AI-ready çıktı
 * const aiOutput = AnalyticsEngine.formatForAI(analytics);
 */
export default {
  // Versiyon
  version: ANALYTICS_VERSION,
  
  // Ana fonksiyon
  calculateFullAnalytics,
  
  // İstatistik
  calculateStandardDeviation,
  calculatePercentile,
  calculateConsistencyScore,
  calculateStatistics,
  
  // Normalizasyon
  calculateZScore,
  normalizeScores,
  adjustForDifficulty,
  normalizeNet,
  calculatePercentileRank,
  
  // Trend (Phase 3.4 - DB Configurable)
  calculateTrend,
  calculateSimpleTrend,
  calculateTrendScore,
  normalizeTrend,
  normalizeTrendBatch,
  compareTrends,
  
  // Ağırlıklı skorlama
  calculateWeightedScore,
  analyzeSubjectImpact,
  predictRequiredNets,
  
  // Öğrenme açıkları
  detectLearningGaps,
  
  // Risk (Phase 3.4 - DB Configurable & Explainable)
  calculateRiskScore,
  normalizeRisk,
  normalizeRiskBatch,
  compareRisks,
  
  // Konu analizi
  analyzeTopics,
  calculateOverallAssessment,
  
  // Güvenilirlik
  calculateConfidence,
  calculatePredictionConfidence,
  calculateAnalyticsReliability,
  calculateMarginOfError,
  
  // Versiyon & Metadata
  createMetadata,
  wrapWithVersion,
  formatForAI
};
