'use client';

import React from 'react';
import {
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
} from 'lucide-react';
import type { ExamStatistics } from '@/types/spectra-detail';

// ============================================================================
// SUMMARY CARDS COMPONENT
// 6 özet kartı - istatistikler
// ============================================================================

interface SummaryCardsProps {
  statistics: ExamStatistics;
}

export function SummaryCards({ statistics }: SummaryCardsProps) {
  const cards = [
    {
      icon: Users,
      title: 'Öğrenci Sayısı',
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
      title: 'En Yüksek Net',
      value: statistics.maxNet.toFixed(1),
      subtext: statistics.maxNetStudent?.name || '-',
      color: 'green',
    },
    {
      icon: TrendingDown,
      title: 'En Düşük Net',
      value: statistics.minNet.toFixed(1),
      subtext: statistics.minNetStudent?.name || '-',
      color: 'amber',
    },
    {
      icon: Activity,
      title: 'Standart Sapma',
      value: statistics.stdDeviation.toFixed(1),
      subtext: statistics.stdDeviation < 10 ? 'Homojen' : statistics.stdDeviation < 15 ? 'Normal' : 'Heterojen',
      color: 'purple',
    },
    {
      icon: Target,
      title: 'Medyan',
      value: statistics.medianNet.toFixed(1),
      subtext: `${Math.round(statistics.totalParticipants / 2)}. sıra`,
      color: 'cyan',
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
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      icon: 'text-white/80',
      text: 'text-white',
    },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        const Icon = card.icon;

        return (
          <div
            key={index}
            className={`${colors.bg} rounded-xl p-4 shadow-md`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${colors.icon}`} />
              <span className={`text-xs font-medium ${colors.icon}`}>
                {card.title}
              </span>
            </div>
            <p className={`text-2xl font-black ${colors.text}`}>{card.value}</p>
            <p className={`text-xs ${colors.icon} mt-1 truncate`}>{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}

export default SummaryCards;

