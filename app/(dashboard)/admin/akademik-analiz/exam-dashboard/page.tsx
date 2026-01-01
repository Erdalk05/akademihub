'use client';

/**
 * AkademiHub Exam Intelligence Dashboard
 * Türkiye'nin en gelişmiş K12 sınav analiz platformu
 * Enterprise-grade • MEB/ÖSYM Uyumlu • AI Destekli
 */

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Cell, AreaChart, Area, PieChart, Pie,
  ComposedChart, Scatter, ScatterChart
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, Target, Award, AlertTriangle,
  AlertCircle, Search, Download, RefreshCw, BarChart2, Activity,
  Eye, ArrowUpRight, ArrowDownRight, Minus, GraduationCap, BookOpen,
  Brain, Sparkles, Menu, ChevronDown, ChevronUp, Filter, Percent,
  Zap, Crown, Star, Trophy, School, Calendar, Clock, CheckCircle2,
  XCircle, FileText, Share2, Settings, Layers, PieChart as PieIcon,
  TrendingUp as TrendIcon
} from 'lucide-react';
import { useExamIntelligenceStore } from '@/lib/store/examIntelligenceStore';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import type {
  ExamIntelligenceResponse, StudentResult, RiskLevel, ViewMode,
  ClassStats, SubjectStats
} from '@/types/exam-intelligence';

// ============================================================================
// THEME COLORS - WhatsApp Green & White
// ============================================================================

const THEME = {
  primary: '#25D366',       // WhatsApp Green
  primaryDark: '#1CB655',   // darker green
  primaryLight: '#7EF0A5',  // light green

  accent: '#128C7E',        // WhatsApp dark teal
  accentLight: '#34B7F1',   // WhatsApp cyan accent

  bgDark: '#0f172a',        // slate-900 (keep depth)
  bgCard: '#ffffff',        // white cards
  bgHover: '#f1f5f9',       // light hover

  textPrimary: '#0f172a',   // dark text
  textSecondary: '#475569', // slate-600
  textMuted: '#64748b',     // slate-500

  success: '#25D366',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  border: '#e2e8f0',        // light border
  borderLight: '#e5e7eb',
};

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#14b8a6',
  none: '#6366f1',
};

const SUBJECT_COLORS = ['#25D366', '#128C7E', '#34B7F1', '#16a34a', '#047857', '#0ea5e9'];
const CHART_COLORS = ['#25D366', '#128C7E', '#34B7F1', '#16a34a', '#047857', '#0ea5e9'];

// ============================================================================
// MAIN DASHBOARD CONTENT
// ============================================================================

function ExamDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  const { currentOrganization } = useOrganizationStore();
  const {
    examData, isLoading, error, viewMode, filters, sidebarOpen,
    selectedStudentId, setExamData, setLoading, setError, setViewMode,
    setFilters, resetFilters, setSidebarOpen, setSelectedStudentId,
    getFilteredStudents, getClassList, getSubjectList,
  } = useExamIntelligenceStore();

  const [exams, setExams] = useState<Array<{ id: string; name: string; exam_date: string; exam_type: string }>>([]);
  const [selectedExam, setSelectedExam] = useState<string>(examId || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'classes' | 'subjects' | 'trends'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // ========================================================================
  // FETCH EXAMS LIST
  // ========================================================================

  useEffect(() => {
    const fetchExams = async () => {
      if (!currentOrganization?.id) return;
      try {
        const res = await fetch(`/api/akademik-analiz/exams?organizationId=${currentOrganization.id}`);
        const data = await res.json();
        if (data?.exams && Array.isArray(data.exams)) {
          setExams(data.exams);
          if (!selectedExam && data.exams.length > 0) {
            setSelectedExam(data.exams[0].id);
          }
        }
      } catch (err) {
        // Silent fail for production
      }
    };
    fetchExams();
  }, [currentOrganization?.id, selectedExam]);

  // ========================================================================
  // FETCH EXAM DATA
  // ========================================================================

  const fetchExamData = useCallback(async () => {
    if (!selectedExam) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/akademik-analiz/exam-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          options: {
            includeHistorical: true,
            includePredictions: true,
            includeComparisons: true,
            depth: 'comprehensive',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Veri yüklenemedi');
      setExamData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedExam, setExamData, setLoading, setError]);

  useEffect(() => {
    fetchExamData();
  }, [fetchExamData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExamData();
  };

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const filteredStudents = useMemo(() => {
    try {
      const arr = getFilteredStudents?.();
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [examData, filters, getFilteredStudents]);

  const classList = useMemo(() => {
    try {
      const arr = getClassList?.();
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [examData, getClassList]);

  const subjectList = useMemo(() => {
    try {
      const arr = getSubjectList?.();
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [examData, getSubjectList]);

  const statistics = (examData?.statistics || {}) as any;
  const insights = (examData?.insights || {}) as any;
  const overall = statistics?.overall;
  const byClass = Array.isArray(statistics?.byClass) ? statistics.byClass : [];
  const bySubject = Array.isArray(statistics?.bySubject) ? statistics.bySubject : [];
  const trends = Array.isArray(statistics?.trends) ? statistics.trends : [];
  const riskStudents = Array.isArray(insights?.riskStudents) ? insights.riskStudents : [];
  const opportunities = Array.isArray(insights?.opportunities) ? insights.opportunities : [];
  const recommendations = Array.isArray(insights?.recommendations) ? insights.recommendations : [];
  const netDistribution = Array.isArray(statistics?.distributions?.netDistribution)
    ? statistics.distributions.netDistribution
    : [];

  // Histogram fallback: öğrenci verisinden bin oluştur
  const histogramData = useMemo(() => {
    if (netDistribution.length > 0) {
      return netDistribution.map((b: any) => ({
        range: typeof b.range === 'string' ? b.range : `${b.min ?? 0}-${b.max ?? 0}`,
        count: Number(b.count || 0),
      }));
    }
    if (!Array.isArray(filteredStudents) || filteredStudents.length === 0) return [];
    const bins = [
      { label: '0-10', min: 0, max: 10, count: 0 },
      { label: '11-20', min: 11, max: 20, count: 0 },
      { label: '21-30', min: 21, max: 30, count: 0 },
      { label: '31-40', min: 31, max: 40, count: 0 },
      { label: '41-50', min: 41, max: 50, count: 0 },
      { label: '51-60', min: 51, max: 60, count: 0 },
      { label: '61-70', min: 61, max: 70, count: 0 },
      { label: '71-80', min: 71, max: 80, count: 0 },
      { label: '81-90', min: 81, max: 90, count: 0 },
      { label: '91-100', min: 91, max: 120, count: 0 },
    ];
    filteredStudents.forEach((s: any) => {
      const net = Number(s?.totalNet || 0);
      const bin = bins.find((b) => net >= b.min && net <= b.max);
      if (bin) bin.count += 1;
    });
    return bins
      .filter((b) => b.count > 0)
      .map((b) => ({ range: b.label, count: b.count }));
  }, [filteredStudents, netDistribution]);

  const percentileScatterData = useMemo(() => {
    return (Array.isArray(filteredStudents) ? filteredStudents : [])
      .filter((s: any) => typeof s.percentile === 'number' && typeof s.totalNet === 'number')
      .map((s: any) => ({
        name: s.fullName || s.studentNo || 'Öğrenci',
        percentile: Number(s.percentile || 0),
        net: Number(s.totalNet || 0),
      }));
  }, [filteredStudents]);

  const leaderboardData = useMemo(() => {
    return (Array.isArray(filteredStudents) ? filteredStudents : [])
      .slice(0, 25)
      .map((s: any, idx: number) => ({
        rank: idx + 1,
        name: s.fullName || 'İsimsiz',
        className: s.className || '-',
        net: s.totalNet ? s.totalNet.toFixed(2) : '0.00',
        percentile: s.percentile || 0,
        trend: s.trendDirection,
        netChange: s.netChange,
      }));
  }, [filteredStudents]);

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading && !examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin" />
            <Brain className="absolute inset-0 m-auto w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Exam Intelligence</h3>
          <p className="text-slate-400">Veriler analiz ediliyor...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/80 backdrop-blur border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Bağlantı Hatası</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // NO DATA STATE
  // ========================================================================

  if (!examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-xl mx-auto mt-20 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Sınav Analizi</h2>
          <p className="text-slate-400 mb-8">Analiz görüntülemek için bir sınav seçin</p>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="">Sınav Seçin...</option>
            {(exams ?? []).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {typeof ex.name === 'string' ? ex.name : 'İsimsiz'} - {new Date(ex.exam_date).toLocaleDateString('tr-TR')}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (!overall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/80 backdrop-blur border border-amber-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Veri Bekleniyor</h2>
          <p className="text-slate-400 mb-6">Bu sınav için henüz sonuç girilmemiş.</p>
          <button onClick={handleRefresh} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors">
            Yenile
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-emerald-100 shadow-sm">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-300/30">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Exam Intelligence</h1>
                  <p className="text-xs text-slate-500">{currentOrganization?.name || 'AkademiHub'}</p>
                </div>
              </div>
            </div>

            {/* Exam Selector & Actions */}
            <div className="flex items-center gap-3">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-500 min-w-[200px]"
              >
                {(exams ?? []).map((ex) => {
                  const safeExamType =
                    typeof (ex as any)?.exam_type === 'string'
                      ? (ex as any).exam_type
                      : typeof (ex as any)?.exam_type?.name === 'string'
                        ? (ex as any).exam_type.name
                        : 'LGS';

                  return (
                    <option key={ex.id} value={ex.id}>
                      {typeof ex.name === 'string' ? ex.name : 'Sınav'} ({safeExamType})
                    </option>
                  );
                })}
              </select>

              <div className="hidden md:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                {(['overview', 'students', 'classes', 'subjects'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'overview' && 'Genel'}
                    {tab === 'students' && 'Öğrenciler'}
                    {tab === 'classes' && 'Sınıflar'}
                    {tab === 'subjects' && 'Dersler'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="p-4 lg:p-6 space-y-6">
        {/* HERO KPI SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            title="Katılımcı"
            value={String(overall.participantCount || 0)}
            icon={<Users className="w-5 h-5" />}
            color="cyan"
            subtitle="Toplam Öğrenci"
          />
          <KPICard
            title="Ortalama Net"
            value={overall.averageNet ? overall.averageNet.toFixed(2) : '0.00'}
            icon={<Target className="w-5 h-5" />}
            color="indigo"
            subtitle={`Medyan: ${overall.medianNet ? overall.medianNet.toFixed(2) : '0.00'}`}
          />
          <KPICard
            title="En Yüksek"
            value={overall.maxNet ? overall.maxNet.toFixed(2) : '0.00'}
            icon={<Trophy className="w-5 h-5" />}
            color="amber"
            subtitle="Maksimum Net"
          />
          <KPICard
            title="Std. Sapma"
            value={overall.standardDeviation ? overall.standardDeviation.toFixed(2) : '0.00'}
            icon={<Activity className="w-5 h-5" />}
            color="purple"
            subtitle="Dağılım"
          />
          <KPICard
            title="Risk Öğrenci"
            value={String(riskStudents.length || 0)}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
            subtitle="Takip Gerekli"
          />
          <KPICard
            title="Potansiyel"
            value={String(opportunities.length || 0)}
            icon={<Sparkles className="w-5 h-5" />}
            color="teal"
            subtitle="Gelişim Fırsatı"
          />
        </div>

        {/* CORE ANALYTICS ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Histogram */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[color:var(--green-600,#25D366)]" />
              Net Dağılımı (Histogram)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis dataKey="range" tick={{ fill: THEME.textSecondary, fontSize: 12 }} />
                  <YAxis tick={{ fill: THEME.textSecondary, fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: `1px solid ${THEME.border}` }}
                    labelStyle={{ color: THEME.textPrimary }}
                  />
                  <Bar dataKey="count" fill={THEME.primary}>
                    {(histogramData || []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={idx % 2 === 0 ? THEME.primary : THEME.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-[color:var(--green-600,#25D366)]" />
              Leaderboard (Top 25)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="py-2 text-left">#</th>
                    <th className="py-2 text-left">Öğrenci</th>
                    <th className="py-2 text-left">Sınıf</th>
                    <th className="py-2 text-center">Net</th>
                    <th className="py-2 text-center">% Dilim</th>
                    <th className="py-2 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((row) => (
                    <tr key={row.rank} className="border-b border-slate-100">
                      <td className="py-2 font-semibold text-slate-700">{row.rank}</td>
                      <td className="py-2 text-slate-800">{row.name}</td>
                      <td className="py-2 text-slate-600">{row.className}</td>
                      <td className="py-2 text-center font-semibold text-emerald-600">{row.net}</td>
                      <td className="py-2 text-center text-slate-700">{row.percentile}%</td>
                      <td className="py-2 text-center">
                        {row.trend === 'up' && <ArrowUpRight className="inline text-emerald-600 w-4 h-4" />}
                        {row.trend === 'down' && <ArrowDownRight className="inline text-red-500 w-4 h-4" />}
                        {row.trend === 'stable' && <Minus className="inline text-slate-400 w-4 h-4" />}
                        {row.netChange !== undefined && row.netChange !== null && (
                          <span
                            className={`ml-1 text-xs ${
                              row.netChange > 0 ? 'text-emerald-600' : row.netChange < 0 ? 'text-red-500' : 'text-slate-500'
                            }`}
                          >
                            {row.netChange > 0 ? '+' : ''}{Number(row.netChange).toFixed(1)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaderboardData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        Veri bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Percentile Scatter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[color:var(--green-600,#25D366)]" />
              Yüzdelik Haritası (Net vs % Dilim)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                  <XAxis
                    type="number"
                    dataKey="net"
                    name="Net"
                    tick={{ fill: THEME.textSecondary, fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="percentile"
                    name="% Dilim"
                    tick={{ fill: THEME.textSecondary, fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#fff', border: `1px solid ${THEME.border}` }}
                    formatter={(value: any, name: string) => [value, name]}
                  />
                  <Scatter data={percentileScatterData} fill={THEME.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI INSIGHT BANNER */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-cyan-600/10 via-indigo-600/10 to-purple-600/10 border border-cyan-500/20 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-cyan-300 mb-1">AI Analiz Önerisi</p>
                <p className="text-sm text-slate-300">{recommendations[0]?.recommendation || 'Analiz devam ediyor...'}</p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full">
                {recommendations[0]?.priority === 'high' ? 'Öncelikli' : 'Öneri'}
              </span>
            </div>
          </motion.div>
        )}

        {/* MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject Performance Radar */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Ders Bazlı Performans
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={bySubject.map((s: any) => ({
                    subject: (typeof s?.subjectName === 'string' ? s.subjectName : 'Ders').slice(0, 15),
                    net: Number(s?.averageNet || 0),
                    successRate: Number(s?.successRate || 0),
                  }))}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar dataKey="net" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} name="Ortalama Net" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Class Comparison Bar Chart */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                Sınıf Karşılaştırması
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byClass.map((c: any) => ({
                    name: (typeof c?.className === 'string' ? c.className : 'Sınıf').slice(0, 10),
                    net: Number(c?.averageNet || 0),
                    students: Number(c?.studentCount || 0),
                    diff: Number(c?.comparedToSchool || 0),
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: any, name: string) => [
                        typeof value === 'number' ? value.toFixed(2) : String(value),
                        name === 'net' ? 'Ortalama Net' : name
                      ]}
                    />
                    <Bar dataKey="net" name="Ortalama Net" radius={[0, 8, 8, 0]}>
                      {byClass.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={Number(entry?.comparedToSchool || 0) >= 0 ? '#22d3ee' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend Chart */}
            {trends.length > 1 && (
              <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                  Performans Trendi
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends.map((t: any) => ({
                      name: (typeof t?.examName === 'string' ? t.examName : 'Sınav').slice(0, 12),
                      net: Number(t?.averageNet || 0),
                      katilim: Number(t?.participantCount || 0),
                    }))}>
                      <defs>
                        <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="net" stroke="#22d3ee" strokeWidth={2} fill="url(#netGradient)" name="Ortalama Net" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Lists & Stats */}
          <div className="space-y-6">
            {/* Top Performers */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                En Başarılı Öğrenciler
              </h3>
              <div className="space-y-3">
                {filteredStudents.slice(0, 5).map((student, idx) => (
                  <div key={student.studentId} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-slate-600/50 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{student.fullName || 'İsimsiz'}</p>
                      <p className="text-xs text-slate-400">{student.className || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-400">{student.totalNet ? student.totalNet.toFixed(2) : '0.00'}</p>
                      <p className="text-xs text-slate-500">Net</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Students */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Risk Altındaki Öğrenciler
                <span className="ml-auto text-sm font-normal text-slate-400">{riskStudents.length}</span>
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {riskStudents.slice(0, 5).map((risk: any) => (
                  <div key={risk.studentId} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                    <div>
                      <p className="font-medium text-white text-sm">{risk.fullName || 'İsimsiz'}</p>
                      <p className="text-xs text-slate-400">{risk.className || '-'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      risk.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                      risk.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {risk.riskLevel === 'critical' ? 'Kritik' : risk.riskLevel === 'high' ? 'Yüksek' : 'Orta'}
                    </span>
                  </div>
                ))}
                {riskStudents.length === 0 && (
                  <p className="text-center text-slate-500 py-4">Risk altında öğrenci yok</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                İstatistikler
              </h3>
              <div className="space-y-4">
                <StatRow label="Minimum Net" value={(overall.minNet || 0).toFixed(2)} />
                <StatRow label="Maksimum Net" value={(overall.maxNet || 0).toFixed(2)} />
                <StatRow label="Q1 (25%)" value={(overall.q1 || 0).toFixed(2)} />
                <StatRow label="Q3 (75%)" value={(overall.q3 || 0).toFixed(2)} />
                <StatRow label="IQR" value={(overall.iqr || 0).toFixed(2)} />
                <StatRow label="Varyans" value={(overall.variance || 0).toFixed(2)} />
              </div>
            </div>
          </div>
        </div>

        {/* STUDENT TABLE */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Öğrenci Listesi
              <span className="text-sm font-normal text-slate-400 ml-2">({filteredStudents.length} öğrenci)</span>
            </h3>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Öğrenci ara..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => setFilters({ searchQuery: e.target.value })}
                  className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-48"
                />
              </div>

              <select
                value={filters.selectedClasses?.[0] || ''}
                onChange={(e) => setFilters({ selectedClasses: e.target.value ? [e.target.value] : [] })}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm"
              >
                <option value="">Tüm Sınıflar</option>
                {classList.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button onClick={resetFilters} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Sıra</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Öğrenci</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Sınıf</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">D/Y/B</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Net</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Puan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">%'lik</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Trend</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Risk</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.slice(0, 50).map((student: any, idx: number) => (
                  <tr key={student.studentId} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white text-sm">{student.fullName || 'İsimsiz'}</p>
                      <p className="text-xs text-slate-500">{student.studentNo || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{student.className || '-'}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      <span className="text-teal-400">{student.totalCorrect || 0}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-red-400">{student.totalWrong || 0}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-400">{student.totalEmpty || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-cyan-400">{student.totalNet ? student.totalNet.toFixed(2) : '0.00'}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-300">
                      {student.totalScore ? student.totalScore.toFixed(0) : '0'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-indigo-400">{student.percentile || 0}%</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {student.trendDirection === 'up' && <ArrowUpRight className="inline text-teal-400 w-4 h-4" />}
                      {student.trendDirection === 'down' && <ArrowDownRight className="inline text-red-400 w-4 h-4" />}
                      {student.trendDirection === 'stable' && <Minus className="inline text-slate-400 w-4 h-4" />}
                      {student.netChange !== undefined && student.netChange !== null && (
                        <span className={`ml-1 text-xs ${
                          student.netChange > 0 ? 'text-teal-400' : student.netChange < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {student.netChange > 0 ? '+' : ''}{student.netChange.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        student.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                        student.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        student.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        student.riskLevel === 'low' ? 'bg-teal-500/20 text-teal-400' :
                        'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {student.riskLevel === 'critical' && 'Kritik'}
                        {student.riskLevel === 'high' && 'Yüksek'}
                        {student.riskLevel === 'medium' && 'Orta'}
                        {student.riskLevel === 'low' && 'Düşük'}
                        {student.riskLevel === 'none' && 'İyi'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > 50 && (
            <div className="mt-4 text-center text-sm text-slate-400">
              İlk 50 öğrenci gösteriliyor. Daha fazlası için filtreleme yapın.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-500 py-4">
          <p>AkademiHub Exam Intelligence Platform • MEB/ÖSYM Uyumlu • Enterprise Edition</p>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

function KPICard({
  title, value, icon, color, subtitle
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'cyan' | 'indigo' | 'amber' | 'purple' | 'red' | 'teal';
  subtitle?: string;
}) {
  const colorMap = {
    cyan: 'from-[#25D366]/15 to-white border-[#25D366]/40 text-[#128C7E]',
    indigo: 'from-[#34B7F1]/20 to-white border-[#34B7F1]/40 text-[#0f172a]',
    amber: 'from-amber-400/20 to-white border-amber-300/60 text-amber-600',
    purple: 'from-emerald-200/30 to-white border-emerald-200 text-emerald-700',
    red: 'from-red-400/15 to-white border-red-300/50 text-red-600',
    teal: 'from-[#128C7E]/15 to-white border-[#128C7E]/40 text-[#128C7E]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorMap[color].split(' ').slice(0, 2).join(' ')} border ${colorMap[color].split(' ')[2]} rounded-2xl p-4 backdrop-blur`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={colorMap[color].split(' ')[3]}>{icon}</span>
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

// ============================================================================
// STAT ROW COMPONENT
// ============================================================================

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-mono text-sm text-white">{value}</span>
    </div>
  );
}

// ============================================================================
// PAGE EXPORT
// ============================================================================

export default function ExamDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      }
    >
      <ExamDashboardContent />
    </Suspense>
  );
}
