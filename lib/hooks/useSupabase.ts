'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch data
  const fetchData = useCallback(
    async (table: string, options?: any) => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from(table).select('*');

        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        if (options?.order) {
          query = query.order(options.order.column, {
            ascending: options.order.ascending !== false,
          });
        }

        const { data, error: err } = await query;

        if (err) throw err;
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Insert data
  const insertData = useCallback(
    async (table: string, data: any) => {
      setLoading(true);
      setError(null);
      try {
        const { data: result, error: err } = await supabase
          .from(table)
          .insert([data])
          .select();

        if (err) throw err;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Update data
  const updateData = useCallback(
    async (table: string, id: string, data: any) => {
      setLoading(true);
      setError(null);
      try {
        const { data: result, error: err } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select();

        if (err) throw err;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Delete data
  const deleteData = useCallback(
    async (table: string, id: string) => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (err) throw err;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Real-time subscription
  const subscribe = useCallback(
    (table: string, callback: (data: any) => void) => {
      const subscription = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload: any) => {
            callback(payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    },
    [supabase]
  );

  return {
    loading,
    error,
    fetchData,
    insertData,
    updateData,
    deleteData,
    subscribe,
    supabase,
  };
};


