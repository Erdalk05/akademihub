'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { getBrowserClient } from '@/lib/supabase/client';
import {
  Loader2,
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Target,
  FileText,
} from 'lucide-react';

// ============================================================================
// ÖĞRETMEN PANELİ - SPECTRA DASHBOARD
// Öğretmenin kendi sınıflarının sınav analizleri
// ============================================================================

interface ClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  lastExamName: string;
  lastExamDate: string;
  avgNet: number;
  trend: number; // Pozitif = yükseliş
  riskStudentCount: number;
}

export default function TeacherSpectraPage() {
  const { currentOrganization } = useOrganizationStore();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExams: 0,
    avgNet: 0,
    riskStudents: 0,
  });

  useEffect(() => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    // Mock data - gerçek API bağlantısı yapılacak
    const mockClasses: ClassSummary[] = [
      {
        classId: '1',
        className: '8/A',
        studentCount: 28,
        lastExamName: 'LGS Deneme #5',
        lastExamDate: '3 gün önce',
        avgNet: 72.4,
        trend: 3.2,
        riskStudentCount: 2,
      },
      {
        classId: '2',
        className: '8/B',
        studentCount: 26,
        lastExamName: 'LGS Deneme #5',
        lastExamDate: '3 gün önce',
        avgNet: 68.9,
        trend: -1.5,
        riskStudentCount: 4,
      },
      {
        classId: '3',
        className: '7/A',
        studentCount: 30,
        lastExamName: 'LGS Hazırlık #3',
        lastExamDate: '1 hafta önce',
        avgNet: 58.2,
        trend: 2.8,
        riskStudentCount: 3,
      },
    ];

    setTimeout(() => {
      setClasses(mockClasses);
      setStats({
        totalStudents: mockClasses.reduce((sum, c) => sum + c.studentCount, 0),
        totalExams: 12,
        avgNet: 66.5,
        riskStudents: mockClasses.reduce((sum, c) => sum + c.riskStudentCount, 0),
      });
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-black">Öğretmen Paneli - Spectra</h1>
          </div>
          <p className="text-white/80">Sınıflarınızın sınav performans analizleri</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-medium text-gray-500">Toplam Öğrenci</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500">Sınav Sayısı</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.totalExams}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <span className="text-xs font-medium text-gray-500">Ort. Net</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{stats.avgNet}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-xs font-medium text-gray-500">Risk Altında</span>
            </div>
            <p className="text-2xl font-black text-red-500">{stats.riskStudents}</p>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-gray-900">Sınıflarım</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {classes.map((cls) => (
              <Link
                key={cls.classId}
                href={`/teacher/spectra/sinif/${cls.classId}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {cls.className}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cls.className} Sınıfı</h3>
                    <p className="text-sm text-gray-500">
                      {cls.studentCount} öğrenci • Son: {cls.lastExamName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* Avg Net */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{cls.avgNet}</p>
                    <p className="text-xs text-gray-500">Ort. Net</p>
                  </div>
                  {/* Trend */}
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold flex items-center gap-1 ${
                        cls.trend > 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {cls.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                      {cls.trend > 0 ? '+' : ''}{cls.trend}
                    </p>
                    <p className="text-xs text-gray-500">Trend</p>
                  </div>
                  {/* Risk */}
                  {cls.riskStudentCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-600">{cls.riskStudentCount}</span>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/teacher/spectra/risk-ogrenciler"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Risk Öğrenciler</h3>
            <p className="text-xs text-gray-500">Takip gerektiren</p>
          </Link>
          <Link
            href="/teacher/spectra/karsilastirma"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <BarChart3 className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Sınıf Karşılaştır</h3>
            <p className="text-xs text-gray-500">Performans analizi</p>
          </Link>
          <Link
            href="/teacher/spectra/hedefler"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <Target className="w-8 h-8 text-purple-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Hedef Takibi</h3>
            <p className="text-xs text-gray-500">Öğrenci hedefleri</p>
          </Link>
          <Link
            href="/teacher/spectra/raporlar"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <FileText className="w-8 h-8 text-emerald-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Raporlar</h3>
            <p className="text-xs text-gray-500">PDF/Excel</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

