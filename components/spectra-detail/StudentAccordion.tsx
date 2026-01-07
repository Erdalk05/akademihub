'use client';

import React from 'react';
import { X, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { StudentTableRow } from '@/types/spectra-detail';
import { SECTION_BG_COLORS, SECTION_TEXT_COLORS } from '@/lib/spectra-detail/constants';
import { estimateLGSScore } from '@/lib/spectra-detail/calculations';

// ============================================================================
// STUDENT ACCORDION COMPONENT
// Satır altında açılan detay paneli
// ============================================================================

interface StudentAccordionProps {
  student: StudentTableRow;
  classAverage: number;
  sectionAverages: Map<string, number>;
  onClose: () => void;
  onExportPDF?: () => void;
}

export function StudentAccordion({
  student,
  classAverage,
  sectionAverages,
  onClose,
  onExportPDF,
}: StudentAccordionProps) {
  const lgsScore = estimateLGSScore(student.totalNet);
  const netDiff = student.totalNet - classAverage;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-t border-b border-emerald-200 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          📊 {student.name} - Detaylı Analiz
        </h4>
        <div className="flex items-center gap-2">
          {onExportPDF && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportPDF();
              }}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="PDF İndir"
            >
              <FileText className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Özet Bilgiler */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="text-sm font-semibold text-gray-500 mb-3">Özet Bilgiler</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Toplam Net:</span>
              <span className="font-bold text-gray-900">{student.totalNet.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kurum Sırası:</span>
              <span className="font-bold text-gray-900">{student.rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Yüzdelik Dilim:</span>
              <span className="font-bold text-emerald-600">%{student.percentile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tahmini LGS:</span>
              <span className="font-bold text-blue-600">{lgsScore.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Sınıf Karşılaştırma */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="text-sm font-semibold text-gray-500 mb-3">Sınıf Karşılaştırma</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Sınıf Ortalaması:</span>
              <span className="font-bold text-gray-900">{classAverage.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fark:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  netDiff > 0
                    ? 'text-emerald-600'
                    : netDiff < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {netDiff > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : netDiff < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {netDiff > 0 ? '+' : ''}
                {netDiff.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* D/Y/B Özet */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="text-sm font-semibold text-gray-500 mb-3">Toplam D/Y/B</h5>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{student.totalCorrect}</p>
              <p className="text-xs text-gray-500">Doğru</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{student.totalWrong}</p>
              <p className="text-xs text-gray-500">Yanlış</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{student.totalBlank}</p>
              <p className="text-xs text-gray-500">Boş</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ders Bazlı Performans Tablosu */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                Ders
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                D
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Y
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                B
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Net
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Sınıf Ort.
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Fark
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {student.sections.map((section) => {
              const sectionAvg = sectionAverages.get(section.sectionId) || 0;
              const diff = section.net - sectionAvg;

              return (
                <tr key={section.sectionId} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span
                      className={`font-medium ${
                        SECTION_TEXT_COLORS[section.sectionCode] ||
                        SECTION_TEXT_COLORS.DEFAULT
                      }`}
                    >
                      {section.sectionName}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-emerald-600 font-medium">
                    {section.correct}
                  </td>
                  <td className="px-3 py-2 text-center text-red-500 font-medium">
                    {section.wrong}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-400">{section.blank}</td>
                  <td className="px-3 py-2 text-center font-bold text-gray-900">
                    {section.net.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">
                    {sectionAvg.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`font-medium ${
                        diff > 0
                          ? 'text-emerald-600'
                          : diff < 0
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {diff > 0 ? '+' : ''}
                      {diff.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentAccordion;

