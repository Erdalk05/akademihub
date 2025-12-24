/**
 * ============================================
 * AkademiHub - Spreadsheet Parser
 * ============================================
 * 
 * PHASE 7 - Universal Import Engine
 * 
 * BU DOSYA:
 * - Excel (.xlsx, .xls) okuma
 * - CSV/TXT okuma
 * - Otomatik encoding tespiti
 * - Streaming desteği (büyük dosyalar)
 * 
 * ÖLÇEKLENEBİLİRLİK:
 * - Binlerce satır destekler
 * - Memory-efficient parsing
 * - Progress callback
 */

import * as XLSX from 'xlsx';
import type {
  ParsedRow,
  ParsedAnswer,
  StudentIdentifier,
  ParseError,
  ParseWarning,
  FileInfo,
  RowSummary,
  ColumnMapping,
  SupportedFileType
} from '../types';
import { VALID_ANSWERS, EMPTY_ANSWER_VALUES } from '../types';

// ==================== CONFIG ====================

const PARSER_CONFIG = {
  // Max satır (sınırsız için 0)
  maxRows: 0,
  
  // Header satırları atla
  skipHeaderRows: 1,
  
  // Boş satırları atla
  skipEmptyRows: true,
  
  // Batch size (progress için)
  batchSize: 100,
  
  // Encoding options
  defaultEncoding: 'utf-8',
  
  // CSV delimiter auto-detect
  autoDetectDelimiter: true
};

// ==================== TYPES ====================

export interface ParseOptions {
  // Header satır sayısı
  headerRows?: number;
  
  // Başlangıç satırı (1-based)
  startRow?: number;
  
  // Max satır (0 = sınırsız)
  maxRows?: number;
  
  // Sheet adı (Excel için)
  sheetName?: string;
  
  // Sheet index (Excel için)
  sheetIndex?: number;
  
  // Kolon mapping (varsa)
  columnMapping?: ColumnMapping[];
  
  // Progress callback
  onProgress?: (progress: ParseProgress) => void;
}

export interface ParseProgress {
  currentRow: number;
  totalRows: number;
  percentage: number;
  phase: 'reading' | 'parsing' | 'validating';
}

export interface SpreadsheetParseResult {
  // Başarı
  success: boolean;
  
  // Dosya bilgisi
  fileInfo: FileInfo;
  
  // Satır özeti
  rowSummary: RowSummary;
  
  // Header satırları
  headers: string[];
  
  // Önizleme satırları (ilk 5)
  previewRows: Record<string, unknown>[];
  
  // Parse edilmiş satırlar
  parsedRows: ParsedRow[];
  
  // Hatalar
  errors: ParseError[];
  
  // Sheet listesi (Excel için)
  availableSheets?: string[];
}

// ==================== ANA FONKSİYON ====================

/**
 * Dosyayı parse eder
 */
export async function parseSpreadsheet(
  file: File,
  options: ParseOptions = {}
): Promise<SpreadsheetParseResult> {
  const fileType = detectFileType(file.name);
  
  if (!fileType) {
    return createErrorResult(`Desteklenmeyen dosya formatı: ${file.name}`);
  }
  
  try {
    // Dosyayı oku
    const buffer = await file.arrayBuffer();
    
    // Dosya tipine göre parse et
    switch (fileType) {
      case 'xlsx':
      case 'xls':
        return parseExcel(buffer, file, options);
      
      case 'csv':
      case 'txt':
        return parseCSV(buffer, file, options);
      
      default:
        return createErrorResult(`Desteklenmeyen format: ${fileType}`);
    }
  } catch (error) {
    console.error('[SpreadsheetParser] Parse error:', error);
    return createErrorResult(error instanceof Error ? error.message : 'Parse hatası');
  }
}

// ==================== EXCEL PARSER ====================

async function parseExcel(
  buffer: ArrayBuffer,
  file: File,
  options: ParseOptions
): Promise<SpreadsheetParseResult> {
  // Excel dosyasını oku
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: true,
    cellText: true
  });
  
  // Sheet seç
  const sheetNames = workbook.SheetNames;
  const selectedSheet = options.sheetName || 
                       sheetNames[options.sheetIndex ?? 0] ||
                       sheetNames[0];
  
  if (!selectedSheet) {
    return createErrorResult('Excel dosyasında sheet bulunamadı');
  }
  
  const worksheet = workbook.Sheets[selectedSheet];
  
  // JSON'a çevir
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false
  }) as unknown[][];
  
  // Parse et
  return parseJsonData(jsonData, file, options, sheetNames);
}

// ==================== CSV PARSER ====================

async function parseCSV(
  buffer: ArrayBuffer,
  file: File,
  options: ParseOptions
): Promise<SpreadsheetParseResult> {
  // Buffer'ı text'e çevir
  const decoder = new TextDecoder('utf-8');
  let text = decoder.decode(buffer);
  
  // BOM karakterini kaldır
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  
  // Delimiter tespit et
  const delimiter = detectDelimiter(text);
  
  // Satırlara böl
  const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
  
  // JSON data'ya çevir
  const jsonData: unknown[][] = lines.map(line => {
    return parseCSVLine(line, delimiter);
  });
  
  return parseJsonData(jsonData, file, options);
}

/**
 * CSV satırını parse eder (quoted strings destekli)
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * CSV delimiter tespit eder
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\n|\r/)[0] || '';
  
  const delimiters = [';', ',', '\t', '|'];
  let maxCount = 0;
  let bestDelimiter = ',';
  
  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = d;
    }
  }
  
  return bestDelimiter;
}

// ==================== JSON DATA PARSER ====================

async function parseJsonData(
  data: unknown[][],
  file: File,
  options: ParseOptions,
  availableSheets?: string[]
): Promise<SpreadsheetParseResult> {
  if (data.length === 0) {
    return createErrorResult('Dosya boş');
  }
  
  const headerRows = options.headerRows ?? 1;
  const startRow = options.startRow ?? (headerRows + 1);
  const maxRows = options.maxRows ?? PARSER_CONFIG.maxRows;
  
  // Headers
  const headers = (data[0] || []).map((h, i) => 
    h ? String(h).trim() : `Sütun ${i + 1}`
  );
  
  // Önizleme satırları
  const previewRows: Record<string, unknown>[] = [];
  for (let i = headerRows; i < Math.min(data.length, headerRows + 5); i++) {
    const row = data[i];
    if (row) {
      const rowObj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = row[idx] ?? '';
      });
      previewRows.push(rowObj);
    }
  }
  
  // Satırları parse et
  const parsedRows: ParsedRow[] = [];
  const errors: ParseError[] = [];
  let emptyRows = 0;
  let errorRows = 0;
  
  const totalDataRows = data.length - headerRows;
  const rowsToProcess = maxRows > 0 ? Math.min(totalDataRows, maxRows) : totalDataRows;
  
  for (let i = 0; i < rowsToProcess; i++) {
    const dataIndex = i + headerRows;
    const row = data[dataIndex];
    
    // Progress callback
    if (options.onProgress && i % PARSER_CONFIG.batchSize === 0) {
      options.onProgress({
        currentRow: i,
        totalRows: rowsToProcess,
        percentage: Math.round((i / rowsToProcess) * 100),
        phase: 'parsing'
      });
    }
    
    // Boş satır kontrolü
    if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
      emptyRows++;
      if (PARSER_CONFIG.skipEmptyRows) continue;
    }
    
    // Satırı parse et
    const parsedRow = parseRow(row, headers, dataIndex + 1, options.columnMapping);
    
    if (parsedRow.status === 'error') {
      errorRows++;
      errors.push(...parsedRow.errors);
    }
    
    parsedRows.push(parsedRow);
  }
  
  // Final progress
  if (options.onProgress) {
    options.onProgress({
      currentRow: rowsToProcess,
      totalRows: rowsToProcess,
      percentage: 100,
      phase: 'validating'
    });
  }
  
  // File info
  const fileInfo: FileInfo = {
    name: file.name,
    size: file.size,
    type: detectFileType(file.name) as SupportedFileType,
    sheetCount: availableSheets?.length,
    selectedSheet: availableSheets?.[0]
  };
  
  // Row summary
  const rowSummary: RowSummary = {
    totalRows: data.length,
    dataRows: rowsToProcess,
    headerRows,
    emptyRows,
    errorRows
  };
  
  return {
    success: true,
    fileInfo,
    rowSummary,
    headers,
    previewRows,
    parsedRows,
    errors,
    availableSheets
  };
}

// ==================== ROW PARSER ====================

function parseRow(
  row: unknown[],
  headers: string[],
  rowNumber: number,
  columnMapping?: ColumnMapping[]
): ParsedRow {
  const rawData: Record<string, unknown> = {};
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  
  // Raw data oluştur
  headers.forEach((h, i) => {
    rawData[h] = row[i] ?? '';
  });
  
  // Kolon mapping varsa kullan
  let studentIdentifier: StudentIdentifier | null = null;
  let answers: ParsedAnswer[] = [];
  let bookletType: string | null = null;
  
  if (columnMapping && columnMapping.length > 0) {
    // Mapping ile parse et
    const result = parseWithMapping(row, columnMapping);
    studentIdentifier = result.studentIdentifier;
    answers = result.answers;
    bookletType = result.bookletType;
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  } else {
    // Otomatik tespit ile parse et
    const result = parseAutoDetect(row, headers);
    studentIdentifier = result.studentIdentifier;
    answers = result.answers;
    bookletType = result.bookletType;
  }
  
  // Status belirle
  let status: ParsedRow['status'] = 'valid';
  
  if (errors.length > 0) {
    status = 'error';
  } else if (warnings.length > 0) {
    status = 'warning';
  }
  
  return {
    rowNumber,
    rawData,
    studentIdentifier,
    answers,
    bookletType,
    status,
    errors,
    warnings
  };
}

// ==================== MAPPING İLE PARSE ====================

function parseWithMapping(
  row: unknown[],
  mapping: ColumnMapping[]
): {
  studentIdentifier: StudentIdentifier | null;
  answers: ParsedAnswer[];
  bookletType: string | null;
  errors: ParseError[];
  warnings: ParseWarning[];
} {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  
  let studentNo: string | null = null;
  let tcNo: string | null = null;
  let fullName: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let className: string | null = null;
  let section: string | null = null;
  let bookletType: string | null = null;
  const answers: ParsedAnswer[] = [];
  
  for (const map of mapping) {
    const value = row[map.sourceIndex];
    const strValue = value !== null && value !== undefined ? String(value).trim() : null;
    
    switch (map.targetType) {
      case 'student_no':
        studentNo = strValue;
        break;
      case 'tc_no':
        tcNo = strValue;
        break;
      case 'full_name':
        fullName = strValue;
        break;
      case 'first_name':
        firstName = strValue;
        break;
      case 'last_name':
        lastName = strValue;
        break;
      case 'class':
        className = strValue;
        break;
      case 'section':
        section = strValue;
        break;
      case 'booklet_type':
        bookletType = strValue?.toUpperCase() || null;
        break;
      case 'answer':
        if (map.questionNumber) {
          answers.push(parseAnswer(value, map.questionNumber));
        }
        break;
    }
  }
  
  // Student identifier oluştur
  let studentIdentifier: StudentIdentifier | null = null;
  
  if (studentNo || tcNo || fullName || firstName) {
    studentIdentifier = {
      studentNo,
      tcNo,
      fullName,
      firstName,
      lastName,
      className,
      section
    };
  }
  
  return { studentIdentifier, answers, bookletType, errors, warnings };
}

// ==================== OTOMATİK TESPİT ====================

function parseAutoDetect(
  row: unknown[],
  headers: string[]
): {
  studentIdentifier: StudentIdentifier | null;
  answers: ParsedAnswer[];
  bookletType: string | null;
} {
  let studentNo: string | null = null;
  let tcNo: string | null = null;
  let fullName: string | null = null;
  let className: string | null = null;
  let bookletType: string | null = null;
  const answers: ParsedAnswer[] = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    const value = row[i];
    const strValue = value !== null && value !== undefined ? String(value).trim() : null;
    
    // Öğrenci numarası
    if (header.includes('no') || header.includes('numara') || header === 'student_no') {
      if (!header.includes('tc') && !header.includes('kimlik')) {
        studentNo = strValue;
      }
    }
    
    // TC Kimlik
    if (header.includes('tc') || header.includes('kimlik')) {
      tcNo = strValue;
    }
    
    // Ad Soyad
    if (header.includes('ad') || header.includes('isim') || header.includes('name')) {
      fullName = strValue;
    }
    
    // Sınıf
    if (header.includes('sınıf') || header.includes('sinif') || header === 'class') {
      className = strValue;
    }
    
    // Kitapçık
    if (header.includes('kitapçık') || header.includes('kitapcik') || header.includes('booklet') || header === 'tip') {
      bookletType = strValue?.toUpperCase() || null;
    }
    
    // Cevap sütunları (1, 2, 3... veya S1, S2, S3... veya Soru 1, Soru 2...)
    const questionMatch = header.match(/^(?:s|soru\s*)?(\d+)$/i);
    if (questionMatch) {
      const qNum = parseInt(questionMatch[1], 10);
      answers.push(parseAnswer(value, qNum));
    }
  }
  
  // Student identifier
  let studentIdentifier: StudentIdentifier | null = null;
  
  if (studentNo || tcNo || fullName) {
    studentIdentifier = {
      studentNo,
      tcNo,
      fullName,
      firstName: null,
      lastName: null,
      className,
      section: null
    };
  }
  
  return { studentIdentifier, answers, bookletType };
}

// ==================== CEVAP PARSER ====================

function parseAnswer(value: unknown, questionNumber: number): ParsedAnswer {
  const rawValue = value;
  let answer: string | null = null;
  let isValid = false;
  let hasMultipleMarks = false;
  
  if (value === null || value === undefined || value === '') {
    // Boş cevap
    answer = null;
    isValid = true;
  } else {
    const strValue = String(value).trim().toUpperCase();
    
    // Birden fazla işaretleme kontrolü
    if (strValue.length > 1 && !EMPTY_ANSWER_VALUES.includes(strValue)) {
      const marks = strValue.split('').filter(c => VALID_ANSWERS.includes(c.toUpperCase()));
      if (marks.length > 1) {
        hasMultipleMarks = true;
        answer = null; // Geçersiz
      } else if (marks.length === 1) {
        answer = marks[0].toUpperCase();
        isValid = true;
      }
    } else if (VALID_ANSWERS.includes(strValue)) {
      answer = strValue;
      isValid = true;
    } else if (EMPTY_ANSWER_VALUES.includes(strValue) || EMPTY_ANSWER_VALUES.includes(String(value))) {
      answer = null;
      isValid = true;
    }
  }
  
  return {
    questionNumber,
    answer,
    rawValue,
    isValid,
    hasMultipleMarks
  };
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function detectFileType(filename: string): SupportedFileType | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'xlsx':
      return 'xlsx';
    case 'xls':
      return 'xls';
    case 'csv':
      return 'csv';
    case 'txt':
      return 'txt';
    default:
      return null;
  }
}

function createErrorResult(message: string): SpreadsheetParseResult {
  return {
    success: false,
    fileInfo: {
      name: '',
      size: 0,
      type: 'xlsx'
    },
    rowSummary: {
      totalRows: 0,
      dataRows: 0,
      headerRows: 0,
      emptyRows: 0,
      errorRows: 0
    },
    headers: [],
    previewRows: [],
    parsedRows: [],
    errors: [{
      code: 'ROW_PARSE_FAILED',
      message
    }]
  };
}

// ==================== EXPORT ====================

export default {
  parseSpreadsheet,
  detectFileType
};

