/**
 * ============================================
 * AkademiHub - Gelişmiş Optik Okuma Sistemi v3.0
 * ============================================
 * 
 * ADIMLAR:
 * 1. Kolonları Eşleştir
 * 2. Dersleri Tanımla
 * 3. Cevap Anahtarı Gir
 * 4. Sonuçları Gör
 * 5. Tamamla
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  CheckCircle, ChevronRight, Upload, Plus, Trash2, 
  TrendingUp, TrendingDown, Users, Award, BarChart3,
  Calculator, Target, Sparkles
} from 'lucide-react';
import { ExamTypeConfig, LGS_CONFIG, TYT_CONFIG } from '../templates/examTypes';
import { correctOCRErrors } from '../txt/ocrCorrection';

// ==================== TYPES ====================

type ColumnType = 'tc' | 'student_no' | 'name' | 'surname' | 'class' | 'booklet' | 'answers' | 'ignore';

interface ColumnDefinition {
  index: number;
  letter: string;
  type: ColumnType | null;
}

interface SubjectDefinition {
  code: string;
  name: string;
  questionCount: number;
  startQuestion: number;
  color: string;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  columnCount: number;
  rowCount: number;
}

interface StudentResult {
  rowIndex: number;
  studentNo: string;
  name: string;
  surname: string;
  class: string;
  answers: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  subjectNets: Record<string, number>;
}

type WizardStep = 'upload' | 'columns' | 'subjects' | 'answerkey' | 'results' | 'complete';

// ==================== CONSTANTS ====================

const COLUMN_TYPES: { type: ColumnType; label: string; emoji: string; description: string }[] = [
  { type: 'tc', label: 'TC Kimlik', emoji: '🪪', description: '11 haneli TC' },
  { type: 'student_no', label: 'Öğrenci No', emoji: '🔢', description: 'Okul numarası' },
  { type: 'name', label: 'Ad', emoji: '👤', description: 'Öğrenci adı' },
  { type: 'surname', label: 'Soyad', emoji: '👤', description: 'Soyadı' },
  { type: 'class', label: 'Sınıf', emoji: '🏫', description: '8A, 8C...' },
  { type: 'booklet', label: 'Kitapçık', emoji: '📖', description: 'A, B, C, D' },
  { type: 'answers', label: 'Cevaplar', emoji: '✍️', description: 'Sınav cevapları' },
  { type: 'ignore', label: 'Atla', emoji: '⏭️', description: 'Kullanma' },
];

const SUBJECT_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', 
  '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#0EA5E9'
];

// ==================== PARSER ====================

function parseOpticalData(text: string): ParsedData {
  const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [], columnCount: 0, rowCount: 0 };
  
  const parsedRows: string[][] = lines.map(line => smartSplitLine(line));
  const maxColumns = Math.max(...parsedRows.map(row => row.length));
  
  const normalizedRows = parsedRows.map(row => {
    while (row.length < maxColumns) row.push('');
    return row;
  });
  
  const headers = Array.from({ length: maxColumns }, (_, i) => String.fromCharCode(65 + i));
  
  return { headers, rows: normalizedRows, columnCount: maxColumns, rowCount: normalizedRows.length };
}

function smartSplitLine(line: string): string[] {
  const trimmed = line.trim();
  const corrected = correctOCRErrors(trimmed);
  
  if (corrected.includes('\t')) return corrected.split('\t').map(s => s.trim());
  if (corrected.includes(';')) return corrected.split(';').map(s => s.trim());
  if (corrected.includes(',') && !corrected.match(/[ABCDE]{10,}/)) return corrected.split(',').map(s => s.trim());
  if (corrected.includes('  ')) return corrected.split(/\s{2,}/).map(s => s.trim());
  
  return smartPatternSplit(corrected);
}

function smartPatternSplit(text: string): string[] {
  const result: string[] = [];
  let remaining = text;
  
  const studentNoMatch = remaining.match(/^(\d{6})/);
  if (studentNoMatch) {
    result.push(studentNoMatch[1]);
    remaining = remaining.substring(6).trim();
  }
  
  const tcMatch = remaining.match(/(\d{11})/);
  if (tcMatch) {
    const tcIndex = remaining.indexOf(tcMatch[1]);
    if (tcIndex > 0) {
      const beforeTC = remaining.substring(0, tcIndex).trim();
      if (beforeTC) result.push(beforeTC);
    }
    result.push(tcMatch[1]);
    remaining = remaining.substring(remaining.indexOf(tcMatch[1]) + 11).trim();
  }
  
  const classMatch = remaining.match(/\s(\d{1,2}[A-Z])\s/i);
  if (classMatch) {
    const classIndex = remaining.indexOf(classMatch[0]);
    const namePart = remaining.substring(0, classIndex).trim();
    const nameParts = namePart.split(/\s+/);
    if (nameParts.length >= 2) {
      result.push(nameParts[0]);
      result.push(nameParts.slice(1).join(' '));
    } else if (nameParts.length === 1) {
      result.push(nameParts[0]);
    }
    result.push(classMatch[1]);
    remaining = remaining.substring(classIndex + classMatch[0].length).trim();
  }
  
  const answerBlocks = remaining.match(/[ABCDE]{3,}/gi);
  if (answerBlocks) {
    answerBlocks.forEach(block => result.push(block));
  } else if (remaining.trim()) {
    result.push(remaining.trim());
  }
  
  return result.filter(s => s.length > 0);
}

// ==================== NET CALCULATOR ====================

function calculateNet(studentAnswers: string, answerKey: string, subjects: SubjectDefinition[]): {
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  subjectNets: Record<string, number>;
} {
  let correct = 0, wrong = 0, blank = 0;
  const subjectResults: Record<string, { correct: number; wrong: number }> = {};
  
  subjects.forEach(s => { subjectResults[s.code] = { correct: 0, wrong: 0 }; });
  
  for (let i = 0; i < answerKey.length; i++) {
    const key = answerKey[i]?.toUpperCase();
    const student = studentAnswers[i]?.toUpperCase() || '';
    
    const subject = subjects.find(s => i >= s.startQuestion - 1 && i < s.startQuestion - 1 + s.questionCount);
    
    if (key === 'X') continue;
    
    if (!student || student === ' ' || student === '-') {
      blank++;
    } else if (student === key) {
      correct++;
      if (subject) subjectResults[subject.code].correct++;
    } else {
      wrong++;
      if (subject) subjectResults[subject.code].wrong++;
    }
  }
  
  const net = correct - (wrong / 4);
  const subjectNets: Record<string, number> = {};
  
  for (const [code, result] of Object.entries(subjectResults)) {
    subjectNets[code] = result.correct - (result.wrong / 4);
  }
  
  return { correct, wrong, blank, net: Math.round(net * 100) / 100, subjectNets };
}

// ==================== MAIN COMPONENT ====================

interface OpticalImportWizardProps {
  onComplete: (data: {
    students: StudentResult[];
    subjects: SubjectDefinition[];
    stats: {
      average: number;
      highest: { name: string; net: number };
      lowest: { name: string; net: number };
    };
  }) => void;
  onBack: () => void;
}

export function OpticalImportWizard({ onComplete, onBack }: OpticalImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [subjects, setSubjects] = useState<SubjectDefinition[]>([]);
  const [answerKey, setAnswerKey] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  
  // Dosya yükleme
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    const text = await uploadedFile.text();
    const data = parseOpticalData(text);
    setParsedData(data);
    
    const initialColumns: ColumnDefinition[] = data.headers.map((letter, index) => ({
      index, letter, type: null
    }));
    
    // Otomatik tahmin
    data.rows.slice(0, 5).forEach(row => {
      row.forEach((cell, colIndex) => {
        if (!initialColumns[colIndex].type) {
          if (/^\d{6}$/.test(cell)) initialColumns[colIndex].type = 'student_no';
          else if (/^\d{11}$/.test(cell)) initialColumns[colIndex].type = 'tc';
          else if (/^\d{1,2}[A-Z]$/i.test(cell)) initialColumns[colIndex].type = 'class';
          else if (/^[ABCD]$/i.test(cell)) initialColumns[colIndex].type = 'booklet';
          else if (/^[ABCDE]{5,}$/i.test(cell)) initialColumns[colIndex].type = 'answers';
          else if (/^[A-ZÇĞİÖŞÜ]+$/i.test(cell) && cell.length >= 2 && cell.length <= 20) {
            if (!initialColumns.some(c => c.type === 'name')) initialColumns[colIndex].type = 'name';
            else if (!initialColumns.some(c => c.type === 'surname')) initialColumns[colIndex].type = 'surname';
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
    setColumns(prev => prev.map(col => col.index === selectedColumn ? { ...col, type } : col));
    setSelectedColumn(null);
  }, [selectedColumn]);
  
  // Ders yönetimi
  const handleAddSubject = useCallback(() => {
    const totalQuestions = subjects.reduce((sum, s) => sum + s.questionCount, 0);
    setSubjects(prev => [...prev, {
      code: `DERS${prev.length + 1}`,
      name: `Ders ${prev.length + 1}`,
      questionCount: 20,
      startQuestion: totalQuestions + 1,
      color: SUBJECT_COLORS[prev.length % SUBJECT_COLORS.length]
    }]);
  }, [subjects]);
  
  const handleRemoveSubject = useCallback((index: number) => {
    setSubjects(prev => {
      const newSubjects = prev.filter((_, i) => i !== index);
      let start = 1;
      return newSubjects.map(s => {
        const updated = { ...s, startQuestion: start };
        start += s.questionCount;
        return updated;
      });
    });
  }, []);
  
  const handleUpdateSubject = useCallback((index: number, updates: Partial<SubjectDefinition>) => {
    setSubjects(prev => {
      const updated = prev.map((s, i) => i === index ? { ...s, ...updates } : s);
      let start = 1;
      return updated.map(s => {
        const result = { ...s, startQuestion: start };
        start += s.questionCount;
        return result;
      });
    });
  }, []);
  
  const handleLoadTemplate = useCallback((template: 'lgs' | 'tyt') => {
    const config = template === 'lgs' ? LGS_CONFIG : TYT_CONFIG;
    let start = 1;
    setSubjects(config.subjects.map((s, i) => {
      const subject = {
        code: s.code,
        name: s.name,
        questionCount: s.questionCount,
        startQuestion: start,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length]
      };
      start += s.questionCount;
      return subject;
    }));
  }, []);
  
  // Net hesaplama
  const handleCalculateResults = useCallback(() => {
    if (!parsedData || !answerKey) return;
    
    const studentNoCol = columns.find(c => c.type === 'student_no');
    const nameCol = columns.find(c => c.type === 'name');
    const surnameCol = columns.find(c => c.type === 'surname');
    const classCol = columns.find(c => c.type === 'class');
    const answersCol = columns.find(c => c.type === 'answers');
    
    const studentResults: StudentResult[] = parsedData.rows.map((row, idx) => {
      const studentAnswers = answersCol ? row[answersCol.index] : '';
      const calc = calculateNet(studentAnswers, answerKey, subjects);
      
      return {
        rowIndex: idx,
        studentNo: studentNoCol ? row[studentNoCol.index] : '',
        name: nameCol ? row[nameCol.index] : '',
        surname: surnameCol ? row[surnameCol.index] : '',
        class: classCol ? row[classCol.index] : '',
        answers: studentAnswers,
        ...calc
      };
    });
    
    setResults(studentResults.sort((a, b) => b.net - a.net));
    setStep('results');
  }, [parsedData, answerKey, columns, subjects]);
  
  // Validations
  const isColumnsValid = useMemo(() => {
    const hasId = columns.some(c => c.type === 'tc' || c.type === 'student_no' || c.type === 'name');
    const hasAnswers = columns.some(c => c.type === 'answers');
    return hasId && hasAnswers;
  }, [columns]);
  
  const isSubjectsValid = useMemo(() => subjects.length > 0, [subjects]);
  
  const totalQuestions = useMemo(() => subjects.reduce((sum, s) => sum + s.questionCount, 0), [subjects]);
  
  const isAnswerKeyValid = useMemo(() => {
    const cleaned = answerKey.replace(/[^ABCDEX]/gi, '');
    return cleaned.length === totalQuestions;
  }, [answerKey, totalQuestions]);
  
  // Stats
  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const avg = results.reduce((sum, r) => sum + r.net, 0) / results.length;
    return {
      average: Math.round(avg * 100) / 100,
      highest: { name: `${results[0].name} ${results[0].surname}`, net: results[0].net },
      lowest: { name: `${results[results.length - 1].name} ${results[results.length - 1].surname}`, net: results[results.length - 1].net }
    };
  }, [results]);
  
  // Subject averages
  const subjectAverages = useMemo(() => {
    if (results.length === 0) return {};
    const avgs: Record<string, number> = {};
    subjects.forEach(s => {
      const total = results.reduce((sum, r) => sum + (r.subjectNets[s.code] || 0), 0);
      avgs[s.code] = Math.round((total / results.length) * 100) / 100;
    });
    return avgs;
  }, [results, subjects]);

  // ==================== RENDER ====================
  
  // STEP 1: Upload
  if (step === 'upload') {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div
          className="w-full max-w-xl p-12 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-2xl text-center hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
          onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFileUpload(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Optik Dosyanızı Yükleyin</h3>
          <p className="text-gray-500 mb-6">Excel, CSV veya TXT</p>
          <label className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 cursor-pointer">
            <input type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            Dosya Seç
          </label>
        </div>
      </div>
    );
  }
  
  // STEP 2: Columns
  if (step === 'columns' && parsedData) {
    return (
      <div className="min-h-[600px]">
        <StepHeader step={1} total={4} title="Kolonları Eşleştir" />
        
        <div className="flex gap-6">
          {/* Table */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 border-b font-semibold text-blue-800 dark:text-blue-200">
                📊 VERİ ÖNİZLEME ({parsedData.rowCount} satır)
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-indigo-100 dark:bg-indigo-900/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-xs text-indigo-600">#</th>
                      {columns.map((col) => (
                        <th
                          key={col.index}
                          onClick={() => setSelectedColumn(col.index)}
                          className={`px-3 py-2 text-center cursor-pointer min-w-[80px] ${
                            selectedColumn === col.index ? 'bg-purple-500 text-white' :
                            col.type ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700' :
                            'text-indigo-600 hover:bg-indigo-200'
                          }`}
                        >
                          {col.letter}
                          {col.type && <div className="text-xs">{COLUMN_TYPES.find(t => t.type === col.type)?.emoji}</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-2 py-1 text-gray-400 text-xs">{idx + 1}</td>
                        {row.map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            onClick={() => setSelectedColumn(colIdx)}
                            className={`px-2 py-1 cursor-pointer ${selectedColumn === colIdx ? 'bg-purple-100' : columns[colIdx]?.type ? 'bg-emerald-50' : ''}`}
                          >
                            <span className="truncate block max-w-[100px]" title={cell}>
                              {cell.length > 12 ? cell.substring(0, 12) + '...' : cell}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Column Panel */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 border rounded-xl overflow-hidden sticky top-4">
              <div className="bg-rose-50 dark:bg-rose-900/30 px-4 py-2 border-b font-semibold text-rose-700">
                🎯 Bu Kolon Ne?
              </div>
              <div className="p-2 space-y-1">
                {COLUMN_TYPES.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleColumnTypeChange(item.type)}
                    disabled={selectedColumn === null}
                    className={`w-full text-left p-2 rounded-lg border transition-all text-sm ${
                      selectedColumn !== null && columns[selectedColumn]?.type === item.type
                        ? 'border-emerald-500 bg-emerald-50'
                        : selectedColumn !== null
                          ? 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                          : 'border-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="mr-2">{item.emoji}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className={`m-2 p-2 rounded-lg text-xs text-center ${isColumnsValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isColumnsValid ? '✅ Hazır!' : '⚠️ Kimlik + Cevap seçin'}
              </div>
            </div>
          </div>
        </div>
        
        <StepFooter onBack={onBack} onNext={() => setStep('subjects')} nextDisabled={!isColumnsValid} />
      </div>
    );
  }
  
  // STEP 3: Subjects
  if (step === 'subjects') {
    return (
      <div className="min-h-[600px]">
        <StepHeader step={2} total={4} title="Dersleri Tanımla" />
        
        <div className="mb-4 flex gap-3">
          <button onClick={() => handleLoadTemplate('lgs')} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">🎓 LGS (90 Soru)</button>
          <button onClick={() => handleLoadTemplate('tyt')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">📝 TYT (120 Soru)</button>
          <button onClick={() => setSubjects([])} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">✏️ Manuel</button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">📚 Dersler</h3>
            <button onClick={handleAddSubject} className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Ekle
            </button>
          </div>
          
          {subjects.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Şablon seçin veya ders ekleyin</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-3 h-10 rounded" style={{ backgroundColor: s.color }} />
                  <input
                    value={s.name}
                    onChange={(e) => handleUpdateSubject(idx, { name: e.target.value })}
                    className="flex-1 px-2 py-1 border rounded bg-white dark:bg-gray-800"
                    placeholder="Ders adı"
                  />
                  <input
                    type="number"
                    value={s.questionCount}
                    onChange={(e) => handleUpdateSubject(idx, { questionCount: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-800 text-center"
                    min={1}
                  />
                  <span className="text-gray-500 text-sm">soru</span>
                  <span className="text-gray-400 text-xs">({s.startQuestion}-{s.startQuestion + s.questionCount - 1})</span>
                  <button onClick={() => handleRemoveSubject(idx)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between text-sm">
                <span>{subjects.length} ders</span>
                <span className="font-bold">{totalQuestions} soru</span>
              </div>
            </div>
          )}
        </div>
        
        <StepFooter onBack={() => setStep('columns')} onNext={() => setStep('answerkey')} nextDisabled={!isSubjectsValid} />
      </div>
    );
  }
  
  // STEP 4: Answer Key
  if (step === 'answerkey') {
    const cleanedKey = answerKey.replace(/[^ABCDEX]/gi, '');
    const progress = Math.min((cleanedKey.length / totalQuestions) * 100, 100);
    
    return (
      <div className="min-h-[600px]">
        <StepHeader step={3} total={4} title="Cevap Anahtarı" />
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-lg">Cevap Anahtarını Girin</h3>
            </div>
            
            <textarea
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value.toUpperCase())}
              placeholder={`${totalQuestions} adet cevap girin (A, B, C, D, E veya X)`}
              className="w-full h-32 px-4 py-3 border rounded-xl font-mono text-lg tracking-widest bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500"
            />
            
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${cleanedKey.length === totalQuestions ? 'bg-emerald-500' : 'bg-purple-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`font-bold ${cleanedKey.length === totalQuestions ? 'text-emerald-600' : 'text-gray-600'}`}>
                {cleanedKey.length} / {totalQuestions}
              </span>
            </div>
            
            {/* Preview by subject */}
            {cleanedKey.length > 0 && (
              <div className="mt-6 space-y-3">
                {subjects.map((s, idx) => {
                  const start = s.startQuestion - 1;
                  const subjectAnswers = cleanedKey.substring(start, start + s.questionCount);
                  const filled = subjectAnswers.length;
                  
                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
                        <span className="font-medium text-sm">{s.name}</span>
                        <span className="text-xs text-gray-500">({filled}/{s.questionCount})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: s.questionCount }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                              subjectAnswers[i]
                                ? subjectAnswers[i] === 'X'
                                  ? 'bg-gray-300 text-gray-600'
                                  : 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {subjectAnswers[i] || '?'}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <StepFooter 
          onBack={() => setStep('subjects')} 
          onNext={handleCalculateResults} 
          nextDisabled={!isAnswerKeyValid}
          nextLabel="Hesapla →"
        />
      </div>
    );
  }
  
  // STEP 5: Results
  if (step === 'results' && stats) {
    return (
      <div className="min-h-[600px]">
        <StepHeader step={4} total={4} title="Sonuçlar" />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard icon={<BarChart3 />} label="Ortalama" value={stats.average.toFixed(2)} sub={`${totalQuestions} üzerinden`} color="blue" />
          <StatCard icon={<TrendingUp />} label="En Yüksek" value={stats.highest.net.toFixed(2)} sub={stats.highest.name.split(' ')[0]} color="emerald" />
          <StatCard icon={<TrendingDown />} label="En Düşük" value={stats.lowest.net.toFixed(2)} sub={stats.lowest.name.split(' ')[0]} color="amber" />
          <StatCard icon={<Users />} label="Öğrenci" value={results.length.toString()} sub="kişi" color="purple" />
        </div>
        
        {/* Subject Averages */}
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="w-5 h-5" /> Ders Bazlı Ortalamalar</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {subjects.map(s => {
              const avg = subjectAverages[s.code] || 0;
              const pct = (avg / s.questionCount) * 100;
              return (
                <div key={s.code} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-medium">{s.name.substring(0, 8)}</span>
                  </div>
                  <div className="text-xl font-bold">{avg.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{s.questionCount} soru • %{pct.toFixed(0)}</div>
                  <div className="mt-1 h-1.5 bg-gray-200 rounded-full">
                    <div className={`h-full rounded-full ${pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Student Rankings */}
        <div className="bg-white dark:bg-gray-800 border rounded-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-white font-semibold flex items-center gap-2">
            <Award className="w-5 h-5" /> Sıralama
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Öğrenci</th>
                  <th className="px-3 py-2 text-center">Sınıf</th>
                  <th className="px-3 py-2 text-center text-emerald-600">D</th>
                  <th className="px-3 py-2 text-center text-red-500">Y</th>
                  <th className="px-3 py-2 text-center text-gray-400">B</th>
                  <th className="px-3 py-2 text-right font-bold">NET</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 20).map((r, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${idx < 3 ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-3 py-2">
                      {idx < 3 ? (
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-300' : 'bg-amber-600 text-white'}`}>{idx + 1}</span>
                      ) : <span className="text-gray-500">{idx + 1}</span>}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.name} {r.surname}</td>
                    <td className="px-3 py-2 text-center">{r.class}</td>
                    <td className="px-3 py-2 text-center text-emerald-600 font-medium">{r.correct}</td>
                    <td className="px-3 py-2 text-center text-red-500 font-medium">{r.wrong}</td>
                    <td className="px-3 py-2 text-center text-gray-400">{r.blank}</td>
                    <td className={`px-3 py-2 text-right font-bold ${r.net >= stats.average ? 'text-emerald-600' : 'text-amber-600'}`}>{r.net.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <StepFooter 
          onBack={() => setStep('answerkey')} 
          onNext={() => onComplete({ students: results, subjects, stats })}
          nextLabel="Kaydet ✓"
        />
      </div>
    );
  }
  
  return null;
}

// ==================== HELPER COMPONENTS ====================

function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> AkademiHub - Gelişmiş Optik Okuma
        </h2>
      </div>
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`px-4 py-2 rounded-full text-sm font-medium ${i + 1 === step ? 'bg-purple-600 text-white' : i + 1 < step ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {i + 1 < step ? '✓' : i + 1} {['Kolonlar', 'Dersler', 'Cevaplar', 'Sonuçlar'][i]}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepFooter({ onBack, onNext, nextDisabled, nextLabel = 'Devam →' }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string }) {
  return (
    <div className="mt-6 flex justify-between border-t pt-4">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Geri</button>
      <button onClick={onNext} disabled={nextDisabled} className={`px-6 py-2 rounded-xl font-semibold ${nextDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'}`}>
        {nextLabel}
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-pink-600'
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white`}>
      <div className="flex items-center gap-2 mb-1 opacity-90">{icon}<span className="text-sm">{label}</span></div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{sub}</div>
    </div>
  );
}

export default OpticalImportWizard;
