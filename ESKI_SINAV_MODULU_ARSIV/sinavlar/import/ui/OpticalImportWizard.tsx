/**
 * ============================================
 * AkademiHub - Gelişmiş Optik Okuma Sistemi v4.0
 * ============================================
 * 
 * KARAKTER BAZLI ALAN EŞLEŞTİRME SİSTEMİ
 * Fixed-Width Character Mapper
 * 
 * ADIMLAR:
 * 1. Dosya Yükle
 * 2. Karakter Alanlarını Belirle (Fixed Width)
 * 3. Dersleri Tanımla
 * 4. Cevap Anahtarı Gir
 * 5. Sonuçları Gör
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Upload, Plus, Trash2, TrendingUp, TrendingDown, Users, Award, 
  BarChart3, Calculator, Target, Sparkles, CheckCircle, FileText
} from 'lucide-react';
import { FixedWidthMapper } from './FixedWidthMapper';
import { ExamTypeConfig, LGS_CONFIG, TYT_CONFIG } from '../templates/examTypes';
import { correctOCRErrors } from '../txt/ocrCorrection';

// ==================== TYPES ====================

type FieldType = 'ogrenci_no' | 'tc' | 'ad' | 'soyad' | 'sinif' | 'kitapcik' | 'cevaplar' | 'atla';

interface FixedWidthField {
  id: string;
  type: FieldType;
  start: number;
  end: number;
  color: string;
}

interface ParsedStudent {
  ogrenciNo?: string;
  tc?: string;
  ad?: string;
  soyad?: string;
  sinif?: string;
  kitapcik?: string;
  cevaplar?: string;
}

interface SubjectDefinition {
  code: string;
  name: string;
  questionCount: number;
  startQuestion: number;
  color: string;
}

interface StudentResult {
  rowIndex: number;
  studentNo: string;
  name: string;
  class: string;
  answers: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  subjectNets: Record<string, number>;
}

type WizardStep = 'upload' | 'mapping' | 'subjects' | 'answerkey' | 'results';

// ==================== CONSTANTS ====================

const SUBJECT_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', 
  '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#0EA5E9'
];

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
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [fields, setFields] = useState<FixedWidthField[]>([]);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [subjects, setSubjects] = useState<SubjectDefinition[]>([]);
  const [answerKey, setAnswerKey] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);
  
  // Dosya yükleme
  const handleFileUpload = useCallback(async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
    
    // OCR düzeltmesi uygula
    const correctedLines = lines.map(line => correctOCRErrors(line));
    setRawLines(correctedLines);
    setStep('mapping');
  }, []);
  
  // Mapping tamamlandı
  const handleMappingComplete = useCallback((newFields: FixedWidthField[], students: ParsedStudent[]) => {
    setFields(newFields);
    setParsedStudents(students);
    setStep('subjects');
  }, []);
  
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
    if (!answerKey) return;
    
    const studentResults: StudentResult[] = parsedStudents.map((student, idx) => {
      const studentAnswers = student.cevaplar || '';
      const calc = calculateNet(studentAnswers, answerKey, subjects);
      
      return {
        rowIndex: idx,
        studentNo: student.ogrenciNo || student.tc || '',
        name: `${student.ad || ''} ${student.soyad || ''}`.trim(),
        class: student.sinif || '',
        answers: studentAnswers,
        ...calc
      };
    });
    
    setResults(studentResults.sort((a, b) => b.net - a.net));
    setStep('results');
  }, [parsedStudents, answerKey, subjects]);
  
  // Validations
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
      highest: { name: results[0].name, net: results[0].net },
      lowest: { name: results[results.length - 1].name, net: results[results.length - 1].net }
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
      <div className="min-h-[500px]">
        <StepIndicator current={1} />
        
        <div className="flex items-center justify-center mt-8">
          <div
            className="w-full max-w-xl p-12 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl text-center hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer"
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFileUpload(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Optik Dosyanızı Yükleyin</h3>
            <p className="text-gray-500 mb-6">TXT, CSV veya Excel dosyası</p>
            <label className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              Dosya Seç
            </label>
          </div>
        </div>
      </div>
    );
  }
  
  // STEP 2: Fixed Width Mapping
  if (step === 'mapping') {
    return (
      <div className="min-h-[600px]">
        <StepIndicator current={2} />
        <FixedWidthMapper 
          rawLines={rawLines}
          onComplete={handleMappingComplete}
          onBack={() => setStep('upload')}
        />
      </div>
    );
  }
  
  // STEP 3: Subjects
  if (step === 'subjects') {
    return (
      <div className="min-h-[600px]">
        <StepIndicator current={3} />
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" /> Dersleri Tanımla
          </h2>
          <p className="text-indigo-100 text-sm">
            {parsedStudents.length} öğrenci bulundu • Şimdi ders yapısını belirleyin
          </p>
        </div>
        
        <div className="mb-4 flex gap-3">
          <button onClick={() => handleLoadTemplate('lgs')} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium">🎓 LGS (90 Soru)</button>
          <button onClick={() => handleLoadTemplate('tyt')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium">📝 TYT (120 Soru)</button>
          <button onClick={() => setSubjects([])} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">✏️ Manuel</button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">📚 Dersler</h3>
            <button onClick={handleAddSubject} className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200">
              <Plus className="w-4 h-4" /> Ekle
            </button>
          </div>
          
          {subjects.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Şablon seçin veya ders ekleyin</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-3 h-12 rounded" style={{ backgroundColor: s.color }} />
                  <input
                    value={s.name}
                    onChange={(e) => handleUpdateSubject(idx, { name: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                    placeholder="Ders adı"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={s.questionCount}
                      onChange={(e) => handleUpdateSubject(idx, { questionCount: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-center"
                      min={1}
                    />
                    <span className="text-gray-500">soru</span>
                  </div>
                  <span className="text-gray-400 text-sm w-20">({s.startQuestion}-{s.startQuestion + s.questionCount - 1})</span>
                  <button onClick={() => handleRemoveSubject(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="pt-3 border-t flex justify-between text-sm">
                <span className="text-gray-600">{subjects.length} ders</span>
                <span className="font-bold text-indigo-600">{totalQuestions} soru</span>
              </div>
            </div>
          )}
        </div>
        
        <StepFooter onBack={() => setStep('mapping')} onNext={() => setStep('answerkey')} nextDisabled={!isSubjectsValid} />
      </div>
    );
  }
  
  // STEP 4: Answer Key
  if (step === 'answerkey') {
    const cleanedKey = answerKey.replace(/[^ABCDEX]/gi, '');
    const progress = Math.min((cleanedKey.length / totalQuestions) * 100, 100);
    
    return (
      <div className="min-h-[600px]">
        <StepIndicator current={4} />
        
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Cevap Anahtarı
          </h2>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border rounded-xl p-6 mb-4">
            <textarea
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value.toUpperCase())}
              placeholder={`${totalQuestions} adet cevap girin (A, B, C, D, E veya X = iptal)`}
              className="w-full h-32 px-4 py-3 border-2 rounded-xl font-mono text-lg tracking-widest bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${cleanedKey.length === totalQuestions ? 'bg-emerald-500' : 'bg-purple-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`font-bold text-lg ${cleanedKey.length === totalQuestions ? 'text-emerald-600' : 'text-gray-600'}`}>
                {cleanedKey.length} / {totalQuestions}
              </span>
            </div>
            
            {/* Ders bazlı önizleme */}
            {cleanedKey.length > 0 && (
              <div className="mt-6 space-y-4">
                {subjects.map((s, idx) => {
                  const start = s.startQuestion - 1;
                  const subjectAnswers = cleanedKey.substring(start, start + s.questionCount);
                  const filled = subjectAnswers.length;
                  
                  return (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: s.color }} />
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-sm text-gray-500">({filled}/{s.questionCount})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: s.questionCount }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold ${
                              subjectAnswers[i]
                                ? subjectAnswers[i] === 'X'
                                  ? 'bg-gray-300 text-gray-600'
                                  : 'text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                            style={subjectAnswers[i] && subjectAnswers[i] !== 'X' ? { backgroundColor: s.color } : undefined}
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
        <StepIndicator current={5} />
        
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5" /> Sonuçlar
          </h2>
          <p className="text-emerald-100 text-sm">{results.length} öğrenci değerlendirildi</p>
        </div>
        
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
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-medium truncate">{s.name}</span>
                  </div>
                  <div className="text-2xl font-bold">{avg.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{s.questionCount} soru • %{pct.toFixed(0)}</div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full">
                    <div className={`h-full rounded-full ${pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Student Rankings */}
        <div className="bg-white dark:bg-gray-800 border rounded-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white font-semibold flex items-center gap-2">
            <Award className="w-5 h-5" /> Sıralama
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-12">#</th>
                  <th className="px-3 py-2 text-left">Öğrenci</th>
                  <th className="px-3 py-2 text-center">Sınıf</th>
                  <th className="px-3 py-2 text-center text-emerald-600">D</th>
                  <th className="px-3 py-2 text-center text-red-500">Y</th>
                  <th className="px-3 py-2 text-center text-gray-400">B</th>
                  <th className="px-3 py-2 text-right font-bold">NET</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${idx < 3 ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-3 py-2">
                      {idx < 3 ? (
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-amber-600 text-white'}`}>{idx + 1}</span>
                      ) : <span className="text-gray-500 ml-2">{idx + 1}</span>}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.name || r.studentNo}</td>
                    <td className="px-3 py-2 text-center">{r.class}</td>
                    <td className="px-3 py-2 text-center text-emerald-600 font-medium">{r.correct}</td>
                    <td className="px-3 py-2 text-center text-red-500 font-medium">{r.wrong}</td>
                    <td className="px-3 py-2 text-center text-gray-400">{r.blank}</td>
                    <td className={`px-3 py-2 text-right font-bold text-lg ${r.net >= stats.average ? 'text-emerald-600' : 'text-amber-600'}`}>{r.net.toFixed(2)}</td>
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

function StepIndicator({ current }: { current: number }) {
  const steps = ['Dosya', 'Alanlar', 'Dersler', 'Cevaplar', 'Sonuç'];
  
  return (
    <div className="flex justify-center gap-2 mb-6">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isComplete = stepNum < current;
        
        return (
          <div 
            key={i}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${
              isActive ? 'bg-emerald-600 text-white' : 
              isComplete ? 'bg-emerald-100 text-emerald-700' : 
              'bg-gray-100 text-gray-500'
            }`}
          >
            {isComplete ? <CheckCircle className="w-4 h-4" /> : stepNum}
            <span className="hidden sm:inline">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StepFooter({ onBack, onNext, nextDisabled, nextLabel = 'Devam →' }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string }) {
  return (
    <div className="mt-6 flex justify-between border-t pt-4">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Geri</button>
      <button 
        onClick={onNext} 
        disabled={nextDisabled} 
        className={`px-6 py-2 rounded-xl font-semibold ${nextDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'}`}
      >
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
