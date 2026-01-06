/**
 * ============================================
 * AkademiHub - Command Center Module
 * ============================================
 * 
 * PHASE 8.5 - Core Intelligence Hub
 * 
 * Bu modül:
 * - Akademik Analiz Landing sayfası
 * - Karar odaklı intelligence hub
 * - Rol bazlı görünümler
 */

// ==================== TYPES ====================

export type {
  IntelligenceNarrative,
  SignalCard,
  ActionTile,
  AINextStep,
  CommandCenterData,
  RoleConfig
} from './types';

export { ROLE_CONFIGS } from './types';

// ==================== COMPONENTS ====================

export { AcademicAnalysisLanding } from './AcademicAnalysisLanding';

// ==================== DATA ====================

export { getCommandCenterData } from './dataAdapter';

// ==================== CONVENIENCE EXPORTS ====================

import { AcademicAnalysisLanding } from './AcademicAnalysisLanding';
import { getCommandCenterData } from './dataAdapter';

export const CommandCenter = {
  Landing: AcademicAnalysisLanding,
  getData: getCommandCenterData
};

export default CommandCenter;

