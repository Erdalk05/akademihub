/**
 * ============================================
 * AkademiHub - Pure Trend Calculation Functions
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * Sadece input → output
 */

import type { TrendInput, TrendResult, TrendDirection } from './types';
import { DEFAULT_TREND_CONFIG } from './types';

// ==================== TREND HESAPLAMA ====================

/**
 * Trend hesaplar
 * Son sınavlara daha fazla ağırlık verir
 * 
 * @param input - Trend hesaplama girdisi
 * @returns Trend sonucu
 * 
 * @example
 * calculateTrend({ values: [40, 45, 50, 55, 60] })
 * // { direction: 'up', change: 5, weightedChange: 4.5, ... }
 */
export function calculateTrend(input: TrendInput): TrendResult {
  const { values } = input;
  
  // Edge cases
  if (!values || values.length === 0) {
    return createEmptyTrendResult();
  }
  
  if (values.length === 1) {
    return {
      direction: 'stable',
      change: 0,
      weightedChange: 0,
      trend: values,
      normalizedTrend: [50],
      slope: 0,
      isSignificant: false
    };
  }
  
  // Config değerleri
  const thresholdUp = input.thresholdUp ?? DEFAULT_TREND_CONFIG.thresholdUp;
  const thresholdDown = input.thresholdDown ?? DEFAULT_TREND_CONFIG.thresholdDown;
  const thresholdStable = input.thresholdStable ?? DEFAULT_TREND_CONFIG.thresholdStable;
  
  // Ağırlıklar (son sınavlara daha fazla)
  const weights = input.weights ?? generateWeights(values.length);
  
  // Son 2 sınav farkı
  const change = round(values[values.length - 1] - values[values.length - 2]);
  
  // Ağırlıklı değişim hesapla
  const weightedChange = calculateWeightedChange(values, weights);
  
  // Eğim hesapla (linear regression)
  const slope = calculateSlope(values);
  
  // Normalize et (0-100 aralığına)
  const normalizedTrend = normalizeTrend(values);
  
  // Yön belirle
  const direction = determineDirection(weightedChange, thresholdUp, thresholdDown, thresholdStable);
  
  // Anlamlılık kontrolü
  const isSignificant = Math.abs(weightedChange) > thresholdStable;
  
  return {
    direction,
    change,
    weightedChange: round(weightedChange),
    trend: values,
    normalizedTrend,
    slope: round(slope, 4),
    isSignificant
  };
}

/**
 * Sadece değerler dizisiyle basit trend hesaplar
 * 
 * @param nets - Net değerleri dizisi (eski -> yeni)
 * @returns Trend sonucu
 */
export function calculateSimpleTrend(nets: number[]): TrendResult {
  return calculateTrend({ values: nets });
}

// ==================== AĞIRLIKLI DEĞİŞİM ====================

/**
 * Ağırlıklı değişim hesaplar
 * Son sınavların etkisi daha fazla
 */
function calculateWeightedChange(
  values: number[],
  weights: number[]
): number {
  if (values.length < 2) return 0;
  
  // Her ardışık fark için ağırlıklı toplam
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const weight = weights[i] ?? weights[weights.length - 1] ?? 1;
    
    weightedSum += change * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// ==================== EĞİM HESAPLAMA (LINEAR REGRESSION) ====================

/**
 * Lineer regresyon ile eğim hesaplar
 * y = mx + b formülünde m değeri
 */
function calculateSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  
  // x değerleri = [0, 1, 2, ...]
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
  
  // Eğim = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX^2)
  const denominator = n * sumX2 - sumX * sumX;
  
  if (denominator === 0) return 0;
  
  return (n * sumXY - sumX * sumY) / denominator;
}

// ==================== NORMALİZASYON ====================

/**
 * Değerleri 0-100 aralığına normalize eder
 */
function normalizeTrend(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [50];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) {
    // Tüm değerler aynı
    return values.map(() => 50);
  }
  
  return values.map(v => round(((v - min) / range) * 100));
}

// ==================== YÖN BELİRLEME ====================

/**
 * Trend yönünü belirler
 */
function determineDirection(
  weightedChange: number,
  thresholdUp: number,
  thresholdDown: number,
  thresholdStable: number
): TrendDirection {
  if (weightedChange >= thresholdUp) {
    return 'up';
  }
  
  if (weightedChange <= thresholdDown) {
    return 'down';
  }
  
  if (Math.abs(weightedChange) <= thresholdStable) {
    return 'stable';
  }
  
  // Arada kalan değerler için
  return weightedChange > 0 ? 'up' : 'down';
}

// ==================== AĞIRLIK ÜRETİMİ ====================

/**
 * Varsayılan ağırlıklar üretir
 * Son değerlere daha fazla ağırlık
 */
function generateWeights(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [1];
  
  // Doğrusal artan ağırlıklar
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    // i=0 için 0.1, i=n-1 için 0.3 yakınında
    weights.push(0.1 + (0.2 * i / (count - 1)));
  }
  
  // Normalize et (toplam = 1)
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / sum);
}

// ==================== BOŞ SONUÇ ====================

function createEmptyTrendResult(): TrendResult {
  return {
    direction: 'stable',
    change: 0,
    weightedChange: 0,
    trend: [],
    normalizedTrend: [],
    slope: 0,
    isSignificant: false
  };
}

// ==================== TREND PUANI ====================

/**
 * Trend puanı hesaplar (-100 ile +100 arası)
 * Pozitif = yukarı trend, Negatif = aşağı trend
 * 
 * @param values - Net değerleri
 * @param windowSize - Pencere boyutu (varsayılan: 5)
 * @returns -100 ile +100 arası puan
 */
export function calculateTrendScore(
  values: number[],
  windowSize: number = 5
): number {
  if (values.length < 2) return 0;
  
  // Son windowSize kadar değer al
  const recentValues = values.slice(-windowSize);
  const trend = calculateTrend({ values: recentValues });
  
  // Eğimi -100/+100 aralığına normalize et
  // Tipik net değişimi 0-5 arasında olduğunu varsayarak
  const maxExpectedSlope = 5;
  const normalizedScore = (trend.slope / maxExpectedSlope) * 100;
  
  // -100 ile +100 arasına sınırla
  return round(Math.max(-100, Math.min(100, normalizedScore)));
}

// ==================== YARDIMCI ====================

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  calculateTrend,
  calculateSimpleTrend,
  calculateTrendScore
};
