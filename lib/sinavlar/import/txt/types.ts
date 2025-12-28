/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TXT IMPORT TİPLERİ
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * İki farklı TXT formatı:
 * 
 * 1) OPTIC_RAW: 
 *    - Optik okuyucudan gelen ham veri
 *    - Satırda: öğrenci bilgisi + ham cevap işaretleri (A/B/C/D/E)
 *    - Puanlama motoru ile değerlendirilmeli
 * 
 * 2) REPORT_EXPORT:
 *    - Hazır rapor/sonuç dosyası
 *    - Satırda: öğrenci bilgisi + doğru/yanlış/boş/net/puan
 *    - Cevapları yeniden inşa ETME, direkt sonuçları al
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type TxtImportKind = 'OPTIC_RAW' | 'REPORT_EXPORT' | 'UNKNOWN';

export interface DetectResult {
  kind: TxtImportKind;
  reason: string;
  confidence: number; // 0..1
}

/**
 * REPORT_EXPORT'tan parse edilen ders bazlı sonuç
 */
export interface ReportLessonResult {
  dersKodu: string;
  dersAdi: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  basariOrani?: number;
}

/**
 * REPORT_EXPORT'tan parse edilen öğrenci sonucu
 * Cevap anahtarı ile yeniden puanlama YAPMAZ
 */
export interface ReportStudentResult {
  // Kimlik
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik?: 'A' | 'B' | 'C' | 'D';
  
  // Genel sonuçlar (direkt TXT'den)
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamPuan?: number;
  lgsPuani?: number;
  
  // Ders bazlı (varsa)
  dersler?: ReportLessonResult[];
  
  // Sıralama (varsa)
  genelSira?: number;
  sinifSira?: number;
  
  // Meta
  satırNo: number;
  hatalar: string[];
  isValid: boolean;
}

/**
 * REPORT_EXPORT parse sonucu
 */
export interface ReportParseResult {
  kind: 'REPORT_EXPORT';
  students: ReportStudentResult[];
  stats: {
    totalLines: number;
    successCount: number;
    errorCount: number;
  };
  warnings: string[];
  detectedColumns: string[];
}

