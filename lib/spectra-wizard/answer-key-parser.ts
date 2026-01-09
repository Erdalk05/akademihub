// ============================================================================
// SPECTRA CEVAP ANAHTARI PARSER v3.0
// Manuel giriş, toplu yapıştırma, Excel/CSV, kazanım entegrasyonu
// ============================================================================

import type {
  CevapAnahtari,
  CevapAnahtariItem,
  CevapSecenegi,
  DersDagilimi,
  KitapcikTuru,
  SinavTuru,
  SinifSeviyesi,
  Kazanim,
  IptalSoruMantigi,
  ExcelPreviewRow,
  ExcelPreviewData,
  TopluYapistirResult,
} from '@/types/spectra-wizard';
import { getSoruDersBilgisi, DERS_BILGILERI } from './exam-configs';

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
 * - "1 2 3 4 1 2 3 4" (sayılı - 1=A, 2=B, 3=C, 4=D, 5=E)
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
    .replace(/[^ABCDE12345]/g, ''); // Geçersiz karakterleri kaldır

  // Sayıları harflere çevir
  cleaned = cleaned
    .replace(/1/g, 'A')
    .replace(/2/g, 'B')
    .replace(/3/g, 'C')
    .replace(/4/g, 'D')
    .replace(/5/g, 'E');

  const cevaplar: CevapSecenegi[] = [];
  
  for (let i = 0; i < toplamSoru; i++) {
    if (i < cleaned.length) {
      const char = cleaned[i];
      if (char && ['A', 'B', 'C', 'D', 'E'].includes(char)) {
        cevaplar.push(char as CevapSecenegi);
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
        iptal: false,
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
    const dersBilgi = DERS_BILGILERI[ders.dersKodu];
    for (let i = 0; i < ders.soruSayisi; i++) {
      items.push({
        soruNo,
        dogruCevap: null,
        dersKodu: ders.dersKodu,
        dersAdi: ders.dersAdi || dersBilgi?.ad || ders.dersKodu,
        iptal: false,
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
    tamamlanmaOrani: 0,
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
  const newItems: CevapAnahtariItem[] = cevapAnahtari.items.map(item => {
    if (item.soruNo === soruNo) {
      if (kitapcik && kitapcik !== 'A') {
        // Kitapçık bazlı cevap güncelle
        const updatedKitapcikCevaplari: Record<KitapcikTuru, CevapSecenegi> = {
          A: item.kitapcikCevaplari?.A ?? item.dogruCevap,
          B: item.kitapcikCevaplari?.B ?? null,
          C: item.kitapcikCevaplari?.C ?? null,
          D: item.kitapcikCevaplari?.D ?? null,
        };
        updatedKitapcikCevaplari[kitapcik] = yeniCevap;
        
        return {
          ...item,
          kitapcikCevaplari: updatedKitapcikCevaplari,
        };
      }
      return { ...item, dogruCevap: yeniCevap };
    }
    return item;
  });

  // Tamamlanma oranını hesapla
  const doldurulan = newItems.filter(i => i.dogruCevap && !i.iptal).length;
  const tamamlanmaOrani = Math.round((doldurulan / newItems.length) * 100);

  return { ...cevapAnahtari, items: newItems, tamamlanmaOrani };
}

/**
 * Birden fazla sorunun cevabını toplu güncelle
 */
export function updateTopluCevap(
  cevapAnahtari: CevapAnahtari,
  guncellemeler: { soruNo: number; cevap: CevapSecenegi }[],
  kitapcik?: KitapcikTuru
): CevapAnahtari {
  let result = cevapAnahtari;
  for (const g of guncellemeler) {
    result = updateSoruCevap(result, g.soruNo, g.cevap, kitapcik);
  }
  return result;
}

/**
 * Soruya kazanım kodu ekle
 */
export function updateSoruKazanim(
  cevapAnahtari: CevapAnahtari,
  soruNo: number,
  kazanimKodu: string,
  kazanimAciklamasi?: string,
  konuAdi?: string
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (item.soruNo === soruNo) {
      return { ...item, kazanimKodu, kazanimAciklamasi, konuAdi };
    }
    return item;
  });

  return { ...cevapAnahtari, items: newItems };
}

/**
 * Birden fazla soruya kazanım ata
 */
export function updateTopluKazanim(
  cevapAnahtari: CevapAnahtari,
  atamalar: { soruNo: number; kazanimKodu: string; kazanimAciklamasi?: string }[]
): CevapAnahtari {
  let result = cevapAnahtari;
  for (const a of atamalar) {
    result = updateSoruKazanim(result, a.soruNo, a.kazanimKodu, a.kazanimAciklamasi);
  }
  return result;
}

/**
 * Soruyu iptal et
 */
export function iptalSoru(
  cevapAnahtari: CevapAnahtari,
  soruNo: number,
  iptal: boolean = true,
  iptalNedeni?: string,
  iptalPuanDagitimi?: IptalSoruMantigi
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (item.soruNo === soruNo) {
      return { ...item, iptal, iptalNedeni, iptalPuanDagitimi };
    }
    return item;
  });

  return { ...cevapAnahtari, items: newItems };
}

/**
 * Birden fazla soruyu iptal et
 */
export function iptalTopluSoru(
  cevapAnahtari: CevapAnahtari,
  soruNolar: number[],
  iptal: boolean = true,
  iptalNedeni?: string
): CevapAnahtari {
  let result = cevapAnahtari;
  for (const no of soruNolar) {
    result = iptalSoru(result, no, iptal, iptalNedeni);
  }
  return result;
}

/**
 * Zorluk derecesi güncelle
 */
export function updateSoruZorluk(
  cevapAnahtari: CevapAnahtari,
  soruNo: number,
  zorlukDerecesi: 1 | 2 | 3 | 4 | 5
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (item.soruNo === soruNo) {
      return { ...item, zorlukDerecesi };
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

/**
 * Kitapçık dönüşüm tablosu oluştur (B için A'daki sırası)
 */
export function createKitapcikDonusumTablosu(
  aKitapcik: CevapSecenegi[],
  bKitapcik: CevapSecenegi[]
): number[] {
  const tablo: number[] = [];
  
  for (let i = 0; i < bKitapcik.length; i++) {
    // B'deki i. soru, A'da kaçıncı soru?
    const bCevap = bKitapcik[i];
    let foundIndex = -1;
    
    for (let j = 0; j < aKitapcik.length; j++) {
      if (aKitapcik[j] === bCevap && !tablo.includes(j)) {
        foundIndex = j;
        break;
      }
    }
    
    tablo.push(foundIndex >= 0 ? foundIndex : i);
  }
  
  return tablo;
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
  konuAdi?: string;
  altKonuAdi?: string;
  zorlukDerecesi?: number;
  cozumVideoUrl?: string;
}

/**
 * Excel'den parse edilmiş satırları CevapAnahtariItem'a dönüştür
 */
export function parseExcelCevapAnahtari(
  rows: ExcelCevapAnahtariRow[],
  dersDagilimi: DersDagilimi[]
): { items: CevapAnahtariItem[]; hatalar: string[]; uyarilar: string[] } {
  const hatalar: string[] = [];
  const uyarilar: string[] = [];
  const items: CevapAnahtariItem[] = [];

  for (const row of rows) {
    const cevap = row.dogruCevap?.toUpperCase() as CevapSecenegi;
    
    if (cevap && !['A', 'B', 'C', 'D', 'E', ''].includes(cevap || '')) {
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

    // Zorluk derecesi kontrolü
    let zorlukDerecesi: 1 | 2 | 3 | 4 | 5 | undefined;
    if (row.zorlukDerecesi) {
      const z = Number(row.zorlukDerecesi);
      if (z >= 1 && z <= 5) {
        zorlukDerecesi = z as 1 | 2 | 3 | 4 | 5;
      } else {
        uyarilar.push(`Soru ${row.soruNo}: Geçersiz zorluk derecesi (1-5 arası olmalı)`);
      }
    }

    items.push({
      soruNo: row.soruNo,
      dogruCevap: cevap || null,
      dersKodu,
      dersAdi,
      kazanimKodu: row.kazanimKodu,
      kazanimAciklamasi: row.kazanimAciklamasi,
      konuAdi: row.konuAdi,
      altKonuAdi: row.altKonuAdi,
      zorlukDerecesi,
      cozumVideoUrl: row.cozumVideoUrl,
      iptal: false,
    });
  }

  return { items, hatalar, uyarilar };
}

/**
 * Excel kolon eşleştirme şablonu
 */
export const EXCEL_KOLON_SABLONU = {
  zorunlu: [
    { excel: 'Soru No', veritabani: 'soruNo' },
    { excel: 'Doğru Cevap', veritabani: 'dogruCevap' },
  ],
  opsiyonel: [
    { excel: 'Ders Kodu', veritabani: 'dersKodu' },
    { excel: 'Ders Adı', veritabani: 'dersAdi' },
    { excel: 'Kazanım Kodu', veritabani: 'kazanimKodu' },
    { excel: 'Kazanım Açıklaması', veritabani: 'kazanimAciklamasi' },
    { excel: 'Konu Adı', veritabani: 'konuAdi' },
    { excel: 'Alt Konu Adı', veritabani: 'altKonuAdi' },
    { excel: 'Zorluk (1-5)', veritabani: 'zorlukDerecesi' },
    { excel: 'Çözüm Video URL', veritabani: 'cozumVideoUrl' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// KAZANIM ENTEGRASYONU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MEB kazanım kodu formatını ayrıştır
 * Format: T.8.3.5 = Türkçe, 8. sınıf, 3. ünite, 5. kazanım
 */
export function parseKazanimKodu(kod: string): {
  dersKodu: string;
  sinifSeviyesi: string;
  uniteNo: number;
  kazanimNo: number;
} | null {
  const pattern = /^([A-ZÇĞİÖŞÜa-zçğıöşü]+)\.(\d+)\.(\d+)\.(\d+)$/;
  const match = kod.match(pattern);
  
  if (!match) return null;
  
  return {
    dersKodu: match[1].toUpperCase(),
    sinifSeviyesi: match[2],
    uniteNo: parseInt(match[3], 10),
    kazanimNo: parseInt(match[4], 10),
  };
}

/**
 * Kazanım kodu geçerliliğini kontrol et
 */
export function validateKazanimKodu(kod: string): { valid: boolean; mesaj: string } {
  if (!kod) return { valid: false, mesaj: 'Kazanım kodu boş' };
  
  const parsed = parseKazanimKodu(kod);
  if (!parsed) {
    return { 
      valid: false, 
      mesaj: 'Geçersiz format. Beklenen: T.8.3.5 (Ders.Sınıf.Ünite.Kazanım)' 
    };
  }
  
  // Sınıf seviyesi kontrolü
  const validSiniflar = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];
  if (!validSiniflar.includes(parsed.sinifSeviyesi)) {
    return { valid: false, mesaj: 'Geçersiz sınıf seviyesi' };
  }
  
  return { valid: true, mesaj: 'Geçerli kazanım kodu' };
}

/**
 * Cevap anahtarındaki kazanım eksiklerini bul
 */
export function findMissingKazanimlar(
  cevapAnahtari: CevapAnahtari
): { soruNo: number; dersKodu: string; dersAdi: string }[] {
  return cevapAnahtari.items
    .filter(item => !item.kazanimKodu && !item.iptal)
    .map(item => ({
      soruNo: item.soruNo,
      dersKodu: item.dersKodu,
      dersAdi: item.dersAdi,
    }));
}

/**
 * Kazanım istatistikleri
 */
export function getKazanimIstatistikleri(
  cevapAnahtari: CevapAnahtari
): {
  toplamSoru: number;
  kazanimliSoru: number;
  kazanimsizSoru: number;
  iptalSoru: number;
  tamamlanmaOrani: number;
  derseBazliDurum: { dersKodu: string; dersAdi: string; kazanimli: number; kazanimsiz: number }[];
} {
  const items = cevapAnahtari.items;
  const toplamSoru = items.length;
  const iptalSoru = items.filter(i => i.iptal).length;
  const kazanimliSoru = items.filter(i => i.kazanimKodu && !i.iptal).length;
  const kazanimsizSoru = items.filter(i => !i.kazanimKodu && !i.iptal).length;
  const tamamlanmaOrani = toplamSoru > 0 
    ? Math.round((kazanimliSoru / (toplamSoru - iptalSoru)) * 100) 
    : 0;

  // Ders bazlı durum
  const dersGruplari = new Map<string, { dersAdi: string; kazanimli: number; kazanimsiz: number }>();
  
  for (const item of items) {
    if (item.iptal) continue;
    
    if (!dersGruplari.has(item.dersKodu)) {
      dersGruplari.set(item.dersKodu, { dersAdi: item.dersAdi, kazanimli: 0, kazanimsiz: 0 });
    }
    
    const grup = dersGruplari.get(item.dersKodu)!;
    if (item.kazanimKodu) {
      grup.kazanimli++;
    } else {
      grup.kazanimsiz++;
    }
  }

  const derseBazliDurum = Array.from(dersGruplari.entries()).map(([dersKodu, data]) => ({
    dersKodu,
    ...data,
  }));

  return {
    toplamSoru,
    kazanimliSoru,
    kazanimsizSoru,
    iptalSoru,
    tamamlanmaOrani,
    derseBazliDurum,
  };
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
    kazanimliSoru: number;
    tamamlanmaOrani: number;
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
  const kazanimli = cevapAnahtari.items.filter(i => i.kazanimKodu && !i.iptal).length;
  const tamamlanmaOrani = beklenenToplamSoru > 0 
    ? Math.round((doldurulan / beklenenToplamSoru) * 100) 
    : 0;

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

  // Kazanım eksikliği
  if (kazanimli < doldurulan) {
    warnings.push(`${doldurulan - kazanimli} soruda kazanım kodu eksik`);
  }

  // Sıralama kontrolü
  const siralama = cevapAnahtari.items.map(i => i.soruNo);
  const siraliMi = siralama.every((no, i) => no === i + 1);
  if (!siraliMi) {
    warnings.push('Soru numaraları sıralı değil');
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
      kazanimliSoru: kazanimli,
      tamamlanmaOrani,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CEVAP ANAHTARI KOPYALAMA / KLONLAMA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cevap anahtarını kopyala (yeni ID ile)
 */
export function cloneCevapAnahtari(
  kaynak: CevapAnahtari,
  yeniOrganizationId?: string
): CevapAnahtari {
  return {
    ...kaynak,
    id: undefined, // Yeni ID alacak
    examId: undefined,
    organizationId: yeniOrganizationId || kaynak.organizationId,
    items: kaynak.items.map(item => ({ ...item })),
    dersSirasi: [...kaynak.dersSirasi],
    createdAt: undefined,
    updatedAt: undefined,
  };
}

/**
 * Sadece cevapları kopyala (kazanımlar hariç)
 */
export function copyCevaplarOnly(
  kaynak: CevapAnahtari,
  hedef: CevapAnahtari
): CevapAnahtari {
  const newItems = hedef.items.map((item, index) => {
    const kaynakItem = kaynak.items[index];
    return {
      ...item,
      dogruCevap: kaynakItem?.dogruCevap || item.dogruCevap,
      kitapcikCevaplari: kaynakItem?.kitapcikCevaplari || item.kitapcikCevaplari,
    };
  });

  return { ...hedef, items: newItems };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPLU YAPIŞTIRMA (GELİŞMİŞ)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format tipini otomatik algıla
 */
export function detectCevapFormat(input: string): 'continuous' | 'spaced' | 'numbered' | 'multiline' | 'mixed' {
  const lines = input.trim().split('\n').filter(l => l.trim());
  
  // Çok satırlı mı?
  if (lines.length > 5) {
    // Her satırda tek cevap var mı?
    const singleCharPerLine = lines.every(l => /^[ABCDE12345]$/i.test(l.trim()));
    if (singleCharPerLine) return 'multiline';
  }
  
  // Tek satır analizi
  const singleLine = input.replace(/\n/g, ' ').trim();
  
  // Sayılı format: 1 2 3 4 veya 1,2,3,4
  if (/^[\d\s,\-]+$/.test(singleLine) && /[12345]/.test(singleLine)) {
    return 'numbered';
  }
  
  // Boşluklu format: A B C D
  if (/^[ABCDE\s]+$/i.test(singleLine) && singleLine.includes(' ')) {
    return 'spaced';
  }
  
  // Sürekli format: ABCDABCD
  if (/^[ABCDE]+$/i.test(singleLine.replace(/\s/g, ''))) {
    return 'continuous';
  }
  
  return 'mixed';
}

/**
 * Gelişmiş toplu cevap parse
 * Farklı formatları otomatik algılar ve parse eder
 */
export function parseTopluCevap(
  input: string,
  toplamSoru: number
): TopluYapistirResult {
  const hatalar: string[] = [];
  const uyarilar: string[] = [];
  
  if (!input || !input.trim()) {
    return {
      cevaplar: [],
      hatalar: ['Boş giriş'],
      uyarilar: [],
      girilmisSayi: 0,
      beklenenSayi: toplamSoru,
      isValid: false,
      formatTipi: 'continuous',
    };
  }
  
  const formatTipi = detectCevapFormat(input);
  let cleaned = '';
  
  switch (formatTipi) {
    case 'multiline':
      // Her satır bir cevap
      cleaned = input
        .split('\n')
        .map(l => l.trim().toUpperCase())
        .filter(l => /^[ABCDE12345]$/.test(l))
        .join('');
      break;
      
    case 'numbered':
      // Sayıları harflere çevir
      cleaned = input
        .replace(/[,\-\s]+/g, '')
        .replace(/1/g, 'A')
        .replace(/2/g, 'B')
        .replace(/3/g, 'C')
        .replace(/4/g, 'D')
        .replace(/5/g, 'E');
      break;
      
    case 'spaced':
    case 'continuous':
    case 'mixed':
    default:
      // Standart temizleme
      cleaned = input
        .toUpperCase()
        .replace(/[,\-\s\n\r]+/g, '')
        .replace(/1/g, 'A')
        .replace(/2/g, 'B')
        .replace(/3/g, 'C')
        .replace(/4/g, 'D')
        .replace(/5/g, 'E')
        .replace(/[^ABCDE]/g, '');
      break;
  }
  
  const cevaplar: CevapSecenegi[] = [];
  
  for (let i = 0; i < toplamSoru; i++) {
    if (i < cleaned.length) {
      const char = cleaned[i];
      if (char && ['A', 'B', 'C', 'D', 'E'].includes(char)) {
        cevaplar.push(char as CevapSecenegi);
      } else {
        cevaplar.push(null);
        hatalar.push(`Soru ${i + 1}: Geçersiz karakter`);
      }
    } else {
      cevaplar.push(null);
    }
  }
  
  const girilmisSayi = cleaned.length;
  
  if (girilmisSayi < toplamSoru) {
    uyarilar.push(`${toplamSoru - girilmisSayi} soru eksik`);
  }
  if (girilmisSayi > toplamSoru) {
    uyarilar.push(`${girilmisSayi - toplamSoru} fazla cevap (kesildi)`);
  }
  
  // isValid: Hata yoksa ve EN AZ 1 cevap girildiyse geçerli
  // Eksik cevap varsa uyarı olarak gösterilir ama işleme izin verilir
  return {
    cevaplar,
    hatalar,
    uyarilar,
    girilmisSayi: Math.min(girilmisSayi, toplamSoru),
    beklenenSayi: toplamSoru,
    isValid: hatalar.length === 0 && girilmisSayi > 0,
    formatTipi,
  };
}

/**
 * Hatalı karakterleri vurgula (UI için)
 */
export function highlightInvalidChars(input: string): { text: string; isValid: boolean }[] {
  const result: { text: string; isValid: boolean }[] = [];
  const validChars = /[ABCDE12345\s,\-\n\r]/i;
  
  let currentText = '';
  let currentValid = true;
  
  for (const char of input) {
    const isValid = validChars.test(char);
    
    if (isValid === currentValid) {
      currentText += char;
    } else {
      if (currentText) {
        result.push({ text: currentText, isValid: currentValid });
      }
      currentText = char;
      currentValid = isValid;
    }
  }
  
  if (currentText) {
    result.push({ text: currentText, isValid: currentValid });
  }
  
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL/CSV PARSE (GELİŞMİŞ)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kolon adını otomatik eşleştir
 */
export function autoMapColumn(columnName: string): string | null {
  const normalized = columnName.toLowerCase().trim();
  
  const mappings: Record<string, string[]> = {
    'soruNo': ['soru no', 'soru', 'no', 'numara', 'soru numarası', 'question', 'q'],
    'dogruCevap': ['doğru cevap', 'dogru cevap', 'cevap', 'answer', 'doğru', 'correct'],
    'dersKodu': ['ders kodu', 'ders', 'derskodu', 'subject', 'kod'],
    'dersAdi': ['ders adı', 'ders adi', 'subject name'],
    'kazanimKodu': ['kazanım kodu', 'kazanim kodu', 'kazanım', 'kazanim', 'objective', 'learning outcome'],
    'kazanimMetni': ['kazanım metni', 'kazanim metni', 'kazanım açıklaması', 'description'],
    'kitapcik': ['kitapçık', 'kitapcik', 'booklet', 'form'],
  };
  
  for (const [field, aliases] of Object.entries(mappings)) {
    if (aliases.some(alias => normalized.includes(alias))) {
      return field;
    }
  }
  
  return null;
}

/**
 * Excel/CSV verilerini önizleme formatına çevir
 */
export function parseExcelToPreview(
  data: Record<string, any>[],
  columnMapping: Record<string, string>,
  dersDagilimi: DersDagilimi[]
): ExcelPreviewData {
  const rows: ExcelPreviewRow[] = [];
  let validRows = 0;
  let errorRows = 0;
  
  const columns = Object.keys(data[0] || {});
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const errors: string[] = [];
    
    // Soru No
    const soruNoField = Object.keys(columnMapping).find(k => columnMapping[k] === 'soruNo');
    const soruNo = soruNoField ? parseInt(row[soruNoField], 10) : i + 1;
    
    if (isNaN(soruNo) || soruNo < 1) {
      errors.push('Geçersiz soru numarası');
    }
    
    // Doğru Cevap
    const cevapField = Object.keys(columnMapping).find(k => columnMapping[k] === 'dogruCevap');
    const dogruCevap = cevapField ? String(row[cevapField] || '').toUpperCase().trim() : '';
    
    if (dogruCevap && !['A', 'B', 'C', 'D', 'E'].includes(dogruCevap)) {
      errors.push(`Geçersiz cevap: ${dogruCevap}`);
    }
    
    // Ders bilgisi
    const dersKoduField = Object.keys(columnMapping).find(k => columnMapping[k] === 'dersKodu');
    let dersKodu = dersKoduField ? String(row[dersKoduField] || '').toUpperCase().trim() : '';
    let dersAdi = '';
    
    // Ders bilgisi yoksa, soru numarasından bul
    if (!dersKodu && dersDagilimi.length > 0) {
      const ders = getSoruDersBilgisi(soruNo, dersDagilimi);
      if (ders) {
        dersKodu = ders.dersKodu;
        dersAdi = ders.dersAdi;
      }
    }
    
    // Kazanım
    const kazanimKoduField = Object.keys(columnMapping).find(k => columnMapping[k] === 'kazanimKodu');
    const kazanimKodu = kazanimKoduField ? String(row[kazanimKoduField] || '').trim() : undefined;
    
    const kazanimMetniField = Object.keys(columnMapping).find(k => columnMapping[k] === 'kazanimMetni');
    const kazanimMetni = kazanimMetniField ? String(row[kazanimMetniField] || '').trim() : undefined;
    
    // Kazanım format kontrolü
    if (kazanimKodu && !validateKazanimKodu(kazanimKodu).valid) {
      errors.push('Geçersiz kazanım formatı');
    }
    
    // Kitapçık
    const kitapcikField = Object.keys(columnMapping).find(k => columnMapping[k] === 'kitapcik');
    const kitapcikRaw = kitapcikField ? String(row[kitapcikField] || '').toUpperCase().trim() : undefined;
    const kitapcik = kitapcikRaw && ['A', 'B', 'C', 'D'].includes(kitapcikRaw) 
      ? kitapcikRaw as KitapcikTuru 
      : undefined;
    
    const hasError = errors.length > 0;
    if (hasError) {
      errorRows++;
    } else {
      validRows++;
    }
    
    rows.push({
      rowIndex: i,
      soruNo,
      dersKodu,
      dersAdi,
      dogruCevap: dogruCevap || undefined,
      kitapcik,
      kazanimKodu,
      kazanimMetni,
      hasError,
      errorMessage: errors.join(', '),
    });
  }
  
  return {
    fileName: '',
    rows,
    columns,
    mappedColumns: columnMapping,
    isValid: errorRows === 0,
    totalRows: rows.length,
    validRows,
    errorRows,
  };
}

/**
 * Önizleme satırlarını CevapAnahtariItem'a çevir
 */
export function convertPreviewToItems(
  preview: ExcelPreviewData,
  dersDagilimi: DersDagilimi[]
): { items: CevapAnahtariItem[]; hatalar: string[] } {
  const items: CevapAnahtariItem[] = [];
  const hatalar: string[] = [];
  
  // Soru numarasına göre sırala
  const sortedRows = [...preview.rows].sort((a, b) => a.soruNo - b.soruNo);
  
  for (const row of sortedRows) {
    if (row.hasError) {
      hatalar.push(`Soru ${row.soruNo}: ${row.errorMessage}`);
    }
    
    // Ders bilgisini bul veya önizlemeden al
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
      dogruCevap: (row.dogruCevap as CevapSecenegi) || null,
      dersKodu,
      dersAdi,
      kazanimKodu: row.kazanimKodu,
      kazanimAciklamasi: row.kazanimMetni,
      iptal: false,
    });
  }
  
  return { items, hatalar };
}

/**
 * Excel önizleme satırını güncelle
 */
export function updatePreviewRow(
  preview: ExcelPreviewData,
  rowIndex: number,
  updates: Partial<ExcelPreviewRow>
): ExcelPreviewData {
  const newRows = preview.rows.map(row => {
    if (row.rowIndex === rowIndex) {
      const updatedRow = { ...row, ...updates };
      
      // Hata durumunu yeniden hesapla
      const errors: string[] = [];
      if (updatedRow.dogruCevap && !['A', 'B', 'C', 'D', 'E'].includes(updatedRow.dogruCevap)) {
        errors.push('Geçersiz cevap');
      }
      if (updatedRow.kazanimKodu && !validateKazanimKodu(updatedRow.kazanimKodu).valid) {
        errors.push('Geçersiz kazanım formatı');
      }
      
      updatedRow.hasError = errors.length > 0;
      updatedRow.errorMessage = errors.join(', ');
      
      return updatedRow;
    }
    return row;
  });
  
  const errorRows = newRows.filter(r => r.hasError).length;
  const validRows = newRows.length - errorRows;
  
  return {
    ...preview,
    rows: newRows,
    isValid: errorRows === 0,
    errorRows,
    validRows,
  };
}

/**
 * Önizlemeden satır sil
 */
export function deletePreviewRow(
  preview: ExcelPreviewData,
  rowIndex: number
): ExcelPreviewData {
  const newRows = preview.rows.filter(row => row.rowIndex !== rowIndex);
  const errorRows = newRows.filter(r => r.hasError).length;
  
  return {
    ...preview,
    rows: newRows,
    totalRows: newRows.length,
    errorRows,
    validRows: newRows.length - errorRows,
    isValid: errorRows === 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPLU İŞLEMLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seçili soruları sil
 */
export function deleteSelectedItems(
  cevapAnahtari: CevapAnahtari,
  soruNolar: number[]
): CevapAnahtari {
  const newItems = cevapAnahtari.items.filter(item => !soruNolar.includes(item.soruNo));
  
  // Soru numaralarını yeniden düzenle
  const reorderedItems = newItems.map((item, index) => ({
    ...item,
    soruNo: index + 1,
  }));
  
  return {
    ...cevapAnahtari,
    items: reorderedItems,
    toplamSoru: reorderedItems.length,
  };
}

/**
 * Seçili sorulara toplu ders ata
 */
export function bulkUpdateDers(
  cevapAnahtari: CevapAnahtari,
  soruNolar: number[],
  dersKodu: string,
  dersAdi: string
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (soruNolar.includes(item.soruNo)) {
      return { ...item, dersKodu, dersAdi };
    }
    return item;
  });
  
  return { ...cevapAnahtari, items: newItems };
}

/**
 * Seçili sorulara toplu kazanım ata
 */
export function bulkUpdateKazanim(
  cevapAnahtari: CevapAnahtari,
  soruNolar: number[],
  kazanimKodu: string,
  kazanimAciklamasi?: string
): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => {
    if (soruNolar.includes(item.soruNo)) {
      return { ...item, kazanimKodu, kazanimAciklamasi };
    }
    return item;
  });
  
  return { ...cevapAnahtari, items: newItems };
}

/**
 * Tüm cevapları temizle
 */
export function clearAllAnswers(cevapAnahtari: CevapAnahtari): CevapAnahtari {
  const newItems = cevapAnahtari.items.map(item => ({
    ...item,
    dogruCevap: null,
    kitapcikCevaplari: undefined,
  }));
  
  return { ...cevapAnahtari, items: newItems, tamamlanmaOrani: 0 };
}

/**
 * Soru sırasını değiştir
 */
export function reorderItems(
  cevapAnahtari: CevapAnahtari,
  fromIndex: number,
  toIndex: number
): CevapAnahtari {
  const items = [...cevapAnahtari.items];
  const [removed] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, removed);
  
  // Soru numaralarını yeniden düzenle
  const reorderedItems = items.map((item, index) => ({
    ...item,
    soruNo: index + 1,
  }));
  
  return { ...cevapAnahtari, items: reorderedItems };
}
