/**
 * ============================================
 * AkademiHub - Analytics Orchestrator Index
 * ============================================
 * 
 * PHASE 3.3 - Analytics Orchestrator
 * 
 * Bu modül Analytics için TEK YETKİLİDİR.
 * 
 * KULLANIM:
 * 
 * @example
 * import { getStudentAnalytics } from '@/lib/sinavlar/analytics/orchestrator';
 * 
 * const result = await getStudentAnalytics('exam-123', 'student-456');
 * if (result.success) {
 *   // UI render
 *   console.log(result.data.summary);
 *   console.log(result.data.analytics);
 *   console.log(result.data.risk);
 * }
 * 
 * MİMARİ KURALLAR:
 * - UI sadece bu modülü çağırır
 * - UI hesaplama YAPMAZ
 * - UI aggregasyon YAPMAZ
 * - Orchestrator = Single Source of Truth
 */

// ==================== ANA FONKSİYONLAR ====================

export {
  getStudentAnalytics,
  getExamAnalytics,
  recomputeStaleSnapshots
} from './analyticsOrchestrator';

// ==================== TİPLER ====================

export type {
  StudentAnalyticsOutput,
  AnalyticsSummary,
  AnalyticsDetails,
  SubjectPerformance,
  TopicPerformance,
  DifficultyPerformance,
  TrendData,
  RiskData,
  StrengthData,
  WeaknessData,
  ImprovementData,
  CalculationMeta,
  CacheInfo,
  AnalyticsSnapshot,
  OrchestratorConfig,
  OrchestratorResult,
  OrchestratorError,
  AssembledInput,
  AnalyticsQueueJob
} from './types';

export { DEFAULT_ORCHESTRATOR_CONFIG } from './types';

// ==================== CACHE POLİCY ====================

export {
  isSnapshotValid,
  shouldRecompute,
  markStale,
  markExamStale,
  enqueueRecompute,
  enqueueBulkRecompute,
  getPendingJobs,
  markJobCompleted,
  markJobFailed
} from './cachePolicy';

// ==================== SNAPSHOT READER ====================

export {
  readSnapshot,
  snapshotToOutput,
  readExamSnapshots,
  readClassSnapshots,
  readStaleSnapshots
} from './snapshotReader';

// ==================== SNAPSHOT WRITER ====================

export {
  writeSnapshot,
  writeSnapshotsBulk,
  markSnapshotStale,
  markExamSnapshotsStale,
  deleteSnapshot
} from './snapshotWriter';

export type { WriteSnapshotInput, WriteResult } from './snapshotWriter';

// ==================== INPUT ASSEMBLER ====================

export {
  assembleInput,
  toEngineInput
} from './inputAssembler';

// ==================== DEFAULT EXPORT ====================

import { 
  getStudentAnalytics, 
  getExamAnalytics, 
  recomputeStaleSnapshots 
} from './analyticsOrchestrator';
import { isSnapshotValid, shouldRecompute, markStale } from './cachePolicy';

/**
 * Analytics Orchestrator
 * 
 * Ana giriş noktası. Tüm analytics işlemleri buradan yapılır.
 * 
 * @example
 * import Orchestrator from '@/lib/sinavlar/analytics/orchestrator';
 * 
 * const result = await Orchestrator.getStudentAnalytics(examId, studentId);
 */
export default {
  // Ana fonksiyonlar
  getStudentAnalytics,
  getExamAnalytics,
  recomputeStaleSnapshots,
  
  // Cache policy
  isSnapshotValid,
  shouldRecompute,
  markStale
};
