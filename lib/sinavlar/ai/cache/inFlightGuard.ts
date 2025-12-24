/**
 * ============================================
 * AkademiHub - In-Flight Guard (Race Protection)
 * ============================================
 * 
 * PHASE 5.1.1 - Race Condition Koruması
 * 
 * Bu dosya:
 * - Aynı (examId, studentId, role) için tek AI çağrısı garantiler
 * - Memory-based lock (serverless uyumlu)
 * - TTL ile otomatik lock temizleme
 * - Deadlock riski YOK
 */

import type { SnapshotKey, LockInfo, LockResult } from './types';

// ==================== LOCK STORE ====================

/**
 * In-memory lock store
 * Serverless ortamda her instance kendi store'una sahip olur
 * Bu yeterlidir çünkü DB'deki status='computing' ek koruma sağlar
 */
const lockStore = new Map<string, LockInfo>();

// ==================== LOCK CONFIG ====================

/**
 * Lock konfigürasyonu
 */
const LOCK_CONFIG = {
  // Lock timeout (ms) - bu süreden sonra lock otomatik serbest kalır
  timeoutMs: 30000, // 30 saniye
  
  // Owner ID prefix
  ownerPrefix: 'akademihub-ai-'
};

// ==================== ANA FONKSİYONLAR ====================

/**
 * Lock almaya çalışır
 * 
 * @param key - Snapshot key
 * @returns Lock sonucu
 */
export function acquireLock(key: SnapshotKey): LockResult {
  const lockKey = buildLockKey(key);
  const now = Date.now();
  
  // Mevcut lock var mı?
  const existingLock = lockStore.get(lockKey);
  
  if (existingLock) {
    // Lock süresi dolmuş mu?
    if (existingLock.expiresAt <= now) {
      // Süresi dolmuş, temizle ve yeni lock al
      lockStore.delete(lockKey);
    } else {
      // Aktif lock var, alamadık
      return {
        acquired: false,
        lockInfo: existingLock,
        reason: `Lock held by ${existingLock.owner}, expires in ${Math.ceil((existingLock.expiresAt - now) / 1000)}s`
      };
    }
  }
  
  // Yeni lock oluştur
  const newLock: LockInfo = {
    key: lockKey,
    acquiredAt: now,
    expiresAt: now + LOCK_CONFIG.timeoutMs,
    owner: generateOwnerId()
  };
  
  lockStore.set(lockKey, newLock);
  
  return {
    acquired: true,
    lockInfo: newLock
  };
}

/**
 * Lock'u serbest bırakır
 * 
 * @param key - Snapshot key
 * @param ownerId - Lock sahibi (opsiyonel, güvenlik için)
 */
export function releaseLock(key: SnapshotKey, ownerId?: string): boolean {
  const lockKey = buildLockKey(key);
  const existingLock = lockStore.get(lockKey);
  
  if (!existingLock) {
    // Lock zaten yok
    return true;
  }
  
  // Owner kontrolü (opsiyonel)
  if (ownerId && existingLock.owner !== ownerId) {
    console.warn(`[InFlightGuard] Release attempt by non-owner: ${ownerId} vs ${existingLock.owner}`);
    return false;
  }
  
  lockStore.delete(lockKey);
  return true;
}

/**
 * Lock durumunu kontrol eder
 */
export function isLocked(key: SnapshotKey): boolean {
  const lockKey = buildLockKey(key);
  const existingLock = lockStore.get(lockKey);
  
  if (!existingLock) {
    return false;
  }
  
  // Süresi dolmuş mu?
  if (existingLock.expiresAt <= Date.now()) {
    lockStore.delete(lockKey);
    return false;
  }
  
  return true;
}

/**
 * Lock bilgisini döndürür
 */
export function getLockInfo(key: SnapshotKey): LockInfo | null {
  const lockKey = buildLockKey(key);
  const existingLock = lockStore.get(lockKey);
  
  if (!existingLock) {
    return null;
  }
  
  // Süresi dolmuş mu?
  if (existingLock.expiresAt <= Date.now()) {
    lockStore.delete(lockKey);
    return null;
  }
  
  return existingLock;
}

// ==================== BATCH OPERATIONS ====================

/**
 * Süresi dolmuş tüm lock'ları temizler
 */
export function cleanupExpiredLocks(): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, lock] of lockStore.entries()) {
    if (lock.expiresAt <= now) {
      lockStore.delete(key);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Tüm lock'ları temizler (dikkatli kullan!)
 */
export function clearAllLocks(): void {
  lockStore.clear();
}

/**
 * Aktif lock sayısını döndürür
 */
export function getActiveLockCount(): number {
  const now = Date.now();
  let count = 0;
  
  for (const lock of lockStore.values()) {
    if (lock.expiresAt > now) {
      count++;
    }
  }
  
  return count;
}

// ==================== WAIT FOR LOCK ====================

/**
 * Lock serbest kalana kadar bekler
 * 
 * @param key - Snapshot key
 * @param maxWaitMs - Maximum bekleme süresi
 * @param checkIntervalMs - Kontrol aralığı
 */
export async function waitForLock(
  key: SnapshotKey,
  maxWaitMs: number = 30000,
  checkIntervalMs: number = 500
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (!isLocked(key)) {
      return true;
    }
    
    await sleep(checkIntervalMs);
  }
  
  return false;
}

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Lock key oluşturur
 */
function buildLockKey(key: SnapshotKey): string {
  return `${key.examId}:${key.studentId}:${key.role}`;
}

/**
 * Unique owner ID oluşturur
 */
function generateOwnerId(): string {
  return `${LOCK_CONFIG.ownerPrefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== EXPORT ====================

export default {
  acquireLock,
  releaseLock,
  isLocked,
  getLockInfo,
  cleanupExpiredLocks,
  clearAllLocks,
  getActiveLockCount,
  waitForLock
};

