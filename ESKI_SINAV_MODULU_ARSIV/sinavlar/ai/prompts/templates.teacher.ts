/**
 * ============================================
 * AkademiHub - Teacher Prompt Template
 * ============================================
 * 
 * PHASE 5 - Öğretmen AI Coach Şablonu
 * 
 * TON:
 * - Analitik ve veri odaklı
 * - Profesyonel
 * - Müdahale önerili
 * - Pedagojik terminoloji
 */

import type { PromptTemplate } from '../types';
import { getSystemPrompt } from './systemRules';

// ==================== SYSTEM PROMPT ====================

export const TEACHER_SYSTEM_PROMPT = `
Sen AkademiHub AI Analiz Asistanısın. Türkiye'deki K12 öğretmenlerine öğrenci performans analizi hakkında profesyonel destek sağlıyorsun.

${getSystemPrompt('teacher')}

## 🎯 GÖREVİN
Öğrencinin sınav verilerini analiz et ve öğretmene:
1. Performansı veri destekli şekilde özetle
2. Sınıf bağlamında değerlendir
3. Trend analizini sun
4. Risk faktörlerini vurgula
5. Pedagojik müdahale önerileri sun
6. Takip stratejileri öner

## 📝 YANITLAMA FORMATI
Yanıtını şu yapıda ver:

### 📊 Performans Özeti
[Veri referanslı, analitik özet]

### 📈 Trend Analizi
[Son sınavlara dayalı değerlendirme]

### ✓ Güçlü Alanlar
[Veri destekli güçlü yönler]

### ⚠️ Müdahale Gerektiren Alanlar
[Risk faktörleri ve dikkat noktaları]

### 🎓 Pedagojik Öneriler
[Somut müdahale stratejileri]

### 📋 Takip Önerileri
[İzleme ve değerlendirme önerileri]

## ⚠️ HATIRLATMALAR
- Profesyonel ve meslektaşça ton
- Veri destekli ifadeler kullan
- Pedagojik terminoloji kullanabilirsin
- Somut ve uygulanabilir öneriler sun
- Sınıf ortalaması bağlamını ver
- Bireyselleştirilmiş müdahale öner
`.trim();

// ==================== USER PROMPT TEMPLATE ====================

export const TEACHER_USER_TEMPLATE = `
## 📋 ÖĞRENCİ ANALİZ VERİLERİ

**Sınav Türü:** {{examType}}
**Sınıf Seviyesi:** {{gradeLevel}}. Sınıf
{{#if daysUntilExam}}**Merkezi Sınava Kalan Gün:** {{daysUntilExam}}{{/if}}

### 📊 PERFORMANS ÖZETİ
| Metrik | Değer |
|--------|-------|
| Toplam Net | {{totalNet}} |
| Doğru | {{correct}} |
| Yanlış | {{wrong}} |
| Boş | {{empty}} |
{{#if percentile}}| Yüzdelik | %{{percentile}} |{{/if}}
{{#if rankInClass}}| Sınıf Sırası | {{rankInClass}} |{{/if}}
{{#if rankInExam}}| Sınav Sırası | {{rankInExam}} |{{/if}}

### 📐 KARŞILAŞTIRMALI ANALİZ
{{#if vsClassAvg}}- Sınıf Ortalamasına Göre: {{vsClassAvg}}{{/if}}
{{#if vsSchoolAvg}}- Okul Ortalamasına Göre: {{vsSchoolAvg}}{{/if}}
{{#if vsPreviousExam}}- Önceki Sınava Göre: {{vsPreviousExam}}{{/if}}

### 📚 DERS BAZLI PERFORMANS
{{subjectPerformanceDetailed}}

### 📈 TREND ANALİZİ
{{#if hasTrend}}
- **Trend Yönü:** {{trendDirection}}
- **Trend Skoru:** {{trendScore}}
- **Velocity:** {{velocity}} net/sınav
- **Tutarlılık:** {{consistency}}
- **Son {{examCount}} Sınav Netleri:** {{netTrend}}
{{#if trendExplanation}}- **Yorum:** {{trendExplanation}}{{/if}}
{{else}}
Trend analizi için yeterli veri bulunmamaktadır (min. 2 sınav gerekli).
{{/if}}

### ⚠️ RİSK DEĞERLENDİRMESİ
{{#if hasRisk}}
- **Risk Seviyesi:** {{riskLevel}}
- **Risk Skoru:** {{riskScore}}/100
{{#if actionRequired}}- **Aksiyon Gerekli:** Evet{{/if}}
{{#if primaryConcern}}- **Birincil Endişe:** {{primaryConcern}}{{/if}}
{{#if riskFactors}}
**Risk Faktörleri:**
{{riskFactors}}
{{/if}}
{{else}}
Önemli risk faktörü tespit edilmedi.
{{/if}}

### 🎯 ZORLUK SEVİYESİ ANALİZİ
{{#if hasDifficultyData}}
| Zorluk | Doğru/Toplam | Başarı |
|--------|--------------|--------|
| Kolay | {{easyCorrect}}/{{easyTotal}} | %{{easyRate}} |
| Orta | {{mediumCorrect}}/{{mediumTotal}} | %{{mediumRate}} |
| Zor | {{hardCorrect}}/{{hardTotal}} | %{{hardRate}} |
{{/if}}

### 💪 GÜÇLÜ ALANLAR
{{strengths}}

### 🎯 GELİŞİM ALANLARI
{{weaknesses}}

### 📋 İYİLEŞTİRME ÖNCELİKLERİ
{{improvementPriorities}}

### 📝 META VERİ
- Veri Kalitesi: {{dataCompleteness}}
- Güven Skoru: {{confidenceScore}}
- Son Güncelleme: {{calculatedAt}}

---
Bu verilere dayanarak öğretmene profesyonel destek sağla!
`.trim();

// ==================== PROMPT TEMPLATE ====================

export const TEACHER_PROMPT_TEMPLATE: PromptTemplate = {
  system: TEACHER_SYSTEM_PROMPT,
  user: TEACHER_USER_TEMPLATE,
  responseFormat: 'markdown'
};

// ==================== ÖZEL DURUMLAR ====================

/**
 * Kritik risk durumu için
 */
export const CRITICAL_RISK_ADDITIONS = `
### 🚨 KRİTİK RİSK DURUMU
Acil müdahale gerektirebilecek durum tespit edildi:
- Veli görüşmesi öner
- Rehberlik servisi yönlendirmesi düşün
- Bireysel takip planı öner
- Kısa vadeli ve somut hedefler belirle
`;

/**
 * Yüksek başarı durumu için
 */
export const HIGH_ACHIEVEMENT_ADDITIONS = `
### 🌟 YÜKSEK BAŞARI DURUMU
Üstün performans gösteren öğrenci:
- Zenginleştirme aktiviteleri öner
- Liderlik fırsatları değerlendir
- Mükemmeliyetçilik riskine dikkat et
- Akran desteği rolü düşün
`;

/**
 * Tutarsız performans için
 */
export const INCONSISTENT_PERFORMANCE_ADDITIONS = `
### 📊 TUTARSIZ PERFORMANS
Sınavlar arası yüksek varyans:
- Stres faktörlerini değerlendir
- Çalışma düzenini sorgula
- Dış faktörleri araştır
- Düzenli takip öner
`;

/**
 * Duruma göre ek yönergeleri seç
 */
export function getTeacherAdditions(
  percentile: number | null,
  riskLevel: string | null,
  consistency: number | null
): string {
  const additions: string[] = [];
  
  // Risk bazlı
  if (riskLevel === 'critical') {
    additions.push(CRITICAL_RISK_ADDITIONS);
  }
  
  // Performans bazlı
  if (percentile !== null && percentile >= 95) {
    additions.push(HIGH_ACHIEVEMENT_ADDITIONS);
  }
  
  // Tutarlılık bazlı
  if (consistency !== null && consistency < 0.5) {
    additions.push(INCONSISTENT_PERFORMANCE_ADDITIONS);
  }
  
  return additions.join('\n\n');
}

// ==================== PEDAGOJİK MÜDAHALELİK ÖNERİLERİ ====================

/**
 * Risk seviyesine göre müdahale önerileri
 */
export const INTERVENTION_SUGGESTIONS: Record<string, string[]> = {
  low: [
    'Mevcut performansı pekiştirici aktiviteler',
    'Hedef belirleme desteği',
    'Özerk çalışma teşviki'
  ],
  medium: [
    'Haftalık takip görüşmeleri',
    'Eksik kazanım odaklı ödev',
    'Küçük grup çalışması',
    'Veli bilgilendirmesi'
  ],
  high: [
    'Günlük kısa takip',
    'Bireyselleştirilmiş ödev',
    'Rehberlik yönlendirmesi değerlendirmesi',
    'Veli görüşmesi',
    'Akran destek eşleştirmesi'
  ],
  critical: [
    'Acil veli görüşmesi',
    'Rehberlik servisi koordinasyonu',
    'Bireysel eğitim planı (BEP) değerlendirmesi',
    'Günlük ilerleme takibi',
    'Destek ekibi toplantısı'
  ]
};

/**
 * Risk seviyesine göre müdahale önerilerini al
 */
export function getInterventionSuggestions(riskLevel: string | null): string[] {
  if (!riskLevel) return INTERVENTION_SUGGESTIONS.low;
  return INTERVENTION_SUGGESTIONS[riskLevel] ?? INTERVENTION_SUGGESTIONS.low;
}

// ==================== EXPORT ====================

export default {
  TEACHER_SYSTEM_PROMPT,
  TEACHER_USER_TEMPLATE,
  TEACHER_PROMPT_TEMPLATE,
  getTeacherAdditions,
  INTERVENTION_SUGGESTIONS,
  getInterventionSuggestions
};

