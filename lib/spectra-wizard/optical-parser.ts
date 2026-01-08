// ============================================================================
// SPECTRA OPTİK FORM PARSER
// TXT/DAT dosya parse, K12Net ve özel format desteği
// ============================================================================

import type {
  OptikFormSablonu,
  ParsedOptikSatir,
  OptikParseResult,
  CevapSecenegi,
  KitapcikTuru,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// TÜRKÇE BÜYÜK HARF DÖNÜŞÜMÜ
// ─────────────────────────────────────────────────────────────────────────────

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
 * Öğrenci adını temizle ve Türkçe büyük harfe çevir
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
// ANA PARSER FONKSİYONU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TXT/DAT dosyasını parse et
 */
export function parseOptikData(
  rawText: string,
  sablon: OptikFormSablonu
): OptikParseResult {
  const satirlar: ParsedOptikSatir[] = [];
  const hatalar: string[] = [];
  const uyarilar: string[] = [];
  
  // Satırlara ayır
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trimEnd()) // Sadece sondaki boşlukları temizle
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return {
      basarili: false,
      toplamSatir: 0,
      basariliSatir: 0,
      hataliSatir: 0,
      satirlar: [],
      hatalar: ['Dosya boş veya geçersiz format'],
      uyarilar: [],
    };
  }

  let basariliSatir = 0;
  let hataliSatir = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const satirNo = i + 1;

    try {
      const parsed = parseSingleLine(line, sablon, satirNo);
      
      if (parsed.hatalar.length > 0) {
        hataliSatir++;
        hatalar.push(...parsed.hatalar.map(h => `Satır ${satirNo}: ${h}`));
      } else {
        basariliSatir++;
      }

      satirlar.push(parsed);
    } catch (err: any) {
      hataliSatir++;
      hatalar.push(`Satır ${satirNo}: Parse hatası - ${err.message}`);
      
      // Hatalı satır için minimal kayıt oluştur
      satirlar.push({
        satirNo,
        rawData: line,
        ogrenciNo: '',
        ogrenciAdi: '',
        kitapcik: 'A',
        cevaplar: [],
        hatalar: [err.message],
      });
    }
  }

  // Satır uzunluğu kontrolü
  const expectedLength = sablon.satirUzunlugu;
  const shortLines = lines.filter(l => l.length < expectedLength * 0.9).length;
  if (shortLines > 0) {
    uyarilar.push(`${shortLines} satır beklenen uzunluktan kısa`);
  }

  return {
    basarili: hataliSatir === 0,
    toplamSatir: lines.length,
    basariliSatir,
    hataliSatir,
    satirlar,
    hatalar,
    uyarilar,
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
  const hatalar: string[] = [];
  const { alanlar } = sablon;

  // Substring helper (1-indexed to 0-indexed)
  const extract = (start: number, end: number): string => {
    const s = Math.max(0, start - 1);
    const e = Math.min(line.length, end);
    return line.substring(s, e).trim();
  };

  // Zorunlu alanlar
  const ogrenciNo = extract(alanlar.ogrenciNo.baslangic, alanlar.ogrenciNo.bitis);
  const ogrenciAdi = cleanName(extract(alanlar.ogrenciAdi.baslangic, alanlar.ogrenciAdi.bitis));

  if (!ogrenciNo) {
    hatalar.push('Öğrenci numarası boş');
  }
  if (!ogrenciAdi) {
    hatalar.push('Öğrenci adı boş');
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
      // Bazı sistemlerde K=A, L=B gibi kodlamalar olabilir
      const kitapcikMap: Record<string, KitapcikTuru> = { 'K': 'A', 'L': 'B', 'M': 'C', 'N': 'D' };
      kitapcik = kitapcikMap[kitapcikRaw] || 'A';
    }
  }

  // Cinsiyet
  let cinsiyet: 'E' | 'K' | undefined;
  if (alanlar.cinsiyet) {
    const cinsiyetRaw = extract(alanlar.cinsiyet.baslangic, alanlar.cinsiyet.bitis).toUpperCase();
    if (cinsiyetRaw === 'E' || cinsiyetRaw === '1') cinsiyet = 'E';
    else if (cinsiyetRaw === 'K' || cinsiyetRaw === '2') cinsiyet = 'K';
  }

  // Cevaplar
  const cevaplarRaw = extract(alanlar.cevaplar.baslangic, alanlar.cevaplar.bitis);
  const cevaplar = parseCevaplarFromString(cevaplarRaw, sablon.toplamSoru);

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
      } else {
        // Boş veya geçersiz karakter
        cevaplar.push(null);
      }
    } else {
      cevaplar.push(null);
    }
  }
  
  return cevaplar;
}

// ─────────────────────────────────────────────────────────────────────────────
// HAZIR OPTİK ŞABLONLARI
// ─────────────────────────────────────────────────────────────────────────────

export const OPTIK_SABLONLARI: OptikFormSablonu[] = [
  // ÖZDEBİR LGS 90 Soru
  {
    id: 'ozdebir-lgs-90',
    ad: 'ÖZDEBİR - LGS 90 Soru',
    yayinevi: 'Özdebir Yayınları',
    aciklama: 'Özdebir Yayınları LGS optik formu - 5-6-7-8. Sınıf',
    sinifSeviyeleri: ['5', '6', '7', '8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 171,
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
  },

  // NAR Yayınları LGS
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
  },

  // TYT 120 Soru
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
      { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 0, bitis: 40, soruSayisi: 40 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilimler', baslangic: 40, bitis: 60, soruSayisi: 20 },
      { dersKodu: 'MAT', dersAdi: 'Temel Matematik', baslangic: 60, bitis: 100, soruSayisi: 40 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', baslangic: 100, bitis: 120, soruSayisi: 20 },
    ],
    isDefault: true,
  },

  // AYT 80 Soru
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
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ŞABLON BULMA
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

