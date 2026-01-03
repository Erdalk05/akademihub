'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useExamDashboard } from '@/lib/exam-intelligence/hooks/useExamDashboard';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  BarChart3, Users, Target, TrendingUp, 
  GraduationCap, FileText, ArrowRight, Activity,
  RefreshCw, AlertCircle, Calendar, Loader2
} from 'lucide-react';

export default function ExamIntelligenceDashboard() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  
  // Gerçek veri hook'u
  const { data, isLoading, error, refetch } = useExamDashboard(currentOrganization?.id);

  // Quick Links
  const quickLinks = [
    { label: 'Sınıf Analizi', href: '/admin/exam-intelligence/sinif', icon: GraduationCap },
    { label: 'Öğrenci Analizi', href: '/admin/exam-intelligence/ogrenci', icon: Users },
    { label: 'Sınav Sonuçları', href: '/admin/akademik-analiz/sonuclar', icon: BarChart3 },
    { label: 'Yeni Sınav', href: '/admin/akademik-analiz/sihirbaz', icon: FileText },
  ];

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Veriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Veri Yüklenemedi</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Stats from API
  const stats = [
    { 
      label: 'Toplam Sınav', 
      value: data?.stats.totalExams || 0, 
      icon: FileText, 
      color: 'cyan' 
    },
    { 
      label: 'Toplam Öğrenci', 
      value: data?.stats.totalStudents || 0, 
      icon: Users, 
      color: 'indigo' 
    },
    { 
      label: 'Ortalama Net', 
      value: data?.stats.averageNet?.toFixed(1) || '0', 
      icon: Target, 
      color: 'emerald' 
    },
    { 
      label: 'Başarı Oranı', 
      value: `%${data?.stats.successRate || 0}`, 
      icon: TrendingUp, 
      color: 'amber' 
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Exam Intelligence</h1>
                <p className="text-cyan-100">{currentOrganization?.name || 'Dashboard'}</p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Yenile"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => router.push(link.href)}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all group"
            >
              <link.icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-600" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-cyan-700">
                {link.label}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 ml-auto" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Exams & Class Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Sınavlar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Son Sınavlar</h3>
          {data?.recentExams && data.recentExams.length > 0 ? (
            <div className="space-y-3">
              {data.recentExams.map((exam) => (
                <div 
                  key={exam.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/exam-intelligence/sinav/${exam.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{exam.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {exam.exam_date 
                          ? format(new Date(exam.exam_date), 'dd MMM yyyy', { locale: tr })
                          : 'Tarih yok'
                        }
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-cyan-100 text-cyan-700 rounded-lg">
                    {exam.exam_type || 'LGS'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400">Henüz sınav yok</p>
                <button
                  onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                  className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  İlk sınavı ekle →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sınıf Özeti */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sınıf Performansı</h3>
          {data?.classSummary && data.classSummary.length > 0 ? (
            <div className="space-y-3">
              {data.classSummary.slice(0, 5).map((cls, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      idx === 0 ? 'bg-amber-100 text-amber-600' :
                      idx === 1 ? 'bg-slate-200 text-slate-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{cls.name}</p>
                      <p className="text-xs text-slate-500">{cls.studentCount} öğrenci</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{cls.averageNet}</p>
                    <p className="text-xs text-slate-500">ort. net</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400">Sınıf verisi yok</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}