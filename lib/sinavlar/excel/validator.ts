/**
 * ✅ Data Validator
 * Excel verilerini doğrulama
 */

import { ExcelRow, ValidationWarning, ColumnMapping } from './types';
import { cleanText } from './turkish';

/**
 * Validate a single row
 */
export function validateRow(
  row: ExcelRow,
  mapping: ColumnMapping,
  rowIndex: number
): ValidationWarning[] {
  
  const warnings: ValidationWarning[] = [];
  
  // 1. Required: Soru No
  const soruNoColumn = mapping.soru_no || mapping.a_soru_no;
  if (soruNoColumn) {
    const soruNo = row[soruNoColumn];
    if (!soruNo || cleanText(soruNo) === '') {
      warnings.push({
        severity: 'ERROR',
        row: rowIndex,
        column: soruNoColumn,
        value: soruNo,
        message: 'Soru numarası boş olamaz'
      });
    } else if (isNaN(parseInt(cleanText(soruNo)))) {
      warnings.push({
        severity: 'WARNING',
        row: rowIndex,
        column: soruNoColumn,
        value: soruNo,
        message: 'Soru numarası sayı olmalı',
        suggestion: 'Değer sayıya dönüştürülecek'
      });
    }
  }
  
  // 2. Required: Ders
  if (mapping.ders) {
    const ders = cleanText(row[mapping.ders]);
    if (!ders) {
      warnings.push({
        severity: 'ERROR',
        row: rowIndex,
        column: mapping.ders,
        value: row[mapping.ders],
        message: 'Ders adı boş olamaz'
      });
    }
  }
  
  // 3. Required: Doğru Cevap
  if (mapping.dogru_cevap) {
    const dogruCevap = cleanText(row[mapping.dogru_cevap]).toUpperCase();
    if (!dogruCevap) {
      warnings.push({
        severity: 'ERROR',
        row: rowIndex,
        column: mapping.dogru_cevap,
        value: row[mapping.dogru_cevap],
        message: 'Doğru cevap boş olamaz'
      });
    } else if (!['A', 'B', 'C', 'D', 'E'].includes(dogruCevap)) {
      warnings.push({
        severity: 'ERROR',
        row: rowIndex,
        column: mapping.dogru_cevap,
        value: dogruCevap,
        message: `Geçersiz cevap: "${dogruCevap}". A, B, C, D veya E olmalı.`
      });
    }
  }
  
  // 4. Optional: Kazanım (warning only)
  if (mapping.kazanim_kodu) {
    const kazanim = cleanText(row[mapping.kazanim_kodu]);
    if (!kazanim) {
      // Info level - not blocking
      warnings.push({
        severity: 'INFO',
        row: rowIndex,
        column: mapping.kazanim_kodu,
        message: 'Kazanım kodu boş (detaylı analiz yapılamayacak)'
      });
    }
  }
  
  // 5. Check booklet columns if present
  const bookletColumns = [
    { col: mapping.a_soru_no, code: 'A' },
    { col: mapping.b_soru_no, code: 'B' },
    { col: mapping.c_soru_no, code: 'C' },
    { col: mapping.d_soru_no, code: 'D' },
  ];
  
  for (const { col, code } of bookletColumns) {
    if (col) {
      const val = cleanText(row[col]);
      if (val && isNaN(parseInt(val))) {
        warnings.push({
          severity: 'WARNING',
          row: rowIndex,
          column: col,
          value: val,
          message: `${code} kitapçık soru numarası geçersiz`
        });
      }
    }
  }
  
  return warnings;
}

/**
 * Validate all data
 */
export function validateData(
  data: ExcelRow[],
  mapping: ColumnMapping
): ValidationWarning[] {
  
  const allWarnings: ValidationWarning[] = [];
  const seenQuestionNumbers = new Set<string>();
  
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1;  // 1-indexed for user display
    
    // Skip empty rows
    const isEmpty = Object.values(row).every(v => !cleanText(v));
    if (isEmpty) continue;
    
    // Validate row
    const rowWarnings = validateRow(row, mapping, rowNumber);
    allWarnings.push(...rowWarnings);
    
    // Check duplicates
    const soruNoColumn = mapping.soru_no || mapping.a_soru_no;
    if (soruNoColumn) {
      const soruNo = cleanText(row[soruNoColumn]);
      const ders = cleanText(row[mapping.ders] || '');
      const key = `${ders}-${soruNo}`;
      
      if (soruNo) {
        if (seenQuestionNumbers.has(key)) {
          allWarnings.push({
            severity: 'WARNING',
            row: rowNumber,
            column: soruNoColumn,
            value: soruNo,
            message: `Soru numarası ${soruNo} (${ders}) tekrar ediyor`,
            suggestion: 'Farklı kitapçıklar için normal olabilir'
          });
        } else {
          seenQuestionNumbers.add(key);
        }
      }
    }
  }
  
  return allWarnings;
}

/**
 * Check if validation errors exist (not warnings/info)
 */
export function hasErrors(warnings: ValidationWarning[]): boolean {
  return warnings.some(w => w.severity === 'ERROR');
}

/**
 * Count warnings by severity
 */
export function countBySeverity(warnings: ValidationWarning[]): {
  errors: number;
  warnings: number;
  info: number;
} {
  return {
    errors: warnings.filter(w => w.severity === 'ERROR').length,
    warnings: warnings.filter(w => w.severity === 'WARNING').length,
    info: warnings.filter(w => w.severity === 'INFO').length
  };
}

/**
 * Get summary of validation
 */
export function getValidationSummary(warnings: ValidationWarning[]): string {
  const counts = countBySeverity(warnings);
  
  const parts: string[] = [];
  
  if (counts.errors > 0) {
    parts.push(`${counts.errors} hata`);
  }
  if (counts.warnings > 0) {
    parts.push(`${counts.warnings} uyarı`);
  }
  if (counts.info > 0) {
    parts.push(`${counts.info} bilgi`);
  }
  
  if (parts.length === 0) {
    return 'Sorun bulunamadı ✓';
  }
  
  return parts.join(', ');
}

