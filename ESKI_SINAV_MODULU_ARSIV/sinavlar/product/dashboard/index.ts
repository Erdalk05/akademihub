/**
 * ============================================
 * AkademiHub - Dashboard Components
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 */

// States
export {
  StateContainer,
  LoadingState,
  EmptyState,
  GeneratingState,
  ErrorState,
  StaleIndicator,
  PulseDot
} from './states';

export type { StateContainerProps } from './states';

// AI Coach Card
export { AICoachCard } from './AICoachCard';
export type { AICoachCardProps } from './AICoachCard';

// Insight Pulse
export { InsightPulse, InsightPulseCompact } from './InsightPulse';
export type { InsightPulseProps } from './InsightPulse';

// Action Center
export {
  ActionCenter,
  PrimaryAction,
  FloatingAction
} from './ActionCenter';

export type {
  ActionCenterProps,
  PrimaryActionProps,
  FloatingActionProps
} from './ActionCenter';

// ==================== CONVENIENCE EXPORT ====================

import { AICoachCard } from './AICoachCard';
import { InsightPulse, InsightPulseCompact } from './InsightPulse';
import { ActionCenter, PrimaryAction, FloatingAction } from './ActionCenter';
import { StateContainer, LoadingState, EmptyState, GeneratingState, ErrorState } from './states';

export const DashboardComponents = {
  AICoachCard,
  InsightPulse,
  InsightPulseCompact,
  ActionCenter,
  PrimaryAction,
  FloatingAction,
  StateContainer,
  LoadingState,
  EmptyState,
  GeneratingState,
  ErrorState
};

export default DashboardComponents;

