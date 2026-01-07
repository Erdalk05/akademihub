'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import {
  Loader2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  Star,
  Medal,
  BarChart3,
  ChevronRight,
  Zap,
  Award,
  BookOpen,
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
// ÖĞRENCİ PANELİ - SPECTRA DASHBOARD
// Gamification + Sınav performansı
// ============================================================================

interface StudentData {
  name: string;
  className: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  rank: number;
  totalStudents: number;
  lastExamNet: number;
  avgNet: number;
  trend: number;
  badges: { id: string; name: string; icon: string }[];
  recentExams: { name: string; net: number }[];
  lgsTarget: number;
  currentLGS: number;
}

export default function StudentSpectraPage() {
  const { currentOrganization } = useOrganizationStore();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    const mockData: StudentData = {
      name: 'Ahmet Yılmaz',
      className: '8/A',
      level: 7,
      xp: 1250,
      xpToNextLevel: 1500,
      streak: 12,
      rank: 5,
      totalStudents: 28,
      lastExamNet: 72.5,
      avgNet: 68.3,
      trend: 4.2,
      badges: [
        { id: '1', name: 'Matematik Ustası', icon: '🧮' },
        { id: '2', name: 'Kitap Kurdu', icon: '📚' },
        { id: '3', name: '7 Gün Streak', icon: '🔥' },
        { id: '4', name: 'Hedef Avcısı', icon: '🎯' },
      ],
      recentExams: [
        { name: 'LGS #1', net: 58 },
        { name: 'LGS #2', net: 62 },
        { name: 'LGS #3', net: 65 },
        { name: 'LGS #4', net: 68 },
        { name: 'LGS #5', net: 72.5 },
      ],
      lgsTarget: 450,
      currentLGS: 420,
    };

    setTimeout(() => {
      setStudentData(mockData);
      setLoading(false);
    }, 500);
  }, [currentOrganization?.id]);

  if (loading || !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  const xpProgress = Math.round((studentData.xp / studentData.xpToNextLevel) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Player Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
              🎮
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black">{studentData.name}</h1>
              <p className="text-white/80">{studentData.className} • {currentOrganization?.name}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="font-bold">{studentData.streak} Gün</span>
            </div>
          </div>

          {/* XP Bar */}
          <div className="relative">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-300" />
                Level {studentData.level}
              </span>
              <span>{studentData.xp} / {studentData.xpToNextLevel} XP</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-medium text-gray-400">Son Sınav</span>
            </div>
            <p className="text-2xl font-black text-white">{studentData.lastExamNet}</p>
            <p className="text-xs text-gray-500">net</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-medium text-gray-400">Sınıf Sırası</span>
            </div>
            <p className="text-2xl font-black text-white">
              {studentData.rank}<span className="text-sm font-normal text-gray-500">/{studentData.totalStudents}</span>
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              {studentData.trend > 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-xs font-medium text-gray-400">Trend</span>
            </div>
            <p className={`text-2xl font-black ${studentData.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {studentData.trend > 0 ? '+' : ''}{studentData.trend}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span className="text-xs font-medium text-gray-400">Toplam XP</span>
            </div>
            <p className="text-2xl font-black text-purple-400">{studentData.xp}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-500" />
            Rozetlerim
          </h2>
          <div className="flex flex-wrap gap-3">
            {studentData.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl border border-gray-600"
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-sm font-medium text-white">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Performans Grafiği
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={studentData.recentExams}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/student/spectra/sinavlarim"
            className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-emerald-500 transition-all flex items-center gap-4 group"
          >
            <BookOpen className="w-10 h-10 text-emerald-500" />
            <div>
              <h3 className="font-semibold text-white">Sınavlarım</h3>
              <p className="text-sm text-gray-400">Tüm sonuçlar</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 ml-auto group-hover:text-emerald-500 transition-colors" />
          </Link>
          <Link
            href="/student/spectra/hedefler"
            className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-all flex items-center gap-4 group"
          >
            <Target className="w-10 h-10 text-purple-500" />
            <div>
              <h3 className="font-semibold text-white">Hedeflerim</h3>
              <p className="text-sm text-gray-400">LGS takibi</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 ml-auto group-hover:text-purple-500 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}

