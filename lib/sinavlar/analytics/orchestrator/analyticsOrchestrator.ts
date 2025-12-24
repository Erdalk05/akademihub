/**
 * ============================================
 * AkademiHub - Analytics Orchestrator
 * ============================================
 * 
 * PHASE 3.3 + 3.4 - Ana Orchestrator
 * 
 * BU DOSYA:
 * - Analytics için TEK YETKİLİ
 * - UI buradan okur
 * - PDF/WhatsApp buradan okur
 * - AI buradan okur
 * 
 * PHASE 3.4 EKLEMELERİ:
 * - DB'den config okuma
 * - Açıklanabilir risk faktörleri
 * - Normalize edilmiş trend
 * - Config versiyonlama
 * 
 * AKIŞ (DEĞİŞTİRİLEMEZ):
 * 1. Snapshot oku
 * 2. Geçerli ise → hemen dön
 * 3. Stale ise → async recompute tetikle, stale dön
 * 4. Yok ise → config yükle, hesapla, yaz, dön
 * 
 * KURALLAR:
 * - UI ASLA beklemez
 * - UI ASLA hesaplama yapmaz
 * - Pure Engine DB'ye dokunmaz
 * - Orchestrator = Tek Yetki
 */

import { readSnapshot, snapshotToOutput } from './snapshotReader';
import { writeSnapshot, type WriteSnapshotInput } from './snapshotWriter';
import { assembleInput, toEngineInput } from './inputAssembler';
import { isSnapshotValid, shouldRecompute, enqueueRecompute } from './cachePolicy';
import { calculateFullAnalytics } from '../engine/analyticsEngine';
import { normalizeTrend, type NormalizedTrendResult } from '../engine/trendNormalizer';
import { normalizeRisk, type NormalizedRiskResult, type RiskFactorExplanation } from '../engine/riskNormalizer';
import { loadAllConfigs, type LoadedRiskConfig, type LoadedTrendConfig } from '../config/loaders';
import { CONFIG_VERSION } from '../config/defaults';
import type { 
  StudentAnalyticsOutput, 
  OrchestratorResult,
  OrchestratorConfig,
  OrchestratorError,
  AnalyticsSnapshot
} from './types';
import { DEFAULT_ORCHESTRATOR_CONFIG } from './types';

// ==================== ANA FONKSİYON ====================

/**
 * Öğrenci analytics'ini getirir
 * 
 * Bu fonksiyon:
 * 1. Önce cache'den okumaya çalışır
 * 2. Cache yoksa veya stale ise:
 *    - DB'den config yükler
 *    - Pure Engine ile hesaplar
 *    - DB config ile risk/trend normalize eder
 *    - Snapshot'a yazar
 * 3. UI'a her zaman hızlı yanıt döner
 * 
 * @param examId - Sınav ID
 * @param studentId - Öğrenci ID
 * @param config - Orchestrator ayarları (opsiyonel)
 * @returns OrchestratorResult
 * 
 * @example
 * const result = await getStudentAnalytics('exam-123', 'student-456');
 * if (result.success) {
 *   console.log(result.data.summary);
 *   console.log(result.data.risk.factors); // Açıklanabilir risk faktörleri
 *   console.log(result.data.trends.explanation); // Trend açıklaması
 * }
 */
export async function getStudentAnalytics(
  examId: string,
  studentId: string,
  config: Partial<OrchestratorConfig> = {}
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
  
  const timing: OrchestratorResult['timing'] = {
    total_ms: 0
  };
  
  try {
    // ==================== ADIM 1: CACHE OKU ====================
    const cacheReadStart = Date.now();
    const snapshot = await readSnapshot(examId, studentId);
    timing.cache_read_ms = Date.now() - cacheReadStart;
    
    // ==================== ADIM 2: GEÇERLİ Mİ? ====================
    if (snapshot && isSnapshotValid(snapshot, mergedConfig)) {
      // Cache geçerli - hemen dön
      timing.total_ms = Date.now() - startTime;
      
      return {
        success: true,
        data: snapshotToOutput(snapshot),
        timing
      };
    }
    
    // ==================== ADIM 3: STALE Mİ? ====================
    if (snapshot && snapshot.is_stale) {
      // Stale snapshot var - async güncelleme tetikle, stale veriyi dön
      if (mergedConfig.enable_async_recompute) {
        const { priority, reason } = shouldRecompute(snapshot, mergedConfig);
        enqueueRecompute(examId, studentId, priority, reason);
      }
      
      timing.total_ms = Date.now() - startTime;
      
      // Stale veriyi dön (UI beklemez)
      const output = snapshotToOutput(snapshot);
      output.cache_info.is_stale = true;
      
      return {
        success: true,
        data: output,
        timing
      };
    }
    
    // ==================== ADIM 4: CONFIG YÜKLE ====================
    const configLoadStart = Date.now();
    const dbConfigs = await loadAllConfigs();
    const configLoadMs = Date.now() - configLoadStart;
    
    // ==================== ADIM 5: HESAPLA VE YAZ ====================
    const calculationStart = Date.now();
    
    // Input topla
    const assembled = await assembleInput(examId, studentId, mergedConfig);
    
    if (!assembled) {
      timing.total_ms = Date.now() - startTime;
      return {
        success: false,
        error: createError('INPUT_ASSEMBLY_FAILED', 'Veri toplanamadı', true),
        timing
      };
    }
    
    // Pure Engine'e dönüştür ve hesapla
    const engineInput = toEngineInput(assembled);
    const analytics = calculateFullAnalytics(engineInput);
    
    // ==================== ADIM 6: TREND NORMALIZE ====================
    const previousNets = assembled.previous_exams?.map(e => e.total_net) ?? [];
    const allNets = [...previousNets, assembled.result?.total_net ?? 0];
    
    const normalizedTrend = normalizeTrend({
      nets: allNets,
      config: dbConfigs.trend,
      classAvgNet: assembled.class_data?.avg_net
    });
    
    // ==================== ADIM 7: RISK NORMALIZE ====================
    const normalizedRisk = normalizeRisk({
      current_net: assembled.result?.total_net ?? analytics.totalNet,
      previous_net: previousNets.length > 0 ? previousNets[previousNets.length - 1] : undefined,
      class_avg_net: assembled.class_data?.avg_net,
      trend_velocity: normalizedTrend.velocity,
      trend_consistency: normalizedTrend.consistency,
      weak_topic_count: analytics.weaknesses?.length ?? 0,
      total_topic_count: Object.keys(analytics.topicPerformance).length || 1,
      empty_count: analytics.totalEmpty,
      total_questions: analytics.totalCorrect + analytics.totalWrong + analytics.totalEmpty,
      easy_success_rate: analytics.difficultyPerformance?.easy?.rate,
      hard_success_rate: analytics.difficultyPerformance?.hard?.rate,
      current_rank: analytics.rankInExam ?? undefined,
      previous_rank: assembled.previous_exams?.[assembled.previous_exams.length - 1]?.rank_in_exam,
      total_students: assembled.class_data?.student_count,
      weights: dbConfigs.risk.weights,
      thresholds: dbConfigs.risk.thresholds
    });
    
    timing.calculation_ms = Date.now() - calculationStart;
    
    // ==================== ADIM 8: CACHE YAZ ====================
    const writeStart = Date.now();
    
    // Analytics'e normalize edilmiş değerleri ekle
    const enrichedAnalytics = {
      ...analytics,
      // Trend override
      trendDirection: normalizedTrend.direction,
      trendChange: normalizedTrend.recent_change,
      // Risk override
      riskLevel: normalizedRisk.level,
      riskScore: normalizedRisk.score,
      riskFactors: normalizedRisk.factors.map(f => f.explanation)
    };
    
    const writeInput: WriteSnapshotInput = {
      examId,
      studentId,
      analytics: enrichedAnalytics,
      assembledInput: assembled,
      calculationDurationMs: timing.calculation_ms,
      existingAiMetadata: assembled.existing_ai_metadata
    };
    
    const writeResult = await writeSnapshot(writeInput);
    timing.cache_write_ms = Date.now() - writeStart;
    
    if (!writeResult.success) {
      console.warn('[Orchestrator] Cache write failed, but returning calculated data');
    }
    
    // Sonucu formatla ve dön
    timing.total_ms = Date.now() - startTime;
    
    return {
      success: true,
      data: formatAnalyticsOutputV2(
        examId, 
        studentId, 
        analytics, 
        assembled, 
        normalizedTrend,
        normalizedRisk,
        dbConfigs,
        timing.calculation_ms
      ),
      timing
    };
    
  } catch (error) {
    console.error('[Orchestrator] Unexpected error:', error);
    
    timing.total_ms = Date.now() - startTime;
    
    return {
      success: false,
      error: createError(
        'ORCHESTRATOR_ERROR',
        error instanceof Error ? error.message : 'Beklenmeyen hata',
        false
      ),
      timing
    };
  }
}

// ==================== TOPLU İŞLEMLER ====================

/**
 * Bir sınav için tüm öğrenci analytics'lerini getirir
 */
export async function getExamAnalytics(
  examId: string,
  config: Partial<OrchestratorConfig> = {}
): Promise<{
  success: boolean;
  data?: StudentAnalyticsOutput[];
  error?: OrchestratorError;
  stats: {
    total: number;
    cached: number;
    computed: number;
    failed: number;
  };
}> {
  return {
    success: false,
    error: createError(
      'NOT_IMPLEMENTED',
      'Toplu sınav analytics henüz implement edilmedi. Bireysel getStudentAnalytics kullanın.',
      true
    ),
    stats: { total: 0, cached: 0, computed: 0, failed: 0 }
  };
}

/**
 * Stale snapshot'ları yeniden hesaplar
 */
export async function recomputeStaleSnapshots(
  limit: number = 10
): Promise<{ processed: number; failed: number }> {
  const { readStaleSnapshots } = await import('./snapshotReader');
  
  let processed = 0;
  let failed = 0;
  
  try {
    const staleSnapshots = await readStaleSnapshots(undefined, limit);
    
    for (const snapshot of staleSnapshots) {
      const result = await getStudentAnalytics(
        snapshot.exam_id,
        snapshot.student_id,
        { enable_async_recompute: false }
      );
      
      if (result.success) {
        processed++;
      } else {
        failed++;
      }
    }
  } catch (error) {
    console.error('[Orchestrator] Stale recompute error:', error);
  }
  
  return { processed, failed };
}

// ==================== FORMAT V2 (PHASE 3.4) ====================

/**
 * Analytics output v2 - DB config ile zenginleştirilmiş
 */
function formatAnalyticsOutputV2(
  examId: string,
  studentId: string,
  analytics: ReturnType<typeof calculateFullAnalytics>,
  assembled: NonNullable<Awaited<ReturnType<typeof assembleInput>>>,
  trend: NormalizedTrendResult,
  risk: NormalizedRiskResult,
  configs: { risk: LoadedRiskConfig; trend: LoadedTrendConfig },
  calculationMs: number
): StudentAnalyticsOutput {
  return {
    student_id: studentId,
    exam_id: examId,
    
    // ==================== SUMMARY ====================
    summary: {
      total_net: analytics.totalNet,
      total_correct: analytics.totalCorrect,
      total_wrong: analytics.totalWrong,
      total_empty: analytics.totalEmpty,
      rank_in_exam: analytics.rankInExam,
      rank_in_class: analytics.rankInClass,
      percentile: analytics.percentile,
      overall_assessment: analytics.overallAssessment,
      assessment_summary: analytics.assessmentSummary,
      vs_class_avg: analytics.vsClassAvg,
      vs_school_avg: analytics.vsSchoolAvg,
      vs_previous_exam: analytics.vsPreviousExam
    },
    
    // ==================== ANALYTICS ====================
    analytics: {
      subject_performance: formatSubjectPerformance(analytics.subjectPerformance),
      topic_performance: formatTopicPerformance(analytics.topicPerformance),
      difficulty_performance: analytics.difficultyPerformance,
      consistency_score: analytics.consistencyScore
    },
    
    // ==================== TRENDS (PHASE 3.4 ENHANCED) ====================
    trends: {
      direction: trend.direction,
      change: trend.recent_change,
      net_trend: trend.raw_nets,
      rank_trend: analytics.rankTrend,
      slope: trend.velocity,
      velocity: trend.velocity,
      velocity_normalized: trend.velocity_normalized,
      consistency: trend.consistency,
      trend_score: trend.trend_score,
      explanation: trend.explanation,
      is_significant: Math.abs(trend.trend_score) > 20
    },
    
    // ==================== RISK (PHASE 3.4 EXPLAINABLE) ====================
    risk: {
      level: risk.level,
      score: risk.score,
      factors: risk.factors,
      action_required: risk.action_required,
      primary_concern: risk.primary_concern,
      summary: risk.summary,
      level_label: risk.level_label,
      level_color: risk.level_color
    },
    
    // ==================== AI-READY ====================
    strengths: analytics.strengths?.map(s => 
      typeof s === 'string' ? s : s.topic
    ) ?? [],
    weaknesses: analytics.weaknesses?.map(w => 
      typeof w === 'string' ? w : w.topic
    ) ?? [],
    improvement_priorities: analytics.improvementPriorities?.map(p => 
      typeof p === 'string' ? p : p.topic
    ) ?? [],
    study_recommendations: analytics.studyRecommendations ?? [],
    
    // ==================== METADATA ====================
    ai_metadata: {
      ...assembled.existing_ai_metadata,
      // AI-Ready combined text
      ai_ready_text: `${trend.ai_ready_text} ${risk.ai_ready_text}`,
      trend_ai_text: trend.ai_ready_text,
      risk_ai_text: risk.ai_ready_text,
      config_version: configs.risk.config_version,
      generated_at: new Date().toISOString()
    },
    
    calculation_metadata: {
      analytics_version: CONFIG_VERSION,
      calculated_at: new Date().toISOString(),
      calculation_duration_ms: calculationMs,
      engine_version: '1.0.0',
      data_completeness: trend.has_sufficient_data ? 1.0 : 0.5,
      confidence_score: risk.factors_evaluated >= 5 ? 1.0 : 0.7,
      risk_config_source: configs.risk.loaded_from,
      trend_config_source: configs.trend.loaded_from,
      trend_status: trend.status
    },
    
    cache_info: {
      is_cached: false,
      is_stale: false,
      cached_at: null,
      config_version: configs.risk.config_version
    }
  };
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function formatSubjectPerformance(
  data: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [code, perf] of Object.entries(data)) {
    result[code] = {
      code,
      name: perf.name,
      net: perf.net ?? 0,
      correct: perf.correct ?? 0,
      wrong: perf.wrong ?? 0,
      empty: perf.empty ?? 0,
      rate: perf.rate ?? 0,
      rank: perf.rank
    };
  }
  
  return result;
}

function formatTopicPerformance(
  data: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [id, perf] of Object.entries(data)) {
    result[id] = {
      id,
      name: perf.name ?? '',
      correct: perf.correct ?? 0,
      total: perf.total ?? 0,
      rate: perf.rate ?? 0,
      status: perf.status ?? 'average'
    };
  }
  
  return result;
}

function createError(
  code: string,
  message: string,
  recoverable: boolean
): OrchestratorError {
  return { code, message, recoverable };
}

// ==================== EXPORT ====================

export default {
  getStudentAnalytics,
  getExamAnalytics,
  recomputeStaleSnapshots
};
