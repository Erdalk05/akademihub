'use client';

import { useState } from 'react';
import { TrendingUp, Users, Zap } from 'lucide-react';
import { ComposedChart, LineChart, Line, Area, AreaChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraphicsTabPanelProps {
  financeData?: Array<{ month: string; gelir: number; gider: number; net: number }>;
  predictionData?: Array<{ month: string; actual?: number; predicted?: number; min?: number; max?: number }>;
  academicYear?: string;
}

const defaultFinanceData = [
  { month: 'Ağu', gelir: 120000, gider: 85000, net: 35000 },
  { month: 'Eyl', gelir: 185000, gider: 92000, net: 93000 },
  { month: 'Eki', gelir: 165000, gider: 88000, net: 77000 },
  { month: 'Kas', gelir: 215000, gider: 95000, net: 120000 },
  { month: 'Ara', gelir: 245000, gider: 105000, net: 140000 },
  { month: 'Oca', gelir: 280000, gider: 110000, net: 170000 }
];

const defaultPredictionData = [
  { month: 'Kas', actual: 215000, predicted: undefined, min: undefined, max: undefined },
  { month: 'Ara', actual: 245000, predicted: undefined, min: undefined, max: undefined },
  { month: 'Oca', actual: 280000, predicted: undefined, min: undefined, max: undefined },
  { month: 'Şub', actual: undefined, predicted: 320000, min: 290000, max: 350000 },
  { month: 'Mar', actual: undefined, predicted: 350000, min: 315000, max: 385000 },
  { month: 'Nis', actual: undefined, predicted: 380000, min: 340000, max: 420000 }
];

export default function GraphicsTabPanel({ 
  financeData = defaultFinanceData,
  predictionData = defaultPredictionData,
  academicYear
}: GraphicsTabPanelProps) {
  const [activeTab, setActiveTab] = useState<'finance' | 'prediction' | 'students'>('finance');

  const tabs = [
    { id: 'finance', label: '📊 Finansal Akış', icon: TrendingUp },
    { id: 'prediction', label: '🔮 AI Tahmin', icon: Zap },
    { id: 'students', label: '👥 Öğrenci Trendi', icon: Users },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border-2 border-[#25D366]/20">
      {/* Tab Buttons - WhatsApp styled */}
      <div className="flex gap-3 mb-6 border-b-2 border-[#DCF8C6] pb-4">
        {tabs.map(tab => {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white shadow-md'
                  : 'text-gray-600 hover:text-[#075E54] hover:bg-[#DCF8C6]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* Finansal Akış */}
        {activeTab === 'finance' && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#075E54]">
              <div className="w-8 h-8 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#25D366]" />
              </div>
              Son 6 Aylık Finansal Akış
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={financeData}>
                <defs>
                  <linearGradient id="gelirGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCF8C6" />
                <XAxis dataKey="month" stroke="#075E54" />
                <YAxis stroke="#075E54" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #25D366',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => `₺${value.toLocaleString()}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="gelir"
                  fill="url(#gelirGradient)"
                  stroke="#25D366"
                  strokeWidth={3}
                  name="Gelir"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#128C7E"
                  strokeWidth={3}
                  dot={{ fill: '#128C7E', r: 5 }}
                  name="Net Kâr"
                />
                <Bar dataKey="gider" fill="#ef4444" name="Gider" opacity={0.7} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Tahmin */}
        {activeTab === 'prediction' && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#075E54]">
              <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              Gelecek 3 Ay Gelir Tahmini (AI)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={predictionData}>
                <defs>
                  <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCF8C6" />
                <XAxis dataKey="month" stroke="#075E54" />
                <YAxis stroke="#075E54" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #fcd34d',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => value ? `₺${value.toLocaleString()}` : 'N/A'}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#25D366"
                  strokeWidth={3}
                  dot={{ fill: '#25D366', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  name="Gerçekleşen"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f59e0b', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  name="Tahmini"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-[#DCF8C6] border-2 border-[#25D366]/30 rounded-xl">
              <p className="text-sm text-[#075E54]">
                <strong>🤖 AI Analiz:</strong> Beklenen gelir trendi olumlu. Şubat ayında ₺320.000 civarı gelir beklenmektedir. Güven seviyesi: 87%
              </p>
            </div>
          </div>
        )}

        {/* Öğrenci Trendi */}
        {activeTab === 'students' && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#075E54]">
              <div className="w-8 h-8 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-[#128C7E]" />
              </div>
              Aktif Öğrenci Trendi (6 Aylık)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={[
                { month: 'Ağu', ogrenciler: 98 },
                { month: 'Eyl', ogrenciler: 105 },
                { month: 'Eki', ogrenciler: 112 },
                { month: 'Kas', ogrenciler: 120 },
                { month: 'Ara', ogrenciler: 125 },
                { month: 'Oca', ogrenciler: 128 }
              ]}>
                <defs>
                  <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#128C7E" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#128C7E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCF8C6" />
                <XAxis dataKey="month" stroke="#075E54" />
                <YAxis stroke="#075E54" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #25D366',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => `${value} öğrenci`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ogrenciler"
                  fill="url(#studentGradient)"
                  stroke="#128C7E"
                  strokeWidth={3}
                  name="Aktif Öğrenci"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="p-4 bg-[#DCF8C6] rounded-xl border-2 border-[#25D366]/30">
                <p className="text-xs text-[#075E54] font-bold">Büyüme Oranı</p>
                <p className="text-2xl font-bold text-[#128C7E]">+30.6%</p>
              </div>
              <div className="p-4 bg-[#DCF8C6] rounded-xl border-2 border-[#25D366]/30">
                <p className="text-xs text-[#075E54] font-bold">Bu Ay Kayıt</p>
                <p className="text-2xl font-bold text-[#128C7E]">+7</p>
              </div>
              <div className="p-4 bg-[#DCF8C6] rounded-xl border-2 border-[#25D366]/30">
                <p className="text-xs text-[#075E54] font-bold">Hedef (Şub)</p>
                <p className="text-2xl font-bold text-[#128C7E]">150</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
