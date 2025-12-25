'use client';

/**
 * AkademiHub Sınav Sihirbazı
 * 3 Adımlı Kolay Sınav Oluşturma
 * 
 * "İlkokul çocuğu bile kullanabilir" sadeliğinde
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Award,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { colors } from './theme';
import {
  ExamType,
  EXAM_CONFIGS,
  ParseResult,
  EvaluationResult,
} from '../core/types';
import { parseOpticalTxt, detectTemplate } from '../core/parser';
import { evaluateExam } from '../core/evaluator';
import { validateParsedData } from '../core/validators';

// ============================================
// 📋 TİPLER
// ============================================

interface ExamInfo {
  name: string;
  date: string;
  academicYear: string;
  term: string;
  type: ExamType;
}

interface AnswerKeyData {
  answers: string;
  subjects: { id: string; name: string; questionCount: number }[];
  booklet: 'A' | 'B' | 'C' | 'D';
}

interface WizardState {
  step: 1 | 2 | 3;
  examInfo: ExamInfo;
  answerKey: AnswerKeyData | null;
  parseResult: ParseResult | null;
  evaluationResult: EvaluationResult | null;
  isProcessing: boolean;
  error: string | null;
}

// ============================================
// 🎨 STİLLER
// ============================================

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
  },
  
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
    gap: '1rem',
  },
  
  stepDot: (isActive: boolean, isComplete: boolean) => ({
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '1.125rem',
    transition: 'all 0.3s ease',
    backgroundColor: isComplete ? colors.primary[500] : isActive ? colors.primary[100] : colors.secondary[100],
    color: isComplete ? 'white' : isActive ? colors.primary[600] : colors.secondary[500],
    border: isActive ? `3px solid ${colors.primary[500]}` : 'none',
  }),
  
  stepLine: (isComplete: boolean) => ({
    width: '80px',
    height: '4px',
    backgroundColor: isComplete ? colors.primary[500] : colors.secondary[200],
    alignSelf: 'center',
    borderRadius: '2px',
  }),
  
  card: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  
  subtitle: {
    fontSize: '1rem',
    color: colors.text.secondary,
    marginBottom: '2rem',
  },
  
  formGroup: {
    marginBottom: '1.5rem',
  },
  
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: '0.5rem',
  },
  
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: `2px solid ${colors.secondary[200]}`,
    borderRadius: '0.75rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  
  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: `2px solid ${colors.secondary[200]}`,
    borderRadius: '0.75rem',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  
  button: {
    primary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.875rem 1.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      backgroundColor: colors.primary[500],
      color: 'white',
      border: 'none',
      borderRadius: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    secondary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.875rem 1.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      backgroundColor: colors.secondary[100],
      color: colors.secondary[700],
      border: 'none',
      borderRadius: '0.75rem',
      cursor: 'pointer',
    },
  },
  
  uploadZone: {
    border: `2px dashed ${colors.primary[300]}`,
    borderRadius: '1rem',
    padding: '3rem 2rem',
    textAlign: 'center' as const,
    backgroundColor: colors.primary[50],
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  uploadZoneHover: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: colors.secondary[200],
    borderRadius: '4px',
    overflow: 'hidden',
  },
  
  progressFill: (progress: number) => ({
    width: `${progress}%`,
    height: '100%',
    backgroundColor: colors.primary[500],
    transition: 'width 0.3s ease',
  }),
  
  statCard: {
    backgroundColor: colors.background.subtle,
    borderRadius: '0.75rem',
    padding: '1.25rem',
    textAlign: 'center' as const,
  },
  
  errorBox: {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    borderRadius: '0.75rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: colors.error,
  },
};

// ============================================
// 📦 ANA BİLEŞEN
// ============================================

export function ExamWizard() {
  const [state, setState] = useState<WizardState>({
    step: 1,
    examInfo: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      academicYear: '2024-2025',
      term: '1',
      type: 'LGS',
    },
    answerKey: null,
    parseResult: null,
    evaluationResult: null,
    isProcessing: false,
    error: null,
  });

  // ========== ADIM DEĞİŞTİRME ==========
  const goToStep = (step: 1 | 2 | 3) => {
    setState(prev => ({ ...prev, step, error: null }));
  };

  const nextStep = () => {
    if (state.step < 3) {
      goToStep((state.step + 1) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      goToStep((state.step - 1) as 1 | 2 | 3);
    }
  };

  // ========== EXAM INFO GÜNCELLEME ==========
  const updateExamInfo = (field: keyof ExamInfo, value: string) => {
    setState(prev => ({
      ...prev,
      examInfo: { ...prev.examInfo, [field]: value },
    }));
  };

  // ========== CEVAP ANAHTARI YÜKLEME ==========
  const handleAnswerKeyUpload = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const text = await file.text();
      
      // Basit cevap anahtarı parse (A,B,C,D formatı)
      const answers = text
        .replace(/[\r\n,;\t\s]+/g, '')
        .toUpperCase()
        .replace(/[^ABCDE\-]/g, '');
      
      const examConfig = EXAM_CONFIGS[state.examInfo.type];
      
      setState(prev => ({
        ...prev,
        answerKey: {
          answers,
          subjects: examConfig.subjects.map(s => ({
            id: s.id,
            name: s.name,
            questionCount: s.questionCount,
          })),
          booklet: 'A',
        },
        isProcessing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Cevap anahtarı dosyası okunamadı',
        isProcessing: false,
      }));
    }
  }, [state.examInfo.type]);

  // ========== OPTİK VERİ YÜKLEME ==========
  const handleOpticalUpload = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const text = await file.text();
      
      // Template tespit et
      const template = detectTemplate(text);
      
      // Parse et
      const parseResult = parseOpticalTxt(text, template, {
        fileName: file.name,
        skipEmptyLines: true,
      });
      
      // Doğrula
      const validation = validateParsedData(parseResult.students);
      
      // Eğer cevap anahtarı varsa değerlendir
      let evaluationResult: EvaluationResult | null = null;
      
      if (state.answerKey) {
        const examConfig = EXAM_CONFIGS[state.examInfo.type];
        
        evaluationResult = evaluateExam(
          `exam-${Date.now()}`,
          parseResult.students,
          {
            examId: `exam-${Date.now()}`,
            examType: state.examInfo.type,
            booklet: state.answerKey.booklet,
            answers: state.answerKey.answers.split('').map((answer, index) => ({
              questionNo: index + 1,
              correctAnswer: answer as 'A' | 'B' | 'C' | 'D' | 'E' | '',
              subjectId: examConfig.subjects.find(
                s => index >= s.startIndex && index <= s.endIndex
              )?.id || '',
            })),
            createdAt: new Date(),
          },
          examConfig
        );
      }
      
      setState(prev => ({
        ...prev,
        parseResult,
        evaluationResult,
        isProcessing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Dosya işlenemedi',
        isProcessing: false,
      }));
    }
  }, [state.answerKey, state.examInfo.type]);

  // ========== RENDER ==========
  return (
    <div style={styles.container}>
      {/* Adım Göstergesi */}
      <StepIndicator currentStep={state.step} />
      
      {/* Adım İçeriği */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {state.step === 1 && (
            <Step1ExamInfo
              examInfo={state.examInfo}
              onChange={updateExamInfo}
              onNext={nextStep}
            />
          )}
          
          {state.step === 2 && (
            <Step2AnswerKey
              answerKey={state.answerKey}
              examType={state.examInfo.type}
              isProcessing={state.isProcessing}
              error={state.error}
              onUpload={handleAnswerKeyUpload}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {state.step === 3 && (
            <Step3DataImport
              parseResult={state.parseResult}
              evaluationResult={state.evaluationResult}
              isProcessing={state.isProcessing}
              error={state.error}
              onUpload={handleOpticalUpload}
              onPrev={prevStep}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================
// 🔢 ADIM GÖSTERGESİ
// ============================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: 'Sınav Bilgisi' },
    { number: 2, label: 'Cevap Anahtarı' },
    { number: 3, label: 'Veri Aktarımı' },
  ];
  
  return (
    <div style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div style={{ textAlign: 'center' }}>
            <div style={styles.stepDot(currentStep === step.number, currentStep > step.number)}>
              {currentStep > step.number ? (
                <CheckCircle size={24} />
              ) : (
                step.number
              )}
            </div>
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem',
              fontWeight: currentStep === step.number ? '600' : '400',
              color: currentStep === step.number ? colors.primary[600] : colors.text.secondary,
            }}>
              {step.label}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div style={styles.stepLine(currentStep > step.number)} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================
// 📝 ADIM 1: SINAV BİLGİSİ
// ============================================

function Step1ExamInfo({
  examInfo,
  onChange,
  onNext,
}: {
  examInfo: ExamInfo;
  onChange: (field: keyof ExamInfo, value: string) => void;
  onNext: () => void;
}) {
  const canProceed = examInfo.name.length >= 3;
  
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>
        <FileText size={28} color={colors.primary[500]} />
        Sınav Bilgileri
      </h2>
      <p style={styles.subtitle}>
        Sınavınız hakkında temel bilgileri girin
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Sınav Adı */}
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={styles.label}>
            <BookOpen size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Sınav Adı *
          </label>
          <input
            type="text"
            placeholder="Örn: LGS Deneme Sınavı 1"
            value={examInfo.name}
            onChange={(e) => onChange('name', e.target.value)}
            style={styles.input}
          />
        </div>
        
        {/* Sınav Tarihi */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <Calendar size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Sınav Tarihi
          </label>
          <input
            type="date"
            value={examInfo.date}
            onChange={(e) => onChange('date', e.target.value)}
            style={styles.input}
          />
        </div>
        
        {/* Sınav Tipi */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <Award size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Sınav Tipi
          </label>
          <select
            value={examInfo.type}
            onChange={(e) => onChange('type', e.target.value)}
            style={styles.select}
          >
            <option value="LGS">LGS (8. Sınıf)</option>
            <option value="TYT">TYT (Temel Yeterlilik)</option>
            <option value="AYT">AYT (Alan Yeterlilik)</option>
            <option value="DİL">YDT (Yabancı Dil)</option>
            <option value="DENEME">Kurum İçi Deneme</option>
          </select>
        </div>
        
        {/* Akademik Yıl */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Akademik Yıl</label>
          <select
            value={examInfo.academicYear}
            onChange={(e) => onChange('academicYear', e.target.value)}
            style={styles.select}
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
          </select>
        </div>
        
        {/* Dönem */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Dönem</label>
          <select
            value={examInfo.term}
            onChange={(e) => onChange('term', e.target.value)}
            style={styles.select}
          >
            <option value="1">1. Dönem</option>
            <option value="2">2. Dönem</option>
          </select>
        </div>
      </div>
      
      {/* Sınav Tipi Bilgisi */}
      <div style={{ 
        backgroundColor: colors.primary[50], 
        borderRadius: '0.75rem', 
        padding: '1rem',
        marginTop: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontWeight: '600', color: colors.primary[700], marginBottom: '0.5rem' }}>
          📊 {EXAM_CONFIGS[examInfo.type as ExamType]?.name || 'Sınav'}
        </div>
        <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Toplam {EXAM_CONFIGS[examInfo.type as ExamType]?.totalQuestions || 0} soru • 
          {' '}{EXAM_CONFIGS[examInfo.type as ExamType]?.wrongPenalty || 4} yanlış = 1 doğru
        </div>
      </div>
      
      {/* Butonlar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onNext}
          disabled={!canProceed}
          style={{
            ...styles.button.primary,
            opacity: canProceed ? 1 : 0.5,
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          Devam Et
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ============================================
// 📋 ADIM 2: CEVAP ANAHTARI
// ============================================

function Step2AnswerKey({
  answerKey,
  examType,
  isProcessing,
  error,
  onUpload,
  onNext,
  onPrev,
}: {
  answerKey: AnswerKeyData | null;
  examType: ExamType;
  isProcessing: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const examConfig = EXAM_CONFIGS[examType];
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };
  
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>
        <FileSpreadsheet size={28} color={colors.primary[500]} />
        Cevap Anahtarı
      </h2>
      <p style={styles.subtitle}>
        Doğru cevapları içeren dosyayı yükleyin veya yapıştırın
      </p>
      
      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {!answerKey ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            ...styles.uploadZone,
            ...(isDragging ? styles.uploadZoneHover : {}),
          }}
        >
          <input
            type="file"
            accept=".txt,.csv,.xlsx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="answer-key-upload"
          />
          
          {isProcessing ? (
            <Loader2 size={48} color={colors.primary[500]} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <Upload size={48} color={colors.primary[400]} style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: colors.text.primary }}>
                Cevap Anahtarını Yükle
              </div>
              <div style={{ color: colors.text.secondary, marginTop: '0.5rem' }}>
                Dosyayı sürükleyin veya{' '}
                <label htmlFor="answer-key-upload" style={{ color: colors.primary[500], cursor: 'pointer', fontWeight: '600' }}>
                  seçin
                </label>
              </div>
              <div style={{ fontSize: '0.875rem', color: colors.text.muted, marginTop: '1rem' }}>
                TXT, CSV veya Excel formatları desteklenir
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          {/* Başarı Mesajı */}
          <div style={{ 
            backgroundColor: '#DCFCE7', 
            borderRadius: '0.75rem', 
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <CheckCircle size={24} color={colors.success} />
            <span style={{ fontWeight: '600', color: '#166534' }}>
              {answerKey.answers.length} cevap yüklendi
            </span>
          </div>
          
          {/* Ders Dağılımı */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
          }}>
            {examConfig.subjects.map((subject, index) => (
              <div key={subject.id} style={styles.statCard}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: colors.primary[600],
                }}>
                  {subject.questionCount}
                </div>
                <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>
                  {subject.name}
                </div>
              </div>
            ))}
          </div>
          
          {/* Cevap Önizleme */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Cevaplar:</div>
            <div style={{ 
              fontFamily: 'monospace', 
              backgroundColor: colors.background.muted,
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              wordBreak: 'break-all',
              maxHeight: '100px',
              overflow: 'auto',
            }}>
              {answerKey.answers}
            </div>
          </div>
        </div>
      )}
      
      {/* Butonlar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button onClick={onPrev} style={styles.button.secondary}>
          <ArrowLeft size={20} />
          Geri
        </button>
        <button
          onClick={onNext}
          disabled={!answerKey}
          style={{
            ...styles.button.primary,
            opacity: answerKey ? 1 : 0.5,
            cursor: answerKey ? 'pointer' : 'not-allowed',
          }}
        >
          Devam Et
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ============================================
// 📊 ADIM 3: VERİ AKTARIMI
// ============================================

function Step3DataImport({
  parseResult,
  evaluationResult,
  isProcessing,
  error,
  onUpload,
  onPrev,
}: {
  parseResult: ParseResult | null;
  evaluationResult: EvaluationResult | null;
  isProcessing: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onPrev: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };
  
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>
        <Users size={28} color={colors.primary[500]} />
        Öğrenci Verisi Aktarımı
      </h2>
      <p style={styles.subtitle}>
        Optik okuyucudan gelen TXT dosyasını yükleyin
      </p>
      
      {error && (
        <div style={{ ...styles.errorBox, marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {!parseResult ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            ...styles.uploadZone,
            ...(isDragging ? styles.uploadZoneHover : {}),
          }}
        >
          <input
            type="file"
            accept=".txt,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="optical-upload"
          />
          
          {isProcessing ? (
            <div style={{ textAlign: 'center' }}>
              <Loader2 size={48} color={colors.primary[500]} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
              <div style={{ fontWeight: '600', color: colors.text.primary }}>İşleniyor...</div>
              <div style={{ color: colors.text.secondary, marginTop: '0.5rem' }}>
                Veriler parse ediliyor ve değerlendiriliyor
              </div>
            </div>
          ) : (
            <>
              <Upload size={48} color={colors.primary[400]} style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: colors.text.primary }}>
                Optik Veri Dosyasını Yükle
              </div>
              <div style={{ color: colors.text.secondary, marginTop: '0.5rem' }}>
                Dosyayı sürükleyin veya{' '}
                <label htmlFor="optical-upload" style={{ color: colors.primary[500], cursor: 'pointer', fontWeight: '600' }}>
                  seçin
                </label>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          {/* İşlem Sonucu */}
          <div style={{ 
            backgroundColor: parseResult.success ? '#DCFCE7' : '#FEF3C7', 
            borderRadius: '0.75rem', 
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            {parseResult.success ? (
              <CheckCircle size={24} color={colors.success} />
            ) : (
              <AlertCircle size={24} color={colors.warning} />
            )}
            <span style={{ fontWeight: '600', color: parseResult.success ? '#166534' : '#92400E' }}>
              {parseResult.successCount} öğrenci başarıyla işlendi
              {parseResult.conflictCount > 0 && ` • ${parseResult.conflictCount} çakışma`}
            </span>
          </div>
          
          {/* İstatistik Kartları */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={styles.statCard}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.primary[600] }}>
                {evaluationResult?.totalStudents || parseResult.successCount}
              </div>
              <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>Öğrenci</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.info }}>
                {evaluationResult?.averageNet.toFixed(1) || '-'}
              </div>
              <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>Ortalama Net</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.success }}>
                {evaluationResult?.highestScore.toFixed(0) || '-'}
              </div>
              <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>En Yüksek</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.warning }}>
                {parseResult.conflictCount}
              </div>
              <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>Çakışma</div>
            </div>
          </div>
          
          {/* Sonuç Tablosu Önizleme */}
          {evaluationResult && evaluationResult.results.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>İlk 5 Öğrenci:</div>
              <div style={{ 
                backgroundColor: colors.background.muted,
                borderRadius: '0.5rem',
                overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.secondary[100] }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Sıra</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Öğrenci</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>Net</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationResult.results.slice(0, 5).map((result) => (
                      <tr key={result.studentNo} style={{ borderTop: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{result.rank}</td>
                        <td style={{ padding: '0.75rem' }}>{result.name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{result.totalNet.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: colors.primary[600] }}>
                          {result.totalScore.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Kaydet Butonu */}
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem',
            backgroundColor: colors.primary[50],
            borderRadius: '0.75rem',
            textAlign: 'center',
          }}>
            <button
              style={{
                ...styles.button.primary,
                padding: '1rem 2rem',
                fontSize: '1.125rem',
              }}
            >
              <CheckCircle size={24} />
              Sınavı Kaydet ve Sonuçları Görüntüle
            </button>
          </div>
        </div>
      )}
      
      {/* Geri Butonu */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2rem' }}>
        <button onClick={onPrev} style={styles.button.secondary}>
          <ArrowLeft size={20} />
          Geri
        </button>
      </div>
    </div>
  );
}

export default ExamWizard;

