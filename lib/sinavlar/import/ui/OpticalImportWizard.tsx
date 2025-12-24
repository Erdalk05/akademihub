/**
 * ============================================
 * AkademiHub - Gelişmiş Optik Okuma Sistemi
 * ============================================
 * 
 * Demo'daki gibi KOLON BAZLI tablo sistemi
 * 
 * ADIMLAR:
 * 1. Kolonları Eşleştir
 * 2. Dersleri Tanımla
 * 3. Tamamla
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircle, ChevronRight, Upload, Plus, Trash2, GripVertical } from 'lucide-react';
import { ExamTypeConfig, LGS_CONFIG, TYT_CONFIG, ALL_EXAM_CONFIGS } from '../templates/examTypes';
import { correctOCRErrors } from '../txt/ocrCorrection';

// ==================== TYPES ====================

type ColumnType = 'tc' | 'student_no' | 'name' | 'surname' | 'class' | 'booklet' | 'answers' | 'ignore';

interface ColumnDefinition {
  index: number;
  letter: string;
  type: ColumnType | null;
  subjectCode?: string;
  subjectName?: string;
}

interface SubjectDefinition {
  code: string;
  name: string;
  questionCount: number;
  columnIndex: number;
  color: string;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  columnCount: number;
  rowCount: number;
}

type WizardStep = 'upload' | 'columns' | 'subjects' | 'preview';

// ==================== CONSTANTS ====================

const COLUMN_TYPES: { type: ColumnType; label: string; emoji: string; description: string }[] = [
  { type: 'tc', label: 'TC Kimlik', emoji: '🪪', description: '11 haneli TC numarası' },
  { type: 'student_no', label: 'Öğrenci No', emoji: '🔢', description: 'Okul numarası' },
  { type: 'name', label: 'Ad', emoji: '👤', description: 'Öğrenci adı' },
  { type: 'surname', label: 'Soyad', emoji: '👤', description: 'Öğrenci soyadı' },
  { type: 'class', label: 'Sınıf', emoji: '🏫', description: '8A, 8C, 10B...' },
  { type: 'booklet', label: 'Kitapçık', emoji: '📖', description: 'A, B, C, D' },
  { type: 'answers', label: 'Ders Cevapları', emoji: '✍️', description: 'Sınav cevapları' },
  { type: 'ignore', label: 'Atla', emoji: '⏭️', description: 'Bu kolonu kullanma' },
];

const SUBJECT_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', 
  '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#0EA5E9'
];

// ==================== PARSER ====================

function parseOpticalData(text: string): ParsedData {
  const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [], columnCount: 0, rowCount: 0 };
  }
  
  // Her satırı akıllıca kolonlara ayır
  const parsedRows: string[][] = lines.map(line => smartSplitLine(line));
  
  // En fazla kolon sayısını bul
  const maxColumns = Math.max(...parsedRows.map(row => row.length));
  
  // Tüm satırları aynı kolon sayısına getir
  const normalizedRows = parsedRows.map(row => {
    while (row.length < maxColumns) {
      row.push('');
    }
    return row;
  });
  
  // Kolon harflerini oluştur
  const headers = Array.from({ length: maxColumns }, (_, i) => 
    String.fromCharCode(65 + i) // A, B, C, D...
  );
  
  return {
    headers,
    rows: normalizedRows,
    columnCount: maxColumns,
    rowCount: normalizedRows.length
  };
}

function smartSplitLine(line: string): string[] {
  const trimmed = line.trim();
  
  // OCR düzeltmesi
  const corrected = correctOCRErrors(trimmed);
  
  // TAB ile ayrılmış mı?
  if (corrected.includes('\t')) {
    return corrected.split('\t').map(s => s.trim());
  }
  
  // Noktalı virgül ile ayrılmış mı?
  if (corrected.includes(';')) {
    return corrected.split(';').map(s => s.trim());
  }
  
  // Virgül ile ayrılmış mı? (ama cevaplarda virgül olabilir)
  if (corrected.includes(',') && !corrected.match(/[ABCDE]{10,}/)) {
    return corrected.split(',').map(s => s.trim());
  }
  
  // Birden fazla boşluk ile ayrılmış mı?
  if (corrected.includes('  ')) {
    return corrected.split(/\s{2,}/).map(s => s.trim());
  }
  
  // Akıllı ayrıştırma - pattern bazlı
  return smartPatternSplit(corrected);
}

function smartPatternSplit(text: string): string[] {
  const result: string[] = [];
  let remaining = text;
  
  // 1. Öğrenci numarası (6 hane, başta)
  const studentNoMatch = remaining.match(/^(\d{6})/);
  if (studentNoMatch) {
    result.push(studentNoMatch[1]);
    remaining = remaining.substring(6).trim();
  }
  
  // 2. TC Kimlik (11 hane)
  const tcMatch = remaining.match(/(\d{11})/);
  if (tcMatch) {
    const tcIndex = remaining.indexOf(tcMatch[1]);
    if (tcIndex > 0) {
      // TC'den önceki kısım (isim olabilir)
      const beforeTC = remaining.substring(0, tcIndex).trim();
      if (beforeTC) result.push(beforeTC);
    }
    result.push(tcMatch[1]);
    remaining = remaining.substring(remaining.indexOf(tcMatch[1]) + 11).trim();
  }
  
  // 3. İsim kısmını bul (sınıfa kadar)
  const classMatch = remaining.match(/\s(\d{1,2}[A-Z])\s/i);
  if (classMatch) {
    const classIndex = remaining.indexOf(classMatch[0]);
    const namePart = remaining.substring(0, classIndex).trim();
    
    // İsmi ad ve soyad olarak ayır
    const nameParts = namePart.split(/\s+/);
    if (nameParts.length >= 2) {
      result.push(nameParts[0]); // Ad
      result.push(nameParts.slice(1).join(' ')); // Soyad
    } else if (nameParts.length === 1) {
      result.push(nameParts[0]);
    }
    
    result.push(classMatch[1]); // Sınıf
    remaining = remaining.substring(classIndex + classMatch[0].length).trim();
  } else if (!tcMatch && !studentNoMatch) {
    // Hiçbir pattern bulunamadı, tek parça olarak ekle
    if (remaining.trim()) {
      result.push(remaining.trim());
    }
    return result;
  }
  
  // 4. Cevap bloklarını bul
  const answerBlocks = remaining.match(/[ABCDE]{3,}/gi);
  if (answerBlocks) {
    answerBlocks.forEach(block => {
      result.push(block);
    });
  } else if (remaining.trim()) {
    result.push(remaining.trim());
  }
  
  return result.filter(s => s.length > 0);
}

// ==================== MAIN COMPONENT ====================

interface OpticalImportWizardProps {
  onComplete: (data: {
    students: Array<{
      studentNo: string;
      name: string;
      surname: string;
      class: string;
      answers: Record<string, string>;
    }>;
    subjects: SubjectDefinition[];
    examType: ExamTypeConfig;
  }) => void;
  onBack: () => void;
}

export function OpticalImportWizard({ onComplete, onBack }: OpticalImportWizardProps) {
  // State
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [subjects, setSubjects] = useState<SubjectDefinition[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [examType, setExamType] = useState<ExamTypeConfig>(LGS_CONFIG);
  
  // Dosya yükleme
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    
    const text = await uploadedFile.text();
    const data = parseOpticalData(text);
    setParsedData(data);
    
    // Kolonları başlat
    const initialColumns: ColumnDefinition[] = data.headers.map((letter, index) => ({
      index,
      letter,
      type: null
    }));
    
    // Otomatik tahmin
    data.rows.slice(0, 5).forEach(row => {
      row.forEach((cell, colIndex) => {
        if (!initialColumns[colIndex].type) {
          // 6 haneli sayı = öğrenci no
          if (/^\d{6}$/.test(cell)) {
            initialColumns[colIndex].type = 'student_no';
          }
          // 11 haneli sayı = TC
          else if (/^\d{11}$/.test(cell)) {
            initialColumns[colIndex].type = 'tc';
          }
          // Sınıf formatı
          else if (/^\d{1,2}[A-Z]$/i.test(cell)) {
            initialColumns[colIndex].type = 'class';
          }
          // Tek harf = kitapçık
          else if (/^[ABCD]$/i.test(cell)) {
            initialColumns[colIndex].type = 'booklet';
          }
          // Uzun ABCDE = cevaplar
          else if (/^[ABCDE]{5,}$/i.test(cell)) {
            initialColumns[colIndex].type = 'answers';
          }
          // Kısa metin = ad veya soyad
          else if (/^[A-ZÇĞİÖŞÜ]+$/i.test(cell) && cell.length >= 2 && cell.length <= 20) {
            if (!initialColumns.some(c => c.type === 'name')) {
              initialColumns[colIndex].type = 'name';
            } else if (!initialColumns.some(c => c.type === 'surname')) {
              initialColumns[colIndex].type = 'surname';
            }
          }
        }
      });
    });
    
    setColumns(initialColumns);
    setStep('columns');
  }, []);
  
  // Kolon tipi atama
  const handleColumnTypeChange = useCallback((type: ColumnType) => {
    if (selectedColumn === null) return;
    
    setColumns(prev => prev.map(col => 
      col.index === selectedColumn ? { ...col, type } : col
    ));
    setSelectedColumn(null);
  }, [selectedColumn]);
  
  // Ders ekleme
  const handleAddSubject = useCallback(() => {
    const newSubject: SubjectDefinition = {
      code: `DERS${subjects.length + 1}`,
      name: `Ders ${subjects.length + 1}`,
      questionCount: 20,
      columnIndex: -1,
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]
    };
    setSubjects(prev => [...prev, newSubject]);
  }, [subjects]);
  
  // Ders silme
  const handleRemoveSubject = useCallback((index: number) => {
    setSubjects(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Ders güncelleme
  const handleUpdateSubject = useCallback((index: number, updates: Partial<SubjectDefinition>) => {
    setSubjects(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }, []);
  
  // Hazır şablon yükle
  const handleLoadTemplate = useCallback((template: 'lgs' | 'tyt' | 'custom') => {
    if (template === 'lgs') {
      setExamType(LGS_CONFIG);
      setSubjects(LGS_CONFIG.subjects.map((s, i) => ({
        code: s.code,
        name: s.name,
        questionCount: s.questionCount,
        columnIndex: -1,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length]
      })));
    } else if (template === 'tyt') {
      setExamType(TYT_CONFIG);
      setSubjects(TYT_CONFIG.subjects.map((s, i) => ({
        code: s.code,
        name: s.name,
        questionCount: s.questionCount,
        columnIndex: -1,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length]
      })));
    }
  }, []);
  
  // Validation
  const isColumnsValid = useMemo(() => {
    const hasIdentifier = columns.some(c => c.type === 'tc' || c.type === 'student_no' || c.type === 'name');
    const hasAnswers = columns.some(c => c.type === 'answers');
    return hasIdentifier && hasAnswers;
  }, [columns]);
  
  const isSubjectsValid = useMemo(() => {
    return subjects.length > 0 && subjects.every(s => s.name && s.questionCount > 0);
  }, [subjects]);
  
  // ==================== STEP 1: UPLOAD ====================
  
  if (step === 'upload') {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div
          className="w-full max-w-xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-center hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
          onDrop={(e) => {
            e.preventDefault();
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) handleFileUpload(droppedFile);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Optik Dosyanızı Yükleyin
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Excel, CSV veya TXT dosyasını sürükleyip bırakın
          </p>
          
          <label className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors cursor-pointer">
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
  
  // ==================== STEP 2: COLUMNS ====================
  
  if (step === 'columns' && parsedData) {
    return (
      <div className="min-h-[600px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            🎓 AkademiHub - Gelişmiş Optik Okuma
          </h2>
          <p className="text-purple-200 text-sm">Ders Bazlı Sınav Analizi ve Kolon Eşleştirme</p>
        </div>
        
        {/* Steps */}
        <div className="flex justify-center gap-4 mb-6">
          <StepIndicator number={1} label="Kolonları Eşleştir" active />
          <StepIndicator number={2} label="Dersleri Tanımla" />
          <StepIndicator number={3} label="Tamamla" />
        </div>
        
        {/* Main Content */}
        <div className="flex gap-6">
          {/* LEFT: Table */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  📊 OPTİK OKUYUCU VERİLERİ
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {/* Column Headers */}
                  <thead>
                    <tr className="bg-indigo-100 dark:bg-indigo-900/50">
                      <th className="px-2 py-3 text-left text-xs font-bold text-indigo-600 dark:text-indigo-300 w-10">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.index}
                          onClick={() => setSelectedColumn(col.index)}
                          className={`px-3 py-3 text-center text-sm font-bold cursor-pointer transition-all min-w-[80px] ${
                            selectedColumn === col.index
                              ? 'bg-purple-500 text-white'
                              : col.type
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                : 'text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                          }`}
                        >
                          <div>{col.letter}</div>
                          {col.type && (
                            <div className="text-xs font-normal mt-1">
                              {COLUMN_TYPES.find(t => t.type === col.type)?.emoji}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  {/* Data Rows */}
                  <tbody>
                    {parsedData.rows.slice(0, 10).map((row, rowIdx) => (
                      <tr 
                        key={rowIdx}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-2 py-2 text-gray-400 text-xs">
                          {rowIdx + 1}
                        </td>
                        {row.map((cell, colIdx) => {
                          const col = columns[colIdx];
                          return (
                            <td
                              key={colIdx}
                              onClick={() => setSelectedColumn(colIdx)}
                              className={`px-3 py-2 cursor-pointer transition-all ${
                                selectedColumn === colIdx
                                  ? 'bg-purple-100 dark:bg-purple-900/30'
                                  : col?.type
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                    : ''
                              }`}
                            >
                              <span className="text-gray-700 dark:text-gray-300 truncate block max-w-[120px]" title={cell}>
                                {cell.length > 15 ? cell.substring(0, 15) + '...' : cell}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {parsedData.rowCount > 10 && (
                <div className="px-4 py-2 text-center text-gray-500 text-sm border-t">
                  ... ve {parsedData.rowCount - 10} satır daha
                </div>
              )}
            </div>
          </div>
          
          {/* RIGHT: Column Type Panel */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden sticky top-4">
              <div className="bg-rose-50 dark:bg-rose-900/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  🎯 Bu Kolon Ne?
                </h3>
                {selectedColumn !== null ? (
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Kolon {columns[selectedColumn]?.letter} seçildi
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Soldaki tablodan kolon seçin</p>
                )}
              </div>
              
              <div className="p-3 space-y-2">
                {COLUMN_TYPES.map((item) => {
                  const isAssigned = columns.some(c => c.type === item.type && item.type !== 'ignore' && item.type !== 'answers');
                  const isSelected = selectedColumn !== null && columns[selectedColumn]?.type === item.type;
                  
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleColumnTypeChange(item.type)}
                      disabled={selectedColumn === null}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                          : selectedColumn !== null
                            ? 'border-gray-200 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                            : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            {item.label}
                            {isSelected && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Validation */}
              <div className={`mx-3 mb-3 p-3 rounded-lg ${
                isColumnsValid
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              }`}>
                {isColumnsValid ? '✅ Hazır! Devam edebilirsiniz.' : '⚠️ Kimlik + Cevap kolonlarını seçin'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            ← Geri
          </button>
          
          <button
            onClick={() => setStep('subjects')}
            disabled={!isColumnsValid}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
              isColumnsValid
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Devam Et →
          </button>
        </div>
      </div>
    );
  }
  
  // ==================== STEP 3: SUBJECTS ====================
  
  if (step === 'subjects') {
    return (
      <div className="min-h-[600px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            🎓 AkademiHub - Gelişmiş Optik Okuma
          </h2>
          <p className="text-purple-200 text-sm">Ders Bazlı Sınav Analizi ve Kolon Eşleştirme</p>
        </div>
        
        {/* Steps */}
        <div className="flex justify-center gap-4 mb-6">
          <StepIndicator number={1} label="Kolonları Eşleştir" completed />
          <StepIndicator number={2} label="Dersleri Tanımla" active />
          <StepIndicator number={3} label="Tamamla" />
        </div>
        
        {/* Templates */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">📋 Hazır Şablon Kullan</h3>
          <div className="flex gap-3">
            <button
              onClick={() => handleLoadTemplate('lgs')}
              className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              🎓 LGS (90 Soru)
            </button>
            <button
              onClick={() => handleLoadTemplate('tyt')}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors"
            >
              📝 TYT (120 Soru)
            </button>
            <button
              onClick={() => setSubjects([])}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ✏️ Manuel Tanımla
            </button>
          </div>
        </div>
        
        {/* Subjects List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">📚 Dersler</h3>
            <button
              onClick={handleAddSubject}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Ders Ekle
            </button>
          </div>
          
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henüz ders eklenmedi.</p>
              <p className="text-sm">Hazır şablon kullanın veya manuel ekleyin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div 
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => handleUpdateSubject(idx, { name: e.target.value })}
                      placeholder="Ders adı"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    
                    <input
                      type="text"
                      value={subject.code}
                      onChange={(e) => handleUpdateSubject(idx, { code: e.target.value })}
                      placeholder="Kod (MAT, TUR...)"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={subject.questionCount}
                        onChange={(e) => handleUpdateSubject(idx, { questionCount: parseInt(e.target.value) || 0 })}
                        placeholder="Soru"
                        min={1}
                        max={100}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-gray-500 text-sm">soru</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveSubject(idx)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {subjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
              <span className="text-gray-500">Toplam: {subjects.length} ders</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {subjects.reduce((sum, s) => sum + s.questionCount, 0)} soru
              </span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={() => setStep('columns')} className="text-gray-500 hover:text-gray-700">
            ← Geri
          </button>
          
          <button
            onClick={() => setStep('preview')}
            disabled={!isSubjectsValid}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
              isSubjectsValid
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Tamamla →
          </button>
        </div>
      </div>
    );
  }
  
  // ==================== STEP 4: PREVIEW ====================
  
  if (step === 'preview' && parsedData) {
    const answerColumns = columns.filter(c => c.type === 'answers');
    const studentNoCol = columns.find(c => c.type === 'student_no');
    const nameCol = columns.find(c => c.type === 'name');
    const surnameCol = columns.find(c => c.type === 'surname');
    const classCol = columns.find(c => c.type === 'class');
    
    return (
      <div className="min-h-[600px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Hazır!
          </h2>
          <p className="text-emerald-100 text-sm">
            {parsedData.rowCount} öğrenci • {subjects.length} ders • {subjects.reduce((sum, s) => sum + s.questionCount, 0)} soru
          </p>
        </div>
        
        {/* Steps */}
        <div className="flex justify-center gap-4 mb-6">
          <StepIndicator number={1} label="Kolonları Eşleştir" completed />
          <StepIndicator number={2} label="Dersleri Tanımla" completed />
          <StepIndicator number={3} label="Tamamla" active />
        </div>
        
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-blue-600">{parsedData.rowCount}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Öğrenci</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-purple-600">{subjects.length}</div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Ders</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {subjects.reduce((sum, s) => sum + s.questionCount, 0)}
            </div>
            <div className="text-sm text-emerald-700 dark:text-emerald-300">Soru</div>
          </div>
        </div>
        
        {/* Subjects Preview */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">📚 Ders Dağılımı</h3>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: subject.color + '20' }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="font-medium" style={{ color: subject.color }}>
                  {subject.name}
                </span>
                <span className="text-gray-500 text-sm">({subject.questionCount} soru)</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={() => setStep('subjects')} className="text-gray-500 hover:text-gray-700">
            ← Geri
          </button>
          
          <button
            onClick={() => {
              // Prepare data
              const students = parsedData.rows.map(row => ({
                studentNo: studentNoCol ? row[studentNoCol.index] : '',
                name: nameCol ? row[nameCol.index] : '',
                surname: surnameCol ? row[surnameCol.index] : '',
                class: classCol ? row[classCol.index] : '',
                answers: answerColumns.reduce((acc, col, idx) => {
                  acc[subjects[idx]?.code || `col${idx}`] = row[col.index];
                  return acc;
                }, {} as Record<string, string>)
              }));
              
              onComplete({ students, subjects, examType });
            }}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Kaydet ve Tamamla
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}

// ==================== STEP INDICATOR ====================

function StepIndicator({ 
  number, 
  label, 
  active, 
  completed 
}: { 
  number: number; 
  label: string; 
  active?: boolean; 
  completed?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
      active
        ? 'bg-purple-600 text-white'
        : completed
          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
    }`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
        active
          ? 'bg-white text-purple-600'
          : completed
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
      }`}>
        {completed ? '✓' : number}
      </span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

export default OpticalImportWizard;

