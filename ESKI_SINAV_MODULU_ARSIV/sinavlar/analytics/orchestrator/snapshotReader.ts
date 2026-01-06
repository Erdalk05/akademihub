/**
 * ============================================
 * AkademiHub - Analytics Snapshot Reader
 * ============================================
 * 
 * PHASE 3.3 - Cache okuma katmanı
 * 
 * SORUMLULUKLAR:
 * - exam_student_analytics tablosundan okuma
 * - Snapshot'ı StudentAnalyticsOutput formatına dönüştürme
 * 
 * KURALLAR:
 * - Sadece okuma (yazma yok)
 * - Hesaplama yok
 * - Null-safe dönüşümler
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  AnalyticsSnapshot, 
  StudentAnalyticsOutput,
  CacheInfo 
} from './types';

// ==================== ANA OKUMA FONKSİYONU ====================

/**
 * Belirli bir öğrenci ve sınav için analytics snapshot'ı okur
 * 
 * @param examId - Sınav ID
 * @param studentId - Öğrenci ID
 * @returns Snapshot veya null
 */
export async function readSnapshot(
  examId: string,
  studentId: string
): Promise<AnalyticsSnapshot | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_analytics')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();
    
    if (error) {
      // "PGRST116" = no rows found - bu bir hata değil
      if (error.code === 'PGRST116') {
        return null;
      }
      
      console.error('[SnapshotReader] DB error:', error);
      return null;
    }
    
    return data as AnalyticsSnapshot;
  } catch (error) {
    console.error('[SnapshotReader] Unexpected error:', error);
    return null;
  }
}

// ==================== SNAPSHOT → OUTPUT DÖNÜŞÜMÜ ====================

/**
 * DB snapshot'ını UI-ready output formatına dönüştürür
 * 
 * Bu dönüşüm:
 * - DB yapısını normalize eder
 * - Null değerleri güvenli hale getirir
 * - Cache bilgisini ekler
 */
export function snapshotToOutput(
  snapshot: AnalyticsSnapshot
): StudentAnalyticsOutput {
  return {
    // Tanımlayıcılar
    student_id: snapshot.student_id,
    exam_id: snapshot.exam_id,
    
    // Özet
    summary: {
      total_net: snapshot.total_net ?? 0,
      total_correct: snapshot.total_correct ?? 0,
      total_wrong: snapshot.total_wrong ?? 0,
      total_empty: snapshot.total_empty ?? 0,
      rank_in_exam: snapshot.rank_in_exam ?? null,
      rank_in_class: snapshot.rank_in_class ?? null,
      percentile: snapshot.percentile ?? null,
      overall_assessment: snapshot.overall_assessment ?? null,
      assessment_summary: snapshot.assessment_summary ?? null,
      vs_class_avg: snapshot.vs_class_avg ?? null,
      vs_school_avg: snapshot.vs_school_avg ?? null,
      vs_previous_exam: snapshot.vs_previous_exam ?? null
    },
    
    // Detaylı analitikler
    analytics: {
      subject_performance: transformSubjectPerformance(snapshot.subject_performance),
      topic_performance: transformTopicPerformance(snapshot.topic_performance),
      difficulty_performance: transformDifficultyPerformance(snapshot.difficulty_performance),
      consistency_score: snapshot.consistency_score ?? null
    },
    
    // Trend (PHASE 3.4 ENHANCED)
    trends: {
      direction: snapshot.trend_direction ?? null,
      change: snapshot.trend_change ?? null,
      net_trend: snapshot.net_trend ?? null,
      rank_trend: snapshot.rank_trend ?? null,
      slope: (snapshot.calculation_metadata as any)?.trend_velocity ?? null,
      velocity: (snapshot.calculation_metadata as any)?.trend_velocity,
      velocity_normalized: (snapshot.calculation_metadata as any)?.trend_velocity_normalized,
      consistency: (snapshot.calculation_metadata as any)?.trend_consistency,
      trend_score: (snapshot.calculation_metadata as any)?.trend_score,
      explanation: (snapshot.calculation_metadata as any)?.trend_explanation,
      is_significant: (snapshot.trend_change ?? 0) > 2
    },
    
    // Risk (PHASE 3.4 EXPLAINABLE)
    risk: {
      level: snapshot.risk_level ?? null,
      score: snapshot.risk_score ?? null,
      factors: Array.isArray(snapshot.risk_factors) ? snapshot.risk_factors : [],
      action_required: snapshot.risk_level === 'high' || (snapshot.risk_level as string) === 'critical',
      primary_concern: (snapshot.calculation_metadata as any)?.risk_primary_concern ?? null,
      summary: (snapshot.calculation_metadata as any)?.risk_summary,
      level_label: snapshot.risk_level ? getRiskLevelLabel(snapshot.risk_level) : undefined,
      level_color: snapshot.risk_level ? getRiskLevelColor(snapshot.risk_level) : undefined
    },
    
    // Güçlü/Zayıf yönler
    strengths: Array.isArray(snapshot.strengths) ? snapshot.strengths : [],
    weaknesses: Array.isArray(snapshot.weaknesses) ? snapshot.weaknesses : [],
    improvement_priorities: Array.isArray(snapshot.improvement_priorities) 
      ? snapshot.improvement_priorities 
      : [],
    study_recommendations: Array.isArray(snapshot.study_recommendations)
      ? snapshot.study_recommendations
      : [],
    
    // AI metadata (korunur)
    ai_metadata: snapshot.ai_metadata ?? {},
    
    // Hesaplama metadata
    calculation_metadata: {
      analytics_version: snapshot.calculation_version ?? '1.0.0',
      calculated_at: snapshot.calculated_at ?? new Date().toISOString(),
      calculation_duration_ms: snapshot.calculation_duration_ms ?? 0,
      engine_version: (snapshot.calculation_metadata as any)?.engine_version ?? '1.0.0',
      data_completeness: (snapshot.calculation_metadata as any)?.data_completeness ?? 1.0,
      confidence_score: (snapshot.calculation_metadata as any)?.confidence_score ?? 1.0
    },
    
    // Cache bilgisi
    cache_info: {
      is_cached: true,
      is_stale: snapshot.is_stale ?? false,
      cached_at: snapshot.calculated_at ?? null,
      stale_reason: snapshot.invalidation_reason
    }
  };
}

// ==================== DÖNÜŞÜM YARDIMCILARI ====================

function transformSubjectPerformance(
  data: Record<string, any> | null
): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  for (const [code, perf] of Object.entries(data)) {
    result[code] = {
      code,
      name: perf?.name,
      net: perf?.net ?? 0,
      correct: perf?.correct ?? 0,
      wrong: perf?.wrong ?? 0,
      empty: perf?.empty ?? 0,
      rate: perf?.rate ?? 0,
      rank: perf?.rank,
      class_avg: perf?.class_avg
    };
  }
  
  return result;
}

function transformTopicPerformance(
  data: Record<string, any> | null
): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  for (const [id, perf] of Object.entries(data)) {
    result[id] = {
      id,
      name: perf?.name ?? '',
      subject_code: perf?.subject_code,
      correct: perf?.correct ?? 0,
      total: perf?.total ?? 0,
      rate: perf?.rate ?? 0,
      status: perf?.status ?? 'average'
    };
  }
  
  return result;
}

// ==================== RISK LEVEL HELPERS (PHASE 3.4) ====================

function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    low: 'Düşük Risk',
    medium: 'Orta Risk',
    high: 'Yüksek Risk',
    critical: 'Kritik Risk'
  };
  return labels[level] ?? level;
}

function getRiskLevelColor(level: string): string {
  const colors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
  };
  return colors[level] ?? '#6b7280';
}

function transformDifficultyPerformance(
  data: Record<string, any> | null
): { easy: any; medium: any; hard: any } {
  const defaultLevel = { correct: 0, total: 0, rate: 0 };
  
  if (!data || typeof data !== 'object') {
    return {
      easy: { ...defaultLevel },
      medium: { ...defaultLevel },
      hard: { ...defaultLevel }
    };
  }
  
  return {
    easy: {
      correct: data.easy?.correct ?? 0,
      total: data.easy?.total ?? 0,
      rate: data.easy?.rate ?? 0
    },
    medium: {
      correct: data.medium?.correct ?? 0,
      total: data.medium?.total ?? 0,
      rate: data.medium?.rate ?? 0
    },
    hard: {
      correct: data.hard?.correct ?? 0,
      total: data.hard?.total ?? 0,
      rate: data.hard?.rate ?? 0
    }
  };
}

// ==================== TOPLU OKUMA ====================

/**
 * Bir sınav için tüm öğrenci snapshot'larını okur
 * 
 * @param examId - Sınav ID
 * @param limit - Maksimum kayıt sayısı
 */
export async function readExamSnapshots(
  examId: string,
  limit: number = 1000
): Promise<AnalyticsSnapshot[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_analytics')
      .select('*')
      .eq('exam_id', examId)
      .order('rank_in_exam', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('[SnapshotReader] Bulk read error:', error);
      return [];
    }
    
    return (data ?? []) as AnalyticsSnapshot[];
  } catch (error) {
    console.error('[SnapshotReader] Unexpected bulk error:', error);
    return [];
  }
}

/**
 * Bir sınıf için tüm snapshot'ları okur
 * 
 * @param examId - Sınav ID
 * @param className - Sınıf adı
 */
export async function readClassSnapshots(
  examId: string,
  className: string
): Promise<AnalyticsSnapshot[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_analytics')
      .select('*')
      .eq('exam_id', examId)
      .eq('class_name', className)
      .order('rank_in_class', { ascending: true });
    
    if (error) {
      console.error('[SnapshotReader] Class read error:', error);
      return [];
    }
    
    return (data ?? []) as AnalyticsSnapshot[];
  } catch (error) {
    console.error('[SnapshotReader] Unexpected class error:', error);
    return [];
  }
}

// ==================== STALE SNAPSHOT KONTROLÜ ====================

/**
 * Stale snapshot'ları listeler
 * 
 * @param examId - Sınav ID (opsiyonel)
 * @param limit - Maksimum kayıt
 */
export async function readStaleSnapshots(
  examId?: string,
  limit: number = 100
): Promise<AnalyticsSnapshot[]> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('exam_student_analytics')
      .select('*')
      .eq('is_stale', true)
      .order('invalidated_at', { ascending: true })
      .limit(limit);
    
    if (examId) {
      query = query.eq('exam_id', examId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[SnapshotReader] Stale read error:', error);
      return [];
    }
    
    return (data ?? []) as AnalyticsSnapshot[];
  } catch (error) {
    console.error('[SnapshotReader] Unexpected stale error:', error);
    return [];
  }
}

// ==================== EXPORT ====================

export default {
  readSnapshot,
  snapshotToOutput,
  readExamSnapshots,
  readClassSnapshots,
  readStaleSnapshots
};
