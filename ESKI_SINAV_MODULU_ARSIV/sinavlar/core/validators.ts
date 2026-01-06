/**
 * AkademiHub Data Validators
 * Motor Dairesi - Veri Bütünlüğü Kontrol Sistemi
 * 
 * Çakışmaları tespit eder ve veri kalitesini garanti eder.
 * 
 * Özellikler:
 * - TC-İsim uyumsuzluğu kontrolü
 * - Öğrenci numarası tekrar kontrolü
 * - Veritabanı cross-check
 * - Otomatik çözüm önerileri
 */

import {
  ParsedStudent,
  Conflict,
  ConflictType,
  ValidationResult,
} from './types';

import {
  validateTC,
  nameSimilarity,
} from './helpers';

import {
  logConflict,
} from './audit';

// ============================================
// 🔍 ANA DOĞRULAMA FONKSİYONU
// ============================================

/**
 * Parse edilmiş öğrenci verilerini doğrular
 * Çakışmaları tespit eder ve raporlar
 */
export function validateParsedData(
  students: ParsedStudent[],
  options?: {
    checkDuplicateTC?: boolean;
    checkDuplicateStudentNo?: boolean;
    checkInvalidTC?: boolean;
    checkMissingFields?: boolean;
    userId?: string;
    organizationId?: string;
  }
): ValidationResult {
  const conflicts: Conflict[] = [];
  const warnings: string[] = [];
  
  const settings = {
    checkDuplicateTC: true,
    checkDuplicateStudentNo: true,
    checkInvalidTC: true,
    checkMissingFields: true,
    ...options,
  };

  // ========== TC DUPLICATE KONTROLÜ ==========
  if (settings.checkDuplicateTC) {
    const tcMap = new Map<string, ParsedStudent[]>();
    
    for (const student of students) {
      if (student.tc && student.tc.length === 11) {
        const existing = tcMap.get(student.tc) || [];
        existing.push(student);
        tcMap.set(student.tc, existing);
      }
    }
    
    for (const [tc, duplicates] of tcMap) {
      if (duplicates.length > 1) {
        // Aynı TC farklı isimler mi?
        const names = [...new Set(duplicates.map(d => d.name.toLowerCase()))];
        
        if (names.length > 1) {
          // Farklı isimler = kritik çakışma
          conflicts.push({
            type: 'TC_NAME_MISMATCH',
            studentNo: duplicates[0].studentNo,
            tc,
            name: duplicates[0].name,
            lineNumber: duplicates[0].lineNumber,
            description: `Aynı TC (${tc}) farklı isimlerle kullanılmış: ${duplicates.map(d => d.name).join(', ')}`,
            existingData: {
              name: duplicates[1].name,
              studentNo: duplicates[1].studentNo,
            },
            severity: 'CRITICAL',
            autoResolvable: false,
            suggestedAction: 'TC numaralarını manuel kontrol edin',
          });
          
          logConflict('TC_NAME_MISMATCH', duplicates[0].studentNo, {
            tc,
            names: duplicates.map(d => d.name),
          }, { userId: options?.userId, organizationId: options?.organizationId });
        } else {
          // Aynı isim = muhtemelen tekrar kayıt
          conflicts.push({
            type: 'TC_DUPLICATE',
            studentNo: duplicates[0].studentNo,
            tc,
            name: duplicates[0].name,
            lineNumber: duplicates[0].lineNumber,
            description: `Aynı TC (${tc}) ${duplicates.length} kez tekrarlanmış`,
            severity: 'MEDIUM',
            autoResolvable: true,
            suggestedAction: 'Tekrar kayıtları birleştirin veya son kaydı kullanın',
          });
        }
      }
    }
  }

  // ========== ÖĞRENCİ NO DUPLICATE KONTROLÜ ==========
  if (settings.checkDuplicateStudentNo) {
    const noMap = new Map<string, ParsedStudent[]>();
    
    for (const student of students) {
      if (student.studentNo) {
        const existing = noMap.get(student.studentNo) || [];
        existing.push(student);
        noMap.set(student.studentNo, existing);
      }
    }
    
    for (const [studentNo, duplicates] of noMap) {
      if (duplicates.length > 1) {
        const tcs = [...new Set(duplicates.map(d => d.tc).filter(Boolean))];
        
        if (tcs.length > 1) {
          conflicts.push({
            type: 'STUDENT_NO_DUPLICATE',
            studentNo,
            tc: duplicates[0].tc,
            name: duplicates[0].name,
            lineNumber: duplicates[0].lineNumber,
            description: `Aynı öğrenci numarası (${studentNo}) farklı TC'lerle kullanılmış`,
            existingData: {
              tc: duplicates[1].tc,
              name: duplicates[1].name,
            },
            severity: 'HIGH',
            autoResolvable: false,
            suggestedAction: 'Öğrenci numaralarını kontrol edin',
          });
        }
      }
    }
  }

  // ========== GEÇERSİZ TC KONTROLÜ ==========
  if (settings.checkInvalidTC) {
    for (const student of students) {
      if (student.tc && student.tc.length === 11) {
        if (!validateTC(student.tc)) {
          conflicts.push({
            type: 'INVALID_TC',
            studentNo: student.studentNo,
            tc: student.tc,
            name: student.name,
            lineNumber: student.lineNumber,
            description: `Geçersiz TC Kimlik numarası: ${student.tc}`,
            severity: 'MEDIUM',
            autoResolvable: false,
            suggestedAction: 'TC numarasını doğru girin',
          });
        }
      }
    }
  }

  // ========== EKSİK ALAN KONTROLÜ ==========
  if (settings.checkMissingFields) {
    for (const student of students) {
      const missing: string[] = [];
      
      if (!student.studentNo) missing.push('Öğrenci No');
      if (!student.name || student.name.length < 3) missing.push('İsim');
      if (!student.answers || student.answers.length < 10) missing.push('Cevaplar');
      
      if (missing.length > 0) {
        conflicts.push({
          type: 'MISSING_REQUIRED',
          studentNo: student.studentNo || `satır-${student.lineNumber}`,
          tc: student.tc,
          name: student.name,
          lineNumber: student.lineNumber,
          description: `Eksik alanlar: ${missing.join(', ')}`,
          severity: missing.includes('Cevaplar') ? 'HIGH' : 'LOW',
          autoResolvable: false,
          suggestedAction: 'Eksik bilgileri tamamlayın',
        });
      }
    }
  }

  // ========== UYARILAR ==========
  // Boş TC uyarısı
  const emptyTCCount = students.filter(s => !s.tc || s.tc.length !== 11).length;
  if (emptyTCCount > 0) {
    warnings.push(`${emptyTCCount} öğrencinin TC bilgisi eksik veya hatalı`);
  }

  // Boş cevap uyarısı
  const lowAnswerCount = students.filter(s => s.answers.length < 50).length;
  if (lowAnswerCount > 0) {
    warnings.push(`${lowAnswerCount} öğrencinin cevap sayısı düşük (< 50 karakter)`);
  }

  // İstatistikler
  const validCount = students.length - conflicts.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH').length;

  return {
    isValid: conflicts.filter(c => c.severity === 'CRITICAL').length === 0,
    conflicts,
    warnings,
    stats: {
      totalChecked: students.length,
      validCount,
      conflictCount: conflicts.length,
      warningCount: warnings.length,
    },
  };
}

// ============================================
// 🔗 VERİTABANI CROSS-CHECK
// ============================================

/**
 * Mevcut veritabanı kayıtlarıyla karşılaştırır
 * 
 * @param students Parse edilmiş öğrenciler
 * @param existingStudents Veritabanındaki mevcut öğrenciler
 */
export function checkAgainstDatabase(
  students: ParsedStudent[],
  existingStudents: { studentNo: string; tc: string; name: string }[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // TC -> Öğrenci haritası
  const dbByTC = new Map(existingStudents.map(s => [s.tc, s]));
  const dbByNo = new Map(existingStudents.map(s => [s.studentNo, s]));

  for (const student of students) {
    // TC ile kontrol
    if (student.tc) {
      const existing = dbByTC.get(student.tc);
      if (existing) {
        // İsim benzerliği kontrol
        const similarity = nameSimilarity(student.name, existing.name);
        
        if (similarity < 70) {
          conflicts.push({
            type: 'TC_NAME_MISMATCH',
            studentNo: student.studentNo,
            tc: student.tc,
            name: student.name,
            lineNumber: student.lineNumber,
            description: `TC veritabanında farklı isimle kayıtlı. Dosya: "${student.name}", DB: "${existing.name}" (Benzerlik: ${similarity}%)`,
            existingData: {
              name: existing.name,
              studentNo: existing.studentNo,
            },
            severity: 'HIGH',
            autoResolvable: similarity > 50,
            suggestedAction: similarity > 50 
              ? 'İsim yazım hatası olabilir, veritabanındaki ismi kullanın' 
              : 'Manuel kontrol gerekli',
          });
        }
      }
    }

    // Öğrenci No ile kontrol
    if (student.studentNo) {
      const existing = dbByNo.get(student.studentNo);
      if (existing && student.tc && existing.tc !== student.tc) {
        conflicts.push({
          type: 'STUDENT_NO_DUPLICATE',
          studentNo: student.studentNo,
          tc: student.tc,
          name: student.name,
          lineNumber: student.lineNumber,
          description: `Öğrenci numarası başka bir TC ile kayıtlı. Dosya TC: ${student.tc}, DB TC: ${existing.tc}`,
          existingData: {
            tc: existing.tc,
            name: existing.name,
          },
          severity: 'CRITICAL',
          autoResolvable: false,
          suggestedAction: 'Öğrenci numarası veya TC yanlış, manuel düzeltme gerekli',
        });
      }
    }
  }

  return conflicts;
}

// ============================================
// 🔧 ÇAKIŞMA ÇÖZÜM YARDIMCILARI
// ============================================

/**
 * Otomatik çözülebilir çakışmaları çözer
 */
export function autoResolveConflicts(
  students: ParsedStudent[],
  conflicts: Conflict[]
): { resolved: ParsedStudent[]; unresolvedConflicts: Conflict[] } {
  const resolvableConflicts = conflicts.filter(c => c.autoResolvable);
  const unresolvedConflicts = conflicts.filter(c => !c.autoResolvable);
  
  let resolved = [...students];
  
  for (const conflict of resolvableConflicts) {
    if (conflict.type === 'TC_DUPLICATE') {
      // Son kaydı tut, öncekilerini çıkar
      const duplicateIndices = resolved
        .map((s, i) => s.tc === conflict.tc ? i : -1)
        .filter(i => i !== -1);
      
      if (duplicateIndices.length > 1) {
        // İlk kayıtları çıkar, son kaydı tut
        duplicateIndices.slice(0, -1).forEach(idx => {
          resolved[idx] = { ...resolved[idx], status: 'FAILED', conflictReason: 'Tekrar kayıt, silindi' };
        });
      }
    }
  }
  
  // Failed olanları filtrele
  resolved = resolved.filter(s => s.status !== 'FAILED');
  
  return { resolved, unresolvedConflicts };
}

/**
 * Çakışma özeti oluşturur
 */
export function getConflictSummary(conflicts: Conflict[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<ConflictType, number>;
  autoResolvable: number;
} {
  const byType: Record<ConflictType, number> = {
    TC_NAME_MISMATCH: 0,
    STUDENT_NO_DUPLICATE: 0,
    TC_DUPLICATE: 0,
    INVALID_TC: 0,
    MALFORMED_LINE: 0,
    MISSING_REQUIRED: 0,
    INVALID_ANSWERS: 0,
  };
  
  for (const conflict of conflicts) {
    byType[conflict.type]++;
  }
  
  return {
    critical: conflicts.filter(c => c.severity === 'CRITICAL').length,
    high: conflicts.filter(c => c.severity === 'HIGH').length,
    medium: conflicts.filter(c => c.severity === 'MEDIUM').length,
    low: conflicts.filter(c => c.severity === 'LOW').length,
    byType,
    autoResolvable: conflicts.filter(c => c.autoResolvable).length,
  };
}

// ============================================
// 📋 CEVAP ANAHTARI DOĞRULAMA
// ============================================

/**
 * Cevap anahtarını doğrular
 */
export function validateAnswerKey(
  answers: string,
  expectedCount: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Uzunluk kontrolü
  if (answers.length !== expectedCount) {
    errors.push(`Beklenen ${expectedCount} cevap, ${answers.length} cevap girildi`);
  }
  
  // Geçerli karakterler kontrolü
  const validChars = new Set(['A', 'B', 'C', 'D', 'E', ' ', '-']);
  const invalidChars: string[] = [];
  
  for (const char of answers.toUpperCase()) {
    if (!validChars.has(char)) {
      if (!invalidChars.includes(char)) {
        invalidChars.push(char);
      }
    }
  }
  
  if (invalidChars.length > 0) {
    errors.push(`Geçersiz karakterler: ${invalidChars.join(', ')}`);
  }
  
  // Boş cevap yüzdesi kontrolü
  const emptyCount = (answers.match(/[\s\-]/g) || []).length;
  const emptyPercentage = (emptyCount / answers.length) * 100;
  
  if (emptyPercentage > 30) {
    errors.push(`Cevap anahtarında çok fazla boş var: ${Math.round(emptyPercentage)}%`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

