// ============================================================================
// SPECTRA PUANLAMA MOTORU v2.0
// Net hesaplama, LGS/TYT/AYT puan dönüşümü, istatistikler
// PuanHesaplamaDetayi, Compliance Check, Simulation
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
  PuanlamaFormulu,
  PuanHesaplamaDetayi,
  PuanHesaplamaAdimi,
  ComplianceCheckResult,
  ComplianceStatus,
  ScoringRuleSnapshot,
  IptalSoruMantigi,
  DersDagilimi,
  PuanSimulasyonInput,
  PuanSimulasyonOutput,
  WizardStep1Data,
  NetHesaplamaFn,
} from '@/types/spectra-wizard';
// UUID oluşturma (browser uyumlu)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NET HESAPLAMA FONKSİYONLARI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Net hesapla (yanlış katsayısına göre)
 */
export const hesaplaNet: NetHesaplamaFn = (dogru, yanlis, yanlisKatsayisi) => {
  if (yanlisKatsayisi <= 0) return dogru; // Yanlış götürmez
  return dogru - (yanlis / yanlisKatsayisi);
};

/**
 * Tek öğrencinin sonuçlarını hesapla
 */
export function hesaplaOgrenciSonuc(
  ogrenci: ParsedOptikSatir,
  cevapAnahtari: CevapAnahtari,
  sinavKonfig: SinavKonfigurasyonu,
  examId: string,
  iptalMantigi: IptalSoruMantigi = 'herkese_dogru'
): OgrenciSonuc {
  const yanlisKatsayisi = sinavKonfig.yanlisKatsayisi || 
    sinavKonfig.puanlamaFormulu?.yanlisKatsayisi || 3;
  const dersDagilimi = sinavKonfig.dersDagilimi;
  
  // Ders bazlı sonuçları hesapla
  const dersSonuclari: DersSonuc[] = [];
  let toplamDogru = 0;
  let toplamYanlis = 0;
  let toplamBos = 0;

  for (const ders of dersDagilimi) {
    const dersItems = cevapAnahtari.items.filter(
      item => item.dersKodu === ders.dersKodu
    );

    let dogru = 0;
    let yanlis = 0;
    let bos = 0;

    for (const item of dersItems) {
      // İptal soru kontrolü
      if (item.iptal) {
        switch (iptalMantigi) {
          case 'herkese_dogru':
            dogru++;
            continue;
          case 'cevaplayana_dogru':
            const soruIndex = item.soruNo - 1;
            const ogrenciCevapIptal = ogrenci.cevaplar[soruIndex];
            if (ogrenciCevapIptal) dogru++;
            continue;
          case 'gecersiz_say':
          case 'puani_dagit':
            continue;
        }
      }

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
    const net = hesaplaNet(dogru, yanlis, yanlisKatsayisi);
    const soruSayisi = dersItems.filter(i => !i.iptal || iptalMantigi !== 'gecersiz_say').length;
    const yuzde = soruSayisi > 0 ? (net / soruSayisi) * 100 : 0;

    dersSonuclari.push({
      dersKodu: ders.dersKodu,
      dersAdi: ders.dersAdi,
      soruSayisi,
      dogru,
      yanlis,
      bos,
      net: roundTo2(net),
      yuzde: roundTo2(yuzde),
      ppiKatsayisi: ders.ppiKatsayisi,
      agirlikliPuan: ders.ppiKatsayisi ? roundTo2(net * ders.ppiKatsayisi) : undefined,
    });

    toplamDogru += dogru;
    toplamYanlis += yanlis;
    toplamBos += bos;
  }

  const toplamNet = dersSonuclari.reduce((sum, d) => sum + d.net, 0);

  return {
    examId,
    ogrenciNo: ogrenci.ogrenciNo,
    ogrenciAdi: ogrenci.ogrenciAdi || '',
    sinif: ogrenci.sinif,
    kitapcik: ogrenci.kitapcik,
    tcKimlik: ogrenci.tcKimlik,
    toplamDogru,
    toplamYanlis,
    toplamBos,
    toplamNet: roundTo2(toplamNet),
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
  examId: string,
  iptalMantigi: IptalSoruMantigi = 'herkese_dogru'
): OgrenciSonuc[] {
  // Tüm sonuçları hesapla
  const sonuclar = ogrenciler.map(ogr => 
    hesaplaOgrenciSonuc(ogr, cevapAnahtari, sinavKonfig, examId, iptalMantigi)
  );

  // Net'e göre sırala (büyükten küçüğe)
  sonuclar.sort((a, b) => b.toplamNet - a.toplamNet);

  const toplamKatilimci = sonuclar.length;

  // Sıralama ata
  sonuclar.forEach((sonuc, index) => {
    sonuc.kurumSirasi = index + 1;
    sonuc.kurumToplamKatilimci = toplamKatilimci;
    sonuc.yuzdelikDilim = roundTo2((1 - (index / toplamKatilimci)) * 100);
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
    grup.forEach((s, i) => { 
      s.sinifSirasi = i + 1;
      s.sinifToplamKatilimci = grup.length;
    });
  });

  return sonuclar;
}

// ─────────────────────────────────────────────────────────────────────────────
// 📊 PUAN HESAPLAMA DETAYI (ŞEFFAFLIK)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LGS puan hesaplama detaylı
 * Formül: Puan = 100 + (Net * 4.444)
 */
export function hesaplaLGSPuanDetayli(
  dersNetleri: Record<string, number>,
  puanlamaFormulu?: PuanlamaFormulu
): PuanHesaplamaDetayi {
  const adimlar: PuanHesaplamaAdimi[] = [];
  const tabanPuan = puanlamaFormulu?.tabanPuan ?? 100;
  const tavanPuan = puanlamaFormulu?.tavanPuan ?? 500;
  
  // Adım 1: Toplam net hesapla
  const toplamNet = Object.values(dersNetleri).reduce((s, n) => s + n, 0);
  adimlar.push({
    adim: 1,
    aciklama: 'Ders netlerini topla',
    islem: Object.entries(dersNetleri).map(([k, v]) => `${v}`).join(' + '),
    sonrakiDeger: roundTo2(toplamNet),
    birim: 'net',
  });

  // Adım 2: Puan formülü uygula
  const katsayi = (tavanPuan - tabanPuan) / 90; // 90 max net
  const hamPuan = tabanPuan + (toplamNet * katsayi);
  adimlar.push({
    adim: 2,
    aciklama: 'LGS puan formülü uygula',
    islem: `${tabanPuan} + (${roundTo2(toplamNet)} × ${roundTo2(katsayi)})`,
    oncekiDeger: toplamNet,
    sonrakiDeger: roundTo2(hamPuan),
    birim: 'puan',
  });

  // Adım 3: Sınırları kontrol et
  const finalPuan = Math.min(tavanPuan, Math.max(tabanPuan, hamPuan));
  if (finalPuan !== hamPuan) {
    adimlar.push({
      adim: 3,
      aciklama: 'Puan sınırlarını uygula',
      islem: `min(${tavanPuan}, max(${tabanPuan}, ${roundTo2(hamPuan)}))`,
      oncekiDeger: roundTo2(hamPuan),
      sonrakiDeger: roundTo2(finalPuan),
      birim: 'puan',
    });
  }

  return {
    adimlar,
    hamNet: roundTo2(toplamNet),
    hamPuan: roundTo2(hamPuan),
    finalPuan: roundTo2(finalPuan),
    kullanilanFormul: `LGS: ${tabanPuan} + (Net × ${roundTo2(katsayi)})`,
    hesaplamaTarihi: new Date().toISOString(),
  };
}

/**
 * TYT Standart Puan hesaplama detaylı
 */
export function hesaplaTYTPuanDetayli(
  dersNetleri: Record<string, number>,
  puanlamaFormulu?: PuanlamaFormulu,
  ortalamaNet: number = 40,
  standartSapma: number = 15
): PuanHesaplamaDetayi {
  const adimlar: PuanHesaplamaAdimi[] = [];
  
  // Adım 1: Ağırlıklı net hesapla
  let agirlikliNet = 0;
  const katsayilar = puanlamaFormulu?.dersKatsayilari || [];
  
  Object.entries(dersNetleri).forEach(([dersKodu, net]) => {
    const katsayi = katsayilar.find(k => k.dersKodu === dersKodu)?.katsayi || 1;
    agirlikliNet += net * katsayi;
  });

  adimlar.push({
    adim: 1,
    aciklama: 'Ağırlıklı net hesapla',
    islem: katsayilar.map(k => `${dersNetleri[k.dersKodu] || 0} × ${k.katsayi}`).join(' + '),
    sonrakiDeger: roundTo2(agirlikliNet),
    birim: 'ağırlıklı net',
  });

  // Adım 2: Z-score hesapla
  const zScore = (agirlikliNet - ortalamaNet) / standartSapma;
  adimlar.push({
    adim: 2,
    aciklama: 'Z-score hesapla',
    islem: `(${roundTo2(agirlikliNet)} - ${ortalamaNet}) / ${standartSapma}`,
    oncekiDeger: roundTo2(agirlikliNet),
    sonrakiDeger: roundTo2(zScore),
    birim: 'z-score',
  });

  // Adım 3: Standart puan (ortalama: 250, ss: 50)
  const standartPuan = 250 + (zScore * 50);
  adimlar.push({
    adim: 3,
    aciklama: 'Standart puan hesapla',
    islem: `250 + (${roundTo2(zScore)} × 50)`,
    oncekiDeger: roundTo2(zScore),
    sonrakiDeger: roundTo2(standartPuan),
    birim: 'puan',
  });

  const finalPuan = Math.min(500, Math.max(0, standartPuan));

  return {
    adimlar,
    hamNet: roundTo2(Object.values(dersNetleri).reduce((s, n) => s + n, 0)),
    agirlikliNet: roundTo2(agirlikliNet),
    hamPuan: roundTo2(standartPuan),
    finalPuan: roundTo2(finalPuan),
    kullanilanFormul: 'TYT: 250 + (Z-score × 50)',
    hesaplamaTarihi: new Date().toISOString(),
  };
}

/**
 * Genel puan hesaplama (sınav türüne göre)
 */
export function hesaplaPuanDetayli(
  sonuc: OgrenciSonuc,
  sinavTuru: string,
  puanlamaFormulu?: PuanlamaFormulu,
  ortalamaNet?: number,
  standartSapma?: number
): PuanHesaplamaDetayi {
  const dersNetleri: Record<string, number> = {};
  sonuc.dersSonuclari.forEach(d => {
    dersNetleri[d.dersKodu] = d.net;
  });

  switch (sinavTuru) {
    case 'LGS':
      return hesaplaLGSPuanDetayli(dersNetleri, puanlamaFormulu);
    case 'TYT':
      return hesaplaTYTPuanDetayli(dersNetleri, puanlamaFormulu, ortalamaNet, standartSapma);
    case 'AYT_SAY':
    case 'AYT_EA':
    case 'AYT_SOZ':
      return hesaplaTYTPuanDetayli(dersNetleri, puanlamaFormulu, ortalamaNet, standartSapma);
    default:
      // Linear: (net/toplam) * 100
      return {
        adimlar: [
          {
            adim: 1,
            aciklama: 'Yüzde hesapla',
            islem: `(${sonuc.toplamNet} / ${sonuc.toplamDogru + sonuc.toplamYanlis + sonuc.toplamBos}) × 100`,
            sonrakiDeger: roundTo2((sonuc.toplamNet / (sonuc.toplamDogru + sonuc.toplamYanlis + sonuc.toplamBos)) * 100),
            birim: '%',
          },
        ],
        hamNet: sonuc.toplamNet,
        hamPuan: roundTo2((sonuc.toplamNet / (sonuc.toplamDogru + sonuc.toplamYanlis + sonuc.toplamBos)) * 100),
        finalPuan: roundTo2((sonuc.toplamNet / (sonuc.toplamDogru + sonuc.toplamYanlis + sonuc.toplamBos)) * 100),
        kullanilanFormul: 'Linear: (Net / Toplam) × 100',
        hesaplamaTarihi: new Date().toISOString(),
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔒 COMPLIANCE CHECK (MEB/ÖSYM UYUMLULUK)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sınav yapılandırmasının MEB/ÖSYM standartlarına uyumunu kontrol et
 */
export function checkCompliance(
  konfigurasyon: SinavKonfigurasyonu,
  ozelAyarlar: Partial<WizardStep1Data>
): ComplianceCheckResult {
  const kontroller: ComplianceCheckResult['kontroller'] = [];
  let status: ComplianceStatus = 'uyumlu';

  // Toplam soru kontrolü
  const beklenenSoru = konfigurasyon.toplamSoru;
  const mevcutSoru = ozelAyarlar.ozelDersDagilimi 
    ? ozelAyarlar.ozelDersDagilimi.reduce((s, d) => s + d.soruSayisi, 0)
    : beklenenSoru;

  if (mevcutSoru !== beklenenSoru) {
    kontroller.push({
      alan: 'toplamSoru',
      beklenen: beklenenSoru,
      mevcut: mevcutSoru,
      durum: 'uyari',
      mesaj: `Soru sayısı standarttan farklı (${beklenenSoru} → ${mevcutSoru})`,
    });
    status = 'uyari';
  } else {
    kontroller.push({
      alan: 'toplamSoru',
      beklenen: beklenenSoru,
      mevcut: mevcutSoru,
      durum: 'uyumlu',
      mesaj: 'Soru sayısı standartla uyumlu',
    });
  }

  // Yanlış katsayısı kontrolü
  const beklenenKatsayi = konfigurasyon.yanlisKatsayisi || konfigurasyon.puanlamaFormulu?.yanlisKatsayisi;
  const mevcutKatsayi = ozelAyarlar.yanlisKatsayisi;

  if (beklenenKatsayi !== undefined && mevcutKatsayi !== undefined && beklenenKatsayi !== mevcutKatsayi) {
    kontroller.push({
      alan: 'yanlisKatsayisi',
      beklenen: beklenenKatsayi,
      mevcut: mevcutKatsayi,
      durum: 'uyari',
      mesaj: `Yanlış katsayısı değiştirilmiş (${beklenenKatsayi} → ${mevcutKatsayi})`,
    });
    status = 'uyari';
  }

  // Süre kontrolü
  const beklenenSure = konfigurasyon.sure;
  const mevcutSure = ozelAyarlar.sure;

  if (mevcutSure && mevcutSure !== beklenenSure) {
    kontroller.push({
      alan: 'sure',
      beklenen: `${beklenenSure} dk`,
      mevcut: `${mevcutSure} dk`,
      durum: 'uyari',
      mesaj: `Süre standarttan farklı`,
    });
    if (status === 'uyumlu') status = 'uyari';
  }

  // Ders dağılımı kontrolü
  if (ozelAyarlar.ozelDersDagilimi) {
    const ozelDersler = ozelAyarlar.ozelDersDagilimi.map(d => d.dersKodu).sort();
    const standartDersler = konfigurasyon.dersDagilimi.map(d => d.dersKodu).sort();

    if (JSON.stringify(ozelDersler) !== JSON.stringify(standartDersler)) {
      kontroller.push({
        alan: 'dersDagilimi',
        beklenen: standartDersler.join(', '),
        mevcut: ozelDersler.join(', '),
        durum: 'uyari',
        mesaj: 'Ders dağılımı standarttan farklı',
      });
      status = 'uyari';
    }
  }

  // Resmi sınav ve kilitli alan kontrolü
  if (konfigurasyon.isResmi) {
    const kilitliAlanlar = konfigurasyon.kilitliAlanlar || [];
    
    if (kilitliAlanlar.includes('toplamSoru') && mevcutSoru !== beklenenSoru) {
      status = 'uyumsuz';
      kontroller.find(k => k.alan === 'toplamSoru')!.durum = 'uyumsuz';
    }
  }

  const genelMesaj = status === 'uyumlu'
    ? `✅ ${konfigurasyon.ad} standartlarına tam uyumlu`
    : status === 'uyari'
    ? `⚠️ Standart dışı ayarlar var - Kurum denemesi olarak işaretlenecek`
    : `❌ Resmi sınav kuralları ihlal edildi`;

  return {
    status,
    sinavTuru: konfigurasyon.kod,
    kontroller,
    genelMesaj,
    standartDisiEtiketi: status !== 'uyumlu',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔒 SCORING SNAPSHOT (DEĞİŞMEZ KURAL KAYDI)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Puanlama kuralları snapshot'ı oluştur
 */
export function createScoringSnapshot(
  sinavTuru: string,
  puanlamaFormulu: PuanlamaFormulu,
  dersDagilimi: DersDagilimi[],
  iptalMantigi: IptalSoruMantigi
): ScoringRuleSnapshot {
  const config = JSON.stringify({ puanlamaFormulu, dersDagilimi, iptalMantigi });
  const hash = createHash(config);

  return {
    id: generateUUID(),
    version: '1.0.0',
    sinavTuru: sinavTuru as any,
    puanlamaFormulu,
    dersDagilimi,
    iptalSoruMantigi: iptalMantigi,
    createdAt: new Date().toISOString(),
    configHash: hash,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 📈 PUAN SİMÜLASYONU (What-If Analysis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Farklı net senaryoları için puan simülasyonu
 */
export function simulatePuan(input: PuanSimulasyonInput): PuanSimulasyonOutput {
  const dersNetleri: Record<string, number> = {};
  input.dersNetleri.forEach(d => {
    dersNetleri[d.dersKodu] = d.net;
  });

  const mockSonuc: OgrenciSonuc = {
    examId: '',
    ogrenciNo: '',
    ogrenciAdi: '',
    kitapcik: 'A',
    toplamDogru: 0,
    toplamYanlis: 0,
    toplamBos: 0,
    toplamNet: Object.values(dersNetleri).reduce((s, n) => s + n, 0),
    dersSonuclari: input.dersNetleri.map(d => ({
      dersKodu: d.dersKodu,
      dersAdi: d.dersKodu,
      soruSayisi: 20,
      dogru: 0,
      yanlis: 0,
      bos: 0,
      net: d.net,
      yuzde: 0,
    })),
    eslesmeDurumu: 'pending',
    isMisafir: false,
  };

  const hesaplamaDetayi = hesaplaPuanDetayli(
    mockSonuc,
    input.sinavTuru,
    input.kuralOverride as PuanlamaFormulu
  );

  return {
    tahminiPuan: hesaplamaDetayi.finalPuan,
    hesaplamaDetayi,
  };
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
      bekleyenEslestirme: 0,
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
  const bekleyenEslestirme = sonuclar.filter(s => s.eslesmeDurumu === 'pending').length;

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

  // En başarılı/başarısız
  const enBasarili = sonuclar.reduce((max, s) => s.toplamNet > max.toplamNet ? s : max);
  const enBasarisiz = sonuclar.reduce((min, s) => s.toplamNet < min.toplamNet ? s : min);

  // Ders bazlı ortalamalar
  const dersBazliOrtalamalar: SinavIstatistikleri['dersBazliOrtalamalar'] = [];
  if (sonuclar[0]?.dersSonuclari) {
    const dersKodlari = sonuclar[0].dersSonuclari.map(d => d.dersKodu);
    for (const kod of dersKodlari) {
      const dersNetler = sonuclar.map(s => s.dersSonuclari.find(d => d.dersKodu === kod)?.net || 0);
      const dersDogru = sonuclar.map(s => s.dersSonuclari.find(d => d.dersKodu === kod)?.dogru || 0);
      const dersYanlis = sonuclar.map(s => s.dersSonuclari.find(d => d.dersKodu === kod)?.yanlis || 0);
      const dersBos = sonuclar.map(s => s.dersSonuclari.find(d => d.dersKodu === kod)?.bos || 0);
      
      const dersOrtalama = dersNetler.reduce((s, n) => s + n, 0) / dersNetler.length;
      const dersAdi = sonuclar[0].dersSonuclari.find(d => d.dersKodu === kod)?.dersAdi || kod;
      
      dersBazliOrtalamalar.push({
        dersKodu: kod,
        dersAdi,
        ortalamaDogru: roundTo2(dersDogru.reduce((s, n) => s + n, 0) / dersDogru.length),
        ortalamaYanlis: roundTo2(dersYanlis.reduce((s, n) => s + n, 0) / dersYanlis.length),
        ortalamaBos: roundTo2(dersBos.reduce((s, n) => s + n, 0) / dersBos.length),
        ortalama: roundTo2(dersOrtalama),
        enYuksekNet: roundTo2(Math.max(...dersNetler)),
        enDusukNet: roundTo2(Math.min(...dersNetler)),
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
    ortalama: roundTo2(netler.reduce((s, n) => s + n, 0) / netler.length),
    ogrenciSayisi: netler.length,
    enYuksekNet: roundTo2(Math.max(...netler)),
    enDusukNet: roundTo2(Math.min(...netler)),
  }));

  // Net dağılımı (histogram) - dinamik
  const maxNet = Math.ceil(enYuksekNet / 10) * 10;
  const netDagilimi: SinavIstatistikleri['netDagilimi'] = [];
  for (let i = 0; i < maxNet; i += 10) {
    const minN = i;
    const maxN = i + 10;
    const sayi = netler.filter(n => n >= minN && n < maxN).length;
    netDagilimi.push({
      aralik: `${minN}-${maxN}`,
      minNet: minN,
      maxNet: maxN,
      sayi,
      yuzde: roundTo2((sayi / toplamKatilimci) * 100),
    });
  }

  // Cevap dağılımı
  const toplamCevap = sonuclar.reduce((s, o) => s + o.toplamDogru + o.toplamYanlis + o.toplamBos, 0);
  const toplamDogruSum = sonuclar.reduce((s, o) => s + o.toplamDogru, 0);
  const toplamYanlisSum = sonuclar.reduce((s, o) => s + o.toplamYanlis, 0);
  const toplamBosSum = sonuclar.reduce((s, o) => s + o.toplamBos, 0);

  return {
    toplamKatilimci,
    asilKatilimci,
    misafirKatilimci,
    bekleyenEslestirme,
    ortalamaDogru: roundTo2(ortalamaDogru),
    ortalamaYanlis: roundTo2(ortalamaYanlis),
    ortalamaBos: roundTo2(ortalamaBos),
    ortalamaNet: roundTo2(ortalamaNet),
    enYuksekNet: roundTo2(enYuksekNet),
    enDusukNet: roundTo2(enDusukNet),
    medyan: roundTo2(medyan),
    standartSapma: roundTo2(standartSapma),
    enBasarili: {
      ogrenciNo: enBasarili.ogrenciNo,
      ogrenciAdi: enBasarili.ogrenciAdi,
      net: enBasarili.toplamNet,
    },
    enBasarisiz: {
      ogrenciNo: enBasarisiz.ogrenciNo,
      ogrenciAdi: enBasarisiz.ogrenciAdi,
      net: enBasarisiz.toplamNet,
    },
    dersBazliOrtalamalar,
    sinifBazliOrtalamalar,
    netDagilimi,
    cevapDagilimi: {
      toplamDogru: toplamDogruSum,
      toplamYanlis: toplamYanlisSum,
      toplamBos: toplamBosSum,
      dogruYuzde: roundTo2((toplamDogruSum / toplamCevap) * 100),
      yanlisYuzde: roundTo2((toplamYanlisSum / toplamCevap) * 100),
      bosYuzde: roundTo2((toplamBosSum / toplamCevap) * 100),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TAHMİNİ PUAN EKLEME
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sonuçlara tahmini puan ve detay ekle
 */
export function ekleTohminiPuanlar(
  sonuclar: OgrenciSonuc[],
  sinavTuru: string,
  puanlamaFormulu?: PuanlamaFormulu
): OgrenciSonuc[] {
  const istatistikler = hesaplaIstatistikler(sonuclar);

  return sonuclar.map(sonuc => {
    const puanDetaylari = hesaplaPuanDetayli(
      sonuc,
      sinavTuru,
      puanlamaFormulu,
      istatistikler.ortalamaNet,
      istatistikler.standartSapma
    );

    return { 
      ...sonuc, 
      tahminiPuan: puanDetaylari.finalPuan,
      puanDetaylari,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY UYUMLULUK
// ─────────────────────────────────────────────────────────────────────────────

export function hesaplaLGSPuan(net: number): number {
  const puan = 100 + (net * 4.444);
  return Math.min(500, Math.max(100, roundTo2(puan)));
}

export function hesaplaTYTPuan(
  sonuc: OgrenciSonuc,
  ortalamaNet: number = 40,
  standartSapma: number = 15
): number {
  const toplamNet = sonuc.toplamNet;
  const zScore = (toplamNet - ortalamaNet) / standartSapma;
  const standartPuan = 250 + (zScore * 50);
  return Math.min(500, Math.max(0, Math.round(standartPuan)));
}

export function hesaplaAYTAgirlikliPuan(sonuc: OgrenciSonuc): number {
  return sonuc.dersSonuclari.reduce((toplam, ders) => {
    if (ders.agirlikliPuan) {
      return toplam + ders.agirlikliPuan;
    }
    return toplam;
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────────────────────────────────────

function roundTo2(num: number): number {
  return Math.round(num * 100) / 100;
}

function createHash(data: string): string {
  // Simple hash for browser compatibility
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
