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
  
  // 🔀 DERS SIRALAMASI - Sürükle-Bırak için
  const [dersSirasi, setDersSirasi] = useState<string[]>(['TUR', 'INK', 'DIN', 'ING', 'MAT', 'FEN']);
  const [draggedDers, setDraggedDers] = useState<string | null>(null);
  const [dragOverDers, setDragOverDers] = useState<string | null>(null);
  
  // Sıralanmış dersler
  const siraliDersler = dersSirasi.map(kod => LGS_DERSLER.find(d => d.kod === kod)!).filter(Boolean);

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
  
  // 🔒 KİLİT SİSTEMİ (KİTAPÇIK BAZLI)
  // Kritik: Kilit tek Set olursa A'da kilitlenen dersler B'de de kilitli görünür
  // ve B cevap anahtarı girilemez → B öğrencileri A anahtarıyla değerlendirilir (YANLIŞ).
  const [kilitliDersler, setKilitliDersler] = useState<Record<KitapcikTuru, Set<string>>>(() => ({
    A: new Set(),
    B: new Set(),
    C: new Set(),
    D: new Set(),
  }));

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

    // State'i temizle ve kilitle
    setDersCevaplari(prev => ({ ...prev, [dersKodu]: '' }));
    
    // Tam cevap girildiyse (aktif kitapçık için) kilitle
    if (temizCevaplar.length >= ders.soruSayisi) {
      setKilitliDersler(prev => ({
        ...prev,
        [aktifKitapcik]: new Set([...prev[aktifKitapcik], dersKodu]),
      }));
    }
    
    console.log(`✅ ${ders.ad} için ${temizCevaplar.length} cevap uygulandı ve kilitlendi`);
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
  // SÜRÜKLE-BIRAK DERS SIRALAMASI
  // ═══════════════════════════════════════════════════════════════════════════
  const handleDersDragStart = useCallback((dersKodu: string) => {
    setDraggedDers(dersKodu);
  }, []);

  const handleDersDragOver = useCallback((e: React.DragEvent, dersKodu: string) => {
    e.preventDefault();
    if (draggedDers && draggedDers !== dersKodu) {
      setDragOverDers(dersKodu);
    }
  }, [draggedDers]);

  const handleDersDrop = useCallback((hedefDersKodu: string) => {
    if (!draggedDers || draggedDers === hedefDersKodu) {
      setDraggedDers(null);
      setDragOverDers(null);
      return;
    }

    setDersSirasi(prev => {
      const yeniSira = [...prev];
      const kaynakIndex = yeniSira.indexOf(draggedDers);
      const hedefIndex = yeniSira.indexOf(hedefDersKodu);
      
      // Swap
      yeniSira.splice(kaynakIndex, 1);
      yeniSira.splice(hedefIndex, 0, draggedDers);
      
      return yeniSira;
    });

    setDraggedDers(null);
    setDragOverDers(null);
  }, [draggedDers]);

  const handleDersDragEnd = useCallback(() => {
    setDraggedDers(null);
    setDragOverDers(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TOPLU KAZANIM YAPIŞTIRMA (Excel gibi)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTopluKazanimYapistir = useCallback((dersKodu: string, yapistrilanMetin: string) => {
    const ders = LGS_DERSLER.find(d => d.kod === dersKodu);
    if (!ders) return;

    // Satırları ayır
    const satirlar = yapistrilanMetin.trim().split('\n');
    
    // Dersin başlangıç index'ini bul
    let baslangicIndex = 0;
    for (const d of LGS_DERSLER) {
      if (d.kod === dersKodu) break;
      baslangicIndex += d.soruSayisi;
    }

    // Kazanımları uygula
    setKitapcikVerileri(prev => {
      const yeniSorular = [...prev[aktifKitapcik]];
      
      satirlar.forEach((satir, idx) => {
        if (idx >= ders.soruSayisi) return;
        
        const parcalar = satir.split('\t');
        const soruIndex = baslangicIndex + idx;
        
        if (yeniSorular[soruIndex]) {
          // Format: KazanımKodu [TAB] KazanımMetni veya sadece KazanımKodu
          const kazanimKodu = parcalar[0]?.trim() || '';
          const kazanimMetni = parcalar[1]?.trim() || parcalar[0]?.trim() || '';
          
          yeniSorular[soruIndex] = {
            ...yeniSorular[soruIndex],
            kazanimKodu,
            kazanimMetni
          };
        }
      });
      
      return { ...prev, [aktifKitapcik]: yeniSorular };
    });

    console.log(`✅ ${ders.ad} için ${satirlar.length} kazanım uygulandı`);
  }, [aktifKitapcik]);

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
        {/* KİTAPÇIK SEÇİCİ - Hızlı Tablo İçin */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-indigo-700">📚 Kitapçık Seç:</span>
            <div className="flex items-center gap-1">
              {KITAPCIK_TURLERI.map(kit => {
                const kitDoluluk = kitapcikVerileri[kit].filter(s => s.cevap).length;
                const isTam = kitDoluluk === 90;
                
                return (
                  <button
                    key={kit}
                    onClick={() => {
                      setAktifKitapcik(kit);
                      // ❗ Kilitler kitapçık bazlı tutulur, burada sıfırlanmaz
                    }}
                    className={`relative w-14 h-10 rounded-lg font-bold text-lg transition-all ${
                      aktifKitapcik === kit
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300 scale-105 ring-2 ring-indigo-400'
                        : isTam
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-400'
                          : kitDoluluk > 0
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                            : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
                    }`}
                  >
                    {kit}
                    {/* Doluluk göstergesi */}
                    {isTam && aktifKitapcik !== kit && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </span>
                    )}
                    {!isTam && kitDoluluk > 0 && aktifKitapcik !== kit && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-amber-500 text-white px-1 rounded">
                        {kitDoluluk}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Aktif kitapçık bilgisi */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-indigo-600">
              Aktif: <span className="font-bold text-indigo-800">Kitapçık {aktifKitapcik}</span>
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              kitapcikVerileri[aktifKitapcik].filter(s => s.cevap).length === 90
                ? 'bg-green-100 text-green-700'
                : kitapcikVerileri[aktifKitapcik].filter(s => s.cevap).length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {kitapcikVerileri[aktifKitapcik].filter(s => s.cevap).length}/90 cevap
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" />
            <h3 className="font-bold text-indigo-800">⚡ Hızlı Ders Bazlı Cevap Girişi - Kitapçık {aktifKitapcik}</h3>
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
              {siraliDersler.map(ders => {
                const doluluk = getDersCevapSayisi(ders.kod);
                const yuzde = Math.round((doluluk / ders.soruSayisi) * 100);
                const isKilitli = kilitliDersler[aktifKitapcik].has(ders.kod);
                const isTam = doluluk === ders.soruSayisi;
                
                // Girilen karakter sayısı (sadece A-E)
                const girilenKarakter = (dersCevaplari[ders.kod] || '').replace(/[^ABCDE]/g, '').length;
                const isEksik = girilenKarakter > 0 && girilenKarakter < ders.soruSayisi;
                const isFazla = girilenKarakter > ders.soruSayisi;
                
                return (
                  <tr 
                    key={ders.kod} 
                    className={`border-t transition-all ${
                      isKilitli 
                        ? 'bg-green-50 border-green-200' 
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ders.icon}</span>
                        <span className="font-medium text-sm" style={{ color: ders.renk }}>
                          {ders.ad.split(' ')[0]}
                        </span>
                        {/* Kilit ikonu */}
                        {isKilitli && (
                          <span className="text-green-600" title="Kilitli - Çift tıkla ile aç">🔒</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-sm font-bold" style={{ color: ders.renk }}>
                      {ders.soruSayisi}
                    </td>
                    <td className="px-3 py-2">
                      {isKilitli ? (
                        // KİLİTLİ DURUM - Çift tıkla ile aç
                        <div 
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-lg cursor-pointer"
                          onDoubleClick={() => {
                            setKilitliDersler(prev => {
                              const yeniSet = new Set(prev[aktifKitapcik]);
                              yeniSet.delete(ders.kod);
                              return { ...prev, [aktifKitapcik]: yeniSet };
                            });
                          }}
                          title="Çift tıkla ile kilidi aç"
                        >
                          <Check size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            ✓ {ders.soruSayisi} cevap kaydedildi
                          </span>
                          <span className="text-xs text-green-600 ml-auto">Çift tıkla → Düzenle</span>
                        </div>
                      ) : (
                        // GİRİŞ DURUMU
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={dersCevaplari[ders.kod] || ''}
                              onChange={(e) => {
                                const deger = e.target.value.toUpperCase();
                                setDersCevaplari(prev => ({ ...prev, [ders.kod]: deger }));
                                
                                // Tam sayıya ulaştığında otomatik uygula
                                const temizDeger = deger.replace(/[^ABCDE]/g, '');
                                if (temizDeger.length === ders.soruSayisi) {
                                  handleDersCevapYapistir(ders.kod, deger);
                                }
                              }}
                              placeholder={`${ders.soruSayisi} cevap girin (A-E)...`}
                              maxLength={ders.soruSayisi * 3}
                              className={`w-full px-3 py-1.5 pr-20 border rounded-lg text-sm font-mono uppercase focus:ring-2 transition-all ${
                                isEksik 
                                  ? 'border-amber-400 bg-amber-50 focus:ring-amber-500' 
                                  : isFazla 
                                    ? 'border-red-400 bg-red-50 focus:ring-red-500'
                                    : girilenKarakter === ders.soruSayisi
                                      ? 'border-green-400 bg-green-50 focus:ring-green-500'
                                      : 'border-gray-200 focus:ring-indigo-500'
                              }`}
                            />
                            {/* Karakter Sayacı - Daha belirgin */}
                            <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg shadow-sm ${
                              girilenKarakter === 0
                                ? 'bg-gray-300 text-gray-600'
                                : girilenKarakter === ders.soruSayisi
                                  ? 'bg-green-500 text-white ring-2 ring-green-300'
                                  : isEksik
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-red-500 text-white'
                            }`}>
                              {girilenKarakter}/{ders.soruSayisi}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDersCevapYapistir(ders.kod, dersCevaplari[ders.kod] || '')}
                            disabled={girilenKarakter !== ders.soruSayisi}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              girilenKarakter === ders.soruSayisi
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={girilenKarakter === ders.soruSayisi ? 'Kaydet ve Kilitle' : `${ders.soruSayisi - girilenKarakter} karakter daha gerekli`}
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isTam || isKilitli ? (
                          // TAM - Yeşil Tik
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                            <Check size={14} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700">TAMAM</span>
                          </div>
                        ) : (
                          // İlerleme Çubuğu
                          <>
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all"
                                style={{ width: `${yuzde}%`, backgroundColor: ders.renk }}
                              />
                            </div>
                            <span className="text-xs font-medium" style={{ color: ders.renk }}>
                              {doluluk}/{ders.soruSayisi}
                            </span>
                          </>
                        )}
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

        {/* ✅ Kitapçık bazlı "Kaydet" butonu (A bittiğinde A, B bittiğinde B) */}
        {(() => {
          const aktifDoluluk = kitapcikVerileri[aktifKitapcik].filter(s => s.cevap).length;
          const aktifTam = aktifDoluluk === 90;
          if (!aktifTam) return null;

          return (
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => {
                  // Bu kitapçık için tüm dersleri kilitle (UI stabil kalsın)
                  setKilitliDersler(prev => ({
                    ...prev,
                    [aktifKitapcik]: new Set(['TUR', 'INK', 'DIN', 'ING', 'MAT', 'FEN']),
                  }));
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                title={`Kitapçık ${aktifKitapcik} tamamlandı - kilitle`}
              >
                <Check size={18} />
                Kitapçık {aktifKitapcik} Kaydet
              </button>
            </div>
          );
        })()}
      </div>

      {/* DERS BAZLI DETAYLI CEVAP GİRİŞİ - SÜRÜKLE-BIRAK DESTEKLİ */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <GripVertical size={14} />
            <span>Dersleri sürükle-bırak ile yeniden sıralayabilirsiniz</span>
          </div>
          <button
            onClick={() => setDersSirasi(['TUR', 'INK', 'DIN', 'ING', 'MAT', 'FEN'])}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Sıralamayı Sıfırla
          </button>
        </div>
        
        {siraliDersler.map((ders, dersIdx) => {
          const dersSorulari = kitapcikVerileri[aktifKitapcik].filter(s => s.dersKodu === ders.kod);
          const doluSoru = dersSorulari.filter(s => s.cevap).length;
          const isAcik = acikDersler.includes(ders.kod);
          const isDragging = draggedDers === ders.kod;
          const isDragOver = dragOverDers === ders.kod;

          return (
            <div 
              key={ders.kod} 
              className={`mb-3 transition-all ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver ? 'ring-2 ring-indigo-400 ring-offset-2 rounded-xl' : ''}`}
              draggable
              onDragStart={() => handleDersDragStart(ders.kod)}
              onDragOver={(e) => handleDersDragOver(e, ders.kod)}
              onDrop={() => handleDersDrop(ders.kod)}
              onDragEnd={handleDersDragEnd}
            >
              {/* Ders Başlığı - Tıkla Aç/Kapa + Sürükle */}
              <div
                onClick={() => toggleDers(ders.kod)}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-gray-50 cursor-pointer select-none"
                style={{ backgroundColor: `${ders.renk}10` }}
              >
                <div className="flex items-center gap-3">
                  {/* Sürükleme Tutacağı - Sadece bu sürüklenebilir */}
                  <div 
                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1"
                    onClick={(e) => e.stopPropagation()} // Sürüklerken aç/kapa yapmasın
                  >
                    <GripVertical size={20} />
                  </div>
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
                  <div className="transition-transform" style={{ transform: isAcik ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>

              {/* Sorular */}
              <AnimatePresence>
                {isAcik && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1 pl-4"
                  >
                    {/* 🚀 HIZLI GİRİŞ ALANLARI - Cevap + Kazanım */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg mb-3" style={{ backgroundColor: `${ders.renk}08` }}>
                      {/* Cevap Yapıştır */}
                      <div>
                        <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: ders.renk }}>
                          <ClipboardPaste size={12} />
                          Cevapları Yapıştır ({ders.soruSayisi} karakter)
                        </label>
                        <input
                          type="text"
                          placeholder={`ABCD... (${ders.soruSayisi} adet)`}
                          maxLength={ders.soruSayisi + 5}
                          className="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:ring-2"
                          style={{ borderColor: ders.renk + '40' }}
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
                      </div>
                      
                      {/* Kazanım Toplu Yapıştır */}
                      <div>
                        <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: ders.renk }}>
                          <BookOpen size={12} />
                          Kazanımları Yapıştır (Excel'den satır satır)
                        </label>
                        <textarea
                          placeholder={`KazanımKodu [TAB] KazanımMetni\nT.8.3.5 [TAB] Metni anlama\n...`}
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 resize-none"
                          style={{ borderColor: ders.renk + '40' }}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text');
                            handleTopluKazanimYapistir(ders.kod, text);
                            (e.target as HTMLTextAreaElement).value = '';
                            e.preventDefault();
                          }}
                        />
                      </div>
                    </div>

                    {/* Başlık Satırı - GENİŞLETİLMİŞ */}
                    <div className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <div className="w-10 text-center">No</div>
                      <div className="w-32">Cevap</div>
                      <div className="w-28">Kazanım Kodu</div>
                      <div className="flex-1">Kazanım Metni (Açıklama)</div>
                    </div>

                    {dersSorulari.map(soru => (
                      <div 
                        key={soru.globalSoruNo}
                        className="flex items-center gap-2 px-2 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {/* Soru No */}
                        <div className="w-10 text-center text-sm font-bold text-gray-700">
                          {soru.soruNo}
                        </div>

                        {/* Cevap Butonları */}
                        <div className="w-32 flex gap-1">
                          {(['A', 'B', 'C', 'D', 'E'] as CevapSecenegi[]).map(c => (
                            <button
                              key={c}
                              onClick={() => setCevap(soru.globalSoruNo, soru.cevap === c ? null : c)}
                              className={`w-6 h-6 rounded font-bold text-xs transition-all ${
                                soru.cevap === c
                                  ? 'text-white shadow-md scale-110'
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
                        <div className="w-28">
                          <input
                            type="text"
                            value={soru.kazanimKodu}
                            onChange={(e) => setKazanim(soru.globalSoruNo, e.target.value, soru.kazanimMetni)}
                            placeholder="T.8.3.5"
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>

                        {/* Kazanım Metni - GENİŞLETİLMİŞ */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={soru.kazanimMetni}
                            onChange={(e) => setKazanim(soru.globalSoruNo, soru.kazanimKodu, e.target.value)}
                            placeholder="Kazanım açıklaması buraya yazılır..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

      {/* FOOTER - KİTAPÇIK KAYDET + DEVAM ET BUTONLARI */}
      {(() => {
        // Tüm kitapçıkların doluluk durumları
        const kitapcikDoluluklari = {
          A: kitapcikVerileri['A'].filter(s => s.cevap).length,
          B: kitapcikVerileri['B'].filter(s => s.cevap).length,
          C: kitapcikVerileri['C'].filter(s => s.cevap).length,
          D: kitapcikVerileri['D'].filter(s => s.cevap).length,
        };
        
        const mevcutKitapcikTam = kitapcikDoluluklari[aktifKitapcik] === 90;
        const tumKitapciklerTam = kitapcikDoluluklari.A === 90 && kitapcikDoluluklari.B === 90 && 
                                   kitapcikDoluluklari.C === 90 && kitapcikDoluluklari.D === 90;
        
        // Sonraki kitapçık
        const sonrakiKitapcikMap: Record<KitapcikTuru, KitapcikTuru | null> = {
          'A': 'B', 'B': 'C', 'C': 'D', 'D': null
        };
        const sonrakiKitapcik = sonrakiKitapcikMap[aktifKitapcik];
        
        // En az bir kitapçık tam mı?
        const enAzBirKitapcikTam = kitapcikDoluluklari.A === 90 || kitapcikDoluluklari.B === 90 || 
                                    kitapcikDoluluklari.C === 90 || kitapcikDoluluklari.D === 90;

        // Kaydet fonksiyonu
        const handleKaydet = () => {
          console.log('🔵 Manuel Cevap Anahtarı - Kaydet butonuna tıklandı');
          
          const sorularA = kitapcikVerileri['A'];
          const sorularB = kitapcikVerileri['B'];
          const sorularC = kitapcikVerileri['C'];
          const sorularD = kitapcikVerileri['D'];

          const validCevap = (c: string | null): 'A' | 'B' | 'C' | 'D' | 'E' | undefined => {
            if (c === 'A' || c === 'B' || c === 'C' || c === 'D' || c === 'E') return c;
            return undefined;
          };

          const cevapAnahtari: CevapAnahtariSatir[] = [];
          
          sorularA.forEach((soru, originalIdx) => {
            if (!soru.cevap) return;
            
            const ders = LGS_DERSLER.find(d => d.kod === soru.dersKodu);
            const cevapA = validCevap(soru.cevap);
            const cevapB = validCevap(sorularB[originalIdx]?.cevap || null);
            const cevapC = validCevap(sorularC[originalIdx]?.cevap || null);
            const cevapD = validCevap(sorularD[originalIdx]?.cevap || null);
            
            cevapAnahtari.push({
              soruNo: soru.globalSoruNo,
              dogruCevap: cevapA || 'A',
              dersKodu: soru.dersKodu,
              dersAdi: ders?.ad || soru.dersKodu,
              kazanimKodu: soru.kazanimKodu || undefined,
              kazanimMetni: soru.kazanimMetni || undefined,
              kitapcikCevaplari: { A: cevapA, B: cevapB, C: cevapC, D: cevapD },
            });
          });
          
          console.log('✅ Cevap anahtarı oluşturuldu:', cevapAnahtari.length, 'soru');
          
          if (onSave) {
            onSave(cevapAnahtari);
            console.log('✅ onSave callback çağrıldı');
          }
        };

        return (
          <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-emerald-50">
            {/* Kitapçık Durumları */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {KITAPCIK_TURLERI.map(kit => (
                  <div 
                    key={kit}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                      kitapcikDoluluklari[kit] === 90
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                        : kitapcikDoluluklari[kit] > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span className="font-bold">{kit}</span>
                    {kitapcikDoluluklari[kit] === 90 ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <span className="text-xs">{kitapcikDoluluklari[kit]}/90</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                Toplam: <span className="font-bold text-emerald-600">
                  {kitapcikDoluluklari.A + kitapcikDoluluklari.B + kitapcikDoluluklari.C + kitapcikDoluluklari.D}
                </span> / 360 cevap
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {mevcutKitapcikTam ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <Check size={16} />
                    Kitapçık {aktifKitapcik} tamamlandı!
                  </span>
                ) : (
                  <span>
                    Kitapçık {aktifKitapcik}: <span className="font-medium">{kitapcikDoluluklari[aktifKitapcik]}/90</span> cevap
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Kaydet ve Sonraki Kitapçığa Geç Butonu */}
                {mevcutKitapcikTam && sonrakiKitapcik && (
                  <button
                    onClick={() => {
                      setAktifKitapcik(sonrakiKitapcik);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                  >
                    <span>Kaydet → {sonrakiKitapcik} Kitapçığına Geç</span>
                    <ChevronRight size={18} />
                  </button>
                )}

                {/* Kaydet ve Devam Et Butonu - Herhangi bir cevap girildiğinde aktif */}
                {(() => {
                  const toplamCevap = kitapcikDoluluklari.A + kitapcikDoluluklari.B + kitapcikDoluluklari.C + kitapcikDoluluklari.D;
                  const enAzBirCevapVar = toplamCevap > 0;
                  
                  return (
                    <button
                      onClick={handleKaydet}
                      disabled={!enAzBirCevapVar}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg ${
                        enAzBirCevapVar
                          ? tumKitapciklerTam
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 ring-2 ring-emerald-300'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Check size={18} />
                      {tumKitapciklerTam 
                        ? 'Tümü Tamam! Kaydet ve Devam Et' 
                        : `Kaydet ve Devam Et (${toplamCevap} cevap)`}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

