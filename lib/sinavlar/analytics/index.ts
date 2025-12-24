/**
 * ============================================
 * AkademiHub - Sınav Analytics Modülü
 * ============================================
 * 
 * Bu modül DÖRT katmandan oluşur:
 * 
 * 1. CONFIG (Konfigürasyon) ✅
 *    - Varsayılan değerler
 *    - DB'den config yükleme
 *    - FAIL-SAFE: Her zaman çalışır
 * 
 * 2. ENGINE (Pure Functions) ✅
 *    - DB çağrısı YOK
 *    - Side-effect YOK
 *    - trendNormalizer, riskNormalizer
 * 
 * 3. ORCHESTRATOR (Data Layer) ✅
 *    - Supabase çağrıları
 *    - Cache yönetimi
 *    - Config yükleme
 *    - TEK YETKİLİ
 * 
 * 4. UI/API (Consumer)
 *    - Sadece Orchestrator'ı çağırır
 *    - Hesaplama YAPMAZ
 * 
 * MİMARİ:
 * UI → Orchestrator → Config + Engine → Snapshot
 */

// ==================== CONFIG (PHASE 3.4) ====================

export {
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  DEFAULT_TREND_CONFIG,
  RISK_EXPLANATION_TEMPLATES,
  TREND_EXPLANATION_TEMPLATES,
  RISK_LEVEL_LABELS,
  TREND_DIRECTION_LABELS,
  CONFIG_VERSION,
  loadRiskConfig,
  loadTrendConfig,
  loadAllConfigs,
  clearConfigCache
} from './config';

export type {
  RiskWeightConfig,
  RiskThresholdConfig,
  TrendConfig,
  LoadedRiskConfig,
  LoadedTrendConfig
} from './config';

// ==================== ORCHESTRATOR (ANA GİRİŞ) ====================

export {
  getStudentAnalytics,
  getExamAnalytics,
  recomputeStaleSnapshots
} from './orchestrator';

export type {
  StudentAnalyticsOutput,
  OrchestratorResult,
  OrchestratorConfig,
  RiskData,
  TrendData
} from './orchestrator';

// ==================== PURE FUNCTIONS (ENGINE) ====================

export * from './engine';
export { default as AnalyticsEngine } from './engine';

// ==================== ORCHESTRATOR & CONFIG EXPORTS ====================

export { default as Orchestrator } from './orchestrator';
export { default as AnalyticsConfig } from './config';

// ==================== QUICK ACCESS ====================

import { getStudentAnalytics } from './orchestrator';
import { loadAllConfigs, clearConfigCache } from './config';
import {
  calculateFullAnalytics,
  calculateStandardDeviation,
  calculatePercentile,
  calculateConsistencyScore,
  calculateTrend,
  calculateRiskScore,
  analyzeTopics,
  normalizeTrend,
  normalizeRisk
} from './engine';

/**
 * Quick access to analytics functions
 * 
 * KULLANIM:
 * 
 * @example
 * // UI için (önerilen)
 * import { Analytics } from '@/lib/sinavlar/analytics';
 * const result = await Analytics.get(examId, studentId);
 * 
 * // Risk açıklamaları
 * console.log(result.data.risk.factors); // Neden riskli?
 * console.log(result.data.trends.explanation); // Trend açıklaması
 * 
 * // Config yönetimi
 * await Analytics.config.load(); // DB'den config yükle
 * Analytics.config.clear(); // Cache temizle
 */
export const Analytics = {
  // Orchestrator (UI için)
  get: getStudentAnalytics,
  
  // Config yönetimi
  config: {
    load: loadAllConfigs,
    clear: clearConfigCache
  },
  
  // Engine (Pure Functions)
  engine: {
    full: calculateFullAnalytics,
    stdDev: calculateStandardDeviation,
    percentile: calculatePercentile,
    consistency: calculateConsistencyScore,
    trend: calculateTrend,
    risk: calculateRiskScore,
    topics: analyzeTopics,
    
    // PHASE 3.4: DB Configurable Normalizers
    normalizeTrend,
    normalizeRisk
  }
};
