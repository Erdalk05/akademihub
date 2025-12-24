/**
 * ============================================
 * AkademiHub - Analytics Snapshot Writer
 * ============================================
 * 
 * PHASE 3.3 - Cache yazma katmanı
 * 
 * SORUMLULUKLAR:
 * - exam_student_analytics tablosuna yazma (UPSERT)
 * - ai_metadata korunması
 * - Hesaplama metadata'sı ekleme
 * 
 * KURALLAR:
 * - UPSERT kullan (exam_id + student_id)
 * - ai_metadata'yı koru (üzerine yazma)
 * - is_stale = false set et
 * - Hata durumunda false dön (throw etme)
 */

import { createClient } from '@/lib/supabase/client';
import type { FullAnalyticsResult } from '../engine/types';
import type { 
  AnalyticsSnapshot,
  AssembledInput,
  StudentAnalyticsOutput 
} from './types';
import { ANALYTICS_VERSION, ENGINE_VERSION } from '../engine/versioning';

// ==================== ANA YAZMA FONKSİYONU ====================

export interface WriteSnapshotInput {
  examId: string;
  studentId: string;
  analytics: FullAnalyticsResult;
  assembledInput: AssembledInput;
  calculationDurationMs: number;
  existingAiMetadata?: Record<string, any>;
  organizationId?: string;
  academicYearId?: string;
}

export interface WriteResult {
  success: boolean;
  snapshotId?: string;
  error?: string;
}

/**
 * Analytics sonucunu exam_student_analytics tablosuna yazar
 * 
 * UPSERT kullanır: exam_id + student_id kombinasyonu unique
 * ai_metadata korunur ve üzerine yazılmaz
 */
export async function writeSnapshot(input: WriteSnapshotInput): Promise<WriteResult> {
  try {
    const supabase = createClient();
    
    // Snapshot verisini hazırla
    const snapshotData = prepareSnapshotData(input);
    
    // UPSERT işlemi
    const { data, error } = await supabase
      .from('exam_student_analytics')
      .upsert(snapshotData, {
        onConflict: 'exam_id,student_id',
        ignoreDuplicates: false
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[SnapshotWriter] Write error:', error);
      return {
        success: false,
        error: `DB write failed: ${error.message}`
      };
    }
    
    return {
      success: true,
      snapshotId: data?.id
    };
  } catch (error) {
    console.error('[SnapshotWriter] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown write error'
    };
  }
}

// ==================== VERİ HAZIRLAMA ====================

/**
 * FullAnalyticsResult'ı DB formatına dönüştürür
 */
function prepareSnapshotData(input: WriteSnapshotInput): Partial<AnalyticsSnapshot> {
  const { analytics, assembledInput, calculationDurationMs, existingAiMetadata } = input;
  
  const now = new Date().toISOString();
  
  return {
    // İlişkiler
    exam_id: input.examId,
    student_id: input.studentId,
    
    // Denormalize öğrenci bilgileri (hızlı okuma için)
    student_no: assembledInput.student.student_no,
    student_name: assembledInput.student.name,
    class_name: assembledInput.student.class_name,
    
    // Temel metrikler
    total_net: round(analytics.totalNet),
    total_correct: analytics.totalCorrect,
    total_wrong: analytics.totalWrong,
    total_empty: analytics.totalEmpty,
    
    // Sıralama
    rank_in_exam: analytics.rankInExam,
    rank_in_class: analytics.rankInClass,
    rank_in_school: analytics.rankInSchool,
    percentile: analytics.percentile,
    
    // JSONB alanları
    subject_performance: analytics.subjectPerformance,
    topic_performance: analytics.topicPerformance,
    outcome_performance: analytics.outcomePerformance,
    difficulty_performance: analytics.difficultyPerformance,
    
    // Tutarlılık
    consistency_score: analytics.consistencyScore,
    
    // AI-ready alanlar
    strengths: analytics.strengths,
    weaknesses: analytics.weaknesses,
    improvement_priorities: analytics.improvementPriorities,
    study_recommendations: analytics.studyRecommendations,
    
    // Risk
    risk_level: analytics.riskLevel,
    risk_score: analytics.riskScore,
    risk_factors: analytics.riskFactors,
    
    // Karşılaştırmalar
    vs_class_avg: analytics.vsClassAvg,
    vs_school_avg: analytics.vsSchoolAvg,
    vs_previous_exam: analytics.vsPreviousExam,
    
    // Trend
    net_trend: analytics.netTrend,
    rank_trend: analytics.rankTrend,
    trend_direction: analytics.trendDirection,
    trend_change: analytics.trendChange,
    
    // Genel değerlendirme
    overall_assessment: analytics.overallAssessment,
    assessment_summary: analytics.assessmentSummary,
    
    // AI Metadata - KORU, üzerine yazma
    ai_metadata: existingAiMetadata ?? {},
    
    // Hesaplama metadata
    calculation_metadata: {
      ...analytics.calculationMetadata,
      engine_version: ENGINE_VERSION,
      data_completeness: calculateDataCompleteness(assembledInput),
      confidence_score: calculateConfidenceScore(assembledInput, analytics)
    },
    
    // Versiyon
    calculation_version: ANALYTICS_VERSION,
    calculated_at: now,
    calculation_duration_ms: calculationDurationMs,
    
    // Cache kontrolü
    is_stale: false,
    invalidated_at: undefined,
    invalidation_reason: undefined,
    
    // Multi-tenant
    organization_id: input.organizationId,
    academic_year_id: input.academicYearId,
    
    // Timestamps
    updated_at: now
  };
}

// ==================== YARDIMCI HESAPLAMALAR ====================

/**
 * Veri tamlık oranını hesaplar
 */
function calculateDataCompleteness(input: AssembledInput): number {
  let score = 0;
  let total = 0;
  
  // Zorunlu veriler
  total += 3;
  if (input.answers.length > 0) score++;
  if (Object.keys(input.exam.answer_key).length > 0) score++;
  if (input.subject_config.length > 0) score++;
  
  // Opsiyonel ama değerli veriler
  total += 4;
  if (input.result) score++;
  if (input.class_data) score++;
  if (input.topic_config && input.topic_config.length > 0) score++;
  if (input.previous_exams && input.previous_exams.length > 0) score++;
  
  return round(score / total, 4);
}

/**
 * Güvenilirlik skoru hesaplar
 */
function calculateConfidenceScore(
  input: AssembledInput, 
  analytics: FullAnalyticsResult
): number {
  let score = 1.0;
  
  // Veri eksikliği cezası
  const dataCompleteness = calculateDataCompleteness(input);
  if (dataCompleteness < 0.7) {
    score -= 0.2;
  }
  
  // Trend verisi yoksa düşür
  if (!input.previous_exams || input.previous_exams.length < 2) {
    score -= 0.1;
  }
  
  // Konu verisi yoksa düşür
  if (!input.topic_config || input.topic_config.length === 0) {
    score -= 0.1;
  }
  
  return round(Math.max(0.3, score), 4);
}

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== TOPLU YAZMA ====================

/**
 * Birden fazla snapshot'ı toplu olarak yazar
 * 
 * @param snapshots - Yazılacak snapshot'lar
 * @returns Başarılı yazma sayısı
 */
export async function writeSnapshotsBulk(
  snapshots: WriteSnapshotInput[]
): Promise<{ successCount: number; failedIds: string[] }> {
  let successCount = 0;
  const failedIds: string[] = [];
  
  // Batch olarak yaz (50'şer)
  const batchSize = 50;
  
  for (let i = 0; i < snapshots.length; i += batchSize) {
    const batch = snapshots.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (input) => {
        const result = await writeSnapshot(input);
        return { studentId: input.studentId, success: result.success };
      })
    );
    
    for (const result of results) {
      if (result.success) {
        successCount++;
      } else {
        failedIds.push(result.studentId);
      }
    }
  }
  
  return { successCount, failedIds };
}

// ==================== STALE İŞARETLEME ====================

/**
 * Bir snapshot'ı stale olarak işaretler
 * (Trigger tarafından da yapılabilir ama manuel kontrol için)
 */
export async function markSnapshotStale(
  examId: string,
  studentId: string,
  reason: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_student_analytics')
      .update({
        is_stale: true,
        invalidated_at: new Date().toISOString(),
        invalidation_reason: reason
      })
      .eq('exam_id', examId)
      .eq('student_id', studentId);
    
    if (error) {
      console.error('[SnapshotWriter] Mark stale error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[SnapshotWriter] Unexpected stale error:', error);
    return false;
  }
}

/**
 * Bir sınavın tüm snapshot'larını stale işaretler
 */
export async function markExamSnapshotsStale(
  examId: string,
  reason: string
): Promise<number> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_analytics')
      .update({
        is_stale: true,
        invalidated_at: new Date().toISOString(),
        invalidation_reason: reason
      })
      .eq('exam_id', examId)
      .select('id');
    
    if (error) {
      console.error('[SnapshotWriter] Bulk stale error:', error);
      return 0;
    }
    
    return data?.length ?? 0;
  } catch (error) {
    console.error('[SnapshotWriter] Unexpected bulk stale error:', error);
    return 0;
  }
}

// ==================== SNAPSHOT SİLME ====================

/**
 * Bir snapshot'ı siler
 * (Dikkatli kullan - genellikle öğrenci silindiğinde cascade ile silinir)
 */
export async function deleteSnapshot(
  examId: string,
  studentId: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_student_analytics')
      .delete()
      .eq('exam_id', examId)
      .eq('student_id', studentId);
    
    if (error) {
      console.error('[SnapshotWriter] Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[SnapshotWriter] Unexpected delete error:', error);
    return false;
  }
}

// ==================== EXPORT ====================

export default {
  writeSnapshot,
  writeSnapshotsBulk,
  markSnapshotStale,
  markExamSnapshotsStale,
  deleteSnapshot
};
