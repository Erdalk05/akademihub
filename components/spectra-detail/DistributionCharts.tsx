'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/spectra-detail/constants';

// ============================================================================
// DISTRIBUTION CHARTS COMPONENT
// Net dağılım histogramı + Doğru/Yanlış/Boş donut chart
// ============================================================================

interface DistributionChartsProps {
  netDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  averageNet: number;
}

export function DistributionCharts({
  netDistribution,
  totalCorrect,
  totalWrong,
  totalBlank,
  averageNet,
}: DistributionChartsProps) {
  // Donut chart verisi
  const total = totalCorrect + totalWrong + totalBlank;
  const pieData = [
    {
      name: 'Doğru',
      value: totalCorrect,
      percentage: total > 0 ? Math.round((totalCorrect / total) * 100) : 0,
    },
    {
      name: 'Yanlış',
      value: totalWrong,
      percentage: total > 0 ? Math.round((totalWrong / total) * 100) : 0,
    },
    {
      name: 'Boş',
      value: totalBlank,
      percentage: total > 0 ? Math.round((totalBlank / total) * 100) : 0,
    },
  ];

  const PIE_COLORS = [CHART_COLORS.correct, CHART_COLORS.wrong, CHART_COLORS.blank];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sol: Net Dağılım Histogramı */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          📊 Net Dağılımı
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={netDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number, name: string) => [
                `${value} öğrenci`,
                'Sayı',
              ]}
            />
            <Bar
              dataKey="count"
              fill={CHART_COLORS.histogram}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 text-center text-sm text-gray-500">
          Ortalama Net: <span className="font-bold text-emerald-600">{averageNet.toFixed(1)}</span>
        </div>
      </div>

      {/* Sağ: Doğru/Yanlış/Boş Donut Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          🍩 D/Y/B Dağılımı
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percentage }) => `${name} %${percentage}`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} soru`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 flex justify-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Doğru: {totalCorrect}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Yanlış: {totalWrong}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            Boş: {totalBlank}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DistributionCharts;

