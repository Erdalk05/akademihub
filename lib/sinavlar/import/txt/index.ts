/**
 * ============================================
 * AkademiHub - TXT Parser Module
 * ============================================
 * 
 * Optik okuyucu TXT dosyaları için:
 * - OCR hata düzeltme
 * - Türkçe karakter desteği
 * - Fuzzy matching
 */

export {
  correctOCRErrors,
  calculateTurkishSimilarity,
  normalizeTurkish,
  levenshteinDistance,
  correctOCRBatch,
  getOCRCorrectionStats,
  OCR_ERROR_MAP,
  COMMON_NAME_FIXES
} from './ocrCorrection';

export { default as OCRCorrection } from './ocrCorrection';

