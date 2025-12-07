import React from 'react';
import { Search, Filter, ArrowUpDown, RotateCcw } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  classFilter: string;
  onClassChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  debtRangeFilter: string;
  onDebtRangeChange: (val: string) => void;
  typeFilter: string;
  onTypeChange: (val: string) => void;
  // Sıralama
  sortField?: string;
  onSortChange?: (field: string) => void;
  sortDirection?: 'asc' | 'desc';
  onSortDirectionChange?: () => void;
  // Temizle
  onClearFilters?: () => void;
}

export default function StudentFilterBar({
  search,
  onSearchChange,
  classFilter,
  onClassChange,
  statusFilter,
  onStatusChange,
  debtRangeFilter,
  onDebtRangeChange,
  typeFilter,
  onTypeChange,
  sortField = 'name',
  onSortChange,
  sortDirection = 'asc',
  onSortDirectionChange,
  onClearFilters,
}: Props) {
  
  const handleClearAll = () => {
    onSearchChange('');
    onClassChange('');
    onStatusChange('hepsi');
    onDebtRangeChange('all');
    onTypeChange('');
    onClearFilters?.();
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Filter size={16} className="text-gray-500" />
          Filtreleme & Sıralama
        </h2>
        <button 
          onClick={handleClearAll}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
        >
          <RotateCcw size={12} />
          Tümünü Temizle
        </button>
      </div>

      {/* Birinci Satır - Ana Filtreler */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Genel Arama
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Öğrenci, Veli, Tel, İşlem No..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Class */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Sınıf / Şube
          </label>
          <input
            type="text"
            value={classFilter}
            onChange={(e) => onClassChange(e.target.value)}
            placeholder="Örn: 9-A"
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Durum
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="hepsi">Tümü</option>
            <option value="aktif">✅ Aktif</option>
            <option value="borclu">⚠️ Borcu Olanlar</option>
            <option value="borcsuz">✓ Borcu Olmayanlar</option>
            <option value="gecikmis">🔴 Gecikmede Olanlar</option>
            <option value="riskli">⚡ Riskli Kayıtlar</option>
            <option value="pasif">⏸️ Pasif / Ayrılan</option>
            <option value="mezun">🎓 Mezunlar</option>
          </select>
        </div>

        {/* Debt Range */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Borç Aralığı
          </label>
          <select
            value={debtRangeFilter}
            onChange={(e) => onDebtRangeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="all">Tümü</option>
            <option value="0-0">Borcu Yok (₺0)</option>
            <option value="1-1000">₺1 - ₺1.000</option>
            <option value="1000-5000">₺1.000 - ₺5.000</option>
            <option value="5000-10000">₺5.000 - ₺10.000</option>
            <option value="10000-50000">₺10.000 - ₺50.000</option>
            <option value="50000+">₺50.000 üzeri</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Sırala
          </label>
          <div className="flex gap-1">
            <select
              value={sortField}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="name">Ada Göre</option>
              <option value="class">Sınıfa Göre</option>
              <option value="debt">Borca Göre</option>
              <option value="risk">Riske Göre</option>
              <option value="created_at">Kayıt Tarihi</option>
              <option value="student_no">Öğrenci No</option>
            </select>
            <button
              onClick={onSortDirectionChange}
              className="px-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title={sortDirection === 'asc' ? 'Artan' : 'Azalan'}
            >
              <ArrowUpDown size={16} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* İkinci Satır - Ek Filtreler */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Registration Type */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Kayıt Tipi
          </label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tümü</option>
            <option value="yillik">📚 Yıllık Eğitim</option>
            <option value="kurs">📖 Kurs / Etüt</option>
            <option value="yazokulu">☀️ Yaz Okulu</option>
            <option value="servis">🚌 Sadece Servis</option>
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Öğretim Yılı
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tümü</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
          </select>
        </div>

        {/* Grade Level */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Sınıf Seviyesi
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tümü</option>
            <option value="anasinifi">Anaokulu</option>
            <option value="ilkokul">İlkokul (1-4)</option>
            <option value="ortaokul">Ortaokul (5-8)</option>
            <option value="lise">Lise (9-12)</option>
          </select>
        </div>

        {/* Payment Status */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Ödeme Durumu
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tümü</option>
            <option value="completed">✅ Tamamlandı</option>
            <option value="partial">🔄 Devam Ediyor</option>
            <option value="pending">⏳ Bekliyor</option>
            <option value="overdue">🔴 Gecikmiş</option>
          </select>
        </div>

        {/* Registration Period */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Kayıt Dönemi
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tümü</option>
            <option value="today">Bugün</option>
            <option value="thisWeek">Bu Hafta</option>
            <option value="thisMonth">Bu Ay</option>
            <option value="last3Months">Son 3 Ay</option>
            <option value="thisYear">Bu Yıl</option>
          </select>
        </div>
      </div>
    </div>
  );
}
