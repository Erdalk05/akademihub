/**
 * 🎯 LGS KİTAPÇIK BAZLI PUANLAMA MOTORU
 * 
 * K12 Standartlarına Uygun Değerlendirme Sistemi
 * 
 * ÖZELLİKLER:
 * - A/B Kitapçık dönüşümü
 * - Net hesaplama (3 yanlış = 1 doğru götürür)
 * - Katsayılı puan hesaplama
 * - Vektörize işlemler (yüksek performans)
 */

// ============ TİP TANIMLARI ============

export interface CevapAnahtariSatir {
  siraNo: number;           // Excel satır sırası (1, 2, 3...)
  dersAdi: string;          // "Türkçe", "Matematik"...
  dersKodu: string;         // "TUR", "MAT", "FEN"...
  aSoruNo: number;          // A kitapçığındaki soru numarası
  bSoruNo: number;          // B kitapçığındaki karşılık gelen soru no
  cSoruNo?: number;         // C kitapçığı (opsiyonel)
  dSoruNo?: number;         // D kitapçığı (opsiyonel)
  dogruCevap: string;       // "A", "B", "C", "D", "E"
  soruDegeri: number;       // Genelde 1
  kazanimKodu?: string;
  kazanimMetni?: string;
}

export interface OgrenciCevap {
  ogrenciId: string;
  ogrenciNo: string;
  ogrenciAdi: string;
  kitapcikTipi: 'A' | 'B' | 'C' | 'D';
  cevaplar: string;         // "ADBABADBA..." (90 karakter)
  sinif?: string;
  sube?: string;
}

export interface DersSonuc {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  basariYuzdesi: number;
}

export interface OgrenciSonuc {
  ogrenciId: string;
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  sube?: string;
  kitapcikTipi: string;
  dersler: DersSonuc[];
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  
  // ═══════════════════════════════════════════════════════════
  // MEB 100-500 PUAN HESAPLAMA DEĞERLERİ
  // ═══════════════════════════════════════════════════════════
  hamPuan: number;          // Katsayısız toplam net (max 90)
  agirlikliHamPuan: number; // Ağırlıklı ham puan (max 270)
  olceklenmisKatki: number; // Ölçeklenmiş katkı (max 400)
  lgsPuani: number;         // Final LGS Puanı (100-500)
  
  spiPuani?: number;        // Standart Puan (opsiyonel)
  siralama?: number;
  
  // Geriye uyumluluk
  agirlikliPuan: number;    // lgsPuani ile aynı (eski kod için)
}

// ============ LGS YAPILANDIRMASI (MEB STANDARDI) ============

export const LGS_CONFIG = {
  // ═══════════════════════════════════════════════════════════
  // MEB 100-500 PUAN SKALASI
  // ═══════════════════════════════════════════════════════════
  tabanPuan: 100.0,              // Minimum puan (0 net bile olsa)
  maxFinalPuan: 500.0,           // Maximum puan (90 doğru = 500)
  toplamKatsayiAgirligi: 270.0,  // Max ham puan: (20×4)+(20×4)+(20×4)+(10×1)+(10×1)+(10×1)
  olceklemeFaktoru: 400.0,       // 500 - 100 = 400 (ölçekleme aralığı)
  
  toplamSoru: 90,
  
  // Net hesaplama kuralı
  yanlisKatsayisi: 3,  // 3 yanlış = 1 doğru götürür
  
  // ═══════════════════════════════════════════════════════════
  // DERS YAPILANDIRMASI (MEB STANDART SIRALAMASI)
  // ═══════════════════════════════════════════════════════════
  // Max Ham Puan = (20×4) + (20×4) + (20×4) + (10×1) + (10×1) + (10×1) = 270
  // ═══════════════════════════════════════════════════════════
  dersler: [
    { kod: 'TUR', ad: 'Türkçe', soruSayisi: 20, baslangic: 1, bitis: 20, katsayi: 4.0, maxNet: 20, maxKatki: 80 },
    { kod: 'INK', ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, baslangic: 21, bitis: 30, katsayi: 1.0, maxNet: 10, maxKatki: 10 },
    { kod: 'DIN', ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, baslangic: 31, bitis: 40, katsayi: 1.0, maxNet: 10, maxKatki: 10 },
    { kod: 'ING', ad: 'İngilizce', soruSayisi: 10, baslangic: 41, bitis: 50, katsayi: 1.0, maxNet: 10, maxKatki: 10 },
    { kod: 'MAT', ad: 'Matematik', soruSayisi: 20, baslangic: 51, bitis: 70, katsayi: 4.0, maxNet: 20, maxKatki: 80 },
    { kod: 'FEN', ad: 'Fen Bilimleri', soruSayisi: 20, baslangic: 71, bitis: 90, katsayi: 4.0, maxNet: 20, maxKatki: 80 },
  ],
  
  // Ders kodu eşleştirme
  dersKoduMap: {
    'TÜRKÇE': 'TUR',
    'TURKCE': 'TUR',
    'TUR': 'TUR',
    'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK': 'INK',
    'T.C. INKILAP TARIHI VE ATATÜRKÇÜLÜK': 'INK',
    'İNKILAP': 'INK',
    'INKILAP': 'INK',
    'INK': 'INK',
    'SOSYAL BİLGİLER': 'SOS',
    'SOSYAL BILGILER': 'SOS',
    'SOSYAL': 'SOS',
    'SOS': 'SOS',
    'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ': 'DIN',
    'DIN KULTURU VE AHLAK BILGISI': 'DIN',
    'DİN KÜLTÜRÜ': 'DIN',
    'DIN KULTURU': 'DIN',
    'DİN': 'DIN',
    'DIN': 'DIN',
    'İNGİLİZCE': 'ING',
    'INGILIZCE': 'ING',
    'ING': 'ING',
    'MATEMATİK': 'MAT',
    'MATEMATIK': 'MAT',
    'MAT': 'MAT',
    'FEN BİLİMLERİ': 'FEN',
    'FEN BILIMLERI': 'FEN',
    'FEN': 'FEN',
  } as Record<string, string>
};

// ═══════════════════════════════════════════════════════════════════════════
// ÖZDEBİR LGS DERS SIRALAMASI
// ═══════════════════════════════════════════════════════════════════════════
// Özdebir optik formundaki cevap dizisindeki ders sıralaması ve pozisyonları
// 150 karakterlik cevap alanından 90 soru çıkarılır
// ═══════════════════════════════════════════════════════════════════════════
export const OZDEBIR_DERS_DAGILIMI = [
  { kod: 'TUR', ad: 'Türkçe', soruSayisi: 20, baslangic: 0, bitis: 20, katsayi: 4.0 },
  { kod: 'SOS', ad: 'Sosyal Bilgiler', soruSayisi: 10, baslangic: 20, bitis: 30, katsayi: 1.0 },
  { kod: 'DIN', ad: 'Din Kültürü', soruSayisi: 10, baslangic: 30, bitis: 40, katsayi: 1.0 },
  { kod: 'ING', ad: 'İngilizce', soruSayisi: 10, baslangic: 40, bitis: 50, katsayi: 1.0 },
  { kod: 'MAT', ad: 'Matematik', soruSayisi: 20, baslangic: 50, bitis: 70, katsayi: 4.0 },
  { kod: 'FEN', ad: 'Fen Bilimleri', soruSayisi: 20, baslangic: 70, bitis: 90, katsayi: 4.0 },
];

/**
 * Özdebir cevap dizisini ders bazlı ayırır
 * @param tumCevaplar 150 karakterlik cevap string'i
 * @returns Her ders için cevap dizisi
 */
export function ozdebirCevaplariAyir(tumCevaplar: string): Record<string, string[]> {
  const sonuc: Record<string, string[]> = {};
  
  for (const ders of OZDEBIR_DERS_DAGILIMI) {
    // Cevap dizisinden ilgili bölümü al
    const dersCevaplari = tumCevaplar.substring(ders.baslangic, ders.bitis);
    // Karakter dizisine çevir
    sonuc[ders.kod] = dersCevaplari.split('');
  }
  
  return sonuc;
}

// ============ YARDIMCI FONKSİYONLAR ============

/**
 * Ders adından ders kodunu bul
 */
export function getDersKodu(dersAdi: string): string {
  const normalized = dersAdi.toUpperCase().trim();
  return LGS_CONFIG.dersKoduMap[normalized] || dersAdi.substring(0, 3).toUpperCase();
}

/**
 * Ders kodundan katsayı bul
 */
export function getKatsayi(dersKodu: string): number {
  const ders = LGS_CONFIG.dersler.find(d => d.kod === dersKodu);
  return ders?.katsayi || 1.0;
}

/**
 * Net hesapla: Doğru - (Yanlış / 3)
 * 
 * MEB KURALI: Net negatif olamaz, minimum 0
 */
export function hesaplaNet(dogru: number, yanlis: number): number {
  const net = dogru - (yanlis / LGS_CONFIG.yanlisKatsayisi);
  // MEB standardı: Net negatif olamaz
  const clampedNet = Math.max(0, net);
  return Math.round(clampedNet * 10000) / 10000; // 4 ondalık hassasiyet
}

/**
 * MEB 100-500 SKALA HESAPLAMA
 * 
 * FORMÜL:
 * 1. Ağırlıklı Ham Puan (AHP) = Σ (Ders_Net × Ders_Katsayı)
 * 2. Ölçeklenmiş Katkı = (AHP × 400) / 270
 * 3. LGS Puanı = 100 + Ölçeklenmiş Katkı
 * 
 * ÖRNEK:
 * - 90 doğru → AHP = 270 → Katkı = 400 → Puan = 500
 * - 0 doğru → AHP = 0 → Katkı = 0 → Puan = 100
 */
export function hesaplaLGSPuani(agirlikliHamPuan: number): {
  olceklenmisKatki: number;
  lgsPuani: number;
} {
  const { tabanPuan, maxFinalPuan, toplamKatsayiAgirligi, olceklemeFaktoru } = LGS_CONFIG;
  
  // Ölçekleme: (Ham × 400) / 270
  const olceklenmisKatki = (agirlikliHamPuan * olceklemeFaktoru) / toplamKatsayiAgirligi;
  
  // Final puan: 100 + Katkı
  let lgsPuani = tabanPuan + olceklenmisKatki;
  
  // Sınırlar: 100-500 arası
  lgsPuani = Math.max(tabanPuan, Math.min(maxFinalPuan, lgsPuani));
  
  // 4 ondalık hassasiyet
  return {
    olceklenmisKatki: Math.round(olceklenmisKatki * 10000) / 10000,
    lgsPuani: Math.round(lgsPuani * 10000) / 10000
  };
}

// ============ KİTAPÇIK DÖNÜŞÜM MOTORU ============

/**
 * B/C/D kitapçığındaki cevapları A kitapçığı sırasına dönüştür
 * 
 * MANTIK:
 * - Excel'de her satır bir soruyu temsil eder
 * - A_SORU_NO: A kitapçığındaki soru numarası
 * - B_SORU_NO: B kitapçığında bu sorunun hangi sırada olduğu
 * 
 * Örnek:
 * Excel: A_SORU_NO=1, B_SORU_NO=4, CEVAP=A
 * - A kitapçığı: 1. soru → Cevap A
 * - B kitapçığı: 4. soru → Cevap A (çünkü B'de 4. soru = A'da 1. soru)
 */
export function donusturKitapcikCevaplari(
  ogrenciCevaplari: string,
  kitapcikTipi: 'A' | 'B' | 'C' | 'D',
  cevapAnahtari: CevapAnahtariSatir[]
): string[] {
  
  const cevapArray = ogrenciCevaplari.split('');
  
  // A kitapçığı ise dönüşüme gerek yok
  if (kitapcikTipi === 'A') {
    return cevapArray;
  }
  
  // B/C/D kitapçığı için dönüşüm yap
  const donusturulmusCevaplar: string[] = new Array(cevapArray.length).fill('');
  
  for (const satir of cevapAnahtari) {
    // Hedef pozisyon: A kitapçığındaki sıra (0-indexed)
    const hedefPozisyon = satir.aSoruNo - 1;
    
    // Kaynak pozisyon: Seçilen kitapçıktaki sıra (0-indexed)
    let kaynakPozisyon: number;
    
    switch (kitapcikTipi) {
      case 'B':
        kaynakPozisyon = (satir.bSoruNo || satir.aSoruNo) - 1;
        break;
      case 'C':
        kaynakPozisyon = (satir.cSoruNo || satir.aSoruNo) - 1;
        break;
      case 'D':
        kaynakPozisyon = (satir.dSoruNo || satir.aSoruNo) - 1;
        break;
      default:
        kaynakPozisyon = satir.aSoruNo - 1;
    }
    
    // Cevabı doğru pozisyona yerleştir
    if (kaynakPozisyon >= 0 && kaynakPozisyon < cevapArray.length) {
      donusturulmusCevaplar[hedefPozisyon] = cevapArray[kaynakPozisyon];
    }
  }
  
  return donusturulmusCevaplar;
}

// ============ ANA PUANLAMA MOTORU ============

/**
 * Tek bir öğrenciyi değerlendir
 */
export function degerlendir(
  ogrenci: OgrenciCevap,
  cevapAnahtari: CevapAnahtariSatir[]
): OgrenciSonuc {
  
  // 1. Kitapçık dönüşümü yap
  const normalizedCevaplar = donusturKitapcikCevaplari(
    ogrenci.cevaplar,
    ogrenci.kitapcikTipi,
    cevapAnahtari
  );
  
  // 2. Ders bazlı sonuçları hesapla
  const dersSonuclari: DersSonuc[] = [];
  
  for (const dersConfig of LGS_CONFIG.dersler) {
    let dogru = 0;
    let yanlis = 0;
    let bos = 0;
    
    // Bu derse ait soruları filtrele
    const dersSorulari = cevapAnahtari.filter(s => {
      const soruDersKodu = getDersKodu(s.dersAdi);
      return soruDersKodu === dersConfig.kod;
    });
    
    // Her soru için değerlendir
    for (const soru of dersSorulari) {
      const pozisyon = soru.aSoruNo - 1; // 0-indexed
      const ogrenciCevabi = normalizedCevaplar[pozisyon] || '';
      const dogruCevap = soru.dogruCevap.toUpperCase();
      
      if (!ogrenciCevabi || ogrenciCevabi === ' ' || ogrenciCevabi === '-') {
        bos++;
      } else if (ogrenciCevabi.toUpperCase() === dogruCevap) {
        dogru++;
      } else {
        yanlis++;
      }
    }
    
    const net = hesaplaNet(dogru, yanlis);
    const basariYuzdesi = dersSorulari.length > 0 
      ? Math.round((dogru / dersSorulari.length) * 100) 
      : 0;
    
    dersSonuclari.push({
      dersKodu: dersConfig.kod,
      dersAdi: dersConfig.ad,
      soruSayisi: dersSorulari.length,
      dogru,
      yanlis,
      bos,
      net,
      basariYuzdesi
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // 3. TOPLAM DEĞERLERİ HESAPLA
  // ═══════════════════════════════════════════════════════════
  const toplamDogru = dersSonuclari.reduce((sum, d) => sum + d.dogru, 0);
  const toplamYanlis = dersSonuclari.reduce((sum, d) => sum + d.yanlis, 0);
  const toplamBos = dersSonuclari.reduce((sum, d) => sum + d.bos, 0);
  const toplamNet = dersSonuclari.reduce((sum, d) => sum + d.net, 0);
  
  // ═══════════════════════════════════════════════════════════
  // 4. HAM PUAN (Katsayısız toplam net)
  // ═══════════════════════════════════════════════════════════
  const hamPuan = toplamNet;
  
  // ═══════════════════════════════════════════════════════════
  // 5. AĞIRLIKLI HAM PUAN HESAPLAMA
  // Formül: Σ (Ders_Net × Ders_Katsayı)
  // Maximum: (20×4) + (20×4) + (20×4) + (10×1) + (10×1) + (10×1) = 270
  // ═══════════════════════════════════════════════════════════
  let agirlikliHamPuan = 0;
  
  for (const dersSonuc of dersSonuclari) {
    const katsayi = getKatsayi(dersSonuc.dersKodu);
    agirlikliHamPuan += dersSonuc.net * katsayi;
  }
  
  // Negatif olamaz
  agirlikliHamPuan = Math.max(0, agirlikliHamPuan);
  agirlikliHamPuan = Math.round(agirlikliHamPuan * 10000) / 10000;
  
  // ═══════════════════════════════════════════════════════════
  // 6. MEB 100-500 SKALA HESAPLAMA
  // Formül: LGS_Puanı = 100 + (AHP × 400 / 270)
  // 
  // Örnek: 90 doğru = 270 AHP → (270×400/270) = 400 → 100+400 = 500
  // ═══════════════════════════════════════════════════════════
  const { olceklenmisKatki, lgsPuani } = hesaplaLGSPuani(agirlikliHamPuan);
  
  return {
    ogrenciId: ogrenci.ogrenciId,
    ogrenciNo: ogrenci.ogrenciNo,
    ogrenciAdi: ogrenci.ogrenciAdi,
    sinif: ogrenci.sinif,
    sube: ogrenci.sube,
    kitapcikTipi: ogrenci.kitapcikTipi,
    dersler: dersSonuclari,
    toplamDogru,
    toplamYanlis,
    toplamBos,
    toplamNet,
    hamPuan,
    agirlikliHamPuan,
    olceklenmisKatki,
    lgsPuani,
    agirlikliPuan: lgsPuani // Geriye uyumluluk
  };
}

/**
 * Toplu değerlendirme (tüm öğrenciler)
 */
export function topluDegerlendir(
  ogrenciler: OgrenciCevap[],
  cevapAnahtari: CevapAnahtariSatir[]
): OgrenciSonuc[] {
  
  // 1. Her öğrenciyi değerlendir
  const sonuclar = ogrenciler.map(ogrenci => 
    degerlendir(ogrenci, cevapAnahtari)
  );
  
  // 2. Sıralama yap (ağırlıklı puana göre)
  sonuclar.sort((a, b) => b.agirlikliPuan - a.agirlikliPuan);
  
  // 3. Sıralama numaralarını ata
  let siralama = 1;
  let oncekiPuan = -1;
  let atlama = 0;
  
  for (let i = 0; i < sonuclar.length; i++) {
    if (sonuclar[i].agirlikliPuan !== oncekiPuan) {
      siralama = i + 1;
      oncekiPuan = sonuclar[i].agirlikliPuan;
    }
    sonuclar[i].siralama = siralama;
  }
  
  return sonuclar;
}

// ============ EXCEL CEVAP ANAHTARI PARSE ============

/**
 * Excel'den cevap anahtarı oluştur
 * 
 * Beklenen sütunlar:
 * - Ders / DERS ADI
 * - KİTAPÇIK A CEVAP / A SORU NO
 * - Soru Değeri
 * - Cevap Anahtarı / DOĞRU CEVAP
 * - KİTAPÇIK B CEVAP / B SORU NO
 */
export function parseExcelCevapAnahtari(
  excelData: any[],
  headers: string[]
): CevapAnahtariSatir[] {
  
  const result: CevapAnahtariSatir[] = [];
  
  // Sütun indekslerini bul (case-insensitive)
  const findColumn = (keywords: string[]): number => {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toUpperCase().replace(/\s+/g, '');
      for (const keyword of keywords) {
        if (header.includes(keyword.toUpperCase().replace(/\s+/g, ''))) {
          return i;
        }
      }
    }
    return -1;
  };
  
  const dersCol = findColumn(['DERS', 'DERSADI', 'ALAN']);
  const aSoruCol = findColumn(['KITAPÇIKACEVAP', 'ASORUNO', 'ASORU', 'SORUNO']);
  const bSoruCol = findColumn(['KITAPÇIKBCEVAP', 'BSORUNO', 'BSORU']);
  const cSoruCol = findColumn(['KITAPÇIKCCEVAP', 'CSORUNO', 'CSORU']);
  const dSoruCol = findColumn(['KITAPÇIKDCEVAP', 'DSORUNO', 'DSORU']);
  const cevapCol = findColumn(['CEVAPANAHTARI', 'DOGRUCEVAP', 'CEVAP', 'DOGRU']);
  const degerCol = findColumn(['SORUDEGERI', 'DEGER', 'PUAN']);
  const kazanimKoduCol = findColumn(['KAZANIMKODU', 'KAZANIM']);
  const kazanimMetniCol = findColumn(['KAZANIMMETNI', 'KAZANIMACIKLAMA', 'ACIKLAMA']);
  
  // Her satırı parse et
  for (let i = 0; i < excelData.length; i++) {
    const row = excelData[i];
    if (!row || !Array.isArray(row)) continue;
    
    const dersAdi = row[dersCol]?.toString().trim() || '';
    const aSoruNo = parseInt(row[aSoruCol]) || (i + 1);
    const bSoruNo = parseInt(row[bSoruCol]) || aSoruNo;
    const cSoruNo = cSoruCol >= 0 ? parseInt(row[cSoruCol]) : undefined;
    const dSoruNo = dSoruCol >= 0 ? parseInt(row[dSoruCol]) : undefined;
    const dogruCevap = row[cevapCol]?.toString().trim().toUpperCase() || '';
    const soruDegeri = parseFloat(row[degerCol]) || 1;
    const kazanimKodu = kazanimKoduCol >= 0 ? row[kazanimKoduCol]?.toString().trim() : undefined;
    const kazanimMetni = kazanimMetniCol >= 0 ? row[kazanimMetniCol]?.toString().trim() : undefined;
    
    // Boş veya geçersiz satırları atla
    if (!dersAdi || !dogruCevap || !['A', 'B', 'C', 'D', 'E'].includes(dogruCevap)) {
      continue;
    }
    
    result.push({
      siraNo: i + 1,
      dersAdi,
      dersKodu: getDersKodu(dersAdi),
      aSoruNo,
      bSoruNo,
      cSoruNo,
      dSoruNo,
      dogruCevap,
      soruDegeri,
      kazanimKodu,
      kazanimMetni
    });
  }
  
  return result;
}

// ============ TXT ÖĞRENCİ VERİSİ PARSE ============

/**
 * Optik TXT dosyasından öğrenci verisi parse et
 */
export function parseOptikTxt(
  txtContent: string,
  sablonAyarlari: {
    ogrenciNoBaslangic: number;
    ogrenciNoBitis: number;
    adSoyadBaslangic: number;
    adSoyadBitis: number;
    kitapcikPozisyon?: number;
    cevapBaslangic: number;
    cevapBitis: number;
  }
): OgrenciCevap[] {
  
  const satirlar = txtContent.split('\n').filter(s => s.trim());
  const ogrenciler: OgrenciCevap[] = [];
  
  for (const satir of satirlar) {
    if (satir.length < sablonAyarlari.cevapBitis) continue;
    
    const ogrenciNo = satir.substring(
      sablonAyarlari.ogrenciNoBaslangic - 1,
      sablonAyarlari.ogrenciNoBitis
    ).trim();
    
    const ogrenciAdi = satir.substring(
      sablonAyarlari.adSoyadBaslangic - 1,
      sablonAyarlari.adSoyadBitis
    ).trim();
    
    let kitapcikTipi: 'A' | 'B' | 'C' | 'D' = 'A';
    if (sablonAyarlari.kitapcikPozisyon) {
      const kitapcikChar = satir.charAt(sablonAyarlari.kitapcikPozisyon - 1).toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(kitapcikChar)) {
        kitapcikTipi = kitapcikChar as 'A' | 'B' | 'C' | 'D';
      }
    }
    
    const cevaplar = satir.substring(
      sablonAyarlari.cevapBaslangic - 1,
      sablonAyarlari.cevapBitis
    ).replace(/\s/g, ''); // Boşlukları kaldır
    
    ogrenciler.push({
      ogrenciId: `ogrenci_${ogrenciNo}`,
      ogrenciNo,
      ogrenciAdi,
      kitapcikTipi,
      cevaplar
    });
  }
  
  return ogrenciler;
}

// ============ İSTATİSTİK HESAPLAMALARI ============

/**
 * Sınav istatistiklerini hesapla (MEB Standartları)
 */
export function hesaplaSinavIstatistikleri(sonuclar: OgrenciSonuc[]): {
  ogrenciSayisi: number;
  ortalamaNet: number;
  ortalamaAgirlikliHamPuan: number;
  ortalamaPuan: number;
  enYuksekNet: number;
  enDusukNet: number;
  enYuksekPuan: number;
  enDusukPuan: number;
  standartSapma: number;
  dersBazliOrtalama: Record<string, { net: number; basari: number }>;
  puanDagilimi: { aralik: string; sayi: number }[];
} {
  
  if (sonuclar.length === 0) {
    return {
      ogrenciSayisi: 0,
      ortalamaNet: 0,
      ortalamaAgirlikliHamPuan: 0,
      ortalamaPuan: 0,
      enYuksekNet: 0,
      enDusukNet: 0,
      enYuksekPuan: 0,
      enDusukPuan: 0,
      standartSapma: 0,
      dersBazliOrtalama: {},
      puanDagilimi: []
    };
  }
  
  const netler = sonuclar.map(s => s.toplamNet);
  const puanlar = sonuclar.map(s => s.lgsPuani);
  const agirlikliHamPuanlar = sonuclar.map(s => s.agirlikliHamPuan);
  
  const ortalamaNet = netler.reduce((a, b) => a + b, 0) / netler.length;
  const ortalamaAgirlikliHamPuan = agirlikliHamPuanlar.reduce((a, b) => a + b, 0) / agirlikliHamPuanlar.length;
  const ortalamaPuan = puanlar.reduce((a, b) => a + b, 0) / puanlar.length;
  
  // Standart sapma
  const varyans = puanlar.reduce((sum, p) => sum + Math.pow(p - ortalamaPuan, 2), 0) / puanlar.length;
  const standartSapma = Math.sqrt(varyans);
  
  // Ders bazlı ortalama (net + başarı yüzdesi)
  const dersBazliOrtalama: Record<string, { net: number; basari: number }> = {};
  for (const dersConfig of LGS_CONFIG.dersler) {
    const dersVerileri = sonuclar.map(s => {
      const ders = s.dersler.find(d => d.dersKodu === dersConfig.kod);
      return { net: ders?.net || 0, basari: ders?.basariYuzdesi || 0 };
    });
    const ortNet = dersVerileri.reduce((a, b) => a + b.net, 0) / dersVerileri.length;
    const ortBasari = dersVerileri.reduce((a, b) => a + b.basari, 0) / dersVerileri.length;
    dersBazliOrtalama[dersConfig.kod] = {
      net: Math.round(ortNet * 100) / 100,
      basari: Math.round(ortBasari * 100) / 100
    };
  }
  
  // Puan dağılımı (100 puanlık aralıklar)
  const puanDagilimi = [
    { aralik: '100-200', sayi: puanlar.filter(p => p >= 100 && p < 200).length },
    { aralik: '200-300', sayi: puanlar.filter(p => p >= 200 && p < 300).length },
    { aralik: '300-400', sayi: puanlar.filter(p => p >= 300 && p < 400).length },
    { aralik: '400-500', sayi: puanlar.filter(p => p >= 400 && p <= 500).length },
  ];
  
  return {
    ogrenciSayisi: sonuclar.length,
    ortalamaNet: Math.round(ortalamaNet * 100) / 100,
    ortalamaAgirlikliHamPuan: Math.round(ortalamaAgirlikliHamPuan * 100) / 100,
    ortalamaPuan: Math.round(ortalamaPuan * 100) / 100,
    enYuksekNet: Math.max(...netler),
    enDusukNet: Math.min(...netler),
    enYuksekPuan: Math.max(...puanlar),
    enDusukPuan: Math.min(...puanlar),
    standartSapma: Math.round(standartSapma * 100) / 100,
    dersBazliOrtalama,
    puanDagilimi
  };
}

// ============ EXPORT ============

export default {
  LGS_CONFIG,
  getDersKodu,
  getKatsayi,
  hesaplaNet,
  hesaplaLGSPuani,
  donusturKitapcikCevaplari,
  degerlendir,
  topluDegerlendir,
  parseExcelCevapAnahtari,
  parseOptikTxt,
  hesaplaSinavIstatistikleri
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📊 LGS PUANLAMA FORMÜLÜ ÖZET
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1️⃣ NET HESAPLAMA (Her Ders İçin)
 *    Net = Doğru - (Yanlış / 3)
 *    • 3 yanlış = 1 doğruyu götürür
 *    • Net negatif olamaz, min = 0
 * 
 * 2️⃣ AĞIRLIKLI HAM PUAN (AHP)
 *    AHP = (TUR_Net × 4) + (MAT_Net × 4) + (FEN_Net × 4) +
 *          (INK_Net × 1) + (DIN_Net × 1) + (ING_Net × 1)
 *    • Maximum AHP = 270
 * 
 * 3️⃣ ÖLÇEKLENMİŞ KATKI
 *    Katkı = (AHP × 400) / 270
 *    • 270 → 400
 *    • 0 → 0
 * 
 * 4️⃣ FİNAL LGS PUANI
 *    LGS_Puanı = 100 + Katkı
 *    • Minimum: 100 (0 net bile olsa)
 *    • Maximum: 500 (90 doğru = tam puan)
 * 
 * 5️⃣ ÖRNEK HESAPLAMA (90 Doğru)
 *    • AHP = (20×4) + (20×4) + (20×4) + (10×1) + (10×1) + (10×1) = 270
 *    • Katkı = (270 × 400) / 270 = 400
 *    • LGS = 100 + 400 = 500.00 ✓
 * 
 * 6️⃣ ÖRNEK HESAPLAMA (45 Doğru, 15 Yanlış)
 *    Türkçe: 10D 5Y → Net = 10 - 5/3 = 8.33 → Katkı = 8.33 × 4 = 33.33
 *    Mat: 8D 4Y → Net = 8 - 4/3 = 6.67 → Katkı = 6.67 × 4 = 26.67
 *    Fen: 12D 3Y → Net = 12 - 1 = 11 → Katkı = 11 × 4 = 44
 *    İnk: 5D 1Y → Net = 5 - 0.33 = 4.67 → Katkı = 4.67 × 1 = 4.67
 *    Din: 5D 1Y → Net = 4.67 → Katkı = 4.67
 *    İng: 5D 1Y → Net = 4.67 → Katkı = 4.67
 *    
 *    AHP = 33.33 + 26.67 + 44 + 4.67 + 4.67 + 4.67 = 118.01
 *    Katkı = (118.01 × 400) / 270 = 174.83
 *    LGS = 100 + 174.83 = 274.83
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

