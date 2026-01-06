/**
 * ============================================
 * AkademiHub - Product Layer
 * ============================================
 * 
 * PHASE 6 - Productization & Delivery Layer
 * 
 * Bu modül:
 * - Dashboard bileşenleri
 * - WhatsApp engine
 * - PDF AI section
 * - Adapter pattern
 * 
 * KURALLAR:
 * - HESAPLAMA YOK
 * - AI TETİKLEME YOK
 * - SADECE SNAPSHOT OKUMA
 */

// ==================== TYPES ====================

export type {
  ProductDataState,
  StatusColor,
  CTAAction,
  DashboardViewModel,
  PriorityItem,
  CTAButton,
  DashboardMetadata,
  InsightPulseViewModel,
  WhatsAppViewModel,
  WhatsAppTemplate,
  PDFAIOpinionViewModel,
  PDFSection,
  PDFActionItem,
  PDFWeeklyPlan,
  PDFDayPlan,
  PDFMetadata,
  ProductAdapterInput,
  UseProductDataResult,
  UseProductDataParams,
  I18nMessages
} from './types';

export {
  STATUS_COLORS,
  CTA_ICONS,
  TREND_ICONS,
  WHATSAPP_CHAR_LIMIT
} from './types';

// ==================== ADAPTERS ====================

export {
  // Dashboard Adapter
  toDashboardViewModel,
  toInsightPulseViewModel,
  
  // WhatsApp Adapter
  toWhatsAppViewModel,
  
  // PDF Adapter
  toPDFViewModel,
  
  // Hooks
  useProductData,
  useDashboardData,
  useInsightPulse,
  
  // Convenience
  ProductAdapters
} from './adapters';

// ==================== DASHBOARD COMPONENTS ====================

export {
  // States
  StateContainer,
  LoadingState,
  EmptyState,
  GeneratingState,
  ErrorState,
  StaleIndicator,
  PulseDot,
  
  // Components
  AICoachCard,
  InsightPulse,
  InsightPulseCompact,
  ActionCenter,
  PrimaryAction,
  FloatingAction,
  
  // Convenience
  DashboardComponents
} from './dashboard';

export type {
  StateContainerProps,
  AICoachCardProps,
  InsightPulseProps,
  ActionCenterProps,
  PrimaryActionProps,
  FloatingActionProps
} from './dashboard';

// ==================== WHATSAPP ENGINE ====================

export {
  // Templates
  FORBIDDEN_WORDS,
  SAFE_ALTERNATIVES,
  PLACEHOLDERS,
  buildTemplate,
  sanitizeMessage,
  isMessageSafe,
  
  // Message Builder
  buildWhatsAppMessage,
  buildBatchMessages,
  
  // Link Generator
  generateSecureLink,
  validateToken,
  isLinkExpired,
  generateWhatsAppShareUrl,
  generateWhatsAppDirectUrl,
  
  // i18n
  getI18n,
  getWhatsAppTemplate,
  getAllTemplates,
  
  // Convenience
  WhatsAppEngine
} from './whatsapp';

export type {
  MessageBuilderInput,
  BuiltMessage,
  SecureLinkInput,
  SecureLinkResult
} from './whatsapp';

// ==================== PDF ====================

export { AIExpertOpinion } from './pdf';
export type { AIExpertOpinionProps } from './pdf';

// ==================== CONVENIENCE EXPORTS ====================

import { ProductAdapters } from './adapters';
import { DashboardComponents } from './dashboard';
import { WhatsAppEngine } from './whatsapp';
import { AIExpertOpinion } from './pdf';

/**
 * Product Layer - Quick Access
 * 
 * @example
 * import { ProductLayer } from '@/lib/sinavlar/product';
 * 
 * // Dashboard ViewModel
 * const dashboard = ProductLayer.adapters.dashboard({ snapshot, role, language });
 * 
 * // WhatsApp mesajı
 * const whatsapp = ProductLayer.whatsapp.buildMessage({ snapshot, role, language });
 * 
 * // Dashboard component
 * <ProductLayer.components.AICoachCard viewModel={dashboard} />
 */
export const ProductLayer = {
  adapters: ProductAdapters,
  components: DashboardComponents,
  whatsapp: WhatsAppEngine,
  pdf: { AIExpertOpinion }
};

export default ProductLayer;

