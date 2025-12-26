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

// Alan tipleri ve renkleri
const ALAN_TIPLERI = [
  { id: 'ogrenci_no', label: 'Öğrenci No', icon: '🔢', color: '#F59E0B', shortcut: '1' },
  { id: 'ogrenci_adi', label: 'Öğrenci Adı', icon: '👤', color: '#10B981', shortcut: '2' },
  { id: 'tc', label: 'TC Kimlik', icon: '🆔', color: '#3B82F6', shortcut: '3' },
  { id: 'sinif', label: 'Sınıf', icon: '🏫', color: '#8B5CF6', shortcut: '4' },
  { id: 'kitapcik', label: 'Kitapçık', icon: '📖', color: '#EC4899', shortcut: '5' },
  { id: 'cevaplar', label: 'Cevaplar', icon: '✅', color: '#25D366', shortcut: '6' },
  { id: 'bos', label: 'Boş/Atla', icon: '⬜', color: '#9CA3AF', shortcut: '0' },
  { id: 'ozel', label: '+ Özel Alan', icon: '➕', color: '#6366F1', shortcut: '7' },
];

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

  // Cevap anahtarından bilgi al
  const cevapAnahtariInfo = useMemo(() => {
    if (!cevapAnahtari.length) return null;
    
    const dersler = [...new Set(cevapAnahtari.map(c => c.dersKodu))];
    const dersBazliSayilar = dersler.map(d => ({
      dersKodu: d,
      dersAdi: DERS_ISIMLERI[d] || d,
      soruSayisi: cevapAnahtari.filter(c => c.dersKodu === d).length
    }));
    
    return {
      toplamSoru: cevapAnahtari.length,
      dersSayisi: dersler.length,
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

    const alanTipi = ALAN_TIPLERI.find(t => t.id === activeAlanTipi);
    if (!alanTipi) return;

    const yeniAlan: OptikAlanTanimi = {
      alan: activeAlanTipi as any,
      baslangic: selectedRange.start + 1, // 1-indexed
      bitis: selectedRange.end + 1,
      label: alanTipi.label,
      color: alanTipi.color
    };

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
  }, [selectedRange, activeAlanTipi]);

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
            <div className="flex gap-2">
              {cevapAnahtariInfo.dersBazliSayilar.map(d => (
                <span key={d.dersKodu} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  {d.dersAdi}: {d.soruSayisi}
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
      {inputMode === 'visual' && ornekSatir && (
        <div className="space-y-4">
          {/* HIZLI SAYI GİRİŞİ - EN KOLAY YÖNTEM */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              ⚡ Hızlı Alan Tanımlama (Sayı Girin)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {ALAN_TIPLERI.filter(t => t.id !== 'bos').map((tip) => {
                const existingField = alanlar.find(a => a.alan === tip.id);
                return (
                  <div 
                    key={tip.id} 
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border"
                    style={{ borderColor: existingField ? tip.color : '#e2e8f0' }}
                  >
                    <span className="text-lg">{tip.icon}</span>
                    <span className="text-xs font-medium text-slate-700 w-16 truncate">{tip.label}</span>
                    <input
                      type="number"
                      placeholder="Baş"
                      defaultValue={existingField?.baslangic || ''}
                      min={1}
                      max={ornekSatir.length}
                      className="w-14 px-2 py-1 text-xs border rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      onBlur={(e) => {
                        const start = parseInt(e.target.value);
                        const endInput = e.target.nextElementSibling as HTMLInputElement;
                        const end = parseInt(endInput?.value) || start;
                        if (start > 0 && end >= start) {
                          const yeniAlan: OptikAlanTanimi = {
                            alan: tip.id as any,
                            baslangic: start,
                            bitis: end,
                            label: tip.label,
                            color: tip.color
                          };
                          setAlanlar(prev => {
                            const filtered = prev.filter(a => a.alan !== tip.id);
                            return [...filtered, yeniAlan].sort((a, b) => a.baslangic - b.baslangic);
                          });
                        }
                      }}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      placeholder="Bit"
                      defaultValue={existingField?.bitis || ''}
                      min={1}
                      max={ornekSatir.length}
                      className="w-14 px-2 py-1 text-xs border rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      onBlur={(e) => {
                        const end = parseInt(e.target.value);
                        const startInput = e.target.previousElementSibling?.previousElementSibling as HTMLInputElement;
                        const start = parseInt(startInput?.value) || 1;
                        if (start > 0 && end >= start) {
                          const yeniAlan: OptikAlanTanimi = {
                            alan: tip.id as any,
                            baslangic: start,
                            bitis: end,
                            label: tip.label,
                            color: tip.color
                          };
                          setAlanlar(prev => {
                            const filtered = prev.filter(a => a.alan !== tip.id);
                            return [...filtered, yeniAlan].sort((a, b) => a.baslangic - b.baslangic);
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
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              💡 Başlangıç ve bitiş numaralarını girin, Tab ile geçin. Otomatik kaydedilir.
            </p>
          </div>

          {/* Veya Karakter Haritasından Seç */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                🖱️ Veya karakter haritasından seçin (opsiyonel)
              </label>
              {activeAlanTipi && (
                <button
                  onClick={clearSelection}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 bg-slate-100 rounded"
                >
                  ✕ Seçimi Temizle (ESC)
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {ALAN_TIPLERI.filter(t => t.id !== 'ozel').map((tip) => {
                const existingField = alanlar.find(a => a.alan === tip.id);
                return (
                  <button
                    key={tip.id}
                    onClick={() => setActiveAlanTipi(activeAlanTipi === tip.id ? null : tip.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      activeAlanTipi === tip.id
                        ? 'border-current shadow-lg scale-105'
                        : existingField
                          ? 'border-current opacity-60'
                          : 'border-transparent bg-white hover:shadow-md'
                    }`}
                    style={{
                      borderColor: activeAlanTipi === tip.id || existingField ? tip.color : undefined,
                      backgroundColor: activeAlanTipi === tip.id ? `${tip.color}15` : undefined,
                      color: activeAlanTipi === tip.id || existingField ? tip.color : undefined
                    }}
                  >
                    <span>{tip.icon}</span>
                    <span className="font-medium">{tip.label}</span>
                    {existingField && (
                      <span className="text-xs bg-current/20 px-1.5 py-0.5 rounded">
                        {existingField.baslangic}-{existingField.bitis}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* Özel Alanlar */}
              {ozelAlanlar.map((tip) => {
                const existingField = alanlar.find(a => a.customLabel === tip.label);
                return (
                  <button
                    key={tip.id}
                    onClick={() => setActiveAlanTipi(activeAlanTipi === `ozel_${tip.id}` ? null : `ozel_${tip.id}`)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      activeAlanTipi === `ozel_${tip.id}`
                        ? 'border-current shadow-lg scale-105'
                        : existingField
                          ? 'border-current opacity-60'
                          : 'border-transparent bg-white hover:shadow-md'
                    }`}
                    style={{
                      borderColor: activeAlanTipi === `ozel_${tip.id}` || existingField ? tip.color : undefined,
                      backgroundColor: activeAlanTipi === `ozel_${tip.id}` ? `${tip.color}15` : undefined,
                      color: activeAlanTipi === `ozel_${tip.id}` || existingField ? tip.color : undefined
                    }}
                  >
                    <span>{tip.icon}</span>
                    <span className="font-medium">{tip.label}</span>
                    {existingField && (
                      <span className="text-xs bg-current/20 px-1.5 py-0.5 rounded">
                        {existingField.baslangic}-{existingField.bitis}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* Özel Alan Ekle Butonu */}
              <button
                onClick={() => setShowOzelAlanModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all text-sm"
              >
                <Plus size={16} />
                <span className="font-medium">Özel Alan Ekle</span>
              </button>
            </div>
            
            {/* Özel Alan Önerileri */}
            {showOzelAlanModal && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-indigo-800">➕ Özel Alan Ekle</h4>
                  <button 
                    onClick={() => setShowOzelAlanModal(false)}
                    className="text-indigo-400 hover:text-indigo-600"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <p className="text-sm text-indigo-600 mb-3">
                  Sık kullanılan alanlardan seçin veya yeni oluşturun:
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {OZEL_ALAN_ONERILERI.map((oneri) => (
                    <button
                      key={oneri.id}
                      onClick={() => {
                        setOzelAlanlar(prev => [...prev, oneri]);
                        setShowOzelAlanModal(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all text-sm"
                      style={{ color: oneri.color }}
                    >
                      <span>{oneri.icon}</span>
                      <span className="font-medium">{oneri.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ozelAlanAdi}
                    onChange={(e) => setOzelAlanAdi(e.target.value)}
                    placeholder="Veya özel isim girin..."
                    className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:border-indigo-400 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (ozelAlanAdi.trim()) {
                        setOzelAlanlar(prev => [...prev, {
                          id: `custom_${Date.now()}`,
                          label: ozelAlanAdi,
                          icon: '📌',
                          color: '#6366F1'
                        }]);
                        setOzelAlanAdi('');
                        setShowOzelAlanModal(false);
                      }
                    }}
                    disabled={!ozelAlanAdi.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ekle
                  </button>
                </div>
              </motion.div>
            )}
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
                      {ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.label}
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
                  <span className="text-xl">{ALAN_TIPLERI.find(t => t.id === alan.alan)?.icon}</span>
                  <div>
                    <p className="font-medium" style={{ color: alan.color }}>{alan.label}</p>
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
    </div>
  );
}
