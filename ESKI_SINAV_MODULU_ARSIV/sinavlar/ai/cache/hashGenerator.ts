/**
 * ============================================
 * AkademiHub - AI Cache Hash Generator
 * ============================================
 * 
 * PHASE 5.1.1 - Deterministic Hash Üretimi
 * 
 * Bu dosya:
 * - StudentAnalyticsOutput'u SHA-256 hash'e dönüştürür
 * - Değişiklik tespiti için kullanılır
 * - Deterministic: Aynı girdi = aynı hash
 */

import { createHash } from 'crypto';
import type { StudentAnalyticsOutput } from '../../analytics/orchestrator/types';
import type { HashInput, HashResult } from './types';

// ==================== HASH VERSION ====================

/**
 * Hash input versiyonu
 * Bu değiştiğinde TÜM hash'ler geçersiz olur
 */
const HASH_INPUT_VERSION = 'v1.0.0';

// ==================== ANA FONKSİYON ====================

/**
 * Analytics verisinden deterministic hash üretir
 * 
 * KURALLAR:
 * - Sadece değişiklik tespiti için önemli alanlar hash'lenir
 * - Aynı analytics = aynı hash (deterministic)
 * - Hash version değişirse tüm cache geçersiz olur
 * 
 * @param analytics - StudentAnalyticsOutput
 * @returns HashResult
 */
export function generateAnalyticsHash(analytics: StudentAnalyticsOutput): HashResult {
  // Hash için kullanılacak input'u oluştur
  const hashInput = buildHashInput(analytics);
  
  // JSON string'e çevir (sıralı)
  const jsonString = stableStringify(hashInput);
  
  // SHA-256 hash
  const hash = createHash('sha256')
    .update(jsonString)
    .digest('hex');
  
  return {
    hash,
    algorithm: 'sha256',
    inputVersion: HASH_INPUT_VERSION
  };
}

// ==================== HASH INPUT BUILDER ====================

/**
 * Hash için kullanılacak input'u oluşturur
 * Sadece değişiklik tespiti için kritik alanlar dahil edilir
 */
function buildHashInput(analytics: StudentAnalyticsOutput): HashInput {
  const { student_id, exam_id, summary, trends, risk } = analytics;
  
  return {
    studentId: student_id,
    examId: exam_id,
    summary: {
      total_net: roundToDecimal(summary.total_net, 2),
      total_correct: summary.total_correct,
      total_wrong: summary.total_wrong,
      percentile: summary.percentile
    },
    trends: {
      direction: trends.direction,
      net_trend: trends.net_trend?.map(n => roundToDecimal(n, 2)) ?? null
    },
    risk: {
      level: risk.level,
      score: risk.score !== null ? roundToDecimal(risk.score, 2) : null
    }
  };
}

// ==================== STABLE STRINGIFY ====================

/**
 * Deterministic JSON stringify
 * Object key'leri sıralı olur
 */
function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Object key'lerini sırala
      return Object.keys(value)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = (value as Record<string, unknown>)[key];
          return sorted;
        }, {} as Record<string, unknown>);
    }
    return value;
  });
}

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Sayıyı belirli ondalık basamağa yuvarlar
 */
function roundToDecimal(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * İki hash'in eşit olup olmadığını kontrol eder
 */
export function hashesMatch(hash1: string, hash2: string): boolean {
  return hash1 === hash2;
}

/**
 * Hash'in geçerli formatta olup olmadığını kontrol eder
 */
export function isValidHash(hash: string): boolean {
  // SHA-256 = 64 karakter hex
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Kısa hash döndürür (display için)
 */
export function shortHash(hash: string, length: number = 8): string {
  return hash.substring(0, length);
}

// ==================== EXPORT ====================

export default {
  generateAnalyticsHash,
  hashesMatch,
  isValidHash,
  shortHash,
  HASH_INPUT_VERSION
};

