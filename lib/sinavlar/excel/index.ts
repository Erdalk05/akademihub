/**
 * 📊 Smart Excel Import System
 * Tüm Excel import modüllerinin export'u
 */

// Types
export type {
  ExcelRow,
  ColumnMapping,
  DetectionResult,
  ValidationWarning,
  ImportResult,
  FuzzyMatchConfig,
  ParsedQuestion
} from './types';

// Levenshtein
export {
  levenshteinDistance,
  similarity,
  findBestMatch
} from './levenshtein';

// Turkish Utils
export {
  turkishNormalize,
  cleanText,
  hasTurkishChars,
  fixTurkishOCRErrors,
  turkishTitleCase,
  turkishEquals,
  turkishSort
} from './turkish';

// Fuzzy Matcher
export {
  COLUMN_CONFIGS,
  fuzzyMatch,
  matchAllColumns,
  detectSubjectDistribution
} from './fuzzyMatcher';

// Column Detector
export {
  detectColumns,
  createMappingFromDetection
} from './columnDetector';

// Validator
export {
  validateRow,
  validateData,
  hasErrors,
  countBySeverity,
  getValidationSummary
} from './validator';

// Parser
export {
  readExcelFile,
  parseTextData,
  convertToQuestions,
  parseExcelWithDetection,
  parseTextWithDetection
} from './parser';

