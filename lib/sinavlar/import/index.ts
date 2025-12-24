/**
 * ============================================
 * AkademiHub - Import Engine
 * ============================================
 * 
 * PHASE 8.6 - Güncellenmiş
 */

// Types
export * from './types';

// Templates (Sınav türleri ve formları)
export * from './templates';

// Answer Key (Cevap anahtarı ve net hesaplama)
export * from './answerKey';

// Parsers
export { parseSpreadsheet, parseLine } from './parsers/spreadsheetParser';

// Mapping
export { suggestColumnMapping, mapColumns } from './mapping/columnMapper';
export { matchStudents } from './mapping/studentMatcher';

// Validation
export { preflightValidate } from './validation/preflightValidator';
export { classifyImportError } from './validation/errorClassifier';

// Orchestrator
export { importExamData } from './orchestrator';

// UI Components
export { SmartOpticalImport } from './ui/SmartOpticalImport';
export { ImportWizard } from './ui/ImportWizard';
export { ColumnMappingPage } from './ui/ColumnMappingPage';
export { SkipMatchFlow } from './ui/SkipMatchFlow';

// OCR
export { correctOCRErrors } from './txt/ocrCorrection';

// Quick Access
export const ImportEngine = {
  parse: async (file: File) => {
    const { parseSpreadsheet } = await import('./parsers/spreadsheetParser');
    return parseSpreadsheet(file);
  },
  detectColumns: async (headers: string[], samples: string[]) => {
    const { suggestColumnMapping } = await import('./mapping/columnMapper');
    return suggestColumnMapping(headers, samples);
  },
  matchStudent: async (identifier: { studentNo?: string; tcNo?: string; fullName?: string }) => {
    const { matchStudents } = await import('./mapping/studentMatcher');
    return matchStudents([identifier], 'org-id');
  }
};
