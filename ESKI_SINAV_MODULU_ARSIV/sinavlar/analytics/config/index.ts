/**
 * ============================================
 * AkademiHub - Analytics Config Module
 * ============================================
 * 
 * PHASE 3.4 - Konfigürasyon Modülü
 * 
 * Bu modül:
 * - Varsayılan değerleri export eder
 * - DB'den config yükleme fonksiyonlarını export eder
 * - Cache yönetimi sağlar
 */

// ==================== DEFAULTS ====================

export {
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  DEFAULT_TREND_CONFIG,
  RISK_EXPLANATION_TEMPLATES,
  TREND_EXPLANATION_TEMPLATES,
  RISK_LEVEL_LABELS,
  TREND_DIRECTION_LABELS,
  CONFIG_VERSION,
  CONFIG_SCHEMA_VERSION
} from './defaults';

export type {
  RiskWeightConfig,
  RiskThresholdConfig,
  TrendConfig
} from './defaults';

// ==================== LOADERS ====================

export {
  loadRiskConfig,
  loadTrendConfig,
  loadAllConfigs,
  clearConfigCache,
  getConfigCacheStatus
} from './loaders';

export type {
  LoadedRiskConfig,
  LoadedTrendConfig
} from './loaders';

// ==================== DEFAULT EXPORT ====================

import ConfigDefaults from './defaults';
import ConfigLoaders from './loaders';

export const AnalyticsConfig = {
  defaults: ConfigDefaults,
  loaders: ConfigLoaders
};

export default AnalyticsConfig;
