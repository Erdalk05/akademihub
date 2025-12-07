'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CashFlowData {
  month: string;
  cashFlow: number;
  income: number;
  expense: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  title?: string;
}

export default function CashFlowChart({ data, title = 'Son 12 Ay Nakit Akışı' }: CashFlowChartProps) {
  // Boş veri kontrolü
  const hasData = data && data.length > 0 && data.some(d => d.cashFlow !== 0 || d.income !== 0 || d.expense !== 0);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      
      {!hasData ? (
        <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Henüz nakit akış verisi bulunmuyor</p>
          <p className="text-gray-400 text-sm mt-1">Ödeme ve gider işlemleri eklendikçe grafik güncellenecektir</p>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCashFlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="cashFlow"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorCashFlow)"
            name="Nakit Akışı"
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={1}
            fill="none"
            name="Gelir"
            strokeDasharray="5 5"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={1}
            fill="none"
            name="Gider"
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
