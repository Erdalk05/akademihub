/**
 * 📋 Excel Import Types
 * Smart Excel Mapper için tip tanımları
 */

export interface ExcelRow {
  [key: string]: any;
}

export interface ColumnMapping {
  // Required fields
  soru_no: string;           // Column name for question number
  ders: string;              // Column name for subject
  dogru_cevap: string;       // Column name for correct answer
  
  // Optional fields
  test_kodu?: string;        // Test code (if multiple tests)
  ana_konu?: string;         // Main topic
  alt_konu?: string;         // Sub topic
  kazanim_kodu?: string;     // Learning outcome code
  kazanim_aciklama?: string; // Learning outcome description
  
  // Kitapçık-specific (if multiple booklets)
  kitapcik?: string;         // A, B, C, D
  
  // Booklet-specific question numbers
  a_soru_no?: string;
  b_soru_no?: string;
  c_soru_no?: string;
  d_soru_no?: string;
}

export interface DetectionResult {
  // Detected columns with confidence
  columns: {
    [systemColumn: string]: {
      fileColumn: string;      // Actual column name in file
      confidence: number;      // 0-100
      alternatives: string[];  // Other possible matches
    };
  };
  
  // Detected booklets (A, B, C, D)
  kitapciklar: {
    code: string;              // 'A', 'B', 'C', 'D'
    soru_no_column: string;    // 'A_SORU_NO'
    cevap_column?: string;     // 'A_DOĞRU_CEVAP'
  }[];
  
  // Auto-detected exam type
  tahminSinavTipi: {
    tip: 'LGS' | 'TYT' | 'AYT' | 'CUSTOM';
    guven: number;             // 0-100
    sebep: string;             // Reasoning
  };
  
  // Subject distribution
  dersDagilimi: {
    dersAdi: string;
    soruSayisi: number;
    baslangicNo?: number;
    bitisNo?: number;
  }[];
  
  // Validation warnings
  warnings: ValidationWarning[];
}

export interface ValidationWarning {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  row?: number;              // Row number (1-indexed)
  column?: string;           // Column name
  value?: any;               // Problematic value
  message: string;           // User-friendly message
  suggestion?: string;       // How to fix
}

export interface ImportResult {
  success: number;           // Successfully imported rows
  failed: number;            // Failed rows
  warnings: number;          // Rows with warnings
  
  errors: ValidationWarning[];
  
  summary: {
    totalQuestions: number;
    bySubject: Record<string, number>;    // Questions per subject
    missingOutcomes: number;              // Questions without kazanım
    duplicates: number;                   // Duplicate question numbers
  };
  
  importedData?: any[];      // Successfully imported records
}

export interface FuzzyMatchConfig {
  target: string;            // System column name
  aliases: string[];         // Common variations
  threshold: number;         // Minimum similarity (0-1)
  caseSensitive: boolean;
  turkishNormalize: boolean;
}

export interface ParsedQuestion {
  soruNo: number;
  testKodu?: string;
  dersAdi: string;
  dogruCevap: string;
  kazanimKodu?: string;
  kazanimMetni?: string;
  anaKonu?: string;
  altKonu?: string;
  kitapcikSoruNo?: {
    A?: number;
    B?: number;
    C?: number;
    D?: number;
  };
}

