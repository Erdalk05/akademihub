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
      setError('Organization ID gerekli');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/exam-intelligence/dashboard?organizationId=${organizationId}`
      );

      if (!response.ok) {
        throw new Error('Veriler alınamadı');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data);
    } catch (err: any) {
      console.error('[useExamDashboard] Error:', err);
      setError(err.message || 'Bir hata oluştu');
      setData(null);
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