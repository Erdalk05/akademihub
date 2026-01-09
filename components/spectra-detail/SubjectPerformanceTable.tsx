'use client';

import React from 'react';
import { BookOpen, Download } from 'lucide-react';
import type { ExamStatistics, ExamSection } from '@/types/spectra-detail';
import { SECTION_TEXT_COLORS, SECTION_BG_COLORS } from '@/lib/spectra-detail/constants';

// ============================================================================
// SUBJECT PERFORMANCE TABLE COMPONENT
// Ders bazlı performans analizi tablosu
// ============================================================================

// Ders ikonları
const SECTION_ICONS: Record<string, string> = {
  TUR: '📖',
  MAT: '🔢',
  FEN: '🔬',
  SOS: '📜',
  ING: '🌍',
  DIN: '🕌',
  DEFAULT: '📚',
};

interface SubjectPerformanceTableProps {
  sectionAverages: ExamStatistics['sectionAverages'];
  sections: ExamSection[];
  onExportExcel?: () => void;
}

export function SubjectPerformanceTable({
  sectionAverages,
  sections,
  onExportExcel,
}: SubjectPerformanceTableProps) {
  // Toplam değerleri hesapla
  const totals = sectionAverages.reduce(
    (acc, section) => ({
      questions: acc.questions + (section.questionCount || 0),
      correct: acc.correct + section.averageCorrect,
      wrong: acc.wrong + section.averageWrong,
      blank: acc.blank + (section.averageBlank || 0),
      net: acc.net + section.averageNet,
    }),
    { questions: 0, correct: 0, wrong: 0, blank: 0, net: 0 }
  );

  const totalQuestions = totals.questions || sections.reduce((sum, s) => sum + s.question_count, 0) || 90;
  const overallSuccessRate = totalQuestions > 0 ? ((totals.net / totalQuestions) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Ders Bazlı Performans Analizi
        </h3>
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        )}
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Ders
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Soru
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Ort.D
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Ort.Y
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Ort.B
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Ort.Net
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Başarı
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-36">
                Performans
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sectionAverages.map((section) => {
              const icon = SECTION_ICONS[section.sectionCode] || SECTION_ICONS.DEFAULT;
              const textColor = SECTION_TEXT_COLORS[section.sectionCode] || SECTION_TEXT_COLORS.DEFAULT;
              const bgColor = SECTION_BG_COLORS[section.sectionCode] || SECTION_BG_COLORS.DEFAULT;
              const questionCount = section.questionCount || sections.find(s => s.id === section.sectionId)?.question_count || 0;
              const successRate = section.successRate || (questionCount > 0 ? ((section.averageNet / questionCount) * 100) : 0);

              return (
                <tr key={section.sectionId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className={`font-medium ${textColor}`}>
                        {section.sectionName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600 font-medium">
                    {questionCount}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-medium text-green-600">
                    {section.averageCorrect.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-medium text-red-500">
                    {section.averageWrong.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-400">
                    {(section.averageBlank || 0).toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-bold text-gray-900">
                    {section.averageNet.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        successRate >= 70
                          ? 'bg-green-100 text-green-700'
                          : successRate >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      %{successRate.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bgColor} transition-all duration-500`}
                          style={{ width: `${Math.min(successRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {successRate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Toplam Satırı */}
          <tfoot className="bg-emerald-50 border-t-2 border-emerald-200">
            <tr>
              <td className="px-4 py-3">
                <span className="font-bold text-emerald-700">TOPLAM</span>
              </td>
              <td className="px-3 py-3 text-center text-sm font-bold text-gray-900">
                {totalQuestions}
              </td>
              <td className="px-3 py-3 text-center text-sm font-bold text-green-600">
                {totals.correct.toFixed(1)}
              </td>
              <td className="px-3 py-3 text-center text-sm font-bold text-red-500">
                {totals.wrong.toFixed(1)}
              </td>
              <td className="px-3 py-3 text-center text-sm font-bold text-gray-400">
                {totals.blank.toFixed(1)}
              </td>
              <td className="px-3 py-3 text-center text-sm font-black text-emerald-700">
                {totals.net.toFixed(1)}
              </td>
              <td className="px-3 py-3 text-center">
                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                  %{overallSuccessRate}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-emerald-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(parseFloat(overallSuccessRate), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-emerald-600 font-bold w-8 text-right">
                    {overallSuccessRate}%
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default SubjectPerformanceTable;
