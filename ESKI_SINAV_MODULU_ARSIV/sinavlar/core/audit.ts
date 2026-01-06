/**
 * AkademiHub Audit Logger
 * Motor Dairesi - Denetim Kayıt Sistemi
 * 
 * Tüm kritik işlemleri loglar ve izlenebilirlik sağlar.
 */

import { AuditAction, AuditLog } from './types';
import { generateId } from './helpers';

// ============================================
// 📋 LOG DEPOSU (In-Memory + Console)
// ============================================

// Not: Production'da bu Supabase'e yazılacak
const auditLogs: AuditLog[] = [];

// ============================================
// 📝 ANA LOG FONKSİYONLARI
// ============================================

/**
 * Audit log kaydı oluşturur
 */
export function logAction(
  action: AuditAction,
  details: Record<string, unknown>,
  options?: {
    userId?: string;
    organizationId?: string;
    examId?: string;
    ipAddress?: string;
  }
): AuditLog {
  const log: AuditLog = {
    id: generateId(),
    action,
    userId: options?.userId || 'system',
    organizationId: options?.organizationId || 'default',
    examId: options?.examId,
    details,
    timestamp: new Date(),
    ipAddress: options?.ipAddress,
  };

  // In-memory depolama (son 1000 kayıt)
  auditLogs.push(log);
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }

  // Console log (development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${action}:`, JSON.stringify(details, null, 2));
  }

  return log;
}

/**
 * Parse işlemi başlatıldığında log
 */
export function logParseStart(
  fileName: string,
  totalLines: number,
  options?: { userId?: string; organizationId?: string }
): void {
  logAction('PARSE_START', {
    fileName,
    totalLines,
    startedAt: new Date().toISOString(),
  }, options);
}

/**
 * Parse işlemi tamamlandığında log
 */
export function logParseComplete(
  fileName: string,
  stats: {
    totalLines: number;
    successCount: number;
    conflictCount: number;
    failedCount: number;
    duration: number;
  },
  options?: { userId?: string; organizationId?: string }
): void {
  logAction('PARSE_COMPLETE', {
    fileName,
    ...stats,
    completedAt: new Date().toISOString(),
  }, options);
}

/**
 * Parse hatası logla
 */
export function logParseError(
  fileName: string,
  error: string,
  lineNumber?: number,
  options?: { userId?: string; organizationId?: string }
): void {
  logAction('PARSE_ERROR', {
    fileName,
    error,
    lineNumber,
    errorAt: new Date().toISOString(),
  }, options);
}

/**
 * Değerlendirme başlatıldığında log
 */
export function logEvaluateStart(
  examId: string,
  studentCount: number,
  options?: { userId?: string; organizationId?: string }
): void {
  logAction('EVALUATE_START', {
    examId,
    studentCount,
    startedAt: new Date().toISOString(),
  }, { ...options, examId });
}

/**
 * Değerlendirme tamamlandığında log
 */
export function logEvaluateComplete(
  examId: string,
  stats: {
    studentCount: number;
    averageScore: number;
    duration: number;
  },
  options?: { userId?: string; organizationId?: string }
): void {
  logAction('EVALUATE_COMPLETE', {
    examId,
    ...stats,
    completedAt: new Date().toISOString(),
  }, { ...options, examId });
}

/**
 * Çakışma tespit edildiğinde log
 */
export function logConflict(
  conflictType: string,
  studentNo: string,
  details: Record<string, unknown>,
  options?: { userId?: string; organizationId?: string; examId?: string }
): void {
  logAction('CONFLICT_DETECTED', {
    conflictType,
    studentNo,
    ...details,
    detectedAt: new Date().toISOString(),
  }, options);
}

/**
 * Çakışma çözüldüğünde log
 */
export function logConflictResolved(
  conflictType: string,
  studentNo: string,
  resolution: string,
  options?: { userId?: string; organizationId?: string; examId?: string }
): void {
  logAction('CONFLICT_RESOLVED', {
    conflictType,
    studentNo,
    resolution,
    resolvedAt: new Date().toISOString(),
  }, options);
}

/**
 * Batch kaydetme logu
 */
export function logBatchSave(
  examId: string,
  stats: {
    insertedCount: number;
    updatedCount: number;
    failedCount: number;
    duration: number;
  },
  options?: { userId?: string; organizationId?: string }
): void {
  logAction('BATCH_SAVE', {
    examId,
    ...stats,
    savedAt: new Date().toISOString(),
  }, { ...options, examId });
}

/**
 * Cevap anahtarı yüklemesi logu
 */
export function logAnswerKeyUpload(
  examId: string,
  questionCount: number,
  booklet: string,
  options?: { userId?: string; organizationId?: string }
): void {
  logAction('ANSWER_KEY_UPLOAD', {
    examId,
    questionCount,
    booklet,
    uploadedAt: new Date().toISOString(),
  }, { ...options, examId });
}

/**
 * Manuel düzeltme logu
 */
export function logManualCorrection(
  studentNo: string,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  options?: { userId?: string; organizationId?: string; examId?: string }
): void {
  logAction('MANUAL_CORRECTION', {
    studentNo,
    field,
    oldValue,
    newValue,
    correctedAt: new Date().toISOString(),
  }, options);
}

// ============================================
// 📊 LOG SORGULAMA
// ============================================

/**
 * Logları filtrele ve getir
 */
export function getAuditLogs(filters?: {
  action?: AuditAction;
  userId?: string;
  examId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): AuditLog[] {
  let result = [...auditLogs];

  if (filters?.action) {
    result = result.filter(log => log.action === filters.action);
  }

  if (filters?.userId) {
    result = result.filter(log => log.userId === filters.userId);
  }

  if (filters?.examId) {
    result = result.filter(log => log.examId === filters.examId);
  }

  if (filters?.startDate) {
    result = result.filter(log => log.timestamp >= filters.startDate!);
  }

  if (filters?.endDate) {
    result = result.filter(log => log.timestamp <= filters.endDate!);
  }

  // En yeniden en eskiye sırala
  result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (filters?.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

/**
 * Belirli bir sınav için tüm logları getir
 */
export function getExamAuditTrail(examId: string): AuditLog[] {
  return getAuditLogs({ examId });
}

/**
 * Son N logu getir
 */
export function getRecentLogs(count: number = 50): AuditLog[] {
  return getAuditLogs({ limit: count });
}

/**
 * Logları temizle (sadece development için)
 */
export function clearLogs(): void {
  if (process.env.NODE_ENV === 'development') {
    auditLogs.length = 0;
  }
}

