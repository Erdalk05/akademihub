/**
 * ============================================
 * AkademiHub - Product Layer Types
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Dashboard, PDF, WhatsApp için ViewModel'ler
 * - State yönetimi tipleri
 * - Adapter contract'ları
 * 
 * KURALLAR:
 * - HESAPLAMA YOK
 * - AI TETİKLEME YOK
 * - SADECE SNAPSHOT OKUMA
 */

import type { AIRole } from '../ai/types';
import type { AISnapshotRecord } from '../ai/cache/types';

// ==================== STATE TYPES ====================

/**
 * Product data durumu
 */
export type ProductDataState = 
  | 'ready'       // Snapshot hazır, gösterilebilir
  | 'generating'  // AI snapshot üretiliyor
  | 'stale'       // Eski ama gösterilebilir
  | 'empty'       // Hiç snapshot yok
  | 'error';      // Hata oluştu

/**
 * Status rengi
 */
export type StatusColor = 'green' | 'amber' | 'softRed';

/**
 * CTA aksiyonları
 */
export type CTAAction = 
  | 'download_pdf'
  | 'ask_teacher'
  | 'open_ai'
  | 'share_whatsapp'
  | 'view_details';

// ==================== DASHBOARD VIEWMODEL ====================

/**
 * Dashboard ana ViewModel
 */
export interface DashboardViewModel {
  // Header: Kısa özet (1 cümle)
  header: string;
  
  // Body: 2-3 cümlelik yorum
  body: string;
  
  // Öncelik listesi (max 3)
  priorityList: PriorityItem[];
  
  // Status rengi (risk bazlı)
  statusColor: StatusColor;
  
  // CTA butonları
  ctas: CTAButton[];
  
  // Fallback mı?
  isFallback: boolean;
  
  // Mevcut state
  state: ProductDataState;
  
  // Metadata
  metadata: DashboardMetadata;
}

/**
 * Öncelik item
 */
export interface PriorityItem {
  // Öncelik numarası (1, 2, 3)
  priority: number;
  
  // Başlık
  title: string;
  
  // Açıklama
  description: string;
  
  // Kategori
  category: 'study' | 'practice' | 'review' | 'focus' | 'rest';
  
  // İkon (emoji)
  icon: string;
}

/**
 * CTA butonu
 */
export interface CTAButton {
  // Buton metni
  label: string;
  
  // Aksiyon tipi
  action: CTAAction;
  
  // İkon (emoji)
  icon: string;
  
  // Aktif mi?
  enabled: boolean;
  
  // URL (varsa)
  url?: string;
}

/**
 * Dashboard metadata
 */
export interface DashboardMetadata {
  // Snapshot ID
  snapshotId: string | null;
  
  // Oluşturulma zamanı
  generatedAt: string | null;
  
  // Model
  model: string | null;
  
  // Rol
  role: AIRole;
  
  // Veri kalitesi
  dataQuality: 'high' | 'medium' | 'low';
  
  // Son güncelleme
  lastUpdated: string | null;
}

// ==================== INSIGHT PULSE VIEWMODEL ====================

/**
 * InsightPulse ViewModel
 */
export interface InsightPulseViewModel {
  // Trend yönü
  trendDirection: 'up' | 'down' | 'stable' | 'unknown';
  
  // Trend mesajı
  trendMessage: string;
  
  // Trend ikonu
  trendIcon: string;
  
  // Risk seviyesi
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  
  // Risk mesajı
  riskMessage: string | null;
  
  // Nabız değeri (0-100, sadece visual için)
  pulseValue: number;
  
  // Pulse rengi
  pulseColor: StatusColor;
}

// ==================== WHATSAPP VIEWMODEL ====================

/**
 * WhatsApp mesaj ViewModel
 */
export interface WhatsAppViewModel {
  // Ana mesaj (max 160 karakter)
  message: string;
  
  // PDF linki
  pdfLink: string | null;
  
  // Link token (güvenlik)
  linkToken: string | null;
  
  // Link geçerlilik süresi
  linkExpiresAt: string | null;
  
  // Tam mesaj (link dahil)
  fullMessage: string;
  
  // Karakter sayısı
  characterCount: number;
  
  // Geçerli mi? (160 karakter altında)
  isValid: boolean;
  
  // Dil
  language: 'tr' | 'en';
  
  // Rol
  role: AIRole;
}

/**
 * WhatsApp mesaj şablonu
 */
export interface WhatsAppTemplate {
  // Şablon ID
  id: string;
  
  // Rol
  role: AIRole;
  
  // Risk seviyesi
  riskLevel: 'low' | 'medium' | 'high';
  
  // Şablon metni (placeholder'lı)
  template: string;
  
  // Dil
  language: 'tr' | 'en';
}

// ==================== PDF VIEWMODEL ====================

/**
 * PDF AI Expert Opinion ViewModel
 */
export interface PDFAIOpinionViewModel {
  // Executive Summary
  executiveSummary: string;
  
  // Güçlü yönler
  strengths: PDFSection;
  
  // Gelişim alanları
  growthAreas: PDFSection;
  
  // Öncelikli aksiyonlar
  priorityActions: PDFActionItem[];
  
  // Haftalık mini öğrenme planı
  weeklyPlan: PDFWeeklyPlan;
  
  // Kapanış mesajı
  closingMessage: string;
  
  // Metadata
  metadata: PDFMetadata;
}

/**
 * PDF bölüm
 */
export interface PDFSection {
  // Başlık
  title: string;
  
  // İçerik paragrafı
  content: string;
  
  // Madde listesi
  bulletPoints: string[];
}

/**
 * PDF aksiyon item
 */
export interface PDFActionItem {
  // Öncelik
  priority: number;
  
  // Başlık
  title: string;
  
  // Açıklama
  description: string;
  
  // Tahmini süre
  estimatedTime?: string;
}

/**
 * PDF haftalık plan
 */
export interface PDFWeeklyPlan {
  // Başlık
  title: string;
  
  // Günler
  days: PDFDayPlan[];
}

/**
 * PDF gün planı
 */
export interface PDFDayPlan {
  // Gün adı
  day: string;
  
  // Aktiviteler
  activities: string[];
}

/**
 * PDF metadata
 */
export interface PDFMetadata {
  // Snapshot ID
  snapshotId: string;
  
  // Oluşturulma zamanı
  generatedAt: string;
  
  // Model
  model: string;
  
  // Veri kalitesi
  dataQuality: 'high' | 'medium' | 'low';
  
  // Versiyon
  version: string;
}

// ==================== ADAPTER INPUT ====================

/**
 * Adapter girdi
 */
export interface ProductAdapterInput {
  // Snapshot kaydı
  snapshot: AISnapshotRecord | null;
  
  // Rol
  role: AIRole;
  
  // Dil
  language: 'tr' | 'en';
  
  // Öğrenci adı (opsiyonel, WhatsApp için)
  studentName?: string;
  
  // Sınav adı (opsiyonel)
  examName?: string;
  
  // State override
  stateOverride?: ProductDataState;
}

// ==================== HOOK TYPES ====================

/**
 * useProductData hook sonucu
 */
export interface UseProductDataResult {
  // Dashboard ViewModel
  dashboard: DashboardViewModel | null;
  
  // InsightPulse ViewModel
  insightPulse: InsightPulseViewModel | null;
  
  // WhatsApp ViewModel (lazy)
  getWhatsAppViewModel: (studentName?: string) => WhatsAppViewModel | null;
  
  // PDF ViewModel (lazy)
  getPDFViewModel: () => PDFAIOpinionViewModel | null;
  
  // State
  state: ProductDataState;
  
  // Loading
  isLoading: boolean;
  
  // Error
  error: string | null;
  
  // Refresh fonksiyonu
  refresh: () => Promise<void>;
}

/**
 * useProductData hook parametreleri
 */
export interface UseProductDataParams {
  // Sınav ID
  examId: string;
  
  // Öğrenci ID
  studentId: string;
  
  // Rol
  role: AIRole;
  
  // Dil
  language?: 'tr' | 'en';
  
  // Auto refresh
  autoRefresh?: boolean;
  
  // Stale kabul et
  acceptStale?: boolean;
}

// ==================== I18N TYPES ====================

/**
 * i18n mesajları
 */
export interface I18nMessages {
  // Dashboard mesajları
  dashboard: {
    loading: string;
    empty: string;
    stale: string;
    error: string;
    generating: string;
  };
  
  // CTA etiketleri
  cta: {
    downloadPdf: string;
    askTeacher: string;
    openAi: string;
    shareWhatsapp: string;
    viewDetails: string;
  };
  
  // Trend mesajları
  trend: {
    up: string;
    down: string;
    stable: string;
    unknown: string;
  };
  
  // Risk mesajları
  risk: {
    low: string;
    medium: string;
    high: string;
  };
}

// ==================== CONSTANTS ====================

/**
 * Varsayılan status renkleri
 */
export const STATUS_COLORS: Record<string, StatusColor> = {
  low: 'green',
  medium: 'amber',
  high: 'softRed'
};

/**
 * CTA ikonları
 */
export const CTA_ICONS: Record<CTAAction, string> = {
  download_pdf: '📄',
  ask_teacher: '👩‍🏫',
  open_ai: '🤖',
  share_whatsapp: '📲',
  view_details: '🔍'
};

/**
 * Trend ikonları
 */
export const TREND_ICONS = {
  up: '📈',
  down: '📉',
  stable: '➡️',
  unknown: '❓'
};

/**
 * WhatsApp karakter limiti
 */
export const WHATSAPP_CHAR_LIMIT = 160;

// ==================== EXPORT ====================

export default {
  STATUS_COLORS,
  CTA_ICONS,
  TREND_ICONS,
  WHATSAPP_CHAR_LIMIT
};

