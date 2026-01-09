'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import type { OrganizationTrend } from '@/types/spectra-detail';

// ============================================================================
// ORGANIZATION TREND HOOK
// Kurum bazlı son sınavların trend verisini çeker
// ============================================================================

interface UseOrganizationTrendOptions {
  organizationId?: string;
  examId?: string; // Mevcut sınav ID (bu sınav dahil son 5)
  limit?: number;
}

interface UseOrganizationTrendResult {
  trends: OrganizationTrend[];
  isLoading: boolean;
  error: Error | null;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export function useOrganizationTrend({
  organizationId,
  examId,
  limit = 5,
}: UseOrganizationTrendOptions): UseOrganizationTrendResult {
  const [trends, setTrends] = useState<OrganizationTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getBrowserClient();

      // Son X sınavı çek (Spectra filtreli)
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('id, name, exam_date')
        .eq('organization_id', organizationId)
        .or('source.eq.spectra,source.is.null')
        .order('exam_date', { ascending: false })
        .limit(limit);

      if (examsError) {
        throw new Error('Sınav verileri çekilemedi: ' + examsError.message);
      }

      if (!examsData || examsData.length === 0) {
        setTrends([]);
        setIsLoading(false);
        return;
      }

      // Her sınav için ortalama net hesapla
      const trendData: OrganizationTrend[] = [];

      for (const exam of examsData) {
        const { data: participantsData } = await supabase
          .from('exam_participants')
          .select('net')
          .eq('exam_id', exam.id)
          .not('net', 'is', null);

        if (participantsData && participantsData.length > 0) {
          const nets = participantsData.map((p) => p.net || 0);
          const averageNet = nets.reduce((a, b) => a + b, 0) / nets.length;

          trendData.push({
            examId: exam.id,
            examName: exam.name || 'Sınav',
            examDate: exam.exam_date || '',
            averageNet: parseFloat(averageNet.toFixed(2)),
            participantCount: participantsData.length,
          });
        }
      }

      // Kronolojik sırala (en eski en başta)
      trendData.sort((a, b) => {
        if (!a.examDate || !b.examDate) return 0;
        return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      });

      setTrends(trendData);
    } catch (err: any) {
      console.error('Organization trend fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, limit]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Trend yönü ve yüzdesi hesapla
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  let trendPercentage = 0;

  if (trends.length >= 2) {
    const firstNet = trends[0].averageNet;
    const lastNet = trends[trends.length - 1].averageNet;
    const diff = lastNet - firstNet;
    
    if (diff > 0.5) {
      trendDirection = 'up';
      trendPercentage = firstNet > 0 ? ((diff / firstNet) * 100) : 0;
    } else if (diff < -0.5) {
      trendDirection = 'down';
      trendPercentage = firstNet > 0 ? Math.abs((diff / firstNet) * 100) : 0;
    }
  }

  return {
    trends,
    isLoading,
    error,
    trendDirection,
    trendPercentage: parseFloat(trendPercentage.toFixed(1)),
  };
}
