/**
 * ============================================
 * AkademiHub - Analytics Cache Policy
 * ============================================
 * 
 * PHASE 3.3 - Cache geçerlilik mantığı
 * 
 * SORUMLULUKLAR:
 * - Snapshot geçerlilik kontrolü
 * - Yeniden hesaplama kararı
 * - Stale işaretleme
 * 
 * KURALLAR:
 * - UI ASLA beklemez
 * - Stale veri kabul edilebilir
 * - Yavaş UI kabul EDİLEMEZ
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  AnalyticsSnapshot, 
  OrchestratorConfig,
  AnalyticsQueueJob
} from './types';
import { DEFAULT_ORCHESTRATOR_CONFIG } from './types';

// ==================== CACHE GEÇERLİLİK KONTROLÜ ====================

/**
 * Snapshot'ın geçerli olup olmadığını kontrol eder
 * 
 * Geçersizlik durumları:
 * 1. is_stale = true
 * 2. calculation_version eski
 * 3. Çok eski (max_stale_age_hours aşıldı)
 * 
 * @param snapshot - Kontrol edilecek snapshot
 * @param config - Orchestrator config
 * @returns true = kullanılabilir, false = yeniden hesapla
 */
export function isSnapshotValid(
  snapshot: AnalyticsSnapshot | null,
  config: Partial<OrchestratorConfig> = {}
): boolean {
  // Snapshot yoksa geçersiz
  if (!snapshot) {
    return false;
  }
  
  // is_stale kontrolü
  if (snapshot.is_stale) {
    return false;
  }
  
  // Versiyon kontrolü
  const currentVersion = '1.0.0';
  if (snapshot.calculation_version !== currentVersion) {
    // Versiyon uyumsuz - ama yine de kullanılabilir
    // Sadece arka planda güncelleme tetikle
    return true;
  }
  
  // Yaş kontrolü
  const maxAgeHours = config.max_stale_age_hours ?? DEFAULT_ORCHESTRATOR_CONFIG.max_stale_age_hours;
  if (isSnapshotTooOld(snapshot, maxAgeHours)) {
    return false;
  }
  
  return true;
}

/**
 * Snapshot'ın yeniden hesaplanması gerekip gerekmediğini belirler
 * 
 * Fark: isSnapshotValid = UI'a dönülmeli mi?
 *       shouldRecompute = Arka planda yeniden hesapla mı?
 */
export function shouldRecompute(
  snapshot: AnalyticsSnapshot | null,
  config: Partial<OrchestratorConfig> = {}
): { recompute: boolean; reason: string; priority: number } {
  // Snapshot yoksa kesinlikle hesapla
  if (!snapshot) {
    return { 
      recompute: true, 
      reason: 'Snapshot does not exist',
      priority: 1 // En yüksek öncelik
    };
  }
  
  // Stale ise hesapla
  if (snapshot.is_stale) {
    return { 
      recompute: true, 
      reason: snapshot.invalidation_reason ?? 'Marked as stale',
      priority: 2
    };
  }
  
  // Versiyon eski ise hesapla (düşük öncelik)
  const currentVersion = '1.0.0';
  if (snapshot.calculation_version !== currentVersion) {
    return { 
      recompute: true, 
      reason: `Version mismatch: ${snapshot.calculation_version} → ${currentVersion}`,
      priority: 5
    };
  }
  
  // Yaş kontrolü
  const maxAgeHours = config.max_stale_age_hours ?? DEFAULT_ORCHESTRATOR_CONFIG.max_stale_age_hours;
  if (isSnapshotTooOld(snapshot, maxAgeHours)) {
    return { 
      recompute: true, 
      reason: 'Snapshot age exceeded max limit',
      priority: 4
    };
  }
  
  // Veri tamlığı düşükse (opsiyonel)
  const metadata = snapshot.calculation_metadata as any;
  if (metadata?.data_completeness && metadata.data_completeness < 0.5) {
    return {
      recompute: true,
      reason: 'Low data completeness, may have new data',
      priority: 6
    };
  }
  
  return { recompute: false, reason: 'Valid snapshot', priority: 10 };
}

/**
 * Snapshot'ın maksimum yaşı aşıp aşmadığını kontrol eder
 */
function isSnapshotTooOld(snapshot: AnalyticsSnapshot, maxAgeHours: number): boolean {
  if (!snapshot.calculated_at) {
    return true;
  }
  
  const calculatedAt = new Date(snapshot.calculated_at);
  const now = new Date();
  const ageMs = now.getTime() - calculatedAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  
  return ageHours > maxAgeHours;
}

// ==================== STALE İŞARETLEME ====================

/**
 * Bir snapshot'ı stale olarak işaretler
 */
export async function markStale(
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
    
    return !error;
  } catch (error) {
    console.error('[CachePolicy] Mark stale error:', error);
    return false;
  }
}

/**
 * Bir sınavın tüm snapshot'larını stale işaretler
 * (Örn: Cevap anahtarı değiştiğinde)
 */
export async function markExamStale(
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
      console.error('[CachePolicy] Mark exam stale error:', error);
      return 0;
    }
    
    return data?.length ?? 0;
  } catch (error) {
    console.error('[CachePolicy] Unexpected error:', error);
    return 0;
  }
}

// ==================== KUYRUK YÖNETİMİ ====================

/**
 * Analytics hesaplama işini kuyruğa ekler
 * (Asenkron yeniden hesaplama için)
 */
export async function enqueueRecompute(
  examId: string,
  studentId: string,
  priority: number = 3,
  reason?: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Aynı iş zaten kuyrukta mı kontrol et
    const { data: existing } = await supabase
      .from('exam_analytics_queue')
      .select('id')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .single();
    
    if (existing) {
      // Zaten kuyrukta, tekrar ekleme
      return true;
    }
    
    // Yeni iş ekle
    const { error } = await supabase
      .from('exam_analytics_queue')
      .insert({
        job_type: 'student_analytics',
        exam_id: examId,
        student_id: studentId,
        priority,
        status: 'pending',
        params: reason ? { reason } : {},
        scheduled_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('[CachePolicy] Enqueue error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[CachePolicy] Unexpected enqueue error:', error);
    return false;
  }
}

/**
 * Toplu yeniden hesaplama işi kuyruğa ekler
 * (Örn: Tüm sınav sonuçlarını yeniden hesapla)
 */
export async function enqueueBulkRecompute(
  examId: string,
  reason: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_analytics_queue')
      .insert({
        job_type: 'exam_analytics',
        exam_id: examId,
        priority: 1, // Yüksek öncelik
        status: 'pending',
        params: { reason },
        scheduled_at: new Date().toISOString()
      });
    
    return !error;
  } catch (error) {
    console.error('[CachePolicy] Bulk enqueue error:', error);
    return false;
  }
}

/**
 * Bekleyen işleri getirir
 */
export async function getPendingJobs(
  limit: number = 10
): Promise<AnalyticsQueueJob[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_analytics_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('scheduled_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('[CachePolicy] Get pending jobs error:', error);
      return [];
    }
    
    return (data ?? []).map((job: any) => ({
      job_id: job.id,
      job_type: job.job_type,
      exam_id: job.exam_id,
      student_id: job.student_id,
      class_name: job.class_name,
      priority: job.priority,
      params: job.params,
      created_at: job.created_at
    }));
  } catch (error) {
    console.error('[CachePolicy] Unexpected get jobs error:', error);
    return [];
  }
}

/**
 * İşi tamamlandı olarak işaretler
 */
export async function markJobCompleted(
  jobId: string,
  result?: Record<string, any>
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_analytics_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result
      })
      .eq('id', jobId);
    
    return !error;
  } catch (error) {
    console.error('[CachePolicy] Mark completed error:', error);
    return false;
  }
}

/**
 * İşi başarısız olarak işaretler
 */
export async function markJobFailed(
  jobId: string,
  errorMessage: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('exam_analytics_queue')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        retry_count: supabase.sql`retry_count + 1`
      })
      .eq('id', jobId);
    
    return !error;
  } catch (error) {
    console.error('[CachePolicy] Mark failed error:', error);
    return false;
  }
}

// ==================== EXPORT ====================

export default {
  isSnapshotValid,
  shouldRecompute,
  markStale,
  markExamStale,
  enqueueRecompute,
  enqueueBulkRecompute,
  getPendingJobs,
  markJobCompleted,
  markJobFailed
};
