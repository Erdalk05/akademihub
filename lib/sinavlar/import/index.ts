/**
 * ============================================
 * AkademiHub - Import Engine
 * ============================================
 * 
 * PHASE 7 - Universal Optical Reading & Exam Import
 * 
 * Bu modül:
 * - Excel/CSV dosya okuma
 * - Otomatik kolon tespiti
 * - Multi-layer öğrenci eşleştirme
 * - Hata yönetimi
 * - Post-processing (Analytics, AI, PDF)
 * 
 * ÖZELLİKLER:
 * - Sınırsız öğrenci desteği
 * - Çocuk kadar kolay UX
 * - Zero data loss
 * - Human-in-the-loop
 */

// ==================== TYPES ====================

export type {
  // File types
  SupportedFileType,
  ImportSource,
  
  // Parsed data
  ParsedRow,
  ParsedAnswer,
  StudentIdentifier,
  ParseError,
  ParseWarning,
  ParsedRowStatus,
  ParseErrorCode,
  ParseWarningCode,
  
  // Column mapping
  ColumnType,
  ColumnMapping,
  ColumnMappingResult,
  ColumnMappingPreset,
  MappingSuggestion,
  
  // Student matching
  MatchStrategy,
  MatchResult,
  MatchedStudentInfo,
  AlternativeMatch,
  MatchStatus,
  
  // Validation
  PreflightResult,
  PreflightError,
  PreflightWarning,
  FileInfo,
  RowSummary,
  ColumnAnalysis,
  
  // Import result
  ImportResult,
  ImportSummary,
  ProcessedStudent,
  ImportError,
  PostProcessingStatus,
  
  // UI State
  ImportWizardStep,
  ImportWizardState,
  ImportEvent,
  ImportEventType
} from './types';

export {
  VALID_ANSWERS,
  EMPTY_ANSWER_VALUES,
  BOOKLET_TYPES,
  REQUIRED_COLUMN_TYPES,
  COLUMN_NAME_ALIASES
} from './types';

// ==================== PARSERS ====================

export {
  parseSpreadsheet
} from './parsers/spreadsheetParser';

// ==================== MAPPING ====================

export {
  autoDetectColumns,
  applyManualMapping,
  setAnswerRange,
  savePreset,
  loadPresets,
  deletePreset,
  findMatchingPreset,
  applyPreset
} from './mapping/columnMapper';

export {
  matchStudent,
  matchStudentsBatch,
  createManualMatch,
  getStudentList
} from './mapping/studentMatcher';

// ==================== VALIDATION ====================

export {
  runPreflightChecks,
  quickFileCheck
} from './validation/preflightValidator';

export {
  getUserFriendlyMessage,
  getSuggestion,
  isRecoverable,
  getSeverity,
  toImportError,
  groupErrors,
  summarizeErrors,
  hasCriticalErrors,
  getRecoverableErrors,
  getNonRecoverableErrors,
  getErrorEmoji,
  getErrorColorClass,
  getErrorDetails,
  ERROR_DEFINITIONS
} from './validation/errorClassifier';

// ==================== ORCHESTRATOR ====================

export {
  executeImport,
  createInitialWizardState,
  getNextStep,
  getPreviousStep,
  isStepComplete
} from './orchestrator';

export type { ImportOptions, ImportProgress } from './orchestrator';

// ==================== UI COMPONENTS ====================

export { ImportWizard } from './ui/ImportWizard';
export type { ImportWizardProps } from './ui/ImportWizard';

// ==================== CONVENIENCE EXPORTS ====================

import { parseSpreadsheet } from './parsers/spreadsheetParser';
import { autoDetectColumns, applyManualMapping } from './mapping/columnMapper';
import { matchStudent, matchStudentsBatch } from './mapping/studentMatcher';
import { runPreflightChecks } from './validation/preflightValidator';
import { executeImport } from './orchestrator';

/**
 * Import Engine - Quick Access
 * 
 * @example
 * import { ImportEngine } from '@/lib/sinavlar/import';
 * 
 * // Dosya parse
 * const result = await ImportEngine.parse(file);
 * 
 * // Kolon tespit
 * const mapping = ImportEngine.detectColumns(headers, samples);
 * 
 * // Öğrenci eşleştir
 * const match = await ImportEngine.matchStudent(identifier);
 * 
 * // Tam import
 * const importResult = await ImportEngine.import(file, { examId, organizationId });
 */
export const ImportEngine = {
  // Parse
  parse: parseSpreadsheet,
  
  // Column mapping
  detectColumns: autoDetectColumns,
  applyMapping: applyManualMapping,
  
  // Student matching
  matchStudent,
  matchStudentsBatch,
  
  // Validation
  preflight: runPreflightChecks,
  
  // Full import
  import: executeImport
};

export default ImportEngine;

