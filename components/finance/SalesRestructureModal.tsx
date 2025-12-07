'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Percent,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { FinanceSummary } from '@/lib/types/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  studentId: string;
  currentSummary: FinanceSummary | null;
  onSuccess: () => void;
}

type Period = 'monthly' | 'bimonthly' | 'weekly' | 'custom';

export default function SalesRestructureModal({
  isOpen,
  onClose,
  saleId,
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

  const [isSubmitting, startTransition] = useTransition();
  const { showToast, ToastContainer } = useToast();

  // 1) Mevcut satış taksit planı özeti
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

  // 2) Yeni plan hesaplama (eğitimdekiyle aynı mantık)
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
        effectiveTotal: totalRemaining,
        interestTotal: 0,
        discountTotal: 0,
        avgNew: 0,
        lastNewDue: null as Date | null,
      };
    }

    const principal = totalRemaining;
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
  }, [firstDueDate, installmentCount, period, interestRate, discountRate, totalRemaining]);

  const handleSubmit = () => {
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
        const res = await fetch('/api/finance/sales/installments/restructure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sale_id: saleId,
            student_id: studentId,
            total_amount: totalRemaining,
            installment_count: installmentCount,
            first_due_date: firstDueDate,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          showToast('error', data?.error || 'Yapılandırma başarısız.');
          return;
        }
        showToast('success', 'Satış taksit planı başarıyla yeniden yapılandırıldı.');
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

  if (!isOpen || !currentSummary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <ToastContainer />

      <div className="flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-[0_20px_70px_rgba(15,23,42,0.25)] backdrop-blur-xl border border-slate-100">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-100 via-fuchsia-100 to-sky-100 px-6 py-4 text-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-violet-200">
              <RefreshCw size={20} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Satış Taksit Planı Yeniden Yapılandırma</h2>
              <p className="text-xs text-slate-500">Mevcut satış borcunu yeni vadeye yay</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm border border-amber-100">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              Bu işlem finansal kayıtları kalıcı olarak değiştirir
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white p-2 text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800 border border-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY – Mevcut kart tasarımının satışa uyarlanmış hâli */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {/* TOP GRID */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* MEVCUT PLAN */}
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                    Mevcut Satış Planı Özeti
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bu satışa ait ödenmiş ve bekleyen tüm taksitlerin özeti
                  </p>
                </div>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  Toplam {formatCurrency(totalDebt)}
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-xl border border-violet-100 bg-white text-xs">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-violet-50 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Tarih</th>
                      <th className="px-3 py-2 text-right">Tutar</th>
                      <th className="px-3 py-2 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
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
                          Bu satış için kayıtlı taksit bulunamadı.
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

            {/* YENİ PLAN AYARLARI – pastel satış teması */}
            <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">
                Yeni Plan Ayarları
              </p>
              <p className="mb-3 text-[11px] text-slate-500">
                Satış borcunu yeni vadeye yaymak için taksit sayısı ve ilk vade tarihini belirleyin.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {/* Taksit Sayısı */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Yeni Taksit Sayısı
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2">
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
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    İlk Vade Tarihi
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                    <Calendar size={14} className="text-slate-400" />
                    <input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>

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
                            ? 'border-pink-400 bg-pink-500 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Faiz & İndirim */}
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Faiz %
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white/80 px-2 py-2">
                      <Percent size={14} className="mr-1 text-slate-400" />
                      <input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      İndirim %
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white/80 px-2 py-2">
                      <Percent size={14} className="mr-1 text-emerald-400" />
                      <input
                        type="number"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(e.target.value)}
                        className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Yapılandırma Farkı */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Yapılandırma Farkı
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm">
                    <span className="text-slate-500">Toplam faiz / indirim etkisi</span>
                    <span
                      className={`font-semibold ${
                        effectiveTotal > totalRemaining
                          ? 'text-rose-600'
                          : effectiveTotal < totalRemaining
                          ? 'text-emerald-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {formatCurrency(effectiveTotal - totalRemaining)}
                    </span>
                  </div>
                </div>

                {/* Equal / Manual Toggle */}
                <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-fuchsia-100 bg-fuchsia-100/60 px-3 py-2.5">
                  <div className="flex flex-col text-[11px] text-fuchsia-900">
                    <span className="font-semibold">Taksit Dağıtımı</span>
                    <span className="text-fuchsia-700/80">
                      Şimdilik tüm taksitler eşit bölünüyor. Manuel dağıtım ileride eklenecek.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEqualMode((v) => !v)}
                    className={`relative flex h-6 w-12 items-center rounded-full border transition-all ${
                      equalMode ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-slate-300 bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        equalMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
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
                  Kalan satış borcunun yeni vadeye nasıl dağıldığını inceleyin.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr,minmax(0,1.2fr)]">
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-slate-100 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">No</th>
                      <th className="px-3 py-2 text-left">Tarih</th>
                      <th className="px-3 py-2 text-right">Tutar</th>
                      <th className="px-3 py-2 text-right">Faiz</th>
                      <th className="px-3 py-2 text-right">Ara Toplam</th>
                      <th className="px-3 py-2 text-right">Kalan Borç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row) => (
                      <tr key={row.no}>
                        <td className="px-3 py-1.5 font-medium text-slate-900">{row.no}</td>
                        <td className="px-3 py-1.5 text-slate-600">{row.date}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-slate-900">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600">
                          {formatCurrency(row.subtotal)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold text-emerald-700">
                          {formatCurrency(row.remaining)}
                        </td>
                      </tr>
                    ))}
                    {previewRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-3 text-center text-[11px] text-slate-500"
                        >
                          Önizleme için taksit sayısı ve ilk vade tarihini giriniz.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grafik */}
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
                Aylık Ortalama / Faiz
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
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(avgNew)}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Faiz toplamı: {formatCurrency(interestTotal)} • İndirim:{' '}
                {formatCurrency(discountTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="flex items-start gap-2 text-[11px] text-slate-600">
            <AlertTriangle size={14} className="mt-0.5 text-amber-500" />
            <p>
              Bu işlem geri alınamaz. Eski{' '}
              <span className="font-semibold">ödenmemiş satış taksitleri</span> silinecek ve yeni
              plan oluşturulacaktır. Ödenmiş taksitler korunur.
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
              className="rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.45)] hover:brightness-110 disabled:opacity-70"
            >
              {isSubmitting ? 'İşleniyor...' : 'Yapılandırmayı Onayla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


