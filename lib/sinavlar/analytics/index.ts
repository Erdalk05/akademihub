/**
 * ============================================
 * AkademiHub - Sınav Analytics Modülü
 * ============================================
 * 
 * Bu modül ÜÇ katmandan oluşur:
 * 
 * 1. ENGINE (Pure Functions) ✅
 *    - DB çağrısı YOK
 *    - API çağrısı YOK
 *    - Side-effect YOK
 *    - Test edilebilir
 * 
 * 2. ORCHESTRATOR (Data Layer) ✅
 *    - Supabase çağrıları
 *    - Cache yönetimi
 *    - Queue işlemleri
 *    - TEK YETKİLİ
 * 
 * 3. UI/API (Consumer)
 *    - Sadece Orchestrator'ı çağırır
 *    - Hesaplama YAPMAZ
 *    - Aggregasyon YAPMAZ
 * 
 * MİMARİ:
 * UI → Orchestrator → Engine → Snapshot
 */

// ==================== ORCHESTRATOR (ANA GİRİŞ) ====================

export {
  getStudentAnalytics,
  getExamAnalytics,
  recomputeStaleSnapshots
} from './orchestrator';

export type {
  StudentAnalyticsOutput,
  OrchestratorResult,
  OrchestratorConfig
} from './orchestrator';

// ==================== PURE FUNCTIONS (ENGINE) ====================

export * from './engine';
export { default as AnalyticsEngine } from './engine';

// ==================== ORCHESTRATOR EXPORTS ====================

export { default as Orchestrator } from './orchestrator';

// ==================== QUICK ACCESS ====================

import { getStudentAnalytics } from './orchestrator';
import {
  calculateFullAnalytics,
  calculateStandardDeviation,
  calculatePercentile,
  calculateConsistencyScore,
  calculateTrend,
  calculateRiskScore,
  analyzeTopics
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
 * // Pure function için (test/advanced)
 * import { Analytics } from '@/lib/sinavlar/analytics';
 * const stats = Analytics.engine.full(input);
 */
export const Analytics = {
  // Orchestrator (UI için)
  get: getStudentAnalytics,
  
  // Engine (Pure Functions)
  engine: {
    full: calculateFullAnalytics,
    stdDev: calculateStandardDeviation,
    percentile: calculatePercentile,
    consistency: calculateConsistencyScore,
    trend: calculateTrend,
    risk: calculateRiskScore,
    topics: analyzeTopics
  }
};
