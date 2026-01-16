'use client';

// ============================================================================
// EXAM HEADER SUMMARY - PDF Benzeri Üst Başlık
// Sınav adı, tarih, kurum, genel katılım bilgilerini gösterir
// ============================================================================

import React from 'react';
import { Calendar, Building2, Users, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExamSummary } from '@/lib/spectra/types';

interface ExamHeaderSummaryProps {
  summary: ExamSummary | null;
  isLoading?: boolean;
}

export function ExamHeaderSummary({ summary, isLoading }: ExamHeaderSummaryProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-white/20 rounded w-1/3 mb-3" />
        <div className="h-4 bg-white/20 rounded w-1/2 mb-6" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const { exam, organization, participantCount, resultsCount, statistics } = summary;

  return (
    <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl overflow-hidden">
      {/* Main Header */}
      <div className="p-6 text-white">
        {/* Title Row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-1">
              {exam.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(exam.exam_date).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-bold">
                {exam.exam_type}
              </span>
              {exam.total_questions && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {exam.total_questions} soru
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold',
            exam.status === 'active' ? 'bg-emerald-400/30 text-emerald-100' :
            exam.status === 'ready' ? 'bg-blue-400/30 text-blue-100' :
            exam.status === 'draft' ? 'bg-amber-400/30 text-amber-100' :
            'bg-gray-400/30 text-gray-100'
          )}>
            {exam.status === 'active' ? 'Aktif' :
             exam.status === 'ready' ? 'Hazır' :
             exam.status === 'draft' ? 'Taslak' : exam.status}
          </div>
        </div>

        {/* Organization Row */}
        <div className="flex items-center gap-2 mt-3 text-white/70">
          <Building2 className="w-4 h-4" />
          <span className="font-medium">Kurum:</span>
          <span>{organization.name}</span>
        </div>

        {/* Participant Count */}
        <div className="flex items-center gap-2 mt-1 text-white/70">
          <Users className="w-4 h-4" />
          <span className="font-medium">Genel Katılım:</span>
          <span className="text-white font-bold">{participantCount}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-black/10 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Katılımcı */}
          <StatBox
            icon={<Users className="w-5 h-5" />}
            label="Katılımcı"
            value={participantCount}
            color="white"
          />
          
          {/* Sonuç */}
          <StatBox
            icon={<FileText className="w-5 h-5" />}
            label="Sonuç"
            value={resultsCount}
            color="white"
          />
          
          {/* Ortalama Net */}
          <StatBox
            icon={<BarChart3 className="w-5 h-5" />}
            label="Ort. Net"
            value={statistics?.averageNet?.toFixed(1) || '—'}
            color="white"
          />
          
          {/* En Yüksek */}
          <StatBox
            icon={<TrendingUp className="w-5 h-5" />}
            label="En Yüksek"
            value={statistics?.maxNet?.toFixed(1) || '—'}
            color="white"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

function StatBox({ icon, label, value, color = 'white' }: StatBoxProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/80">
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/60">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
