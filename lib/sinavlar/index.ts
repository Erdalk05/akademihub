/**
 * ============================================
 * AkademiHub - Sınav Modülü
 * ============================================
 * 
 * K12 Sınav Değerlendirme ve Analitik Sistemi
 * LGS / TYT / AYT desteği
 * 
 * MİMARİ:
 * 
 * lib/sinavlar/
 * ├── analytics/           # Analitik hesaplamalar ✅
 * │   ├── engine/         # Pure functions (no DB)
 * │   ├── orchestrator/   # Data layer (TEK YETKİLİ)
 * │   └── config/         # Configurable weights/thresholds
 * ├── pdf/                 # PDF Karne Üretimi ✅
 * │   ├── templates/      # Student, Parent, Teacher
 * │   ├── sections/       # Header, Table, Charts
 * │   └── utils/          # Formatters, Charts
 * └── ai/                  # AI Student Coach ✅
 *     ├── prompts/        # System rules, Templates
 *     └── orchestrator    # LLM integration
 * 
 * KULLANIM:
 * 
 * @example
 * // Analytics
 * import { getStudentAnalytics } from '@/lib/sinavlar';
 * const result = await getStudentAnalytics(examId, studentId);
 * 
 * // PDF
 * import { PDFEngine } from '@/lib/sinavlar';
 * const pdf = await PDFEngine.generate({ analytics, reportType: 'student' });
 * 
 * // AI Coach
 * import { AICoach } from '@/lib/sinavlar';
 * const coaching = await AICoach.student(analytics, examContext);
 */

// ==================== ANALYTICS (PHASE 1-3) ====================

export { 
  getStudentAnalytics,
  getExamAnalytics,
  recomputeStaleSnapshots
} from './analytics/orchestrator';

export * from './analytics';
export { Analytics, AnalyticsEngine, Orchestrator } from './analytics';

// ==================== PDF ENGINE (PHASE 4) ====================

export { 
  generatePDF,
  generatePDFStream,
  generateBulkPDFs,
  PDFEngine
} from './pdf';

export {
  StudentReportTemplate,
  ParentReportTemplate,
  TeacherReportTemplate
} from './pdf';

// ==================== AI COACH (PHASE 5) ====================

export {
  generateAICoachResponse,
  generateAICoachResponseStreaming,
  AICoach
} from './ai';

export {
  buildLLMContext,
  generateFallbackResponse
} from './ai';

// ==================== PRODUCT LAYER (PHASE 6) ====================

export {
  // Adapters
  toDashboardViewModel,
  toInsightPulseViewModel,
  toWhatsAppViewModel,
  toPDFViewModel,
  ProductAdapters,
  
  // Hooks
  useProductData,
  useDashboardData,
  useInsightPulse,
  
  // Dashboard Components
  AICoachCard,
  InsightPulse,
  ActionCenter,
  StateContainer,
  DashboardComponents,
  
  // WhatsApp Engine
  buildWhatsAppMessage,
  generateSecureLink,
  WhatsAppEngine,
  
  // PDF
  AIExpertOpinion,
  
  // Main Export
  ProductLayer
} from './product';

// ==================== IMPORT ENGINE (PHASE 7) ====================

export {
  // Orchestrator
  executeImport,
  createInitialWizardState,
  getNextStep,
  getPreviousStep,
  isStepComplete,
  
  // Parsers
  parseSpreadsheet,
  
  // Mapping
  autoDetectColumns,
  applyManualMapping,
  setAnswerRange,
  savePreset,
  loadPresets,
  
  // Student Matching
  matchStudent,
  matchStudentsBatch,
  createManualMatch,
  getStudentList,
  
  // Validation
  runPreflightChecks,
  quickFileCheck,
  getUserFriendlyMessage,
  getSuggestion,
  hasCriticalErrors,
  
  // UI Components
  ImportWizard,
  
  // Main Export
  ImportEngine
} from './import';

// ==================== EXECUTIVE (PHASE 8.2) ====================

export {
  // Adapters
  createExecutiveViewModel,
  
  // UI Components
  FounderDashboard,
  InsightFeed,
  ClassComparisonChart,
  
  // Main Export
  ExecutiveModule
} from './executive';
