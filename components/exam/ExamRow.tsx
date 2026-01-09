'use client';

// ============================================================================
// EXAM ROW - Accordion Destekli Sınav Satırı
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { ExamListItem, ExamExpandedDetails } from '@/types/exam-list';
import { RISK_CONFIG, ANALYSIS_STATUS_CONFIG, EXAM_TYPE_CONFIG } from '@/types/exam-list';
import { ExamRowDetails } from './ExamRowDetails';
import { cn } from '@/lib/utils';

interface ExamRowProps {
  exam: ExamListItem;
  index: number;
  onLoadDetails?: (examId: string) => Promise<ExamExpandedDetails>;
}

/**
 * Risk durumu badge'i
 */
function RiskBadge({ status }: { status: ExamListItem['riskStatus'] }) {
  const config = RISK_CONFIG[status];
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-semibold',
      config.bgColor,
      config.color
    )}>
      {config.text}
    </span>
  );
}

/**
 * Analiz durumu badge'i
 */
function AnalysisStatusBadge({ status }: { status: ExamListItem['analysisStatus'] }) {
  const config = ANALYSIS_STATUS_CONFIG[status];
  const IconComponent = {
    Clock,
    Loader2,
    CheckCircle2,
    AlertCircle,
  }[config.icon] || Clock;

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
      config.bgColor,
      config.color
    )}>
      <IconComponent size={12} className={status === 'processing' ? 'animate-spin' : ''} />
      {config.text}
    </span>
  );
}

/**
 * Sınav türü badge'i
 */
function ExamTypeBadge({ type }: { type: ExamListItem['examType'] }) {
  const config = EXAM_TYPE_CONFIG[type] || EXAM_TYPE_CONFIG.DENEME;
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-semibold',
      config.bgColor,
      config.color
    )}>
      {type}
    </span>
  );
}

export function ExamRow({ exam, index, onLoadDetails }: ExamRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<ExamExpandedDetails | null>(null);

  // Satıra tıklandığında accordion aç/kapat
  const handleToggle = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);

    // Detayları yükle (eğer henüz yüklenmemişse)
    if (!details && onLoadDetails) {
      setIsLoading(true);
      try {
        const loadedDetails = await onLoadDetails(exam.id);
        setDetails(loadedDetails);
      } catch (error) {
        console.error('Detay yükleme hatası:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isExpanded, details, onLoadDetails, exam.id]);

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={cn(
      'border border-gray-200 rounded-xl overflow-hidden transition-all',
      isExpanded ? 'shadow-md ring-1 ring-emerald-200' : 'hover:shadow-sm hover:border-gray-300'
    )}>
      {/* Ana Satır */}
      <div
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors',
          isExpanded ? 'bg-emerald-50' : 'bg-white hover:bg-gray-50'
        )}
      >
        {/* Sıra No */}
        <div className="w-8 text-center text-sm font-medium text-gray-400">
          {index + 1}
        </div>

        {/* Expand/Collapse Icon */}
        <div className="w-6">
          {isExpanded ? (
            <ChevronDown size={20} className="text-emerald-600" />
          ) : (
            <ChevronRight size={20} className="text-gray-400" />
          )}
        </div>

        {/* Sınav Adı + Tür */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{exam.name}</h3>
            <ExamTypeBadge type={exam.examType} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(exam.examDate)}
            </span>
            {exam.gradeLevel && (
              <span className="text-gray-400">{exam.gradeLevel}. Sınıf</span>
            )}
          </div>
        </div>

        {/* Katılımcılar */}
        <div className="hidden sm:flex flex-col items-center w-20">
          <div className="flex items-center gap-1 text-gray-700">
            <Users size={14} />
            <span className="font-bold">{exam.totalParticipants}</span>
          </div>
          <span className="text-xs text-gray-400">Toplam</span>
        </div>

        {/* Asil / Misafir */}
        <div className="hidden md:flex flex-col items-center w-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-0.5 text-emerald-600">
              <UserCheck size={12} />
              {exam.institutionCount}
            </span>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-0.5 text-blue-600">
              <UserX size={12} />
              {exam.guestCount}
            </span>
          </div>
          <span className="text-xs text-gray-400">Asil/Misafir</span>
        </div>

        {/* Ortalama Net */}
        <div className="hidden sm:flex flex-col items-center w-20">
          <div className="flex items-center gap-1 text-gray-700">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="font-bold">{exam.averageNet.toFixed(1)}</span>
          </div>
          <span className="text-xs text-gray-400">Ort. Net</span>
        </div>

        {/* Max Net */}
        <div className="hidden lg:flex flex-col items-center w-16">
          <div className="flex items-center gap-1 text-gray-700">
            <Trophy size={14} className="text-amber-500" />
            <span className="font-bold">{exam.maxNet.toFixed(1)}</span>
          </div>
          <span className="text-xs text-gray-400">Max</span>
        </div>

        {/* Risk Durumu */}
        <div className="hidden lg:flex flex-col items-center w-20">
          <RiskBadge status={exam.riskStatus} />
          <span className="text-xs text-gray-400 mt-1">Risk</span>
        </div>

        {/* Analiz Durumu */}
        <div className="hidden xl:flex flex-col items-center w-24">
          <AnalysisStatusBadge status={exam.analysisStatus} />
          <span className="text-xs text-gray-400 mt-1">Analiz</span>
        </div>
      </div>

      {/* Genişletilmiş Detay Alanı (Accordion) */}
      {isExpanded && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 bg-gray-50">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-gray-500">Detaylar yükleniyor...</span>
            </div>
          ) : details ? (
            <ExamRowDetails examId={exam.id} details={details} />
          ) : (
            <div className="flex items-center justify-center py-12 bg-gray-50">
              <AlertTriangle className="w-6 h-6 text-amber-500 mr-2" />
              <span className="text-gray-500">Detay verisi yüklenemedi</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExamRow;
