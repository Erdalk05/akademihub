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

  // Excel/CSV dosya yükle
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);
    setErrors([]);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Excel dosyası
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Excel'i JSON'a dönüştür
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        const parsed: CevapAnahtariSatir[] = [];
        const parseErrors: string[] = [];
        
        // Akıllı sütun algılama - başlık satırını analiz et
        let columnMap = {
          soruNo: -1,
          cevap: -1,
          ders: -1,
          kazanimKodu: -1,
          kazanimMetni: -1,
          konuAdi: -1
        };
        
        // İlk satırı başlık olarak kontrol et
        const firstRow = jsonData[0] as any[];
        let startIndex = 0;
        
        if (firstRow) {
          firstRow.forEach((cell: any, idx: number) => {
            const cellStr = String(cell || '').toLowerCase().trim();
            
            // Soru numarası sütunu
            if (cellStr.includes('soru') && (cellStr.includes('no') || cellStr.includes('nu'))) {
              if (columnMap.soruNo === -1) columnMap.soruNo = idx;
            } else if (cellStr === 'no' || cellStr === 'sıra' || cellStr === 'sira') {
              if (columnMap.soruNo === -1) columnMap.soruNo = idx;
            }
            
            // Cevap sütunu
            if (cellStr.includes('cevap') || cellStr.includes('yanıt') || cellStr.includes('yanit') || cellStr === 'cvp') {
              columnMap.cevap = idx;
            }
            
            // Ders sütunu
            if (cellStr.includes('ders') || cellStr.includes('alan') || cellStr.includes('konu')) {
              if (columnMap.ders === -1) columnMap.ders = idx;
            }
            
            // Kazanım kodu
            if (cellStr.includes('kazanım') && cellStr.includes('kod')) {
              columnMap.kazanimKodu = idx;
            } else if (cellStr.includes('kazanim') && cellStr.includes('kod')) {
              columnMap.kazanimKodu = idx;
            } else if (cellStr === 'kod' || cellStr === 'kodu') {
              if (columnMap.kazanimKodu === -1) columnMap.kazanimKodu = idx;
            }
            
            // Kazanım metni
            if ((cellStr.includes('kazanım') || cellStr.includes('kazanim')) && 
                (cellStr.includes('metin') || cellStr.includes('açıklama') || cellStr.includes('aciklama'))) {
              columnMap.kazanimMetni = idx;
            }
          });
          
          // Eğer başlık bulunduysa ilk satırı atla
          if (columnMap.cevap !== -1 || columnMap.soruNo !== -1) {
            startIndex = 1;
          }
        }
        
        // Başlık bulunamadıysa, veri yapısını analiz et
        if (columnMap.cevap === -1) {
          // İkinci satırı analiz et
          const sampleRow = jsonData[1] as any[] || jsonData[0] as any[];
          if (sampleRow) {
            sampleRow.forEach((cell: any, idx: number) => {
              const cellStr = String(cell || '').toUpperCase().trim();
              
              // A, B, C, D, E ise cevap sütunu
              if (['A', 'B', 'C', 'D', 'E'].includes(cellStr) && columnMap.cevap === -1) {
                columnMap.cevap = idx;
              }
              
              // Ders adı içeriyorsa
              if (normalizeDersKodu(cellStr) && columnMap.ders === -1) {
                columnMap.ders = idx;
              }
              
              // Kazanım kodu formatı (ör: T.8.1.2, M.8.2.1)
              if (/^[A-Z]\.\d+\.\d+\.\d+/.test(cellStr) && columnMap.kazanimKodu === -1) {
                columnMap.kazanimKodu = idx;
              }
            });
          }
        }
        
        // Varsayılan sütun indeksleri (eğer algılanamadıysa)
        // Format: TEST_KODU | DERS | SORU_NO_SINAV | SORU_NO_GENEL | CEVAP | KAZANIM_KODU | KAZANIM_METNI
        if (columnMap.soruNo === -1) {
          // Sayı içeren ilk sütunu bul
          const sampleRow = jsonData[1] as any[] || [];
          for (let i = 0; i < sampleRow.length; i++) {
            const val = parseInt(String(sampleRow[i]));
            if (!isNaN(val) && val > 0 && val <= 200) {
              columnMap.soruNo = i;
              break;
            }
          }
        }
        
        console.log('Algılanan sütun haritası:', columnMap);
        
        // Veriyi parse et
        jsonData.forEach((row: any[], index: number) => {
          if (index < startIndex) return; // Başlık satırını atla
          if (!row || row.length < 3) return;
          
          // Soru numarasını bul
          let soruNo: number;
          if (columnMap.soruNo !== -1) {
            soruNo = parseInt(String(row[columnMap.soruNo]));
          } else {
            // Satırdaki ilk sayıyı bul
            soruNo = index - startIndex + 1;
            for (let i = 0; i < row.length; i++) {
              const val = parseInt(String(row[i]));
              if (!isNaN(val) && val > 0 && val <= 200) {
                soruNo = val;
                break;
              }
            }
          }
          
          if (isNaN(soruNo) || soruNo <= 0) {
            parseErrors.push(`Satır ${index + 1}: Geçersiz soru numarası`);
            return;
          }
          
          // Cevabı bul
          let dogruCevap: string = '';
          if (columnMap.cevap !== -1) {
            dogruCevap = String(row[columnMap.cevap] || '').toUpperCase().trim();
          } else {
            // A, B, C, D, E içeren sütunu bul
            for (let i = 0; i < row.length; i++) {
              const val = String(row[i] || '').toUpperCase().trim();
              if (['A', 'B', 'C', 'D', 'E'].includes(val)) {
                dogruCevap = val;
                if (columnMap.cevap === -1) columnMap.cevap = i;
                break;
              }
            }
          }
          
          if (!['A', 'B', 'C', 'D', 'E'].includes(dogruCevap)) {
            parseErrors.push(`Satır ${index + 1}: Geçersiz cevap (${dogruCevap || 'boş'})`);
            return;
          }
          
          // Ders kodunu bul
          let dersKodu = '';
          if (columnMap.ders !== -1) {
            dersKodu = String(row[columnMap.ders] || '').toUpperCase().trim();
          } else {
            // Ders adı içeren sütunu bul
            for (let i = 0; i < row.length; i++) {
              const val = String(row[i] || '').toUpperCase().trim();
              const normalized = normalizeDersKodu(val);
              if (normalized) {
                dersKodu = val;
                if (columnMap.ders === -1) columnMap.ders = i;
                break;
              }
            }
          }
          
          const normalizedDersKodu = normalizeDersKodu(dersKodu) || dersKodu;
          
          // Kazanım kodunu bul
          let kazanimKodu = '';
          if (columnMap.kazanimKodu !== -1) {
            kazanimKodu = String(row[columnMap.kazanimKodu] || '').trim();
          } else {
            // Kazanım kodu formatı ara (ör: T.8.1.2)
            for (let i = 0; i < row.length; i++) {
              const val = String(row[i] || '').trim();
              if (/^[A-Z]\.\d+\.\d+\.\d+/.test(val) || /^[A-Z]\d+\.\d+\.\d+/.test(val)) {
                kazanimKodu = val;
                if (columnMap.kazanimKodu === -1) columnMap.kazanimKodu = i;
                break;
              }
            }
          }
          
          // Kazanım metnini bul (en uzun string sütunu)
          let kazanimMetni = '';
          if (columnMap.kazanimMetni !== -1) {
            kazanimMetni = String(row[columnMap.kazanimMetni] || '').trim();
          } else {
            // En uzun string'i bul (muhtemelen kazanım metni)
            let maxLen = 0;
            for (let i = 0; i < row.length; i++) {
              const val = String(row[i] || '').trim();
              if (val.length > maxLen && val.length > 20 && i !== columnMap.ders) {
                maxLen = val.length;
                kazanimMetni = val;
              }
            }
          }
          
          parsed.push({
            soruNo,
            dogruCevap: dogruCevap as 'A' | 'B' | 'C' | 'D' | 'E',
            dersKodu: normalizedDersKodu,
            kazanimKodu: kazanimKodu || undefined,
            kazanimMetni: kazanimMetni || undefined,
            konuAdi: undefined,
            zorluk: 0.5
          });
        });
        
        // Soru numarasına göre sırala
        parsed.sort((a, b) => a.soruNo - b.soruNo);
        
        setParsedData(parsed);
        setErrors(parseErrors);
        
        if (parsed.length > 0) {
          setIsPreviewOpen(true);
        }
        
      } else {
        // CSV veya TXT dosyası
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          parseClipboardData(content);
        };
        reader.readAsText(file);
      }
    } catch (error: any) {
      setErrors([`Dosya okuma hatası: ${error.message}`]);
    } finally {
      setIsUploading(false);
    }
  }, [parseClipboardData]);

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

  // İstatistikler
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
    
    return {
      toplamSoru: parsedData.length,
      dersSayisi: dersler.length,
      kazanimSayisi,
      dersBazliSoruSayisi
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
            {/* Excel Format Bilgisi */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Excel Formatı:</strong> Sütunlar sırasıyla şu şekilde olmalı:
                  <div className="mt-2 grid grid-cols-7 gap-1 text-xs font-mono">
                    <div className="bg-white/70 px-2 py-1 rounded text-center">A: Soru No</div>
                    <div className="bg-white/70 px-2 py-1 rounded text-center">B: Cevap</div>
                    <div className="bg-white/70 px-2 py-1 rounded text-center">C: Ders</div>
                    <div className="bg-white/70 px-2 py-1 rounded text-center">D: Kazanım Kodu</div>
                    <div className="bg-white/70 px-2 py-1 rounded text-center col-span-3">E: Kazanım Metni</div>
                  </div>
                  <p className="mt-2 text-xs text-blue-600">
                    💡 Ders kodları otomatik tanınır: Türkçe, Matematik, Fen, Sosyal, İngilizce, Din
                  </p>
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
                {/* İstatistikler */}
                <div className="p-4 bg-slate-50 space-y-4">
                  {/* Özet Kartları */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-xl">
                      <div className="text-2xl font-bold text-emerald-600">{stats.toplamSoru}</div>
                      <div className="text-sm text-slate-500">Toplam Soru</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{stats.dersSayisi}</div>
                      <div className="text-sm text-slate-500">Ders</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">{stats.kazanimSayisi}</div>
                      <div className="text-sm text-slate-500">Kazanım</div>
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

                {/* Ders Bazlı Gruplar */}
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(groupedByDers).map(([dersKodu, sorular]) => (
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
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-slate-600">No</th>
                              <th className="px-3 py-2 text-center text-slate-600">Cevap</th>
                              <th className="px-3 py-2 text-left text-slate-600">Kazanım Kodu</th>
                              <th className="px-3 py-2 text-left text-slate-600">Kazanım Metni</th>
                              <th className="px-3 py-2 text-center text-slate-600">İşlem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorular.map((soru, idx) => (
                              <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium">{soru.soruNo}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="w-7 h-7 inline-flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full font-bold">
                                    {soru.dogruCevap}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                                    {soru.kazanimKodu || '-'}
                                  </code>
                                </td>
                                <td className="px-3 py-2 text-slate-600 max-w-xs truncate">
                                  {soru.kazanimMetni || '-'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => setParsedData(prev => prev.filter((_, i) => i !== parsedData.indexOf(soru)))}
                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
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

