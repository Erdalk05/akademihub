/**
 * ============================================
 * AkademiHub - Error Classifier
 * ============================================
 * 
 * PHASE 7 - Universal Import Engine
 * 
 * BU DOSYA:
 * - Hata sınıflandırma
 * - Kullanıcı dostu hata mesajları
 * - Çözüm önerileri
 * - Hata recovery
 */

import type {
  ParseError,
  ParseWarning,
  ImportError,
  ParseErrorCode,
  ParseWarningCode
} from '../types';

// ==================== ERROR DEFINITIONS ====================

interface ErrorDefinition {
  code: string;
  title: string;
  description: string;
  suggestion: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  recoverable: boolean;
  userFriendlyMessage: string;
}

const ERROR_DEFINITIONS: Record<string, ErrorDefinition> = {
  // Dosya hataları
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    title: 'Dosya Çok Büyük',
    description: 'Yüklenen dosya boyutu limiti aşıyor.',
    suggestion: 'Daha küçük bir dosya yükleyin veya dosyayı parçalara bölün.',
    severity: 'critical',
    recoverable: false,
    userFriendlyMessage: '📦 Dosya boyutu çok büyük. Daha küçük bir dosya deneyin.'
  },
  
  INVALID_FILE_TYPE: {
    code: 'INVALID_FILE_TYPE',
    title: 'Geçersiz Dosya Formatı',
    description: 'Bu dosya formatı desteklenmiyor.',
    suggestion: 'Excel (.xlsx, .xls) veya CSV (.csv) formatında dosya yükleyin.',
    severity: 'critical',
    recoverable: false,
    userFriendlyMessage: '📄 Bu dosya türü desteklenmiyor. Excel veya CSV dosyası yükleyin.'
  },
  
  // Satır hataları
  NO_DATA_ROWS: {
    code: 'NO_DATA_ROWS',
    title: 'Veri Satırı Yok',
    description: 'Dosyada işlenebilir veri satırı bulunamadı.',
    suggestion: 'Dosyanın doğru formatta olduğundan emin olun.',
    severity: 'critical',
    recoverable: false,
    userFriendlyMessage: '📋 Dosyada veri bulunamadı. Dosyayı kontrol edin.'
  },
  
  TOO_MANY_ERRORS: {
    code: 'TOO_MANY_ERRORS',
    title: 'Çok Fazla Hata',
    description: 'Dosyadaki hata oranı kabul edilebilir seviyenin üzerinde.',
    suggestion: 'Dosyayı kontrol edin ve hataları düzeltin.',
    severity: 'critical',
    recoverable: false,
    userFriendlyMessage: '❌ Dosyada çok fazla hata var. Lütfen kontrol edin.'
  },
  
  // Kolon hataları
  MISSING_STUDENT_IDENTIFIER: {
    code: 'MISSING_STUDENT_IDENTIFIER',
    title: 'Öğrenci Tanımlayıcı Eksik',
    description: 'Öğrenciyi tanımlayacak sütun bulunamadı.',
    suggestion: 'Öğrenci numarası, TC Kimlik veya Ad Soyad sütunu ekleyin.',
    severity: 'critical',
    recoverable: true,
    userFriendlyMessage: '👤 Öğrenci bilgisi sütunu bulunamadı. Kolon eşleştirmesini kontrol edin.'
  },
  
  NO_ANSWER_COLUMNS: {
    code: 'NO_ANSWER_COLUMNS',
    title: 'Cevap Sütunu Yok',
    description: 'Cevapları içeren sütun bulunamadı.',
    suggestion: 'Cevap sütunlarını manuel olarak işaretleyin.',
    severity: 'critical',
    recoverable: true,
    userFriendlyMessage: '✍️ Cevap sütunları bulunamadı. Kolon eşleştirmesini yapın.'
  },
  
  // Veri hataları
  MISSING_STUDENT_ID: {
    code: 'MISSING_STUDENT_ID',
    title: 'Öğrenci Numarası Eksik',
    description: 'Bu satırda öğrenci numarası bulunamadı.',
    suggestion: 'Satırı kontrol edin veya manuel eşleştirme yapın.',
    severity: 'error',
    recoverable: true,
    userFriendlyMessage: '🔢 Bu satırda öğrenci numarası yok.'
  },
  
  INVALID_STUDENT_ID: {
    code: 'INVALID_STUDENT_ID',
    title: 'Geçersiz Öğrenci Numarası',
    description: 'Öğrenci numarası sistemde bulunamadı.',
    suggestion: 'Öğrenci numarasını kontrol edin veya manuel eşleştirme yapın.',
    severity: 'error',
    recoverable: true,
    userFriendlyMessage: '❓ Bu öğrenci numarası sistemde yok.'
  },
  
  DUPLICATE_STUDENT: {
    code: 'DUPLICATE_STUDENT',
    title: 'Tekrarlayan Öğrenci',
    description: 'Bu öğrenci dosyada birden fazla kez geçiyor.',
    suggestion: 'Tekrar eden satırlardan birini kaldırın.',
    severity: 'warning',
    recoverable: true,
    userFriendlyMessage: '👥 Bu öğrenci birden fazla kez var.'
  },
  
  // Cevap hataları
  INVALID_ANSWER_FORMAT: {
    code: 'INVALID_ANSWER_FORMAT',
    title: 'Geçersiz Cevap Formatı',
    description: 'Cevap değeri tanınan bir formatta değil.',
    suggestion: 'Cevaplar A, B, C, D veya E olmalıdır.',
    severity: 'warning',
    recoverable: true,
    userFriendlyMessage: '❌ Bazı cevaplar geçersiz formatta.'
  },
  
  MULTIPLE_MARKS: {
    code: 'MULTIPLE_MARKS',
    title: 'Birden Fazla İşaretleme',
    description: 'Bir soruda birden fazla seçenek işaretlenmiş.',
    suggestion: 'Bu soru boş olarak kabul edilecek.',
    severity: 'warning',
    recoverable: true,
    userFriendlyMessage: '✏️ Birden fazla işaretleme var, soru boş sayılacak.'
  },
  
  // Uyarılar
  EMPTY_ANSWERS: {
    code: 'EMPTY_ANSWERS',
    title: 'Boş Cevaplar',
    description: 'Bu öğrencinin tüm cevapları boş.',
    suggestion: 'Öğrenci sınavı boş bırakmış olabilir.',
    severity: 'warning',
    recoverable: true,
    userFriendlyMessage: '📝 Tüm cevaplar boş.'
  },
  
  PARTIAL_ANSWERS: {
    code: 'PARTIAL_ANSWERS',
    title: 'Kısmi Cevaplar',
    description: 'Bazı sorular cevaplanmamış.',
    suggestion: 'Bu normal bir durum olabilir.',
    severity: 'info',
    recoverable: true,
    userFriendlyMessage: 'ℹ️ Bazı sorular boş bırakılmış.'
  },
  
  LOW_CONFIDENCE: {
    code: 'LOW_CONFIDENCE',
    title: 'Düşük Güven',
    description: 'Otomatik tespit güveni düşük.',
    suggestion: 'Manuel kontrol önerilir.',
    severity: 'info',
    recoverable: true,
    userFriendlyMessage: 'ℹ️ Manuel kontrol önerilir.'
  }
};

// ==================== ANA FONKSİYONLAR ====================

/**
 * Hata kodundan kullanıcı dostu mesaj üretir
 */
export function getUserFriendlyMessage(errorCode: string): string {
  const definition = ERROR_DEFINITIONS[errorCode];
  return definition?.userFriendlyMessage || '❌ Bir hata oluştu.';
}

/**
 * Hata kodundan çözüm önerisi üretir
 */
export function getSuggestion(errorCode: string): string {
  const definition = ERROR_DEFINITIONS[errorCode];
  return definition?.suggestion || 'Lütfen dosyayı kontrol edin.';
}

/**
 * Hatanın kurtarılabilir olup olmadığını kontrol eder
 */
export function isRecoverable(errorCode: string): boolean {
  const definition = ERROR_DEFINITIONS[errorCode];
  return definition?.recoverable ?? false;
}

/**
 * Hata severity döndürür
 */
export function getSeverity(errorCode: string): ErrorDefinition['severity'] {
  const definition = ERROR_DEFINITIONS[errorCode];
  return definition?.severity || 'error';
}

/**
 * ParseError'dan ImportError oluşturur
 */
export function toImportError(
  parseError: ParseError,
  rowNumber: number,
  studentIdentifier?: string
): ImportError {
  return {
    rowNumber,
    code: parseError.code,
    message: getUserFriendlyMessage(parseError.code),
    studentIdentifier,
    recoverable: isRecoverable(parseError.code)
  };
}

/**
 * Hataları gruplar
 */
export function groupErrors(errors: ImportError[]): Map<string, ImportError[]> {
  const grouped = new Map<string, ImportError[]>();
  
  for (const error of errors) {
    const key = error.code;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(error);
  }
  
  return grouped;
}

/**
 * Hata özeti oluşturur
 */
export function summarizeErrors(errors: ImportError[]): string {
  if (errors.length === 0) return 'Hata yok';
  
  const grouped = groupErrors(errors);
  const parts: string[] = [];
  
  for (const [code, errs] of grouped) {
    const definition = ERROR_DEFINITIONS[code];
    const title = definition?.title || code;
    parts.push(`${title}: ${errs.length}`);
  }
  
  return parts.join(', ');
}

/**
 * Kritik hata var mı kontrol eder
 */
export function hasCriticalErrors(errors: ImportError[]): boolean {
  return errors.some(e => getSeverity(e.code) === 'critical');
}

/**
 * Kurtarılabilir hataları filtreler
 */
export function getRecoverableErrors(errors: ImportError[]): ImportError[] {
  return errors.filter(e => isRecoverable(e.code));
}

/**
 * Kurtarılamaz hataları filtreler
 */
export function getNonRecoverableErrors(errors: ImportError[]): ImportError[] {
  return errors.filter(e => !isRecoverable(e.code));
}

// ==================== UI HELPERS ====================

/**
 * Hata için emoji döndürür
 */
export function getErrorEmoji(errorCode: string): string {
  const severity = getSeverity(errorCode);
  
  switch (severity) {
    case 'critical': return '🚫';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '❓';
  }
}

/**
 * Hata için renk sınıfı döndürür
 */
export function getErrorColorClass(errorCode: string): string {
  const severity = getSeverity(errorCode);
  
  switch (severity) {
    case 'critical': return 'text-red-700 bg-red-50 border-red-200';
    case 'error': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Hata detaylarını döndürür
 */
export function getErrorDetails(errorCode: string): ErrorDefinition | null {
  return ERROR_DEFINITIONS[errorCode] || null;
}

// ==================== EXPORT ====================

export {
  ERROR_DEFINITIONS
};

export default {
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
  getErrorDetails
};

