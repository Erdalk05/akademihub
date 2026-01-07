'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import {
  Loader2,
  User,
  TrendingUp,
  TrendingDown,
  Target,
  FileText,
  Trophy,
  Calendar,
  BarChart3,
  ChevronRight,
  Star,
  Award,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// VELİ PANELİ - SPECTRA DASHBOARD
// Velinin çocuklarının sınav performansı
// ============================================================================

interface ChildSummary {
  studentId: string;
  name: string;
  className: string;
  lastExamNet: number;
  avgNet: number;
  trend: number;
  rank: number;
  totalStudents: number;
  lgsTarget: number;
  currentLGS: number;
  recentExams: { name: string; net: number }[];
}

export default function ParentSpectraPage() {
  const { currentOrganization } = useOrganizationStore();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    const mockChildren: ChildSummary[] = [
      {
        studentId: '1',
        name: 'Ahmet Yılmaz',
        className: '8/A',
        lastExamNet: 72.5,
        avgNet: 68.3,
        trend: 4.2,
        rank: 5,
        totalStudents: 28,
        lgsTarget: 450,
        currentLGS: 420,
        recentExams: [
          { name: 'LGS #1', net: 58 },
          { name: 'LGS #2', net: 62 },
          { name: 'LGS #3', net: 65 },
          { name: 'LGS #4', net: 68 },
          { name: 'LGS #5', net: 72.5 },
        ],
      },
    ];

    setTimeout(() => {
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0]);
      setLoading(false);
    }, 500);
  }, [currentOrganization?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Öğrenci bulunamadı</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((selectedChild.currentLGS / selectedChild.lgsTarget) * 100));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black">{selectedChild.name}</h1>
                <p className="text-white/80">{selectedChild.className} Sınıfı • {currentOrganization?.name}</p>
              </div>
            </div>
            {children.length > 1 && (
              <select
                value={selectedChild.studentId}
                onChange={(e) => {
                  const child = children.find((c) => c.studentId === e.target.value);
                  if (child) setSelectedChild(child);
                }}
                className="px-4 py-2 bg-white/20 rounded-lg text-white border border-white/30"
              >
                {children.map((c) => (
                  <option key={c.studentId} value={c.studentId} className="text-gray-900">
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500">Son Sınav</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{selectedChild.lastExamNet}</p>
            <p className="text-xs text-gray-500">net</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-medium text-gray-500">Sınıf Sırası</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {selectedChild.rank}<span className="text-sm font-normal text-gray-500">/{selectedChild.totalStudents}</span>
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              {selectedChild.trend > 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-xs font-medium text-gray-500">Trend</span>
            </div>
            <p className={`text-2xl font-black ${selectedChild.trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {selectedChild.trend > 0 ? '+' : ''}{selectedChild.trend}
            </p>
            <p className="text-xs text-gray-500">net</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-medium text-gray-500">Hedef Mesafe</span>
            </div>
            <p className="text-2xl font-black text-blue-600">
              {selectedChild.lgsTarget - selectedChild.currentLGS}
            </p>
            <p className="text-xs text-gray-500">puan kaldı</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Performans Trendi
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedChild.recentExams}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LGS Target Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            LGS Hedef Takibi
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Mevcut: {selectedChild.currentLGS}</span>
                <span className="text-gray-600">Hedef: {selectedChild.lgsTarget}</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">%{progressPercent}</div>
          </div>
          <p className="text-sm text-gray-500">
            🎯 Hedefe ulaşmak için net ortalamasını {Math.round((selectedChild.lgsTarget - selectedChild.currentLGS) / 4.5)} puan artırması gerekiyor.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/parent/spectra/sinavlar"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex items-center gap-4"
          >
            <FileText className="w-10 h-10 text-emerald-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Tüm Sınavlar</h3>
              <p className="text-sm text-gray-500">Detaylı sonuçlar</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
          <Link
            href="/parent/spectra/karne"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex items-center gap-4"
          >
            <Award className="w-10 h-10 text-amber-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Karne İndir</h3>
              <p className="text-sm text-gray-500">PDF rapor</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}

