/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AKADEMİHUB ÖZDEBİR LGS MASTER DATA SHEET
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Bu dosya, Excel cevap anahtarından MANUEL olarak oluşturulmuştur.
 * Tüm cevaplar, kazanımlar ve kitapçık dönüşümleri burada sabit olarak tutulur.
 * Excel parse hatalarından bağımsız, %100 doğru referans kaynağıdır.
 * 
 * KULLANIM: Yeni sınav için bu dosyayı kopyalayıp değerleri güncelleyin.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface SoruConfig {
  cevap: 'A' | 'B' | 'C' | 'D' | 'E';
  bSoruNo: number;  // B Kitapçığındaki soru numarası
  kazanimKodu: string;
  kazanimMetni: string;
  soruDegeri?: number;
}

export interface DersConfig {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  ppiKatsayisi: number;  // MEB LGS katsayısı
  sorular: Record<number, SoruConfig>;
}

export interface LGSExamConfig {
  sinavAdi: string;
  sinavTarihi: string;
  toplamSoru: number;
  // Kitapçık dönüşüm tablosu: B kitapçığındaki soru → A kitapçığındaki karşılığı
  kitapcikDonusum: {
    B: Record<number, number>;  // B[x] = y demek: B'nin x. sorusu = A'nın y. sorusu
  };
  dersler: DersConfig[];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÖZDEBİR LGS SINAV KONFİGÜRASYONU
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Excel'den kopyalanan veriler (27 Aralık 2025 sınavı)
 */
export const OZDEBIR_LGS_CONFIG: LGSExamConfig = {
  sinavAdi: 'Özdebir LGS Deneme',
  sinavTarihi: '2025-12-27',
  toplamSoru: 90,
  
  // ═══════════════════════════════════════════════════════════════════════════
  // KİTAPÇIK DÖNÜŞÜM TABLOSU
  // ═══════════════════════════════════════════════════════════════════════════
  // B kitapçığındaki soru numarası → A kitapçığındaki karşılığı
  // Örnek: B[1] = 4 demek: B kitapçığının 1. sorusu = A kitapçığının 4. sorusu
  kitapcikDonusum: {
    B: {
      // TÜRKÇE (1-20)
      1: 4, 2: 3, 3: 2, 4: 1, 5: 8, 6: 7, 7: 5, 8: 6, 9: 11, 10: 10,
      11: 9, 12: 13, 13: 14, 14: 15, 15: 12, 16: 16, 17: 17, 18: 20, 19: 18, 20: 19,
      // İNKILAP TARİHİ (21-30) - Excel'deki B sütununa göre
      21: 24, 22: 23, 23: 21, 24: 22, 25: 28, 26: 27, 27: 25, 28: 26, 29: 30, 30: 29,
      // DİN KÜLTÜRÜ (31-40)
      31: 34, 32: 33, 33: 31, 34: 32, 35: 38, 36: 37, 37: 35, 38: 36, 39: 40, 40: 39,
      // İNGİLİZCE (41-50)
      41: 44, 42: 43, 43: 41, 44: 42, 45: 48, 46: 47, 47: 45, 48: 46, 49: 50, 50: 49,
      // MATEMATİK (51-70)
      51: 54, 52: 53, 53: 51, 54: 52, 55: 58, 56: 57, 57: 55, 58: 56, 59: 61, 60: 60,
      61: 59, 62: 64, 63: 63, 64: 62, 65: 67, 66: 66, 67: 65, 68: 70, 69: 69, 70: 68,
      // FEN BİLİMLERİ (71-90)
      71: 74, 72: 73, 73: 71, 74: 72, 75: 78, 76: 77, 77: 75, 78: 76, 79: 81, 80: 80,
      81: 79, 82: 84, 83: 83, 84: 82, 85: 87, 86: 86, 87: 85, 88: 90, 89: 89, 90: 88,
    }
  },
  
  dersler: [
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. TÜRKÇE (20 Soru) - PPI Katsayısı: 4
    // ═══════════════════════════════════════════════════════════════════════════
    {
      dersKodu: 'TUR',
      dersAdi: 'Türkçe',
      soruSayisi: 20,
      ppiKatsayisi: 4,
      sorular: {
        1: { cevap: 'A', bSoruNo: 4, kazanimKodu: 'T.8.3.5', kazanimMetni: 'Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder.' },
        2: { cevap: 'D', bSoruNo: 3, kazanimKodu: 'T.8.3.14', kazanimMetni: 'Metinle ilgili sorulan cevaplar.' },
        3: { cevap: 'B', bSoruNo: 2, kazanimKodu: 'T.8.3.14', kazanimMetni: 'Metinle ilgili sorulan cevaplar.' },
        4: { cevap: 'A', bSoruNo: 1, kazanimKodu: 'T.8.3.14', kazanimMetni: 'Metinle ilgili sorulan cevaplar.' },
        5: { cevap: 'A', bSoruNo: 7, kazanimKodu: 'T.8.3.6', kazanimMetni: 'Deyim, atasözü ve özdeyişlerin metne katkısını belirler.' },
        6: { cevap: 'A', bSoruNo: 8, kazanimKodu: 'T.8.3.21', kazanimMetni: 'Metnin içeriğini yorumlar.' },
        7: { cevap: 'D', bSoruNo: 6, kazanimKodu: 'T.8.3.19', kazanimMetni: 'Metnin içeriğine uygun başlık/başlıklar belirler.' },
        8: { cevap: 'B', bSoruNo: 5, kazanimKodu: 'T.8.3.17', kazanimMetni: 'Metnin ana fikir/ana duygusunu belirler.' },
        9: { cevap: 'A', bSoruNo: 11, kazanimKodu: 'T.8.3.20', kazanimMetni: 'Okuduğu metinlerdeki hikâye unsurlarını belirler.' },
        10: { cevap: 'D', bSoruNo: 10, kazanimKodu: 'T.8.3.17', kazanimMetni: 'Metnin ana fikir/ana duygusunu belirler.' },
        11: { cevap: 'D', bSoruNo: 9, kazanimKodu: 'T.8.3.23', kazanimMetni: 'Metinler arasında karşılaştırma yapar.' },
        12: { cevap: 'A', bSoruNo: 15, kazanimKodu: 'T.8.3.7', kazanimMetni: 'Grafik, tablo ve çizelgeyle sunulan bilgileri yorumlar.' },
        13: { cevap: 'C', bSoruNo: 12, kazanimKodu: 'T.8.3.14', kazanimMetni: 'Metinle ilgili sorulan cevaplar.' },
        14: { cevap: 'D', bSoruNo: 13, kazanimKodu: 'T.8.3.7', kazanimMetni: 'Grafik, tablo ve çizelgeyle sunulan bilgileri yorumlar.' },
        15: { cevap: 'C', bSoruNo: 14, kazanimKodu: 'T.8.3.9', kazanimMetni: 'Fiilimsilerin cümledeki işlevlerini kavrar.' },
        16: { cevap: 'A', bSoruNo: 16, kazanimKodu: 'T.8.3.9', kazanimMetni: 'Fiilimsilerin cümledeki işlevlerini kavrar.' },
        17: { cevap: 'B', bSoruNo: 17, kazanimKodu: 'T.8.3.9', kazanimMetni: 'Fiilimsilerin cümledeki işlevlerini kavrar.' },
        18: { cevap: 'A', bSoruNo: 19, kazanimKodu: 'T.8.3.32', kazanimMetni: 'Metindeki söz sanatlarını tespit eder.' },
        19: { cevap: 'C', bSoruNo: 20, kazanimKodu: 'T.8.4.16', kazanimMetni: 'Yazdıklarını düzenler.' },
        20: { cevap: 'B', bSoruNo: 18, kazanimKodu: 'T.8.4.16', kazanimMetni: 'Yazdıklarını düzenler.' },
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 2. T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK (10 Soru) - PPI Katsayısı: 1
    // ═══════════════════════════════════════════════════════════════════════════
    {
      dersKodu: 'INK',
      dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük',
      soruSayisi: 10,
      ppiKatsayisi: 1,
      sorular: {
        1: { cevap: 'C', bSoruNo: 4, kazanimKodu: 'İTA.8.2.1', kazanimMetni: 'Birinci Dünya Savaşı\'nın sebeplerini ve savaşın başlamasına yol açan gelişmeleri kavrar.' },
        2: { cevap: 'A', bSoruNo: 3, kazanimKodu: 'İTA.8.2.1', kazanimMetni: 'Birinci Dünya Savaşı\'nın sebeplerini ve savaşın başlamasına yol açan gelişmeleri kavrar.' },
        3: { cevap: 'D', bSoruNo: 10, kazanimKodu: 'İTA.8.1.1', kazanimMetni: 'Avrupa\'daki gelişmelerin yansımalarını değerlendirir.' },
        4: { cevap: 'B', bSoruNo: 2, kazanimKodu: 'İTA.8.1.1', kazanimMetni: 'Avrupa\'daki gelişmelerin yansımalarını değerlendirir.' },
        5: { cevap: 'B', bSoruNo: 8, kazanimKodu: 'İTA.8.1.2', kazanimMetni: 'Mustafa Kemal\'in çocukluk ve öğrenim hayatından hareketle onun kişilik özelliklerini oluşumu hakkında çıkarımlarda bulunur.' },
        6: { cevap: 'D', bSoruNo: 1, kazanimKodu: 'İTA.8.1.3', kazanimMetni: 'Gençlik döneminde Mustafa Kemal\'in fikir hayatını etkileyen önemli kişiler ve olayları kavrar.' },
        7: { cevap: 'C', bSoruNo: 9, kazanimKodu: 'İTA.8.1.4', kazanimMetni: 'Mustafa Kemal\'in askerlik hayatı ile ilgili olayları ve olguları onun kişilik özellikleri ile ilişkilendirir.' },
        8: { cevap: 'A', bSoruNo: 5, kazanimKodu: 'İTA.8.1.4', kazanimMetni: 'Mustafa Kemal\'in askerlik hayatı ile ilgili olayları ve olguları onun kişilik özellikleri ile ilişkilendirir.' },
        9: { cevap: 'B', bSoruNo: 6, kazanimKodu: 'İTA.8.1.1', kazanimMetni: 'Avrupa\'daki gelişmelerin yansımalarını değerlendirir.' },
        10: { cevap: 'C', bSoruNo: 7, kazanimKodu: 'İTA.8.1.2', kazanimMetni: 'Mustafa Kemal\'in çocukluk ve öğrenim hayatından hareketle onun kişilik özelliklerini oluşumu hakkında çıkarımlarda bulunur.' },
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 3. DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (10 Soru) - PPI Katsayısı: 1
    // ═══════════════════════════════════════════════════════════════════════════
    {
      dersKodu: 'DIN',
      dersAdi: 'Din Kültürü ve Ahlak Bilgisi',
      soruSayisi: 10,
      ppiKatsayisi: 1,
      sorular: {
        1: { cevap: 'A', bSoruNo: 1, kazanimKodu: 'B.1.1', kazanimMetni: 'Kader ve kaza inancını ayet ve hadislerle açıklar.' },
        2: { cevap: 'C', bSoruNo: 3, kazanimKodu: 'B.1.2', kazanimMetni: 'İnsanın ilmi, iradesi, sorumluluğu ile kader arasında ilişki kurar.' },
        3: { cevap: 'A', bSoruNo: 2, kazanimKodu: 'B.1.1', kazanimMetni: 'Kader ve kaza inancını ayet ve hadislerle açıklar.' },
        4: { cevap: 'D', bSoruNo: 7, kazanimKodu: 'B.1.2', kazanimMetni: 'İnsanın ilmi, iradesi, sorumluluğu ile kader arasında ilişki kurar.' },
        5: { cevap: 'A', bSoruNo: 6, kazanimKodu: 'B.1.4', kazanimMetni: 'Toplumda kader ve kaza ile ilgili yaygın olan yanlış anlayışları sorgular.' },
        6: { cevap: 'B', bSoruNo: 5, kazanimKodu: 'B.1.2', kazanimMetni: 'İnsanın ilmi, iradesi, sorumluluğu ile kader arasında ilişki kurar.' },
        7: { cevap: 'D', bSoruNo: 4, kazanimKodu: 'B.1.1', kazanimMetni: 'Kader ve kaza inancını ayet ve hadislerle açıklar.' },
        8: { cevap: 'C', bSoruNo: 10, kazanimKodu: 'B.1.3', kazanimMetni: 'Kaza ve kader ile ilgili kavramları analiz eder.' },
        9: { cevap: 'B', bSoruNo: 8, kazanimKodu: 'B.1.4', kazanimMetni: 'Toplumda kader ve kaza ile ilgili yaygın olan yanlış anlayışları sorgular.' },
        10: { cevap: 'C', bSoruNo: 9, kazanimKodu: 'B.1.3', kazanimMetni: 'Kaza ve kader ile ilgili kavramları analiz eder.' },
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 4. YABANCI DİL - İNGİLİZCE (10 Soru) - PPI Katsayısı: 1
    // ═══════════════════════════════════════════════════════════════════════════
    {
      dersKodu: 'ING',
      dersAdi: 'İngilizce',
      soruSayisi: 10,
      ppiKatsayisi: 1,
      sorular: {
        1: { cevap: 'D', bSoruNo: 2, kazanimKodu: 'E8.1.R2', kazanimMetni: 'Students will be able to understand short and simple invitation letters, cards and e-mails.' },
        2: { cevap: 'B', bSoruNo: 3, kazanimKodu: 'E8.1.R1', kazanimMetni: 'Students will be able to understand short and simple texts about friendship.' },
        3: { cevap: 'D', bSoruNo: 1, kazanimKodu: 'E8.1.L1', kazanimMetni: 'Students will be able to understand short conversations on accepting and refusing invitation.' },
        4: { cevap: 'C', bSoruNo: 6, kazanimKodu: 'E8.1.SP1', kazanimMetni: 'Students will be able to structure a talk to make simple inquiries.' },
        5: { cevap: 'B', bSoruNo: 7, kazanimKodu: 'E8.1.SP1', kazanimMetni: 'Students will be able to structure a talk to make simple inquiries.' },
        6: { cevap: 'A', bSoruNo: 4, kazanimKodu: 'E8.1.L1', kazanimMetni: 'Students will be able to understand short conversations on accepting and refusing invitation.' },
        7: { cevap: 'C', bSoruNo: 5, kazanimKodu: 'E8.1.R2', kazanimMetni: 'Students will be able to understand short and simple invitation letters, cards and e-mails.' },
        8: { cevap: 'A', bSoruNo: 10, kazanimKodu: 'E8.1.R1', kazanimMetni: 'Students will be able to understand short and simple texts about friendship.' },
        9: { cevap: 'C', bSoruNo: 8, kazanimKodu: 'E8.1.R1', kazanimMetni: 'Students will be able to understand short and simple texts about friendship.' },
        10: { cevap: 'A', bSoruNo: 9, kazanimKodu: 'E8.1.L1', kazanimMetni: 'Students will be able to understand short conversations on accepting and refusing invitation.' },
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 5. MATEMATİK (20 Soru) - PPI Katsayısı: 4
    // ═══════════════════════════════════════════════════════════════════════════
    {
      dersKodu: 'MAT',
      dersAdi: 'Matematik',
      soruSayisi: 20,
      ppiKatsayisi: 4,
      sorular: {
        1: { cevap: 'D', bSoruNo: 4, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        2: { cevap: 'C', bSoruNo: 7, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        3: { cevap: 'B', bSoruNo: 6, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        4: { cevap: 'C', bSoruNo: 5, kazanimKodu: 'M.8.1.1.2', kazanimMetni: 'İki doğal sayının en büyük ortak böleni ve en küçük ortak katını hesaplar.' },
        5: { cevap: 'D', bSoruNo: 1, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        6: { cevap: 'C', bSoruNo: 2, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        7: { cevap: 'A', bSoruNo: 8, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        8: { cevap: 'B', bSoruNo: 3, kazanimKodu: 'M.8.1.1.2', kazanimMetni: 'İki doğal sayının en büyük ortak böleni ve en küçük ortak katını hesaplar.' },
        9: { cevap: 'A', bSoruNo: 17, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        10: { cevap: 'D', bSoruNo: 18, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        11: { cevap: 'A', bSoruNo: 12, kazanimKodu: 'M.8.1.1.1', kazanimMetni: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur.' },
        12: { cevap: 'B', bSoruNo: 11, kazanimKodu: 'M.8.1.1.3', kazanimMetni: 'Verilen iki doğal sayının arasında asal olup olmadığını belirler.' },
        13: { cevap: 'D', bSoruNo: 20, kazanimKodu: 'M.8.1.2.1', kazanimMetni: 'Tam sayıların, tam sayı kuvvetlerini hesaplar.' },
        14: { cevap: 'C', bSoruNo: 19, kazanimKodu: 'M.8.1.2.1', kazanimMetni: 'Tam sayıların, tam sayı kuvvetlerini hesaplar.' },
        15: { cevap: 'A', bSoruNo: 14, kazanimKodu: 'M.8.1.1.3', kazanimMetni: 'Verilen iki doğal sayının arasında asal olup olmadığını belirler.' },
        16: { cevap: 'B', bSoruNo: 13, kazanimKodu: 'M.8.1.2.2', kazanimMetni: 'Üslü ifadelerde temel kuralları kullanarak çözümler.' },
        17: { cevap: 'A', bSoruNo: 10, kazanimKodu: 'M.8.1.2.2', kazanimMetni: 'Üslü ifadelerde temel kuralları kullanarak çözümler.' },
        18: { cevap: 'C', bSoruNo: 9, kazanimKodu: 'M.8.1.2.3', kazanimMetni: 'Sayının ondalık gösteriminden kök değerini bulur.' },
        19: { cevap: 'B', bSoruNo: 15, kazanimKodu: 'M.8.1.1.2', kazanimMetni: 'İki doğal sayının en büyük ortak böleni ve en küçük ortak katını hesaplar.' },
        20: { cevap: 'D', bSoruNo: 16, kazanimKodu: 'M.8.1.2.2', kazanimMetni: 'Üslü ifadelerde temel kuralları kullanarak çözümler.' },
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 6. FEN BİLİMLERİ (20 Soru) - PPI Katsayısı: 4
    // ═══════════════════════════════════════════════════════════════════════════
    {
      dersKodu: 'FEN',
      dersAdi: 'Fen Bilimleri',
      soruSayisi: 20,
      ppiKatsayisi: 4,
      sorular: {
        1: { cevap: 'C', bSoruNo: 2, kazanimKodu: 'F.8.1.1.1', kazanimMetni: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
        2: { cevap: 'A', bSoruNo: 1, kazanimKodu: 'F.8.1.1.1', kazanimMetni: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
        3: { cevap: 'D', bSoruNo: 7, kazanimKodu: 'F.8.1.1.1', kazanimMetni: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
        4: { cevap: 'B', bSoruNo: 8, kazanimKodu: 'F.8.1.1.1', kazanimMetni: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
        5: { cevap: 'B', bSoruNo: 6, kazanimKodu: 'F.8.1.1.1', kazanimMetni: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
        6: { cevap: 'D', bSoruNo: 5, kazanimKodu: 'F.8.1.1.1', kazanimMetni: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
        7: { cevap: 'C', bSoruNo: 4, kazanimKodu: 'F.8.1.2.1', kazanimMetni: 'İklim ve hava olayları arasındaki farkı açıklar.' },
        8: { cevap: 'A', bSoruNo: 3, kazanimKodu: 'F.8.1.2.2', kazanimMetni: 'İklim biliminin önemini ve bu alanda çalışan uzmanların adı verildiğini söyler.' },
        9: { cevap: 'D', bSoruNo: 12, kazanimKodu: 'F.8.1.1', kazanimMetni: 'İklim ve hava olayları arasındaki farkı açıklar.' },
        10: { cevap: 'A', bSoruNo: 14, kazanimKodu: 'F.8.2.1.1', kazanimMetni: 'DNA\'nın yapısını model üzerinde gösterir.' },
        11: { cevap: 'C', bSoruNo: 15, kazanimKodu: 'F.8.2.1.2', kazanimMetni: 'DNA\'nın yapısını model üzerinde gösterir.' },
        12: { cevap: 'B', bSoruNo: 9, kazanimKodu: 'F.8.2.2.1', kazanimMetni: 'Kalıtım ile ilgili kavramları tanımlar.' },
        13: { cevap: 'D', bSoruNo: 11, kazanimKodu: 'F.8.2.1.2', kazanimMetni: 'DNA\'nın yapısını model üzerinde gösterir.' },
        14: { cevap: 'C', bSoruNo: 10, kazanimKodu: 'F.8.2.1.1', kazanimMetni: 'Nükleotid, gen, DNA ve kromozom kavramlarını açıklayarak bu kavramlar arasında ilişki kurar.' },
        15: { cevap: 'A', bSoruNo: 13, kazanimKodu: 'F.8.1.2.1', kazanimMetni: 'İklim ve hava olayları arasındaki farkı açıklar.' },
        16: { cevap: 'C', bSoruNo: 17, kazanimKodu: 'F.8.1.1.1', kazanimMetni: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
        17: { cevap: 'D', bSoruNo: 16, kazanimKodu: 'F.8.2.1.1', kazanimMetni: 'Nükleotid, gen, DNA ve kromozom kavramlarını açıklayarak bu kavramlar arasında ilişki kurar.' },
        18: { cevap: 'B', bSoruNo: 18, kazanimKodu: 'F.8.2.1.3', kazanimMetni: 'DNA\'nın kendini nasıl eşlediğini ifade eder.' },
        19: { cevap: 'B', bSoruNo: 20, kazanimKodu: 'F.8.2.1.2', kazanimMetni: 'DNA\'nın yapısını model üzerinde gösterir.' },
        20: { cevap: 'C', bSoruNo: 19, kazanimKodu: 'F.8.2.1.3', kazanimMetni: 'DNA\'nın kendini nasıl eşlediğini ifade eder.' },
      }
    },
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * B kitapçığı soru numarasından A kitapçığı karşılığını bul
 */
export function getASoruNo(bSoruNo: number): number {
  return OZDEBIR_LGS_CONFIG.kitapcikDonusum.B[bSoruNo] || bSoruNo;
}

/**
 * Soru numarasına göre doğru cevabı getir
 * @param aSoruNo A kitapçığı soru numarası (1-90)
 */
export function getDogruCevap(aSoruNo: number): string | null {
  let currentOffset = 0;
  
  for (const ders of OZDEBIR_LGS_CONFIG.dersler) {
    const dersSoruNo = aSoruNo - currentOffset;
    if (dersSoruNo >= 1 && dersSoruNo <= ders.soruSayisi) {
      return ders.sorular[dersSoruNo]?.cevap || null;
    }
    currentOffset += ders.soruSayisi;
  }
  
  return null;
}

/**
 * Soru numarasına göre kazanım bilgisini getir
 */
export function getKazanim(aSoruNo: number): { kod: string; metin: string } | null {
  let currentOffset = 0;
  
  for (const ders of OZDEBIR_LGS_CONFIG.dersler) {
    const dersSoruNo = aSoruNo - currentOffset;
    if (dersSoruNo >= 1 && dersSoruNo <= ders.soruSayisi) {
      const soru = ders.sorular[dersSoruNo];
      if (soru) {
        return { kod: soru.kazanimKodu, metin: soru.kazanimMetni };
      }
    }
    currentOffset += ders.soruSayisi;
  }
  
  return null;
}

/**
 * Ders koduna göre PPI katsayısını getir
 */
export function getPPIKatsayisi(dersKodu: string): number {
  const ders = OZDEBIR_LGS_CONFIG.dersler.find(d => d.dersKodu === dersKodu);
  return ders?.ppiKatsayisi || 1;
}

/**
 * Tüm cevap anahtarını düz liste olarak getir (A kitapçığı sırası)
 */
export function getCevapAnahtariListesi(): { soruNo: number; cevap: string; dersKodu: string; kazanimKodu: string }[] {
  const liste: { soruNo: number; cevap: string; dersKodu: string; kazanimKodu: string }[] = [];
  let currentOffset = 0;
  
  for (const ders of OZDEBIR_LGS_CONFIG.dersler) {
    for (let i = 1; i <= ders.soruSayisi; i++) {
      const soru = ders.sorular[i];
      if (soru) {
        liste.push({
          soruNo: currentOffset + i,
          cevap: soru.cevap,
          dersKodu: ders.dersKodu,
          kazanimKodu: soru.kazanimKodu
        });
      }
    }
    currentOffset += ders.soruSayisi;
  }
  
  return liste;
}

/**
 * B kitapçığı cevaplarını A sırasına dönüştür
 */
export function donusturBKitapcigi(bCevaplari: (string | null)[]): (string | null)[] {
  const aCevaplari: (string | null)[] = new Array(90).fill(null);
  
  bCevaplari.forEach((cevap, idx) => {
    const bSoruNo = idx + 1;
    const aSoruNo = getASoruNo(bSoruNo);
    if (aSoruNo >= 1 && aSoruNo <= 90) {
      aCevaplari[aSoruNo - 1] = cevap;
    }
  });
  
  return aCevaplari;
}

console.log('✅ ÖZDEBİR LGS Config yüklendi:', OZDEBIR_LGS_CONFIG.sinavAdi);

