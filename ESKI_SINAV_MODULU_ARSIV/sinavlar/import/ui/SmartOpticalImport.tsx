/**
 * ============================================
 * AkademiHub - Akıllı Optik Okuma & Sınav İçe Aktarma
 * ============================================
 * 
 * PHASE 8.6 - GELİŞMİŞ VERSİYON
 * 
 * ÖZELLİKLER:
 * - LGS, TYT, AYT, Deneme sınav türleri
 * - Otomatik sınav türü algılama
 * - Ders bazlı cevap gruplama
 * - Click-to-assign mantığı
 * - OCR Türkçe karakter düzeltme
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronRight, CheckCircle, AlertCircle, FileText, Upload, Sparkles, Eye, Users } from 'lucide-react';
import { correctOCRErrors } from '../txt/ocrCorrection';
import { 
  ExamTypeConfig, 
  ALL_EXAM_CONFIGS, 
  LGS_CONFIG, 
  TYT_CONFIG,
  detectExamType,
  splitAnswersBySubjects
} from '../templates/examTypes';

// ==================== TYPES ====================

export type FieldType = 'tc' | 'student_no' | 'name' | 'class' | 'booklet' | 'answers' | 'ignore';

interface DetectedSegment {
  text: string;
  type: 'number' | 'text' | 'answers' | 'class' | 'unknown';
  startIndex: number;
  endIndex: number;
  confidence: number;
  fieldAssignment?: FieldType;
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

interface SmartOpticalImportProps {
  examId: string;
  examName?: string;
  onComplete: (data: { 
    rows: ParsedRow[]; 
    assignments: FieldAssignment[];
    examType: ExamTypeConfig;
  }) => void;
  onBack: () => void;
}

// ==================== CONSTANTS ====================

const FIELD_CONFIG: Record<FieldType, { label: string; emoji: string; description: string }> = {
  tc: { label: 'TC Kimlik', emoji: '🪪', description: '11 haneli TC numarası' },
  student_no: { label: 'Öğrenci No', emoji: '🔢', description: 'Okul numarası' },
  name: { label: 'Ad Soyad', emoji: '👤', description: 'Öğrenci adı' },
  class: { label: 'Sınıf', emoji: '🏫', description: '8A, 8C, 10B...' },
  booklet: { label: 'Kitapçık', emoji: '📖', description: 'A, B, C, D' },
  answers: { label: 'Cevaplar', emoji: '✍️', description: 'Sınav cevapları' },
  ignore: { label: 'Atla', emoji: '⏭️', description: 'Kullanma' }
};

// ==================== AUTO-SPLIT ENGINE ====================

function autoSplitRow(rawText: string): DetectedSegment[] {
  const segments: DetectedSegment[] = [];
  const text = rawText.trim();
  
  if (!text) return segments;
  
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
      confidence: 95,
      fieldAssignment: 'student_no'
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
      confidence: 98,
      fieldAssignment: 'tc'
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
      confidence: 90,
      fieldAssignment: 'class'
    });
  }
  
  // PATTERN 4: Cevap blokları
  const answersMatch = corrected.match(/[ABCDE]{5,}/gi);
  if (answersMatch) {
    const allAnswers = answersMatch.join('');
    const firstIndex = corrected.search(/[ABCDE]{5,}/i);
    segments.push({
      text: allAnswers,
      type: 'answers',
      startIndex: firstIndex,
      endIndex: corrected.length,
      confidence: 95,
      fieldAssignment: 'answers'
    });
  }
  
  // PATTERN 5: İsim
  const afterNo = studentNoMatch ? corrected.substring(6) : corrected;
  const classIdx = classMatch ? afterNo.indexOf(classMatch[0]) : -1;
  const answersIdx = afterNo.search(/[ABCDE]{5,}/i);
  
  let nameEnd = afterNo.length;
  if (classIdx > 0) nameEnd = Math.min(nameEnd, classIdx);
  if (answersIdx > 0) nameEnd = Math.min(nameEnd, answersIdx);
  
  const namePart = afterNo.substring(0, nameEnd).trim();
  if (namePart && /[A-ZÇĞİÖŞÜ]/i.test(namePart)) {
    const nameWithoutTC = namePart.replace(/\d{11}/g, '').trim();
    if (nameWithoutTC.length >= 3) {
      segments.push({
        text: nameWithoutTC,
        type: 'text',
        startIndex: currentIndex,
        endIndex: currentIndex + nameWithoutTC.length,
        confidence: 80,
        fieldAssignment: 'name'
      });
    }
  }
  
  segments.sort((a, b) => a.startIndex - b.startIndex);
  
  return segments;
}

// ==================== STEP COMPONENTS ====================

type Step = 'exam_type' | 'upload' | 'mapping' | 'preview';

// ==================== MAIN COMPONENT ====================

export function SmartOpticalImport({
  examId,
  examName,
  onComplete,
  onBack
}: SmartOpticalImportProps) {
  // State
  const [step, setStep] = useState<Step>('exam_type');
  const [selectedExamType, setSelectedExamType] = useState<ExamTypeConfig | null>(null);
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
      
      const parsed: ParsedRow[] = lines.map((line, index) => ({
        rowIndex: index,
        rawText: line,
        segments: autoSplitRow(line),
        correctedText: correctOCRErrors(line)
      }));
      
      setParsedRows(parsed);
      
      // Otomatik alan tespiti
      if (parsed.length > 0) {
        const newAssignments = new Map<FieldType, number>();
        parsed[0].segments.forEach((segment, index) => {
          if (segment.fieldAssignment && segment.fieldAssignment !== 'ignore') {
            newAssignments.set(segment.fieldAssignment, index);
          }
        });
        setAssignments(newAssignments);
      }
      
      // Sınav türü tahmini
      if (!selectedExamType && parsed.length > 0) {
        const firstAnswers = parsed[0].segments.find(s => s.type === 'answers');
        if (firstAnswers) {
          const detected = detectExamType(firstAnswers.text.length);
          if (detected && detected.type !== 'DENEME') {
            setSelectedExamType(detected);
          }
        }
      }
      
      setStep('mapping');
      
    } catch (err) {
      setError('Dosya okunamadı');
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamType]);
  
  // Segment tıklama
  const handleSegmentClick = useCallback((rowIndex: number, segmentIndex: number) => {
    setSelectedRowIndex(rowIndex);
    setSelectedSegmentIndex(segmentIndex);
  }, []);
  
  // Field atama
  const handleFieldAssign = useCallback((field: FieldType) => {
    if (selectedSegmentIndex === null) return;
    
    const newAssignments = new Map(assignments);
    
    for (const [key, value] of newAssignments.entries()) {
      if (value === selectedSegmentIndex) {
        newAssignments.delete(key);
      }
    }
    
    if (field !== 'ignore') {
      newAssignments.set(field, selectedSegmentIndex);
    }
    
    setAssignments(newAssignments);
    setSelectedSegmentIndex(null);
  }, [selectedSegmentIndex, assignments]);
  
  // Validation
  const isValid = useMemo(() => {
    const hasIdentifier = assignments.has('tc') || assignments.has('student_no') || assignments.has('name');
    const hasAnswers = assignments.has('answers');
    return hasIdentifier && hasAnswers && selectedExamType !== null;
  }, [assignments, selectedExamType]);
  
  // Tamamla
  const handleComplete = useCallback(() => {
    if (!isValid || !selectedExamType) return;
    
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
    
    onComplete({ 
      rows: parsedRows, 
      assignments: assignmentArray,
      examType: selectedExamType
    });
  }, [isValid, assignments, parsedRows, onComplete, selectedExamType]);
  
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
  
  // ==================== STEP 1: SINAV TÜRÜ SEÇİMİ ====================
  
  if (step === 'exam_type') {
    const examTypes = [
      { config: LGS_CONFIG, description: '8. Sınıf - 90 Soru', popular: true },
      { config: TYT_CONFIG, description: '12. Sınıf - 120 Soru', popular: true },
      { config: ALL_EXAM_CONFIGS['AYT-SAY'], description: 'Sayısal - 80 Soru', popular: false },
      { config: ALL_EXAM_CONFIGS['AYT-EA'], description: 'Eşit Ağırlık - 80 Soru', popular: false },
      { config: ALL_EXAM_CONFIGS['DENEME'], description: 'Özel sınav formatı', popular: false },
    ];
    
    return (
      <div className="min-h-[500px]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            📝 Sınav Türünü Seçin
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Yükleyeceğiniz sınavın türünü seçin. Sistem soruları otomatik gruplayacak.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {examTypes.map(({ config, description, popular }) => (
            <button
              key={config.name}
              onClick={() => {
                setSelectedExamType(config);
                setStep('upload');
              }}
              className={`relative p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                popular 
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-500'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'
              }`}
            >
              {popular && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                  Popüler
                </span>
              )}
              
              <div className="text-3xl mb-3">{config.emoji}</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                {config.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {config.fullName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {description}
              </p>
              
              {config.subjects.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {config.subjects.slice(0, 4).map(subject => (
                    <span 
                      key={subject.code}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                    >
                      {subject.shortName}
                    </span>
                  ))}
                  {config.subjects.length > 4 && (
                    <span className="text-xs text-gray-400">+{config.subjects.length - 4}</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Geri
          </button>
        </div>
      </div>
    );
  }
  
  // ==================== STEP 2: DOSYA YÜKLEME ====================
  
  if (step === 'upload' || !file) {
    return (
      <div className="min-h-[500px]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setStep('exam_type')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            ←
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {selectedExamType?.emoji} {selectedExamType?.name} Sınavı Yükle
            </h2>
            <p className="text-sm text-gray-500">{selectedExamType?.fullName}</p>
          </div>
        </div>
        
        {/* Sınav Bilgisi */}
        {selectedExamType && selectedExamType.subjects.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📋 {selectedExamType.totalQuestions} Soru Bekleniyor
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedExamType.subjects.map(subject => (
                <span 
                  key={subject.code}
                  className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-sm"
                >
                  {subject.emoji} {subject.shortName}: {subject.questionCount} soru
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="w-full p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Dosyanızı Sürükleyip Bırakın
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Excel, CSV veya TXT dosyası
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
        </div>
      </div>
    );
  }
  
  // ==================== STEP 3: EŞLEŞTIRME ====================
  
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
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
            {selectedExamType?.emoji} {selectedExamType?.name}
          </span>
          <ChevronRight className="w-4 h-4" />
          <span>{file.name}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-emerald-600">{parsedRows.length} öğrenci</span>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          🔍 Verileri Eşleştirin
        </h2>
        <p className="text-sm text-gray-500">
          Soldaki kutuya tıklayın → Sağdan türünü seçin
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      
      {/* Main Layout */}
      <div className="flex gap-4">
        {/* LEFT: Data Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-white text-sm font-medium">
              Veri Önizleme ({parsedRows.length} satır)
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {parsedRows.slice(0, 15).map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    selectedRowIndex === rowIdx ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 p-2">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-500">
                      {rowIdx + 1}
                    </span>
                    
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {row.segments.length > 0 ? (
                        row.segments.map((segment, segIdx) => {
                          const assignedField = [...assignments.entries()].find(([_, idx]) => idx === segIdx)?.[0];
                          const isSelected = selectedRowIndex === rowIdx && selectedSegmentIndex === segIdx;
                          const fieldConfig = assignedField ? FIELD_CONFIG[assignedField] : null;
                          
                          return (
                            <button
                              key={segIdx}
                              onClick={() => handleSegmentClick(rowIdx, segIdx)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                isSelected
                                  ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900'
                                  : assignedField
                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {assignedField && <span className="mr-1">{fieldConfig?.emoji}</span>}
                              {segment.type === 'answers' && segment.text.length > 15
                                ? segment.text.substring(0, 15) + '...'
                                : segment.text
                              }
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 text-xs italic truncate max-w-full">
                          {row.correctedText.substring(0, 80)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {parsedRows.length > 15 && (
                <div className="p-3 text-center text-gray-400 text-sm">
                  ... ve {parsedRows.length - 15} satır daha
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* RIGHT: Field Cards */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden sticky top-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 text-white text-sm font-medium">
              {selectedSegmentIndex !== null ? '→ Tür seçin' : 'Önce veri seçin'}
            </div>
            
            <div className="p-2 space-y-1.5">
              {(Object.entries(FIELD_CONFIG) as [FieldType, typeof FIELD_CONFIG[FieldType]][]).map(([field, config]) => {
                const isActive = selectedSegmentIndex !== null;
                const isAssigned = assignments.has(field);
                
                return (
                  <button
                    key={field}
                    onClick={() => handleFieldAssign(field)}
                    disabled={!isActive}
                    className={`w-full text-left p-2 rounded-lg border transition-all text-sm ${
                      isAssigned
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                        : isActive
                          ? 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                          : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.emoji}</span>
                      <div className="flex-1">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {config.label}
                        </span>
                        {isAssigned && (
                          <CheckCircle className="inline-block w-3.5 h-3.5 ml-1 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Validation */}
            <div className={`m-2 p-2 rounded-lg text-xs ${
              isValid
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            }`}>
              {isValid ? '✅ Hazır!' : '⚠️ Kimlik + Cevap gerekli'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => {
            setFile(null);
            setStep('upload');
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Geri
        </button>
        
        <button
          onClick={handleComplete}
          disabled={!isValid}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
            isValid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg'
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
