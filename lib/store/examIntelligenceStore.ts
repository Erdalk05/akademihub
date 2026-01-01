/**
 * AkademiHub Exam Intelligence Platform - State Management
 * Zustand + Immer ile enterprise-grade state yönetimi
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ExamIntelligenceResponse,
  ExamFilters,
  ViewMode,
  RiskLevel,
  TrendDirection,
  StudentResult,
  ExamDetails,
} from '@/types/exam-intelligence';

// ============================================================================
// INITIAL FILTER STATE
// ============================================================================

const initialFilters: ExamFilters = {
  searchQuery: '',
  selectedClasses: [],
  selectedStudents: [],
  riskLevels: [],
  minNet: null,
  maxNet: null,
  minScore: null,
  maxScore: null,
  selectedSubjects: [],
  subjectNetRange: {},
  percentileRange: { min: 0, max: 100 },
  trendDirections: [],
  sortBy: 'totalNet',
  sortDirection: 'desc',
  pageSize: 50,
  currentPage: 1,
};

// ============================================================================
// STORE STATE TYPE
// ============================================================================

interface ExamIntelligenceState {
  // Data
  examData: ExamIntelligenceResponse | null;
  selectedExamId: string | null;
  isLoading: boolean;
  error: string | null;

  // UI State
  viewMode: ViewMode;
  filters: ExamFilters;
  compareMode: boolean;
  comparisonExamIds: string[];
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  selectedStudentId: string | null;

  // History for undo/redo
  filterHistory: ExamFilters[];
  historyIndex: number;

  // Actions
  setExamData: (data: ExamIntelligenceResponse) => void;
  setSelectedExamId: (examId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<ExamFilters>) => void;
  resetFilters: () => void;
  setCompareMode: (enabled: boolean) => void;
  addComparisonExam: (examId: string) => void;
  removeComparisonExam: (examId: string) => void;

  setSidebarOpen: (open: boolean) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setSelectedStudentId: (studentId: string | null) => void;

  // Multi-select
  toggleStudentSelection: (studentId: string) => void;
  selectAllStudents: () => void;
  clearStudentSelection: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Computed
  getFilteredStudents: () => StudentResult[];
  getSelectedStudents: () => StudentResult[];
  getClassList: () => string[];
  getSubjectList: () => string[];
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useExamIntelligenceStore = create<ExamIntelligenceState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      examData: null,
      selectedExamId: null,
      isLoading: false,
      error: null,

      viewMode: 'grid',
      filters: initialFilters,
      compareMode: false,
      comparisonExamIds: [],
      sidebarOpen: true,
      detailPanelOpen: false,
      selectedStudentId: null,

      filterHistory: [initialFilters],
      historyIndex: 0,

      // Data actions
      setExamData: (data) =>
        set((state) => {
          state.examData = data;
          state.error = null;
        }),

      setSelectedExamId: (examId) =>
        set((state) => {
          state.selectedExamId = examId;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          state.isLoading = false;
        }),

      // UI actions
      setViewMode: (mode) =>
        set((state) => {
          state.viewMode = mode;
        }),

      setFilters: (newFilters) =>
        set((state) => {
          const updated = { ...state.filters, ...newFilters };
          state.filters = updated;
          
          // Add to history
          state.filterHistory = [
            ...state.filterHistory.slice(0, state.historyIndex + 1),
            updated,
          ];
          state.historyIndex = state.filterHistory.length - 1;
        }),

      resetFilters: () =>
        set((state) => {
          state.filters = initialFilters;
          state.filterHistory = [initialFilters];
          state.historyIndex = 0;
        }),

      setCompareMode: (enabled) =>
        set((state) => {
          state.compareMode = enabled;
          if (!enabled) {
            state.comparisonExamIds = [];
          }
        }),

      addComparisonExam: (examId) =>
        set((state) => {
          if (!state.comparisonExamIds.includes(examId)) {
            state.comparisonExamIds.push(examId);
          }
        }),

      removeComparisonExam: (examId) =>
        set((state) => {
          state.comparisonExamIds = state.comparisonExamIds.filter(
            (id) => id !== examId
          );
        }),

      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),

      setDetailPanelOpen: (open) =>
        set((state) => {
          state.detailPanelOpen = open;
        }),

      setSelectedStudentId: (studentId) =>
        set((state) => {
          state.selectedStudentId = studentId;
          state.detailPanelOpen = !!studentId;
        }),

      // Multi-select
      toggleStudentSelection: (studentId) =>
        set((state) => {
          const idx = state.filters.selectedStudents.indexOf(studentId);
          if (idx === -1) {
            state.filters.selectedStudents.push(studentId);
          } else {
            state.filters.selectedStudents.splice(idx, 1);
          }
        }),

      selectAllStudents: () =>
        set((state) => {
          const allIds = get().getFilteredStudents().map((s) => s.studentId);
          state.filters.selectedStudents = allIds;
        }),

      clearStudentSelection: () =>
        set((state) => {
          state.filters.selectedStudents = [];
        }),

      // Undo/Redo
      undo: () =>
        set((state) => {
          if (state.historyIndex > 0) {
            state.historyIndex--;
            state.filters = state.filterHistory[state.historyIndex];
          }
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex < state.filterHistory.length - 1) {
            state.historyIndex++;
            state.filters = state.filterHistory[state.historyIndex];
          }
        }),

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().filterHistory.length - 1,

      // Computed
      getFilteredStudents: () => {
        const { examData, filters } = get();
        if (!examData?.students) return [];

        let students = [...examData.students];

        // Search query
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          students = students.filter(
            (s) =>
              s.fullName.toLowerCase().includes(q) ||
              s.studentNo.toLowerCase().includes(q)
          );
        }

        // Class filter
        if (filters.selectedClasses.length > 0) {
          students = students.filter((s) =>
            filters.selectedClasses.includes(s.className)
          );
        }

        // Risk level filter
        if (filters.riskLevels.length > 0) {
          students = students.filter((s) =>
            filters.riskLevels.includes(s.riskLevel)
          );
        }

        // Net range filter
        if (filters.minNet !== null) {
          students = students.filter((s) => s.totalNet >= filters.minNet!);
        }
        if (filters.maxNet !== null) {
          students = students.filter((s) => s.totalNet <= filters.maxNet!);
        }

        // Score range filter
        if (filters.minScore !== null) {
          students = students.filter((s) => s.totalScore >= filters.minScore!);
        }
        if (filters.maxScore !== null) {
          students = students.filter((s) => s.totalScore <= filters.maxScore!);
        }

        // Percentile range filter
        students = students.filter(
          (s) =>
            s.percentile >= filters.percentileRange.min &&
            s.percentile <= filters.percentileRange.max
        );

        // Trend filter
        if (filters.trendDirections.length > 0) {
          students = students.filter((s) =>
            filters.trendDirections.includes(s.trendDirection)
          );
        }

        // Sorting
        students.sort((a, b) => {
          const aVal = (a as any)[filters.sortBy] ?? 0;
          const bVal = (b as any)[filters.sortBy] ?? 0;
          if (typeof aVal === 'string') {
            return filters.sortDirection === 'asc'
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          }
          return filters.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return students;
      },

      getSelectedStudents: () => {
        const { examData, filters } = get();
        if (!examData?.students) return [];
        return examData.students.filter((s) =>
          filters.selectedStudents.includes(s.studentId)
        );
      },

      getClassList: () => {
        const { examData } = get();
        if (!examData?.students) return [];
        const classes = new Set(examData.students.map((s) => s.className));
        return Array.from(classes).sort();
      },

      getSubjectList: () => {
        const { examData } = get();
        if (!examData?.statistics?.bySubject) return [];
        return examData.statistics.bySubject.map((s) => s.subjectCode);
      },
    })),
    {
      name: 'exam-intelligence-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        sidebarOpen: state.sidebarOpen,
        filters: {
          pageSize: state.filters.pageSize,
          sortBy: state.filters.sortBy,
          sortDirection: state.filters.sortDirection,
        },
      }),
    }
  )
);

// ============================================================================
// SELECTORS (for performance optimization)
// ============================================================================

export const selectExamData = (state: ExamIntelligenceState) => state.examData;
export const selectFilters = (state: ExamIntelligenceState) => state.filters;
export const selectViewMode = (state: ExamIntelligenceState) => state.viewMode;
export const selectIsLoading = (state: ExamIntelligenceState) => state.isLoading;
export const selectError = (state: ExamIntelligenceState) => state.error;

