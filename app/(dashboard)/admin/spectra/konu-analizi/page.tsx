'use client';

import React, { useEffect, useState } from 'react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import {
  Loader2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

// ============================================================================
// KONU BAZLI ANALİZ SAYFASI
// Her dersin konu bazlı başarı oranları ve zayıf konular
// ============================================================================

interface TopicData {
  subject: string;
  topic: string;
  mastery: number; // 0-100
  questionCount: number;
  correctRate: number;
  wrongRate: number;
  trend: 'up' | 'down' | 'stable';
  studentCount: number;
}

interface SubjectSummary {
  subject: string;
  color: string;
  avgMastery: number;
  topicCount: number;
  weakTopics: number;
  strongTopics: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Türkçe': '#3B82F6',
  'Matematik': '#EF4444',
  'Fen Bilimleri': '#22C55E',
  'Sosyal Bilgiler': '#F59E0B',
  'İngilizce': '#8B5CF6',
  'Din Kültürü': '#EC4899',
};

export default function TopicAnalysisPage() {
  const { currentOrganization } = useOrganizationStore();
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    // Mock data
    const mockTopics: TopicData[] = [
      // Matematik
      { subject: 'Matematik', topic: 'Denklemler', mastery: 78, questionCount: 45, correctRate: 72, wrongRate: 18, trend: 'up', studentCount: 85 },
      { subject: 'Matematik', topic: 'Geometri', mastery: 65, questionCount: 38, correctRate: 58, wrongRate: 28, trend: 'down', studentCount: 85 },
      { subject: 'Matematik', topic: 'Olasılık', mastery: 42, questionCount: 22, correctRate: 38, wrongRate: 42, trend: 'down', studentCount: 85 },
      { subject: 'Matematik', topic: 'Sayılar', mastery: 85, questionCount: 52, correctRate: 82, wrongRate: 12, trend: 'up', studentCount: 85 },
      { subject: 'Matematik', topic: 'Fonksiyonlar', mastery: 58, questionCount: 30, correctRate: 52, wrongRate: 32, trend: 'stable', studentCount: 85 },
      // Türkçe
      { subject: 'Türkçe', topic: 'Paragraf', mastery: 72, questionCount: 60, correctRate: 68, wrongRate: 22, trend: 'up', studentCount: 85 },
      { subject: 'Türkçe', topic: 'Dil Bilgisi', mastery: 55, questionCount: 48, correctRate: 48, wrongRate: 35, trend: 'down', studentCount: 85 },
      { subject: 'Türkçe', topic: 'Anlam Bilgisi', mastery: 68, questionCount: 35, correctRate: 62, wrongRate: 25, trend: 'stable', studentCount: 85 },
      { subject: 'Türkçe', topic: 'Yazım Kuralları', mastery: 45, questionCount: 20, correctRate: 40, wrongRate: 40, trend: 'down', studentCount: 85 },
      // Fen Bilimleri
      { subject: 'Fen Bilimleri', topic: 'Fizik', mastery: 62, questionCount: 42, correctRate: 55, wrongRate: 30, trend: 'up', studentCount: 85 },
      { subject: 'Fen Bilimleri', topic: 'Kimya', mastery: 70, questionCount: 38, correctRate: 65, wrongRate: 22, trend: 'up', studentCount: 85 },
      { subject: 'Fen Bilimleri', topic: 'Biyoloji', mastery: 75, questionCount: 40, correctRate: 70, wrongRate: 18, trend: 'stable', studentCount: 85 },
      // Sosyal Bilgiler
      { subject: 'Sosyal Bilgiler', topic: 'Tarih', mastery: 68, questionCount: 35, correctRate: 62, wrongRate: 25, trend: 'up', studentCount: 85 },
      { subject: 'Sosyal Bilgiler', topic: 'Coğrafya', mastery: 55, questionCount: 30, correctRate: 48, wrongRate: 35, trend: 'down', studentCount: 85 },
      { subject: 'Sosyal Bilgiler', topic: 'Vatandaşlık', mastery: 72, questionCount: 25, correctRate: 68, wrongRate: 20, trend: 'stable', studentCount: 85 },
    ];

    // Ders özetleri hesapla
    const subjectGroups = new Map<string, TopicData[]>();
    mockTopics.forEach((t) => {
      if (!subjectGroups.has(t.subject)) subjectGroups.set(t.subject, []);
      subjectGroups.get(t.subject)!.push(t);
    });

    const summaries: SubjectSummary[] = [];
    subjectGroups.forEach((topics, subject) => {
      const avgMastery = topics.reduce((sum, t) => sum + t.mastery, 0) / topics.length;
      summaries.push({
        subject,
        color: SUBJECT_COLORS[subject] || '#6B7280',
        avgMastery: Math.round(avgMastery),
        topicCount: topics.length,
        weakTopics: topics.filter((t) => t.mastery < 50).length,
        strongTopics: topics.filter((t) => t.mastery >= 70).length,
      });
    });

    setTimeout(() => {
      setTopics(mockTopics);
      setSubjects(summaries.sort((a, b) => b.avgMastery - a.avgMastery));
      setLoading(false);
    }, 500);
  }, [currentOrganization?.id]);

  const filteredTopics = selectedSubject === 'all'
    ? topics
    : topics.filter((t) => t.subject === selectedSubject);

  const radarData = subjects.map((s) => ({
    subject: s.subject,
    mastery: s.avgMastery,
    fullMark: 100,
  }));

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 70) return '#22C55E';
    if (mastery >= 50) return '#F59E0B';
    return '#EF4444';
  };

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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-black">Konu Bazlı Analiz</h1>
          </div>
          <p className="text-white/80">Ders ve konu bazında başarı oranları ve zayıf alan tespiti</p>
        </div>

        {/* Subject Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.subject}
              onClick={() => setSelectedSubject(subject.subject === selectedSubject ? 'all' : subject.subject)}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
                selectedSubject === subject.subject
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                <span className="text-xs font-medium text-gray-700 truncate">{subject.subject}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: getMasteryColor(subject.avgMastery) }}>
                %{subject.avgMastery}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="text-emerald-600">✓{subject.strongTopics}</span>
                <span className="text-red-500">✗{subject.weakTopics}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="font-bold text-gray-900 mb-4">Ders Bazlı Genel Görünüm</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Başarı"
                    dataKey="mastery"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="font-bold text-gray-900 mb-4">
              {selectedSubject === 'all' ? 'Tüm Konular' : `${selectedSubject} Konuları`}
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredTopics.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    width={100}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="mastery" radius={[0, 4, 4, 0]}>
                    {filteredTopics.slice(0, 10).map((entry, index) => (
                      <Cell key={index} fill={getMasteryColor(entry.mastery)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Topic Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <h2 className="font-bold text-gray-900">Konu Detayları</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">Tüm Dersler</option>
                {subjects.map((s) => (
                  <option key={s.subject} value={s.subject}>{s.subject}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Konu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Başarı</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Doğru %</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Yanlış %</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Soru</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trend</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTopics
                  .sort((a, b) => a.mastery - b.mastery) // En zayıflar üstte
                  .map((topic, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: SUBJECT_COLORS[topic.subject] }}
                          />
                          <span className="text-sm text-gray-700">{topic.subject}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{topic.topic}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="font-bold"
                          style={{ color: getMasteryColor(topic.mastery) }}
                        >
                          %{topic.mastery}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-medium">
                        {topic.correctRate}%
                      </td>
                      <td className="px-4 py-3 text-center text-red-500 font-medium">
                        {topic.wrongRate}%
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{topic.questionCount}</td>
                      <td className="px-4 py-3 text-center">
                        {topic.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : topic.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {topic.mastery >= 70 ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : topic.mastery < 50 ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

