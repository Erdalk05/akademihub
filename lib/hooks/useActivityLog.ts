import { useState, useEffect } from 'react';
import { ActivityLog, ActivityType, getActivityLogs as fetchLogs } from '@/lib/utils/activityLogger';

interface UseActivityLogOptions {
  autoFetch?: boolean;
  filters?: {
    userId?: string;
    action?: ActivityType;
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  };
}

/**
 * Hook to manage activity logs
 */
export function useActivityLog(options: UseActivityLogOptions = {}) {
  const { autoFetch = false, filters } = options;
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchLogs(filters);

    if (result.success && result.data) {
      setLogs(result.data);
    } else {
      setError(result.error || 'Failed to fetch logs');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (autoFetch) {
      fetchActivityLogs();
    }
  }, [autoFetch, JSON.stringify(filters)]);

  return {
    logs,
    loading,
    error,
    fetchActivityLogs,
    refresh: fetchActivityLogs,
  };
}





