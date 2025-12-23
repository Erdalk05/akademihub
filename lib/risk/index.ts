/**
 * Risk Module Index
 * Tüm risk araçlarını tek yerden export eder
 */

// Legacy calculator (backward compatibility)
export {
  calculateRiskLevel,
  calculateStudentRisk,
  calculateBulkRisk,
  getRiskStats
} from './riskCalculator';

export type { RiskData, StudentFinanceData } from './riskCalculator';

// ✅ YENİ: RiskEngine - Gelişmiş risk analiz motoru
export {
  analyzeRisk,
  analyzeMultipleStudents,
  calculateRiskStats as calculateRiskEngineStats,
  getSimpleRiskLevel,
  isHighRisk,
  getRiskColorClasses
} from './RiskEngine';

export type {
  RiskLevel,
  RiskTrend,
  RiskCategory,
  RiskReason,
  RiskTrendData,
  RiskRecommendation,
  RiskAnalysis,
  StudentPaymentData
} from './RiskEngine';
