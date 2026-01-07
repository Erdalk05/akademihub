'use client';

import { useCallback, useState } from 'react';
import type { Exam, ExamSection, StudentTableRow, ExamStatistics } from '@/types/spectra-detail';
import { exportToExcel, exportToPDF, exportStudentPDF } from '@/lib/spectra-detail';

// ============================================================================
// SPECTRA EXPORT HOOK
// Export işlemlerini yönetir
// ============================================================================

interface UseSpectraExportOptions {
  exam: Exam | null;
  sections: ExamSection[];
  rows: StudentTableRow[];
  statistics: ExamStatistics | null;
  organizationName?: string;
}

interface UseSpectraExportResult {
  isExportingExcel: boolean;
  isExportingPDF: boolean;
  isExportingStudentPDF: boolean;
  exportExcel: () => Promise<void>;
  exportPDF: () => Promise<void>;
  exportStudentReport: (
    student: StudentTableRow,
    classAverage: number,
    sectionAverages: Map<string, number>
  ) => Promise<void>;
  error: Error | null;
}

export function useSpectraExport({
  exam,
  sections,
  rows,
  statistics,
  organizationName = 'AkademiHub',
}: UseSpectraExportOptions): UseSpectraExportResult {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingStudentPDF, setIsExportingStudentPDF] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Excel export
  const handleExportExcel = useCallback(async () => {
    if (!exam || !statistics) {
      setError(new Error('Export için veri yok'));
      return;
    }

    setIsExportingExcel(true);
    setError(null);

    try {
      await exportToExcel({
        exam,
        sections,
        rows,
        statistics,
        organizationName,
      });
    } catch (err: any) {
      console.error('Excel export error:', err);
      setError(err);
    } finally {
      setIsExportingExcel(false);
    }
  }, [exam, sections, rows, statistics, organizationName]);

  // PDF export
  const handleExportPDF = useCallback(async () => {
    if (!exam || !statistics) {
      setError(new Error('Export için veri yok'));
      return;
    }

    setIsExportingPDF(true);
    setError(null);

    try {
      await exportToPDF({
        exam,
        sections,
        rows,
        statistics,
        organizationName,
      });
    } catch (err: any) {
      console.error('PDF export error:', err);
      setError(err);
    } finally {
      setIsExportingPDF(false);
    }
  }, [exam, sections, rows, statistics, organizationName]);

  // Student PDF export
  const handleExportStudentPDF = useCallback(
    async (
      student: StudentTableRow,
      classAverage: number,
      sectionAverages: Map<string, number>
    ) => {
      if (!exam) {
        setError(new Error('Export için sınav verisi yok'));
        return;
      }

      setIsExportingStudentPDF(true);
      setError(null);

      try {
        await exportStudentPDF({
          student,
          exam,
          sections,
          classAverage,
          sectionAverages,
          organizationName,
        });
      } catch (err: any) {
        console.error('Student PDF export error:', err);
        setError(err);
      } finally {
        setIsExportingStudentPDF(false);
      }
    },
    [exam, sections, organizationName]
  );

  return {
    isExportingExcel,
    isExportingPDF,
    isExportingStudentPDF,
    exportExcel: handleExportExcel,
    exportPDF: handleExportPDF,
    exportStudentReport: handleExportStudentPDF,
    error,
  };
}

