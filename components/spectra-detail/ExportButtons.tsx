'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';

// ============================================================================
// EXPORT BUTTONS COMPONENT
// Excel ve PDF export butonları
// ============================================================================

interface ExportButtonsProps {
  onExportExcel?: () => Promise<void>;
  onExportPDF?: () => Promise<void>;
  size?: 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

export function ExportButtons({
  onExportExcel,
  onExportPDF,
  size = 'md',
  showLabels = true,
  className = '',
}: ExportButtonsProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExcelExport = async () => {
    if (!onExportExcel || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      await onExportExcel();
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePDFExport = async () => {
    if (!onExportPDF || isExportingPDF) return;
    setIsExportingPDF(true);
    try {
      await onExportPDF();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const buttonClasses = size === 'sm'
    ? 'p-1.5 text-xs'
    : 'px-3 py-2 text-sm';

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {onExportExcel && (
        <button
          onClick={handleExcelExport}
          disabled={isExportingExcel}
          className={`${buttonClasses} bg-white border border-slate-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Excel İndir"
        >
          {isExportingExcel ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <FileSpreadsheet size={iconSize} className="text-emerald-600" />
          )}
          {showLabels && <span>Excel</span>}
        </button>
      )}
      {onExportPDF && (
        <button
          onClick={handlePDFExport}
          disabled={isExportingPDF}
          className={`${buttonClasses} bg-white border border-slate-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          title="PDF İndir"
        >
          {isExportingPDF ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <FileText size={iconSize} className="text-red-500" />
          )}
          {showLabels && <span>PDF</span>}
        </button>
      )}
    </div>
  );
}

export default ExportButtons;

