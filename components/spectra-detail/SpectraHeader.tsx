'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Settings,
  Calendar,
} from 'lucide-react';
import type { Exam } from '@/types/spectra-detail';

// ============================================================================
// SPECTRA HEADER COMPONENT
// Sticky header - geri butonu, sınav adı, export butonları
// ============================================================================

interface SpectraHeaderProps {
  exam: Exam;
  onRefresh?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  isRefreshing?: boolean;
}

export function SpectraHeader({
  exam,
  onRefresh,
  onExportExcel,
  onExportPDF,
  isRefreshing = false,
}: SpectraHeaderProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Sol: Geri butonu ve sınav bilgisi */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/spectra/sinavlar"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{exam.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(exam.exam_date)}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                  {exam.exam_type}
                </span>
              </div>
            </div>
          </div>

          {/* Sağ: Butonlar */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Yenile"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            )}
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpectraHeader;

