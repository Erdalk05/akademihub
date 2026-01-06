/**
 * ============================================
 * AkademiHub - Universal Import Engine Types
 * ============================================
 * 
 * PHASE 7 - Optical Reading & Exam Import
 * 
 * BU DOSYA:
 * - Import işlemleri için tüm tipler
 * - Parser, Matcher, Validator tipleri
 * - UI ViewModel'leri
 * 
 * REAL CONTEXT:
 * - 82 öğrencilik gerçek kurum
 * - ZERO tolerance for data loss
 * - Child-level UX simplicity
 */

// ==================== FILE TYPES ====================

/**
 * Desteklenen dosya formatları
 */
export type SupportedFileType = 
  | 'xlsx'    // Excel 2007+
  | 'xls'     // Excel 97-2003
  | 'csv'     // Comma Separated
  | 'txt'     // Tab Separated
  | 'jpg'     // JPEG Image
  | 'jpeg'    // JPEG Image
  | 'png'     // PNG Image
  | 'pdf';    // PDF (scanned)

/**
 * Import kaynağı
 */
export type ImportSource = 
  | 'file_upload'       // Dosya yükleme
  | 'camera_capture'    // Kamera çekimi
  | 'drag_drop'         // Sürükle bırak
  | 'clipboard';        // Panoya yapıştır

// ==================== PARSED DATA ====================

/**
 * Parse edilmiş satır
 */
export interface ParsedRow {
  // Satır numarası (1-based)
  rowNumber: number;
  
  // Ham veri (tüm sütunlar)
  rawData: Record<string, unknown>;
  
  // Öğrenci tanımlayıcı (parse edilmiş)
  studentIdentifier: StudentIdentifier | null;
  
  // Cevaplar
  answers: ParsedAnswer[];
  
  // Kitapçık türü (A, B, C, D)
  bookletType: string | null;
  
  // Parse durumu
  status: ParsedRowStatus;
  
  // Hatalar
  errors: ParseError[];
  
  // Uyarılar
  warnings: ParseWarning[];
}

/**
 * Parse edilmiş satır durumu
 */
export type ParsedRowStatus = 
  | 'valid'       // Geçerli, işlenebilir
  | 'warning'     // Geçerli ama uyarı var
  | 'error'       // Hata var, işlenemez
  | 'skipped';    // Atlandı (header, boş satır)

/**
 * Öğrenci tanımlayıcı
 */
export interface StudentIdentifier {
  // Öğrenci numarası
  studentNo: string | null;
  
  // TC Kimlik No
  tcNo: string | null;
  
  // Ad Soyad
  fullName: string | null;
  
  // Ayrıştırılmış ad
  firstName: string | null;
  lastName: string | null;
  
  // Sınıf/Şube
  className: string | null;
  section: string | null;
}

/**
 * Parse edilmiş cevap
 */
export interface ParsedAnswer {
  // Soru numarası
  questionNumber: number;
  
  // Cevap (A, B, C, D, E veya boş)
  answer: string | null;
  
  // Ham değer
  rawValue: unknown;
  
  // Geçerli mi?
  isValid: boolean;
  
  // Birden fazla işaretleme?
  hasMultipleMarks: boolean;
}

/**
 * Parse hatası
 */
export interface ParseError {
  code: ParseErrorCode;
  message: string;
  column?: string;
  suggestion?: string;
}

/**
 * Parse uyarısı
 */
export interface ParseWarning {
  code: ParseWarningCode;
  message: string;
  column?: string;
}

/**
 * Parse hata kodları
 */
export type ParseErrorCode = 
  | 'MISSING_STUDENT_ID'
  | 'INVALID_STUDENT_ID'
  | 'DUPLICATE_STUDENT'
  | 'MISSING_ANSWERS'
  | 'INVALID_ANSWER_FORMAT'
  | 'ROW_PARSE_FAILED'
  | 'COLUMN_MISMATCH'
  | 'ENCODING_ERROR';

/**
 * Parse uyarı kodları
 */
export type ParseWarningCode = 
  | 'EMPTY_ANSWERS'
  | 'PARTIAL_ANSWERS'
  | 'SUSPICIOUS_PATTERN'
  | 'MULTIPLE_MARKS'
  | 'LOW_CONFIDENCE';

// ==================== COLUMN MAPPING ====================

/**
 * Kolon tipi
 */
export type ColumnType = 
  | 'student_no'      // Öğrenci numarası
  | 'tc_no'           // TC Kimlik No
  | 'full_name'       // Ad Soyad
  | 'first_name'      // Sadece ad
  | 'last_name'       // Sadece soyad
  | 'class'           // Sınıf
  | 'section'         // Şube
  | 'booklet_type'    // Kitapçık türü
  | 'answer'          // Cevap kolonu
  | 'answer_range'    // Cevap aralığı (başlangıç)
  | 'ignore'          // Atla
  | 'unknown';        // Belirsiz

/**
 * Kolon mapping
 */
export interface ColumnMapping {
  // Kaynak kolon adı (Excel'deki)
  sourceColumn: string;
  
  // Kaynak kolon indeksi (0-based)
  sourceIndex: number;
  
  // Hedef tip
  targetType: ColumnType;
  
  // Cevap kolonu ise soru numarası
  questionNumber?: number;
  
  // Otomatik tespit güveni (0-100)
  confidence: number;
  
  // Manuel mi belirlendi?
  isManual: boolean;
}

/**
 * Kolon mapping preset
 */
export interface ColumnMappingPreset {
  id: string;
  name: string;
  description?: string;
  deviceName?: string;
  mappings: ColumnMapping[];
  createdAt: string;
  usageCount: number;
}

/**
 * Kolon mapping sonucu
 */
export interface ColumnMappingResult {
  // Eşleştirmeler
  mappings: ColumnMapping[];
  
  // Otomatik tespit başarılı mı?
  autoDetected: boolean;
  
  // Güven skoru (0-100)
  confidence: number;
  
  // Eksik zorunlu kolonlar
  missingRequired: ColumnType[];
  
  // Öneriler
  suggestions: MappingSuggestion[];
}

/**
 * Mapping önerisi
 */
export interface MappingSuggestion {
  column: string;
  suggestedType: ColumnType;
  reason: string;
  confidence: number;
}

// ==================== STUDENT MATCHING ====================

/**
 * Öğrenci eşleştirme stratejisi
 */
export type MatchStrategy = 
  | 'student_no'      // Öğrenci numarası ile
  | 'tc_no'           // TC Kimlik ile
  | 'fuzzy_name'      // Fuzzy ad eşleştirme
  | 'manual';         // Manuel seçim

/**
 * Eşleştirme sonucu
 */
export interface MatchResult {
  // Eşleşen öğrenci ID
  studentId: string | null;
  
  // Eşleşen öğrenci bilgisi
  matchedStudent: MatchedStudentInfo | null;
  
  // Eşleştirme stratejisi
  strategy: MatchStrategy;
  
  // Güven skoru (0-100)
  confidence: number;
  
  // Kesin eşleşme mi?
  isExact: boolean;
  
  // Alternatif eşleşmeler
  alternatives: AlternativeMatch[];
  
  // Eşleşme durumu
  status: MatchStatus;
}

/**
 * Eşleşme durumu
 */
export type MatchStatus = 
  | 'matched'           // Kesin eşleşme
  | 'likely_match'      // Muhtemel eşleşme (onay gerekli)
  | 'ambiguous'         // Belirsiz (birden fazla aday)
  | 'not_found'         // Bulunamadı
  | 'manual_required';  // Manuel seçim gerekli

/**
 * Eşleşen öğrenci bilgisi
 */
export interface MatchedStudentInfo {
  id: string;
  studentNo: string;
  fullName: string;
  className: string;
  section: string | null;
  tcNo?: string;
}

/**
 * Alternatif eşleşme
 */
export interface AlternativeMatch {
  student: MatchedStudentInfo;
  confidence: number;
  matchedFields: string[];
  reason: string;
}

// ==================== VALIDATION ====================

/**
 * Preflight kontrol sonucu
 */
export interface PreflightResult {
  // Genel durum
  canProceed: boolean;
  
  // Dosya bilgisi
  fileInfo: FileInfo;
  
  // Satır özeti
  rowSummary: RowSummary;
  
  // Kolon analizi
  columnAnalysis: ColumnAnalysis;
  
  // Kritik hatalar (devam edilemez)
  criticalErrors: PreflightError[];
  
  // Uyarılar (devam edilebilir)
  warnings: PreflightWarning[];
  
  // Öneriler
  recommendations: string[];
}

/**
 * Dosya bilgisi
 */
export interface FileInfo {
  name: string;
  size: number;
  type: SupportedFileType;
  encoding?: string;
  sheetCount?: number;
  selectedSheet?: string;
}

/**
 * Satır özeti
 */
export interface RowSummary {
  totalRows: number;
  dataRows: number;
  headerRows: number;
  emptyRows: number;
  errorRows: number;
}

/**
 * Kolon analizi
 */
export interface ColumnAnalysis {
  totalColumns: number;
  detectedColumns: {
    type: ColumnType;
    column: string;
    sampleValues: string[];
  }[];
  unmappedColumns: string[];
}

/**
 * Preflight hatası
 */
export interface PreflightError {
  code: string;
  message: string;
  details?: string;
}

/**
 * Preflight uyarısı
 */
export interface PreflightWarning {
  code: string;
  message: string;
  affectedRows?: number;
}

// ==================== IMPORT RESULT ====================

/**
 * Import sonucu
 */
export interface ImportResult {
  // Başarı durumu
  success: boolean;
  
  // Özet
  summary: ImportSummary;
  
  // İşlenen öğrenciler
  processedStudents: ProcessedStudent[];
  
  // Hatalar
  errors: ImportError[];
  
  // Başlangıç/bitiş zamanı
  startedAt: string;
  completedAt: string;
  durationMs: number;
  
  // Post-processing durumu
  postProcessing: PostProcessingStatus;
}

/**
 * Import özeti
 */
export interface ImportSummary {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  skippedRows: number;
  
  // Eşleştirme özeti
  matchSummary: {
    exactMatches: number;
    fuzzyMatches: number;
    manualMatches: number;
    notFound: number;
  };
}

/**
 * İşlenen öğrenci
 */
export interface ProcessedStudent {
  // Import satırı
  rowNumber: number;
  
  // Öğrenci
  studentId: string;
  studentNo: string;
  studentName: string;
  
  // Eşleştirme
  matchStrategy: MatchStrategy;
  matchConfidence: number;
  
  // İşlem durumu
  status: 'success' | 'partial' | 'failed';
  
  // Cevap sayısı
  totalAnswers: number;
  validAnswers: number;
  
  // Hata/uyarı
  errors: string[];
  warnings: string[];
}

/**
 * Import hatası
 */
export interface ImportError {
  rowNumber: number;
  code: string;
  message: string;
  studentIdentifier?: string;
  recoverable: boolean;
}

/**
 * Post-processing durumu
 */
export interface PostProcessingStatus {
  // Analytics
  analyticsInvalidated: boolean;
  analyticsRecalculated: boolean;
  
  // AI
  aiSnapshotsGenerated: boolean;
  aiSnapshotCount: number;
  
  // PDF
  pdfsReady: boolean;
  
  // WhatsApp
  whatsappMessagesReady: boolean;
}

// ==================== UI STATE ====================

/**
 * Import wizard adımları
 */
export type ImportWizardStep = 
  | 'upload'          // Dosya yükleme
  | 'preview'         // Önizleme
  | 'mapping'         // Kolon eşleştirme
  | 'matching'        // Öğrenci eşleştirme
  | 'confirmation'    // Onay
  | 'processing'      // İşleniyor
  | 'complete';       // Tamamlandı

/**
 * Import wizard state
 */
export interface ImportWizardState {
  // Mevcut adım
  currentStep: ImportWizardStep;
  
  // Dosya bilgisi
  file: File | null;
  fileInfo: FileInfo | null;
  
  // Parse sonucu
  parsedData: ParsedRow[] | null;
  
  // Kolon mapping
  columnMapping: ColumnMappingResult | null;
  
  // Eşleştirmeler
  matchResults: Map<number, MatchResult> | null;
  
  // Manuel düzeltmeler
  manualCorrections: Map<number, string>;
  
  // Preflight sonucu
  preflightResult: PreflightResult | null;
  
  // Import sonucu
  importResult: ImportResult | null;
  
  // Loading state
  isLoading: boolean;
  loadingMessage: string;
  
  // Hata
  error: string | null;
}

// ==================== EVENTS ====================

/**
 * Import event
 */
export interface ImportEvent {
  type: ImportEventType;
  timestamp: string;
  data: unknown;
}

export type ImportEventType = 
  | 'file_uploaded'
  | 'parse_started'
  | 'parse_completed'
  | 'mapping_completed'
  | 'matching_started'
  | 'matching_completed'
  | 'import_started'
  | 'import_progress'
  | 'import_completed'
  | 'import_failed'
  | 'post_processing_started'
  | 'post_processing_completed';

// ==================== CONSTANTS ====================

/**
 * Geçerli cevap karakterleri
 */
export const VALID_ANSWERS = ['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'];

/**
 * Boş cevap göstergeleri
 */
export const EMPTY_ANSWER_VALUES = ['', '-', '.', 'X', 'x', '*', 'BOŞ', 'BOS', 'EMPTY', null, undefined];

/**
 * Kitapçık türleri
 */
export const BOOKLET_TYPES = ['A', 'B', 'C', 'D'];

/**
 * Zorunlu kolon tipleri
 */
export const REQUIRED_COLUMN_TYPES: ColumnType[] = ['student_no', 'answer'];

/**
 * Alternatif kolon adları (auto-detect için)
 */
export const COLUMN_NAME_ALIASES: Record<ColumnType, string[]> = {
  student_no: ['öğrenci no', 'ogrenci no', 'öğrenci numarası', 'no', 'numara', 'student_no', 'studentno', 'ogr_no', 'ogrno'],
  tc_no: ['tc', 'tc kimlik', 'tc no', 'kimlik no', 'tckn', 'tc_kimlik'],
  full_name: ['ad soyad', 'adsoyad', 'öğrenci adı', 'isim', 'name', 'fullname', 'ad_soyad'],
  first_name: ['ad', 'isim', 'first_name', 'firstname'],
  last_name: ['soyad', 'soyisim', 'last_name', 'lastname', 'surname'],
  class: ['sınıf', 'sinif', 'class', 'grade', 'sınıf düzeyi'],
  section: ['şube', 'sube', 'section', 'bölüm', 'bolum'],
  booklet_type: ['kitapçık', 'kitapcik', 'booklet', 'tip', 'type', 'kitapçık türü'],
  answer: ['cevap', 'answer', 'yanıt', 'yanit'],
  answer_range: ['cevaplar', 'answers'],
  ignore: [''],
  unknown: []
};

// ==================== EXPORT ====================

export default {
  VALID_ANSWERS,
  EMPTY_ANSWER_VALUES,
  BOOKLET_TYPES,
  REQUIRED_COLUMN_TYPES,
  COLUMN_NAME_ALIASES
};

