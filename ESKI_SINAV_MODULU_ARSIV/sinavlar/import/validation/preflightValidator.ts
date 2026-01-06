/**
 * ============================================
 * AkademiHub - Preflight Validator
 * ============================================
 * 
 * PHASE 7 - Universal Import Engine
 * 
 * BU DOSYA:
 * - Import öncesi kontroller
 * - Dosya validasyonu
 * - Veri kalitesi kontrolü
 * - Kullanıcıya öneriler
 */

import type {
  PreflightResult,
  PreflightError,
  PreflightWarning,
  FileInfo,
  RowSummary,
  ColumnAnalysis,
  ParsedRow,
  ColumnMapping,
  ColumnType
} from '../types';
import { REQUIRED_COLUMN_TYPES, VALID_ANSWERS } from '../types';

// ==================== CONFIG ====================

const PREFLIGHT_CONFIG = {
  // Minimum satır sayısı
  minRows: 1,
  
  // Maximum satır sayısı (0 = sınırsız)
  maxRows: 0,
  
  // Minimum cevap sütunu
  minAnswerColumns: 1,
  
  // Maximum dosya boyutu (MB)
  maxFileSizeMB: 50,
  
  // Minimum geçerli satır yüzdesi
  minValidRowPercentage: 50,
  
  // Duplicate kontrolü
  checkDuplicates: true
};

// ==================== ANA FONKSİYON ====================

/**
 * Import öncesi tüm kontrolleri yapar
 */
export function runPreflightChecks(
  fileInfo: FileInfo,
  rowSummary: RowSummary,
  columnMapping: ColumnMapping[],
  parsedRows: ParsedRow[]
): PreflightResult {
  const criticalErrors: PreflightError[] = [];
  const warnings: PreflightWarning[] = [];
  const recommendations: string[] = [];
  
  // 1. Dosya kontrolleri
  const fileErrors = validateFile(fileInfo);
  criticalErrors.push(...fileErrors);
  
  // 2. Satır kontrolleri
  const { errors: rowErrors, warnings: rowWarnings } = validateRows(rowSummary, parsedRows);
  criticalErrors.push(...rowErrors);
  warnings.push(...rowWarnings);
  
  // 3. Kolon kontrolleri
  const { errors: colErrors, warnings: colWarnings, recs: colRecs } = validateColumns(columnMapping);
  criticalErrors.push(...colErrors);
  warnings.push(...colWarnings);
  recommendations.push(...colRecs);
  
  // 4. Veri kalitesi kontrolleri
  const { warnings: dataWarnings, recs: dataRecs } = validateDataQuality(parsedRows);
  warnings.push(...dataWarnings);
  recommendations.push(...dataRecs);
  
  // 5. Duplicate kontrolü
  if (PREFLIGHT_CONFIG.checkDuplicates) {
    const duplicateWarnings = checkDuplicates(parsedRows);
    warnings.push(...duplicateWarnings);
  }
  
  // Column analysis
  const columnAnalysis = buildColumnAnalysis(columnMapping, parsedRows);
  
  // Can proceed?
  const canProceed = criticalErrors.length === 0;
  
  return {
    canProceed,
    fileInfo,
    rowSummary,
    columnAnalysis,
    criticalErrors,
    warnings,
    recommendations
  };
}

// ==================== DOSYA VALİDASYONU ====================

function validateFile(fileInfo: FileInfo): PreflightError[] {
  const errors: PreflightError[] = [];
  
  // Dosya boyutu kontrolü
  const sizeMB = fileInfo.size / (1024 * 1024);
  if (PREFLIGHT_CONFIG.maxFileSizeMB > 0 && sizeMB > PREFLIGHT_CONFIG.maxFileSizeMB) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `Dosya çok büyük: ${sizeMB.toFixed(1)} MB`,
      details: `Maximum ${PREFLIGHT_CONFIG.maxFileSizeMB} MB desteklenmektedir.`
    });
  }
  
  // Dosya tipi kontrolü
  const validTypes = ['xlsx', 'xls', 'csv', 'txt'];
  if (!validTypes.includes(fileInfo.type)) {
    errors.push({
      code: 'INVALID_FILE_TYPE',
      message: `Desteklenmeyen dosya formatı: ${fileInfo.type}`,
      details: 'Excel (.xlsx, .xls) veya CSV (.csv, .txt) dosyası yükleyin.'
    });
  }
  
  return errors;
}

// ==================== SATIR VALİDASYONU ====================

function validateRows(
  rowSummary: RowSummary,
  parsedRows: ParsedRow[]
): { errors: PreflightError[]; warnings: PreflightWarning[] } {
  const errors: PreflightError[] = [];
  const warnings: PreflightWarning[] = [];
  
  // Minimum satır kontrolü
  if (rowSummary.dataRows < PREFLIGHT_CONFIG.minRows) {
    errors.push({
      code: 'NO_DATA_ROWS',
      message: 'Veri satırı bulunamadı',
      details: 'Dosyada en az 1 veri satırı olmalıdır.'
    });
  }
  
  // Maximum satır kontrolü
  if (PREFLIGHT_CONFIG.maxRows > 0 && rowSummary.dataRows > PREFLIGHT_CONFIG.maxRows) {
    errors.push({
      code: 'TOO_MANY_ROWS',
      message: `Çok fazla satır: ${rowSummary.dataRows}`,
      details: `Maximum ${PREFLIGHT_CONFIG.maxRows} satır desteklenmektedir.`
    });
  }
  
  // Hata satır yüzdesi
  if (rowSummary.dataRows > 0) {
    const errorPercentage = (rowSummary.errorRows / rowSummary.dataRows) * 100;
    const validPercentage = 100 - errorPercentage;
    
    if (validPercentage < PREFLIGHT_CONFIG.minValidRowPercentage) {
      errors.push({
        code: 'TOO_MANY_ERRORS',
        message: `Çok fazla hatalı satır: %${errorPercentage.toFixed(0)}`,
        details: 'Lütfen dosyayı kontrol edin ve tekrar yükleyin.'
      });
    } else if (rowSummary.errorRows > 0) {
      warnings.push({
        code: 'SOME_ERROR_ROWS',
        message: `${rowSummary.errorRows} satırda hata var`,
        affectedRows: rowSummary.errorRows
      });
    }
  }
  
  // Boş satır uyarısı
  if (rowSummary.emptyRows > 0) {
    warnings.push({
      code: 'EMPTY_ROWS',
      message: `${rowSummary.emptyRows} boş satır atlanacak`,
      affectedRows: rowSummary.emptyRows
    });
  }
  
  // Öğrenci tanımlayıcısı olmayan satırlar
  const noIdentifierRows = parsedRows.filter(r => !r.studentIdentifier || (!r.studentIdentifier.studentNo && !r.studentIdentifier.tcNo && !r.studentIdentifier.fullName));
  if (noIdentifierRows.length > 0) {
    warnings.push({
      code: 'NO_STUDENT_IDENTIFIER',
      message: `${noIdentifierRows.length} satırda öğrenci bilgisi eksik`,
      affectedRows: noIdentifierRows.length
    });
  }
  
  return { errors, warnings };
}

// ==================== KOLON VALİDASYONU ====================

function validateColumns(
  columnMapping: ColumnMapping[]
): { errors: PreflightError[]; warnings: PreflightWarning[]; recs: string[] } {
  const errors: PreflightError[] = [];
  const warnings: PreflightWarning[] = [];
  const recs: string[] = [];
  
  // Zorunlu kolon kontrolü
  const mappedTypes = columnMapping.map(m => m.targetType);
  
  // Öğrenci tanımlayıcı (student_no veya tc_no veya full_name)
  const hasStudentId = mappedTypes.includes('student_no') || 
                       mappedTypes.includes('tc_no') || 
                       mappedTypes.includes('full_name');
  
  if (!hasStudentId) {
    errors.push({
      code: 'MISSING_STUDENT_IDENTIFIER',
      message: 'Öğrenci tanımlayıcı sütun bulunamadı',
      details: 'Öğrenci numarası, TC Kimlik veya Ad Soyad sütunu gereklidir.'
    });
  }
  
  // Cevap sütunları
  const answerColumns = columnMapping.filter(m => m.targetType === 'answer');
  
  if (answerColumns.length < PREFLIGHT_CONFIG.minAnswerColumns) {
    errors.push({
      code: 'NO_ANSWER_COLUMNS',
      message: 'Cevap sütunu bulunamadı',
      details: 'En az 1 cevap sütunu gereklidir.'
    });
  }
  
  // Bilinmeyen sütunlar
  const unknownColumns = columnMapping.filter(m => m.targetType === 'unknown');
  if (unknownColumns.length > 0) {
    warnings.push({
      code: 'UNKNOWN_COLUMNS',
      message: `${unknownColumns.length} sütun tanımlanamadı`,
      affectedRows: unknownColumns.length
    });
    
    recs.push('Tanımlanamayan sütunları "Kolon Eşleştirme" adımında manuel olarak ayarlayabilirsiniz.');
  }
  
  // Düşük güvenli eşleştirmeler
  const lowConfidence = columnMapping.filter(m => m.confidence > 0 && m.confidence < 70);
  if (lowConfidence.length > 0) {
    recs.push(`${lowConfidence.length} sütun düşük güvenle eşleştirildi. Lütfen kontrol edin.`);
  }
  
  return { errors, warnings, recs };
}

// ==================== VERİ KALİTESİ ====================

function validateDataQuality(
  parsedRows: ParsedRow[]
): { warnings: PreflightWarning[]; recs: string[] } {
  const warnings: PreflightWarning[] = [];
  const recs: string[] = [];
  
  if (parsedRows.length === 0) return { warnings, recs };
  
  // Boş cevap analizi
  let totalAnswers = 0;
  let emptyAnswers = 0;
  let invalidAnswers = 0;
  let multipleMarks = 0;
  
  for (const row of parsedRows) {
    for (const answer of row.answers) {
      totalAnswers++;
      if (answer.answer === null) emptyAnswers++;
      if (!answer.isValid) invalidAnswers++;
      if (answer.hasMultipleMarks) multipleMarks++;
    }
  }
  
  // Boş cevap yüzdesi
  if (totalAnswers > 0) {
    const emptyPercentage = (emptyAnswers / totalAnswers) * 100;
    
    if (emptyPercentage > 50) {
      warnings.push({
        code: 'HIGH_EMPTY_ANSWERS',
        message: `Yüksek boş cevap oranı: %${emptyPercentage.toFixed(0)}`,
        affectedRows: parsedRows.filter(r => r.answers.every(a => a.answer === null)).length
      });
    } else if (emptyPercentage > 20) {
      recs.push(`Boş cevap oranı %${emptyPercentage.toFixed(0)}. Normal aralıkta.`);
    }
    
    // Geçersiz cevaplar
    if (invalidAnswers > 0) {
      warnings.push({
        code: 'INVALID_ANSWERS',
        message: `${invalidAnswers} geçersiz cevap bulundu`,
        affectedRows: parsedRows.filter(r => r.answers.some(a => !a.isValid)).length
      });
    }
    
    // Birden fazla işaretleme
    if (multipleMarks > 0) {
      warnings.push({
        code: 'MULTIPLE_MARKS',
        message: `${multipleMarks} soruda birden fazla işaretleme`,
        affectedRows: parsedRows.filter(r => r.answers.some(a => a.hasMultipleMarks)).length
      });
    }
  }
  
  // Soru numarası sürekliliği
  const allQuestionNumbers = new Set<number>();
  for (const row of parsedRows) {
    for (const answer of row.answers) {
      allQuestionNumbers.add(answer.questionNumber);
    }
  }
  
  const questionNumbers = Array.from(allQuestionNumbers).sort((a, b) => a - b);
  if (questionNumbers.length > 0) {
    const expected = Array.from({ length: questionNumbers.length }, (_, i) => questionNumbers[0] + i);
    const missing = expected.filter(n => !allQuestionNumbers.has(n));
    
    if (missing.length > 0) {
      recs.push(`Atlanan soru numaraları: ${missing.join(', ')}`);
    }
  }
  
  return { warnings, recs };
}

// ==================== DUPLICATE KONTROLÜ ====================

function checkDuplicates(parsedRows: ParsedRow[]): PreflightWarning[] {
  const warnings: PreflightWarning[] = [];
  
  // Öğrenci numarası duplicates
  const studentNos = new Map<string, number[]>();
  
  for (const row of parsedRows) {
    if (row.studentIdentifier?.studentNo) {
      const no = row.studentIdentifier.studentNo;
      if (!studentNos.has(no)) {
        studentNos.set(no, []);
      }
      studentNos.get(no)!.push(row.rowNumber);
    }
  }
  
  const duplicateStudents = Array.from(studentNos.entries()).filter(([_, rows]) => rows.length > 1);
  
  if (duplicateStudents.length > 0) {
    warnings.push({
      code: 'DUPLICATE_STUDENTS',
      message: `${duplicateStudents.length} öğrenci numarası tekrar ediyor`,
      affectedRows: duplicateStudents.reduce((sum, [_, rows]) => sum + rows.length, 0)
    });
  }
  
  return warnings;
}

// ==================== COLUMN ANALYSIS ====================

function buildColumnAnalysis(
  columnMapping: ColumnMapping[],
  parsedRows: ParsedRow[]
): ColumnAnalysis {
  const detectedColumns: ColumnAnalysis['detectedColumns'] = [];
  const unmappedColumns: string[] = [];
  
  for (const mapping of columnMapping) {
    if (mapping.targetType === 'unknown') {
      unmappedColumns.push(mapping.sourceColumn);
    } else if (mapping.targetType !== 'ignore') {
      // Sample değerler al
      const sampleValues: string[] = [];
      for (const row of parsedRows.slice(0, 5)) {
        const value = row.rawData[mapping.sourceColumn];
        if (value !== null && value !== undefined && value !== '') {
          sampleValues.push(String(value));
        }
      }
      
      detectedColumns.push({
        type: mapping.targetType,
        column: mapping.sourceColumn,
        sampleValues
      });
    }
  }
  
  return {
    totalColumns: columnMapping.length,
    detectedColumns,
    unmappedColumns
  };
}

// ==================== QUICK CHECKS ====================

/**
 * Hızlı dosya kontrolü (yükleme öncesi)
 */
export function quickFileCheck(file: File): { valid: boolean; message: string } {
  // Boyut kontrolü
  const sizeMB = file.size / (1024 * 1024);
  if (PREFLIGHT_CONFIG.maxFileSizeMB > 0 && sizeMB > PREFLIGHT_CONFIG.maxFileSizeMB) {
    return {
      valid: false,
      message: `Dosya çok büyük (${sizeMB.toFixed(1)} MB). Maximum ${PREFLIGHT_CONFIG.maxFileSizeMB} MB.`
    };
  }
  
  // Format kontrolü
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExts = ['xlsx', 'xls', 'csv', 'txt'];
  if (!ext || !validExts.includes(ext)) {
    return {
      valid: false,
      message: 'Desteklenmeyen dosya formatı. Excel veya CSV yükleyin.'
    };
  }
  
  return { valid: true, message: 'Dosya geçerli' };
}

// ==================== EXPORT ====================

export default {
  runPreflightChecks,
  quickFileCheck
};

