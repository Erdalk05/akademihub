'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Settings,
  Download,
  Users,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type {
  ExamSection,
  AdvancedFilters,
  ColumnSettings,
  BulkActionType,
} from '@/types/spectra-detail';
import { FilterAccordion } from './FilterAccordion';
import { ViewSettings } from './ViewSettings';
import { ExportOptions } from './ExportOptions';
import { BulkActions } from './BulkActions';

// ============================================================================
// GELİŞMİŞ TOOLBAR COMPONENT
// 4 Akordiyon bölümlü profesyonel toolbar
// ============================================================================

interface AdvancedToolbarProps {
  // Veri
  sections: ExamSection[];
  siniflar: string[];
  toplamOgrenci: number;
  filtrelenmisOgrenci: number;
  // Filtre
  filters: AdvancedFilters;
  onFilterChange: (filters: Partial<AdvancedFilters>) => void;
  onResetFilters: () => void;
  // Kolon
  columns: ColumnSettings;
  onColumnChange: (key: keyof ColumnSettings, value: any) => void;
  onResetColumns: () => void;
  // Export
  onExportExcel: (format: 'ozdebir' | 'k12net' | 'standart') => void;
  onExportPdf: (format: 'toplu' | 'bireysel' | 'detayli') => void;
  onPrint: () => void;
  isExporting: boolean;
  // Toplu işlem
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (action: BulkActionType) => void;
  isProcessing: boolean;
}

type AccordionSection = 'filters' | 'view' | 'export' | 'bulk';

export function AdvancedToolbar({
  sections,
  siniflar,
  toplamOgrenci,
  filtrelenmisOgrenci,
  filters,
  onFilterChange,
  onResetFilters,
  columns,
  onColumnChange,
  onResetColumns,
  onExportExcel,
  onExportPdf,
  onPrint,
  isExporting,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  isProcessing,
}: AdvancedToolbarProps) {
  const [expandedSection, setExpandedSection] = useState<AccordionSection | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const hasActiveFilters = 
    filters.search ||
    filters.siniflar.length > 0 ||
    filters.participantType !== 'all' ||
    filters.kitapcik.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-800">Filtre & Araçlar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Sıfırla
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            {isCollapsed ? 'Genişlet' : 'Daralt'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HIZLI ARAÇLAR (Her zaman görünür) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex flex-wrap items-center gap-3">
                {/* Arama */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Öğrenci ara..."
                    value={filters.search}
                    onChange={(e) => onFilterChange({ search: e.target.value })}
                    className="pl-10"
                  />
                </div>

                {/* Sınıf */}
                <Select
                  value={filters.siniflar[0] || 'all'}
                  onValueChange={(v) =>
                    onFilterChange({ siniflar: v === 'all' ? [] : [v] })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sınıf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sınıflar</SelectItem>
                    {siniflar.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Tip */}
                <Select
                  value={filters.participantType}
                  onValueChange={(v: 'all' | 'institution' | 'guest') =>
                    onFilterChange({ participantType: v })
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="institution">Asil</SelectItem>
                    <SelectItem value="guest">Misafir</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sıralama */}
                <Select
                  value={`${filters.sortBy}_${filters.sortOrder}`}
                  onValueChange={(v) => {
                    const [sortBy, sortOrder] = v.split('_') as [
                      'rank' | 'name' | 'net' | 'class',
                      'asc' | 'desc'
                    ];
                    onFilterChange({ sortBy, sortOrder });
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sıralama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net_desc">Net (Yüksek→Düşük)</SelectItem>
                    <SelectItem value="net_asc">Net (Düşük→Yüksek)</SelectItem>
                    <SelectItem value="name_asc">İsim (A→Z)</SelectItem>
                    <SelectItem value="rank_asc">Sıra</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sayfa Başına */}
                <Select
                  value={String(filters.pageSize)}
                  onValueChange={(v) =>
                    onFilterChange({ pageSize: v === 'all' ? 1000 : Number(v), currentPage: 1 })
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="all">Tümü</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aktif Filtre Bilgisi */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-emerald-600">
                        {filtrelenmisOgrenci}
                      </span>
                      <span className="text-gray-500">/{toplamOgrenci} öğrenci</span>
                    </span>
                  </div>

                  {/* Aktif filtre badge'leri */}
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1">
                      Arama: "{filters.search}"
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => onFilterChange({ search: '' })}
                      />
                    </Badge>
                  )}
                  {filters.siniflar.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Sınıf: {filters.siniflar.join(', ')}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => onFilterChange({ siniflar: [] })}
                      />
                    </Badge>
                  )}
                  {filters.participantType !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.participantType === 'institution' ? 'Asil' : 'Misafir'}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => onFilterChange({ participantType: 'all' })}
                      />
                    </Badge>
                  )}
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={onResetFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Temizle
                  </Button>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* AKORDİYON SEKSİYONLARI */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* Gelişmiş Filtreler */}
            <AccordionItem
              title="📋 Gelişmiş Filtreler"
              icon={<Filter className="h-4 w-4" />}
              isExpanded={expandedSection === 'filters'}
              onToggle={() => toggleSection('filters')}
            >
              <FilterAccordion
                sections={sections}
                siniflar={siniflar}
                filters={filters}
                onFilterChange={onFilterChange}
              />
            </AccordionItem>

            {/* Görünüm Ayarları */}
            <AccordionItem
              title="📊 Görünüm Ayarları"
              icon={<Settings className="h-4 w-4" />}
              isExpanded={expandedSection === 'view'}
              onToggle={() => toggleSection('view')}
            >
              <ViewSettings
                sections={sections}
                columns={columns}
                onColumnChange={onColumnChange}
                onReset={onResetColumns}
              />
            </AccordionItem>

            {/* Export & Raporlar */}
            <AccordionItem
              title="📤 Export & Raporlar"
              icon={<Download className="h-4 w-4" />}
              isExpanded={expandedSection === 'export'}
              onToggle={() => toggleSection('export')}
            >
              <ExportOptions
                onExportExcel={onExportExcel}
                onExportPdf={onExportPdf}
                onPrint={onPrint}
                isExporting={isExporting}
              />
            </AccordionItem>

            {/* Toplu İşlemler */}
            <AccordionItem
              title="🔧 Toplu İşlemler"
              icon={<Users className="h-4 w-4" />}
              isExpanded={expandedSection === 'bulk'}
              onToggle={() => toggleSection('bulk')}
              badge={selectedCount > 0 ? selectedCount : undefined}
            >
              <BulkActions
                selectedCount={selectedCount}
                onSelectAll={onSelectAll}
                onClearSelection={onClearSelection}
                onAction={onBulkAction}
                isProcessing={isProcessing}
              />
            </AccordionItem>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCORDION ITEM
// ═══════════════════════════════════════════════════════════════════════════

function AccordionItem({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-700">{title}</span>
          {badge !== undefined && (
            <Badge variant="default" className="bg-emerald-600">
              {badge}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
