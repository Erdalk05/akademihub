/**
 * ============================================
 * AkademiHub - Analytics Versioning & Metadata
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * 
 * Analytics versiyon kontrolü:
 * - Algoritma versiyonlama
 * - Hesaplama metadata
 * - Audit trail
 * - AI-ready output formatting
 */

// ==================== VERSION CONSTANTS ====================

export const ANALYTICS_VERSION = '1.0.0';
export const ANALYTICS_SCHEMA_VERSION = '1.0';
export const ENGINE_VERSION = '2024.12.01';

export const VERSION_HISTORY = [
  {
    version: '1.0.0',
    date: '2024-12-24',
    changes: [
      'İlk production-ready versiyon',
      'Pure function analytics engine',
      'LGS/TYT/AYT ağırlıklı skorlama',
      'Risk analizi',
      'Trend hesaplama',
      'Öğrenme açığı tespiti',
      'Güvenilirlik metrikleri'
    ]
  }
] as const;

// ==================== TYPES ====================

export interface AnalyticsMetadata {
  // Versiyon bilgileri
  analyticsVersion: string;
  schemaVersion: string;
  engineVersion: string;
  
  // Hesaplama bilgileri
  calculatedAt: string;              // ISO 8601
  calculationDurationMs: number;
  
  // Kaynak bilgileri
  inputHash?: string;                // Girdi verisi hash'i
  dataSource: string;
  
  // Kalite metrikleri
  confidenceScore: number;
  dataCompleteness: number;
  isReliable: boolean;
  
  // AI-ready flags
  aiReady: boolean;
  recommendationEnabled: boolean;
  
  // Debug bilgileri
  debug?: {
    functionsCalled: string[];
    warningsGenerated: string[];
    performanceMetrics: Record<string, number>;
  };
}

export interface VersionedAnalytics<T> {
  version: string;
  metadata: AnalyticsMetadata;
  data: T;
  signature?: string;
}

export interface CalculationContext {
  startTime: number;
  source: string;
  functionName: string;
  params?: Record<string, any>;
}

export interface CalculationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    functionName: string;
    durationMs: number;
    timestamp: string;
  };
}

// ==================== METADATA OLUŞTURMA ====================

/**
 * Analytics metadata oluşturur
 * 
 * @param startTime - Hesaplama başlangıç zamanı (Date.now())
 * @param options - Opsiyonel ayarlar
 * @returns Analytics metadata
 */
export function createMetadata(
  startTime: number,
  options: {
    dataSource?: string;
    confidenceScore?: number;
    dataCompleteness?: number;
    inputHash?: string;
    functionsUsed?: string[];
    warnings?: string[];
  } = {}
): AnalyticsMetadata {
  const now = Date.now();
  
  return {
    analyticsVersion: ANALYTICS_VERSION,
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    calculatedAt: new Date().toISOString(),
    calculationDurationMs: now - startTime,
    inputHash: options.inputHash,
    dataSource: options.dataSource ?? 'unknown',
    confidenceScore: options.confidenceScore ?? 1.0,
    dataCompleteness: options.dataCompleteness ?? 1.0,
    isReliable: (options.confidenceScore ?? 1) >= 0.5,
    aiReady: true,
    recommendationEnabled: true,
    debug: {
      functionsCalled: options.functionsUsed ?? [],
      warningsGenerated: options.warnings ?? [],
      performanceMetrics: {}
    }
  };
}

// ==================== VERSİYONLU ÇIKTI OLUŞTURMA ====================

/**
 * Versiyonlu analytics çıktısı oluşturur
 * 
 * @param data - Analytics verisi
 * @param metadata - Metadata
 * @returns Versiyonlu analytics
 */
export function wrapWithVersion<T>(
  data: T,
  metadata: AnalyticsMetadata
): VersionedAnalytics<T> {
  return {
    version: ANALYTICS_VERSION,
    metadata,
    data,
    signature: generateSignature(data, metadata)
  };
}

/**
 * Basit imza oluşturur (veri bütünlüğü kontrolü için)
 */
function generateSignature<T>(data: T, metadata: AnalyticsMetadata): string {
  const content = JSON.stringify({ data, metadata });
  
  // Basit hash (production'da crypto kullanılmalı)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `sig_${Math.abs(hash).toString(16)}`;
}

// ==================== HESAPLAMA SARMALAYICI ====================

/**
 * Fonksiyon çağrısını metadata ile sarmalar
 * 
 * @example
 * const result = withCalculationContext(
 *   'calculateRisk',
 *   { input },
 *   () => actualCalculation(input)
 * );
 */
export function withCalculationContext<T>(
  functionName: string,
  params: Record<string, any>,
  calculation: () => T
): CalculationResult<T> {
  const startTime = Date.now();
  
  try {
    const data = calculation();
    
    return {
      success: true,
      data,
      metadata: {
        functionName,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        functionName,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ==================== VERSİYON UYUMLULUK ====================

/**
 * Versiyon uyumluluğunu kontrol eder
 */
export function isVersionCompatible(
  dataVersion: string,
  minVersion: string = '1.0.0'
): boolean {
  const dataParts = dataVersion.split('.').map(Number);
  const minParts = minVersion.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if ((dataParts[i] ?? 0) > (minParts[i] ?? 0)) return true;
    if ((dataParts[i] ?? 0) < (minParts[i] ?? 0)) return false;
  }
  
  return true; // Eşit
}

/**
 * Versiyon karşılaştırması yapar
 * @returns -1 (v1 < v2), 0 (eşit), 1 (v1 > v2)
 */
export function compareVersions(v1: string, v2: string): -1 | 0 | 1 {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if ((parts1[i] ?? 0) > (parts2[i] ?? 0)) return 1;
    if ((parts1[i] ?? 0) < (parts2[i] ?? 0)) return -1;
  }
  
  return 0;
}

// ==================== AI-READY OUTPUT FORMATLAMA ====================

export interface AIReadyOutput {
  version: string;
  timestamp: string;
  summary: {
    overall_status: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
    key_metrics: Record<string, number>;
    confidence_level: string;
  };
  strengths: AIReadyItem[];
  weaknesses: AIReadyItem[];
  recommendations: AIReadyRecommendation[];
  risk_assessment: {
    level: string;
    score: number;
    factors: string[];
  };
  trend_analysis: {
    direction: string;
    change_rate: number;
    forecast: string;
  };
  metadata: {
    data_quality: number;
    analysis_depth: string;
    model_version: string;
  };
}

export interface AIReadyItem {
  id: string;
  name: string;
  category: string;
  score: number;
  confidence: number;
  description: string;
}

export interface AIReadyRecommendation {
  id: string;
  priority: number;
  category: string;
  action: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  timeframe: string;
}

/**
 * Analytics sonuçlarını AI-ready formata dönüştürür
 */
export function formatForAI(
  analytics: {
    overallAssessment?: string;
    keyMetrics?: Record<string, number>;
    strengths?: Array<{ topic: string; rate: number }>;
    weaknesses?: Array<{ topic: string; rate: number; priority?: string }>;
    recommendations?: string[];
    riskLevel?: string;
    riskScore?: number;
    riskFactors?: string[];
    trendDirection?: string;
    trendChange?: number;
    confidence?: number;
  }
): AIReadyOutput {
  return {
    version: ANALYTICS_VERSION,
    timestamp: new Date().toISOString(),
    summary: {
      overall_status: (analytics.overallAssessment as AIReadyOutput['summary']['overall_status']) ?? 'average',
      key_metrics: analytics.keyMetrics ?? {},
      confidence_level: getConfidenceLevelString(analytics.confidence ?? 0.5)
    },
    strengths: (analytics.strengths ?? []).map((s, i) => ({
      id: `str_${i}`,
      name: s.topic,
      category: 'topic',
      score: s.rate,
      confidence: 0.8,
      description: `${s.topic} konusunda %${Math.round(s.rate * 100)} başarı`
    })),
    weaknesses: (analytics.weaknesses ?? []).map((w, i) => ({
      id: `weak_${i}`,
      name: w.topic,
      category: 'topic',
      score: w.rate,
      confidence: 0.8,
      description: `${w.topic} konusunda %${Math.round(w.rate * 100)} başarı - iyileştirme gerekli`
    })),
    recommendations: (analytics.recommendations ?? []).map((r, i) => ({
      id: `rec_${i}`,
      priority: i + 1,
      category: 'study',
      action: r,
      expected_impact: 'Net artışı beklenir',
      effort_level: 'medium' as const,
      timeframe: '2-4 hafta'
    })),
    risk_assessment: {
      level: analytics.riskLevel ?? 'unknown',
      score: analytics.riskScore ?? 0,
      factors: analytics.riskFactors ?? []
    },
    trend_analysis: {
      direction: analytics.trendDirection ?? 'stable',
      change_rate: analytics.trendChange ?? 0,
      forecast: generateForecast(analytics.trendDirection, analytics.trendChange)
    },
    metadata: {
      data_quality: analytics.confidence ?? 0.5,
      analysis_depth: 'comprehensive',
      model_version: ENGINE_VERSION
    }
  };
}

function getConfidenceLevelString(confidence: number): string {
  if (confidence >= 0.85) return 'very_high';
  if (confidence >= 0.70) return 'high';
  if (confidence >= 0.50) return 'moderate';
  if (confidence >= 0.30) return 'low';
  return 'very_low';
}

function generateForecast(direction?: string, change?: number): string {
  if (!direction || direction === 'stable') {
    return 'Performans stabil seyretmeye devam edecek';
  }
  
  if (direction === 'up') {
    return `Performans artış eğiliminde (+${(change ?? 0).toFixed(1)} net/sınav)`;
  }
  
  return `Performans düşüş eğiliminde (${(change ?? 0).toFixed(1)} net/sınav)`;
}

// ==================== CHANGELOG ====================

/**
 * İki analiz arasındaki farkları hesaplar
 */
export function calculateChangelog(
  previousAnalytics: VersionedAnalytics<any>,
  currentAnalytics: VersionedAnalytics<any>
): {
  versionChanged: boolean;
  changes: string[];
  significantChanges: boolean;
} {
  const changes: string[] = [];
  
  // Versiyon değişimi
  const versionChanged = previousAnalytics.version !== currentAnalytics.version;
  if (versionChanged) {
    changes.push(`Versiyon: ${previousAnalytics.version} → ${currentAnalytics.version}`);
  }
  
  // Metadata değişimleri
  const prevMeta = previousAnalytics.metadata;
  const currMeta = currentAnalytics.metadata;
  
  if (prevMeta.confidenceScore !== currMeta.confidenceScore) {
    const diff = currMeta.confidenceScore - prevMeta.confidenceScore;
    changes.push(`Güven skoru: ${diff > 0 ? '+' : ''}${(diff * 100).toFixed(1)}%`);
  }
  
  // Veri değişimleri (basit karşılaştırma)
  const prevData = JSON.stringify(previousAnalytics.data);
  const currData = JSON.stringify(currentAnalytics.data);
  
  if (prevData !== currData) {
    changes.push('Analiz verileri güncellendi');
  }
  
  return {
    versionChanged,
    changes,
    significantChanges: changes.length > 1 || versionChanged
  };
}

// ==================== EXPORT ====================

export default {
  ANALYTICS_VERSION,
  ANALYTICS_SCHEMA_VERSION,
  ENGINE_VERSION,
  VERSION_HISTORY,
  createMetadata,
  wrapWithVersion,
  withCalculationContext,
  isVersionCompatible,
  compareVersions,
  formatForAI,
  calculateChangelog
};
