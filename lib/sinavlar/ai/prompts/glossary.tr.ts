/**
 * ============================================
 * AkademiHub - Türkiye Eğitim Terimleri Sözlüğü
 * ============================================
 * 
 * PHASE 5 - AI Coach Glossary
 * 
 * BU DOSYA:
 * - Türkiye K12 eğitim sistemi terimleri
 * - AI'ın doğru terminoloji kullanması için referans
 * - Sınav tipleri, ders kodları, değerlendirme terimleri
 */

import type { GlossaryEntry, GlossaryCategory } from '../types';

// ==================== SINAV TÜRLERİ ====================

export const EXAM_TYPES: GlossaryCategory = {
  name: 'Sınav Türleri',
  entries: [
    {
      term: 'LGS',
      definition: 'Liselere Geçiş Sınavı - 8. sınıf öğrencilerinin girdiği merkezi sınav',
      aiContext: 'Yüksek riskli sınav, öğrenci motivasyonu kritik, aile baskısı yoğun olabilir',
      synonyms: ['Liselere Geçiş', 'Merkezi Sınav']
    },
    {
      term: 'TYT',
      definition: 'Temel Yeterlilik Testi - YKS\'nin birinci oturumu',
      aiContext: 'Temel dersler, tüm adaylar girer, baraj puanı önemli',
      synonyms: ['Temel Yeterlilik']
    },
    {
      term: 'AYT',
      definition: 'Alan Yeterlilik Testi - YKS\'nin ikinci oturumu',
      aiContext: 'Alan dersleri, puan türüne göre önemli, derinlemesine bilgi gerektirir',
      synonyms: ['Alan Yeterlilik', 'Alan Sınavı']
    },
    {
      term: 'YKS',
      definition: 'Yükseköğretim Kurumları Sınavı - TYT ve AYT\'nin toplamı',
      aiContext: 'Üniversiteye giriş sınavı, yılda bir kez, çok stresli dönem',
      synonyms: ['Üniversite Sınavı']
    },
    {
      term: 'Deneme Sınavı',
      definition: 'Gerçek sınava hazırlık amacıyla yapılan simülasyon sınavı',
      aiContext: 'Performans takibi için kullanılır, sonuçlar gelişim göstergesi',
      example: 'Okul denemesi, yayın denemesi, kurs denemesi'
    }
  ]
};

// ==================== DERS KODLARI ====================

export const SUBJECT_CODES: GlossaryCategory = {
  name: 'Ders Kodları',
  entries: [
    {
      term: 'TUR',
      definition: 'Türkçe / Türk Dili ve Edebiyatı',
      aiContext: 'Okuma-anlama, dil bilgisi, edebiyat bilgisi'
    },
    {
      term: 'MAT',
      definition: 'Matematik',
      aiContext: 'Problem çözme, sayısal beceriler, mantık'
    },
    {
      term: 'FEN',
      definition: 'Fen Bilimleri (Fizik, Kimya, Biyoloji)',
      aiContext: 'Bilimsel düşünme, deney yorumlama'
    },
    {
      term: 'SOS',
      definition: 'Sosyal Bilgiler (Tarih, Coğrafya, Vatandaşlık)',
      aiContext: 'Tarihsel düşünme, coğrafi bilgi, vatandaşlık bilinci'
    },
    {
      term: 'INK',
      definition: 'T.C. İnkılap Tarihi ve Atatürkçülük',
      aiContext: 'Cumhuriyet tarihi, Atatürk ilkeleri'
    },
    {
      term: 'DIN',
      definition: 'Din Kültürü ve Ahlak Bilgisi',
      aiContext: 'Dini bilgi, ahlaki değerler'
    },
    {
      term: 'ING',
      definition: 'İngilizce / Yabancı Dil',
      aiContext: 'Dil becerileri, okuma-anlama, gramer'
    },
    {
      term: 'FIZ',
      definition: 'Fizik',
      aiContext: 'Fiziksel kavramlar, problem çözme, formül uygulaması'
    },
    {
      term: 'KIM',
      definition: 'Kimya',
      aiContext: 'Kimyasal kavramlar, denklemler, hesaplamalar'
    },
    {
      term: 'BIY',
      definition: 'Biyoloji',
      aiContext: 'Canlı bilimi, ezbere dayalı, görsel hafıza önemli'
    },
    {
      term: 'TAR',
      definition: 'Tarih',
      aiContext: 'Kronolojik düşünme, neden-sonuç ilişkileri'
    },
    {
      term: 'COG',
      definition: 'Coğrafya',
      aiContext: 'Mekansal düşünme, harita okuma, coğrafi kavramlar'
    },
    {
      term: 'FEL',
      definition: 'Felsefe',
      aiContext: 'Mantıksal düşünme, kavram analizi'
    }
  ]
};

// ==================== DEĞERLENDİRME TERİMLERİ ====================

export const ASSESSMENT_TERMS: GlossaryCategory = {
  name: 'Değerlendirme Terimleri',
  entries: [
    {
      term: 'Net',
      definition: 'Doğru sayısından yanlış sayısının 1/4\'ünün çıkarılmasıyla bulunan değer',
      aiContext: 'Türkiye\'de standart ölçüm birimi, "puan" değil "net" kullan',
      example: '30 doğru, 8 yanlış = 30 - (8/4) = 28 net'
    },
    {
      term: 'Doğru',
      definition: 'Doğru cevaplanan soru sayısı',
      aiContext: 'Pozitif gösterge, artması istenen değer'
    },
    {
      term: 'Yanlış',
      definition: 'Yanlış cevaplanan soru sayısı',
      aiContext: 'Net\'ten düşer, dikkat gerektiren alan, "4 yanlış = 1 net kayıp"'
    },
    {
      term: 'Boş',
      definition: 'Cevaplanmayan soru sayısı',
      aiContext: 'Net\'e etkisi yok, bilgi eksikliği veya zaman yönetimi göstergesi'
    },
    {
      term: 'Başarı Oranı',
      definition: 'Doğru sayısının toplam soru sayısına oranı',
      aiContext: 'Yüzdelik olarak ifade edilir (%70 başarı gibi)'
    },
    {
      term: 'Sınıf Ortalaması',
      definition: 'Sınıftaki tüm öğrencilerin net ortalaması',
      aiContext: 'Karşılaştırma için kullanılır, olumsuz karşılaştırma yapma'
    },
    {
      term: 'Okul Ortalaması',
      definition: 'Okuldaki tüm öğrencilerin net ortalaması',
      aiContext: 'Daha geniş perspektif sağlar'
    },
    {
      term: 'Yüzdelik Dilim',
      definition: 'Öğrencinin tüm katılımcılar içindeki konumu (percentile)',
      aiContext: '90. yüzdelik = En iyi %10 içinde'
    },
    {
      term: 'Sıralama',
      definition: 'Öğrencinin sınıf veya okul içindeki sırası',
      aiContext: 'Hassas konudur, dikkatli kullan, motivasyonu etkileyebilir'
    }
  ]
};

// ==================== TREND VE RİSK TERİMLERİ ====================

export const TREND_RISK_TERMS: GlossaryCategory = {
  name: 'Trend ve Risk Terimleri',
  entries: [
    {
      term: 'Yükseliş Trendi',
      definition: 'Son sınavlarda net ortalamasının artması',
      aiContext: 'Pozitif gösterge, motive edici şekilde kullan'
    },
    {
      term: 'Düşüş Trendi',
      definition: 'Son sınavlarda net ortalamasının azalması',
      aiContext: 'Dikkat gerektiren durum, panik yaratmadan ele al'
    },
    {
      term: 'Stabil',
      definition: 'Son sınavlarda belirgin bir değişiklik olmaması',
      aiContext: 'İyileşme veya kötüleşme yok, hedef belirleme fırsatı'
    },
    {
      term: 'Risk Faktörü',
      definition: 'Performansı olumsuz etkileyebilecek durum',
      aiContext: 'Yapıcı şekilde ifade et, çözüm odaklı ol'
    },
    {
      term: 'Tutarlılık',
      definition: 'Sınavlar arası performans değişkenliği',
      aiContext: 'Düşük tutarlılık = yoğun dalgalanma, sebep araştırılmalı'
    }
  ]
};

// ==================== PEDAGOJİK TERİMLER ====================

export const PEDAGOGICAL_TERMS: GlossaryCategory = {
  name: 'Pedagojik Terimler',
  entries: [
    {
      term: 'Kazanım',
      definition: 'Öğrencinin edinmesi beklenen bilgi ve beceri',
      aiContext: 'MEB müfredatı ile uyumlu, ders konularının parçası'
    },
    {
      term: 'Eksik Kazanım',
      definition: 'Henüz yeterince edinilmemiş bilgi veya beceri',
      aiContext: 'Gelişim alanı olarak ifade et, eksiklik olarak değil'
    },
    {
      term: 'Müfredat',
      definition: 'MEB tarafından belirlenen öğretim programı',
      aiContext: 'Konular ve kazanımların kaynağı'
    },
    {
      term: 'Konu Eksikliği',
      definition: 'Belirli konularda yetersiz performans',
      aiContext: 'Çalışma planı için öncelik belirleme kaynağı'
    },
    {
      term: 'Pekiştirme',
      definition: 'Öğrenilen bilginin tekrar ve uygulama ile güçlendirilmesi',
      aiContext: 'Başarılı konular için önerilen aktivite'
    }
  ]
};

// ==================== MOTİVASYON TERİMLERİ ====================

export const MOTIVATION_TERMS: GlossaryCategory = {
  name: 'Motivasyon Terimleri',
  entries: [
    {
      term: 'Gelişim Potansiyeli',
      definition: 'Öğrencinin ilerleyebileceği alan',
      aiContext: '"Zayıf" yerine kullan, daha yapıcı'
    },
    {
      term: 'Güçlü Yön',
      definition: 'Öğrencinin başarılı olduğu alan',
      aiContext: 'Her zaman önce bunları vurgula'
    },
    {
      term: 'Gelişim Alanı',
      definition: 'İyileştirme gerektiren alan',
      aiContext: '"Zayıf yön" yerine kullan'
    },
    {
      term: 'Hedef',
      definition: 'Ulaşılmak istenen performans seviyesi',
      aiContext: 'Gerçekçi ve ölçülebilir hedefler öner'
    },
    {
      term: 'İlerleme',
      definition: 'Önceki performansa göre değişim',
      aiContext: 'Küçük ilerlemeler bile takdir edilmeli'
    }
  ]
};

// ==================== TÜM KATEGORİLER ====================

export const ALL_GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  EXAM_TYPES,
  SUBJECT_CODES,
  ASSESSMENT_TERMS,
  TREND_RISK_TERMS,
  PEDAGOGICAL_TERMS,
  MOTIVATION_TERMS
];

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Terim ara
 */
export function findTerm(term: string): GlossaryEntry | undefined {
  for (const category of ALL_GLOSSARY_CATEGORIES) {
    const entry = category.entries.find(
      e => e.term.toLowerCase() === term.toLowerCase() ||
           e.synonyms?.some(s => s.toLowerCase() === term.toLowerCase())
    );
    if (entry) return entry;
  }
  return undefined;
}

/**
 * Ders kodu için bilgi al
 */
export function getSubjectInfo(code: string): GlossaryEntry | undefined {
  return SUBJECT_CODES.entries.find(
    e => e.term.toLowerCase() === code.toLowerCase()
  );
}

/**
 * AI için terim bağlamı oluştur
 */
export function buildTermContext(): string {
  let context = '## 📚 TÜRKİYE EĞİTİM SİSTEMİ TERİMLERİ\n\n';
  
  for (const category of ALL_GLOSSARY_CATEGORIES) {
    context += `### ${category.name}\n`;
    for (const entry of category.entries) {
      context += `- **${entry.term}**: ${entry.definition}\n`;
    }
    context += '\n';
  }
  
  return context;
}

/**
 * AI için kritik terim uyarıları
 */
export function getCriticalTermWarnings(): string {
  return `
## ⚠️ TERMİNOLOJİ UYARILARI

1. **"Puan" DEĞİL "Net"**: Türkiye'de net kullanılır, puan değil.
2. **"Zayıf" DEĞİL "Gelişim Alanı"**: Yapıcı dil kullan.
3. **"Başarısız" DEĞİL "Geliştirilmeli"**: Damgalama yapma.
4. **"4 yanlış = 1 net"**: Yanlış sayısının önemi budur.
5. **"Boş" netleri etkilemez**: Bilgi eksikliği göstergesi.
`.trim();
}

// ==================== EXPORT ====================

export default {
  EXAM_TYPES,
  SUBJECT_CODES,
  ASSESSMENT_TERMS,
  TREND_RISK_TERMS,
  PEDAGOGICAL_TERMS,
  MOTIVATION_TERMS,
  ALL_GLOSSARY_CATEGORIES,
  findTerm,
  getSubjectInfo,
  buildTermContext,
  getCriticalTermWarnings
};

