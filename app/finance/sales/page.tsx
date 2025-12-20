'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, ShoppingCart, Eye } from 'lucide-react';
import { SaleStatusEnum } from '@/types/finance.types';
import SalesFinanceCards from '@/components/finance/SalesFinanceCards';
import { usePermission } from '@/lib/hooks/usePermission';

type UISale = {
  id: string;
  sale_no: string;
  customer_name: string;
  status: SaleStatusEnum | 'completed' | 'pending' | 'cancelled' | 'refunded';
  total_amount: number;
  tax: number;
  net_amount: number;
  sale_date: string;
  item_count: number;
  student_id?: string | null;
  customer_type?: 'student' | 'external';
};

export default function SalesManagementPage() {
  const { canCreateSale, canEditSale, canDeleteSale, isAdmin } = usePermission();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SaleStatusEnum>('all');
  const [sales, setSales] = useState<UISale[]>([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalSales: number;
    last30Net: number;
    studentNet: number;
    externalNet: number;
    topProductName: string | null;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/finance/sales', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(js?.sales)) return;

        const mapped: UISale[] = js.sales.map((row: any) => {
          const saleItems = Array.isArray(row.sale_items) ? row.sale_items : [];
          const item_count =
            saleItems.length > 0 && typeof saleItems[0]?.count === 'number'
              ? saleItems[0].count
              : saleItems.length;

          return {
            id: row.id,
            sale_no: row.sale_no,
            customer_name:
              row.customer_name ||
              (row.customer_type === 'student' ? 'Öğrenci' : 'Müşteri'),
            status: (row.status as UISale['status']) || 'completed',
            total_amount: Number(row.total_amount || 0),
            tax: Number(row.tax || 0),
            net_amount: Number(row.net_amount || 0),
            sale_date: row.sale_date,
            item_count,
            student_id: row.student_id || null,
            customer_type: row.customer_type as UISale['customer_type'],
          };
        });

        setSales(mapped);

        // Satış analitiği (öğrenci sayfasındaki finans kartlarına benzer üst kartlar için)
        try {
          const analyticsRes = await fetch('/api/finance/sales-analytics?days=30', {
            cache: 'no-store',
          });
          const analyticsJs = await analyticsRes.json().catch(() => null);
          if (analyticsRes.ok && analyticsJs?.success && analyticsJs.data) {
            const d = analyticsJs.data;
            const ratio = d.customerTypeRatio || {};
            const topProducts = Array.isArray(d.topProducts) ? d.topProducts : [];

            setStats({
              totalSales: mapped.length,
              last30Net: Number(ratio.totalNet || 0),
              studentNet: Number(ratio.studentNet || 0),
              externalNet: Number(ratio.externalNet || 0),
              topProductName: topProducts[0]?.name || null,
            });
          } else {
            setStats({
              totalSales: mapped.length,
              last30Net: 0,
              studentNet: 0,
              externalNet: 0,
              topProductName: null,
            });
          }
        } catch {
          setStats({
            totalSales: mapped.length,
            last30Net: 0,
            studentNet: 0,
            externalNet: 0,
            topProductName: null,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Öğrencileri bir kez yükle (arama için)
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await fetch('/api/students', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (js?.success && Array.isArray(js.data)) {
          setStudents(js.data);
        }
      } catch {
        setStudents([]);
      }
    };

    loadStudents();
  }, []);

  const filteredSales = useMemo(
    () =>
      sales.filter((s) => {
        const query = searchQuery.toLowerCase();
        const matchSearch =
          s.customer_name.toLowerCase().includes(query) ||
          s.sale_no.toLowerCase().includes(query);
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [sales, searchQuery, statusFilter],
  );

  const matchedStudent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return (
      students.find((s: any) => {
        const fullName =
          `${s.first_name || s.name || ''} ${s.last_name || ''}`.trim() ||
          s.full_name ||
          s.parent_name ||
          '';
        return fullName.toLowerCase().includes(q);
      }) || null
    );
  }, [students, searchQuery]);

  // Öğrenci ID'sinden hızlıca isim bulmak için map
  const studentMap = useMemo(() => {
    const map: Record<string, any> = {};
    students.forEach((s: any) => {
      if (!s?.id) return;
      map[s.id] = s;
    });
    return map;
  }, [students]);

  const getStatusBadge = (status: SaleStatusEnum) => {
    const styles = {
      [SaleStatusEnum.COMPLETED]:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      [SaleStatusEnum.PENDING]:
        'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      [SaleStatusEnum.CANCELLED]:
        'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      [SaleStatusEnum.REFUNDED]:
        'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    };
    const labels = {
      [SaleStatusEnum.COMPLETED]: 'Tamamlandı ✓',
      [SaleStatusEnum.PENDING]: 'Bekleniyor',
      [SaleStatusEnum.CANCELLED]: 'İptal',
      [SaleStatusEnum.REFUNDED]: 'İade',
    };
    return { styles: styles[status], label: labels[status] };
  };

  // Eğer uzak analytics isteği başarısız olursa bile, en azından lokal satış
  // verilerinden özet kartları doldurmak için türetilmiş istatistikler:
  const derivedStats = useMemo(() => {
    if (stats) return stats;
    const totalSales = sales.length;
    const totalNet = sales.reduce((sum, s) => sum + Number(s.net_amount || 0), 0);
    return {
      totalSales,
      last30Net: totalNet,
      studentNet: 0,
      externalNet: 0,
      topProductName: null,
    };
  }, [stats, sales]);

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
        {/* Header & Actions – öğrenci listesindeki yapıya benzer */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 truncate">
              Satış Listesi & Finans
            </h1>
            <p className="text-sm text-gray-500">
              Satış işlemleri, taksitler ve fatura yönetimi.
            </p>
          </div>
          <Link
            href="/finance/sales/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Yeni Satış
          </Link>
        </div>

        {/* Üst finans kartları – Öğrenci listesindeki finans kartlarına benzer, satışa özel */}
        <SalesFinanceCards stats={derivedStats} />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Müşteri adı veya satış no ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !loading &&
                    filteredSales.length === 0 &&
                    matchedStudent
                  ) {
                    router.push(`/finance/sales/new?studentId=${matchedStudent.id}`);
                  }
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value={SaleStatusEnum.COMPLETED}>Tamamlandı</option>
              <option value={SaleStatusEnum.PENDING}>Bekleniyor</option>
              <option value={SaleStatusEnum.CANCELLED}>İptal</option>
            </select>
          </div>
        </div>

        {/* Öğrenci bulundu ama satış yoksa hızlı yönlendirme */}
        {searchQuery.trim() &&
          !loading &&
          filteredSales.length === 0 &&
          matchedStudent && (
            <div className="mb-6 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {matchedStudent.first_name || matchedStudent.name}{' '}
                    {matchedStudent.last_name}
                  </p>
                  <p className="text-[11px] text-indigo-700">
                    Bu öğrenci için kayıtlı satış bulunamadı. Hızlıca yeni satış
                    oluşturmak için aşağıdaki butona tıklayın.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/finance/sales/new?studentId=${matchedStudent.id}`)
                  }
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700"
                >
                  {matchedStudent.first_name || matchedStudent.name} için Yeni Satış
                </button>
              </div>
            </div>
          )}

        {/* Liste – Öğrenci listesindeki tablo yapısına benzer şekilde satır bazlı görünüm */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingCart size={48} className="mb-3 text-gray-300" />
              <p>Kayıtlı satış bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-visible">
              <table className="w-full min-w-0 border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-left text-xs font-medium text-slate-200">
                    <th className="px-6 py-4 font-semibold">Müşteri / Satış</th>
                    <th className="px-6 py-4 font-semibold">Tutar Bilgisi</th>
                    <th className="px-6 py-4 font-semibold">Durum</th>
                    <th className="px-6 py-4 font-semibold text-right">Hızlı İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((sale) => {
                    const badge = getStatusBadge(sale.status as SaleStatusEnum);

                    const stu = sale.student_id ? studentMap[sale.student_id] : null;
                    const nameFromStudent = stu
                      ? (
                          `${stu.first_name || ''} ${stu.last_name || ''}`.trim() ||
                          stu.full_name ||
                          stu.parent_name ||
                          ''
                        )
                      : '';
                    const displayName =
                      nameFromStudent || sale.customer_name || 'Öğrenci';

                    return (
                      <tr
                        key={sale.id}
                        className="group cursor-pointer hover:bg-blue-50/30 transition-colors"
                        onClick={() => router.push(`/finance/sales/${sale.id}`)}
                      >
                        {/* Müşteri / Satış */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-xs shadow-sm">
                              {displayName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {displayName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{sale.sale_no}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span>
                                  {sale.sale_date
                                    ? new Date(sale.sale_date).toLocaleString('tr-TR')
                                    : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tutar bilgisi */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-gray-900">
                              ₺{sale.net_amount.toLocaleString('tr-TR')}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span>Toplam: ₺{sale.total_amount.toLocaleString('tr-TR')}</span>
                              <span className="h-1 w-1 rounded-full bg-gray-300" />
                              <span>KDV: ₺{sale.tax.toLocaleString('tr-TR')}</span>
                            </div>
                          </div>
                        </td>

                        {/* Durum */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badge.styles}`}
                          >
                            {badge.label}
                          </span>
                          <div className="mt-1 text-[11px] text-gray-400">
                            Ürün adedi: {sale.item_count}
                          </div>
                        </td>

                        {/* Hızlı işlem */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/finance/sales/${sale.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Satış Detayları"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              href={`/finance/sales/invoice/${sale.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              title="Fatura"
                            >
                              <ShoppingCart size={18} />
                            </Link>
                            {sale.customer_type === 'student' && sale.student_id && (
                              <Link
                                href={`/students/${sale.student_id}?tab=finance`}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-full px-3 py-1 text-[11px] font-medium text-purple-700 bg-purple-50/70 hover:bg-purple-100 transition-colors"
                              >
                                Eğitim Taksitleri
                              </Link>
                            )}
                          </div>
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
