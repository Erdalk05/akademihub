'use client';

import React, { useState } from 'react';
import { X, Filter, RotateCcw, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export interface AdvancedFilters {
  classes?: string[];
  sections?: string[];
  minDebt?: number;
  maxDebt?: number;
  riskLevels?: string[];
  registrationDateFrom?: string;
  registrationDateTo?: string;
  status?: string[];
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFilters) => void;
  currentFilters?: AdvancedFilters;
}

const FILTER_PRESETS = [
  {
    id: 'high-risk',
    label: '🔴 Yüksek Riskli',
    filters: { riskLevels: ['Yüksek'], minDebt: 5000 }
  },
  {
    id: 'overdue',
    label: '⚠️ Gecikmiş Borçlular',
    filters: { minDebt: 1000, riskLevels: ['Yüksek', 'Orta'] }
  },
  {
    id: 'new-students',
    label: '🆕 Yeni Kayıtlar (30 gün)',
    filters: { 
      registrationDateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  },
  {
    id: 'grade-9',
    label: '📚 9. Sınıflar',
    filters: { classes: ['9'] }
  }
];

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters = {}
}: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<AdvancedFilters>(currentFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    toast.success('Filtreler uygulandı!');
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    toast('Filtreler sıfırlandı', { icon: 'ℹ️' });
  };

  const applyPreset = (preset: typeof FILTER_PRESETS[0]) => {
    setFilters(preset.filters);
    toast(`"${preset.label}" filtresi uygulandı`, { icon: 'ℹ️' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-6 h-6 text-indigo-600" />
            Gelişmiş Filtreleme
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Filter Presets */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Hızlı Filtreler</p>
            <div className="flex flex-wrap gap-2">
              {FILTER_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sınıf Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sınıf
            </label>
            <select
              multiple
              value={filters.classes || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, classes: selected });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {['5', '6', '7', '8', '9', '10', '11', '12'].map(grade => (
                <option key={grade} value={grade}>{grade}. Sınıf</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Ctrl/Cmd + tıklayarak birden fazla seçebilirsiniz
            </p>
          </div>

          {/* Borç Aralığı */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Borç (₺)
              </label>
              <input
                type="number"
                value={filters.minDebt || ''}
                onChange={(e) => setFilters({ ...filters, minDebt: parseInt(e.target.value) || undefined })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Borç (₺)
              </label>
              <input
                type="number"
                value={filters.maxDebt || ''}
                onChange={(e) => setFilters({ ...filters, maxDebt: parseInt(e.target.value) || undefined })}
                placeholder="999999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Risk Seviyeleri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Seviyeleri
            </label>
            <div className="flex flex-wrap gap-2">
              {['Yüksek', 'Orta', 'Düşük', 'Yok'].map(risk => (
                <label
                  key={risk}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={filters.riskLevels?.includes(risk) || false}
                    onChange={(e) => {
                      const current = filters.riskLevels || [];
                      if (e.target.checked) {
                        setFilters({ ...filters, riskLevels: [...current, risk] });
                      } else {
                        setFilters({ ...filters, riskLevels: current.filter(r => r !== risk) });
                      }
                    }}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm">{risk}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Kayıt Tarihi Aralığı */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kayıt Başlangıç
              </label>
              <input
                type="date"
                value={filters.registrationDateFrom || ''}
                onChange={(e) => setFilters({ ...filters, registrationDateFrom: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kayıt Bitiş
              </label>
              <input
                type="date"
                value={filters.registrationDateTo || ''}
                onChange={(e) => setFilters({ ...filters, registrationDateTo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Öğrenci Durumu
            </label>
            <div className="flex flex-wrap gap-2">
              {['Aktif', 'Pasif', 'Mezun', 'Donduruldu'].map(status => (
                <label
                  key={status}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => {
                      const current = filters.status || [];
                      if (e.target.checked) {
                        setFilters({ ...filters, status: [...current, status] });
                      } else {
                        setFilters({ ...filters, status: current.filter(s => s !== status) });
                      }
                    }}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition"
          >
            <RotateCcw className="w-4 h-4" />
            Sıfırla
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Filtreyi Uygula
          </button>
        </div>
      </div>
    </div>
  );
}





