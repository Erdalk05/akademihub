/**
 * ============================================
 * AkademiHub - Sınav Analytics Modülü
 * ============================================
 * 
 * Bu modül iki katmandan oluşur:
 * 
 * 1. ENGINE (Pure Functions)
 *    - DB çağrısı YOK
 *    - API çağrısı YOK
 *    - Side-effect YOK
 *    - Test edilebilir
 * 
 * 2. ORCHESTRATOR (Data Layer) - Phase 3.3'te eklenecek
 *    - Supabase çağrıları
 *    - Cache yönetimi
 *    - Queue işlemleri
 */

// ==================== PURE FUNCTIONS ====================

export * from './engine';
export { default as AnalyticsEngine } from './engine';

// ==================== QUICK ACCESS ====================

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
 * Quick access to commonly used analytics functions
 */
export const Analytics = {
  // Ana hesaplama
  full: calculateFullAnalytics,
  
  // İstatistikler
  stdDev: calculateStandardDeviation,
  percentile: calculatePercentile,
  consistency: calculateConsistencyScore,
  
  // Trend
  trend: calculateTrend,
  
  // Risk
  risk: calculateRiskScore,
  
  // Konular
  topics: analyzeTopics
};
