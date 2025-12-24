/**
 * ============================================
 * AkademiHub - Data Sanitizer
 * ============================================
 * 
 * PHASE 8.2 - UX Refinement
 * 
 * BU DOSYA:
 * - Kirli Excel verisi temizleme
 * - Türkçe karakter düzeltme
 * - Boşluk/format temizleme
 * - Akıllı hata düzeltme
 * 
 * AMAÇ:
 * Öğretmen Excel'de "  AHMET  " yazsa,
 * sistem "Ahmet" olarak algılamalı.
 */

// ==================== TYPES ====================

export interface SanitizeResult<T> {
  /** Temizlenmiş değer */
  value: T;
  
  /** Orijinal değer */
  original: unknown;
  
  /** Değişiklik yapıldı mı? */
  wasModified: boolean;
  
  /** Yapılan düzeltmeler */
  corrections: SanitizeCorrection[];
}

export interface SanitizeCorrection {
  type: CorrectionType;
  description: string;
  before: string;
  after: string;
}

export type CorrectionType = 
  | 'whitespace'      // Fazla boşluk temizleme
  | 'turkish_char'    // Türkçe karakter düzeltme
  | 'case'            // Büyük/küçük harf
  | 'encoding'        // Encoding düzeltme
  | 'special_char'    // Özel karakter temizleme
  | 'format'          // Format düzeltme
  | 'empty_to_null';  // Boş → null

export interface SanitizeOptions {
  /** Boşlukları temizle */
  trimWhitespace?: boolean;
  
  /** Fazla boşlukları tek boşluğa indir */
  normalizeSpaces?: boolean;
  
  /** Büyük/küçük harf düzelt (names için title case) */
  normalizeCase?: boolean;
  
  /** Türkçe karakterleri düzelt */
  fixTurkishChars?: boolean;
  
  /** Encoding sorunlarını düzelt */
  fixEncoding?: boolean;
  
  /** Boş değerleri null yap */
  emptyToNull?: boolean;
  
  /** Özel karakterleri temizle */
  removeSpecialChars?: boolean;
}

// ==================== CONSTANTS ====================

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  trimWhitespace: true,
  normalizeSpaces: true,
  normalizeCase: false,
  fixTurkishChars: true,
  fixEncoding: true,
  emptyToNull: true,
  removeSpecialChars: false
};

/** Encoding hataları düzeltme tablosu */
const ENCODING_FIXES: Record<string, string> = {
  'Ä±': 'ı',
  'Ä°': 'İ',
  'Ã¼': 'ü',
  'Ãœ': 'Ü',
  'ÅŸ': 'ş',
  'Åž': 'Ş',
  'Ã¶': 'ö',
  'Ã–': 'Ö',
  'Ã§': 'ç',
  'Ã‡': 'Ç',
  'ÄŸ': 'ğ',
  'Äž': 'Ğ',
  'Ä': 'ı',
  'i̇': 'i',
  'İ': 'İ'
};

/** Yanlış kodlanmış Türkçe karakterler */
const TURKISH_CHAR_FIXES: Record<string, string> = {
  'i̇': 'i',   // Birleşik i
  'I': 'İ',   // Noktasız I → İ (bazı durumlarda)
  'ı': 'ı',   // Olduğu gibi
  'ġ': 'ğ',
  'ü': 'ü',
  'š': 'ş',
  'ö': 'ö',
  'ç': 'ç'
};

/** Boş değer olarak kabul edilen değerler */
const EMPTY_VALUES = ['', '-', '.', 'N/A', 'n/a', 'NA', 'na', 'null', 'NULL', 'undefined', 'UNDEFINED', 'BOŞ', 'BOS', 'YOK'];

// ==================== MAIN SANITIZERS ====================

/**
 * Genel string temizleme
 */
export function sanitizeString(
  value: unknown,
  options: SanitizeOptions = {}
): SanitizeResult<string | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const corrections: SanitizeCorrection[] = [];
  
  // Değer yoksa
  if (value === null || value === undefined) {
    return {
      value: null,
      original: value,
      wasModified: false,
      corrections: []
    };
  }
  
  let result = String(value);
  const original = result;
  
  // Encoding düzeltme
  if (opts.fixEncoding) {
    const fixed = fixEncoding(result);
    if (fixed !== result) {
      corrections.push({
        type: 'encoding',
        description: 'Karakter kodlaması düzeltildi',
        before: result,
        after: fixed
      });
      result = fixed;
    }
  }
  
  // Türkçe karakter düzeltme
  if (opts.fixTurkishChars) {
    const fixed = fixTurkishChars(result);
    if (fixed !== result) {
      corrections.push({
        type: 'turkish_char',
        description: 'Türkçe karakterler düzeltildi',
        before: result,
        after: fixed
      });
      result = fixed;
    }
  }
  
  // Boşluk temizleme
  if (opts.trimWhitespace) {
    const trimmed = result.trim();
    if (trimmed !== result) {
      corrections.push({
        type: 'whitespace',
        description: 'Baştaki/sondaki boşluklar temizlendi',
        before: result,
        after: trimmed
      });
      result = trimmed;
    }
  }
  
  // Fazla boşlukları normalleştir
  if (opts.normalizeSpaces) {
    const normalized = result.replace(/\s+/g, ' ');
    if (normalized !== result) {
      corrections.push({
        type: 'whitespace',
        description: 'Fazla boşluklar temizlendi',
        before: result,
        after: normalized
      });
      result = normalized;
    }
  }
  
  // Özel karakter temizleme
  if (opts.removeSpecialChars) {
    const cleaned = result.replace(/[^\w\sğüşıöçĞÜŞİÖÇ.-]/g, '');
    if (cleaned !== result) {
      corrections.push({
        type: 'special_char',
        description: 'Özel karakterler temizlendi',
        before: result,
        after: cleaned
      });
      result = cleaned;
    }
  }
  
  // Boş → null
  if (opts.emptyToNull && EMPTY_VALUES.includes(result)) {
    corrections.push({
      type: 'empty_to_null',
      description: 'Boş değer null olarak işaretlendi',
      before: result,
      after: 'null'
    });
    
    return {
      value: null,
      original,
      wasModified: true,
      corrections
    };
  }
  
  return {
    value: result,
    original,
    wasModified: corrections.length > 0,
    corrections
  };
}

/**
 * İsim temizleme (Ad Soyad)
 */
export function sanitizeName(value: unknown): SanitizeResult<string | null> {
  // Önce genel temizlik
  const baseResult = sanitizeString(value, {
    trimWhitespace: true,
    normalizeSpaces: true,
    fixTurkishChars: true,
    fixEncoding: true,
    emptyToNull: true,
    removeSpecialChars: false
  });
  
  if (baseResult.value === null) return baseResult;
  
  // Title Case uygula
  const titleCased = toTitleCase(baseResult.value);
  
  if (titleCased !== baseResult.value) {
    baseResult.corrections.push({
      type: 'case',
      description: 'İsim formatı düzeltildi',
      before: baseResult.value,
      after: titleCased
    });
    baseResult.value = titleCased;
    baseResult.wasModified = true;
  }
  
  return baseResult;
}

/**
 * Öğrenci numarası temizleme
 */
export function sanitizeStudentNo(value: unknown): SanitizeResult<string | null> {
  const baseResult = sanitizeString(value, {
    trimWhitespace: true,
    normalizeSpaces: false,
    emptyToNull: true
  });
  
  if (baseResult.value === null) return baseResult;
  
  // Sadece alfanumerik karakterler
  const cleaned = baseResult.value.replace(/[^\w-]/g, '');
  
  if (cleaned !== baseResult.value) {
    baseResult.corrections.push({
      type: 'special_char',
      description: 'Geçersiz karakterler temizlendi',
      before: baseResult.value,
      after: cleaned
    });
    baseResult.value = cleaned;
    baseResult.wasModified = true;
  }
  
  return baseResult;
}

/**
 * TC Kimlik numarası temizleme ve doğrulama
 */
export function sanitizeTcNo(value: unknown): SanitizeResult<string | null> {
  const baseResult = sanitizeString(value, {
    trimWhitespace: true,
    emptyToNull: true
  });
  
  if (baseResult.value === null) return baseResult;
  
  // Sadece rakamlar
  const digits = baseResult.value.replace(/\D/g, '');
  
  if (digits !== baseResult.value) {
    baseResult.corrections.push({
      type: 'format',
      description: 'Sadece rakamlar alındı',
      before: baseResult.value,
      after: digits
    });
    baseResult.value = digits;
    baseResult.wasModified = true;
  }
  
  // 11 hane kontrolü
  if (digits.length !== 11) {
    // Hatalı ama yine de döndür
    return baseResult;
  }
  
  return baseResult;
}

/**
 * Sınıf bilgisi temizleme
 */
export function sanitizeClassName(value: unknown): SanitizeResult<string | null> {
  const baseResult = sanitizeString(value, {
    trimWhitespace: true,
    normalizeSpaces: false,
    emptyToNull: true
  });
  
  if (baseResult.value === null) return baseResult;
  
  // Yaygın formatları normalize et: "5-A", "5/A", "5A" → "5-A"
  const normalized = normalizeClassName(baseResult.value);
  
  if (normalized !== baseResult.value) {
    baseResult.corrections.push({
      type: 'format',
      description: 'Sınıf formatı düzeltildi',
      before: baseResult.value,
      after: normalized
    });
    baseResult.value = normalized;
    baseResult.wasModified = true;
  }
  
  return baseResult;
}

/**
 * Cevap değeri temizleme
 */
export function sanitizeAnswer(value: unknown): SanitizeResult<string | null> {
  const baseResult = sanitizeString(value, {
    trimWhitespace: true,
    emptyToNull: true
  });
  
  if (baseResult.value === null) return baseResult;
  
  // Büyük harfe çevir ve tek karakter al
  const upper = baseResult.value.toUpperCase();
  
  // Geçerli cevap kontrolü (A, B, C, D, E)
  if (/^[ABCDE]$/.test(upper)) {
    if (upper !== baseResult.value) {
      baseResult.corrections.push({
        type: 'case',
        description: 'Büyük harfe çevrildi',
        before: baseResult.value,
        after: upper
      });
      baseResult.value = upper;
      baseResult.wasModified = true;
    }
    return baseResult;
  }
  
  // Boş değer alternatifleri
  if (['-', '.', 'X', 'x', '*', 'BOŞ', 'BOS', 'EMPTY'].includes(upper) || upper === '') {
    baseResult.value = null;
    baseResult.corrections.push({
      type: 'empty_to_null',
      description: 'Boş cevap olarak işaretlendi',
      before: String(value),
      after: 'null'
    });
    baseResult.wasModified = true;
    return baseResult;
  }
  
  // Birden fazla işaretleme (örn: "AB")
  if (upper.length > 1) {
    const validChars = upper.split('').filter(c => /[ABCDE]/.test(c));
    if (validChars.length > 1) {
      // Birden fazla işaretleme - geçersiz
      baseResult.value = null;
      baseResult.corrections.push({
        type: 'format',
        description: 'Birden fazla işaretleme - geçersiz',
        before: String(value),
        after: 'null'
      });
      baseResult.wasModified = true;
    } else if (validChars.length === 1) {
      baseResult.value = validChars[0];
      baseResult.corrections.push({
        type: 'format',
        description: 'Tek cevap çıkarıldı',
        before: String(value),
        after: validChars[0]
      });
      baseResult.wasModified = true;
    }
  }
  
  return baseResult;
}

// ==================== BATCH SANITIZATION ====================

/**
 * Satır verisini toplu temizler
 */
export function sanitizeRow(row: Record<string, unknown>): {
  sanitized: Record<string, unknown>;
  corrections: Array<{ column: string; corrections: SanitizeCorrection[] }>;
} {
  const sanitized: Record<string, unknown> = {};
  const allCorrections: Array<{ column: string; corrections: SanitizeCorrection[] }> = [];
  
  for (const [key, value] of Object.entries(row)) {
    const result = sanitizeString(value);
    sanitized[key] = result.value;
    
    if (result.corrections.length > 0) {
      allCorrections.push({
        column: key,
        corrections: result.corrections
      });
    }
  }
  
  return { sanitized, corrections: allCorrections };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Encoding düzeltme
 */
function fixEncoding(text: string): string {
  let result = text;
  
  for (const [broken, fixed] of Object.entries(ENCODING_FIXES)) {
    result = result.replace(new RegExp(broken, 'g'), fixed);
  }
  
  return result;
}

/**
 * Türkçe karakter düzeltme
 */
function fixTurkishChars(text: string): string {
  let result = text;
  
  for (const [broken, fixed] of Object.entries(TURKISH_CHAR_FIXES)) {
    result = result.replace(new RegExp(broken, 'g'), fixed);
  }
  
  return result;
}

/**
 * Title Case (Her Kelimenin İlk Harfi Büyük)
 * Türkçe uyumlu
 */
function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (match) => {
      // Türkçe karakterler için özel işlem
      if (match === ' i' || match === 'i') {
        return match.replace('i', 'İ');
      }
      return match.toUpperCase();
    });
}

/**
 * Sınıf formatı normalize
 */
function normalizeClassName(cls: string): string {
  // "5A" → "5-A"
  const match = cls.match(/^(\d+)\s*[-\/]?\s*([A-Za-z]+)$/);
  if (match) {
    return `${match[1]}-${match[2].toUpperCase()}`;
  }
  return cls.toUpperCase();
}

// ==================== VALIDATION ====================

/**
 * TC Kimlik numarası doğrulama
 */
export function validateTcNo(tcNo: string): boolean {
  if (!/^\d{11}$/.test(tcNo)) return false;
  if (tcNo[0] === '0') return false;
  
  const digits = tcNo.split('').map(Number);
  
  // 10. hane kontrolü
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  if ((sum1 - sum2) % 10 !== digits[9]) return false;
  
  // 11. hane kontrolü
  const total = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (total % 10 !== digits[10]) return false;
  
  return true;
}

// ==================== EXPORT ====================

export default {
  // Main sanitizers
  sanitizeString,
  sanitizeName,
  sanitizeStudentNo,
  sanitizeTcNo,
  sanitizeClassName,
  sanitizeAnswer,
  sanitizeRow,
  
  // Validation
  validateTcNo
};

