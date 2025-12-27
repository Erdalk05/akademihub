'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Save,
  Upload,
  Eye,
  Trash2,
  Plus,
  Check,
  X,
  FileText,
  Layers,
  ArrowRight,
  Grid3X3,
  Ruler,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  MousePointer2,
  Type,
  Hash,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { OptikAlanTanimi, OptikSablon, CevapAnahtariSatir, DERS_ISIMLERI, OZEL_ALAN_ONERILERI } from './types';

interface OptikSablonEditorProps {
  onSave?: (sablon: Omit<OptikSablon, 'id'>) => void;
  onLoad?: () => Promise<OptikSablon[]>;
  initialSablon?: OptikSablon;
  sampleData?: string;
  cevapAnahtari?: CevapAnahtariSatir[]; // Cevap anahtarından yapı al
}

// ZORUNLU ALANLAR - Her zaman görünür
const ZORUNLU_ALANLAR = [
  { id: 'ogrenci_no', label: 'Öğrenci Numarası', icon: '🔢', color: '#F59E0B' },
  { id: 'ogrenci_adi', label: 'Öğrenci Adı Soyadı', icon: '👤', color: '#10B981' },
  { id: 'cevaplar', label: 'Cevaplar', icon: '✅', color: '#25D366' },
];

// OPSİYONEL ALANLAR - İsteğe bağlı
const OPSIYONEL_ALANLAR = [
  { id: 'tc', label: 'TC Kimlik No', icon: '🆔', color: '#3B82F6' },
  { id: 'sinif', label: 'Sınıf/Şube', icon: '🏫', color: '#8B5CF6' },
  { id: 'kitapcik', label: 'Kitapçık Türü', icon: '📖', color: '#EC4899' },
  { id: 'cinsiyet', label: 'Cinsiyet', icon: '⚤', color: '#06B6D4' },
  { id: 'kurum_kodu', label: 'Kurum Kodu', icon: '🏛️', color: '#84CC16' },
  { id: 'cep_telefonu', label: 'Cep Telefonu', icon: '📱', color: '#F97316' },
];

// Tüm alan tipleri (eski uyumluluk için)
const ALAN_TIPLERI = [
  ...ZORUNLU_ALANLAR,
  ...OPSIYONEL_ALANLAR,
  { id: 'bos', label: 'Boş/Atla', icon: '⬜', color: '#9CA3AF' },
].map((a, i) => ({ ...a, shortcut: String(i + 1) }));

export default function OptikSablonEditor({
  onSave,
  onLoad,
  initialSablon,
  sampleData,
  cevapAnahtari = []
}: OptikSablonEditorProps) {
  // States
  const [sablonAdi, setSablonAdi] = useState(initialSablon?.sablonAdi || '');
  const [alanlar, setAlanlar] = useState<OptikAlanTanimi[]>(initialSablon?.alanTanimlari || []);
  const [toplamSoru, setToplamSoru] = useState(initialSablon?.toplamSoru || cevapAnahtari.length || 90);
  const [ornekSatir, setOrnekSatir] = useState(sampleData || '');
  
  // Seçim states
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [activeAlanTipi, setActiveAlanTipi] = useState<string | null>(null);
  
  // İki tıklama modu
  const [clickMode, setClickMode] = useState<'first' | 'second'>('first');
  
  // UI states
  const [inputMode, setInputMode] = useState<'visual' | 'manual' | 'auto'>('visual');
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // Otomatik bölünmüş alanlar
  const [autoSegments, setAutoSegments] = useState<{start: number, end: number, text: string}[]>([]);
  
  // Özel alan ekleme
  const [showOzelAlanModal, setShowOzelAlanModal] = useState(false);
  const [ozelAlanAdi, setOzelAlanAdi] = useState('');
  const [ozelAlanBaslangic, setOzelAlanBaslangic] = useState(0);
  const [ozelAlanBitis, setOzelAlanBitis] = useState(0);
  const [ozelAlanlar, setOzelAlanlar] = useState<{id: string, label: string, icon: string, color: string}[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cevap anahtarından bilgi al - EXCEL DİZİLİŞ SIRASINA GÖRE
  const cevapAnahtariInfo = useMemo(() => {
    if (!cevapAnahtari.length) return null;
    
    // Excel sırasına göre dersleri al (ilk görülme sırasını koru)
    const derslerSirada: string[] = [];
    cevapAnahtari.forEach(c => {
      if (!derslerSirada.includes(c.dersKodu)) {
        derslerSirada.push(c.dersKodu);
      }
    });
    
    // Her ders için başlangıç ve bitiş soru numaralarını hesapla
    const dersBazliSayilar = derslerSirada.map(d => {
      const dersSorulari = cevapAnahtari.filter(c => c.dersKodu === d);
      const ilkSoruNo = dersSorulari[0]?.soruNo || 0;
      const sonSoruNo = dersSorulari[dersSorulari.length - 1]?.soruNo || 0;
      
      return {
        dersKodu: d,
        dersAdi: DERS_ISIMLERI[d] || d,
        soruSayisi: dersSorulari.length,
        baslangicSoruNo: ilkSoruNo,
        bitisSoruNo: sonSoruNo
      };
    });
    
    return {
      toplamSoru: cevapAnahtari.length,
      dersSayisi: derslerSirada.length,
      dersBazliSayilar
    };
  }, [cevapAnahtari]);

  // Toplam soru sayısını cevap anahtarından güncelle
  useEffect(() => {
    if (cevapAnahtariInfo) {
      setToplamSoru(cevapAnahtariInfo.toplamSoru);
    }
  }, [cevapAnahtariInfo]);

  // Seçim aralığı
  const selectedRange = useMemo(() => {
    if (selectionStart === null) return null;
    const end = selectionEnd ?? selectionStart;
    return {
      start: Math.min(selectionStart, end),
      end: Math.max(selectionStart, end)
    };
  }, [selectionStart, selectionEnd]);

  // İKİ TIKLAMA SİSTEMİ - Sürükleme yok!
  const handleCharClick = useCallback((index: number) => {
    if (!activeAlanTipi) return;
    
    if (clickMode === 'first') {
      // İlk tıklama - başlangıç pozisyonu
      setSelectionStart(index);
      setSelectionEnd(index);
      setClickMode('second');
    } else {
      // İkinci tıklama - bitiş pozisyonu
      setSelectionEnd(index);
      setClickMode('first');
    }
  }, [activeAlanTipi, clickMode]);

  // Eski sürükleme sistemi (yedek olarak)
  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    if (!activeAlanTipi) return;
    // Shift ile hızlı seçim
    if (e.shiftKey && selectionStart !== null) {
      setSelectionEnd(index);
      return;
    }
    handleCharClick(index);
  }, [activeAlanTipi, selectionStart, handleCharClick]);

  const handleMouseMove = useCallback((index: number) => {
    if (isSelecting && selectionStart !== null) {
      setSelectionEnd(index);
    }
  }, [isSelecting, selectionStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isSelecting) {
      setIsSelecting(false);
    }
  }, [isSelecting]);

  // Seçimi temizle
  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setActiveAlanTipi(null);
    setClickMode('first');
  }, []);

  // Örnek satırı otomatik bölme (boşluklara göre)
  const analyzeAndSplit = useCallback(() => {
    if (!ornekSatir) return;
    
    const segments: {start: number, end: number, text: string}[] = [];
    let inWord = false;
    let wordStart = 0;
    
    for (let i = 0; i < ornekSatir.length; i++) {
      const char = ornekSatir[i];
      const isSpace = char === ' ';
      
      if (!isSpace && !inWord) {
        // Yeni kelime başladı
        inWord = true;
        wordStart = i;
      } else if (isSpace && inWord) {
        // Kelime bitti
        inWord = false;
        const text = ornekSatir.substring(wordStart, i).trim();
        if (text.length > 0) {
          segments.push({
            start: wordStart + 1, // 1-indexed
            end: i,
            text
          });
        }
      }
    }
    
    // Son kelime
    if (inWord) {
      const text = ornekSatir.substring(wordStart).trim();
      if (text.length > 0) {
        segments.push({
          start: wordStart + 1,
          end: ornekSatir.length,
          text
        });
      }
    }
    
    // Ardışık boşluk bloklarını birleştir
    const mergedSegments: typeof segments = [];
    let currentSegment: typeof segments[0] | null = null;
    
    segments.forEach((seg, i) => {
      if (!currentSegment) {
        currentSegment = { ...seg };
      } else if (seg.start - currentSegment.end <= 3) {
        // 3 karakterden az boşluk varsa birleştir
        currentSegment.end = seg.end;
        currentSegment.text += ' ' + seg.text;
      } else {
        mergedSegments.push(currentSegment);
        currentSegment = { ...seg };
      }
    });
    
    if (currentSegment) {
      mergedSegments.push(currentSegment);
    }
    
    setAutoSegments(mergedSegments);
  }, [ornekSatir]);

  // Örnek satır değiştiğinde otomatik analiz
  useEffect(() => {
    if (ornekSatir) {
      analyzeAndSplit();
    }
  }, [ornekSatir, analyzeAndSplit]);

  // Segment'i alan olarak ekle
  const addSegmentAsField = useCallback((segment: {start: number, end: number}, tipId: string) => {
    const alanTipi = ALAN_TIPLERI.find(t => t.id === tipId);
    if (!alanTipi) return;

    const yeniAlan: OptikAlanTanimi = {
      alan: tipId as any,
      baslangic: segment.start,
      bitis: segment.end,
      label: alanTipi.label,
      color: alanTipi.color
    };

    setAlanlar(prev => {
      const filtered = prev.filter(a => a.alan !== tipId);
      return [...filtered, yeniAlan].sort((a, b) => a.baslangic - b.baslangic);
    });
  }, []);

  // Seçimi alan olarak ekle
  const addSelectedAsField = useCallback(() => {
    if (!selectedRange || !activeAlanTipi) return;

    let yeniAlan: OptikAlanTanimi;

    // Özel alan mı kontrol et
    if (activeAlanTipi.startsWith('ozel_')) {
      const ozelId = activeAlanTipi.replace('ozel_', '');
      const ozelAlan = ozelAlanlar.find(o => o.id === ozelId);
      
      if (!ozelAlan) {
        console.error('Özel alan bulunamadı:', ozelId);
        return;
      }

      yeniAlan = {
        alan: 'ozel' as any,
        baslangic: selectedRange.start + 1, // 1-indexed
        bitis: selectedRange.end + 1,
        label: ozelAlan.label,
        color: ozelAlan.color,
        customLabel: ozelAlan.label // Özel alan için customLabel
      };
    } else {
      // Standart alan
      const alanTipi = ALAN_TIPLERI.find(t => t.id === activeAlanTipi);
      if (!alanTipi) return;

      yeniAlan = {
        alan: activeAlanTipi as any,
        baslangic: selectedRange.start + 1, // 1-indexed
        bitis: selectedRange.end + 1,
        label: alanTipi.label,
        color: alanTipi.color
      };
    }

    // Örtüşen alanları kontrol et ve kaldır
    setAlanlar(prev => {
      const filtered = prev.filter(a => 
        !(yeniAlan.baslangic <= a.bitis && yeniAlan.bitis >= a.baslangic)
      );
      return [...filtered, yeniAlan].sort((a, b) => a.baslangic - b.baslangic);
    });

    // Seçimi temizle
    setSelectionStart(null);
    setSelectionEnd(null);
    setActiveAlanTipi(null);
    setClickMode('first'); // Tıklama modunu sıfırla
  }, [selectedRange, activeAlanTipi, ozelAlanlar]);

  // Manuel alan ekleme
  const addManualField = useCallback((tipId: string, baslangic: number, bitis: number) => {
    const alanTipi = ALAN_TIPLERI.find(t => t.id === tipId);
    if (!alanTipi || baslangic > bitis || baslangic < 1) return;

    const yeniAlan: OptikAlanTanimi = {
      alan: tipId as any,
      baslangic,
      bitis,
      label: alanTipi.label,
      color: alanTipi.color
    };

    setAlanlar(prev => {
      const filtered = prev.filter(a => a.alan !== tipId);
      return [...filtered, yeniAlan].sort((a, b) => a.baslangic - b.baslangic);
    });
  }, []);

  // Alan sil
  const removeField = useCallback((index: number) => {
    setAlanlar(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Karakter hangi alanda?
  const getCharField = useCallback((charIndex: number): OptikAlanTanimi | null => {
    const pos = charIndex + 1; // 1-indexed
    return alanlar.find(a => pos >= a.baslangic && pos <= a.bitis) || null;
  }, [alanlar]);

  // Karakter seçili mi?
  const isCharSelected = useCallback((charIndex: number): boolean => {
    if (!selectedRange) return false;
    return charIndex >= selectedRange.start && charIndex <= selectedRange.end;
  }, [selectedRange]);

  // Kayıt durumu
  const [isSaved, setIsSaved] = useState(false);

  // Şablonu kaydet
  const handleSave = () => {
    if (!sablonAdi.trim()) {
      alert('❌ Lütfen şablon adı girin');
      return;
    }
    if (alanlar.length === 0) {
      alert('❌ En az bir alan tanımlamalısınız');
      return;
    }

    const cevaplarAlani = alanlar.find(a => a.alan === 'cevaplar');
    
    // Cevaplar alanı zorunlu!
    if (!cevaplarAlani) {
      alert('❌ CEVAPLAR alanı zorunludur!\n\nLütfen optik verideki cevap bölümünü (53-173 arası gibi) "Cevaplar" olarak tanımlayın.');
      return;
    }

    const sablon: Omit<OptikSablon, 'id'> = {
      sablonAdi,
      alanTanimlari: alanlar,
      cevapBaslangic: cevaplarAlani.baslangic,
      toplamSoru,
      isDefault: false,
      isActive: true
    };

    console.log('✅ Şablon kaydediliyor:', sablon);
    onSave?.(sablon);
    setIsSaved(true);
    
    // 1 saniye sonra kayıt mesajını gizle
    setTimeout(() => setIsSaved(false), 2000);
  };

  // İstatistikler
  const stats = useMemo(() => {
    const totalChars = ornekSatir.length;
    const mappedChars = alanlar.reduce((sum, a) => sum + (a.bitis - a.baslangic + 1), 0);
    return {
      totalChars,
      mappedChars,
      unmappedChars: totalChars - mappedChars,
      fieldCount: alanlar.length
    };
  }, [ornekSatir, alanlar]);

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Sayı tuşları ile alan tipi seçimi
      const alanTipi = ALAN_TIPLERI.find(t => t.shortcut === key);
      if (alanTipi && ornekSatir) {
        e.preventDefault();
        setActiveAlanTipi(alanTipi.id);
      }
      
      // ESC ile seçimi temizle
      if (key === 'Escape') {
        e.preventDefault();
        clearSelection();
      }
      
      // Enter ile seçimi onayla
      if (key === 'Enter' && selectedRange && activeAlanTipi) {
        e.preventDefault();
        addSelectedAsField();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ornekSatir, selectedRange, activeAlanTipi, addSelectedAsField, clearSelection]);

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp} onMouseLeave={() => setIsSelecting(false)}>
      {/* Başlık ve Modlar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Grid3X3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Optik Şablon Editörü</h2>
            <p className="text-sm text-slate-500">Karakterleri seçerek alan tanımlayın</p>
          </div>
        </div>
        
        {/* Mod Seçici */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'visual', label: 'Görsel Seçim', icon: MousePointer2 },
            { id: 'manual', label: 'Manuel Giriş', icon: Type },
            { id: 'auto', label: 'Otomatik', icon: Sparkles },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setInputMode(mode.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === mode.id
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <mode.icon size={16} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cevap Anahtarı Bilgisi */}
      {cevapAnahtariInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">Cevap Anahtarı Algılandı</p>
                <p className="text-sm text-emerald-600">
                  {cevapAnahtariInfo.toplamSoru} soru, {cevapAnahtariInfo.dersSayisi} ders
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {cevapAnahtariInfo.dersBazliSayilar.map((d, idx) => (
                <span key={d.dersKodu} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                  <span className="font-bold">{idx + 1}.</span>
                  {d.dersAdi}: {d.soruSayisi}
                  <span className="text-emerald-500">({d.baslangicSoruNo}-{d.bitisSoruNo})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Şablon Adı ve Soru Sayısı */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Şablon Adı</label>
          <input
            type="text"
            value={sablonAdi}
            onChange={(e) => setSablonAdi(e.target.value)}
            placeholder="Örn: LGS 90 Soru Şablonu"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Toplam Soru Sayısı</label>
          <input
            type="number"
            value={toplamSoru}
            onChange={(e) => setToplamSoru(parseInt(e.target.value) || 90)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            min={1}
          />
        </div>
      </div>

      {/* Örnek Satır Girişi */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Örnek Optik Satırı <span className="text-slate-400">(TXT dosyasından bir satır yapıştırın)</span>
        </label>
        <textarea
          value={ornekSatir}
          onChange={(e) => {
            const firstLine = e.target.value.split('\n')[0] || '';
            setOrnekSatir(firstLine);
          }}
          placeholder="Optik okuyucudan gelen örnek bir satırı buraya yapıştırın..."
          className="w-full h-20 px-4 py-3 font-mono text-sm border-2 border-dashed border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-slate-500">
          Toplam: <strong>{ornekSatir.length}</strong> karakter
        </p>
      </div>

      {/* GÖRSEL SEÇİM MODU */}
      {inputMode === 'visual' && !ornekSatir && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-800 mb-2">Örnek Optik Satırı Yapıştırın</h3>
          <p className="text-sm text-amber-600">
            Görsel seçim modunu kullanmak için yukarıdaki alana optik okuyucudan gelen bir satır yapıştırın.
          </p>
        </div>
      )}
      {inputMode === 'visual' && ornekSatir && (
        <div className="space-y-4">
          {/* HIZLI ALAN TANIMLAMA - 3 SÜTUN */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              ⚡ Hızlı Alan Tanımlama (Sayı Girin)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[...ZORUNLU_ALANLAR, ...OPSIYONEL_ALANLAR].map((tip) => {
                const existingField = alanlar.find(a => a.alan === tip.id);
                const isZorunlu = ZORUNLU_ALANLAR.some(z => z.id === tip.id);
                return (
                  <div 
                    key={tip.id} 
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border"
                    style={{ borderColor: existingField ? '#10B981' : (isZorunlu ? '#fca5a5' : '#e2e8f0') }}
                  >
                    <span className="text-lg">{tip.icon}</span>
                    <span className="text-xs font-medium text-slate-700 w-20 truncate">{tip.label}</span>
                    <input
                      id={`start-${tip.id}`}
                      type="number"
                      min="1"
                      max="999"
                      placeholder="Baş"
                      defaultValue={existingField?.baslangic || ''}
                      className="w-12 px-1 py-1 text-xs text-center font-mono border rounded focus:border-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onChange={(e) => {
                        const start = parseInt(e.target.value) || 0;
                        const endInput = document.getElementById(`end-${tip.id}`) as HTMLInputElement;
                        const end = parseInt(endInput?.value) || start;
                        if (start > 0) {
                          setAlanlar(prev => {
                            const filtered = prev.filter(a => a.alan !== tip.id);
                            return [...filtered, { alan: tip.id as any, baslangic: start, bitis: end > 0 ? end : start, label: tip.label, color: tip.color }].sort((a, b) => a.baslangic - b.baslangic);
                          });
                        }
                      }}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      id={`end-${tip.id}`}
                      type="number"
                      min="1"
                      max="999"
                      placeholder="Bit"
                      defaultValue={existingField?.bitis || ''}
                      className="w-12 px-1 py-1 text-xs text-center font-mono border rounded focus:border-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onChange={(e) => {
                        const end = parseInt(e.target.value) || 0;
                        const startInput = document.getElementById(`start-${tip.id}`) as HTMLInputElement;
                        const start = parseInt(startInput?.value) || 0;
                        if (start > 0 && end >= start) {
                          setAlanlar(prev => {
                            const filtered = prev.filter(a => a.alan !== tip.id);
                            return [...filtered, { alan: tip.id as any, baslangic: start, bitis: end, label: tip.label, color: tip.color }].sort((a, b) => a.baslangic - b.baslangic);
                          });
                        }
                      }}
                    />
                    {existingField && (
                      <button
                        onClick={() => setAlanlar(prev => prev.filter(a => a.alan !== tip.id))}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                        title="Sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
              
              {/* ÖZEL ALANLAR - Aynı grid içinde */}
              {ozelAlanlar.map((tip) => {
                const existingField = alanlar.find(a => a.customLabel === tip.label);
                return (
                  <div 
                    key={tip.id} 
                    className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <span className="text-lg">{tip.icon}</span>
                    <span className="text-xs font-medium text-purple-700 w-20 truncate">{tip.label}</span>
                    <input
                      id={`start-ozel-${tip.id}`}
                      type="number"
                      min="1"
                      max="999"
                      placeholder="Baş"
                      defaultValue={existingField?.baslangic || ''}
                      className="w-12 px-1 py-1 text-xs text-center font-mono border border-purple-300 rounded focus:border-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onChange={(e) => {
                        const start = parseInt(e.target.value) || 0;
                        const endInput = document.getElementById(`end-ozel-${tip.id}`) as HTMLInputElement;
                        const end = parseInt(endInput?.value) || start;
                        if (start > 0) {
                          setAlanlar(prev => {
                            const filtered = prev.filter(a => a.customLabel !== tip.label);
                            return [...filtered, { alan: 'ozel' as any, baslangic: start, bitis: end > 0 ? end : start, label: tip.label, color: tip.color, customLabel: tip.label }].sort((a, b) => a.baslangic - b.baslangic);
                          });
                        }
                      }}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      id={`end-ozel-${tip.id}`}
                      type="number"
                      min="1"
                      max="999"
                      placeholder="Bit"
                      defaultValue={existingField?.bitis || ''}
                      className="w-12 px-1 py-1 text-xs text-center font-mono border border-purple-300 rounded focus:border-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onChange={(e) => {
                        const end = parseInt(e.target.value) || 0;
                        const startInput = document.getElementById(`start-ozel-${tip.id}`) as HTMLInputElement;
                        const start = parseInt(startInput?.value) || 0;
                        if (start > 0 && end >= start) {
                          setAlanlar(prev => {
                            const filtered = prev.filter(a => a.customLabel !== tip.label);
                            return [...filtered, { alan: 'ozel' as any, baslangic: start, bitis: end, label: tip.label, color: tip.color, customLabel: tip.label }].sort((a, b) => a.baslangic - b.baslangic);
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        setOzelAlanlar(prev => prev.filter(a => a.id !== tip.id));
                        setAlanlar(prev => prev.filter(a => a.customLabel !== tip.label));
                      }}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
              
              {/* + ÖZEL ALAN EKLE BUTONU - Grid içinde */}
              <div 
                onClick={() => setShowOzelAlanModal(true)}
                className="flex items-center justify-center gap-2 p-2 bg-white rounded-lg border-2 border-dashed border-indigo-300 cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all"
              >
                <Plus size={16} className="text-indigo-600" />
                <span className="text-xs font-medium text-indigo-600">Özel Alan Ekle</span>
              </div>
            </div>
            
            {/* BİLGİ */}
            <p className="text-xs text-emerald-600 mt-2">
              💡 Başlangıç ve bitiş numaralarını girin, Tab ile geçin. Otomatik kaydedilir.
            </p>
          </div>
          
          {/* Karakter Haritası - TEK SATIR YATAY */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Karakter Haritası</span>
                {selectedRange && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Seçili: {selectedRange.start + 1} - {selectedRange.end + 1} ({selectedRange.end - selectedRange.start + 1} karakter)
                  </span>
                )}
              </div>
              {activeAlanTipi && (
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  clickMode === 'first' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {clickMode === 'first' 
                    ? '🎯 1. Başlangıç için tıklayın' 
                    : '🏁 2. Bitiş için tıklayın (veya Shift+tıklama)'}
                </span>
              )}
            </div>
            
            {/* Cetvel */}
            <div 
              className="overflow-x-auto"
              style={{ cursor: activeAlanTipi ? 'crosshair' : 'default' }}
            >
              {/* Numara cetveli */}
              <div className="flex border-b border-slate-100 bg-slate-50 min-w-max">
                {Array.from({ length: ornekSatir.length }, (_, i) => (
                  <div
                    key={i}
                    className="w-7 h-5 flex-shrink-0 text-center text-[10px] text-slate-400"
                  >
                    {(i + 1) % 10 === 0 ? (i + 1) : ((i + 1) % 5 === 0 ? '·' : '')}
                  </div>
                ))}
              </div>
              
              {/* Karakterler - TEK SATIR */}
              <div 
                ref={containerRef}
                className="flex min-w-max p-2 select-none"
              >
                {Array.from(ornekSatir).map((char, i) => {
                  const field = getCharField(i);
                  const isSelected = isCharSelected(i);
                  
                  return (
                    <div
                      key={i}
                      onMouseDown={(e) => handleMouseDown(i, e)}
                      onMouseEnter={() => handleMouseMove(i)}
                      className={`w-7 h-9 flex items-center justify-center font-mono text-sm rounded transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110 z-10'
                          : field
                            ? 'text-white'
                            : activeAlanTipi
                              ? 'hover:bg-slate-200 cursor-crosshair'
                              : 'hover:bg-slate-100'
                      }`}
                      style={{
                        backgroundColor: isSelected ? undefined : (field?.color || undefined),
                      }}
                      title={`${i + 1}: "${char}" ${field ? `(${field.label})` : ''}`}
                    >
                      {char === ' ' ? '·' : char}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Seçim Onay Butonu */}
            {selectedRange && activeAlanTipi && (
              <div className="p-3 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.icon}</span>
                  <div>
                    <p className="font-medium text-blue-800">
                      {activeAlanTipi?.startsWith('ozel_') 
                        ? ozelAlanlar.find(o => o.id === activeAlanTipi?.replace('ozel_', ''))?.label || 'Özel Alan'
                        : ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.label}
                    </p>
                    <p className="text-sm text-blue-600">
                      Karakter {selectedRange.start + 1} - {selectedRange.end + 1} 
                      <span className="ml-2 font-mono bg-blue-100 px-2 py-0.5 rounded">
                        "{ornekSatir.substring(selectedRange.start, selectedRange.end + 1)}"
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    İptal (ESC)
                  </button>
                  <button
                    onClick={addSelectedAsField}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <Plus size={18} />
                    Bu Alanı Ekle (Enter)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANUEL GİRİŞ MODU */}
      {inputMode === 'manual' && !ornekSatir && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Type className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-800 mb-2">Örnek Optik Satırı Yapıştırın</h3>
          <p className="text-sm text-amber-600">
            Manuel giriş modunu kullanmak için yukarıdaki alana optik okuyucudan gelen bir satır yapıştırın.
          </p>
        </div>
      )}
      {inputMode === 'manual' && ornekSatir && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Type size={18} />
            Manuel Alan Tanımlama
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {ALAN_TIPLERI.filter(t => t.id !== 'bos').map((tip) => {
              const existingField = alanlar.find(a => a.alan === tip.id);
              return (
                <div 
                  key={tip.id} 
                  className="p-3 rounded-xl border"
                  style={{ 
                    backgroundColor: existingField ? `${tip.color}10` : undefined,
                    borderColor: existingField ? tip.color : '#e2e8f0'
                  }}
                >
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: tip.color }}>
                    <span className="text-lg">{tip.icon}</span>
                    {tip.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Başlangıç"
                      min={1}
                      max={ornekSatir.length}
                      defaultValue={existingField?.baslangic || ''}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2"
                      id={`manual-start-${tip.id}`}
                    />
                    <span className="text-slate-400 self-center">—</span>
                    <input
                      type="number"
                      placeholder="Bitiş"
                      min={1}
                      max={ornekSatir.length}
                      defaultValue={existingField?.bitis || ''}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2"
                      id={`manual-end-${tip.id}`}
                    />
                    <button
                      onClick={() => {
                        const startEl = document.getElementById(`manual-start-${tip.id}`) as HTMLInputElement;
                        const endEl = document.getElementById(`manual-end-${tip.id}`) as HTMLInputElement;
                        const start = parseInt(startEl?.value);
                        const end = parseInt(endEl?.value);
                        if (start && end) {
                          addManualField(tip.id, start, end);
                        }
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                  {existingField && (
                    <p className="text-xs mt-2 font-mono truncate" style={{ color: tip.color }}>
                      "{ornekSatir.substring(existingField.baslangic - 1, existingField.bitis)}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OTOMATİK MOD - Akıllı Bölme */}
      {inputMode === 'auto' && !ornekSatir && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
          <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h3 className="font-semibold text-purple-800 mb-2">Örnek Optik Satırı Yapıştırın</h3>
          <p className="text-sm text-purple-600">
            Otomatik modu kullanmak için yukarıdaki alana optik okuyucudan gelen bir satır yapıştırın.
          </p>
        </div>
      )}
      {inputMode === 'auto' && ornekSatir && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-purple-700 flex items-center gap-2">
              <Sparkles size={18} />
              Akıllı Bölme ({autoSegments.length} bölüm algılandı)
            </h3>
            <button
              onClick={analyzeAndSplit}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <RefreshCw size={16} />
              Yeniden Analiz Et
            </button>
          </div>
          
          {/* Algılanan Bölümler */}
          <div className="space-y-2">
            <p className="text-sm text-purple-600">Her bölüm için alan tipi seçin:</p>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {autoSegments.map((segment, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-purple-500 font-mono bg-purple-100 px-2 py-1 rounded">
                      {segment.start}-{segment.end}
                    </span>
                    <code className="text-sm font-mono text-slate-700 max-w-xs truncate">
                      "{segment.text}"
                    </code>
                  </div>
                  <div className="flex gap-1">
                    {ALAN_TIPLERI.filter(t => t.id !== 'bos').map((tip) => (
                      <button
                        key={tip.id}
                        onClick={() => addSegmentAsField(segment, tip.id)}
                        className="p-1.5 hover:bg-slate-100 rounded text-lg"
                        title={tip.label}
                        style={{ 
                          opacity: alanlar.find(a => a.alan === tip.id) ? 0.3 : 1
                        }}
                      >
                        {tip.icon}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {autoSegments.length === 0 && (
            <div className="text-sm text-purple-600 bg-white/50 rounded-lg p-3 text-center">
              <p>Veri analiz edilemedi. Boşluklarla ayrılmış metin bekleniyor.</p>
            </div>
          )}
        </div>
      )}

      {/* Tanımlı Alanlar Özeti */}
      {alanlar.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Layers size={16} />
              Tanımlı Alanlar ({alanlar.length})
            </h3>
            <div className="text-sm text-slate-500">
              {stats.mappedChars} / {stats.totalChars} karakter eşlendi
            </div>
          </div>
          
          <div className="p-3 space-y-2">
            {alanlar.map((alan, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: `${alan.color}10` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ALAN_TIPLERI.find(t => t.id === alan.alan)?.icon || alan.customLabel ? '📌' : '❓'}</span>
                  <div>
                    <p className="font-medium" style={{ color: alan.color }}>{alan.customLabel || alan.label}</p>
                    <p className="text-xs text-slate-500">
                      Karakter {alan.baslangic} - {alan.bitis} ({alan.bitis - alan.baslangic + 1} karakter)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ornekSatir && (
                    <code className="text-xs bg-white px-2 py-1 rounded border max-w-xs truncate">
                      {ornekSatir.substring(alan.baslangic - 1, alan.bitis)}
                    </code>
                  )}
                  <button
                    onClick={() => removeField(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Cevap Anahtarından Ders Dağılımı Bilgisi */}
          {cevapAnahtariInfo && alanlar.find(a => a.alan === 'cevaplar') && (
            <div className="mx-3 mb-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📚</span>
                <h4 className="font-semibold text-emerald-800">Ders Bazlı Soru Dağılımı</h4>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Cevap anahtarından alındı
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cevapAnahtariInfo.dersBazliSayilar.map((ders: {dersKodu: string, sayi: number}, idx: number) => {
                  const dersRenkleri: Record<string, string> = {
                    'TUR': '#EF4444', 'MAT': '#3B82F6', 'FEN': '#10B981',
                    'SOS': '#F59E0B', 'DIN': '#8B5CF6', 'ING': '#EC4899',
                    'TAR': '#F97316', 'COG': '#06B6D4', 'FEL': '#6366F1'
                  };
                  const renk = dersRenkleri[ders.dersKodu] || '#6B7280';
                  return (
                    <div 
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: `${renk}15`, color: renk }}
                    >
                      <span>{ders.dersKodu}</span>
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs">{ders.sayi} soru</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-emerald-600 mt-2">
                ✅ Bu dağılım karnede otomatik kullanılacak. Ayrı alan tanımlamanıza gerek yok!
              </p>
            </div>
          )}
        </div>
      )}

      {/* İstatistikler */}
      {ornekSatir && (
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-700">{stats.totalChars}</div>
            <div className="text-xs text-slate-500">Toplam Karakter</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">{stats.mappedChars}</div>
            <div className="text-xs text-slate-500">Eşlenen</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <div className="text-2xl font-bold text-amber-600">{stats.unmappedChars}</div>
            <div className="text-xs text-slate-500">Eşlenmemiş</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{stats.fieldCount}</div>
            <div className="text-xs text-slate-500">Alan Sayısı</div>
          </div>
        </div>
      )}

      {/* Cevaplar Alanı Uyarısı */}
      {alanlar.length > 0 && !alanlar.find(a => a.alan === 'cevaplar') && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">⚠️ CEVAPLAR Alanı Eksik!</p>
            <p className="text-sm text-red-600 mt-1">
              Şablonu kaydetmeden önce öğrenci cevaplarının bulunduğu bölümü tanımlamanız gerekiyor.
              <br />
              Örnek: Karakter 53-173 arası (90 soru için)
            </p>
          </div>
        </div>
      )}

      {/* Kaydet Butonu */}
      {alanlar.length > 0 && (
        <button
          onClick={handleSave}
          disabled={!alanlar.find(a => a.alan === 'cevaplar')}
          className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg ${
            isSaved
              ? 'bg-emerald-500 text-white'
              : alanlar.find(a => a.alan === 'cevaplar')
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSaved ? (
            <>
              <Check size={20} />
              ✅ Şablon Kaydedildi! Şimdi "Devam Et" butonuna tıklayın
            </>
          ) : (
            <>
              <Save size={20} />
              {alanlar.find(a => a.alan === 'cevaplar') 
                ? 'Şablonu Kaydet ve Devam Et' 
                : 'Önce Cevaplar Alanını Tanımlayın'}
            </>
          )}
        </button>
      )}

      {/* ÖZEL ALAN EKLEME MODAL */}
      <AnimatePresence>
        {showOzelAlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowOzelAlanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-[500px] shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  ➕ Özel Alan Ekle
                </h4>
                <button 
                  onClick={() => setShowOzelAlanModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-slate-600 mb-4">
                Hazır alanlardan seçin veya kendi alanınızı oluşturun:
              </p>
              
              {/* Hazır Özel Alanlar */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {OZEL_ALAN_ONERILERI.map((oneri) => {
                  const zatenEklendi = ozelAlanlar.some(a => a.label === oneri.label);
                  return (
                    <button
                      key={oneri.id}
                      onClick={() => {
                        if (!zatenEklendi) {
                          setOzelAlanlar(prev => [...prev, { ...oneri, id: `ozel_${Date.now()}_${oneri.id}` }]);
                        }
                      }}
                      disabled={zatenEklendi}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${
                        zatenEklendi
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-purple-400 hover:shadow-md'
                      }`}
                      style={{ color: zatenEklendi ? undefined : oneri.color }}
                    >
                      <span className="text-xl">{oneri.icon}</span>
                      <span className="font-medium">{oneri.label}</span>
                      {zatenEklendi && <Check size={14} className="ml-auto text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
              
              {/* Özel Alan Oluştur */}
              <div className="border-t border-slate-200 pt-4">
                <h5 className="font-semibold text-slate-700 mb-3">Veya kendi alanınızı oluşturun:</h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ozelAlanAdi}
                    onChange={(e) => setOzelAlanAdi(e.target.value)}
                    placeholder="Alan adı girin (örn: Veli İmzası)"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-purple-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && ozelAlanAdi.trim()) {
                        setOzelAlanlar(prev => [...prev, {
                          id: `custom_${Date.now()}`,
                          label: ozelAlanAdi.trim(),
                          icon: '📌',
                          color: '#6366F1'
                        }]);
                        setOzelAlanAdi('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (ozelAlanAdi.trim()) {
                        setOzelAlanlar(prev => [...prev, {
                          id: `custom_${Date.now()}`,
                          label: ozelAlanAdi.trim(),
                          icon: '📌',
                          color: '#6366F1'
                        }]);
                        setOzelAlanAdi('');
                      }
                    }}
                    disabled={!ozelAlanAdi.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </div>
              
              {/* Eklenen Alanlar */}
              {ozelAlanlar.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-xl">
                  <p className="text-xs text-purple-600 mb-2">Eklenen özel alanlar ({ozelAlanlar.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {ozelAlanlar.map((alan) => (
                      <span 
                        key={alan.id} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm border"
                        style={{ borderColor: alan.color, color: alan.color }}
                      >
                        <span>{alan.icon}</span>
                        {alan.label}
                        <button
                          onClick={() => setOzelAlanlar(prev => prev.filter(a => a.id !== alan.id))}
                          className="ml-1 p-0.5 hover:bg-red-100 rounded-full"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Kapat */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowOzelAlanModal(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Tamam
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
