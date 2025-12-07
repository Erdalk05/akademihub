'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type CategoryRow = {
  category: string;
  amount: number;
};

interface CategoryPieChartProps {
  title: string;
  description?: string;
  data: CategoryRow[];
}

const COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#06b6d4',
  '#ef4444',
  '#eab308',
  '#0ea5e9',
];

export default function CategoryPieChart({
  title,
  description,
  data,
}: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (!total) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">
          Henüz bu kategori için finansal kayıt bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-gray-500">{description}</p>
      )}
      <div className="h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, props) => {
                const amount = Number(value || 0);
                const percentage = total
                  ? ((amount / total) * 100).toFixed(1)
                  : '0.0';
                const label =
                  (props && (props.payload as any)?.category) || 'Kategori';
                return [
                  `₺${amount.toLocaleString('tr-TR')} (${percentage}%)`,
                  label,
                ];
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


