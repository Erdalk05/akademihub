/**
 * ============================================
 * AkademiHub - Skip/Match Flow Component
 * ============================================
 * 
 * PHASE 8.2 - UX Refinement
 * 
 * BU DOSYA:
 * - Eşleşmeyen öğrenciler için akıllı çözüm UI
 * - Import durmadan devam eder
 * - Sonradan manuel eşleştirme
 * 
 * PRENSİP:
 * 1 öğrenci hatalıysa, 81 öğrenci durmamalı!
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { MatchResult, MatchedStudentInfo } from '../types';
import { findStudentsByName } from '../validation/fuzzyMatcher';

// ==================== TYPES ====================

export interface UnmatchedStudent {
  rowNumber: number;
  searchValue: string;
  searchType: 'name' | 'student_no' | 'tc_no';
  originalData: Record<string, unknown>;
  matchResult: MatchResult;
}

export interface SkipMatchFlowProps {
  /** Eşleşmeyen öğrenciler */
  unmatchedStudents: UnmatchedStudent[];
  
  /** Sistemdeki tüm öğrenciler (arama için) */
  allStudents: MatchedStudentInfo[];
  
  /** Eşleştirme seçildiğinde */
  onMatch: (rowNumber: number, studentId: string) => void;
  
  /** Atla seçildiğinde */
  onSkip: (rowNumber: number) => void;
  
  /** Tümünü atla */
  onSkipAll: () => void;
  
  /** Devam et */
  onContinue: () => void;
  
  /** Toplam başarılı import sayısı */
  successCount: number;
}

// ==================== MAIN COMPONENT ====================

export function SkipMatchFlow({
  unmatchedStudents,
  allStudents,
  onMatch,
  onSkip,
  onSkipAll,
  onContinue,
  successCount
}: SkipMatchFlowProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedRows, setResolvedRows] = useState<Set<number>>(new Set());
  
  // Çözülmemiş satır sayısı
  const unresolvedCount = unmatchedStudents.length - resolvedRows.size;
  
  // Arama sonuçları
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const results = findStudentsByName(searchQuery, allStudents, { maxCandidates: 10 });
    return results.map(r => r.item);
  }, [searchQuery, allStudents]);
  
  // Satır çözüldü olarak işaretle
  const handleMatch = (rowNumber: number, studentId: string) => {
    onMatch(rowNumber, studentId);
    setResolvedRows(prev => new Set([...prev, rowNumber]));
    setExpandedRow(null);
    setSearchQuery('');
  };
  
  const handleSkip = (rowNumber: number) => {
    onSkip(rowNumber);
    setResolvedRows(prev => new Set([...prev, rowNumber]));
    setExpandedRow(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Başarı Özeti */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
          {successCount} Öğrenci Başarıyla Yüklendi
        </h3>
        <p className="text-green-600 dark:text-green-500 mt-2">
          Veriler kaydedildi ve analizler hazırlanıyor.
        </p>
      </div>
      
      {/* Eşleşmeyen Öğrenciler */}
      {unmatchedStudents.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                  {unresolvedCount} Öğrenci Eşleştirilemedi
                </h4>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Bu öğrencileri şimdi eşleştirebilir veya atlayabilirsiniz.
                </p>
              </div>
            </div>
            
            {unresolvedCount > 0 && (
              <button
                onClick={onSkipAll}
                className="text-sm text-amber-600 hover:text-amber-800 underline"
              >
                Tümünü Atla
              </button>
            )}
          </div>
          
          {/* Eşleşmeyen Liste */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {unmatchedStudents.map((student) => {
              const isResolved = resolvedRows.has(student.rowNumber);
              const isExpanded = expandedRow === student.rowNumber;
              
              if (isResolved) {
                return (
                  <div 
                    key={student.rowNumber}
                    className="p-3 bg-green-100 dark:bg-green-800/30 rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-green-700 dark:text-green-400">
                        Satır {student.rowNumber}: Çözüldü
                      </span>
                    </div>
                  </div>
                );
              }
              
              return (
                <div 
                  key={student.rowNumber}
                  className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                    onClick={() => setExpandedRow(isExpanded ? null : student.rowNumber)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">👤</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {student.searchValue || 'İsim bulunamadı'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Satır {student.rowNumber} • {student.searchType === 'name' ? 'İsim' : student.searchType === 'student_no' ? 'Öğrenci No' : 'TC No'} ile arandı
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Benzer bulundu mu? */}
                        {student.matchResult.alternatives.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {student.matchResult.alternatives.length} benzer bulundu
                          </span>
                        )}
                        
                        <span className="text-gray-400">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10">
                      {/* Önerilen Eşleşmeler */}
                      {student.matchResult.alternatives.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Önerilen Eşleşmeler:
                          </p>
                          <div className="space-y-2">
                            {student.matchResult.alternatives.map((alt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleMatch(student.rowNumber, alt.student.id)}
                                className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">👤</span>
                                  <div className="text-left">
                                    <p className="font-medium">{alt.student.fullName}</p>
                                    <p className="text-sm text-gray-500">
                                      {alt.student.className} • No: {alt.student.studentNo}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    %{alt.confidence} benzerlik
                                  </span>
                                  <span className="text-blue-600">Seç →</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Manuel Arama */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Veya Manuel Ara:
                        </p>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="İsim veya numara ile ara..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        
                        {searchResults.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                            {searchResults.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => handleMatch(student.rowNumber, s.id)}
                                className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                              >
                                <span>{s.fullName} - {s.className}</span>
                                <span className="text-sm text-gray-500">{s.studentNo}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Atla Butonu */}
                      <button
                        onClick={() => handleSkip(student.rowNumber)}
                        className="w-full py-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        Bu Satırı Atla
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Devam Et Butonu */}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Tamamla ve Devam Et →
        </button>
      </div>
    </div>
  );
}

// ==================== IMPORT SUMMARY COMPONENT ====================

export interface ImportSummaryProps {
  totalRows: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  matchedByStrategy: {
    exact: number;
    fuzzy: number;
    manual: number;
  };
  postProcessingStatus: {
    analytics: boolean;
    ai: boolean;
    pdf: boolean;
  };
  onViewResults: () => void;
  onNewImport: () => void;
}

export function ImportSummary({
  totalRows,
  successCount,
  failedCount,
  skippedCount,
  matchedByStrategy,
  postProcessingStatus,
  onViewResults,
  onNewImport
}: ImportSummaryProps) {
  const successRate = Math.round((successCount / totalRows) * 100);
  
  return (
    <div className="space-y-6">
      {/* Ana Başarı Kartı */}
      <div className={`p-8 rounded-2xl text-center ${
        successRate >= 90 
          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
          : successRate >= 70 
            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
            : 'bg-gradient-to-br from-red-500 to-rose-600'
      } text-white shadow-lg`}>
        <div className="text-6xl mb-4">
          {successRate >= 90 ? '🎉' : successRate >= 70 ? '👍' : '⚠️'}
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {successCount} / {totalRows} Öğrenci Yüklendi
        </h2>
        <p className="text-white/80">
          %{successRate} başarı oranı
        </p>
      </div>
      
      {/* Detay Kartları */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{successCount}</p>
          <p className="text-sm text-green-700 dark:text-green-400">Başarılı</p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{skippedCount}</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">Atlandı</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{failedCount}</p>
          <p className="text-sm text-red-700 dark:text-red-400">Başarısız</p>
        </div>
      </div>
      
      {/* Eşleştirme Detayları */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
          Eşleştirme Detayları
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">✓ Otomatik eşleşen:</span>
            <span className="font-medium">{matchedByStrategy.exact}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">🔍 Benzerlikle bulunan:</span>
            <span className="font-medium">{matchedByStrategy.fuzzy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">👆 Manuel seçilen:</span>
            <span className="font-medium">{matchedByStrategy.manual}</span>
          </div>
        </div>
      </div>
      
      {/* Post-Processing Durumu */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-3">
          Sistem Hazırlıkları
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={postProcessingStatus.analytics ? 'text-green-500' : 'text-gray-400'}>
              {postProcessingStatus.analytics ? '✓' : '○'}
            </span>
            <span>Analizler hesaplanıyor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={postProcessingStatus.ai ? 'text-green-500' : 'text-gray-400'}>
              {postProcessingStatus.ai ? '✓' : '○'}
            </span>
            <span>AI yorumları hazırlanıyor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={postProcessingStatus.pdf ? 'text-green-500' : 'text-gray-400'}>
              {postProcessingStatus.pdf ? '✓' : '○'}
            </span>
            <span>PDF karneler oluşturuluyor</span>
          </div>
        </div>
      </div>
      
      {/* Aksiyon Butonları */}
      <div className="flex gap-4">
        <button
          onClick={onNewImport}
          className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Yeni Yükleme
        </button>
        <button
          onClick={onViewResults}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Sonuçları Görüntüle →
        </button>
      </div>
    </div>
  );
}

// ==================== EXPORT ====================

export default SkipMatchFlow;

