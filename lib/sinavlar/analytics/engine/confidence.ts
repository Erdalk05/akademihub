/**
 * ============================================
 * AkademiHub - Pure Confidence & Reliability Functions
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * 
 * Güvenilirlik metrikleri:
 * - Veri güvenilirliği
 * - Tahmin güveni
 * - İstatistiksel güvenirlik
 * - AI-ready confidence scores
 */

// ==================== TYPES ====================

export interface ConfidenceInput {
  sampleSize: number;               // Veri noktası sayısı
  variance?: number;                // Varyans
  missingDataRate?: number;         // Eksik veri oranı (0-1)
  outlierCount?: number;            // Aykırı değer sayısı
  timeSpan?: number;                // Veri kapsadığı süre (gün)
  sourceReliability?: number;       // Kaynak güvenilirliği (0-1)
}

export interface ConfidenceResult {
  overallConfidence: number;        // 0-1 arası genel güven
  confidenceLevel: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  factors: ConfidenceFactor[];
  warnings: string[];
  isReliable: boolean;
  explanation: string;
}

export interface ConfidenceFactor {
  name: string;
  score: number;                    // 0-1
  weight: number;
  contribution: number;
  status: 'good' | 'acceptable' | 'poor';
}

export interface PredictionConfidenceInput {
  historicalDataPoints: number;
  trendConsistency: number;         // 0-1 arası
  recentDataPoints: number;
  modelAccuracy?: number;           // Model doğruluğu (0-1)
}

export interface AnalyticsReliabilityInput {
  examCount: number;
  avgQuestionsPerExam: number;
  topicCoverage: number;            // 0-1 arası konu kapsama
  timeConsistency: number;          // 0-1 arası zaman tutarlılığı
  answerQuality: number;            // 0-1 arası cevap kalitesi
}

// ==================== CONFIDENCE WEIGHTS ====================

const CONFIDENCE_WEIGHTS = {
  sampleSize: 0.30,                 // Örneklem büyüklüğü
  variance: 0.20,                   // Varyans (tutarlılık)
  missingData: 0.15,                // Eksik veri
  outliers: 0.10,                   // Aykırı değerler
  timeSpan: 0.15,                   // Zaman aralığı
  sourceReliability: 0.10           // Kaynak güvenilirliği
};

// ==================== ANA GÜVEN HESAPLAMA ====================

/**
 * Genel güven skoru hesaplar
 * 
 * @param input - Güven hesaplama girdisi
 * @returns Güven sonucu
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const factors: ConfidenceFactor[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  const warnings: string[] = [];
  
  // 1. Örneklem büyüklüğü faktörü
  const sampleFactor = calculateSampleSizeFactor(input.sampleSize);
  factors.push(sampleFactor);
  totalScore += sampleFactor.contribution;
  totalWeight += sampleFactor.weight;
  
  if (sampleFactor.status === 'poor') {
    warnings.push('Yetersiz veri noktası - sonuçlar güvenilir olmayabilir');
  }
  
  // 2. Varyans faktörü
  if (input.variance !== undefined) {
    const varianceFactor = calculateVarianceFactor(input.variance);
    factors.push(varianceFactor);
    totalScore += varianceFactor.contribution;
    totalWeight += varianceFactor.weight;
    
    if (varianceFactor.status === 'poor') {
      warnings.push('Yüksek varyans - performans tutarsız');
    }
  }
  
  // 3. Eksik veri faktörü
  if (input.missingDataRate !== undefined) {
    const missingFactor = calculateMissingDataFactor(input.missingDataRate);
    factors.push(missingFactor);
    totalScore += missingFactor.contribution;
    totalWeight += missingFactor.weight;
    
    if (missingFactor.status === 'poor') {
      warnings.push('Yüksek eksik veri oranı');
    }
  }
  
  // 4. Aykırı değer faktörü
  if (input.outlierCount !== undefined && input.sampleSize > 0) {
    const outlierFactor = calculateOutlierFactor(input.outlierCount, input.sampleSize);
    factors.push(outlierFactor);
    totalScore += outlierFactor.contribution;
    totalWeight += outlierFactor.weight;
  }
  
  // 5. Zaman aralığı faktörü
  if (input.timeSpan !== undefined) {
    const timeFactor = calculateTimeSpanFactor(input.timeSpan);
    factors.push(timeFactor);
    totalScore += timeFactor.contribution;
    totalWeight += timeFactor.weight;
  }
  
  // 6. Kaynak güvenilirliği faktörü
  if (input.sourceReliability !== undefined) {
    const sourceFactor = calculateSourceFactor(input.sourceReliability);
    factors.push(sourceFactor);
    totalScore += sourceFactor.contribution;
    totalWeight += sourceFactor.weight;
  }
  
  // Genel skor hesapla
  const overallConfidence = totalWeight > 0 ? totalScore / totalWeight : 0;
  const confidenceLevel = determineConfidenceLevel(overallConfidence);
  const isReliable = overallConfidence >= 0.5;
  
  return {
    overallConfidence: round(overallConfidence, 4),
    confidenceLevel,
    factors,
    warnings,
    isReliable,
    explanation: generateConfidenceExplanation(overallConfidence, factors, warnings)
  };
}

// ==================== FAKTÖR HESAPLAMALARI ====================

function calculateSampleSizeFactor(sampleSize: number): ConfidenceFactor {
  // Minimum güvenilir örneklem: 5
  // İdeal örneklem: 30+
  let score: number;
  
  if (sampleSize >= 30) {
    score = 1.0;
  } else if (sampleSize >= 20) {
    score = 0.9;
  } else if (sampleSize >= 10) {
    score = 0.7;
  } else if (sampleSize >= 5) {
    score = 0.5;
  } else if (sampleSize >= 3) {
    score = 0.3;
  } else {
    score = 0.1;
  }
  
  const weight = CONFIDENCE_WEIGHTS.sampleSize;
  
  return {
    name: 'Örneklem Büyüklüğü',
    score: round(score, 2),
    weight,
    contribution: round(score * weight, 4),
    status: score >= 0.7 ? 'good' : score >= 0.4 ? 'acceptable' : 'poor'
  };
}

function calculateVarianceFactor(variance: number): ConfidenceFactor {
  // Düşük varyans = yüksek tutarlılık = yüksek güven
  // Varsayım: net için tipik varyans 0-100 arasında
  const normalizedVariance = Math.min(1, variance / 100);
  const score = 1 - normalizedVariance;
  const weight = CONFIDENCE_WEIGHTS.variance;
  
  return {
    name: 'Tutarlılık (Varyans)',
    score: round(score, 2),
    weight,
    contribution: round(score * weight, 4),
    status: score >= 0.7 ? 'good' : score >= 0.4 ? 'acceptable' : 'poor'
  };
}

function calculateMissingDataFactor(missingRate: number): ConfidenceFactor {
  // Düşük eksik veri = yüksek güven
  const score = 1 - missingRate;
  const weight = CONFIDENCE_WEIGHTS.missingData;
  
  return {
    name: 'Veri Tamlığı',
    score: round(score, 2),
    weight,
    contribution: round(score * weight, 4),
    status: score >= 0.9 ? 'good' : score >= 0.7 ? 'acceptable' : 'poor'
  };
}

function calculateOutlierFactor(outlierCount: number, sampleSize: number): ConfidenceFactor {
  // Düşük aykırı değer oranı = yüksek güven
  const outlierRate = outlierCount / sampleSize;
  const score = 1 - Math.min(1, outlierRate * 5); // %20 üstü aykırı = sıfır güven
  const weight = CONFIDENCE_WEIGHTS.outliers;
  
  return {
    name: 'Aykırı Değer',
    score: round(Math.max(0, score), 2),
    weight,
    contribution: round(Math.max(0, score) * weight, 4),
    status: score >= 0.8 ? 'good' : score >= 0.5 ? 'acceptable' : 'poor'
  };
}

function calculateTimeSpanFactor(days: number): ConfidenceFactor {
  // Çok kısa veya çok uzun süre = düşük güven
  // İdeal: 30-180 gün
  let score: number;
  
  if (days >= 30 && days <= 180) {
    score = 1.0;
  } else if (days >= 14 && days <= 365) {
    score = 0.8;
  } else if (days >= 7) {
    score = 0.5;
  } else {
    score = 0.3;
  }
  
  const weight = CONFIDENCE_WEIGHTS.timeSpan;
  
  return {
    name: 'Zaman Aralığı',
    score: round(score, 2),
    weight,
    contribution: round(score * weight, 4),
    status: score >= 0.7 ? 'good' : score >= 0.4 ? 'acceptable' : 'poor'
  };
}

function calculateSourceFactor(reliability: number): ConfidenceFactor {
  const score = reliability;
  const weight = CONFIDENCE_WEIGHTS.sourceReliability;
  
  return {
    name: 'Kaynak Güvenilirliği',
    score: round(score, 2),
    weight,
    contribution: round(score * weight, 4),
    status: score >= 0.8 ? 'good' : score >= 0.5 ? 'acceptable' : 'poor'
  };
}

// ==================== GÜVEN SEVİYESİ BELİRLEME ====================

function determineConfidenceLevel(
  score: number
): 'very_high' | 'high' | 'moderate' | 'low' | 'very_low' {
  if (score >= 0.85) return 'very_high';
  if (score >= 0.70) return 'high';
  if (score >= 0.50) return 'moderate';
  if (score >= 0.30) return 'low';
  return 'very_low';
}

function generateConfidenceExplanation(
  score: number,
  factors: ConfidenceFactor[],
  warnings: string[]
): string {
  const level = determineConfidenceLevel(score);
  const percent = Math.round(score * 100);
  
  const weakFactors = factors.filter(f => f.status === 'poor');
  
  if (level === 'very_high') {
    return `Analiz sonuçları çok güvenilir (%${percent}). Yeterli veri ve tutarlı performans.`;
  }
  
  if (level === 'high') {
    return `Analiz sonuçları güvenilir (%${percent}). Sonuçlara güvenebilirsiniz.`;
  }
  
  if (level === 'moderate') {
    const issue = weakFactors.length > 0 
      ? weakFactors[0].name 
      : 'Bazı faktörler';
    return `Analiz sonuçları orta güvenilirlikte (%${percent}). ${issue} iyileştirilebilir.`;
  }
  
  if (level === 'low') {
    return `Analiz sonuçları düşük güvenilirlikte (%${percent}). ${warnings[0] || 'Daha fazla veri gerekli.'}`;
  }
  
  return `Analiz sonuçları güvenilir değil (%${percent}). Sonuçları dikkatli değerlendirin.`;
}

// ==================== TAHMİN GÜVENİ ====================

/**
 * Tahmin (prediction) güveni hesaplar
 * AI modelleri ve trend tahminleri için
 */
export function calculatePredictionConfidence(
  input: PredictionConfidenceInput
): {
  confidence: number;
  level: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  shouldTrust: boolean;
  explanation: string;
} {
  let score = 0;
  
  // 1. Geçmiş veri yeterliliği (%40)
  const dataScore = Math.min(1, input.historicalDataPoints / 10);
  score += dataScore * 0.40;
  
  // 2. Trend tutarlılığı (%30)
  score += input.trendConsistency * 0.30;
  
  // 3. Güncel veri (%20)
  const recentScore = Math.min(1, input.recentDataPoints / 3);
  score += recentScore * 0.20;
  
  // 4. Model doğruluğu (%10)
  if (input.modelAccuracy !== undefined) {
    score += input.modelAccuracy * 0.10;
  } else {
    score += 0.05; // Varsayılan
  }
  
  const level = determineConfidenceLevel(score);
  
  return {
    confidence: round(score, 4),
    level,
    shouldTrust: score >= 0.5,
    explanation: score >= 0.7
      ? 'Tahmin güvenilir, kullanılabilir.'
      : score >= 0.5
      ? 'Tahmin orta güvenilirlikte, dikkatli kullanın.'
      : 'Tahmin güvenilir değil, kullanmayın.'
  };
}

// ==================== ANALİTİK GÜVENİLİRLİĞİ ====================

/**
 * Analytics sonuçlarının güvenilirliğini hesaplar
 */
export function calculateAnalyticsReliability(
  input: AnalyticsReliabilityInput
): {
  reliability: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: string;
} {
  // Faktör skorları
  const examCountScore = Math.min(1, input.examCount / 5);
  const questionScore = Math.min(1, input.avgQuestionsPerExam / 50);
  const topicScore = input.topicCoverage;
  const timeScore = input.timeConsistency;
  const qualityScore = input.answerQuality;
  
  // Ağırlıklı ortalama
  const reliability = 
    examCountScore * 0.25 +
    questionScore * 0.15 +
    topicScore * 0.25 +
    timeScore * 0.15 +
    qualityScore * 0.20;
  
  // Not
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (reliability >= 0.85) grade = 'A';
  else if (reliability >= 0.70) grade = 'B';
  else if (reliability >= 0.55) grade = 'C';
  else if (reliability >= 0.40) grade = 'D';
  else grade = 'F';
  
  // Öneri
  let recommendation: string;
  if (grade === 'A') {
    recommendation = 'Analitik veriler güvenilir, tüm raporlarda kullanılabilir.';
  } else if (grade === 'B') {
    recommendation = 'Analitik veriler yeterli, çoğu raporlarda kullanılabilir.';
  } else if (grade === 'C') {
    recommendation = 'Analitik veriler orta düzeyde, dikkatli kullanın.';
  } else if (grade === 'D') {
    recommendation = 'Analitik veriler yetersiz, daha fazla sınav verisi gerekli.';
  } else {
    recommendation = 'Analitik veriler güvenilir değil, rapor üretilmemeli.';
  }
  
  return {
    reliability: round(reliability, 4),
    grade,
    recommendation
  };
}

// ==================== MARGIN OF ERROR ====================

/**
 * Hata payı hesaplar (confidence interval için)
 * 
 * @param sampleSize - Örneklem büyüklüğü
 * @param confidenceLevel - Güven düzeyi (0.95, 0.99 vb.)
 * @param proportion - Oran (varsayılan 0.5 = maksimum belirsizlik)
 * @returns Hata payı (±)
 */
export function calculateMarginOfError(
  sampleSize: number,
  confidenceLevel: number = 0.95,
  proportion: number = 0.5
): number {
  if (sampleSize <= 0) return 1;
  
  // Z-score for confidence level
  // 0.90 → 1.645, 0.95 → 1.96, 0.99 → 2.576
  let zScore: number;
  if (confidenceLevel >= 0.99) zScore = 2.576;
  else if (confidenceLevel >= 0.95) zScore = 1.96;
  else if (confidenceLevel >= 0.90) zScore = 1.645;
  else zScore = 1.28;
  
  // Margin of Error = z * sqrt(p * (1-p) / n)
  const marginOfError = zScore * Math.sqrt((proportion * (1 - proportion)) / sampleSize);
  
  return round(marginOfError, 4);
}

// ==================== YARDIMCI ====================

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  calculateConfidence,
  calculatePredictionConfidence,
  calculateAnalyticsReliability,
  calculateMarginOfError
};
