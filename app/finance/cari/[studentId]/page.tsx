'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { FinanceInstallment } from '@/lib/types/finance';
import { exportLedgerToExcel, exportLedgerToPDF } from '@/lib/services/exportService';

type LedgerRow = {
  id: string;
  date: string;
  label: string;
  description: string;
  debit: number;
  credit: number;
  source?: 'education' | 'sale' | string;
};

type ApiSummary = {
  total: number;
  paid: number;
  unpaid: number;
  balance: number;
  installments: FinanceInstallment[];
};

export default function FinanceCariDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [studentName, setStudentName] = useState<string>('Öğrenci');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Özet ve taksitleri yükle (mevcut öğrenci cari sayfasındakiyle aynı mantık)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/installments/student/${studentId}`, {
          cache: 'no-store',
        });
        const js = await res.json();
        if (!js?.success) {
          if (!cancelled) setError(js?.error || 'Cari hesap verileri alınamadı');
        } else if (!cancelled) {
          setSummary(js.data as ApiSummary);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Bağlantı hatası');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // Öğrenci adı
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/students', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success || !Array.isArray(js.data)) return;
        const stu = js.data.find((s: any) => s.id === studentId);
        if (stu && !cancelled) {
          const fullName =
            `${stu.first_name || ''} ${stu.last_name || ''}`.trim() ||
            stu.full_name ||
            stu.parent_name ||
            'Öğrenci';
          setStudentName(fullName);
        }
      } catch {
        // isim yüklenemese de ekran çalışır
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const ledgerRows: LedgerRow[] = useMemo(() => {
    if (!summary) return [];
    const rows: LedgerRow[] = [];

    (summary.installments || []).forEach((inst) => {
      const amount = Number(inst.amount) || 0;
      const paid = Number(inst.paid_amount ?? (inst.is_paid ? inst.amount : 0)) || 0;
      const isSale = inst.source === 'sale' || (inst.note || '').startsWith('Satış');
      const baseDesc =
        inst.note ||
        (isSale ? 'Satış taksiti' : 'Eğitim taksiti');

      if (amount > 0 && inst.due_date) {
        rows.push({
          id: `${inst.id}-debt`,
          date: inst.due_date,
          label: 'Taksit Borcu',
          description: baseDesc,
          debit: amount,
          credit: 0,
          source: isSale ? 'sale' : 'education',
        });
      }

      if (paid > 0) {
        rows.push({
          id: `${inst.id}-pay`,
          date: inst.paid_at || inst.due_date || new Date().toISOString(),
          label: 'Taksit Ödemesi',
          description: baseDesc,
          debit: 0,
          credit: paid,
          source: isSale ? 'sale' : 'education',
        });
      }
    });

    rows.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da === db) return a.id.localeCompare(b.id);
      return da - db;
    });

    return rows;
  }, [summary]);

  const rowsWithBalance = useMemo(() => {
    let balance = 0;
    return ledgerRows.map((row) => {
      balance += row.debit - row.credit;
      return { ...row, balance };
    });
  }, [ledgerRows]);

  const total = summary?.total ?? 0;
  const paid = summary?.paid ?? 0;
  const remaining = summary?.balance ?? 0;

  const handleExportExcel = () => {
    try {
      if (!rowsWithBalance.length) {
        // eslint-disable-next-line no-alert
        alert('Dışa aktarılacak hareket bulunmuyor.');
        return;
      }

      exportLedgerToExcel(
        rowsWithBalance,
        {
          studentName,
          total,
          paid,
          remaining,
        },
        'cari-hesap.xlsx',
      );
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(`Excel oluşturulurken hata oluştu: ${e?.message || 'Bilinmeyen hata'}`);
      // eslint-disable-next-line no-console
      console.error('exportLedgerToExcel error', e);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!rowsWithBalance.length) {
        // eslint-disable-next-line no-alert
        alert('Dışa aktarılacak hareket bulunmuyor.');
        return;
      }

      await exportLedgerToPDF(
        rowsWithBalance,
        {
          studentName,
          total,
          paid,
          remaining,
        },
        'cari-hesap.pdf',
      );
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(`PDF oluşturulurken hata oluştu: ${e?.message || 'Bilinmeyen hata'}`);
      // eslint-disable-next-line no-console
      console.error('exportLedgerToPDF error', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Cari Hesap</h1>
            <p className="text-sm text-gray-600">{studentName}</p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200 transition-colors"
          >
            Geri
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr,1.4fr]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm border">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Toplam Borç
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                ₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Ödenen
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                ₺{paid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Kalan
              </p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                ₺{remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Basit bir bakiye grafiği + export butonları */}
          <div className="rounded-xl bg-white p-4 shadow-sm border flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Bakiye Eğrisi
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                Zaman içindeki borç/ödemelerden oluşan kalan bakiye değişimi.
              </p>
              <div className="mt-3 flex h-20 items-end gap-1 rounded-lg bg-gray-50 p-2">
                {rowsWithBalance.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">
                    Henüz hareket yok
                  </div>
                ) : (
                  rowsWithBalance.map((row) => {
                    const abs = Math.abs(row.balance ?? 0);
                    const max = Math.max(
                      ...rowsWithBalance.map((r) => Math.abs(r.balance ?? 0)),
                    );
                    const ratio = max > 0 ? abs / max : 0;
                    const height = Math.max(4, Math.round(ratio * 80));
                    return (
                      <div
                        key={row.id}
                        className="flex-1 rounded-full bg-gradient-to-t from-indigo-500 to-emerald-400"
                        style={{ height }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 justify-end text-[11px]">
              <button
                type="button"
                onClick={handleExportExcel}
                className="rounded-lg bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Excel
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="rounded-lg bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Hareketler (Taksit Borçları + Ödemeler)
            </h2>
            <p className="text-xs text-gray-500">
              Eğitim ve satış kaynaklı tüm taksit hareketleri tek listede gösterilir.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-gray-600">Yükleniyor...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-600">{error}</div>
          ) : rowsWithBalance.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Bu öğrenci için henüz finansal hareket bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Tarih</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Tür</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">
                      Açıklama
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">
                      Borç
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">
                      Alacak
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">
                      Bakiye
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rowsWithBalance.map((row) => {
                    const isSale = row.source === 'sale' || (row.description || '').startsWith('Satış');
                    const rowBgHover = isSale ? 'hover:bg-purple-50/70' : 'hover:bg-gray-50/60';
                    const labelColor = isSale ? 'text-purple-700' : 'text-gray-800';
                    const descColor = isSale ? 'text-purple-600/80' : 'text-gray-600';

                    return (
                      <tr key={row.id} className={rowBgHover}>
                        <td className="px-4 py-2 text-gray-700">
                        {new Date(row.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className={`px-4 py-2 font-medium ${labelColor}`}>
                          {row.label}
                        </td>
                        <td className={`px-4 py-2 ${descColor}`}>
                          {row.description || '-'}
                        </td>
                      <td className="px-4 py-2 text-right text-red-600 font-medium">
                        {row.debit > 0
                          ? `₺${row.debit.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}`
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600 font-medium">
                        {row.credit > 0
                          ? `₺${row.credit.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}`
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-800">
                        ₺{row.balance.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


