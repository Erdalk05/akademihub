// ============================================================================
// SPECTRA PUANLAMA MOTORU
// Net hesaplama, LGS/TYT/AYT puan dönüşümü, istatistikler
// ============================================================================

import type {
  CevapAnahtari,
  CevapAnahtariItem,
  CevapSecenegi,
  DersSonuc,
  OgrenciSonuc,
  ParsedOptikSatir,
  SinavIstatistikleri,
  SinavKonfigurasyonu,
  KitapcikTuru,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// NET HESAPLAMA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tek öğrencinin sonuçlarını hesapla
 */
export function hesaplaOgrenciSonuc(
  ogrenci: ParsedOptikSatir,
  cevapAnahtari: CevapAnahtari,
  sinavKonfig: SinavKonfigurasyonu,
  examId: string
): OgrenciSonuc {
  const { yanlisKatsayisi, dersDagilimi } = sinavKonfig;
  
  // Ders bazlı sonuçları hesapla
  const dersSonuclari: DersSonuc[] = [];
  let toplamDogru = 0;
  let toplamYanlis = 0;
  let toplamBos = 0;

  for (const ders of dersDagilimi) {
    const dersItems = cevapAnahtari.items.filter(
      item => item.dersKodu === ders.dersKodu && !item.iptal
    );

    let dogru = 0;
    let yanlis = 0;
    let bos = 0;

    for (const item of dersItems) {
      const soruIndex = item.soruNo - 1;
      const ogrenciCevap = ogrenci.cevaplar[soruIndex];
      
      // Kitapçık bazlı doğru cevabı al
      let dogruCevap = item.dogruCevap;
      if (ogrenci.kitapcik !== 'A' && item.kitapcikCevaplari) {
        dogruCevap = item.kitapcikCevaplari[ogrenci.kitapcik] || item.dogruCevap;
      }

      if (!ogrenciCevap) {
        bos++;
      } else if (ogrenciCevap === dogruCevap) {
        dogru++;
      } else {
        yanlis++;
      }
    }

    // Net hesapla
    const net = yanlisKatsayisi > 0 
      ? dogru - (yanlis / yanlisKatsayisi) 
      : dogru; // Yazılı sınavda yanlış götürmez

    const soruSayisi = dersItems.length;
    const yuzde = soruSayisi > 0 ? (net / soruSayisi) * 100 : 0;

    dersSonuclari.push({
      dersKodu: ders.dersKodu,
      dersAdi: ders.dersAdi,
      soruSayisi,
      dogru,
      yanlis,
      bos,
      net: Math.round(net * 100) / 100,
      yuzde: Math.round(yuzde * 100) / 100,
      ppiKatsayisi: ders.ppiKatsayisi,
      agirlikliPuan: ders.ppiKatsayisi ? net * ders.ppiKatsayisi : undefined,
    });

    toplamDogru += dogru;
    toplamYanlis += yanlis;
    toplamBos += bos;
  }

  const toplamNet = dersSonuclari.reduce((sum, d) => sum + d.net, 0);
  const toplamNetRounded = Math.round(toplamNet * 100) / 100;

  return {
    examId,
    ogrenciNo: ogrenci.ogrenciNo,
    ogrenciAdi: ogrenci.ogrenciAdi,
    sinif: ogrenci.sinif,
    kitapcik: ogrenci.kitapcik,
    tcKimlik: ogrenci.tcKimlik,
    toplamDogru,
    toplamYanlis,
    toplamBos,
    toplamNet: toplamNetRounded,
    dersSonuclari,
    eslesmeDurumu: ogrenci.eslesmeDurumu || 'pending',
    isMisafir: !ogrenci.eslesmiStudentId,
    studentId: ogrenci.eslesmiStudentId,
    cevaplar: ogrenci.cevaplar,
    rawData: ogrenci.rawData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPLU PUANLAMA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tüm öğrencileri puanla ve sırala
 */
export function hesaplaTopluSonuclar(
  ogrenciler: ParsedOptikSatir[],
  cevapAnahtari: CevapAnahtari,
  sinavKonfig: SinavKonfigurasyonu,
  examId: string
): OgrenciSonuc[] {
  // Tüm sonuçları hesapla
  const sonuclar = ogrenciler.map(ogr => 
    hesaplaOgrenciSonuc(ogr, cevapAnahtari, sinavKonfig, examId)
  );

  // Net'e göre sırala (büyükten küçüğe)
  sonuclar.sort((a, b) => b.toplamNet - a.toplamNet);

  // Sıralama ata
  sonuclar.forEach((sonuc, index) => {
    sonuc.kurumSirasi = index + 1;
    sonuc.yuzdelikDilim = Math.round((1 - (index / sonuclar.length)) * 100);
  });

  // Sınıf bazlı sıralama
  const sinifGruplari = new Map<string, OgrenciSonuc[]>();
  sonuclar.forEach(s => {
    const sinif = s.sinif || 'Belirsiz';
    if (!sinifGruplari.has(sinif)) sinifGruplari.set(sinif, []);
    sinifGruplari.get(sinif)!.push(s);
  });

  sinifGruplari.forEach(grup => {
    grup.sort((a, b) => b.toplamNet - a.toplamNet);
    grup.forEach((s, i) => { s.sinifSirasi = i + 1; });
  });

  return sonuclar;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUAN DÖNÜŞÜMÜ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LGS Net -> Puan dönüşümü
 * Formül: Puan = 100 + (Net * 4.444)
 * Max Net: 90 -> Max Puan: 500
 */
export function hesaplaLGSPuan(net: number): number {
  const puan = 100 + (net * 4.444);
  return Math.min(500, Math.max(100, Math.round(puan * 100) / 100));
}

/**
 * TYT Standart Puan hesaplama (yaklaşık)
 * Gerçek hesaplama ÖSYM tarafından yapılır
 */
export function hesaplaTYTPuan(
  sonuc: OgrenciSonuc,
  ortalamaNet: number = 40,
  standartSapma: number = 15
): number {
  const toplamNet = sonuc.toplamNet;
  // Z-score hesapla
  const zScore = (toplamNet - ortalamaNet) / standartSapma;
  // Standart puan (ortalama: 250, ss: 50)
  const standartPuan = 250 + (zScore * 50);
  return Math.min(500, Math.max(0, Math.round(standartPuan)));
}

/**
 * AYT ağırlıklı puan hesaplama
 */
export function hesaplaAYTAgirlikliPuan(sonuc: OgrenciSonuc): number {
  return sonuc.dersSonuclari.reduce((toplam, ders) => {
    if (ders.agirlikliPuan) {
      return toplam + ders.agirlikliPuan;
    }
    return toplam;
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// İSTATİSTİKLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sınav istatistiklerini hesapla
 */
export function hesaplaIstatistikler(sonuclar: OgrenciSonuc[]): SinavIstatistikleri {
  if (sonuclar.length === 0) {
    return {
      toplamKatilimci: 0,
      asilKatilimci: 0,
      misafirKatilimci: 0,
      ortalamaDogru: 0,
      ortalamaYanlis: 0,
      ortalamaBos: 0,
      ortalamaNet: 0,
      enYuksekNet: 0,
      enDusukNet: 0,
      medyan: 0,
      standartSapma: 0,
      dersBazliOrtalamalar: [],
      sinifBazliOrtalamalar: [],
      netDagilimi: [],
    };
  }

  const toplamKatilimci = sonuclar.length;
  const asilKatilimci = sonuclar.filter(s => !s.isMisafir).length;
  const misafirKatilimci = sonuclar.filter(s => s.isMisafir).length;

  const netler = sonuclar.map(s => s.toplamNet);
  const ortalamaDogru = sonuclar.reduce((s, o) => s + o.toplamDogru, 0) / toplamKatilimci;
  const ortalamaYanlis = sonuclar.reduce((s, o) => s + o.toplamYanlis, 0) / toplamKatilimci;
  const ortalamaBos = sonuclar.reduce((s, o) => s + o.toplamBos, 0) / toplamKatilimci;
  const ortalamaNet = netler.reduce((s, n) => s + n, 0) / toplamKatilimci;
  const enYuksekNet = Math.max(...netler);
  const enDusukNet = Math.min(...netler);

  // Medyan
  const sortedNetler = [...netler].sort((a, b) => a - b);
  const midIndex = Math.floor(sortedNetler.length / 2);
  const medyan = sortedNetler.length % 2 === 0
    ? (sortedNetler[midIndex - 1] + sortedNetler[midIndex]) / 2
    : sortedNetler[midIndex];

  // Standart Sapma
  const variance = netler.reduce((sum, n) => sum + Math.pow(n - ortalamaNet, 2), 0) / toplamKatilimci;
  const standartSapma = Math.sqrt(variance);

  // Ders bazlı ortalamalar
  const dersBazliOrtalamalar: { dersKodu: string; dersAdi: string; ortalama: number }[] = [];
  if (sonuclar[0]?.dersSonuclari) {
    const dersKodlari = sonuclar[0].dersSonuclari.map(d => d.dersKodu);
    for (const kod of dersKodlari) {
      const dersNetler = sonuclar.map(s => s.dersSonuclari.find(d => d.dersKodu === kod)?.net || 0);
      const dersOrtalama = dersNetler.reduce((s, n) => s + n, 0) / dersNetler.length;
      const dersAdi = sonuclar[0].dersSonuclari.find(d => d.dersKodu === kod)?.dersAdi || kod;
      dersBazliOrtalamalar.push({
        dersKodu: kod,
        dersAdi,
        ortalama: Math.round(dersOrtalama * 100) / 100,
      });
    }
  }

  // Sınıf bazlı ortalamalar
  const sinifGruplari = new Map<string, number[]>();
  sonuclar.forEach(s => {
    const sinif = s.sinif || 'Belirsiz';
    if (!sinifGruplari.has(sinif)) sinifGruplari.set(sinif, []);
    sinifGruplari.get(sinif)!.push(s.toplamNet);
  });

  const sinifBazliOrtalamalar = Array.from(sinifGruplari.entries()).map(([sinif, netler]) => ({
    sinif,
    ortalama: Math.round((netler.reduce((s, n) => s + n, 0) / netler.length) * 100) / 100,
    ogrenciSayisi: netler.length,
  }));

  // Net dağılımı (histogram)
  const netDagilimi = [
    { aralik: '0-10', sayi: netler.filter(n => n >= 0 && n < 10).length },
    { aralik: '10-20', sayi: netler.filter(n => n >= 10 && n < 20).length },
    { aralik: '20-30', sayi: netler.filter(n => n >= 20 && n < 30).length },
    { aralik: '30-40', sayi: netler.filter(n => n >= 30 && n < 40).length },
    { aralik: '40-50', sayi: netler.filter(n => n >= 40 && n < 50).length },
    { aralik: '50-60', sayi: netler.filter(n => n >= 50 && n < 60).length },
    { aralik: '60-70', sayi: netler.filter(n => n >= 60 && n < 70).length },
    { aralik: '70-80', sayi: netler.filter(n => n >= 70 && n < 80).length },
    { aralik: '80-90', sayi: netler.filter(n => n >= 80 && n < 90).length },
    { aralik: '90+', sayi: netler.filter(n => n >= 90).length },
  ];

  return {
    toplamKatilimci,
    asilKatilimci,
    misafirKatilimci,
    ortalamaDogru: Math.round(ortalamaDogru * 100) / 100,
    ortalamaYanlis: Math.round(ortalamaYanlis * 100) / 100,
    ortalamaBos: Math.round(ortalamaBos * 100) / 100,
    ortalamaNet: Math.round(ortalamaNet * 100) / 100,
    enYuksekNet: Math.round(enYuksekNet * 100) / 100,
    enDusukNet: Math.round(enDusukNet * 100) / 100,
    medyan: Math.round(medyan * 100) / 100,
    standartSapma: Math.round(standartSapma * 100) / 100,
    dersBazliOrtalamalar,
    sinifBazliOrtalamalar,
    netDagilimi,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TAHMİNİ PUAN HESAPLAMA (Sonuçlara ekle)
// ─────────────────────────────────────────────────────────────────────────────

export function ekleTohminiPuanlar(
  sonuclar: OgrenciSonuc[],
  sinavTuru: string
): OgrenciSonuc[] {
  const istatistikler = hesaplaIstatistikler(sonuclar);

  return sonuclar.map(sonuc => {
    let tahminiPuan: number | undefined;

    switch (sinavTuru) {
      case 'LGS':
        tahminiPuan = hesaplaLGSPuan(sonuc.toplamNet);
        break;
      case 'TYT':
        tahminiPuan = hesaplaTYTPuan(sonuc, istatistikler.ortalamaNet, istatistikler.standartSapma);
        break;
      case 'AYT_SAY':
      case 'AYT_EA':
      case 'AYT_SOZ':
        tahminiPuan = Math.round(hesaplaAYTAgirlikliPuan(sonuc));
        break;
      default:
        tahminiPuan = undefined;
    }

    return { ...sonuc, tahminiPuan };
  });
}

