'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import type { OrganizationTrend } from '@/types/spectra-detail';

// ============================================================================
// ORGANIZATION TREND CHART COMPONENT
// Kurum bazlı son 5 sınav trend grafiği
// ============================================================================

interface OrganizationTrendChartProps {
  trends: OrganizationTrend[];
  isLoading?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

export function OrganizationTrendChart({
  trends,
  isLoading = false,
  trendDirection = 'stable',
  trendPercentage = 0,
}: OrganizationTrendChartProps) {
  // Trend ikonu ve rengi
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendText = () => {
    if (trends.length < 2) return 'Yeterli veri yok';
    const firstNet = trends[0]?.averageNet || 0;
    const lastNet = trends[trends.length - 1]?.averageNet || 0;
    const diff = lastNet - firstNet;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)} net (${sign}${trendPercentage}%)`;
  };

  // Grafik verisi
  const chartData = trends.map((t) => ({
    name: t.examName.length > 10 ? t.examName.substring(0, 10) + '...' : t.examName,
    net: t.averageNet,
    participants: t.participantCount,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          📈 Son Sınavlar Trendi
        </h3>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {getTrendText()}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : trends.length > 1 ? (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} net`, 'Ortalama']}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Alt bilgi */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-3">
            <span>
              İlk: <strong className="text-gray-700">{trends[0]?.averageNet.toFixed(1)}</strong> net
            </span>
            <span className="text-gray-300">→</span>
            <span>
              Son: <strong className={getTrendColor()}>{trends[trends.length - 1]?.averageNet.toFixed(1)}</strong> net
            </span>
          </div>
        </>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-gray-400">
          <TrendingUp className="w-12 h-12 mb-2 text-gray-300" />
          <p className="text-sm">Trend için yeterli sınav verisi yok</p>
          <p className="text-xs mt-1">En az 2 sınav gerekli</p>
        </div>
      )}
    </div>
  );
}

export default OrganizationTrendChart;
