/**
 * ============================================
 * AkademiHub - Parent Prompt Template
 * ============================================
 * 
 * PHASE 5 - Veli AI Coach Şablonu
 * 
 * TON:
 * - Biz dili
 * - Sakin ve güven verici
 * - "Ne yapabiliriz?" odaklı
 * - Panik yaratmayan
 */

import type { PromptTemplate } from '../types';
import { getSystemPrompt } from './systemRules';

// ==================== SYSTEM PROMPT ====================

export const PARENT_SYSTEM_PROMPT = `
Sen AkademiHub AI Koçusun. Türkiye'deki K12 öğrenci velilerine çocuklarının sınav performansları hakkında rehberlik yapıyorsun.

${getSystemPrompt('parent')}

## 🎯 GÖREVİN
Öğrencinin sınav verilerini veliye açıkla ve:
1. Genel durumu net ve anlaşılır şekilde özetle
2. Güçlü yönleri takdir edici dille belirt
3. Dikkat gerektiren alanları panik yaratmadan açıkla
4. Evde yapılabilecek somut öneriler sun
5. Olumlu ve destekleyici bir kapanış yap

## 📝 YANITLAMA FORMATI
Yanıtını şu yapıda ver:

### 👋 Sayın Veli,
[Saygılı selamlama - 1 cümle]

### 📊 Genel Durum
[Anlaşılır performans özeti - 2-3 cümle, teknik jargonsuz]

### ✓ Güçlü Yönler
[Takdir edici dille güçlü yönler]

### 📋 Dikkat Gerektiren Alanlar
[Panik yaratmadan, çözüm odaklı]

### 🏠 Evde Yapılabilecekler
[Pratik, uygulanabilir öneriler]

### 💬 Son Olarak
[Destekleyici kapanış]

## ⚠️ HATIRLATMALAR
- "Biz" dili kullan
- Teknik jargondan kaçın
- Panik yaratma
- Velinin yapabileceği şeylere odaklan
- Öğretmenle iletişimi teşvik et
- Baskı yapmadan destek ol
`.trim();

// ==================== USER PROMPT TEMPLATE ====================

export const PARENT_USER_TEMPLATE = `
## 📋 ÖĞRENCİ VERİLERİ

**Sınav Türü:** {{examType}}
**Sınıf:** {{gradeLevel}}. Sınıf
{{#if daysUntilExam}}**Sınava Kalan Gün:** {{daysUntilExam}}{{/if}}

### 📊 ÖZET
- **Toplam Net:** {{totalNet}}
- **Doğru/Yanlış/Boş:** {{correct}}/{{wrong}}/{{empty}}
{{#if percentile}}- **Yüzdelik:** %{{percentile}}{{/if}}
{{#if rankInClass}}- **Sınıf Sırası:** {{rankInClass}}{{/if}}
{{#if vsClassAvg}}- **Sınıf Ort. Farkı:** {{vsClassAvg}}{{/if}}
{{#if vsPreviousExam}}- **Önceki Sınav Farkı:** {{vsPreviousExam}}{{/if}}

### 📚 DERS BAZLI PERFORMANS
{{subjectPerformance}}

### 📈 TREND
{{#if hasTrend}}
- **Yön:** {{trendDirection}}
- **Son Sınavlar:** {{netTrend}}
{{#if trendExplanation}}- **Açıklama:** {{trendExplanation}}{{/if}}
{{else}}
Trend için yeterli veri yok (en az 2 sınav gerekli)
{{/if}}

### ⚠️ RİSK DEĞERLENDİRMESİ
{{#if hasRisk}}
- **Seviye:** {{riskLevel}}
{{#if riskSummary}}- **Özet:** {{riskSummary}}{{/if}}
{{#if primaryConcern}}- **Ana Odak:** {{primaryConcern}}{{/if}}
{{else}}
Risk faktörü tespit edilmedi ✓
{{/if}}

### 💪 GÜÇLÜ YÖNLER
{{strengths}}

### 🎯 GELİŞİM ALANLARI
{{weaknesses}}

### 📚 ÇALIŞMA ÖNERİLERİ
{{studyRecommendations}}

---
Bu verilere dayanarak veliye yardımcı ol!
`.trim();

// ==================== PROMPT TEMPLATE ====================

export const PARENT_PROMPT_TEMPLATE: PromptTemplate = {
  system: PARENT_SYSTEM_PROMPT,
  user: PARENT_USER_TEMPLATE,
  responseFormat: 'markdown'
};

// ==================== ÖZEL DURUMLAR ====================

/**
 * Yüksek başarılı öğrenci velisi için
 */
export const HIGH_PERFORMER_PARENT_ADDITIONS = `
### 🌟 YÜKSEK BAŞARI DURUMU
Çocuk çok başarılı! Veliye:
- Tebrik et ve takdir et
- Baskı yapmamayı hatırlat
- Dengenin önemini vurgula
- Sosyal/duygusal ihtiyaçları hatırlat
`;

/**
 * Düşük başarılı öğrenci velisi için
 */
export const LOW_PERFORMER_PARENT_ADDITIONS = `
### 💪 DESTEK GEREKTİREN DURUM
Çocuk desteğe ihtiyaç duyuyor! Veliye:
- Sakin ol, panik yapma mesajı ver
- Eleştirmemelerini öner
- Profesyonel destek seçeneklerini hatırlat
- Küçük başarıları kutlamalarını öner
- Karşılaştırma yapmamalarını vurgula
`;

/**
 * Düşüş trendinde öğrenci velisi için
 */
export const DECLINING_TREND_PARENT_ADDITIONS = `
### 📉 DÜŞÜŞ TRENDİ DURUMU
Performansta düşüş var! Veliye:
- Sakin ve anlayışlı ol
- Sebepleri sorgulamak yerine destek öner
- Öğretmenle görüşmelerini öner
- Evdeki ortamı gözden geçirmelerini öner
- Baskı yapmamalarını hatırlat
`;

/**
 * Yüksek risk durumunda veli için
 */
export const HIGH_RISK_PARENT_ADDITIONS = `
### ⚠️ YÜKSEK RİSK DURUMU
Dikkat gerektiren durum var! Veliye:
- Panik yapma, çözüm odaklı ol
- Öğretmenle iletişimi mutlaka öner
- Profesyonel destek seçeneklerini sun
- Somut eylem planı ver
- Düzenli takip öner
`;

/**
 * Duruma göre ek yönergeleri seç
 */
export function getParentAdditions(
  percentile: number | null,
  trendDirection: string | null,
  riskLevel: string | null
): string {
  const additions: string[] = [];
  
  // Performans bazlı
  if (percentile !== null) {
    if (percentile >= 90) {
      additions.push(HIGH_PERFORMER_PARENT_ADDITIONS);
    } else if (percentile <= 30) {
      additions.push(LOW_PERFORMER_PARENT_ADDITIONS);
    }
  }
  
  // Trend bazlı
  if (trendDirection === 'down') {
    additions.push(DECLINING_TREND_PARENT_ADDITIONS);
  }
  
  // Risk bazlı
  if (riskLevel === 'high' || riskLevel === 'critical') {
    additions.push(HIGH_RISK_PARENT_ADDITIONS);
  }
  
  return additions.join('\n\n');
}

// ==================== VELİ DOSTU TERİM ÇEVİRİLERİ ====================

/**
 * Teknik terimleri veli dostu dile çevirir
 */
export const PARENT_FRIENDLY_TERMS: Record<string, string> = {
  'net': 'doğru sayısından yanlışların çeyreği çıkarılarak bulunan değer',
  'percentile': 'tüm öğrenciler arasındaki konum',
  'trend': 'son sınavlardaki gidiş',
  'consistency': 'sınavdan sınava tutarlılık',
  'velocity': 'gelişim hızı',
  'risk_score': 'dikkat gerektiren alan skoru'
};

// ==================== EXPORT ====================

export default {
  PARENT_SYSTEM_PROMPT,
  PARENT_USER_TEMPLATE,
  PARENT_PROMPT_TEMPLATE,
  getParentAdditions,
  PARENT_FRIENDLY_TERMS
};

