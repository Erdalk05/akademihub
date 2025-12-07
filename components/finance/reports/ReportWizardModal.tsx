'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import {
  REPORT_DEFINITIONS,
  ReportDefinition,
} from './reportConfig';

type Step = 0 | 1 | 2;

interface ReportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string | null;
}

export default function ReportWizardModal({
  isOpen,
  onClose,
  reportId,
}: ReportWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [quickRange, setQuickRange] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [studentQuery, setStudentQuery] = useState<string>('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeStudentBreakdown, setIncludeStudentBreakdown] = useState(true);
  const [includeInstallmentSummary, setIncludeInstallmentSummary] = useState(true);
  const [includeTrendAnalysis, setIncludeTrendAnalysis] = useState(true);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'EXCEL' | 'BOTH'>('BOTH');
  const [savePreset, setSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [markFavorite, setMarkFavorite] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const report: ReportDefinition | undefined = useMemo(
    () => REPORT_DEFINITIONS.find((r) => r.id === reportId) || REPORT_DEFINITIONS[0],
    [reportId],
  );

  if (!report) return null;

  const steps = [
    { id: 'filters', label: 'Filtreler' },
    { id: 'customize', label: 'Özelleştirme' },
    { id: 'preview', label: 'Önizleme' },
  ];

  const isStudentReport = report.id === 'student-account-statement' || report.category === 'student';
  const isIncomeReport = report.category === 'income';
  const isExpenseReport = report.category === 'expense';

  const handleBack = () => {
    setCurrentStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  };

  const handleNext = () => {
    setCurrentStep((s) => (s < 2 ? ((s + 1) as Step) : s));
  };

  const handleQuickRangeChange = (range: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR') => {
    setQuickRange(range);
    const now = new Date();

    if (range === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(end.toISOString().slice(0, 10));
      return;
    }

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (range === 'THIS_MONTH') {
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(end.toISOString().slice(0, 10));
      return;
    }

    if (range === 'LAST_MONTH') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const start = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
      const end = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(end.toISOString().slice(0, 10));
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setQuickRange('THIS_MONTH');
    setStartDate('');
    setEndDate('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setStudentQuery('');
    setIncludeCharts(true);
    setIncludeTables(true);
    setIncludeDetails(true);
    setIncludeStudentBreakdown(true);
    setIncludeInstallmentSummary(true);
    setIncludeTrendAnalysis(true);
    setExportFormat('BOTH');
    setSavePreset(false);
    setPresetName('');
    setMarkFavorite(false);
    setCompleted(false);
    setSubmitting(false);
    setSubmitError(null);
    onClose();
  };

  const handleGenerate = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const body = {
        type: report.id,
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          statusFilter,
          categoryFilter,
          studentQuery,
        },
        options: {
          includeCharts,
          includeTables,
          includeDetails,
          includeTrendAnalysis,
          includeStudentBreakdown,
          includeInstallmentSummary,
          exportFormat,
          savePreset,
          presetName,
          markFavorite,
        },
      };

      const res = await fetch('/api/finance/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setSubmitError(json?.error || 'Rapor oluşturulamadı, lütfen tekrar deneyin.');
        return;
      }
      setCompleted(true);
    } catch (e: any) {
      setSubmitError(
        e?.message || 'Rapor oluşturulurken beklenmeyen bir hata oluştu.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rapor Oluştur"
      size="xl"
    >
      {/* Header info */}
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${report.gradient} text-white shadow-sm`}
        >
          <report.icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {report.name}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {report.description}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-4 flex items-center justify-center gap-2 border-b border-gray-100 pb-4">
        {steps.map((step, index) => {
          const stepIndex = index as Step;
          const isCompleted = currentStep > stepIndex;
          const isActive = currentStep === stepIndex;
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  isCompleted
                    ? 'bg-indigo-600 text-white'
                    : isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 rounded-full ${
                    currentStep > stepIndex ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Content – gerçek form adımları */}
      <div className="mb-4 space-y-4">
        {currentStep === 0 && (
          <>
            <h3 className="text-sm font-semibold text-gray-900">
              1. Adım – Rapor Parametreleri
            </h3>
            <p className="text-xs text-gray-500">
              Bu adımda tarih aralığını, durum ve kategori filtrelerini ve gerekirse öğrenci bilgisini seçin.
            </p>

            {/* Tarih aralığı */}
            <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <span className="text-xs font-semibold text-gray-700">
                Tarih Aralığı
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'THIS_MONTH', label: 'BU AY' },
                  { key: 'LAST_MONTH', label: 'GEÇEN AY' },
                  { key: 'THIS_YEAR', label: 'BU YIL' },
                  { key: 'CUSTOM', label: 'ÖZEL' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.key === 'CUSTOM') {
                        setQuickRange('CUSTOM');
                        return;
                      }
                      handleQuickRangeChange(item.key as 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR');
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      quickRange === item.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="flex flex-col">
                  <label className="text-[11px] font-medium text-gray-600">
                    BAŞLANGIÇ TARİHİ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setQuickRange('CUSTOM');
                      setStartDate(e.target.value);
                    }}
                    className="mt-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[11px] font-medium text-gray-600">
                    BİTİŞ TARİHİ
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setQuickRange('CUSTOM');
                      setEndDate(e.target.value);
                    }}
                    className="mt-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Durum & kategori */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700">
                  DURUM FİLTRESİ
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE')
                  }
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">TÜM DURUMLAR</option>
                  <option value="PAID">ÖDENDİ</option>
                  <option value="PENDING">BEKLİYOR</option>
                  <option value="OVERDUE">GECİKMİŞ</option>
                </select>
              </div>

              {(isExpenseReport || isIncomeReport) && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">
                    KATEGORİ
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value.toLocaleUpperCase('tr-TR'),
                      )
                    }
                    className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ALL">TÜM KATEGORİLER</option>
                    {isExpenseReport && (
                      <>
                        <option value="MATERIALS">MALZEME</option>
                        <option value="UTILITIES">FATURALAR</option>
                        <option value="PAYROLL">PERSONEL</option>
                        <option value="MAINTENANCE">BAKIM</option>
                        <option value="TRANSPORTATION">SERVİS</option>
                        <option value="MISC">DİĞER</option>
                      </>
                    )}
                    {isIncomeReport && (
                      <>
                        <option value="TUITION">TAKSİT / EĞİTİM</option>
                        <option value="ENROLLMENT">KAYIT</option>
                        <option value="COURSE">KURS</option>
                        <option value="SERVICE">SERVİS</option>
                        <option value="CANTEEN">KANTİN</option>
                        <option value="DONATION">BAĞIŞ</option>
                        <option value="OTHER">DİĞER</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Öğrenci alanı */}
            {isStudentReport && (
              <div className="mt-3 space-y-1">
                <label className="text-[11px] font-semibold text-gray-700">
                  ÖĞRENCİ / VELİ ARAMA
                </label>
                <input
                  type="text"
                  placeholder="AD SOYAD, ÖĞRENCİ NO VEYA TC"
                  value={studentQuery}
                  onChange={(e) =>
                    setStudentQuery(
                      e.target.value.toLocaleUpperCase('tr-TR'),
                    )
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-gray-500">
                  Gerçek zamanlı öğrenci arama ve seçim akışı bir sonraki adımda
                  Supabase entegrasyonu ile bağlanacaktır.
                </p>
              </div>
            )}
          </>
        )}

        {currentStep === 1 && (
          <>
            <h3 className="text-sm font-semibold text-gray-900">
              2. Adım – Rapor Özelleştirme
            </h3>
            <p className="text-xs text-gray-500">
              Rapor çıktısında hangi bölümlerin ve görselleştirmelerin yer alacağını seçin.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-[11px] font-semibold text-gray-700">
                  GENEL BÖLÜMLER
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Grafikler (trend, kategori dağılımı vb.)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={includeTables}
                    onChange={(e) => setIncludeTables(e.target.checked)}
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Detaylı tablolar (satır bazlı kayıt listesi)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={includeDetails}
                    onChange={(e) => setIncludeDetails(e.target.checked)}
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Özet kartlar ve KPI metrikleri
                </label>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-[11px] font-semibold text-gray-700">
                  RAPOR TİPİNE ÖZEL
                </span>
                {(report.id === 'monthly-finance' ||
                  report.id === 'annual-finance' ||
                  report.id === 'income-expense-comparison' ||
                  report.id === 'comparative-period-analysis') && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                    <input
                      type="checkbox"
                      checked={includeTrendAnalysis}
                      onChange={(e) => setIncludeTrendAnalysis(e.target.checked)}
                      className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Trend analizi ve dönem karşılaştırma tablosu
                  </label>
                )}
                {(report.id === 'student-account-statement' ||
                  report.id === 'payment-behavior-risk') && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                    <input
                      type="checkbox"
                      checked={includeStudentBreakdown}
                      onChange={(e) =>
                        setIncludeStudentBreakdown(e.target.checked)
                      }
                      className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Öğrenci bazlı detaylı döküm ve risk skoru bölümü
                  </label>
                )}
                {(report.id === 'installment-performance' ||
                  report.id === 'cash-flow') && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                    <input
                      type="checkbox"
                      checked={includeInstallmentSummary}
                      onChange={(e) =>
                        setIncludeInstallmentSummary(e.target.checked)
                      }
                      className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Taksit performansı ve vade dağılımı özeti
                  </label>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-[11px] font-semibold text-gray-700">
                  ÇIKTI FORMATLARI
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="radio"
                    checked={exportFormat === 'PDF'}
                    onChange={() => setExportFormat('PDF')}
                    className="h-3 w-3 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Yalnızca PDF
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="radio"
                    checked={exportFormat === 'EXCEL'}
                    onChange={() => setExportFormat('EXCEL')}
                    className="h-3 w-3 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Yalnızca Excel
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="radio"
                    checked={exportFormat === 'BOTH'}
                    onChange={() => setExportFormat('BOTH')}
                    className="h-3 w-3 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  PDF + Excel (Önerilen)
                </label>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-[11px] font-semibold text-gray-700">
                  KAYIT AYARLARI
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={savePreset}
                    onChange={(e) => setSavePreset(e.target.checked)}
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Bu yapılandırmayı şablon olarak kaydet
                </label>
                {savePreset && (
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) =>
                      setPresetName(
                        e.target.value.toLocaleUpperCase('tr-TR'),
                      )
                    }
                    placeholder="ŞABLON ADI"
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
                <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={markFavorite}
                    onChange={(e) => setMarkFavorite(e.target.checked)}
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Bu raporu favorilere ekle
                </label>
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            {!completed && (
              <>
                <h3 className="text-sm font-semibold text-gray-900">
                  3. Adım – Önizleme
                </h3>
                <p className="text-xs text-gray-500">
                  Aşağıda, oluşturulacak raporun özet ayarlarını ve kapsamını
                  görüyorsunuz. PDF / Excel butonları gerçek veriye bağlandığında
                  ilgili export işlemlerini başlatacak.
                </p>

                <div className="mt-3 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-800">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                      {startDate || endDate
                        ? `DÖNEM: ${startDate || '???'} → ${endDate || '???'}`
                        : 'DÖNEM: OTOMATİK (RAPOR TİPİNE GÖRE)'}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                      DURUM: {statusFilter}
                    </span>
                    {(isExpenseReport || isIncomeReport) && (
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                        KATEGORİ: {categoryFilter}
                      </span>
                    )}
                    {isStudentReport && studentQuery && (
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                        ÖĞRENCİ FİLTRESİ: {studentQuery}
                      </span>
                    )}
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                      FORMAT: {exportFormat === 'BOTH' ? 'PDF + EXCEL' : exportFormat}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-gray-700">
                        DAHİL EDİLECEK GENEL BÖLÜMLER
                      </span>
                      <ul className="list-disc pl-4">
                        {includeCharts && <li>Grafikler ve görsel özetler</li>}
                        {includeTables && <li>Detaylı tablo ve satır listeleri</li>}
                        {includeDetails && <li>Özet kartlar, KPI ve metrikler</li>}
                        {!includeCharts &&
                          !includeTables &&
                          !includeDetails && (
                            <li>Hiçbir genel bölüm seçilmedi – en az birini açmanız önerilir.</li>
                          )}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-gray-700">
                        RAPOR TİPİNE ÖZEL BÖLÜMLER
                      </span>
                      <ul className="list-disc pl-4">
                        {includeTrendAnalysis && (
                          <li>Trend analizi ve dönem karşılaştırmaları</li>
                        )}
                        {includeStudentBreakdown && (
                          <li>Öğrenci bazlı cari hesap / risk analizi</li>
                        )}
                        {includeInstallmentSummary && (
                          <li>Taksit performansı ve vade analizi</li>
                        )}
                        {!includeTrendAnalysis &&
                          !includeStudentBreakdown &&
                          !includeInstallmentSummary && (
                            <li>Özel bölüm seçilmedi – rapor yalnızca genel özet içerir.</li>
                          )}
                      </ul>
                    </div>
                  </div>

                  {(savePreset || markFavorite) && (
                    <div className="mt-2 space-y-1 rounded-lg bg-white/70 p-2">
                      <span className="text-[11px] font-semibold text-gray-700">
                        KAYIT ÖZETİ
                      </span>
                      <ul className="list-disc pl-4 text-[11px] text-gray-700">
                        {savePreset && (
                          <li>
                            Şablon olarak kaydedilecek:{' '}
                            <span className="font-semibold">
                              {presetName || 'İSİMSİZ ŞABLON'}
                            </span>
                          </li>
                        )}
                        {markFavorite && (
                          <li>Bu rapor favorilere eklenecek.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {completed && (
              <div className="mt-1 space-y-4 rounded-lg bg-emerald-50 p-4 text-xs text-emerald-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Rapor başarıyla oluşturuldu!
                    </h3>
                    <p className="mt-0.5 text-[11px] text-emerald-900/80">
                      PDF ve/veya Excel çıktıları az sonra indirme için
                      hazır olacak. Dilersen bu yapılandırmayı şablon veya favori
                      olarak kullanmaya devam edebilirsin.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF İndir
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Excel İndir
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {submitError && (
        <div className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          {submitError}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Geri
        </button>
        <div className="flex items-center gap-2">
          {currentStep === 2 && !completed && (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Excel
              </button>
            </>
          )}
          <button
            type="button"
            onClick={
              currentStep === 2
                ? completed
                  ? handleClose
                  : handleGenerate
                : handleNext
            }
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {currentStep === 2 ? (
              <>
                <Check className="h-4 w-4" />
                {completed ? 'Kapat' : submitting ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
              </>
            ) : (
              <>
                İleri
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}


