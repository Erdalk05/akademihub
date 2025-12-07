'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface IncomeExpenseData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface IncomeExpenseChartProps {
  data: IncomeExpenseData[];
  title?: string;
}

export default function IncomeExpenseChart({
  data,
  title = 'Gelir vs Gider Analizi',
}: IncomeExpenseChartProps) {
  // Boş veri kontrolü
  const hasData = data && data.length > 0 && data.some(d => d.income !== 0 || d.expense !== 0);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      
      {!hasData ? (
        <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Henüz gelir/gider verisi bulunmuyor</p>
          <p className="text-gray-400 text-sm mt-1">Finansal işlemler eklendikçe grafik güncellenecektir</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) =>
                value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
              }
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Gelir" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Gider" radius={[8, 8, 0, 0]} />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Bakiye"
              yAxisId="right"
            />
            <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
