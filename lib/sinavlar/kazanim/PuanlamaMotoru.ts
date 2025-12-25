/**
 * PUANLAMA MOTORU
 * 
 * Bu modül öğrenci cevaplarını değerlendirir ve puanlar.
 * Kitapçık dönüşümü, net hesaplama ve sıralama işlemlerini yapar.
 */

import { CevapAnahtariSatir, ParsedOptikSatir, DERS_ISIMLERI } from './types';
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

