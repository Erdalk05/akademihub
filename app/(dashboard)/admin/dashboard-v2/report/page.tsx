'use client';

/**
 * Executive Exam Report - V2.4
 * 
 * Print-friendly, executive-level summary for school management.
 * Uses existing V2.3 analytics data without modification.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ExamDashboardResponse } from '@/types/exam-dashboard';
import { useOrganizationStore } from '@/lib/store/organizationStore';

function ExamExecutiveReportContent() {
  const searchParams = useSearchParams();
  const { currentOrganization } = useOrganizationStore();

  const [data, setData] = useState<ExamDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const examId = searchParams.get('examId');
  const gradeLevel = searchParams.get('gradeLevel') || '8';

  useEffect(() => {
    if (!examId) {
      setError('Rapor için sınav ID gereklidir');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('examId', examId);
        params.set('gradeLevel', gradeLevel);
        params.set('compareWith', 'previous');
        params.set('trendWindow', '5');

        const response = await fetch(`/api/v2/exam-analytics?${params.toString()}`);
        const result = await response.json();

        if (response.ok) {
          setData(result);
        } else {
          setError(result.error || 'Rapor yüklenemedi');
        }
      } catch (err) {
        console.error('Report error:', err);
        setError('Bağlantı hatası');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [examId, gradeLevel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Rapor hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <p className="text-red-600 font-semibold mb-2">Rapor Yüklenemedi</p>
          <p className="text-slate-600">{error || 'Bir hata oluştu'}</p>
        </div>
      </div>
    );
  }

  const reportDate = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          .avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
        <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
          {/* SECTION 1: REPORT HEADER */}
          <div className="border-b-4 border-blue-600 p-8 avoid-break">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Sınav Performans Raporu
              </h1>
              <div className="text-sm text-slate-500">
                Yönetici Özet Raporu
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500 font-medium">Kurum</div>
                <div className="text-slate-800 font-semibold">
                  {currentOrganization?.name || 'AkademiHub'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">Rapor Tarihi</div>
                <div className="text-slate-800 font-semibold">{reportDate}</div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">Sınav Adı</div>
                <div className="text-slate-800 font-semibold">
                  {data.examContext.examName}
                </div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">Sınav Tarihi</div>
                <div className="text-slate-800 font-semibold">
                  {new Date(data.examContext.examDate).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">Sınıf Seviyesi</div>
                <div className="text-slate-800 font-semibold">
                  {data.examContext.gradeLevel}. Sınıf
                </div>
              </div>
              <div>
                <div className="text-slate-500 font-medium">Katılımcı Sayısı</div>
                <div className="text-slate-800 font-semibold">
                  {data.examContext.participantCount} Öğrenci
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: EXECUTIVE SUMMARY (INSIGHTS) */}
          <div className="p-8 border-b border-slate-200 avoid-break">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Yönetici Özeti
            </h2>

            {data.insights && data.insights.length > 0 ? (
              <div className="space-y-3">
                {data.insights.map((insight, idx) => {
                  const levelLabel = {
                    WARNING: 'DİKKAT',
                    POSITIVE: 'POZİTİF',
                    INFO: 'BİLGİ',
                  }[insight.level];

                  const levelStyle = {
                    WARNING: 'bg-amber-50 border-amber-300 text-amber-900',
                    POSITIVE: 'bg-emerald-50 border-emerald-300 text-emerald-900',
                    INFO: 'bg-blue-50 border-blue-300 text-blue-900',
                  }[insight.level];

                  return (
                    <div
                      key={idx}
                      className={`p-4 border-l-4 ${levelStyle} print:border-2`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold px-2 py-1 bg-white rounded">
                          {levelLabel}
                        </span>
                        <p className="text-sm font-medium flex-1">
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">
                Bu sınav için anlamlı bir sapma tespit edilmedi. Performans beklentiler dahilindedir.
              </p>
            )}
          </div>

          {/* SECTION 3: KEY METRICS SNAPSHOT */}
          <div className="p-8 border-b border-slate-200 avoid-break">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Ana Metrikler
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="text-sm text-slate-500 mb-1">Katılımcı</div>
                <div className="text-3xl font-bold text-blue-600">
                  {data.summary.totalParticipants}
                </div>
                {data.summary.deltaParticipants !== null && (
                  <div className="text-xs text-slate-500 mt-1">
                    Önceki sınava göre: {data.summary.deltaParticipants > 0 ? '+' : ''}
                    {data.summary.deltaParticipants} öğrenci
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="text-sm text-slate-500 mb-1">Ortalama Net</div>
                <div className="text-3xl font-bold text-emerald-600">
                  {data.summary.averageNet}
                </div>
                {data.summary.deltaAverageNet !== null && (
                  <div className="text-xs text-slate-500 mt-1">
                    Değişim: {data.summary.deltaAverageNet > 0 ? '+' : ''}
                    {data.summary.deltaAverageNet} net ({data.summary.deltaPercentage}%)
                  </div>
                )}
              </div>

              {data.summary.strongestSubject && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-1">En Güçlü Ders</div>
                  <div className="text-lg font-bold text-slate-800">
                    {data.summary.strongestSubject.name}
                  </div>
                  <div className="text-sm text-slate-600">
                    {data.summary.strongestSubject.average} net ortalama
                  </div>
                </div>
              )}

              {data.summary.weakestSubject && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-1">Gelişim Alanı</div>
                  <div className="text-lg font-bold text-slate-800">
                    {data.summary.weakestSubject.name}
                  </div>
                  <div className="text-sm text-slate-600">
                    {data.summary.weakestSubject.average} net ortalama
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: TIME TREND */}
          <div className="p-8 border-b border-slate-200 page-break">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Zaman İçinde Performans
            </h2>

            {data.trends && data.trends.lastExams.length > 1 ? (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2 font-semibold text-slate-700">Sınav</th>
                      <th className="text-left py-2 font-semibold text-slate-700">Tarih</th>
                      <th className="text-right py-2 font-semibold text-slate-700">Ortalama Net</th>
                      <th className="text-right py-2 font-semibold text-slate-700">Değişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trends.lastExams.map((point, idx) => {
                      const prevNet = idx > 0 ? data.trends!.lastExams[idx - 1].averageNet : null;
                      const change = prevNet !== null ? point.averageNet - prevNet : null;

                      return (
                        <tr key={point.examId} className="border-b border-slate-100">
                          <td className="py-2 text-slate-800">
                            {point.examName}
                          </td>
                          <td className="py-2 text-slate-600">
                            {new Date(point.examDate).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </td>
                          <td className="py-2 text-right font-semibold text-slate-800">
                            {point.averageNet.toFixed(2)}
                          </td>
                          <td className="py-2 text-right text-slate-600">
                            {change !== null ? (
                              <span className={change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : ''}>
                                {change > 0 ? '+' : ''}{change.toFixed(2)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600 text-sm">
                Bu sınav için karşılaştırmalı zaman verisi bulunmamaktadır.
              </p>
            )}
          </div>

          {/* SECTION 5: RISK & DISTRIBUTION SUMMARY */}
          <div className="p-8 border-b border-slate-200 avoid-break">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Risk ve Dağılım Analizi
            </h2>

            {data.studentSegments && data.studentSegments.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Performans Segmentasyonu
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-700">
                      {data.studentSegments.filter(s => s.segment === 'HIGH').length}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">
                      Düşük Risk (Top %20)
                    </div>
                  </div>
                  <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {data.studentSegments.filter(s => s.segment === 'MID').length}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      Orta Performans (%60)
                    </div>
                  </div>
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">
                      {data.studentSegments.filter(s => s.segment === 'LOW').length}
                    </div>
                    <div className="text-xs text-red-600 font-medium">
                      Yüksek Risk (Bottom %20)
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {data.classDistributions && data.classDistributions.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Sınıf Bazlı Dağılım Özeti
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2 font-semibold text-slate-700">Sınıf</th>
                      <th className="text-right py-2 font-semibold text-slate-700">En Düşük</th>
                      <th className="text-right py-2 font-semibold text-slate-700">Medyan</th>
                      <th className="text-right py-2 font-semibold text-slate-700">En Yüksek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.classDistributions.map((cls) => (
                      <tr key={cls.className} className="border-b border-slate-100">
                        <td className="py-2 font-semibold text-slate-800">{cls.className}</td>
                        <td className="py-2 text-right text-slate-600">{cls.minNet.toFixed(1)}</td>
                        <td className="py-2 text-right font-semibold text-blue-600">
                          {cls.median.toFixed(1)}
                        </td>
                        <td className="py-2 text-right text-slate-600">{cls.maxNet.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          {/* SECTION 6: FOOTER */}
          <div className="p-8 text-center text-sm text-slate-500 avoid-break">
            <p className="mb-2">
              Bu rapor <strong>AkademiHub Analiz Motoru</strong> tarafından üretilmiştir.
            </p>
            <p className="text-xs">
              Rapor Kodu: {data.examContext.examId.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ExamExecutiveReport() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin" /></div>}>
      <ExamExecutiveReportContent />
    </Suspense>
  );
}

