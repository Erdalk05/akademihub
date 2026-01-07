'use client';

import React, { useEffect, useState } from 'react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import {
  Loader2,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// ============================================================================
// KARŞILAŞTIRMALI GRAFİKLER SAYFASI
// Öğrenci vs Sınıf vs Kurum karşılaştırmaları
// ============================================================================

interface ComparisonData {
  label: string;
  student: number;
  classAvg: number;
  orgAvg: number;
}

interface ClassRanking {
  className: string;
  avgNet: number;
  studentCount: number;
  trend: number;
  subjects: { name: string; avg: number }[];
}

interface ExamTrendData {
  examName: string;
  date: string;
  studentNet: number;
  classAvg: number;
  orgAvg: number;
}

export default function ComparisonPage() {
  const { currentOrganization } = useOrganizationStore();
  const [classRankings, setClassRankings] = useState<ClassRanking[]>([]);
  const [examTrends, setExamTrends] = useState<ExamTrendData[]>([]);
  const [subjectComparison, setSubjectComparison] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('org-avg');
  const [compareType, setCompareType] = useState<'class' | 'subject' | 'trend'>('class');

  useEffect(() => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    // Mock data
    const mockClassRankings: ClassRanking[] = [
      {
        className: '8/A',
        avgNet: 72.4,
        studentCount: 28,
        trend: 3.2,
        subjects: [
          { name: 'Türkçe', avg: 15.2 },
          { name: 'Matematik', avg: 12.8 },
          { name: 'Fen', avg: 14.5 },
          { name: 'Sosyal', avg: 8.2 },
          { name: 'İngilizce', avg: 7.8 },
          { name: 'Din', avg: 4.5 },
        ],
      },
      {
        className: '8/B',
        avgNet: 68.9,
        studentCount: 26,
        trend: -1.5,
        subjects: [
          { name: 'Türkçe', avg: 14.5 },
          { name: 'Matematik', avg: 11.2 },
          { name: 'Fen', avg: 13.8 },
          { name: 'Sosyal', avg: 7.8 },
          { name: 'İngilizce', avg: 7.2 },
          { name: 'Din', avg: 4.2 },
        ],
      },
      {
        className: '7/A',
        avgNet: 58.2,
        studentCount: 30,
        trend: 2.8,
        subjects: [
          { name: 'Türkçe', avg: 12.5 },
          { name: 'Matematik', avg: 9.8 },
          { name: 'Fen', avg: 11.2 },
          { name: 'Sosyal', avg: 6.5 },
          { name: 'İngilizce', avg: 6.2 },
          { name: 'Din', avg: 3.8 },
        ],
      },
      {
        className: '7/B',
        avgNet: 55.5,
        studentCount: 28,
        trend: 0.5,
        subjects: [
          { name: 'Türkçe', avg: 11.8 },
          { name: 'Matematik', avg: 9.2 },
          { name: 'Fen', avg: 10.5 },
          { name: 'Sosyal', avg: 6.2 },
          { name: 'İngilizce', avg: 5.8 },
          { name: 'Din', avg: 3.5 },
        ],
      },
    ];

    const mockExamTrends: ExamTrendData[] = [
      { examName: 'LGS #1', date: '2025-10', studentNet: 58, classAvg: 62, orgAvg: 60 },
      { examName: 'LGS #2', date: '2025-11', studentNet: 62, classAvg: 64, orgAvg: 61 },
      { examName: 'LGS #3', date: '2025-12', studentNet: 65, classAvg: 66, orgAvg: 63 },
      { examName: 'LGS #4', date: '2026-01', studentNet: 68, classAvg: 68, orgAvg: 65 },
      { examName: 'LGS #5', date: '2026-01', studentNet: 72.5, classAvg: 70, orgAvg: 67 },
    ];

    const mockSubjectComparison: ComparisonData[] = [
      { label: 'Türkçe', student: 15.5, classAvg: 14.2, orgAvg: 13.8 },
      { label: 'Matematik', student: 12.8, classAvg: 11.5, orgAvg: 10.8 },
      { label: 'Fen', student: 14.2, classAvg: 13.5, orgAvg: 12.5 },
      { label: 'Sosyal', student: 8.5, classAvg: 7.8, orgAvg: 7.2 },
      { label: 'İngilizce', student: 7.5, classAvg: 7.2, orgAvg: 6.8 },
      { label: 'Din', student: 4.5, classAvg: 4.2, orgAvg: 4.0 },
    ];

    setTimeout(() => {
      setClassRankings(mockClassRankings);
      setExamTrends(mockExamTrends);
      setSubjectComparison(mockSubjectComparison);
      setLoading(false);
    }, 500);
  }, [currentOrganization?.id]);

  const radarData = subjectComparison.map((s) => ({
    subject: s.label,
    student: s.student,
    classAvg: s.classAvg,
    orgAvg: s.orgAvg,
    fullMark: 20,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8" />
                <h1 className="text-2xl font-black">Karşılaştırmalı Analiz</h1>
              </div>
              <p className="text-white/80">Öğrenci, sınıf ve kurum bazında performans karşılaştırmaları</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <Download className="w-5 h-5" />
              Rapor İndir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-200 inline-flex gap-1">
          {[
            { id: 'class', label: 'Sınıf Karşılaştırma' },
            { id: 'subject', label: 'Ders Bazlı' },
            { id: 'trend', label: 'Zaman Serisi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCompareType(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                compareType === tab.id
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Class Comparison */}
        {compareType === 'class' && (
          <>
            {/* Class Ranking Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-gray-900">Sınıf Sıralaması</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sıra</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sınıf</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Öğrenci</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ort. Net</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trend</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Türkçe</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Matematik</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Fen</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Sosyal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classRankings.map((cls, index) => (
                      <tr key={cls.className} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0
                                ? 'bg-amber-100 text-amber-700'
                                : index === 1
                                ? 'bg-gray-100 text-gray-700'
                                : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-50 text-gray-500'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">{cls.className}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{cls.studentCount}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{cls.avgNet}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              cls.trend > 0 ? 'text-emerald-600' : cls.trend < 0 ? 'text-red-500' : 'text-gray-500'
                            }`}
                          >
                            {cls.trend > 0 ? <TrendingUp className="w-4 h-4" /> : cls.trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                            {cls.trend > 0 ? '+' : ''}{cls.trend}
                          </span>
                        </td>
                        {cls.subjects.slice(0, 4).map((s) => (
                          <td key={s.name} className="px-4 py-3 text-center text-gray-700">{s.avg}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Class Bar Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-gray-900 mb-4">Sınıf Bazlı Net Karşılaştırma</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classRankings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="className" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="avgNet" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Subject Comparison */}
        {compareType === 'subject' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-gray-900 mb-4">Ders Bazlı Radar</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 10 }} />
                    <Radar name="Öğrenci" dataKey="student" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Radar name="Sınıf Ort." dataKey="classAvg" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                    <Radar name="Kurum Ort." dataKey="orgAvg" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-gray-900 mb-4">Ders Bazlı Karşılaştırma</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="student" name="Öğrenci" fill="#10B981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="classAvg" name="Sınıf" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="orgAvg" name="Kurum" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Trend Comparison */}
        {compareType === 'trend' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="font-bold text-gray-900 mb-4">Zaman Serisi Karşılaştırma</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={examTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="examName" tick={{ fontSize: 11 }} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="studentNet"
                    name="Öğrenci"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="classAvg"
                    name="Sınıf Ort."
                    stroke="#3B82F6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#3B82F6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orgAvg"
                    name="Kurum Ort."
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ fill: '#F59E0B', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

