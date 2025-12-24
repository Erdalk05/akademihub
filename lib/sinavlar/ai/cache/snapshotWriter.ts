/**
 * ============================================
 * AkademiHub - AI Snapshot Writer
 * ============================================
 * 
 * PHASE 5.1.1 - Cache Yazma İşlemleri
 * 
 * Bu dosya:
 * - AI snapshot'u DB'ye yazar (UPSERT)
 * - Status güncellemesi yapar
 * - Metadata ekler
 * - Audit trail oluşturur
 */

import { createClient } from '@/lib/supabase/client';
import type { AICoachOutput } from '../types';
import type { 
  SnapshotKey,
  SnapshotWriteInput,
  SnapshotWriteResult,
  SnapshotStatus,
  SnapshotMetadata,
  TriggerReason,
  TokenUsage
} from './types';

// ==================== ENGINE VERSION ====================

const ENGINE_VERSION = '5.1.1';
const INPUTS_VERSION = 'v1.0';

// ==================== ANA FONKSİYONLAR ====================

/**
 * AI snapshot'u kaydeder (UPSERT)
 * 
 * @param input - Yazılacak snapshot bilgisi
 */
export async function writeSnapshot(
  input: SnapshotWriteInput
): Promise<SnapshotWriteResult> {
  try {
    const supabase = createClient();
    
    // Metadata hazırla
    const metadata: SnapshotMetadata = {
      engine_version: ENGINE_VERSION,
      inputs_version: INPUTS_VERSION,
      trigger: input.triggerReason,
      data_completeness: input.output.dataQuality || 0,
      ...input.metadata
    };
    
    // Upsert data
    const upsertData = {
      exam_id: input.key.examId,
      student_id: input.key.studentId,
      role: input.key.role,
      analytics_hash: input.analyticsHash,
      model: input.output.model || input.output.metadata?.model || 'gpt-4o-mini',
      content: input.output.structured,
      message: input.output.message,
      tone: 'balanced',
      confidence_score: input.output.dataQuality || 0,
      source: input.source,
      status: 'ready' as SnapshotStatus,
      metadata,
      token_usage: input.output.tokenUsage as TokenUsage | undefined,
      generation_duration_ms: input.output.generationDurationMs,
      trigger_reason: input.triggerReason
    };
    
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .upsert(upsertData, {
        onConflict: 'exam_id,student_id,role'
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      snapshotId: data.id
    };
    
  } catch (error) {
    console.error('[SnapshotWriter] Write error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ==================== STATUS OPERATIONS ====================

/**
 * Snapshot status'unu "computing" olarak işaretler
 * Bu, race condition koruması için DB tarafındaki lock'tur
 */
export async function markAsComputing(
  key: SnapshotKey
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Önce mevcut durumu kontrol et
    const { data: existing } = await supabase
      .from('exam_student_ai_snapshots')
      .select('status')
      .eq('exam_id', key.examId)
      .eq('student_id', key.studentId)
      .eq('role', key.role)
      .single();
    
    if (existing?.status === 'computing') {
      // Zaten computing, başka process çalışıyor
      return false;
    }
    
    // Computing olarak işaretle veya yeni kayıt oluştur
    const { error } = await supabase
      .from('exam_student_ai_snapshots')
      .upsert({
        exam_id: key.examId,
        student_id: key.studentId,
        role: key.role,
        analytics_hash: 'computing',
        model: 'pending',
        content: {},
        tone: 'balanced',
        confidence_score: 0,
        source: 'ai',
        status: 'computing',
        metadata: {
          engine_version: ENGINE_VERSION,
          inputs_version: INPUTS_VERSION,
          trigger: 'initial' as TriggerReason
        },
        trigger_reason: 'initial'
      }, {
        onConflict: 'exam_id,student_id,role'
      });
    
    if (error) throw error;
    
    return true;
    
  } catch (error) {
    console.error('[SnapshotWriter] Mark as computing error:', error);
    return false;
  }
}

/**
 * Snapshot status'unu "failed" olarak işaretler
 */
export async function markAsFailed(
  key: SnapshotKey,
  errorMessage: string,
  errorCode?: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_student_ai_snapshots')
      .update({
        status: 'failed',
        metadata: {
          engine_version: ENGINE_VERSION,
          error_message: errorMessage,
          error_code: errorCode
        }
      })
      .eq('exam_id', key.examId)
      .eq('student_id', key.studentId)
      .eq('role', key.role);
    
    if (error) throw error;
    
    return true;
    
  } catch (error) {
    console.error('[SnapshotWriter] Mark as failed error:', error);
    return false;
  }
}

/**
 * Snapshot status'unu "ready" olarak işaretler
 */
export async function markAsReady(
  key: SnapshotKey
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_student_ai_snapshots')
      .update({ status: 'ready' })
      .eq('exam_id', key.examId)
      .eq('student_id', key.studentId)
      .eq('role', key.role);
    
    if (error) throw error;
    
    return true;
    
  } catch (error) {
    console.error('[SnapshotWriter] Mark as ready error:', error);
    return false;
  }
}

// ==================== DELETE OPERATIONS ====================

/**
 * Snapshot'u siler
 */
export async function deleteSnapshot(
  key: SnapshotKey
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_student_ai_snapshots')
      .delete()
      .eq('exam_id', key.examId)
      .eq('student_id', key.studentId)
      .eq('role', key.role);
    
    if (error) throw error;
    
    return true;
    
  } catch (error) {
    console.error('[SnapshotWriter] Delete error:', error);
    return false;
  }
}

/**
 * Belirli bir sınav için tüm snapshot'ları siler
 */
export async function deleteSnapshotsForExam(
  examId: string
): Promise<number> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .delete()
      .eq('exam_id', examId)
      .select('id');
    
    if (error) throw error;
    
    return data?.length || 0;
    
  } catch (error) {
    console.error('[SnapshotWriter] Delete exam snapshots error:', error);
    return 0;
  }
}

/**
 * Belirli bir öğrenci için tüm snapshot'ları siler
 */
export async function deleteSnapshotsForStudent(
  studentId: string
): Promise<number> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .delete()
      .eq('student_id', studentId)
      .select('id');
    
    if (error) throw error;
    
    return data?.length || 0;
    
  } catch (error) {
    console.error('[SnapshotWriter] Delete student snapshots error:', error);
    return 0;
  }
}

// ==================== INVALIDATION ====================

/**
 * Hash değiştiğinde snapshot'u invalidate eder
 * Snapshot silinmez, sadece status güncellenir
 */
export async function invalidateSnapshot(
  key: SnapshotKey,
  reason: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_student_ai_snapshots')
      .update({
        status: 'failed',
        metadata: {
          engine_version: ENGINE_VERSION,
          error_message: `Invalidated: ${reason}`,
          invalidated_at: new Date().toISOString()
        }
      })
      .eq('exam_id', key.examId)
      .eq('student_id', key.studentId)
      .eq('role', key.role);
    
    if (error) throw error;
    
    return true;
    
  } catch (error) {
    console.error('[SnapshotWriter] Invalidate error:', error);
    return false;
  }
}

// ==================== EXPORT ====================

export default {
  writeSnapshot,
  markAsComputing,
  markAsFailed,
  markAsReady,
  deleteSnapshot,
  deleteSnapshotsForExam,
  deleteSnapshotsForStudent,
  invalidateSnapshot
};

