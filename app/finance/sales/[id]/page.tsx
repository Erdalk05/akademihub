'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, ShoppingCart, Trash2 } from 'lucide-react';
import type { FinanceInstallment, FinanceSummary } from '@/lib/types/finance';
import SalesSummaryCard from '@/components/finance/SalesSummaryCard';
import InstallmentTable from '@/components/finance/InstallmentTable';
import PaymentCollectionModal from '@/components/finance/PaymentCollectionModal';
import EditPaymentModal from '@/components/finance/EditPaymentModal';
import { generateReceiptHTML } from '@/lib/services/receiptService';
import {
  exportInstallmentPlanToExcel,
  exportInstallmentPlanToPDF,
} from '@/lib/services/exportService';
import AddSaleInstallmentModal from '@/components/finance/AddSaleInstallmentModal';
import SalesRestructureModal from '@/components/finance/SalesRestructureModal';

type SaleItemRow = {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type SaleDetail = {
  id: string;
  sale_no: string;
  customer_type: 'student' | 'external';
  student_id?: string | null;
  sales_customer_id?: string | null;
  customer_name: string;
  total_amount: number;
  discount: number;
  tax: number;
  net_amount: number;
  payment_method?: string | null;
  status: string;
  sale_date: string;
  sale_items: SaleItemRow[];
};

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installmentsSummary, setInstallmentsSummary] = useState<FinanceSummary | null>(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<FinanceInstallment | null>(null);
  const [addInstallmentOpen, setAddInstallmentOpen] = useState(false);
  const [restructureOpen, setRestructureOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/finance/sales?id=${id}`, {
          cache: 'no-store',
        });
        const js = await res.json().catch(() => null);

        // Yeni API: { sales: [...] } veya hata
        if (!res.ok || !Array.isArray(js?.sales)) {
          setError(js?.error || 'Satış bulunamadı');
          return;
        }

        const row = js.sales.find((r: any) => r.id === id) || js.sales[0];
        if (!row) {
          setError('Satış kaydı bulunamadı');
          return;
        }

        const items: SaleItemRow[] = Array.isArray(row.sale_items)
          ? row.sale_items
          : [];

        // Varsayılan müşteri adı (satış kaydından)
        let customerName: string =
          row.customer_name || (row.customer_type === 'student' ? 'Öğrenci' : 'Müşteri');

        // Eğer öğrenci bağlantısı varsa, students API'sinden gerçek adı bulmaya çalış
        if (row.customer_type === 'student' && row.student_id) {
          try {
            const stuRes = await fetch('/api/students', { cache: 'no-store' });
            const stuJs = await stuRes.json().catch(() => null);
            let list: any[] = [];
            if (Array.isArray(stuJs?.data)) list = stuJs.data;
            else if (Array.isArray(stuJs?.students)) list = stuJs.students;
            else if (Array.isArray(stuJs)) list = stuJs;

            const stu = list.find((s: any) => s.id === row.student_id);
            if (stu) {
              const fullName =
                `${stu.first_name || ''} ${stu.last_name || ''}`.trim() ||
                stu.full_name ||
                stu.parent_name ||
                '';
              if (fullName) customerName = fullName;
            }
          } catch {
            // Öğrenci adı alınamazsa satıştaki customer_name kullanılmaya devam edilir
          }
        }

        setSale({
          id: row.id,
          sale_no: row.sale_no,
          customer_type: row.customer_type,
          student_id: row.student_id,
          sales_customer_id: row.sales_customer_id,
          customer_name: customerName,
          total_amount: Number(row.total_amount || 0),
          discount: Number(row.discount || 0),
          tax: Number(row.tax || 0),
          net_amount: Number(row.net_amount || 0),
          payment_method: row.payment_method,
          status: row.status,
          sale_date: row.sale_date,
          sale_items: items,
        });
      } catch (e: any) {
        setError(e?.message || 'Satış detayı alınamadı');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handleDeleteSale = async () => {
    if (!sale) return;
    // Kullanıcı onayı al
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      'Bu satışı ve ona bağlı tüm taksitleri silmek istediğinize emin misiniz?',
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/finance/sales/${sale.id}`, {
        method: 'DELETE',
      });
      const js = await res.json().catch(() => null);
      if (!res.ok || !js?.success) {
        // eslint-disable-next-line no-alert
        alert(js?.error || 'Satış silinemedi.');
        return;
      }
      // eslint-disable-next-line no-alert
      alert('Satış ve bağlı taksitler başarıyla silindi.');
      router.push('/finance/sales');
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || 'Satış silinirken bir hata oluştu.');
    }
  };

  // Satışa ait taksitleri yükle (sadece öğrenci satışlarında)
  const fetchInstallments = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingInstallments(true);
      const res = await fetch(`/api/finance/sales/installments?saleId=${id}`, {
        cache: 'no-store',
      });
      const js = await res.json().catch(() => null);
      if (!res.ok || !js?.success) {
        return;
      }
      setInstallmentsSummary(js.data as FinanceSummary);
    } finally {
      setLoadingInstallments(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchInstallments();
  }, [id, fetchInstallments]);

  const saleInstallments =
    ((installmentsSummary?.installments as FinanceInstallment[]) || []).filter(
      (it) => it.source === 'sale',
    );

  const handleOpenPay = (row: FinanceInstallment) => {
    setSelectedInstallment(row);
    setPaymentModalOpen(true);
  };

  const handleOpenEdit = (idInst: string) => {
    const row = saleInstallments.find((i) => i.id === idInst);
    if (row) {
      setSelectedInstallment(row);
      setEditModalOpen(true);
    }
  };

  const handleReceipt = (idInst: string) => {
    const row = saleInstallments.find((i) => i.id === idInst);
    if (!row || !sale) return;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(generateReceiptHTML(row, sale.customer_name || 'Öğrenci'));
      w.document.close();
    }
  };

  const today = new Date();
  const overdueDays = saleInstallments
    .filter((it) => !it.is_paid && it.due_date && new Date(it.due_date) < today)
    .reduce((sum, it) => {
      if (!it.due_date) return sum;
      const diffMs = today.getTime() - new Date(it.due_date).getTime();
      return sum + Math.round(diffMs / (1000 * 60 * 60 * 24));
    }, 0);

  const total = saleInstallments.reduce(
    (sum, it) => sum + Number(it.amount || 0),
    0,
  );
  const paid = saleInstallments.reduce(
    (sum, it) =>
      sum +
      Number(
        (it.paid_amount ?? (it.is_paid ? it.amount : 0)) || 0,
      ),
    0,
  );
  const remaining = Math.max(0, total - paid);

  const nextInstallmentNo =
    saleInstallments.length > 0
      ? Math.max(...saleInstallments.map((x) => Number(x.installment_no || 0))) + 1
      : 1;

  const handleExportExcel = () => {
    if (!sale || saleInstallments.length === 0) return;

    exportInstallmentPlanToExcel(
      saleInstallments,
      {
        studentName: sale.customer_name || 'Müşteri',
        className: null,
        parentName: null,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
      },
      `satis-taksit-plani-${sale.sale_no || 'rapor'}.xlsx`,
    );
  };

  const handleExportPDF = async () => {
    if (!sale || saleInstallments.length === 0) return;

    await exportInstallmentPlanToPDF(
      saleInstallments,
      {
        studentName: sale.customer_name || 'Müşteri',
        className: null,
        parentName: null,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
      },
      `satis-taksit-plani-${sale.sale_no || 'rapor'}.pdf`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/finance/sales')}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            Satış listesine dön
          </button>
          {sale && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteSale}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Satışı Sil
              </button>
              <Link
                href={`/finance/sales/invoice/${sale.id}`}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <FileText size={14} />
                Fatura Görüntüle
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm">
            Yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        ) : !sale ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm">
            Kayıt bulunamadı.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Üst bölüm: Satış bilgisi + finans özeti (eğitim ekranına benzer yapı) */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Satış Bilgisi
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Satış No</span>
                    <span className="font-semibold text-gray-900">{sale.sale_no}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tarih</span>
                    <span className="font-medium">
                      {sale.sale_date
                        ? new Date(sale.sale_date).toLocaleString('tr-TR')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Müşteri</span>
                    <span className="font-semibold text-gray-900">
                      {sale.customer_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tür</span>
                    <span className="font-medium">
                      {sale.customer_type === 'student' ? 'Öğrenci' : 'Harici Müşteri'}
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold">
                        <ShoppingCart size={16} />
                        Net Tutar
                      </span>
                      <span className="font-bold">
                        ₺{sale.net_amount.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Satış finans özeti kartı – eğitim finans özetine benzer ama farklı renklerle */}
              {sale.customer_type === 'student' ? (
                <SalesSummaryCard
                  total={total}
                  paid={paid}
                  remaining={remaining}
                  overdueDays={overdueDays}
                  onRestructure={() => setRestructureOpen(true)}
                  onAddInstallment={() => setAddInstallmentOpen(true)}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                />
              ) : (
                <div className="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm">
                  Bu satış için öğrenci bağlantısı yok. Taksit planı yalnızca öğrenci
                  satışlarında gösterilir.
                </div>
              )}
            </div>

            {/* Satış kalemleri tablosu */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Satış Kalemleri</h2>
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-2">Ürün</th>
                    <th className="px-4 py-2">Kategori</th>
                    <th className="px-4 py-2 text-right">Adet</th>
                    <th className="px-4 py-2 text-right">Birim Fiyat</th>
                    <th className="px-4 py-2 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sale.sale_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-2 text-xs uppercase tracking-wide text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-800">
                        ₺{Number(item.unit_price || 0).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        ₺{Number(item.total_price || 0).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50 text-sm">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-600">
                      Ara Toplam
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      ₺{sale.total_amount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-600">
                      İskonto
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      ₺{sale.discount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-600">
                      KDV
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      ₺{sale.tax.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-2 text-right font-semibold text-gray-900"
                    >
                      Net Tutar
                    </td>
                    <td className="px-4 py-2 text-right text-lg font-bold text-indigo-600">
                      ₺{sale.net_amount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Satış taksitleri – eğitim taksit tablosuyla aynı yapı, farklı renkler içeride */}
            {sale.customer_type === 'student' && (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Satış Taksitleri
                    </h2>
                    <p className="text-xs text-slate-500">
                      Bu satış için oluşturulan tüm taksitlerin listesi. Ödeme al, makbuz
                      ve düzenleme işlemleri eğitim ekranıyla aynı şekilde çalışır.
                    </p>
                  </div>
                </div>

                {loadingInstallments ? (
                  <div className="py-4 text-sm text-gray-500">
                    Satış taksit bilgileri yükleniyor...
                  </div>
                ) : (
                  <InstallmentTable
                    installments={saleInstallments}
                    source="sale"
                    saleId={sale.id}
                    studentId={sale.student_id || null}
                    onPay={(installmentId) => {
                      const row = saleInstallments.find((x) => x.id === installmentId);
                      if (row) handleOpenPay(row);
                    }}
                    onEdit={handleOpenEdit}
                    onReceipt={handleReceipt}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ortak ödeme / düzenleme modalları – eğitim ekranıyla aynı mantık */}
      {sale && sale.customer_type === 'student' && (
        <>
          <PaymentCollectionModal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            installment={selectedInstallment}
            studentName={sale.customer_name || 'Öğrenci'}
            onSuccess={fetchInstallments}
          />

          <EditPaymentModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            installment={selectedInstallment}
            studentName={sale.customer_name || 'Öğrenci'}
            onSuccess={fetchInstallments}
          />

          <AddSaleInstallmentModal
            open={addInstallmentOpen}
            onClose={() => setAddInstallmentOpen(false)}
            saleId={sale.id}
            studentId={sale.student_id || ''}
            nextInstallmentNo={nextInstallmentNo}
            defaultDueDate={new Date().toISOString().slice(0, 10)}
            onSuccess={fetchInstallments}
          />

          <SalesRestructureModal
            isOpen={restructureOpen}
            onClose={() => setRestructureOpen(false)}
            saleId={sale.id}
            studentId={sale.student_id || ''}
            currentSummary={installmentsSummary}
            onSuccess={fetchInstallments}
          />
        </>
      )}
    </div>
  );
}

