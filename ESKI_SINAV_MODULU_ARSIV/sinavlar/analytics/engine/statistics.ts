/**
 * ============================================
 * AkademiHub - Pure Statistics Functions
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * Sadece input → output
 * 
 * Test edilebilir, bağımsız fonksiyonlar
 */

// ==================== STANDART SAPMA ====================

/**
 * Standart sapma hesaplar (Population Standard Deviation)
 * 
 * @param values - Sayı dizisi
 * @param mean - Ortalama (opsiyonel, verilmezse hesaplanır)
 * @returns Standart sapma (2 ondalık)
 * 
 * @example
 * calculateStandardDeviation([10, 20, 30, 40, 50]) // 14.14
 * calculateStandardDeviation([5, 5, 5, 5]) // 0
 */
export function calculateStandardDeviation(
  values: number[],
  mean?: number
): number {
  // Edge cases
  if (!values || values.length === 0) return 0;
  if (values.length === 1) return 0;
  
  // Ortalama hesapla (verilmemişse)
  const avg = mean ?? values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Farkların karesini topla
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Standart sapma = karekök(varyans)
  const stdDev = Math.sqrt(variance);
  
  return Math.round(stdDev * 100) / 100;
}

// ==================== YÜZDELİK DİLİM ====================

/**
 * Yüzdelik dilim hesaplar (sıralama bazlı)
 * 
 * @param rank - Öğrencinin sırası (1-based)
 * @param total - Toplam öğrenci sayısı
 * @returns Yüzdelik dilim (0-100)
 * 
 * @example
 * calculatePercentile(1, 100) // 99.5 (en iyi)
 * calculatePercentile(100, 100) // 0.5 (en kötü)
 * calculatePercentile(50, 100) // 50.5
 */
export function calculatePercentile(rank: number, total: number): number {
  // Edge cases
  if (total <= 0) return 0;
  if (rank <= 0) return 100;
  if (rank > total) return 0;
  
  // Yüzdelik = (total - rank + 0.5) / total * 100
  // Bu formül daha doğru bir dağılım sağlar
  const percentile = ((total - rank + 0.5) / total) * 100;
  
  return Math.round(percentile * 100) / 100;
}

/**
 * Değer bazlı yüzdelik dilim hesaplar
 * Verilen değerin dizideki yüzdelik konumunu bulur
 * 
 * @param value - Yüzdeliği hesaplanacak değer
 * @param allValues - Tüm değerler dizisi
 * @returns Yüzdelik dilim (0-100)
 * 
 * @example
 * calculatePercentileByValue(75, [50, 60, 70, 75, 80, 90, 100]) // ~57.14
 */
export function calculatePercentileByValue(
  value: number,
  allValues: number[]
): number {
  if (!allValues || allValues.length === 0) return 0;
  if (allValues.length === 1) return value >= allValues[0] ? 100 : 0;
  
  const sorted = [...allValues].sort((a, b) => a - b);
  
  // Değerden küçük olanları say
  const belowCount = sorted.filter(v => v < value).length;
  const equalCount = sorted.filter(v => v === value).length;
  
  // Yüzdelik dilim formülü: (L + 0.5 * S) / N * 100
  const percentile = ((belowCount + 0.5 * equalCount) / sorted.length) * 100;
  
  return Math.round(percentile * 100) / 100;
}

/**
 * Belirli bir yüzdelik dilime karşılık gelen değeri bulur
 * 
 * @param percentile - Yüzdelik dilim (0-100)
 * @param values - Değerler dizisi
 * @returns O yüzdeliğe karşılık gelen değer
 * 
 * @example
 * getValueAtPercentile(50, [10, 20, 30, 40, 50]) // 30 (medyan)
 * getValueAtPercentile(25, [10, 20, 30, 40, 50]) // 20
 */
export function getValueAtPercentile(
  percentile: number,
  values: number[]
): number {
  if (!values || values.length === 0) return 0;
  if (percentile <= 0) return Math.min(...values);
  if (percentile >= 100) return Math.max(...values);
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  // Interpolasyon
  const fraction = index - lower;
  const result = sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
  
  return Math.round(result * 100) / 100;
}

// ==================== TEMEL İSTATİSTİKLER ====================

export interface StatisticsResult {
  count: number;
  sum: number;
  mean: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
  variance: number;
  range: number;
  q1: number;           // 1. çeyrek (25. yüzdelik)
  q3: number;           // 3. çeyrek (75. yüzdelik)
  iqr: number;          // Çeyrekler arası aralık
}

/**
 * Kapsamlı istatistik hesaplar
 * 
 * @param values - Sayı dizisi
 * @returns Tüm istatistikler
 */
export function calculateStatistics(values: number[]): StatisticsResult {
  if (!values || values.length === 0) {
    return {
      count: 0,
      sum: 0,
      mean: 0,
      min: 0,
      max: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      range: 0,
      q1: 0,
      q3: 0,
      iqr: 0
    };
  }
  
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;
  
  // Medyan
  const mid = Math.floor(count / 2);
  const median = count % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  
  // Çeyrekler
  const q1 = getValueAtPercentile(25, sorted);
  const q3 = getValueAtPercentile(75, sorted);
  const iqr = q3 - q1;
  
  // Standart sapma ve varyans
  const stdDev = calculateStandardDeviation(values, mean);
  const variance = Math.pow(stdDev, 2);
  
  return {
    count,
    sum: round(sum),
    mean: round(mean),
    min: round(min),
    max: round(max),
    median: round(median),
    stdDev: round(stdDev),
    variance: round(variance),
    range: round(range),
    q1: round(q1),
    q3: round(q3),
    iqr: round(iqr)
  };
}

// ==================== TUTARLILIK SKORU ====================

/**
 * Tutarlılık skoru hesaplar
 * Düşük varyans = yüksek tutarlılık
 * 
 * @param values - Performans değerleri (örn: son 5 sınavın netleri)
 * @param maxExpectedStdDev - Beklenen maksimum standart sapma
 * @returns 0-1 arası tutarlılık skoru (1 = çok tutarlı)
 * 
 * @example
 * calculateConsistencyScore([50, 51, 49, 50, 52]) // ~0.95 (tutarlı)
 * calculateConsistencyScore([30, 70, 40, 80, 20]) // ~0.30 (tutarsız)
 */
export function calculateConsistencyScore(
  values: number[],
  maxExpectedStdDev: number = 15
): number {
  if (!values || values.length < 2) return 1;
  
  const stdDev = calculateStandardDeviation(values);
  
  // Normalize: düşük std = yüksek tutarlılık
  // Score = 1 - (stdDev / maxExpectedStdDev)
  const score = Math.max(0, 1 - (stdDev / maxExpectedStdDev));
  
  return round(score, 4);
}

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Sayıyı belirtilen ondalık basamağa yuvarlar
 */
function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  calculateStandardDeviation,
  calculatePercentile,
  calculatePercentileByValue,
  getValueAtPercentile,
  calculateStatistics,
  calculateConsistencyScore
};
