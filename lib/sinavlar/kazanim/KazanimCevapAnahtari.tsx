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
  // BOŞLUKSUZ versiyonlar
  'FENBİLİMLERİ': 'FEN', 'FENBILIMLERI': 'FEN', 'FENBİLGİSİ': 'FEN', 'FENBILGISI': 'FEN',
  // Sosyal Bilgiler (5. sınıf vb.)
  'SOSYAL BİLGİLER': 'SOS', 'SOSYAL BILGILER': 'SOS', 'SOSYAL': 'SOS', 'SOS': 'SOS', 'SOS1': 'SOS',
  // BOŞLUKSUZ versiyonlar
  'SOSYALBİLGİLER': 'SOS', 'SOSYALBILGILER': 'SOS',
  // ✅ İNKILAP TARİHİ - LGS için AYRI DERS!
  // Boşluklu versiyonlar
  'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK': 'INK', 
  'T.C. İNKILAP TARİHİ': 'INK', 
  'T.C. INKILAP TARIHI VE ATATÜRKÇÜLÜK': 'INK',
  'T.C. INKILAP TARIHI': 'INK',
  'İNKILAP TARİHİ VE ATATÜRKÇÜLÜK': 'INK',
  'İNKILAP TARİHİ': 'INK',
  'INKILAP TARIHI VE ATATÜRKÇÜLÜK': 'INK',
  'INKILAP TARIHI': 'INK',
  'İNKILAP': 'INK', 'INKILAP': 'INK', 
  'İNK': 'INK', 'INK': 'INK', 
  'TC İNKILAP': 'INK', 'TC INKILAP': 'INK',
  'ATATÜRKÇÜLÜK': 'INK',
  // ✅ BOŞLUKSUZ versiyonlar (getDersKodu normalize ediyor!)
  'T.C.İNKILAPTARİHİVEATATÜRKÇÜLÜK': 'INK',
  'T.C.INKILAPTARIHIVEATATÜRKÇÜLÜK': 'INK',
  'T.C.INKILAPTARIHIVEATATÜRKCULUK': 'INK',
  'İNKILAPTARİHİVEATATÜRKÇÜLÜK': 'INK',
  'INKILAPTARIHIVEATATÜRKÇÜLÜK': 'INK',
  'INKILAPTARIHIVEATATÜRKCULUK': 'INK',
  'İNKILAPTARİHİ': 'INK',
  'INKILAPTARIHI': 'INK',
  'TCİNKILAP': 'INK', 'TCINKILAP': 'INK',
  // İngilizce / Yabancı Dil
  'İNGİLİZCE': 'ING', 'INGILIZCE': 'ING', 'İNG': 'ING', 'ING': 'ING', 'ENG': 'ING', 'ING1': 'ING',
  'YABANCI DİL': 'ING', 'YABANCI DIL': 'ING', 'YAB': 'ING', 'YAB DİL': 'ING',
  // BOŞLUKSUZ versiyonlar
  'YABANCIDİL': 'ING', 'YABANCIDIL': 'ING',
  // ✅ DİN KÜLTÜRÜ - LGS için AYRI DERS!
  // Boşluklu versiyonlar
  'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ': 'DIN', 
  'DIN KULTURU VE AHLAK BILGISI': 'DIN',
  'DİN KÜLTÜRÜ': 'DIN', 'DIN KULTURU': 'DIN', 
  'DİN': 'DIN', 'DIN': 'DIN', 
  'DKAB': 'DIN', 'DIN1': 'DIN',
  // ✅ BOŞLUKSUZ versiyonlar
  'DİNKÜLTÜRÜVEAHLAKBİLGİSİ': 'DIN',
  'DINKULTUREVEAHLAKBILGISI': 'DIN',
  'DİNKÜLTÜRÜ': 'DIN', 'DINKULTURU': 'DIN',
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
  'INK': 'T.C. İnkılap Tarihi ve Atatürkçülük', // ✅ LGS için ayrı ders!
  'ING': 'İngilizce',
  'DIN': 'Din Kültürü ve Ahlak Bilgisi', // ✅ LGS için ayrı ders!
  'TAR': 'Tarih',
  'COG': 'Coğrafya',
  'FIZ': 'Fizik',
  'KIM': 'Kimya',
  'BIO': 'Biyoloji',
};

// Ders renkleri
const DERS_RENKLERI: Record<string, { bg: string; text: string; border: string }> = {
  'TUR': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'INK': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }, // ✅ İnkılap Tarihi
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

// ✅ Türkçe karakterleri ASCII'ye dönüştür
function normalizeTurkish(text: string): string {
  return text
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c');
}

function getDersKodu(text: string): string {
  if (!text) return 'TUR';
  
  const upper = text.toUpperCase().trim();
  const normalized = normalizeTurkish(upper);
  const noSpaces = upper.replace(/\s+/g, '');
  const normalizedNoSpaces = normalizeTurkish(noSpaces);
  
  console.log(`🔍 getDersKodu: "${text}" → upper="${upper}" → noSpaces="${noSpaces}"`);
  
  // ✅ 1. Direkt eşleşme (orijinal)
  if (DERS_ALIASES[upper]) {
    console.log(`✅ Direkt eşleşme: ${upper} → ${DERS_ALIASES[upper]}`);
    return DERS_ALIASES[upper];
  }
  
  // ✅ 2. Boşluksuz eşleşme
  if (DERS_ALIASES[noSpaces]) {
    console.log(`✅ Boşluksuz eşleşme: ${noSpaces} → ${DERS_ALIASES[noSpaces]}`);
    return DERS_ALIASES[noSpaces];
  }
  
  // ✅ 3. Anahtar kelime bazlı algılama (EN ÖNEMLİ!)
  if (upper.includes('İNKILAP') || upper.includes('INKILAP') || upper.includes('ATATÜRK') || 
      normalized.includes('INKILAP') || normalized.includes('ATATURK')) {
    console.log(`✅ Anahtar kelime: İNKILAP → INK`);
    return 'INK';
  }
  
  if (upper.includes('DİN') || upper.includes('DIN') || upper.includes('DKAB') || 
      upper.includes('AHLAK') || normalized.includes('DIN') || normalized.includes('AHLAK')) {
    console.log(`✅ Anahtar kelime: DİN → DIN`);
    return 'DIN';
  }
  
  if (upper.includes('YABANCI') || upper.includes('İNGİLİZCE') || upper.includes('INGILIZCE') ||
      normalized.includes('INGILIZCE') || normalized.includes('YABANCI')) {
    console.log(`✅ Anahtar kelime: YABANCI/İNGİLİZCE → ING`);
    return 'ING';
  }
  
  if (upper.includes('FEN') || upper.includes('BİLİM') || normalized.includes('BILIM')) {
    console.log(`✅ Anahtar kelime: FEN → FEN`);
    return 'FEN';
  }
  
  if (upper.includes('TÜRKÇE') || upper.includes('TURKCE') || normalized.includes('TURKCE')) {
    console.log(`✅ Anahtar kelime: TÜRKÇE → TUR`);
    return 'TUR';
  }
  
  if (upper.includes('MATEMATİK') || upper.includes('MATEMATIK') || normalized.includes('MATEMATIK')) {
    console.log(`✅ Anahtar kelime: MATEMATİK → MAT`);
    return 'MAT';
  }
  
  if (upper.includes('SOSYAL') || normalized.includes('SOSYAL')) {
    console.log(`✅ Anahtar kelime: SOSYAL → SOS`);
    return 'SOS';
  }
  
  // ✅ 4. Kısmi eşleşme (fallback)
  for (const [key, value] of Object.entries(DERS_ALIASES)) {
    const keyNorm = normalizeTurkish(key);
    if (normalized.includes(keyNorm) || keyNorm.includes(normalized) ||
        normalizedNoSpaces.includes(keyNorm) || keyNorm.includes(normalizedNoSpaces)) {
      console.log(`✅ Kısmi eşleşme: ${key} → ${value}`);
      return value;
    }
  }
  
  console.log(`⚠️ Eşleşme bulunamadı: "${text}" → varsayılan TUR`);
  return 'TUR';
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

      // ===========================================
      // SÜTUN İNDEKSLERİNİ BUL - Excel başlıklarına göre
      // ===========================================
      // Excel sıralaması: DERS KODU | DERS | KİTAPÇIK A | SORU DEĞERİ | CEVAP | B KİTAPÇIĞI CEVAP | KAZANIM KODU | KAZANIM METNİ
      
      // 1. DERS KODU (Sütun A)
      const testKoduCol = findCol(['DERS KODU', 'DERSKODU', 'DERS_KODU', 'TEST KODU', 'TESTKODU']);
      
      // 2. DERS ADI (Sütun B)
      const dersAdiCol = findCol(['DERS', 'DERSADI', 'DERS ADI', 'DERS_ADI']);
      
      // 3. KİTAPÇIK A = Soru Numarası (Sütun C) - 1, 2, 3, 4... diye gider
      const aSoruNoCol = findCol(['KİTAPÇIK A', 'KITAPCIK A', 'KITAPCIK_A', 'A SORU NO', 'SORU NO', 'SORUNO', 'SORU NUMARASI']);
      
      // 4. SORU DEĞERİ (Sütun D) - genelde hep 1
      const soruDegeriCol = findCol(['SORU DEĞERİ', 'SORU DEGERI', 'SORUDEGERI', 'SORU_DEGERI', 'DEGER', 'PUAN']);
      
      // 5. CEVAP = A Kitapçığı Doğru Cevabı (Sütun E) - A, D, B, A... gibi
      const cevapCol = findCol(['CEVAP', 'DOĞRU CEVAP', 'DOGRU CEVAP', 'DOGRUCEVAP', 'YANIT', 'A CEVAP', 'A CEVABI']);
      
      // 6. B KİTAPÇIĞI CEVAP = B Kitapçığı SORU NUMARASI (Sütun F) - 4, 3, 2, 1... gibi sayılar
      // ⚠️ DİKKAT: Bu sütun cevap harfi (A,B,C,D) DEĞİL, soru numarasıdır!
      // Önce pattern-based ara, bulamazsa index-based al (Sütun F = index 5)
      let bSoruNoCol = findCol([
        'B KİTAPÇIĞI CEVAP', 'B KITAPCIGI CEVAP', 'B_KITAPCIGI_CEVAP', 
        'B KİTAPÇIĞI CEVABI', 'B KITAPCIGI CEVABI',
        'B CEVAP', 'B CEVABI', 'B_CEVAP', 'B_CEVABI',
        'KITAPCIK B CEVAP', 'KİTAPÇIK B CEVAP', 'KİTAPÇIK B',
        'B KİT CEV', 'B KIT CEV', 'B CEV', 'BCEVAP', 'BCEVABI',
        'KİTAPÇIK B CEVABI', 'B SORU', 'B SORU NO', 'B SORUNO'
      ]);
      
      // 🔄 FALLBACK: Eğer bulunamadıysa, header'da "B" ve ("CEVAP" veya "KİTAPÇIK" veya "SORU") geçen sütunu bul
      if (bSoruNoCol === -1) {
        for (let i = 0; i < headers.length; i++) {
          const h = normalizeTextLegacy(headers[i]);
          if (h.includes('B') && (h.includes('CEVAP') || h.includes('KITAPCIK') || h.includes('SORU'))) {
            bSoruNoCol = i;
            console.log(`🔍 B Soru No sütunu FALLBACK ile bulundu: ${i} = "${headers[i]}"`);
            break;
          }
        }
      }
      
      // 🔄 SON ÇARE: Eğer hala bulunamadıysa ve en az 6 sütun varsa, index 5'i al (Sütun F)
      if (bSoruNoCol === -1 && headers.length >= 6 && cevapCol === 4) {
        bSoruNoCol = 5;
        console.log(`⚠️ B Soru No sütunu INDEX ile alındı: 5 = "${headers[5]}"`);
      }
      
      // 7-8. C ve D Kitapçıkları (opsiyonel) - Bunlar da soru numarası
      const cSoruNoCol = findCol(['C KİTAPÇIĞI CEVAP', 'C KITAPCIGI CEVAP', 'C CEVAP', 'C CEVABI', 'KİTAPÇIK C', 'C SORU NO']);
      const dSoruNoCol = findCol(['D KİTAPÇIĞI CEVAP', 'D KITAPCIGI CEVAP', 'D CEVAP', 'D CEVABI', 'KİTAPÇIK D', 'D SORU NO']);
      
      // Debug log - hangi sütunlar algılandı?
      console.log('📊 EXCEL SÜTUN ANALİZİ:', {
        'TÜM HEADERS': headers,
        'DERS KODU (Sütun A)': testKoduCol >= 0 ? `✅ ${testKoduCol}: "${headers[testKoduCol]}"` : '❌ YOK',
        'DERS (Sütun B)': dersAdiCol >= 0 ? `✅ ${dersAdiCol}: "${headers[dersAdiCol]}"` : '❌ YOK',
        'KİTAPÇIK A (Sütun C)': aSoruNoCol >= 0 ? `✅ ${aSoruNoCol}: "${headers[aSoruNoCol]}"` : '❌ YOK',
        'SORU DEĞERİ (Sütun D)': soruDegeriCol >= 0 ? `✅ ${soruDegeriCol}: "${headers[soruDegeriCol]}"` : '❌ YOK',
        'CEVAP (Sütun E)': cevapCol >= 0 ? `✅ ${cevapCol}: "${headers[cevapCol]}"` : '❌ YOK',
        'B KİTAPÇIĞI SORU NO (Sütun F)': bSoruNoCol >= 0 ? `✅ ${bSoruNoCol}: "${headers[bSoruNoCol]}"` : '❌ YOK - SORUN!',
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
      // Kitapçık türlerini belirle - SORU NUMARASI sütunlarına göre
      const kitapciklar: string[] = ['A']; // A her zaman var
      if (bSoruNoCol >= 0) kitapciklar.push('B');
      if (cSoruNoCol >= 0) kitapciklar.push('C');
      if (dSoruNoCol >= 0) kitapciklar.push('D');
      
      console.log('📚 Algılanan Kitapçıklar:', kitapciklar.join(', '), '- Kazanım Kodu:', kazanimKoduCol >= 0 ? headers[kazanimKoduCol] : 'YOK');

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

        // ===========================================
        // SORU DEĞERİNİ AL (Sütun D)
        // ===========================================
        let soruDegeri = 1;
        if (soruDegeriCol >= 0 && row[soruDegeriCol] !== undefined && row[soruDegeriCol] !== null) {
          const deger = parseFloat(String(row[soruDegeriCol]));
          if (!isNaN(deger) && deger > 0) {
            soruDegeri = deger;
          }
        }
        
        // ===========================================
        // KİTAPÇIK SORU NUMARALARINI AL
        // ===========================================
        // ⚠️ DİKKAT: Excel'deki "B KİTAPÇIĞI CEVAP" sütunu aslında SORU NUMARASI içerir!
        // Örnek: A kitapçığında 1. soru = B kitapçığında 4. soru
        // Doğru cevap tüm kitapçıklar için aynı: CEVAP sütunundaki harf
        
        // ✅ kitapcikSoruNo objesini OLUŞTUR
        const kitapcikSoruNo: { A?: number; B?: number; C?: number; D?: number } = {
          A: soruNo // A kitapçığı soru numarası her zaman var
        };
        
        // B Kitapçığı SORU NUMARASINI al (Sütun F) - 4, 3, 2, 1... gibi sayılar
        if (bSoruNoCol >= 0 && row[bSoruNoCol] !== undefined && row[bSoruNoCol] !== null) {
          const bSoruNoRaw = parseInt(String(row[bSoruNoCol]).trim(), 10);
          if (!isNaN(bSoruNoRaw) && bSoruNoRaw > 0) {
            kitapcikSoruNo.B = bSoruNoRaw;
          }
        }
        
        // C Kitapçığı SORU NUMARASINI al (varsa)
        if (cSoruNoCol >= 0 && row[cSoruNoCol] !== undefined && row[cSoruNoCol] !== null) {
          const cSoruNoRaw = parseInt(String(row[cSoruNoCol]).trim(), 10);
          if (!isNaN(cSoruNoRaw) && cSoruNoRaw > 0) {
            kitapcikSoruNo.C = cSoruNoRaw;
          }
        }
        
        // D Kitapçığı SORU NUMARASINI al (varsa)
        if (dSoruNoCol >= 0 && row[dSoruNoCol] !== undefined && row[dSoruNoCol] !== null) {
          const dSoruNoRaw = parseInt(String(row[dSoruNoCol]).trim(), 10);
          if (!isNaN(dSoruNoRaw) && dSoruNoRaw > 0) {
            kitapcikSoruNo.D = dSoruNoRaw;
          }
        }
        
        // Tüm kitapçıklar için AYNI doğru cevap kullanılır
        const kitapcikCevaplari: { 
          A?: 'A' | 'B' | 'C' | 'D' | 'E'; 
          B?: 'A' | 'B' | 'C' | 'D' | 'E'; 
          C?: 'A' | 'B' | 'C' | 'D' | 'E'; 
          D?: 'A' | 'B' | 'C' | 'D' | 'E'; 
        } = {
          A: cevap as 'A' | 'B' | 'C' | 'D' | 'E'
        };
        // B, C, D kitapçıkları için de AYNI cevap geçerli
        if (kitapcikSoruNo.B) kitapcikCevaplari.B = cevap as 'A' | 'B' | 'C' | 'D' | 'E';
        if (kitapcikSoruNo.C) kitapcikCevaplari.C = cevap as 'A' | 'B' | 'C' | 'D' | 'E';
        if (kitapcikSoruNo.D) kitapcikCevaplari.D = cevap as 'A' | 'B' | 'C' | 'D' | 'E';
        
        // Debug: İlk 3 satır için detaylı log
        if (i <= 3) {
          console.log(`📝 Satır ${i}:`, {
            'A Kitapçık Soru No': soruNo,
            'B Kitapçık Soru No': kitapcikSoruNo.B || 'YOK',
            'Doğru Cevap (Tümü için)': cevap,
            'Soru Değeri': soruDegeri
          });
        }
        
        // Kazanım bilgilerini al
        const kazanimKodu = kazanimKoduCol >= 0 ? String(row[kazanimKoduCol] || '').trim() : '';
        const kazanimMetni = kazanimMetniCol >= 0 ? String(row[kazanimMetniCol] || '').trim() : '';

        // ✅ KİTAPÇIK CEVAPLARINI HER ZAMAN KAYDET
        // A cevabı her zaman var, B/C/D varsa onlar da eklenir
        parsed.push({
          soruNo,
          dogruCevap: cevap as 'A' | 'B' | 'C' | 'D' | 'E',
          dersKodu: currentDers,
          dersAdi: currentDersAdi || getDersTamAdi(currentDers),
          testKodu: currentTestKodu || '', // ✅ Her zaman kaydet (boş string olsa bile)
          soruDegeri: soruDegeri, // ✅ Her zaman kaydet (1 olsa bile)
          kazanimKodu: kazanimKodu || undefined,
          kazanimMetni: kazanimMetni || undefined,
          kitapcikSoruNo: Object.keys(kitapcikSoruNo).length > 0 ? kitapcikSoruNo : undefined,
          // ✅ kitapcikCevaplari HER ZAMAN kaydedilsin (A her zaman var)
          kitapcikCevaplari: kitapcikCevaplari,
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

  // Ders sıralaması (LGS sırasına göre) - 6 ders: TUR, INK, DIN, ING, MAT, FEN
  const dersSirasi = ['TUR', 'INK', 'DIN', 'ING', 'MAT', 'FEN', 'SOS', 'TAR', 'COG', 'FIZ', 'KIM', 'BIO'];
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
                  
                  {/* Algılanan Sütunlar - Türkçe Anlaşılır İsimlerle */}
                  <div className="mb-3">
                    <p className="text-emerald-700 mb-1.5 font-medium text-xs">✅ Algılanan Sütunlar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(detectionResult.columns).map(([key, match]) => {
                        // Key'leri Türkçe anlaşılır isimlere çevir
                        const turkceIsim: Record<string, string> = {
                          'TEST_KODU': 'Ders Kodu',
                          'DERS': 'Ders Adı',
                          'KITAPCIK_A': 'Kitapçık A',
                          'SORU_DEGERI': 'Soru Değeri',
                          'DOGRU_CEVAP': 'Cevap',
                          'B_CEVAP': 'B Kit. Cevabı',
                          'C_CEVAP': 'C Kit. Cevabı',
                          'D_CEVAP': 'D Kit. Cevabı',
                          'KAZANIM_KODU': 'Kazanım Kodu',
                          'KAZANIM_METNI': 'Kazanım Metni',
                        };
                        const displayName = turkceIsim[key] || key;
                        
                        return (
                          <span 
                            key={key} 
                            className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                              match.confidence >= 80 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <span className="font-medium">{match.fileColumn}</span>
                            <span className="opacity-60">→</span>
                            <span className="font-semibold">{displayName}</span>
                            {match.confidence < 80 && <span className="text-[10px] opacity-70">({match.confidence}%)</span>}
                          </span>
                        );
                      })}
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
                      { code: 'B_SORU_NO', display: 'B Soru No' },
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
                                  {/* ✅ DERS KODU - Her zaman göster */}
                                  <th className="px-2 py-2 text-center font-semibold text-violet-600 w-12">Ders Kodu</th>
                                  {/* ✅ Ders Adı - Her zaman göster */}
                                  <th className="px-2 py-2 text-left font-semibold text-blue-600 w-32">Ders Adı</th>
                                  {/* ✅ Kitapçık A (Soru No) - Her zaman göster */}
                                  <th className="px-2 py-2 text-center font-semibold text-slate-600 w-14">Kitapçık A</th>
                                  {/* ✅ Soru Değeri - Her zaman göster */}
                                  <th className="px-2 py-2 text-center font-semibold text-slate-500 w-12">Soru Değeri</th>
                                  {/* ✅ A Kitapçığı Cevabı (Doğru Cevap) */}
                                  <th className="px-2 py-2 text-center font-semibold text-emerald-600 w-12">Cevap</th>
                                  {/* ✅ B Kitapçığı Soru Numarası - Her zaman göster */}
                                  <th className="px-2 py-2 text-center font-semibold text-amber-600 w-14">B Soru</th>
                                  {/* C Kitapçığı Soru No - Varsa göster */}
                                  {parsedData.some(p => p.kitapcikSoruNo?.C) && (
                                    <th className="px-2 py-2 text-center font-semibold text-orange-600 w-12">C Soru</th>
                                  )}
                                  {/* D Kitapçığı Soru No - Varsa göster */}
                                  {parsedData.some(p => p.kitapcikSoruNo?.D) && (
                                    <th className="px-2 py-2 text-center font-semibold text-red-600 w-12">D Soru</th>
                                  )}
                                  {/* ✅ Kazanım Kodu - Her zaman göster */}
                                  <th className="px-2 py-2 text-left font-semibold text-purple-600 w-24">Kazanım Kodu</th>
                                  {/* ✅ Kazanım Metni - Her zaman göster */}
                                  <th className="px-3 py-2 text-left font-semibold text-teal-600">Kazanım Metni</th>
                                  <th className="px-2 py-2 text-center font-semibold text-slate-600 w-14">İşlem</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sorular.map((row, idx) => {
                                  const globalIndex = parsedData.findIndex(p => p === row);
                                  const isEditing = editingIndex === globalIndex;
                                  
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50 group">
                                      {/* ✅ DERS KODU - Her zaman göster */}
                                      <td className="px-2 py-2 text-center">
                                        <span className="text-xs font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                          {row.testKodu || '-'}
                                        </span>
                                      </td>
                                      {/* ✅ Ders Adı - Her zaman göster */}
                                      <td className="px-2 py-2 text-left">
                                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                          {row.dersAdi || getDersTamAdi(row.dersKodu)}
                                        </span>
                                      </td>
                                      {/* ✅ Kitapçık A (Soru No) - Her zaman göster */}
                                      <td className="px-2 py-2 text-center">
                                        <span className="font-bold text-slate-800">{row.soruNo}</span>
                                      </td>
                                      {/* ✅ Soru Değeri - Her zaman göster */}
                                      <td className="px-2 py-2 text-center text-slate-600 text-sm font-medium">
                                        {row.soruDegeri || 1}
                                      </td>
                                      {/* ✅ A Kitapçığı Cevabı (Doğru Cevap) */}
                                      <td className="px-2 py-2 text-center">
                                        <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm">
                                          {row.kitapcikCevaplari?.A || row.dogruCevap}
                                        </span>
                                      </td>
                                      {/* ✅ B Kitapçığı Soru Numarası - Her zaman göster */}
                                      <td className="px-2 py-2 text-center">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm ${
                                          row.kitapcikSoruNo?.B 
                                            ? 'bg-amber-100 text-amber-700' 
                                            : 'bg-slate-100 text-slate-400'
                                        }`}>
                                          {row.kitapcikSoruNo?.B || '-'}
                                        </span>
                                      </td>
                                      {/* C Kitapçığı Soru No - Varsa göster */}
                                      {parsedData.some(p => p.kitapcikSoruNo?.C) && (
                                        <td className="px-2 py-2 text-center">
                                          <span className="inline-flex items-center justify-center w-7 h-7 bg-orange-100 text-orange-700 rounded-lg font-bold text-sm">
                                            {row.kitapcikSoruNo?.C || '-'}
                                          </span>
                                        </td>
                                      )}
                                      {/* D Kitapçığı Soru No - Varsa göster */}
                                      {parsedData.some(p => p.kitapcikSoruNo?.D) && (
                                        <td className="px-2 py-2 text-center">
                                          <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-red-700 rounded-lg font-bold text-sm">
                                            {row.kitapcikSoruNo?.D || '-'}
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
