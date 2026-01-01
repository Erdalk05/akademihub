'use client';

/**
 * AkademiHub Exam Intelligence Dashboard
 * Türkiye'nin en gelişmiş sınav analiz platformu
 */

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  LayoutGrid,
  BarChart2,
  Activity,
  Layers,
  Eye,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  GraduationCap,
  BookOpen,
  Brain,
  Sparkles,
  FileText,
  Send,
  Menu,
  X,
} from 'lucide-react';
import { useExamIntelligenceStore } from '@/lib/store/examIntelligenceStore';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import type {
  ExamIntelligenceResponse,
  StudentResult,
  RiskLevel,
  ViewMode,
} from '@/types/exam-intelligence';

// ============================================================================
// COLOR SCHEMES
// ============================================================================

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#eab308',
  low: '#22c55e',
  none: '#3b82f6',
};

const SUBJECT_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#22c55e', // Green
  '#06b6d4', // Cyan
];

// ============================================================================
// MAIN DASHBOARD CONTENT
// ============================================================================

function ExamDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  const { currentOrganization } = useOrganizationStore();
  const {
    examData,
    isLoading,
    error,
    viewMode,
    filters,
    sidebarOpen,
    selectedStudentId,
    setExamData,
    setLoading,
    setError,
    setViewMode,
    setFilters,
    resetFilters,
    setSidebarOpen,
    setSelectedStudentId,
    getFilteredStudents,
    getClassList,
  } = useExamIntelligenceStore();

  const [exams, setExams] = useState<Array<{ id: string; name: string; exam_date: string }>>([]);
  const [selectedExam, setSelectedExam] = useState<string>(examId || '');

  // ========================================================================
  // FETCH EXAMS LIST
  // ========================================================================

  useEffect(() => {
    const fetchExams = async () => {
      if (!currentOrganization?.id) return;

      try {
        const res = await fetch(`/api/akademik-analiz/exams?organizationId=${currentOrganization.id}`);
        const data = await res.json();
        if (data?.exams) {
          setExams(data.exams);
          if (!selectedExam && (data.exams?.length ?? 0) > 0) {
            setSelectedExam(data.exams[0].id);
          }
        }
      } catch (err) {
        console.error('Sınavlar yüklenemedi:', err);
      }
    };

    fetchExams();
  }, [currentOrganization?.id]);

  // ========================================================================
  // FETCH EXAM DATA
  // ========================================================================

  useEffect(() => {
    const fetchData = async () => {
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
              depth: 'detailed',
            },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Veri yüklenemedi');
        }

        setExamData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedExam]);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const filteredStudents = useMemo(() => getFilteredStudents(), [examData, filters]);
  const classList = useMemo(() => getClassList(), [examData]);

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-slate-400 text-lg">Analiz yükleniyor...</p>
          <p className="text-slate-500 text-sm mt-2">Veriler işleniyor, lütfen bekleyin</p>
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
        <div className="bg-slate-800/50 backdrop-blur border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Hata Oluştu</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
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
          <GraduationCap className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Sınav Seçin</h2>
          <p className="text-slate-400 mb-8">Analiz görüntülemek için bir sınav seçin</p>

          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Sınav Seçin...</option>
            {(exams ?? []).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} - {new Date(ex.exam_date).toLocaleDateString('tr-TR')}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  const { exam, statistics, insights } = examData;
  
  // Safe destructuring with defaults to prevent runtime crashes
  const overall = statistics?.overall;
  const byClass = statistics?.byClass ?? [];
  const bySubject = statistics?.bySubject ?? [];
  const trends = statistics?.trends ?? [];
  const riskStudents = insights?.riskStudents ?? [];
  const opportunities = insights?.opportunities ?? [];
  const recommendations = insights?.recommendations ?? [];

  // Guard: if overall statistics are missing, show empty state
  if (!overall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/50 backdrop-blur border border-amber-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Veri Eksik</h2>
          <p className="text-slate-400 mb-6">Bu sınav için istatistikler henüz hesaplanmamış.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            Yenile
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER MAIN DASHBOARD
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Brain className="text-emerald-500" size={24} />
                  Exam Intelligence
                </h1>
                <p className="text-sm text-slate-400">{currentOrganization?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Exam Selector */}
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500"
              >
                {(exams ?? []).map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-800 rounded-lg p-1">
                {(['grid', 'statistical', 'heatmap'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'grid' && 'Tablo'}
                    {mode === 'statistical' && 'İstatistik'}
                    {mode === 'heatmap' && 'Isı Haritası'}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="p-6 space-y-6">
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPICard
            title="Katılımcı"
            value={overall.participantCount}
            icon={<Users className="text-blue-400" size={20} />}
            color="blue"
          />
          <KPICard
            title="Ortalama Net"
            value={overall.averageNet.toFixed(1)}
            icon={<Target className="text-emerald-400" size={20} />}
            color="emerald"
            subtitle={`Medyan: ${overall.medianNet.toFixed(1)}`}
          />
          <KPICard
            title="Std. Sapma"
            value={overall.standardDeviation.toFixed(2)}
            icon={<Activity className="text-purple-400" size={20} />}
            color="purple"
          />
          <KPICard
            title="En Yüksek"
            value={overall.maxNet.toFixed(1)}
            icon={<Award className="text-amber-400" size={20} />}
            color="amber"
          />
          <KPICard
            title="Risk Öğrenci"
            value={riskStudents?.length ?? 0}
            icon={<AlertTriangle className="text-red-400" size={20} />}
            color="red"
          />
          <KPICard
            title="Potansiyel"
            value={opportunities?.length ?? 0}
            icon={<Sparkles className="text-cyan-400" size={20} />}
            color="cyan"
          />
        </div>

        {/* INSIGHTS BANNER */}
        {(recommendations?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <Brain className="text-amber-400 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-medium text-amber-300 mb-1">AI Önerisi</p>
                <p className="text-sm text-slate-300">
                  {recommendations[0]?.recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: TREND + CLASS COMPARISON */}
          <div className="lg:col-span-2 space-y-6">
            {/* TREND CHART */}
            {(trends?.length ?? 0) > 1 && (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" size={20} />
                  Performans Trendi
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="examName"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(v) => v.slice(0, 10)}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageNet"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5 }}
                        name="Ortalama Net"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CLASS COMPARISON */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="text-blue-400" size={20} />
                Sınıf Karşılaştırması
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byClass} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis type="category" dataKey="className" tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="averageNet" name="Ortalama Net" radius={[0, 8, 8, 0]}>
                      {(byClass ?? []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.comparedToSchool >= 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT: SUBJECT RADAR + RISK LIST */}
          <div className="space-y-6">
            {/* SUBJECT RADAR */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="text-purple-400" size={20} />
                Ders Profili
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={bySubject}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subjectName" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar
                      dataKey="successRate"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                      name="Başarı %"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RISK STUDENTS */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={20} />
                Risk Öğrencileri
                <span className="ml-auto text-sm font-normal text-slate-400">
                  {riskStudents?.length ?? 0} öğrenci
                </span>
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(riskStudents ?? []).slice(0, 5).map((risk) => (
                  <div
                    key={risk.studentId}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">{risk.fullName}</p>
                      <p className="text-xs text-slate-400">{risk.className}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        risk.riskLevel === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {risk.riskLevel === 'critical' ? 'Kritik' : 'Yüksek'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* STUDENT TABLE */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="text-blue-400" size={20} />
              Öğrenci Listesi
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({filteredStudents?.length ?? 0} öğrenci)
              </span>
            </h3>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Öğrenci ara..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ searchQuery: e.target.value })}
                  className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Class Filter */}
              <select
                value={filters.selectedClasses?.[0] || ''}
                onChange={(e) =>
                  setFilters({
                    selectedClasses: e.target.value ? [e.target.value] : [],
                  })
                }
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="">Tüm Sınıflar</option>
                {(classList ?? []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Sıra</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Öğrenci</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Sınıf</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Net</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Puan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Yüzdelik</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Trend</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Risk</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Detay</th>
                </tr>
              </thead>
              <tbody>
                {(filteredStudents ?? []).slice(0, 50).map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white text-sm">{student.fullName}</p>
                      <p className="text-xs text-slate-500">{student.studentNo}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{student.className}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-emerald-400">{student.totalNet.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-300">
                      {student.totalScore.toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-blue-400">{student.percentile}%</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {student.trendDirection === 'up' && (
                        <ArrowUpRight className="inline text-emerald-400" size={18} />
                      )}
                      {student.trendDirection === 'down' && (
                        <ArrowDownRight className="inline text-red-400" size={18} />
                      )}
                      {student.trendDirection === 'stable' && (
                        <Minus className="inline text-slate-400" size={18} />
                      )}
                      {student.netChange !== undefined && (
                        <span
                          className={`ml-1 text-xs ${
                            student.netChange > 0 ? 'text-emerald-400' : student.netChange < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}
                        >
                          {student.netChange > 0 ? '+' : ''}
                          {student.netChange.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          student.riskLevel === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : student.riskLevel === 'high'
                            ? 'bg-orange-500/20 text-orange-400'
                            : student.riskLevel === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : student.riskLevel === 'low'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {student.riskLevel === 'critical' && 'Kritik'}
                        {student.riskLevel === 'high' && 'Yüksek'}
                        {student.riskLevel === 'medium' && 'Orta'}
                        {student.riskLevel === 'low' && 'Düşük'}
                        {student.riskLevel === 'none' && 'İyi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedStudentId(student.studentId)}
                        className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(filteredStudents?.length ?? 0) > 50 && (
            <div className="mt-4 text-center text-sm text-slate-400">
              İlk 50 öğrenci gösteriliyor. Daha fazlası için filtreleme yapın.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

function KPICard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

// ============================================================================
// PAGE EXPORT WITH SUSPENSE
// ============================================================================

export default function ExamDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ExamDashboardContent />
    </Suspense>
  );
}

