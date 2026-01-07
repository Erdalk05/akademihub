'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  UserCheck,
  UserX,
  Target,
  Percent,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

// ============================================
// SPECTRA - SINAV DETAY SAYFASI
// ============================================

interface Participant {
  id: string;
  name: string;
  class: string;
  isAsil: boolean;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  score: number;
  rank: number;
}

interface ClassStats {
  name: string;
  avgNet: number;
  studentCount: number;
  topNet: number;
}

interface ExamDetail {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  grade_level: string;
  total_questions: number;
  participant_count: number;
  avg_net: number;
  statistics: {
    avgNet: number;
    medianNet: number;
    stdDev: number;
    maxNet: number;
    minNet: number;
    asilCount: number;
    misafirCount: number;
  };
  participants: Participant[];
  classStats: ClassStats[];
}

export default function SpectraExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  const examId = params.examId as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'asil' | 'misafir'>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'net' | 'name'>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrganization?.id || !examId) {
      setLoading(false);
      return;
    }

    // TODO: Gerçek API bağlantısı yapılacak
    // Şimdilik mock data
    const mockParticipants: Participant[] = Array.from({ length: 25 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Öğrenci ${i + 1}`,
      class: ['8/A', '8/B', '8/C'][i % 3],
      isAsil: i < 20,
      correct: Math.floor(Math.random() * 60) + 30,
      wrong: Math.floor(Math.random() * 20) + 5,
      empty: Math.floor(Math.random() * 10),
      net: parseFloat((Math.random() * 40 + 40).toFixed(1)),
      score: parseFloat((Math.random() * 200 + 300).toFixed(1)),
      rank: i + 1,
    })).sort((a, b) => b.net - a.net).map((p, i) => ({ ...p, rank: i + 1 }));

    const mockExam: ExamDetail = {
      id: examId,
      name: 'LGS Deneme #5',
      exam_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      exam_type: 'LGS',
      grade_level: '8',
      total_questions: 90,
      participant_count: mockParticipants.length,
      avg_net: parseFloat((mockParticipants.reduce((a, b) => a + b.net, 0) / mockParticipants.length).toFixed(1)),
      statistics: {
        avgNet: 68.4,
        medianNet: 67.2,
        stdDev: 12.3,
        maxNet: 85.5,
        minNet: 32.1,
        asilCount: 20,
        misafirCount: 5,
      },
      participants: mockParticipants,
      classStats: [
        { name: '8/A', avgNet: 72.4, studentCount: 9, topNet: 85.5 },
        { name: '8/B', avgNet: 65.8, studentCount: 8, topNet: 78.2 },
        { name: '8/C', avgNet: 63.1, studentCount: 8, topNet: 75.6 },
      ],
    };

    setTimeout(() => {
      setExam(mockExam);
      setLoading(false);
    }, 400);
  }, [currentOrganization?.id, examId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredParticipants = exam?.participants.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'asil' && p.isAsil) ||
      (filterType === 'misafir' && !p.isAsil);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'rank') cmp = a.rank - b.rank;
    else if (sortBy === 'net') cmp = b.net - a.net;
    else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    return sortDir === 'asc' ? cmp : -cmp;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sınav Bulunamadı</h2>
        <p className="text-gray-500 mb-4">Bu sınav mevcut değil veya silinmiş olabilir.</p>
        <Link
          href="/admin/spectra/sinavlar"
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          Sınavlara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900">{exam.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(exam.exam_date)}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                {exam.exam_type}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* ÜST İSTATİSTİK KARTLARI */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Katılımcı</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{exam.participant_count}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Ort. Net</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{exam.statistics.avgNet}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">En Yüksek</span>
            </div>
            <p className="text-2xl font-black text-blue-600">{exam.statistics.maxNet}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">En Düşük</span>
            </div>
            <p className="text-2xl font-black text-amber-600">{exam.statistics.minNet}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Asil</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{exam.statistics.asilCount}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Misafir</span>
            </div>
            <p className="text-2xl font-black text-orange-500">{exam.statistics.misafirCount}</p>
          </div>
        </div>

        {/* ============================================ */}
        {/* SINIF KARŞILAŞTIRMA */}
        {/* ============================================ */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Sınıf Karşılaştırma
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exam.classStats.map((cls, idx) => (
              <div
                key={cls.name}
                className={`p-4 rounded-xl border-2 ${
                  idx === 0 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">{cls.name}</span>
                  {idx === 0 && <Award className="w-5 h-5 text-amber-500" />}
                </div>
                <p className="text-2xl font-black text-emerald-600">{cls.avgNet} net</p>
                <p className="text-sm text-gray-500 mt-1">
                  {cls.studentCount} öğrenci • Max: {cls.topNet}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* ÖĞRENCİ LİSTESİ */}
        {/* ============================================ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center">
            <h2 className="text-lg font-bold text-gray-900 flex-1">Öğrenci Sıralaması</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Tümü</option>
                <option value="asil">Asil</option>
                <option value="misafir">Misafir</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sıra</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Öğrenci</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sınıf</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">D</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Y</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">B</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Net</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        p.rank === 1 ? 'bg-amber-100 text-amber-700' :
                        p.rank === 2 ? 'bg-slate-200 text-slate-700' :
                        p.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{p.name}</span>
                        {p.isAsil ? (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">Asil</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">Misafir</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.class}</td>
                    <td className="px-4 py-3 text-center text-emerald-600 font-medium">{p.correct}</td>
                    <td className="px-4 py-3 text-center text-red-500 font-medium">{p.wrong}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{p.empty}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{p.net}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredParticipants.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500">Arama kriterlerine uygun öğrenci bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

