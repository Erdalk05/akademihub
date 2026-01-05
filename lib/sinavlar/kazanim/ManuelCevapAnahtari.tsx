'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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

import { SINAV_KONFIGURASYONLARI, type SinavTuru } from './sinavKonfigurasyonlari';

type KitapcikTuru = 'A' | 'B' | 'C' | 'D';
type CevapSecenegi = 'A' | 'B' | 'C' | 'D' | 'E' | null;

function hashToHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

function dersColor(code: string) {
  const hue = hashToHue(code);
  return `hsl(${hue} 70% 45%)`;
}

function getKonfig(examType?: string) {
  const key = String(examType || 'LGS').toUpperCase() as SinavTuru;
  return (SINAV_KONFIGURASYONLARI as any)[key] || (SINAV_KONFIGURASYONLARI as any).LGS;
}

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

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CEVAP ANAHTARI KAYIT YAPISI
 * ═══════════════════════════════════════════════════════════════════════════════
 * Cevap anahtarı ile birlikte ders sırası da kaydedilir.
 * Bu sayede kullanıcının sürükle-bırak ile belirlediği ders sırası korunur.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export interface CevapAnahtariWithOrder {
  cevapAnahtari: CevapAnahtariSatir[];
  dersSirasi: string[];
}

interface ManuelCevapAnahtariProps {
  organizationId: string;
  examId: string;
  examType?: string; // LGS, TYT, AYT, DENEME, AYT_SAY, AYT_SOS vb.
  /** Cevap anahtarı + ders sırası birlikte kaydedilir */
  onSave?: (data: CevapAnahtariWithOrder) => void;
  // ✅ 0-soru kaydı sadece kullanıcı "Temizle" dediğinde olmalı
  onClear?: () => void;
  initialData?: CevapAnahtariSatir[];
  /** Ders sırası - kaydedilmiş sıra varsa onu kullan */
  initialDersSirasi?: string[];
}

type GirisYontemi = 'yapistir' | 'surukle' | 'yukle';

export default function ManuelCevapAnahtari({
  organizationId,
  examId,
  examType,
  onSave,
  onClear,
  initialData,
  initialDersSirasi,
}: ManuelCevapAnahtariProps) {
  const konfig = getKonfig(examType);
  const dersler = (konfig?.dersDagilimi || []).map((d: any) => ({
    kod: String(d.dersKodu || d.code || '').toUpperCase(),
    ad: String(d.dersAdi || d.name || d.dersKodu || ''),
    soruSayisi: Number(d.soruSayisi || d.question_count || 0) || 0,
    renk: dersColor(String(d.dersKodu || d.code || 'DERS')),
  })).filter((d: any) => d.kod && d.soruSayisi > 0);

  const kitapcikTurleri = (Array.isArray(konfig?.kitapcikTurleri) ? konfig.kitapcikTurleri : [])
    .map((x: any) => String(x).toUpperCase())
    .filter((x: string) => x === 'A' || x === 'B' || x === 'C' || x === 'D') as KitapcikTuru[];
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE YÖNETİMİ
  // ═══════════════════════════════════════════════════════════════════════════
  const kitapcikTurleriSafe = (kitapcikTurleri.length ? kitapcikTurleri : (['A'] as KitapcikTuru[]));
  const [aktifKitapcik, setAktifKitapcik] = useState<KitapcikTuru>(kitapcikTurleriSafe[0] || 'A');
  const [girisYontemi, setGirisYontemi] = useState<GirisYontemi>('yapistir');
  const [acikDersler, setAcikDersler] = useState<string[]>(dersler[0]?.kod ? [dersler[0].kod] : []);
  const [yapistirMetni, setYapistirMetni] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSentSigRef = useRef<string>('');
  const unlockedWarnedRef = useRef<Set<string>>(new Set());
  
  // 🔀 DERS SIRALAMASI - Sürükle-Bırak için
  // ✅ initialDersSirasi varsa onu kullan, yoksa sınav konfigürasyonundan türet
  const [dersSirasi, setDersSirasi] = useState<string[]>(
    initialDersSirasi && initialDersSirasi.length > 0 
      ? initialDersSirasi 
      : dersler.map((d) => d.kod)
  );
  const [draggedDers, setDraggedDers] = useState<string | null>(null);
  const [dragOverDers, setDragOverDers] = useState<string | null>(null);
  
  // Sıralanmış dersler
  const siraliDersler = dersSirasi.map(kod => dersler.find(d => d.kod === kod)!).filter(Boolean);

  // Tüm kitapçıklar için veri
  const [kitapcikVerileri, setKitapcikVerileri] = useState<Record<KitapcikTuru, SoruCevap[]>>(() => {
    const initial = {} as Record<KitapcikTuru, SoruCevap[]>;
    kitapcikTurleriSafe.forEach((kit) => {
      let globalNo = 0;
      const sorular: SoruCevap[] = [];
      dersler.forEach((ders) => {
        for (let i = 1; i <= ders.soruSayisi; i++) {
          globalNo++;
          sorular.push({
            soruNo: i,
            globalSoruNo: globalNo,
            dersKodu: ders.kod,
            cevap: null,
            kazanimKodu: '',
            kazanimMetni: '',
          });
        }
      });
      initial[kit] = sorular;
    });
    return initial;
  });

  // ✅ INITIAL DERS SIRASI → kaydedilmiş sıra varsa onu kullan
  // ⚠️ KRİTİK: Deep comparison yapılmalı, aksi halde sonsuz döngü oluşur!
  const initialDersSirasiRef = useRef<string[]>([]);
  useEffect(() => {
    if (!initialDersSirasi || initialDersSirasi.length === 0) return;
    
    // Deep comparison - aynı sıra ise güncelleme yapma
    const isSame = initialDersSirasi.length === initialDersSirasiRef.current.length &&
      initialDersSirasi.every((v, i) => v === initialDersSirasiRef.current[i]);
    
    if (isSame) return;
    
    console.log('📋 Ders sırası yükleniyor:', initialDersSirasi);
    initialDersSirasiRef.current = [...initialDersSirasi];
    setDersSirasi(initialDersSirasi);
  }, [initialDersSirasi]);

  const baseKit = (kitapcikTurleriSafe[0] || 'A') as KitapcikTuru;

  const applyAnswerKeyRows = useCallback(
    (rows: CevapAnahtariSatir[]) => {
      if (!Array.isArray(rows) || rows.length === 0) return;

      setKitapcikVerileri((prev) => {
        const next = {} as Record<KitapcikTuru, SoruCevap[]>;
        kitapcikTurleriSafe.forEach((k) => {
          next[k] = (prev[k] || []).map((s) => ({ ...s, cevap: null, kazanimKodu: '', kazanimMetni: '' }));
        });

        // globalSoruNo -> idx map (base kit üzerinden)
        const base = next[baseKit] || [];
        const idxByGlobalNo = new Map<number, number>();
        base.forEach((s, idx) => idxByGlobalNo.set(Number(s.globalSoruNo), idx));

        for (const row of rows) {
          const gNo = Number(row?.soruNo) || 0;
          const idx = idxByGlobalNo.get(gNo);
          if (idx == null) continue;

          // Kazanım bilgisi base kit'e yazılır (ortak bilgi)
          const baseRow = next[baseKit]?.[idx];
          if (baseRow) {
            next[baseKit][idx] = {
              ...baseRow,
              cevap: (row.kitapcikCevaplari as any)?.[baseKit] || baseRow.cevap,
              kazanimKodu: row.kazanimKodu || baseRow.kazanimKodu,
              kazanimMetni: row.kazanimMetni || baseRow.kazanimMetni,
            };
          }

          // Kitapçık cevapları
          for (const k of kitapcikTurleriSafe) {
            const target = next[k]?.[idx];
            if (!target) continue;
            const c = (row.kitapcikCevaplari as any)?.[k];
            next[k][idx] = { ...target, cevap: c || target.cevap };
          }
        }

        return next;
      });
    },
    [baseKit, kitapcikTurleriSafe],
  );

  const [apiLoaded, setApiLoaded] = useState(false);
  const [hasApiData, setHasApiData] = useState(false);

  // ✅ Supabase-first: cevap anahtarını API'den yükle
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setApiLoaded(false);
      setHasApiData(false);
      try {
        const res = await fetch(
          `/api/exam-intelligence/answer-keys?organizationId=${encodeURIComponent(organizationId)}&examId=${encodeURIComponent(examId)}`,
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => null);
        const rows = json?.ok ? json?.data?.answerKey : null;
        const order = json?.ok ? json?.data?.dersSirasi : null;
        if (cancelled) return;

        if (Array.isArray(order) && order.length > 0) setDersSirasi(order.map((x: any) => String(x)));
        if (Array.isArray(rows) && rows.length > 0) {
          setHasApiData(true);
          applyAnswerKeyRows(rows as CevapAnahtariSatir[]);
        }
      } catch (e) {
        // ignore (UI fallback devreye girebilir)
      } finally {
        if (!cancelled) setApiLoaded(true);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [organizationId, examId, applyAnswerKeyRows]);

  // ✅ initialData sadece ilk render fallback'i (API boşsa)
  const initialFallbackAppliedRef = useRef(false);
  useEffect(() => {
    if (!apiLoaded) return;
    if (hasApiData) return;
    if (initialFallbackAppliedRef.current) return;
    if (!initialData || initialData.length === 0) return;
    initialFallbackAppliedRef.current = true;
    applyAnswerKeyRows(initialData);
  }, [apiLoaded, hasApiData, initialData, applyAnswerKeyRows]);

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

    // ✅ Kullanıcı “Temizle” demedikçe kilit/cevap kaybolmasın; temizle dediğinde hepsini sıfırla
    setKilitliDersler(prev => ({ ...prev, [aktifKitapcik]: new Set() }));
    setDersCevaplari(prev => ({ ...prev, [aktifKitapcik]: { ...emptyDersDraft } }));
    setHizli90Metin(prev => ({ ...prev, [aktifKitapcik]: '' }));

    // ✅ Supabase-first: cevap anahtarını DB'den sil
    void fetch(
      `/api/exam-intelligence/answer-keys?organizationId=${encodeURIComponent(organizationId)}&examId=${encodeURIComponent(examId)}`,
      { method: 'DELETE', cache: 'no-store' },
    );

    // ✅ Wizard state'i sadece kullanıcı "Temizle" dediğinde temizle
    lastSentSigRef.current = '';
    if (onClear) {
      onClear();
    } else {
      // Geriye dönük uyumluluk: onClear yoksa yine de wizard'ı sıfırla
      onSave?.({ cevapAnahtari: [], dersSirasi: dersSirasi });
    }
  }, [aktifKitapcik, onClear, onSave, dersSirasi, organizationId, examId, emptyDersDraft]);

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
  const toplamSoru = dersler.reduce((s, d) => s + (Number(d.soruSayisi) || 0), 0);
  const stats = {
    doluSoru: kitapcikVerileri[aktifKitapcik].filter(s => s.cevap).length,
    toplamSoru: toplamSoru,
    kazanimli: kitapcikVerileri[aktifKitapcik].filter(s => s.kazanimKodu).length
  };

  // Ders bazlı cevap taslağı (kitapçık bazlı)
  const emptyDersDraft = Object.fromEntries(dersler.map((d) => [d.kod, ''])) as Record<string, string>;
  const [dersCevaplari, setDersCevaplari] = useState<Record<KitapcikTuru, Record<string, string>>>(() => {
    const out = {} as Record<KitapcikTuru, Record<string, string>>;
    kitapcikTurleriSafe.forEach((k) => {
      out[k] = { ...emptyDersDraft };
    });
    return out;
  });

  // 90 soru hızlı yapıştır (kitapçık bazlı)
  const [hizli90Metin, setHizli90Metin] = useState<Record<KitapcikTuru, string>>(() => {
    const out = {} as Record<KitapcikTuru, string>;
    kitapcikTurleriSafe.forEach((k) => (out[k] = ''));
    return out;
  });
  
  // 🔒 KİLİT SİSTEMİ (KİTAPÇIK BAZLI)
  // Kritik: Kilit tek Set olursa A'da kilitlenen dersler B'de de kilitli görünür
  // ve B cevap anahtarı girilemez → B öğrencileri A anahtarıyla değerlendirilir (YANLIŞ).
  const [kilitliDersler, setKilitliDersler] = useState<Record<KitapcikTuru, Set<string>>>(() => {
    const out = {} as Record<KitapcikTuru, Set<string>>;
    kitapcikTurleriSafe.forEach((k) => (out[k] = new Set()));
    return out;
  });

  // ✅ Tek yerden cevap anahtarı üret (wizard'a kaydetmek için)
  const buildCevapAnahtari = useCallback((state?: Record<KitapcikTuru, SoruCevap[]>): CevapAnahtariSatir[] => {
    const src = state || kitapcikVerileri;
    const baseKit = (kitapcikTurleriSafe[0] || 'A') as KitapcikTuru;
    const baseSorular = src[baseKit] || [];
    const byKit = (kitapcikTurleriSafe || []).reduce((acc, k) => {
      acc[k] = src[k] || [];
      return acc;
    }, {} as Record<KitapcikTuru, SoruCevap[]>);

    const validCevap = (c: string | null): 'A' | 'B' | 'C' | 'D' | 'E' | undefined => {
      if (c === 'A' || c === 'B' || c === 'C' || c === 'D' || c === 'E') return c;
      return undefined;
    };

    const cevapAnahtari: CevapAnahtariSatir[] = [];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // KRİTİK FIX: HERHANGİ BİR KİTAPÇIKTA CEVAP VARSA KAYDET
    // Eski hata: A boşsa B de atlanıyordu!
    // Yeni: A, B, C, D'den herhangi birinde cevap varsa kaydet
    // ═══════════════════════════════════════════════════════════════════════════
    baseSorular.forEach((soru, originalIdx) => {
      const cevapByKit: Partial<Record<KitapcikTuru, 'A' | 'B' | 'C' | 'D' | 'E'>> = {};
      for (const k of kitapcikTurleriSafe) {
        const c = validCevap(byKit[k]?.[originalIdx]?.cevap || null);
        if (c) cevapByKit[k] = c;
      }

      // Herhangi bir kitapçıkta cevap varsa kaydet
      const hasCevap = Object.values(cevapByKit).find(Boolean);
      if (!hasCevap) return;
      
      const ders = dersler.find(d => d.kod === soru.dersKodu);
      const dogru = (cevapByKit['A'] || cevapByKit['B'] || cevapByKit['C'] || cevapByKit['D'] || hasCevap || 'A') as any;

      cevapAnahtari.push({
        // KRİTİK: soruNo sabit/global olmalı. Dersleri sürükle-bırak yapmak soru numarasını ASLA değiştirmemeli.
        soruNo: soru.globalSoruNo,
        dogruCevap: dogru, // ilk bulunan cevabı varsayılan yap
        dersKodu: soru.dersKodu,
        dersAdi: ders?.ad || soru.dersKodu,
        kazanimKodu: soru.kazanimKodu || undefined,
        kazanimMetni: soru.kazanimMetni || undefined,
        kitapcikCevaplari: {
          A: cevapByKit['A'],
          B: cevapByKit['B'],
          C: cevapByKit['C'],
          D: cevapByKit['D'],
        },
      });
    });

    // Soru numarası stabil kalsın diye global soruNo’ya göre sırala (1..90).
    // Böylece Step ileri/geri yapınca initialData yüklemesi cevapları "dans ettirmez".
    cevapAnahtari.sort((a, b) => (a.soruNo ?? 0) - (b.soruNo ?? 0));
    return cevapAnahtari;
  }, [kitapcikVerileri]);

  const computeSig = useCallback((data: CevapAnahtariSatir[], order: string[]) => {
    // Hafif/Deterministik imza (aynı veri tekrar tekrar wizard'a gitmesin)
    let hash = 2166136261; // FNV-1a başlangıç
    const pushStr = (s: string) => {
      for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
    };

    pushStr(String(data.length));
    // ✅ KRİTİK: Ders sırası değişince de wizard'a kaydetmeliyiz.
    // Aksi halde kullanıcı sürükle-bırak yapıp ileri/geri gidince sıra eski haline döner.
    pushStr(`order:${(order || []).join(',')}`);
    // ✅ KRİTİK: İlk 30 satırla imza üretmek B kitapçığında (DIN/ING/MAT/FEN) güncellemelerini kaçırıyordu.
    // LGS 90 satır → 90 iterasyon maliyeti düşük; tüm satırları dahil ediyoruz.
    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      pushStr(String(r.soruNo));
      pushStr(String(r.dogruCevap || ''));
      pushStr(String(r.kitapcikCevaplari?.A || ''));
      pushStr(String(r.kitapcikCevaplari?.B || ''));
      pushStr(String(r.kitapcikCevaplari?.C || ''));
      pushStr(String(r.kitapcikCevaplari?.D || ''));
    }
    return `k:${data.length}-h:${hash >>> 0}`;
  }, []);

  const persistAnswerKeyToApi = useCallback(
    async (data: CevapAnahtariSatir[], reason: string) => {
      try {
        await fetch('/api/exam-intelligence/answer-keys', {
          method: 'PUT',
          cache: 'no-store',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({
            organizationId,
            examId,
            examType: examType || null,
            answerKey: data,
            dersSirasi,
            reason,
          }),
        });
      } catch {
        // ignore
      }
    },
    [organizationId, examId, examType, dersSirasi],
  );

  const sendToWizard = useCallback(
    (data: CevapAnahtariSatir[], reason: string) => {
      if (!onSave) {
        console.warn('⚠️ onSave prop tanımlı değil!');
        toast.error('Kaydetme başarısız: onSave tanımlı değil');
        return;
      }

      // ✅ 0-soru kaydı sadece Temizle ile olmalı
      if (data.length === 0) {
        console.warn(`⚠️ Manuel Cevap Anahtarı: 0 soru üretildi (reason=${reason}). onSave çağrılmadı.`);
        return;
      }

      const sig = computeSig(data, dersSirasi);
      if (lastSentSigRef.current === sig) {
        // Aynı veri tekrar gönderilmesin
        return;
      }
      lastSentSigRef.current = sig;

      // ═══════════════════════════════════════════════════════════════════════════
      // ✅ KRİTİK: Cevap anahtarı ile birlikte DERS SIRASI da kaydedilir
      // ═══════════════════════════════════════════════════════════════════════════
      const payload: CevapAnahtariWithOrder = {
        cevapAnahtari: data,
        dersSirasi: dersSirasi,
      };
      
      onSave(payload);
      void persistAnswerKeyToApi(data, reason);
      console.log(`✅ onSave çağrıldı: ${data.length} soru | dersSirasi=${dersSirasi.join(',')} | reason=${reason} | sig=${sig}`);
    },
    [computeSig, onSave, dersSirasi, persistAnswerKeyToApi],
  );

  // ✅ Ders sırası değişince wizard state'e de yaz (butona basmadan adım değişince kaybolmasın)
  useEffect(() => {
    if (!onSave) return;
    const data = buildCevapAnahtari();
    if (!data || data.length === 0) return;
    // Toastsuz kayıt: sadece state senkronu
    sendToWizard(data, `order_change_${aktifKitapcik}`);
    // Not: sendToWizard kendi dedupe imzası ile spam'i engeller
  }, [dersSirasi]); // intentionally only order changes

  const saveToWizard = useCallback(() => {
    const data = buildCevapAnahtari();
    sendToWizard(data, `manual_button_${aktifKitapcik}`);
    toast.success(`Kaydedildi (${data.length} soru)`);
  }, [aktifKitapcik, buildCevapAnahtari, sendToWizard]);

  const saveToWizardWithState = useCallback(
    (nextState: Record<KitapcikTuru, SoruCevap[]>, toastMsg?: string) => {
      const data = buildCevapAnahtari(nextState);
      sendToWizard(data, `auto_subject_lock_${aktifKitapcik}`);
      toast.success(toastMsg || `Kaydedildi (${data.length} soru)`);
    },
    [aktifKitapcik, buildCevapAnahtari, sendToWizard],
  );

  const dersBaslangicIndex = useCallback((dersKodu: string) => {
    let baslangicIndex = 0;
    for (const d of dersler) {
      if (d.kod === dersKodu) break;
      baslangicIndex += d.soruSayisi;
    }
    return baslangicIndex;
  }, [dersler]);

  const getDersCevapString = useCallback(
    (kit: KitapcikTuru, dersKodu: string) => {
      const ders = dersler.find(d => d.kod === dersKodu);
      if (!ders) return '';
      const start = dersBaslangicIndex(dersKodu);
      return (kitapcikVerileri[kit] || [])
        .slice(start, start + ders.soruSayisi)
        .map(s => (s.cevap ? String(s.cevap) : ''))
        .join('');
    },
    [dersBaslangicIndex, kitapcikVerileri, dersler],
  );

  const syncDraftFromStateForKitapcik = useCallback(
    (kit: KitapcikTuru) => {
      setDersCevaplari(prev => ({
        ...prev,
        [kit]: Object.fromEntries(
          dersler.map((d) => [d.kod, getDersCevapString(kit, d.kod)])
        ) as Record<string, string>,
      }));
    },
    [getDersCevapString, dersler],
  );

  // ❌ sessionStorage kaldırıldı (Supabase-first)

  // Kitapçık değişince ders satırı inputlarını mevcut cevaplardan doldur (boş görünmesin)
  useEffect(() => {
    syncDraftFromStateForKitapcik(aktifKitapcik);
  }, [aktifKitapcik, syncDraftFromStateForKitapcik]);

  // ✅ Güvenlik: Eksik/boş dersler kilitli kalmasın
  // Kullanıcı bazen yanlışlıkla kilitleyebiliyor veya state/şablon yüklemesi sonrası tutarsız kilit oluşabiliyor.
  useEffect(() => {
    const locked = kilitliDersler[aktifKitapcik];
    if (!locked || locked.size === 0) return;

    const toUnlock: string[] = [];
    for (const dersKodu of Array.from(locked)) {
      const ders = dersler.find(d => d.kod === dersKodu);
      if (!ders) continue;
      const count = (getDersCevapString(aktifKitapcik, dersKodu) || '').replace(/[^ABCDE]/g, '').length;
      if (count < ders.soruSayisi) {
        toUnlock.push(dersKodu);
      }
    }

    if (toUnlock.length === 0) return;

    setKilitliDersler(prev => {
      const yeniSet = new Set(prev[aktifKitapcik]);
      toUnlock.forEach(k => yeniSet.delete(k));
      return { ...prev, [aktifKitapcik]: yeniSet };
    });

    // Kullanıcıya 1 kez uyar (spam olmasın)
    toUnlock.forEach(k => {
      const key = `${aktifKitapcik}:${k}`;
      if (unlockedWarnedRef.current.has(key)) return;
      unlockedWarnedRef.current.add(key);
      const ders = dersler.find(d => d.kod === k);
      toast(`${ders?.ad?.split(' ')?.[0] || k}: Eksik olduğu için kilit kaldırıldı.`, { icon: '⚠️', duration: 2500 });
    });
  }, [aktifKitapcik, getDersCevapString, kilitliDersler]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ⚠️ DEVRE DIŞI: Otomatik kaydet (debounce)
  // ═══════════════════════════════════════════════════════════════════════════════
  // Bu useEffect sonsuz döngü yaratıyordu:
  // kitapcikVerileri değişir → sendToWizard → dersSirasi güncellenir → 
  // initialDersSirasi değişir → dersSirasi state güncellenir → 
  // buildCevapAnahtari yeniden hesaplanır → kitapcikVerileri tekrar değişir → ...
  //
  // Şimdi kayıt SADECE butonlarla yapılır:
  // - "Kitapçık A Kaydet" butonu
  // - "Devam Et" butonu
  // - Ders kilitleme işlemi
  // ═══════════════════════════════════════════════════════════════════════════════
  // useEffect(() => {
  //   if (!onSave) return;
  //   const answered = kitapcikVerileri[aktifKitapcik]?.filter(s => s.cevap).length || 0;
  //   if (answered === 0) return;
  //
  //   const t = window.setTimeout(() => {
  //     try {
  //       const data = buildCevapAnahtari(kitapcikVerileri);
  //       sendToWizard(data, `debounce_autosave_${aktifKitapcik}`);
  //     } catch {
  //       // ignore
  //     }
  //   }, 500);
  //
  //   return () => window.clearTimeout(t);
  // }, [aktifKitapcik, kitapcikVerileri, onSave, buildCevapAnahtari, sendToWizard]);

  // Ders bazlı cevap yapıştır
  const handleDersCevapYapistir = useCallback((dersKodu: string, cevaplar: string) => {
    const ders = dersler.find(d => d.kod === dersKodu);
    if (!ders) return;

    // Cevapları temizle ve büyük harfe çevir
    const temizCevaplar = cevaplar.toUpperCase().replace(/[^ABCDE]/g, '');
    const count = temizCevaplar.length;
    if (count > 0 && count < ders.soruSayisi) {
      toast(`${ders.ad.split(' ')[0]}: Eksik cevap (${count}/${ders.soruSayisi}). Kilitlenmedi, devam edebilirsiniz.`, {
        icon: '⚠️',
        duration: 3500,
      });
    }
    
    const baslangicIndex = dersBaslangicIndex(dersKodu);

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
      const nextState = { ...prev, [aktifKitapcik]: yeniSorular };

      // ✅ Kullanıcı derste kilitlediği an, wizard state'e de yaz (ileri-geri adımda kaybolmasın)
      // Not: buildCevapAnahtari sıralama/kitapçık eşleşmesini korur.
      queueMicrotask(() => {
        saveToWizardWithState(nextState, `Kaydedildi: ${ders.ad.split(' ')[0]} (${aktifKitapcik})`);
      });

      return nextState;
    });

    // State'i temizle ve kilitle
    setDersCevaplari(prev => ({ ...prev, [aktifKitapcik]: { ...prev[aktifKitapcik], [dersKodu]: temizCevaplar.slice(0, ders.soruSayisi) } }));
    
    // Tam cevap girildiyse (aktif kitapçık için) kilitle
    if (temizCevaplar.length === ders.soruSayisi) {
      setKilitliDersler(prev => ({
        ...prev,
        [aktifKitapcik]: new Set([...prev[aktifKitapcik], dersKodu]),
      }));
    }
    
    console.log(`✅ ${ders.ad} için ${temizCevaplar.length} cevap uygulandı ve kilitlendi`);
  }, [aktifKitapcik, dersBaslangicIndex, saveToWizardWithState]);

  const applyFull90 = useCallback(
    (rawText: string) => {
      const letters = rawText.toUpperCase().replace(/[^ABCDE]/g, '');
      if (!letters) return;
      const sliced = letters.slice(0, 90);
      if (sliced.length < 1) return;

      setKitapcikVerileri(prev => {
        const yeniSorular = prev[aktifKitapcik].map((s, idx) => ({
          ...s,
          cevap: (sliced[idx] as CevapSecenegi) || s.cevap,
        }));
        const nextState = { ...prev, [aktifKitapcik]: yeniSorular };

        // ✅ 90 cevap yapıştırılınca ders satırlarına da dağıt + kilitle
        const offsets = { TUR: 0, INK: 20, DIN: 30, ING: 40, MAT: 50, FEN: 70 };
        const lens = { TUR: 20, INK: 10, DIN: 10, ING: 10, MAT: 20, FEN: 20 };
        setDersCevaplari(prevDraft => ({
          ...prevDraft,
          [aktifKitapcik]: {
            TUR: sliced.slice(offsets.TUR, offsets.TUR + lens.TUR),
            INK: sliced.slice(offsets.INK, offsets.INK + lens.INK),
            DIN: sliced.slice(offsets.DIN, offsets.DIN + lens.DIN),
            ING: sliced.slice(offsets.ING, offsets.ING + lens.ING),
            MAT: sliced.slice(offsets.MAT, offsets.MAT + lens.MAT),
            FEN: sliced.slice(offsets.FEN, offsets.FEN + lens.FEN),
          },
        }));
        // ✅ Sadece gerçekten 90 cevap dağıtıldıysa kilitle (bu fonksiyon 90'a göre çalışır).
        setKilitliDersler(prevLocks => ({
          ...prevLocks,
          [aktifKitapcik]: new Set(['TUR', 'INK', 'DIN', 'ING', 'MAT', 'FEN']),
        }));

        queueMicrotask(() => {
          saveToWizardWithState(nextState, `Kaydedildi: 90 cevap (Kitapçık ${aktifKitapcik})`);
        });

        return nextState;
      });
    },
    [aktifKitapcik, saveToWizardWithState],
  );

  // Ders için girilen cevap sayısı
  const getDersCevapSayisi = useCallback((dersKodu: string) => {
    const ders = dersler.find(d => d.kod === dersKodu);
    if (!ders) return 0;
    
    let baslangicIndex = 0;
    for (const d of dersler) {
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
    const ders = dersler.find(d => d.kod === dersKodu);
    if (!ders) return;

    // Satırları ayır
    const satirlar = yapistrilanMetin.trim().split('\n');
    
    // Dersin başlangıç index'ini bul
    let baslangicIndex = 0;
    for (const d of dersler) {
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
            {kitapcikTurleriSafe.map(kit => (
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
                  value={hizli90Metin[aktifKitapcik] || ''}
                  // Excel boşluklu yapıştırabiliyor: maxLength 90 olursa şıklar kırpılır.
                  // Bu yüzden geniş tutuyoruz, biz A-E sayısına göre değerlendiriyoruz.
                  maxLength={320}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase"
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setHizli90Metin(prev => ({ ...prev, [aktifKitapcik]: val }));

                    const harfSayisi = val.replace(/[^ABCDE]/g, '').length;
                    if (harfSayisi >= 90) {
                      applyFull90(val);
                      setHizli90Metin(prev => ({ ...prev, [aktifKitapcik]: '' }));
                    }
                  }}
                  onPaste={(e) => {
                    // Bazı browser'larda paste anında maxLength kırpabilir; bu yüzden doğrudan clipboard'tan uygula
                    const pasted = e.clipboardData?.getData('text') || '';
                    if (!pasted) return;
                    const harfSayisi = pasted.toUpperCase().replace(/[^ABCDE]/g, '').length;
                    if (harfSayisi >= 90) {
                      e.preventDefault();
                      applyFull90(pasted);
                      setHizli90Metin(prev => ({ ...prev, [aktifKitapcik]: '' }));
                    }
                  }}
                />
                <span className="text-xs text-gray-400">
                  A-E sayısı {((hizli90Metin[aktifKitapcik] || '').replace(/[^ABCDE]/g, '').length)}/90 olunca otomatik uygular
                </span>
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
              {kitapcikTurleriSafe.map(kit => {
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
                const mevcutMetin = (dersCevaplari[aktifKitapcik]?.[ders.kod] || '').toUpperCase();
                const girilenKarakter = mevcutMetin.replace(/[^ABCDE]/g, '').length;
                const isEksik = girilenKarakter > 0 && girilenKarakter < ders.soruSayisi;
                const isFazla = girilenKarakter > ders.soruSayisi;
                const kilitliCevapString = getDersCevapString(aktifKitapcik, ders.kod);
                
                return (
                  <tr 
                    key={ders.kod}
                    onDragOver={(e) => handleDersDragOver(e, ders.kod)}
                    onDrop={() => handleDersDrop(ders.kod)}
                    className={`border-t transition-all ${
                      dragOverDers === ders.kod
                        ? 'bg-indigo-50 ring-2 ring-indigo-200'
                        : isKilitli 
                          ? 'bg-green-50 border-green-200' 
                          : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {/* Sürükle-bırak tutamacı (bu bölüm de taşınabilir olsun) */}
                        <span
                          draggable
                          onDragStart={() => handleDersDragStart(ders.kod)}
                          onDragEnd={handleDersDragEnd}
                          className="text-gray-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing"
                          title="Sürükle-bırak ile ders sırasını değiştir"
                        >
                          <GripVertical size={16} />
                        </span>
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
                            // Kilit açılınca satır inputu mevcut cevaptan dolu gelsin
                            syncDraftFromStateForKitapcik(aktifKitapcik);
                          }}
                          title="Çift tıkla ile kilidi aç"
                        >
                          <Check size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            ✓ {kilitliCevapString.replace(/[^ABCDE]/g, '').length}/{ders.soruSayisi} cevap kaydedildi
                          </span>
                          {/* ✅ İstenen: Kilitliyken de şıklar görünsün */}
                          <span className="text-xs font-mono text-green-800 bg-white/60 px-2 py-1 rounded border border-green-200 max-w-[240px] truncate">
                            {kilitliCevapString}
                          </span>
                          <span className="text-xs text-green-600 ml-auto">Çift tıkla → Düzenle</span>
                        </div>
                      ) : (
                        // GİRİŞ DURUMU
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={dersCevaplari[aktifKitapcik]?.[ders.kod] || ''}
                              onChange={(e) => {
                                const deger = e.target.value.toUpperCase();
                                setDersCevaplari(prev => ({
                                  ...prev,
                                  [aktifKitapcik]: { ...prev[aktifKitapcik], [ders.kod]: deger },
                                }));
                                
                                // Tam sayıya ulaştığında otomatik uygula
                                const temizDeger = deger.replace(/[^ABCDE]/g, '');
                                if (temizDeger.length === ders.soruSayisi) {
                                  handleDersCevapYapistir(ders.kod, deger);
                                }
                              }}
                              placeholder={`${ders.soruSayisi} cevap girin (A-E)...`}
                              // Excel boşluk/ayraç koyabiliyor, kırpılmasın
                              maxLength={ders.soruSayisi * 6}
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
                            onClick={() => handleDersCevapYapistir(ders.kod, dersCevaplari[aktifKitapcik]?.[ders.kod] || '')}
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
                  // ✅ Wizard state'ine gerçek kaydet
                  saveToWizard();
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
                          // Excel boşluk/ayraç koyabiliyor, kırpılmasın
                          maxLength={ders.soruSayisi * 6}
                          className="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:ring-2"
                          style={{ borderColor: ders.renk + '40' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleDersCevapYapistir(ders.kod, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                          onChange={(e) => {
                            const raw = e.target.value.toUpperCase();
                            const harfSayisi = raw.replace(/[^ABCDE]/g, '').length;
                            if (harfSayisi >= ders.soruSayisi) {
                              handleDersCevapYapistir(ders.kod, raw);
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
        const kitapcikDoluluklari = Object.fromEntries(
          kitapcikTurleriSafe.map((kit) => [kit, (kitapcikVerileri[kit] || []).filter((s) => s.cevap).length]),
        ) as Record<KitapcikTuru, number>;

        const mevcutKitapcikTam = (kitapcikDoluluklari[aktifKitapcik] || 0) === toplamSoru;
        const tumKitapciklerTam = kitapcikTurleriSafe.every((k) => (kitapcikDoluluklari[k] || 0) === toplamSoru);

        // Sonraki kitapçık (konfig sırası)
        const idx = kitapcikTurleriSafe.indexOf(aktifKitapcik);
        const sonrakiKitapcik = idx >= 0 && idx < kitapcikTurleriSafe.length - 1 ? kitapcikTurleriSafe[idx + 1] : null;

        const enAzBirKitapcikTam = kitapcikTurleriSafe.some((k) => (kitapcikDoluluklari[k] || 0) === toplamSoru);

        // Kaydet fonksiyonu (tek yerden)
        const handleKaydet = () => {
          console.log('🔵 Manuel Cevap Anahtarı - Kaydet butonuna tıklandı');
          saveToWizard();
        };

        return (
          <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-emerald-50">
            {/* Kitapçık Durumları */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {kitapcikTurleriSafe.map(kit => (
                  <div 
                    key={kit}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                      kitapcikDoluluklari[kit] === toplamSoru
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                        : kitapcikDoluluklari[kit] > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span className="font-bold">{kit}</span>
                    {kitapcikDoluluklari[kit] === toplamSoru ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <span className="text-xs">{kitapcikDoluluklari[kit]}/{toplamSoru}</span>
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
                      // ✅ Önce kaydet, sonra diğer kitapçığa geç
                      handleKaydet();
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

