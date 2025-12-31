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
  UserCheck,
  BarChart2,
  Lightbulb,
  CheckCircle,
  Info,
  AlertOctagon,
  AlertTriangle as TriangleAlert,
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
  const [trendWindow, setTrendWindow] = useState<number>(5);
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
        if (trendWindow > 0) params.set('trendWindow', String(trendWindow));

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
  }, [selectedExamId, gradeLevel, compareWith, trendWindow]);

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

  const trendChartData = data.trends?.lastExams.map(point => ({
    name: point.examName.length > 15 ? point.examName.slice(0, 15) + '...' : point.examName,
    net: point.averageNet,
    date: new Date(point.examDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
  })) || [];

  const segmentCounts = data.studentSegments
    ? {
        LOW: data.studentSegments.filter(s => s.segment === 'LOW').length,
        MID: data.studentSegments.filter(s => s.segment === 'MID').length,
        HIGH: data.studentSegments.filter(s => s.segment === 'HIGH').length,
      }
    : null;

  const segmentChartData = segmentCounts
    ? [
        { name: 'Düşük Risk', value: segmentCounts.HIGH, fill: '#10b981' },
        { name: 'Orta Performans', value: segmentCounts.MID, fill: '#3b82f6' },
        { name: 'Yüksek Risk', value: segmentCounts.LOW, fill: '#ef4444' },
      ]
    : [];

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
        {/* BLOCK 0 - SMART INSIGHTS (V2.3) */}
        {data.insights && data.insights.length > 0 && (
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">Akıllı Özet</h3>
            </div>
            
            <div className="space-y-3">
              {data.insights.map((insight, idx) => {
                const levelConfig = {
                  WARNING: { icon: AlertCircle, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-800', iconColor: 'text-amber-600' },
                  POSITIVE: { icon: CheckCircle, bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-800', iconColor: 'text-emerald-600' },
                  INFO: { icon: Info, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800', iconColor: 'text-blue-600' },
                };
                
                const config = levelConfig[insight.level];
                const Icon = config.icon;
                
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                    <p className={`text-sm font-medium ${config.textColor}`}>
                      {insight.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.insights && data.insights.length === 0 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-600">Akıllı Özet</h3>
            </div>
            <p className="text-sm text-slate-500">Bu sınav için anlamlı bir sapma tespit edilmedi.</p>
          </div>
        )}

        {/* BLOCK 0.1 - STUDENT INTERVENTIONS (V3) */}
        {data.studentInterventions && data.studentInterventions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-slate-800">Müdahale Gerektiren Öğrenciler</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600">Öğrenci</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600">Sınıf</th>
                    <th className="text-center py-2 px-3 text-sm font-semibold text-slate-600">Öncelik</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentInterventions.map((intervention, idx) => {
                    const priorityConfig = {
                      HIGH: { label: 'Yüksek', bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' },
                      MEDIUM: { label: 'Orta', bgColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300' },
                      LOW: { label: 'Düşük', bgColor: 'bg-slate-100', textColor: 'text-slate-700', borderColor: 'border-slate-300' },
                    }[intervention.priority];

                    return (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-3 text-sm font-medium text-slate-800">
                          {intervention.fullName}
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-600">
                          {intervention.className}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}>
                            {priorityConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-700">
                          {intervention.summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.studentInterventions && data.studentInterventions.length === 0 && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-800">Müdahale Gerektiren Öğrenciler</h3>
            </div>
            <p className="text-sm text-emerald-700">Bu sınav için öğrenci bazlı müdahale gerekmemektedir.</p>
          </div>
        )}

        {/* BLOCK 0.2 - CLASS INTERVENTIONS (V3) */}
        {data.classInterventions && data.classInterventions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TriangleAlert className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-800">Müdahale Gerektiren Sınıflar</h3>
            </div>
            
            <div className="space-y-3">
              {data.classInterventions.map((intervention, idx) => {
                const priorityConfig = {
                  HIGH: { bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-800', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
                  MEDIUM: { bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-800', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' },
                  LOW: { bgColor: 'bg-slate-50', borderColor: 'border-slate-300', textColor: 'text-slate-800', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700' },
                }[intervention.priority];

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${priorityConfig.bgColor} ${priorityConfig.borderColor}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg text-slate-800">
                            {intervention.className}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${priorityConfig.badgeBg} ${priorityConfig.badgeText}`}>
                            {intervention.priority === 'HIGH' ? 'Yüksek Öncelik' : intervention.priority === 'MEDIUM' ? 'Orta Öncelik' : 'Düşük Öncelik'}
                          </span>
                        </div>
                        <p className={`text-sm font-medium ${priorityConfig.textColor}`}>
                          {intervention.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.classInterventions && data.classInterventions.length === 0 && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-800">Müdahale Gerektiren Sınıflar</h3>
            </div>
            <p className="text-sm text-emerald-700">Bu sınav için sınıf bazlı müdahale gerekmemektedir.</p>
          </div>
        )}

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

        {/* BLOCK 2.5 - TIME DIMENSION (V2.1) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Zaman İçinde Gidişat</h3>
          {trendChartData.length > 1 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} Net`, 'Ortalama']}
                    labelFormatter={(label) => `Sınav: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    name="Ortalama Net" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Trend için yeterli sınav yok</p>
                <p className="text-slate-400 text-xs mt-1">En az 2 sınav gereklidir</p>
              </div>
            </div>
          )}
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

        {/* BLOCK 4 - RISK SEGMENTATION (V2.2) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-800">Öğrenci Segmentasyonu</h3>
          </div>
          
          {segmentChartData.length > 0 ? (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600">{segmentCounts!.HIGH}</div>
                  <div className="text-sm text-emerald-700 font-medium mt-1">Düşük Risk</div>
                  <div className="text-xs text-emerald-600 mt-1">Top %20</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{segmentCounts!.MID}</div>
                  <div className="text-sm text-blue-700 font-medium mt-1">Orta Performans</div>
                  <div className="text-xs text-blue-600 mt-1">Middle %60</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="text-3xl font-bold text-red-600">{segmentCounts!.LOW}</div>
                  <div className="text-sm text-red-700 font-medium mt-1">Yüksek Risk</div>
                  <div className="text-xs text-red-600 mt-1">Bottom %20</div>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Öğrenci Sayısı" radius={[8, 8, 0, 0]}>
                      {segmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Segmentasyon için yeterli öğrenci yok</p>
                <p className="text-slate-400 text-xs mt-1">En az 5 öğrenci gereklidir</p>
              </div>
            </div>
          )}
        </div>

        {/* BLOCK 5 - CLASS DISTRIBUTION (V2.2) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-800">Sınıf İçi Dağılım</h3>
          </div>
          
          {data.classDistributions && data.classDistributions.length > 0 ? (
            <div className="space-y-6">
              {data.classDistributions.map((cls) => (
                <div key={cls.className} className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-700 mb-3">{cls.className}</h4>
                  
                  <div className="relative h-16">
                    {/* Box plot approximation */}
                    <div className="absolute top-0 left-0 right-0 h-full flex items-center">
                      {/* Background scale */}
                      <div className="w-full h-8 bg-slate-100 rounded-lg relative">
                        {/* Min to Max range */}
                        <div
                          className="absolute h-full bg-blue-200 rounded-lg"
                          style={{
                            left: `${(cls.minNet / (cls.maxNet || 1)) * 100}%`,
                            width: `${((cls.maxNet - cls.minNet) / (cls.maxNet || 1)) * 100}%`,
                          }}
                        />
                        {/* Q1 to Q3 (IQR) */}
                        <div
                          className="absolute h-full bg-blue-500 rounded-lg"
                          style={{
                            left: `${(cls.q1 / (cls.maxNet || 1)) * 100}%`,
                            width: `${((cls.q3 - cls.q1) / (cls.maxNet || 1)) * 100}%`,
                          }}
                        />
                        {/* Median line */}
                        <div
                          className="absolute h-full w-1 bg-white"
                          style={{
                            left: `${(cls.median / (cls.maxNet || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 mt-3 text-xs">
                    <div className="text-center">
                      <div className="text-slate-500">Min</div>
                      <div className="font-semibold text-slate-700">{cls.minNet.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500">Q1</div>
                      <div className="font-semibold text-slate-700">{cls.q1.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500">Medyan</div>
                      <div className="font-semibold text-blue-600">{cls.median.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500">Q3</div>
                      <div className="font-semibold text-slate-700">{cls.q3.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500">Max</div>
                      <div className="font-semibold text-slate-700">{cls.maxNet.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Dağılım analizi için yeterli veri yok</p>
                <p className="text-slate-400 text-xs mt-1">Her sınıfta en az 5 öğrenci gereklidir</p>
              </div>
            </div>
          )}
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

