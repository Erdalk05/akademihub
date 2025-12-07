'use client';

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPICardProps, TrendDirection } from '@/types/dashboard';
import { getTrendColor, formatCurrency, formatPercentage } from '@/data/mockData';

const KPICard: React.FC<KPICardProps> = memo(({
  title,
  value,
  change,
  trend,
  icon,
  onClick,
  loading = false
}) => {
  // Trend ikonunu belirleme
  const getTrendIconComponent = (trend?: TrendDirection) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      case 'same':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Değeri formatla
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (title.includes('Ciro')) {
        return formatCurrency(val);
      } else if (title.includes('Oranı')) {
        return formatPercentage(val);
      } else {
        return val.toLocaleString('tr-TR');
      }
    }
    return val;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-4 focus:ring-primary-300 hover:scale-[1.02] hover:-translate-y-0.5"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${title} kartı - ${formatValue(value)}`}
    >
      {/* Başlık ve İkon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
          {title}
        </h3>
        <div className="p-2 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg group-hover:from-primary-100 group-hover:to-secondary-100 transition-colors">
          <span className="h-5 w-5 text-primary-600 inline-flex items-center justify-center">{icon}</span>
        </div>
      </div>

      {/* Ana Değer */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
      </div>

      {/* Değişim Göstergesi */}
      {change && trend && (
        <div className="flex items-center space-x-1">
          <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
            {getTrendIconComponent(trend)}
            <span className="text-sm font-medium">{change}</span>
          </div>
          <span className="text-xs text-gray-500">önceki döneme göre</span>
        </div>
      )}

      {/* Hover efekti için alt çizgi */}
      <div className="h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 mt-3 w-0 group-hover:w-full transition-all duration-300" />
    </div>
  );
});

KPICard.displayName = 'KPICard';

// KPI kartları koleksiyonu
export const KPICards: React.FC<{
  data: any;
  loading?: boolean;
  onCardClick?: (cardType: string) => void;
}> = ({ data, loading = false, onCardClick }) => {
  const kpiCards = [
    {
      title: 'Toplam Ciro',
      value: data?.kpi?.toplamCiro || 0,
      change: data?.kpi?.trend?.ciro === 'up' ? '+3%' : data?.kpi?.trend?.ciro === 'down' ? '-2%' : '0%',
      trend: data?.kpi?.trend?.ciro || 'same',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      title: 'Ödeme Oranı',
      value: data?.kpi?.odemeOrani || 0,
      change: data?.kpi?.trend?.odeme === 'up' ? '+5%' : data?.kpi?.trend?.odeme === 'down' ? '-3%' : '0%',
      trend: data?.kpi?.trend?.odeme || 'same',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Gecikmiş Taksit',
      value: data?.kpi?.gecikmisTaksit || 0,
      change: data?.kpi?.trend?.taksit === 'up' ? '+2' : data?.kpi?.trend?.taksit === 'down' ? '-1' : '0',
      trend: data?.kpi?.trend?.taksit || 'same',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Aktif Öğrenci',
      value: data?.kpi?.aktifOgrenci || 0,
      change: data?.kpi?.trend?.ogrenci === 'up' ? '+8' : data?.kpi?.trend?.ogrenci === 'down' ? '-3' : '0',
      trend: data?.kpi?.trend?.ogrenci || 'same',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => (
        <div key={card.title} style={{ animationDelay: `${index * 100}ms` }} className="animate-fadeIn">
          <KPICard
            title={card.title}
            value={card.value}
            change={card.change}
            trend={card.trend}
            icon={card.icon}
            onClick={() => onCardClick?.(card.title)}
            loading={loading}
          />
        </div>
      ))}
    </div>
  );
};

export default KPICard;
