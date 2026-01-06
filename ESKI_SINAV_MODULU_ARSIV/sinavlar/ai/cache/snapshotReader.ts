/**
 * ============================================
 * AkademiHub - AI Snapshot Reader
 * ============================================
 * 
 * PHASE 5.1.1 - Cache Okuma İşlemleri
 * 
 * Bu dosya:
 * - DB'den AI snapshot okur
 * - Hash kontrolü yapar
 * - Stale kontrolü yapar
 * - Computing durumunu kontrol eder
 */

import { createClient } from '@/lib/supabase/client';
import type { AIRole } from '../types';
import type { 
  SnapshotKey, 
  SnapshotReadResult, 
  AISnapshotRecord,
  CacheConfig
} from './types';
import { DEFAULT_CACHE_CONFIG } from './types';
import { hashesMatch } from './hashGenerator';

// ==================== ANA FONKSİYON ====================

/**
 * Snapshot okur ve durumunu döndürür
 * 
 * @param key - Snapshot key (examId, studentId, role)
 * @param currentHash - Mevcut analytics hash
 * @param config - Cache config
 */
export async function readSnapshot(
  key: SnapshotKey,
  currentHash: string,
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): Promise<SnapshotReadResult> {
  try {
    const supabase = createClient();
    
    // Snapshot'u getir
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .select('*')
      .eq('exam_id', key.examId)
      .eq('student_id', key.studentId)
      .eq('role', key.role)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Kayıt bulunamadı
        return {
          found: false,
          status: 'miss',
          reason: 'Snapshot not found'
        };
      }
      
      throw error;
    }
    
    const snapshot = data as AISnapshotRecord;
    
    // Status kontrolü
    if (snapshot.status === 'computing') {
      return {
        found: true,
        snapshot,
        status: 'computing',
        reason: 'AI is currently generating response'
      };
    }
    
    if (snapshot.status === 'failed') {
      // Failed snapshot, yeniden hesaplanmalı
      return {
        found: true,
        snapshot,
        status: 'miss',
        reason: 'Previous attempt failed, needs retry'
      };
    }
    
    // Hash kontrolü
    if (!hashesMatch(snapshot.analytics_hash, currentHash)) {
      return {
        found: true,
        snapshot,
        status: 'stale',
        reason: 'Analytics data has changed'
      };
    }
    
    // Stale kontrolü (yaş)
    const age = getSnapshotAge(snapshot);
    if (age > config.staleThresholdSeconds * 1000) {
      return {
        found: true,
        snapshot,
        status: 'stale',
        reason: `Snapshot is ${Math.floor(age / 1000 / 60 / 60)} hours old`
      };
    }
    
    // HIT - Geçerli snapshot
    return {
      found: true,
      snapshot,
      status: 'hit',
      reason: 'Valid cached snapshot'
    };
    
  } catch (error) {
    console.error('[SnapshotReader] Read error:', error);
    
    return {
      found: false,
      status: 'miss',
      reason: `Database error: ${error instanceof Error ? error.message : 'Unknown'}`
    };
  }
}

// ==================== BATCH OPERATIONS ====================

/**
 * Birden fazla snapshot okur
 */
export async function readSnapshots(
  keys: SnapshotKey[],
  hashMap: Map<string, string>
): Promise<Map<string, SnapshotReadResult>> {
  const results = new Map<string, SnapshotReadResult>();
  
  // TODO: Batch query optimize edilebilir
  for (const key of keys) {
    const keyString = `${key.examId}:${key.studentId}:${key.role}`;
    const hash = hashMap.get(keyString) || '';
    const result = await readSnapshot(key, hash);
    results.set(keyString, result);
  }
  
  return results;
}

/**
 * Belirli bir sınav için tüm snapshot'ları getirir
 */
export async function getSnapshotsForExam(
  examId: string
): Promise<AISnapshotRecord[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .select('*')
      .eq('exam_id', examId)
      .eq('status', 'ready')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []) as AISnapshotRecord[];
    
  } catch (error) {
    console.error('[SnapshotReader] Get exam snapshots error:', error);
    return [];
  }
}

/**
 * Belirli bir öğrenci için tüm snapshot'ları getirir
 */
export async function getSnapshotsForStudent(
  studentId: string
): Promise<AISnapshotRecord[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'ready')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []) as AISnapshotRecord[];
    
  } catch (error) {
    console.error('[SnapshotReader] Get student snapshots error:', error);
    return [];
  }
}

// ==================== STATUS OPERATIONS ====================

/**
 * Snapshot durumunu kontrol eder
 */
export async function checkSnapshotStatus(
  key: SnapshotKey
): Promise<'ready' | 'computing' | 'failed' | 'not_found'> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .select('status')
      .eq('exam_id', key.examId)
      .eq('student_id', key.studentId)
      .eq('role', key.role)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return 'not_found';
      }
      throw error;
    }
    
    return data.status;
    
  } catch (error) {
    console.error('[SnapshotReader] Status check error:', error);
    return 'not_found';
  }
}

/**
 * Computing durumundaki snapshot'ları temizler (timeout olmuşlar)
 */
export async function cleanupStaleComputingSnapshots(
  timeoutMinutes: number = 5
): Promise<number> {
  try {
    const supabase = createClient();
    
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('exam_student_ai_snapshots')
      .update({ status: 'failed', metadata: { error_message: 'Computing timeout' } })
      .eq('status', 'computing')
      .lt('updated_at', cutoffTime)
      .select('id');
    
    if (error) throw error;
    
    return data?.length || 0;
    
  } catch (error) {
    console.error('[SnapshotReader] Cleanup error:', error);
    return 0;
  }
}

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Snapshot yaşını hesaplar (ms)
 */
function getSnapshotAge(snapshot: AISnapshotRecord): number {
  const updatedAt = new Date(snapshot.updated_at).getTime();
  return Date.now() - updatedAt;
}

/**
 * Snapshot'ın geçerli olup olmadığını kontrol eder
 */
export function isSnapshotValid(
  snapshot: AISnapshotRecord,
  currentHash: string,
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): boolean {
  // Status kontrolü
  if (snapshot.status !== 'ready') {
    return false;
  }
  
  // Hash kontrolü
  if (!hashesMatch(snapshot.analytics_hash, currentHash)) {
    return false;
  }
  
  // TTL kontrolü
  const age = getSnapshotAge(snapshot);
  if (age > config.ttlSeconds * 1000) {
    return false;
  }
  
  return true;
}

// ==================== EXPORT ====================

export default {
  readSnapshot,
  readSnapshots,
  getSnapshotsForExam,
  getSnapshotsForStudent,
  checkSnapshotStatus,
  cleanupStaleComputingSnapshots,
  isSnapshotValid
};

