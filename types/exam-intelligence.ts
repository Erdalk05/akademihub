/**
 * AkademiHub Exam Intelligence Platform - Enterprise Data Contracts
 * MEB + YÖK + ÖSYM seviyesinde analiz için tip tanımları
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type ViewMode = 'grid' | 'kanban' | 'statistical' | 'heatmap';
export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';
export type AnalysisDepth = 'basic' | 'detailed' | 'comprehensive';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';

// ============================================================================
// EXAM DETAILS
// ============================================================================

export interface ExamDetails {
  id: string;
  name: string;
  examDate: string;
  examType: string;
  gradeLevel: number;
  totalQuestions: number;
  totalParticipants: number;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

// ============================================================================
// STUDENT RESULT
// ============================================================================

export interface SubjectResult {
  subjectCode: string;
  subjectName: string;
  questionCount: number;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  successRate: number;
  classRank?: number;
  schoolRank?: number;
}

export interface StudentResult {
  studentId: string;
  studentNo: string;
  fullName: string;
  className: string;
  bookletType: string;
  
  // Scores
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNet: number;
  totalScore: number;
  
  // Rankings
  classRank: number;
  schoolRank: number;
  percentile: number;
  zScore: number;
  
  // Subject breakdown
  subjects: SubjectResult[];
  
  // Analytics
  riskLevel: RiskLevel;
  trendDirection: TrendDirection;
  previousExamNet?: number;
  netChange?: number;
  
  // Parent info
  parentName?: string;
  parentPhone?: string;
}

// ============================================================================
// STATISTICAL ANALYSIS
// ============================================================================

export interface OverallStats {
  participantCount: number;
  averageNet: number;
  averageScore: number;
  medianNet: number;
  standardDeviation: number;
  variance: number;
  minNet: number;
  maxNet: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface ClassStats {
  className: string;
  studentCount: number;
  averageNet: number;
  averageScore: number;
  medianNet: number;
  standardDeviation: number;
  minNet: number;
  maxNet: number;
  q1: number;
  q3: number;
  schoolRank: number;
  comparedToSchool: number; // percentage difference from school average
}

export interface SubjectStats {
  subjectCode: string;
  subjectName: string;
  questionCount: number;
  averageNet: number;
  averageCorrect: number;
  averageWrong: number;
  averageEmpty: number;
  successRate: number;
  standardDeviation: number;
  difficultyIndex: number; // 0-1, lower = harder
  discriminationIndex: number; // how well it differentiates students
}

export interface DistributionBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface StatisticalDistributions {
  netDistribution: DistributionBucket[];
  scoreDistribution: DistributionBucket[];
  subjectDistributions: Record<string, DistributionBucket[]>;
}

export interface TrendAnalysis {
  examId: string;
  examName: string;
  examDate: string;
  averageNet: number;
  participantCount: number;
  changeFromPrevious?: number;
  percentageChange?: number;
}

// ============================================================================
// AI-POWERED INSIGHTS
// ============================================================================

export interface RiskAnalysis {
  studentId: string;
  fullName: string;
  className: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  riskFactors: string[];
  suggestedActions: string[];
  urgency: 'immediate' | 'soon' | 'monitor';
}

export interface OpportunityAnalysis {
  studentId: string;
  fullName: string;
  className: string;
  potentialScore: number;
  currentScore: number;
  growthPotential: number;
  strengths: string[];
  focusAreas: string[];
}

export interface AIRecommendation {
  type: 'class' | 'subject' | 'student' | 'school';
  targetId: string;
  targetName: string;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// API REQUEST/RESPONSE
// ============================================================================

export interface ExamIntelligenceRequest {
  examId: string;
  options: {
    includeHistorical: boolean;
    includePredictions: boolean;
    includeComparisons: boolean;
    depth: AnalysisDepth;
  };
}

export interface ExamIntelligenceResponse {
  exam: ExamDetails;
  students: StudentResult[];
  statistics: {
    overall: OverallStats;
    byClass: ClassStats[];
    bySubject: SubjectStats[];
    distributions: StatisticalDistributions;
    trends: TrendAnalysis[];
  };
  insights: {
    riskStudents: RiskAnalysis[];
    opportunities: OpportunityAnalysis[];
    recommendations: AIRecommendation[];
  };
  metadata: {
    generatedAt: string;
    processingTimeMs: number;
    dataQuality: number; // 0-100
    warnings: string[];
  };
}

// ============================================================================
// FILTER STATE
// ============================================================================

export interface ExamFilters {
  // Student filters
  searchQuery: string;
  selectedClasses: string[];
  selectedStudents: string[];
  riskLevels: RiskLevel[];
  
  // Score filters
  minNet: number | null;
  maxNet: number | null;
  minScore: number | null;
  maxScore: number | null;
  
  // Subject filters
  selectedSubjects: string[];
  subjectNetRange: Record<string, { min: number; max: number }>;
  
  // Ranking filters
  percentileRange: { min: number; max: number };
  
  // Trend filters
  trendDirections: TrendDirection[];
  
  // View options
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  pageSize: number;
  currentPage: number;
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

export interface ComparisonResult {
  entityId: string;
  entityName: string;
  entityType: 'student' | 'class' | 'school';
  metrics: {
    averageNet: number;
    averageScore: number;
    participantCount: number;
    successRate: number;
  };
  ranking: number;
  percentile: number;
  deltaFromAverage: number;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  includeAnalysis: boolean;
  template: 'meb' | 'osym' | 'custom';
  selectedStudents?: string[];
  selectedClasses?: string[];
}

// ============================================================================
// REAL-TIME TYPES
// ============================================================================

export interface RealTimeUpdate {
  type: 'student_update' | 'exam_update' | 'new_result';
  payload: unknown;
  timestamp: string;
}

// ============================================================================
// HEATMAP TYPES
// ============================================================================

export interface HeatmapCell {
  rowId: string;
  rowLabel: string;
  colId: string;
  colLabel: string;
  value: number;
  normalizedValue: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface HeatmapData {
  rows: Array<{ id: string; label: string }>;
  columns: Array<{ id: string; label: string }>;
  cells: HeatmapCell[];
  colorScale: {
    min: string;
    mid: string;
    max: string;
  };
}

