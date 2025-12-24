'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Database,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  Layers,
  LayoutTemplate,
  LineChart as LineChartIcon,
  Link2,
  Loader2,
  Play,
  Plus,
  Printer,
  Save,
  Search,
  Settings2,
  SortAsc,
  SortDesc,
  Sparkles,
  Table2,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  REPORT_TABLES,
  REPORT_RELATIONS,
  type ReportTable,
  type ReportField,
} from '@/lib/reporting/freeReportSchema';
import type {
  FreeReportRequest,
  SelectField,
  RelativeDatePreset,
} from '@/lib/reporting/freeReportSqlBuilder';

// ============================================================
// TYPES
// ============================================================

type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max' | null;

type SelectedField = {
  table: ReportTable;
  field: ReportField;
  sort?: 'asc' | 'desc' | null;
  aggregation?: AggregationType;
  customLabel?: string;
};

type FilterRule = {
  id: string;
  table: string;
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
  value: string | number | string[];
};

type SavedReport = {
  id: string;
  name: string;
  description: string;
  category: string;
  selectedFields: { tableName: string; fieldName: string; customLabel?: string; sort?: string; aggregation?: string }[];
  filterRules: FilterRule[];
  groupByField: string | null;
  joinedTables: string[];
  datePreset: string | null;
  savedAt: string;
};

type ChartType = 'bar' | 'pie' | 'line';

type DateRangeOption = {
  id: RelativeDatePreset | 'custom';
  label: string;
  icon: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const COLORS = ['#25D366', '#075E54', '#128C7E', '#34B7F1', '#00A884', '#667781', '#FF6B6B', '#4ECDC4'];

const QUICK_TEMPLATES = [
  { id: 'students', label: 'Öğrenciler', icon: '👥', table: 'students', fields: ['student_no', 'first_name', 'last_name', 'class', 'status', 'net_fee'] },
  { id: 'installments', label: 'Taksitler', icon: '💰', table: 'finance_installments', fields: ['student_id', 'installment_no', 'amount', 'due_date', 'status'] },
  { id: 'expenses', label: 'Giderler', icon: '📊', table: 'expenses', fields: ['title', 'category', 'amount', 'date', 'status'] },
  { id: 'payments', label: 'Ödemeler', icon: '💳', table: 'payments', fields: ['student_id', 'amount', 'payment_method', 'payment_date', 'status'] },
];

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { id: 'today', label: 'Bugün', icon: '📅' },
  { id: 'this_week', label: 'Bu Hafta', icon: '📆' },
  { id: 'this_month', label: 'Bu Ay', icon: '🗓️' },
  { id: 'last_30_days', label: 'Son 30 Gün', icon: '⏳' },
  { id: 'this_year', label: 'Bu Yıl', icon: '📊' },
  { id: 'custom', label: 'Özel', icon: '⚙️' },
];

const AGGREGATION_OPTIONS: { value: AggregationType; label: string; icon: string }[] = [
  { value: null, label: 'Yok', icon: '−' },
  { value: 'sum', label: 'Toplam', icon: 'Σ' },
  { value: 'count', label: 'Sayı', icon: '#' },
  { value: 'avg', label: 'Ortalama', icon: 'μ' },
  { value: 'min', label: 'Min', icon: '↓' },
  { value: 'max', label: 'Max', icon: '↑' },
];

// ============================================================
// COMPONENT
// ============================================================

export default function FreeReportBuilderPage() {
  // State
  const [reportName, setReportName] = useState('Yeni Rapor');
  const [reportDescription, setReportDescription] = useState('');
  const [reportCategory, setReportCategory] = useState('GENEL');
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [datePreset, setDatePreset] = useState<RelativeDatePreset | null>(null);
  const [groupByField, setGroupByField] = useState<string | null>(null);
  const [joinedTables, setJoinedTables] = useState<string[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'fields' | 'saved'>('fields');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<string[]>(['students']);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [showGraph, setShowGraph] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const tableRef = useRef<HTMLTableElement>(null);

  // Load saved reports on mount
  useEffect(() => {
    const saved = localStorage.getItem('akademihub-saved-reports');
    if (saved) {
      try {
        setSavedReports(JSON.parse(saved));
      } catch (e) {
        console.error('Kayıtlı raporlar yüklenemedi:', e);
      }
    }
  }, []);

  // Computed
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [rows, currentPage, itemsPerPage]);

  const primaryTable = selectedFields.length > 0 ? selectedFields[0].table.name : null;

  const availableJoins = useMemo(() => {
    if (!primaryTable) return [];
    return REPORT_RELATIONS.filter(
      (r) => r.fromTable === primaryTable || r.toTable === primaryTable
    ).map((r) => (r.fromTable === primaryTable ? r.toTable : r.fromTable));
  }, [primaryTable]);

  const groupableFields = useMemo(() => {
    return selectedFields.filter((sf) => sf.field.type === 'category' || sf.field.type === 'text');
  }, [selectedFields]);

  const numericFields = useMemo(() => {
    return selectedFields.filter((sf) => sf.field.type === 'currency' || sf.field.type === 'number');
  }, [selectedFields]);

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_TABLES;
    const q = searchQuery.toLowerCase();
    return REPORT_TABLES.map((table) => ({
      ...table,
      fields: table.fields.filter(
        (f) => f.label.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
      ),
    })).filter((t) => t.fields.length > 0 || t.label.toLowerCase().includes(q));
  }, [searchQuery]);

  // Calculate summary row
  const summaryRow = useMemo(() => {
    if (rows.length === 0) return null;
    
    const summary: Record<string, { sum: number; count: number; avg: number }> = {};
    
    numericFields.forEach((sf) => {
      const key = `${sf.table.name}_${sf.field.name}`;
      let sum = 0;
      let count = 0;
      
      rows.forEach((row) => {
        const val = row[key] ?? row[sf.field.name];
        if (typeof val === 'number') {
          sum += val;
          count++;
        }
      });
      
      summary[key] = {
        sum,
        count,
        avg: count > 0 ? sum / count : 0,
      };
    });
    
    return summary;
  }, [rows, numericFields]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const toggleField = useCallback((table: ReportTable, field: ReportField) => {
    setIsSaved(false);
    setSelectedFields((prev) => {
      const exists = prev.find(
        (sf) => sf.table.name === table.name && sf.field.name === field.name
      );
      if (exists) {
        return prev.filter(
          (sf) => !(sf.table.name === table.name && sf.field.name === field.name)
        );
      }
      return [...prev, { table, field }];
    });
  }, []);

  const selectAllFields = useCallback((table: ReportTable) => {
    setIsSaved(false);
    setSelectedFields((prev) => {
      // Check if all fields from this table are already selected
      const allSelected = table.fields.every((field) =>
        prev.some((sf) => sf.table.name === table.name && sf.field.name === field.name)
      );
      
      if (allSelected) {
        // Deselect all fields from this table
        return prev.filter((sf) => sf.table.name !== table.name);
      } else {
        // Add all fields from this table that aren't already selected
        const newFields = table.fields
          .filter((field) => !prev.some((sf) => sf.table.name === table.name && sf.field.name === field.name))
          .map((field) => ({ table, field }));
        return [...prev, ...newFields];
      }
    });
  }, []);

  const removeField = useCallback((tableName: string, fieldName: string) => {
    setIsSaved(false);
    setSelectedFields((prev) =>
      prev.filter((sf) => !(sf.table.name === tableName && sf.field.name === fieldName))
    );
  }, []);

  const updateField = useCallback((tableName: string, fieldName: string, updates: Partial<SelectedField>) => {
    setIsSaved(false);
    setSelectedFields((prev) =>
      prev.map((sf) =>
        sf.table.name === tableName && sf.field.name === fieldName
          ? { ...sf, ...updates }
          : sf
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFields([]);
    setFilterRules([]);
    setJoinedTables([]);
    setGroupByField(null);
    setDatePreset(null);
    setRows([]);
    setError(null);
    setReportName('Yeni Rapor');
    setIsSaved(false);
  }, []);

  const toggleJoinTable = useCallback((tableName: string) => {
    setIsSaved(false);
    setJoinedTables((prev) =>
      prev.includes(tableName) ? prev.filter((t) => t !== tableName) : [...prev, tableName]
    );
  }, []);

  const addFilter = useCallback(() => {
    if (selectedFields.length === 0) {
      setError('Önce en az bir alan seçin.');
      return;
    }
    const sf = selectedFields[0];
    setFilterRules((prev) => [
      ...prev,
      {
        id: `filter-${Date.now()}`,
        table: sf.table.name,
        field: sf.field.name,
        operator: '=',
        value: '',
      },
    ]);
  }, [selectedFields]);

  const removeFilter = useCallback((id: string) => {
    setFilterRules((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFilter = useCallback((id: string, updates: Partial<FilterRule>) => {
    setFilterRules((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  // ============================================================
  // SAVE & LOAD
  // ============================================================

  const saveReport = useCallback(() => {
    const report: SavedReport = {
      id: `report-${Date.now()}`,
      name: reportName,
      description: reportDescription,
      category: reportCategory,
      selectedFields: selectedFields.map((sf) => ({
        tableName: sf.table.name,
        fieldName: sf.field.name,
        customLabel: sf.customLabel,
        sort: sf.sort || undefined,
        aggregation: sf.aggregation || undefined,
      })),
      filterRules,
      groupByField,
      joinedTables,
      datePreset,
      savedAt: new Date().toISOString(),
    };

    const updated = [...savedReports.filter((r) => r.name !== reportName), report];
    setSavedReports(updated);
    localStorage.setItem('akademihub-saved-reports', JSON.stringify(updated));
    setIsSaved(true);
  }, [reportName, reportDescription, reportCategory, selectedFields, filterRules, groupByField, joinedTables, datePreset, savedReports]);

  const loadReport = useCallback((report: SavedReport) => {
    setReportName(report.name);
    setReportDescription(report.description);
    setReportCategory(report.category);
    setFilterRules(report.filterRules);
    setGroupByField(report.groupByField);
    setJoinedTables(report.joinedTables);
    setDatePreset(report.datePreset as RelativeDatePreset | null);

    const fields: SelectedField[] = [];
    report.selectedFields.forEach((sf) => {
      const table = REPORT_TABLES.find((t) => t.name === sf.tableName);
      const field = table?.fields.find((f) => f.name === sf.fieldName);
      if (table && field) {
        fields.push({
          table,
          field,
          customLabel: sf.customLabel,
          sort: sf.sort as 'asc' | 'desc' | null,
          aggregation: sf.aggregation as AggregationType,
        });
      }
    });
    setSelectedFields(fields);
    setIsSaved(true);
    setActiveTab('fields');
  }, []);

  const deleteReport = useCallback((id: string) => {
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem('akademihub-saved-reports', JSON.stringify(updated));
  }, [savedReports]);

  // ============================================================
  // RUN REPORT
  // ============================================================

  const runReport = useCallback(async () => {
    if (selectedFields.length === 0) {
      setError('Lütfen en az bir alan seçin.');
      return;
    }

    setError(null);
    setRows([]);
    setRunning(true);
    setCurrentPage(1);

    try {
      const select: SelectField[] = selectedFields.map((sf) => ({
        table: sf.table.name,
        field: sf.field.name,
        alias: `${sf.table.name}_${sf.field.name}`,
        aggregation: sf.aggregation || undefined,
      }));

      const req: FreeReportRequest = {
        primaryTable: primaryTable!,
        joins: joinedTables,
        select,
        groupBy: groupByField ? [groupByField] : undefined,
        limit: 1000,
      };

      const res = await fetch('/api/finance/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      const js = await res.json();

      if (!res.ok || !js.success) {
        setError(js.error || 'Rapor sorgusu oluşturulamadı.');
      } else {
        setRows(js.data?.result?.rows || []);
      }
    } catch (e: any) {
      setError(e?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setRunning(false);
    }
  }, [selectedFields, primaryTable, joinedTables, groupByField]);

  // ============================================================
  // EXPORT FUNCTIONS
  // ============================================================

  const exportToExcel = useCallback(() => {
    if (rows.length === 0) return;

    // Sadece seçili alanların verilerini al
    const data = rows.map((row, idx) => {
      const newRow: any = { '#': idx + 1 };
      selectedFields.forEach((sf) => {
        const key = `${sf.table.name}_${sf.field.name}`;
        let value = row[key] ?? row[sf.field.name] ?? '';
        const header = sf.customLabel || sf.field.label;
        
        // Sayıları düzgün formatta yaz
        if (typeof value === 'number') {
          newRow[header] = value;
        } else if (value === null || value === undefined) {
          newRow[header] = '';
        } else {
          newRow[header] = String(value);
        }
      });
      return newRow;
    });

    // Toplam satırı ekle
    if (summaryRow) {
      const sumRow: any = { '#': 'TOPLAM' };
      selectedFields.forEach((sf) => {
        const key = `${sf.table.name}_${sf.field.name}`;
        const header = sf.customLabel || sf.field.label;
        if (summaryRow[key]) {
          sumRow[header] = summaryRow[key].sum;
        } else {
          sumRow[header] = '';
        }
      });
      data.push(sumRow);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Kolon genişliklerini ayarla
    const colWidths = [{ wch: 5 }]; // # kolonu
    selectedFields.forEach((sf) => {
      const header = sf.customLabel || sf.field.label;
      colWidths.push({ wch: Math.max(header.length + 2, 12) });
    });
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
    const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    XLSX.writeFile(wb, `${reportName}_${today}.xlsx`);
    setShowExportMenu(false);
    toast.success('Excel dosyası indirildi!');
  }, [rows, selectedFields, reportName, summaryRow]);

  const exportToPDF = useCallback(() => {
    if (rows.length === 0) return;

    // Kolon sayısına göre sayfa yönünü belirle
    const isLandscape = selectedFields.length > 5;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    
    // Başlık
    doc.setFontSize(18);
    doc.setTextColor(7, 94, 84);
    doc.text(reportName, 14, 18);
    
    // Alt başlık
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Olusturulma: ${new Date().toLocaleDateString('tr-TR')} | Kayit: ${rows.length}`, 14, 26);
    
    // Kolon başlıklarını hazırla - Türkçe karakterleri temizle
    const cleanText = (text: string): string => {
      return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };
    
    const headers = selectedFields.map((sf) => cleanText(sf.customLabel || sf.field.label));
    
    // Veri satırlarını hazırla
    const tableData = rows.slice(0, 500).map((row) =>
      selectedFields.map((sf) => {
        const key = `${sf.table.name}_${sf.field.name}`;
        let value = row[key] ?? row[sf.field.name] ?? '-';
        
        if (typeof value === 'number') {
          return value.toLocaleString('tr-TR');
        }
        
        // Uzun metinleri kısalt
        const strValue = cleanText(String(value));
        return strValue.length > 25 ? strValue.substring(0, 22) + '...' : strValue;
      })
    );

    // Toplam satırı ekle
    if (summaryRow && numericFields.length > 0) {
      const sumRowData = selectedFields.map((sf) => {
        const key = `${sf.table.name}_${sf.field.name}`;
        if (summaryRow[key]) {
          return 'T: ' + summaryRow[key].sum.toLocaleString('tr-TR');
        }
        return '';
      });
      tableData.push(sumRowData);
    }

    // Font boyutunu kolon sayısına göre ayarla
    let fontSize = 9;
    if (selectedFields.length > 10) fontSize = 7;
    else if (selectedFields.length > 7) fontSize = 8;
    
    // Tablo oluştur
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 32,
      theme: 'grid',
      styles: { 
        fontSize: fontSize, 
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [7, 94, 84], 
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { 
        fillColor: [245, 250, 245] 
      },
      columnStyles: selectedFields.reduce((acc, sf, idx) => {
        // Para alanlarını sağa hizala
        if (sf.field.type === 'currency' || sf.field.type === 'number') {
          acc[idx] = { halign: 'right' };
        }
        return acc;
      }, {} as any),
      margin: { top: 32, right: 10, bottom: 20, left: 10 },
      tableWidth: 'auto',
      didDrawPage: (data: any) => {
        // Her sayfanın altına sayfa numarası ekle
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Sayfa ${data.pageNumber} / ${pageCount}`,
          pageWidth - 25,
          pageHeight - 10
        );
      }
    });

    const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    doc.save(`${reportName}_${today}.pdf`);
    setShowExportMenu(false);
    toast.success('PDF dosyası indirildi!');
  }, [rows, selectedFields, reportName, summaryRow, numericFields]);

  const handlePrint = useCallback(() => {
    window.print();
    setShowExportMenu(false);
  }, []);

  const applyTemplate = useCallback((template: typeof QUICK_TEMPLATES[0]) => {
    const table = REPORT_TABLES.find((t) => t.name === template.table);
    if (!table) return;

    const fields: SelectedField[] = [];
    template.fields.forEach((fieldName) => {
      const field = table.fields.find((f) => f.name === fieldName);
      if (field) {
        fields.push({ table, field });
      }
    });

    setSelectedFields(fields);
    setReportName(template.label.toUpperCase());
    setIsSaved(false);
  }, []);

  // ============================================================
  // CHART DATA
  // ============================================================

  const chartData = useMemo(() => {
    if (rows.length === 0) return null;

    const sample = rows[0];
    const keys = Object.keys(sample);
    const labelKey = keys.find((k) => typeof sample[k] === 'string') || keys[0];
    const numericKey = keys.find((k) => typeof sample[k] === 'number');

    if (!numericKey) return null;

    const agg: Record<string, number> = {};
    rows.slice(0, 15).forEach((r) => {
      const label = String(r[labelKey] ?? 'Diğer').slice(0, 12);
      const val = typeof r[numericKey] === 'number' ? r[numericKey] : 0;
      agg[label] = (agg[label] || 0) + val;
    });

    return Object.entries(agg).map(([label, value]) => ({ label, value }));
  }, [rows]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex h-screen flex-col bg-gray-50 print:bg-white">
      {/* ============ HEADER ============ */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#075E54] to-[#128C7E] px-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <Table2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <input
              value={reportName}
              onChange={(e) => {
                setReportName(e.target.value);
                setIsSaved(false);
              }}
              className="w-48 bg-transparent text-base font-bold text-white placeholder:text-white/60 focus:outline-none"
              placeholder="Rapor Adı"
            />
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${isSaved ? 'bg-white/30 text-white' : 'bg-amber-400 text-amber-900'}`}>
                {isSaved ? '✓ Kaydedildi' : '● Taslak'}
              </span>
              <span className="text-[10px] text-white/70">{selectedFields.length} alan</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                datePreset ? 'bg-white text-[#075E54]' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {datePreset ? DATE_RANGE_OPTIONS.find(d => d.id === datePreset)?.label : 'Tarih'}
            </button>
            {showDateFilter && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-white shadow-xl border border-gray-200 py-1 z-50">
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setDatePreset(opt.id === 'custom' ? null : opt.id as RelativeDatePreset);
                      setShowDateFilter(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 ${
                      datePreset === opt.id ? 'text-[#25D366] font-bold' : 'text-gray-700'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={saveReport}
            disabled={selectedFields.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 disabled:opacity-50 transition"
          >
            <Save className="h-3.5 w-3.5" />
            Kaydet
          </button>
          
          <button
            onClick={runReport}
            disabled={running || selectedFields.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-1.5 text-sm font-bold text-white shadow hover:bg-[#20c05c] disabled:opacity-50 transition"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Çalıştır
          </button>
          
          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={rows.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 disabled:opacity-50 transition"
            >
              <Download className="h-3.5 w-3.5" />
              Dışa Aktar
              <ChevronDown className="h-3 w-3" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white shadow-xl border border-gray-200 py-1 z-50">
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  PDF (.pdf)
                </button>
                <hr className="my-1" />
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4 text-blue-500" />
                  Yazdır
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex flex-1 overflow-hidden print:block">
        {/* ============ LEFT SIDEBAR ============ */}
        <aside className="w-72 border-r border-gray-200 bg-white flex flex-col print:hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-2.5 text-xs font-bold transition ${
                activeTab === 'fields'
                  ? 'text-[#075E54] border-b-2 border-[#25D366] bg-[#DCF8C6]/30'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="inline h-3.5 w-3.5 mr-1" />
              Veri Alanları
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2.5 text-xs font-bold transition ${
                activeTab === 'saved'
                  ? 'text-[#075E54] border-b-2 border-[#25D366] bg-[#DCF8C6]/30'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderOpen className="inline h-3.5 w-3.5 mr-1" />
              Kayıtlı ({savedReports.length})
            </button>
          </div>

          {activeTab === 'fields' ? (
            <>
              {/* Quick Templates */}
              <div className="p-2 border-b border-gray-100 bg-gradient-to-r from-[#DCF8C6]/30 to-white">
                <p className="text-[10px] font-bold text-[#075E54] mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Hızlı Şablonlar
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {QUICK_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="flex items-center gap-1.5 rounded-md bg-[#25D366] px-2 py-1.5 text-[10px] font-bold text-white hover:bg-[#20c05c] transition shadow-sm"
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Alan ara..."
                    className="w-full rounded-lg bg-gray-50 border border-gray-200 py-1.5 pl-7 pr-2 text-xs focus:border-[#25D366] focus:outline-none"
                  />
                </div>
              </div>

              {/* Tables & Fields */}
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {filteredTables.map((table) => {
                  const isExpanded = expandedTables.includes(table.name);
                  const selectedCount = selectedFields.filter(sf => sf.table.name === table.name).length;
                  return (
                    <div key={table.name} className="rounded-lg border border-gray-100 bg-white overflow-hidden">
                      <button
                        onClick={() => setExpandedTables((prev) =>
                          prev.includes(table.name)
                            ? prev.filter((t) => t !== table.name)
                            : [...prev, table.name]
                        )}
                        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <Database className="h-3 w-3 text-[#075E54]" />
                          <span className="text-[11px] font-bold text-gray-700">{table.label}</span>
                          {selectedCount > 0 && (
                            <span className="bg-[#25D366] text-white text-[8px] px-1 rounded-full">{selectedCount}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-gray-400 bg-gray-100 px-1 rounded">{table.fields.length}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3 text-gray-400" /> : <ChevronDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-1.5 pb-1.5 space-y-0.5">
                          {/* Select All / Deselect All Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllFields(table);
                            }}
                            className={`w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-bold transition mb-1 ${
                              selectedCount === table.fields.length
                                ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
                                : 'bg-[#DCF8C6] text-[#075E54] hover:bg-[#25D366] hover:text-white border border-[#25D366]/30'
                            }`}
                          >
                            {selectedCount === table.fields.length ? (
                              <>
                                <X className="h-3 w-3" />
                                Tümünü Kaldır
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" />
                                Hepsini Seç ({table.fields.length})
                              </>
                            )}
                          </button>
                          {table.fields.map((field) => {
                            const isSelected = selectedFields.some(
                              (sf) => sf.table.name === table.name && sf.field.name === field.name
                            );
                            return (
                              <button
                                key={field.name}
                                onClick={() => toggleField(table, field)}
                                className={`w-full flex items-center justify-between rounded-md px-2 py-1 text-[10px] transition ${
                                  isSelected
                                    ? 'bg-[#25D366] text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 hover:bg-[#DCF8C6] hover:text-[#075E54]'
                                }`}
                              >
                                <span className="font-medium truncate">{field.label}</span>
                                <span className={`text-[8px] px-1 rounded ${isSelected ? 'bg-white/30' : 'bg-gray-200'}`}>
                                  {field.type === 'currency' ? '₺' : field.type === 'number' ? '#' : field.type === 'date' ? '📅' : 'A'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Saved Reports Tab */
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {savedReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">Henüz kayıtlı rapor yok</p>
                  <p className="text-[10px] text-gray-400">Rapor oluşturup kaydedin</p>
                </div>
              ) : (
                savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-lg border border-gray-200 bg-white p-2 hover:border-[#25D366] hover:shadow-sm transition group"
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => loadReport(report)}
                        className="text-left flex-1"
                      >
                        <p className="text-xs font-bold text-gray-800 group-hover:text-[#075E54]">{report.name}</p>
                        <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(report.savedAt).toLocaleDateString('tr-TR')}
                          <span className="bg-[#DCF8C6] text-[#075E54] px-1 rounded">{report.selectedFields.length} alan</span>
                        </p>
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* ============ CENTER PANEL ============ */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-[#DCF8C6]/10 print:bg-white">
          {selectedFields.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#075E54] shadow-lg">
                  <LayoutTemplate className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Rapor Oluşturucu</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Sol panelden veri alanlarını seçin veya hazır şablonlardan birini kullanın.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-[#25D366] hover:text-[#075E54] hover:shadow-md transition"
                    >
                      <span className="text-lg">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-3 space-y-3 print:p-0">
              {/* Selected Fields */}
              <div className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm print:shadow-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#25D366]" />
                    <span className="text-xs font-bold text-gray-800">Seçili Alanlar</span>
                    <span className="bg-[#DCF8C6] text-[#075E54] text-[10px] font-bold px-1.5 py-0.5 rounded">{selectedFields.length}</span>
                  </div>
                  <button onClick={clearAll} className="text-[10px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <Trash2 className="h-3 w-3" />
                    Temizle
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFields.map((sf, idx) => {
                    const fieldKey = `${sf.table.name}.${sf.field.name}`;
                    const isSettingsOpen = fieldSettingsOpen === fieldKey;
                    return (
                      <div key={fieldKey} className="relative">
                        <div
                          className="group inline-flex items-center gap-1 rounded-lg bg-[#DCF8C6] border border-[#25D366]/30 px-2 py-1 text-[11px] text-[#075E54] cursor-pointer hover:shadow-sm"
                          onClick={() => setFieldSettingsOpen(isSettingsOpen ? null : fieldKey)}
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-[#25D366] text-[9px] font-bold text-white">{idx + 1}</span>
                          <span className="font-semibold">{sf.customLabel || sf.field.label}</span>
                          {sf.aggregation && (
                            <span className="bg-purple-100 text-purple-600 text-[9px] px-1 rounded font-bold">
                              {AGGREGATION_OPTIONS.find(a => a.value === sf.aggregation)?.icon}
                            </span>
                          )}
                          {sf.sort && (
                            <span className="text-[9px]">{sf.sort === 'asc' ? '↑' : '↓'}</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(sf.table.name, sf.field.name);
                            }}
                            className="ml-1 text-red-400 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Field Settings Popover */}
                        {isSettingsOpen && (
                          <div className="absolute left-0 top-full mt-1 w-48 rounded-lg bg-white shadow-xl border border-gray-200 p-2 z-50">
                            <p className="text-[10px] font-bold text-gray-500 mb-1.5">Alan Ayarları</p>
                            
                            {/* Aggregation */}
                            {(sf.field.type === 'currency' || sf.field.type === 'number') && (
                              <div className="mb-2">
                                <p className="text-[9px] text-gray-400 mb-1">Hesaplama</p>
                                <div className="flex flex-wrap gap-1">
                                  {AGGREGATION_OPTIONS.map((agg) => (
                                    <button
                                      key={agg.value || 'none'}
                                      onClick={() => updateField(sf.table.name, sf.field.name, { aggregation: agg.value })}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                                        sf.aggregation === agg.value
                                          ? 'bg-purple-500 text-white'
                                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                                      }`}
                                    >
                                      {agg.icon}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Sort */}
                            <div className="mb-2">
                              <p className="text-[9px] text-gray-400 mb-1">Sıralama</p>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateField(sf.table.name, sf.field.name, { sort: sf.sort === 'asc' ? null : 'asc' })}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition ${
                                    sf.sort === 'asc' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                                  }`}
                                >
                                  <SortAsc className="h-3 w-3" /> A-Z
                                </button>
                                <button
                                  onClick={() => updateField(sf.table.name, sf.field.name, { sort: sf.sort === 'desc' ? null : 'desc' })}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition ${
                                    sf.sort === 'desc' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                                  }`}
                                >
                                  <SortDesc className="h-3 w-3" /> Z-A
                                </button>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setFieldSettingsOpen(null)}
                              className="w-full mt-1 py-1 rounded bg-gray-100 text-[10px] font-semibold text-gray-600 hover:bg-gray-200"
                            >
                              Kapat
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* JOIN Tables */}
              {availableJoins.length > 0 && (
                <div className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm print:hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold text-gray-800">İlişkili Tablolar (JOIN)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableJoins.map((tableName) => {
                      const table = REPORT_TABLES.find((t) => t.name === tableName);
                      const isJoined = joinedTables.includes(tableName);
                      return (
                        <button
                          key={tableName}
                          onClick={() => toggleJoinTable(tableName)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                            isJoined
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <Link2 className="h-3 w-3" />
                          {table?.label || tableName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grouping */}
              {groupableFields.length > 0 && (
                <div className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm print:hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-gray-800">Gruplandırma (GROUP BY)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setGroupByField(null)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                        !groupByField
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      Gruplandırma Yok
                    </button>
                    {groupableFields.map((sf) => {
                      const key = `${sf.table.name}.${sf.field.name}`;
                      const isGrouped = groupByField === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setGroupByField(isGrouped ? null : key)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                            isGrouped
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {sf.customLabel || sf.field.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="rounded-xl bg-white border border-gray-200 p-3 shadow-sm print:hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-bold text-gray-800">Filtreler</span>
                    {filterRules.length > 0 && (
                      <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded">{filterRules.length}</span>
                    )}
                  </div>
                  <button
                    onClick={addFilter}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="h-3 w-3" />
                    Filtre Ekle
                  </button>
                </div>
                {filterRules.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">Veri filtrelemek için "Filtre Ekle" butonuna tıklayın</p>
                ) : (
                  <div className="space-y-1.5">
                    {filterRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-1.5">
                        <select
                          value={`${rule.table}.${rule.field}`}
                          onChange={(e) => {
                            const [t, f] = e.target.value.split('.');
                            updateFilter(rule.id, { table: t, field: f });
                          }}
                          className="flex-1 rounded-md bg-white border border-gray-200 px-1.5 py-1 text-[10px]"
                        >
                          {selectedFields.map((sf) => (
                            <option key={`${sf.table.name}.${sf.field.name}`} value={`${sf.table.name}.${sf.field.name}`}>
                              {sf.field.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={rule.operator}
                          onChange={(e) => updateFilter(rule.id, { operator: e.target.value as any })}
                          className="w-16 rounded-md bg-white border border-gray-200 px-1 py-1 text-[10px]"
                        >
                          <option value="=">=</option>
                          <option value="!=">≠</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                          <option value="contains">içerir</option>
                        </select>
                        <input
                          value={String(rule.value)}
                          onChange={(e) => updateFilter(rule.id, { value: e.target.value })}
                          placeholder="Değer..."
                          className="flex-1 rounded-md bg-white border border-gray-200 px-1.5 py-1 text-[10px]"
                        />
                        <button onClick={() => removeFilter(rule.id)} className="text-red-400 hover:text-red-600">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ============ RIGHT PANEL - PREVIEW ============ */}
        <aside className="w-[420px] border-l border-gray-200 bg-white flex flex-col print:w-full print:border-0">
          {/* Header */}
          <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-[#DCF8C6]/30 to-white flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#25D366]" />
              <span className="text-xs font-bold text-[#075E54]">Önizleme</span>
              {rows.length > 0 && (
                <span className="bg-[#DCF8C6] text-[#075E54] text-[9px] font-bold px-1.5 py-0.5 rounded">{rows.length} kayıt</span>
              )}
            </div>
            {chartData && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => { setChartType('bar'); setShowGraph(true); }}
                  className={`p-1.5 rounded-md transition ${chartType === 'bar' && showGraph ? 'bg-[#25D366] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Bar Grafik"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setChartType('pie'); setShowGraph(true); }}
                  className={`p-1.5 rounded-md transition ${chartType === 'pie' && showGraph ? 'bg-[#25D366] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Pasta Grafik"
                >
                  <PieChart className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setChartType('line'); setShowGraph(true); }}
                  className={`p-1.5 rounded-md transition ${chartType === 'line' && showGraph ? 'bg-[#25D366] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Çizgi Grafik"
                >
                  <LineChartIcon className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5" />
                <button
                  onClick={() => setShowGraph(!showGraph)}
                  className={`p-1.5 rounded-md transition ${!showGraph ? 'bg-gray-200 text-gray-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grafiği Gizle/Göster"
                >
                  {showGraph ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {error && (
              <div className="m-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold text-red-700">Hata</span>
                </div>
                <p className="text-[11px] text-red-600">{error}</p>
              </div>
            )}

            {running && (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-[#25D366] mb-3" />
                <p className="text-sm font-medium text-gray-600">Veriler yükleniyor...</p>
              </div>
            )}

            {!running && !error && rows.length === 0 && selectedFields.length > 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCF8C6]">
                  <Play className="h-7 w-7 text-[#25D366]" />
                </div>
                <p className="text-sm font-bold text-gray-700">Çalıştırmaya Hazır</p>
                <p className="text-xs text-gray-400 mt-1">Üstteki "Çalıştır" butonuna tıklayın</p>
              </div>
            )}

            {!running && !error && rows.length > 0 && (
              <>
                {/* Chart */}
                {showGraph && chartData && (
                  <div className="p-3 border-b border-gray-100 print:border-0">
                    <div className="h-44 rounded-xl bg-gradient-to-br from-gray-50 to-[#DCF8C6]/20 p-3 border border-gray-100">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#25D366" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#25D366" strokeWidth={2} dot={{ fill: '#25D366', r: 4 }} />
                          </LineChart>
                        ) : (
                          <PieChart>
                            <Pie
                              data={chartData}
                              dataKey="value"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              outerRadius={65}
                              label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={{ strokeWidth: 1 }}
                            >
                              {chartData.map((_, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-auto">
                  <table ref={tableRef} className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-[#075E54] text-white print:bg-gray-800">
                      <tr>
                        <th className="px-2 py-2 text-center font-bold w-8">#</th>
                        {selectedFields.map((sf) => (
                          <th key={`${sf.table.name}.${sf.field.name}`} className="px-2 py-2 text-left font-bold whitespace-nowrap">
                            {sf.customLabel || sf.field.label}
                            {sf.aggregation && <span className="ml-1 text-[8px] opacity-70">({AGGREGATION_OPTIONS.find(a => a.value === sf.aggregation)?.icon})</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, idx) => (
                        <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-[#DCF8C6]/30 transition`}>
                          <td className="px-2 py-1.5 text-center text-gray-400 font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                          {selectedFields.map((sf) => {
                            const key = `${sf.table.name}_${sf.field.name}`;
                            const value = row[key] ?? row[sf.field.name] ?? '-';
                            const displayValue = typeof value === 'number' 
                              ? (sf.field.type === 'currency' ? `₺${value.toLocaleString('tr-TR')}` : value.toLocaleString('tr-TR'))
                              : String(value);
                            return (
                              <td key={key} className="px-2 py-1.5 text-gray-700 whitespace-nowrap max-w-[120px] truncate" title={displayValue}>
                                {displayValue.length > 18 ? displayValue.slice(0, 18) + '...' : displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                    {/* Summary Row */}
                    {summaryRow && numericFields.length > 0 && (
                      <tfoot className="bg-[#DCF8C6] font-bold">
                        <tr>
                          <td className="px-2 py-2 text-[#075E54]">Σ</td>
                          {selectedFields.map((sf) => {
                            const key = `${sf.table.name}_${sf.field.name}`;
                            const summary = summaryRow[key];
                            if (summary) {
                              const displayValue = sf.field.type === 'currency' 
                                ? `₺${summary.sum.toLocaleString('tr-TR')}`
                                : summary.sum.toLocaleString('tr-TR');
                              return (
                                <td key={key} className="px-2 py-2 text-[#075E54]">
                                  {displayValue}
                                  <span className="text-[8px] ml-1 opacity-70">(ort: {sf.field.type === 'currency' ? '₺' : ''}{summary.avg.toLocaleString('tr-TR', { maximumFractionDigits: 0 })})</span>
                                </td>
                              );
                            }
                            return <td key={key} className="px-2 py-2"></td>;
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-2 border-t border-gray-100 flex items-center justify-between text-[10px] print:hidden">
                  <span className="text-gray-500">
                    <strong>{rows.length}</strong> kayıt • Sayfa <strong>{currentPage}</strong>/{totalPages || 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className="px-2 py-1 rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200 font-semibold"
                    >
                      İlk
                    </button>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="p-1 rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 font-bold text-[#075E54]">{currentPage}</span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="p-1 rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-2 py-1 rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200 font-semibold"
                    >
                      Son
                    </button>
                  </div>
                </div>
              </>
            )}

            {!running && selectedFields.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <LayoutTemplate className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-600">Alan Seçin</p>
                <p className="text-[10px] text-gray-400 mt-1">Sol panelden veri alanlarını seçin</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ============ SETTINGS MODAL ============ */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#075E54] flex items-center justify-center">
                  <Settings2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-800">Rapor Ayarları</span>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Rapor Açıklaması</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-gray-50 border border-gray-200 p-2 text-sm focus:border-[#25D366] focus:outline-none"
                  placeholder="Bu rapor hakkında kısa açıklama..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full rounded-lg bg-gray-50 border border-gray-200 p-2 text-sm focus:border-[#25D366] focus:outline-none"
                >
                  <option value="GENEL">📁 Genel</option>
                  <option value="FİNANS">💰 Finans</option>
                  <option value="ÖĞRENCİ">👤 Öğrenci</option>
                  <option value="AKADEMİK">📚 Akademik</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-600 hover:bg-gray-200">
                İptal
              </button>
              <button onClick={() => { setSettingsOpen(false); setIsSaved(false); }} className="px-4 py-2 rounded-lg bg-[#25D366] text-sm font-bold text-white hover:bg-[#20c05c]">
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdowns on click outside */}
      {(showExportMenu || showDateFilter || fieldSettingsOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowExportMenu(false);
            setShowDateFilter(false);
            setFieldSettingsOpen(null);
          }} 
        />
      )}
    </div>
  );
}
