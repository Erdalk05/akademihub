'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  ClipboardPaste,
  Check,
  X,
  AlertTriangle,
  Table,
  Eye,
  Save,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  Lightbulb,
  Loader2,
  FileUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CevapAnahtariSatir, DERS_RENKLERI, DERS_ISIMLERI, BLOOM_SEVIYELERI } from './types';

interface KazanimCevapAnahtariProps {
  examId?: string;
  examType?: 'LGS' | 'TYT' | 'AYT' | 'DENEME';
  onSave?: (data: CevapAnahtariSatir[]) => void;
  initialData?: CevapAnahtariSatir[];
}

export default function KazanimCevapAnahtari({
  examId,
  examType = 'LGS',
  onSave,
  initialData = []
}: KazanimCevapAnahtariProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'manual'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedData, setParsedData] = useState<CevapAnahtariSatir[]>(initialData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ========== SÜTUN EŞLEŞTİRME SİSTEMİ ==========
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRawData, setExcelRawData] = useState<any[][]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<number, string>>({});
  const [customFields, setCustomFields] = useState<{id: string, label: string}[]>([]);
  const [newCustomFieldName, setNewCustomFieldName] = useState('');

  // Standart alan tipleri
  const STANDARD_FIELDS = [
    { id: 'soruNo', label: '📌 Soru No', required: true, color: '#EF4444' },
    { id: 'dogruCevap', label: '✅ Doğru Cevap', required: true, color: '#10B981' },
    { id: 'dersAdi', label: '📚 Ders Adı', required: false, color: '#3B82F6' },
    { id: 'testKodu', label: '🏷️ Test Kodu', required: false, color: '#8B5CF6' },
    { id: 'soruNoA', label: '🅰️ A Kitapçık Soru No', required: false, color: '#F59E0B' },
    { id: 'soruNoB', label: '🅱️ B Kitapçık Soru No', required: false, color: '#F59E0B' },
    { id: 'soruNoC', label: '©️ C Kitapçık Soru No', required: false, color: '#F59E0B' },
    { id: 'soruNoD', label: '🇩 D Kitapçık Soru No', required: false, color: '#F59E0B' },
    { id: 'kazanimKodu', label: '🎯 Kazanım Kodu', required: false, color: '#EC4899' },
    { id: 'kazanimMetni', label: '📝 Kazanım Metni', required: false, color: '#EC4899' },
    { id: 'konuAdi', label: '📖 Konu Adı', required: false, color: '#06B6D4' },
    { id: 'unite', label: '📗 Ünite', required: false, color: '#84CC16' },
    { id: 'zorluk', label: '⚡ Zorluk', required: false, color: '#F97316' },
    { id: 'skip', label: '⏭️ Atla (Kullanma)', required: false, color: '#9CA3AF' },
  ];

  // Yapıştırılan veriyi parse et
  const parseClipboardData = useCallback((content: string) => {
    const lines = content.trim().split('\n');
    const parsed: CevapAnahtariSatir[] = [];
    const parseErrors: string[] = [];

    lines.forEach((line, index) => {
      if (index === 0 && line.toLowerCase().includes('soru')) {
        // Başlık satırını atla
        return;
      }

      // Tab veya virgül ile ayır
      const cells = line.split(/[\t,;]/).map(c => c.trim());
      
      if (cells.length < 4) {
        parseErrors.push(`Satır ${index + 1}: Yetersiz sütun sayısı`);
        return;
      }

      const soruNo = parseInt(cells[0]);
      if (isNaN(soruNo)) {
        parseErrors.push(`Satır ${index + 1}: Geçersiz soru numarası`);
        return;
      }

      const dogruCevap = cells[1]?.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
      if (!['A', 'B', 'C', 'D', 'E'].includes(dogruCevap)) {
        parseErrors.push(`Satır ${index + 1}: Geçersiz cevap (${cells[1]})`);
        return;
      }

      const dersKodu = cells[2]?.toUpperCase();
      if (!DERS_ISIMLERI[dersKodu]) {
        parseErrors.push(`Satır ${index + 1}: Bilinmeyen ders kodu (${cells[2]})`);
        return;
      }

      parsed.push({
        soruNo,
        dogruCevap,
        dersKodu,
        kazanimKodu: cells[3] || undefined,
        kazanimMetni: cells[4] || undefined,
        konuAdi: cells[5] || undefined,
        zorluk: cells[6] ? parseFloat(cells[6]) : 0.5
      });
    });

    setParsedData(parsed);
    setErrors(parseErrors);
    
    if (parsed.length > 0) {
      setIsPreviewOpen(true);
    }
  }, []);

  // Sütun eşleştirmesini uygula ve veriyi parse et
  const applyColumnMappings = useCallback(() => {
    const parsed: CevapAnahtariSatir[] = [];
    const parseErrors: string[] = [];
    
    // Zorunlu alanları kontrol et
    const hasSoruNo = Object.values(columnMappings).includes('soruNo');
    const hasCevap = Object.values(columnMappings).includes('dogruCevap');
    
    if (!hasSoruNo || !hasCevap) {
      setErrors(['⚠️ Soru No ve Doğru Cevap alanları zorunludur!']);
      return;
    }
    
    // Verileri parse et (ilk satır başlık olduğu için 1'den başla)
    excelRawData.slice(1).forEach((row, rowIndex) => {
      try {
        let soruNo = 0;
        let dogruCevap = '';
        let dersKodu = '';
        let dersAdi = '';
        let testKodu = '';
        let kazanimKodu = '';
        let kazanimMetni = '';
        let konuAdi = '';
        let unite = '';
        let zorluk = 0.5;
        const kitapcikSoruNo: { A?: number; B?: number; C?: number; D?: number } = {};
        const customData: Record<string, any> = {};
        
        // Her sütunu eşleştirmeye göre işle
        Object.entries(columnMappings).forEach(([colIdx, fieldId]) => {
          const value = row[parseInt(colIdx)];
          if (value === undefined || value === null || value === '') return;
          
          const strValue = String(value).trim();
          
          switch (fieldId) {
            case 'soruNo':
              soruNo = parseInt(strValue) || 0;
              break;
            case 'dogruCevap':
              dogruCevap = strValue.toUpperCase();
              break;
            case 'dersAdi':
              dersAdi = strValue;
              dersKodu = normalizeDersKodu(strValue) || strValue;
              break;
            case 'testKodu':
              testKodu = strValue;
              break;
            case 'soruNoA':
              kitapcikSoruNo.A = parseInt(strValue) || undefined;
              break;
            case 'soruNoB':
              kitapcikSoruNo.B = parseInt(strValue) || undefined;
              break;
            case 'soruNoC':
              kitapcikSoruNo.C = parseInt(strValue) || undefined;
              break;
            case 'soruNoD':
              kitapcikSoruNo.D = parseInt(strValue) || undefined;
              break;
            case 'kazanimKodu':
              kazanimKodu = strValue;
              break;
            case 'kazanimMetni':
              kazanimMetni = strValue;
              break;
            case 'konuAdi':
              konuAdi = strValue;
              break;
            case 'unite':
              unite = strValue;
              break;
            case 'zorluk':
              zorluk = parseFloat(strValue) || 0.5;
              break;
            case 'skip':
              // Atla
              break;
            default:
              // Özel alan
              if (fieldId.startsWith('custom_')) {
                customData[fieldId] = strValue;
              }
              break;
          }
        });
        
        if (soruNo > 0 && ['A', 'B', 'C', 'D', 'E'].includes(dogruCevap)) {
          parsed.push({
            soruNo,
            dogruCevap: dogruCevap as any,
            dersKodu: dersKodu || 'GENEL',
            dersAdi,
            testKodu,
            kazanimKodu: kazanimKodu || undefined,
            kazanimMetni: kazanimMetni || undefined,
            konuAdi: konuAdi || undefined,
            zorluk,
            kitapcikSoruNo: Object.keys(kitapcikSoruNo).length > 0 ? kitapcikSoruNo : undefined,
          });
        }
      } catch (e) {
        parseErrors.push(`Satır ${rowIndex + 2}: Parse hatası`);
      }
    });
    
    if (parsed.length > 0) {
      setParsedData(parsed);
      setIsPreviewOpen(true);
      setShowColumnMapper(false);
      setErrors([]);
    } else {
      setErrors(['Hiç veri parse edilemedi. Sütun eşleştirmelerini kontrol edin.']);
    }
  }, [excelRawData, columnMappings]);

  // Excel/CSV dosya yükle - SÜTUN EŞLEŞTİRME SİSTEMİ
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);
    setErrors([]);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        // İlk satırı başlık olarak al
        const headers = (jsonData[0] as any[]).map((h, idx) => String(h || `Sütun ${idx + 1}`).trim());
        
        // Akıllı otomatik eşleştirme önerisi
        const autoMappings: Record<number, string> = {};
        headers.forEach((header, idx) => {
          const h = header.toLowerCase();
          if (h.includes('soru') && h.includes('no') && !h.includes('a') && !h.includes('b') && !h.includes('c') && !h.includes('d')) {
            autoMappings[idx] = 'soruNo';
          } else if (h.includes('cevap') || h.includes('doğru') || h.includes('dogru')) {
            autoMappings[idx] = 'dogruCevap';
          } else if (h.includes('ders')) {
            autoMappings[idx] = 'dersAdi';
          } else if (h.includes('test') && h.includes('kod')) {
            autoMappings[idx] = 'testKodu';
          } else if ((h.includes('a') && h.includes('soru')) || h === 'a soru no') {
            autoMappings[idx] = 'soruNoA';
          } else if ((h.includes('b') && h.includes('soru')) || h === 'b soru no') {
            autoMappings[idx] = 'soruNoB';
          } else if ((h.includes('c') && h.includes('soru')) || h === 'c soru no') {
            autoMappings[idx] = 'soruNoC';
          } else if ((h.includes('d') && h.includes('soru')) || h === 'd soru no') {
            autoMappings[idx] = 'soruNoD';
          } else if (h.includes('kazanım') || h.includes('kazanim')) {
            if (h.includes('kod')) {
              autoMappings[idx] = 'kazanimKodu';
            } else {
              autoMappings[idx] = 'kazanimMetni';
            }
          } else if (h.includes('konu')) {
            autoMappings[idx] = 'konuAdi';
          } else if (h.includes('ünite') || h.includes('unite')) {
            autoMappings[idx] = 'unite';
          } else if (h.includes('zorluk')) {
            autoMappings[idx] = 'zorluk';
          }
        });
        
        setExcelHeaders(headers);
        setExcelRawData(jsonData as any[][]);
        setColumnMappings(autoMappings);
        setShowColumnMapper(true);
        setIsUploading(false);
        return;
      }
      
      // CSV/TXT için eski mantık
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(/[\t,;]/).map(h => h.trim());
      
      setExcelHeaders(headers);
      setExcelRawData(lines.map(line => line.split(/[\t,;]/).map(c => c.trim())));
      setColumnMappings({});
      setShowColumnMapper(true);
      setIsUploading(false);
      
    } catch (error: any) {
      console.error('Dosya yükleme hatası:', error);
      setErrors([`Dosya yüklenirken hata oluştu: ${error.message}`]);
      setIsUploading(false);
    }
  }, []);

  // Ders kodunu normalize et
  const normalizeDersKodu = (kod: string): string | null => {
    const mapping: Record<string, string> = {
      'TÜRKÇE': 'TUR',
      'TURKCE': 'TUR',
      'TÜR': 'TUR',
      'TUR': 'TUR',
      'TR': 'TUR',
      'MATEMATİK': 'MAT',
      'MATEMATIK': 'MAT',
      'MAT': 'MAT',
      'MT': 'MAT',
      'FEN BİLİMLERİ': 'FEN',
      'FEN BILIMLERI': 'FEN',
      'FEN': 'FEN',
      'FB': 'FEN',
      'SOSYAL BİLGİLER': 'SOS',
      'SOSYAL BILGILER': 'SOS',
      'SOSYAL': 'SOS',
      'SOS': 'SOS',
      'SB': 'SOS',
      'İNKILAP': 'SOS',
      'İNGİLİZCE': 'ING',
      'INGILIZCE': 'ING',
      'ING': 'ING',
      'İNG': 'ING',
      'EN': 'ING',
      'DİN KÜLTÜRÜ': 'DIN',
      'DIN KULTURU': 'DIN',
      'DİN': 'DIN',
      'DIN': 'DIN',
      'DK': 'DIN',
      'DKAB': 'DIN',
    };
    return mapping[kod.toUpperCase()] || null;
  };

  // Örnek Excel dosyası indir
  const downloadSampleExcel = useCallback(() => {
    // Örnek veri
    const sampleData = [
      ['Soru No', 'Cevap', 'Ders Kodu', 'Kazanım Kodu', 'Kazanım Metni', 'Konu Adı'],
      [1, 'A', 'TUR', 'T.8.1.1', 'Dinlediklerinin ana fikrini belirler', 'Dinleme'],
      [2, 'B', 'TUR', 'T.8.1.2', 'Sözcüğün mecaz anlamını kavrar', 'Kelime Bilgisi'],
      [3, 'C', 'TUR', 'T.8.2.1', 'Paragrafta ana düşünceyi bulur', 'Okuma'],
      [4, 'D', 'TUR', 'T.8.3.1', 'Yazım kurallarını uygular', 'Yazım Kuralları'],
      [5, 'A', 'MAT', 'M.8.1.1', 'Tam sayılarla işlem yapar', 'Tam Sayılar'],
      [6, 'B', 'MAT', 'M.8.2.1', 'Cebirsel ifadeleri sadeleştirir', 'Cebir'],
      [7, 'C', 'FEN', 'F.8.1.1', 'DNA yapısını açıklar', 'DNA ve Genetik'],
      [8, 'D', 'FEN', 'F.8.2.1', 'Basınç kavramını tanımlar', 'Basınç'],
      [9, 'A', 'SOS', 'S.8.1.1', 'Atatürk ilkelerini açıklar', 'İnkılap Tarihi'],
      [10, 'B', 'ING', 'I.8.1.1', 'Günlük diyalogları anlar', 'Daily Routines'],
    ];

    // Workbook oluştur
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cevap Anahtarı');

    // Sütun genişliklerini ayarla
    ws['!cols'] = [
      { wch: 10 }, // Soru No
      { wch: 8 },  // Cevap
      { wch: 12 }, // Ders Kodu
      { wch: 15 }, // Kazanım Kodu
      { wch: 40 }, // Kazanım Metni
      { wch: 20 }, // Konu Adı
    ];

    // Excel dosyasını indir
    XLSX.writeFile(wb, 'cevap_anahtari_sablonu.xlsx');
  }, []);

  // Ders bazlı gruplama
  const groupedByDers = useMemo(() => {
    const groups: Record<string, CevapAnahtariSatir[]> = {};
    parsedData.forEach(item => {
      if (!groups[item.dersKodu]) {
        groups[item.dersKodu] = [];
      }
      groups[item.dersKodu].push(item);
    });
    return groups;
  }, [parsedData]);

  // İstatistikler - GELİŞMİŞ
  const stats = useMemo(() => {
    const dersler = Object.keys(groupedByDers);
    const kazanimSayisi = new Set(parsedData.filter(d => d.kazanimKodu).map(d => d.kazanimKodu)).size;
    
    // Ders bazlı soru sayıları
    const dersBazliSoruSayisi = Object.entries(groupedByDers).map(([kod, sorular]) => ({
      dersKodu: kod,
      dersAdi: DERS_ISIMLERI[kod] || kod,
      soruSayisi: sorular.length,
      color: DERS_RENKLERI[kod] || '#64748B'
    }));
    
    // Kitapçık analizi
    const hasKitapcikA = parsedData.some(s => s.kitapcikSoruNo?.A);
    const hasKitapcikB = parsedData.some(s => s.kitapcikSoruNo?.B);
    const hasKitapcikC = parsedData.some(s => s.kitapcikSoruNo?.C);
    const hasKitapcikD = parsedData.some(s => s.kitapcikSoruNo?.D);
    
    const kitapciklar: string[] = [];
    if (hasKitapcikA) kitapciklar.push('A');
    if (hasKitapcikB) kitapciklar.push('B');
    if (hasKitapcikC) kitapciklar.push('C');
    if (hasKitapcikD) kitapciklar.push('D');
    
    // Kazanım analizi
    const hasKazanim = parsedData.some(s => s.kazanimKodu);
    const testKodlari = new Set(parsedData.filter(d => d.testKodu).map(d => d.testKodu));
    
    return {
      toplamSoru: parsedData.length,
      dersSayisi: dersler.length,
      kazanimSayisi,
      dersBazliSoruSayisi,
      kitapciklar,
      hasKazanim,
      testKodlari: Array.from(testKodlari)
    };
  }, [parsedData, groupedByDers]);

  // Kaydet fonksiyonu
  const handleSave = useCallback(() => {
    if (parsedData.length === 0) {
      alert('Kaydedilecek veri yok!');
      return;
    }
    
    onSave?.(parsedData);
    setIsSaved(true);
    
    // 3 saniye sonra kayıt mesajını gizle
    setTimeout(() => setIsSaved(false), 3000);
  }, [parsedData, onSave]);

  return (
    <div className="space-y-6">
      {/* ========== SÜTUN EŞLEŞTİRME MODAL - SADELEŞTİRİLMİŞ ========== */}
      <AnimatePresence>
        {showColumnMapper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            >
              {/* Header - Basit */}
              <div className="bg-emerald-600 p-4 text-white">
                <h2 className="text-lg font-bold">📊 Excel Algılandı</h2>
                <p className="text-sm text-white/80">{excelRawData.length - 1} satır veri bulundu</p>
              </div>
              
              {/* Hızlı Aksiyon Butonları */}
              <div className="p-4 bg-emerald-50 border-b">
                <div className="flex gap-3">
                  <button
                    onClick={applyColumnMappings}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Check size={20} />
                    Otomatik Algılamayı Kabul Et ve Devam
                  </button>
                </div>
                <p className="text-xs text-emerald-700 text-center mt-2">
                  ✅ Sütunlar otomatik algılandı. Değişiklik yapmak istiyorsanız aşağıdan düzenleyin.
                </p>
              </div>
              
              {/* Algılanan Alanlar Özeti - Kompakt */}
              <div className="p-4 max-h-[40vh] overflow-y-auto">
                <p className="text-sm font-medium text-slate-700 mb-3">Algılanan Eşleştirmeler:</p>
                
                <div className="space-y-2">
                  {excelHeaders.map((header, idx) => {
                    const selectedField = columnMappings[idx];
                    const fieldInfo = STANDARD_FIELDS.find(f => f.id === selectedField);
                    
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-32 text-slate-600 truncate font-medium">{header}</span>
                        <span className="text-slate-400">→</span>
                        <select
                          value={selectedField || 'skip'}
                          onChange={(e) => setColumnMappings(prev => ({ ...prev, [idx]: e.target.value }))}
                          className={`flex-1 px-2 py-1.5 border rounded-lg text-sm ${
                            fieldInfo?.required ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'
                          }`}
                        >
                          <option value="skip">⏭️ Atla</option>
                          <option value="soruNo">📌 Soru No</option>
                          <option value="dogruCevap">✅ Doğru Cevap</option>
                          <option value="dersAdi">📚 Ders</option>
                          <option value="soruNoA">🅰️ A Kitapçık</option>
                          <option value="soruNoB">🅱️ B Kitapçık</option>
                          <option value="kazanimKodu">🎯 Kazanım Kodu</option>
                          <option value="kazanimMetni">📝 Kazanım Metni</option>
                          <option value="testKodu">🏷️ Test Kodu</option>
                          <option value="konuAdi">📖 Konu</option>
                        </select>
                        <span className="text-xs text-slate-400 w-20 truncate">
                          {String(excelRawData[1]?.[idx] || '-')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Uyarılar */}
                {(!Object.values(columnMappings).includes('soruNo') || !Object.values(columnMappings).includes('dogruCevap')) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    ⚠️ Soru No ve Doğru Cevap alanları zorunludur!
                  </div>
                )}
              </div>
              
              {/* Footer - Basit */}
              <div className="p-4 border-t bg-slate-50 flex justify-between">
                <button
                  onClick={() => {
                    setShowColumnMapper(false);
                    setExcelHeaders([]);
                    setExcelRawData([]);
                    setColumnMappings({});
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={applyColumnMappings}
                  disabled={!Object.values(columnMappings).includes('soruNo') || !Object.values(columnMappings).includes('dogruCevap')}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={18} />
                  Uygula ve Devam Et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kazanım Bazlı Cevap Anahtarı</h2>
          <p className="text-sm text-slate-500">Excel veya kopyala-yapıştır ile kazanım yükleyin</p>
        </div>
      </div>

      {/* Tab Seçimi */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {[
          { id: 'paste', label: 'Yapıştır', icon: ClipboardPaste },
          { id: 'upload', label: 'Dosya Yükle', icon: Upload },
          { id: 'manual', label: 'Manuel Giriş', icon: Edit2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-md text-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* İçerik Alanları */}
      <AnimatePresence mode="wait">
        {activeTab === 'paste' && (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Excel Format:</strong> Her satırda şu sütunlar olmalı (tab ile ayrılmış):
                  <div className="mt-2 font-mono text-xs bg-white/50 p-2 rounded">
                    Soru No | Cevap | Ders Kodu | Kazanım Kodu | Kazanım Metni
                  </div>
                  <div className="mt-2 text-xs">
                    Örnek: <code className="bg-white/50 px-1 py-0.5 rounded">1	A	TUR	T.8.1.2	Sözcüğün mecaz anlamını kavrar</code>
                  </div>
                </div>
              </div>
            </div>

            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Excel'den kopyaladığınız veriyi buraya yapıştırın..."
              className="w-full h-64 p-4 border-2 border-dashed border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono text-sm resize-none"
            />

            <button
              onClick={() => parseClipboardData(pasteContent)}
              disabled={!pasteContent.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Table size={18} />
              Veriyi Ayrıştır
            </button>
          </motion.div>
        )}

        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Excel Format Bilgisi - GELİŞMİŞ */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 w-full">
                  <strong>Excel Formatı:</strong> Desteklenen sütunlar (herhangi bir sırada olabilir):
                  <div className="mt-2 grid grid-cols-4 gap-1 text-xs font-mono">
                    <div className="bg-slate-100 px-2 py-1.5 rounded text-center">TEST KODU</div>
                    <div className="bg-orange-100 px-2 py-1.5 rounded text-center">DERS ADI</div>
                    <div className="bg-blue-100 px-2 py-1.5 rounded text-center">A SORU NO</div>
                    <div className="bg-green-100 px-2 py-1.5 rounded text-center">B SORU NO</div>
                    <div className="bg-emerald-200 px-2 py-1.5 rounded text-center font-bold">DOĞRU CEVAP ✓</div>
                    <div className="bg-purple-100 px-2 py-1.5 rounded text-center">KAZANIM KODU</div>
                    <div className="bg-purple-100 px-2 py-1.5 rounded text-center col-span-2">KAZANIM METNİ</div>
                  </div>
                  <div className="mt-3 text-xs text-blue-600 space-y-1">
                    <p>📚 <strong>Kitapçık Desteği:</strong> A, B, C, D kitapçık soru numaraları otomatik algılanır</p>
                    <p>📝 <strong>Opsiyonel Alanlar:</strong> Kazanım kodu/metni yoksa o sütunlar gösterilmez</p>
                    <p>💡 <strong>Ders Tanıma:</strong> Türkçe, Matematik, Fen, Sosyal, İngilizce, Din otomatik tanınır</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dosya Yükleme Alanı */}
            <label 
              className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isUploading 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : uploadedFileName 
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-emerald-500 mb-4 animate-spin" />
                  <p className="text-lg font-medium text-emerald-600">Dosya Okunuyor...</p>
                </>
              ) : uploadedFileName ? (
                <>
                  <Check className="w-12 h-12 text-emerald-500 mb-4" />
                  <p className="text-lg font-medium text-emerald-600">{uploadedFileName}</p>
                  <p className="text-sm text-emerald-500 mt-1">
                    {parsedData.length} soru başarıyla okundu
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Başka bir dosya yüklemek için tıklayın
                  </p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-emerald-100 rounded-2xl mb-4">
                    <FileUp className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700">Excel Dosyası Yükle</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Dosyayı sürükleyip bırakın veya tıklayın
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">.xlsx</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">.xls</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">.csv</span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">.txt</span>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Örnek İndir Butonu */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => downloadSampleExcel()}
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <FileSpreadsheet size={16} />
                Örnek Excel İndir
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-4">
                Manuel olarak soru eklemek için aşağıdaki formu kullanın:
              </p>
              <ManuelGirisForm onAdd={(item) => setParsedData(prev => [...prev, item])} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hatalar */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Parse Hataları ({errors.length})</p>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-red-500">... ve {errors.length - 5} hata daha</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Önizleme */}
      {parsedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Önizleme Başlık */}
          <button
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-700">Önizleme</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                {parsedData.length} soru
              </span>
            </div>
            {isPreviewOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <AnimatePresence>
            {isPreviewOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-200"
              >
                {/* İstatistikler - GELİŞMİŞ */}
                <div className="p-4 bg-slate-50 space-y-4">
                  {/* Özet Kartları */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-emerald-600">{stats.toplamSoru}</div>
                      <div className="text-xs text-slate-500">Toplam Soru</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{stats.dersSayisi}</div>
                      <div className="text-xs text-slate-500">Ders</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">{stats.kazanimSayisi}</div>
                      <div className="text-xs text-slate-500">Kazanım</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.kitapciklar.length > 0 ? stats.kitapciklar.join('/') : '-'}
                      </div>
                      <div className="text-xs text-slate-500">Kitapçık</div>
                    </div>
                  </div>
                  
                  {/* Ders Bazlı Soru Sayıları */}
                  <div className="bg-white rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">📊 Ders Bazlı Soru Dağılımı</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.dersBazliSoruSayisi.map((ders) => (
                        <div 
                          key={ders.dersKodu}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ backgroundColor: `${ders.color}15` }}
                        >
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: ders.color }}
                          />
                          <span className="text-sm font-medium" style={{ color: ders.color }}>
                            {ders.dersAdi}
                          </span>
                          <span 
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: ders.color, color: 'white' }}
                          >
                            {ders.soruSayisi}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ders Bazlı Gruplar - GENİŞLETİLMİŞ TABLO */}
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {Object.entries(groupedByDers).map(([dersKodu, sorular]) => {
                    // Kitapçık sütunlarını kontrol et
                    const hasKitapcikA = sorular.some(s => s.kitapcikSoruNo?.A);
                    const hasKitapcikB = sorular.some(s => s.kitapcikSoruNo?.B);
                    const hasKitapcikC = sorular.some(s => s.kitapcikSoruNo?.C);
                    const hasKitapcikD = sorular.some(s => s.kitapcikSoruNo?.D);
                    const hasTestKodu = sorular.some(s => s.testKodu);
                    const hasKazanim = sorular.some(s => s.kazanimKodu);
                    
                    return (
                      <div key={dersKodu} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div 
                          className="flex items-center gap-3 p-3"
                          style={{ backgroundColor: `${DERS_RENKLERI[dersKodu]}15` }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: DERS_RENKLERI[dersKodu] }}
                          />
                          <span className="font-semibold" style={{ color: DERS_RENKLERI[dersKodu] }}>
                            {DERS_ISIMLERI[dersKodu] || dersKodu}
                          </span>
                          <span className="text-sm text-slate-500">({sorular.length} soru)</span>
                          
                          {/* Kitapçık bilgisi varsa göster */}
                          {(hasKitapcikA || hasKitapcikB) && (
                            <div className="flex gap-1 ml-auto">
                              {hasKitapcikA && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">A</span>}
                              {hasKitapcikB && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">B</span>}
                              {hasKitapcikC && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">C</span>}
                              {hasKitapcikD && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">D</span>}
                            </div>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                {hasTestKodu && <th className="px-2 py-2 text-left text-slate-600 text-xs">Test Kodu</th>}
                                <th className="px-2 py-2 text-center text-slate-600 text-xs">
                                  {hasKitapcikA ? 'A' : 'No'}
                                </th>
                                {hasKitapcikB && <th className="px-2 py-2 text-center text-slate-600 text-xs">B</th>}
                                {hasKitapcikC && <th className="px-2 py-2 text-center text-slate-600 text-xs">C</th>}
                                {hasKitapcikD && <th className="px-2 py-2 text-center text-slate-600 text-xs">D</th>}
                                <th className="px-2 py-2 text-center text-slate-600 text-xs">Cevap</th>
                                {hasKazanim && <th className="px-2 py-2 text-left text-slate-600 text-xs">Kazanım Kodu</th>}
                                {hasKazanim && <th className="px-2 py-2 text-left text-slate-600 text-xs">Kazanım Metni</th>}
                                <th className="px-2 py-2 text-center text-slate-600 text-xs">Sil</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sorular.map((soru, idx) => (
                                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                  {hasTestKodu && (
                                    <td className="px-2 py-1.5 text-xs text-slate-500">
                                      {soru.testKodu || '-'}
                                    </td>
                                  )}
                                  <td className="px-2 py-1.5 text-center font-medium text-blue-700">
                                    {soru.kitapcikSoruNo?.A || soru.soruNo}
                                  </td>
                                  {hasKitapcikB && (
                                    <td className="px-2 py-1.5 text-center font-medium text-green-700">
                                      {soru.kitapcikSoruNo?.B || '-'}
                                    </td>
                                  )}
                                  {hasKitapcikC && (
                                    <td className="px-2 py-1.5 text-center font-medium text-orange-700">
                                      {soru.kitapcikSoruNo?.C || '-'}
                                    </td>
                                  )}
                                  {hasKitapcikD && (
                                    <td className="px-2 py-1.5 text-center font-medium text-purple-700">
                                      {soru.kitapcikSoruNo?.D || '-'}
                                    </td>
                                  )}
                                  <td className="px-2 py-1.5 text-center">
                                    <span className="w-6 h-6 inline-flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs">
                                      {soru.dogruCevap}
                                    </span>
                                  </td>
                                  {hasKazanim && (
                                    <td className="px-2 py-1.5">
                                      <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                                        {soru.kazanimKodu || '-'}
                                      </code>
                                    </td>
                                  )}
                                  {hasKazanim && (
                                    <td className="px-2 py-1.5 text-slate-600 text-xs max-w-[200px] truncate" title={soru.kazanimMetni}>
                                      {soru.kazanimMetni || '-'}
                                    </td>
                                  )}
                                  <td className="px-2 py-1.5 text-center">
                                    <button
                                      onClick={() => setParsedData(prev => prev.filter((_, i) => i !== parsedData.indexOf(soru)))}
                                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Kaydet Butonu ve Onay */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                  {/* Kayıt Onayı */}
                  {isSaved && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 p-3 bg-emerald-100 text-emerald-700 rounded-xl"
                    >
                      <Check size={20} />
                      <span className="font-medium">✅ Cevap anahtarı başarıyla kaydedildi! Şimdi "Devam Et" butonuna tıklayabilirsiniz.</span>
                    </motion.div>
                  )}
                  
                  <button
                    onClick={handleSave}
                    className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isSaved 
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                        : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check size={20} />
                        Kaydedildi! ({stats.toplamSoru} soru, {stats.dersSayisi} ders)
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Cevap Anahtarını Kaydet
                      </>
                    )}
                  </button>
                  
                  {/* Özet Bilgi */}
                  <div className="text-center text-sm text-slate-500">
                    {stats.dersBazliSoruSayisi.map((d, i) => (
                      <span key={d.dersKodu}>
                        {d.dersAdi}: <strong>{d.soruSayisi}</strong>
                        {i < stats.dersBazliSoruSayisi.length - 1 ? ' • ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// Manuel Giriş Formu
function ManuelGirisForm({ onAdd }: { onAdd: (item: CevapAnahtariSatir) => void }) {
  const [formData, setFormData] = useState({
    soruNo: 1,
    dogruCevap: 'A' as const,
    dersKodu: 'TUR',
    kazanimKodu: '',
    kazanimMetni: '',
    konuAdi: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      soruNo: formData.soruNo,
      dogruCevap: formData.dogruCevap as 'A' | 'B' | 'C' | 'D' | 'E',
      dersKodu: formData.dersKodu,
      kazanimKodu: formData.kazanimKodu || undefined,
      kazanimMetni: formData.kazanimMetni || undefined,
      konuAdi: formData.konuAdi || undefined,
    });
    setFormData(prev => ({ ...prev, soruNo: prev.soruNo + 1, kazanimKodu: '', kazanimMetni: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Soru No</label>
        <input
          type="number"
          value={formData.soruNo}
          onChange={(e) => setFormData({ ...formData, soruNo: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
          min={1}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Cevap</label>
        <select
          value={formData.dogruCevap}
          onChange={(e) => setFormData({ ...formData, dogruCevap: e.target.value as any })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        >
          {['A', 'B', 'C', 'D', 'E'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Ders</label>
        <select
          value={formData.dersKodu}
          onChange={(e) => setFormData({ ...formData, dersKodu: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        >
          {Object.entries(DERS_ISIMLERI).map(([kod, ad]) => (
            <option key={kod} value={kod}>{ad}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Kazanım Kodu</label>
        <input
          type="text"
          value={formData.kazanimKodu}
          onChange={(e) => setFormData({ ...formData, kazanimKodu: e.target.value })}
          placeholder="T.8.1.2"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        />
      </div>
      <div className="col-span-2 flex items-end gap-2">
        <input
          type="text"
          value={formData.kazanimMetni}
          onChange={(e) => setFormData({ ...formData, kazanimMetni: e.target.value })}
          placeholder="Kazanım açıklaması..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
        >
          <Check size={18} />
        </button>
      </div>
    </form>
  );
}

