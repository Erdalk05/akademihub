/**
 * ============================================
 * AkademiHub - Executive Module
 * ============================================
 * 
 * PHASE 8.2 - Founder Command Center
 * 
 * Bu modül:
 * - Kurucu dashboard
 * - Kriz tespiti
 * - AI kurumsal özet
 * - Sınıf karşılaştırma
 * 
 * AMAÇ:
 * Kurucu tek bakışta "nerede problem var ve ne yapmalıyım?" 
 * sorusuna cevap alabilmeli.
 */

// ==================== TYPES ====================

export type {
  // Crisis
  CrisisLevel,
  AcademicCrisisAlert,
  
  // Participation
  ParticipationAnalysis,
  AbsentStudent,
  ClassParticipation,
  
  // Class Comparison
  ClassComparison,
  SubjectClassPerformance,
  
  // AI Summary
  AIInstitutionalSummary,
  CriticalFinding,
  RecommendedAction,
  WeeklyPriority,
  
  // Dashboard
  FounderDashboardData,
  TrendData,
  InsightFeedItem,
  
  // View Model
  ExecutiveViewModel,
  QuickStat
} from './types';

// ==================== ADAPTERS ====================

export { createExecutiveViewModel } from './adapters/executiveAdapter';

// ==================== UI COMPONENTS ====================

export { FounderDashboard } from './ui/FounderDashboard';
export type { FounderDashboardProps } from './ui/FounderDashboard';

export { InsightFeed } from './ui/InsightFeed';
export type { InsightFeedProps } from './ui/InsightFeed';

export { ClassComparisonChart } from './ui/ClassComparisonChart';
export type { ClassComparisonChartProps } from './ui/ClassComparisonChart';

// ==================== CONVENIENCE EXPORTS ====================

import { createExecutiveViewModel } from './adapters/executiveAdapter';
import { FounderDashboard } from './ui/FounderDashboard';
import { InsightFeed } from './ui/InsightFeed';
import { ClassComparisonChart } from './ui/ClassComparisonChart';

/**
 * Executive Module - Quick Access
 * 
 * @example
 * import { ExecutiveModule } from '@/lib/sinavlar/executive';
 * 
 * // Dashboard verisi al
 * const viewModel = await ExecutiveModule.getData(orgId);
 * 
 * // Dashboard göster
 * <ExecutiveModule.Dashboard data={viewModel.dashboard} quickStats={viewModel.quickStats} />
 */
export const ExecutiveModule = {
  // Data
  getData: createExecutiveViewModel,
  
  // Components
  Dashboard: FounderDashboard,
  InsightFeed,
  ClassComparison: ClassComparisonChart
};

export default ExecutiveModule;

