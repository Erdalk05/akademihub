'use client';

// ============================================================================
// STEP 2: CEVAP ANAHTARI - GELİŞMİŞ EDİTÖR v3.0
// Manuel, Toplu Yapıştır, Excel/CSV, Fotoğraf, Kütüphane destekli
// ============================================================================

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Target,
  ClipboardPaste,
  FileSpreadsheet,
  Camera,
  Library,
  ChevronDown,
  ChevronRight,
  Check,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Edit3,
  X,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  WizardStep1Data,
  WizardStep2Data,
  CevapAnahtari,
  CevapAnahtariItem,
  CevapSecenegi,
  KitapcikTuru,
  ExcelPreviewData,
  TopluYapistirResult,
} from '@/types/spectra-wizard';
import {
  createEmptyCevapAnahtari,
  updateSoruCevap,
  validateCevapAnahtari,
  parseTopluCevap,
  autoMapColumn,
  parseExcelToPreview,
  convertPreviewToItems,
  deleteSelectedItems,
  clearAllAnswers,
} from '@/lib/spectra-wizard/answer-key-parser';
import { getDersDagilimi, DERS_RENKLERI } from '@/lib/spectra-wizard/exam-configs';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Step2Props {
  step1Data: WizardStep1Data;
  data: WizardStep2Data | null;
  organizationId: string;
  onChange: (data: WizardStep2Data) => void;
}

type TabType = 'manuel' | 'toplu' | 'excel' | 'foto' | 'kutuphane';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Step2CevapAnahtari({ step1Data, data, organizationId, onChange }: Step2Props) {
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>('manuel');
  
  // Manuel giriş state
  const [expandedDersler, setExpandedDersler] = useState<Set<string>>(new Set());
  const [aktifKitapcik, setAktifKitapcik] = useState<KitapcikTuru>('A');
  
  // Toplu yapıştır state
  const [topluKitapcik, setTopluKitapcik] = useState<KitapcikTuru>('A');
  const [topluCevapInput, setTopluCevapInput] = useState<string>('');
  const [topluParseResult, setTopluParseResult] = useState<TopluYapistirResult | null>(null);
  
  // Excel state
  const [excelPreview, setExcelPreview] = useState<ExcelPreviewData | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Editor state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExcelRow, setEditingExcelRow] = useState<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // MEMOIZED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  const dersDagilimi = useMemo(() => {
    return getDersDagilimi(step1Data.sinavTuru, step1Data.sinifSeviyesi);
  }, [step1Data.sinavTuru, step1Data.sinifSeviyesi]);

  const cevapAnahtari: CevapAnahtari = useMemo(() => {
    if (data?.cevapAnahtari) return data.cevapAnahtari;
    return createEmptyCevapAnahtari(
      organizationId,
      step1Data.sinavTuru,
      step1Data.sinifSeviyesi,
      dersDagilimi,
      step1Data.kitapcikTurleri.length
    );
  }, [data?.cevapAnahtari, organizationId, step1Data, dersDagilimi]);

  const toplamSoru = useMemo(() => {
    return dersDagilimi.reduce((s, d) => s + d.soruSayisi, 0);
  }, [dersDagilimi]);

  const validation = useMemo(() => {
    return validateCevapAnahtari(cevapAnahtari, toplamSoru);
  }, [cevapAnahtari, toplamSoru]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return cevapAnahtari.items;
    const query = searchQuery.toLowerCase();
    return cevapAnahtari.items.filter(item =>
      item.soruNo.toString().includes(query) ||
      item.dersAdi.toLowerCase().includes(query) ||
      item.dersKodu.toLowerCase().includes(query) ||
      (item.kazanimKodu && item.kazanimKodu.toLowerCase().includes(query))
    );
  }, [cevapAnahtari.items, searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  // Update cevap anahtarı and notify parent
  const updateCevapAnahtari = useCallback((newAnahtar: CevapAnahtari, source: 'manual' | 'paste' | 'excel' | 'photo' | 'library' = 'manual') => {
    onChange({
      cevapAnahtari: newAnahtar,
      girisYontemi: activeTab === 'manuel' ? 'manuel' : activeTab === 'toplu' ? 'toplu' : activeTab === 'excel' ? 'dosya' : activeTab === 'foto' ? 'foto' : 'kutuphane',
      source,
      previewErrors: [],
      previewWarnings: [],
    });
  }, [onChange, activeTab]);

  // Manuel cevap değişikliği
  const handleCevapChange = useCallback((soruNo: number, cevap: CevapSecenegi) => {
    const newAnahtar = updateSoruCevap(cevapAnahtari, soruNo, cevap, aktifKitapcik);
    updateCevapAnahtari(newAnahtar, 'manual');
  }, [cevapAnahtari, aktifKitapcik, updateCevapAnahtari]);

  // Toplu yapıştırma input değişikliği
  const handleTopluInputChange = useCallback((value: string) => {
    setTopluCevapInput(value.toUpperCase());
    const result = parseTopluCevap(value, toplamSoru);
    setTopluParseResult(result);
  }, [toplamSoru]);

  // Toplu yapıştırmayı uygula
  const handleTopluApply = useCallback(() => {
    if (!topluParseResult || !topluParseResult.isValid) {
      toast.error('Lütfen önce geçerli cevapları girin.');
      return;
    }

    const newItems: CevapAnahtariItem[] = [];
    let soruIndex = 0;

    for (const ders of dersDagilimi) {
      for (let i = 0; i < ders.soruSayisi; i++) {
        const soruNo = soruIndex + 1;
        const cevap = topluParseResult.cevaplar[soruIndex] || null;
        const mevcutItem = cevapAnahtari.items.find(item => item.soruNo === soruNo);

        if (topluKitapcik === 'A') {
          newItems.push({
            soruNo,
            dogruCevap: cevap,
            dersKodu: ders.dersKodu,
            dersAdi: ders.dersAdi,
            kazanimKodu: mevcutItem?.kazanimKodu,
            kazanimAciklamasi: mevcutItem?.kazanimAciklamasi,
            konuAdi: mevcutItem?.konuAdi,
            iptal: mevcutItem?.iptal || false,
            kitapcikCevaplari: mevcutItem?.kitapcikCevaplari,
          });
        } else {
          const updatedKitapcikCevaplari: Record<KitapcikTuru, CevapSecenegi> = {
            A: mevcutItem?.kitapcikCevaplari?.A ?? mevcutItem?.dogruCevap ?? null,
            B: mevcutItem?.kitapcikCevaplari?.B ?? null,
            C: mevcutItem?.kitapcikCevaplari?.C ?? null,
            D: mevcutItem?.kitapcikCevaplari?.D ?? null,
          };
          updatedKitapcikCevaplari[topluKitapcik] = cevap;

          newItems.push({
            soruNo,
            dogruCevap: mevcutItem?.dogruCevap ?? null,
            dersKodu: ders.dersKodu,
            dersAdi: ders.dersAdi,
            kazanimKodu: mevcutItem?.kazanimKodu,
            kazanimAciklamasi: mevcutItem?.kazanimAciklamasi,
            konuAdi: mevcutItem?.konuAdi,
            iptal: mevcutItem?.iptal || false,
            kitapcikCevaplari: updatedKitapcikCevaplari,
          });
        }
        soruIndex++;
      }
    }

    const newAnahtar: CevapAnahtari = {
      ...cevapAnahtari,
      items: newItems,
      aktifKitapcik: topluKitapcik,
    };

    updateCevapAnahtari(newAnahtar, 'paste');
    setTopluCevapInput('');
    setTopluParseResult(null);
    toast.success(`${toplamSoru} soru başarıyla uygulandı (Kitapçık ${topluKitapcik})`);
  }, [topluParseResult, topluKitapcik, dersDagilimi, cevapAnahtari, updateCevapAnahtari, toplamSoru]);

  // Excel dosya yükleme
  const handleFileUpload = useCallback(async (file: File) => {
    setIsParsingExcel(true);
    setExcelFile(file);
    setExcelError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      if (jsonData.length === 0) {
        setExcelPreview(null);
        setExcelError('Dosyada veri bulunamadı');
        toast.error('Dosyada veri bulunamadı. Lütfen dosyayı kontrol edin.');
        return;
      }

      // Otomatik kolon eşleştirme
      const columns = Object.keys(jsonData[0]);
      const autoMapping: Record<string, string> = {};

      for (const col of columns) {
        const mapped = autoMapColumn(col);
        if (mapped) {
          autoMapping[col] = mapped;
        }
      }

      // Önizleme oluştur
      const preview = parseExcelToPreview(jsonData, autoMapping, dersDagilimi);
      preview.fileName = file.name;
      setExcelPreview(preview);

      // Başarı mesajı
      if (preview.errorRows > 0) {
        toast.error(`${preview.errorRows} satırda hata bulundu. Lütfen kontrol edin.`);
      } else {
        toast.success(`${preview.validRows} satır başarıyla okundu.`);
      }
    } catch (error) {
      console.error('Excel parse hatası:', error);
      setExcelError('Dosya okunamadı');
      toast.error('Excel dosyası okunamadı. Lütfen dosya formatını kontrol edin.');
    } finally {
      setIsParsingExcel(false);
    }
  }, [dersDagilimi]);

  // Excel önizlemeyi onayla
  const handleExcelConfirm = useCallback(() => {
    if (!excelPreview) return;

    const { items, hatalar } = convertPreviewToItems(excelPreview, dersDagilimi);

    if (hatalar.length > 0) {
      toast.error(`${hatalar.length} hata bulundu. Lütfen kontrol edin.`);
      return;
    }

    const newAnahtar: CevapAnahtari = {
      ...cevapAnahtari,
      items,
      toplamSoru: items.length,
    };

    updateCevapAnahtari(newAnahtar, 'excel');
    setExcelPreview(null);
    setExcelFile(null);
    setExcelError(null);
    toast.success(`${items.length} soru başarıyla içe aktarıldı.`);
  }, [excelPreview, dersDagilimi, cevapAnahtari, updateCevapAnahtari]);

  // Excel satırını düzenle
  const handleExcelRowEdit = useCallback((rowIndex: number, field: string, value: string) => {
    if (!excelPreview) return;
    
    const newRows = excelPreview.rows.map(row => {
      if (row.rowIndex === rowIndex) {
        const updatedRow = { ...row, [field]: value };
        
        // Hata durumunu yeniden hesapla
        const errors: string[] = [];
        if (updatedRow.dogruCevap && !['A', 'B', 'C', 'D', 'E'].includes(updatedRow.dogruCevap)) {
          errors.push('Geçersiz cevap');
        }
        
        updatedRow.hasError = errors.length > 0;
        updatedRow.errorMessage = errors.join(', ');
        
        return updatedRow;
      }
      return row;
    });
    
    const errorRows = newRows.filter(r => r.hasError).length;
    const validRows = newRows.length - errorRows;
    
    setExcelPreview({
      ...excelPreview,
      rows: newRows,
      isValid: errorRows === 0,
      errorRows,
      validRows,
    });
  }, [excelPreview]);

  // Excel satırını sil
  const handleExcelRowDelete = useCallback((rowIndex: number) => {
    if (!excelPreview) return;
    
    const newRows = excelPreview.rows.filter(row => row.rowIndex !== rowIndex);
    const errorRows = newRows.filter(r => r.hasError).length;
    
    setExcelPreview({
      ...excelPreview,
      rows: newRows,
      totalRows: newRows.length,
      errorRows,
      validRows: newRows.length - errorRows,
      isValid: errorRows === 0,
    });
    
    toast.success('Satır silindi.');
  }, [excelPreview]);

  // Satır seçimi toggle
  const toggleRowSelection = useCallback((soruNo: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(soruNo)) {
        newSet.delete(soruNo);
      } else {
        newSet.add(soruNo);
      }
      return newSet;
    });
  }, []);

  // Tümünü seç/kaldır
  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === cevapAnahtari.items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(cevapAnahtari.items.map(i => i.soruNo)));
    }
  }, [selectedRows.size, cevapAnahtari.items]);

  // Seçili satırları sil
  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.size === 0) return;
    if (!confirm(`${selectedRows.size} soru silinecek. Emin misiniz?`)) return;
    
    const count = selectedRows.size;
    const newAnahtar = deleteSelectedItems(cevapAnahtari, Array.from(selectedRows));
    updateCevapAnahtari(newAnahtar, 'manual');
    setSelectedRows(new Set());
    toast.success(`${count} soru silindi.`);
  }, [selectedRows, cevapAnahtari, updateCevapAnahtari]);

  // Tüm cevapları temizle
  const handleClearAll = useCallback(() => {
    if (!confirm('Tüm cevaplar silinecek. Emin misiniz?')) return;
    const newAnahtar = clearAllAnswers(cevapAnahtari);
    updateCevapAnahtari(newAnahtar, 'manual');
    toast.success('Tüm cevaplar temizlendi.');
  }, [cevapAnahtari, updateCevapAnahtari]);

  // Ders genişlet/daralt
  const toggleDers = useCallback((dersKodu: string) => {
    setExpandedDersler(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dersKodu)) {
        newSet.delete(dersKodu);
      } else {
        newSet.add(dersKodu);
      }
      return newSet;
    });
  }, []);

  // Tüm dersleri genişlet
  const expandAll = useCallback(() => {
    setExpandedDersler(new Set(dersDagilimi.map(d => d.dersKodu)));
  }, [dersDagilimi]);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB DEFINITIONS
  // ─────────────────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'manuel' as const, label: 'Manuel Giriş', icon: <Target size={16} /> },
    { id: 'toplu' as const, label: 'Toplu Yapıştır', icon: <ClipboardPaste size={16} /> },
    { id: 'excel' as const, label: 'Excel/CSV', icon: <FileSpreadsheet size={16} /> },
    { id: 'foto' as const, label: 'Fotoğraf', icon: <Camera size={16} /> },
    { id: 'kutuphane' as const, label: 'Kütüphane', icon: <Library size={16} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 min-w-[90px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all',
              activeTab === tab.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* KITAPÇIK SEÇİMİ (Manuel ve Toplu için) */}
      {(activeTab === 'manuel' || activeTab === 'toplu') && step1Data.kitapcikTurleri.length > 1 && (
        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <span className="text-sm font-semibold text-amber-800">Kitapçık Seç:</span>
          <div className="flex gap-2">
            {(['A', 'B', 'C', 'D'] as KitapcikTuru[]).map((kit) => (
              <button
                key={kit}
                onClick={() => activeTab === 'manuel' ? setAktifKitapcik(kit) : setTopluKitapcik(kit)}
                className={cn(
                  'w-10 h-10 rounded-lg font-bold text-lg transition-all',
                  (activeTab === 'manuel' ? aktifKitapcik : topluKitapcik) === kit
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                )}
              >
                {kit}
              </button>
            ))}
          </div>
          <span className="text-sm text-amber-700 ml-auto">
            Aktif: Kitapçık {activeTab === 'manuel' ? aktifKitapcik : topluKitapcik} ({validation.stats.doldurulanSoru}/{toplamSoru})
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: MANUEL GİRİŞ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'manuel' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">Hızlı Ders Bazlı Cevap Girişi - Kitapçık {aktifKitapcik}</h4>
            <button onClick={expandAll} className="text-sm text-emerald-600 hover:text-emerald-700">
              Tümünü Genişlet
            </button>
          </div>

          {dersDagilimi.map((ders) => {
            const renkler = DERS_RENKLERI[ders.dersKodu] || { bg: 'bg-gray-500', text: 'text-gray-600', icon: '📚' };
            const isExpanded = expandedDersler.has(ders.dersKodu);
            const dersItems = cevapAnahtari.items.filter(i => i.dersKodu === ders.dersKodu);
            const doldurulan = dersItems.filter(i => i.dogruCevap).length;

            return (
              <div key={ders.dersKodu} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleDers(ders.dersKodu)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{renkler.icon}</span>
                    <div className="text-left">
                      <p className={cn('font-semibold', renkler.text)}>{ders.dersAdi}</p>
                      <p className="text-xs text-gray-500">{ders.soruSayisi} Soru</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${(doldurulan / ders.soruSayisi) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{doldurulan}/{ders.soruSayisi}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {dersItems.map((item) => (
                        <div key={item.soruNo} className="relative">
                          <span className="absolute -top-1 -left-1 text-[10px] text-gray-400 font-medium">
                            {item.soruNo}
                          </span>
                          <div className="flex gap-0.5">
                            {(['A', 'B', 'C', 'D', 'E'] as CevapSecenegi[]).map((secen) => (
                              <button
                                key={secen}
                                onClick={() => handleCevapChange(item.soruNo, item.dogruCevap === secen ? null : secen)}
                                className={cn(
                                  'w-6 h-6 rounded text-xs font-bold transition-all',
                                  item.dogruCevap === secen
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-400 border border-gray-200 hover:border-emerald-300'
                                )}
                              >
                                {secen}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: TOPLU YAPIŞTIR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'toplu' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <p className="text-sm text-emerald-700">
              <strong>Tek Seferde Yapıştır:</strong> {toplamSoru} sorunun tamamını tek alana yapıştırın.
              <br />
              <span className="text-xs">Desteklenen: ABCDABCD... | A B C D... | 1 2 3 4... | Satır satır</span>
            </p>
          </div>

          {/* Yapıştırma Alanı */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {toplamSoru} Sorunun Cevaplarını Yapıştırın (Kitapçık {topluKitapcik}):
            </label>
            <div className="relative">
              <textarea
                value={topluCevapInput}
                onChange={(e) => handleTopluInputChange(e.target.value)}
                placeholder={`Örnek: ABCDABCDABCD... (toplam ${toplamSoru} cevap)`}
                className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm resize-none"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-bold',
                  topluParseResult?.isValid
                    ? 'bg-emerald-100 text-emerald-700'
                    : topluParseResult?.girilmisSayi && topluParseResult.girilmisSayi > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-500'
                )}>
                  {topluParseResult?.girilmisSayi || 0} / {toplamSoru}
                </span>
                {topluParseResult?.isValid && <Check className="text-emerald-500" size={20} />}
              </div>
            </div>

            {/* Parse Sonucu */}
            {topluParseResult && (topluParseResult.hatalar.length > 0 || topluParseResult.uyarilar.length > 0) && (
              <div className="space-y-2">
                {topluParseResult.hatalar.map((hata, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {hata}
                  </div>
                ))}
                {topluParseResult.uyarilar.map((uyari, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle size={14} />
                    {uyari}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ders Dağılımı Özeti */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Ders Dağılımı:</h5>
            <div className="flex flex-wrap gap-2">
              {dersDagilimi.map((ders, index) => {
                const renkler = DERS_RENKLERI[ders.dersKodu] || { icon: '📚' };
                const baslangic = dersDagilimi.slice(0, index).reduce((s, d) => s + d.soruSayisi, 0) + 1;
                const bitis = baslangic + ders.soruSayisi - 1;
                return (
                  <div key={ders.dersKodu} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                    <span>{renkler.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{ders.dersAdi}</span>
                    <span className="text-xs text-gray-400">({baslangic}-{bitis})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uygula Butonu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setTopluCevapInput(''); setTopluParseResult(null); }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Temizle
            </button>
            <div className="flex-1" />
            <button
              onClick={handleTopluApply}
              disabled={!topluParseResult?.isValid}
              className={cn(
                'px-8 py-3 rounded-xl font-bold text-lg transition-all flex items-center gap-3 shadow-lg',
                topluParseResult?.isValid
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <ClipboardPaste size={20} />
              Cevapları Uygula
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: EXCEL/CSV YÜKLE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'excel' && (
        <div className="space-y-4">
          {!excelPreview ? (
            <>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Excel/CSV Yükle:</strong> Cevap anahtarı + kazanım bilgilerini içeren dosyanızı yükleyin.
                  <br />
                  <span className="text-xs">Desteklenen kolonlar: Soru No, Doğru Cevap, Ders Kodu, Kazanım Kodu, Kazanım Metni</span>
                </p>
              </div>

              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
              >
                {isParsingExcel ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-gray-600">Dosya işleniyor...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Dosyayı sürükleyip bırakın veya tıklayın</p>
                    <p className="text-sm text-gray-400">.xlsx, .xls, .csv formatları desteklenir</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {/* Excel Önizleme */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-emerald-600" size={24} />
                  <div>
                    <p className="font-semibold text-emerald-700">{excelPreview.fileName}</p>
                    <p className="text-sm text-emerald-600">
                      {excelPreview.validRows} geçerli, {excelPreview.errorRows} hatalı satır
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setExcelPreview(null); setExcelFile(null); }}
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-emerald-600" />
                </button>
              </div>

              {/* Önizleme Tablosu */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Soru</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Cevap</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Ders</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Kazanım</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Durum</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700 w-20">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelPreview.rows.slice(0, 50).map((row) => (
                        <tr key={row.rowIndex} className={cn(
                          'border-t border-gray-100',
                          row.hasError ? 'bg-red-50' : 'hover:bg-gray-50',
                          editingExcelRow === row.rowIndex ? 'bg-blue-50' : ''
                        )}>
                          <td className="px-3 py-2 font-medium">{row.soruNo}</td>
                          <td className="px-3 py-2">
                            {editingExcelRow === row.rowIndex ? (
                              <select
                                value={row.dogruCevap || ''}
                                onChange={(e) => handleExcelRowEdit(row.rowIndex, 'dogruCevap', e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="">-</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                              </select>
                            ) : (
                              <span className={cn(
                                'inline-flex items-center justify-center w-7 h-7 rounded font-bold',
                                row.dogruCevap ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                              )}>
                                {row.dogruCevap || '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{row.dersKodu || '-'}</td>
                          <td className="px-3 py-2">
                            {editingExcelRow === row.rowIndex ? (
                              <input
                                type="text"
                                value={row.kazanimKodu || ''}
                                onChange={(e) => handleExcelRowEdit(row.rowIndex, 'kazanimKodu', e.target.value)}
                                placeholder="T.8.3.5"
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500"
                              />
                            ) : (
                              <span className="text-gray-600 truncate max-w-[200px] block">
                                {row.kazanimKodu || '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {row.hasError ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle size={14} />
                                <span className="text-xs">{row.errorMessage}</span>
                              </div>
                            ) : (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              {editingExcelRow === row.rowIndex ? (
                                <button
                                  onClick={() => setEditingExcelRow(null)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                                  title="Kaydet"
                                >
                                  <Check size={14} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingExcelRow(row.rowIndex)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Düzenle"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleExcelRowDelete(row.rowIndex)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Sil"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {excelPreview.rows.length > 50 && (
                  <div className="p-2 bg-gray-50 text-center text-sm text-gray-500">
                    + {excelPreview.rows.length - 50} satır daha...
                  </div>
                )}
              </div>

              {/* Onay Butonu */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setExcelPreview(null); setExcelFile(null); }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleExcelConfirm}
                  disabled={!excelPreview.isValid}
                  className={cn(
                    'px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-3',
                    excelPreview.isValid
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Check size={20} />
                  Cevapları İçe Aktar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: FOTOĞRAFTAN BAŞLAT (PLACEHOLDER) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'foto' && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Fotoğraftan Cevap Anahtarı</h3>
          <p className="text-gray-400 mb-4">Bu özellik yakında aktif olacak</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm">
            <AlertCircle size={16} />
            OCR ile doldur (Yakında)
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: KÜTÜPHANE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'kutuphane' && (
        <div className="space-y-4">
          <div className="text-center py-12 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50/50">
            <Library className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-purple-600 mb-2">Cevap Anahtarı Kütüphanesi</h3>
            <p className="text-purple-500 mb-4 max-w-md mx-auto">
              Daha önce kaydettiğiniz cevap anahtarı şablonlarını seçebilir veya mevcut anahtarı kaydedebilirsiniz.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm">
              <AlertCircle size={16} />
              Bu özellik yakında aktif olacak
            </div>
          </div>

          {/* Bilgi Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Save size={18} className="text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-700">Şablon Kaydetme</h4>
              </div>
              <p className="text-sm text-gray-500">
                Oluşturduğunuz cevap anahtarlarını ileride tekrar kullanmak üzere kaydedebileceksiniz.
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <RefreshCw size={18} className="text-emerald-600" />
                </div>
                <h4 className="font-semibold text-gray-700">Hızlı Yükleme</h4>
              </div>
              <p className="text-sm text-gray-500">
                Kaydedilmiş şablonları tek tıkla yükleyerek zaman kazanabileceksiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CEVAP ANAHTARI EDİTÖRÜ (Her zaman görünür) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <Edit3 size={18} />
            Cevap Anahtarı Editörü
          </h4>
          <div className="flex items-center gap-2">
            {/* Arama */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-40 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {/* Toplu İşlemler */}
            {selectedRows.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
              >
                <Trash2 size={14} />
                {selectedRows.size} Sil
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Tümünü Temizle
            </button>
          </div>
        </div>

        {/* Scrollable Tablo */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === cevapAnahtari.items.length && cevapAnahtari.items.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">No</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Ders</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Cevap</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Kazanım Kodu</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700">Kazanım Açıklaması</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const renkler = DERS_RENKLERI[item.dersKodu] || { icon: '📚', text: 'text-gray-600' };
                  return (
                    <tr
                      key={item.soruNo}
                      className={cn(
                        'border-t border-gray-100 transition-colors',
                        selectedRows.has(item.soruNo) ? 'bg-emerald-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.soruNo)}
                          onChange={() => toggleRowSelection(item.soruNo)}
                          className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-700">{item.soruNo}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          <span>{renkler.icon}</span>
                          <span className={cn('text-xs font-medium', renkler.text)}>{item.dersKodu}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {(['A', 'B', 'C', 'D', 'E'] as CevapSecenegi[]).map((cevap) => (
                            <button
                              key={cevap}
                              onClick={() => handleCevapChange(item.soruNo, item.dogruCevap === cevap ? null : cevap)}
                              className={cn(
                                'w-7 h-7 rounded text-xs font-bold transition-all',
                                item.dogruCevap === cevap
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              )}
                            >
                              {cevap}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.kazanimKodu || ''}
                          placeholder="T.8.3.5"
                          onChange={(e) => {
                            const newItems = cevapAnahtari.items.map(i =>
                              i.soruNo === item.soruNo ? { ...i, kazanimKodu: e.target.value } : i
                            );
                            updateCevapAnahtari({ ...cevapAnahtari, items: newItems }, 'manual');
                          }}
                          className="w-24 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.kazanimAciklamasi || ''}
                          placeholder="Kazanım açıklaması..."
                          onChange={(e) => {
                            const newItems = cevapAnahtari.items.map(i =>
                              i.soruNo === item.soruNo ? { ...i, kazanimAciklamasi: e.target.value } : i
                            );
                            updateCevapAnahtari({ ...cevapAnahtari, items: newItems }, 'manual');
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ÖZET İSTATİSTİK */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{validation.stats.doldurulanSoru}</p>
            <p className="text-xs text-gray-500">Girildi</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{validation.stats.bosKalanSoru}</p>
            <p className="text-xs text-gray-500">Boş</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">{validation.stats.kazanimliSoru}</p>
            <p className="text-xs text-gray-500">Kazanımlı</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{validation.stats.iptalSoru}</p>
            <p className="text-xs text-gray-500">İptal</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-sm font-medium flex items-center gap-2',
            validation.valid ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {validation.valid ? (
              <>
                <CheckCircle2 size={18} />
                Hazır
              </>
            ) : (
              <>
                <AlertCircle size={18} />
                {validation.stats.bosKalanSoru} soru eksik
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Step2CevapAnahtari;
