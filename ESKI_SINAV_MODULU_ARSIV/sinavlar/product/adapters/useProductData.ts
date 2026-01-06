/**
 * ============================================
 * AkademiHub - useProductData Hook
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Snapshot fetch + state yönetimi
 * - React hook
 * - HESAPLAMA YOK
 * - AI TETİKLEME YOK
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AISnapshotRecord } from '../../ai/cache/types';
import type {
  UseProductDataResult,
  UseProductDataParams,
  ProductDataState,
  DashboardViewModel,
  InsightPulseViewModel,
  WhatsAppViewModel,
  PDFAIOpinionViewModel
} from '../types';
import { toDashboardViewModel, toInsightPulseViewModel } from './dashboardAdapter';
import { toWhatsAppViewModel } from './whatsappAdapter';
import { toPDFViewModel } from './pdfAdapter';

// ==================== ANA HOOK ====================

/**
 * Product data hook
 * 
 * Snapshot'ı fetch eder ve ViewModel'lere dönüştürür.
 * 
 * @example
 * const { dashboard, insightPulse, state, isLoading } = useProductData({
 *   examId: '123',
 *   studentId: '456',
 *   role: 'student'
 * });
 */
export function useProductData(params: UseProductDataParams): UseProductDataResult {
  const {
    examId,
    studentId,
    role,
    language = 'tr',
    autoRefresh = false,
    acceptStale = true
  } = params;
  
  // State
  const [snapshot, setSnapshot] = useState<AISnapshotRecord | null>(null);
  const [state, setState] = useState<ProductDataState>('empty');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch snapshot
  const fetchSnapshot = useCallback(async () => {
    if (!examId || !studentId || !role) {
      setState('empty');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('exam_student_ai_snapshots')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .eq('role', role)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Kayıt bulunamadı
          setSnapshot(null);
          setState('empty');
        } else {
          throw fetchError;
        }
      } else if (data) {
        const snapshotData = data as AISnapshotRecord;
        setSnapshot(snapshotData);
        
        // State belirleme
        switch (snapshotData.status) {
          case 'ready':
            // Yaş kontrolü
            const age = Date.now() - new Date(snapshotData.updated_at).getTime();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            setState(age > sevenDays ? 'stale' : 'ready');
            break;
          case 'computing':
            setState('generating');
            break;
          case 'failed':
            setState('error');
            break;
          default:
            setState('empty');
        }
      }
      
    } catch (err) {
      console.error('[useProductData] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Veri yüklenirken hata oluştu');
      setState('error');
    } finally {
      setIsLoading(false);
    }
  }, [examId, studentId, role]);
  
  // İlk yükleme
  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);
  
  // Auto refresh (computing durumunda)
  useEffect(() => {
    if (!autoRefresh || state !== 'generating') return;
    
    const interval = setInterval(() => {
      fetchSnapshot();
    }, 3000); // 3 saniyede bir kontrol
    
    return () => clearInterval(interval);
  }, [autoRefresh, state, fetchSnapshot]);
  
  // Dashboard ViewModel
  const dashboard = useMemo((): DashboardViewModel | null => {
    if (state === 'empty' && !snapshot) {
      return toDashboardViewModel({
        snapshot: null,
        role,
        language,
        stateOverride: state
      });
    }
    
    return toDashboardViewModel({
      snapshot,
      role,
      language,
      stateOverride: state
    });
  }, [snapshot, role, language, state]);
  
  // InsightPulse ViewModel
  const insightPulse = useMemo((): InsightPulseViewModel | null => {
    return toInsightPulseViewModel({
      snapshot,
      role,
      language
    });
  }, [snapshot, role, language]);
  
  // WhatsApp ViewModel (lazy)
  const getWhatsAppViewModel = useCallback((studentName?: string): WhatsAppViewModel | null => {
    return toWhatsAppViewModel({
      snapshot,
      role,
      language,
      studentName
    });
  }, [snapshot, role, language]);
  
  // PDF ViewModel (lazy)
  const getPDFViewModel = useCallback((): PDFAIOpinionViewModel | null => {
    return toPDFViewModel({
      snapshot,
      role,
      language
    });
  }, [snapshot, role, language]);
  
  return {
    dashboard,
    insightPulse,
    getWhatsAppViewModel,
    getPDFViewModel,
    state,
    isLoading,
    error,
    refresh: fetchSnapshot
  };
}

// ==================== SIMPLE HOOKS ====================

/**
 * Sadece dashboard için basit hook
 */
export function useDashboardData(
  examId: string,
  studentId: string,
  role: 'student' | 'parent' | 'teacher'
): { dashboard: DashboardViewModel | null; isLoading: boolean; error: string | null } {
  const { dashboard, isLoading, error } = useProductData({
    examId,
    studentId,
    role
  });
  
  return { dashboard, isLoading, error };
}

/**
 * Sadece insight pulse için basit hook
 */
export function useInsightPulse(
  examId: string,
  studentId: string,
  role: 'student' | 'parent' | 'teacher'
): { insightPulse: InsightPulseViewModel | null; isLoading: boolean } {
  const { insightPulse, isLoading } = useProductData({
    examId,
    studentId,
    role
  });
  
  return { insightPulse, isLoading };
}

// ==================== EXPORT ====================

export default useProductData;

