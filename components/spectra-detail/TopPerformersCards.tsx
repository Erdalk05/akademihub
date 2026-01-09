'use client';

import React from 'react';
import { Trophy, AlertTriangle, Medal } from 'lucide-react';
import type { ExamStatistics } from '@/types/spectra-detail';

// ============================================================================
// TOP PERFORMERS CARDS COMPONENT
// En başarılı ve geliştirilmesi gereken öğrenciler
// ============================================================================

interface TopPerformersCardsProps {
  topStudents: ExamStatistics['topStudents'];
  bottomStudents: ExamStatistics['bottomStudents'];
}

export function TopPerformersCards({
  topStudents = [],
  bottomStudents = [],
}: TopPerformersCardsProps) {
  if (topStudents.length === 0 && bottomStudents.length === 0) return null;

  const rankMedals = ['🥇', '🥈', '🥉'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* En Başarılı Öğrenciler */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 shadow-sm">
        <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          En Başarılı 3 Öğrenci
        </h4>
        <div className="space-y-2">
          {topStudents.slice(0, 3).map((student, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{rankMedals[index] || `${index + 1}.`}</span>
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.className}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-emerald-600">{student.net.toFixed(1)}</p>
                <p className="text-xs text-gray-400">net</p>
              </div>
            </div>
          ))}
          {topStudents.length === 0 && (
            <p className="text-center text-gray-400 py-4">Veri yok</p>
          )}
        </div>
      </div>

      {/* Geliştirilmesi Gereken Öğrenciler */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 shadow-sm">
        <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Geliştirilmesi Gereken
        </h4>
        <div className="space-y-2">
          {bottomStudents.slice(0, 3).map((student, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.className}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-amber-600">{student.net.toFixed(1)}</p>
                <p className="text-xs text-gray-400">net</p>
              </div>
            </div>
          ))}
          {bottomStudents.length === 0 && (
            <p className="text-center text-gray-400 py-4">Veri yok</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopPerformersCards;
