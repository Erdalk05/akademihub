/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPORT EXPORT PARSER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * TXT dosyasındaki hazır sonuçları parse eder.
 * Cevapları yeniden inşa ETMEZ - direkt doğru/yanlış/net/puan değerlerini alır.
 * 
 * Desteklenen formatlar:
 * - Tab-separated (TSV)
 * - Comma-separated (CSV)
 * - Semicolon-separated
 * - Fixed-width rapor
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { ReportParseResult, ReportStudentResult, ReportLessonResult } from './types';

// ════════════════════════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Kolon adını normalize et (Türkçe karakter + lowercase)
 */
function normKey(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * String'i sayıya çevir (Türkçe ondalık: 12,50 → 12.5)
 */
function toNumber(v: string): number | null {
  if (!v || v.trim() === '' || v === '-') return null;
  // 12,50 veya 12.50
  const cleaned = v.replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Satır ayracını tespit et
 */
function detectDelimiter(line: string): RegExp {
  const tabCount = (line.match(/\t/g) || []).length;
  const semiCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  
  if (tabCount >= semiCount && tabCount >= commaCount && tabCount > 0) return /\t/;
  if (semiCount >= commaCount && semiCount > 0) return /;/;
  if (commaCount > 0) return /,/;
  
  // Çoklu boşluk (fixed-width benzeri)
  return /\s{2,}/;
}

/**
 * İsim temizleme ve büyük harfe çevirme
 */
function cleanName(name: string): string {
  if (!name) return '';
  
  let cleaned = name
    .replace(/^[\d\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Türkçe büyük harfe çevir
  return cleaned
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase();
}

// ════════════════════════════════════════════════════════════════════════════════
// KOLON EŞLEMESİ
// ════════════════════════════════════════════════════════════════════════════════

interface ColMap {
  // Kimlik
  studentNo?: number;
  name?: number;
  classCode?: number;
  booklet?: number;
  
  // Genel sonuçlar
  dogru?: number;
  yanlis?: number;
  bos?: number;
  net?: number;
  puan?: number;
  lgsPuani?: number;
  
  // Sıralama
  genelSira?: number;
  sinifSira?: number;
  
  // Ders bazlı (örn: tur_dogru, tur_net, mat_dogru, mat_net...)
  dersDogru: Record<string, number>;
  dersYanlis: Record<string, number>;
  dersBos: Record<string, number>;
  dersNet: Record<string, number>;
}

const DERS_KODLARI: Record<string, string> = {
  'turkce': 'TUR',
  'tur': 'TUR',
  'matematik': 'MAT',
  'mat': 'MAT',
  'fen': 'FEN',
  'fen_bilimleri': 'FEN',
  'sosyal': 'SOS',
  'sosyal_bilgiler': 'SOS',
  'inkilap': 'INK',
  't_c_inkilap': 'INK',
  'tarih': 'INK',
  'din': 'DIN',
  'din_kulturu': 'DIN',
  'ingilizce': 'ING',
  'ing': 'ING',
  'yabanci_dil': 'ING',
};

const DERS_ADLARI: Record<string, string> = {
  'TUR': 'Türkçe',
  'MAT': 'Matematik',
  'FEN': 'Fen Bilimleri',
  'SOS': 'Sosyal Bilgiler',
  'INK': 'T.C. İnkılap Tarihi',
  'DIN': 'Din Kültürü',
  'ING': 'İngilizce',
};

/**
 * Header kolonlarını analiz edip kolon haritası oluştur
 */
function buildColMap(headers: string[]): { colMap: ColMap; detectedColumns: string[] } {
  const colMap: ColMap = {
    dersDogru: {},
    dersYanlis: {},
    dersBos: {},
    dersNet: {},
  };
  
  const detectedColumns: string[] = [];
  
  headers.forEach((h, idx) => {
    const k = normKey(h);
    detectedColumns.push(k);
    
    // ═══════════════════════════════════════════════════════════════════════
    // KİMLİK KOLONLARI
    // ═══════════════════════════════════════════════════════════════════════
    if (['ogrenci_no', 'ogrencino', 'no', 'numara', 'student_no', 'ogrenci_numarasi'].includes(k)) {
      colMap.studentNo = idx;
    }
    if (['ad_soyad', 'adsoyad', 'ogrenci_adi', 'isim', 'name', 'ad', 'ogrenci'].includes(k)) {
      colMap.name = idx;
    }
    if (['sinif', 'sinif_sube', 'sube', 'class', 'sinif_no'].includes(k)) {
      colMap.classCode = idx;
    }
    if (['kitapcik', 'kitapcik_turu', 'booklet', 'kit'].includes(k)) {
      colMap.booklet = idx;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GENEL SONUÇ KOLONLARI
    // ═══════════════════════════════════════════════════════════════════════
    if (['dogru', 'toplam_dogru', 'd', 'dogru_sayisi'].includes(k)) {
      colMap.dogru = idx;
    }
    if (['yanlis', 'toplam_yanlis', 'y', 'yanlis_sayisi'].includes(k)) {
      colMap.yanlis = idx;
    }
    if (['bos', 'toplam_bos', 'b', 'bos_sayisi'].includes(k)) {
      colMap.bos = idx;
    }
    if (k === 'net' || k === 'toplam_net') {
      colMap.net = idx;
    }
    if (['puan', 'toplam_puan', 'skor', 'score'].includes(k)) {
      colMap.puan = idx;
    }
    if (['lgs_puani', 'lgs_puan', 'lgs', 'meb_puani'].includes(k)) {
      colMap.lgsPuani = idx;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SIRALAMA KOLONLARI
    // ═══════════════════════════════════════════════════════════════════════
    if (['genel_sira', 'sira', 'siralama', 'rank'].includes(k)) {
      colMap.genelSira = idx;
    }
    if (['sinif_sira', 'sinif_siralama', 'class_rank'].includes(k)) {
      colMap.sinifSira = idx;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // DERS BAZLI KOLONLAR
    // ═══════════════════════════════════════════════════════════════════════
    // Format: tur_dogru, tur_net, mat_dogru, mat_net, vs.
    for (const [pattern, dersKodu] of Object.entries(DERS_KODLARI)) {
      if (k.startsWith(pattern + '_') || k.startsWith(dersKodu.toLowerCase() + '_')) {
        if (k.includes('dogru') || k.endsWith('_d')) {
          colMap.dersDogru[dersKodu] = idx;
        }
        if (k.includes('yanlis') || k.endsWith('_y')) {
          colMap.dersYanlis[dersKodu] = idx;
        }
        if (k.includes('bos') || k.endsWith('_b')) {
          colMap.dersBos[dersKodu] = idx;
        }
        if (k.includes('net') || k.endsWith('_n')) {
          colMap.dersNet[dersKodu] = idx;
        }
      }
    }
  });
  
  return { colMap, detectedColumns };
}

// ════════════════════════════════════════════════════════════════════════════════
// ANA PARSER
// ════════════════════════════════════════════════════════════════════════════════

/**
 * REPORT_EXPORT TXT dosyasını parse et
 * 
 * Cevapları yeniden inşa ETMEZ!
 * Direkt doğru/yanlış/net/puan değerlerini alır.
 */
export function parseReportExportTxt(fileContent: string): ReportParseResult {
  const warnings: string[] = [];
  
  const lines = fileContent
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trimEnd())
    .filter(l => l.trim().length > 0);
  
  if (lines.length < 2) {
    return {
      kind: 'REPORT_EXPORT',
      students: [],
      stats: { totalLines: 0, successCount: 0, errorCount: 0 },
      warnings: ['Dosyada yeterli satır yok (en az header + 1 veri satırı gerekli)'],
      detectedColumns: [],
    };
  }
  
  // Ayracı tespit et
  const delim = detectDelimiter(lines[0]);
  
  // Header'ı parse et
  const headers = lines[0].split(delim).map(s => s.trim());
  const { colMap, detectedColumns } = buildColMap(headers);
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 REPORT_EXPORT PARSER');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Tespit edilen kolonlar:', detectedColumns.join(', '));
  console.log('   Öğrenci No kolonu:', colMap.studentNo);
  console.log('   Ad Soyad kolonu:', colMap.name);
  console.log('   Net kolonu:', colMap.net);
  console.log('   Puan kolonu:', colMap.puan);
  
  // Kritik kolon eksikse uyar
  if (colMap.studentNo == null) {
    warnings.push('⚠️ Öğrenci No kolonu bulunamadı. İlk kolon kullanılacak.');
  }
  if (colMap.name == null) {
    warnings.push('⚠️ Ad Soyad kolonu bulunamadı.');
  }
  if (colMap.net == null && colMap.dogru == null) {
    warnings.push('⚠️ Net veya Doğru kolonu bulunamadı. Sonuçlar eksik olabilir.');
  }
  
  // Veri satırlarını parse et
  const students: ReportStudentResult[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(delim).map(s => s.trim());
    const hatalar: string[] = [];
    
    // ═══════════════════════════════════════════════════════════════════════
    // KİMLİK BİLGİLERİ
    // ═══════════════════════════════════════════════════════════════════════
    let ogrenciNo = colMap.studentNo != null ? cols[colMap.studentNo] : cols[0];
    ogrenciNo = (ogrenciNo || '').replace(/\D/g, '') || ogrenciNo || '';
    
    if (!ogrenciNo || ogrenciNo.length < 1) {
      hatalar.push('Öğrenci numarası eksik');
    }
    
    const ogrenciAdi = colMap.name != null 
      ? cleanName(cols[colMap.name] || '') 
      : '';
    
    const sinif = colMap.classCode != null ? cols[colMap.classCode] : undefined;
    
    const kitapcikRaw = colMap.booklet != null ? cols[colMap.booklet] : '';
    const kitapcik = (['A', 'B', 'C', 'D'].includes(kitapcikRaw.toUpperCase()) 
      ? kitapcikRaw.toUpperCase() 
      : undefined) as 'A' | 'B' | 'C' | 'D' | undefined;
    
    // ═══════════════════════════════════════════════════════════════════════
    // GENEL SONUÇLAR (DİREKT PARSE - HESAPLAMA YOK)
    // ═══════════════════════════════════════════════════════════════════════
    const dogru = colMap.dogru != null ? toNumber(cols[colMap.dogru]) : null;
    const yanlis = colMap.yanlis != null ? toNumber(cols[colMap.yanlis]) : null;
    const bos = colMap.bos != null ? toNumber(cols[colMap.bos]) : null;
    const net = colMap.net != null ? toNumber(cols[colMap.net]) : null;
    const puan = colMap.puan != null ? toNumber(cols[colMap.puan]) : null;
    const lgsPuani = colMap.lgsPuani != null ? toNumber(cols[colMap.lgsPuani]) : null;
    
    // Sıralama
    const genelSira = colMap.genelSira != null ? toNumber(cols[colMap.genelSira]) : null;
    const sinifSira = colMap.sinifSira != null ? toNumber(cols[colMap.sinifSira]) : null;
    
    // ═══════════════════════════════════════════════════════════════════════
    // DERS BAZLI SONUÇLAR
    // ═══════════════════════════════════════════════════════════════════════
    const dersler: ReportLessonResult[] = [];
    
    const tespitEdilenDersler = new Set([
      ...Object.keys(colMap.dersDogru),
      ...Object.keys(colMap.dersYanlis),
      ...Object.keys(colMap.dersBos),
      ...Object.keys(colMap.dersNet),
    ]);
    
    for (const dersKodu of tespitEdilenDersler) {
      const dersDogru = colMap.dersDogru[dersKodu] != null 
        ? toNumber(cols[colMap.dersDogru[dersKodu]]) ?? 0 
        : 0;
      const dersYanlis = colMap.dersYanlis[dersKodu] != null 
        ? toNumber(cols[colMap.dersYanlis[dersKodu]]) ?? 0 
        : 0;
      const dersBos = colMap.dersBos[dersKodu] != null 
        ? toNumber(cols[colMap.dersBos[dersKodu]]) ?? 0 
        : 0;
      const dersNet = colMap.dersNet[dersKodu] != null 
        ? toNumber(cols[colMap.dersNet[dersKodu]]) 
        : null;
      
      dersler.push({
        dersKodu,
        dersAdi: DERS_ADLARI[dersKodu] || dersKodu,
        dogru: dersDogru,
        yanlis: dersYanlis,
        bos: dersBos,
        net: dersNet ?? (dersDogru - dersYanlis / 3),
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SONUÇ KAYDI
    // ═══════════════════════════════════════════════════════════════════════
    const isValid = hatalar.length === 0 && ogrenciNo.length > 0;
    
    if (isValid) {
      successCount++;
    } else {
      errorCount++;
    }
    
    students.push({
      ogrenciNo,
      ogrenciAdi,
      sinif,
      kitapcik,
      
      toplamDogru: dogru ?? 0,
      toplamYanlis: yanlis ?? 0,
      toplamBos: bos ?? 0,
      toplamNet: net ?? ((dogru ?? 0) - (yanlis ?? 0) / 3),
      toplamPuan: puan ?? undefined,
      lgsPuani: lgsPuani ?? puan ?? undefined,
      
      dersler: dersler.length > 0 ? dersler : undefined,
      
      genelSira: genelSira ?? undefined,
      sinifSira: sinifSira ?? undefined,
      
      satırNo: i + 1,
      hatalar,
      isValid,
    });
  }
  
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`   ✅ Başarılı: ${successCount}`);
  console.log(`   ❌ Hatalı: ${errorCount}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  return {
    kind: 'REPORT_EXPORT',
    students,
    stats: {
      totalLines: lines.length - 1,
      successCount,
      errorCount,
    },
    warnings,
    detectedColumns,
  };
}

