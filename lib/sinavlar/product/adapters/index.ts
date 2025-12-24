/**
 * ============================================
 * AkademiHub - Product Adapters
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 */

// Dashboard Adapter
export {
  toDashboardViewModel,
  toInsightPulseViewModel
} from './dashboardAdapter';

// WhatsApp Adapter
export {
  toWhatsAppViewModel
} from './whatsappAdapter';

// PDF Adapter
export {
  toPDFViewModel
} from './pdfAdapter';

// Hooks
export {
  useProductData,
  useDashboardData,
  useInsightPulse
} from './useProductData';

// ==================== CONVENIENCE EXPORT ====================

import { toDashboardViewModel, toInsightPulseViewModel } from './dashboardAdapter';
import { toWhatsAppViewModel } from './whatsappAdapter';
import { toPDFViewModel } from './pdfAdapter';

export const ProductAdapters = {
  dashboard: toDashboardViewModel,
  insightPulse: toInsightPulseViewModel,
  whatsapp: toWhatsAppViewModel,
  pdf: toPDFViewModel
};

export default ProductAdapters;

