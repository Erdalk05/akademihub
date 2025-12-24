/**
 * ============================================
 * AkademiHub - Analytics Config Loaders
 * ============================================
 * 
 * PHASE 3.4 - DB'den Config Okuma
 * 
 * Bu dosya:
 * - exam_risk_config tablosundan risk ayarlarını okur
 * - exam_trend_config tablosundan trend ayarlarını okur
 * - Bulunamazsa DEFAULT değerlere döner
 * - FAIL-SAFE: Hata olsa bile sistem çalışır
 * 
 * KURALLAR:
 * - Her zaman varsayılana düşebilir
 * - Hiçbir hata sistemi durdurmaz
 * - Cache mekanizması (5 dakika)
 */

import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  DEFAULT_TREND_CONFIG,
  CONFIG_VERSION,
  type RiskWeightConfig,
  type RiskThresholdConfig,
  type TrendConfig
} from './defaults';

// ==================== CACHE ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 dakika

let riskConfigCache: CacheEntry<LoadedRiskConfig> | null = null;
let trendConfigCache: CacheEntry<TrendConfig> | null = null;

// ==================== TYPES ====================

export interface LoadedRiskConfig {
  weights: RiskWeightConfig;
  thresholds: RiskThresholdConfig;
  config_version: string;
  loaded_from: 'database' | 'defaults';
  loaded_at: string;
}

export interface LoadedTrendConfig extends TrendConfig {
  config_version: string;
  loaded_from: 'database' | 'defaults';
  loaded_at: string;
}

// ==================== RISK CONFIG LOADER ====================

/**
 * Risk konfigürasyonunu yükler
 * 
 * Öncelik sırası:
 * 1. Cache (5 dakika geçerli)
 * 2. Database (exam_risk_config)
 * 3. Defaults (her zaman çalışır)
 * 
 * @param examTypeCode - Sınav tipi (LGS, TYT, AYT)
 * @param forceRefresh - Cache'i atla
 */
export async function loadRiskConfig(
  examTypeCode?: string,
  forceRefresh: boolean = false
): Promise<LoadedRiskConfig> {
  const now = Date.now();
  
  // Cache kontrolü
  if (!forceRefresh && riskConfigCache && riskConfigCache.expiresAt > now) {
    return riskConfigCache.data;
  }
  
  try {
    const supabase = createClient();
    
    // DB'den oku
    let query = supabase
      .from('exam_risk_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Sınav tipine göre filtrele (varsa)
    if (examTypeCode) {
      query = query.or(`exam_type_code.eq.${examTypeCode},exam_type_code.is.null`);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      // DB'de bulunamadı, varsayılana dön
      console.warn('[ConfigLoader] Risk config not found in DB, using defaults');
      return createDefaultRiskConfig();
    }
    
    // DB'den gelen veriyi parse et
    const loadedConfig: LoadedRiskConfig = {
      weights: parseRiskWeights(data),
      thresholds: parseRiskThresholds(data),
      config_version: data.version ?? CONFIG_VERSION,
      loaded_from: 'database',
      loaded_at: new Date().toISOString()
    };
    
    // Cache'e yaz
    riskConfigCache = {
      data: loadedConfig,
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS
    };
    
    return loadedConfig;
    
  } catch (error) {
    console.error('[ConfigLoader] Failed to load risk config:', error);
    return createDefaultRiskConfig();
  }
}

/**
 * Varsayılan risk config oluşturur
 */
function createDefaultRiskConfig(): LoadedRiskConfig {
  return {
    weights: { ...DEFAULT_RISK_WEIGHTS },
    thresholds: { ...DEFAULT_RISK_THRESHOLDS },
    config_version: CONFIG_VERSION,
    loaded_from: 'defaults',
    loaded_at: new Date().toISOString()
  };
}

/**
 * DB verisinden risk ağırlıklarını parse eder
 */
function parseRiskWeights(data: any): RiskWeightConfig {
  const weights = data.weights ?? data.risk_weights ?? {};
  
  return {
    net_drop_weight: parseFloat(weights.net_drop_weight) || DEFAULT_RISK_WEIGHTS.net_drop_weight,
    trend_velocity_weight: parseFloat(weights.trend_velocity_weight) || DEFAULT_RISK_WEIGHTS.trend_velocity_weight,
    consistency_weight: parseFloat(weights.consistency_weight) || DEFAULT_RISK_WEIGHTS.consistency_weight,
    weak_topic_weight: parseFloat(weights.weak_topic_weight) || DEFAULT_RISK_WEIGHTS.weak_topic_weight,
    empty_answer_weight: parseFloat(weights.empty_answer_weight) || DEFAULT_RISK_WEIGHTS.empty_answer_weight,
    difficulty_gap_weight: parseFloat(weights.difficulty_gap_weight) || DEFAULT_RISK_WEIGHTS.difficulty_gap_weight,
    rank_drop_weight: parseFloat(weights.rank_drop_weight) || DEFAULT_RISK_WEIGHTS.rank_drop_weight
  };
}

/**
 * DB verisinden risk eşiklerini parse eder
 */
function parseRiskThresholds(data: any): RiskThresholdConfig {
  const thresholds = data.thresholds ?? data.risk_thresholds ?? {};
  
  return {
    net_drop_critical: parseFloat(thresholds.net_drop_critical) || DEFAULT_RISK_THRESHOLDS.net_drop_critical,
    net_drop_warning: parseFloat(thresholds.net_drop_warning) || DEFAULT_RISK_THRESHOLDS.net_drop_warning,
    net_drop_normal: parseFloat(thresholds.net_drop_normal) || DEFAULT_RISK_THRESHOLDS.net_drop_normal,
    empty_rate_critical: parseFloat(thresholds.empty_rate_critical) || DEFAULT_RISK_THRESHOLDS.empty_rate_critical,
    empty_rate_warning: parseFloat(thresholds.empty_rate_warning) || DEFAULT_RISK_THRESHOLDS.empty_rate_warning,
    weak_topic_rate_critical: parseFloat(thresholds.weak_topic_rate_critical) || DEFAULT_RISK_THRESHOLDS.weak_topic_rate_critical,
    weak_topic_rate_warning: parseFloat(thresholds.weak_topic_rate_warning) || DEFAULT_RISK_THRESHOLDS.weak_topic_rate_warning,
    consistency_low: parseFloat(thresholds.consistency_low) || DEFAULT_RISK_THRESHOLDS.consistency_low,
    consistency_good: parseFloat(thresholds.consistency_good) || DEFAULT_RISK_THRESHOLDS.consistency_good,
    difficulty_gap_critical: parseFloat(thresholds.difficulty_gap_critical) || DEFAULT_RISK_THRESHOLDS.difficulty_gap_critical,
    difficulty_gap_warning: parseFloat(thresholds.difficulty_gap_warning) || DEFAULT_RISK_THRESHOLDS.difficulty_gap_warning,
    rank_drop_critical: parseFloat(thresholds.rank_drop_critical) || DEFAULT_RISK_THRESHOLDS.rank_drop_critical,
    rank_drop_warning: parseFloat(thresholds.rank_drop_warning) || DEFAULT_RISK_THRESHOLDS.rank_drop_warning,
    risk_critical: parseFloat(thresholds.risk_critical) || DEFAULT_RISK_THRESHOLDS.risk_critical,
    risk_high: parseFloat(thresholds.risk_high) || DEFAULT_RISK_THRESHOLDS.risk_high,
    risk_medium: parseFloat(thresholds.risk_medium) || DEFAULT_RISK_THRESHOLDS.risk_medium
  };
}

// ==================== TREND CONFIG LOADER ====================

/**
 * Trend konfigürasyonunu yükler
 * 
 * @param examTypeCode - Sınav tipi
 * @param forceRefresh - Cache'i atla
 */
export async function loadTrendConfig(
  examTypeCode?: string,
  forceRefresh: boolean = false
): Promise<LoadedTrendConfig> {
  const now = Date.now();
  
  // Cache kontrolü
  if (!forceRefresh && trendConfigCache && trendConfigCache.expiresAt > now) {
    return {
      ...trendConfigCache.data,
      config_version: CONFIG_VERSION,
      loaded_from: 'database',
      loaded_at: new Date().toISOString()
    } as LoadedTrendConfig;
  }
  
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('exam_trend_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (examTypeCode) {
      query = query.or(`exam_type_code.eq.${examTypeCode},exam_type_code.is.null`);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      console.warn('[ConfigLoader] Trend config not found in DB, using defaults');
      return createDefaultTrendConfig();
    }
    
    const loadedConfig: LoadedTrendConfig = {
      ...parseTrendConfig(data),
      config_version: data.version ?? CONFIG_VERSION,
      loaded_from: 'database',
      loaded_at: new Date().toISOString()
    };
    
    // Cache'e yaz
    trendConfigCache = {
      data: loadedConfig,
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS
    };
    
    return loadedConfig;
    
  } catch (error) {
    console.error('[ConfigLoader] Failed to load trend config:', error);
    return createDefaultTrendConfig();
  }
}

/**
 * Varsayılan trend config oluşturur
 */
function createDefaultTrendConfig(): LoadedTrendConfig {
  return {
    ...DEFAULT_TREND_CONFIG,
    config_version: CONFIG_VERSION,
    loaded_from: 'defaults',
    loaded_at: new Date().toISOString()
  };
}

/**
 * DB verisinden trend config parse eder
 */
function parseTrendConfig(data: any): TrendConfig {
  return {
    window_size: parseInt(data.window_size) || DEFAULT_TREND_CONFIG.window_size,
    min_data_points: parseInt(data.min_data_points) || DEFAULT_TREND_CONFIG.min_data_points,
    weight_distribution: Array.isArray(data.weight_distribution) 
      ? data.weight_distribution.map(Number)
      : DEFAULT_TREND_CONFIG.weight_distribution,
    direction_up_threshold: parseFloat(data.direction_up_threshold) || DEFAULT_TREND_CONFIG.direction_up_threshold,
    direction_down_threshold: parseFloat(data.direction_down_threshold) || DEFAULT_TREND_CONFIG.direction_down_threshold,
    velocity_max: parseFloat(data.velocity_max) || DEFAULT_TREND_CONFIG.velocity_max,
    velocity_min: parseFloat(data.velocity_min) || DEFAULT_TREND_CONFIG.velocity_min,
    consistency_good: parseFloat(data.consistency_good) || DEFAULT_TREND_CONFIG.consistency_good,
    consistency_bad: parseFloat(data.consistency_bad) || DEFAULT_TREND_CONFIG.consistency_bad
  };
}

// ==================== CACHE MANAGEMENT ====================

/**
 * Tüm config cache'lerini temizler
 */
export function clearConfigCache(): void {
  riskConfigCache = null;
  trendConfigCache = null;
  console.log('[ConfigLoader] Config cache cleared');
}

/**
 * Cache durumunu döner
 */
export function getConfigCacheStatus(): {
  risk: { cached: boolean; expiresIn: number | null };
  trend: { cached: boolean; expiresIn: number | null };
} {
  const now = Date.now();
  
  return {
    risk: {
      cached: riskConfigCache !== null && riskConfigCache.expiresAt > now,
      expiresIn: riskConfigCache ? Math.max(0, riskConfigCache.expiresAt - now) : null
    },
    trend: {
      cached: trendConfigCache !== null && trendConfigCache.expiresAt > now,
      expiresIn: trendConfigCache ? Math.max(0, trendConfigCache.expiresAt - now) : null
    }
  };
}

// ==================== COMBINED LOADER ====================

/**
 * Tüm config'leri tek seferde yükler
 * 
 * @param examTypeCode - Sınav tipi
 */
export async function loadAllConfigs(
  examTypeCode?: string
): Promise<{
  risk: LoadedRiskConfig;
  trend: LoadedTrendConfig;
}> {
  const [risk, trend] = await Promise.all([
    loadRiskConfig(examTypeCode),
    loadTrendConfig(examTypeCode)
  ]);
  
  return { risk, trend };
}

// ==================== EXPORTS ====================

export default {
  loadRiskConfig,
  loadTrendConfig,
  loadAllConfigs,
  clearConfigCache,
  getConfigCacheStatus
};
