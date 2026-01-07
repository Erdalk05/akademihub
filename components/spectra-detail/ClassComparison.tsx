'use client';

import React from 'react';
import { Award } from 'lucide-react';
import type { ExamStatistics } from '@/types/spectra-detail';

// ============================================================================
// CLASS COMPARISON COMPONENT
// Sınıf karşılaştırma tablosu
// ============================================================================

interface ClassComparisonProps {
  classAverages: ExamStatistics['classAverages'];
  organizationAverage: number;
}

export function ClassComparison({
  classAverages,
  organizationAverage,
}: ClassComparisonProps) {
  if (classAverages.length === 0) return null;

  const maxAvg = Math.max(...classAverages.map((c) => c.averageNet));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          🏫 Sınıf Karşılaştırması
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
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Öğrenci
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Ort. Net
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-1/3">
                Performans
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classAverages.map((cls, index) => {
              const percentage = maxAvg > 0 ? (cls.averageNet / maxAvg) * 100 : 0;
              const rank = index + 1;

              return (
                <tr key={cls.classId} className="hover:bg-gray-50">
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
                  <td className="px-4 py-3 text-center text-gray-600">{cls.studentCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-gray-900">
                      {cls.averageNet.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
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
                      <span className="text-xs text-gray-500 w-10 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
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

export default ClassComparison;

