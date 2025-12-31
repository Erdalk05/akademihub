'use client';

/**
 * Öğrenci Kartı - Tek Öğrenci Odaklı Akademik Profil
 * 
 * 7 blok: kimlik, özet, trend, ders profili, akıllı özet, müdahale, geçmiş
 * Rehber, öğretmen, veli için tek merkezden karar desteği
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  User,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

export default function OgrenciKart() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrganization } = useOrganizationStore();

  const studentId = searchParams.get('studentId');
  const studentNo = searchParams.get('studentNo');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);

  // ========================================================================
  // FETCH STUDENT DATA
  // ========================================================================
  useEffect(() => {
    if (!studentId && !studentNo) {
      setError('Öğrenci ID veya Numara gereklidir');
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (studentId) params.set('studentId', studentId);
        if (studentNo) params.set('studentNo', studentNo);
        if (currentOrganization?.id) params.set('organizationId', currentOrganization.id);

        const response = await fetch(`/api/akademik-analiz/student-profile?${params.toString()}`);
        const result = await response.json();

        if (response.ok) {
          setStudentData(result);
        } else {
          setError(result.error || 'Öğrenci verisi yüklenemedi');
        }
      } catch (err) {
        console.error('Student fetch error:', err);
        setError('Bağlantı hatası');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, studentNo, currentOrganization?.id]);

  // ========================================================================
  // COMPUTED DATA
  // ========================================================================
  const student = studentData?.student;
  const examHistory = studentData?.examHistory || [];
  const subjectAverages = studentData?.subjectAverages || {};
  const stats = studentData?.stats || {};

  // Akademik durum rozeti
  const getRozetData = () => {
    const avgNet = parseFloat(stats.avgNet || '0');
    
    if (avgNet >= 60) return { label: 'Güçlü', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
    if (avgNet >= 40) return { label: 'Orta', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    return { label: 'Riskli', color: 'bg-red-100 text-red-700 border-red-300' };
  };

  // Zaman içinde gidişat
  const trendData = examHistory.map((r: any) => {
    const exam = Array.isArray(r.exam) ? r.exam[0] : r.exam;
    return {
      name: exam?.name?.slice(0, 15) || 'Sınav',
      net: r.total_net || 0,
      date: exam?.exam_date || '',
    };
  }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Gidişat otomatik yorumu
  const getTrendComment = () => {
    if (trendData.length < 2) return null;
    
    const recent3 = trendData.slice(-3);
    if (recent3.length < 2) return null;

    const firstNet = recent3[0].net;
    const lastNet = recent3[recent3.length - 1].net;
    const change = lastNet - firstNet;

    if (change >= 3) return { text: 'Son sınavlarda yükseliş gösteriyor', icon: TrendingUp, color: 'text-emerald-600' };
    if (change <= -3) return { text: 'Son sınavlarda düşüş eğilimi var', icon: TrendingDown, color: 'text-red-600' };
    return { text: 'İstikrarlı performans sergiliyor', icon: Minus, color: 'text-slate-600' };
  };

  // Ders profili
  const subjectChartData = Object.entries(subjectAverages).map(([code, data]: [string, any]) => ({
    name: code,
    ogrenci: data.avgNet || 0,
    kurum: 0, // Placeholder - would need org-level data
  }));

  // Akıllı özet (kural tabanlı)
  const getSmartInsights = () => {
    const insights: Array<{ type: 'warning' | 'info' | 'success'; text: string }> = [];

    // Son sınav durumu
    if (examHistory.length > 0) {
      const lastExam = examHistory[examHistory.length - 1];
      const lastNet = lastExam.total_net || 0;

      if (lastNet < 30) {
        insights.push({ type: 'warning', text: 'Son sınavda düşük performans' });
      } else if (lastNet >= 60) {
        insights.push({ type: 'success', text: 'Son sınavda güçlü performans' });
      }
    }

    // Trend kontrol
    const trend = getTrendComment();
    if (trend && trend.color === 'text-red-600') {
      insights.push({ type: 'warning', text: 'Son sınavlarda gerileme tespit edildi' });
    } else if (trend && trend.color === 'text-emerald-600') {
      insights.push({ type: 'success', text: 'Performans artış trendinde' });
    }

    // Ders zayıflığı
    const weakSubjects = Object.entries(subjectAverages)
      .filter(([code, data]: [string, any]) => (data.avgNet || 0) < 10)
      .map(([code]) => code);

    if (weakSubjects.length > 0) {
      insights.push({ type: 'info', text: `${weakSubjects.join(', ')} derslerinde desteklenmeli` });
    }

    return insights;
  };

  // Müdahale önceliği
  const getInterventionPriority = () => {
    const avgNet = parseFloat(stats.avgNet || '0');
    const trend = getTrendComment();

    if (avgNet < 35 || (avgNet < 45 && trend?.color === 'text-red-600')) {
      return {
        priority: 'Yüksek',
        color: 'bg-red-100 text-red-700 border-red-300',
        reasons: ['Performans düşüklüğü', avgNet < 35 ? 'Risk seviyesi kritik' : 'Gerileme eğilimi'],
      };
    }

    if (avgNet < 50 || trend?.color === 'text-red-600') {
      return {
        priority: 'Orta',
        color: 'bg-amber-100 text-amber-700 border-amber-300',
        reasons: ['Performans izlenmeli'],
      };
    }

    return {
      priority: 'Düşük',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      reasons: ['Stabil performans'],
    };
  };

  // ========================================================================
  // RENDER: LOADING
  // ========================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Öğrenci kartı yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER: ERROR
  // ========================================================================
  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Öğrenci Bulunamadı</h2>
          <p className="text-slate-600 mb-6">{error || 'Bu öğrenci için henüz akademik veri bulunmamaktadır.'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const rozetData = getRozetData();
  const trendComment = getTrendComment();
  const smartInsights = getSmartInsights();
  const interventionData = getInterventionPriority();

  // ========================================================================
  // RENDER: MAIN CARD
  // ========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20">
      {/* STICKY HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Geri</span>
            </button>
            <div className="text-sm text-slate-500">
              {currentOrganization?.name || 'AkademiHub'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* BLOK 1: ÖĞRENCİ KİMLİĞİ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Öğrenci'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>No: <strong>{student.student_no || '-'}</strong></span>
              </div>
              <div className="mt-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${rozetData.color}`}>
                  {rozetData.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOK 2: AKADEMİK ÖZET (4 KART) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">Son Sınav</div>
            <div className="text-2xl font-bold text-emerald-600">
              {examHistory.length > 0 ? (examHistory[examHistory.length - 1].total_net || 0).toFixed(1) : '-'}
            </div>
            <div className="text-xs text-slate-500">Net</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">Genel Ortalama</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.avgNet || '0'}
            </div>
            <div className="text-xs text-slate-500">Net</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">Son 3 Gidişat</div>
            <div className="flex items-center gap-2">
              {trendComment ? (
                <>
                  <trendComment.icon className={`w-5 h-5 ${trendComment.color}`} />
                  <span className={`text-xs font-medium ${trendComment.color}`}>
                    {trendComment.text.split(' ')[0]}
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-400">-</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">Toplam Sınav</div>
            <div className="text-2xl font-bold text-slate-700">
              {stats.totalExams || 0}
            </div>
            <div className="text-xs text-slate-500">Katılım</div>
          </div>
        </div>

        {/* BLOK 3: ZAMAN İÇİNDE GİDİŞAT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Zaman İçinde Gidişat</h3>
          
          {trendData.length >= 2 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Öğrenci Neti"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {trendComment && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <trendComment.icon className={`w-4 h-4 ${trendComment.color}`} />
                    <span className={`text-sm font-medium ${trendComment.color}`}>
                      {trendComment.text}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              Trend görüntülemek için en az 2 sınav gereklidir
            </div>
          )}
        </div>

        {/* BLOK 4: DERS PROFİLİ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Ders Bazlı Profil</h3>
          
          {subjectChartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ogrenci" name="Öğrenci" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              Ders bazlı veri bulunmamaktadır
            </div>
          )}
        </div>

        {/* BLOK 5: AKILLI ÖĞRENCİ ÖZETİ */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Akıllı Öğrenci Özeti</h3>
          
          {smartInsights.length > 0 ? (
            <div className="space-y-2">
              {smartInsights.map((insight, idx) => {
                const config = {
                  warning: { icon: AlertCircle, color: 'text-amber-700' },
                  info: { icon: Info, color: 'text-blue-700' },
                  success: { icon: CheckCircle, color: 'text-emerald-700' },
                }[insight.type];

                const Icon = config.icon;

                return (
                  <div key={idx} className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 mt-0.5 ${config.color}`} />
                    <span className="text-sm text-slate-700">{insight.text}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Genel performans beklentiler dahilindedir.</p>
          )}
        </div>

        {/* BLOK 6: MÜDAHALE DURUMU */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Müdahale Durumu</h3>
          
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="mb-3">
                <span className="text-sm text-slate-600 font-medium">Müdahale Önceliği: </span>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ml-2 ${interventionData.color}`}>
                  {interventionData.priority}
                </span>
              </div>
              
              <div className="space-y-1.5">
                {interventionData.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="text-slate-600">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BLOK 7: SINAV GEÇMİŞİ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Sınav Geçmişi</h3>
            <span className="text-sm text-slate-500">{examHistory.length} sınav</span>
          </div>
          
          {examHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Sınav</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Tarih</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Net</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Sıra</th>
                  </tr>
                </thead>
                <tbody>
                  {[...examHistory].reverse().map((result: any, idx: number) => {
                    const exam = Array.isArray(result.exam) ? result.exam[0] : result.exam;
                    
                    return (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {exam?.name || 'Sınav'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {exam?.exam_date ? new Date(exam.exam_date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                          }) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">
                          {(result.total_net || 0).toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {result.rank_in_exam || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              Henüz sınav geçmişi bulunmamaktadır
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-400 py-4">
          AkademiHub Öğrenci Kartı
        </div>
      </div>
    </div>
  );
}

