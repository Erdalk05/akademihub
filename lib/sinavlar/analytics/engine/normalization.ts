/**
 * ============================================
 * AkademiHub - Pure Normalization Functions
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * 
 * Zorluk ve skor normalizasyonu:
 * - Z-score normalization
 * - Min-Max scaling
 * - Difficulty adjustment
 * - Cross-exam comparability
 */

// ==================== TYPES ====================

export interface NormalizationInput {
  value: number;
  min?: number;
  max?: number;
  mean?: number;
  stdDev?: number;
}

export interface DifficultyAdjustmentInput {
  rawScore: number;
  difficultyIndex: number;        // 0-1 (0 = çok zor, 1 = çok kolay)
  expectedDifficulty?: number;    // Beklenen zorluk (varsayılan: 0.5)
  adjustmentStrength?: number;    // Ayarlama gücü (varsayılan: 0.3)
}

export interface ScoreNormalizationInput {
  scores: number[];
  targetMean?: number;            // Hedef ortalama (varsayılan: 50)
  targetStdDev?: number;          // Hedef std sapma (varsayılan: 15)
}

export interface CrossExamNormalizationInput {
  studentScore: number;
  examMean: number;
  examStdDev: number;
  referenceMean?: number;         // Referans ortalama
  referenceStdDev?: number;       // Referans std sapma
}

// ==================== Z-SCORE NORMALİZASYONU ====================

/**
 * Z-score hesaplar
 * (değer - ortalama) / standart sapma
 * 
 * @example
 * calculateZScore({ value: 75, mean: 60, stdDev: 10 }) // 1.5
 */
export function calculateZScore(input: NormalizationInput): number {
  const { value, mean = 0, stdDev = 1 } = input;
  
  if (stdDev === 0) return 0;
  
  return round((value - mean) / stdDev, 4);
}

/**
 * Z-score'dan orijinal değere dönüştürür
 * değer = (z-score * stdDev) + ortalama
 */
export function zScoreToValue(
  zScore: number,
  mean: number,
  stdDev: number
): number {
  return round(zScore * stdDev + mean, 2);
}

// ==================== MIN-MAX NORMALİZASYONU ====================

/**
 * Min-Max normalizasyonu (0-1 arası)
 * 
 * @example
 * minMaxNormalize({ value: 75, min: 0, max: 100 }) // 0.75
 */
export function minMaxNormalize(input: NormalizationInput): number {
  const { value, min = 0, max = 100 } = input;
  
  if (max === min) return 0.5;
  
  const normalized = (value - min) / (max - min);
  return round(Math.max(0, Math.min(1, normalized)), 4);
}

/**
 * Min-Max normalizasyonu (özel aralık)
 * 
 * @example
 * minMaxNormalizeToRange(0.75, 0, 100) // 75
 * minMaxNormalizeToRange(0.5, 200, 800) // 500
 */
export function minMaxNormalizeToRange(
  normalizedValue: number,
  targetMin: number,
  targetMax: number
): number {
  const clamped = Math.max(0, Math.min(1, normalizedValue));
  return round(clamped * (targetMax - targetMin) + targetMin, 2);
}

// ==================== ZORLUK AYARLAMASI ====================

/**
 * Zorluk seviyesine göre skor ayarlar
 * Zor sınavlarda düşük skor, kolay sınavlarda yüksek skor normalleştirilir
 * 
 * @param input - Zorluk ayarlama girdisi
 * @returns Zorluk ayarlı skor
 * 
 * @example
 * // Zor sınav (difficultyIndex = 0.3), ham skor 60
 * adjustForDifficulty({ rawScore: 60, difficultyIndex: 0.3 })
 * // Yukarı ayarlanır çünkü sınav zordu
 */
export function adjustForDifficulty(input: DifficultyAdjustmentInput): number {
  const {
    rawScore,
    difficultyIndex,
    expectedDifficulty = 0.5,
    adjustmentStrength = 0.3
  } = input;
  
  // Zorluk farkı: pozitif = beklenenden kolay, negatif = beklenenden zor
  const difficultyDelta = difficultyIndex - expectedDifficulty;
  
  // Ayarlama faktörü
  // Zor sınav (negatif delta) → skoru artır
  // Kolay sınav (pozitif delta) → skoru azalt
  const adjustmentFactor = 1 - (difficultyDelta * adjustmentStrength);
  
  // Maksimum ayarlama sınırları (%20)
  const clampedFactor = Math.max(0.8, Math.min(1.2, adjustmentFactor));
  
  return round(rawScore * clampedFactor, 2);
}

/**
 * Sınav zorluğunu soru başarı oranlarından hesaplar
 * 
 * @param correctRates - Her sorunun doğru cevaplanma oranı (0-1)
 * @returns 0-1 arası zorluk indeksi (0 = çok zor, 1 = çok kolay)
 */
export function calculateDifficultyIndex(correctRates: number[]): number {
  if (correctRates.length === 0) return 0.5;
  
  const avgCorrectRate = correctRates.reduce((sum, rate) => sum + rate, 0) / correctRates.length;
  
  return round(avgCorrectRate, 4);
}

// ==================== SKOR NORMALİZASYONU ====================

/**
 * Skorları belirli ortalama ve std sapma ile normalleştirir
 * (Örn: IQ skalası: mean=100, stdDev=15)
 * 
 * @param input - Skor normalizasyon girdisi
 * @returns Normalize edilmiş skorlar
 */
export function normalizeScores(input: ScoreNormalizationInput): number[] {
  const { scores, targetMean = 50, targetStdDev = 15 } = input;
  
  if (scores.length === 0) return [];
  if (scores.length === 1) return [targetMean];
  
  // Mevcut istatistikler
  const currentMean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const squaredDiffs = scores.map(s => Math.pow(s - currentMean, 2));
  const currentStdDev = Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length);
  
  if (currentStdDev === 0) {
    // Tüm değerler aynı
    return scores.map(() => targetMean);
  }
  
  // Her skoru dönüştür
  return scores.map(score => {
    const zScore = (score - currentMean) / currentStdDev;
    const normalized = zScore * targetStdDev + targetMean;
    return round(normalized, 2);
  });
}

/**
 * Tek bir skoru normalize eder
 */
export function normalizeScore(
  score: number,
  currentMean: number,
  currentStdDev: number,
  targetMean: number = 50,
  targetStdDev: number = 15
): number {
  if (currentStdDev === 0) return targetMean;
  
  const zScore = (score - currentMean) / currentStdDev;
  return round(zScore * targetStdDev + targetMean, 2);
}

// ==================== SINAV ARASI KARŞILAŞTIRMA ====================

/**
 * Farklı sınavları karşılaştırılabilir hale getirir
 * Z-score kullanarak ortak bir ölçeğe dönüştürür
 * 
 * @param input - Cross-exam normalizasyon girdisi
 * @returns Karşılaştırılabilir skor
 * 
 * @example
 * // Mayıs sınavı (zor): mean=45, std=12, öğrenci=52
 * // Eylül sınavı (kolay): mean=65, std=10, öğrenci=70
 * // Her ikisi de ortak ölçeğe dönüştürülür
 */
export function normalizeCrossExam(input: CrossExamNormalizationInput): number {
  const {
    studentScore,
    examMean,
    examStdDev,
    referenceMean = 50,
    referenceStdDev = 15
  } = input;
  
  // Önce Z-score'a dönüştür
  const zScore = calculateZScore({
    value: studentScore,
    mean: examMean,
    stdDev: examStdDev
  });
  
  // Sonra referans ölçeğine dönüştür
  return zScoreToValue(zScore, referenceMean, referenceStdDev);
}

// ==================== NET NORMALİZASYONU (LGS/YKS) ====================

export interface NetNormalizationInput {
  net: number;
  totalQuestions: number;
  examType: 'LGS' | 'TYT' | 'AYT';
  targetScale?: number;           // Hedef ölçek (varsayılan: 100)
}

/**
 * Net'i 0-100 ölçeğine normalize eder
 * Farklı sınav tipleri karşılaştırılabilir hale gelir
 * 
 * @example
 * normalizeNet({ net: 72, totalQuestions: 90, examType: 'LGS' }) // 80
 * normalizeNet({ net: 96, totalQuestions: 120, examType: 'TYT' }) // 80
 */
export function normalizeNet(input: NetNormalizationInput): number {
  const { net, totalQuestions, targetScale = 100 } = input;
  
  if (totalQuestions === 0) return 0;
  
  // Net 0-totalQuestions arasında olabilir
  const maxPossibleNet = totalQuestions;
  const normalizedNet = (net / maxPossibleNet) * targetScale;
  
  return round(Math.max(0, Math.min(targetScale, normalizedNet)), 2);
}

// ==================== PERCENTILE RANK ====================

/**
 * Percentile rank hesaplar (kaç kişinin altında)
 * 
 * @param score - Öğrenci skoru
 * @param allScores - Tüm skorlar
 * @returns 0-100 arası percentile rank
 */
export function calculatePercentileRank(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 50;
  
  const below = allScores.filter(s => s < score).length;
  const equal = allScores.filter(s => s === score).length;
  
  // Percentile rank = (B + 0.5E) / N * 100
  const percentileRank = ((below + 0.5 * equal) / allScores.length) * 100;
  
  return round(percentileRank, 2);
}

// ==================== YARDIMCI ====================

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  calculateZScore,
  zScoreToValue,
  minMaxNormalize,
  minMaxNormalizeToRange,
  adjustForDifficulty,
  calculateDifficultyIndex,
  normalizeScores,
  normalizeScore,
  normalizeCrossExam,
  normalizeNet,
  calculatePercentileRank
};
