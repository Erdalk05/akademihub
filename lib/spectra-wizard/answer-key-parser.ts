// ============================================================================
// SPECTRA CEVAP ANAHTARI PARSER
// Manuel giriş, yapıştırma, dosya yükleme işlemleri
// ============================================================================

import type {
  CevapAnahtari,
  CevapAnahtariItem,
  CevapSecenegi,
  DersDagilimi,
  KitapcikTuru,
  SinavTuru,
  SinifSeviyesi,
} from '@/types/spectra-wizard';
import { getSoruDersBilgisi } from './exam-configs';

// ─────────────────────────────────────────────────────────────────────────────
// CEVAP STRING PARSE (ABCDABCD... formatı)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Yapıştırılan cevap stringini parse et
 * Kabul edilen formatlar:
 * - "ABCDABCD..." (boşluksuz)
 * - "A B C D A B C D" (boşluklu)
 * - "A,B,C,D,A,B,C,D" (virgüllü)
 * - "ABCD-ABCD" (tireli)
 */
export function parseCevapString(
  input: string,
  toplamSoru: number
): { cevaplar: CevapSecenegi[]; hatalar: string[] } {
  const hatalar: string[] = [];
  
  // Temizle ve normalize et
  let cleaned = input
    .toUpperCase()
    .replace(/[,\-\s]+/g, '') // Ayraçları kaldır
    .replace(/[^ABCDE]/g, ''); // Geçersiz karakterleri kaldır

  const cevaplar: CevapSecenegi[] = [];
  
  for (let i = 0; i < toplamSoru; i++) {
    if (i < cleaned.length) {
      const char = cleaned[i] as CevapSecenegi;
      if (['A', 'B', 'C', 'D', 'E'].includes(char)) {
        cevaplar.push(char);
      } else {
        cevaplar.push(null);
        hatalar.push(`Soru ${i + 1}: Geçersiz cevap "${char}"`);
      }
    } else {
      cevaplar.push(null); // Eksik soru
    }
  }

  if (cleaned.length < toplamSoru) {
    hatalar.push(`Uyarı: ${toplamSoru - cleaned.length} soru eksik girildi`);
  }
  if (cleaned.length > toplamSoru) {
    hatalar.push(`Uyarı: ${cleaned.length - toplamSoru} fazla cevap girildi, fazlalık kesildi`);
  }

  return { cevaplar, hatalar };
}

// ─────────────────────────────────────────────────────────────────────────────
// DERS BAZLI CEVAP PARSE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ders bazlı yapıştırma: Her ders için ayrı string
 */
export function parseDersBazliCevaplar(
  dersCevaplari: { dersKodu: string; cevapString: string }[],
  dersDagilimi: DersDagilimi[]
): { items: CevapAnahtariItem[]; hatalar: string[] } {
  const items: CevapAnahtariItem[] = [];
  const hatalar: string[] = [];
  let soruNo = 1;

  for (const ders of dersDagilimi) {
    const dersInput = dersCevaplari.find(d => d.dersKodu === ders.dersKodu);
    const cevapString = dersInput?.cevapString || '';
    
    const { cevaplar, hatalar: parseHatalar } = parseCevapString(cevapString, ders.soruSayisi);
    
    parseHatalar.forEach(h => hatalar.push(`${ders.dersAdi}: ${h}`));

    for (let i = 0; i < ders.soruSayisi; i++) {
      items.push({
        soruNo,
        dogruCevap: cevaplar[i] || null,
        dersKodu: ders.dersKodu,
        dersAdi: ders.dersAdi,
      });
      soruNo++;
    }
  }

  return { items, hatalar };
}

// ─────────────────────────────────────────────────────────────────────────────
// BOŞ CEVAP ANAHTARI OLUŞTUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verilen ders dağılımına göre boş cevap anahtarı oluştur
 */
export function createEmptyCevapAnahtari(
  organizationId: string,
  sinavTuru: SinavTuru,
  sinifSeviyesi: SinifSeviyesi,
  dersDagilimi: DersDagilimi[],
  kitapcikSayisi: number = 1
): CevapAnahtari {
  const items: CevapAnahtariItem[] = [];
  let soruNo = 1;

  for (const ders of dersDagilimi) {
    for (let i = 0; i < ders.soruSayisi; i++) {
      items.push({
        soruNo,
        dogruCevap: null,
        dersKodu: ders.dersKodu,
        dersAdi: ders.dersAdi,
      });
      soruNo++;
    }
  }

  const toplamSoru = items.length;

  return {
    organizationId,
    sinavTuru,
    sinifSeviyesi,
    toplamSoru,
    kitapcikSayisi,
    aktifKitapcik: 'A',
    items,
    dersSirasi: dersDagilimi.map(d => d.dersKodu),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CEVAP ANAHTARI GÜNCELLEME
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tek bir sorunun cevabını güncelle
 */
export function updateSoruCevap(
  cevapAnahtari: CevapAnahtari,
  soruNo: number,
  yeniCevap: CevapSecenegi,
  kitapcik?: KitapcikTuru
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (item.soruNo === soruNo) {
      if (kitapcik && kitapcik !== 'A') {
        // Kitapçık bazlı cevap güncelle
        return {
          ...item,
          kitapcikCevaplari: {
            ...item.kitapcikCevaplari,
            A: item.kitapcikCevaplari?.A || item.dogruCevap,
            [kitapcik]: yeniCevap,
          },
        };
      }
      return { ...item, dogruCevap: yeniCevap };
    }
    return item;
  });

  return { ...cevapAnahtari, items: newItems };
}

/**
 * Soruya kazanım kodu ekle
 */
export function updateSoruKazanim(
  cevapAnahtari: CevapAnahtari,
  soruNo: number,
  kazanimKodu: string,
  kazanimAciklamasi?: string
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (item.soruNo === soruNo) {
      return { ...item, kazanimKodu, kazanimAciklamasi };
    }
    return item;
  });

  return { ...cevapAnahtari, items: newItems };
}

/**
 * Soruyu iptal et
 */
export function iptalSoru(
  cevapAnahtari: CevapAnahtari,
  soruNo: number,
  iptal: boolean = true
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (item.soruNo === soruNo) {
      return { ...item, iptal };
    }
    return item;
  });

  return { ...cevapAnahtari, items: newItems };
}

// ─────────────────────────────────────────────────────────────────────────────
// KİTAPÇIK DÖNÜŞÜM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * B/C/D kitapçığı cevaplarını A kitapçığına dönüştür
 */
export function donusturKitapcikCevaplari(
  cevaplar: CevapSecenegi[],
  kitapcik: KitapcikTuru,
  donusumTablosu: number[] // B[i] -> A[donusumTablosu[i]]
): CevapSecenegi[] {
  if (kitapcik === 'A' || !donusumTablosu || donusumTablosu.length === 0) {
    return cevaplar;
  }

  const donusturulmusCevaplar: CevapSecenegi[] = new Array(cevaplar.length).fill(null);
  
  cevaplar.forEach((cevap, i) => {
    const aIndex = donusumTablosu[i];
    if (aIndex !== undefined && aIndex >= 0 && aIndex < cevaplar.length) {
      donusturulmusCevaplar[aIndex] = cevap;
    }
  });

  return donusturulmusCevaplar;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL IMPORT
// ─────────────────────────────────────────────────────────────────────────────

export interface ExcelCevapAnahtariRow {
  soruNo: number;
  dogruCevap: string;
  dersKodu?: string;
  dersAdi?: string;
  kazanimKodu?: string;
  kazanimAciklamasi?: string;
}

/**
 * Excel'den parse edilmiş satırları CevapAnahtariItem'a dönüştür
 */
export function parseExcelCevapAnahtari(
  rows: ExcelCevapAnahtariRow[],
  dersDagilimi: DersDagilimi[]
): { items: CevapAnahtariItem[]; hatalar: string[] } {
  const hatalar: string[] = [];
  const items: CevapAnahtariItem[] = [];

  for (const row of rows) {
    const cevap = row.dogruCevap?.toUpperCase() as CevapSecenegi;
    
    if (!['A', 'B', 'C', 'D', 'E', ''].includes(cevap || '')) {
      hatalar.push(`Soru ${row.soruNo}: Geçersiz cevap "${row.dogruCevap}"`);
    }

    // Ders bilgisini bul
    let dersKodu = row.dersKodu || '';
    let dersAdi = row.dersAdi || '';

    if (!dersKodu && dersDagilimi.length > 0) {
      const ders = getSoruDersBilgisi(row.soruNo, dersDagilimi);
      if (ders) {
        dersKodu = ders.dersKodu;
        dersAdi = ders.dersAdi;
      }
    }

    items.push({
      soruNo: row.soruNo,
      dogruCevap: cevap || null,
      dersKodu,
      dersAdi,
      kazanimKodu: row.kazanimKodu,
      kazanimAciklamasi: row.kazanimAciklamasi,
    });
  }

  return { items, hatalar };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOĞRULAMA
// ─────────────────────────────────────────────────────────────────────────────

export interface CevapAnahtariValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    toplamSoru: number;
    doldurulanSoru: number;
    bosKalanSoru: number;
    iptalSoru: number;
  };
}

/**
 * Cevap anahtarını doğrula
 */
export function validateCevapAnahtari(
  cevapAnahtari: CevapAnahtari,
  beklenenToplamSoru: number
): CevapAnahtariValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const doldurulan = cevapAnahtari.items.filter(i => i.dogruCevap && !i.iptal).length;
  const bos = cevapAnahtari.items.filter(i => !i.dogruCevap && !i.iptal).length;
  const iptal = cevapAnahtari.items.filter(i => i.iptal).length;

  // Soru sayısı kontrolü
  if (cevapAnahtari.items.length !== beklenenToplamSoru) {
    errors.push(`Beklenen ${beklenenToplamSoru} soru, ${cevapAnahtari.items.length} soru var`);
  }

  // Boş soru kontrolü
  if (bos > 0) {
    warnings.push(`${bos} soru boş bırakıldı`);
  }

  // İptal soru bilgisi
  if (iptal > 0) {
    warnings.push(`${iptal} soru iptal edildi`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      toplamSoru: cevapAnahtari.items.length,
      doldurulanSoru: doldurulan,
      bosKalanSoru: bos,
      iptalSoru: iptal,
    },
  };
}

