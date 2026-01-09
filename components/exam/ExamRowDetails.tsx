'use client';

// ============================================================================
// EXAM ROW DETAILS - Accordion Açıldığında Görünen Detay Bölümü
// ============================================================================

import React from 'react';
import Link from 'next/link';
import {
  Users,
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  PieChart,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { ExamExpandedDetails, BranchSummary } from '@/types/exam-list';
import { cn } from '@/lib/utils';

interface ExamRowDetailsProps {
  examId: string;
  details: ExamExpandedDetails;
}

/**
 * Branş kartı komponenti
 */
function BranchCard({ branch }: { branch: BranchSummary }) {
  const successColor = branch.successRate >= 70
    ? 'text-emerald-600'
    : branch.successRate >= 50
    ? 'text-amber-600'
    : 'text-red-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800 text-sm">{branch.branchName}</span>
        <span className="text-xs text-gray-400">{branch.questionCount} soru</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-500 block">Ort. Net</span>
          <span className="font-bold text-gray-900">{branch.averageNet.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">D/Y</span>
          <span className="font-medium">
            <span className="text-emerald-600">{branch.averageCorrect.toFixed(0)}</span>
            /
            <span className="text-red-500">{branch.averageWrong.toFixed(0)}</span>
          </span>
        </div>
        <div>
          <span className="text-gray-500 block">Başarı</span>
          <span className={cn('font-bold', successColor)}>%{branch.successRate.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * İstatistik kartı
 */
function StatCard({ label, value, icon: Icon, color = 'text-gray-600' }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3">
      <div className={cn('p-2 rounded-lg bg-gray-50', color)}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function ExamRowDetails({ examId, details }: ExamRowDetailsProps) {
  const { participation, stats, branches, aiComment } = details;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 border-t border-gray-200 p-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Kolon: Katılım Dağılımı + İstatistikler */}
        <div className="space-y-4">
          {/* Katılım Dağılımı */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              Katılım Dağılımı
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Toplam Katılımcı</span>
                <span className="font-bold text-gray-900">{participation.totalParticipants}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Asil Öğrenci</span>
                <span className="font-medium text-emerald-600">{participation.institutionCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Misafir Öğrenci</span>
                <span className="font-medium text-blue-600">{participation.guestCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Katılmayan</span>
                <span className="font-medium text-red-500">{participation.absentCount}</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Eşleşen</span>
                  <span className="font-medium text-emerald-600">{participation.matchedCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Eşleşmeyen</span>
                  <span className="font-medium text-amber-600">{participation.unmatchedCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-500" />
              İstatistikler
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Ortalama Net" value={stats.averageNet.toFixed(1)} icon={TrendingUp} color="text-emerald-500" />
              <StatCard label="Std. Sapma" value={stats.standardDeviation.toFixed(2)} icon={PieChart} color="text-blue-500" />
              <StatCard label="Max Net" value={stats.maxNet.toFixed(1)} icon={TrendingUp} color="text-purple-500" />
              <StatCard label="Homojenlik" value={`%${stats.homogeneityRate.toFixed(0)}`} icon={BarChart3} color="text-amber-500" />
            </div>
          </div>
        </div>

        {/* Orta Kolon: Branş Özeti */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 h-full">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" />
              Branş Özeti
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <BranchCard key={branch.branchCode} branch={branch} />
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">Branş verisi yok</p>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: AI Yorum + Aksiyonlar */}
        <div className="space-y-4">
          {/* AI Yorum */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4">
            <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              AI Analiz Yorumu
            </h4>
            <p className="text-sm text-purple-800 leading-relaxed">
              {aiComment || 'Bu sınavda öğrencilerin genel performansı ortalamanın üzerinde. Matematik ve Fen bölümlerinde zorlanma görülmektedir. Özellikle 8-B sınıfı dikkat gerektirmektedir.'}
            </p>
          </div>

          {/* Hızlı Aksiyonlar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Hızlı Aksiyonlar</h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/admin/spectra/sinavlar/${examId}`}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <BarChart3 size={16} />
                Dashboard
              </Link>
              <Link
                href={`/admin/spectra/sinavlar/${examId}/ogrenciler`}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Users size={16} />
                Öğrenciler
              </Link>
              <button
                onClick={() => alert('PDF Karne - Yakında!')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <FileText size={16} />
                PDF Karne
              </button>
              <button
                onClick={() => alert('AI Analiz - Yakında!')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Brain size={16} />
                AI Analiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamRowDetails;
