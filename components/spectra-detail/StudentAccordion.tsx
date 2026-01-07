'use client';

import React, { useEffect, useState } from 'react';
import { X, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, Target, Sparkles, Loader2 } from 'lucide-react';
import type { StudentTableRow } from '@/types/spectra-detail';
import { SECTION_BG_COLORS, SECTION_TEXT_COLORS } from '@/lib/spectra-detail/constants';
import { estimateLGSScore } from '@/lib/spectra-detail/calculations';
import { getBrowserClient } from '@/lib/supabase/client';
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
// STUDENT ACCORDION COMPONENT
// Satır altında açılan detay paneli + AI profil + Trend grafik
// ============================================================================

interface AIProfile {
  dropout_risk: number | null;
  performance_risk: number | null;
  predicted_lgs_score: number | null;
  strength_areas: string[] | null;
  weakness_areas: string[] | null;
  recommendations: { type: string; subject: string; topic: string }[] | null;
}

interface ExamTrend {
  examName: string;
  examDate: string;
  net: number;
}

interface StudentAccordionProps {
  student: StudentTableRow;
  classAverage: number;
  sectionAverages: Map<string, number>;
  onClose: () => void;
  onExportPDF?: () => void;
  organizationId?: string;
}

export function StudentAccordion({
  student,
  classAverage,
  sectionAverages,
  onClose,
  onExportPDF,
  organizationId,
}: StudentAccordionProps) {
  const lgsScore = estimateLGSScore(student.totalNet);
  const netDiff = student.totalNet - classAverage;

  // AI Profil ve Trend state'leri
  const [aiProfile, setAiProfile] = useState<AIProfile | null>(null);
  const [examTrends, setExamTrends] = useState<ExamTrend[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);

  // AI profil ve trend verilerini çek
  useEffect(() => {
    if (!student.studentId) return;

    const fetchAIProfile = async () => {
      setLoadingAI(true);
      try {
        const supabase = getBrowserClient();
        const { data } = await supabase
          .from('student_ai_profiles')
          .select('dropout_risk, performance_risk, predicted_lgs_score, strength_areas, weakness_areas, recommendations')
          .eq('student_id', student.studentId)
          .single();

        if (data) {
          setAiProfile({
            dropout_risk: data.dropout_risk,
            performance_risk: data.performance_risk,
            predicted_lgs_score: data.predicted_lgs_score,
            strength_areas: data.strength_areas || [],
            weakness_areas: data.weakness_areas || [],
            recommendations: data.recommendations || [],
          });
        }
      } catch (err) {
        console.warn('AI profil yüklenemedi:', err);
      } finally {
        setLoadingAI(false);
      }
    };

    const fetchExamTrends = async () => {
      setLoadingTrend(true);
      try {
        const supabase = getBrowserClient();
        // Son 5 sınavı çek
        const { data } = await supabase
          .from('exam_participants')
          .select(`
            net,
            exam:exams (
              name,
              exam_date
            )
          `)
          .eq('student_id', student.studentId)
          .not('net', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (data) {
          const trends = data
            .filter((d: any) => d.exam)
            .map((d: any) => ({
              examName: d.exam.name || 'Sınav',
              examDate: d.exam.exam_date || '',
              net: d.net || 0,
            }))
            .reverse(); // En eski en başta

          setExamTrends(trends);
        }
      } catch (err) {
        console.warn('Trend verisi yüklenemedi:', err);
      } finally {
        setLoadingTrend(false);
      }
    };

    fetchAIProfile();
    fetchExamTrends();
  }, [student.studentId]);

  // Risk rengi hesapla
  const getRiskColor = (risk: number | null) => {
    if (risk === null) return 'text-gray-400';
    if (risk >= 0.7) return 'text-red-600';
    if (risk >= 0.4) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getRiskBg = (risk: number | null) => {
    if (risk === null) return 'bg-gray-100';
    if (risk >= 0.7) return 'bg-red-50';
    if (risk >= 0.4) return 'bg-amber-50';
    return 'bg-emerald-50';
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-t border-b border-emerald-200 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          📊 {student.name} - Detaylı Analiz
        </h4>
        <div className="flex items-center gap-2">
          {onExportPDF && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportPDF();
              }}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="PDF İndir"
            >
              <FileText className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Özet Bilgiler */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="text-sm font-semibold text-gray-500 mb-3">Özet Bilgiler</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Toplam Net:</span>
              <span className="font-bold text-gray-900">{student.totalNet.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kurum Sırası:</span>
              <span className="font-bold text-gray-900">{student.rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Yüzdelik Dilim:</span>
              <span className="font-bold text-emerald-600">%{student.percentile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tahmini LGS:</span>
              <span className="font-bold text-blue-600">{lgsScore.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Sınıf Karşılaştırma */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="text-sm font-semibold text-gray-500 mb-3">Sınıf Karşılaştırma</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Sınıf Ortalaması:</span>
              <span className="font-bold text-gray-900">{classAverage.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fark:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  netDiff > 0
                    ? 'text-emerald-600'
                    : netDiff < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {netDiff > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : netDiff < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {netDiff > 0 ? '+' : ''}
                {netDiff.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* D/Y/B Özet */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h5 className="text-sm font-semibold text-gray-500 mb-3">Toplam D/Y/B</h5>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{student.totalCorrect}</p>
              <p className="text-xs text-gray-500">Doğru</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{student.totalWrong}</p>
              <p className="text-xs text-gray-500">Yanlış</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{student.totalBlank}</p>
              <p className="text-xs text-gray-500">Boş</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Profil & Trend Bölümü */}
      {student.studentId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Trend Grafiği */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h5 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Son 5 Sınav Trendi
            </h5>
            {loadingTrend ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : examTrends.length > 1 ? (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={examTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="examName" 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(v) => v.substring(0, 8)}
                    />
                    <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                Trend için yeterli veri yok
              </div>
            )}
          </div>

          {/* AI Profil */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h5 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Analiz
            </h5>
            {loadingAI ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : aiProfile ? (
              <div className="space-y-3">
                {/* Risk Göstergeleri */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg ${getRiskBg(aiProfile.dropout_risk)}`}>
                    <p className="text-xs text-gray-500">Terketme Riski</p>
                    <p className={`font-bold ${getRiskColor(aiProfile.dropout_risk)}`}>
                      {aiProfile.dropout_risk !== null
                        ? `%${Math.round(aiProfile.dropout_risk * 100)}`
                        : '-'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${getRiskBg(aiProfile.performance_risk)}`}>
                    <p className="text-xs text-gray-500">Düşüş Riski</p>
                    <p className={`font-bold ${getRiskColor(aiProfile.performance_risk)}`}>
                      {aiProfile.performance_risk !== null
                        ? `%${Math.round(aiProfile.performance_risk * 100)}`
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* AI Tahmin LGS */}
                {aiProfile.predicted_lgs_score && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500">AI LGS Tahmini:</span>
                    <span className="font-bold text-blue-600">
                      {aiProfile.predicted_lgs_score.toLocaleString('tr-TR')}
                    </span>
                  </div>
                )}

                {/* Güçlü/Zayıf Alanlar */}
                {(aiProfile.strength_areas?.length || aiProfile.weakness_areas?.length) && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {aiProfile.strength_areas && aiProfile.strength_areas.length > 0 && (
                      <div>
                        <p className="font-medium text-emerald-600 mb-1">✅ Güçlü</p>
                        {aiProfile.strength_areas.slice(0, 2).map((a, i) => (
                          <p key={i} className="text-gray-600">{a}</p>
                        ))}
                      </div>
                    )}
                    {aiProfile.weakness_areas && aiProfile.weakness_areas.length > 0 && (
                      <div>
                        <p className="font-medium text-red-500 mb-1">⚠️ Zayıf</p>
                        {aiProfile.weakness_areas.slice(0, 2).map((a, i) => (
                          <p key={i} className="text-gray-600">{a}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-gray-400 text-sm">
                <Sparkles className="w-8 h-8 mb-2 text-gray-300" />
                AI profil henüz oluşturulmamış
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ders Bazlı Performans Tablosu */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                Ders
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                D
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Y
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                B
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Net
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Sınıf Ort.
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                Fark
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {student.sections.map((section) => {
              const sectionAvg = sectionAverages.get(section.sectionId) || 0;
              const diff = section.net - sectionAvg;

              return (
                <tr key={section.sectionId} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span
                      className={`font-medium ${
                        SECTION_TEXT_COLORS[section.sectionCode] ||
                        SECTION_TEXT_COLORS.DEFAULT
                      }`}
                    >
                      {section.sectionName}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-emerald-600 font-medium">
                    {section.correct}
                  </td>
                  <td className="px-3 py-2 text-center text-red-500 font-medium">
                    {section.wrong}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-400">{section.blank}</td>
                  <td className="px-3 py-2 text-center font-bold text-gray-900">
                    {section.net.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">
                    {sectionAvg.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`font-medium ${
                        diff > 0
                          ? 'text-emerald-600'
                          : diff < 0
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {diff > 0 ? '+' : ''}
                      {diff.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentAccordion;

