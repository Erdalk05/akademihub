// ============================================================================
// STUDENT RANKING TABLE - Exam Results Table
// Öğrenci bazlı sınav sonuçları tablosu
// ============================================================================

'use client';

import React from 'react';
import { StudentTableRow } from '@/types/exam-detail';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface StudentRankingTableProps {
  students: StudentTableRow[];
  loading: boolean;
}

// =============================================================================
// SKELETON ROW
// =============================================================================

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </td>
      <td className="px-4 py-3">
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="w-16 h-6 bg-gray-200 rounded mx-auto"></div>
      </td>
      <td className="px-4 py-3">
        <div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div>
      </td>
      <td className="px-4 py-3">
        <div className="w-12 h-4 bg-gray-200 rounded mx-auto"></div>
      </td>
      <td className="px-4 py-3">
        <div className="w-12 h-4 bg-gray-200 rounded mx-auto"></div>
      </td>
    </tr>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StudentRankingTable({ students, loading }: StudentRankingTableProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Sıra
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Öğrenci No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ad Soyad
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Sınıf
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Tür
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Doğru
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                  Yanlış
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                  Boş
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Net
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Yüzdelik
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(10)].map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-500 text-lg">Sonuç bulunamadı</p>
        <p className="text-gray-400 text-sm mt-2">Filtreleri kontrol edin veya yeniden deneyin</p>
      </div>
    );
  }

  // Main table
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Sıra
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Öğrenci No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Ad Soyad
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Sınıf
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Tür
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Doğru
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                Yanlış
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                Boş
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Net
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Yüzdelik
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => (
              <tr
                key={student.participantId}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  student.participantType === 'guest' && 'bg-amber-50 hover:bg-amber-100'
                )}
              >
                {/* Rank */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                      student.rank === 1 && 'bg-yellow-100 text-yellow-700',
                      student.rank === 2 && 'bg-gray-200 text-gray-700',
                      student.rank === 3 && 'bg-orange-100 text-orange-700',
                      student.rank && student.rank > 3 && 'bg-gray-100 text-gray-600',
                      !student.rank && 'bg-gray-50 text-gray-400'
                    )}
                  >
                    {student.rank ?? '-'}
                  </span>
                </td>

                {/* Student No */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {student.studentNo ?? '-'}
                </td>

                {/* Name */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {student.name}
                </td>

                {/* Class */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {student.className ?? '-'}
                </td>

                {/* Type */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'inline-block px-2 py-1 text-xs font-medium rounded',
                      student.participantType === 'institution'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {student.participantType === 'institution' ? 'Asil' : 'Misafir'}
                  </span>
                </td>

                {/* Correct */}
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {student.totalCorrect}
                </td>

                {/* Wrong (hidden on mobile) */}
                <td className="px-4 py-3 text-center text-sm text-gray-700 hidden md:table-cell">
                  {student.totalWrong}
                </td>

                {/* Blank (hidden on mobile) */}
                <td className="px-4 py-3 text-center text-sm text-gray-700 hidden md:table-cell">
                  {student.totalBlank}
                </td>

                {/* Net (bold) */}
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">
                  {student.totalNet.toFixed(1)}
                </td>

                {/* Percentile */}
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {student.percentile !== null ? `%${student.percentile.toFixed(0)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentRankingTable;
