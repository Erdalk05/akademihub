'use client';

/**
 * KAZANIM BAZLI CEVAP ANAHTARI - V3.0
 * 
 * Tamamen yeniden tasarlandı:
 * - Daha basit ve anlaşılır UI
 * - Akıllı otomatik algılama
 * - Tek tıkla devam
 * - Çalışır durum
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  ClipboardPaste,
  Check,
  X,
  AlertTriangle,
  Eye,
  Save,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle,
  ArrowRight,
  Table,
  Zap,
  BookOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CevapAnahtariSatir, DERS_ISIMLERI } from './types';

interface KazanimCevapAnahtariProps {
  examId?: string;
  examType?: 'LGS' | 'TYT' | 'AYT' | 'DENEME';
  onSave?: (data: CevapAnahtariSatir[]) => void;
  initialData?: CevapAnahtariSatir[];
}

// Ders kodu algılama
const DERS_ALIASES: Record<string, string> = {
  'TÜRKÇE': 'TUR', 'TURKCE': 'TUR', 'TÜR': 'TUR', 'TR': 'TUR',
  'MATEMATİK': 'MAT', 'MATEMATIK': 'MAT', 'MAT': 'MAT',
  'FEN BİLİMLERİ': 'FEN', 'FEN': 'FEN', 'FEN BİLGİSİ': 'FEN',
  'SOSYAL BİLGİLER': 'SOS', 'SOSYAL': 'SOS', 'SOS': 'SOS',
  'İNGİLİZCE': 'ING', 'INGILIZCE': 'ING', 'İNG': 'ING', 'ING': 'ING',
  'DİN KÜLTÜRÜ': 'DIN', 'DİN': 'DIN', 'DIN': 'DIN', 'DKAB': 'DIN',
  'TARİH': 'TAR', 'TARIH': 'TAR', 'TAR': 'TAR',
  'COĞRAFYA': 'COG', 'COGRAFYA': 'COG', 'COĞ': 'COG',
  'FİZİK': 'FIZ', 'FIZIK': 'FIZ', 'FİZ': 'FIZ',
  'KİMYA': 'KIM', 'KIMYA': 'KIM', 'KİM': 'KIM',
  'BİYOLOJİ': 'BIO', 'BIYOLOJI': 'BIO', 'BİYO': 'BIO',
};

function getDersKodu(text: string): string {
  if (!text) return 'TUR';
  const upper = text.toUpperCase().trim();
  return DERS_ALIASES[upper] || upper.substring(0, 3);
}

export default function KazanimCevapAnahtari({
  examType = 'LGS',
  onSave,
  initialData = []
}: KazanimCevapAnahtariProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedData, setParsedData] = useState<CevapAnahtariSatir[]>(initialData);
  const [isPreviewOpen, setIsPreviewOpen] = useState(initialData.length > 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ EXCEL YÜKLEME ============
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) {
        setError('Excel dosyası boş veya sadece başlık içeriyor');
        setIsLoading(false);
        return;
      }

      // Başlıkları al ve temizle
      const headers = (rows[0] as string[]).map(h => String(h || '').toUpperCase().trim());
      
      // Sütun indekslerini bul
      const findCol = (keywords: string[]): number => {
        return headers.findIndex(h => keywords.some(k => h.includes(k)));
      };

      const soruNoCol = findCol(['SORU NO', 'SORU', 'NO', 'NUMARA', 'A SORU']);
      const cevapCol = findCol(['CEVAP', 'DOĞRU', 'DOGRU', 'YANIT']);
      const dersCol = findCol(['DERS', 'KONU', 'ALAN']);
      const kazanimKoduCol = findCol(['KAZANIM KODU', 'KAZANIM NO', 'KOD']);
      const kazanimMetniCol = findCol(['KAZANIM METNİ', 'KAZANIM METNI', 'AÇIKLAMA']);
      const bSoruNoCol = findCol(['B SORU']);
      const cSoruNoCol = findCol(['C SORU']);
      const dSoruNoCol = findCol(['D SORU']);

      if (soruNoCol === -1 && cevapCol === -1) {
        // Sütun başlığı yoksa, ilk 2 sütunu kullan
        console.log('Başlık bulunamadı, varsayılan sütunlar kullanılıyor');
      }

      // Verileri parse et
      const parsed: CevapAnahtariSatir[] = [];
      let currentDers = 'TUR';

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Soru numarasını al
        let soruNo: number;
        if (soruNoCol >= 0) {
          soruNo = parseInt(String(row[soruNoCol] || ''));
        } else {
          soruNo = parseInt(String(row[0] || ''));
        }

        if (isNaN(soruNo) || soruNo <= 0) continue;

        // Cevabı al
        let cevap: string;
        if (cevapCol >= 0) {
          cevap = String(row[cevapCol] || '').toUpperCase().trim();
        } else {
          cevap = String(row[1] || '').toUpperCase().trim();
        }

        if (!['A', 'B', 'C', 'D', 'E'].includes(cevap)) continue;

        // Ders kodunu al
        if (dersCol >= 0 && row[dersCol]) {
          currentDers = getDersKodu(String(row[dersCol]));
        }

        // Kitapçık soru numaralarını al
        const kitapcikSoruNo: { A?: number; B?: number; C?: number; D?: number } = {
          A: soruNo
        };

        if (bSoruNoCol >= 0 && row[bSoruNoCol]) {
          kitapcikSoruNo.B = parseInt(String(row[bSoruNoCol]));
        }
        if (cSoruNoCol >= 0 && row[cSoruNoCol]) {
          kitapcikSoruNo.C = parseInt(String(row[cSoruNoCol]));
        }
        if (dSoruNoCol >= 0 && row[dSoruNoCol]) {
          kitapcikSoruNo.D = parseInt(String(row[dSoruNoCol]));
        }

        parsed.push({
          soruNo,
          dogruCevap: cevap as 'A' | 'B' | 'C' | 'D' | 'E',
          dersKodu: currentDers,
          kazanimKodu: kazanimKoduCol >= 0 ? String(row[kazanimKoduCol] || '') : undefined,
          kazanimMetni: kazanimMetniCol >= 0 ? String(row[kazanimMetniCol] || '') : undefined,
          kitapcikSoruNo: Object.keys(kitapcikSoruNo).length > 1 ? kitapcikSoruNo : undefined,
          zorluk: 0.5
        });
      }

      if (parsed.length === 0) {
        setError('Geçerli veri bulunamadı. Excel formatını kontrol edin.');
      } else {
        // Soru numarasına göre sırala
        parsed.sort((a, b) => a.soruNo - b.soruNo);
        setParsedData(parsed);
        setIsPreviewOpen(true);
        setError(null);
      }

    } catch (err: any) {
      console.error('Excel okuma hatası:', err);
      setError('Excel dosyası okunamadı: ' + err.message);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  // ============ KOPYALA-YAPIŞTIR ============
  const handlePaste = useCallback(() => {
    if (!pasteContent.trim()) {
      setError('Yapıştırılacak veri yok');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lines = pasteContent.trim().split('\n');
      const parsed: CevapAnahtariSatir[] = [];
      let currentDers = 'TUR';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Başlık satırını atla
        if (i === 0 && (line.toLowerCase().includes('soru') || line.toLowerCase().includes('cevap'))) {
          continue;
        }

        // Tab, virgül veya noktalı virgül ile ayır
        const cells = line.split(/[\t,;|]+/).map(c => c.trim());
        if (cells.length < 2) continue;

        // Soru numarasını bul
        let soruNo = parseInt(cells[0]);
        if (isNaN(soruNo)) {
          // İlk sütun sayı değilse, ikinci sütuna bak
          soruNo = parseInt(cells[1]);
          if (isNaN(soruNo)) continue;
        }

        // Cevabı bul (tek harfli A-E)
        let cevap = '';
        for (const cell of cells) {
          const upper = cell.toUpperCase().trim();
          if (['A', 'B', 'C', 'D', 'E'].includes(upper) && upper.length === 1) {
            cevap = upper;
            break;
          }
        }
        if (!cevap) continue;

        // Ders kodunu bul
        for (const cell of cells) {
          const dersKodu = getDersKodu(cell);
          if (DERS_ISIMLERI[dersKodu]) {
            currentDers = dersKodu;
            break;
          }
        }

        // Kazanım kodunu bul (T.8.3.5 gibi pattern)
        let kazanimKodu = '';
        for (const cell of cells) {
          if (/^[A-Z]\.\d+\.\d+/.test(cell.toUpperCase())) {
            kazanimKodu = cell;
            break;
          }
        }

        parsed.push({
          soruNo,
          dogruCevap: cevap as 'A' | 'B' | 'C' | 'D' | 'E',
          dersKodu: currentDers,
          kazanimKodu: kazanimKodu || undefined,
          zorluk: 0.5
        });
      }

      if (parsed.length === 0) {
        setError('Geçerli veri bulunamadı. Format: SoruNo, Cevap, Ders...');
      } else {
        parsed.sort((a, b) => a.soruNo - b.soruNo);
        setParsedData(parsed);
        setIsPreviewOpen(true);
        setError(null);
      }

    } catch (err: any) {
      setError('Veri işlenemedi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pasteContent]);

  // ============ KAYDET ============
  const handleSave = useCallback(() => {
    if (parsedData.length === 0) {
      setError('Kaydedilecek veri yok');
      return;
    }

    onSave?.(parsedData);
    setIsSaved(true);

    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  }, [parsedData, onSave]);

  // Ders bazlı istatistikler
  const dersBazliSayilar = parsedData.reduce((acc, item) => {
    acc[item.dersKodu] = (acc[item.dersKodu] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cevap Anahtarı</h2>
            <p className="text-sm text-slate-500">Excel yükle veya yapıştır</p>
          </div>
        </div>

        {parsedData.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              {parsedData.length} soru yüklendi
            </span>
            {!isSaved ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                <Save size={18} />
                Kaydet ve Devam Et
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
                <CheckCircle size={18} />
                Kaydedildi!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Butonları */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-white shadow-md text-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload size={18} />
          Excel Yükle
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'paste'
              ? 'bg-white shadow-md text-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardPaste size={18} />
          Yapıştır
        </button>
      </div>

      {/* Hata Mesajı */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3"
          >
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Excel Yükle */}
      {activeTab === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isLoading
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <p className="text-emerald-700 font-medium">Dosya işleniyor...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-emerald-100 rounded-2xl">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-700">Excel Dosyası Seç</p>
                  <p className="text-sm text-slate-500 mt-1">
                    .xlsx, .xls veya .csv formatı
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Format Bilgisi */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Otomatik Algılama</p>
                <p className="text-blue-700">
                  Sistem sütunları otomatik algılar. Excel'inizde şu başlıklar olmalı:
                  <br />
                  <span className="font-mono text-xs bg-blue-100 px-1 rounded">SORU NO</span>,{' '}
                  <span className="font-mono text-xs bg-blue-100 px-1 rounded">DOĞRU CEVAP</span>,{' '}
                  <span className="font-mono text-xs bg-blue-100 px-1 rounded">DERS ADI</span> (opsiyonel)
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Yapıştır */}
      {activeTab === 'paste' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder={`Cevap anahtarını buraya yapıştırın...

Örnek format (tab veya virgülle ayrılmış):
1    A    TÜRKÇE    T.8.3.5    Kazanım açıklaması
2    B    TÜRKÇE    T.8.3.6    ...
3    C    MATEMATİK    M.8.1.2    ...`}
            className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none font-mono text-sm"
          />

          <button
            onClick={handlePaste}
            disabled={!pasteContent.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <ArrowRight size={18} />
                Veriyi İşle
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Önizleme */}
      <AnimatePresence>
        {isPreviewOpen && parsedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Table size={20} />
                  <span className="font-medium">Önizleme</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                    {parsedData.length} soru
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setParsedData([])}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Temizle"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Ders Dağılımı */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(dersBazliSayilar).map(([ders, sayi]) => (
                    <span
                      key={ders}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium"
                    >
                      {DERS_ISIMLERI[ders] || ders}: <span className="text-emerald-600">{sayi}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tablo */}
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Soru</th>
                      <th className="px-4 py-2 text-center font-medium text-slate-600">Cevap</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Ders</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Kazanım</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-800">{row.soruNo}</td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                            {row.dogruCevap}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {DERS_ISIMLERI[row.dersKodu] || row.dersKodu}
                        </td>
                        <td className="px-4 py-2 text-slate-500 text-xs truncate max-w-[200px]">
                          {row.kazanimKodu || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 20 && (
                  <div className="p-3 text-center text-sm text-slate-500 bg-slate-50">
                    ... ve {parsedData.length - 20} soru daha
                  </div>
                )}
              </div>

              {/* Kaydet Butonu */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <CheckCircle size={20} />
                  Cevap Anahtarını Kaydet ve Devam Et
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zaten veri varsa */}
      {initialData.length > 0 && parsedData.length > 0 && !isPreviewOpen && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">
                  Cevap anahtarı yüklendi ({parsedData.length} soru)
                </p>
                <p className="text-sm text-emerald-600">
                  Aşağıdan önizleme yapabilir veya devam edebilirsiniz
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Eye size={16} />
              Önizle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
