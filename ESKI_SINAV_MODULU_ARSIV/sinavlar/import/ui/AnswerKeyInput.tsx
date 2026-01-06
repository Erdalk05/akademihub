/**
 * ============================================
 * AkademiHub - Cevap Anahtarı Giriş Bileşeni
 * ============================================
 * 
 * Öğretmenin cevap anahtarını girmesi için UI
 * - Manuel giriş (ABCD...)
 * - Excel yükleme
 * - Görsel önizleme
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircle, AlertCircle, Upload, Keyboard, FileSpreadsheet } from 'lucide-react';
import { ExamTypeConfig } from '../templates/examTypes';
import { QuestionAnswer, AnswerKeyInputMode } from '../answerKey/types';
import { parseAnswerKeyString, validateAnswerKey } from '../answerKey/netCalculator';

interface AnswerKeyInputProps {
  examConfig: ExamTypeConfig;
  onAnswerKeyComplete: (answers: QuestionAnswer[]) => void;
  onBack: () => void;
}

export function AnswerKeyInput({
  examConfig,
  onAnswerKeyComplete,
  onBack
}: AnswerKeyInputProps) {
  const [mode, setMode] = useState<AnswerKeyInputMode>('manual');
  const [answerText, setAnswerText] = useState('');
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Cevap stringini parse et
  const handleAnswerChange = useCallback((text: string) => {
    setAnswerText(text);
    
    if (text.length > 0) {
      const parsed = parseAnswerKeyString(text, examConfig);
      setAnswers(parsed);
      
      const validation = validateAnswerKey(parsed, examConfig);
      setErrors(validation.errors);
    } else {
      setAnswers([]);
      setErrors([]);
    }
  }, [examConfig]);
  
  // Geçerli mi?
  const isValid = useMemo(() => {
    return answers.length === examConfig.totalQuestions && errors.length === 0;
  }, [answers, examConfig, errors]);
  
  // Ders bazlı cevapları grupla
  const groupedAnswers = useMemo(() => {
    const groups: { subject: typeof examConfig.subjects[0]; answers: QuestionAnswer[] }[] = [];
    
    for (const subject of examConfig.subjects) {
      const subjectAnswers = answers.filter(
        a => a.questionNumber >= subject.startQuestion && a.questionNumber <= subject.endQuestion
      );
      groups.push({ subject, answers: subjectAnswers });
    }
    
    return groups;
  }, [answers, examConfig]);
  
  // Tamamla
  const handleComplete = useCallback(() => {
    if (isValid) {
      onAnswerKeyComplete(answers);
    }
  }, [isValid, answers, onAnswerKeyComplete]);
  
  return (
    <div className="min-h-[500px]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          🔑 Cevap Anahtarı
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {examConfig.emoji} {examConfig.name} - {examConfig.totalQuestions} soru
        </p>
      </div>
      
      {/* Mode Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Manuel Giriş
        </button>
        <button
          onClick={() => setMode('excel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === 'excel'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel Yükle
        </button>
      </div>
      
      {/* Manual Input */}
      {mode === 'manual' && (
        <div className="max-w-3xl mx-auto">
          {/* Input Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cevapları yazın (örn: ABCDABCDABCD...)
            </label>
            <textarea
              value={answerText}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={`${examConfig.totalQuestions} adet cevap girin (A, B, C, D, E veya X)`}
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         font-mono text-lg tracking-widest"
            />
          </div>
          
          {/* Progress */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className={`font-medium ${
              answers.length === examConfig.totalQuestions 
                ? 'text-emerald-600' 
                : 'text-gray-500'
            }`}>
              {answers.length} / {examConfig.totalQuestions} soru
            </span>
            
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  answers.length === examConfig.totalQuestions 
                    ? 'bg-emerald-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${(answers.length / examConfig.totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              {errors.map((error, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              ))}
            </div>
          )}
          
          {/* Preview */}
          {answers.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📋 Önizleme
              </h3>
              
              <div className="space-y-4">
                {groupedAnswers.map(({ subject, answers: subjectAnswers }) => (
                  <div key={subject.code}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{subject.emoji}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {subject.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({subject.startQuestion}-{subject.endQuestion})
                      </span>
                      <span className={`text-sm font-medium ${
                        subjectAnswers.length === subject.questionCount
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}>
                        {subjectAnswers.length}/{subject.questionCount}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {subjectAnswers.map((answer) => (
                        <span
                          key={answer.questionNumber}
                          className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold ${
                            answer.correctAnswer === 'X'
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          }`}
                          title={`Soru ${answer.questionNumber}`}
                        >
                          {answer.correctAnswer}
                        </span>
                      ))}
                      
                      {/* Eksik sorular */}
                      {Array.from({ length: subject.questionCount - subjectAnswers.length }).map((_, idx) => (
                        <span
                          key={`empty-${idx}`}
                          className="w-7 h-7 flex items-center justify-center rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-400"
                        >
                          ?
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Excel Upload */}
      {mode === 'excel' && (
        <div className="max-w-xl mx-auto">
          <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excel Dosyası Yükle
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              İlk sütun soru numarası, ikinci sütun cevap olmalı
            </p>
            
            <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  // TODO: Excel parse
                  alert('Excel yükleme yakında eklenecek');
                }}
              />
              Dosya Seç
            </label>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>İpucu:</strong> Manuel giriş daha hızlı! 
              Sadece ABCDABCD... şeklinde yazmanız yeterli.
            </p>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Geri
        </button>
        
        <button
          onClick={handleComplete}
          disabled={!isValid}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
            isValid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isValid && <CheckCircle className="w-5 h-5" />}
          Devam Et →
        </button>
      </div>
    </div>
  );
}

export default AnswerKeyInput;

