// ============================================================================
// SUMMARY CARDS - Exam Statistics Overview
// Pure presentational component for displaying exam statistics
// ============================================================================

import React from 'react';
import { Users, BarChart3, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { ExamStatistics } from '@/types/exam-detail';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface SummaryCardsProps {
  statistics: ExamStatistics | null;
}

interface CardData {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SummaryCards({ statistics }: SummaryCardsProps) {
  // Build cards data
  const cards: CardData[] = [
    {
      label: 'Toplam Öğrenci',
      value: statistics?.totalParticipants ?? '-',
      subtitle: statistics
        ? `${statistics.institutionCount} Asil / ${statistics.guestCount} Misafir`
        : 'Veri yok',
      icon: Users,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Ortalama Net',
      value: statistics ? statistics.averageNet.toFixed(1) : '-',
      subtitle: statistics ? 'Ortalama performans' : 'Veri yok',
      icon: BarChart3,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'En Yüksek Net',
      value: statistics?.maxNet ?? '-',
      subtitle: statistics ? 'En başarılı' : 'Veri yok',
      icon: TrendingUp,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'En Düşük Net',
      value: statistics?.minNet ?? '-',
      subtitle: statistics ? 'En düşük puan' : 'Veri yok',
      icon: TrendingDown,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Standart Sapma',
      value: statistics ? statistics.stdDeviation.toFixed(1) : '-',
      subtitle: statistics ? 'Dağılım ölçüsü' : 'Veri yok',
      icon: Activity,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Medyan Net',
      value: statistics?.medianNet ?? '-',
      subtitle: statistics ? 'Ortanca değer' : 'Veri yok',
      icon: Target,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <div
            key={card.label}
            className={cn(
              'bg-white rounded-xl shadow-sm p-4 border border-gray-100',
              'hover:shadow-md transition-shadow'
            )}
          >
            {/* Icon */}
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', card.bgColor)}>
              <Icon className={cn('w-5 h-5', card.iconColor)} />
            </div>

            {/* Label */}
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>

            {/* Value */}
            <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>

            {/* Subtitle */}
            <p className="text-xs text-gray-400">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}

export default SummaryCards;
