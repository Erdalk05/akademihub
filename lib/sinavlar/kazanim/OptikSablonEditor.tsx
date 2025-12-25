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
  Download
} from 'lucide-react';
import { OptikAlanTanimi, OptikSablon, ALAN_RENKLERI } from './types';

interface OptikSablonEditorProps {
  onSave?: (sablon: Omit<OptikSablon, 'id'>) => void;
  onLoad?: () => Promise<OptikSablon[]>;
  initialSablon?: OptikSablon;
  sampleData?: string;
}

// Alan tipleri
const ALAN_TIPLERI = [
  { id: 'sinif_no', label: 'Sınıf No', icon: '🏫', color: '#EF4444' },
  { id: 'ogrenci_no', label: 'Öğrenci No', icon: '🔢', color: '#F59E0B' },
  { id: 'ogrenci_adi', label: 'Öğrenci Adı', icon: '👤', color: '#10B981' },
  { id: 'tc', label: 'TC Kimlik', icon: '🆔', color: '#3B82F6' },
  { id: 'kitapcik', label: 'Kitapçık Tipi', icon: '📖', color: '#8B5CF6' },
  { id: 'cevaplar', label: 'Cevaplar', icon: '✅', color: '#25D366' },
  { id: 'bos', label: 'Boş Alan', icon: '⬜', color: '#9CA3AF' },
];

export default function OptikSablonEditor({
  onSave,
  onLoad,
  initialSablon,
  sampleData
}: OptikSablonEditorProps) {
  // States
  const [sablonAdi, setSablonAdi] = useState(initialSablon?.sablonAdi || '');
  const [alanlar, setAlanlar] = useState<OptikAlanTanimi[]>(initialSablon?.alanTanimlari || []);
  const [cevapBaslangic, setCevapBaslangic] = useState(initialSablon?.cevapBaslangic || 0);
  const [toplamSoru, setToplamSoru] = useState(initialSablon?.toplamSoru || 90);
  const [ornekSatir, setOrnekSatir] = useState(sampleData || '');
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [activeAlanTipi, setActiveAlanTipi] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [savedSablonlar, setSavedSablonlar] = useState<OptikSablon[]>([]);
  
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Örnek satır değiştiğinde alanları temizle
  useEffect(() => {
    if (sampleData && sampleData !== ornekSatir) {
      setOrnekSatir(sampleData);
    }
  }, [sampleData]);

  // Karakter seçimi
  const handleCharClick = useCallback((index: number, isShift: boolean) => {
    if (isShift && selectedRange) {
      // Shift ile seçim genişlet
      setSelectedRange({
        start: Math.min(selectedRange.start, index),
        end: Math.max(selectedRange.end, index)
      });
    } else {
      // Yeni seçim başlat
      setSelectedRange({ start: index, end: index });
      setIsSelecting(true);
    }
  }, [selectedRange]);

  const handleCharMouseEnter = useCallback((index: number) => {
    if (isSelecting && selectedRange) {
      setSelectedRange({
        start: selectedRange.start,
        end: index
      });
    }
  }, [isSelecting, selectedRange]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  // Seçili aralığı alan olarak ekle
  const addSelectedAsField = useCallback(() => {
    if (!selectedRange || !activeAlanTipi) return;

    const start = Math.min(selectedRange.start, selectedRange.end) + 1; // 1-indexed
    const end = Math.max(selectedRange.start, selectedRange.end) + 1;

    const alanTipi = ALAN_TIPLERI.find(t => t.id === activeAlanTipi);
    if (!alanTipi) return;

    const yeniAlan: OptikAlanTanimi = {
      alan: activeAlanTipi as any,
      baslangic: start,
      bitis: end,
      label: alanTipi.label,
      color: alanTipi.color
    };

    // Örtüşen alanları kontrol et
    const overlapping = alanlar.find(a => 
      (start <= a.bitis && end >= a.baslangic)
    );

    if (overlapping) {
      if (!confirm(`Bu aralık "${overlapping.label}" ile çakışıyor. Üzerine yazmak istiyor musunuz?`)) {
        return;
      }
      // Örtüşen alanı kaldır
      setAlanlar(prev => prev.filter(a => a !== overlapping));
    }

    setAlanlar(prev => [...prev, yeniAlan].sort((a, b) => a.baslangic - b.baslangic));
    setSelectedRange(null);
    setActiveAlanTipi(null);

    // Cevaplar alanı ise başlangıç pozisyonunu güncelle
    if (activeAlanTipi === 'cevaplar') {
      setCevapBaslangic(start);
    }
  }, [selectedRange, activeAlanTipi, alanlar]);

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
    const min = Math.min(selectedRange.start, selectedRange.end);
    const max = Math.max(selectedRange.start, selectedRange.end);
    return charIndex >= min && charIndex <= max;
  }, [selectedRange]);

  // Şablonu kaydet
  const handleSave = () => {
    if (!sablonAdi.trim()) {
      alert('Lütfen şablon adı girin');
      return;
    }
    if (alanlar.length === 0) {
      alert('En az bir alan tanımlamalısınız');
      return;
    }

    const sablon: Omit<OptikSablon, 'id'> = {
      sablonAdi,
      alanTanimlari: alanlar,
      cevapBaslangic,
      toplamSoru,
      isDefault: false,
      isActive: true
    };

    onSave?.(sablon);
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

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Grid3X3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Optik Şablon Editörü</h2>
            <p className="text-sm text-slate-500">Karakter aralıklarını tanımlayın</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowRuler(!showRuler)}
            className={`p-2 rounded-lg transition-colors ${
              showRuler ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}
            title="Cetvel Göster/Gizle"
          >
            <Ruler size={20} />
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
            title="Yardım"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Yardım Paneli */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <h4 className="font-semibold text-blue-800 mb-2">Nasıl Kullanılır?</h4>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Örnek bir optik satırı yapıştırın</li>
              <li>Aşağıdaki alan tiplerinden birini seçin</li>
              <li>Karakter görünümünde ilgili karakterleri seçin</li>
              <li>"Bu Alanı Ekle" butonuna tıklayın</li>
              <li>Tüm alanları tanımladıktan sonra şablonu kaydedin</li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Şablon Adı ve Ayarlar */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Şablon Adı</label>
          <input
            type="text"
            value={sablonAdi}
            onChange={(e) => setSablonAdi(e.target.value)}
            placeholder="Örn: Dikmen Çözüm LGS"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Toplam Soru</label>
          <input
            type="number"
            value={toplamSoru}
            onChange={(e) => setToplamSoru(parseInt(e.target.value) || 90)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cevap Başlangıç</label>
          <input
            type="number"
            value={cevapBaslangic}
            onChange={(e) => setCevapBaslangic(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            min={0}
          />
        </div>
      </div>

      {/* Örnek Veri Girişi */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Örnek Optik Satırı
        </label>
        <textarea
          value={ornekSatir}
          onChange={(e) => setOrnekSatir(e.target.value.split('\n')[0] || '')} // Sadece ilk satır
          placeholder="Optik okuyucudan gelen örnek bir satırı buraya yapıştırın..."
          className="w-full h-20 px-4 py-3 font-mono text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-slate-500">
          Toplam karakter: {ornekSatir.length}
        </p>
      </div>

      {/* Hızlı Alan Ekleme - Manuel Giriş */}
      {ornekSatir && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
            ⚡ Hızlı Alan Tanımlama (Sayı Girerek)
          </h3>
          
          <div className="grid grid-cols-6 gap-3">
            {ALAN_TIPLERI.filter(t => t.id !== 'bos').map((tip) => {
              const existingField = alanlar.find(a => a.alan === tip.id);
              return (
                <div key={tip.id} className="space-y-1">
                  <label className="text-xs font-medium flex items-center gap-1" style={{ color: tip.color }}>
                    {tip.icon} {tip.label}
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      placeholder="Baş"
                      min={1}
                      max={ornekSatir.length}
                      defaultValue={existingField?.baslangic || ''}
                      className="w-14 px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-300"
                      id={`field-start-${tip.id}`}
                    />
                    <span className="text-slate-400 self-center">-</span>
                    <input
                      type="number"
                      placeholder="Son"
                      min={1}
                      max={ornekSatir.length}
                      defaultValue={existingField?.bitis || ''}
                      className="w-14 px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-300"
                      id={`field-end-${tip.id}`}
                    />
                    <button
                      onClick={() => {
                        const startInput = document.getElementById(`field-start-${tip.id}`) as HTMLInputElement;
                        const endInput = document.getElementById(`field-end-${tip.id}`) as HTMLInputElement;
                        const start = parseInt(startInput?.value);
                        const end = parseInt(endInput?.value);
                        
                        if (!start || !end || start > end || start < 1 || end > ornekSatir.length) {
                          alert('Geçersiz aralık!');
                          return;
                        }
                        
                        // Mevcut alanı güncelle veya yeni ekle
                        setAlanlar(prev => {
                          const filtered = prev.filter(a => a.alan !== tip.id);
                          return [...filtered, {
                            alan: tip.id as any,
                            baslangic: start,
                            bitis: end,
                            label: tip.label,
                            color: tip.color
                          }].sort((a, b) => a.baslangic - b.baslangic);
                        });
                        
                        if (tip.id === 'cevaplar') {
                          setCevapBaslangic(start);
                        }
                      }}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                      title="Ekle"
                    >
                      ✓
                    </button>
                  </div>
                  {existingField && (
                    <div className="text-[10px] text-slate-500 truncate">
                      "{ornekSatir.substring(existingField.baslangic - 1, existingField.bitis)}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-xs text-emerald-600 bg-emerald-100 rounded-lg p-2">
            💡 <strong>İpucu:</strong> Her alan için başlangıç ve bitiş karakter numarasını girin. 
            Örnek: Öğrenci No için 1-6 arası, Ad için 7-20 arası gibi.
          </div>
        </div>
      )}

      {/* Alan Tipi Seçici - Görsel Seçim İçin */}
      {ornekSatir && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Alternatif: Görsel Seçim (Alan tipini seç, sonra aşağıda karakterleri işaretle)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALAN_TIPLERI.map((tip) => (
              <button
                key={tip.id}
                onClick={() => setActiveAlanTipi(activeAlanTipi === tip.id ? null : tip.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  activeAlanTipi === tip.id
                    ? 'border-current shadow-md'
                    : 'border-transparent bg-slate-100 hover:bg-slate-200'
                }`}
                style={{
                  borderColor: activeAlanTipi === tip.id ? tip.color : undefined,
                  backgroundColor: activeAlanTipi === tip.id ? `${tip.color}15` : undefined,
                  color: activeAlanTipi === tip.id ? tip.color : undefined
                }}
              >
                <span>{tip.icon}</span>
                <span className="font-medium">{tip.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Karakter Görünümü */}
      {ornekSatir && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Karakter Haritası
              {activeAlanTipi && (
                <span className="ml-2 text-blue-600">
                  (Karakterleri seçin, sonra "Bu Alanı Ekle")
                </span>
              )}
            </label>
            {selectedRange && (
              <span className="text-sm text-slate-500">
                Seçili: {Math.min(selectedRange.start, selectedRange.end) + 1} - {Math.max(selectedRange.start, selectedRange.end) + 1}
                ({Math.abs(selectedRange.end - selectedRange.start) + 1} karakter)
              </span>
            )}
          </div>

          {/* Cetvel */}
          {showRuler && (
            <div className="flex font-mono text-[10px] text-slate-400 select-none overflow-x-auto">
              {Array.from({ length: ornekSatir.length }, (_, i) => (
                <div
                  key={i}
                  className="w-6 flex-shrink-0 text-center"
                >
                  {(i + 1) % 10 === 0 ? (i + 1) : ((i + 1) % 5 === 0 ? '·' : '')}
                </div>
              ))}
            </div>
          )}

          {/* Karakterler */}
          <div 
            ref={textContainerRef}
            className="flex flex-wrap font-mono text-sm bg-slate-50 rounded-xl p-2 border border-slate-200 overflow-x-auto select-none"
            style={{ cursor: activeAlanTipi ? 'crosshair' : 'default' }}
          >
            {Array.from(ornekSatir).map((char, i) => {
              const field = getCharField(i);
              const isSelected = isCharSelected(i);
              
              return (
                <div
                  key={i}
                  onClick={(e) => activeAlanTipi && handleCharClick(i, e.shiftKey)}
                  onMouseEnter={() => handleCharMouseEnter(i)}
                  className={`w-6 h-8 flex items-center justify-center rounded transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                      : field
                        ? 'text-white'
                        : 'hover:bg-slate-200'
                  } ${activeAlanTipi ? 'cursor-crosshair' : ''}`}
                  style={{
                    backgroundColor: isSelected ? undefined : (field?.color || undefined),
                  }}
                  title={`Karakter ${i + 1}: "${char}" ${field ? `(${field.label})` : ''}`}
                >
                  {char === ' ' ? '·' : char}
                </div>
              );
            })}
          </div>

          {/* Seçili Alan Ekle Butonu */}
          {selectedRange && activeAlanTipi && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  <strong>{ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.label}</strong> olarak 
                  <span className="mx-1 font-mono bg-blue-100 px-2 py-0.5 rounded">
                    {Math.min(selectedRange.start, selectedRange.end) + 1} - {Math.max(selectedRange.start, selectedRange.end) + 1}
                  </span>
                  aralığı eklenecek
                </p>
              </div>
              <button
                onClick={addSelectedAsField}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                Bu Alanı Ekle
              </button>
              <button
                onClick={() => { setSelectedRange(null); setActiveAlanTipi(null); }}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Tanımlı Alanlar Listesi */}
      {alanlar.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Tanımlı Alanlar ({alanlar.length})
            </label>
            <div className="text-xs text-slate-500">
              {stats.mappedChars}/{stats.totalChars} karakter eşlendi
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {alanlar.map((alan, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 rounded-xl border"
                style={{
                  backgroundColor: `${alan.color}10`,
                  borderColor: `${alan.color}40`
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: alan.color }}
                  />
                  <div>
                    <p className="font-medium text-slate-700">{alan.label}</p>
                    <p className="text-xs text-slate-500">
                      Karakter: {alan.baslangic} - {alan.bitis} ({alan.bitis - alan.baslangic + 1} karakter)
                    </p>
                    {ornekSatir && (
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        "{ornekSatir.substring(alan.baslangic - 1, alan.bitis)}"
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeField(index)}
                  className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
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

      {/* Kaydet Butonu */}
      {alanlar.length > 0 && (
        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Save size={20} />
          Şablonu Kaydet
        </button>
      )}
    </div>
  );
}

