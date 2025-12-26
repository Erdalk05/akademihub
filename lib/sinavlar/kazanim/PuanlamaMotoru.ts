/**
 * PUANLAMA MOTORU V2.0
 * 
 * Bu modül öğrenci cevaplarını değerlendirir ve puanlar.
 * 
 * ÖZELLİKLER:
 * - ✅ Esnek sınav mimarisi (KURUM sınavları için)
 * - ✅ Test bazlı değerlendirme (her ders ayrı test)
 * - ✅ Kitapçık bazlı tamamen farklı cevap anahtarları (A, B, C, D)
 * - ✅ Değişken soru sayısı desteği
 * - ✅ Test bazlı katsayılar
 * - ✅ Geriye uyumluluk (eski fonksiyonlar korundu)
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
  
  // Puan hesapla
  let toplamPuan = 0;
  if (sinavTuru === 'TYT') {
    // TYT puan formülü: 100 + (Ağırlıklı Net * 3.33)
    toplamPuan = 100 + (toplamAgirlikliNet * 3.33);
  } else if (sinavTuru.startsWith('AYT')) {
    // AYT puan formülü
    toplamPuan = toplamAgirlikliNet * 5;
  } else if (sinavTuru === 'LGS') {
    // LGS puan formülü: Net / Toplam Soru * 500
    toplamPuan = (toplamNet / cevapAnahtari.length) * 500;
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
  
  // Sıralama
  genelSira?: number;
  sinifSira?: number;
  
  // Ham cevaplar (debug için)
  tumCevaplar?: string[];
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
    toplamKatsayiliPuan: Math.round(toplamKatsayiliPuan * 100) / 100,
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
    
    // Diğer kitapçıklar için dönüştür
    (['B', 'C', 'D'] as const).forEach(kit => {
      if (kitapciklar.has(kit)) {
        // Kitapçık soru numaralarına göre sırala
        const kitSatirlar = [...satirlar].sort((a, b) => {
          const aNo = a.kitapcikSoruNo?.[kit] || a.soruNo;
          const bNo = b.kitapcikSoruNo?.[kit] || b.soruNo;
          return aNo - bNo;
        });
        
        kitapcikCevaplari.push({
          kitapcik: kit,
          cevaplar: kitSatirlar.map(s => s.dogruCevap)
        });
      }
    });
    
    testler.push({
      testAdi: DERS_ISIMLERI[dersKodu] || dersKodu,
      dersKodu,
      soruSayisi,
      baslangicSoru,
      bitisSoru,
      katsayi: 1.0, // Varsayılan
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

