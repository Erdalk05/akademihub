/**
 * AkademiHub Core Engine
 * Motor Dairesi - Ana Export Noktası
 * 
 * Bu modül tüm core işlevselliği dışa aktarır.
 * 
 * Kullanım:
 * import { parseOpticalTxt, evaluateExam, validateParsedData } from '@/lib/sinavlar/core';
 */

// ============================================
// 📋 TİPLER
// ============================================
export * from './types';

// ============================================
// 🔧 YARDIMCILAR
// ============================================
export {
  normalizeText,
  normalizeName,
  validateTC,
  maskTC,
  extractFixedWidth,
  parseAnswers,
  parseBooklet,
  calculateNet,
  calculatePercentile,
  calculateStandardDeviation,
  generateId,
  formatDate,
  formatNumber,
  levenshteinDistance,
  nameSimilarity,
} from './helpers';

// ============================================
// 📝 AUDIT LOG
// ============================================
export {
  logAction,
  logParseStart,
  logParseComplete,
  logParseError,
  logEvaluateStart,
  logEvaluateComplete,
  logConflict,
  logConflictResolved,
  logBatchSave,
  logAnswerKeyUpload,
  logManualCorrection,
  getAuditLogs,
  getExamAuditTrail,
  getRecentLogs,
} from './audit';

// ============================================
// 📥 PARSER (Legacy)
// ============================================
export {
  parseOpticalTxt,
  detectTemplate,
  getParseStats,
  parseMultipleFiles,
  splitAnswersBySubject,
  DEFAULT_TEMPLATES,
} from './parser';

// ============================================
// 🚀 PARSE ENGINE (FINAL - Endüstri Standardı)
// ============================================
export {
  // Ana Fonksiyonlar
  parseOpticalFile,
  
  // Geriye Uyumluluk
  toOptikSatir,
  toBatchOptikSatir,
  
  // Sınav Yapıları
  LGS_EXAM_STRUCTURE,
  
  // Tipler
  type LessonBlock,
  type ExamStructure,
  type ParseTemplate,
  type LessonBlockResult,
  type ParsedStudentResult,
  type BatchParseResult,
} from './parseEngine';

// ============================================
// 📈 EVALUATOR
// ============================================
export {
  evaluateExam,
  quickNetCalculation,
  batchQuickNet,
  compareClasses,
  findHardestQuestions,
} from './evaluator';

// ============================================
// 🔍 VALIDATORS
// ============================================
export {
  validateParsedData,
  checkAgainstDatabase,
  autoResolveConflicts,
  getConflictSummary,
  validateAnswerKey,
} from './validators';

// ============================================
// 💾 DATABASE
// ============================================
export {
  saveExamResultsBatch,
  getExamResults,
  getStudentResults,
  getExistingStudents,
  matchStudentsToDatabase,
  createExamRecord,
  updateExamStatus,
  deleteExamResults,
} from './database';

