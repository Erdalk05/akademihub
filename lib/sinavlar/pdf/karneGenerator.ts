/**
 * ============================================
 * SINAV KARNESİ PDF GENERATOR
 * ============================================
 * 
 * Basit ve Detaylı karne PDF'lerini oluşturur
 */

import { SinavKarnesiBasitProps } from './templates/SinavKarnesiBasit';
import { SinavKarnesiDetayliProps, DersKonuAnalizi, KazanimDetay } from './templates/SinavKarnesiDetayli';

// Demo veri oluşturucu - Basit Karne
export function generateDemoBasitKarne(): SinavKarnesiBasitProps {
  return {
    ogrenci: {
      ad: 'AYŞE YILMAZ',
      numara: '12345',
      sinif: '8/A',
      okul: 'Ankara Örnek Ortaokulu',
      geldigiOkul: 'Ankara Örnek İlkokulu',
    },
    sinav: {
      ad: '3D 8. SINIF DENEME 3',
      alan: 'LGS',
      tarih: '26.12.2025',
      kitapcik: 'A',
      danisman: 'Mehmet ÖĞRETMEN',
    },
    dersler: [
      { dersAdi: 'Türkçe', soruSayisi: 20, dogru: 15, yanlis: 4, bos: 1, net: 13.67, basariYuzdesi: 75.0, cevapAnahtari: 'BDABCDCBADCCABBBADCC', ogrenciCevabi: 'BDABCDCbADCcABBBADCC' },
      { dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, dogru: 8, yanlis: 2, bos: 0, net: 7.33, basariYuzdesi: 73.3 },
      { dersAdi: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, dogru: 7, yanlis: 2, bos: 1, net: 6.33, basariYuzdesi: 63.3 },
      { dersAdi: 'Yabancı Dil (İngilizce)', soruSayisi: 10, dogru: 8, yanlis: 1, bos: 1, net: 7.67, basariYuzdesi: 76.7 },
      { dersAdi: 'Matematik', soruSayisi: 20, dogru: 16, yanlis: 3, bos: 1, net: 15.00, basariYuzdesi: 75.0 },
      { dersAdi: 'Fen Bilimleri', soruSayisi: 20, dogru: 12, yanlis: 6, bos: 2, net: 10.00, basariYuzdesi: 50.0 },
    ],
    toplam: {
      soruSayisi: 90,
      dogru: 66,
      yanlis: 18,
      bos: 6,
      net: 60.00,
      basariYuzdesi: 66.7,
    },
    puan: 438.25,
    siralama: {
      sube: { siralama: 8, kisiSayisi: 35, ortalama: 425.50 },
      okul: { siralama: 25, kisiSayisi: 180, ortalama: 385.20 },
    },
  };
}

// Demo veri oluşturucu - Detaylı Karne (Kazanım Bazlı)
export function generateDemoDetayliKarne(): SinavKarnesiDetayliProps {
  const basitKarne = generateDemoBasitKarne();

  // Türkçe Konu Analizi
  const turkceAnaliz: DersKonuAnalizi = {
    dersAdi: 'Türkçe',
    dersKodu: 'TUR',
    toplamSoru: 20,
    toplamDogru: 15,
    toplamYanlis: 4,
    toplamBos: 1,
    basariYuzdesi: 75,
    konular: [
      { kazanimMetni: 'OKUMA', soruSayisi: 17, dogru: 13, yanlis: 3, bos: 1, basariYuzdesi: 76, isKonu: true },
      { kazanimMetni: 'Bağlamdan yararlanarak kelime anlamı tahmin eder', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Metindeki söz sanatlarını tespit eder', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Fikirlerin cümleden düşüncelerini kavrar', soruSayisi: 1, dogru: 0, yanlis: 1, bos: 0, basariYuzdesi: 0 },
      { kazanimMetni: 'Metnin ana fikrini/düşüncesini belirler', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Metin içeriklerini yorumlar', soruSayisi: 3, dogru: 2, yanlis: 1, bos: 0, basariYuzdesi: 67 },
      { kazanimMetni: 'Okuduklarıyla ilgili düşüncelerinde bulunur', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Metin türlerini anlar, eder', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Görsellere ilgi sorularını cevaplar', soruSayisi: 1, dogru: 0, yanlis: 0, bos: 1, basariYuzdesi: 0 },
      { kazanimMetni: 'Grafik, tablo, görüşe yorumlar', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Düşünceyı pratikleme yollarını belirler', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Söz ve sözcük basamaklarını kavrar', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50 },
      { kazanimMetni: 'YAZMA', soruSayisi: 3, dogru: 2, yanlis: 1, bos: 0, basariYuzdesi: 67, isKonu: true },
      { kazanimMetni: 'Yazıdıklarını düzenler', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Cümlenin öğelerini ayırt eder', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50 },
    ],
  };

  // Matematik Konu Analizi
  const matematikAnaliz: DersKonuAnalizi = {
    dersAdi: 'Matematik',
    dersKodu: 'MAT',
    toplamSoru: 20,
    toplamDogru: 16,
    toplamYanlis: 3,
    toplamBos: 1,
    basariYuzdesi: 75,
    konular: [
      { kazanimMetni: 'SAYILAR VE İŞLEMLER', soruSayisi: 18, dogru: 15, yanlis: 2, bos: 1, basariYuzdesi: 83, isKonu: true },
      { kazanimMetni: 'Çarpanlar ve Katlar', soruSayisi: 4, dogru: 2, yanlis: 2, bos: 0, basariYuzdesi: 50 },
      { kazanimMetni: 'Pozitif tam sayıları çözümleyerek bulur', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'EBOB ve EKOK hesaplar, problemler çözer', soruSayisi: 2, dogru: 0, yanlis: 2, bos: 0, basariYuzdesi: 0 },
      { kazanimMetni: 'Aradıklarında asal sayıları belirler', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Üslü İfadeler', soruSayisi: 6, dogru: 6, yanlis: 0, bos: 0, basariYuzdesi: 100, isKonu: true },
      { kazanimMetni: 'Tam sayıları kuvvetlerini hesaplar', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Üslü ifade kuralarını anlar', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: '10\'un kuvvetleriyle gösterir', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Bilimsel gösterimle ifade eder', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Karekökü İfadeler', soruSayisi: 8, dogru: 7, yanlis: 0, bos: 1, basariYuzdesi: 87.5, isKonu: true },
      { kazanimMetni: 'Tam kare sayıları ve karekök ifadeleri', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Hangi sayıların arasında olduğunu belirler', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Kareköklü ifadelerini anlar', soruSayisi: 3, dogru: 3, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Rasyonel ve irrasyonel sayıları sınıflar', soruSayisi: 2, dogru: 1, yanlis: 0, bos: 1, basariYuzdesi: 50 },
      { kazanimMetni: 'VERİ ANALİZİ', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50, isKonu: true },
      { kazanimMetni: 'Veri Analizi', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50 },
    ],
  };

  // Fen Bilimleri Konu Analizi
  const fenAnaliz: DersKonuAnalizi = {
    dersAdi: 'Fen Bilimleri',
    dersKodu: 'FEN',
    toplamSoru: 20,
    toplamDogru: 12,
    toplamYanlis: 6,
    toplamBos: 2,
    basariYuzdesi: 50,
    konular: [
      { kazanimMetni: 'Mevsimler ve İklim / Dünya ve Evren', soruSayisi: 4, dogru: 4, yanlis: 0, bos: 0, basariYuzdesi: 100, isKonu: true },
      { kazanimMetni: 'Mevsimlerin Oluşumu', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Mevsimlerin oluşmasına yönelik tahminler', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'DNA ve Genetik Kod / Canlılar ve Yaşam', soruSayisi: 11, dogru: 5, yanlis: 5, bos: 1, basariYuzdesi: 45, isKonu: true },
      { kazanimMetni: 'DNA ve Genetik Kod', soruSayisi: 3, dogru: 2, yanlis: 1, bos: 0, basariYuzdesi: 67 },
      { kazanimMetni: 'DNA yapılarını model üzerinde gösterir', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'DNA kendini nasıl aktarır', soruSayisi: 1, dogru: 0, yanlis: 1, bos: 0, basariYuzdesi: 0 },
      { kazanimMetni: 'Kalıtım', soruSayisi: 4, dogru: 1, yanlis: 3, bos: 0, basariYuzdesi: 25 },
      { kazanimMetni: 'Tek karakterli çaprazlamalı problemlerin', soruSayisi: 3, dogru: 0, yanlis: 3, bos: 0, basariYuzdesi: 0 },
      { kazanimMetni: 'Genetik sonuçlar yorumlar', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Mutasyon ve Modifikasyon', soruSayisi: 1, dogru: 0, yanlis: 0, bos: 1, basariYuzdesi: 0 },
      { kazanimMetni: 'Biyoteknoloji', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50 },
      { kazanimMetni: 'Basınç / Fiziksel Olaylar', soruSayisi: 5, dogru: 3, yanlis: 1, bos: 1, basariYuzdesi: 60, isKonu: true },
      { kazanimMetni: 'Basınç', soruSayisi: 5, dogru: 3, yanlis: 1, bos: 1, basariYuzdesi: 60 },
    ],
  };

  // T.C. İnkılap Tarihi Konu Analizi
  const tarihAnaliz: DersKonuAnalizi = {
    dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük',
    dersKodu: 'TAR',
    toplamSoru: 10,
    toplamDogru: 8,
    toplamYanlis: 2,
    toplamBos: 0,
    basariYuzdesi: 73,
    konular: [
      { kazanimMetni: 'BİR KAHRAMAN DOĞUYOR', soruSayisi: 4, dogru: 4, yanlis: 0, bos: 0, basariYuzdesi: 100, isKonu: true },
      { kazanimMetni: 'Osmanlı 20. yy başları durumu', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Mustafa Kemal\'in ileri hayatı', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Askerlik hayatı ve kafası', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'MİLLİ UYANIS', soruSayisi: 6, dogru: 4, yanlis: 2, bos: 0, basariYuzdesi: 58, isKonu: true },
      { kazanimMetni: 'Birinci Dünya Savaşı sebepleri', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Mondros Ateşkes Antlaşması', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50 },
      { kazanimMetni: 'Kuvâ-yi Milliye oluşumu', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50 },
      { kazanimMetni: 'Milli Mücadele hazırlıkları', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
    ],
  };

  // Din Kültürü Konu Analizi
  const dinAnaliz: DersKonuAnalizi = {
    dersAdi: 'Din Kültürü ve Ahlak Bilgisi',
    dersKodu: 'DIN',
    toplamSoru: 10,
    toplamDogru: 7,
    toplamYanlis: 2,
    toplamBos: 1,
    basariYuzdesi: 63,
    konular: [
      { kazanimMetni: 'KADER İNANCI', soruSayisi: 5, dogru: 4, yanlis: 1, bos: 0, basariYuzdesi: 73, isKonu: true },
      { kazanimMetni: 'ZEKAT VE SADAKA', soruSayisi: 5, dogru: 3, yanlis: 1, bos: 1, basariYuzdesi: 53, isKonu: true },
    ],
  };

  // İngilizce Konu Analizi
  const ingilizceAnaliz: DersKonuAnalizi = {
    dersAdi: 'Yabancı Dil (İngilizce)',
    dersKodu: 'ING',
    toplamSoru: 10,
    toplamDogru: 8,
    toplamYanlis: 1,
    toplamBos: 1,
    basariYuzdesi: 77,
    konular: [
      { kazanimMetni: 'Friendship', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100, isKonu: true },
      { kazanimMetni: 'Reading: Short texts about friendship', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Teen Life', soruSayisi: 5, dogru: 4, yanlis: 1, bos: 0, basariYuzdesi: 73, isKonu: true },
      { kazanimMetni: 'Listening: Regular activities', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Spoken Production: Express preferences', soruSayisi: 2, dogru: 2, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Reading: Daily activities', soruSayisi: 2, dogru: 1, yanlis: 1, bos: 0, basariYuzdesi: 50 },
      { kazanimMetni: 'In The Kitchen', soruSayisi: 3, dogru: 2, yanlis: 0, bos: 1, basariYuzdesi: 67, isKonu: true },
      { kazanimMetni: 'Spoken Interaction: Ask about processes', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Reading: Guess unknown words', soruSayisi: 1, dogru: 1, yanlis: 0, bos: 0, basariYuzdesi: 100 },
      { kazanimMetni: 'Writing: Describe a process', soruSayisi: 1, dogru: 0, yanlis: 0, bos: 1, basariYuzdesi: 0 },
    ],
  };

  return {
    ...basitKarne,
    konuAnalizleri: [
      turkceAnaliz,
      matematikAnaliz,
      fenAnaliz,
      tarihAnaliz,
      dinAnaliz,
      ingilizceAnaliz,
    ],
  };
}

// Öğrenci verisinden karne verisi oluştur
export function createKarneFromStudentData(
  student: {
    id: string;
    ogrenciNo: string;
    ogrenciAdi: string;
    sinif?: string;
    kitapcik: string;
  },
  exam: {
    ad: string;
    alan?: string;
    tarih: string;
  },
  testResults: {
    testAdi: string;
    dersKodu: string;
    soruSayisi: number;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
    basariYuzdesi: number;
    kazanimAnalizi?: {
      kazanimKodu?: string;
      kazanimMetni?: string;
      konuAdi?: string;
      dogru: number;
      yanlis: number;
      bos: number;
      toplamSoru: number;
      basariYuzdesi: number;
    }[];
  }[],
  ranking: {
    genel?: number;
    sinif?: number;
    subeKisi?: number;
    okulKisi?: number;
    subeOrtalama?: number;
    okulOrtalama?: number;
  },
  puan: number
): SinavKarnesiDetayliProps {
  // Ders verilerini oluştur
  const dersler = testResults.map(t => ({
    dersAdi: t.testAdi,
    soruSayisi: t.soruSayisi,
    dogru: t.dogru,
    yanlis: t.yanlis,
    bos: t.bos,
    net: t.net,
    basariYuzdesi: t.basariYuzdesi,
  }));

  // Toplam hesapla
  const toplam = {
    soruSayisi: dersler.reduce((sum, d) => sum + d.soruSayisi, 0),
    dogru: dersler.reduce((sum, d) => sum + d.dogru, 0),
    yanlis: dersler.reduce((sum, d) => sum + d.yanlis, 0),
    bos: dersler.reduce((sum, d) => sum + d.bos, 0),
    net: dersler.reduce((sum, d) => sum + d.net, 0),
    basariYuzdesi: 0,
  };
  toplam.basariYuzdesi = toplam.soruSayisi > 0 
    ? (toplam.dogru / toplam.soruSayisi) * 100 
    : 0;

  // Konu analizlerini oluştur
  const konuAnalizleri: DersKonuAnalizi[] = testResults.map(t => {
    const konular: KazanimDetay[] = [];

    if (t.kazanimAnalizi && t.kazanimAnalizi.length > 0) {
      // Konuları grupla
      const konuGruplari = new Map<string, typeof t.kazanimAnalizi>();
      
      t.kazanimAnalizi.forEach(k => {
        const konuAdi = k.konuAdi || 'Genel';
        if (!konuGruplari.has(konuAdi)) {
          konuGruplari.set(konuAdi, []);
        }
        konuGruplari.get(konuAdi)!.push(k);
      });

      // Her konu için ana konu ve alt kazanımları ekle
      konuGruplari.forEach((kazanimlar, konuAdi) => {
        // Ana konu toplamı
        const konuToplam = kazanimlar.reduce((acc, k) => ({
          dogru: acc.dogru + k.dogru,
          yanlis: acc.yanlis + k.yanlis,
          bos: acc.bos + k.bos,
          toplamSoru: acc.toplamSoru + k.toplamSoru,
        }), { dogru: 0, yanlis: 0, bos: 0, toplamSoru: 0 });

        konular.push({
          kazanimMetni: konuAdi,
          soruSayisi: konuToplam.toplamSoru,
          dogru: konuToplam.dogru,
          yanlis: konuToplam.yanlis,
          bos: konuToplam.bos,
          basariYuzdesi: konuToplam.toplamSoru > 0 
            ? Math.round((konuToplam.dogru / konuToplam.toplamSoru) * 100) 
            : 0,
          isKonu: true,
        });

        // Alt kazanımlar
        kazanimlar.forEach(k => {
          if (k.kazanimMetni) {
            konular.push({
              kazanimKodu: k.kazanimKodu,
              kazanimMetni: k.kazanimMetni,
              soruSayisi: k.toplamSoru,
              dogru: k.dogru,
              yanlis: k.yanlis,
              bos: k.bos,
              basariYuzdesi: k.basariYuzdesi,
              isKonu: false,
            });
          }
        });
      });
    } else {
      // Kazanım analizi yoksa sadece genel bilgi
      konular.push({
        kazanimMetni: t.testAdi + ' Genel',
        soruSayisi: t.soruSayisi,
        dogru: t.dogru,
        yanlis: t.yanlis,
        bos: t.bos,
        basariYuzdesi: t.basariYuzdesi,
        isKonu: true,
      });
    }

    return {
      dersAdi: t.testAdi,
      dersKodu: t.dersKodu,
      toplamSoru: t.soruSayisi,
      toplamDogru: t.dogru,
      toplamYanlis: t.yanlis,
      toplamBos: t.bos,
      basariYuzdesi: Math.round(t.basariYuzdesi),
      konular,
    };
  });

  return {
    ogrenci: {
      ad: student.ogrenciAdi,
      numara: student.ogrenciNo,
      sinif: student.sinif || '-',
    },
    sinav: {
      ad: exam.ad,
      alan: exam.alan || 'LGS',
      tarih: exam.tarih,
      kitapcik: student.kitapcik,
    },
    dersler,
    toplam,
    puan,
    siralama: {
      sube: {
        siralama: ranking.sinif || 1,
        kisiSayisi: ranking.subeKisi || 35,
        ortalama: ranking.subeOrtalama || 0,
      },
      okul: {
        siralama: ranking.genel || 1,
        kisiSayisi: ranking.okulKisi || 180,
        ortalama: ranking.okulOrtalama || 0,
      },
    },
    konuAnalizleri,
  };
}

export default {
  generateDemoBasitKarne,
  generateDemoDetayliKarne,
  createKarneFromStudentData,
};

