/**
 * ============================================
 * AkademiHub - AI Coach Engine
 * ============================================
 * 
 * PHASE 5.1.1 - AI Student Coach (Cache-Aware)
 * 
 * Bu modül:
 * - StudentAnalyticsOutput'u yorumlar
 * - HESAPLAMA YAPMAZ
 * - 3 rol destekler: Öğrenci, Veli, Öğretmen
 * - Cache-aware: Tekrar AI çağrısı yapmaz
 * - Race-safe: Aynı key için tek AI çağrısı
 * - Fail-safe: API hatası durumunda fallback
 * 
 * KULLANIM:
 * 
 * @example
 * import { AICoach, generateAICoachResponse } from '@/lib/sinavlar/ai';
 * 
 * // Öğrenci için (cache-aware)
 * const result = await AICoach.student(analytics, examContext);
 * 
 * // Veli için
 * const parentResult = await AICoach.parent(analytics, examContext);
 * 
 * // Öğretmen için
 * const teacherResult = await AICoach.teacher(analytics, examContext);
 * 
 * // Cache bypass ile
 * const freshResult = await AICoach.student(analytics, examContext, { bypassCache: true });
 */

// ==================== ANA FONKSİYONLAR ====================

export {
  generateAICoachResponse,
  generateAICoachResponseStreaming,
  getStudentCoachResponse,
  getParentCoachResponse,
  getTeacherCoachResponse,
  // Cache yönetimi
  invalidateAISnapshot,
  clearExamAISnapshots,
  clearStudentAISnapshots
} from './aiOrchestrator';

// ==================== CACHE ====================

export {
  // Types
  DEFAULT_CACHE_CONFIG,
  
  // Hash
  generateAnalyticsHash,
  hashesMatch,
  isValidHash,
  shortHash,
  
  // Reader
  readSnapshot,
  readSnapshots,
  getSnapshotsForExam,
  getSnapshotsForStudent,
  checkSnapshotStatus,
  cleanupStaleComputingSnapshots,
  isSnapshotValid,
  
  // Writer
  writeSnapshot,
  markAsComputing,
  markAsFailed,
  markAsReady,
  deleteSnapshot,
  deleteSnapshotsForExam,
  deleteSnapshotsForStudent,
  invalidateSnapshot,
  
  // In-Flight Guard
  acquireLock,
  releaseLock,
  isLocked,
  getLockInfo,
  cleanupExpiredLocks,
  clearAllLocks,
  getActiveLockCount,
  waitForLock,
  
  // Convenience
  AICache
} from './cache';

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
} from './cache';

// ==================== CONTEXT BUILDER ====================

export {
  buildLLMContext,
  buildTemplateVariables
} from './contextBuilder';

// ==================== FALLBACK ====================

export {
  generateFallbackResponse
} from './fallbackCoach';

// ==================== PROMPTS ====================

export {
  // System Rules
  getSystemPrompt,
  getPedagogicalRules,
  validateOutput,
  FORBIDDEN_RULES,
  REQUIRED_RULES,
  FORBIDDEN_PHRASES,
  BASE_SYSTEM_RULES,
  
  // Glossary
  findTerm,
  getSubjectInfo,
  buildTermContext,
  getCriticalTermWarnings,
  EXAM_TYPES,
  SUBJECT_CODES,
  ASSESSMENT_TERMS,
  
  // Templates
  getPromptTemplate,
  STUDENT_PROMPT_TEMPLATE,
  PARENT_PROMPT_TEMPLATE,
  TEACHER_PROMPT_TEMPLATE
} from './prompts';

// ==================== TYPES ====================

export type {
  // Main types
  AIRole,
  ExamType,
  AILanguage,
  AICoachInput,
  AICoachOutput,
  AICoachOptions,
  ExamContext,
  
  // Structured output
  StructuredCoachOutput,
  ActionableAdvice,
  AIOutputMetadata,
  
  // Prompt types
  PromptTemplate,
  LLMContext,
  
  // Rule types
  PedagogicalRules,
  ForbiddenRule,
  RequiredRule,
  ToneSettings,
  
  // Glossary types
  GlossaryEntry,
  GlossaryCategory,
  
  // Streaming types
  StreamChunk,
  StreamCallback,
  
  // Error types
  AIError,
  AIErrorType,
  
  // Focus areas
  FocusArea
} from './types';

export {
  DEFAULT_AI_OPTIONS,
  ROLE_TONE_SETTINGS
} from './types';

// ==================== QUICK ACCESS ====================

import {
  generateAICoachResponse,
  getStudentCoachResponse,
  getParentCoachResponse,
  getTeacherCoachResponse,
  invalidateAISnapshot,
  clearExamAISnapshots,
  clearStudentAISnapshots
} from './aiOrchestrator';
import { AICache } from './cache';
import type { ExamContext } from './types';
import type { StudentAnalyticsOutput } from '../analytics/orchestrator/types';

/**
 * Cache options for AI Coach
 */
interface CacheOptions {
  /** Cache'i atla, her zaman AI çağır */
  bypassCache?: boolean;
  /** Stale snapshot kabul et */
  acceptStale?: boolean;
  /** Computing bekle (ms) */
  waitForComputing?: number;
}

/**
 * AI Coach - Quick Access (Cache-Aware)
 * 
 * @example
 * import { AICoach } from '@/lib/sinavlar/ai';
 * 
 * // Öğrenci için (cache'den gelir varsa)
 * const result = await AICoach.student(analytics, { examType: 'LGS', gradeLevel: 8 });
 * 
 * // Cache bypass ile yeni üret
 * const fresh = await AICoach.student(analytics, ctx, { bypassCache: true });
 * 
 * // Snapshot invalidate
 * await AICoach.invalidate(examId, studentId, 'student');
 */
export const AICoach = {
  /**
   * Öğrenci için AI Coach yanıtı (cache-aware)
   */
  student: (
    analytics: StudentAnalyticsOutput,
    examContext: ExamContext,
    cacheOptions?: CacheOptions
  ) => getStudentCoachResponse(analytics, examContext, cacheOptions),
  
  /**
   * Veli için AI Coach yanıtı (cache-aware)
   */
  parent: (
    analytics: StudentAnalyticsOutput,
    examContext: ExamContext,
    cacheOptions?: CacheOptions
  ) => getParentCoachResponse(analytics, examContext, cacheOptions),
  
  /**
   * Öğretmen için AI Coach yanıtı (cache-aware)
   */
  teacher: (
    analytics: StudentAnalyticsOutput,
    examContext: ExamContext,
    cacheOptions?: CacheOptions
  ) => getTeacherCoachResponse(analytics, examContext, cacheOptions),
  
  /**
   * Özel ayarlarla AI Coach yanıtı
   */
  custom: generateAICoachResponse,
  
  /**
   * Snapshot invalidate
   */
  invalidate: invalidateAISnapshot,
  
  /**
   * Sınav için tüm snapshot'ları sil
   */
  clearExam: clearExamAISnapshots,
  
  /**
   * Öğrenci için tüm snapshot'ları sil
   */
  clearStudent: clearStudentAISnapshots,
  
  /**
   * Cache helper
   */
  cache: AICache,
  
  /**
   * Desteklenen roller
   */
  roles: ['student', 'parent', 'teacher'] as const,
  
  /**
   * Desteklenen sınav türleri
   */
  examTypes: ['LGS', 'TYT', 'AYT', 'DENEME', 'OKUL'] as const
};

// ==================== DEFAULT EXPORT ====================

export default AICoach;
