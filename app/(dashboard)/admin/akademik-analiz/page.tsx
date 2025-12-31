'use client';

/**
 * AKADEMİHUB - GELİŞMİŞ AKADEMİK ANALİZ DASHBOARD V2.0
 * 
 * Özellikler:
 * - Gerçek zamanlı KPI kartları
 * - Performans ısı haritası (Heat Map)
 * - Zaman serisi analizi (Line Chart)
 * - Sessiz Çığlık algoritması
 * - Hızlı iletişim paneli
 * - Interaktif filtreler
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Calendar,
  Sparkles,
  Eye,
  BarChart3,
  MessageCircle,
  Mail,
  Phone,
  Bell,
  Download,
  FileSpreadsheet,
  RefreshCw,
  ChevronRight,
  Zap,
  Brain,
  Star,
  Flame,
  Medal,
  Crown,
  Activity,
  PieChart as PieChartIcon,
  Send,
  ExternalLink,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// =============================================================================
// TYPES
// =============================================================================

interface DashboardData {
  metrics: {
    totalExams: number;
    totalParticipants: number;
    avgNet: number;
    conflicts: number;
  };
  weeklyStar: {
    name: string;
    net: number;
    className: string;
    examName: string;
  } | null;
  trend: {
    percent: number;
    direction: 'up' | 'down' | 'stable';
    subjectTrends: Record<string, { current: number; trend: string }>;
  };
  silentCry: {
    count: number;
    students: Array<{
      studentId: string;
      studentName: string;
      className: string;
      currentNet: number;
      classAvg: number;
      decline: number;
      lastExams: string[];
    }>;
  };
  heatMap: Array<{
    className: string;
    subjects: Record<string, { rate: number; level: 'high' | 'medium' | 'low' }>;
    avgNet: number;
    studentCount: number;
  }>;
  timeSeries: Array<{
    examId: string;
    examName: string;
    examDate: string;
    classes: Record<string, number>;
    overall: number;
  }>;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    studentNo: string;
    className: string;
    net: number;
    percentile: number;
    examName: string;
    examDate: string;
  }>;
  subjectAverages: Record<string, { avg: number; name: string }>;
  scoreDistribution: Record<string, number>;
  classComparison: Array<{
    className: string;
    avgNet: number;
    studentCount: number;
  }>;
  bestClass: { className: string; avgNet: number } | null;
  worstClass: { className: string; avgNet: number } | null;
  recentExams: Array<{
    id: string;
    name: string;
    date: string;
    status: string;
    totalQuestions: number;
    type: string;
  }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DERS_KODLARI = ['TUR', 'INK', 'DIN', 'ING', 'MAT', 'FEN'];
const DERS_ADLARI: Record<string, string> = {
  TUR: 'Türkçe',
  INK: 'T.C. İnkılap',
  DIN: 'Din',
  ING: 'İngilizce',
  MAT: 'Matematik',
  FEN: 'Fen',
};

const CHART_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const KPICard = ({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: string;
  onClick?: () => void;
}) => {
  const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
    emerald: { bg: 'from-emerald-500 to-green-600', icon: 'text-emerald-100', text: 'text-emerald-50' },
    blue: { bg: 'from-blue-500 to-indigo-600', icon: 'text-blue-100', text: 'text-blue-50' },
    amber: { bg: 'from-amber-500 to-orange-600', icon: 'text-amber-100', text: 'text-amber-50' },
    red: { bg: 'from-red-500 to-rose-600', icon: 'text-red-100', text: 'text-red-50' },
    purple: { bg: 'from-purple-500 to-violet-600', icon: 'text-purple-100', text: 'text-purple-50' },
  };

  const c = colorClasses[color] || colorClasses.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} p-5 shadow-lg cursor-pointer group`}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${c.text} opacity-90`}>{label}</span>
          <div className={`p-2 rounded-xl bg-white/20 ${c.icon}`}>
            <Icon size={20} />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold text-white">{value}</span>
          {trend && trendValue && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend === 'up' ? 'text-green-200' : trend === 'down' ? 'text-red-200' : 'text-white/70'
              }`}
            >
              {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null}
              {trendValue}
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
    </motion.div>
  );
};

const HeatMapCell = ({ level, value }: { level: 'high' | 'medium' | 'low'; value: number }) => {
  const colors = {
    high: 'bg-emerald-500 text-white',
    medium: 'bg-amber-400 text-amber-900',
    low: 'bg-red-400 text-white',
  };

  return (
    <div className={`w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${colors[level]}`}>
      {value.toFixed(0)}
    </div>
  );
};

const WhatsAppButton = ({ student, message }: { student: { studentName: string; className: string }; message: string }) => {
  const handleClick = () => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
      title="WhatsApp ile bildir"
    >
      <MessageCircle size={16} />
    </button>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AkademikAnalizDashboard() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'students'>('overview');

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const loadDashboard = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('organizationId', currentOrganization.id);

      const response = await fetch(`/api/akademik-analiz/dashboard?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || 'Dashboard yüklenemedi');
      }
    } catch (err) {
      console.error('Dashboard hatası:', err);
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =============================================================================
  // COMPUTED DATA
  // =============================================================================

  const filteredClasses = useMemo(() => {
    if (!data?.heatMap) return [];
    if (selectedClass === 'all') return data.heatMap;
    return data.heatMap.filter((c) => c.className === selectedClass);
  }, [data?.heatMap, selectedClass]);

  const allClasses = useMemo(() => {
    if (!data?.heatMap) return [];
    return data.heatMap.map((c) => c.className);
  }, [data?.heatMap]);

  const timeSeriesChartData = useMemo(() => {
    if (!data?.timeSeries) return [];
    return data.timeSeries.map((item) => ({
      name: item.examName.length > 15 ? item.examName.slice(0, 15) + '...' : item.examName,
      overall: item.overall,
      ...item.classes,
    }));
  }, [data?.timeSeries]);

  const distributionChartData = useMemo(() => {
    if (!data?.scoreDistribution) return [];
    return Object.entries(data.scoreDistribution).map(([range, count]) => ({
      name: range,
      value: count,
    }));
  }, [data?.scoreDistribution]);

  const subjectChartData = useMemo(() => {
    if (!data?.subjectAverages) return [];
    return Object.entries(data.subjectAverages).map(([code, { avg, name }]) => ({
      name: name || code,
      value: avg,
      code,
    }));
  }, [data?.subjectAverages]);

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-emerald-300/50 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-emerald-300 font-medium text-lg">Dashboard Yükleniyor...</p>
          <p className="text-slate-400 text-sm mt-2">Veriler analiz ediliyor</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl border border-slate-200 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Dashboard Yüklenemedi</h2>
          <p className="text-slate-500 mb-6">{error || 'Bir hata oluştu'}</p>
          <button
            onClick={loadDashboard}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* ===================================================================== */}
      {/* HEADER */}
      {/* ===================================================================== */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Akademik Analiz</h1>
                <p className="text-sm text-slate-500">Gelişmiş Performans İzleme</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboard}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                title="Yenile"
              >
                <RefreshCw size={20} className="text-slate-600" />
              </button>
              <button
                onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 transition-all"
              >
                <Plus size={18} />
                Yeni Sınav
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ===================================================================== */}
        {/* KPI KARTLARI */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Target}
            label="Okul Ortalaması"
            value={`${data.metrics.avgNet.toFixed(1)} Net`}
            trend={data.trend.direction}
            trendValue={`${data.trend.percent > 0 ? '+' : ''}${data.trend.percent}%`}
            color="emerald"
          />
          <KPICard
            icon={Crown}
            label="Haftanın Yıldızı"
            value={data.weeklyStar?.name?.split(' ')[0] || '-'}
            trendValue={data.weeklyStar ? `${data.weeklyStar.net.toFixed(1)} Net` : ''}
            trend="up"
            color="amber"
          />
          <KPICard
            icon={Activity}
            label="Trend Analizi"
            value={data.trend.direction === 'up' ? '↑ Yükseliş' : data.trend.direction === 'down' ? '↓ Düşüş' : '→ Stabil'}
            trendValue={`Son 30 gün`}
            color="blue"
          />
          <KPICard
            icon={AlertTriangle}
            label="Dikkat Gereken"
            value={data.silentCry.count}
            trendValue="Öğrenci"
            color={data.silentCry.count > 0 ? 'red' : 'purple'}
            onClick={() => setActiveTab('students')}
          />
        </div>

        {/* ===================================================================== */}
        {/* HIZLI FİLTRELER */}
        {/* ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Sınıf Filtresi */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 bg-slate-100 border-0 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">Tüm Sınıflar</option>
                {allClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Arama */}
            <div className="flex-1 min-w-[200px] relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Tab Butonları */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Genel Bakış
              </button>
              <button
                onClick={() => setActiveTab('heatmap')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'heatmap' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Isı Haritası
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'students' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Öğrenciler
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ================================================================= */}
          {/* GENEL BAKIŞ TAB */}
          {/* ================================================================= */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Grafikler Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zaman Serisi Grafiği */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={20} className="text-emerald-600" />
                        Net Ortalaması Trendi
                      </h3>
                      <p className="text-sm text-slate-500">Son sınavlardaki performans</p>
                    </div>
                  </div>

                  <div className="h-72">
                    {timeSeriesChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeSeriesChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="overall"
                            name="Genel"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                          {allClasses.slice(0, 4).map((cls, i) => (
                            <Line
                              key={cls}
                              type="monotone"
                              dataKey={cls}
                              name={cls}
                              stroke={CHART_COLORS[i + 1]}
                              strokeWidth={2}
                              strokeDasharray={i > 0 ? '5 5' : undefined}
                              dot={{ fill: CHART_COLORS[i + 1], strokeWidth: 1, r: 3 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        Henüz yeterli veri yok
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Ders Ortalamaları */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-600" />
                        Ders Ortalamaları
                      </h3>
                      <p className="text-sm text-slate-500">Son sınav bazında</p>
                    </div>
                  </div>

                  <div className="h-72">
                    {subjectChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            }}
                            formatter={(value: number) => [`${value.toFixed(2)} Net`, '']}
                          />
                          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                            {subjectChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        Ders verisi yok
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Alt Grid: Dağılım + Sınıf Karşılaştırma */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Puan Dağılımı */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <PieChartIcon size={20} className="text-purple-600" />
                    Başarı Dağılımı
                  </h3>

                  <div className="h-48">
                    {distributionChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {distributionChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">Veri yok</div>
                    )}
                  </div>
                </motion.div>

                {/* Sınıf Sıralaması */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Medal size={20} className="text-amber-600" />
                      Sınıf Sıralaması
                    </h3>
                    {data.bestClass && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        🏆 En İyi: {data.bestClass.className}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {data.classComparison.slice(0, 6).map((cls, i) => {
                      const maxNet = data.classComparison[0]?.avgNet || 1;
                      const percentage = (cls.avgNet / maxNet) * 100;

                      return (
                        <div key={cls.className} className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              i === 0
                                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                                : i === 1
                                ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                                : i === 2
                                ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-700">{cls.className}</span>
                              <span className="text-sm text-slate-500">{cls.avgNet.toFixed(2)} Net</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className={`h-full rounded-full ${
                                  i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-slate-400'
                                }`}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">{cls.studentCount} öğr.</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Sessiz Çığlık Uyarısı */}
              {data.silentCry.count > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                        <Flame size={18} />
                        Sessiz Çığlık: {data.silentCry.count} Öğrenci Dikkat Gerektiriyor
                      </h3>
                      <p className="text-sm text-red-700 mb-4">
                        Bu öğrenciler sınıf ortalamasının üzerinde olmalarına rağmen son sınavlarda performans düşüşü yaşıyor.
                        Motivasyon kaybı veya özel durumlar söz konusu olabilir.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.silentCry.students.slice(0, 6).map((student) => (
                          <div
                            key={student.studentId}
                            className="bg-white rounded-xl p-4 border border-red-100 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-slate-800">{student.studentName}</span>
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                ↓ {student.decline.toFixed(1)} Net
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                              <div>Sınıf: {student.className}</div>
                              <div>Şu anki: {student.currentNet.toFixed(1)} Net</div>
                              <div>Sınıf Ort: {student.classAvg} Net</div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <WhatsAppButton
                                student={student}
                                message={`Sayın Veli, öğrencimiz ${student.studentName}'in son sınavlarda performans düşüşü tespit ettik. Görüşmek için iletişime geçmenizi rica ederiz. - ${currentOrganization?.name || 'Okul'}`}
                              />
                              <button className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors">
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Hızlı Aksiyonlar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                  className="p-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl text-white cursor-pointer hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold">Sınav Sihirbazı</h3>
                  </div>
                  <p className="text-white/80 text-sm mb-3">5 adımda yeni sınav oluşturun</p>
                  <div className="flex items-center gap-2 text-white/90 group-hover:translate-x-2 transition-transform">
                    <span className="text-sm">Başla</span>
                    <ArrowRight size={16} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => router.push('/admin/akademik-analiz/sonuclar')}
                  className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Sınav Sonuçları</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-3">Detaylı sonuçları görüntüleyin</p>
                  <div className="flex items-center gap-2 text-blue-600 group-hover:translate-x-2 transition-transform">
                    <span className="text-sm">Görüntüle</span>
                    <ArrowRight size={16} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => router.push('/admin/akademik-analiz/karne')}
                  className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Öğrenci Karnesi</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-3">Kazanım bazlı karne oluşturun</p>
                  <div className="flex items-center gap-2 text-purple-600 group-hover:translate-x-2 transition-transform">
                    <span className="text-sm">Oluştur</span>
                    <ArrowRight size={16} />
                  </div>
                </motion.div>
              </div>

              {/* Son Sınavlar */}
              {data.recentExams.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-slate-500" />
                      Son Sınavlar
                    </h3>
                    <button
                      onClick={() => router.push('/admin/akademik-analiz/sonuclar')}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      Tümünü Gör
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {data.recentExams.slice(0, 5).map((exam) => (
                      <div
                        key={exam.id}
                        onClick={() => router.push(`/admin/akademik-analiz/sonuclar?examId=${exam.id}`)}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{exam.name}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(exam.date).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            {exam.type}
                          </span>
                          <span className="text-sm text-slate-500">{exam.totalQuestions} soru</span>
                          <ChevronRight className="text-slate-400" size={18} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* ISI HARİTASI TAB */}
          {/* ================================================================= */}
          {activeTab === 'heatmap' && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Flame size={20} className="text-orange-600" />
                    Performans Isı Haritası
                  </h3>
                  <p className="text-sm text-slate-500">Sınıf ve ders bazlı başarı oranları</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded" />
                    <span className="text-slate-600">&gt;%75</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-400 rounded" />
                    <span className="text-slate-600">%50-75</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-400 rounded" />
                    <span className="text-slate-600">&lt;%50</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Sınıf</th>
                      {DERS_KODLARI.map((code) => (
                        <th key={code} className="text-center py-3 px-2 font-semibold text-slate-600">
                          {DERS_ADLARI[code]}
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Ort. Net</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">Öğrenci</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((cls) => (
                      <tr key={cls.className} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{cls.className}</span>
                        </td>
                        {DERS_KODLARI.map((code) => {
                          const subject = cls.subjects[code];
                          return (
                            <td key={code} className="py-3 px-2 text-center">
                              {subject ? (
                                <HeatMapCell level={subject.level} value={subject.rate} />
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-emerald-600">{cls.avgNet.toFixed(1)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-slate-500">{cls.studentCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredClasses.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Flame size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Henüz ısı haritası verisi yok</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* ÖĞRENCİLER TAB */}
          {/* ================================================================= */}
          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  En Başarılı Öğrenciler
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Sıra</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Öğrenci</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Sınıf</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Net</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Yüzdelik</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Sınav</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.topPerformers
                      .filter(
                        (s) =>
                          searchTerm === '' ||
                          s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.studentNo.includes(searchTerm)
                      )
                      .map((student, i) => (
                        <tr key={`${student.studentId}-${i}`} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                i === 0
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg'
                                  : i === 1
                                  ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                                  : i === 2
                                  ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {i + 1}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                                {student.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{student.studentName}</p>
                                <p className="text-xs text-slate-400">No: {student.studentNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-sm text-slate-600 font-medium">
                              {student.className}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-lg font-bold text-emerald-600">{student.net.toFixed(2)}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              %{student.percentile}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-slate-600">{student.examName}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(student.examDate).toLocaleDateString('tr-TR')}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  if (student.studentId) {
                                    router.push(`/admin/akademik-analiz/ogrenci-karne?studentId=${student.studentId}`);
                                  }
                                }}
                                className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                                title="Karneyi Görüntüle"
                              >
                                <Eye size={16} />
                              </button>
                              <WhatsAppButton
                                student={student}
                                message={`Sayın Veli, öğrencimiz ${student.studentName}'in son sınavdaki başarısını tebrik ederiz! ${student.net.toFixed(1)} net ile üstün performans sergilemiştir. - ${currentOrganization?.name || 'Okul'}`}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {data.topPerformers.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Henüz öğrenci verisi yok</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================================================================== */}
        {/* HIZLI İLETİŞİM PANELİ */}
        {/* ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white"
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Send size={20} />
            Hızlı İletişim
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group">
              <div className="p-3 bg-green-500 rounded-xl group-hover:scale-110 transition-transform">
                <MessageCircle size={24} />
              </div>
              <span className="text-sm font-medium">WhatsApp</span>
              <span className="text-xs text-slate-400">Veli Bildir</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group">
              <div className="p-3 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <span className="text-sm font-medium">E-posta</span>
              <span className="text-xs text-slate-400">Toplu Rapor</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group">
              <div className="p-3 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <span className="text-sm font-medium">SMS</span>
              <span className="text-xs text-slate-400">Hızlı Sonuç</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group">
              <div className="p-3 bg-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                <Bell size={24} />
              </div>
              <span className="text-sm font-medium">Bildirim</span>
              <span className="text-xs text-slate-400">App Push</span>
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-4 text-sm text-slate-400">
          <p>AkademiHub Akademik Analiz Dashboard V2.0</p>
          <p className="text-xs mt-1">Son güncelleme: {new Date().toLocaleString('tr-TR')}</p>
        </div>
      </div>
    </div>
  );
}
