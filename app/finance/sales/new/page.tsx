'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerSelect, { CustomerOption } from '@/components/finance/CustomerSelect';
import NewSalesCustomerDialog from '@/components/finance/NewSalesCustomerDialog';

// useSearchParams kullanan içerik bileşeni
function NewSaleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStudentId = useMemo(
    () => searchParams.get('studentId'),
    [searchParams],
  );

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lines, setLines] = useState<
    { productName: string; quantity: number; unitPrice: number }[]
  >([{ productName: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [useInstallments, setUseInstallments] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash');
  const [installmentCount, setInstallmentCount] = useState(3);
  const [firstDueDate, setFirstDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [installments, setInstallments] = useState<
    { no: number; dueDate: string; amount: number }[]
  >([]);

  const handleAddLine = () => {
    setLines((prev) => [...prev, { productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleLineChange = (
    index: number,
    field: 'productName' | 'quantity' | 'unitPrice',
    value: string,
  ) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? {
              ...l,
              [field]:
                field === 'productName'
                  ? value
                  : field === 'quantity'
                  ? Number(value || 0)
                  : Number(value || 0),
            }
          : l,
      ),
    );
  };

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  );
  const tax = 0;
  const netAmount = total + tax;

  const generateInstallments = () => {
    if (!useInstallments) {
      setInstallments([]);
      return;
    }

    if (total <= 0) {
      alert('Önce en az bir satış kalemi ekleyip toplam tutarı oluşturun.');
      return;
    }
    if (!installmentCount || installmentCount <= 0) {
      alert('Geçerli bir taksit sayısı girin.');
      return;
    }

    const totalCents = Math.round(total * 100);
    const baseCents = Math.floor(totalCents / installmentCount);
    const remainder = totalCents - baseCents * installmentCount;

    const start = new Date(firstDueDate || new Date().toISOString().slice(0, 10));
    const list: { no: number; dueDate: string; amount: number }[] = [];

    for (let i = 0; i < installmentCount; i += 1) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      const amountCents = i === installmentCount - 1 ? baseCents + remainder : baseCents;
      list.push({
        no: i + 1,
        dueDate: d.toISOString().slice(0, 10),
        amount: amountCents / 100,
      });
    }

    setInstallments(list);
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      alert('Lütfen müşteri seçin');
      return;
    }

    const validLines = lines.filter(
      (l) => l.productName.trim() && l.quantity > 0 && l.unitPrice > 0,
    );
    if (!validLines.length) {
      alert('En az bir geçerli satır ekleyin');
      return;
    }

    try {
      setSaving(true);
      const body = {
        customerType: selectedCustomer.type === 'student' ? 'student' : 'external',
        studentId: selectedCustomer.type === 'student' ? selectedCustomer.id : undefined,
        salesCustomerId:
          selectedCustomer.type === 'external' ? selectedCustomer.id : undefined,
        items: validLines.map((l) => ({
          productName: l.productName,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          category: 'other',
        })),
        paymentMethod: paymentType === 'cash' ? 'cash' : 'installment',
        installments: useInstallments ? installments : [],
      };

      const res = await fetch('/api/finance/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const js = await res.json().catch(() => null);
      if (!res.ok || !js?.success) {
        alert(js?.error || 'Satış kaydedilemedi');
        return;
      }

      alert('Satış başarıyla oluşturuldu');
      router.push('/finance/sales');
    } catch (e: any) {
      alert(e?.message || 'Satış kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-xl font-semibold text-gray-900">Yeni Satış</h1>
            <p className="text-xs text-gray-500">
              Öğrenciler ve harici müşteriler için satış oluşturun.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/finance/sales')}
            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Satış Listesine Dön
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <CustomerSelect
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              onCreateExternal={() => setDialogOpen(true)}
              initialStudentId={initialStudentId}
            />
          </div>

          <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Satış Özeti</h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">
                Tüm tutarlar ₺
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-sky-50 px-3 py-2">
                <p className="text-[11px] text-gray-500">Toplam Tutar</p>
                <p className="text-sm font-semibold text-sky-600">
                  ₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2">
                <p className="text-[11px] text-gray-500">KDV</p>
                <p className="text-sm font-semibold text-emerald-600">
                  ₺{tax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 px-3 py-2">
                <p className="text-[11px] text-gray-500">Net Tutar</p>
                <p className="text-sm font-semibold text-indigo-600">
                  ₺{netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Satış Kalemleri</h2>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-5 gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="col-span-3 space-y-1">
                  <label className="text-[11px] text-gray-500">Ürün Adı</label>
                  <input
                    type="text"
                    value={line.productName}
                    onChange={(e) => handleLineChange(idx, 'productName', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Örn: Matematik Kitabı"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500">Adet</label>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500">Birim Fiyat</label>
                  <input
                    type="number"
                    min={0}
                    value={line.unitPrice}
                    onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLine}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              + Satır ekle
            </button>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
              <span className="text-gray-600">Toplam</span>
              <span className="font-semibold text-gray-900">
                ₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 inline-flex rounded-xl bg-white p-1 text-xs font-medium text-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('cash');
                    setUseInstallments(false);
                    setInstallments([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    paymentType === 'cash'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Peşin Ödeme
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('installment');
                    setUseInstallments(true);
                  }}
                  className={`ml-1 px-3 py-1.5 rounded-lg transition ${
                    paymentType === 'installment'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Taksitli Ödeme
                </button>
              </div>

              {paymentType === 'installment' && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-600">
                      Toplam tutarı eşit parçalara bölen bir taksit planı oluşturun.
                    </p>
                    <button
                      type="button"
                      onClick={generateInstallments}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-indigo-700"
                    >
                      Taksit Planı Oluştur
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-600">Taksit Sayısı</label>
                      <input
                        type="number"
                        min={1}
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(Number(e.target.value || 0))}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-600">İlk Vade Tarihi</label>
                      <input
                        type="date"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-600">Periyot</label>
                      <input
                        type="text"
                        value="Aylık"
                        readOnly
                        className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-500"
                      />
                    </div>
                  </div>

                  {installments.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <table className="min-w-full text-left text-[11px]">
                        <thead className="bg-gray-50 text-[11px] font-semibold text-gray-600">
                          <tr>
                            <th className="px-3 py-1.5">Taksit</th>
                            <th className="px-3 py-1.5">Vade</th>
                            <th className="px-3 py-1.5 text-right">Tutar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {installments.map((t) => (
                            <tr key={t.no}>
                              <td className="px-3 py-1.5 text-gray-800">T{t.no}</td>
                              <td className="px-3 py-1.5 text-gray-600">
                                {new Date(t.dueDate).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-3 py-1.5 text-right font-medium text-gray-900">
                                ₺{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push('/finance/sales')}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                disabled={saving}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Kaydediliyor...' : 'Satışı Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <NewSalesCustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(c) => {
          setDialogOpen(false);
          setSelectedCustomer({
            id: c.id,
            type: 'external',
            label: c.full_name,
            subtitle: c.phone || undefined,
          });
        }}
      />
    </div>
  );
}

// Ana sayfa bileşeni - Suspense ile sarılmış
export default function NewSalePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    }>
      <NewSaleContent />
    </Suspense>
  );
}
