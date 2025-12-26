/**
 * 🎯 Smart Column Detector
 * Excel sütunlarını otomatik algılama
 */

import { DetectionResult, ExcelRow, ValidationWarning } from './types';
import { matchAllColumns, detectSubjectDistribution } from './fuzzyMatcher';
import { cleanText, turkishNormalize } from './turkish';

/**
 * Detect booklet columns (A_SORU_NO, B_SORU_NO, etc.)
 */
function detectKitapcikColumns(headers: string[]): DetectionResult['kitapciklar'] {
  const kitapciklar: DetectionResult['kitapciklar'] = [];
  
  // Common patterns for booklet columns
  const patterns = [
    /^([A-D])[-_\s]?SORU/i,
    /^([A-D])[-_\s]?NO/i,
    /^([A-D])[-_\s]?CEVAP/i,
    /^SORU[-_\s]?([A-D])/i,
    /^SORU\s*NO[-_\s]?([A-D])/i,
    /^CEVAP[-_\s]?([A-D])/i,
    /KİTAPÇIK[-_\s]?([A-D])/i,
    /KITAPCIK[-_\s]?([A-D])/i,
  ];
  
  const detected = new Map<string, any>();
  
  for (const header of headers) {
    const cleaned = cleanText(header).toUpperCase();
    const normalized = turkishNormalize(cleaned);
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern) || normalized.match(pattern);
      if (match) {
        const code = match[1].toUpperCase();
        
        if (!detected.has(code)) {
          detected.set(code, { code, soru_no_column: null, cevap_column: null });
        }
        
        const entry = detected.get(code)!;
        
        if (/SORU|NO/i.test(cleaned)) {
          entry.soru_no_column = header;
        }
        if (/CEVAP/i.test(cleaned)) {
          entry.cevap_column = header;
        }
      }
    }
  }
  
  // Convert to array, only keep entries with soru_no
  for (const entry of detected.values()) {
    if (entry.soru_no_column) {
      kitapciklar.push(entry);
    }
  }
  
  // Sort by code
  kitapciklar.sort((a, b) => a.code.localeCompare(b.code));
  
  return kitapciklar;
}

/**
 * Guess exam type based on data structure
 */
function guessExamType(
  data: ExcelRow[], 
  dersDagilimi: { dersAdi: string; soruSayisi: number }[]
): DetectionResult['tahminSinavTipi'] {
  
  // Count total questions
  const totalQuestions = dersDagilimi.reduce((sum, d) => sum + d.soruSayisi, 0);
  
  // Normalize subject names for comparison
  const normalize = (s: string) => turkishNormalize(cleanText(s).toUpperCase());
  
  const hasSubject = (keywords: string[]) => {
    return dersDagilimi.some(d => 
      keywords.some(k => normalize(d.dersAdi).includes(normalize(k)))
    );
  };
  
  const getSubjectCount = (keywords: string[]) => {
    const match = dersDagilimi.find(d => 
      keywords.some(k => normalize(d.dersAdi).includes(normalize(k)))
    );
    return match?.soruSayisi || 0;
  };
  
  // LGS pattern: 90 questions
  // Türkçe 20, Matematik 20, Fen 20, İnkılap 10, Din 10, İngilizce 10
  if (totalQuestions === 90) {
    const turkce = getSubjectCount(['TÜRKÇE', 'TURKCE']);
    const matematik = getSubjectCount(['MATEMATİK', 'MATEMATIK', 'MAT']);
    const fen = getSubjectCount(['FEN', 'FEN BİLİMLERİ', 'FEN BILIMLERI']);
    
    if (turkce === 20 && matematik === 20 && fen === 20) {
      return {
        tip: 'LGS',
        guven: 95,
        sebep: '90 soru tespit edildi (Türkçe 20, Matematik 20, Fen 20, Sosyal 10, Din 10, İngilizce 10)'
      };
    }
    
    // Still likely LGS if 90 questions
    if (hasSubject(['TÜRKÇE']) && hasSubject(['MATEMATİK']) && hasSubject(['FEN'])) {
      return {
        tip: 'LGS',
        guven: 85,
        sebep: '90 soru ve LGS dersleri tespit edildi'
      };
    }
  }
  
  // TYT pattern: 120 questions
  if (totalQuestions === 120) {
    return {
      tip: 'TYT',
      guven: 85,
      sebep: '120 soru tespit edildi (TYT standart soru sayısı)'
    };
  }
  
  // AYT pattern: 80 (sayısal) or 160 (tüm) questions
  if (totalQuestions === 80) {
    if (hasSubject(['MATEMATİK']) && hasSubject(['FİZİK', 'FIZIK'])) {
      return {
        tip: 'AYT',
        guven: 80,
        sebep: '80 soru - AYT Sayısal formatı'
      };
    }
  }
  
  if (totalQuestions === 160) {
    return {
      tip: 'AYT',
      guven: 75,
      sebep: '160 soru tespit edildi (AYT tam format)'
    };
  }
  
  // Custom
  return {
    tip: 'CUSTOM',
    guven: 100,
    sebep: `${totalQuestions} soru - Özel sınav formatı`
  };
}

/**
 * Main detection function
 */
export async function detectColumns(
  data: ExcelRow[]
): Promise<DetectionResult> {
  
  if (!data || data.length < 2) {
    throw new Error('Excel dosyası boş veya geçersiz');
  }
  
  const headers = Object.keys(data[0]);
  
  // 1. Fuzzy match columns
  const columnMatches = matchAllColumns(headers);
  
  // 2. Detect kitapçıklar
  const kitapciklar = detectKitapcikColumns(headers);
  
  // 3. Detect subject distribution
  const dersColumn = columnMatches.DERS?.fileColumn || headers.find(h => 
    /ders|alan|subject/i.test(turkishNormalize(h))
  );
  
  const dersDagilimi = dersColumn 
    ? detectSubjectDistribution(data, dersColumn)
    : [];
  
  // 4. Guess exam type
  const tahminSinavTipi = guessExamType(data, dersDagilimi);
  
  // 5. Collect warnings
  const warnings: ValidationWarning[] = [];
  
  // Check required fields
  if (!columnMatches.SORU_NO && !columnMatches.A_SORU_NO) {
    warnings.push({
      severity: 'ERROR',
      message: 'Soru numarası sütunu bulunamadı',
      suggestion: '"Soru No", "A Soru No" veya benzeri bir sütun ekleyin'
    });
  }
  
  if (!columnMatches.DERS) {
    warnings.push({
      severity: 'ERROR',
      message: 'Ders sütunu bulunamadı',
      suggestion: '"Ders Adı", "Alan" veya benzeri bir sütun ekleyin'
    });
  }
  
  if (!columnMatches.DOGRU_CEVAP && kitapciklar.length === 0) {
    warnings.push({
      severity: 'ERROR',
      message: 'Doğru cevap sütunu bulunamadı',
      suggestion: '"Doğru Cevap" veya kitapçık bazlı cevap sütunları ekleyin'
    });
  }
  
  // Check optional fields
  if (!columnMatches.KAZANIM_KODU) {
    warnings.push({
      severity: 'INFO',
      message: 'Kazanım kodu sütunu bulunamadı',
      suggestion: 'Detaylı konu analizi için "Kazanım Kodu" sütunu eklenebilir (opsiyonel)'
    });
  }
  
  if (!columnMatches.KAZANIM_METNI) {
    warnings.push({
      severity: 'INFO',
      message: 'Kazanım açıklaması sütunu bulunamadı',
      suggestion: 'Kazanım detayları için "Kazanım Metni" sütunu eklenebilir (opsiyonel)'
    });
  }
  
  // Check low confidence matches
  for (const [systemCol, match] of Object.entries(columnMatches)) {
    if (match.confidence < 80 && match.confidence >= 65) {
      warnings.push({
        severity: 'WARNING',
        column: match.fileColumn,
        message: `"${match.fileColumn}" → "${systemCol}" olarak eşleştirildi (güven: %${match.confidence})`,
        suggestion: 'Lütfen eşleştirmeyi onaylayın veya manuel olarak düzeltin'
      });
    }
  }
  
  return {
    columns: columnMatches,
    kitapciklar,
    tahminSinavTipi,
    dersDagilimi,
    warnings
  };
}

/**
 * Create column mapping from detection result
 */
export function createMappingFromDetection(detection: DetectionResult): {
  soru_no: string;
  ders: string;
  dogru_cevap: string;
  test_kodu?: string;
  kazanim_kodu?: string;
  kazanim_aciklama?: string;
  a_soru_no?: string;
  b_soru_no?: string;
  c_soru_no?: string;
  d_soru_no?: string;
} {
  return {
    soru_no: detection.columns.SORU_NO?.fileColumn || detection.columns.A_SORU_NO?.fileColumn || '',
    ders: detection.columns.DERS?.fileColumn || '',
    dogru_cevap: detection.columns.DOGRU_CEVAP?.fileColumn || '',
    test_kodu: detection.columns.TEST_KODU?.fileColumn,
    kazanim_kodu: detection.columns.KAZANIM_KODU?.fileColumn,
    kazanim_aciklama: detection.columns.KAZANIM_METNI?.fileColumn,
    a_soru_no: detection.columns.A_SORU_NO?.fileColumn,
    b_soru_no: detection.columns.B_SORU_NO?.fileColumn,
    c_soru_no: detection.columns.C_SORU_NO?.fileColumn,
    d_soru_no: detection.columns.D_SORU_NO?.fileColumn,
  };
}

