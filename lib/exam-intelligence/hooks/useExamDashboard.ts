'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStats {
  totalExams: number;
  totalStudents: number;
  averageNet: number;
  successRate: number;
  maxNet: number;
  stdDev: number;
}

interface RecentExam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  status: string;
}

interface ClassSummary {
  name: string;
  studentCount: number;
  averageNet: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentExams: RecentExam[];
  classSummary: ClassSummary[];
}

interface UseDashboardReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Default values
const defaultStats: DashboardStats = {
  totalExams: 0,
  totalStudents: 0,
  averageNet: 0,
  successRate: 0,
  maxNet: 0,
  stdDev: 0,
};

// ============================================================================
// HOOK
// ============================================================================

export function useExamDashboard(organizationId: string | undefined): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      setData({
        stats: defaultStats,
        recentExams: [],
        classSummary: [],
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/exam-intelligence/dashboard?organizationId=${organizationId}`
      );

      const result = await response.json();

      // API response'u normalize et (yeni format uyumluluğu)
      const normalizedData: DashboardData = {
        stats: {
          totalExams: result.totalExams ?? result.data?.stats?.totalExams ?? 0,
          totalStudents: result.totalStudents ?? result.data?.stats?.totalStudents ?? 0,
          averageNet: result.averageNet ?? result.data?.stats?.averageNet ?? 0,
          successRate: result.successRate ?? result.data?.stats?.successRate ?? 0,
          maxNet: result.maxNet ?? result.data?.stats?.maxNet ?? 0,
          stdDev: result.stdDev ?? result.data?.stats?.stdDev ?? 0,
        },
        recentExams: result.recentExams ?? result.data?.recentExams ?? [],
        classSummary: result.classSummary ?? result.data?.classSummary ?? [],
      };

      setData(normalizedData);
    } catch (err: unknown) {
      console.error('[useExamDashboard] Error:', err);
      // Hata durumunda bile boş data set et (crash engellemek için)
      setData({
        stats: defaultStats,
        recentExams: [],
        classSummary: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
