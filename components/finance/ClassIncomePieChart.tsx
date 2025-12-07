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

type ClassIncome = {
  label: string;
  amount: number;
};

interface ClassIncomePieChartProps {
  data: ClassIncome[];
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

export default function ClassIncomePieChart({ data }: ClassIncomePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (!total) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Sınıflara Göre Gelir Dağılımı
        </h3>
        <p className="text-sm text-gray-500">
          Henüz ödenmiş taksit bulunmadığı için sınıf bazlı gelir hesaplanamıyor.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        Sınıflara Göre Gelir Dağılımı
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Ödenmiş taksitlere göre, hangi sınıflardan ne kadar gelir elde edildiğini gösterir.
      </p>
      <div className="h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.label}
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
                return [
                  `₺${amount.toLocaleString('tr-TR')} (${percentage}%)`,
                  (props && props.payload && (props.payload as any).label) || 'Sınıf',
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


