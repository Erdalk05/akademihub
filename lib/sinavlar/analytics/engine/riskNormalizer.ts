/**
 * ============================================
 * AkademiHub - Risk Normalizer (Pure Functions)
 * ============================================
 * 
 * PHASE 3.4 - Açıklanabilir Risk Skorlaması
 * 
 * Bu dosya:
 * - Tüm risk faktörlerini [0, 1] arasına normalize eder
 * - DB config ile çalışır (yoksa defaults)
 * - Her faktör için açıklama üretir
 * - Final risk skoru hesaplar [0, 100]
 * - Risk kategorisi belirler
 * 
 * KURALLAR:
 * - PURE FUNCTION - side effect YOK
 * - DB çağrısı YOK
 * - Immutable input/output
 * - Number.EPSILON hassasiyeti
 */

import { 
  DEFAULT_RISK_WEIGHTS, 
  DEFAULT_RISK_THRESHOLDS,
  RISK_EXPLANATION_TEMPLATES,
  RISK_LEVEL_LABELS,
  type RiskWeightConfig,
  type RiskThresholdConfig
} from '../config/defaults';

// ==================== TYPES ====================

export interface RiskNormalizerInput {
  // Net ve değişim
  current_net: number;
  previous_net?: number;
  class_avg_net?: number;
  
  // Trend
  trend_velocity?: number;         // net/sınav cinsinden
  trend_consistency?: number;      // [0, 1]
  
  // Konu performansı
  weak_topic_count: number;
  total_topic_count: number;
  
  // Boş bırakma
  empty_count: number;
  total_questions: number;
  
  // Zorluk performansı
  easy_success_rate?: number;      // [0, 1]
  hard_success_rate?: number;      // [0, 1]
  
  // Sıralama
  current_rank?: number;
  previous_rank?: number;
  total_students?: number;
  
  // Config (DB'den veya defaults)
  weights?: Partial<RiskWeightConfig>;
  thresholds?: Partial<RiskThresholdConfig>;
}

export interface RiskFactorExplanation {
  factor: string;                  // Faktör kodu
  factor_name: string;             // Faktör adı (Türkçe)
  raw_value: number;               // Ham değer
  normalized_value: number;        // Normalize edilmiş [0, 1]
  weight: number;                  // Config'den gelen ağırlık
  impact_score: number;            // normalized * weight
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;             // İnsan okunabilir açıklama
}

export interface NormalizedRiskResult {
  // Final skor ve kategori
  score: number;                   // [0, 100]
  level: 'low' | 'medium' | 'high' | 'critical';
  level_label: string;             // Türkçe etiket
  level_color: string;             // UI rengi
  
  // Faktör detayları
  factors: RiskFactorExplanation[];
  
  // Özet
  primary_concern: string | null;  // En büyük risk faktörü
  action_required: boolean;
  
  // Genel açıklama
  summary: string;
  
  // Meta
  factors_evaluated: number;
  config_source: 'database' | 'defaults';
  
  // AI-Ready text
  ai_ready_text: string;
}

// ==================== FACTOR NAMES ====================

const FACTOR_NAMES: Record<string, string> = {
  net_drop: 'Net Düşüşü',
  trend_velocity: 'Trend Hızı',
  consistency: 'Tutarlılık',
  weak_topics: 'Zayıf Konular',
  empty_answers: 'Boş Bırakma',
  difficulty_gap: 'Zorluk Farkı',
  rank_drop: 'Sıralama Düşüşü'
};

// ==================== ANA FONKSİYON ====================

/**
 * Risk skorunu normalize eder ve açıklar
 * 
 * PURE FUNCTION - Side effect yok
 * 
 * @param input - Risk girdisi
 * @returns Normalize edilmiş ve açıklanmış risk sonucu
 */
export function normalizeRisk(input: RiskNormalizerInput): NormalizedRiskResult {
  const weights = { ...DEFAULT_RISK_WEIGHTS, ...input.weights };
  const thresholds = { ...DEFAULT_RISK_THRESHOLDS, ...input.thresholds };
  
  const factors: RiskFactorExplanation[] = [];
  
  // 1. Net düşüşü faktörü
  const netDropFactor = calculateNetDropFactor(input, weights, thresholds);
  if (netDropFactor) factors.push(netDropFactor);
  
  // 2. Trend velocity faktörü
  const trendFactor = calculateTrendFactor(input, weights, thresholds);
  if (trendFactor) factors.push(trendFactor);
  
  // 3. Consistency faktörü
  const consistencyFactor = calculateConsistencyFactor(input, weights, thresholds);
  if (consistencyFactor) factors.push(consistencyFactor);
  
  // 4. Zayıf konu faktörü
  const weakTopicsFactor = calculateWeakTopicsFactor(input, weights, thresholds);
  if (weakTopicsFactor) factors.push(weakTopicsFactor);
  
  // 5. Boş bırakma faktörü
  const emptyFactor = calculateEmptyFactor(input, weights, thresholds);
  if (emptyFactor) factors.push(emptyFactor);
  
  // 6. Zorluk farkı faktörü
  const difficultyFactor = calculateDifficultyFactor(input, weights, thresholds);
  if (difficultyFactor) factors.push(difficultyFactor);
  
  // 7. Sıralama düşüşü faktörü
  const rankFactor = calculateRankDropFactor(input, weights, thresholds);
  if (rankFactor) factors.push(rankFactor);
  
  // Final skor hesapla
  const totalImpact = factors.reduce((sum, f) => sum + f.impact_score, 0);
  const score = Math.min(100, Math.max(0, round(totalImpact * 100)));
  
  // Kategori belirle
  const level = determineRiskLevel(score, thresholds);
  const levelInfo = RISK_LEVEL_LABELS[level];
  
  // En büyük risk faktörünü bul
  const sortedFactors = [...factors].sort((a, b) => b.impact_score - a.impact_score);
  const primaryConcern = sortedFactors.length > 0 && sortedFactors[0].impact_score > 0.1
    ? sortedFactors[0].factor_name
    : null;
  
  // Özet açıklama oluştur
  const summary = generateRiskSummary(level, sortedFactors, input.current_net);
  
  // AI-Ready text
  const aiReadyText = generateAIReadyRiskText(level, score, sortedFactors, primaryConcern);
  
  return {
    score,
    level,
    level_label: levelInfo.tr,
    level_color: levelInfo.color,
    factors: sortedFactors,
    primary_concern: primaryConcern,
    action_required: level === 'high' || level === 'critical',
    summary,
    factors_evaluated: factors.length,
    config_source: input.weights ? 'database' : 'defaults',
    ai_ready_text: aiReadyText
  };
}

// ==================== FAKTÖR HESAPLAMA FONKSİYONLARI ====================

/**
 * Net düşüşü faktörü
 */
function calculateNetDropFactor(
  input: RiskNormalizerInput,
  weights: RiskWeightConfig,
  thresholds: RiskThresholdConfig
): RiskFactorExplanation | null {
  if (input.previous_net === undefined) return null;
  
  const rawValue = input.previous_net - input.current_net;
  
  // Negatif değer = artış = risk yok
  if (rawValue <= 0) {
    return createFactor(
      'net_drop',
      rawValue,
      0,
      weights.net_drop_weight,
      'normal',
      thresholds
    );
  }
  
  // Normalize [0, 1]
  const normalized = Math.min(1, rawValue / thresholds.net_drop_critical);
  
  const severity = rawValue >= thresholds.net_drop_critical ? 'critical'
    : rawValue >= thresholds.net_drop_warning ? 'high'
    : rawValue >= thresholds.net_drop_normal ? 'medium'
    : 'low';
  
  return createFactor('net_drop', rawValue, normalized, weights.net_drop_weight, severity, thresholds);
}

/**
 * Trend velocity faktörü
 */
function calculateTrendFactor(
  input: RiskNormalizerInput,
  weights: RiskWeightConfig,
  thresholds: RiskThresholdConfig
): RiskFactorExplanation | null {
  if (input.trend_velocity === undefined) return null;
  
  // Negatif velocity = düşüş = risk
  const rawValue = -input.trend_velocity; // Tersle (negatif velocity pozitif risk)
  
  if (rawValue <= 0) {
    return createFactor('trend_velocity', input.trend_velocity, 0, weights.trend_velocity_weight, 'low', thresholds);
  }
  
  // Normalize [0, 1]
  const normalized = Math.min(1, rawValue / 5); // 5 net/sınav düşüş = max risk
  
  const severity = normalized >= 0.75 ? 'critical'
    : normalized >= 0.5 ? 'high'
    : normalized >= 0.25 ? 'medium'
    : 'low';
  
  return createFactor('trend_velocity', input.trend_velocity, normalized, weights.trend_velocity_weight, severity, thresholds);
}

/**
 * Tutarlılık faktörü
 */
function calculateConsistencyFactor(
  input: RiskNormalizerInput,
  weights: RiskWeightConfig,
  thresholds: RiskThresholdConfig
): RiskFactorExplanation | null {
  if (input.trend_consistency === undefined) return null;
  
  const rawValue = input.trend_consistency;
  
  // Düşük consistency = yüksek risk
  const normalized = 1 - rawValue; // Tersle
  
  const severity = rawValue < thresholds.consistency_low * 0.5 ? 'critical'
    : rawValue < thresholds.consistency_low ? 'high'
    : rawValue < thresholds.consistency_good ? 'medium'
    : 'low';
  
  return createFactor('consistency', rawValue, normalized, weights.consistency_weight, severity, thresholds);
}

/**
 * Zayıf konu faktörü
 */
function calculateWeakTopicsFactor(
  input: RiskNormalizerInput,
  weights: RiskWeightConfig,
  thresholds: RiskThresholdConfig
): RiskFactorExplanation | null {
  if (input.total_topic_count === 0) return null;
  
  const rawValue = input.weak_topic_count / input.total_topic_count;
  const normalized = Math.min(1, rawValue / thresholds.weak_topic_rate_critical);
  
  const severity = rawValue >= thresholds.weak_topic_rate_critical ? 'critical'
    : rawValue >= thresholds.weak_topic_rate_warning ? 'high'
    : rawValue >= thresholds.weak_topic_rate_warning * 0.5 ? 'medium'
    : 'low';
  
  return createFactor('weak_topics', round(rawValue * 100), normalized, weights.weak_topic_weight, severity, thresholds);
}

/**
 * Boş bırakma faktörü
 */
function calculateEmptyFactor(
  input: RiskNormalizerInput,
  weights: RiskWeightConfig,
  thresholds: RiskThresholdConfig
): RiskFactorExplanation | null {
  if (input.total_questions === 0) return null;
  
  const rawValue = input.empty_count / input.total_questions;
  const normalized = Math.min(1, rawValue / thresholds.empty_rate_critical);
  
  const severity = rawValue >= thresholds.empty_rate_critical ? 'critical'
    : rawValue >= thresholds.empty_rate_warning ? 'high'
    : rawValue >= thresholds.empty_rate_warning * 0.5 ? 'medium'
    : 'low';
  
  return createFactor('empty_answers', round(rawValue * 100), normalized, weights.empty_answer_weight, severity, thresholds);
}

/**
 * Zorluk farkı faktörü
 */
function calculateDifficultyFactor(
  input: RiskNormalizerInput,
  weights: RiskWeightConfig,
  thresholds: RiskThresholdConfig
): RiskFactorExplanation | null {
  if (input.easy_success_rate === undefined || input.hard_success_rate === undefined) return null;
  
  // Kolay-zor farkı (kolay başarısı > zor başarısı = normal)
  const gap = input.easy_success_rate - input.hard_success_rate;
  const rawValue = Math.max(0, gap); // Sadece pozitif fark risk
  
  const normalized = Math.min(1, rawValue / thresholds.difficulty_gap_critical);
  
  const severity = rawValue >= thresholds.difficulty_gap_critical ? 'critical'
    : rawValue >= thresholds.difficulty_gap_warning ? 'high'
    : rawValue >= thresholds.difficulty_gap_warning * 0.5 ? 'medium'
    : 'low';
  
  return createFactor('difficulty_gap', round(rawValue * 100), normalized, weights.difficulty_gap_weight, severity, thresholds);
}

/**
 * Sıralama düşüşü faktörü
 */
function calculateRankDropFactor(
  input: RiskNormalizerInput,
  weights: RiskWeightConfig,
  thresholds: RiskThresholdConfig
): RiskFactorExplanation | null {
  if (input.current_rank === undefined || input.previous_rank === undefined) return null;
  
  // Rank artışı = düşüş (1. = en iyi)
  const rawValue = input.current_rank - input.previous_rank;
  
  if (rawValue <= 0) {
    return createFactor('rank_drop', rawValue, 0, weights.rank_drop_weight, 'low', thresholds);
  }
  
  const normalized = Math.min(1, rawValue / thresholds.rank_drop_critical);
  
  const severity = rawValue >= thresholds.rank_drop_critical ? 'critical'
    : rawValue >= thresholds.rank_drop_warning ? 'high'
    : rawValue >= thresholds.rank_drop_warning * 0.5 ? 'medium'
    : 'low';
  
  return createFactor('rank_drop', rawValue, normalized, weights.rank_drop_weight, severity, thresholds);
}

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Faktör objesi oluşturur
 */
function createFactor(
  factor: string,
  rawValue: number,
  normalized: number,
  weight: number,
  severity: 'low' | 'medium' | 'high' | 'critical',
  thresholds: RiskThresholdConfig
): RiskFactorExplanation {
  const impactScore = normalized * weight;
  
  // Explanation oluştur
  const templates = RISK_EXPLANATION_TEMPLATES[factor as keyof typeof RISK_EXPLANATION_TEMPLATES];
  let explanation: string;
  
  if (templates) {
    const template = severity === 'critical' || severity === 'high'
      ? templates.critical
      : severity === 'medium'
        ? templates.warning
        : templates.normal;
    
    explanation = template
      .replace('{value}', String(Math.abs(round(rawValue, 1))))
      .replace('{count}', '5');
  } else {
    explanation = `${FACTOR_NAMES[factor]}: ${round(rawValue)}`;
  }
  
  return {
    factor,
    factor_name: FACTOR_NAMES[factor] ?? factor,
    raw_value: round(rawValue),
    normalized_value: round(normalized, 4),
    weight: round(weight, 4),
    impact_score: round(impactScore, 4),
    severity,
    explanation
  };
}

/**
 * Risk seviyesi belirler
 */
function determineRiskLevel(
  score: number,
  thresholds: RiskThresholdConfig
): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= thresholds.risk_critical) return 'critical';
  if (score >= thresholds.risk_high) return 'high';
  if (score >= thresholds.risk_medium) return 'medium';
  return 'low';
}

/**
 * Risk özeti oluşturur
 */
function generateRiskSummary(
  level: 'low' | 'medium' | 'high' | 'critical',
  sortedFactors: RiskFactorExplanation[],
  currentNet: number
): string {
  const topFactors = sortedFactors
    .filter(f => f.impact_score > 0.05)
    .slice(0, 3)
    .map(f => f.factor_name.toLowerCase());
  
  switch (level) {
    case 'critical':
      return `Acil müdahale gerekli. Ana risk faktörleri: ${topFactors.join(', ') || 'belirsiz'}.`;
    
    case 'high':
      return `Dikkatli takip gerekli. ${topFactors[0] ? `Özellikle ${topFactors[0]} konusunda iyileştirme yapılmalı.` : ''}`;
    
    case 'medium':
      return `Bazı gelişim alanları var. ${topFactors[0] ? `${topFactors[0]} üzerinde çalışılabilir.` : ''}`;
    
    case 'low':
      return 'Performans iyi durumda. Mevcut çalışma düzenini korumak önemli.';
    
    default:
      return 'Risk değerlendirmesi tamamlandı.';
  }
}

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * AI için yapılandırılmış risk metni üretir
 */
function generateAIReadyRiskText(
  level: 'low' | 'medium' | 'high' | 'critical',
  score: number,
  factors: RiskFactorExplanation[],
  primaryConcern: string | null
): string {
  const topFactors = factors
    .filter(f => f.impact_score > 0.05)
    .slice(0, 3)
    .map(f => `${f.factor_name} (etki: ${round(f.impact_score * 100)}%)`);
  
  const levelText = {
    low: 'düşük risk',
    medium: 'orta risk',
    high: 'yüksek risk',
    critical: 'kritik risk'
  }[level];
  
  let text = `Risk Durumu: ${levelText.toUpperCase()} (Skor: ${score}/100). `;
  
  if (topFactors.length > 0) {
    text += `Ana faktörler: ${topFactors.join(', ')}. `;
  }
  
  if (primaryConcern) {
    text += `Öncelikli odak: ${primaryConcern}.`;
  }
  
  return text;
}

// ==================== BATCH PROCESSING ====================

/**
 * Birden fazla öğrenci için risk normalize eder
 */
export function normalizeRiskBatch(
  inputs: RiskNormalizerInput[]
): NormalizedRiskResult[] {
  return inputs.map(normalizeRisk);
}

/**
 * Risk karşılaştırma
 */
export function compareRisks(
  risk1: NormalizedRiskResult,
  risk2: NormalizedRiskResult
): {
  score_diff: number;
  level_diff: number;
  higher_risk: 1 | 2 | 0;
} {
  const levelOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  
  const scoreDiff = round(risk1.score - risk2.score);
  const levelDiff = levelOrder[risk1.level] - levelOrder[risk2.level];
  
  let higherRisk: 1 | 2 | 0 = 0;
  if (scoreDiff > 5) higherRisk = 1;
  else if (scoreDiff < -5) higherRisk = 2;
  
  return {
    score_diff: scoreDiff,
    level_diff: levelDiff,
    higher_risk: higherRisk
  };
}

// ==================== EXPORTS ====================

export default {
  normalizeRisk,
  normalizeRiskBatch,
  compareRisks
};
