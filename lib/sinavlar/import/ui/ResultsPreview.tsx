/**
 * ============================================
 * AkademiHub - Sonuç Önizleme Ekranı
 * ============================================
 * 
 * Import sonrası anlık net hesaplama ve istatistikler
 */

'use client';

import React, { useMemo } from 'react';
import { CheckCircle, TrendingUp, TrendingDown, Users, Award, Target, BarChart3 } from 'lucide-react';
import { ExamTypeConfig, SubjectCode } from '../templates/examTypes';
import { QuestionAnswer, StudentAnswerAnalysis } from '../answerKey/types';
import { calculateClassNets, calculateClassStats } from '../answerKey/netCalculator';

interface ParsedStudent {
  id: string;
  name: string;
  studentNo: string;
  class: string;
  answers: string;
}

interface ResultsPreviewProps {
  examConfig: ExamTypeConfig;
  answerKey: QuestionAnswer[];
  students: ParsedStudent[];
  onComplete: () => void;
  onBack: () => void;
}

export function ResultsPreview({
  examConfig,
  answerKey,
  students,
  onComplete,
  onBack
}: ResultsPreviewProps) {
  // Net hesapla
  const analyses = useMemo(() => {
    return calculateClassNets(
      students.map(s => ({ id: s.id, name: s.name, answers: s.answers })),
      answerKey,
      examConfig
    );
  }, [students, answerKey, examConfig]);
  
  // Sınıf istatistikleri
  const stats = useMemo(() => {
    return calculateClassStats(analyses);
  }, [analyses]);
  
  // Sıralı liste
  const sortedAnalyses = useMemo(() => {
    return [...analyses].sort((a, b) => b.results.net - a.results.net);
  }, [analyses]);
  
  return (
    <div className="min-h-[500px]">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          📊 Sınav Sonuçları Hazır!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {examConfig.emoji} {examConfig.name} • {students.length} öğrenci
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Ortalama */}
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Sınıf Ortalaması"
          value={stats.average.toFixed(2)}
          subValue={`${examConfig.totalQuestions} üzerinden`}
          color="blue"
        />
        
        {/* En Yüksek */}
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="En Yüksek"
          value={stats.highest.net.toFixed(2)}
          subValue={stats.highest.name.split(' ')[0]}
          color="emerald"
        />
        
        {/* En Düşük */}
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="En Düşük"
          value={stats.lowest.net.toFixed(2)}
          subValue={stats.lowest.name.split(' ')[0]}
          color="amber"
        />
        
        {/* Öğrenci Sayısı */}
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Toplam"
          value={students.length.toString()}
          subValue="öğrenci"
          color="purple"
        />
      </div>
      
      {/* Ders Bazlı Ortalamalar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Ders Bazlı Ortalamalar
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {examConfig.subjects.map(subject => {
            const avg = stats.subjectAverages[subject.code] || 0;
            const percentage = (avg / subject.questionCount) * 100;
            
            return (
              <div 
                key={subject.code}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{subject.emoji}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {subject.shortName}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {avg.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  {subject.questionCount} soru • %{percentage.toFixed(0)}
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      percentage >= 70 ? 'bg-emerald-500' :
                      percentage >= 50 ? 'bg-blue-500' :
                      percentage >= 30 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Öğrenci Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white">
          <h3 className="font-semibold flex items-center gap-2">
            <Award className="w-5 h-5" />
            Sıralama ({sortedAnalyses.length} öğrenci)
          </h3>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Öğrenci</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">D</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Y</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">B</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">NET</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedAnalyses.slice(0, 20).map((analysis, idx) => (
                <tr 
                  key={analysis.studentId}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    idx < 3 ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-2">
                    {idx < 3 ? (
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-amber-600 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {analysis.studentName}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="text-emerald-600 font-medium">{analysis.results.correct}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="text-red-500 font-medium">{analysis.results.wrong}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="text-gray-400">{analysis.results.blank}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={`font-bold ${
                      analysis.results.net >= stats.average 
                        ? 'text-emerald-600' 
                        : 'text-amber-600'
                    }`}>
                      {analysis.results.net.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedAnalyses.length > 20 && (
            <div className="p-3 text-center text-gray-500 text-sm">
              ... ve {sortedAnalyses.length - 20} öğrenci daha
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Geri
        </button>
        
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg transition-all"
        >
          <CheckCircle className="w-5 h-5" />
          Kaydet ve Tamamla
        </button>
      </div>
    </div>
  );
}

// ==================== STAT CARD ====================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-pink-600'
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 text-white`}>
      <div className="flex items-center gap-2 mb-2 opacity-90">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{subValue}</div>
    </div>
  );
}

export default ResultsPreview;

