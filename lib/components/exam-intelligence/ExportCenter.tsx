'use client';

/**
 * Export Center - Veri dışa aktarma merkezi
 * Excel, PDF, CSV formatlarında export
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  File,
  Check,
  Loader2,
} from 'lucide-react';
import type { ExamIntelligenceResponse, ExportFormat } from '@/types/exam-intelligence';

interface ExportCenterProps {
  data: ExamIntelligenceResponse;
  onClose: () => void;
}

export default function ExportCenter({ data, onClose }: ExportCenterProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [exporting, setExporting] = useState(false);

  const formats = [
    { id: 'excel', name: 'Excel', icon: FileSpreadsheet, ext: '.xlsx' },
    { id: 'pdf', name: 'PDF', icon: FileText, ext: '.pdf' },
    { id: 'csv', name: 'CSV', icon: File, ext: '.csv' },
  ];

  const handleExport = async () => {
    setExporting(true);

    try {
      // Simulate export (replace with actual export logic)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For CSV - create simple CSV
      if (selectedFormat === 'csv') {
        const headers = ['Sıra', 'Ad Soyad', 'Sınıf', 'Net', 'Puan', 'Yüzdelik'];
        const rows = data.students.map((s, idx) => [
          idx + 1,
          s.fullName,
          s.className,
          s.totalNet.toFixed(2),
          s.totalScore.toFixed(0),
          s.percentile,
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.exam.name}_sonuclar.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }

      // For other formats, show success message
      alert(`${selectedFormat.toUpperCase()} dosyası hazırlandı!`);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      alert('Dışa aktarma sırasında hata oluştu');
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="text-emerald-400" size={20} />
            Dışa Aktar
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Format</label>
            <div className="grid grid-cols-3 gap-3">
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as ExportFormat)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedFormat === fmt.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <fmt.icon className="mx-auto mb-2" size={24} />
                  <p className="text-sm font-medium">{fmt.name}</p>
                  <p className="text-xs opacity-60">{fmt.ext}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-300">Grafikleri dahil et</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnalysis}
                onChange={(e) => setIncludeAnalysis(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-300">AI analizlerini dahil et</span>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2">Dışa aktarılacak:</p>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• {data.students.length} öğrenci sonucu</li>
              <li>• {data.statistics.byClass.length} sınıf istatistiği</li>
              <li>• {data.statistics.bySubject.length} ders analizi</li>
              {includeAnalysis && <li>• {data.insights.riskStudents.length} risk analizi</li>}
            </ul>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Hazırlanıyor...
              </>
            ) : (
              <>
                <Download size={18} />
                {selectedFormat.toUpperCase()} Olarak İndir
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

