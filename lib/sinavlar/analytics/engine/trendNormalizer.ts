/**
 * ============================================
 * AkademiHub - Trend Normalizer (Pure Functions)
 * ============================================
 * 
 * PHASE 3.4 - Bilimsel Trend Normalizasyonu
 * 
 * Bu dosya:
 * - Trend velocity hesaplar (linear regression)
 * - Trend consistency hesaplar (std deviation)
 * - Trend yönü belirler
 * - Trend skoru normalize eder (-100 ile +100)
 * - İnsan okunabilir açıklama üretir
 * 
 * KURALLAR:
 * - PURE FUNCTION - side effect YOK
 * - DB çağrısı YOK
 * - Immutable input/output
 * - Number.EPSILON hassasiyeti
 */

import { DEFAULT_TREND_CONFIG, TREND_EXPLANATION_TEMPLATES } from '../config/defaults';
import type { TrendConfig } from '../config/defaults';

// ==================== TYPES ====================

export interface TrendNormalizerInput {
  // Net değerleri (eski → yeni sıralı)
  nets: number[];
  
  // Opsiyonel config (yoksa defaults kullanılır)
  config?: Partial<TrendConfig>;
  
  // Ek bağlam
  classAvgNet?: number;
  targetNet?: number;
}

export interface NormalizedTrendResult {
  // Ham değerler
  raw_nets: number[];
  weighted_nets: number[];
  
  // Velocity (eğim)
  velocity: number;              // Net/sınav cinsinden
  velocity_normalized: number;   // [-1, 1] arası
  
  // Consistency
  std_deviation: number;
  consistency: number;           // [0, 1] arası (1 = çok tutarlı)
  
  // Trend skoru
  trend_score: number;           // [-100, +100] arası
  
  // Yön
  direction: 'up' | 'down' | 'stable';
  
  // Change
  recent_change: number;         // Son 2 sınav farkı
  total_change: number;          // İlk-son fark
  
  // Açıklama
  explanation: string;
  explanation_key: string;
  
  // Veri yeterliliği
  has_sufficient_data: boolean;
  data_point_count: number;
}

// ==================== ANA FONKSİYON ====================

/**
 * Trend verilerini normalize eder ve analiz eder
 * 
 * PURE FUNCTION - Side effect yok
 * 
 * @param input - Trend girdisi
 * @returns Normalize edilmiş trend sonucu
 */
export function normalizeTrend(input: TrendNormalizerInput): NormalizedTrendResult {
  const config = { ...DEFAULT_TREND_CONFIG, ...input.config };
  const nets = input.nets ?? [];
  
  // Veri yeterliliği kontrolü
  if (nets.length < config.min_data_points) {
    return createInsufficientDataResult(nets);
  }
  
  // Son N veriyi al (window_size)
  const windowedNets = nets.slice(-config.window_size);
  
  // Ağırlıklı değerler hesapla
  const weightedNets = calculateWeightedNets(windowedNets, config.weight_distribution);
  
  // Velocity (linear regression slope)
  const velocity = calculateVelocity(windowedNets);
  
  // Velocity normalize [-1, 1]
  const velocityNormalized = normalizeVelocity(velocity, config);
  
  // Std deviation
  const stdDeviation = calculateStdDeviation(windowedNets);
  
  // Consistency [0, 1]
  const consistency = normalizeConsistency(stdDeviation, config);
  
  // Trend score [-100, +100]
  const trendScore = calculateTrendScore(velocityNormalized, consistency);
  
  // Direction
  const direction = determineDirection(velocity, config);
  
  // Changes
  const recentChange = windowedNets.length >= 2
    ? round(windowedNets[windowedNets.length - 1] - windowedNets[windowedNets.length - 2])
    : 0;
  
  const totalChange = windowedNets.length >= 2
    ? round(windowedNets[windowedNets.length - 1] - windowedNets[0])
    : 0;
  
  // Explanation
  const { explanation, explanationKey } = generateExplanation(
    direction,
    velocity,
    consistency,
    windowedNets.length,
    input.classAvgNet,
    windowedNets[windowedNets.length - 1]
  );
  
  return {
    raw_nets: windowedNets,
    weighted_nets: weightedNets,
    velocity: round(velocity),
    velocity_normalized: round(velocityNormalized, 4),
    std_deviation: round(stdDeviation),
    consistency: round(consistency, 4),
    trend_score: round(trendScore),
    direction,
    recent_change: recentChange,
    total_change: totalChange,
    explanation,
    explanation_key: explanationKey,
    has_sufficient_data: true,
    data_point_count: windowedNets.length
  };
}

// ==================== HESAPLAMA YARDIMCILARI ====================

/**
 * Ağırlıklı net değerleri hesaplar
 */
function calculateWeightedNets(nets: number[], weights: number[]): number[] {
  if (nets.length === 0) return [];
  
  // Ağırlıkları net sayısına göre ayarla
  const adjustedWeights = adjustWeights(weights, nets.length);
  
  return nets.map((net, i) => round(net * adjustedWeights[i]));
}

/**
 * Ağırlıkları veri sayısına göre ayarlar
 */
function adjustWeights(weights: number[], dataCount: number): number[] {
  if (dataCount >= weights.length) {
    return weights.slice(0, dataCount);
  }
  
  // Daha az veri varsa, ağırlıkları yeniden dağıt
  const availableWeights = weights.slice(0, dataCount);
  const sum = availableWeights.reduce((a, b) => a + b, 0);
  
  // Normalize et (toplam 1 olsun)
  return availableWeights.map(w => w / sum);
}

/**
 * Linear regression ile velocity (eğim) hesaplar
 */
function calculateVelocity(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  
  // x = 0, 1, 2, ... (sınav sırası)
  // y = net değerleri
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const denominator = n * sumX2 - sumX * sumX;
  
  // Sıfıra bölme koruması
  if (Math.abs(denominator) < Number.EPSILON) {
    return 0;
  }
  
  const slope = (n * sumXY - sumX * sumY) / denominator;
  
  return slope;
}

/**
 * Velocity'yi [-1, 1] arasına normalize eder
 */
function normalizeVelocity(velocity: number, config: TrendConfig): number {
  if (velocity >= 0) {
    return Math.min(1, velocity / config.velocity_max);
  } else {
    return Math.max(-1, velocity / Math.abs(config.velocity_min));
  }
}

/**
 * Standart sapma hesaplar
 */
function calculateStdDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  
  return Math.sqrt(variance);
}

/**
 * Consistency'yi [0, 1] arasına normalize eder
 * Düşük std dev = yüksek consistency
 */
function normalizeConsistency(stdDev: number, config: TrendConfig): number {
  if (stdDev <= config.consistency_good) {
    return 1.0;
  }
  
  if (stdDev >= config.consistency_bad) {
    return 0.0;
  }
  
  // Linear interpolation
  const range = config.consistency_bad - config.consistency_good;
  const normalized = 1 - ((stdDev - config.consistency_good) / range);
  
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Trend skoru hesaplar [-100, +100]
 * 
 * Formül: score = velocity_norm * 100 * (0.7 + 0.3 * consistency)
 * Tutarlı trendler daha güçlü sinyal verir
 */
function calculateTrendScore(velocityNorm: number, consistency: number): number {
  // Consistency bonus: tutarlı trend daha güçlü sinyal
  const consistencyMultiplier = 0.7 + (0.3 * consistency);
  
  const score = velocityNorm * 100 * consistencyMultiplier;
  
  return Math.max(-100, Math.min(100, score));
}

/**
 * Trend yönünü belirler
 */
function determineDirection(
  velocity: number,
  config: TrendConfig
): 'up' | 'down' | 'stable' {
  if (velocity >= config.direction_up_threshold) {
    return 'up';
  }
  
  if (velocity <= config.direction_down_threshold) {
    return 'down';
  }
  
  return 'stable';
}

// ==================== AÇIKLAMA ÜRETİMİ ====================

/**
 * İnsan okunabilir trend açıklaması üretir
 */
function generateExplanation(
  direction: 'up' | 'down' | 'stable',
  velocity: number,
  consistency: number,
  dataCount: number,
  classAvgNet?: number,
  currentNet?: number
): { explanation: string; explanationKey: string } {
  
  // Volatility belirleme
  const isVolatile = consistency < 0.5;
  
  let explanationKey: string;
  let template: string;
  
  if (direction === 'up') {
    explanationKey = isVolatile ? 'up_volatile' : 'up_stable';
    template = TREND_EXPLANATION_TEMPLATES[explanationKey];
  } else if (direction === 'down') {
    explanationKey = isVolatile ? 'down_volatile' : 'down_stable';
    template = TREND_EXPLANATION_TEMPLATES[explanationKey];
  } else {
    // Stable - performans seviyesine göre
    if (currentNet !== undefined && classAvgNet !== undefined) {
      if (currentNet >= classAvgNet + 5) {
        explanationKey = 'stable_good';
      } else if (currentNet >= classAvgNet - 5) {
        explanationKey = 'stable_average';
      } else {
        explanationKey = 'stable_low';
      }
    } else {
      explanationKey = 'stable_average';
    }
    template = TREND_EXPLANATION_TEMPLATES[explanationKey];
  }
  
  // Template'i doldur
  const explanation = template
    .replace('{count}', String(dataCount))
    .replace('{velocity}', String(Math.abs(round(velocity, 1))));
  
  return { explanation, explanationKey };
}

// ==================== INSUFFICIENT DATA RESULT ====================

function createInsufficientDataResult(nets: number[]): NormalizedTrendResult {
  const lastNet = nets.length > 0 ? nets[nets.length - 1] : 0;
  
  return {
    raw_nets: nets,
    weighted_nets: [],
    velocity: 0,
    velocity_normalized: 0,
    std_deviation: 0,
    consistency: 1,
    trend_score: 0,
    direction: 'stable',
    recent_change: 0,
    total_change: 0,
    explanation: TREND_EXPLANATION_TEMPLATES.insufficient_data,
    explanation_key: 'insufficient_data',
    has_sufficient_data: false,
    data_point_count: nets.length
  };
}

// ==================== YARDIMCI ====================

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

// ==================== BATCH PROCESSING ====================

/**
 * Birden fazla öğrenci için trend normalize eder
 * (Class-level analiz için)
 */
export function normalizeTrendBatch(
  inputs: TrendNormalizerInput[]
): NormalizedTrendResult[] {
  return inputs.map(normalizeTrend);
}

/**
 * Trend karşılaştırma skoru hesaplar
 * (İki öğrenciyi karşılaştırmak için)
 */
export function compareTrends(
  trend1: NormalizedTrendResult,
  trend2: NormalizedTrendResult
): {
  velocity_diff: number;
  consistency_diff: number;
  score_diff: number;
  better: 1 | 2 | 0;
} {
  const velocityDiff = round(trend1.velocity - trend2.velocity);
  const consistencyDiff = round(trend1.consistency - trend2.consistency);
  const scoreDiff = round(trend1.trend_score - trend2.trend_score);
  
  let better: 1 | 2 | 0 = 0;
  if (scoreDiff > 5) better = 1;
  else if (scoreDiff < -5) better = 2;
  
  return {
    velocity_diff: velocityDiff,
    consistency_diff: consistencyDiff,
    score_diff: scoreDiff,
    better
  };
}

// ==================== EXPORTS ====================

export default {
  normalizeTrend,
  normalizeTrendBatch,
  compareTrends
};
