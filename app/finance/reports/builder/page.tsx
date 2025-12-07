'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileSpreadsheet,
  FileType,
  Filter,
  GripVertical,
  LayoutTemplate,
  Loader2,
  Play,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
// Reorder kaldırıldı - framer-motion bağımlılığı yok
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  REPORT_TABLES,
  type ReportTable,
  type ReportField,
} from '@/lib/reporting/freeReportSchema';
import type {
  FreeReportRequest,
  SelectField,
  RelativeDatePreset,
} from '@/lib/reporting/freeReportSqlBuilder';

type Mode = 'edit' | 'view';

type SelectedField = {
  table: ReportTable;
  field: ReportField;
  sort?: 'asc' | 'desc' | null;
  aggregation?: 'sum' | 'count' | 'avg' | null;
  customLabel?: string;
};

type FilterRule = {
  id: string;
  table: string;
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
  value: string | number | string[];
};

type FieldSettingsPopover = {
  tableName: string;
  fieldName: string;
} | null;

export default function FreeReportBuilderPage() {
  const [reportName, setReportName] = useState('SERBEST RAPOR 7.0');
  const [mode, setMode] = useState<Mode>('edit');
  const [zoom, setZoom] = useState(100);
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<RelativeDatePreset | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [reportCategory, setReportCategory] = useState('GENEL');
  const [rows, setRows] = useState<any[]>([]);
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [fieldSettingsPopover, setFieldSettingsPopover] = useState<FieldSettingsPopover>(null);
  
  // Yeni UX state'leri
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showGraph, setShowGraph] = useState(false);
  
  // AI Özellikleri
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [quickExportLoading, setQuickExportLoading] = useState<string | null>(null);

  // Hızlı Şablonlar - Kullanıcı Deneyimi İyileştirmesi
  // NOT: Tablo ve alan isimleri freeReportSchema.ts dosyasındaki şemaya göre ayarlandı
  const quickTemplates = [
    { 
      id: 'all_students', 
      label: 'Tüm Öğrenciler', 
      icon: '👥',
      table: 'students',
      fields: ['student_no', 'parent_name', 'class', 'section', 'status', 'parent_phone', 'created_at'],
      description: 'Tüm kayıtlı öğrenciler'
    },
    { 
      id: 'all_installments', 
      label: 'Tüm Taksitler', 
      icon: '💰',
      table: 'finance_installments',
      fields: ['id', 'installment_no', 'amount', 'due_date', 'is_paid'],
      description: 'Taksit ödemeleri'
    },
    { 
      id: 'all_expenses', 
      label: 'Tüm Giderler', 
      icon: '📊',
      table: 'expenses', // Doğru tablo adı: expenses (finance_expenses değil!)
      fields: ['title', 'category', 'amount', 'date', 'status', 'description'],
      description: 'Gider kayıtları'
    },
    { 
      id: 'all_payments', 
      label: 'Ödemeler', 
      icon: '💳',
      table: 'finance_payments',
      fields: ['id', 'amount', 'payment_type', 'payment_date', 'payment_method', 'status'],
      description: 'Ödeme kayıtları'
    },
  ];

  // Tüm alanları temizle
  const clearAllFields = () => {
    setSelectedFields([]);
    setFilterRules([]);
    setRows([]);
    setError(null);
    setReportName('SERBEST RAPOR 7.0');
    setIsSaved(false);
  };

  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [rows, currentPage, itemsPerPage]);

  // Rapor her çalıştığında sayfayı 1'e al
  useEffect(() => {
    if (running) setCurrentPage(1);
  }, [running]);

  // Popover'ı dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Alan ayarları popover'ı
      if (
        fieldSettingsPopover &&
        !target.closest('.field-settings-popover') &&
        !target.closest('.field-chip-button')
      ) {
        setFieldSettingsPopover(null);
      }
      // Export menüsü
      if (
        exportMenuOpen &&
        !target.closest('.export-menu-container')
      ) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fieldSettingsPopover, exportMenuOpen]);

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiLoading(true);
    setAiSuccess(false);
    
    // 2 saniyelik simülasyon
    setTimeout(() => {
      // Mock veriler: 12. Sınıf, Başarısız Öğrenciler simülasyonu
      // "students" tablosundan alanlar seçelim
      const studentTable = REPORT_TABLES.find(t => t.name === 'students');
      if (studentTable) {
        const newFields: SelectedField[] = [];
        
        const addField = (name: string, label?: string, agg?: 'sum' | 'count' | 'avg') => {
          const f = studentTable.fields.find(field => field.name === name);
          if (f) {
            newFields.push({
              table: studentTable,
              field: f,
              customLabel: label,
              aggregation: agg || undefined
            });
          }
        };
        
        // Alanları ekle (gerçek şemada olan alanlar)
        addField('student_no', 'Öğrenci No');
        addField('parent_name', 'Veli Adı');
        addField('class', 'Sınıf');
        addField('status', 'Durum');
        
        setSelectedFields(newFields);
        
        // Filtre ekle: 12. Sınıf
        setFilterRules([{
          id: `ai-filter-${Date.now()}`,
          table: 'students',
          field: 'class',
          operator: 'contains',
          value: '12'
        }]);
        
        setIsAiLoading(false);
        setAiSuccess(true);
        
        // 3 saniye sonra başarı mesajını gizle
        setTimeout(() => setAiSuccess(false), 3000);
      } else {
        setIsAiLoading(false);
      }
    }, 2000);
  };

  const filteredTables = REPORT_TABLES.map((table) => {
    if (!fieldSearch.trim()) return table;
    const q = fieldSearch.toLocaleUpperCase('tr-TR');
    const fields = table.fields.filter(
      (f) =>
        f.label.toLocaleUpperCase('tr-TR').includes(q) ||
        f.name.toLocaleUpperCase('tr-TR').includes(q),
    );
    return { ...table, fields };
  }).filter((t) => t.fields.length > 0);

  const toggleField = (table: ReportTable, field: ReportField) => {
    if (mode === 'view') return;
    setIsSaved(false);
    setSelectedFields((prev) => {
      const exists = prev.find(
        (sf) => sf.table.name === table.name && sf.field.name === field.name,
      );
      if (exists) {
        return prev.filter(
          (sf) => !(sf.table.name === table.name && sf.field.name === field.name),
        );
      }
      return [...prev, { table, field }];
    });
  };

  const removeSelectedField = (tableName: string, fieldName: string) => {
    if (mode === 'view') return;
    setIsSaved(false);
    setSelectedFields((prev) =>
      prev.filter(
        (sf) => !(sf.table.name === tableName && sf.field.name === fieldName),
      ),
    );
  };

  const buildRequest = (): FreeReportRequest | null => {
    if (selectedFields.length === 0) return null;
    const primaryTable = selectedFields[0].table.name;
    const joins: string[] = Array.from(
      new Set(
        selectedFields
          .map((sf) => sf.table.name)
          .filter((name) => name !== primaryTable),
      ),
    );

    const select: SelectField[] = selectedFields.map((sf) => ({
      table: sf.table.name,
      field: sf.field.name,
      alias: `${sf.table.name}_${sf.field.name}`,
    }));

    // Basit tarih filtresi: primary tablonun ilk tarih alanına relative_date uygula
    const filters =
      datePreset != null
        ? (() => {
            const tableMeta = REPORT_TABLES.find((t) => t.name === primaryTable);
            const dateField = tableMeta?.fields.find((f) => f.type === 'date');
            if (!dateField) return undefined;
            return [
              {
                table: primaryTable,
                field: dateField.name,
                op: 'relative_date' as const,
                value: null,
                preset: datePreset,
              },
            ];
          })()
        : undefined;

    return {
      primaryTable,
      joins,
      select,
      filters,
      limit: 100,
    };
  };

  const runReport = async () => {
    setError(null);
    setRows([]);
    const req = buildRequest();
    if (!req) {
      setError('Lütfen önce en az bir alan seçin.');
      return;
    }
    setRunning(true);
    try {
      const res = await fetch('/api/finance/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const js = await res.json();
      if (!res.ok || !js.success) {
        const errorMsg = js.error || 'Rapor sorgusu oluşturulamadı.';
        setError(errorMsg);
        setRows([]);
        
        // Hata detaylarını console'a yazdır (geliştirme için)
        if (js.meta && process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('[Free Report Builder] Hata detayları:', js.meta);
        }
      } else {
        setRows(js.data?.result?.rows || []);
        setError(null);
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
      setError(errorMsg);
      setRows([]);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[Free Report Builder] Exception:', e);
      }
    } finally {
      setRunning(false);
    }
  };

  const cycleDatePreset = () => {
    setIsSaved(false);
    setDatePreset((prev) => {
      if (prev === null) return 'last_7_days';
      if (prev === 'last_7_days') return 'this_month';
      if (prev === 'this_month') return 'this_year';
      if (prev === 'this_year') return 'last_year';
      return null;
    });
  };

  const getDatePresetLabel = () => {
    if (datePreset === 'last_7_days') return 'SON 7 GÜN';
    if (datePreset === 'this_month') return 'BU AY';
    if (datePreset === 'this_year') return 'BU YIL';
    if (datePreset === 'last_year') return 'GEÇEN YIL';
    return 'TÜM ZAMANLAR';
  };

  const saveReport = () => {
    try {
      const payload = {
        name: reportName,
        description: reportDescription,
        category: reportCategory,
        datePreset,
        selectedFields: selectedFields.map((sf) => ({
          table: sf.table.name,
          field: sf.field.name,
        })),
        savedAt: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'free-report-builder:last',
          JSON.stringify(payload),
        );
      }
      setIsSaved(true);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Rapor kaydedilirken bir hata oluştu.');
    }
  };

  const exportToExcel = () => {
    if (!rows || rows.length === 0) {
      setError('Dışa aktarılacak veri bulunamadı. Önce raporu çalıştırın.');
      return;
    }

    try {
      // Veriyi Excel formatına hazırla - Türkçe formatlarla
      const data = rows.map((row) => {
        const newRow: any = {};
        selectedFields.forEach((sf) => {
          const key = `${sf.table.name}_${sf.field.name}`;
          const value = row[key] ?? row[sf.field.name];
          const header = sf.customLabel || sf.field.label;
          // Türkçe formatlama uygula
          newRow[header] = formatValueTR(value, sf.field.type);
        });
        return newRow;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Kolon genişliklerini ayarla
      const wscols = selectedFields.map(() => ({ wch: 22 }));
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Rapor");
      
      // Türkçe tarih formatı ile dosya adı
      const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      XLSX.writeFile(wb, `${reportName || 'Rapor'}_${today}.xlsx`);
      setExportMenuOpen(false);
    } catch (e: any) {
      setError('Excel oluşturulurken hata: ' + e.message);
    }
  };

  // Türkçe karakter desteği ile PDF oluşturma
  const exportToPDF = () => {
    if (!rows || rows.length === 0) {
      setError('Dışa aktarılacak veri bulunamadı. Önce raporu çalıştırın.');
      return;
    }

    try {
      // Türkçe tarih formatı
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return dateStr;
        }
      };

      // Türkçe sayı formatı
      const formatNumber = (num: any) => {
        if (num === null || num === undefined) return '-';
        if (typeof num === 'number') {
          return num.toLocaleString('tr-TR');
        }
        return String(num);
      };

      // Değer formatla
      const formatValue = (val: any, fieldType?: string) => {
        if (val === null || val === undefined) return '-';
        if (fieldType === 'date') return formatDate(String(val));
        if (fieldType === 'number' || typeof val === 'number') return formatNumber(val);
        if (typeof val === 'boolean') return val ? 'Evet' : 'Hayır';
        return String(val);
      };

      // Tablo başlıkları
      const headers = selectedFields.map((sf) => sf.customLabel || sf.field.label);

      // Tablo satırları
      const tableRows = rows.map((row) =>
        selectedFields.map((sf) => {
          const key = `${sf.table.name}_${sf.field.name}`;
          const val = row[key] ?? row[sf.field.name];
          return formatValue(val, sf.field.type);
        })
      );

      // HTML oluştur - Türkçe karakter desteği için UTF-8
      const html = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>${reportName || 'Rapor'}</title>
          <style>
            @page { 
              size: A4 landscape; 
              margin: 15mm; 
            }
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 11px;
              color: #1f2937;
              background: white;
              padding: 20px;
            }
            .header {
              border-bottom: 3px solid #075E54;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 700;
              color: #075E54;
              margin-bottom: 5px;
            }
            .header .meta {
              color: #6b7280;
              font-size: 11px;
            }
            .header .description {
              margin-top: 8px;
              color: #374151;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background: linear-gradient(135deg, #075E54 0%, #128C7E 100%);
              color: white;
              font-weight: 600;
              text-align: left;
              padding: 10px 8px;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid #064e45;
            }
            td {
              padding: 8px;
              border: 1px solid #e5e7eb;
              font-size: 10px;
            }
            tr:nth-child(even) {
              background-color: #f0fdf4;
            }
            tr:hover {
              background-color: #dcfce7;
            }
            .footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 9px;
            }
            .stats {
              display: flex;
              gap: 20px;
              margin: 15px 0;
            }
            .stat-box {
              background: #f0fdf4;
              border: 1px solid #25D366;
              border-radius: 8px;
              padding: 10px 15px;
            }
            .stat-label {
              font-size: 9px;
              color: #075E54;
              text-transform: uppercase;
            }
            .stat-value {
              font-size: 18px;
              font-weight: 700;
              color: #075E54;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportName || 'Rapor'}</h1>
            <div class="meta">
              Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} | 
              Toplam Kayıt: ${rows.length}
            </div>
            ${reportDescription ? `<div class="description">${reportDescription}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Bu rapor AkademiHub Eğitim Yönetim Sistemi tarafından ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
        </html>
      `;

      // iframe ile PDF olarak yazdır
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        document.body.removeChild(iframe);
        setError('PDF oluşturulamadı.');
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      // Yazdırma tamamlandığında temizle
      iframe.contentWindow?.addEventListener('afterprint', () => {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 100);
      });

      // Fallback: 10 saniye sonra temizle
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 10000);

      setExportMenuOpen(false);
    } catch (e: any) {
      setError('PDF oluşturulurken hata: ' + e.message);
    }
  };

  const exportToJSON = () => {
    const req = buildRequest();
    if (!req) return;
    
    const payload = {
      meta: {
        name: reportName,
        description: reportDescription,
        category: reportCategory,
        datePreset,
        exportedAt: new Date().toISOString(),
      },
      request: req,
      data: rows,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName || 'SERBEST_RAPOR'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  // Hızlı Şablon Uygula
  const applyQuickTemplate = (template: typeof quickTemplates[0]) => {
    const tableMeta = REPORT_TABLES.find(t => t.name === template.table);
    if (!tableMeta) {
      setError(`Tablo bulunamadı: ${template.table}`);
      return;
    }

    const newFields: SelectedField[] = [];
    template.fields.forEach(fieldName => {
      const fieldMeta = tableMeta.fields.find(f => f.name === fieldName);
      if (fieldMeta) {
        newFields.push({ table: tableMeta, field: fieldMeta });
      }
    });

    if (newFields.length === 0) {
      setError('Şablondaki alanlar bulunamadı.');
      return;
    }

    setSelectedFields(newFields);
    setReportName(template.label.toLocaleUpperCase('tr-TR'));
    setIsSaved(false);
    setError(null);
  };

  // Türkçe tarih formatı
  const formatDateTR = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Türkçe sayı formatı
  const formatNumberTR = (num: any) => {
    if (num === null || num === undefined) return '-';
    if (typeof num === 'number') {
      return num.toLocaleString('tr-TR');
    }
    return String(num);
  };

  // Değer formatla (Türkçe)
  const formatValueTR = (val: any, fieldType?: string) => {
    if (val === null || val === undefined) return '-';
    if (fieldType === 'date') return formatDateTR(String(val));
    if (fieldType === 'number' || typeof val === 'number') return formatNumberTR(val);
    if (typeof val === 'boolean') return val ? 'Evet' : 'Hayır';
    // Status değerlerini Türkçeye çevir
    if (val === 'active') return 'Aktif';
    if (val === 'inactive') return 'Pasif';
    if (val === 'pending') return 'Bekliyor';
    if (val === 'paid') return 'Ödendi';
    if (val === 'overdue') return 'Gecikmiş';
    return String(val);
  };

  // Hızlı Excel Aktarma - Tek tıkla tüm verileri Excel'e aktar
  const quickExportToExcel = async (template: typeof quickTemplates[0]) => {
    setQuickExportLoading(template.id);
    setError(null);

    try {
      // API'den veri çek
      const res = await fetch('/api/finance/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryTable: template.table,
          joins: [],
          select: template.fields.map(field => ({
            table: template.table,
            field: field,
            alias: `${template.table}_${field}`
          })),
          limit: 5000, // Maksimum 5000 kayıt
        }),
      });

      const js = await res.json();

      if (!res.ok || !js.success) {
        throw new Error(js.error || 'Veri çekilemedi');
      }

      const fetchedRows = js.data?.result?.rows || [];
      
      if (fetchedRows.length === 0) {
        setError('Dışa aktarılacak veri bulunamadı.');
        setQuickExportLoading(null);
        return;
      }

      // Excel'e aktar - Türkçe formatlarla
      const tableMeta = REPORT_TABLES.find(t => t.name === template.table);
      const data = fetchedRows.map((row: any) => {
        const newRow: any = {};
        template.fields.forEach(fieldName => {
          const fieldMeta = tableMeta?.fields.find(f => f.name === fieldName);
          const key = `${template.table}_${fieldName}`;
          const value = row[key] ?? row[fieldName];
          const header = fieldMeta?.label || fieldName;
          // Türkçe formatlama uygula
          newRow[header] = formatValueTR(value, fieldMeta?.type);
        });
        return newRow;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Kolon genişliklerini ayarla
      const wscols = template.fields.map(() => ({ wch: 22 }));
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, template.label);
      
      // Türkçe tarih formatı ile dosya adı
      const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      XLSX.writeFile(wb, `${template.label}_${today}.xlsx`);

    } catch (e: any) {
      setError('Excel aktarma hatası: ' + e.message);
    } finally {
      setQuickExportLoading(null);
    }
  };

  const chartData = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const sample = rows[0] as Record<string, any>;
    const keys = Object.keys(sample);
    if (keys.length === 0) return null;

    const labelKey =
      keys.find((k) => typeof sample[k] === 'string') || keys[0];
    const numericKey =
      keys.find((k) => typeof sample[k] === 'number') ||
      keys.find((k) => !Number.isNaN(Number(sample[k])));

    if (!numericKey) return null;

    const agg: Record<string, number> = {};
    rows.forEach((r) => {
      const label = String((r as any)[labelKey] ?? '');
      const raw = (r as any)[numericKey];
      const val = typeof raw === 'number' ? raw : Number(raw) || 0;
      agg[label] = (agg[label] || 0) + val;
    });

    return Object.entries(agg).map(([label, value]) => ({
      label,
      value,
    }));
  }, [rows]);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* GLOBAL TOOLBAR */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            FR
          </div>
          <div className="flex items-center gap-2">
            <input
              value={reportName}
              onChange={(e) =>
                setReportName(e.target.value.toLocaleUpperCase('tr-TR'))
              }
              className="w-56 truncate border-none bg-transparent text-sm font-semibold tracking-wide text-slate-900 focus:outline-none focus:ring-0"
              placeholder="RAPOR ADI"
            />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-amber-50 text-amber-700 ring-amber-200'
              }`}
            >
              {isSaved ? 'KAYDEDİLDİ' : 'TASLAK'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium text-slate-700">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              mode === 'edit'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-800'
            }`}
            onClick={() => setMode((m) => (m === 'edit' ? 'view' : 'edit'))}
          >
            <LayoutTemplate className="h-4 w-4" />
            {mode === 'edit' ? 'DÜZENLEME MODU' : 'GÖRÜNTÜLEME MODU'}
          </button>

          <button
            type="button"
            onClick={cycleDatePreset}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Calendar className="h-4 w-4" />
            TARİH: {getDatePresetLabel()}
          </button>

          <button
            type="button"
            onClick={saveReport}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            <Save className="h-4 w-4" />
            KAYDET
          </button>
          <button
            type="button"
            onClick={runReport}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#128C7E] disabled:opacity-70"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            RAPORU ÇALIŞTIR
          </button>
          <div className="relative export-menu-container">
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Download className="h-4 w-4" />
              DIŞA AKTAR
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <div className="mb-1 px-2 py-1.5 text-[10px] font-semibold text-slate-400">
                  FORMAT SEÇİN
                </div>
                <button
                  onClick={exportToExcel}
                  disabled={!rows || rows.length === 0}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${
                    !rows || rows.length === 0
                      ? 'cursor-not-allowed opacity-50 text-slate-400'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <FileSpreadsheet className={`h-4 w-4 ${!rows || rows.length === 0 ? 'text-slate-400' : 'text-emerald-600'}`} />
                  <div>
                    Excel Olarak İndir (.xlsx)
                    {(!rows || rows.length === 0) && <div className="text-[9px] font-normal opacity-70">Önce raporu çalıştırın</div>}
                  </div>
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={!rows || rows.length === 0}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${
                    !rows || rows.length === 0
                      ? 'cursor-not-allowed opacity-50 text-slate-400'
                      : 'text-slate-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <FileType className={`h-4 w-4 ${!rows || rows.length === 0 ? 'text-slate-400' : 'text-red-600'}`} />
                  <div>
                    PDF Olarak İndir (.pdf)
                    {(!rows || rows.length === 0) && <div className="text-[9px] font-normal opacity-70">Önce raporu çalıştırın</div>}
                  </div>
                </button>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  onClick={exportToJSON}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                >
                  <FileCode2 className="h-4 w-4 text-amber-600" />
                  JSON Kaynağı (.json)
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            <Settings2 className="h-4 w-4" />
            RAPOR AYARLARI
          </button>
        </div>
      </header>

      {/* ANA LAYOUT */}
      <main className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* SOL PANEL – VERİ KAYNAKLARI */}
        <section className="flex w-80 flex-shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                VERİ KAYNAKLARI
              </p>
              <p className="text-[11px] text-slate-500">
                Öğrenci, veli, akademik ve finans alanlarını buradan seçin.
              </p>
            </div>
          </div>

          {/* HIZLI ŞABLONLAR - Tek Tıkla Excel'e Aktar */}
          <div className="mb-4 rounded-xl border-2 border-[#25D366]/30 bg-gradient-to-br from-[#DCF8C6]/30 to-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#075E54]">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                HIZLI EXCEL AKTARMA
              </p>
              {selectedFields.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFields}
                  className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-red-600 transition"
                >
                  <X className="h-2.5 w-2.5" />
                  Temizle
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.map((template) => (
                <div key={template.id} className="flex flex-col gap-1">
                  <button
                    onClick={() => quickExportToExcel(template)}
                    disabled={quickExportLoading === template.id}
                    className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#128C7E] transition-all disabled:opacity-70"
                  >
                    {quickExportLoading === template.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span>{template.icon}</span>
                    )}
                    <span className="truncate">{template.label}</span>
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => applyQuickTemplate(template)}
                    className="text-[9px] text-[#128C7E] hover:text-[#075E54] hover:underline text-left"
                  >
                    → Şablonu Uygula
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[9px] text-slate-500 italic">
              💡 Tek tıkla tüm verileri Excel&apos;e aktarın
            </p>
          </div>

          <div className="mb-3">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={fieldSearch}
                onChange={(e) =>
                  setFieldSearch(e.target.value.toLocaleUpperCase('tr-TR'))
                }
                placeholder="ALAN ARA (ÖRN. ÖĞRENCİ, TUTAR...)"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-[11px] font-medium tracking-wide text-slate-800 placeholder:text-slate-400 focus:border-[#25D366] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
              />
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-auto pr-1 text-xs">
            {filteredTables.map((table) => (
              <div
                key={table.name}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-2"
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  {table.label}
                </p>
                <div className="space-y-1">
                  {table.fields.map((field) => {
                    const active = selectedFields.some(
                      (sf) =>
                        sf.table.name === table.name &&
                        sf.field.name === field.name,
                    );
                    return (
                      <button
                        key={field.name}
                        type="button"
                        onClick={() => toggleField(table, field)}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11px] ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{field.label}</span>
                        <span className="text-[10px] opacity-75">
                          {field.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ORTA PANEL – RAPOR TUVALİ */}
        <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                RAPOR TUVALİ
              </p>
              <p className="text-[11px] text-slate-500">
                Sol panelden alan seçin, burada rapor yapınızı tasarlayın.
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-1">
            <div className="relative flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                placeholder="Raporunuzu tarif edin... (örn: '12. sınıfta başarısız olan öğrencileri göster')"
                className="flex-1 bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                disabled={isAiLoading}
              />
              <button
                onClick={handleAiGenerate}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 transition-all"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    DÜŞÜNÜYOR...
                  </>
                ) : (
                  <>
                    OLUŞTUR
                    <Sparkles className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
            {aiSuccess && (
              <div className="mt-1 px-2 pb-1">
                <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <Sparkles className="h-3 w-3" />
                  Rapor yapısı yapay zeka tarafından oluşturuldu!
                </p>
              </div>
            )}
          </div>

          <div
            className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/30 to-indigo-50/20 p-4 shadow-inner"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            onClick={() => setFieldSettingsPopover(null)}
          >
            {selectedFields.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-2xl bg-white/80 p-8 shadow-sm border border-slate-200 max-w-md">
                  <LayoutTemplate className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Raporunuzu Oluşturmaya Başlayın
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sol panelden bir veya daha fazla alan seçerek raporunuzun temelini oluşturun.
                    Seçtiğiniz alanlar burada görünecek ve raporunuzun yapısını belirleyecektir.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-700">
                      SEÇİLİ ALANLAR (Sıralamak için sürükleyin)
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        {selectedFields.length} alan
                      </span>
                      {selectedFields.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllFields}
                          className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-100 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          Temizle
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {selectedFields.map((sf) => {
                      const isPopoverOpen =
                        fieldSettingsPopover?.tableName === sf.table.name &&
                        fieldSettingsPopover?.fieldName === sf.field.name;
                      const displayLabel = sf.customLabel || sf.field.label;
                      return (
                        <div
                          key={`${sf.table.name}.${sf.field.name}`}
                          className="relative"
                        >
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 shadow-sm hover:border-indigo-300 transition-colors group">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <GripVertical className="h-4 w-4 text-slate-300 cursor-grab active:cursor-grabbing" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-semibold text-slate-700 truncate">
                                  {displayLabel}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate">
                                  {sf.table.label}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {sf.sort && (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                                    {sf.sort === 'asc' ? 'Artan' : 'Azalan'}
                                  </span>
                                )}
                                {sf.aggregation && (
                                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600">
                                    {sf.aggregation === 'sum' ? 'TOPLA' : sf.aggregation === 'count' ? 'SAY' : 'ORT'}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFieldSettingsPopover(
                                      isPopoverOpen
                                        ? null
                                        : { tableName: sf.table.name, fieldName: sf.field.name },
                                    );
                                  }}
                                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition"
                                >
                                  <Settings2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                          </div>

                          {isPopoverOpen && (
                            <div
                              className="field-settings-popover absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                                    BAŞLIK (ALIAS)
                                  </label>
                                  <input
                                    type="text"
                                    value={sf.customLabel || sf.field.label}
                                    onChange={(e) => {
                                      setSelectedFields((prev) =>
                                        prev.map((f) =>
                                          f.table.name === sf.table.name &&
                                          f.field.name === sf.field.name
                                            ? {
                                                ...f,
                                                customLabel: e.target.value.toLocaleUpperCase('tr-TR') || undefined,
                                              }
                                            : f,
                                        ),
                                      );
                                    }}
                                    className="w-full rounded border border-slate-200 px-2 py-1 text-[11px] focus:border-indigo-500 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                                    SIRALAMA
                                  </label>
                                  <div className="flex gap-1">
                                    {(['asc', 'desc', null] as const).map((s) => (
                                      <button
                                        key={String(s)}
                                        type="button"
                                        onClick={() => {
                                          setSelectedFields((prev) =>
                                            prev.map((f) =>
                                              f.table.name === sf.table.name &&
                                              f.field.name === sf.field.name
                                                ? { ...f, sort: s }
                                                : f,
                                            ),
                                          );
                                        }}
                                        className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition ${
                                          sf.sort === s
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        {s === 'asc' ? 'Artan' : s === 'desc' ? 'Azalan' : 'Yok'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                {sf.field.type === 'number' && (
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                                      ÖZET
                                    </label>
                                    <div className="flex gap-1">
                                      {(['sum', 'avg', 'count', null] as const).map((agg) => (
                                        <button
                                          key={String(agg)}
                                          type="button"
                                          onClick={() => {
                                            setSelectedFields((prev) =>
                                              prev.map((f) =>
                                                f.table.name === sf.table.name &&
                                                f.field.name === sf.field.name
                                                  ? { ...f, aggregation: agg }
                                                  : f,
                                              ),
                                            );
                                          }}
                                          className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition ${
                                            sf.aggregation === agg
                                              ? 'bg-indigo-600 text-white'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          {agg === 'sum' ? 'TOP' : agg === 'avg' ? 'ORT' : agg === 'count' ? 'SAY' : 'Yok'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removeSelectedField(sf.table.name, sf.field.name);
                                      setFieldSettingsPopover(null);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded bg-red-50 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-100 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Alanı Kaldır
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                  <p className="mb-2 text-[11px] font-semibold text-slate-700">
                    HIZLI TARİH FİLTRELERİ
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      { key: null, label: 'TÜM ZAMANLAR' },
                      { key: 'last_7_days', label: 'SON 7 GÜN' },
                      { key: 'this_month', label: 'BU AY' },
                      { key: 'this_year', label: 'BU YIL' },
                      { key: 'last_year', label: 'GEÇEN YIL' },
                    ].map((opt) => {
                      const active = datePreset === opt.key;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setDatePreset(opt.key as RelativeDatePreset | null)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-700">
                        GELİŞMİŞ FİLTRELER
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedFields.length === 0) {
                            setError('Önce en az bir alan seçmelisiniz.');
                            return;
                          }
                          const primaryTable = selectedFields[0].table.name;
                          const firstField = selectedFields[0].field.name;
                          setFilterRules((prev) => [
                            ...prev,
                            {
                              id: `filter-${Date.now()}`,
                              table: primaryTable,
                              field: firstField,
                              operator: '=',
                              value: '',
                            },
                          ]);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <Plus className="h-3 w-3" />
                        Filtre Ekle
                      </button>
                    </div>
                    {filterRules.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">
                        Henüz filtre eklenmedi. &quot;Filtre Ekle&quot; butonuna tıklayarak özel filtreler oluşturabilirsiniz.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filterRules.map((rule) => {
                          const fieldMeta = selectedFields.find(
                            (sf) =>
                              sf.table.name === rule.table &&
                              sf.field.name === rule.field,
                          );
                          return (
                            <div
                              key={rule.id}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                            >
                              <select
                                value={`${rule.table}.${rule.field}`}
                                onChange={(e) => {
                                  const [t, f] = e.target.value.split('.');
                                  setFilterRules((prev) =>
                                    prev.map((r) =>
                                      r.id === rule.id
                                        ? { ...r, table: t, field: f }
                                        : r,
                                    ),
                                  );
                                }}
                                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] focus:border-indigo-500 focus:outline-none"
                              >
                                {selectedFields.map((sf) => (
                                  <option
                                    key={`${sf.table.name}.${sf.field.name}`}
                                    value={`${sf.table.name}.${sf.field.name}`}
                                  >
                                    {sf.table.label} · {sf.field.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={rule.operator}
                                onChange={(e) => {
                                  setFilterRules((prev) =>
                                    prev.map((r) =>
                                      r.id === rule.id
                                        ? {
                                            ...r,
                                            operator: e.target.value as FilterRule['operator'],
                                          }
                                        : r,
                                    ),
                                  );
                                }}
                                className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="=">=</option>
                                <option value="!=">≠</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">≥</option>
                                <option value="<=">≤</option>
                                <option value="contains">İçerir</option>
                                <option value="in">İçinde</option>
                              </select>
                              <input
                                type={fieldMeta?.field.type === 'number' ? 'number' : 'text'}
                                value={Array.isArray(rule.value) ? rule.value.join(',') : rule.value}
                                onChange={(e) => {
                                  const val =
                                    fieldMeta?.field.type === 'number'
                                      ? Number(e.target.value) || 0
                                      : rule.operator === 'in'
                                        ? e.target.value.split(',').map((s) => s.trim())
                                        : e.target.value.toLocaleUpperCase('tr-TR');
                                  setFilterRules((prev) =>
                                    prev.map((r) =>
                                      r.id === rule.id ? { ...r, value: val } : r,
                                    ),
                                  );
                                }}
                                placeholder="Değer"
                                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] focus:border-indigo-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterRules((prev) =>
                                    prev.filter((r) => r.id !== rule.id),
                                  );
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-red-600 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SAĞ PANEL – CANLI VERİ ÖNİZLEMESİ */}
        <section className="flex w-96 flex-shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                CANLI VERİ ÖNİZLEMESİ
              </p>
              <p className="text-[11px] text-slate-500">
                Raporunuzun gerçek verilerini burada görebilirsiniz.
              </p>
            </div>
            {chartData && chartData.length > 0 && !error && (
              <button
                onClick={() => setShowGraph(!showGraph)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  showGraph
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {showGraph ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showGraph ? 'Grafiği Gizle' : 'Görselleştir'}
              </button>
            )}
          </div>

          <div className="mb-2 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
            {error && (
              <div className="m-3 rounded-lg border-2 border-red-200 bg-red-50 p-3 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-[12px] font-semibold text-red-800">HATA</p>
                </div>
                <p className="mb-2 text-[11px] font-medium text-red-700 leading-relaxed">
                  {error}
                </p>
                <div className="mt-2 rounded bg-red-100/50 p-2 text-[10px] text-red-600">
                  <p className="font-semibold mb-1">Çözüm önerileri:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Seçili alanları kontrol edin</li>
                    <li>Farklı bir tablo veya alan deneyin</li>
                    <li>Sayfayı yenileyip tekrar deneyin</li>
                  </ul>
                </div>
              </div>
            )}

            {running && (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-[11px] font-medium text-slate-600">
                  Veriler yükleniyor...
                </p>
                <div className="mt-4 w-full space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-8 animate-pulse rounded bg-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {!running && !error && rows.length === 0 && selectedFields.length > 0 && (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Database className="mb-2 h-10 w-10 text-slate-300" />
                <p className="mb-1 text-[12px] font-semibold text-slate-700">
                  Henüz Veri Yok
                </p>
                <p className="text-[11px] text-slate-500">
                  Üst bardaki &quot;RAPORU ÇALIŞTIR&quot; butonuna basarak
                  raporunuzu oluşturun.
                </p>
              </div>
            )}

            {!running && !error && rows.length > 0 && (
              <div className="flex flex-col h-full">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                      <tr>
                        {selectedFields.map((sf) => (
                          <th
                            key={`${sf.table.name}.${sf.field.name}`}
                            className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap"
                          >
                            {sf.customLabel || sf.field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          {selectedFields.map((sf) => {
                            const key = `${sf.table.name}_${sf.field.name}`;
                            const value = row[key] ?? row[sf.field.name] ?? '-';
                            const isId = sf.field.name.toLowerCase().includes('id') || sf.field.name.toLowerCase().includes('uuid');
                            const displayValue = typeof value === 'number'
                              ? value.toLocaleString('tr-TR')
                              : String(value);

                            return (
                              <td
                                key={`${sf.table.name}.${sf.field.name}`}
                                className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[150px]"
                                title={displayValue}
                              >
                                {isId && displayValue.length > 8
                                  ? displayValue.slice(0, 8) + '...'
                                  : displayValue.length > 20 
                                    ? displayValue.slice(0, 20) + '...'
                                    : displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-600">
                  <div>
                    Toplam <strong>{rows.length}</strong> kayıt
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-slate-200 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span>
                      Sayfa {currentPage} / {totalPages || 1}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-slate-200 disabled:opacity-50"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!running && !error && selectedFields.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <LayoutTemplate className="mb-2 h-10 w-10 text-slate-300" />
                <p className="mb-1 text-[12px] font-semibold text-slate-700">
                  Alan Seçin
                </p>
                <p className="text-[11px] text-slate-500">
                  Sol panelden raporunuza eklemek istediğiniz alanları seçin.
                </p>
              </div>
            )}
          </div>

          {chartData && chartData.length > 0 && !error && showGraph && (
            <div className="mb-2 h-48 rounded-lg bg-white border border-slate-200 p-2 shadow-sm">
              <p className="mb-1 text-[11px] font-semibold text-slate-700">
                GRAFİK ÖNİZLEME
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9 }}
                    height={24}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </main>
      {/* RAPOR AYARLARI PANELİ */}
      {settingsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                RAPOR AYARLARI
              </p>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-700">
                  RAPOR AÇIKLAMASI
                </p>
                <textarea
                  value={reportDescription}
                  onChange={(e) =>
                    setReportDescription(
                      e.target.value.toLocaleUpperCase('tr-TR'),
                    )
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="BU RAPORUN NEYİ ANALİZ ETTİĞİNİ KISACA YAZIN."
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-700">
                  RAPOR KATEGORİSİ
                </p>
                <select
                  value={reportCategory}
                  onChange={(e) =>
                    setReportCategory(e.target.value.toLocaleUpperCase('tr-TR'))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="GENEL">GENEL</option>
                  <option value="FİNANS">FİNANS</option>
                  <option value="ÖĞRENCİ">ÖĞRENCİ</option>
                  <option value="AKADEMİK">AKADEMİK</option>
                  <option value="YÖNETİM">YÖNETİM</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                KAPAT
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setIsSaved(false);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
              >
                TAMAM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


