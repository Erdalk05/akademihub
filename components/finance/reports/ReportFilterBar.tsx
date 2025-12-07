 'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Filter, Search, Settings, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type DateRange = {
  start: string | null;
  end: string | null;
};

export default function ReportFilterBar() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Debounce – ileride backend filtrelerine bağlanacak
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const handleQuickRange = (preset: '30d' | 'thisYear' | 'thisMonth') => {
    const now = new Date();
    if (preset === '30d') {
      const past = new Date(now);
      past.setDate(now.getDate() - 30);
      setDateRange({
        start: past.toISOString().slice(0, 10),
        end: now.toISOString().slice(0, 10),
      });
      return;
    }
    if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      });
      return;
    }
    const start = new Date(now.getFullYear(), 0, 1);
    setDateRange({
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    });
  };

  const hasActiveFilters =
    !!debouncedSearch ||
    !!dateRange.start ||
    !!dateRange.end ||
    category !== 'all' ||
    status !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDateRange({ start: null, end: null });
    setCategory('all');
    setStatus('all');
  };

  const formatDateRangeLabel = (): string => {
    if (!dateRange.start && !dateRange.end) return 'Tarih seçilmedi';
    if (dateRange.start && dateRange.end) {
      return `${dateRange.start} → ${dateRange.end}`;
    }
    if (dateRange.start) return `${dateRange.start} → ...`;
    return `... → ${dateRange.end}`;
  };

  return (
    <>
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rapor ara... (isim, kategori, dönem)"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value.toLocaleUpperCase('tr-TR'))
              }
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <div className="hidden text-xs text-gray-500 md:block">Tarih:</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      start: e.target.value || null,
                    }))
                  }
                  className="h-6 border-none bg-transparent p-0 text-xs focus:outline-none"
                />
                <span className="px-1 text-gray-400">–</span>
                <input
                  type="date"
                  value={dateRange.end || ''}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      end: e.target.value || null,
                    }))
                  }
                  className="h-6 border-none bg-transparent p-0 text-xs focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleQuickRange('thisMonth')}
                className="hidden rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 md:inline-flex"
              >
                Bu ay
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange('30d')}
                className="hidden rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 md:inline-flex"
              >
                Son 30 gün
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange('thisYear')}
                className="hidden rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 md:inline-flex"
              >
                Bu yıl
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 md:mt-4 md:flex-row md:items-center md:justify-between">
          {/* Category & status */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-100 sm:w-48"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
                <option value="student">Öğrenci</option>
                <option value="analysis">Analiz</option>
                <option value="risk">Risk</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-gray-500 sm:inline">
                Durum:
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-100 sm:w-40"
              >
                <option value="all">Tümü</option>
                <option value="favorite">Favoriler</option>
                <option value="automatic">Otomatik</option>
                <option value="manual">Manuel</option>
                <option value="shared">Paylaşılan</option>
              </select>
            </div>
          </div>

          {/* Settings */}
          <div className="flex items-center justify-end gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <X className="h-3.5 w-3.5" />
                Filtreleri Temizle
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Rapor Ayarları
            </button>
          </div>
        </div>

        {/* Aktif filtre rozetleri */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <span className="text-xs font-medium text-gray-600">
              Aktif Filtreler:
            </span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                Arama: {debouncedSearch}
              </span>
            )}
            {(dateRange.start || dateRange.end) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                Tarih: {formatDateRangeLabel()}
              </span>
            )}
            {category !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                Kategori: {category.toLocaleUpperCase('tr-TR')}
              </span>
            )}
            {status !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                Durum: {status.toLocaleUpperCase('tr-TR')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Settings modal – şimdilik basit bir placeholder */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Rapor Ayarları"
        size="md"
      >
        <p className="mb-4 text-sm text-gray-600">
          Burada rapor modülüne özel varsayılan filtreler, tarih aralığı
          tercihleri ve export ayarları yapılandırılacaktır. Şimdilik bu ekran
          sadece taslak amaçlıdır.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>Varsayılan tarih aralığı (ör. Son 30 gün)</li>
          <li>Varsayılan rapor kategorileri</li>
          <li>PDF ve Excel export tercihleri</li>
          <li>Raporların varsayılan sıralama ölçütü</li>
        </ul>
      </Modal>
    </>
  );
}



