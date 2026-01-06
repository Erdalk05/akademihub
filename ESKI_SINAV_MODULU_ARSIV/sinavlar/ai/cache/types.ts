/**
 * ============================================
 * AkademiHub - AI Cache Types
 * ============================================
 * 
 * PHASE 5.1.1 - AI Snapshot Cache System
 * 
 * Bu dosya:
 * - AI snapshot tipleri
 * - Cache operasyon tipleri
 * - Status ve metadata yapıları
 */

import type { AIRole, AICoachOutput, StructuredCoachOutput } from '../types';

// ==================== SNAPSHOT STATUS ====================

/**
 * Snapshot durumu
 * - ready: Kullanıma hazır
 * - computing: AI çalışıyor (race lock aktif)
 * - failed: Hata oluştu
 */
export type SnapshotStatus = 'ready' | 'computing' | 'failed';

/**
 * Snapshot kaynağı
 */
export type SnapshotSource = 'ai' | 'fallback';

/**
 * Tetikleyici sebep
 */
export type TriggerReason = 'initial' | 'analytics_change' | 'ttl_refresh' | 'manual';

// ==================== DATABASE TYPES ====================

/**
 * Veritabanı AI Snapshot kaydı
 */
export interface AISnapshotRecord {
  id: string;
  exam_id: string;
  student_id: string;
  role: AIRole;
  analytics_hash: string;
  model: string;
  content: StructuredCoachOutput;
  message: string | null;
  tone: string;
  confidence_score: number;
  source: SnapshotSource;
  status: SnapshotStatus;
  metadata: SnapshotMetadata;
  token_usage: TokenUsage | null;
  generation_duration_ms: number | null;
  trigger_reason: TriggerReason;
  created_at: string;
  updated_at: string;
}

/**
 * Token kullanım bilgisi
 */
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

/**
 * Audit metadata
 */
export interface SnapshotMetadata {
  // Üretim bilgisi
  engine_version: string;
  inputs_version: string;
  
  // Tetikleyici bilgisi
  trigger: TriggerReason;
  triggered_by?: string;
  
  // Analytics bilgisi
  analytics_version?: string;
  data_completeness?: number;
  
  // Hata bilgisi (failed durumunda)
  error_message?: string;
  error_code?: string;
  
  // Ek bilgiler
  [key: string]: unknown;
}

// ==================== CACHE OPERATIONS ====================

/**
 * Snapshot lookup key
 */
export interface SnapshotKey {
  examId: string;
  studentId: string;
  role: AIRole;
}

/**
 * Snapshot okuma sonucu
 */
export interface SnapshotReadResult {
  found: boolean;
  snapshot?: AISnapshotRecord;
  status: 'hit' | 'miss' | 'stale' | 'computing';
  reason?: string;
}

/**
 * Snapshot yazma girdisi
 */
export interface SnapshotWriteInput {
  key: SnapshotKey;
  analyticsHash: string;
  output: AICoachOutput;
  source: SnapshotSource;
  triggerReason: TriggerReason;
  metadata?: Partial<SnapshotMetadata>;
}

/**
 * Snapshot yazma sonucu
 */
export interface SnapshotWriteResult {
  success: boolean;
  snapshotId?: string;
  error?: string;
}

// ==================== HASH TYPES ====================

/**
 * Hash üretim girdisi
 */
export interface HashInput {
  studentId: string;
  examId: string;
  // Analytics'in hash'lenecek kısımları
  summary: {
    total_net: number;
    total_correct: number;
    total_wrong: number;
    percentile: number | null;
  };
  trends: {
    direction: string | null;
    net_trend: number[] | null;
  };
  risk: {
    level: string | null;
    score: number | null;
  };
}

/**
 * Hash sonucu
 */
export interface HashResult {
  hash: string;
  algorithm: 'sha256';
  inputVersion: string;
}

// ==================== IN-FLIGHT GUARD ====================

/**
 * Lock bilgisi
 */
export interface LockInfo {
  key: string;
  acquiredAt: number;
  expiresAt: number;
  owner: string;
}

/**
 * Lock sonucu
 */
export interface LockResult {
  acquired: boolean;
  lockInfo?: LockInfo;
  reason?: string;
}

// ==================== CACHE CONFIG ====================

/**
 * Cache konfigürasyonu
 */
export interface CacheConfig {
  // TTL (saniye)
  ttlSeconds: number;
  
  // Stale threshold (saniye) - bu süreden eski ise async refresh
  staleThresholdSeconds: number;
  
  // Lock timeout (ms)
  lockTimeoutMs: number;
  
  // Max retry
  maxRetries: number;
  
  // Retry delay (ms)
  retryDelayMs: number;
}

/**
 * Varsayılan cache config
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttlSeconds: 30 * 24 * 60 * 60, // 30 gün
  staleThresholdSeconds: 7 * 24 * 60 * 60, // 7 gün
  lockTimeoutMs: 30000, // 30 saniye
  maxRetries: 3,
  retryDelayMs: 1000
};

// ==================== CACHE STATS ====================

/**
 * Cache istatistikleri
 */
export interface CacheStats {
  hits: number;
  misses: number;
  stale: number;
  computing: number;
  errors: number;
  hitRate: number;
}

// ==================== EXPORT ====================

export default {
  DEFAULT_CACHE_CONFIG
};

