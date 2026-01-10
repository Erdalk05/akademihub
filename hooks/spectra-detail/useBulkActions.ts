'use client';

import { useState, useCallback } from 'react';
import type { StudentTableRow, BulkActionType } from '@/types/spectra-detail';
import toast from 'react-hot-toast';

// ============================================================================
// TOPLU İŞLEMLER HOOK
// Öğrenci seçimi ve toplu işlemleri yönetir
// ============================================================================

interface UseBulkActionsResult {
  selectedIds: string[];
  isAllSelected: boolean;
  isProcessing: boolean;
  selectStudent: (id: string) => void;
  deselectStudent: (id: string) => void;
  toggleStudent: (id: string) => void;
  selectAll: () => void;
  selectPage: (pageIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  executeAction: (action: BulkActionType) => Promise<void>;
}

export function useBulkActions(rows: StudentTableRow[]): UseBulkActionsResult {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const allIds = rows.map(r => r.participantId);
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  const selectStudent = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const deselectStudent = useCallback((id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  }, []);

  const toggleStudent = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  }, [allIds, isAllSelected]);

  const selectPage = useCallback((pageIds: string[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      pageIds.forEach(id => newSet.add(id));
      return Array.from(newSet);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const executeAction = useCallback(async (action: BulkActionType) => {
    if (selectedIds.length === 0) {
      toast.error('Lütfen önce öğrenci seçin');
      return;
    }

    setIsProcessing(true);
    
    try {
      switch (action) {
        case 'karne':
          toast.loading('Karneler oluşturuluyor...', { id: 'bulk-action' });
          // TODO: Karne oluşturma API çağrısı
          await new Promise(r => setTimeout(r, 1500));
          toast.success(`${selectedIds.length} öğrenci için karne oluşturuldu`, { id: 'bulk-action' });
          break;

        case 'bildirim':
          toast.loading('Bildirimler gönderiliyor...', { id: 'bulk-action' });
          // TODO: Bildirim gönderme API çağrısı
          await new Promise(r => setTimeout(r, 1500));
          toast.success(`${selectedIds.length} veliye bildirim gönderildi`, { id: 'bulk-action' });
          break;

        case 'etiket':
          toast.success(`${selectedIds.length} öğrenci etiketlendi`);
          break;

        case 'duzenle':
          toast.success(`${selectedIds.length} öğrenci düzenleme moduna alındı`);
          break;

        default:
          toast.error('Bilinmeyen işlem');
      }
    } catch (error) {
      toast.error('İşlem sırasında bir hata oluştu', { id: 'bulk-action' });
      console.error('Bulk action error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds]);

  return {
    selectedIds,
    isAllSelected,
    isProcessing,
    selectStudent,
    deselectStudent,
    toggleStudent,
    selectAll,
    selectPage,
    clearSelection,
    isSelected,
    executeAction,
  };
}
