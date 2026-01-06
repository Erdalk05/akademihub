/**
 * ============================================
 * AkademiHub - AI Cache Module
 * ============================================
 * 
 * PHASE 5.1.1 - AI Snapshot Cache System
 * 
 * Bu modül:
 * - AI çıktılarını cache'ler
 * - Race condition koruması sağlar
 * - Maliyet kontrolü yapar
 * - Audit trail tutar
 */

// ==================== TYPES ====================

export type {
  SnapshotStatus,
  SnapshotSource,
  TriggerReason,
  AISnapshotRecord,
  TokenUsage,
  SnapshotMetadata,
  SnapshotKey,
  SnapshotReadResult,
  SnapshotWriteInput,
  SnapshotWriteResult,
  HashInput,
  HashResult,
  LockInfo,
  LockResult,
  CacheConfig,
  CacheStats
} from './types';

export { DEFAULT_CACHE_CONFIG } from './types';

// ==================== HASH GENERATOR ====================

export {
  generateAnalyticsHash,
  hashesMatch,
  isValidHash,
  shortHash
} from './hashGenerator';

// ==================== SNAPSHOT READER ====================

export {
  readSnapshot,
  readSnapshots,
  getSnapshotsForExam,
  getSnapshotsForStudent,
  checkSnapshotStatus,
  cleanupStaleComputingSnapshots,
  isSnapshotValid
} from './snapshotReader';

// ==================== SNAPSHOT WRITER ====================

export {
  writeSnapshot,
  markAsComputing,
  markAsFailed,
  markAsReady,
  deleteSnapshot,
  deleteSnapshotsForExam,
  deleteSnapshotsForStudent,
  invalidateSnapshot
} from './snapshotWriter';

// ==================== IN-FLIGHT GUARD ====================

export {
  acquireLock,
  releaseLock,
  isLocked,
  getLockInfo,
  cleanupExpiredLocks,
  clearAllLocks,
  getActiveLockCount,
  waitForLock
} from './inFlightGuard';

// ==================== CONVENIENCE EXPORTS ====================

import { generateAnalyticsHash, hashesMatch } from './hashGenerator';
import { readSnapshot, checkSnapshotStatus, isSnapshotValid } from './snapshotReader';
import { writeSnapshot, markAsComputing, markAsFailed, markAsReady } from './snapshotWriter';
import { acquireLock, releaseLock, isLocked, waitForLock } from './inFlightGuard';
import { DEFAULT_CACHE_CONFIG } from './types';

/**
 * AI Cache - Convenience Object
 * Tüm cache operasyonlarına tek noktadan erişim
 */
export const AICache = {
  // Hash
  generateHash: generateAnalyticsHash,
  hashesMatch,
  
  // Read
  read: readSnapshot,
  checkStatus: checkSnapshotStatus,
  isValid: isSnapshotValid,
  
  // Write
  write: writeSnapshot,
  markComputing: markAsComputing,
  markFailed: markAsFailed,
  markReady: markAsReady,
  
  // Lock
  acquireLock,
  releaseLock,
  isLocked,
  waitForLock,
  
  // Config
  defaultConfig: DEFAULT_CACHE_CONFIG
};

export default AICache;

