/**
 * ============================================
 * AkademiHub - Column Mapping Page
 * ============================================
 * 
 * PHASE 7.4 - Complete UX Rebuild
 * 
 * ÖZELLİKLER:
 * - 2 kolonlu layout (Sol: Önizleme, Sağ: Alan Tanımlama)
 * - Dropdown YOK - Sabit alan listesi
 * - Tıkla-Eşle mantığı
 * - Otomatik öneri motoru
 * - Excel / CSV / TXT tek UX
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';

// ==================== TYPES ====================

export type FieldType = 'tc' | 'name' | 'student_no' | 'class' | 'booklet' | 'answers' | 'ignore';

export interface MappingState {
  field: FieldType;
  columnIndex: number;
  columnLetter: string;
  sampleValue: string;
  confidence: number;
  detectedInfo?: string;
}

export interface CellSelection {
  rowIndex: number;
  colIndex: number;
  value: string;
}

export interface ColumnMappingPageProps {
  /** Parse edilmiş veri - satırlar */
  data: string[][];
  
  /** Dosya adı */
  fileName?: string;
  
  /** Mapping tamamlandığında */
  onComplete: (mappings: MappingState[]) => void;
  
  /** Geri git */
  onBack: () => void;
}

// ==================== CONSTANTS ====================

const FIELD_CONFIG: Record<FieldType, { 
  label: string; 
  emoji: string; 
  description: string;
  required: boolean;
  color: string;
}> = {
  tc: {
    label: 'TC Kimlik',
    emoji: '🪪',
    description: '11 haneli TC kimlik numarası',
    required: false,
    color: 'emerald'
  },
  name: {
    label: 'Ad Soyad',
    emoji: '👤',
    description: 'Öğrencinin tam adı',
    required: false,
    color: 'blue'
  },
  student_no: {
    label: 'Öğrenci No',
    emoji: '🔢',
    description: 'Okul öğrenci numarası',
    required: false,
    color: 'purple'
  },
  class: {
    label: 'Sınıf / Şube',
    emoji: '🏫',
    description: 'Örn: 8-A, 10/B',
    required: false,
    color: 'amber'
  },
  booklet: {
    label: 'Kitapçık Türü',
    emoji: '📖',
    description: 'A, B, C veya D',
    required: false,
    color: 'pink'
  },
  answers: {
    label: 'Cevaplar',
    emoji: '✍️',
    description: 'Sınav cevapları (A/B/C/D/E)',
    required: true,
    color: 'indigo'
  },
  ignore: {
    label: 'Atla',
    emoji: '⏭️',
    description: 'Bu sütunu kullanma',
    required: false,
    color: 'gray'
  }
};

// Sütun harfi hesapla (0 = A, 1 = B, ...)
function getColumnLetter(index: number): string {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// ==================== AUTO DETECTION ====================

function detectFieldType(values: string[]): { type: FieldType; confidence: number; info: string } {
  const nonEmpty = values.filter(v => v && v.trim());
  if (nonEmpty.length === 0) return { type: 'ignore', confidence: 0, info: 'Boş sütun' };
  
  const sample = nonEmpty.slice(0, 10);
  
  // TC Kimlik: 11 haneli rakam
  const tcPattern = sample.filter(v => /^\d{11}$/.test(v.trim()));
  if (tcPattern.length >= sample.length * 0.8) {
    return { type: 'tc', confidence: 95, info: '11 haneli TC' };
  }
  
  // Öğrenci No: 6 haneli rakam
  const studentNoPattern = sample.filter(v => /^\d{5,8}$/.test(v.trim()));
  if (studentNoPattern.length >= sample.length * 0.8) {
    return { type: 'student_no', confidence: 90, info: `${sample[0]?.length || 6} haneli numara` };
  }
  
  // Cevaplar: Sadece A,B,C,D,E karakterleri, uzun string
  const answerPattern = sample.filter(v => {
    const clean = v.replace(/\s/g, '');
    return /^[ABCDE]+$/i.test(clean) && clean.length >= 10;
  });
  if (answerPattern.length >= sample.length * 0.7) {
    const avgLength = Math.round(sample.reduce((a, b) => a + b.replace(/\s/g, '').length, 0) / sample.length);
    return { type: 'answers', confidence: 95, info: `${avgLength} soru algılandı` };
  }
  
  // Sınıf: 8A, 8-A, 10/B formatı
  const classPattern = sample.filter(v => /^\d{1,2}[\-\/]?[A-Z]$/i.test(v.trim()));
  if (classPattern.length >= sample.length * 0.7) {
    return { type: 'class', confidence: 85, info: 'Sınıf formatı' };
  }
  
  // Kitapçık: Tek harf A, B, C, D
  const bookletPattern = sample.filter(v => /^[ABCD]$/i.test(v.trim()));
  if (bookletPattern.length >= sample.length * 0.8) {
    return { type: 'booklet', confidence: 80, info: 'Kitapçık türü' };
  }
  
  // Ad Soyad: En az 2 kelime, harf içeren
  const namePattern = sample.filter(v => {
    const words = v.trim().split(/\s+/);
    return words.length >= 2 && /^[A-ZÇĞİÖŞÜa-zçğıöşü\s\-]+$/.test(v);
  });
  if (namePattern.length >= sample.length * 0.6) {
    return { type: 'name', confidence: 75, info: 'Ad Soyad formatı' };
  }
  
  // Bilinmeyen
  return { type: 'ignore', confidence: 0, info: 'Tanımlanamadı' };
}

// ==================== MAIN COMPONENT ====================

export function ColumnMappingPage({
  data,
  fileName,
  onComplete,
  onBack
}: ColumnMappingPageProps) {
  // State
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [mappings, setMappings] = useState<MappingState[]>([]);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  
  // Önizleme için ilk 10 satır
  const previewData = useMemo(() => data.slice(0, 10), [data]);
  
  // Sütun sayısı
  const columnCount = useMemo(() => {
    return Math.max(...data.map(row => row.length), 0);
  }, [data]);
  
  // Otomatik algılama
  const autoDetections = useMemo(() => {
    const detections: Array<{ type: FieldType; confidence: number; info: string }> = [];
    
    for (let col = 0; col < columnCount; col++) {
      const columnValues = data.map(row => row[col] || '');
      const detection = detectFieldType(columnValues);
      detections.push(detection);
    }
    
    return detections;
  }, [data, columnCount]);
  
  // Mapping'i sütun indexine göre bul
  const getMappingForColumn = useCallback((colIndex: number) => {
    return mappings.find(m => m.columnIndex === colIndex);
  }, [mappings]);
  
  // Mapping'i field'a göre bul
  const getMappingForField = useCallback((field: FieldType) => {
    return mappings.find(m => m.field === field);
  }, [mappings]);
  
  // Hücre tıklama
  const handleCellClick = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setSelectedCell({ rowIndex, colIndex, value });
  }, []);
  
  // Alan seçimi
  const handleFieldSelect = useCallback((field: FieldType) => {
    if (!selectedCell) return;
    
    const { colIndex } = selectedCell;
    const columnLetter = getColumnLetter(colIndex);
    const sampleValue = data[0]?.[colIndex] || '';
    const detection = autoDetections[colIndex];
    
    // Mevcut mapping'i kaldır (aynı sütun veya aynı alan)
    const newMappings = mappings.filter(m => 
      m.columnIndex !== colIndex && m.field !== field
    );
    
    // Yeni mapping ekle
    if (field !== 'ignore') {
      newMappings.push({
        field,
        columnIndex: colIndex,
        columnLetter,
        sampleValue,
        confidence: 100,
        detectedInfo: detection?.info
      });
    }
    
    setMappings(newMappings);
    setSelectedCell(null);
  }, [selectedCell, mappings, data, autoDetections]);
  
  // Öneriyi kabul et
  const handleAcceptSuggestion = useCallback((colIndex: number) => {
    const detection = autoDetections[colIndex];
    if (!detection || detection.type === 'ignore') return;
    
    const columnLetter = getColumnLetter(colIndex);
    const sampleValue = data[0]?.[colIndex] || '';
    
    // Mevcut mapping'i kaldır
    const newMappings = mappings.filter(m => 
      m.columnIndex !== colIndex && m.field !== detection.type
    );
    
    newMappings.push({
      field: detection.type,
      columnIndex: colIndex,
      columnLetter,
      sampleValue,
      confidence: detection.confidence,
      detectedInfo: detection.info
    });
    
    setMappings(newMappings);
  }, [autoDetections, mappings, data]);
  
  // Validation
  const validation = useMemo(() => {
    const hasIdentifier = mappings.some(m => m.field === 'tc' || m.field === 'name' || m.field === 'student_no');
    const hasAnswers = mappings.some(m => m.field === 'answers');
    
    return {
      isValid: hasIdentifier && hasAnswers,
      hasIdentifier,
      hasAnswers,
      message: !hasIdentifier 
        ? 'Kimlik bilgisi eksik (TC, Ad Soyad veya Öğrenci No)'
        : !hasAnswers 
          ? 'Cevap sütunu seçilmedi'
          : 'Hazır!'
    };
  }, [mappings]);
  
  // Devam
  const handleComplete = useCallback(() => {
    if (validation.isValid) {
      onComplete(mappings);
    }
  }, [validation.isValid, mappings, onComplete]);
  
  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          🔗 Kolon Eşleştirme
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Tablodaki bir sütuna tıklayın, sonra sağ panelden alan seçin
        </p>
        {fileName && (
          <p className="text-sm text-gray-500 mt-1">
            📄 {fileName} • {data.length} satır • {columnCount} sütun
          </p>
        )}
      </div>
      
      {/* 2 Kolonlu Layout */}
      <div className="flex-1 flex gap-6">
        {/* SOL: Veri Önizleme */}
        <div className="w-[70%] overflow-hidden">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            {/* Tablo Header */}
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Veri Önizleme (İlk 10 Satır)
              </span>
              <span className="text-xs text-gray-400">
                Sütuna tıklayarak seçin
              </span>
            </div>
            
            {/* Tablo */}
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-sm">
                {/* Sütun Harfleri */}
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="w-12 px-2 py-2 text-center text-gray-400 font-normal text-xs border-r border-gray-200 dark:border-gray-700">
                      #
                    </th>
                    {Array.from({ length: columnCount }).map((_, colIndex) => {
                      const mapping = getMappingForColumn(colIndex);
                      const detection = autoDetections[colIndex];
                      const isSelected = selectedCell?.colIndex === colIndex;
                      const isHovered = hoveredCol === colIndex;
                      const fieldConfig = mapping ? FIELD_CONFIG[mapping.field] : null;
                      
                      return (
                        <th 
                          key={colIndex}
                          className={`min-w-[100px] px-3 py-2 text-center font-medium text-xs border-r border-gray-200 dark:border-gray-700 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500' 
                              : isHovered
                                ? 'bg-blue-50 dark:bg-blue-900/50'
                                : mapping
                                  ? `bg-${fieldConfig?.color}-50 dark:bg-${fieldConfig?.color}-900/30 text-${fieldConfig?.color}-700 dark:text-${fieldConfig?.color}-300`
                                  : 'text-gray-500'
                          }`}
                          onMouseEnter={() => setHoveredCol(colIndex)}
                          onMouseLeave={() => setHoveredCol(null)}
                          onClick={() => handleCellClick(0, colIndex, data[0]?.[colIndex] || '')}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">{getColumnLetter(colIndex)}</span>
                            {mapping && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/30">
                                {FIELD_CONFIG[mapping.field].emoji} {FIELD_CONFIG[mapping.field].label}
                              </span>
                            )}
                            {!mapping && detection && detection.confidence > 50 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptSuggestion(colIndex);
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              >
                                🤖 {detection.info}
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                
                {/* Veri Satırları */}
                <tbody>
                  {previewData.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className={`border-b border-gray-100 dark:border-gray-700 ${
                        rowIndex === 0 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="px-2 py-2 text-center text-gray-400 text-xs border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        {rowIndex + 1}
                      </td>
                      {Array.from({ length: columnCount }).map((_, colIndex) => {
                        const value = row[colIndex] || '';
                        const isSelected = selectedCell?.colIndex === colIndex && selectedCell?.rowIndex === rowIndex;
                        const isColumnSelected = selectedCell?.colIndex === colIndex;
                        const isHovered = hoveredCol === colIndex;
                        const mapping = getMappingForColumn(colIndex);
                        
                        // Cevap görselleştirme
                        const isAnswerLike = /^[ABCDE\s]+$/i.test(value) && value.length > 10;
                        
                        return (
                          <td
                            key={colIndex}
                            onClick={() => handleCellClick(rowIndex, colIndex, value)}
                            className={`px-2 py-2 text-xs border-r border-gray-100 dark:border-gray-700 cursor-pointer transition-all max-w-[200px] truncate ${
                              isSelected
                                ? 'bg-emerald-100 dark:bg-emerald-900 ring-2 ring-inset ring-emerald-500 font-medium'
                                : isColumnSelected
                                  ? 'bg-emerald-50 dark:bg-emerald-900/50'
                                  : isHovered
                                    ? 'bg-blue-50 dark:bg-blue-900/30'
                                    : mapping
                                      ? 'bg-gray-50 dark:bg-gray-800'
                                      : ''
                            }`}
                            title={value}
                          >
                            {isAnswerLike ? (
                              <div className="flex flex-wrap gap-0.5">
                                {value.replace(/\s/g, '').split('').slice(0, 20).map((char, i) => (
                                  <span 
                                    key={i} 
                                    className={`inline-block w-4 h-4 text-[10px] rounded text-center leading-4 ${
                                      char === 'A' ? 'bg-red-100 text-red-700' :
                                      char === 'B' ? 'bg-orange-100 text-orange-700' :
                                      char === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                      char === 'D' ? 'bg-green-100 text-green-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {char}
                                  </span>
                                ))}
                                {value.replace(/\s/g, '').length > 20 && (
                                  <span className="text-gray-400 text-[10px]">
                                    +{value.replace(/\s/g, '').length - 20}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* SAĞ: Alan Tanımlama */}
        <div className="w-[30%]">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm sticky top-4">
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
              <h3 className="text-white font-semibold">Alan Tanımlama</h3>
              {selectedCell ? (
                <p className="text-indigo-100 text-sm mt-1">
                  📍 Sütun {getColumnLetter(selectedCell.colIndex)} seçildi
                </p>
              ) : (
                <p className="text-indigo-100 text-sm mt-1">
                  Tabloda bir sütuna tıklayın
                </p>
              )}
            </div>
            
            {/* Alan Listesi */}
            <div className="p-4 space-y-2">
              {(Object.entries(FIELD_CONFIG) as [FieldType, typeof FIELD_CONFIG[FieldType]][]).map(([field, config]) => {
                const mapping = getMappingForField(field);
                const isActive = selectedCell !== null;
                
                return (
                  <button
                    key={field}
                    onClick={() => handleFieldSelect(field)}
                    disabled={!isActive}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      mapping
                        ? `border-${config.color}-400 bg-${config.color}-50 dark:bg-${config.color}-900/20`
                        : isActive
                          ? 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                          : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {config.label}
                          </span>
                          {config.required && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded">
                              Zorunlu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {config.description}
                        </p>
                        
                        {/* Eşleşme Bilgisi */}
                        {mapping && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">→ Sütun {mapping.columnLetter}</span>
                              {mapping.detectedInfo && (
                                <span className="text-gray-400">• {mapping.detectedInfo}</span>
                              )}
                            </div>
                            <div className="mt-1 text-xs font-mono text-gray-500 truncate">
                              Örnek: {mapping.sampleValue}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Validation Status */}
            <div className={`mx-4 mb-4 p-3 rounded-lg ${
              validation.isValid 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {validation.isValid ? '✅' : '⚠️'}
                </span>
                <span className={`text-sm font-medium ${
                  validation.isValid 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-amber-700 dark:text-amber-300'
                }`}>
                  {validation.message}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Navigation */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          ← Geri
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {mappings.length} sütun eşleştirildi
          </span>
          
          <button
            onClick={handleComplete}
            disabled={!validation.isValid}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              validation.isValid
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Devam →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ColumnMappingPage;

