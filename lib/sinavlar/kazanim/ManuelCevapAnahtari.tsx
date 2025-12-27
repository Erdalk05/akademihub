'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  GripVertical,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Target,
  Trash2,
  Copy,
  RotateCcw,
  Download,
  Sparkles,
  AlertCircle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// LGS DERS YAPISI (90 Soru)
// ═══════════════════════════════════════════════════════════════════════════
const LGS_DERSLER = [
  { kod: 'TUR', ad: 'Türkçe', soruSayisi: 20, renk: '#EF4444', icon: '📚' },
  { kod: 'INK', ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, renk: '#F59E0B', icon: '🏛️' },
  { kod: 'DIN', ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, renk: '#8B5CF6', icon: '🕌' },
  { kod: 'ING', ad: 'Yabancı Dil (İngilizce)', soruSayisi: 10, renk: '#3B82F6', icon: '🌍' },
  { kod: 'MAT', ad: 'Matematik', soruSayisi: 20, renk: '#10B981', icon: '📐' },
  { kod: 'FEN', ad: 'Fen Bilimleri', soruSayisi: 20, renk: '#06B6D4', icon: '🔬' },
];

const KITAPCIK_TURLERI = ['A', 'B', 'C', 'D'] as const;
type KitapcikTuru = typeof KITAPCIK_TURLERI[number];
type CevapSecenegi = 'A' | 'B' | 'C' | 'D' | 'E' | null;

interface SoruCevap {
  soruNo: number;
  globalSoruNo: number;
  dersKodu: string;
  cevap: CevapSecenegi;
  kazanimKodu: string;
  kazanimMetni: string;
}

interface KitapcikVerisi {
  kitapcik: KitapcikTuru;
  sorular: SoruCevap[];
}

// CevapAnahtariSatir tipini import et
import { CevapAnahtariSatir } from './types';

interface ManuelCevapAnahtariProps {
  examType?: string; // LGS, TYT, AYT, DENEME, AYT_SAY, AYT_SOS vb.
  onSave?: (data: CevapAnahtariSatir[]) => void;
  initialData?: CevapAnahtariSatir[];
}

type GirisYontemi = 'yapistir' | 'surukle' | 'yukle';

export default function ManuelCevapAnahtari({ onSave, initialData }: ManuelCevapAnahtariProps) {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE YÖNETİMİ
  // ═══════════════════════════════════════════════════════════════════════════
  const [aktifKitapcik, setAktifKitapcik] = useState<KitapcikTuru>('A');
  const [girisYontemi, setGirisYontemi] = useState<GirisYontemi>('yapistir');
  const [acikDersler, setAcikDersler] = useState<string[]>(['TUR']);
  const [yapistirMetni, setYapistirMetni] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tüm kitapçıklar için veri
  const [kitapcikVerileri, setKitapcikVerileri] = useState<Record<KitapcikTuru, SoruCevap[]>>(() => {
    const initial: Record<KitapcikTuru, SoruCevap[]> = { A: [], B: [], C: [], D: [] };
    
    KITAPCIK_TURLERI.forEach(kit => {
      let globalNo = 0;
      LGS_DERSLER.forEach(ders => {
        for (let i = 1; i <= ders.soruSayisi; i++) {
          globalNo++;
          initial[kit].push({
            soruNo: i,
            globalSoruNo: globalNo,
            dersKodu: ders.kod,
            cevap: null,
            kazanimKodu: '',
            kazanimMetni: ''
          });
        }
      });
    });
    
    return initial;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // YARDIMCI FONKSİYONLAR
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Ders toggle
  const toggleDers = (dersKodu: string) => {
    setAcikDersler(prev => 
      prev.includes(dersKodu) 
        ? prev.filter(d => d !== dersKodu)
        : [...prev, dersKodu]
    );
  };

  // Cevap değiştir
  const setCevap = useCallback((globalSoruNo: number, cevap: CevapSecenegi) => {
    setKitapcikVerileri(prev => ({
      ...prev,
      [aktifKitapcik]: prev[aktifKitapcik].map(s => 
        s.globalSoruNo === globalSoruNo ? { ...s, cevap } : s
      )
    }));
  }, [aktifKitapcik]);

  // Kazanım güncelle
  const setKazanim = useCallback((globalSoruNo: number, kod: string, metin: string) => {
    setKitapcikVerileri(prev => ({
      ...prev,
      [aktifKitapcik]: prev[aktifKitapcik].map(s => 
        s.globalSoruNo === globalSoruNo 
          ? { ...s, kazanimKodu: kod, kazanimMetni: metin } 
          : s
      )
    }));
  }, [aktifKitapcik]);

  // Yapıştır işlemi - cevapları parse et
  const handleYapistir = useCallback(() => {
    if (!yapistirMetni.trim()) return;

    const lines = yapistirMetni.trim().split('\n');
    let globalNo = 0;
    
    const yeniSorular = [...kitapcikVerileri[aktifKitapcik]];
    
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 1) {
        globalNo++;
        const soru = yeniSorular.find(s => s.globalSoruNo === globalNo);
        if (soru) {
          // İlk sütun cevap (A, B, C, D, E)
          const cevap = parts[0]?.trim().toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(cevap)) {
            soru.cevap = cevap as CevapSecenegi;
          }
          // İkinci sütun kazanım kodu (varsa)
          if (parts[1]) {
            soru.kazanimKodu = parts[1].trim();
          }
          // Üçüncü sütun kazanım metni (varsa)
          if (parts[2]) {
            soru.kazanimMetni = parts[2].trim();
          }
        }
      }
    });

    setKitapcikVerileri(prev => ({
      ...prev,
      [aktifKitapcik]: yeniSorular
    }));
    
    setYapistirMetni('');
    alert(`✅ ${globalNo} soru başarıyla yapıştırıldı!`);
  }, [yapistirMetni, aktifKitapcik, kitapcikVerileri]);

  // Hızlı cevap yapıştır (ABCDABCD formatı)
  const handleHizliYapistir = useCallback((text: string) => {
    const cevaplar = text.toUpperCase().replace(/[^ABCDE]/g, '').split('');
    
    setKitapcikVerileri(prev => ({
      ...prev,
      [aktifKitapcik]: prev[aktifKitapcik].map((s, idx) => ({
        ...s,
        cevap: cevaplar[idx] as CevapSecenegi || s.cevap
      }))
    }));
  }, [aktifKitapcik]);

  // A kitapçığından kopyala
  const kopyalaAdan = useCallback((hedefKitapcik: KitapcikTuru) => {
    if (hedefKitapcik === 'A') return;
    
    setKitapcikVerileri(prev => ({
      ...prev,
      [hedefKitapcik]: prev.A.map(s => ({ ...s }))
    }));
    
    alert(`✅ A kitapçığından ${hedefKitapcik} kitapçığına kopyalandı!`);
  }, []);

  // Tümünü temizle
  const tumunuTemizle = useCallback(() => {
    if (!confirm('Bu kitapçığın tüm cevaplarını silmek istediğinize emin misiniz?')) return;
    
    setKitapcikVerileri(prev => ({
      ...prev,
      [aktifKitapcik]: prev[aktifKitapcik].map(s => ({
        ...s,
        cevap: null,
        kazanimKodu: '',
        kazanimMetni: ''
      }))
    }));
  }, [aktifKitapcik]);

  // Dosya yükleme
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setYapistirMetni(text);
    };
    reader.readAsText(file);
  }, []);

  // Drag & Drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setYapistirMetni(text);
      };
      reader.readAsText(file);
    }
  }, []);

  // İstatistikler
  const stats = {
    doluSoru: kitapcikVerileri[aktifKitapcik].filter(s => s.cevap).length,
    toplamSoru: 90,
    kazanimli: kitapcikVerileri[aktifKitapcik].filter(s => s.kazanimKodu).length
  };

  // Ders bazlı cevap state'leri
  const [dersCevaplari, setDersCevaplari] = useState<Record<string, string>>({
    TUR: '', INK: '', DIN: '', ING: '', MAT: '', FEN: ''
  });

  // Ders bazlı cevap yapıştır
  const handleDersCevapYapistir = useCallback((dersKodu: string, cevaplar: string) => {
    const ders = LGS_DERSLER.find(d => d.kod === dersKodu);
    if (!ders) return;

    // Cevapları temizle ve büyük harfe çevir
    const temizCevaplar = cevaplar.toUpperCase().replace(/[^ABCDE]/g, '');
    
    // Dersin başlangıç index'ini bul
    let baslangicIndex = 0;
    for (const d of LGS_DERSLER) {
      if (d.kod === dersKodu) break;
      baslangicIndex += d.soruSayisi;
    }

    // Cevapları uygula
    setKitapcikVerileri(prev => {
      const yeniSorular = [...prev[aktifKitapcik]];
      temizCevaplar.split('').forEach((cevap, idx) => {
        if (idx < ders.soruSayisi) {
          const soruIndex = baslangicIndex + idx;
          if (yeniSorular[soruIndex]) {
            yeniSorular[soruIndex] = {
              ...yeniSorular[soruIndex],
              cevap: cevap as CevapSecenegi
            };
          }
        }
      });
      return { ...prev, [aktifKitapcik]: yeniSorular };
    });

    // State'i temizle
    setDersCevaplari(prev => ({ ...prev, [dersKodu]: '' }));
    
    console.log(`✅ ${ders.ad} için ${temizCevaplar.length} cevap uygulandı`);
  }, [aktifKitapcik]);

  // Ders için girilen cevap sayısı
  const getDersCevapSayisi = useCallback((dersKodu: string) => {
    const ders = LGS_DERSLER.find(d => d.kod === dersKodu);
    if (!ders) return 0;
    
    let baslangicIndex = 0;
    for (const d of LGS_DERSLER) {
      if (d.kod === dersKodu) break;
      baslangicIndex += d.soruSayisi;
    }

    return kitapcikVerileri[aktifKitapcik]
      .slice(baslangicIndex, baslangicIndex + ders.soruSayisi)
      .filter(s => s.cevap).length;
  }, [aktifKitapcik, kitapcikVerileri]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Manuel Cevap Anahtarı</h2>
              <p className="text-white/80 text-sm">LGS 90 Soru • A-B-C-D Kitapçık Desteği</p>
            </div>
          </div>
          
          {/* İstatistikler */}
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold">{stats.doluSoru}/{stats.toplamSoru}</div>
              <div className="text-xs text-white/70">Cevap Girildi</div>
            </div>
            <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold">{stats.kazanimli}</div>
              <div className="text-xs text-white/70">Kazanım Eşleşti</div>
            </div>
          </div>
        </div>
      </div>

      {/* KİTAPÇIK SEÇİCİ */}
      <div className="border-b border-gray-100 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 mr-2">Kitapçık:</span>
            {KITAPCIK_TURLERI.map(kit => (
              <button
                key={kit}
                onClick={() => setAktifKitapcik(kit)}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                  aktifKitapcik === kit
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                    : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200'
                }`}
              >
                {kit}
              </button>
            ))}
          </div>

          {/* Hızlı İşlemler */}
          <div className="flex items-center gap-2">
            {aktifKitapcik !== 'A' && (
              <button
                onClick={() => kopyalaAdan(aktifKitapcik)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Copy size={16} />
                A'dan Kopyala
              </button>
            )}
            <button
              onClick={tumunuTemizle}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 size={16} />
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* GİRİŞ YÖNTEMİ SEÇİCİ */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-600">Giriş Yöntemi:</span>
          {[
            { id: 'yapistir', icon: ClipboardPaste, label: 'Yapıştır' },
            { id: 'surukle', icon: GripVertical, label: 'Sürükle-Bırak' },
            { id: 'yukle', icon: Upload, label: 'Dosya Yükle' },
          ].map(yontem => (
            <button
              key={yontem.id}
              onClick={() => setGirisYontemi(yontem.id as GirisYontemi)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                girisYontemi === yontem.id
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <yontem.icon size={16} />
              {yontem.label}
            </button>
          ))}
        </div>

        {/* Giriş Alanları */}
        <AnimatePresence mode="wait">
          {girisYontemi === 'yapistir' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <div className="font-medium mb-1">📋 Yapıştır Formatı:</div>
                <code className="text-xs bg-white px-2 py-1 rounded">CEVAP [TAB] KAZANIM_KODU [TAB] KAZANIM_METNİ</code>
                <div className="mt-2">Veya sadece cevapları yapıştırın: <code className="bg-white px-2 py-1 rounded">ABCDABCDABCD...</code></div>
              </div>
              
              <div className="flex gap-2">
                <textarea
                  value={yapistirMetni}
                  onChange={(e) => setYapistirMetni(e.target.value)}
                  placeholder="Excel'den veya metin olarak yapıştırın..."
                  className="flex-1 h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm font-mono"
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleYapistir}
                    disabled={!yapistirMetni.trim()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => setYapistirMetni('')}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Hızlı Cevap Girişi */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Hızlı giriş: ABCDABCDABCD... (90 karakter)"
                  maxLength={90}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase"
                  onChange={(e) => {
                    if (e.target.value.length === 90) {
                      handleHizliYapistir(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <span className="text-xs text-gray-400">90 karakter girildiğinde otomatik uygular</span>
              </div>
            </motion.div>
          )}

          {girisYontemi === 'surukle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragOver 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <GripVertical size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Excel veya CSV dosyasını buraya sürükleyin</p>
              <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, .csv formatları desteklenir</p>
            </motion.div>
          )}

          {girisYontemi === 'yukle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                <Upload size={20} />
                Dosya Seç
              </button>
              <p className="text-sm text-gray-400 mt-2">.xlsx, .xls, .csv, .txt formatları</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* HIZLI DERS BAZLI CEVAP GİRİŞ TABLOSU */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" />
            <h3 className="font-bold text-indigo-800">⚡ Hızlı Ders Bazlı Cevap Girişi</h3>
          </div>
          <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">Her derse direkt yapıştır!</span>
        </div>
        
        <div className="bg-white rounded-xl border border-indigo-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-indigo-50 text-left text-xs font-medium text-indigo-700">
                <th className="px-3 py-2 w-32">Ders</th>
                <th className="px-3 py-2 w-16 text-center">Soru</th>
                <th className="px-3 py-2">Cevapları Yapıştır (örn: ABCDABCD...)</th>
                <th className="px-3 py-2 w-24 text-center">Durum</th>
              </tr>
            </thead>
            <tbody>
              {LGS_DERSLER.map(ders => {
                const doluluk = getDersCevapSayisi(ders.kod);
                const yuzde = Math.round((doluluk / ders.soruSayisi) * 100);
                
                return (
                  <tr key={ders.kod} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ders.icon}</span>
                        <span className="font-medium text-sm" style={{ color: ders.renk }}>
                          {ders.ad.split(' ')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-sm font-bold" style={{ color: ders.renk }}>
                      {ders.soruSayisi}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dersCevaplari[ders.kod] || ''}
                          onChange={(e) => {
                            const deger = e.target.value.toUpperCase();
                            setDersCevaplari(prev => ({ ...prev, [ders.kod]: deger }));
                            
                            // Soru sayısına ulaştığında otomatik uygula
                            if (deger.replace(/[^ABCDE]/g, '').length >= ders.soruSayisi) {
                              handleDersCevapYapistir(ders.kod, deger);
                            }
                          }}
                          placeholder={`${ders.soruSayisi} karakter (${ders.ad.split(' ')[0]})`}
                          maxLength={ders.soruSayisi + 5}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          style={{ borderColor: dersCevaplari[ders.kod] ? ders.renk : undefined }}
                        />
                        <button
                          onClick={() => handleDersCevapYapistir(ders.kod, dersCevaplari[ders.kod] || '')}
                          disabled={!dersCevaplari[ders.kod]}
                          className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all"
                            style={{ width: `${yuzde}%`, backgroundColor: ders.renk }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: ders.renk }}>
                          {doluluk}/{ders.soruSayisi}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
          <AlertCircle size={12} />
          Her ders için cevap sayısına ulaştığında otomatik uygulanır
        </div>
      </div>

      {/* DERS BAZLI DETAYLI CEVAP GİRİŞİ */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {LGS_DERSLER.map((ders, dersIdx) => {
          const dersSorulari = kitapcikVerileri[aktifKitapcik].filter(s => s.dersKodu === ders.kod);
          const doluSoru = dersSorulari.filter(s => s.cevap).length;
          const isAcik = acikDersler.includes(ders.kod);

          return (
            <div key={ders.kod} className="mb-3">
              {/* Ders Başlığı */}
              <button
                onClick={() => toggleDers(ders.kod)}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-gray-50"
                style={{ backgroundColor: `${ders.renk}10` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ders.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold" style={{ color: ders.renk }}>{ders.ad}</div>
                    <div className="text-xs text-gray-500">{ders.soruSayisi} Soru</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium" style={{ color: ders.renk }}>
                    {doluSoru}/{ders.soruSayisi}
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={{ 
                        width: `${(doluSoru / ders.soruSayisi) * 100}%`,
                        backgroundColor: ders.renk 
                      }}
                    />
                  </div>
                  {isAcik ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {/* Sorular */}
              <AnimatePresence>
                {isAcik && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1 pl-4"
                  >
                    {/* 🚀 HIZLI YAPISTIR ALANI - Her Ders İçin */}
                    <div className="flex items-center gap-2 p-2 rounded-lg mb-2" style={{ backgroundColor: `${ders.renk}10` }}>
                      <ClipboardPaste size={16} style={{ color: ders.renk }} />
                      <input
                        type="text"
                        placeholder={`${ders.soruSayisi} cevabı yapıştır: ABCD... (${ders.ad})`}
                        maxLength={ders.soruSayisi + 5}
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm font-mono uppercase focus:ring-2"
                        style={{ borderColor: ders.renk + '40', backgroundColor: 'white' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleDersCevapYapistir(ders.kod, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        onChange={(e) => {
                          const deger = e.target.value.toUpperCase().replace(/[^ABCDE]/g, '');
                          if (deger.length >= ders.soruSayisi) {
                            handleDersCevapYapistir(ders.kod, deger);
                            e.target.value = '';
                          }
                        }}
                      />
                      <span className="text-xs" style={{ color: ders.renk }}>{ders.soruSayisi} karakter</span>
                    </div>

                    {/* Başlık Satırı */}
                    <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-medium text-gray-500 border-b border-gray-100">
                      <div className="col-span-1">No</div>
                      <div className="col-span-3">Cevap</div>
                      <div className="col-span-2">Kazanım Kodu</div>
                      <div className="col-span-6">Kazanım Metni</div>
                    </div>

                    {dersSorulari.map(soru => (
                      <div 
                        key={soru.globalSoruNo}
                        className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* Soru No */}
                        <div className="col-span-1 text-sm font-bold text-gray-700">
                          {soru.soruNo}
                        </div>

                        {/* Cevap Butonları */}
                        <div className="col-span-3 flex gap-1">
                          {(['A', 'B', 'C', 'D', 'E'] as CevapSecenegi[]).map(c => (
                            <button
                              key={c}
                              onClick={() => setCevap(soru.globalSoruNo, soru.cevap === c ? null : c)}
                              className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${
                                soru.cevap === c
                                  ? 'text-white shadow-md scale-105'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              style={{
                                backgroundColor: soru.cevap === c ? ders.renk : undefined
                              }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>

                        {/* Kazanım Kodu */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={soru.kazanimKodu}
                            onChange={(e) => setKazanim(soru.globalSoruNo, e.target.value, soru.kazanimMetni)}
                            placeholder="T.8.3.5"
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>

                        {/* Kazanım Metni */}
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={soru.kazanimMetni}
                            onChange={(e) => setKazanim(soru.globalSoruNo, soru.kazanimKodu, e.target.value)}
                            placeholder="Kazanım açıklaması..."
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* FOOTER - KAYDET */}
      <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-emerald-600">{stats.doluSoru}</span> cevap, 
          <span className="font-medium text-blue-600 ml-1">{stats.kazanimli}</span> kazanım girildi
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('🔵 Manuel Cevap Anahtarı - Kaydet butonuna tıklandı');
              
              // Kitapçık A'yı ana veri olarak al, diğer kitapçıkları eşle
              const sorularA = kitapcikVerileri['A'];
              const sorularB = kitapcikVerileri['B'];
              const sorularC = kitapcikVerileri['C'];
              const sorularD = kitapcikVerileri['D'];

              // Geçerli cevap kontrolü
              const validCevap = (c: string | null): 'A' | 'B' | 'C' | 'D' | 'E' | undefined => {
                if (c === 'A' || c === 'B' || c === 'C' || c === 'D' || c === 'E') return c;
                return undefined;
              };

              // CevapAnahtariSatir formatına dönüştür
              // ÖNEMLİ: Orijinal index'i korumak için önce map sonra filter kullanıyoruz
              const cevapAnahtari: CevapAnahtariSatir[] = [];
              
              sorularA.forEach((soru, originalIdx) => {
                // Cevabı olmayan soruları atla
                if (!soru.cevap) return;
                
                const ders = LGS_DERSLER.find(d => d.kod === soru.dersKodu);
                const cevapA = validCevap(soru.cevap);
                // Orijinal index'i kullan (filter sonrası değil!)
                const cevapB = validCevap(sorularB[originalIdx]?.cevap || null);
                const cevapC = validCevap(sorularC[originalIdx]?.cevap || null);
                const cevapD = validCevap(sorularD[originalIdx]?.cevap || null);
                
                cevapAnahtari.push({
                  soruNo: soru.globalSoruNo,
                  dogruCevap: cevapA || 'A', // Varsayılan A
                  dersKodu: soru.dersKodu,
                  dersAdi: ders?.ad || soru.dersKodu,
                  kazanimKodu: soru.kazanimKodu || undefined,
                  kazanimMetni: soru.kazanimMetni || undefined,
                  kitapcikCevaplari: {
                    A: cevapA,
                    B: cevapB,
                    C: cevapC,
                    D: cevapD,
                  },
                });
              });
              
              console.log('✅ Cevap anahtarı oluşturuldu:', cevapAnahtari.length, 'soru');
              
              if (onSave) {
                onSave(cevapAnahtari);
                console.log('✅ onSave callback çağrıldı');
              } else {
                console.warn('⚠️ onSave prop tanımlı değil!');
              }
            }}
            disabled={stats.doluSoru === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg ${
              stats.doluSoru > 0
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check size={18} />
            Kaydet ve Devam Et ({stats.doluSoru}/90)
          </button>
        </div>
      </div>
    </div>
  );
}

