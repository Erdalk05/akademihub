'use client';

import React from 'react';
import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  CheckCircle,
  Calculator,
} from 'lucide-react';
import type { ExamStatistics } from '@/types/spectra-detail';

// ============================================================================
// SUMMARY CARDS COMPONENT
// 8 özet kartı - genişletilmiş istatistikler
// ============================================================================

interface SummaryCardsProps {
  statistics: ExamStatistics;
  totalQuestions?: number; // Varsayılan 90
}

export function SummaryCards({ statistics, totalQuestions = 90 }: SummaryCardsProps) {
  const cards = [
    {
      icon: Users,
      title: 'Katılımcı',
      value: statistics.totalParticipants,
      subtext: `${statistics.institutionCount} Asil • ${statistics.guestCount} Misafir`,
      color: 'emerald',
    },
    {
      icon: BarChart3,
      title: 'Ortalama Net',
      value: statistics.averageNet.toFixed(1),
      subtext: `Std. Sapma: ${statistics.stdDeviation.toFixed(1)}`,
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'En Yüksek',
      value: statistics.maxNet.toFixed(1),
      subtext: statistics.maxNetStudent?.name || '-',
      color: 'green',
    },
    {
      icon: TrendingDown,
      title: 'En Düşük',
      value: statistics.minNet.toFixed(1),
      subtext: statistics.minNetStudent?.name || '-',
      color: 'amber',
    },
    {
      icon: Target,
      title: 'Medyan',
      value: statistics.medianNet.toFixed(1),
      subtext: `${Math.round(statistics.totalParticipants / 2)}. sıra`,
      color: 'violet',
    },
    {
      icon: Activity,
      title: 'Std. Sapma',
      value: statistics.stdDeviation.toFixed(1),
      subtext: statistics.stdDeviation < 10 ? 'Homojen' : statistics.stdDeviation < 15 ? 'Normal' : 'Heterojen',
      color: 'purple',
    },
    {
      icon: CheckCircle,
      title: 'Başarı Oranı',
      value: `%${statistics.successRate || ((statistics.averageNet / totalQuestions) * 100).toFixed(1)}`,
      subtext: 'Hedef: %70',
      color: 'teal',
    },
    {
      icon: Calculator,
      title: 'LGS Tahmini',
      value: statistics.averageLGSScore || Math.round(200 + statistics.averageNet * 4.5),
      subtext: 'Kurum ortalaması',
      color: 'indigo',
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    violet: {
      bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-500 to-green-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        const Icon = card.icon;

        return (
          <div
            key={index}
            className={`${colors.bg} rounded-xl p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`w-4 h-4 ${colors.icon}`} />
              <span className={`text-[10px] md:text-xs font-medium ${colors.icon} truncate`}>
                {card.title}
              </span>
            </div>
            <p className={`text-lg md:text-2xl font-black ${colors.text}`}>{card.value}</p>
            <p className={`text-[10px] md:text-xs ${colors.icon} mt-1 truncate`}>{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}

export default SummaryCards;

