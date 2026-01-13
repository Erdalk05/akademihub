'use client';

import React from 'react';
import { StudentTableRow } from '@/types/exam-detail';



interface StudentRankingTableProps {
  students: StudentTableRow[];
  loading: boolean;
}

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

export function StudentRankingTable({ students, loading }: StudentRankingTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sıra</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Öğrenci No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ad Soyad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sınıf</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tür</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Doğru</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Yanlış</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Boş</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Net</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Yüzdelik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-500 text-lg">No results found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sıra</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Öğrenci No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ad Soyad</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sınıf</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tür</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Doğru</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Yanlış</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Boş</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Net</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Yüzdelik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => {
              const isGuest = student.participantType === 'guest';
              const rowClass = `hover:bg-gray-50 transition-colors ${isGuest ? 'bg-amber-50 hover:bg-amber-100' : ''}`;
              
              let rankBadgeClass = 'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ';
              if (student.rank === 1) {
                rankBadgeClass += 'bg-yellow-100 text-yellow-700';
              } else if (student.rank === 2) {
                rankBadgeClass += 'bg-gray-200 text-gray-700';
              } else if (student.rank === 3) {
                rankBadgeClass += 'bg-orange-100 text-orange-700';
              } else if (student.rank && student.rank > 3) {
                rankBadgeClass += 'bg-gray-100 text-gray-600';
              } else {
                rankBadgeClass += 'bg-gray-50 text-gray-400';
              }

              return (
                <tr key={student.participantId} className={rowClass}>
                  <td className="px-4 py-3">
                    <span className={rankBadgeClass}>
                      {student.rank ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.studentNo ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.className ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      isGuest ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isGuest ? 'Guest' : 'Institution'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700">
                    {student.totalCorrect}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700 hidden md:table-cell">
                    {student.totalWrong}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700 hidden md:table-cell">
                    {student.totalBlank}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">
                    {student.totalNet.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700">
                    {student.percentile !== null ? `${student.percentile.toFixed(0)}%` : '-'}
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

export default StudentRankingTable;