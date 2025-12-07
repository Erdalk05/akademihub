'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { FinanceSummary } from '@/lib/types/finance';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  currentSummary: FinanceSummary | null;
  onSuccess: () => void;
}

type Period = 'monthly' | 'bimonthly' | 'weekly' | 'custom';

export default function RestructurePlanModal({
  isOpen,
  onClose,
  studentId,
  currentSummary,
  onSuccess,
}: Props) {
  const [installmentCount, setInstallmentCount] = useState(6);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [period, setPeriod] = useState<Period>('monthly');
  const [interestRate, setInterestRate] = useState('0');
  const [discountRate, setDiscountRate] = useState('0');
  const [equalMode, setEqualMode] = useState(true);
  const [customTotalAmount, setCustomTotalAmount] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [downPaymentDate, setDownPaymentDate] = useState<string>('');

  const [isSubmitting, startTransition] = useTransition();
  const { showToast, ToastContainer } = useToast();

  // 1) Mevcut plan özeti
  // currentSummary henüz gelmemiş olabilir, bu yüzden güvenli fallback kullanıyoruz.
  const installments = currentSummary?.installments || [];
  const totalDebt = installments.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const totalPaid = installments.reduce(
    (acc, i) => acc + Number(i.paid_amount ?? (i.is_paid ? i.amount || 0 : 0)),
    0,
  );
  const totalRemaining = totalDebt - totalPaid;

  const lastOldDue =
    installments.length > 0 && installments[installments.length - 1].due_date
      ? new Date(installments[installments.length - 1].due_date as string)
      : null;

  const avgOld =
    installments.length > 0 ? Math.round((totalDebt / installments.length) * 100) / 100 : 0;

  // Kullanıcının girdiği tutar veya kalan borç
  const baseAmount = customTotalAmount && Number(customTotalAmount) > 0 
    ? Number(customTotalAmount) 
    : totalRemaining;

  // Peşinat tutarı
  const downPaymentAmount = Number(downPayment) || 0;
  
  // Taksitlere bölünecek tutar (toplam - peşinat)
  const amountToInstall = Math.max(0, baseAmount - downPaymentAmount);

  // 2) Yeni plan hesaplama
  const {
    previewRows,
    effectiveTotal,
    interestTotal,
    discountTotal,
    avgNew,
    lastNewDue,
  } = useMemo(() => {
    if (!firstDueDate || installmentCount <= 0) {
      return {
        previewRows: [],
        effectiveTotal: baseAmount,
        interestTotal: 0,
        discountTotal: 0,
        avgNew: 0,
        lastNewDue: null as Date | null,
      };
    }

    // Peşinat düşüldükten sonraki tutar taksitlere bölünür
    const principal = amountToInstall;
    const interestPct = Number(interestRate) || 0;
    const discountPct = Number(discountRate) || 0;

    const interestAmount = principal * (interestPct / 100);
    const discountAmount = principal * (discountPct / 100);
    const total = Math.max(0, principal + interestAmount - discountAmount);

    const perInstallment = installmentCount > 0 ? total / installmentCount : 0;
    const perInterest = installmentCount > 0 ? interestAmount / installmentCount : 0;

    const rows: {
      no: number;
      date: string;
      amount: number;
      interest: number;
      subtotal: number;
      remaining: number;
    }[] = [];

    let cumulative = 0;
    const start = new Date(firstDueDate);

    for (let i = 0; i < installmentCount; i += 1) {
      const d = new Date(start);
      if (period === 'bimonthly') d.setMonth(d.getMonth() + i * 2);
      else if (period === 'weekly') d.setDate(d.getDate() + i * 7);
      else d.setMonth(d.getMonth() + i); // monthly & custom default

      cumulative += perInstallment;
      const remainingAfter = Math.max(0, total - cumulative);

      rows.push({
        no: i + 1,
        date: d.toLocaleDateString('tr-TR'),
        amount: perInstallment,
        interest: perInterest,
        subtotal: cumulative,
        remaining: remainingAfter,
      });
    }

    const avg = installmentCount > 0 ? total / installmentCount : 0;
    const lastDue = rows.length ? new Date(start) : null;
    if (lastDue) {
      if (period === 'bimonthly') lastDue.setMonth(lastDue.getMonth() + (installmentCount - 1) * 2);
      else if (period === 'weekly') lastDue.setDate(lastDue.getDate() + (installmentCount - 1) * 7);
      else lastDue.setMonth(lastDue.getMonth() + (installmentCount - 1));
    }

    return {
      previewRows: rows,
      effectiveTotal: total,
      interestTotal: interestAmount,
      discountTotal: discountAmount,
      avgNew: avg,
      lastNewDue: lastDue,
    };
  }, [firstDueDate, installmentCount, period, interestRate, discountRate, baseAmount, amountToInstall]);

  const handleSubmit = () => {
    if (baseAmount <= 0) {
      showToast('error', 'Toplam tutar girilmelidir.');
      return;
    }
    if (!firstDueDate) {
      showToast('error', 'İlk taksit tarihi seçilmelidir.');
      return;
    }
    if (installmentCount <= 0) {
      showToast('error', 'Yeni taksit sayısı en az 1 olmalıdır.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/installments/restructure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            total_amount: effectiveTotal,
            installment_count: installmentCount,
            first_due_date: firstDueDate,
          }),
        });

        const data = await res.json();
        if (!data?.success) {
          showToast('error', data?.error || 'Yapılandırma başarısız.');
          return;
        }
        showToast('success', 'Ödeme planı başarıyla yeniden yapılandırıldı.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 900);
      } catch (e: any) {
        showToast('error', e?.message || 'Bağlantı hatası oluştu.');
      }
    });
  };

  const formatCurrency = (val: number) =>
    `₺${(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;

  // Modal kapalıysa veya özet yoksa hiç render etme,
  // ancak HOOK'lar yukarıda her zaman aynı sırayla çalışmış oldu.
  if (!isOpen || !currentSummary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <ToastContainer />

      <div className="flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 border-b border-white/40 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 shadow-inner">
              <RefreshCw size={20} className="text-sky-100" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Ödeme Planı Yeniden Yapılandırma</h2>
              <p className="text-xs text-sky-100/80">Mevcut borcu yeni vadeye yay</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-amber-50/90 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
              <AlertTriangle size={14} className="shrink-0" />
              Bu işlem finansal kayıtları kalıcı olarak değiştirir.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {/* TOP GRID */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* MEVCUT PLAN */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Mevcut Plan Özeti
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ödenmiş ve bekleyen tüm taksitlerinizin özeti
                  </p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  Toplam {formatCurrency(totalDebt)}
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-xl border border-sky-100 bg-white/80 text-xs">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-sky-50/90 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Tarih</th>
                      <th className="px-3 py-2 text-right">Tutar</th>
                      <th className="px-3 py-2 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100">
                    {installments.slice(0, 20).map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2 text-[11px] text-slate-700">
                          {it.due_date
                            ? new Date(it.due_date).toLocaleDateString('tr-TR')
                            : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {formatCurrency(Number(it.amount || 0))}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {it.is_paid ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                              Ödendi
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                              Bekliyor
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {installments.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-3 text-center text-[11px] text-slate-500"
                        >
                          Kayıtlı taksit bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Toplam Borç
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(totalDebt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Ödenen
                  </p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Kalan
                  </p>
                  <p className="text-sm font-semibold text-rose-600">
                    {formatCurrency(totalRemaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* YENİ PLAN AYARLARI */}
            <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Yeni Plan Ayarları
              </p>
              <p className="mb-3 text-[11px] text-slate-500">
                Toplam tutarı, taksit sayısını, vade tarihini ve faiz/indirim oranlarını belirleyin.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {/* TOPLAM TUTAR */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Toplam Tutar (₺) <span className="text-violet-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border-2 border-violet-300 bg-white px-3 py-2.5 text-sm shadow-sm focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-200">
                    <span className="text-lg font-bold text-violet-600 mr-2">₺</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={customTotalAmount}
                      onChange={(e) => setCustomTotalAmount(e.target.value)}
                      placeholder={totalRemaining > 0 ? `Kalan borç: ${totalRemaining.toLocaleString('tr-TR')}` : 'Toplam tutarı girin...'}
                      className="flex-1 border-none bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm"
                    />
                    {/* Canlı tutar gösterimi */}
                    {Number(customTotalAmount) > 0 && (
                      <div className="ml-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 shadow-lg animate-pulse">
                        <span className="text-white text-xs font-medium">Girilen:</span>
                        <span className="text-white text-lg font-bold">
                          ₺{Number(customTotalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {totalRemaining > 0 
                      ? `Mevcut kalan borç: ₺${totalRemaining.toLocaleString('tr-TR')} • Farklı tutar girebilirsiniz.`
                      : 'Taksitlendirmek istediğiniz toplam tutarı girin.'}
                  </p>
                  {/* Tutar karşılaştırma göstergesi */}
                  {Number(customTotalAmount) > 0 && totalRemaining > 0 && (
                    <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-50 p-2 text-xs">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                        Number(customTotalAmount) > totalRemaining 
                          ? 'bg-red-100 text-red-700' 
                          : Number(customTotalAmount) < totalRemaining 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <TrendingUp size={12} />
                        <span className="font-semibold">
                          {Number(customTotalAmount) > totalRemaining 
                            ? `+₺${(Number(customTotalAmount) - totalRemaining).toLocaleString('tr-TR')} (Fazla)` 
                            : Number(customTotalAmount) < totalRemaining 
                              ? `-₺${(totalRemaining - Number(customTotalAmount)).toLocaleString('tr-TR')} (Eksik)` 
                              : 'Eşit'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PEŞİNAT BÖLÜMÜ */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Peşinat Tutarı (₺)
                  </label>
                  <div className="flex items-center rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm">
                    <span className="text-amber-600 font-semibold mr-2">₺</span>
                    <input
                      type="number"
                      min={0}
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      placeholder="0"
                      className="flex-1 border-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  {downPaymentAmount > 0 && (
                    <p className="mt-1 text-[10px] text-amber-600">
                      Taksitlere bölünecek: ₺{amountToInstall.toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>

                <ModernDatePicker
                  label="Peşinat Tarihi"
                  value={downPaymentDate}
                  onChange={setDownPaymentDate}
                  minYear={2024}
                  maxYear={2030}
                />

                {/* Taksit Sayısı */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Yeni Taksit Sayısı
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => setInstallmentCount((v) => (v > 1 ? v - 1 : 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={installmentCount}
                      onChange={(e) =>
                        setInstallmentCount(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-16 border-none bg-transparent text-center text-sm font-semibold text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setInstallmentCount((v) => v + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* İlk Vade Tarihi */}
                <ModernDatePicker
                  label="İlk Vade Tarihi"
                  value={firstDueDate}
                  onChange={setFirstDueDate}
                  required
                  minYear={2024}
                  maxYear={2030}
                />

                {/* Periyot */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Periyot
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                      { key: 'monthly', label: 'Aylık' },
                      { key: 'bimonthly', label: 'İki Aylık' },
                      { key: 'weekly', label: 'Haftalık' },
                      { key: 'custom', label: 'Özel' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPeriod(opt.key as Period)}
                        className={`rounded-xl border px-2.5 py-1.5 ${
                          period === opt.key
                            ? 'border-violet-500 bg-violet-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>


                {/* OTOMATİK TAKSİT ÖNİZLEME - Hemen altında görünsün */}
                {(previewRows.length > 0 || downPaymentAmount > 0) && (
                  <div className="md:col-span-2 mt-2">
                    <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          ✅ Oluşturulacak Ödeme Planı
                        </p>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {downPaymentAmount > 0 ? `Peşinat + ${previewRows.length} Taksit` : `${previewRows.length} Taksit`}
                        </span>
                      </div>
                      <div className="max-h-40 overflow-y-auto rounded-lg bg-white/80 border border-emerald-100">
                        <table className="min-w-full text-xs">
                          <thead className="sticky top-0 bg-emerald-100/90 text-[10px] font-semibold uppercase text-emerald-700">
                            <tr>
                              <th className="px-2 py-1.5 text-left">No</th>
                              <th className="px-2 py-1.5 text-left">Vade</th>
                              <th className="px-2 py-1.5 text-right">Tutar</th>
                              <th className="px-2 py-1.5 text-right">Kalan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50">
                            {/* PEŞİNAT SATIRI */}
                            {downPaymentAmount > 0 && (
                              <tr className="bg-amber-50/50 hover:bg-amber-50">
                                <td className="px-2 py-1 font-bold text-amber-700">Peşinat</td>
                                <td className="px-2 py-1 text-amber-600">
                                  {downPaymentDate ? new Date(downPaymentDate).toLocaleDateString('tr-TR') : 'Bugün'}
                                </td>
                                <td className="px-2 py-1 text-right font-bold text-amber-700">
                                  {formatCurrency(downPaymentAmount)}
                                </td>
                                <td className="px-2 py-1 text-right text-amber-600">
                                  {formatCurrency(amountToInstall)}
                                </td>
                              </tr>
                            )}
                            {/* TAKSİT SATIRLARI */}
                            {previewRows.map((row) => (
                              <tr key={row.no} className="hover:bg-emerald-50/50">
                                <td className="px-2 py-1 font-medium text-slate-700">{row.no}. Taksit</td>
                                <td className="px-2 py-1 text-slate-600">{row.date}</td>
                                <td className="px-2 py-1 text-right font-semibold text-emerald-700">
                                  {formatCurrency(row.amount)}
                                </td>
                                <td className="px-2 py-1 text-right text-slate-500">
                                  {formatCurrency(row.remaining)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-[10px] text-emerald-600 text-center">
                        💡 Toplam: {formatCurrency(baseAmount)} {downPaymentAmount > 0 && `(Peşinat: ${formatCurrency(downPaymentAmount)} + Taksit: ${formatCurrency(effectiveTotal)})`} • Son Vade: {lastNewDue?.toLocaleDateString('tr-TR') || '-'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Taksit oluşmadıysa uyarı */}
                {previewRows.length === 0 && baseAmount > 0 && (
                  <div className="md:col-span-2 mt-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                      <p className="text-xs text-amber-700">
                        ⚠️ Taksitleri görmek için <strong>İlk Vade Tarihi</strong>'ni seçin
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Yeni Plan Önizleme Tablosu */}
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/90 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Yeni Plan Önizleme Tablosu
                </p>
                <p className="text-[11px] text-slate-500">
                  Kalan borcun yeni vadeye nasıl dağıldığını inceleyin.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr,minmax(0,1.2fr)]">
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-slate-100 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">No</th>
                      <th className="px-3 py-2 text-left">Vade Tarihi</th>
                      <th className="px-3 py-2 text-right">Tutar</th>
                      <th className="px-3 py-2 text-right">Kalan Borç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row) => (
                      <tr key={row.no}>
                        <td className="px-3 py-1.5 font-medium text-slate-900">{row.no}. Taksit</td>
                        <td className="px-3 py-1.5 text-slate-600">{row.date}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-slate-900">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold text-emerald-700">
                          {formatCurrency(row.remaining)}
                        </td>
                      </tr>
                    ))}
                    {previewRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-3 text-center text-[11px] text-slate-500"
                        >
                          Önizleme için taksit sayısı ve ilk vade tarihini giriniz.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            {/* Chart mock */}
              <div className="flex flex-col justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">Borç Azalış Eğrisi</p>
                    <p className="text-[11px] text-emerald-800/80">
                      Her taksitte kalan borcun nasıl azaldığını gösterir.
                    </p>
                  </div>
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>

                <div className="mt-4 flex h-24 items-end gap-1 rounded-lg bg-white/60 p-2">
                  {previewRows.map((row) => {
                    const ratio = effectiveTotal > 0 ? row.remaining / effectiveTotal : 0;
                    const height = Math.max(4, Math.round(ratio * 80));
                    return (
                      <div
                        key={row.no}
                        className="flex-1 rounded-full bg-gradient-to-t from-emerald-500 to-sky-400"
                        style={{ height }}
                      />
                    );
                  })}
                  {previewRows.length === 0 && (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
                      Grafik için önizleme bekleniyor
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-900">
                  <span>Başlangıç: {formatCurrency(totalRemaining)}</span>
                  <span>Bitiş: {formatCurrency(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KARŞILAŞTIRMA KARTLARI */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Toplam Borç
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Eski Plan</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(totalRemaining)}
                  </p>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Yeni Plan</p>
                  <p
                    className={`text-sm font-semibold ${
                      effectiveTotal <= totalRemaining ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(effectiveTotal)}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {effectiveTotal <= totalRemaining
                  ? `Avantaj: ${formatCurrency(totalRemaining - effectiveTotal)}`
                  : `Ek maliyet: ${formatCurrency(effectiveTotal - totalRemaining)}`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Son Ödeme Tarihi
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Eski Plan</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {lastOldDue ? lastOldDue.toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Yeni Plan</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {lastNewDue ? lastNewDue.toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Vade yapısı yeni plana göre güncellenecektir.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Aylık Taksit Tutarı
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Eski Plan</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(avgOld)}
                  </p>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Yeni Plan</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(avgNew)}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Toplam {installmentCount} taksit
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="flex items-start gap-2 text-[11px] text-slate-600">
            <AlertTriangle size={14} className="mt-0.5 text-amber-500" />
            <p>
              Bu işlem geri alınamaz. Eski <span className="font-semibold">ödenmemiş</span> taksitler
              silinecek ve yeni plan oluşturulacaktır. Ödenmiş taksitler korunur.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.45)] hover:brightness-110 disabled:opacity-70"
            >
              {isSubmitting ? 'İşleniyor...' : 'Yapılandırmayı Onayla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

