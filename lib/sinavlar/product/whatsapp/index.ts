/**
 * ============================================
 * AkademiHub - WhatsApp Module
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 */

// Templates
export {
  FORBIDDEN_WORDS,
  SAFE_ALTERNATIVES,
  PLACEHOLDERS,
  buildTemplate,
  sanitizeMessage,
  isMessageSafe
} from './templates';

// Message Builder
export {
  buildWhatsAppMessage,
  buildBatchMessages
} from './messageBuilder';

export type { MessageBuilderInput, BuiltMessage } from './messageBuilder';

// Link Generator
export {
  generateSecureLink,
  validateToken,
  isLinkExpired,
  generateWhatsAppShareUrl,
  generateWhatsAppDirectUrl
} from './waLinkGenerator';

export type { SecureLinkInput, SecureLinkResult } from './waLinkGenerator';

// i18n
export {
  getI18n,
  getWhatsAppTemplate,
  getAllTemplates
} from './i18n';

// ==================== CONVENIENCE EXPORT ====================

import { buildWhatsAppMessage, buildBatchMessages } from './messageBuilder';
import { generateSecureLink, generateWhatsAppShareUrl } from './waLinkGenerator';
import { getI18n, getWhatsAppTemplate } from './i18n';
import { sanitizeMessage, isMessageSafe } from './templates';

export const WhatsAppEngine = {
  buildMessage: buildWhatsAppMessage,
  buildBatch: buildBatchMessages,
  generateLink: generateSecureLink,
  generateShareUrl: generateWhatsAppShareUrl,
  getI18n,
  getTemplate: getWhatsAppTemplate,
  sanitize: sanitizeMessage,
  isSafe: isMessageSafe
};

export default WhatsAppEngine;

