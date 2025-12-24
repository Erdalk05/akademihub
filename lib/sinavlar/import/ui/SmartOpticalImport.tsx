/**
 * ============================================
 * AkademiHub - Akıllı Optik Okuma & Alan Eşleştirme
 * ============================================
 * 
 * PHASE 8.6 - TAMAMEN YENİ TASARIM
 * 
 * PRENSİP:
 * "Kullanıcı sütun düşünmemeli. Sistem düşünmeli."
 * 
 * ÖZELLİKLER:
 * - Tek sütunlu optik verileri otomatik ayırır
 * - Pattern recognition ile alan tespiti
 * - Click-to-assign mantığı
 * - Dropdown YOK, Field Cards VAR
 * - 30 saniyede eşleştirme
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { correctOCRErrors } from '../txt/ocrCorrection';

// ==================== TYPES ====================

export type FieldType = 'tc' | 'student_no' | 'name' | 'class' | 'booklet' | 'answers' | 'ignore';

interface DetectedSegment {
  text: string;
  type: 'number' | 'text' | 'answers' | 'class' | 'unknown';
  startIndex: number;
  endIndex: number;
  confidence: number;
}

interface ParsedRow {
  rowIndex: number;
  rawText: string;
  segments: DetectedSegment[];
  correctedText: string;
}

interface FieldAssignment {
  field: FieldType;
  segmentIndex: number;
  rowCount: number;
  validCount: number;
  emptyCount: number;
  invalidCount: number;
  sampleValues: string[];
}

interface FieldCardData {
  field: FieldType;
  label: string;
  emoji: string;
  description: string;
  detected: boolean;
  confidence: number;
  rowCount: number;
  validCount: number;
  emptyCount: number;
}

interface SmartOpticalImportProps {
  examId: string;
  examName?: string;
  onComplete: (data: { rows: ParsedRow[]; assignments: FieldAssignment[] }) => void;
  onBack: () => void;
}

// ==================== CONSTANTS ====================

const FIELD_CONFIG: Record<FieldType, { label: string; emoji: string; description: string; color: string }> = {
  tc: { label: 'TC Kimlik', emoji: '🪪', description: '11 haneli TC numarası', color: 'blue' },
  student_no: { label: 'Öğrenci No', emoji: '🔢', description: 'Okul numarası', color: 'purple' },
  name: { label: 'Ad Soyad', emoji: '👤', description: 'Öğrenci adı', color: 'emerald' },
  class: { label: 'Sınıf', emoji: '🏫', description: '8A, 8C, 10B...', color: 'amber' },
  booklet: { label: 'Kitapçık', emoji: '📖', description: 'A, B, C, D', color: 'pink' },
  answers: { label: 'Cevaplar', emoji: '✍️', description: 'Sınav cevapları', color: 'indigo' },
  ignore: { label: 'Atla', emoji: '⏭️', description: 'Kullanma', color: 'gray' }
};

// ==================== AUTO-SPLIT ENGINE ====================

/**
 * Tek sütunlu optik veriyi akıllıca segmentlere ayırır
 */
function autoSplitRow(rawText: string): DetectedSegment[] {
  const segments: DetectedSegment[] = [];
  const text = rawText.trim();
  
  if (!text) return segments;
  
  // OCR düzeltmesi uygula
  const corrected = correctOCRErrors(text);
  
  let currentIndex = 0;
  
  // PATTERN 1: 6 haneli öğrenci numarası (satır başı)
  const studentNoMatch = corrected.match(/^(\d{6})/);
  if (studentNoMatch) {
    segments.push({
      text: studentNoMatch[1],
      type: 'number',
      startIndex: 0,
      endIndex: 6,
      confidence: 95
    });
    currentIndex = 6;
  }
  
  // PATTERN 2: 11 haneli TC
  const tcMatch = corrected.match(/\b(\d{11})\b/);
  if (tcMatch) {
    segments.push({
      text: tcMatch[1],
      type: 'number',
      startIndex: corrected.indexOf(tcMatch[1]),
      endIndex: corrected.indexOf(tcMatch[1]) + 11,
      confidence: 98
    });
  }
  
  // PATTERN 3: Sınıf (8A, 8C, 10B formatı)
  const classMatch = corrected.match(/\b(\d{1,2}[A-Z])\b/i);
  if (classMatch) {
    const classIndex = corrected.indexOf(classMatch[1]);
    segments.push({
      text: classMatch[1].toUpperCase(),
      type: 'class',
      startIndex: classIndex,
      endIndex: classIndex + classMatch[1].length,
      confidence: 90
    });
  }
  
  // PATTERN 4: Cevap blokları (ABCDE karakterleri)
  const answersMatch = corrected.match(/[ABCDE]{5,}/gi);
  if (answersMatch) {
    const allAnswers = answersMatch.join('');
    const firstIndex = corrected.search(/[ABCDE]{5,}/i);
    segments.push({
      text: allAnswers,
      type: 'answers',
      startIndex: firstIndex,
      endIndex: corrected.length,
      confidence: 95
    });
  }
  
  // PATTERN 5: İsim (harflerden oluşan, sınıf ve cevaplardan önce)
  // Öğrenci numarasından sonra, sınıftan önce
  const afterNo = studentNoMatch ? corrected.substring(6) : corrected;
  const classIdx = classMatch ? afterNo.indexOf(classMatch[0]) : -1;
  const answersIdx = afterNo.search(/[ABCDE]{5,}/i);
  
  let nameEnd = afterNo.length;
  if (classIdx > 0) nameEnd = Math.min(nameEnd, classIdx);
  if (answersIdx > 0) nameEnd = Math.min(nameEnd, answersIdx);
  
  const namePart = afterNo.substring(0, nameEnd).trim();
  if (namePart && /[A-ZÇĞİÖŞÜ]/i.test(namePart)) {
    // TC varsa onu çıkar
    const nameWithoutTC = namePart.replace(/\d{11}/g, '').trim();
    if (nameWithoutTC.length >= 3) {
      segments.push({
        text: nameWithoutTC,
        type: 'text',
        startIndex: currentIndex,
        endIndex: currentIndex + nameWithoutTC.length,
        confidence: 80
      });
    }
  }
  
  // Sırala
  segments.sort((a, b) => a.startIndex - b.startIndex);
  
  return segments;
}

/**
 * Segment tipine göre field öner
 */
function suggestFieldForSegment(segment: DetectedSegment): FieldType {
  switch (segment.type) {
    case 'number':
      if (segment.text.length === 11) return 'tc';
      if (segment.text.length === 6) return 'student_no';
      return 'student_no';
    case 'text':
      return 'name';
    case 'class':
      return 'class';
    case 'answers':
      return 'answers';
    default:
      return 'ignore';
  }
}

// ==================== MAIN COMPONENT ====================

export function SmartOpticalImport({
  examId,
  examName,
  onComplete,
  onBack
}: SmartOpticalImportProps) {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Map<FieldType, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dosya yükleme
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setIsLoading(true);
    setError(null);
    setFile(uploadedFile);
    
    try {
      const text = await uploadedFile.text();
      const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
      
      setRawRows(lines);
      
      // Her satırı parse et
      const parsed: ParsedRow[] = lines.map((line, index) => ({
        rowIndex: index,
        rawText: line,
        segments: autoSplitRow(line),
        correctedText: correctOCRErrors(line)
      }));
      
      setParsedRows(parsed);
      
      // Otomatik alan tespiti
      autoDetectFields(parsed);
      
    } catch (err) {
      setError('Dosya okunamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Otomatik alan tespiti
  const autoDetectFields = useCallback((rows: ParsedRow[]) => {
    const newAssignments = new Map<FieldType, number>();
    
    if (rows.length === 0) return;
    
    // İlk satırın segmentlerini analiz et
    const firstRow = rows[0];
    
    firstRow.segments.forEach((segment, index) => {
      const suggestedField = suggestFieldForSegment(segment);
      if (suggestedField !== 'ignore' && !newAssignments.has(suggestedField)) {
        newAssignments.set(suggestedField, index);
      }
    });
    
    setAssignments(newAssignments);
  }, []);
  
  // Segment tıklama
  const handleSegmentClick = useCallback((rowIndex: number, segmentIndex: number) => {
    setSelectedRowIndex(rowIndex);
    setSelectedSegmentIndex(segmentIndex);
  }, []);
  
  // Field card tıklama
  const handleFieldAssign = useCallback((field: FieldType) => {
    if (selectedSegmentIndex === null) return;
    
    const newAssignments = new Map(assignments);
    
    // Önceki atamayı kaldır
    for (const [key, value] of newAssignments.entries()) {
      if (value === selectedSegmentIndex) {
        newAssignments.delete(key);
      }
    }
    
    // Yeni atama
    if (field !== 'ignore') {
      newAssignments.set(field, selectedSegmentIndex);
    }
    
    setAssignments(newAssignments);
    setSelectedSegmentIndex(null);
  }, [selectedSegmentIndex, assignments]);
  
  // Field card verileri
  const fieldCards = useMemo((): FieldCardData[] => {
    return (Object.entries(FIELD_CONFIG) as [FieldType, typeof FIELD_CONFIG[FieldType]][]).map(([field, config]) => {
      const segmentIndex = assignments.get(field);
      const isAssigned = segmentIndex !== undefined;
      
      let rowCount = 0;
      let validCount = 0;
      let emptyCount = 0;
      
      if (isAssigned && parsedRows.length > 0) {
        parsedRows.forEach(row => {
          const segment = row.segments[segmentIndex];
          if (segment) {
            rowCount++;
            if (segment.text.trim()) {
              validCount++;
            } else {
              emptyCount++;
            }
          }
        });
      }
      
      // Confidence hesapla
      let confidence = 0;
      if (isAssigned && parsedRows.length > 0) {
        const firstRow = parsedRows[0];
        const segment = firstRow.segments[segmentIndex];
        confidence = segment?.confidence || 0;
      }
      
      return {
        field,
        label: config.label,
        emoji: config.emoji,
        description: config.description,
        detected: isAssigned,
        confidence,
        rowCount,
        validCount,
        emptyCount
      };
    });
  }, [assignments, parsedRows]);
  
  // Validation
  const isValid = useMemo(() => {
    const hasIdentifier = assignments.has('tc') || assignments.has('student_no') || assignments.has('name');
    const hasAnswers = assignments.has('answers');
    return hasIdentifier && hasAnswers;
  }, [assignments]);
  
  // Tamamla
  const handleComplete = useCallback(() => {
    if (!isValid) return;
    
    const assignmentArray: FieldAssignment[] = [];
    
    for (const [field, segmentIndex] of assignments.entries()) {
      let validCount = 0;
      let emptyCount = 0;
      const sampleValues: string[] = [];
      
      parsedRows.forEach((row, idx) => {
        const segment = row.segments[segmentIndex];
        if (segment) {
          if (segment.text.trim()) {
            validCount++;
            if (idx < 3) sampleValues.push(segment.text);
          } else {
            emptyCount++;
          }
        }
      });
      
      assignmentArray.push({
        field,
        segmentIndex,
        rowCount: parsedRows.length,
        validCount,
        emptyCount,
        invalidCount: 0,
        sampleValues
      });
    }
    
    onComplete({ rows: parsedRows, assignments: assignmentArray });
  }, [isValid, assignments, parsedRows, onComplete]);
  
  // Drag & Drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  }, [handleFileUpload]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  
  // ==================== RENDER ====================
  
  // Dosya yüklenmemişse
  if (!file) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="w-full max-w-xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Optik Dosyanızı Yükleyin
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Excel, CSV veya TXT dosyasını sürükleyip bırakın
          </p>
          
          <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            Dosya Seç
          </label>
          
          <p className="mt-4 text-sm text-gray-500">
            Desteklenen: .xlsx, .csv, .txt
          </p>
        </div>
      </div>
    );
  }
  
  // Loading
  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Dosya analiz ediliyor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[600px]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          🔍 Akıllı Optik Okuma
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistem verinizi otomatik analiz etti. Alanları tek tıkla atayın.
        </p>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            📄 {file.name}
          </span>
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">
            ✓ {parsedRows.length} satır bulundu
          </span>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      
      {/* Main Layout */}
      <div className="flex gap-6">
        {/* LEFT: Data Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-white">
              <h3 className="font-semibold">Veri Önizleme</h3>
              <p className="text-sm text-blue-100">Bir alana tıklayın, sonra sağdan türünü seçin</p>
            </div>
            
            {/* Rows */}
            <div className="max-h-[450px] overflow-y-auto">
              {parsedRows.slice(0, 20).map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedRowIndex === rowIdx ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  {/* Row Number */}
                  <div className="flex items-start gap-3 p-3">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-500">
                      {rowIdx + 1}
                    </span>
                    
                    {/* Segments */}
                    <div className="flex-1 flex flex-wrap gap-2">
                      {row.segments.length > 0 ? (
                        row.segments.map((segment, segIdx) => {
                          const assignedField = [...assignments.entries()].find(([_, idx]) => idx === segIdx)?.[0];
                          const isSelected = selectedRowIndex === rowIdx && selectedSegmentIndex === segIdx;
                          const fieldConfig = assignedField ? FIELD_CONFIG[assignedField] : null;
                          
                          return (
                            <button
                              key={segIdx}
                              onClick={() => handleSegmentClick(rowIdx, segIdx)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                  : assignedField
                                    ? `bg-${fieldConfig?.color}-100 dark:bg-${fieldConfig?.color}-900/50 text-${fieldConfig?.color}-700 dark:text-${fieldConfig?.color}-300 border border-${fieldConfig?.color}-300 dark:border-${fieldConfig?.color}-700`
                                    : segment.type === 'number'
                                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                      : segment.type === 'answers'
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                        : segment.type === 'class'
                                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              {assignedField && <span className="mr-1">{fieldConfig?.emoji}</span>}
                              {segment.type === 'answers' && segment.text.length > 20
                                ? segment.text.substring(0, 20) + '...'
                                : segment.text
                              }
                            </button>
                          );
                        })
                      ) : (
                        // Segment bulunamadıysa raw text göster
                        <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                          {row.correctedText.length > 100 
                            ? row.correctedText.substring(0, 100) + '...'
                            : row.correctedText
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {parsedRows.length > 20 && (
                <div className="p-4 text-center text-gray-500">
                  ... ve {parsedRows.length - 20} satır daha
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* RIGHT: Field Cards */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm sticky top-4">
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3 text-white">
              <h3 className="font-semibold">Alan Türleri</h3>
              {selectedSegmentIndex !== null ? (
                <p className="text-sm text-purple-100">Bir alan türü seçin →</p>
              ) : (
                <p className="text-sm text-purple-100">Önce soldaki veriye tıklayın</p>
              )}
            </div>
            
            {/* Field Cards */}
            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
              {fieldCards.map((card) => {
                const isActive = selectedSegmentIndex !== null;
                const isAssigned = card.detected;
                
                return (
                  <button
                    key={card.field}
                    onClick={() => handleFieldAssign(card.field)}
                    disabled={!isActive}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isAssigned
                        ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                        : isActive
                          ? 'border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                          : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{card.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {card.label}
                          </span>
                          {isAssigned && (
                            <span className="text-xs px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded">
                              ✓ Atandı
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {card.description}
                        </p>
                        
                        {/* Stats */}
                        {isAssigned && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ✓ {card.validCount} geçerli
                            </span>
                            {card.emptyCount > 0 && (
                              <span className="text-amber-600 dark:text-amber-400">
                                ⚠ {card.emptyCount} boş
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Validation */}
            <div className={`mx-3 mb-3 p-3 rounded-xl ${
              isValid
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{isValid ? '✅' : '⚠️'}</span>
                <div>
                  <p className={`text-sm font-medium ${
                    isValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {isValid ? 'Eşleştirme hazır!' : 'Kimlik + Cevap gerekli'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isValid 
                      ? `${assignments.size} alan atandı` 
                      : 'TC/Ad Soyad ve Cevapları seçin'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ← Geri
        </button>
        
        <button
          onClick={handleComplete}
          disabled={!isValid}
          className={`px-8 py-3 rounded-xl font-semibold transition-all ${
            isValid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Devam Et →
        </button>
      </div>
    </div>
  );
}

export default SmartOpticalImport;

