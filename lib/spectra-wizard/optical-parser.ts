// ============================================================================
// SPECTRA OPTİK FORM PARSER v2.0
// TXT/DAT dosya parse, K12Net ve özel format desteği
// Multi-encoding, Fuzzy matching, 15+ yayınevi şablonu
// ============================================================================

import type {
  OptikFormSablonu,
  ParsedOptikSatir,
  OptikParseResult,
  CevapSecenegi,
  KitapcikTuru,
  OptikHata,
  OptikHataTuru,
  HataSeviyesi,
  EslesmeDurumu,
  OptikEncoding,
  Cinsiyet,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// TÜRKÇE KARAKTER İŞLEMLERİ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Türkçe büyük harf dönüşümü
 */
export function turkishToUpperCase(text: string): string {
  if (!text) return '';
  return text
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase();
}

/**
 * Türkçe küçük harf dönüşümü
 */
export function turkishToLowerCase(text: string): string {
  if (!text) return '';
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase();
}

/**
 * Türkçe karakterleri ASCII'ye çevir (eşleştirme için)
 */
export function normalizeForMatching(text: string): string {
  if (!text) return '';
  return text
    .replace(/[İıIi]/g, 'i')
    .replace(/[ŞşSs]/g, 's')
    .replace(/[ĞğGg]/g, 'g')
    .replace(/[ÜüUu]/g, 'u')
    .replace(/[ÖöOo]/g, 'o')
    .replace(/[ÇçCc]/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Öğrenci adını temizle ve normalize et
 */
export function cleanName(name: string): string {
  if (!name) return '';
  // Baştaki ve ortadaki sayıları kaldır
  let cleaned = name
    .replace(/^[\d\s]+/, '')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return turkishToUpperCase(cleaned) || name;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY MATCHING (Akıllı Eşleştirme)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Levenshtein mesafesi hesapla
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Benzerlik skoru hesapla (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForMatching(str1);
  const s2 = normalizeForMatching(str2);
  
  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * İsim bölümlerini karşılaştır
 */
export function compareNames(optikAd: string, dbAd: string): number {
  const optikParts = normalizeForMatching(optikAd).split(/\s+/).filter(Boolean);
  const dbParts = normalizeForMatching(dbAd).split(/\s+/).filter(Boolean);
  
  if (optikParts.length === 0 || dbParts.length === 0) return 0;
  
  // Her parçayı eşleştir
  let matchedScore = 0;
  let matchedCount = 0;
  
  for (const optikPart of optikParts) {
    let bestMatch = 0;
    for (const dbPart of dbParts) {
      const similarity = calculateSimilarity(optikPart, dbPart);
      bestMatch = Math.max(bestMatch, similarity);
    }
    if (bestMatch >= 70) {
      matchedScore += bestMatch;
      matchedCount++;
    }
  }
  
  if (matchedCount === 0) return 0;
  
  // Eşleşen parça oranı
  const coverageScore = (matchedCount / Math.max(optikParts.length, dbParts.length)) * 100;
  
  return Math.round((matchedScore / matchedCount + coverageScore) / 2);
}

export interface MatchCandidate {
  id: string;
  ogrenciNo: string;
  ad: string;
  soyad: string;
  sinif?: string;
  score: number;
  matchType: 'exact_no' | 'exact_name' | 'fuzzy_name' | 'partial';
}

/**
 * Fuzzy öğrenci eşleştirme
 */
export function findBestMatches(
  optikSatir: ParsedOptikSatir,
  ogrenciListesi: { id: string; ogrenciNo: string; ad: string; soyad: string; sinif?: string }[],
  minScore: number = 70
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  
  for (const ogr of ogrenciListesi) {
    let score = 0;
    let matchType: MatchCandidate['matchType'] = 'partial';
    
    // 1. Öğrenci no tam eşleşme
    if (optikSatir.ogrenciNo === ogr.ogrenciNo) {
      score = 100;
      matchType = 'exact_no';
    }
    // 2. İsim tam eşleşme
    else {
      const fullDbName = `${ogr.ad} ${ogr.soyad}`;
      const exactNameMatch = normalizeForMatching(optikSatir.ogrenciAdi || '') === 
                             normalizeForMatching(fullDbName);
      
      if (exactNameMatch) {
        score = 95;
        matchType = 'exact_name';
      } else {
        // 3. Fuzzy name matching
        const nameScore = compareNames(optikSatir.ogrenciAdi || '', fullDbName);
        if (nameScore >= minScore) {
          score = nameScore;
          matchType = 'fuzzy_name';
        }
      }
    }
    
    // Sınıf bonus (aynı sınıftaysa +5)
    if (optikSatir.sinif && ogr.sinif && optikSatir.sinif === ogr.sinif) {
      score = Math.min(100, score + 5);
    }
    
    if (score >= minScore) {
      candidates.push({
        id: ogr.id,
        ogrenciNo: ogr.ogrenciNo,
        ad: ogr.ad,
        soyad: ogr.soyad,
        sinif: ogr.sinif,
        score,
        matchType,
      });
    }
  }
  
  // Skora göre sırala
  return candidates.sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCODING DÖNÜŞÜMÜ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Windows-1254 (Turkish) encoding haritası
 */
const WINDOWS_1254_MAP: Record<number, string> = {
  0xD0: 'Ğ', 0xDD: 'İ', 0xDE: 'Ş',
  0xF0: 'ğ', 0xFD: 'ı', 0xFE: 'ş',
  0xC7: 'Ç', 0xD6: 'Ö', 0xDC: 'Ü',
  0xE7: 'ç', 0xF6: 'ö', 0xFC: 'ü',
};

/**
 * Byte array'i Windows-1254'ten UTF-8'e dönüştür
 */
export function decodeWindows1254(bytes: Uint8Array): string {
  let result = '';
  for (const byte of bytes) {
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
    } else if (WINDOWS_1254_MAP[byte]) {
      result += WINDOWS_1254_MAP[byte];
    } else {
      result += String.fromCharCode(byte);
    }
  }
  return result;
}

/**
 * Encoding otomatik algılama
 */
export function detectEncoding(text: string): OptikEncoding {
  // UTF-8 BOM kontrolü
  if (text.charCodeAt(0) === 0xFEFF) return 'utf-8';
  
  // Türkçe karakter analizi
  const hasValidTurkish = /[ğüşöçıİĞÜŞÖÇ]/.test(text);
  const hasGarbled = /[\x80-\x9F]|ý|þ|Ð|Þ/.test(text);
  
  if (hasValidTurkish && !hasGarbled) return 'utf-8';
  if (hasGarbled) return 'windows-1254';
  
  return 'utf-8';
}

// ─────────────────────────────────────────────────────────────────────────────
// TC KİMLİK DOĞRULAMA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Türkiye TC Kimlik numarası doğrulama (11 hane algoritması)
 * @param tc TC Kimlik numarası (11 haneli string)
 * @returns Geçerli ise true, değilse false
 */
export function validateTCKimlik(tc: string): boolean {
  // 11 hane kontrolü
  if (!tc || tc.length !== 11) return false;
  
  // Sadece rakam kontrolü
  if (!/^\d{11}$/.test(tc)) return false;
  
  // İlk hane 0 olamaz
  if (tc[0] === '0') return false;
  
  const digits = tc.split('').map(Number);
  
  // 10. hane kontrolü: (Tek haneler * 7 - Çift haneler) mod 10
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const check10 = ((oddSum * 7) - evenSum) % 10;
  // Negatif mod düzeltme
  const check10Fixed = check10 < 0 ? check10 + 10 : check10;
  if (check10Fixed !== digits[9]) return false;
  
  // 11. hane kontrolü: İlk 10 hanenin toplamı mod 10
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) return false;
  
  return true;
}

/**
 * TC Kimlik doğrulama sonuç tipi
 */
export interface TCKimlikValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Detaylı TC Kimlik doğrulama
 */
export function validateTCKimlikDetailed(tc: string): TCKimlikValidationResult {
  if (!tc || tc.length === 0) {
    return { isValid: false, errorMessage: 'TC Kimlik numarası boş olamaz' };
  }
  
  if (tc.length !== 11) {
    return { isValid: false, errorMessage: `TC Kimlik 11 hane olmalı (girilen: ${tc.length})` };
  }
  
  if (!/^\d{11}$/.test(tc)) {
    return { isValid: false, errorMessage: 'TC Kimlik sadece rakam içermeli' };
  }
  
  if (tc[0] === '0') {
    return { isValid: false, errorMessage: 'TC Kimlik 0 ile başlayamaz' };
  }
  
  if (!validateTCKimlik(tc)) {
    return { isValid: false, errorMessage: 'TC Kimlik checksum doğrulaması başarısız' };
  }
  
  return { isValid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// TİPLİ HATA OLUŞTURMA
// ─────────────────────────────────────────────────────────────────────────────

function createError(
  tur: OptikHataTuru,
  seviye: HataSeviyesi,
  mesaj: string,
  satirNo?: number,
  alan?: string,
  oneri?: string
): OptikHata {
  return { tur, seviye, mesaj, satirNo, alan, oneri };
}

// ─────────────────────────────────────────────────────────────────────────────
// ANA PARSER FONKSİYONU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TXT/DAT dosyasını parse et
 */
export function parseOptikData(
  rawText: string,
  sablon: OptikFormSablonu
): OptikParseResult {
  const startTime = Date.now();
  const satirlar: ParsedOptikSatir[] = [];
  const hatalar: OptikHata[] = [];
  const uyarilar: OptikHata[] = [];
  
  // Encoding algıla ve dönüştür
  let text = rawText;
  const detectedEncoding = detectEncoding(rawText);
  if (detectedEncoding === 'windows-1254') {
    uyarilar.push(createError(
      'KARAKTER',
      'info',
      'Dosya Windows-1254 encoding ile algılandı, dönüştürülüyor',
      undefined,
      undefined,
      'Dosyayı UTF-8 olarak kaydedin'
    ));
  }
  
  // Satırlara ayır
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return {
      basarili: false,
      dosyaAdi: undefined,
      sablonAdi: sablon.ad,
      toplamSatir: 0,
      basariliSatir: 0,
      hataliSatir: 0,
      uyariSatir: 0,
      satirlar: [],
      hatalar: [createError('FORMAT', 'error', 'Dosya boş veya geçersiz format')],
      uyarilar: [],
      parseBaslangic: new Date(startTime).toISOString(),
      parseBitis: new Date().toISOString(),
      sureMilisaniye: Date.now() - startTime,
    };
  }

  let basariliSatir = 0;
  let hataliSatir = 0;
  let uyariSatir = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const satirNo = i + 1;

    try {
      const parsed = parseSingleLine(line, sablon, satirNo);
      
      const lineHatalar = parsed.hatalar.filter(h => 
        typeof h === 'object' && (h as OptikHata).seviye === 'error'
      );
      const lineUyarilar = parsed.hatalar.filter(h => 
        typeof h === 'object' && (h as OptikHata).seviye !== 'error'
      );
      
      if (lineHatalar.length > 0) {
        hataliSatir++;
        hatalar.push(...lineHatalar.map(h => typeof h === 'string' 
          ? createError('FORMAT', 'error', h, satirNo)
          : h as OptikHata
        ));
      } else if (lineUyarilar.length > 0) {
        uyariSatir++;
        basariliSatir++;
      } else {
        basariliSatir++;
      }

      satirlar.push(parsed);
    } catch (err: any) {
      hataliSatir++;
      hatalar.push(createError(
        'FORMAT',
        'error',
        `Parse hatası: ${err.message}`,
        satirNo,
        undefined,
        'Satır formatını kontrol edin'
      ));
      
      satirlar.push({
        satirNo,
        rawData: line,
        ogrenciNo: '',
        ogrenciAdi: '',
        kitapcik: 'A',
        cevaplar: [],
        hatalar: [createError('FORMAT', 'error', err.message, satirNo)],
        eslesmeDurumu: 'error',
      });
    }
  }

  // Satır uzunluğu kontrolü
  const expectedLength = sablon.satirUzunlugu;
  const shortLines = lines.filter(l => l.length < expectedLength * 0.8).length;
  if (shortLines > 0) {
    uyarilar.push(createError(
      'UZUNLUK',
      'warning',
      `${shortLines} satır beklenen uzunluktan kısa (beklenen: ${expectedLength})`,
      undefined,
      undefined,
      'Optik şablonu kontrol edin'
    ));
  }

  // Kitapçık çeşitliliği kontrolü
  const kitapcikler = new Set(satirlar.map(s => s.kitapcik));
  if (kitapcikler.size === 1 && satirlar.length > 10) {
    uyarilar.push(createError(
      'KITAPCIK',
      'info',
      `Tüm öğrenciler aynı kitapçık (${[...kitapcikler][0]})`,
      undefined,
      'kitapcik'
    ));
  }

  return {
    basarili: hataliSatir === 0,
    dosyaAdi: undefined,
    sablonAdi: sablon.ad,
    toplamSatir: lines.length,
    basariliSatir,
    hataliSatir,
    uyariSatir,
    satirlar,
    hatalar,
    uyarilar,
    parseBaslangic: new Date(startTime).toISOString(),
    parseBitis: new Date().toISOString(),
    sureMilisaniye: Date.now() - startTime,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEK SATIR PARSE
// ─────────────────────────────────────────────────────────────────────────────

function parseSingleLine(
  line: string,
  sablon: OptikFormSablonu,
  satirNo: number
): ParsedOptikSatir {
  const hatalar: (string | OptikHata)[] = [];
  const { alanlar } = sablon;

  // Substring helper (1-indexed to 0-indexed)
  const extract = (start: number, end: number): string => {
    const s = Math.max(0, start - 1);
    const e = Math.min(line.length, end);
    return line.substring(s, e).trim();
  };

  // Zorunlu alanlar
  const ogrenciNo = extract(alanlar.ogrenciNo.baslangic, alanlar.ogrenciNo.bitis);
  const ogrenciAdi = alanlar.ogrenciAdi 
    ? cleanName(extract(alanlar.ogrenciAdi.baslangic, alanlar.ogrenciAdi.bitis))
    : '';

  if (!ogrenciNo) {
    hatalar.push(createError('OGRENCI_NO', 'error', 'Öğrenci numarası boş', satirNo, 'ogrenciNo'));
  }

  // Opsiyonel alanlar
  const kurumKodu = alanlar.kurumKodu 
    ? extract(alanlar.kurumKodu.baslangic, alanlar.kurumKodu.bitis) 
    : undefined;
  
  const tcKimlik = alanlar.tcKimlik 
    ? extract(alanlar.tcKimlik.baslangic, alanlar.tcKimlik.bitis) 
    : undefined;
  
  const sinif = alanlar.sinif 
    ? extract(alanlar.sinif.baslangic, alanlar.sinif.bitis) 
    : undefined;

  // Kitapçık
  let kitapcik: KitapcikTuru = 'A';
  if (alanlar.kitapcik) {
    const kitapcikRaw = extract(alanlar.kitapcik.baslangic, alanlar.kitapcik.bitis).toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(kitapcikRaw)) {
      kitapcik = kitapcikRaw as KitapcikTuru;
    } else if (kitapcikRaw) {
      // Alternatif kodlamalar
      const kitapcikMap: Record<string, KitapcikTuru> = { 
        'K': 'A', 'L': 'B', 'M': 'C', 'N': 'D',
        '1': 'A', '2': 'B', '3': 'C', '4': 'D',
      };
      kitapcik = kitapcikMap[kitapcikRaw] || 'A';
      if (!kitapcikMap[kitapcikRaw]) {
        hatalar.push(createError(
          'KITAPCIK',
          'warning',
          `Bilinmeyen kitapçık kodu: "${kitapcikRaw}", A olarak ayarlandı`,
          satirNo,
          'kitapcik'
        ));
      }
    }
  }

  // Cinsiyet
  let cinsiyet: Cinsiyet | undefined;
  if (alanlar.cinsiyet) {
    const cinsiyetRaw = extract(alanlar.cinsiyet.baslangic, alanlar.cinsiyet.bitis).toUpperCase();
    if (cinsiyetRaw === 'E' || cinsiyetRaw === '1' || cinsiyetRaw === 'M') cinsiyet = 'E';
    else if (cinsiyetRaw === 'K' || cinsiyetRaw === '2' || cinsiyetRaw === 'F') cinsiyet = 'K';
  }

  // Cevaplar
  const cevaplarRaw = extract(alanlar.cevaplar.baslangic, alanlar.cevaplar.bitis);
  const cevaplar = parseCevaplarFromString(cevaplarRaw, sablon.toplamSoru);

  // Boş cevap kontrolü
  const bosCevapSayisi = cevaplar.filter(c => !c).length;
  if (bosCevapSayisi > sablon.toplamSoru * 0.5) {
    hatalar.push(createError(
      'CEVAP',
      'warning',
      `Çok fazla boş cevap: ${bosCevapSayisi}/${sablon.toplamSoru}`,
      satirNo,
      'cevaplar'
    ));
  }

  return {
    satirNo,
    rawData: line,
    kurumKodu,
    ogrenciNo,
    ogrenciAdi,
    tcKimlik,
    sinif,
    kitapcik,
    cinsiyet,
    cevaplar,
    hatalar,
    eslesmeDurumu: 'pending',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CEVAP STRING PARSE
// ─────────────────────────────────────────────────────────────────────────────

function parseCevaplarFromString(raw: string, toplamSoru: number): CevapSecenegi[] {
  const cevaplar: CevapSecenegi[] = [];
  
  for (let i = 0; i < toplamSoru; i++) {
    if (i < raw.length) {
      const char = raw[i].toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(char)) {
        cevaplar.push(char as CevapSecenegi);
      } else if (['1', '2', '3', '4', '5'].includes(char)) {
        // Sayı -> Harf dönüşümü
        const numToLetter: Record<string, CevapSecenegi> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
        cevaplar.push(numToLetter[char]);
      } else {
        cevaplar.push(null);
      }
    } else {
      cevaplar.push(null);
    }
  }
  
  return cevaplar;
}

// ─────────────────────────────────────────────────────────────────────────────
// HAZIR OPTİK ŞABLONLARI (15+ Yayınevi)
// ─────────────────────────────────────────────────────────────────────────────

export const OPTIK_SABLONLARI: OptikFormSablonu[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MEB STANDART ŞABLONLARI (4-12. SINIF)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'meb-4-sinif-standart',
    ad: 'MEB 4. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 4. sınıf standart optik formu',
    sinifSeviyeleri: ['4'],
    sinavTurleri: ['DENEME', 'KONU_TEST'],
    toplamSoru: 40,
    satirUzunlugu: 120,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 40 },
      sinif: { baslangic: 41, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 50, bitis: 89 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 15, soruSayisi: 15 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 15, bitis: 30, soruSayisi: 15 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 30, bitis: 40, soruSayisi: 10 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-5-sinif-standart',
    ad: 'MEB 5. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 5. sınıf standart optik formu',
    sinifSeviyeleri: ['5'],
    sinavTurleri: ['DENEME', 'KONU_TEST'],
    toplamSoru: 60,
    satirUzunlugu: 140,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 40 },
      sinif: { baslangic: 41, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 50, bitis: 109 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 15, soruSayisi: 15 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 15, bitis: 30, soruSayisi: 15 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 30, bitis: 45, soruSayisi: 15 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', baslangic: 45, bitis: 55, soruSayisi: 10 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 55, bitis: 60, soruSayisi: 5 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-6-sinif-standart',
    ad: 'MEB 6. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 6. sınıf standart optik formu',
    sinifSeviyeleri: ['6'],
    sinavTurleri: ['DENEME', 'KONU_TEST'],
    toplamSoru: 80,
    satirUzunlugu: 160,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 40 },
      sinif: { baslangic: 41, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 50, bitis: 129 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 20, soruSayisi: 20 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 20, bitis: 40, soruSayisi: 20 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 40, bitis: 55, soruSayisi: 15 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', baslangic: 55, bitis: 70, soruSayisi: 15 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 70, bitis: 80, soruSayisi: 10 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-7-sinif-standart',
    ad: 'MEB 7. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 7. sınıf standart optik formu',
    sinifSeviyeleri: ['7'],
    sinavTurleri: ['DENEME', 'KONU_TEST'],
    toplamSoru: 90,
    satirUzunlugu: 171,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 40 },
      sinif: { baslangic: 41, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 52, bitis: 141 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 20, soruSayisi: 20 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 20, bitis: 40, soruSayisi: 20 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 40, bitis: 60, soruSayisi: 20 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', baslangic: 60, bitis: 75, soruSayisi: 15 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 75, bitis: 90, soruSayisi: 15 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-8-sinif-lgs',
    ad: 'MEB 8. Sınıf LGS Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 8. sınıf LGS hazırlık standart optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 171,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciNo: { baslangic: 12, bitis: 21 },
      ogrenciAdi: { baslangic: 22, bitis: 51 },
      kurumKodu: { baslangic: 52, bitis: 59 },
      sinif: { baslangic: 60, bitis: 63 },
      kitapcik: { baslangic: 64, bitis: 64 },
      cevaplar: { baslangic: 65, bitis: 154 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 20, soruSayisi: 20 },
      { dersKodu: 'INK', dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük', baslangic: 20, bitis: 30, soruSayisi: 10 },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü ve Ahlak Bilgisi', baslangic: 30, bitis: 40, soruSayisi: 10 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 40, bitis: 50, soruSayisi: 10 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 50, bitis: 70, soruSayisi: 20 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 70, bitis: 90, soruSayisi: 20 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-9-sinif-standart',
    ad: 'MEB 9. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 9. sınıf standart optik formu',
    sinifSeviyeleri: ['9'],
    sinavTurleri: ['DENEME', 'KONU_TEST'],
    toplamSoru: 100,
    satirUzunlugu: 180,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 40 },
      sinif: { baslangic: 41, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 50, bitis: 149 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 25, soruSayisi: 25 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 25, bitis: 50, soruSayisi: 25 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 50, bitis: 70, soruSayisi: 20 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilimler', baslangic: 70, bitis: 90, soruSayisi: 20 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 90, bitis: 100, soruSayisi: 10 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-10-sinif-standart',
    ad: 'MEB 10. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 10. sınıf standart optik formu',
    sinifSeviyeleri: ['10'],
    sinavTurleri: ['DENEME', 'KONU_TEST'],
    toplamSoru: 100,
    satirUzunlugu: 180,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 40 },
      sinif: { baslangic: 41, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 50, bitis: 149 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 25, soruSayisi: 25 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 25, bitis: 50, soruSayisi: 25 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 50, bitis: 70, soruSayisi: 20 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilimler', baslangic: 70, bitis: 90, soruSayisi: 20 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 90, bitis: 100, soruSayisi: 10 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-11-sinif-standart',
    ad: 'MEB 11. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 11. sınıf TYT hazırlık standart optik formu',
    sinifSeviyeleri: ['11'],
    sinavTurleri: ['TYT', 'DENEME'],
    toplamSoru: 120,
    satirUzunlugu: 200,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciNo: { baslangic: 12, bitis: 21 },
      ogrenciAdi: { baslangic: 22, bitis: 51 },
      sinif: { baslangic: 52, bitis: 54 },
      kitapcik: { baslangic: 55, bitis: 55 },
      cevaplar: { baslangic: 60, bitis: 179 },
    },
    dersDagilimi: [
      { dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 40, soruSayisi: 40 },
      { dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', baslangic: 40, bitis: 60, soruSayisi: 20 },
      { dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', baslangic: 60, bitis: 100, soruSayisi: 40 },
      { dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', baslangic: 100, bitis: 120, soruSayisi: 20 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-12-sinif-standart',
    ad: 'MEB 12. Sınıf Standart',
    yayinevi: 'MEB',
    aciklama: 'Milli Eğitim Bakanlığı 12. sınıf YKS hazırlık standart optik formu',
    sinifSeviyeleri: ['12', 'mezun'],
    sinavTurleri: ['TYT', 'AYT_SAY', 'AYT_EA', 'AYT_SOZ', 'DENEME'],
    toplamSoru: 120,
    satirUzunlugu: 200,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciNo: { baslangic: 12, bitis: 21 },
      ogrenciAdi: { baslangic: 22, bitis: 51 },
      sinif: { baslangic: 52, bitis: 54 },
      kitapcik: { baslangic: 55, bitis: 55 },
      cevaplar: { baslangic: 60, bitis: 179 },
    },
    dersDagilimi: [
      { dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 40, soruSayisi: 40 },
      { dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', baslangic: 40, bitis: 60, soruSayisi: 20 },
      { dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', baslangic: 60, bitis: 100, soruSayisi: 40 },
      { dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', baslangic: 100, bitis: 120, soruSayisi: 20 },
    ],
    isDefault: true,
    isActive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEB RESMİ SINAV ŞABLONLARI
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'meb-lgs-resmi',
    ad: 'LGS - Resmi MEB Formatı',
    yayinevi: 'MEB (Resmi)',
    aciklama: 'Liselere Geçiş Sınavı resmi MEB optik form formatı',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS'],
    toplamSoru: 90,
    satirUzunlugu: 171,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciAdi: { baslangic: 12, bitis: 41 },
      kurumKodu: { baslangic: 42, bitis: 49 },
      ogrenciNo: { baslangic: 50, bitis: 59 },
      kitapcik: { baslangic: 60, bitis: 60 },
      cevaplar: { baslangic: 61, bitis: 150 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 20, soruSayisi: 20 },
      { dersKodu: 'INK', dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük', baslangic: 20, bitis: 30, soruSayisi: 10 },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü ve Ahlak Bilgisi', baslangic: 30, bitis: 40, soruSayisi: 10 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 40, bitis: 50, soruSayisi: 10 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 50, bitis: 70, soruSayisi: 20 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 70, bitis: 90, soruSayisi: 20 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-tyt-resmi',
    ad: 'TYT - Resmi ÖSYM Formatı',
    yayinevi: 'ÖSYM (Resmi)',
    aciklama: 'Temel Yeterlilik Testi resmi ÖSYM optik form formatı',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['TYT'],
    toplamSoru: 120,
    secenekSayisi: 5,
    satirUzunlugu: 200,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciAdi: { baslangic: 12, bitis: 41 },
      ogrenciNo: { baslangic: 42, bitis: 51 },
      kitapcik: { baslangic: 52, bitis: 52 },
      cevaplar: { baslangic: 60, bitis: 179 },
    },
    dersDagilimi: [
      { dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 40, soruSayisi: 40 },
      { dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', baslangic: 40, bitis: 60, soruSayisi: 20 },
      { dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', baslangic: 60, bitis: 100, soruSayisi: 40 },
      { dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', baslangic: 100, bitis: 120, soruSayisi: 20 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-ayt-sayisal-resmi',
    ad: 'AYT Sayısal - Resmi ÖSYM Formatı',
    yayinevi: 'ÖSYM (Resmi)',
    aciklama: 'Alan Yeterlilik Testi Sayısal resmi ÖSYM optik form formatı',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_SAY'],
    toplamSoru: 80,
    secenekSayisi: 5,
    satirUzunlugu: 165,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciAdi: { baslangic: 12, bitis: 41 },
      ogrenciNo: { baslangic: 42, bitis: 51 },
      kitapcik: { baslangic: 52, bitis: 52 },
      cevaplar: { baslangic: 55, bitis: 134 },
    },
    dersDagilimi: [
      { dersKodu: 'AYT_MAT', dersAdi: 'Matematik', baslangic: 0, bitis: 40, soruSayisi: 40 },
      { dersKodu: 'AYT_FIZ', dersAdi: 'Fizik', baslangic: 40, bitis: 54, soruSayisi: 14 },
      { dersKodu: 'AYT_KIM', dersAdi: 'Kimya', baslangic: 54, bitis: 67, soruSayisi: 13 },
      { dersKodu: 'AYT_BIY', dersAdi: 'Biyoloji', baslangic: 67, bitis: 80, soruSayisi: 13 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-ayt-sozel-resmi',
    ad: 'AYT Sözel - Resmi ÖSYM Formatı',
    yayinevi: 'ÖSYM (Resmi)',
    aciklama: 'Alan Yeterlilik Testi Sözel resmi ÖSYM optik form formatı',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_SOZ'],
    toplamSoru: 80,
    secenekSayisi: 5,
    satirUzunlugu: 165,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciAdi: { baslangic: 12, bitis: 41 },
      ogrenciNo: { baslangic: 42, bitis: 51 },
      kitapcik: { baslangic: 52, bitis: 52 },
      cevaplar: { baslangic: 55, bitis: 134 },
    },
    dersDagilimi: [
      { dersKodu: 'AYT_EDE', dersAdi: 'Türk Dili ve Edebiyatı', baslangic: 0, bitis: 24, soruSayisi: 24 },
      { dersKodu: 'AYT_TAR1', dersAdi: 'Tarih-1', baslangic: 24, bitis: 34, soruSayisi: 10 },
      { dersKodu: 'AYT_COG1', dersAdi: 'Coğrafya-1', baslangic: 34, bitis: 40, soruSayisi: 6 },
      { dersKodu: 'AYT_TAR2', dersAdi: 'Tarih-2', baslangic: 40, bitis: 51, soruSayisi: 11 },
      { dersKodu: 'AYT_COG2', dersAdi: 'Coğrafya-2', baslangic: 51, bitis: 62, soruSayisi: 11 },
      { dersKodu: 'AYT_FEL', dersAdi: 'Felsefe Grubu', baslangic: 62, bitis: 74, soruSayisi: 12 },
      { dersKodu: 'AYT_DIN', dersAdi: 'Din Kültürü', baslangic: 74, bitis: 80, soruSayisi: 6 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-ayt-ea-resmi',
    ad: 'AYT Eşit Ağırlık - Resmi ÖSYM Formatı',
    yayinevi: 'ÖSYM (Resmi)',
    aciklama: 'Alan Yeterlilik Testi Eşit Ağırlık resmi ÖSYM optik form formatı',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_EA'],
    toplamSoru: 80,
    secenekSayisi: 5,
    satirUzunlugu: 165,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciAdi: { baslangic: 12, bitis: 41 },
      ogrenciNo: { baslangic: 42, bitis: 51 },
      kitapcik: { baslangic: 52, bitis: 52 },
      cevaplar: { baslangic: 55, bitis: 134 },
    },
    dersDagilimi: [
      { dersKodu: 'AYT_EA_EDE', dersAdi: 'Türk Dili ve Edebiyatı', baslangic: 0, bitis: 24, soruSayisi: 24 },
      { dersKodu: 'AYT_EA_TAR', dersAdi: 'Tarih', baslangic: 24, bitis: 34, soruSayisi: 10 },
      { dersKodu: 'AYT_EA_COG', dersAdi: 'Coğrafya', baslangic: 34, bitis: 40, soruSayisi: 6 },
      { dersKodu: 'AYT_EA_MAT', dersAdi: 'Matematik', baslangic: 40, bitis: 80, soruSayisi: 40 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'meb-ydt-resmi',
    ad: 'YDT - Resmi ÖSYM Formatı',
    yayinevi: 'ÖSYM (Resmi)',
    aciklama: 'Yabancı Dil Testi resmi ÖSYM optik form formatı',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_DIL'],
    toplamSoru: 80,
    secenekSayisi: 5,
    satirUzunlugu: 160,
    alanlar: {
      tcKimlik: { baslangic: 1, bitis: 11 },
      ogrenciAdi: { baslangic: 12, bitis: 41 },
      ogrenciNo: { baslangic: 42, bitis: 51 },
      kitapcik: { baslangic: 52, bitis: 52 },
      cevaplar: { baslangic: 55, bitis: 134 },
    },
    dersDagilimi: [
      { dersKodu: 'YDT_ING', dersAdi: 'Yabancı Dil (İngilizce)', baslangic: 0, bitis: 80, soruSayisi: 80 },
    ],
    isDefault: true,
    isActive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LGS ŞABLONLARI (Yayınevi)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ozdebir-lgs-90',
    ad: 'ÖZDEBİR - LGS 90 Soru',
    yayinevi: 'Özdebir Yayınları',
    aciklama: 'Özdebir Yayınları LGS optik formu - 5-6-7-8. Sınıf',
    sinifSeviyeleri: ['5', '6', '7', '8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 171,
    encoding: 'windows-1254',
    satirSonu: 'CRLF',
    alanlar: {
      kurumKodu: { baslangic: 1, bitis: 10 },
      ogrenciNo: { baslangic: 11, bitis: 14 },
      tcKimlik: { baslangic: 15, bitis: 25 },
      sinif: { baslangic: 26, bitis: 27 },
      kitapcik: { baslangic: 28, bitis: 28 },
      cinsiyet: { baslangic: 29, bitis: 29 },
      ogrenciAdi: { baslangic: 30, bitis: 51 },
      cevaplar: { baslangic: 52, bitis: 171 },
    },
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 20, soruSayisi: 20 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', baslangic: 20, bitis: 30, soruSayisi: 10 },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü', baslangic: 30, bitis: 40, soruSayisi: 10 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', baslangic: 40, bitis: 50, soruSayisi: 10 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 50, bitis: 70, soruSayisi: 20 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 70, bitis: 90, soruSayisi: 20 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'nar-lgs-90',
    ad: 'NAR Yayınları - LGS 90 Soru',
    yayinevi: 'NAR Yayınları',
    aciklama: 'NAR Yayınları standart LGS deneme optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 173,
    alanlar: {
      ogrenciNo: { baslangic: 5, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      sinif: { baslangic: 36, bitis: 37 },
      kitapcik: { baslangic: 38, bitis: 38 },
      cevaplar: { baslangic: 53, bitis: 142 },
    },
    isDefault: true,
    isActive: true,
  },
  {
    id: 'fem-lgs-90',
    ad: 'FEM Yayınları - LGS 90 Soru',
    yayinevi: 'FEM Yayınları',
    aciklama: 'FEM Yayınları LGS deneme optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 165,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 8 },
      ogrenciAdi: { baslangic: 9, bitis: 33 },
      sinif: { baslangic: 34, bitis: 35 },
      kitapcik: { baslangic: 36, bitis: 36 },
      cevaplar: { baslangic: 40, bitis: 129 },
    },
    isDefault: true,
    isActive: true,
  },
  {
    id: 'bilgi-sarmal-lgs-90',
    ad: 'Bilgi Sarmal - LGS 90 Soru',
    yayinevi: 'Bilgi Sarmal',
    aciklama: 'Bilgi Sarmal LGS deneme optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 180,
    alanlar: {
      kurumKodu: { baslangic: 1, bitis: 6 },
      ogrenciNo: { baslangic: 7, bitis: 12 },
      ogrenciAdi: { baslangic: 13, bitis: 40 },
      sinif: { baslangic: 41, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 50, bitis: 139 },
    },
    isDefault: true,
    isActive: true,
  },
  {
    id: 'limit-lgs-90',
    ad: 'Limit Yayınları - LGS 90 Soru',
    yayinevi: 'Limit Yayınları',
    aciklama: 'Limit Yayınları LGS deneme optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 170,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      sinif: { baslangic: 36, bitis: 38 },
      kitapcik: { baslangic: 39, bitis: 39 },
      cevaplar: { baslangic: 45, bitis: 134 },
    },
    isDefault: true,
    isActive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYT ŞABLONLARI
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '3d-tyt-120',
    ad: '3D Yayınları - TYT 120 Soru',
    yayinevi: '3D Yayınları',
    aciklama: 'TYT tam deneme optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['TYT'],
    toplamSoru: 120,
    satirUzunlugu: 200,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      tcKimlik: { baslangic: 36, bitis: 46 },
      kitapcik: { baslangic: 47, bitis: 47 },
      cevaplar: { baslangic: 50, bitis: 169 },
    },
    dersDagilimi: [
      { dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 40, soruSayisi: 40 },
      { dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', baslangic: 40, bitis: 60, soruSayisi: 20 },
      { dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', baslangic: 60, bitis: 100, soruSayisi: 40 },
      { dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', baslangic: 100, bitis: 120, soruSayisi: 20 },
    ],
    isDefault: true,
    isActive: true,
  },
  {
    id: 'ozdebir-tyt-120',
    ad: 'ÖZDEBİR - TYT 120 Soru',
    yayinevi: 'Özdebir Yayınları',
    aciklama: 'Özdebir TYT tam deneme optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['TYT'],
    toplamSoru: 120,
    satirUzunlugu: 210,
    encoding: 'windows-1254',
    alanlar: {
      kurumKodu: { baslangic: 1, bitis: 10 },
      ogrenciNo: { baslangic: 11, bitis: 18 },
      tcKimlik: { baslangic: 19, bitis: 29 },
      ogrenciAdi: { baslangic: 30, bitis: 55 },
      kitapcik: { baslangic: 56, bitis: 56 },
      cevaplar: { baslangic: 60, bitis: 179 },
    },
    isDefault: true,
    isActive: true,
  },
  {
    id: 'acil-tyt-120',
    ad: 'Acil Yayınları - TYT 120 Soru',
    yayinevi: 'Acil Yayınları',
    aciklama: 'Acil Yayınları TYT deneme optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['TYT'],
    toplamSoru: 120,
    satirUzunlugu: 195,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 40 },
      kitapcik: { baslangic: 41, bitis: 41 },
      cevaplar: { baslangic: 45, bitis: 164 },
    },
    isDefault: true,
    isActive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT ŞABLONLARI
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '3d-ayt-80',
    ad: '3D Yayınları - AYT 80 Soru',
    yayinevi: '3D Yayınları',
    aciklama: 'AYT alan sınavı optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_SAY', 'AYT_EA', 'AYT_SOZ'],
    toplamSoru: 80,
    satirUzunlugu: 165,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      tcKimlik: { baslangic: 36, bitis: 46 },
      kitapcik: { baslangic: 47, bitis: 47 },
      cevaplar: { baslangic: 50, bitis: 129 },
    },
    isDefault: true,
    isActive: true,
  },
  {
    id: 'ozdebir-ayt-80',
    ad: 'ÖZDEBİR - AYT 80 Soru',
    yayinevi: 'Özdebir Yayınları',
    aciklama: 'Özdebir AYT alan sınavı optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_SAY', 'AYT_EA', 'AYT_SOZ'],
    toplamSoru: 80,
    satirUzunlugu: 175,
    encoding: 'windows-1254',
    alanlar: {
      kurumKodu: { baslangic: 1, bitis: 10 },
      ogrenciNo: { baslangic: 11, bitis: 18 },
      ogrenciAdi: { baslangic: 19, bitis: 45 },
      kitapcik: { baslangic: 46, bitis: 46 },
      cevaplar: { baslangic: 50, bitis: 129 },
    },
    isDefault: true,
    isActive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // YDT (YABANCI DİL TESTİ)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ydt-80',
    ad: 'Standart YDT 80 Soru',
    yayinevi: 'Genel',
    aciklama: 'Yabancı Dil Testi optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_DIL'],
    toplamSoru: 80,
    satirUzunlugu: 160,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      kitapcik: { baslangic: 36, bitis: 36 },
      cevaplar: { baslangic: 40, bitis: 119 },
    },
    isDefault: true,
    isActive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KISA DENEMELER
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'kisa-deneme-40',
    ad: 'Kısa Deneme 40 Soru',
    yayinevi: 'Genel',
    aciklama: '40 soruluk kısa deneme sınavı',
    sinifSeviyeleri: ['4', '5', '6', '7', '8'],
    sinavTurleri: ['DENEME', 'KONU_TEST'],
    toplamSoru: 40,
    satirUzunlugu: 100,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      sinif: { baslangic: 36, bitis: 38 },
      kitapcik: { baslangic: 39, bitis: 39 },
      cevaplar: { baslangic: 45, bitis: 84 },
    },
    isDefault: true,
    isActive: true,
  },
  {
    id: 'kisa-deneme-60',
    ad: 'Kısa Deneme 60 Soru',
    yayinevi: 'Genel',
    aciklama: '60 soruluk kısa deneme sınavı',
    sinifSeviyeleri: ['5', '6', '7', '8'],
    sinavTurleri: ['DENEME'],
    toplamSoru: 60,
    satirUzunlugu: 130,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      sinif: { baslangic: 36, bitis: 38 },
      kitapcik: { baslangic: 39, bitis: 39 },
      cevaplar: { baslangic: 45, bitis: 104 },
    },
    isDefault: true,
    isActive: true,
  },
  {
    id: 'konu-test-20',
    ad: 'Konu Testi 20 Soru',
    yayinevi: 'Genel',
    aciklama: 'Tek ders konu tarama testi',
    sinifSeviyeleri: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    sinavTurleri: ['KONU_TEST', 'KAZANIM_TEST'],
    toplamSoru: 20,
    satirUzunlugu: 80,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      sinif: { baslangic: 36, bitis: 38 },
      cevaplar: { baslangic: 45, bitis: 64 },
    },
    isDefault: true,
    isActive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // K12NET STANDART (Yaygın format)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'k12net-standart',
    ad: 'K12Net Standart Format',
    yayinevi: 'K12Net',
    aciklama: 'K12Net optik okuyucu standart formatı',
    sinifSeviyeleri: ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'mezun'],
    sinavTurleri: ['LGS', 'TYT', 'AYT_SAY', 'AYT_EA', 'AYT_SOZ', 'AYT_DIL', 'DENEME', 'YAZILI'],
    toplamSoru: 120,
    satirUzunlugu: 200,
    encoding: 'windows-1254',
    alanlar: {
      kurumKodu: { baslangic: 1, bitis: 10 },
      ogrenciNo: { baslangic: 11, bitis: 20 },
      tcKimlik: { baslangic: 21, bitis: 31 },
      ogrenciAdi: { baslangic: 32, bitis: 56 },
      sinif: { baslangic: 57, bitis: 59 },
      kitapcik: { baslangic: 60, bitis: 60 },
      cinsiyet: { baslangic: 61, bitis: 61 },
      cevaplar: { baslangic: 65, bitis: 184 },
    },
    isDefault: true,
    isActive: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ŞABLON ARAMA FONKSİYONLARI
// ─────────────────────────────────────────────────────────────────────────────

export function findMatchingSablon(
  sinavTuru: string,
  toplamSoru: number
): OptikFormSablonu | null {
  return OPTIK_SABLONLARI.find(
    s => s.sinavTurleri.includes(sinavTuru as any) && s.toplamSoru === toplamSoru
  ) || null;
}

export function getSablonlariByTur(sinavTuru: string): OptikFormSablonu[] {
  return OPTIK_SABLONLARI.filter(s => s.sinavTurleri.includes(sinavTuru as any));
}

export function getSablonlariByYayinevi(yayinevi: string): OptikFormSablonu[] {
  return OPTIK_SABLONLARI.filter(s => 
    normalizeForMatching(s.yayinevi).includes(normalizeForMatching(yayinevi))
  );
}

export function getSablonlaribySinif(sinifSeviyesi: string): OptikFormSablonu[] {
  return OPTIK_SABLONLARI.filter(s => s.sinifSeviyeleri.includes(sinifSeviyesi as any));
}

/**
 * Satır uzunluğuna göre en uygun şablonu bul
 */
export function autoDetectSablon(
  rawText: string,
  sinavTuru?: string,
  sinifSeviyesi?: string
): OptikFormSablonu | null {
  const lines = rawText.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return null;
  
  // Ortalama satır uzunluğu
  const avgLength = lines.reduce((s, l) => s + l.length, 0) / lines.length;
  
  // Uygun şablonları filtrele
  let candidates = OPTIK_SABLONLARI.filter(s => {
    const lengthDiff = Math.abs(s.satirUzunlugu - avgLength);
    return lengthDiff < 20; // ±20 karakter tolerans
  });
  
  if (sinavTuru) {
    const filtered = candidates.filter(s => s.sinavTurleri.includes(sinavTuru as any));
    if (filtered.length > 0) candidates = filtered;
  }
  
  if (sinifSeviyesi) {
    const filtered = candidates.filter(s => s.sinifSeviyeleri.includes(sinifSeviyesi as any));
    if (filtered.length > 0) candidates = filtered;
  }
  
  // En yakın uzunluğa sahip olanı döndür
  return candidates.sort((a, b) => 
    Math.abs(a.satirUzunlugu - avgLength) - Math.abs(b.satirUzunlugu - avgLength)
  )[0] || null;
}
