'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ColumnSettings, ViewMode, ExamSection } from '@/types/spectra-detail';

// ============================================================================
// KOLON AYARLARI HOOK
// Tablo kolon görünürlüğü ve ayarlarını yönetir
// ============================================================================

const STORAGE_KEY = 'spectra-column-settings';

const DEFAULT_SETTINGS: ColumnSettings = {
  sira: true,
  numara: true,
  ogrenci: true,
  sinif: true,
  tip: false,
  kitapcik: false,
  puan: true,
  subeSira: true,
  kurumSira: true,
  yuzdelikDilim: false,
  toplamNet: true,
  sozelToplam: false,
  sayisalToplam: false,
  dersler: {},
  gorunumModu: 'standart',
  satirYuksekligi: 'normal',
  fontBoyutu: 'normal',
  renklendirme: {
    ilk3Vurgula: true,
    ortalamaAltiKirmizi: true,
    ortalamaUstuYesil: true,
    zebraSatirlar: false,
  },
};

interface UseColumnsResult {
  columns: ColumnSettings;
  setColumn: (key: keyof ColumnSettings, value: any) => void;
  setDersColumn: (dersKodu: string, visible: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setRenklendirme: (key: keyof ColumnSettings['renklendirme'], value: boolean) => void;
  resetColumns: () => void;
  saveToStorage: () => void;
  visibleDersler: string[];
}

export function useColumns(sections: ExamSection[] = []): UseColumnsResult {
  const [columns, setColumns] = useState<ColumnSettings>(() => {
    // Ders kolonlarını sections'tan oluştur
    const dersler: Record<string, boolean> = {};
    sections.forEach(s => {
      dersler[s.code] = true;
    });
    return { ...DEFAULT_SETTINGS, dersler };
  });

  // Sections değişince ders kolonlarını güncelle
  useEffect(() => {
    if (sections.length > 0) {
      const dersler: Record<string, boolean> = {};
      sections.forEach(s => {
        dersler[s.code] = columns.dersler[s.code] ?? true;
      });
      setColumns(prev => ({ ...prev, dersler }));
    }
  }, [sections]);

  // localStorage'dan yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setColumns(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore
    }
  }, []);

  const setColumn = useCallback((key: keyof ColumnSettings, value: any) => {
    setColumns(prev => ({ ...prev, [key]: value }));
  }, []);

  const setDersColumn = useCallback((dersKodu: string, visible: boolean) => {
    setColumns(prev => ({
      ...prev,
      dersler: { ...prev.dersler, [dersKodu]: visible },
    }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setColumns(prev => ({ ...prev, gorunumModu: mode }));
  }, []);

  const setRenklendirme = useCallback((key: keyof ColumnSettings['renklendirme'], value: boolean) => {
    setColumns(prev => ({
      ...prev,
      renklendirme: { ...prev.renklendirme, [key]: value },
    }));
  }, []);

  const resetColumns = useCallback(() => {
    const dersler: Record<string, boolean> = {};
    sections.forEach(s => {
      dersler[s.code] = true;
    });
    setColumns({ ...DEFAULT_SETTINGS, dersler });
    localStorage.removeItem(STORAGE_KEY);
  }, [sections]);

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    } catch {
      // Ignore
    }
  }, [columns]);

  const visibleDersler = Object.entries(columns.dersler)
    .filter(([_, visible]) => visible)
    .map(([code]) => code);

  return {
    columns,
    setColumn,
    setDersColumn,
    setViewMode,
    setRenklendirme,
    resetColumns,
    saveToStorage,
    visibleDersler,
  };
}
