/**
 * ============================================
 * AkademiHub - Class Comparison Chart
 * ============================================
 * 
 * PHASE 8.2 - Founder Command Center
 * 
 * BU DOSYA:
 * - Sınıf karşılaştırma grafiği
 * - Mobil uyumlu bar chart
 * - Etkileşimli (tıklanabilir sınıflar)
 */

'use client';

import React, { useMemo } from 'react';
import type { ClassComparison } from '../types';

// ==================== PROPS ====================

export interface ClassComparisonChartProps {
  classes: ClassComparison[];
  onClassClick?: (className: string) => void;
}

// ==================== MAIN COMPONENT ====================

export function ClassComparisonChart({ classes, onClassClick }: ClassComparisonChartProps) {
  // En yüksek skor (bar ölçekleme için)
  const maxScore = useMemo(() => {
    return Math.max(...classes.map(c => c.averageScore), 100);
  }, [classes]);
  
  // Kurum ortalaması
  const orgAverage = useMemo(() => {
    if (classes.length === 0) return 0;
    return classes.reduce((sum, c) => sum + c.averageScore, 0) / classes.length;
  }, [classes]);
  
  if (classes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="text-center py-12">
          <span className="text-4xl">📊</span>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-3">
            Henüz Veri Yok
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Sınıf karşılaştırması için sınav verisi gerekiyor.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Sınıf Karşılaştırması
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            Kurum Ort: %{Math.round(orgAverage)}
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-4">
        <div className="space-y-4">
          {classes.map((cls, index) => {
            const barWidth = (cls.averageScore / maxScore) * 100;
            const isAboveAvg = cls.averageScore >= orgAverage;
            const isBest = index === 0;
            const isWorst = index === classes.length - 1;
            
            return (
              <div
                key={cls.className}
                onClick={() => onClassClick?.(cls.className)}
                className={`group cursor-pointer transition-all ${
                  onClassClick ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-2 -mx-2' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isBest && <span className="text-sm">🏆</span>}
                    {isWorst && <span className="text-sm">⚠️</span>}
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {cls.className}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({cls.studentCount} öğrenci)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      cls.averageScore >= 70 ? 'text-green-600' :
                      cls.averageScore >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      %{Math.round(cls.averageScore)}
                    </span>
                    
                    {cls.changeFromPrevious !== 0 && (
                      <span className={`text-xs ${
                        cls.changeFromPrevious > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {cls.changeFromPrevious > 0 ? '↑' : '↓'}
                        {Math.abs(cls.changeFromPrevious)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Bar */}
                <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  {/* Kurum ortalama çizgisi */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
                    style={{ left: `${(orgAverage / maxScore) * 100}%` }}
                  />
                  
                  {/* Bar */}
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAboveAvg 
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    } group-hover:brightness-110`}
                    style={{ width: `${barWidth}%` }}
                  />
                  
                  {/* En düşük/yüksek label */}
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs text-white font-medium drop-shadow">
                      {cls.lowestScore.toFixed(0)} - {cls.highestScore.toFixed(0)}
                    </span>
                  </div>
                </div>
                
                {/* Ders Detayları (Hover) */}
                {cls.bySubject.length > 0 && (
                  <div className="mt-2 hidden group-hover:flex flex-wrap gap-2">
                    {cls.bySubject.slice(0, 4).map(subj => (
                      <span 
                        key={subj.subjectCode}
                        className={`text-xs px-2 py-0.5 rounded ${
                          subj.averageScore >= 60 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {subj.subjectCode}: %{Math.round(subj.averageScore)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Lejant */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Ortalama üstü</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span>Ortalama altı</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-3 bg-gray-400" />
            <span>Kurum Ort.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== EXPORT ====================

export default ClassComparisonChart;

