'use client';

/**
 * KAZANIM BAZLI CEVAP ANAHTARI - V4.0
 * 
 * Güncellemeler:
 * - Excel yapısı tam algılama (TEST KODU, DERS ADI, A/B SORU NO, KAZANIM...)
 * - Detaylı önizleme (kazanım metni dahil)
 * - Ders bazlı gruplama
 * - Özel alan ekleme desteği
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
  Loader2,
  CheckCircle,
  ArrowRight,
  Table,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Target,
  FileText,
  Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CevapAnahtariSatir, DERS_ISIMLERI } from './types';
// Smart Excel Mapper
import {
  parseExcelWithDetection,
  parseTextWithDetection,
  DetectionResult,
  ParsedQuestion,
  turkishNormalize,
  cleanText
} from '../excel';

interface KazanimCevapAnahtariProps {
  examId?: string;
  examType?: 'LGS' | 'TYT' | 'AYT' | 'DENEME';
  onSave?: (data: CevapAnahtariSatir[]) => void;
  initialData?: CevapAnahtariSatir[];
}

// Ders kodu algılama - genişletilmiş
const DERS_ALIASES: Record<string, string> = {
  // Türkçe
  'TÜRKÇE': 'TUR', 'TURKCE': 'TUR', 'TÜR': 'TUR', 'TUR': 'TUR', 'TR': 'TUR', 'TUR1': 'TUR', 'TUR2': 'TUR',
  // Matematik
  'MATEMATİK': 'MAT', 'MATEMATIK': 'MAT', 'MAT': 'MAT', 'MAT1': 'MAT', 'MAT2': 'MAT',
  // Fen
  'FEN BİLİMLERİ': 'FEN', 'FEN BILIMLERI': 'FEN', 'FEN': 'FEN', 'FEN BİLGİSİ': 'FEN', 'FEN1': 'FEN', 'FEN2': 'FEN',
  // Sosyal
  'SOSYAL BİLGİLER': 'SOS', 'SOSYAL BILGILER': 'SOS', 'SOSYAL': 'SOS', 'SOS': 'SOS', 'SOS1': 'SOS', 'T.C. İNKILAP TARİHİ': 'SOS', 'İNKILAP': 'SOS', 'İNK': 'SOS', 'INK': 'SOS',
  // İngilizce
  'İNGİLİZCE': 'ING', 'INGILIZCE': 'ING', 'İNG': 'ING', 'ING': 'ING', 'ENG': 'ING', 'ING1': 'ING',
  // Din
  'DİN KÜLTÜRÜ': 'DIN', 'DIN KULTURU': 'DIN', 'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ': 'DIN', 'DİN': 'DIN', 'DIN': 'DIN', 'DKAB': 'DIN', 'DIN1': 'DIN',
  // Tarih
  'TARİH': 'TAR', 'TARIH': 'TAR', 'TAR': 'TAR', 'TAR1': 'TAR',
  // Coğrafya
  'COĞRAFYA': 'COG', 'COGRAFYA': 'COG', 'COĞ': 'COG', 'COG': 'COG',
  // Fizik
  'FİZİK': 'FIZ', 'FIZIK': 'FIZ', 'FİZ': 'FIZ', 'FIZ': 'FIZ',
  // Kimya
  'KİMYA': 'KIM', 'KIMYA': 'KIM', 'KİM': 'KIM', 'KIM': 'KIM',
  // Biyoloji
  'BİYOLOJİ': 'BIO', 'BIYOLOJI': 'BIO', 'BİYO': 'BIO', 'BIO': 'BIO',
};

// Ders tam adları
const DERS_TAM_ADLARI: Record<string, string> = {
  'TUR': 'Türkçe',
  'MAT': 'Matematik',
  'FEN': 'Fen Bilimleri',
  'SOS': 'Sosyal Bilgiler',
  'ING': 'İngilizce',
  'DIN': 'Din Kültürü',
  'TAR': 'Tarih',
  'COG': 'Coğrafya',
  'FIZ': 'Fizik',
  'KIM': 'Kimya',
  'BIO': 'Biyoloji',
};

// Ders renkleri
const DERS_RENKLERI: Record<string, { bg: string; text: string; border: string }> = {
  'TUR': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'MAT': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'FEN': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'SOS': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'ING': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'DIN': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'TAR': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'COG': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'FIZ': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'KIM': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'BIO': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
};

function getDersKodu(text: string): string {
  if (!text) return 'TUR';
  const upper = text.toUpperCase().trim();
  
  // Direkt eşleşme
  if (DERS_ALIASES[upper]) return DERS_ALIASES[upper];
  
  // Kısmi eşleşme
  for (const [key, value] of Object.entries(DERS_ALIASES)) {
    if (upper.includes(key) || key.includes(upper)) {
      return value;
    }
  }
  
  return upper.substring(0, 3);
}

function getDersTamAdi(kod: string): string {
  return DERS_TAM_ADLARI[kod] || DERS_ISIMLERI[kod] || kod;
}

function getDersRenk(kod: string) {
  return DERS_RENKLERI[kod] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
}

export default function KazanimCevapAnahtari({
  examType = 'LGS',
  onSave,
  initialData = []
}: KazanimCevapAnahtariProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedData, setParsedData] = useState<CevapAnahtariSatir[]>(initialData);
  const [isPreviewOpen, setIsPreviewOpen] = useState(initialData.length > 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDers, setExpandedDers] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Smart Excel Mapper state
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [showMappingInfo, setShowMappingInfo] = useState(false);

  // ============ EXCEL YÜKLEME - SMART EXCEL MAPPER V5.0 ============
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setShowMappingInfo(false);

    try {
      // 🎯 Smart Excel Mapper ile parse et
      const result = await parseExcelWithDetection(file);
      
      // Detection sonucunu kaydet
      setDetectionResult(result.detection);
      
      console.log('🎯 Smart Detection:', {
        columns: result.detection.columns,
        kitapciklar: result.detection.kitapciklar,
        tahminSinavTipi: result.detection.tahminSinavTipi,
        dersDagilimi: result.detection.dersDagilimi,
        warnings: result.detection.warnings.length,
        validation: result.validation
      });
      
      // Uyarıları kontrol et
      const errors = result.detection.warnings.filter(w => w.severity === 'ERROR');
      if (errors.length > 0) {
        setError(errors.map(e => e.message).join(', '));
        setShowMappingInfo(true);
        setIsLoading(false);
        return;
      }
      
      // Questions'ı CevapAnahtariSatir formatına dönüştür
      const parsed: CevapAnahtariSatir[] = result.questions.map((q, idx) => {
        const dersKodu = getDersKodu(q.dersAdi);
        const dersAdi = getDersTamAdi(dersKodu);
        
        return {
          soruNo: q.soruNo,
          dersKodu,
          dersAdi,
          testKodu: q.testKodu,
          dogruCevap: q.dogruCevap as 'A' | 'B' | 'C' | 'D' | 'E',
          kazanimKodu: q.kazanimKodu,
          kazanimMetni: q.kazanimMetni,
          kitapcikSoruNo: q.kitapcikSoruNo
        };
      });
      
      console.log(`✅ ${parsed.length} soru başarıyla parse edildi`);
      console.log('📊 Ders dağılımı:', result.detection.dersDagilimi);

      // Mapping info'yu göster
      setShowMappingInfo(true);

      setParsedData(parsed);
      setIsPreviewOpen(true);
      setIsSaved(false);
    } catch (err: any) {
      console.error('❌ Excel parse hatası:', err);
      setError(err.message || 'Excel dosyası işlenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============ ESKI PARSE MANTIĞI (YEDEK) ============
  const handleFileUploadLegacy = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.log('📊 Excel Başlıkları:', headers);

      // Türkçe karakterleri normalize et (legacy)
      const normalizeTextLegacy = (text: string): string => {
        return turkishNormalize(text).replace(/\s+/g, '').toUpperCase();
      };

      // Akıllı sütun algılama - esnek eşleşme
      const findCol = (patterns: string[]): number => {
        for (let i = 0; i < headers.length; i++) {
          const normalizedHeader = normalizeTextLegacy(headers[i]);
          for (const pattern of patterns) {
            const normalizedPattern = normalizeTextLegacy(pattern);
            // Tam eşleşme veya içerme kontrolü
            if (normalizedHeader === normalizedPattern || normalizedHeader.includes(normalizedPattern)) {
              return i;
            }
          }
        }
        return -1;
      };

      // Sütun indekslerini bul - Excel'deki başlıklara göre
      // DERS KODU | DERS | KİTAPÇIK A | SORU DEĞERİ | CEVAP | B KİTAPÇIĞI CEVAP | KAZANIM KODU | KAZANIM METNİ
      const testKoduCol = findCol(['DERS KODU', 'DERSKODU', 'TEST KODU', 'TESTKODU', 'TEST']);
      const dersAdiCol = findCol(['DERS', 'DERSADI', 'DERS ADI']);
      
      // A/B/C/D Kitapçık Soru Numaraları
      const aSoruNoCol = findCol(['KİTAPÇIK A', 'KITAPCIK A', 'A SORU NO', 'ASORUNO', 'A SORU', 'SORU NO', 'SORUNO']);
      const bSoruNoCol = findCol(['B KİTAPÇIĞI CEVAP', 'B KITAPCIGI CEVAP', 'KİTAPÇIK B', 'KITAPCIK B', 'B SORU NO', 'BSORUNO', 'B SORU']);
      const cSoruNoCol = findCol(['C KİTAPÇIĞI CEVAP', 'C KITAPCIGI CEVAP', 'KİTAPÇIK C', 'KITAPCIK C', 'C SORU NO', 'CSORUNO', 'C SORU']);
      const dSoruNoCol = findCol(['D KİTAPÇIĞI CEVAP', 'D KITAPCIGI CEVAP', 'KİTAPÇIK D', 'KITAPCIK D', 'D SORU NO', 'DSORUNO', 'D SORU']);
      
      // Soru Değeri
      const soruDegeriCol = findCol(['SORU DEĞERİ', 'SORU DEGERI', 'SORUDEGERI', 'DEGER', 'PUAN']);
      
      // A Kitapçığı Cevabı (ana cevap sütunu)
      const cevapCol = findCol(['CEVAP', 'DOGRUCEVAP', 'DOGRU CEVAP', 'YANIT', 'DOĞRU CEVAP', 'DOGRU', 'A CEVAP', 'A CEVABI']);
      
      // ✨ B KİTAPÇIĞI CEVAP - Farklı kitapçık cevapları
      const bCevapCol = findCol(['B KİTAPÇIĞI CEVAP', 'B KITAPCIGI CEVAP', 'B CEVAP', 'B CEVABI', 'B KİT CEVAP']);
      const cCevapCol = findCol(['C KİTAPÇIĞI CEVAP', 'C KITAPCIGI CEVAP', 'C CEVAP', 'C CEVABI', 'C KİT CEVAP']);
      const dCevapCol = findCol(['D KİTAPÇIĞI CEVAP', 'D KITAPCIGI CEVAP', 'D CEVAP', 'D CEVABI', 'D KİT CEVAP']);
      
      console.log('📚 Kitapçık Cevap Sütunları:', {
        'A Cevap': cevapCol >= 0 ? headers[cevapCol] : 'YOK',
        'B Cevap': bCevapCol >= 0 ? headers[bCevapCol] : 'YOK',
        'C Cevap': cCevapCol >= 0 ? headers[cCevapCol] : 'YOK',
        'D Cevap': dCevapCol >= 0 ? headers[dCevapCol] : 'YOK',
      });
      
      // Kazanım Kodu ve Metni - ayrı ayrı ara
      let kazanimKoduCol = -1;
      let kazanimMetniCol = -1;
      
      for (let i = 0; i < headers.length; i++) {
        const h = normalizeTextLegacy(headers[i]);
        // Kazanım Kodu - sadece "KODU" içeren
        if ((h.includes('KAZANIM') && h.includes('KODU')) || h === 'KAZANIMKODU') {
          kazanimKoduCol = i;
        }
        // Kazanım Metni - "METN" veya "ACIKLAMA" içeren
        else if ((h.includes('KAZANIM') && h.includes('METN')) || h.includes('ACIKLAMA') || h === 'KAZANIMMETNI') {
          kazanimMetniCol = i;
        }
      }
      
      // Eğer hala bulunamadıysa, son çare olarak sırayla KAZANIM içerenleri al
      if (kazanimKoduCol === -1 || kazanimMetniCol === -1) {
        const kazanimCols: number[] = [];
        for (let i = 0; i < headers.length; i++) {
          if (normalizeTextLegacy(headers[i]).includes('KAZANIM')) {
            kazanimCols.push(i);
          }
        }
        if (kazanimCols.length >= 2) {
          if (kazanimKoduCol === -1) kazanimKoduCol = kazanimCols[0];
          if (kazanimMetniCol === -1) kazanimMetniCol = kazanimCols[1];
        } else if (kazanimCols.length === 1 && kazanimKoduCol === -1) {
          kazanimKoduCol = kazanimCols[0];
        }
      }
      
      // Algılanan sütunları logla
      console.log('📊 Algılanan Sütunlar:', {
        'TEST KODU': testKoduCol >= 0 ? headers[testKoduCol] : 'YOK',
        'DERSADI': dersAdiCol >= 0 ? headers[dersAdiCol] : 'YOK',
        'A Soru No': aSoruNoCol >= 0 ? headers[aSoruNoCol] : 'YOK',
        'B Soru No': bSoruNoCol >= 0 ? headers[bSoruNoCol] : 'YOK',
        'C Soru No': cSoruNoCol >= 0 ? headers[cSoruNoCol] : 'YOK',
        'D Soru No': dSoruNoCol >= 0 ? headers[dSoruNoCol] : 'YOK',
        'DoğruCevap': cevapCol >= 0 ? headers[cevapCol] : 'YOK',
        'Kazanım Kodu': kazanimKoduCol >= 0 ? headers[kazanimKoduCol] : 'YOK',
        'Kazanım Metni': kazanimMetniCol >= 0 ? headers[kazanimMetniCol] : 'YOK',
      });

      // Kitapçık türlerini belirle
      const kitapciklar: string[] = [];
      if (aSoruNoCol >= 0) kitapciklar.push('A');
      if (bSoruNoCol >= 0) kitapciklar.push('B');
      if (cSoruNoCol >= 0) kitapciklar.push('C');
      if (dSoruNoCol >= 0) kitapciklar.push('D');
      
      console.log('📚 Algılanan Kitapçıklar:', kitapciklar.join(', ') || 'Tek kitapçık');

      // Verileri parse et
      const parsed: CevapAnahtariSatir[] = [];
      let currentDers = 'TUR';
      let currentTestKodu = '';

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Boş satırları atla
        const hasContent = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
        if (!hasContent) continue;

        // Test kodunu al
        if (testKoduCol >= 0 && row[testKoduCol]) {
          currentTestKodu = String(row[testKoduCol]).trim();
        }

        // Ders kodunu ve adını al
        let currentDersAdi = '';
        if (dersAdiCol >= 0 && row[dersAdiCol]) {
          currentDersAdi = String(row[dersAdiCol]).trim();
          currentDers = getDersKodu(currentDersAdi);
        } else if (testKoduCol >= 0 && row[testKoduCol]) {
          // Test kodundan ders çıkar (TUR1 -> TUR)
          currentDers = getDersKodu(String(row[testKoduCol]));
        }

        // A Soru numarasını al
        let soruNo: number;
        if (aSoruNoCol >= 0) {
          soruNo = parseInt(String(row[aSoruNoCol] || ''));
        } else {
          // İlk sayısal sütunu bul
          soruNo = NaN;
          for (const cell of row) {
            const num = parseInt(String(cell || ''));
            if (!isNaN(num) && num > 0 && num <= 200) {
              soruNo = num;
              break;
            }
          }
        }

        if (isNaN(soruNo) || soruNo <= 0) continue;

        // Cevabı al
        let cevap = '';
        if (cevapCol >= 0) {
          cevap = String(row[cevapCol] || '').toUpperCase().trim();
        } else {
          // Tek harfli A-E bul
          for (const cell of row) {
            const upper = String(cell || '').toUpperCase().trim();
            if (['A', 'B', 'C', 'D', 'E'].includes(upper) && upper.length === 1) {
              cevap = upper;
              break;
            }
          }
        }

        if (!['A', 'B', 'C', 'D', 'E'].includes(cevap)) continue;

        // Kitapçık soru numaralarını al
        const kitapcikSoruNo: { A?: number; B?: number; C?: number; D?: number } = {
          A: soruNo
        };

        if (bSoruNoCol >= 0 && row[bSoruNoCol]) {
          const bNo = parseInt(String(row[bSoruNoCol]));
          if (!isNaN(bNo) && bNo > 0) kitapcikSoruNo.B = bNo;
        }
        if (cSoruNoCol >= 0 && row[cSoruNoCol]) {
          const cNo = parseInt(String(row[cSoruNoCol]));
          if (!isNaN(cNo) && cNo > 0) kitapcikSoruNo.C = cNo;
        }
        if (dSoruNoCol >= 0 && row[dSoruNoCol]) {
          const dNo = parseInt(String(row[dSoruNoCol]));
          if (!isNaN(dNo) && dNo > 0) kitapcikSoruNo.D = dNo;
        }

        // Soru değerini al
        let soruDegeri = 1;
        if (soruDegeriCol >= 0 && row[soruDegeriCol]) {
          soruDegeri = parseFloat(String(row[soruDegeriCol])) || 1;
        }
        
        // ✨ Kitapçık cevaplarını al (A, B, C, D)
        const kitapcikCevaplari: { A?: 'A' | 'B' | 'C' | 'D' | 'E'; B?: 'A' | 'B' | 'C' | 'D' | 'E'; C?: 'A' | 'B' | 'C' | 'D' | 'E'; D?: 'A' | 'B' | 'C' | 'D' | 'E'; } = {
          A: cevap as 'A' | 'B' | 'C' | 'D' | 'E'
        };
        
        // B Kitapçığı cevabı
        if (bCevapCol >= 0 && row[bCevapCol]) {
          const bCevap = String(row[bCevapCol]).toUpperCase().trim();
          if (['A', 'B', 'C', 'D', 'E'].includes(bCevap)) {
            kitapcikCevaplari.B = bCevap as 'A' | 'B' | 'C' | 'D' | 'E';
          }
        }
        
        // C Kitapçığı cevabı
        if (cCevapCol >= 0 && row[cCevapCol]) {
          const cCevap = String(row[cCevapCol]).toUpperCase().trim();
          if (['A', 'B', 'C', 'D', 'E'].includes(cCevap)) {
            kitapcikCevaplari.C = cCevap as 'A' | 'B' | 'C' | 'D' | 'E';
          }
        }
        
        // D Kitapçığı cevabı
        if (dCevapCol >= 0 && row[dCevapCol]) {
          const dCevap = String(row[dCevapCol]).toUpperCase().trim();
          if (['A', 'B', 'C', 'D', 'E'].includes(dCevap)) {
            kitapcikCevaplari.D = dCevap as 'A' | 'B' | 'C' | 'D' | 'E';
          }
        }
        
        // Kazanım bilgilerini al
        const kazanimKodu = kazanimKoduCol >= 0 ? String(row[kazanimKoduCol] || '').trim() : '';
        const kazanimMetni = kazanimMetniCol >= 0 ? String(row[kazanimMetniCol] || '').trim() : '';

        parsed.push({
          soruNo,
          dogruCevap: cevap as 'A' | 'B' | 'C' | 'D' | 'E',
          dersKodu: currentDers,
          dersAdi: currentDersAdi || getDersTamAdi(currentDers),
          testKodu: currentTestKodu || undefined,
          soruDegeri: soruDegeri !== 1 ? soruDegeri : undefined,
          kazanimKodu: kazanimKodu || undefined,
          kazanimMetni: kazanimMetni || undefined,
          kitapcikSoruNo: Object.keys(kitapcikSoruNo).length > 1 ? kitapcikSoruNo : undefined,
          kitapcikCevaplari: Object.keys(kitapcikCevaplari).length > 1 ? kitapcikCevaplari : undefined,
          zorluk: 0.5
        });
      }

      if (parsed.length === 0) {
        setError('Geçerli veri bulunamadı. Excel formatını kontrol edin.');
      } else {
        // Soru numarasına göre sırala (ders içinde)
        parsed.sort((a, b) => {
          if (a.dersKodu !== b.dersKodu) {
            return a.dersKodu.localeCompare(b.dersKodu);
          }
          return a.soruNo - b.soruNo;
        });
        
        console.log('✅ Parse edildi:', parsed.length, 'soru');
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
        if (i === 0 && (line.toLowerCase().includes('soru') || line.toLowerCase().includes('cevap') || line.toLowerCase().includes('ders'))) {
          continue;
        }

        // Tab, virgül veya noktalı virgül ile ayır
        const cells = line.split(/[\t,;|]+/).map(c => c.trim());
        if (cells.length < 2) continue;

        // İlk sayıyı soru numarası olarak al
        let soruNo = NaN;
        for (const cell of cells) {
          const num = parseInt(cell);
          if (!isNaN(num) && num > 0 && num <= 200) {
            soruNo = num;
            break;
          }
        }
        if (isNaN(soruNo)) continue;

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
          if (DERS_TAM_ADLARI[dersKodu]) {
            currentDers = dersKodu;
            break;
          }
        }

        // Kazanım kodunu bul (T.8.3.5 gibi pattern)
        let kazanimKodu = '';
        let kazanimMetni = '';
        for (let j = 0; j < cells.length; j++) {
          const cell = cells[j];
          if (/^[A-Z]\.\d+\.\d+/.test(cell.toUpperCase())) {
            kazanimKodu = cell;
            // Sonraki hücre kazanım metni olabilir
            if (j + 1 < cells.length && cells[j + 1].length > 10) {
              kazanimMetni = cells[j + 1];
            }
            break;
          }
        }

        parsed.push({
          soruNo,
          dogruCevap: cevap as 'A' | 'B' | 'C' | 'D' | 'E',
          dersKodu: currentDers,
          kazanimKodu: kazanimKodu || undefined,
          kazanimMetni: kazanimMetni || undefined,
          zorluk: 0.5
        });
      }

      if (parsed.length === 0) {
        setError('Geçerli veri bulunamadı.');
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

  // ============ MANUEL DÜZENLEME ============
  const handleEdit = (index: number, field: keyof CevapAnahtariSatir, value: any) => {
    const newData = [...parsedData];
    (newData[index] as any)[field] = value;
    setParsedData(newData);
  };

  const handleAddRow = () => {
    const lastDers = parsedData.length > 0 ? parsedData[parsedData.length - 1].dersKodu : 'TUR';
    const lastSoruNo = parsedData.length > 0 ? Math.max(...parsedData.map(p => p.soruNo)) : 0;
    
    setParsedData([
      ...parsedData,
      {
        soruNo: lastSoruNo + 1,
        dogruCevap: 'A',
        dersKodu: lastDers,
        zorluk: 0.5
      }
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setParsedData(parsedData.filter((_, i) => i !== index));
  };

  // ============ KAYDET ============
  const handleSave = useCallback(() => {
    console.log('🔵 handleSave çağrıldı, parsedData:', parsedData.length);
    
    if (parsedData.length === 0) {
      setError('Kaydedilecek veri yok');
      return;
    }

    // onSave callback'ini çağır
    if (onSave) {
      console.log('✅ onSave çağrılıyor...', parsedData.length, 'soru');
      onSave(parsedData);
      setIsSaved(true);
      setError(null);
      
      // 3 saniye sonra başarı mesajını kaldır
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } else {
      console.warn('⚠️ onSave prop tanımlı değil!');
      setError('Kaydetme fonksiyonu tanımlı değil');
    }
  }, [parsedData, onSave]);

  // Ders bazlı gruplama
  const dersBazliGruplar = parsedData.reduce((acc, item) => {
    if (!acc[item.dersKodu]) {
      acc[item.dersKodu] = [];
    }
    acc[item.dersKodu].push(item);
    return acc;
  }, {} as Record<string, CevapAnahtariSatir[]>);

  // Ders sıralaması (LGS sırasına göre)
  const dersSirasi = ['TUR', 'SOS', 'DIN', 'ING', 'MAT', 'FEN', 'TAR', 'COG', 'FIZ', 'KIM', 'BIO'];
  const siraliDersler = Object.keys(dersBazliGruplar).sort((a, b) => {
    const aIndex = dersSirasi.indexOf(a);
    const bIndex = dersSirasi.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kazanım Bazlı Cevap Anahtarı</h2>
            <p className="text-sm text-slate-500">Excel yükleyin veya manuel ekleyin</p>
          </div>
        </div>

        {parsedData.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold">
              📝 {parsedData.length} Soru
            </span>
            {!isSaved ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <Save size={18} />
                Kaydet ve Devam Et
              </button>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-semibold">
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
            <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 p-1 rounded">
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
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
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
              <div className="flex flex-col items-center gap-4">
                <div className="p-5 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl">
                  <FileSpreadsheet className="w-12 h-12 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-700">Excel Dosyası Seç</p>
                  <p className="text-sm text-slate-500 mt-1">
                    .xlsx, .xls veya .csv formatı
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Smart Detection Sonuçları */}
          {showMappingInfo && detectionResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-emerald-800">🎯 Akıllı Algılama Sonucu</p>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                      {detectionResult.tahminSinavTipi.tip} (%{detectionResult.tahminSinavTipi.guven})
                    </span>
                  </div>
                  
                  {/* Algılanan Sütunlar */}
                  <div className="mb-3">
                    <p className="text-emerald-700 mb-1.5 font-medium text-xs">Eşleştirilen Sütunlar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(detectionResult.columns).map(([key, match]) => (
                        <span 
                          key={key} 
                          className={`px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 ${
                            match.confidence >= 80 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {match.fileColumn}
                          <span className="opacity-60">→</span>
                          {key}
                          {match.confidence < 80 && <span className="text-[10px]">({match.confidence}%)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Ders Dağılımı */}
                  {detectionResult.dersDagilimi.length > 0 && (
                    <div className="mb-2">
                      <p className="text-emerald-700 mb-1.5 font-medium text-xs">Ders Dağılımı:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {detectionResult.dersDagilimi.map((d, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-xs">
                            <span className="font-medium">{i + 1}.</span> {d.dersAdi}: {d.soruSayisi}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Kitapçıklar */}
                  {detectionResult.kitapciklar.length > 0 && (
                    <div>
                      <p className="text-emerald-700 mb-1 font-medium text-xs">Kitapçıklar:</p>
                      <div className="flex gap-1">
                        {detectionResult.kitapciklar.map(k => (
                          <span key={k.code} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                            {k.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Uyarılar */}
                  {detectionResult.warnings.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-200">
                      {detectionResult.warnings.map((w, i) => (
                        <p key={i} className={`text-xs ${
                          w.severity === 'ERROR' ? 'text-red-600' :
                          w.severity === 'WARNING' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {w.severity === 'ERROR' ? '❌' : w.severity === 'WARNING' ? '⚠️' : 'ℹ️'} {w.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Format Bilgisi */}
          {!showMappingInfo && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 mb-2">🧠 Smart Excel Mapper</p>
                  <p className="text-blue-700 mb-2">
                    Fuzzy matching ile otomatik sütun algılama:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: 'DERS_KODU', display: 'Ders Kodu' },
                      { code: 'DERS', display: 'Ders Adı' },
                      { code: 'KITAPCIK_A', display: 'Kitapçık A' },
                      { code: 'SORU_DEGERI', display: 'Soru Değeri' },
                      { code: 'CEVAP', display: 'Doğru Cevap' },
                      { code: 'B_CEVAP', display: 'B Kitapçığı Cevabı' },
                      { code: 'KAZANIM_KODU', display: 'Kazanım Kodu' },
                      { code: 'KAZANIM_METNI', display: 'Kazanım Metni' }
                    ].map(col => (
                      <span key={col.code} className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs">
                        {col.display}
                      </span>
                    ))}
                  </div>
                  <p className="text-blue-600 text-xs mt-2">
                    💡 Sütun adları farklı olsa bile Levenshtein algoritması ile eşleştirilir
                  </p>
                </div>
              </div>
            </div>
          )}
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
DERS KODU    DERS    KİTAPÇIK A    SORU DEĞERİ    CEVAP    B KİTAPÇIĞI CEVAP    KAZANIM KODU    KAZANIM METNİ
TUR1    TÜRKÇE    1    1    B    A    T.8.3.5    Okuduğu metinleri anlama...
TUR1    TÜRKÇE    2    19    A    T.8.3.6    ...`}
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

      {/* ============ DETAYLI ÖNİZLEME ============ */}
      <AnimatePresence>
        {isPreviewOpen && parsedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Table size={20} />
                  <span className="font-semibold text-lg">Önizleme</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                    {parsedData.length} soru
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    Soru Ekle
                  </button>
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

              {/* Özet İstatistikler */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                {/* Genel İstatistikler */}
                <div className="flex flex-wrap items-center gap-4 mb-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <span className="text-lg">📝</span>
                    <span className="font-bold">{parsedData.length}</span>
                    <span className="text-sm">Soru</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <span className="text-lg">📚</span>
                    <span className="font-bold">{siraliDersler.length}</span>
                    <span className="text-sm">Ders</span>
                  </div>
                  {/* Kitapçık bilgisi */}
                  {parsedData.some(p => p.kitapcikSoruNo && Object.keys(p.kitapcikSoruNo).length > 1) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <span className="text-lg">📖</span>
                      <span className="font-bold">
                        {Array.from(new Set(parsedData.flatMap(p => p.kitapcikSoruNo ? Object.keys(p.kitapcikSoruNo) : ['A']))).sort().join('-')}
                      </span>
                      <span className="text-sm">Kitapçık</span>
                    </div>
                  )}
                  {/* Kazanım durumu */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    parsedData.some(p => p.kazanimMetni) 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    <span className="text-lg">{parsedData.some(p => p.kazanimMetni) ? '✅' : '⚠️'}</span>
                    <span className="text-sm">
                      {parsedData.some(p => p.kazanimMetni) 
                        ? `${parsedData.filter(p => p.kazanimMetni).length} Kazanım Tanımlı` 
                        : 'Kazanım Yok'}
                    </span>
                  </div>
                </div>

                {/* Ders Kartları */}
                <div className="flex flex-wrap gap-2">
                  {siraliDersler.map(ders => {
                    const renk = getDersRenk(ders);
                    const sorular = dersBazliGruplar[ders];
                    const kazanimliSoru = sorular.filter(s => s.kazanimMetni).length;
                    return (
                      <button
                        key={ders}
                        onClick={() => setExpandedDers(expandedDers === ders ? null : ders)}
                        className={`px-4 py-2 ${renk.bg} ${renk.text} ${renk.border} border rounded-xl text-sm font-semibold transition-all hover:shadow-md ${
                          expandedDers === ders ? 'ring-2 ring-offset-1 ring-emerald-400' : ''
                        }`}
                      >
                        {getDersTamAdi(ders)}: <span className="font-bold">{sorular.length}</span>
                        {kazanimliSoru > 0 && kazanimliSoru < sorular.length && (
                          <span className="ml-1 text-xs opacity-70">({kazanimliSoru} kzn)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ders Bazlı Detaylar */}
              <div className="max-h-[500px] overflow-auto">
                {siraliDersler.map(ders => {
                  const renk = getDersRenk(ders);
                  const sorular = dersBazliGruplar[ders];
                  const isExpanded = expandedDers === ders || expandedDers === null;
                  
                  return (
                    <div key={ders} className={`border-b border-slate-100 ${renk.bg}`}>
                      {/* Ders Başlığı */}
                      <button
                        onClick={() => setExpandedDers(expandedDers === ders ? null : ders)}
                        className={`w-full px-4 py-3 flex items-center justify-between ${renk.text} hover:bg-white/50 transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          <Target size={18} />
                          <span className="font-bold">{getDersTamAdi(ders)}</span>
                          <span className={`px-2 py-0.5 ${renk.border} border rounded-full text-xs font-medium`}>
                            {sorular.length} soru
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {/* Sorular */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <table className="w-full text-sm bg-white">
                              <thead className="bg-slate-100 sticky top-0">
                                <tr>
                                  {/* Test Kodu varsa göster */}
                                  {parsedData.some(p => p.testKodu) && (
                                    <th className="px-2 py-2 text-left font-semibold text-violet-600 w-16">Kod</th>
                                  )}
                                  {/* Ders Adı */}
                                  <th className="px-2 py-2 text-left font-semibold text-blue-600 w-24">Ders</th>
                                  {/* Soru No */}
                                  <th className="px-2 py-2 text-center font-semibold text-slate-600 w-10">Soru</th>
                                  {/* Soru Değeri varsa göster */}
                                  {parsedData.some(p => p.soruDegeri && p.soruDegeri !== 1) && (
                                    <th className="px-2 py-2 text-center font-semibold text-slate-500 w-10">Puan</th>
                                  )}
                                  {/* A Kitapçığı Cevabı */}
                                  <th className="px-2 py-2 text-center font-semibold text-emerald-600 w-12">A Cev</th>
                                  {/* B Kitapçığı Cevabı */}
                                  {parsedData.some(p => p.kitapcikCevaplari?.B) && (
                                    <th className="px-2 py-2 text-center font-semibold text-amber-600 w-12">B Cev</th>
                                  )}
                                  {/* C Kitapçığı Cevabı */}
                                  {parsedData.some(p => p.kitapcikCevaplari?.C) && (
                                    <th className="px-2 py-2 text-center font-semibold text-orange-600 w-12">C Cev</th>
                                  )}
                                  {/* D Kitapçığı Cevabı */}
                                  {parsedData.some(p => p.kitapcikCevaplari?.D) && (
                                    <th className="px-2 py-2 text-center font-semibold text-red-600 w-12">D Cev</th>
                                  )}
                                  <th className="px-2 py-2 text-left font-semibold text-purple-600 w-24">Kazanım</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-600">📝 Kazanım Açıklaması</th>
                                  <th className="px-2 py-2 text-center font-semibold text-slate-600 w-14">İşlem</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sorular.map((row, idx) => {
                                  const globalIndex = parsedData.findIndex(p => p === row);
                                  const isEditing = editingIndex === globalIndex;
                                  
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50 group">
                                      {/* Test Kodu */}
                                      {parsedData.some(p => p.testKodu) && (
                                        <td className="px-2 py-2 text-left">
                                          <span className="text-xs font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                            {row.testKodu || '-'}
                                          </span>
                                        </td>
                                      )}
                                      {/* Ders Adı */}
                                      <td className="px-2 py-2 text-left">
                                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                          {row.dersAdi || getDersTamAdi(row.dersKodu)}
                                        </span>
                                      </td>
                                      {/* Soru No */}
                                      <td className="px-2 py-2 text-center">
                                        <span className="font-bold text-slate-800">{row.soruNo}</span>
                                      </td>
                                      {/* Soru Değeri */}
                                      {parsedData.some(p => p.soruDegeri && p.soruDegeri !== 1) && (
                                        <td className="px-2 py-2 text-center text-slate-500 text-sm">
                                          {row.soruDegeri || 1}
                                        </td>
                                      )}
                                      {/* A Kitapçığı Cevabı */}
                                      <td className="px-2 py-2 text-center">
                                        <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm">
                                          {row.kitapcikCevaplari?.A || row.dogruCevap}
                                        </span>
                                      </td>
                                      {/* B Kitapçığı Cevabı */}
                                      {parsedData.some(p => p.kitapcikCevaplari?.B) && (
                                        <td className="px-2 py-2 text-center">
                                          <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-100 text-amber-700 rounded-lg font-bold text-sm">
                                            {row.kitapcikCevaplari?.B || '-'}
                                          </span>
                                        </td>
                                      )}
                                      {/* C Kitapçığı Cevabı */}
                                      {parsedData.some(p => p.kitapcikCevaplari?.C) && (
                                        <td className="px-2 py-2 text-center">
                                          <span className="inline-flex items-center justify-center w-7 h-7 bg-orange-100 text-orange-700 rounded-lg font-bold text-sm">
                                            {row.kitapcikCevaplari?.C || '-'}
                                          </span>
                                        </td>
                                      )}
                                      {/* D Kitapçığı Cevabı */}
                                      {parsedData.some(p => p.kitapcikCevaplari?.D) && (
                                        <td className="px-2 py-2 text-center">
                                          <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-red-700 rounded-lg font-bold text-sm">
                                            {row.kitapcikCevaplari?.D || '-'}
                                          </span>
                                        </td>
                                      )}
                                      {/* Kazanım Kodu */}
                                      <td className="px-2 py-2">
                                        {isEditing ? (
                                          <input
                                            type="text"
                                            value={row.kazanimKodu || ''}
                                            onChange={(e) => handleEdit(globalIndex, 'kazanimKodu', e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-sm"
                                            placeholder="T.8.3.5"
                                          />
                                        ) : (
                                          <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                            {row.kazanimKodu || '-'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        {isEditing ? (
                                          <textarea
                                            value={row.kazanimMetni || ''}
                                            onChange={(e) => handleEdit(globalIndex, 'kazanimMetni', e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-sm min-h-[60px]"
                                            placeholder="Kazanım açıklaması..."
                                          />
                                        ) : row.kazanimMetni ? (
                                          <div 
                                            className="text-sm text-slate-700 leading-relaxed cursor-help"
                                            title={row.kazanimMetni}
                                          >
                                            <span className="block max-h-[80px] overflow-hidden">
                                              {row.kazanimMetni}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic text-xs">
                                            Kazanım açıklaması yok
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => setEditingIndex(isEditing ? null : globalIndex)}
                                            className={`p-1.5 rounded hover:bg-slate-200 ${isEditing ? 'bg-emerald-100 text-emerald-600' : 'text-slate-500'}`}
                                          >
                                            {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
                                          </button>
                                          <button
                                            onClick={() => handleDeleteRow(globalIndex)}
                                            className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-600"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Kaydet Butonu */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                {isSaved ? (
                  <div className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-lg">
                    <CheckCircle size={24} />
                    ✅ Cevap Anahtarı Kaydedildi! Devam edebilirsiniz.
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Save size={22} />
                    Cevap Anahtarını Kaydet ve Devam Et
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zaten veri varsa (collapsed) */}
      {initialData.length > 0 && parsedData.length > 0 && !isPreviewOpen && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">
                  Cevap anahtarı yüklendi ({parsedData.length} soru)
                </p>
                <p className="text-sm text-emerald-600">
                  {Object.entries(dersBazliGruplar).map(([ders, sorular]) => 
                    `${getDersTamAdi(ders)}: ${sorular.length}`
                  ).join(' | ')}
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
