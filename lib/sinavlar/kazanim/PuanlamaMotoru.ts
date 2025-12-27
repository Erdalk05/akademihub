/**
 * PUANLAMA MOTORU V4.0 - MANUEL VERİ MOTORU + MEB UYUMLU
 * 
 * Bu modül öğrenci cevaplarını MEB standartlarına göre değerlendirir.
 * 
 * ÖZELLİKLER:
 * - ✅ MEB 100-500 Puan Skalası (LGS)
 * - ✅ Ders bazlı katsayılar (TUR/MAT/FEN = 4, DİĞER = 1)
 * - ✅ Net hesaplama: Doğru - (Yanlış / 3)
 * - ✅ Kitapçık bazlı cevap anahtarları (A, B, C, D)
 * - ✅ Esnek sınav mimarisi (KURUM sınavları için)
 * - ✅ Test bazlı değerlendirme (her ders ayrı test)
 * - ✅ Değişken soru sayısı desteği
 * - ✅ Geriye uyumluluk (eski fonksiyonlar korundu)
 * - ✅ MANUEL VERİ MOTORU: Hardcoded cevap anahtarı ile %100 doğruluk
 * - ✅ Kazanım Analizi: Yanlış sorularda eksik konu tespiti
 * 
 * LGS PUAN FORMÜLÜ:
 * 1. Net = Doğru - (Yanlış / 3)
 * 2. Ağırlıklı Ham Puan (AHP) = Σ(Ders_Net × Katsayı) | Max = 270
 * 3. Ölçeklenmiş Katkı = (AHP × 400) / 270
 * 4. LGS Puanı = 100 + Ölçeklenmiş Katkı | Aralık: 100-500
 */

import { 
  CevapAnahtariSatir, 
  ParsedOptikSatir, 
  DERS_ISIMLERI,
  Sinav,
  SinavTesti,
  KitapcikCevapAnahtari,
  OgrenciSinavSonucu,
  OgrenciTestSonucu
} from './types';
import { SINAV_KONFIGURASYONLARI, SinavTuru, DersDagilimi } from './sinavKonfigurasyonlari';

// ============================================================================
// MEB UYUMLU LGS SABİTLERİ (100-500 SKALA)
// ============================================================================

export const LGS_MEB_CONFIG = {
  // Puan skalası
  tabanPuan: 100.0,              // Minimum puan (0 net bile olsa)
  maxFinalPuan: 500.0,           // Maximum puan (90 doğru = 500)
  toplamKatsayiAgirligi: 270.0,  // Max ham puan
  olceklemeFaktoru: 400.0,       // 500 - 100 = 400
  
  // Net hesaplama
  yanlisKatsayisi: 3,            // 3 yanlış = 1 doğru götürür
  
  // Ders katsayıları (MEB Standardı)
  dersKatsayilari: {
    'TUR': 4.0,   // Türkçe
    'MAT': 4.0,   // Matematik
    'FEN': 4.0,   // Fen Bilimleri
    'INK': 1.0,   // İnkılap Tarihi
    'DIN': 1.0,   // Din Kültürü
    'ING': 1.0,   // İngilizce
    'SOS': 1.0,   // Sosyal Bilgiler (varsa)
  } as Record<string, number>,
  
  // Ders yapılandırması (LGS 8. Sınıf)
  dersler: [
    { kod: 'TUR', ad: 'Türkçe', soruSayisi: 20, baslangic: 1, bitis: 20, katsayi: 4.0, maxKatki: 80 },
    { kod: 'INK', ad: 'T.C. İnkılap Tarihi', soruSayisi: 10, baslangic: 21, bitis: 30, katsayi: 1.0, maxKatki: 10 },
    { kod: 'DIN', ad: 'Din Kültürü', soruSayisi: 10, baslangic: 31, bitis: 40, katsayi: 1.0, maxKatki: 10 },
    { kod: 'ING', ad: 'İngilizce', soruSayisi: 10, baslangic: 41, bitis: 50, katsayi: 1.0, maxKatki: 10 },
    { kod: 'MAT', ad: 'Matematik', soruSayisi: 20, baslangic: 51, bitis: 70, katsayi: 4.0, maxKatki: 80 },
    { kod: 'FEN', ad: 'Fen Bilimleri', soruSayisi: 20, baslangic: 71, bitis: 90, katsayi: 4.0, maxKatki: 80 },
  ],
};

/**
 * Ders kodundan MEB katsayısını al
 */
export function getMEBKatsayi(dersKodu: string): number {
  return LGS_MEB_CONFIG.dersKatsayilari[dersKodu] || 1.0;
}

/**
 * MEB 100-500 Skala Hesaplama
 * 
 * FORMÜL:
 * 1. Ağırlıklı Ham Puan (AHP) = Σ(Ders_Net × Katsayı) | Max = 270
 * 2. Ölçeklenmiş Katkı = (AHP × 400) / 270
 * 3. LGS Puanı = 100 + Ölçeklenmiş Katkı
 */
export function hesaplaMEBPuani(agirlikliHamPuan: number): {
  olceklenmisKatki: number;
  lgsPuani: number;
} {
  const { tabanPuan, maxFinalPuan, toplamKatsayiAgirligi, olceklemeFaktoru } = LGS_MEB_CONFIG;
  
  // Ölçekleme: (Ham × 400) / 270
  const olceklenmisKatki = (agirlikliHamPuan * olceklemeFaktoru) / toplamKatsayiAgirligi;
  
  // Final puan: 100 + Katkı
  let lgsPuani = tabanPuan + olceklenmisKatki;
  
  // Sınırlar: 100-500 arası
  lgsPuani = Math.max(tabanPuan, Math.min(maxFinalPuan, lgsPuani));
  
  return {
    olceklenmisKatki: Math.round(olceklenmisKatki * 100) / 100,
    lgsPuani: Math.round(lgsPuani * 100) / 100
  };
}

// ============================================================================
// TİP TANIMLARI
// ============================================================================

export interface OgrenciDegerlendirmeSonucu {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik: 'A' | 'B' | 'C' | 'D';
  
  // Genel sonuçlar
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamPuan: number;
  
  // Ders bazlı sonuçlar
  dersSonuclari: DersSonucu[];
  
  // Sıralama
  genelSira?: number;
  sinifSira?: number;
}

export interface DersSonucu {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  basariOrani: number;
  ppiKatsayisi?: number;
  agirlikliNet?: number;
}

export interface SoruDegerlendirme {
  soruNo: number;
  dersKodu: string;
  dogruCevap: string;
  ogrenciCevabi: string | null;
  durum: 'dogru' | 'yanlis' | 'bos';
  kazanimKodu?: string;
}

// ============================================================================
// KİTAPÇIK DÖNÜŞÜMÜ
// ============================================================================

/**
 * Öğrencinin kitapçık türüne göre cevabını A kitapçığına dönüştürür
 * 
 * @param ogrenciKitapcik Öğrencinin kitapçık türü (A, B, C, D)
 * @param soruNo Öğrencinin cevapladığı soru numarası
 * @param cevapAnahtari Cevap anahtarı (A kitapçığı referans)
 * @returns A kitapçığındaki karşılık gelen soru numarası
 */
export function kitapcikDonusum(
  ogrenciKitapcik: 'A' | 'B' | 'C' | 'D',
  soruNo: number,
  cevapAnahtari: CevapAnahtariSatir[]
): number {
  // A kitapçığı referans olduğu için direkt döndür
  if (ogrenciKitapcik === 'A') {
    return soruNo;
  }
  
  // Diğer kitapçıklar için cevap anahtarında eşleşen soruyu bul
  const cevapSatiri = cevapAnahtari.find(c => {
    const kitapcikNo = c.kitapcikSoruNo?.[ogrenciKitapcik];
    return kitapcikNo === soruNo;
  });
  
  if (cevapSatiri) {
    return cevapSatiri.soruNo; // A kitapçığındaki soru numarası
  }
  
  // Eşleşme bulunamazsa varsayılan olarak aynı numarayı döndür
  return soruNo;
}

/**
 * Öğrencinin tüm cevaplarını A kitapçığı sıralamasına dönüştürür
 */
export function cevaplariDonustur(
  ogrenciCevaplari: (string | null)[],
  ogrenciKitapcik: 'A' | 'B' | 'C' | 'D',
  cevapAnahtari: CevapAnahtariSatir[]
): (string | null)[] {
  if (ogrenciKitapcik === 'A') {
    return ogrenciCevaplari;
  }
  
  const donusturulmusCevaplar: (string | null)[] = new Array(cevapAnahtari.length).fill(null);
  
  ogrenciCevaplari.forEach((cevap, idx) => {
    const ogrenciSoruNo = idx + 1;
    const aSoruNo = kitapcikDonusum(ogrenciKitapcik, ogrenciSoruNo, cevapAnahtari);
    if (aSoruNo > 0 && aSoruNo <= donusturulmusCevaplar.length) {
      donusturulmusCevaplar[aSoruNo - 1] = cevap;
    }
  });
  
  return donusturulmusCevaplar;
}

// ============================================================================
// DEĞERLENDİRME
// ============================================================================

/**
 * Tek bir öğrenciyi değerlendir
 */
export function ogrenciDegerlendir(
  ogrenci: ParsedOptikSatir,
  cevapAnahtari: CevapAnahtariSatir[],
  sinavTuru: SinavTuru
): OgrenciDegerlendirmeSonucu {
  const sinavKonfig = SINAV_KONFIGURASYONLARI[sinavTuru];
  const yanlisKatsayisi = sinavKonfig?.yanlisKatsayisi || 4;
  
  // Kitapçık türüne göre cevapları dönüştür
  const kitapcik = ogrenci.kitapcik || 'A';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DEBUG: B Kitapçığı Dönüşümü Kontrolü
  // ═══════════════════════════════════════════════════════════════════════════
  if (kitapcik === 'B') {
    console.log(`\n🔄 B KİTAPÇIĞI DÖNÜŞÜMÜ: ${ogrenci.ogrenciAdi}`);
    console.log(`   Ham Cevaplar (ilk 10): ${ogrenci.cevaplar.slice(0, 10).join('')}`);
    
    // İlk 4 soru için dönüşüm kontrolü
    for (let i = 0; i < 4; i++) {
      const bSoruNo = i + 1;
      const cevapSatiri = cevapAnahtari.find(c => c.kitapcikSoruNo?.B === bSoruNo);
      if (cevapSatiri) {
        console.log(`   B-${bSoruNo} → A-${cevapSatiri.soruNo} | Doğru: ${cevapSatiri.dogruCevap} | Öğrenci: ${ogrenci.cevaplar[i] || 'BOŞ'}`);
      } else {
        console.log(`   ⚠️ B-${bSoruNo} için A karşılığı BULUNAMADI! kitapcikSoruNo.B eksik olabilir.`);
      }
    }
  }
  // ═══════════════════════════════════════════════════════════════════════════
  
  const donusturulmusCevaplar = cevaplariDonustur(
    ogrenci.cevaplar,
    kitapcik,
    cevapAnahtari
  );
  
  // Her soruyu değerlendir
  const sorularDegerlendirme: SoruDegerlendirme[] = [];
  const dersBazliSonuclar: Record<string, DersSonucu> = {};
  
  cevapAnahtari.forEach((anahtar, idx) => {
    const ogrenciCevabi = donusturulmusCevaplar[idx] || null;
    let durum: 'dogru' | 'yanlis' | 'bos' = 'bos';
    
    if (!ogrenciCevabi) {
      durum = 'bos';
    } else if (ogrenciCevabi === anahtar.dogruCevap) {
      durum = 'dogru';
    } else {
      durum = 'yanlis';
    }
    
    sorularDegerlendirme.push({
      soruNo: anahtar.soruNo,
      dersKodu: anahtar.dersKodu,
      dogruCevap: anahtar.dogruCevap,
      ogrenciCevabi,
      durum,
      kazanimKodu: anahtar.kazanimKodu
    });
    
    // Ders bazlı topla
    if (!dersBazliSonuclar[anahtar.dersKodu]) {
      // PPI katsayısı al (varsa)
      const dersDagilimi = sinavKonfig?.dersDagilimi.find(d => d.dersKodu === anahtar.dersKodu);
      
      dersBazliSonuclar[anahtar.dersKodu] = {
        dersKodu: anahtar.dersKodu,
        dersAdi: DERS_ISIMLERI[anahtar.dersKodu] || anahtar.dersKodu,
        soruSayisi: 0,
        dogru: 0,
        yanlis: 0,
        bos: 0,
        net: 0,
        basariOrani: 0,
        ppiKatsayisi: dersDagilimi?.ppiKatsayisi
      };
    }
    
    dersBazliSonuclar[anahtar.dersKodu].soruSayisi++;
    
    switch (durum) {
      case 'dogru':
        dersBazliSonuclar[anahtar.dersKodu].dogru++;
        break;
      case 'yanlis':
        dersBazliSonuclar[anahtar.dersKodu].yanlis++;
        break;
      case 'bos':
        dersBazliSonuclar[anahtar.dersKodu].bos++;
        break;
    }
  });
  
  // Net ve başarı oranları hesapla
  let toplamDogru = 0;
  let toplamYanlis = 0;
  let toplamBos = 0;
  let toplamNet = 0;
  let toplamAgirlikliNet = 0;
  
  Object.values(dersBazliSonuclar).forEach(ders => {
    ders.net = ders.dogru - (ders.yanlis / yanlisKatsayisi);
    ders.basariOrani = ders.soruSayisi > 0 
      ? Math.round((ders.dogru / ders.soruSayisi) * 100) 
      : 0;
    
    // Ağırlıklı net (TYT/AYT için)
    if (ders.ppiKatsayisi) {
      ders.agirlikliNet = ders.net * ders.ppiKatsayisi;
      toplamAgirlikliNet += ders.agirlikliNet;
    }
    
    toplamDogru += ders.dogru;
    toplamYanlis += ders.yanlis;
    toplamBos += ders.bos;
    toplamNet += ders.net;
  });
  
  // ═══════════════════════════════════════════════════════════════════════
  // MEB UYUMLU PUAN HESAPLAMA
  // ═══════════════════════════════════════════════════════════════════════
  let toplamPuan = 0;
  
  if (sinavTuru === 'LGS') {
    // ═══════════════════════════════════════════════════════════════════
    // LGS MEB PUAN FORMÜLÜ (100-500 SKALA)
    // ═══════════════════════════════════════════════════════════════════
    // 1. Ağırlıklı Ham Puan (AHP) = Σ(Ders_Net × Katsayı)
    // 2. Ölçeklenmiş Katkı = (AHP × 400) / 270
    // 3. LGS Puanı = 100 + Ölçeklenmiş Katkı
    // ═══════════════════════════════════════════════════════════════════
    
    let agirlikliHamPuan = 0;
    
    Object.values(dersBazliSonuclar).forEach(ders => {
      const katsayi = getMEBKatsayi(ders.dersKodu);
      agirlikliHamPuan += ders.net * katsayi;
    });
    
    // Negatif olamaz
    agirlikliHamPuan = Math.max(0, agirlikliHamPuan);
    
    // MEB 100-500 skala hesapla
    const { lgsPuani } = hesaplaMEBPuani(agirlikliHamPuan);
    toplamPuan = lgsPuani;
    
  } else if (sinavTuru === 'TYT') {
    // TYT puan formülü: 100 + (Ağırlıklı Net * 3.33)
    toplamPuan = 100 + (toplamAgirlikliNet * 3.33);
  } else if (sinavTuru.startsWith('AYT')) {
    // AYT puan formülü
    toplamPuan = toplamAgirlikliNet * 5;
  } else {
    // Genel deneme: 100 üzerinden
    toplamPuan = (toplamNet / cevapAnahtari.length) * 100;
  }
  
  return {
    ogrenciNo: ogrenci.ogrenciNo || '',
    ogrenciAdi: ogrenci.ogrenciAdi || '',
    sinif: ogrenci.sinifNo,
    kitapcik,
    toplamDogru,
    toplamYanlis,
    toplamBos,
    toplamNet: Math.round(toplamNet * 100) / 100,
    toplamPuan: Math.round(toplamPuan * 100) / 100,
    dersSonuclari: Object.values(dersBazliSonuclar)
  };
}

/**
 * Tüm öğrencileri değerlendir ve sırala
 */
export function topluDegerlendir(
  ogrenciler: ParsedOptikSatir[],
  cevapAnahtari: CevapAnahtariSatir[],
  sinavTuru: SinavTuru
): OgrenciDegerlendirmeSonucu[] {
  // Her öğrenciyi değerlendir
  const sonuclar = ogrenciler.map(ogr => 
    ogrenciDegerlendir(ogr, cevapAnahtari, sinavTuru)
  );
  
  // Genel sıralama (net'e göre)
  const genelSirali = [...sonuclar].sort((a, b) => b.toplamNet - a.toplamNet);
  genelSirali.forEach((sonuc, idx) => {
    const orijinal = sonuclar.find(s => s.ogrenciNo === sonuc.ogrenciNo);
    if (orijinal) {
      orijinal.genelSira = idx + 1;
    }
  });
  
  // Sınıf bazlı sıralama
  const sinifGruplari: Record<string, OgrenciDegerlendirmeSonucu[]> = {};
  sonuclar.forEach(sonuc => {
    const sinif = sonuc.sinif || 'Bilinmiyor';
    if (!sinifGruplari[sinif]) {
      sinifGruplari[sinif] = [];
    }
    sinifGruplari[sinif].push(sonuc);
  });
  
  Object.values(sinifGruplari).forEach(grup => {
    const sinifSirali = [...grup].sort((a, b) => b.toplamNet - a.toplamNet);
    sinifSirali.forEach((sonuc, idx) => {
      sonuc.sinifSira = idx + 1;
    });
  });
  
  return sonuclar;
}

// ============================================================================
// İSTATİSTİKLER
// ============================================================================

export interface SinavIstatistikleri {
  toplamOgrenci: number;
  ortalamaNet: number;
  ortalamaPuan: number;
  enYuksekNet: number;
  enDusukNet: number;
  standartSapma: number;
  
  dersBazliOrtalama: {
    dersKodu: string;
    dersAdi: string;
    ortalamaNet: number;
    ortalamaBasari: number;
  }[];
  
  netDagilimi: {
    aralik: string;
    sayi: number;
  }[];
}

export function istatistikHesapla(sonuclar: OgrenciDegerlendirmeSonucu[]): SinavIstatistikleri {
  if (sonuclar.length === 0) {
    return {
      toplamOgrenci: 0,
      ortalamaNet: 0,
      ortalamaPuan: 0,
      enYuksekNet: 0,
      enDusukNet: 0,
      standartSapma: 0,
      dersBazliOrtalama: [],
      netDagilimi: []
    };
  }
  
  const netler = sonuclar.map(s => s.toplamNet);
  const puanlar = sonuclar.map(s => s.toplamPuan);
  
  const ortalamaNet = netler.reduce((a, b) => a + b, 0) / netler.length;
  const ortalamaPuan = puanlar.reduce((a, b) => a + b, 0) / puanlar.length;
  const enYuksekNet = Math.max(...netler);
  const enDusukNet = Math.min(...netler);
  
  // Standart sapma
  const varyans = netler.reduce((acc, net) => acc + Math.pow(net - ortalamaNet, 2), 0) / netler.length;
  const standartSapma = Math.sqrt(varyans);
  
  // Ders bazlı ortalamalar
  const dersBazliToplam: Record<string, { net: number; basari: number; sayi: number; dersAdi: string }> = {};
  
  sonuclar.forEach(sonuc => {
    sonuc.dersSonuclari.forEach(ders => {
      if (!dersBazliToplam[ders.dersKodu]) {
        dersBazliToplam[ders.dersKodu] = { 
          net: 0, 
          basari: 0, 
          sayi: 0, 
          dersAdi: ders.dersAdi 
        };
      }
      dersBazliToplam[ders.dersKodu].net += ders.net;
      dersBazliToplam[ders.dersKodu].basari += ders.basariOrani;
      dersBazliToplam[ders.dersKodu].sayi++;
    });
  });
  
  const dersBazliOrtalama = Object.entries(dersBazliToplam).map(([kod, veri]) => ({
    dersKodu: kod,
    dersAdi: veri.dersAdi,
    ortalamaNet: Math.round((veri.net / veri.sayi) * 100) / 100,
    ortalamaBasari: Math.round(veri.basari / veri.sayi)
  }));
  
  // Net dağılımı (histogram)
  const araliklar = [
    { aralik: '0-10', min: 0, max: 10, sayi: 0 },
    { aralik: '10-20', min: 10, max: 20, sayi: 0 },
    { aralik: '20-30', min: 20, max: 30, sayi: 0 },
    { aralik: '30-40', min: 30, max: 40, sayi: 0 },
    { aralik: '40-50', min: 40, max: 50, sayi: 0 },
    { aralik: '50-60', min: 50, max: 60, sayi: 0 },
    { aralik: '60-70', min: 60, max: 70, sayi: 0 },
    { aralik: '70-80', min: 70, max: 80, sayi: 0 },
    { aralik: '80-90', min: 80, max: 90, sayi: 0 },
    { aralik: '90+', min: 90, max: 200, sayi: 0 },
  ];
  
  netler.forEach(net => {
    const aralik = araliklar.find(a => net >= a.min && net < a.max);
    if (aralik) aralik.sayi++;
  });
  
  return {
    toplamOgrenci: sonuclar.length,
    ortalamaNet: Math.round(ortalamaNet * 100) / 100,
    ortalamaPuan: Math.round(ortalamaPuan * 100) / 100,
    enYuksekNet,
    enDusukNet: Math.round(enDusukNet * 100) / 100,
    standartSapma: Math.round(standartSapma * 100) / 100,
    dersBazliOrtalama,
    netDagilimi: araliklar.map(a => ({ aralik: a.aralik, sayi: a.sayi }))
  };
}

// ============================================================================
// ESNEK PUANLAMA MOTORU V2.0
// Özel kurum sınavları için test bazlı değerlendirme
// ============================================================================

/**
 * Esnek sınav yapılandırması
 * Özel kurum sınavları için kullanılır
 */
export interface EsnekSinavYapilandirmasi {
  sinavAdi: string;
  sinifSeviyesi: string;
  
  // Sınav türü (KURUM = özel tanımlı)
  sinavTuru: 'KURUM' | 'LGS' | 'TYT' | 'AYT' | 'DGS' | 'KPSS';
  
  // Kitapçık türleri
  kitapciklar: ('A' | 'B' | 'C' | 'D')[];
  
  // Testler (dersler)
  testler: EsnekTestTanimi[];
}

export interface EsnekTestTanimi {
  testAdi: string;           // "Matematik", "Türkçe"
  dersKodu: string;          // "MAT", "TUR"
  soruSayisi: number;        // Bu testteki soru sayısı (değişken!)
  baslangicSoru: number;     // Sınavdaki başlangıç sorusu (örn: 21)
  bitisSoru: number;         // Sınavdaki bitiş sorusu (örn: 40)
  katsayi: number;           // Ağırlık katsayısı (örn: 1.5)
  yanlisKatsayisi: number;   // Kaç yanlış = 1 doğru (0 = ceza yok)
  
  // Her kitapçık için cevaplar
  kitapcikCevaplari: {
    kitapcik: 'A' | 'B' | 'C' | 'D';
    cevaplar: ('A' | 'B' | 'C' | 'D' | 'E')[];
  }[];
}

/**
 * Esnek değerlendirme sonucu
 */
export interface EsnekDegerlendirmeSonucu {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik: 'A' | 'B' | 'C' | 'D';
  
  // Test bazlı sonuçlar
  testSonuclari: EsnekTestSonucu[];
  
  // Genel toplam
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamKatsayiliPuan: number;
  
  // MEB 100-500 Skala (LGS için)
  agirlikliHamPuan?: number;      // Σ(Net × Katsayı) | Max = 270
  olceklenmisKatki?: number;       // (AHP × 400) / 270
  lgsPuani?: number;               // 100 + Katkı | 100-500
  
  // Sıralama
  genelSira?: number;
  sinifSira?: number;
  
  // Ham cevaplar (debug için)
  tumCevaplar?: (string | null)[];
}

export interface EsnekTestSonucu {
  testAdi: string;
  dersKodu: string;
  soruSayisi: number;
  
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  
  katsayi: number;
  katsayiliPuan: number;
  basariOrani: number;
  
  // Detaylı cevap analizi
  cevapDetaylari?: {
    soruNo: number;
    dogruCevap: string;
    ogrenciCevabi: string | null;
    durum: 'dogru' | 'yanlis' | 'bos';
  }[];
}

/**
 * ESNEK PUANLAMA FONKSİYONU
 * 
 * Özel kurum sınavları için test bazlı değerlendirme yapar.
 * Her test için ayrı katsayı ve yanlış ceza oranı uygulanır.
 * Kitapçık türüne göre doğru cevap anahtarı kullanılır.
 */
export function esnekDegerlendir(
  ogrenci: ParsedOptikSatir,
  yapilandirma: EsnekSinavYapilandirmasi
): EsnekDegerlendirmeSonucu {
  const kitapcik = (ogrenci.kitapcik || 'A') as 'A' | 'B' | 'C' | 'D';
  const tumCevaplar = ogrenci.cevaplar || [];
  
  // Debug: Kitapçık tipi ve ilk 10 cevap
  console.log(`📝 Öğrenci: ${ogrenci.ogrenciNo} - Kitapçık: ${kitapcik} - İlk 10 cevap: ${tumCevaplar.slice(0, 10).join('')}`);
  
  let toplamDogru = 0;
  let toplamYanlis = 0;
  let toplamBos = 0;
  let toplamNet = 0;
  let toplamKatsayiliPuan = 0;
  
  const testSonuclari: EsnekTestSonucu[] = [];
  
  // Her testi ayrı ayrı değerlendir
  yapilandirma.testler.forEach(test => {
    // Bu kitapçık için cevap anahtarını bul
    const kitapcikCevap = test.kitapcikCevaplari.find(kc => kc.kitapcik === kitapcik);
    
    if (!kitapcikCevap) {
      console.warn(`Kitapçık ${kitapcik} için cevap bulunamadı: ${test.testAdi}`);
      return;
    }
    
    const dogruCevaplar = kitapcikCevap.cevaplar;
    
    // Öğrencinin bu testteki cevaplarını al
    const baslangicIdx = test.baslangicSoru - 1; // 0-indexed
    const ogrenciCevaplari = tumCevaplar.slice(baslangicIdx, baslangicIdx + test.soruSayisi);
    
    let dogru = 0;
    let yanlis = 0;
    let bos = 0;
    const cevapDetaylari: EsnekTestSonucu['cevapDetaylari'] = [];
    
    // Her soruyu değerlendir
    for (let i = 0; i < test.soruSayisi; i++) {
      const dogruCevap = dogruCevaplar[i] || '';
      const ogrenciCevabi = ogrenciCevaplari[i] || null;
      
      let durum: 'dogru' | 'yanlis' | 'bos' = 'bos';
      
      if (!ogrenciCevabi || ogrenciCevabi.trim() === '') {
        bos++;
        durum = 'bos';
      } else if (ogrenciCevabi.toUpperCase() === dogruCevap.toUpperCase()) {
        dogru++;
        durum = 'dogru';
      } else {
        yanlis++;
        durum = 'yanlis';
      }
      
      cevapDetaylari.push({
        soruNo: test.baslangicSoru + i,
        dogruCevap,
        ogrenciCevabi,
        durum
      });
    }
    
    // Net hesapla
    let net = dogru;
    if (test.yanlisKatsayisi > 0) {
      net = dogru - (yanlis / test.yanlisKatsayisi);
    }
    
    // Katsayılı puan
    const katsayiliPuan = net * test.katsayi;
    
    // Başarı oranı
    const basariOrani = test.soruSayisi > 0 
      ? Math.round((dogru / test.soruSayisi) * 100) 
      : 0;
    
    testSonuclari.push({
      testAdi: test.testAdi,
      dersKodu: test.dersKodu,
      soruSayisi: test.soruSayisi,
      dogru,
      yanlis,
      bos,
      net: Math.round(net * 100) / 100,
      katsayi: test.katsayi,
      katsayiliPuan: Math.round(katsayiliPuan * 100) / 100,
      basariOrani,
      cevapDetaylari
    });
    
    // Toplamları güncelle
    toplamDogru += dogru;
    toplamYanlis += yanlis;
    toplamBos += bos;
    toplamNet += net;
    toplamKatsayiliPuan += katsayiliPuan;
  });
  
  // ═══════════════════════════════════════════════════════════════════════
  // MEB 100-500 SKALA HESAPLA (LGS İÇİN)
  // ═══════════════════════════════════════════════════════════════════════
  // Ağırlıklı ham puan hesapla (MEB katsayılarıyla)
  let agirlikliHamPuan = 0;
  testSonuclari.forEach(test => {
    const mebKatsayi = getMEBKatsayi(test.dersKodu);
    agirlikliHamPuan += test.net * mebKatsayi;
  });
  
  // Negatif olamaz
  agirlikliHamPuan = Math.max(0, agirlikliHamPuan);
  
  // MEB 100-500 skala
  const { olceklenmisKatki, lgsPuani } = hesaplaMEBPuani(agirlikliHamPuan);

  return {
    ogrenciNo: ogrenci.ogrenciNo || '',
    ogrenciAdi: ogrenci.ogrenciAdi || '',
    sinif: ogrenci.sinifNo,
    kitapcik,
    testSonuclari,
    toplamDogru,
    toplamYanlis,
    toplamBos,
    toplamNet: Math.round(toplamNet * 100) / 100,
    toplamKatsayiliPuan: Math.round(lgsPuani * 100) / 100, // MEB puanı kullan
    agirlikliHamPuan: Math.round(agirlikliHamPuan * 100) / 100,
    olceklenmisKatki,
    lgsPuani,
    tumCevaplar
  };
}

/**
 * TOPLU ESNEK DEĞERLENDİRME
 * 
 * Tüm öğrencileri esnek yapılandırma ile değerlendirir.
 * Genel ve sınıf sıralaması hesaplar.
 */
export function topluEsnekDegerlendir(
  ogrenciler: ParsedOptikSatir[],
  yapilandirma: EsnekSinavYapilandirmasi
): EsnekDegerlendirmeSonucu[] {
  // Her öğrenciyi değerlendir
  const sonuclar = ogrenciler.map(ogr => esnekDegerlendir(ogr, yapilandirma));
  
  // Genel sıralama (katsayılı puana göre)
  const genelSirali = [...sonuclar].sort((a, b) => b.toplamKatsayiliPuan - a.toplamKatsayiliPuan);
  genelSirali.forEach((sonuc, idx) => {
    const orijinal = sonuclar.find(s => s.ogrenciNo === sonuc.ogrenciNo);
    if (orijinal) {
      orijinal.genelSira = idx + 1;
    }
  });
  
  // Sınıf bazlı sıralama
  const sinifGruplari: Record<string, EsnekDegerlendirmeSonucu[]> = {};
  sonuclar.forEach(sonuc => {
    const sinif = sonuc.sinif || 'Bilinmiyor';
    if (!sinifGruplari[sinif]) {
      sinifGruplari[sinif] = [];
    }
    sinifGruplari[sinif].push(sonuc);
  });
  
  Object.values(sinifGruplari).forEach(grup => {
    const sinifSirali = [...grup].sort((a, b) => b.toplamKatsayiliPuan - a.toplamKatsayiliPuan);
    sinifSirali.forEach((sonuc, idx) => {
      sonuc.sinifSira = idx + 1;
    });
  });
  
  return sonuclar;
}

/**
 * ESNEK SINAV İSTATİSTİKLERİ
 */
export interface EsnekSinavIstatistikleri {
  toplamOgrenci: number;
  ortalamaNet: number;
  ortalamaPuan: number;
  enYuksekPuan: number;
  enDusukPuan: number;
  standartSapma: number;
  
  testBazliOrtalama: {
    testAdi: string;
    dersKodu: string;
    ortalamaNet: number;
    ortalamaBasari: number;
    soruSayisi: number;
  }[];
}

export function esnekIstatistikHesapla(sonuclar: EsnekDegerlendirmeSonucu[]): EsnekSinavIstatistikleri {
  if (sonuclar.length === 0) {
    return {
      toplamOgrenci: 0,
      ortalamaNet: 0,
      ortalamaPuan: 0,
      enYuksekPuan: 0,
      enDusukPuan: 0,
      standartSapma: 0,
      testBazliOrtalama: []
    };
  }
  
  const puanlar = sonuclar.map(s => s.toplamKatsayiliPuan);
  const netler = sonuclar.map(s => s.toplamNet);
  
  const ortalamaNet = netler.reduce((a, b) => a + b, 0) / netler.length;
  const ortalamaPuan = puanlar.reduce((a, b) => a + b, 0) / puanlar.length;
  const enYuksekPuan = Math.max(...puanlar);
  const enDusukPuan = Math.min(...puanlar);
  
  // Standart sapma
  const varyans = puanlar.reduce((acc, p) => acc + Math.pow(p - ortalamaPuan, 2), 0) / puanlar.length;
  const standartSapma = Math.sqrt(varyans);
  
  // Test bazlı ortalamalar
  const testToplam: Record<string, { net: number; basari: number; sayi: number; dersKodu: string; soruSayisi: number }> = {};
  
  sonuclar.forEach(sonuc => {
    sonuc.testSonuclari.forEach(test => {
      if (!testToplam[test.testAdi]) {
        testToplam[test.testAdi] = { 
          net: 0, 
          basari: 0, 
          sayi: 0, 
          dersKodu: test.dersKodu,
          soruSayisi: test.soruSayisi
        };
      }
      testToplam[test.testAdi].net += test.net;
      testToplam[test.testAdi].basari += test.basariOrani;
      testToplam[test.testAdi].sayi++;
    });
  });
  
  const testBazliOrtalama = Object.entries(testToplam).map(([ad, veri]) => ({
    testAdi: ad,
    dersKodu: veri.dersKodu,
    ortalamaNet: Math.round((veri.net / veri.sayi) * 100) / 100,
    ortalamaBasari: Math.round(veri.basari / veri.sayi),
    soruSayisi: veri.soruSayisi
  }));
  
  return {
    toplamOgrenci: sonuclar.length,
    ortalamaNet: Math.round(ortalamaNet * 100) / 100,
    ortalamaPuan: Math.round(ortalamaPuan * 100) / 100,
    enYuksekPuan: Math.round(enYuksekPuan * 100) / 100,
    enDusukPuan: Math.round(enDusukPuan * 100) / 100,
    standartSapma: Math.round(standartSapma * 100) / 100,
    testBazliOrtalama
  };
}

/**
 * CevapAnahtariSatir'dan EsnekSinavYapilandirmasi oluştur
 * 
 * Mevcut sistemle uyumluluk için dönüştürücü
 */
export function cevapAnahtarindanYapilandirmaOlustur(
  cevapAnahtari: CevapAnahtariSatir[],
  sinavAdi: string,
  sinifSeviyesi: string,
  yanlisKatsayisi: number = 4
): EsnekSinavYapilandirmasi {
  // Derslere göre grupla
  const dersGruplari: Record<string, CevapAnahtariSatir[]> = {};
  
  cevapAnahtari.forEach(satir => {
    if (!dersGruplari[satir.dersKodu]) {
      dersGruplari[satir.dersKodu] = [];
    }
    dersGruplari[satir.dersKodu].push(satir);
  });
  
  // Kitapçık türlerini tespit et
  const kitapciklar = new Set<'A' | 'B' | 'C' | 'D'>();
  kitapciklar.add('A'); // A her zaman var
  
  cevapAnahtari.forEach(satir => {
    if (satir.kitapcikSoruNo?.B) kitapciklar.add('B');
    if (satir.kitapcikSoruNo?.C) kitapciklar.add('C');
    if (satir.kitapcikSoruNo?.D) kitapciklar.add('D');
  });
  
  // Testleri oluştur
  let simdikiSoru = 1;
  const testler: EsnekTestTanimi[] = [];
  
  Object.entries(dersGruplari).forEach(([dersKodu, satirlar]) => {
    // Sırala
    satirlar.sort((a, b) => a.soruNo - b.soruNo);
    
    const soruSayisi = satirlar.length;
    const baslangicSoru = simdikiSoru;
    const bitisSoru = simdikiSoru + soruSayisi - 1;
    
    // Her kitapçık için cevapları oluştur
    const kitapcikCevaplari: EsnekTestTanimi['kitapcikCevaplari'] = [];
    
    // A kitapçığı (referans)
    kitapcikCevaplari.push({
      kitapcik: 'A',
      cevaplar: satirlar.map(s => s.dogruCevap)
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // KİTAPÇIK BAZLI CEVAP ANAHTARI OLUŞTURMA
    // ═══════════════════════════════════════════════════════════════════════
    // Örnek: A kitapçığında soru 1 = B kitapçığında soru 4
    // A kitapçığı: [1:A, 2:D, 3:B, 4:A] sıralaması
    // B kitapçığı: [4:A, 3:D, 2:B, 1:A] → B sırasına göre: [1:A, 2:B, 3:D, 4:A]
    // Öğrenci B kitapçığında 1. soruya A işaretlerse DOĞRU
    // ═══════════════════════════════════════════════════════════════════════
    
    (['B', 'C', 'D'] as const).forEach(kit => {
      if (kitapciklar.has(kit)) {
        // Debug: kitapcikSoruNo kontrolü
        const hasKitapcikData = satirlar.some(s => s.kitapcikSoruNo?.[kit]);
        
        if (!hasKitapcikData) {
          console.warn(`⚠️ ${dersKodu}: ${kit} kitapçığı için soru numarası verisi bulunamadı! A sırası kullanılacak.`);
        } else {
          console.log(`✅ ${dersKodu}: ${kit} kitapçığı için soru numarası verisi mevcut`);
          
          // İlk 3 satır için debug
          satirlar.slice(0, 3).forEach((s, i) => {
            console.log(`   A soru ${s.soruNo} → ${kit} soru ${s.kitapcikSoruNo?.[kit]} → cevap ${s.dogruCevap}`);
          });
        }
        
        // Kitapçık soru numaralarına göre sırala
        const kitSatirlar = [...satirlar].sort((a, b) => {
          const aNo = a.kitapcikSoruNo?.[kit] || a.soruNo;
          const bNo = b.kitapcikSoruNo?.[kit] || b.soruNo;
          return aNo - bNo;
        });
        
        // Debug: Sıralanmış ilk 3 cevap
        if (hasKitapcikData) {
          console.log(`   ${kit} kitapçığı cevap sırası (ilk 4):`, kitSatirlar.slice(0, 4).map(s => s.dogruCevap).join(', '));
        }
        
        kitapcikCevaplari.push({
          kitapcik: kit,
          cevaplar: kitSatirlar.map(s => s.dogruCevap)
        });
      }
    });
    
    // MEB katsayısını al (LGS için)
    const mebKatsayi = getMEBKatsayi(dersKodu);
    
    testler.push({
      testAdi: DERS_ISIMLERI[dersKodu] || dersKodu,
      dersKodu,
      soruSayisi,
      baslangicSoru,
      bitisSoru,
      katsayi: mebKatsayi, // MEB katsayısı kullan
      yanlisKatsayisi,
      kitapcikCevaplari
    });
    
    simdikiSoru = bitisSoru + 1;
  });
  
  return {
    sinavAdi,
    sinifSeviyesi,
    sinavTuru: 'KURUM',
    kitapciklar: Array.from(kitapciklar),
    testler
  };
}

// ============================================================================
// MANUEL VERİ MOTORU - ÖZDEBİR LGS
// ============================================================================
// Excel parse hatalarından bağımsız, %100 doğru referans kaynağı
// ============================================================================

import { 
  OZDEBIR_LGS_CONFIG, 
  donusturBKitapcigi, 
  getDogruCevap, 
  getKazanim,
  getPPIKatsayisi,
  type LGSExamConfig 
} from '../data/ozdebir-lgs-config';

/**
 * Manuel veri ile öğrenci değerlendirmesi
 * 
 * Bu fonksiyon hardcoded cevap anahtarını kullanır.
 * Excel parse hatalarından etkilenmez.
 */
export interface ManuelDegerlendirmeSonucu {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik: 'A' | 'B';
  
  // Genel sonuçlar
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  
  // MEB 100-500 Skala
  agirlikliHamPuan: number;
  lgsPuani: number;
  
  // Ders bazlı sonuçlar
  dersSonuclari: {
    dersKodu: string;
    dersAdi: string;
    soruSayisi: number;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
    basariOrani: number;
    ppiKatsayisi: number;
    agirlikliNet: number;
  }[];
  
  // Eksik konular (yanlış yapılan kazanımlar)
  eksikKonular: {
    soruNo: number;
    dersKodu: string;
    kazanimKodu: string;
    kazanimMetni: string;
    dogruCevap: string;
    ogrenciCevabi: string;
  }[];
  
  // Sıralama
  genelSira?: number;
  sinifSira?: number;
}

/**
 * Öğrenciyi Manuel Config ile Değerlendir
 * 
 * @param ogrenci ParsedOptikSatir
 * @param config Opsiyonel LGS config (varsayılan: OZDEBIR_LGS_CONFIG)
 */
export function manuelDegerlendir(
  ogrenci: ParsedOptikSatir,
  config: LGSExamConfig = OZDEBIR_LGS_CONFIG
): ManuelDegerlendirmeSonucu {
  const kitapcik = (ogrenci.kitapcik || 'A') as 'A' | 'B';
  let ogrenciCevaplari = ogrenci.cevaplar || [];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ADIM 1: B Kitapçığı Dönüşümü
  // ═══════════════════════════════════════════════════════════════════════════
  if (kitapcik === 'B') {
    console.log(`\n🔄 [MANUEL] B KİTAPÇIĞI DÖNÜŞÜMÜ: ${ogrenci.ogrenciAdi}`);
    console.log(`   Ham Cevaplar (ilk 10): ${ogrenciCevaplari.slice(0, 10).map(c => c || ' ').join('')}`);
    
    // B cevaplarını A sırasına dönüştür
    ogrenciCevaplari = donusturBKitapcigi(ogrenciCevaplari);
    
    console.log(`   Dönüştürülmüş (ilk 10): ${ogrenciCevaplari.slice(0, 10).map(c => c || ' ').join('')}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ADIM 2: Her soruyu değerlendir
  // ═══════════════════════════════════════════════════════════════════════════
  let toplamDogru = 0;
  let toplamYanlis = 0;
  let toplamBos = 0;
  let agirlikliHamPuan = 0;
  
  const dersSonuclari: ManuelDegerlendirmeSonucu['dersSonuclari'] = [];
  const eksikKonular: ManuelDegerlendirmeSonucu['eksikKonular'] = [];
  
  // Her ders için değerlendir
  for (const ders of config.dersler) {
    let dersDogru = 0;
    let dersYanlis = 0;
    let dersBos = 0;
    
    // Ders içindeki her soruyu kontrol et
    for (let i = 1; i <= ders.soruSayisi; i++) {
      const soruConfig = ders.sorular[i];
      if (!soruConfig) continue;
      
      // Global soru numarası hesapla
      let globalSoruNo = 0;
      for (const d of config.dersler) {
        if (d.dersKodu === ders.dersKodu) {
          globalSoruNo += i;
          break;
        }
        globalSoruNo += d.soruSayisi;
      }
      
      const ogrenciCevabi = ogrenciCevaplari[globalSoruNo - 1] || null;
      const dogruCevap = soruConfig.cevap;
      
      if (!ogrenciCevabi || ogrenciCevabi.trim() === '' || ogrenciCevabi === ' ') {
        dersBos++;
        toplamBos++;
      } else if (ogrenciCevabi.toUpperCase() === dogruCevap.toUpperCase()) {
        dersDogru++;
        toplamDogru++;
      } else {
        dersYanlis++;
        toplamYanlis++;
        
        // Eksik konu olarak kaydet
        eksikKonular.push({
          soruNo: globalSoruNo,
          dersKodu: ders.dersKodu,
          kazanimKodu: soruConfig.kazanimKodu,
          kazanimMetni: soruConfig.kazanimMetni,
          dogruCevap: dogruCevap,
          ogrenciCevabi: ogrenciCevabi
        });
      }
    }
    
    // Net hesapla: Doğru - (Yanlış / 3)
    const dersNet = Math.max(0, dersDogru - (dersYanlis / 3));
    const dersAgirlikliNet = dersNet * ders.ppiKatsayisi;
    agirlikliHamPuan += dersAgirlikliNet;
    
    dersSonuclari.push({
      dersKodu: ders.dersKodu,
      dersAdi: ders.dersAdi,
      soruSayisi: ders.soruSayisi,
      dogru: dersDogru,
      yanlis: dersYanlis,
      bos: dersBos,
      net: Math.round(dersNet * 100) / 100,
      basariOrani: ders.soruSayisi > 0 ? Math.round((dersDogru / ders.soruSayisi) * 100) : 0,
      ppiKatsayisi: ders.ppiKatsayisi,
      agirlikliNet: Math.round(dersAgirlikliNet * 100) / 100
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ADIM 3: MEB 100-500 Skala Hesapla
  // ═══════════════════════════════════════════════════════════════════════════
  // LGS Puanı = 100 + (Ağırlıklı Ham Puan × 400) / 270
  const toplamNet = toplamDogru - (toplamYanlis / 3);
  const olceklenmisKatki = (agirlikliHamPuan * 400) / 270;
  const lgsPuani = Math.min(500, Math.max(100, 100 + olceklenmisKatki));
  
  console.log(`\n📊 [MANUEL] ${ogrenci.ogrenciAdi}:`);
  console.log(`   Doğru: ${toplamDogru} | Yanlış: ${toplamYanlis} | Boş: ${toplamBos}`);
  console.log(`   Net: ${toplamNet.toFixed(2)} | AHP: ${agirlikliHamPuan.toFixed(2)} | LGS: ${lgsPuani.toFixed(2)}`);
  
  return {
    ogrenciNo: ogrenci.ogrenciNo || '',
    ogrenciAdi: ogrenci.ogrenciAdi || '',
    sinif: ogrenci.sinifNo,
    kitapcik,
    toplamDogru,
    toplamYanlis,
    toplamBos,
    toplamNet: Math.round(toplamNet * 100) / 100,
    agirlikliHamPuan: Math.round(agirlikliHamPuan * 100) / 100,
    lgsPuani: Math.round(lgsPuani * 100) / 100,
    dersSonuclari,
    eksikKonular
  };
}

/**
 * Toplu Manuel Değerlendirme
 */
export function topluManuelDegerlendir(
  ogrenciler: ParsedOptikSatir[],
  config: LGSExamConfig = OZDEBIR_LGS_CONFIG
): ManuelDegerlendirmeSonucu[] {
  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`🚀 MANUEL VERİ MOTORU BAŞLADI`);
  console.log(`   Sınav: ${config.sinavAdi}`);
  console.log(`   Öğrenci Sayısı: ${ogrenciler.length}`);
  console.log(`═══════════════════════════════════════════════════════════════`);
  
  const sonuclar = ogrenciler.map(ogr => manuelDegerlendir(ogr, config));
  
  // Genel sıralama (LGS puanına göre)
  const genelSirali = [...sonuclar].sort((a, b) => b.lgsPuani - a.lgsPuani);
  genelSirali.forEach((sonuc, idx) => {
    const orijinal = sonuclar.find(s => s.ogrenciNo === sonuc.ogrenciNo);
    if (orijinal) {
      orijinal.genelSira = idx + 1;
    }
  });
  
  // Sınıf bazlı sıralama
  const sinifGruplari: Record<string, ManuelDegerlendirmeSonucu[]> = {};
  sonuclar.forEach(sonuc => {
    const sinif = sonuc.sinif || 'Bilinmiyor';
    if (!sinifGruplari[sinif]) {
      sinifGruplari[sinif] = [];
    }
    sinifGruplari[sinif].push(sonuc);
  });
  
  Object.values(sinifGruplari).forEach(grup => {
    const sinifSirali = [...grup].sort((a, b) => b.lgsPuani - a.lgsPuani);
    sinifSirali.forEach((sonuc, idx) => {
      sonuc.sinifSira = idx + 1;
    });
  });
  
  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`✅ MANUEL DEĞERLENDİRME TAMAMLANDI`);
  console.log(`   En Yüksek: ${Math.max(...sonuclar.map(s => s.lgsPuani)).toFixed(2)} puan`);
  console.log(`   En Düşük: ${Math.min(...sonuclar.map(s => s.lgsPuani)).toFixed(2)} puan`);
  console.log(`   Ortalama: ${(sonuclar.reduce((a, b) => a + b.lgsPuani, 0) / sonuclar.length).toFixed(2)} puan`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);
  
  return sonuclar;
}

