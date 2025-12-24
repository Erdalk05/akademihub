/**
 * ============================================
 * AkademiHub - Analytics Orchestrator
 * ============================================
 * 
 * PHASE 3.3 - Ana Orchestrator
 * 
 * BU DOSYA:
 * - Analytics için TEK YETKİLİ
 * - UI buradan okur
 * - PDF/WhatsApp buradan okur
 * - AI buradan okur
 * 
 * AKIŞ (DEĞİŞTİRİLEMEZ):
 * 1. Snapshot oku
 * 2. Geçerli ise → hemen dön
 * 3. Stale ise → async recompute tetikle, stale dön
 * 4. Yok ise → hesapla, yaz, dön
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
 * 2. Cache yoksa veya stale ise arka planda hesaplar
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
    
    // ==================== ADIM 4: HESAPLA VE YAZ ====================
    // Snapshot yok - hesaplama gerekli
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
    
    timing.calculation_ms = Date.now() - calculationStart;
    
    // Cache'e yaz
    const writeStart = Date.now();
    const writeInput: WriteSnapshotInput = {
      examId,
      studentId,
      analytics,
      assembledInput: assembled,
      calculationDurationMs: timing.calculation_ms,
      existingAiMetadata: assembled.existing_ai_metadata
    };
    
    const writeResult = await writeSnapshot(writeInput);
    timing.cache_write_ms = Date.now() - writeStart;
    
    if (!writeResult.success) {
      console.warn('[Orchestrator] Cache write failed, but returning calculated data');
      // Yazma başarısız olsa bile hesaplanmış veriyi dön
    }
    
    // Sonucu formatla ve dön
    timing.total_ms = Date.now() - startTime;
    
    return {
      success: true,
      data: formatAnalyticsOutput(examId, studentId, analytics, assembled, timing.calculation_ms),
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
 * 
 * Dikkat: Bu fonksiyon çok sayıda öğrenci için yavaş olabilir.
 * Mümkünse önceden hesaplanmış snapshot'ları kullanın.
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
  // Bu fonksiyon şu an için basit tutulmuş
  // Production'da batch processing ve pagination gerekir
  
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
 * (Background job olarak çalıştırılmalı)
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
        { enable_async_recompute: false } // Sonsuz döngü önle
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

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Hesaplanmış analytics'i output formatına dönüştürür
 */
function formatAnalyticsOutput(
  examId: string,
  studentId: string,
  analytics: ReturnType<typeof calculateFullAnalytics>,
  assembled: Awaited<ReturnType<typeof assembleInput>>,
  calculationMs: number
): StudentAnalyticsOutput {
  return {
    student_id: studentId,
    exam_id: examId,
    
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
    
    analytics: {
      subject_performance: formatSubjectPerformance(analytics.subjectPerformance),
      topic_performance: formatTopicPerformance(analytics.topicPerformance),
      difficulty_performance: analytics.difficultyPerformance,
      consistency_score: analytics.consistencyScore
    },
    
    trends: {
      direction: analytics.trendDirection,
      change: analytics.trendChange,
      net_trend: analytics.netTrend,
      rank_trend: analytics.rankTrend,
      slope: null, // Engine'den gelmiyor
      is_significant: (analytics.trendChange ?? 0) > 2
    },
    
    risk: {
      level: analytics.riskLevel,
      score: analytics.riskScore,
      factors: analytics.riskFactors,
      action_required: analytics.riskLevel === 'high'
    },
    
    strengths: analytics.strengths,
    weaknesses: analytics.weaknesses,
    improvement_priorities: analytics.improvementPriorities,
    study_recommendations: analytics.studyRecommendations,
    
    ai_metadata: assembled?.existing_ai_metadata ?? {},
    
    calculation_metadata: {
      analytics_version: '1.0.0',
      calculated_at: new Date().toISOString(),
      calculation_duration_ms: calculationMs,
      engine_version: '1.0.0',
      data_completeness: 1.0,
      confidence_score: 1.0
    },
    
    cache_info: {
      is_cached: false,
      is_stale: false,
      cached_at: null
    }
  };
}

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
