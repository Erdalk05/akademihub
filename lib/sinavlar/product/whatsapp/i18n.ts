/**
 * ============================================
 * AkademiHub - WhatsApp i18n
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - TR/EN mesaj yönetimi
 * - WhatsApp şablonları
 * - Dashboard mesajları
 */

import type { I18nMessages, WhatsAppTemplate } from '../types';

// ==================== TÜRKÇE MESAJLAR ====================

const TR_MESSAGES: I18nMessages = {
  dashboard: {
    loading: 'Yükleniyor...',
    empty: 'Henüz analiz oluşturulmadı',
    stale: 'Yeni analiz hazırlanıyor',
    error: 'Bir hata oluştu',
    generating: 'Koçunuz analiz yapıyor...'
  },
  cta: {
    downloadPdf: 'PDF İndir',
    askTeacher: 'Öğretmene Sor',
    openAi: 'Koçtan Öneri Al',
    shareWhatsapp: 'WhatsApp Paylaş',
    viewDetails: 'Detayları Gör'
  },
  trend: {
    up: 'Yükseliş trendi görülüyor 📈',
    down: 'Performans dikkat gerektiriyor',
    stable: 'Stabil bir performans sergileniyor',
    unknown: 'Trend bilgisi henüz mevcut değil'
  },
  risk: {
    low: 'Performans iyi durumda',
    medium: 'Bazı alanlara dikkat gerekiyor',
    high: 'Öncelikli çalışma alanları belirlendi'
  }
};

// ==================== İNGİLİZCE MESAJLAR ====================

const EN_MESSAGES: I18nMessages = {
  dashboard: {
    loading: 'Loading...',
    empty: 'No analysis available yet',
    stale: 'New analysis is being prepared',
    error: 'An error occurred',
    generating: 'Your coach is analyzing...'
  },
  cta: {
    downloadPdf: 'Download PDF',
    askTeacher: 'Ask Teacher',
    openAi: 'Get AI Advice',
    shareWhatsapp: 'Share on WhatsApp',
    viewDetails: 'View Details'
  },
  trend: {
    up: 'Upward trend observed 📈',
    down: 'Performance needs attention',
    stable: 'Stable performance maintained',
    unknown: 'Trend information not available yet'
  },
  risk: {
    low: 'Performance is in good shape',
    medium: 'Some areas need attention',
    high: 'Priority study areas identified'
  }
};

// ==================== WHATSAPP ŞABLONLARI ====================

const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  // ========== STUDENT TEMPLATES ==========
  {
    id: 'student-low-tr',
    role: 'student',
    riskLevel: 'low',
    template: 'AkademiHub: Harika gidiyorsun! 🌟 {focusAreas} alanlarında güçlenmeye devam et.',
    language: 'tr'
  },
  {
    id: 'student-medium-tr',
    role: 'student',
    riskLevel: 'medium',
    template: 'AkademiHub: {focusAreas} konularına odaklanarak ilerleyebilirsin. Küçük adımlar büyük fark yaratır! 💪',
    language: 'tr'
  },
  {
    id: 'student-high-tr',
    role: 'student',
    riskLevel: 'high',
    template: 'AkademiHub: Bu hafta {focusAreas} odaklı küçük ama etkili adımlar öneriyoruz.',
    language: 'tr'
  },
  
  // ========== PARENT TEMPLATES ==========
  {
    id: 'parent-low-tr',
    role: 'parent',
    riskLevel: 'low',
    template: 'AkademiHub: {studentName} harika bir performans sergiliyor! 🌟 Detaylı rapor ekte.',
    language: 'tr'
  },
  {
    id: 'parent-medium-tr',
    role: 'parent',
    riskLevel: 'medium',
    template: 'AkademiHub: {studentName} için {focusAreas} alanlarında birlikte çalışabiliriz.',
    language: 'tr'
  },
  {
    id: 'parent-high-tr',
    role: 'parent',
    riskLevel: 'high',
    template: 'AkademiHub: {studentName} için bu hafta {focusAreas} odaklı destek öneriyoruz.',
    language: 'tr'
  },
  
  // ========== TEACHER TEMPLATES ==========
  {
    id: 'teacher-low-tr',
    role: 'teacher',
    riskLevel: 'low',
    template: 'AkademiHub: Öğrenci analizi hazır. Genel performans iyi durumda.',
    language: 'tr'
  },
  {
    id: 'teacher-medium-tr',
    role: 'teacher',
    riskLevel: 'medium',
    template: 'AkademiHub: Öğrenci analizi hazır. {focusAreas} alanlarında müdahale önerileri mevcut.',
    language: 'tr'
  },
  {
    id: 'teacher-high-tr',
    role: 'teacher',
    riskLevel: 'high',
    template: 'AkademiHub: Öğrenci analizi hazır. Öncelikli müdahale alanları belirlendi.',
    language: 'tr'
  },
  
  // ========== ENGLISH TEMPLATES ==========
  {
    id: 'student-low-en',
    role: 'student',
    riskLevel: 'low',
    template: 'AkademiHub: Great job! 🌟 Keep strengthening your {focusAreas} skills.',
    language: 'en'
  },
  {
    id: 'student-medium-en',
    role: 'student',
    riskLevel: 'medium',
    template: 'AkademiHub: Focus on {focusAreas} to progress. Small steps make a big difference! 💪',
    language: 'en'
  },
  {
    id: 'student-high-en',
    role: 'student',
    riskLevel: 'high',
    template: 'AkademiHub: This week we suggest focusing on {focusAreas} with small but effective steps.',
    language: 'en'
  },
  {
    id: 'parent-low-en',
    role: 'parent',
    riskLevel: 'low',
    template: 'AkademiHub: {studentName} is showing great performance! 🌟 Detailed report attached.',
    language: 'en'
  },
  {
    id: 'parent-medium-en',
    role: 'parent',
    riskLevel: 'medium',
    template: 'AkademiHub: We can work together on {focusAreas} for {studentName}.',
    language: 'en'
  },
  {
    id: 'parent-high-en',
    role: 'parent',
    riskLevel: 'high',
    template: 'AkademiHub: This week we suggest {focusAreas} focused support for {studentName}.',
    language: 'en'
  }
];

// ==================== FONKSİYONLAR ====================

/**
 * Dil bazlı mesajları döndürür
 */
export function getI18n(language: 'tr' | 'en' = 'tr'): I18nMessages {
  return language === 'en' ? EN_MESSAGES : TR_MESSAGES;
}

/**
 * WhatsApp şablonunu döndürür
 */
export function getWhatsAppTemplate(
  role: 'student' | 'parent' | 'teacher',
  riskLevel: 'low' | 'medium' | 'high',
  language: 'tr' | 'en' = 'tr'
): string {
  const template = WHATSAPP_TEMPLATES.find(
    t => t.role === role && t.riskLevel === riskLevel && t.language === language
  );
  
  if (template) {
    return template.template;
  }
  
  // Fallback
  return language === 'tr'
    ? 'AkademiHub: Analiz raporu hazır.'
    : 'AkademiHub: Analysis report is ready.';
}

/**
 * Tüm şablonları döndürür
 */
export function getAllTemplates(): WhatsAppTemplate[] {
  return WHATSAPP_TEMPLATES;
}

// ==================== EXPORT ====================

export default {
  getI18n,
  getWhatsAppTemplate,
  getAllTemplates,
  TR_MESSAGES,
  EN_MESSAGES
};

