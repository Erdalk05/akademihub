'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, CheckCircle, BarChart3 } from 'lucide-react';
import { ExpenseStatusEnum, ExpenseTypeEnum } from '@/types/finance.types';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { usePermission } from '@/lib/hooks/usePermission';

type ExpenseRow = {
  id: string;
  title: string;
  category: ExpenseTypeEnum | string;
  amount: number;
  status: ExpenseStatusEnum | string;
  date: string;
  description?: string | null;
};

export default function ExpenseManagementPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  const { canAddExpense, canEditExpense, canDeleteExpense, isAdmin } = usePermission();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseTypeEnum>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatusEnum>('all');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState<ExpenseTypeEnum | ''>('');
  const [createAmount, setCreateAmount] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [quickDateRange, setQuickDateRange] = useState<
    'all' | 'this_month' | 'last_month' | 'this_year'
  >('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseTypeEnum | ''>('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Çoklu kurum desteği: organization_id filtresi
      const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
      const res = await fetch(`/api/finance/expenses${orgParam ? `?${orgParam}` : ''}`, { cache: 'no-store' });
      const js = await res.json();
      setExpenses(js.data || []);
    }

    load();
  }, [currentOrganization?.id]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError(null);

      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createTitle,
          category: createCategory,
          amount: Number(createAmount || 0),
          date: createDate,
          description: createDescription || null,
          organization_id: currentOrganization?.id || null,
        }),
        });

        const js = await res.json().catch(() => null);

      if (!res.ok || !js?.success) {
        setCreateError(js?.error || 'Gider kaydı oluşturulamadı.');
          return;
        }

      const created = js.data as any;

      setExpenses((prev) => [
        {
          id: created.id,
          title: created.title,
          category: created.category,
          amount: Number(created.amount || 0),
          status: created.status,
          date: created.date,
          description: created.description,
        },
        ...prev,
      ]);

      setIsCreateOpen(false);
      setCreateTitle('');
      setCreateCategory('');
      setCreateAmount('');
      setCreateDate('');
      setCreateDescription('');
      } catch {
      setCreateError('Gider kaydı sırasında bağlantı hatası oluştu.');
      } finally {
      setCreateLoading(false);
      }
    };

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    const inRange = (dateStr: string) => {
      if (quickDateRange === 'all') return true;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return true;
      if (quickDateRange === 'this_month') {
        return d >= startOfThisMonth && d <= now;
      }
      if (quickDateRange === 'last_month') {
        return d >= startOfLastMonth && d <= endOfLastMonth;
      }
      if (quickDateRange === 'this_year') {
        return d >= startOfThisYear && d <= now;
      }
      return true;
    };

    const filtered = expenses.filter((e) => {
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        String(e.category).toLowerCase().includes(q);
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchDate = inRange(e.date);
      return matchSearch && matchCategory && matchStatus && matchDate;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortOrder === 'desc' ? db - da : da - db;
      }
      const aa = Number(a.amount || 0);
      const ab = Number(b.amount || 0);
      return sortOrder === 'desc' ? ab - aa : aa - ab;
    });
  }, [expenses, searchQuery, categoryFilter, statusFilter, quickDateRange, sortBy, sortOrder]);

  const getStatusBadge = (status: ExpenseStatusEnum | string) => {
    const styles: Record<string, string> = {
      [ExpenseStatusEnum.PAID]: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      [ExpenseStatusEnum.APPROVED]: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      [ExpenseStatusEnum.PENDING]: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      [ExpenseStatusEnum.DRAFT]: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200',
      [ExpenseStatusEnum.REJECTED]: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      [ExpenseStatusEnum.CANCELLED]: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200',
    };
    const labels: Record<string, string> = {
      [ExpenseStatusEnum.PAID]: 'Ödendi ✓',
      [ExpenseStatusEnum.APPROVED]: 'Onaylandı',
      [ExpenseStatusEnum.PENDING]: 'Beklemede',
      [ExpenseStatusEnum.DRAFT]: 'Taslak',
      [ExpenseStatusEnum.REJECTED]: 'Reddedildi',
      [ExpenseStatusEnum.CANCELLED]: 'İptal',
    };
    return { styles: styles[status] || 'bg-gray-50 text-gray-700', label: labels[status] || status };
  };

  const totalCount = expenses.length;
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    let pendingTotal = 0;

    const byCategory: Record<string, number> = {};
    const byMonthKey: Record<string, number> = {};

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const amount = Number(e.amount || 0);
      if (!Number.isFinite(amount)) return;

      const m = d.getMonth();
      const y = d.getFullYear();

      if (y === thisYear && m === thisMonth) {
        thisMonthTotal += amount;
      }
      if (y === thisYear && m === thisMonth - 1) {
        lastMonthTotal += amount;
      }

      if (e.status === ExpenseStatusEnum.PENDING) {
        pendingTotal += amount;
      }

      const catKey = String(e.category || 'other');
      byCategory[catKey] = (byCategory[catKey] || 0) + amount;

      const key = `${y}-${m + 1}`;
      byMonthKey[key] = (byMonthKey[key] || 0) + amount;
    });

    const monthChange =
      thisMonthTotal === 0 && lastMonthTotal === 0
        ? 0
        : ((thisMonthTotal - lastMonthTotal) / (lastMonthTotal || thisMonthTotal || 1)) * 100;

    let topCategory: { category: string; amount: number } | null = null;
    Object.entries(byCategory).forEach(([cat, amount]) => {
      if (!topCategory || amount > topCategory.amount) {
        topCategory = { category: cat, amount };
      }
    });

    const monthlySeries = Object.entries(byMonthKey)
      .map(([key, amount]) => {
        const [y, m] = key.split('-').map(Number);
        return { key, year: y, month: m, amount };
      })
      .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
      .slice(-6);

    return {
      thisMonthTotal,
      lastMonthTotal,
      monthChange,
      pendingTotal,
      topCategory,
      monthlySeries,
    };
  }, [expenses]);

  const summaryByCategory = useMemo(() => {
    const map: Record<
      string,
      {
        spent: number;
      }
    > = {};
    expenses.forEach((e) => {
      if (!map[e.category]) {
        map[e.category] = { spent: 0 };
      }
      map[e.category].spent += Number(e.amount || 0);
    });
    return map;
  }, [expenses]);

  const maxSpent =
    Object.values(summaryByCategory).reduce((m, v) => Math.max(m, v.spent), 0) || 1;

  const openEdit = (expense: ExpenseRow) => {
    setEditId(expense.id);
    setEditTitle(String(expense.title || '').toLocaleUpperCase('tr-TR'));
    setEditCategory((expense.category as ExpenseTypeEnum) || '');
    setEditAmount(String(expense.amount ?? ''));
    setEditDate(
      expense.date ? new Date(expense.date).toISOString().slice(0, 10) : '',
    );
    setEditDescription(
      String(expense.description || '').toLocaleUpperCase('tr-TR'),
    );
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    try {
      setEditLoading(true);
      setEditError(null);

      const res = await fetch('/api/finance/expenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editId,
          title: editTitle,
          category: editCategory || null,
          amount: Number(editAmount || 0),
          date: editDate || null,
          description: editDescription || null,
        }),
      });

      const js = await res.json().catch(() => null);

      if (!res.ok || !js?.success) {
        setEditError(js?.error || 'Gider güncellenemedi.');
        return;
      }

      const updated = js.data as any;

      setExpenses((prev) =>
        prev.map((e) =>
          e.id === updated.id
            ? {
                id: updated.id,
                title: updated.title,
                category: updated.category,
                amount: Number(updated.amount || 0),
                status: updated.status,
                date: updated.date,
                description: updated.description,
              }
            : e,
        ),
      );

      setIsEditOpen(false);
      setEditId(null);
    } catch {
      setEditError('Gider güncellenirken bağlantı hatası oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);

      const res = await fetch(
        `/api/finance/expenses?id=${encodeURIComponent(deleteId)}`,
        {
          method: 'DELETE',
        },
      );

      const js = await res.json().catch(() => null);

      if (!res.ok || !js?.success) {
        setDeleteError(js?.error || 'Gider silinemedi.');
        return;
      }

      setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteError('Gider silinirken bağlantı hatası oluştu.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!filteredExpenses.length) return;

    const header = ['Başlık', 'Kategori', 'Durum', 'Tarih', 'Tutar', 'Açıklama'];
    const rows = filteredExpenses.map((e) => [
      e.title,
      String(e.category || ''),
      String(e.status || ''),
      e.date ? new Date(e.date).toLocaleDateString('tr-TR') : '',
      String(Number(e.amount || 0).toFixed(2)).replace('.', ','),
      (e.description || '').replace(/\r?\n/g, ' '),
    ]);

    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((c) => {
            const val = String(c ?? '');
            if (val.includes(';') || val.includes('"')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(';'),
      )
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giderler-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Gider Raporu</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { color: #075E54; border-bottom: 2px solid #25D366; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #075E54; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .total { font-weight: bold; background: #DCF8C6 !important; }
        </style>
      </head>
      <body>
        <h1>Gider Raporu - ${new Date().toLocaleDateString('tr-TR')}</h1>
        <p>Toplam: ${totalCount} kayıt | Tutar: ₺${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
        <table>
          <thead><tr><th>Tarih</th><th>Başlık</th><th>Kategori</th><th>Tutar</th></tr></thead>
          <tbody>
            ${expenses.map(e => `<tr><td>${new Date(e.expense_date).toLocaleDateString('tr-TR')}</td><td>${e.title}</td><td>${e.category}</td><td>₺${Number(e.amount).toLocaleString('tr-TR')}</td></tr>`).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;left:-9999px';
    document.body.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(html);
    iframe.contentWindow?.document.close();
    setTimeout(() => document.body.removeChild(iframe), 10000);
  };

  return (
    <div id="expenses-report" className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Gider Yönetimi</h1>
          <p className="text-gray-600">
            Toplam {totalCount} gider kaydı • Toplam Tutar:{' '}
            <span className="font-semibold">
              ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/finance/expenses/analytics')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1"
          >
            <BarChart3 size={16} />
            Grafikler
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            CSV Dışa Aktar
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            PDF Oluştur
          </button>
        {canAddExpense && (
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={20} />
            Yeni Gider
          </button>
        )}
      </div>
      </div>

      {/* Analitik Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
              Bu Ayın Toplam Gideri
            </p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              ₺{analytics.thisMonthTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
            <p
              className={`text-xs font-medium ${
                analytics.monthChange > 0
                  ? 'text-rose-600'
                  : analytics.monthChange < 0
                  ? 'text-emerald-600'
                  : 'text-gray-500'
              }`}
            >
              {analytics.monthChange > 0 && 'Geçen aya göre artış'}
              {analytics.monthChange < 0 && 'Geçen aya göre azalma'}
              {analytics.monthChange === 0 && 'Geçen aya göre değişim yok'}
              {analytics.lastMonthTotal > 0 &&
                ` (${analytics.monthChange.toFixed(1)}%)`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
              En Çok Harcama Yapılan Kategori
            </p>
            {analytics.topCategory ? (
              <>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {analytics.topCategory.category}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ₺{analytics.topCategory.amount.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Henüz veri yok</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
              Bekleyen Ödemeler
            </p>
            <p className="text-2xl font-bold text-amber-700 mb-1">
              ₺{analytics.pendingTotal.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-amber-600">
              Durumu <strong>Beklemede</strong> olan tüm giderlerin toplamı
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
              Son Ayların Gider Trendi
            </p>
            <div className="mt-2 h-20 flex items-end gap-1">
              {analytics.monthlySeries.length === 0 && (
                <p className="text-xs text-gray-500">Grafik için yeterli veri yok</p>
              )}
              {analytics.monthlySeries.map((m) => {
                const maxAmount =
                  analytics.monthlySeries.reduce(
                    (max, v) => Math.max(max, v.amount),
                    0,
                  ) || 1;
                const height = Math.max(8, (m.amount / maxAmount) * 60);
                return (
                  <div
                    key={m.key}
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                  >
                    <div
                      className="w-full rounded-full bg-indigo-500"
                      style={{ height }}
                    />
                    <span className="text-[10px] text-gray-500">
                      {m.month.toString().padStart(2, '0')}/{String(m.year).slice(-2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Gider</h2>
            {createError && (
              <div className="mb-3 text-sm text-rose-600 border border-rose-100 rounded-md px-3 py-2 bg-rose-50">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) =>
                    setCreateTitle(e.target.value.toLocaleUpperCase('tr-TR'))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  required
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value as ExpenseTypeEnum | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seçiniz</option>
                  <option value={ExpenseTypeEnum.PAYROLL}>Bordro</option>
                  <option value={ExpenseTypeEnum.UTILITIES}>Elektrik/Su/Gaz</option>
                  <option value={ExpenseTypeEnum.MATERIALS}>Malzeme</option>
                  <option value={ExpenseTypeEnum.MAINTENANCE}>Bakım</option>
                  <option value={ExpenseTypeEnum.RENT}>Kira</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={createAmount}
                  onChange={(e) => setCreateAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  required
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama (opsiyonel)
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) =>
                    setCreateDescription(e.target.value.toLocaleUpperCase('tr-TR'))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {createLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gideri Düzenle
            </h2>
            {editError && (
              <div className="mb-3 text-sm text-rose-600 border border-rose-100 rounded-md px-3 py-2 bg-rose-50">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) =>
                    setEditTitle(e.target.value.toLocaleUpperCase('tr-TR'))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(e.target.value as ExpenseTypeEnum | '')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seçiniz</option>
                  <option value={ExpenseTypeEnum.PAYROLL}>Bordro</option>
                  <option value={ExpenseTypeEnum.UTILITIES}>
                    Elektrik/Su/Gaz
                  </option>
                  <option value={ExpenseTypeEnum.MATERIALS}>Malzeme</option>
                  <option value={ExpenseTypeEnum.MAINTENANCE}>Bakım</option>
                  <option value={ExpenseTypeEnum.RENT}>Kira</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama (opsiyonel)
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(
                      e.target.value.toLocaleUpperCase('tr-TR'),
                    )
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {editLoading ? 'Güncelleniyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Gideri Sil
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Bu gider kaydını silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz.
            </p>
            {deleteError && (
              <div className="mb-3 text-sm text-rose-600 border border-rose-100 rounded-md px-3 py-2 bg-rose-50">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bütçe Duruşu – gerçek veriye dayalı kategori özetleri */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(summaryByCategory).map(([cat, val]) => {
          const ratio = Math.round((val.spent / maxSpent) * 100);
          return (
            <div
              key={cat}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  {cat}
                </p>
                <p className="text-xl font-semibold text-gray-900 mb-1">
                  ₺{val.spent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>Görece kullanım</span>
                  <span>%{ratio}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      ratio > 80
                        ? 'bg-rose-500'
                        : ratio > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(ratio, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6 sticky top-16 z-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Gider adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value={ExpenseTypeEnum.PAYROLL}>Bordro</option>
            <option value={ExpenseTypeEnum.UTILITIES}>Elektrik/Su/Gaz</option>
            <option value={ExpenseTypeEnum.MATERIALS}>Malzeme</option>
            <option value={ExpenseTypeEnum.MAINTENANCE}>Bakım</option>
            <option value={ExpenseTypeEnum.RENT}>Kira</option>
            <option value={ExpenseTypeEnum.EQUIPMENT}>Ekipman</option>
            <option value={ExpenseTypeEnum.ADMIN}>İdari</option>
            <option value={ExpenseTypeEnum.OTHER}>Diğer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value={ExpenseStatusEnum.PAID}>Ödendi</option>
            <option value={ExpenseStatusEnum.PENDING}>Bekliyor</option>
            <option value={ExpenseStatusEnum.CANCELLED}>İptal</option>
          </select>

          <select
            value={quickDateRange}
            onChange={(e) => setQuickDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm Tarihler</option>
            <option value="this_month">Bu Ay</option>
            <option value="last_month">Geçen Ay</option>
            <option value="this_year">Bu Yıl</option>
          </select>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">Tarihe göre</option>
              <option value="amount">Tutara göre</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-28 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gider Listesi */}
      <div className="space-y-4">
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-600">
            Yükleniyor...
          </div>
        )}
        {!loading && error && (
          <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6 text-center text-sm text-rose-600">
            {error}
          </div>
        )}
        {!loading && !error && filteredExpenses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-500">
            Kayıtlı gider bulunamadı.
          </div>
        )}
        {!loading &&
          !error &&
          filteredExpenses.map((expense) => {
            const badge = getStatusBadge(expense.status);
            return (
              <button
                key={expense.id}
                type="button"
                onClick={() => router.push(`/finance/expenses/${expense.id}`)}
                className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {expense.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${badge.styles}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {expense.description || 'Açıklama girilmemiş'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      <span>
                        Kategori:{' '}
                        <strong className="font-semibold">{expense.category}</strong>
                      </span>
                      <span>
                        Tarih:{' '}
                        <strong className="font-semibold">
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString('tr-TR')
                            : '-'}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-right min-w-[140px]">
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      ₺{expense.amount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <div className="flex gap-2 justify-end">
                    {expense.status === ExpenseStatusEnum.PENDING && isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs transition flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Onayla
                        </button>
                      )}
                      {canEditExpense && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(expense);
                          }}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs transition"
                        >
                          Düzenle
                        </button>
                      )}
                      {canDeleteExpense && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(expense.id);
                          }}
                          className="px-3 py-1 border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 text-xs transition"
                        >
                          Sil
                        </button>
                      )}
                      </div>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

