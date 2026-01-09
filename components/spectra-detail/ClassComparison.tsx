'use client';

import React from 'react';
import { Award, School } from 'lucide-react';
import type { ExamStatistics, ExamSection } from '@/types/spectra-detail';
import { SECTION_TEXT_COLORS } from '@/lib/spectra-detail/constants';

// ============================================================================
// CLASS COMPARISON COMPONENT
// Sınıf karşılaştırma tablosu - ders bazlı ortalamalar ile
// ============================================================================

interface ClassComparisonProps {
  classAverages: ExamStatistics['classAverages'];
  organizationAverage: number;
  sections?: ExamSection[];
}

export function ClassComparison({
  classAverages,
  organizationAverage,
  sections = [],
}: ClassComparisonProps) {
  if (classAverages.length === 0) return null;

  const maxAvg = Math.max(...classAverages.map((c) => c.averageNet));

  // Sınıfta gösterilecek ders kodları (ilk 6)
  const displaySections = sections.slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <School className="w-5 h-5 text-emerald-600" />
          Sınıf Karşılaştırması
        </h3>
        <span className="text-sm text-gray-500">
          Kurum Ortalaması:{' '}
          <span className="font-bold text-emerald-600">
            {organizationAverage.toFixed(1)} net
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Sıra
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Sınıf
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Öğr.
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Ort.Net
              </th>
              {/* Ders bazlı kolonlar */}
              {displaySections.map((section) => (
                <th
                  key={section.id}
                  className={`px-2 py-3 text-center text-xs font-semibold uppercase ${
                    SECTION_TEXT_COLORS[section.code] || SECTION_TEXT_COLORS.DEFAULT
                  }`}
                >
                  {section.code}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">
                Performans
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classAverages.map((cls, index) => {
              const percentage = maxAvg > 0 ? (cls.averageNet / maxAvg) * 100 : 0;
              const rank = index + 1;

              return (
                <tr key={cls.classId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        rank === 1
                          ? 'bg-amber-100 text-amber-700'
                          : rank === 2
                          ? 'bg-slate-200 text-slate-700'
                          : rank === 3
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 flex items-center gap-2">
                      {cls.className}
                      {rank === 1 && <Award className="w-4 h-4 text-amber-500" />}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600">
                    {cls.studentCount}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-bold text-gray-900">
                      {cls.averageNet.toFixed(1)}
                    </span>
                  </td>
                  {/* Ders bazlı ortalamalar */}
                  {displaySections.map((section) => {
                    const sectionAvg = cls.sectionAverages?.[section.code] ?? 0;
                    return (
                      <td
                        key={section.id}
                        className="px-2 py-3 text-center text-sm font-medium text-gray-700"
                      >
                        {sectionAvg.toFixed(1)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            rank === 1
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : rank === 2
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : rank === 3
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gray-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Kurum Ortalaması Satırı */}
            <tr className="bg-emerald-50 border-t-2 border-emerald-200">
              <td className="px-4 py-3" colSpan={2}>
                <span className="font-bold text-emerald-700">KURUM ORTALAMASI</span>
              </td>
              <td className="px-3 py-3 text-center text-sm font-bold text-emerald-700">
                {classAverages.reduce((sum, c) => sum + c.studentCount, 0)}
              </td>
              <td className="px-3 py-3 text-center">
                <span className="font-black text-emerald-700">
                  {organizationAverage.toFixed(1)}
                </span>
              </td>
              {displaySections.map((section) => {
                // Tüm sınıfların ders ortalamasının ortalaması
                const allSectionAvgs = classAverages
                  .map((c) => c.sectionAverages?.[section.code] ?? 0)
                  .filter((v) => v > 0);
                const avg = allSectionAvgs.length > 0
                  ? allSectionAvgs.reduce((a, b) => a + b, 0) / allSectionAvgs.length
                  : 0;
                return (
                  <td
                    key={section.id}
                    className="px-2 py-3 text-center text-sm font-bold text-emerald-600"
                  >
                    {avg.toFixed(1)}
                  </td>
                );
              })}
              <td className="px-4 py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClassComparison;

