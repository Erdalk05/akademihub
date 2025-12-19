'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { ChartProps, FinansAkisData } from '@/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatters';

const FinancialChart: React.FC<ChartProps> = ({ data, loading = false }) => {
  // Özel tooltip bileşeni
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-600">
                {entry.dataKey === 'gelir' ? 'Gelir' : entry.dataKey === 'gider' ? 'Gider' : 'Net'}: 
              </span>
              <span className="text-sm font-semibold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-fadeIn">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Finans Akışı (6 Ay)</h3>
          <p className="text-sm text-gray-600 mt-1">Gelir, gider ve net kar analizi</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span>Güncelle</span>
          </button>
        </div>
      </div>

      {/* Grafik */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="ay" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} allowDecimals={false} tickFormatter={(value) => `₺${(value / 1000)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey="gelir" name="Gelir" fill="url(#gelirGradient)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gider" name="Gider" fill="url(#giderGradient)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" name="Net Kar" fill="url(#netGradient)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="gelirGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="giderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Özet İstatistikler */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Toplam Gelir</span>
          </div>
          <p className="text-xl font-bold text-green-900 mt-1">
            {formatCurrency(data?.reduce((sum: number, item: FinansAkisData) => sum + item.gelir, 0) || 0)}
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
            <span className="text-sm font-medium text-red-800">Toplam Gider</span>
          </div>
          <p className="text-xl font-bold text-red-900 mt-1">
            {formatCurrency(data?.reduce((sum: number, item: FinansAkisData) => sum + item.gider, 0) || 0)}
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Net Kar</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mt-1">
            {formatCurrency(data?.reduce((sum: number, item: FinansAkisData) => sum + item.net, 0) || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialChart;
