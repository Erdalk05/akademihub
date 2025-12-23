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
      fields: ['student_no', 'first_name', 'last_name', 'class', 'section', 'status', 'parent_phone', 'net_fee', 'installment_count', 'created_at'],
      description: 'Tüm kayıtlı öğrenciler'
    },
    { 
      id: 'all_installments', 
      label: 'Tüm Taksitler', 
      icon: '💰',
      table: 'finance_installments',
      fields: ['student_id', 'installment_no', 'amount', 'paid_amount', 'due_date', 'paid_at', 'is_paid', 'status', 'payment_method'],
      description: 'Taksit ödemeleri'
    },
    { 
      id: 'all_expenses', 
      label: 'Tüm Giderler', 
      icon: '📊',
      table: 'expenses',
      fields: ['title', 'category', 'amount', 'date', 'status', 'vendor', 'invoice_no', 'description'],
      description: 'Gider kayıtları'
    },
    { 
      id: 'all_payments', 
      label: 'Ödemeler', 
      icon: '💳',
      table: 'payments',
      fields: ['student_id', 'amount', 'payment_type', 'payment_method', 'payment_date', 'status', 'receipt_no'],
      description: 'Ödeme kayıtları'
    },
    { 
      id: 'deleted_students', 
      label: 'Kaydı Silinen', 
      icon: '🗑️',
      table: 'students',
      fields: ['student_no', 'first_name', 'last_name', 'class', 'status', 'deleted_at', 'net_fee', 'created_at'],
      description: 'Kaydı silinen öğrenciler'
    },
    { 
      id: 'other_income', 
      label: 'Diğer Gelirler', 
      icon: '📦',
      table: 'other_income',
      fields: ['student_id', 'title', 'category', 'amount', 'payment_type', 'date', 'notes'],
      description: 'Kitap, kırtasiye, yemek vb.'
    },
    { 
      id: 'guardians', 
      label: 'Veliler', 
      icon: '👨‍👩‍👧',
      table: 'guardians',
      fields: ['student_id', 'first_name', 'last_name', 'relation', 'phone', 'email', 'occupation'],
      description: 'Veli bilgileri'
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
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 🎨 MODERN HEADER - Glassmorphism Style */}
      <header className="flex h-16 items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-xl px-6">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <input
              value={reportName}
              onChange={(e) =>
                setReportName(e.target.value.toLocaleUpperCase('tr-TR'))
              }
              className="w-64 truncate border-none bg-transparent text-lg font-bold text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
              placeholder="RAPOR ADI"
            />
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isSaved ? '✓ KAYDEDİLDİ' : '● TASLAK'}
              </span>
              <span className="text-[10px] text-white/40">
                {selectedFields.length} alan seçili
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tarih Filtresi */}
          <button
            type="button"
            onClick={cycleDatePreset}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/20 transition-all"
          >
            <Calendar className="h-4 w-4" />
            {getDatePresetLabel()}
          </button>

          {/* Kaydet */}
          <button
            type="button"
            onClick={saveReport}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all"
          >
            <Save className="h-4 w-4" />
            Kaydet
          </button>

          {/* Çalıştır - Ana CTA */}
          <button
            type="button"
            onClick={runReport}
            disabled={running || selectedFields.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 transition-all"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Çalıştır
          </button>

          {/* Export Dropdown */}
          <div className="relative export-menu-container">
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={!rows || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40 transition-all"
            >
              <Download className="h-4 w-4" />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-800/95 backdrop-blur-xl p-2 shadow-2xl">
                <div className="mb-2 px-3 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Dışa Aktar
                </div>
                <button
                  onClick={exportToExcel}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-500/20 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Excel</div>
                    <div className="text-[10px] text-white/50">.xlsx formatı</div>
                  </div>
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-red-500/20 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                    <FileType className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">PDF</div>
                    <div className="text-[10px] text-white/50">.pdf formatı</div>
                  </div>
                </button>
                <button
                  onClick={exportToJSON}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-amber-500/20 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                    <FileCode2 className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">JSON</div>
                    <div className="text-[10px] text-white/50">Ham veri</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Ayarlar */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 🎨 ANA LAYOUT - Modern 3-Kolon */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* SOL PANEL – HIZLI ŞABLONLAR + VERİ KAYNAKLARI */}
        <section className="flex w-72 flex-shrink-0 flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
          {/* Hızlı Şablonlar Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/20">
                  <LayoutTemplate className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Hızlı Başlat</p>
                  <p className="text-[10px] text-white/50">Tek tıkla Excel&apos;e aktar</p>
                </div>
              </div>
              {selectedFields.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFields}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/30 transition"
                >
                  <X className="h-3 w-3" />
                  Sıfırla
                </button>
              )}
            </div>

            {/* Şablon Grid - Modern Kartlar */}
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.slice(0, 4).map((template) => (
                <button
                  key={template.id}
                  onClick={() => quickExportToExcel(template)}
                  disabled={quickExportLoading === template.id}
                  className="group relative flex flex-col items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                >
                  {quickExportLoading === template.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white/60" />
                  ) : (
                    <span className="text-xl">{template.icon}</span>
                  )}
                  <span className="text-[10px] font-semibold text-white/80 text-center">{template.label}</span>
                  <Download className="absolute top-1.5 right-1.5 h-3 w-3 text-white/30 group-hover:text-emerald-400 transition" />
                </button>
              ))}
            </div>

            {/* Diğer Şablonlar - Compact */}
            <div className="mt-2 flex flex-wrap gap-1">
              {quickTemplates.slice(4).map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyQuickTemplate(template)}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition"
                >
                  <span>{template.icon}</span>
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* Veri Kaynakları */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) =>
                    setFieldSearch(e.target.value.toLocaleUpperCase('tr-TR'))
                  }
                  placeholder="Alan ara..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-2">
              {filteredTables.map((table) => (
                <details
                  key={table.name}
                  className="group rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                  open={filteredTables.length <= 3}
                >
                  <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/5 transition list-none">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white">{table.label}</span>
                    </div>
                    <span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                      {table.fields.length}
                    </span>
                  </summary>
                  <div className="p-2 pt-0 space-y-1">
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
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                            active
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="font-medium">{field.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            active ? 'bg-white/20' : 'bg-white/10'
                          }`}>
                            {field.type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ORTA PANEL – RAPOR TUVALİ (Modern) */}
        <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
          {/* AI Input Bar */}
          <div className="p-4 border-b border-white/10">
            <div className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-2">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                placeholder="AI ile sor: '12. sınıfta borcu olan öğrencileri göster'"
                className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/40 focus:outline-none"
                disabled={isAiLoading}
              />
              <button
                onClick={handleAiGenerate}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 transition-all"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Düşünüyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>AI Oluştur</span>
                  </>
                )}
              </button>
            </div>
            {aiSuccess && (
              <div className="mt-2 flex items-center gap-2 text-emerald-400 animate-in fade-in slide-in-from-top-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold">Rapor yapısı AI tarafından oluşturuldu!</span>
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div
            className="flex-1 overflow-auto p-4"
            onClick={() => setFieldSettingsPopover(null)}
          >
            {selectedFields.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                {/* Empty State - Modern */}
                <div className="max-w-md">
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-2xl" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                        <Database className="h-12 w-12 text-white/30" />
                      </div>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-white">Rapor Oluşturucu</h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-6">
                    Sol panelden veri alanlarını seçin veya yukarıdaki AI kutusuna ne istediğinizi yazın.
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickTemplates.slice(0, 3).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyQuickTemplate(template)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <span>{template.icon}</span>
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Seçili Alanlar - Modern Chip Grid */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-sm font-bold text-white">Seçili Alanlar</p>
                      <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        {selectedFields.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllFields}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/20 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                      Temizle
                    </button>
                  </div>
                  
                  {/* Horizontal Scrollable Chips */}
                  <div className="flex flex-wrap gap-2">
                    {selectedFields.map((sf, index) => {
                      const isPopoverOpen =
                        fieldSettingsPopover?.tableName === sf.table.name &&
                        fieldSettingsPopover?.fieldName === sf.field.name;
                      const displayLabel = sf.customLabel || sf.field.label;
                      return (
                        <div
                          key={`${sf.table.name}.${sf.field.name}`}
                          className="relative group"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFieldSettingsPopover(
                                isPopoverOpen
                                  ? null
                                  : { tableName: sf.table.name, fieldName: sf.field.name },
                              );
                            }}
                            className="field-chip-button inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 px-3 py-2 text-sm text-white hover:border-emerald-400 transition-all"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/30 text-[10px] font-bold text-emerald-300">
                              {index + 1}
                            </span>
                            <span className="font-medium">{displayLabel}</span>
                            {sf.sort && (
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium">
                                {sf.sort === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                            {sf.aggregation && (
                              <span className="rounded bg-violet-500/30 px-1.5 py-0.5 text-[9px] font-medium text-violet-300">
                                {sf.aggregation === 'sum' ? 'Σ' : sf.aggregation === 'count' ? '#' : 'μ'}
                              </span>
                            )}
                            <Settings2 className="h-3.5 w-3.5 text-white/40 group-hover:text-white/80 transition" />
                          </button>

                          {isPopoverOpen && (
                            <div
                              className="field-settings-popover absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-slate-800/95 backdrop-blur-xl p-4 shadow-2xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-4">
                                <div>
                                  <label className="mb-1.5 block text-[11px] font-bold text-white/50 uppercase tracking-wider">
                                    Başlık
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
                                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-[11px] font-bold text-white/50 uppercase tracking-wider">
                                    Sıralama
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
                                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                          sf.sort === s
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                      >
                                        {s === 'asc' ? '↑ Artan' : s === 'desc' ? '↓ Azalan' : 'Yok'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                {sf.field.type === 'number' && (
                                  <div>
                                    <label className="mb-1.5 block text-[11px] font-bold text-white/50 uppercase tracking-wider">
                                      Hesaplama
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
                                          className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                                            sf.aggregation === agg
                                              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                                          }`}
                                        >
                                          {agg === 'sum' ? 'Σ Top' : agg === 'avg' ? 'μ Ort' : agg === 'count' ? '# Say' : 'Yok'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    removeSelectedField(sf.table.name, sf.field.name);
                                    setFieldSettingsPopover(null);
                                  }}
                                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Alanı Kaldır
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tarih ve Filtreler - Modern */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <p className="text-sm font-bold text-white">Zaman Aralığı</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { key: null, label: 'Tüm Zamanlar', icon: '∞' },
                      { key: 'last_7_days', label: '7 Gün', icon: '📅' },
                      { key: 'this_month', label: 'Bu Ay', icon: '📆' },
                      { key: 'this_year', label: 'Bu Yıl', icon: '🗓️' },
                      { key: 'last_year', label: 'Geçen Yıl', icon: '📁' },
                    ].map((opt) => {
                      const active = datePreset === opt.key;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setDatePreset(opt.key as RelativeDatePreset | null)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                            active
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Gelişmiş Filtreler */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-400" />
                        <p className="text-sm font-bold text-white">Filtreler</p>
                        {filterRules.length > 0 && (
                          <span className="rounded-lg bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                            {filterRules.length}
                          </span>
                        )}
                      </div>
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
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-blue-400 hover:bg-blue-500/30 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Filtre Ekle
                      </button>
                    </div>
                    {filterRules.length === 0 ? (
                      <p className="text-xs text-white/40 italic">
                        Filtreleme yapmak için &quot;Filtre Ekle&quot; butonuna tıklayın
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
                              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-2"
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
                                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-blue-500/50 focus:outline-none"
                              >
                                {selectedFields.map((sf) => (
                                  <option
                                    key={`${sf.table.name}.${sf.field.name}`}
                                    value={`${sf.table.name}.${sf.field.name}`}
                                    className="bg-slate-800 text-white"
                                  >
                                    {sf.field.label}
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
                                className="w-20 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-blue-500/50 focus:outline-none"
                              >
                                <option value="=" className="bg-slate-800">=</option>
                                <option value="!=" className="bg-slate-800">≠</option>
                                <option value=">" className="bg-slate-800">&gt;</option>
                                <option value="<" className="bg-slate-800">&lt;</option>
                                <option value=">=" className="bg-slate-800">≥</option>
                                <option value="<=" className="bg-slate-800">≤</option>
                                <option value="contains" className="bg-slate-800">içerir</option>
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
                                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterRules((prev) =>
                                    prev.filter((r) => r.id !== rule.id),
                                  );
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 transition"
                              >
                                <X className="h-4 w-4" />
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

        {/* SAĞ PANEL – CANLI VERİ ÖNİZLEMESİ (Modern) */}
        <section className="flex w-[420px] flex-shrink-0 flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-blue-500/20">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Canlı Önizleme</p>
                <p className="text-[10px] text-white/50">
                  {rows.length > 0 ? `${rows.length} kayıt bulundu` : 'Raporu çalıştırın'}
                </p>
              </div>
            </div>
            {chartData && chartData.length > 0 && !error && (
              <button
                onClick={() => setShowGraph(!showGraph)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  showGraph
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {showGraph ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showGraph ? 'Gizle' : 'Grafik'}
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {error && (
              <div className="m-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-sm font-bold text-red-400">Hata Oluştu</p>
                </div>
                <p className="text-xs text-red-300/80 leading-relaxed mb-3">
                  {error}
                </p>
                <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300/60">
                  <p className="font-semibold mb-1">Çözüm önerileri:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Seçili alanları kontrol edin</li>
                    <li>Farklı bir tablo deneyin</li>
                    <li>Sayfayı yenileyin</li>
                  </ul>
                </div>
              </div>
            )}

            {running && (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl animate-pulse" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-white mb-1">Veriler yükleniyor...</p>
                <p className="text-xs text-white/40">Lütfen bekleyin</p>
                <div className="mt-6 w-full max-w-xs space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-8 animate-pulse rounded-lg bg-white/5"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {!running && !error && rows.length === 0 && selectedFields.length > 0 && (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    <Play className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
                <p className="text-sm font-bold text-white mb-1">Çalıştırmaya Hazır</p>
                <p className="text-xs text-white/40 mb-4">
                  Üstteki yeşil &quot;Çalıştır&quot; butonuna tıklayın
                </p>
              </div>
            )}

            {!running && !error && rows.length > 0 && (
              <div className="flex flex-col h-full">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm z-10">
                      <tr>
                        {selectedFields.map((sf) => (
                          <th
                            key={`${sf.table.name}.${sf.field.name}`}
                            className="px-3 py-3 text-left font-bold text-white/70 whitespace-nowrap border-b border-white/10"
                          >
                            {sf.customLabel || sf.field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
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
                                className="px-3 py-2.5 text-white/70 whitespace-nowrap max-w-[140px]"
                                title={displayValue}
                              >
                                {isId && displayValue.length > 8
                                  ? displayValue.slice(0, 8) + '...'
                                  : displayValue.length > 18 
                                    ? displayValue.slice(0, 18) + '...'
                                    : displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-3 text-xs">
                  <div className="text-white/50">
                    Toplam <span className="font-bold text-white">{rows.length}</span> kayıt
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-white/60">
                      <span className="font-bold text-white">{currentPage}</span> / {totalPages || 1}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!running && !error && selectedFields.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    <LayoutTemplate className="h-8 w-8 text-violet-400" />
                  </div>
                </div>
                <p className="text-sm font-bold text-white mb-1">Alan Seçin</p>
                <p className="text-xs text-white/40">
                  Sol panelden veri alanlarını seçin
                </p>
              </div>
            )}
          </div>

          {/* Chart Area */}
          {chartData && chartData.length > 0 && !error && showGraph && (
            <div className="border-t border-white/10 p-4">
              <p className="mb-3 text-xs font-bold text-white/70">📊 Grafik Görünümü</p>
              <div className="h-40 rounded-xl bg-white/5 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.5)' }}
                      height={24}
                      interval={0}
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(30,41,59,0.95)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white'
                      }} 
                    />
                    <Bar dataKey="value" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      </main>
      {/* RAPOR AYARLARI PANELİ - Modern Dark Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-800/95 border border-white/10 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30">
                  <Settings2 className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg font-bold text-white">Rapor Ayarları</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-white/50 uppercase tracking-wider">
                  Rapor Açıklaması
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) =>
                    setReportDescription(
                      e.target.value.toLocaleUpperCase('tr-TR'),
                    )
                  }
                  rows={3}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition"
                  placeholder="Bu raporun neyi analiz ettiğini kısaca yazın..."
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-white/50 uppercase tracking-wider">
                  Rapor Kategorisi
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) =>
                    setReportCategory(e.target.value.toLocaleUpperCase('tr-TR'))
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm font-medium text-white focus:border-violet-500/50 focus:outline-none transition"
                >
                  <option value="GENEL" className="bg-slate-800">📁 Genel</option>
                  <option value="FİNANS" className="bg-slate-800">💰 Finans</option>
                  <option value="ÖĞRENCİ" className="bg-slate-800">👤 Öğrenci</option>
                  <option value="AKADEMİK" className="bg-slate-800">📚 Akademik</option>
                  <option value="YÖNETİM" className="bg-slate-800">⚙️ Yönetim</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setIsSaved(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


