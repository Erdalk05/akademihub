'use client';

/**
 * Dashboard V2 - Exam-Based Analytics
 * 
 * Scalable exam-focused dashboard for 20+ exams/year.
 * Does NOT replace existing dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart,
  Bar,
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
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertCircle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import type { ExamDashboardResponse } from '@/types/exam-dashboard';
import { useOrganizationStore } from '@/lib/store/organizationStore';

export default function DashboardV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrganization } = useOrganizationStore();

  const [data, setData] = useState<ExamDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('8');
  const [compareWith, setCompareWith] = useState<'previous' | 'average' | ''>('');
  const [availableExams, setAvailableExams] = useState<Array<{ id: string; name: string; date: string }>>([]);

  // ========================================================================
  // FETCH AVAILABLE EXAMS
  // ========================================================================
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const fetchExams = async () => {
      try {
        const params = new URLSearchParams();
        params.set('organizationId', currentOrganization.id);
        params.set('limit', '50');

        const response = await fetch(`/api/akademik-analiz/exams?${params.toString()}`);
        const result = await response.json();

        if (response.ok && result.exams) {
          setAvailableExams(
            result.exams.map((e: any) => ({
              id: e.id,
              name: e.name,
              date: e.exam_date || '',
            }))
          );

          // Auto-select first exam if none selected
          if (!selectedExamId && result.exams.length > 0) {
            setSelectedExamId(result.exams[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch exams:', err);
      }
    };

    fetchExams();
  }, [currentOrganization?.id, selectedExamId]);

  // ========================================================================
  // FETCH EXAM ANALYTICS
  // ========================================================================
  useEffect(() => {
    if (!selectedExamId || !gradeLevel) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('examId', selectedExamId);
        params.set('gradeLevel', gradeLevel);
        if (compareWith) params.set('compareWith', compareWith);

        const response = await fetch(`/api/v2/exam-analytics?${params.toString()}`);
        const result = await response.json();

        if (response.ok) {
          setData(result);
        } else {
          setError(result.error || 'Failed to load analytics');
        }
      } catch (err) {
        console.error('Analytics error:', err);
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedExamId, gradeLevel, compareWith]);

  // ========================================================================
  // RENDER: LOADING
  // ========================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Analiz yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER: ERROR
  // ========================================================================
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Analiz Yüklenemedi</h2>
          <p className="text-slate-600">{error || 'Bir hata oluştu'}</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // DATA TRANSFORMATIONS FOR CHARTS
  // ========================================================================
  const classChartData = data.classByClass.map(cls => ({
    name: cls.className,
    net: cls.averageNet,
    score: cls.averageScore,
  }));

  const subjectRadarData = data.subjectBySubject.map(subj => ({
    subject: subj.subjectName,
    value: subj.successRate,
  }));

  // ========================================================================
  // RENDER: MAIN DASHBOARD
  // ========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20">
      {/* TOP BAR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sınav Analiz Dashboard V2</h1>
              <p className="text-sm text-slate-500">Sınav bazlı detaylı performans analizi</p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Sınav Seç</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 border-0 rounded-lg text-sm font-medium"
              >
                {availableExams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({new Date(exam.date).toLocaleDateString('tr-TR')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sınıf Seviyesi</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="px-3 py-2 bg-slate-100 border-0 rounded-lg text-sm font-medium"
              >
                {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                  <option key={grade} value={String(grade)}>{grade}. Sınıf</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Karşılaştır</label>
              <select
                value={compareWith}
                onChange={(e) => setCompareWith(e.target.value as any)}
                className="px-3 py-2 bg-slate-100 border-0 rounded-lg text-sm font-medium"
              >
                <option value="">Karşılaştırma Yok</option>
                <option value="previous">Önceki Sınav</option>
                <option value="average">Ortalama</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* BLOCK 1 - EXAM SUMMARY KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Katılımcı</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{data.summary.totalParticipants}</p>
            {data.summary.deltaParticipants !== null && (
              <p className="text-sm text-slate-500 mt-1">
                {data.summary.deltaParticipants > 0 ? '+' : ''}{data.summary.deltaParticipants} fark
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Ortalama Net</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{data.summary.averageNet}</p>
            {data.summary.deltaAverageNet !== null && (
              <div className="flex items-center gap-1 mt-1">
                {data.summary.deltaAverageNet > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${data.summary.deltaAverageNet > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.summary.deltaAverageNet > 0 ? '+' : ''}{data.summary.deltaAverageNet}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">En Güçlü</span>
            </div>
            {data.summary.strongestSubject ? (
              <>
                <p className="text-lg font-bold text-slate-800">{data.summary.strongestSubject.name}</p>
                <p className="text-sm text-slate-500">{data.summary.strongestSubject.average} net</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Veri yok</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">En Zayıf</span>
            </div>
            {data.summary.weakestSubject ? (
              <>
                <p className="text-lg font-bold text-slate-800">{data.summary.weakestSubject.name}</p>
                <p className="text-sm text-slate-500">{data.summary.weakestSubject.average} net</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Veri yok</p>
            )}
          </div>
        </div>

        {/* BLOCK 2 - CLASS COMPARISON */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Sınıf Karşılaştırması</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="net" name="Ortalama Net" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BLOCK 3 - SUBJECT PERFORMANCE */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Ders Bazlı Performans</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={subjectRadarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Radar name="Başarı Oranı (%)" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* METADATA */}
        <div className="text-center text-xs text-slate-400">
          <p>Son hesaplama: {new Date(data.meta.calculatedAt).toLocaleString('tr-TR')}</p>
          <p>Veri kaynağı: {data.meta.dataSource}</p>
        </div>
      </div>
    </div>
  );
}

