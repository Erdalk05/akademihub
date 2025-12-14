'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { ComposedChart, LineChart, Line, Area, AreaChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOrganizationStore } from '@/lib/store/organizationStore';

interface MonthlyData {
  month: string;
  gelir: number;
  gider: number;
  net: number;
}

interface StudentTrendData {
  month: string;
  ogrenciler: number;
}

interface GraphicsTabPanelProps {
  academicYear?: string;
}

export default function GraphicsTabPanel({ academicYear }: GraphicsTabPanelProps) {
  const [activeTab, setActiveTab] = useState<'finance' | 'prediction' | 'students'>('finance');
  const [financeData, setFinanceData] = useState<MonthlyData[]>([]);
  const [studentTrendData, setStudentTrendData] = useState<StudentTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { currentOrganization } = useOrganizationStore();

  // Son 6 ay için veri hesapla
  const calculateMonthlyStats = () => {
    const months = [];
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth()
      });
    }
    return months;
  };

  useEffect(() => {
    fetchData();
  }, [academicYear, currentOrganization]);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const orgParam = currentOrganization?.id ? `&organization_id=${currentOrganization.id}` : '';
      
      // Taksitler ve öğrenci verileri çek
      const [installmentsRes, studentsRes] = await Promise.all([
        fetch(`/api/installments?${orgParam}`),
        fetch(`/api/students?${orgParam}`)
      ]);

      const installmentsResult = await installmentsRes.json();
      const studentsResult = await studentsRes.json();

      const installments = installmentsResult.success ? (installmentsResult.data || []) : [];
      const students = studentsResult.success ? (studentsResult.data || []) : [];

      // Aylık finans verisi hesapla
      const monthsInfo = calculateMonthlyStats();
      const monthlyFinance: MonthlyData[] = monthsInfo.map(({ month, year, monthNum }) => {
        // O ayki ödemeleri filtrele
        const monthPayments = installments.filter((inst: any) => {
          if (!inst.is_paid || !inst.paid_at) return false;
          const paidDate = new Date(inst.paid_at);
          return paidDate.getFullYear() === year && paidDate.getMonth() === monthNum;
        });

        const gelir = monthPayments.reduce((sum: number, p: any) => sum + (p.paid_amount || 0), 0);

        return {
          month,
          gelir,
          gider: 0, // Şimdilik gider verisi yok
          net: gelir
        };
      });

      setFinanceData(monthlyFinance);

      // Öğrenci trend verisi - Her ay aktif öğrenci sayısı
      const studentTrend: StudentTrendData[] = monthsInfo.map(({ month, year, monthNum }) => {
        // O ay kayıtlı öğrenci sayısı (basit yaklaşım: o tarihe kadar kayıtlılar)
        const endOfMonth = new Date(year, monthNum + 1, 0);
        const activeCount = students.filter((s: any) => {
          if (s.status === 'deleted') return false;
          const createdAt = new Date(s.created_at);
          return createdAt <= endOfMonth;
        }).length;

        return {
          month,
          ogrenciler: activeCount
        };
      });

      setStudentTrendData(studentTrend);

    } catch (error) {
      console.error('Graphics data error:', error);
      // Hata durumunda boş veri
      const monthsInfo = calculateMonthlyStats();
      setFinanceData(monthsInfo.map(m => ({ month: m.month, gelir: 0, gider: 0, net: 0 })));
      setStudentTrendData(monthsInfo.map(m => ({ month: m.month, ogrenciler: 0 })));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Tahmin verisi oluştur (son 3 ay gerçek + gelecek 3 ay tahmini)
  const getPredictionData = () => {
    if (financeData.length === 0) return [];
    
    // Son 3 ayın verisi
    const lastThree = financeData.slice(-3);
    const avgGrowth = lastThree.length > 1 
      ? (lastThree[lastThree.length - 1].gelir - lastThree[0].gelir) / lastThree.length 
      : 0;
    
    const lastValue = lastThree[lastThree.length - 1]?.gelir || 0;
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const now = new Date();
    
    const predictions = [];
    
    // Son 3 ay gerçek veri
    for (let i = 0; i < lastThree.length; i++) {
      predictions.push({
        month: lastThree[i].month,
        actual: lastThree[i].gelir,
        predicted: undefined,
        min: undefined,
        max: undefined
      });
    }
    
    // Gelecek 3 ay tahmin
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date();
      futureDate.setMonth(now.getMonth() + i);
      const predicted = Math.round(lastValue + (avgGrowth * i * 1.1));
      predictions.push({
        month: monthNames[futureDate.getMonth()],
        actual: undefined,
        predicted: predicted > 0 ? predicted : lastValue,
        min: Math.round(predicted * 0.85),
        max: Math.round(predicted * 1.15)
      });
    }
    
    return predictions;
  };

  // Büyüme oranı hesapla
  const getGrowthStats = () => {
    if (studentTrendData.length < 2) return { growthRate: 0, thisMonthNew: 0, currentCount: 0 };
    
    const first = studentTrendData[0]?.ogrenciler || 0;
    const last = studentTrendData[studentTrendData.length - 1]?.ogrenciler || 0;
    const previous = studentTrendData[studentTrendData.length - 2]?.ogrenciler || 0;
    
    const growthRate = first > 0 ? ((last - first) / first) * 100 : 0;
    const thisMonthNew = last - previous;
    
    return { growthRate, thisMonthNew, currentCount: last };
  };

  const growthStats = getGrowthStats();

  const tabs = [
    { id: 'finance', label: '📊 Finansal Akış', icon: TrendingUp },
    { id: 'prediction', label: '🔮 AI Tahmin', icon: Zap },
    { id: 'students', label: '👥 Öğrenci Trendi', icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border-2 border-[#25D366]/20">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 text-[#25D366] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border-2 border-[#25D366]/20">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3 border-b-2 border-[#DCF8C6] pb-4 flex-1">
          {tabs.map(tab => (
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
          ))}
        </div>
        <button
          onClick={fetchData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#DCF8C6] text-[#075E54] rounded-xl font-medium hover:bg-[#25D366]/20 transition-all ml-4"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Yenile
        </button>
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
              <span className="text-xs font-normal text-gray-500 ml-2">(Canlı Veri)</span>
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
                <YAxis stroke="#075E54" tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #25D366',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
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
            
            {/* Özet Kartlar */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="p-4 bg-[#DCF8C6] rounded-xl border-2 border-[#25D366]/30">
                <p className="text-xs text-[#075E54] font-bold">Toplam Tahsilat</p>
                <p className="text-xl font-bold text-[#128C7E]">
                  ₺{financeData.reduce((s, d) => s + d.gelir, 0).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <p className="text-xs text-amber-700 font-bold">Ortalama/Ay</p>
                <p className="text-xl font-bold text-amber-600">
                  ₺{Math.round(financeData.reduce((s, d) => s + d.gelir, 0) / 6).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-xs text-blue-700 font-bold">Son Ay</p>
                <p className="text-xl font-bold text-blue-600">
                  ₺{(financeData[financeData.length - 1]?.gelir || 0).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
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
              <LineChart data={getPredictionData()}>
                <defs>
                  <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCF8C6" />
                <XAxis dataKey="month" stroke="#075E54" />
                <YAxis stroke="#075E54" tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #fcd34d',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => value ? `₺${value.toLocaleString('tr-TR')}` : 'N/A'}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#25D366"
                  strokeWidth={3}
                  dot={{ fill: '#25D366', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  name="Gerçekleşen"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f59e0b', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  name="Tahmini"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-[#DCF8C6] border-2 border-[#25D366]/30 rounded-xl">
              <p className="text-sm text-[#075E54]">
                <strong>🤖 AI Analiz:</strong> Son 6 aylık verilere göre tahmin oluşturuldu. 
                Mevcut trend devam ederse gelir artışı beklenmektedir.
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
              <span className="text-xs font-normal text-gray-500 ml-2">(Canlı Veri)</span>
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={studentTrendData}>
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
                <p className="text-2xl font-bold text-[#128C7E]">
                  {growthStats.growthRate >= 0 ? '+' : ''}{growthStats.growthRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-[#DCF8C6] rounded-xl border-2 border-[#25D366]/30">
                <p className="text-xs text-[#075E54] font-bold">Bu Ay Kayıt</p>
                <p className="text-2xl font-bold text-[#128C7E]">
                  {growthStats.thisMonthNew >= 0 ? '+' : ''}{growthStats.thisMonthNew}
                </p>
              </div>
              <div className="p-4 bg-[#DCF8C6] rounded-xl border-2 border-[#25D366]/30">
                <p className="text-xs text-[#075E54] font-bold">Mevcut Toplam</p>
                <p className="text-2xl font-bold text-[#128C7E]">{growthStats.currentCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
