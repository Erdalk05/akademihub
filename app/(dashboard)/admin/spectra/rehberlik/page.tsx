'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { getBrowserClient } from '@/lib/supabase/client';
import {
  Loader2,
  AlertTriangle,
  Users,
  TrendingDown,
  Calendar,
  Phone,
  MessageSquare,
  ChevronRight,
  Search,
  Filter,
  UserX,
  Brain,
  Target,
  FileText,
} from 'lucide-react';

// ============================================================================
// REHBER ÖĞRETMEN PANELİ - SPECTRA
// Risk öğrencileri, görüşme takibi, hedef yönetimi
// ============================================================================

interface RiskStudent {
  id: string;
  name: string;
  className: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dropoutRisk: number;
  performanceRisk: number;
  lastNet: number;
  netTrend: number;
  factors: string[];
  lastContact: string | null;
  parentPhone: string | null;
}

interface Meeting {
  id: string;
  studentName: string;
  date: string;
  type: 'student' | 'parent' | 'both';
  notes: string;
  outcome: string;
}

export default function CounselorSpectraPage() {
  const { currentOrganization } = useOrganizationStore();
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [stats, setStats] = useState({
    totalRisk: 0,
    critical: 0,
    high: 0,
    medium: 0,
    pendingMeetings: 0,
  });

  useEffect(() => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    // Mock data - Gerçek API bağlantısı yapılacak
    const mockRiskStudents: RiskStudent[] = [
      {
        id: '1',
        name: 'Mehmet Demir',
        className: '8/B',
        riskLevel: 'critical',
        dropoutRisk: 0.85,
        performanceRisk: 0.72,
        lastNet: 32.5,
        netTrend: -8.5,
        factors: ['Son 3 sınavda sürekli düşüş', 'Devamsızlık %65', 'Sisteme giriş yok'],
        lastContact: '2 hafta önce',
        parentPhone: '0532 123 4567',
      },
      {
        id: '2',
        name: 'Zeynep Kaya',
        className: '8/A',
        riskLevel: 'high',
        dropoutRisk: 0.45,
        performanceRisk: 0.68,
        lastNet: 45.2,
        netTrend: -5.2,
        factors: ['Performans düşüşü', 'Matematik zayıf'],
        lastContact: '1 hafta önce',
        parentPhone: '0533 234 5678',
      },
      {
        id: '3',
        name: 'Ali Yıldız',
        className: '7/A',
        riskLevel: 'medium',
        dropoutRisk: 0.25,
        performanceRisk: 0.42,
        lastNet: 52.8,
        netTrend: -3.1,
        factors: ['Sınıf ortalamasının altında'],
        lastContact: null,
        parentPhone: '0534 345 6789',
      },
    ];

    const mockMeetings: Meeting[] = [
      {
        id: '1',
        studentName: 'Mehmet Demir',
        date: '2026-01-05',
        type: 'parent',
        notes: 'Veli ile telefon görüşmesi yapıldı',
        outcome: 'Özel ders desteği alınacak',
      },
      {
        id: '2',
        studentName: 'Zeynep Kaya',
        date: '2026-01-03',
        type: 'student',
        notes: 'Motivasyon görüşmesi',
        outcome: 'Haftalık takip planlandı',
      },
    ];

    setTimeout(() => {
      setRiskStudents(mockRiskStudents);
      setMeetings(mockMeetings);
      setStats({
        totalRisk: mockRiskStudents.length,
        critical: mockRiskStudents.filter((s) => s.riskLevel === 'critical').length,
        high: mockRiskStudents.filter((s) => s.riskLevel === 'high').length,
        medium: mockRiskStudents.filter((s) => s.riskLevel === 'medium').length,
        pendingMeetings: 3,
      });
      setLoading(false);
    }, 500);
  }, [currentOrganization?.id]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical':
        return 'Kritik';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      default:
        return 'Düşük';
    }
  };

  const filteredStudents = riskStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRisk === 'all' || s.riskLevel === filterRisk;
    return matchesSearch && matchesFilter;
  });

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
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8" />
            <h1 className="text-2xl font-black">Rehberlik Paneli</h1>
          </div>
          <p className="text-white/80">Risk öğrenci takibi, görüşme yönetimi ve hedef planlaması</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-xs font-medium text-gray-500">Toplam Risk</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.totalRisk}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-5 h-5 text-red-600" />
              <span className="text-xs font-medium text-red-600">Kritik</span>
            </div>
            <p className="text-2xl font-black text-red-600">{stats.critical}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-medium text-orange-600">Yüksek</span>
            </div>
            <p className="text-2xl font-black text-orange-500">{stats.high}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">Orta</span>
            </div>
            <p className="text-2xl font-black text-amber-500">{stats.medium}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-medium text-gray-500">Bekleyen Görüşme</span>
            </div>
            <p className="text-2xl font-black text-blue-600">{stats.pendingMeetings}</p>
          </div>
        </div>

        {/* Risk Students */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Risk Altındaki Öğrenciler
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48"
                />
              </div>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">Tüm Riskler</option>
                <option value="critical">Kritik</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        student.riskLevel === 'critical'
                          ? 'bg-red-100 text-red-600'
                          : student.riskLevel === 'high'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <span className="text-sm text-gray-500">{student.className}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getRiskColor(
                            student.riskLevel
                          )}`}
                        >
                          {getRiskLabel(student.riskLevel)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>Net: {student.lastNet}</span>
                        <span className={student.netTrend < 0 ? 'text-red-500' : 'text-emerald-500'}>
                          {student.netTrend > 0 ? '+' : ''}{student.netTrend}
                        </span>
                        <span>Terketme: %{Math.round(student.dropoutRisk * 100)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.factors.map((factor, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {student.parentPhone && (
                      <a
                        href={`tel:${student.parentPhone}`}
                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Ara"
                      >
                        <Phone className="w-5 h-5 text-emerald-600" />
                      </a>
                    )}
                    <button
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Görüşme Ekle"
                    >
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </button>
                    <Link
                      href={`/admin/spectra/rehberlik/ogrenci/${student.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Risk öğrenci bulunamadı</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Meetings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Son Görüşmeler
            </h2>
            <Link
              href="/admin/spectra/rehberlik/gorusmeler"
              className="text-sm text-blue-600 hover:underline"
            >
              Tümünü Gör
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{meeting.studentName}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(meeting.date).toLocaleDateString('tr-TR')} •{' '}
                    {meeting.type === 'parent' ? 'Veli' : meeting.type === 'student' ? 'Öğrenci' : 'İkisi'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{meeting.notes}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
                  {meeting.outcome}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/spectra/rehberlik/gorusmeler/ekle"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <MessageSquare className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Görüşme Ekle</h3>
            <p className="text-xs text-gray-500">Yeni kayıt</p>
          </Link>
          <Link
            href="/admin/spectra/rehberlik/hedefler"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <Target className="w-8 h-8 text-purple-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Hedef Yönetimi</h3>
            <p className="text-xs text-gray-500">Öğrenci hedefleri</p>
          </Link>
          <Link
            href="/admin/spectra/rehberlik/ai-analiz"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <Brain className="w-8 h-8 text-emerald-500 mb-2" />
            <h3 className="font-semibold text-gray-900">AI Analiz</h3>
            <p className="text-xs text-gray-500">Toplu analiz çalıştır</p>
          </Link>
          <Link
            href="/admin/spectra/rehberlik/raporlar"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center"
          >
            <FileText className="w-8 h-8 text-amber-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Raporlar</h3>
            <p className="text-xs text-gray-500">Risk raporları</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

