/**
 * ============================================
 * AkademiHub - Pure Risk Score Calculation
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * Sadece input → output
 */

import type {
  RiskScoreInput,
  RiskScoreResult,
  RiskFactor,
  RiskLevel,
  RiskWeights,
  RiskThresholds
} from './types';
import { DEFAULT_RISK_WEIGHTS, DEFAULT_RISK_THRESHOLDS } from './types';

// ==================== RİSK SKORU HESAPLAMA ====================

/**
 * Risk skoru hesaplar
 * Öğrencinin akademik risk seviyesini belirler
 * 
 * @param input - Risk hesaplama girdisi
 * @returns Risk skoru sonucu
 * 
 * @example
 * calculateRiskScore({
 *   currentNet: 45,
 *   previousNet: 50,
 *   classAvgNet: 55,
 *   consistencyScore: 0.65,
 *   weakTopicCount: 5,
 *   totalTopicCount: 15,
 *   emptyRate: 0.15
 * })
 */
export function calculateRiskScore(input: RiskScoreInput): RiskScoreResult {
  // Config değerlerini al
  const weights = mergeWeights(input.weights);
  const thresholds = mergeThresholds(input.thresholds);
  
  // Faktörleri hesapla
  const factors: RiskFactor[] = [];
  let totalScore = 0;
  
  // 1. Net Düşüşü Faktörü
  const netDropFactor = calculateNetDropFactor(input, weights, thresholds);
  if (netDropFactor) {
    factors.push(netDropFactor);
    totalScore += netDropFactor.contribution * weights.netDrop;
  }
  
  // 2. Tutarlılık Faktörü
  const consistencyFactor = calculateConsistencyFactor(input, weights, thresholds);
  if (consistencyFactor) {
    factors.push(consistencyFactor);
    totalScore += consistencyFactor.contribution * weights.consistency;
  }
  
  // 3. Zayıf Konu Faktörü
  const weakTopicFactor = calculateWeakTopicFactor(input, weights, thresholds);
  if (weakTopicFactor) {
    factors.push(weakTopicFactor);
    totalScore += weakTopicFactor.contribution * weights.weakTopics;
  }
  
  // 4. Zorluk Farkı Faktörü
  const difficultyFactor = calculateDifficultyFactor(input, weights);
  if (difficultyFactor) {
    factors.push(difficultyFactor);
    totalScore += difficultyFactor.contribution * weights.difficultyGap;
  }
  
  // 5. Sıralama Düşüşü Faktörü
  const rankDropFactor = calculateRankDropFactor(input, weights);
  if (rankDropFactor) {
    factors.push(rankDropFactor);
    totalScore += rankDropFactor.contribution * weights.rankDrop;
  }
  
  // 6. Boş Bırakma Faktörü
  const emptyFactor = calculateEmptyFactor(input, weights);
  if (emptyFactor) {
    factors.push(emptyFactor);
    totalScore += emptyFactor.contribution * weights.emptyRate;
  }
  
  // Normalize et (0-1 arası)
  const normalizedScore = Math.min(1, Math.max(0, totalScore));
  
  // Seviye belirle
  const level = determineRiskLevel(normalizedScore, thresholds);
  
  // Özet oluştur
  const summary = generateRiskSummary(level, factors);
  
  return {
    level,
    score: round(normalizedScore, 4),
    factors: factors.sort((a, b) => b.contribution - a.contribution),
    summary
  };
}

// ==================== FAKTÖR HESAPLAMALARI ====================

/**
 * Net düşüşü faktörü
 */
function calculateNetDropFactor(
  input: RiskScoreInput,
  weights: RiskWeights,
  thresholds: RiskThresholds
): RiskFactor | null {
  if (input.previousNet === undefined) return null;
  
  const drop = input.previousNet - input.currentNet;
  
  if (drop <= 0) {
    // Düşüş yok, pozitif gelişme
    return {
      code: 'NET_STABLE_OR_UP',
      name: 'Net Performansı',
      contribution: 0,
      severity: 'low',
      description: `Net stabil veya artışta (${formatChange(-drop)})`
    };
  }
  
  // Contribution hesapla
  let contribution: number;
  let severity: RiskFactor['severity'];
  
  if (drop >= thresholds.netDropCritical) {
    contribution = 1.0;
    severity = 'high';
  } else if (drop >= thresholds.netDropWarning) {
    contribution = 0.6 + (drop - thresholds.netDropWarning) / 
                   (thresholds.netDropCritical - thresholds.netDropWarning) * 0.4;
    severity = 'medium';
  } else {
    contribution = drop / thresholds.netDropWarning * 0.6;
    severity = 'low';
  }
  
  return {
    code: 'NET_DROP',
    name: 'Net Düşüşü',
    contribution: round(contribution, 4),
    severity,
    description: `Son sınava göre ${drop.toFixed(1)} net düşüş`
  };
}

/**
 * Tutarlılık faktörü
 */
function calculateConsistencyFactor(
  input: RiskScoreInput,
  weights: RiskWeights,
  thresholds: RiskThresholds
): RiskFactor | null {
  if (input.consistencyScore === undefined) return null;
  
  const score = input.consistencyScore;
  
  if (score >= thresholds.consistencyLow) {
    return {
      code: 'CONSISTENCY_OK',
      name: 'Tutarlılık',
      contribution: 0,
      severity: 'low',
      description: `Performans tutarlı (%${(score * 100).toFixed(0)})`
    };
  }
  
  // Düşük tutarlılık
  const contribution = (thresholds.consistencyLow - score) / thresholds.consistencyLow;
  
  return {
    code: 'CONSISTENCY_LOW',
    name: 'Tutarsız Performans',
    contribution: round(contribution, 4),
    severity: contribution > 0.5 ? 'high' : 'medium',
    description: `Performans dalgalanması yüksek (%${(score * 100).toFixed(0)} tutarlılık)`
  };
}

/**
 * Zayıf konu faktörü
 */
function calculateWeakTopicFactor(
  input: RiskScoreInput,
  weights: RiskWeights,
  thresholds: RiskThresholds
): RiskFactor | null {
  if (input.totalTopicCount === 0) return null;
  
  const weakRate = input.weakTopicCount / input.totalTopicCount;
  
  if (weakRate <= 0.1) {
    return {
      code: 'TOPICS_OK',
      name: 'Konu Hakimiyeti',
      contribution: 0,
      severity: 'low',
      description: 'Çoğu konuda başarılı'
    };
  }
  
  // Contribution hesapla
  const contribution = Math.min(1, weakRate / thresholds.weakTopicRate);
  
  return {
    code: 'WEAK_TOPICS',
    name: 'Zayıf Konular',
    contribution: round(contribution, 4),
    severity: weakRate > 0.5 ? 'high' : weakRate > 0.3 ? 'medium' : 'low',
    description: `${input.weakTopicCount}/${input.totalTopicCount} konuda düşük başarı`
  };
}

/**
 * Zorluk farkı faktörü
 */
function calculateDifficultyFactor(
  input: RiskScoreInput,
  weights: RiskWeights
): RiskFactor | null {
  if (input.easySuccessRate === undefined || input.hardSuccessRate === undefined) {
    return null;
  }
  
  // Kolay soruları yapıp zor soruları yapamama
  const gap = input.easySuccessRate - input.hardSuccessRate;
  
  if (gap <= 0.3) {
    // Normal fark
    return {
      code: 'DIFFICULTY_OK',
      name: 'Zorluk Dengesi',
      contribution: 0,
      severity: 'low',
      description: 'Tüm zorluk seviyelerinde dengeli performans'
    };
  }
  
  // Büyük fark = sorun
  const contribution = Math.min(1, (gap - 0.3) / 0.5);
  
  return {
    code: 'DIFFICULTY_GAP',
    name: 'Zorluk Farkı',
    contribution: round(contribution, 4),
    severity: gap > 0.6 ? 'high' : 'medium',
    description: `Kolay: %${(input.easySuccessRate * 100).toFixed(0)}, Zor: %${(input.hardSuccessRate * 100).toFixed(0)}`
  };
}

/**
 * Sıralama düşüşü faktörü
 */
function calculateRankDropFactor(
  input: RiskScoreInput,
  weights: RiskWeights
): RiskFactor | null {
  if (input.currentRank === undefined || input.previousRank === undefined) {
    return null;
  }
  
  const rankDrop = input.currentRank - input.previousRank;
  
  if (rankDrop <= 0) {
    return {
      code: 'RANK_STABLE_OR_UP',
      name: 'Sıralama',
      contribution: 0,
      severity: 'low',
      description: `Sıralama korundu veya yükseldi (${formatRankChange(-rankDrop)})`
    };
  }
  
  // Toplam öğrenci sayısına göre normalize et
  const total = input.totalStudents ?? 100;
  const dropPercent = (rankDrop / total) * 100;
  
  let contribution: number;
  let severity: RiskFactor['severity'];
  
  if (dropPercent >= 20) {
    contribution = 1.0;
    severity = 'high';
  } else if (dropPercent >= 10) {
    contribution = 0.5 + (dropPercent - 10) / 20;
    severity = 'medium';
  } else {
    contribution = dropPercent / 20;
    severity = 'low';
  }
  
  return {
    code: 'RANK_DROP',
    name: 'Sıralama Düşüşü',
    contribution: round(contribution, 4),
    severity,
    description: `${rankDrop} sıra düşüş (${input.previousRank}. → ${input.currentRank}.)`
  };
}

/**
 * Boş bırakma faktörü
 */
function calculateEmptyFactor(
  input: RiskScoreInput,
  weights: RiskWeights
): RiskFactor | null {
  if (input.emptyRate === undefined) return null;
  
  const rate = input.emptyRate;
  
  if (rate <= 0.05) {
    return {
      code: 'EMPTY_OK',
      name: 'Tamamlama',
      contribution: 0,
      severity: 'low',
      description: 'Neredeyse tüm sorular cevaplanmış'
    };
  }
  
  // Yüksek boş bırakma oranı
  const contribution = Math.min(1, rate / 0.3);
  
  return {
    code: 'HIGH_EMPTY',
    name: 'Boş Bırakma',
    contribution: round(contribution, 4),
    severity: rate > 0.2 ? 'high' : rate > 0.1 ? 'medium' : 'low',
    description: `%${(rate * 100).toFixed(0)} soru boş bırakılmış`
  };
}

// ==================== SEVİYE BELİRLEME ====================

function determineRiskLevel(
  score: number,
  thresholds: RiskThresholds
): RiskLevel {
  if (score >= thresholds.riskHigh) return 'high';
  if (score >= thresholds.riskMedium) return 'medium';
  return 'low';
}

// ==================== ÖZET OLUŞTURMA ====================

function generateRiskSummary(level: RiskLevel, factors: RiskFactor[]): string {
  const highFactors = factors.filter(f => f.severity === 'high');
  const mediumFactors = factors.filter(f => f.severity === 'medium');
  
  if (level === 'low') {
    return 'Öğrenci genel olarak stabil performans gösteriyor. Ciddi risk faktörü bulunmuyor.';
  }
  
  if (level === 'medium') {
    const concerns = [...highFactors, ...mediumFactors].slice(0, 2).map(f => f.name);
    return `Dikkat edilmesi gereken alanlar: ${concerns.join(', ')}. İzleme önerilir.`;
  }
  
  // high
  const topConcerns = highFactors.slice(0, 3).map(f => f.name);
  return `Yüksek risk! Ana sorunlar: ${topConcerns.join(', ')}. Acil müdahale önerilir.`;
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function mergeWeights(custom?: Partial<RiskWeights>): RiskWeights {
  return { ...DEFAULT_RISK_WEIGHTS, ...custom };
}

function mergeThresholds(custom?: Partial<RiskThresholds>): RiskThresholds {
  return { ...DEFAULT_RISK_THRESHOLDS, ...custom };
}

function formatChange(change: number): string {
  if (change > 0) return `+${change.toFixed(1)}`;
  if (change < 0) return change.toFixed(1);
  return '0';
}

function formatRankChange(change: number): string {
  if (change > 0) return `+${change} sıra`;
  if (change < 0) return `${change} sıra`;
  return 'değişim yok';
}

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  calculateRiskScore
};
