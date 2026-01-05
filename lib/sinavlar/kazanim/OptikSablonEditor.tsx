'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Save,
  Trash2,
  Plus,
  X,
  GripVertical,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  AlertCircle
} from 'lucide-react';
import { ALAN_RENKLERI, OptikAlanTanimi, OptikSablon, CevapAnahtariSatir } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// STANDART ALAN TÜRLERİ - MEB/KURUM OPTİK FORMLARI
// ═══════════════════════════════════════════════════════════════════════════
const STANDART_ALANLAR = [
  { id: 'kurum_kodu', label: 'KURUM KODU', tip: 'bilgi' },
  { id: 'ogrenci_no', label: 'ÖĞRENCİ NO', tip: 'bilgi' },
  { id: 'tc_kimlik', label: 'TC KİMLİK NO', tip: 'bilgi' },
  { id: 'isim', label: 'İSİM', tip: 'bilgi' },
  { id: 'sinif', label: 'SINIF', tip: 'bilgi' },
  { id: 'sube', label: 'ŞUBE', tip: 'bilgi' },
  { id: 'kitapcik', label: 'KİTAPÇIK', tip: 'bilgi' },
  { id: 'cinsiyet', label: 'CİNSİYET', tip: 'bilgi' },
  { id: 'form', label: 'FORM', tip: 'bilgi' },
];

const DERS_ALANLARI = [
  { id: 'turkce', label: 'TÜRKÇE', tip: 'ders' },
  { id: 'matematik', label: 'MATEMATİK', tip: 'ders' },
  { id: 'fen', label: 'FEN BİLİMLERİ', tip: 'ders' },
  { id: 'sosyal', label: 'SOSYAL BİLGİLER', tip: 'ders' },
  { id: 'inkilap', label: 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK', tip: 'ders' },
  { id: 'din', label: 'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ', tip: 'ders' },
  { id: 'ingilizce', label: 'YABANCI DİL', tip: 'ders' },
  { id: 'edebiyat', label: 'TÜRK DİLİ VE EDEBİYATI', tip: 'ders' },
  { id: 'tarih', label: 'TARİH', tip: 'ders' },
  { id: 'cografya', label: 'COĞRAFYA', tip: 'ders' },
  { id: 'fizik', label: 'FİZİK', tip: 'ders' },
  { id: 'kimya', label: 'KİMYA', tip: 'ders' },
  { id: 'biyoloji', label: 'BİYOLOJİ', tip: 'ders' },
  { id: 'felsefe', label: 'FELSEFE', tip: 'ders' },
];

// ═══════════════════════════════════════════════════════════════════════════
// HAZIR ŞABLONLAR
// ═══════════════════════════════════════════════════════════════════════════
interface SablonAlan {
  id: string;
  label: string;
  baslangic: number;
  bitis: number;
}

interface OptikFormSablon {
  id: string;
  ad: string;
  sinifTipi: string; // LGS, TYT, 4, 5, 6, 7, 8, KURUM
  alanlar: SablonAlan[];
}

const VARSAYILAN_SABLONLAR: OptikFormSablon[] = [
  {
    id: 'lgs-standart',
    ad: 'LGS Standart',
    sinifTipi: 'LGS',
    alanlar: [
      { id: '1', label: 'ÖĞRENCİ NO', baslangic: 1, bitis: 10 },
      { id: '2', label: 'AD SOYAD', baslangic: 11, bitis: 35 },
      { id: '3', label: 'KİTAPÇIK', baslangic: 36, bitis: 36 },
      { id: '4', label: 'TÜRKÇE', baslangic: 37, bitis: 56 },
      { id: '5', label: 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK', baslangic: 57, bitis: 66 },
      { id: '6', label: 'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ', baslangic: 67, bitis: 76 },
      { id: '7', label: 'YABANCI DİL', baslangic: 77, bitis: 86 },
      { id: '8', label: 'MATEMATİK', baslangic: 87, bitis: 106 },
      { id: '9', label: 'FEN BİLİMLERİ', baslangic: 107, bitis: 126 },
    ]
  },
  {
    id: 'tyt-standart',
    ad: 'TYT Standart',
    sinifTipi: 'TYT',
    alanlar: [
      { id: '1', label: 'ÖĞRENCİ NO', baslangic: 1, bitis: 10 },
      { id: '2', label: 'AD SOYAD', baslangic: 11, bitis: 35 },
      { id: '3', label: 'KİTAPÇIK', baslangic: 36, bitis: 36 },
      { id: '4', label: 'TÜRKÇE', baslangic: 37, bitis: 76 },
      { id: '5', label: 'SOSYAL BİLGİLER', baslangic: 77, bitis: 96 },
      { id: '6', label: 'MATEMATİK', baslangic: 97, bitis: 136 },
      { id: '7', label: 'FEN BİLİMLERİ', baslangic: 137, bitis: 156 },
    ]
  },
];

// ❌ localStorage KALDIRILDI - Tek veri kaynağı Supabase API
// const LS_TEMPLATES_KEY = 'akademihub_optik_editor_templates_v1';

function normalizeLabelForMatch(label: string): string {
  return (label || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function inferAlanTypeFromLabel(label: string): OptikAlanTanimi['alan'] {
  const t = normalizeLabelForMatch(label);

  if (t.includes('ÖĞRENCİ NO') || t === 'NUMARA' || t.includes('ÖĞRENCİ NUMARA')) return 'ogrenci_no';
  if (t.includes('AD SOYAD') || t.includes('ADI SOYADI') || t === 'İSİM' || t === 'ISIM' || t.includes('ÖĞRENCİ ADI')) return 'ogrenci_adi';
  // ⚠️ ÖNEMLİ: "T.C." ders adı ile "T.C. Kimlik" alanı karışmamalı.
  // TC kimlik alanını SADECE "KİMLİK" ifadesi varsa tc olarak işaretle.
  if (t.includes('KİMLİK') || t.includes('KIMLIK')) return 'tc';
  if (t.includes('SINIF')) return 'sinif_no';
  if (t.includes('KURUM KODU') || t.includes('OKUL KODU')) return 'kurum_kodu';
  if (t.includes('CİNSİYET') || t.includes('CINSIYET')) return 'cinsiyet';
  if (t.includes('KİTAPÇIK') || t.includes('KITAPCIK')) return 'kitapcik';

  // Cevaplar alanı: kullanıcı ister tek "CEVAPLAR" ister ders ders yazar. Burada güvenli yaklaşım:
  // Sadece açıkça "CEVAP" denmişse cevaplar olarak işaretle.
  if (t === 'CEVAP' || t === 'CEVAPLAR' || t.includes('CEVAP ALANI')) return 'cevaplar';

  return 'ozel';
}

function inferColorForAlanType(alan: OptikAlanTanimi['alan']): string {
  return (ALAN_RENKLERI as any)?.[alan] || '#6B7280';
}

function getToplamSoruFromType(sinifTipi: string): number {
  const t = (sinifTipi || '').toUpperCase();
  if (t.includes('TYT')) return 120;
  if (t.includes('LGS')) return 90;
  // Kurum/diğerleri: şimdilik 90 (wizard LGS ağırlıklı). İleride formdan hesaplanabilir.
  return 90;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════
interface OptikSablonEditorProps {
  organizationId: string; // ✅ ZORUNLU - Supabase API için
  onSave?: (sablon: Omit<OptikSablon, 'id'>) => void;
  onLoad?: () => Promise<OptikSablon[]>;
  initialSablon?: OptikSablon;
  sampleData?: string;
  cevapAnahtari?: CevapAnahtariSatir[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ANA COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function OptikSablonEditor({
  organizationId,
  onSave,
  cevapAnahtari = []
}: OptikSablonEditorProps) {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  const [sablonlar, setSablonlar] = useState<OptikFormSablon[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [seciliSablonId, setSeciliSablonId] = useState<string | null>(null);
  const [sayfa, setSayfa] = useState(1);
  const [yeniAlanModalAcik, setYeniAlanModalAcik] = useState(false);
  const [yeniSablonModalAcik, setYeniSablonModalAcik] = useState(false);
  const [kaydetModalAcik, setKaydetModalAcik] = useState(false);
  const [kaydetAd, setKaydetAd] = useState('');
  const [kaydetHata, setKaydetHata] = useState<string | null>(null);
  const [lastSavedSigById, setLastSavedSigById] = useState<Record<string, string>>({});
  // lastLoadedRef kaldırıldı - API useEffect'i organizationId değişiminde tetikleniyor
  
  // Yeni şablon formu
  const [yeniSablonAdi, setYeniSablonAdi] = useState('');
  const [yeniSablonTipi, setYeniSablonTipi] = useState('LGS');
  
  // Yeni alan formu
  const [yeniAlanLabel, setYeniAlanLabel] = useState('');
  const [yeniAlanBaslangic, setYeniAlanBaslangic] = useState<number>(1);
  const [yeniAlanBitis, setYeniAlanBitis] = useState<number>(10);

  const SAYFA_BOYUTU = 10;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HESAPLAMALAR
  // ═══════════════════════════════════════════════════════════════════════════
  const seciliSablon = useMemo(() => {
    return sablonlar.find(s => s.id === seciliSablonId) || null;
  }, [sablonlar, seciliSablonId]);
  
  const sayfaliSablonlar = useMemo(() => {
    const baslangic = (sayfa - 1) * SAYFA_BOYUTU;
    return sablonlar.slice(baslangic, baslangic + SAYFA_BOYUTU);
  }, [sablonlar, sayfa]);
  
  const toplamSayfa = Math.ceil(sablonlar.length / SAYFA_BOYUTU);
  
  // Cevap anahtarından ders sıralamasını al
  const cevapAnahtariDersler = useMemo(() => {
    if (!cevapAnahtari?.length) return [];
    const dersler: string[] = [];
    cevapAnahtari.forEach(c => {
      const dersAdi = c.dersAdi?.toUpperCase() || '';
      if (dersAdi && !dersler.includes(dersAdi)) {
        dersler.push(dersAdi);
      }
    });
    return dersler;
  }, [cevapAnahtari]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ TEK VERİ KAYNAĞI: Supabase API
  // localStorage KALDIRILDI - Artık tüm bilgisayarlarda aynı şablonlar görünür
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!organizationId) {
      setLoadingTemplates(false);
      return;
    }
    
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await fetch(`/api/exam-intelligence/optic-templates?organizationId=${organizationId}`);
        const json = await res.json();
        if (json.ok && json.data?.opticTemplates) {
          console.log('✅ [OptikSablonEditor] Şablonlar API\'den yüklendi:', json.data.opticTemplates.length);
          // API'den gelen şablonları OptikFormSablon formatına dönüştür
          const converted: OptikFormSablon[] = json.data.opticTemplates
            .filter((s: any) => s.is_active === true)
            .map((s: any) => ({
              id: s.id,
              ad: s.sablon_adi,
              sinifTipi: s.toplam_soru >= 100 ? 'TYT' : 'LGS',
              alanlar: (s.alan_tanimlari || []).map((a: any, idx: number) => ({
                id: String(idx + 1),
                label: a.label || a.alan?.toUpperCase() || 'ALAN',
                baslangic: a.baslangic,
                bitis: a.bitis,
              })),
            }));
          setSablonlar(converted);
        } else {
          console.warn('⚠️ [OptikSablonEditor] API hatası:', json.error);
          setSablonlar([]); // Boş göster - fallback YOK
        }
      } catch (e) {
        console.error('❌ [OptikSablonEditor] Şablon yükleme hatası:', e);
        setSablonlar([]); // Boş göster - fallback YOK
      } finally {
        setLoadingTemplates(false);
      }
    };
    
    fetchTemplates();
  }, [organizationId]);

  const seciliSig = useMemo(() => {
    if (!seciliSablon) return '';
    return JSON.stringify({
      ad: seciliSablon.ad,
      sinifTipi: seciliSablon.sinifTipi,
      alanlar: seciliSablon.alanlar.map(a => ({ label: a.label, baslangic: a.baslangic, bitis: a.bitis })),
    });
  }, [seciliSablon]);

  const isDirty = useMemo(() => {
    if (!seciliSablon) return false;
    const last = lastSavedSigById[seciliSablon.id];
    // İlk kez: varsayılan şablonlar için dirty saymayalım; kullanıcı değiştirince dirty olur.
    return Boolean(last && last !== seciliSig);
  }, [lastSavedSigById, seciliSablon, seciliSig]);

  const isKnownSaved = useMemo(() => {
    if (!seciliSablon) return false;
    return Boolean(lastSavedSigById[seciliSablon.id]);
  }, [lastSavedSigById, seciliSablon]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FONKSİYONLAR
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Yeni şablon ekle
  const handleYeniSablonEkle = () => {
    if (!yeniSablonAdi.trim()) return;
    
    const yeniSablon: OptikFormSablon = {
      id: `sablon-${Date.now()}`,
      ad: yeniSablonAdi.toUpperCase(),
      sinifTipi: yeniSablonTipi,
      alanlar: [
        { id: '1', label: 'ÖĞRENCİ NO', baslangic: 1, bitis: 10 },
        { id: '2', label: 'İSİM', baslangic: 11, bitis: 35 },
      ]
    };
    
    setSablonlar(prev => {
      const next = [...prev, yeniSablon];
      persistTemplatesToLocalStorage(next);
      return next;
    });
    setSeciliSablonId(yeniSablon.id);
    setYeniSablonModalAcik(false);
    setYeniSablonAdi('');
  };
  
  // Yeni alan ekle
  const handleYeniAlanEkle = () => {
    if (!seciliSablon || !yeniAlanLabel.trim()) return;
    
    const yeniAlan: SablonAlan = {
      id: `alan-${Date.now()}`,
      label: yeniAlanLabel.toUpperCase(),
      baslangic: yeniAlanBaslangic,
      bitis: yeniAlanBitis
    };
    
    const guncelSablonlar = sablonlar.map(s => {
      if (s.id === seciliSablonId) {
        return { ...s, alanlar: [...s.alanlar, yeniAlan] };
      }
      return s;
    });
    
    setSablonlar(() => {
      persistTemplatesToLocalStorage(guncelSablonlar);
      return guncelSablonlar;
    });
    setYeniAlanModalAcik(false);
    setYeniAlanLabel('');
    setYeniAlanBaslangic(1);
    setYeniAlanBitis(10);
  };
  
  // Alan sil
  const handleAlanSil = (alanId: string) => {
    if (!seciliSablon) return;
    
    const guncelSablonlar = sablonlar.map(s => {
      if (s.id === seciliSablonId) {
        return { ...s, alanlar: s.alanlar.filter(a => a.id !== alanId) };
      }
      return s;
    });
    
    setSablonlar(() => {
      persistTemplatesToLocalStorage(guncelSablonlar);
      return guncelSablonlar;
    });
  };
  
  // Alan güncelle
  const handleAlanGuncelle = (alanId: string, field: 'label' | 'baslangic' | 'bitis', value: string | number) => {
    if (!seciliSablon) return;

    // ✅ Sadece manuel giriş: number spinner yerine text+inputMode kullanacağız.
    // Burada da numeric alanları güvenli parse ediyoruz (sadece rakam).
    const parseNumeric = (v: string | number): number | null => {
      if (typeof v === 'number') {
        if (Number.isNaN(v)) return null;
        return Math.max(1, Math.floor(v));
      }
      const onlyDigits = String(v).replace(/[^\d]/g, '');
      if (!onlyDigits) return null;
      const n = Number(onlyDigits);
      if (Number.isNaN(n)) return null;
      return Math.max(1, Math.floor(n));
    };
    
    const guncelSablonlar = sablonlar.map(s => {
      if (s.id === seciliSablonId) {
        const updatedAlanlar = s.alanlar.map(a => {
          if (a.id === alanId) {
            if (field === 'label') {
              return { ...a, label: String(value).toUpperCase() };
            }
            const n = parseNumeric(value);
            if (n === null) return a; // boş/invalid → dokunma
            return { ...a, [field]: n };
          }
          return a;
        });

        // ✅ Kullanıcı sayı girince otomatik düzen: başlangıca göre sırala
        const shouldAutoSort = field === 'baslangic' || field === 'bitis';
        const finalAlanlar = shouldAutoSort
          ? [...updatedAlanlar].sort((x, y) => {
              if (x.baslangic !== y.baslangic) return x.baslangic - y.baslangic;
              if (x.bitis !== y.bitis) return x.bitis - y.bitis;
              return x.label.localeCompare(y.label, 'tr');
            })
          : updatedAlanlar;

        return { ...s, alanlar: finalAlanlar };
      }
      return s;
    });
    
    setSablonlar(() => {
      persistTemplatesToLocalStorage(guncelSablonlar);
      return guncelSablonlar;
    });
  };
  
  // Alanları yeniden sırala
  const handleAlanlarReorder = (yeniSira: SablonAlan[]) => {
    if (!seciliSablon) return;
    
    const guncelSablonlar = sablonlar.map(s => {
      if (s.id === seciliSablonId) {
        return { ...s, alanlar: yeniSira };
      }
      return s;
    });
    
    setSablonlar(() => {
      persistTemplatesToLocalStorage(guncelSablonlar);
      return guncelSablonlar;
    });
  };
  
  // Şablon sil
  const handleSablonSil = (sablonId: string) => {
    setSablonlar(prev => {
      const next = prev.filter(s => s.id !== sablonId);
      persistTemplatesToLocalStorage(next);
      return next;
    });
    if (seciliSablonId === sablonId) {
      setSeciliSablonId(null);
    }
  };
  
  // Şablonu kopyala
  const handleSablonKopyala = (sablon: OptikFormSablon) => {
    const kopya: OptikFormSablon = {
      ...sablon,
      id: `sablon-${Date.now()}`,
      ad: `${sablon.ad} (Kopya)`,
      alanlar: sablon.alanlar.map(a => ({ ...a, id: `alan-${Date.now()}-${Math.random()}` }))
    };
    setSablonlar(prev => {
      const next = [...prev, kopya];
      persistTemplatesToLocalStorage(next);
      return next;
    });
  };
  
  // Hazır alan ekle
  const handleHazirAlanEkle = (label: string) => {
    setYeniAlanLabel(label);
    setYeniAlanModalAcik(true);
  };

  // ❌ localStorage KALDIRILDI - Tek veri kaynağı Supabase API
  // Şablon değişiklikleri için TODO: API POST/PUT endpoint gerekli
  const persistTemplatesToLocalStorage = (_templates: OptikFormSablon[]) => {
    // localStorage KULLANILMIYOR - sadece UI state güncelleniyor
    // Gerçek kayıt için API endpoint gerekli
    console.log('⚠️ [OptikSablonEditor] Şablon kaydetme: API endpoint henüz yok, sadece session\'da geçerli');
  };

  const openKaydetModal = () => {
    if (!seciliSablon) return;
    setKaydetHata(null);
    setKaydetAd(seciliSablon.ad || '');
    setKaydetModalAcik(true);
  };

  const doSaveOrUpdate = () => {
    if (!seciliSablon) return;
    const name = normalizeLabelForMatch(kaydetAd);
    if (!name) {
      setKaydetHata('Şablon adı zorunlu. Lütfen bir ad yazın.');
      return;
    }

    // ✅ API'den gelen tüm şablonlar güncellenebilir
    // Varsayılan kontrol artık API'de yapılıyor (is_default flag)
    const targetId = seciliSablon.id;

    const updated: OptikFormSablon = {
      ...seciliSablon,
      id: targetId,
      ad: name,
    };

    setSablonlar(prev => {
      const next = prev.map(s => (s.id === seciliSablon.id ? updated : s));
      persistTemplatesToLocalStorage(next);
      return next;
    });

    // Kaydedildi imzasını güncelle
    setLastSavedSigById(prev => ({
      ...prev,
      [targetId]: JSON.stringify({
        ad: name,
        sinifTipi: updated.sinifTipi,
        alanlar: updated.alanlar.map(a => ({ label: a.label, baslangic: a.baslangic, bitis: a.bitis })),
      }),
    }));

    setSeciliSablonId(targetId);
    setKaydetModalAcik(false);

    // Wizard'a aktarılacak sablon: alan tiplerini label’dan otomatik çıkar
    if (onSave) {
      const alanTanimlari: OptikAlanTanimi[] = updated.alanlar.map(a => {
        const alanType = inferAlanTypeFromLabel(a.label);
        return {
          alan: alanType,
          baslangic: a.baslangic,
          bitis: a.bitis,
          label: a.label,
          color: inferColorForAlanType(alanType),
          ...(alanType === 'ozel' ? { customLabel: a.label } : {}),
        };
      });

      const toplamSoru = getToplamSoruFromType(updated.sinifTipi);
      const cevapBaslangic =
        alanTanimlari.find(at => at.alan === 'cevaplar')?.baslangic ||
        alanTanimlari.find(at => /TÜRKÇE|MATEMATİK|FEN|SOSYAL|İNGİLİZCE|İNKILAP|DİN/i.test(at.label))?.baslangic ||
        1;

      const optikSablon: Omit<OptikSablon, 'id'> = {
        sablonAdi: updated.ad,
        aciklama: `${updated.sinifTipi} şablonu`,
        alanTanimlari,
        cevapBaslangic,
        toplamSoru,
        isDefault: false,
        isActive: true,
      };

      onSave(optikSablon);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* BAŞLIK */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Optik Form Tanımları
        </h2>
        {seciliSablon && (
          <button
            onClick={() => setSeciliSablonId(null)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Listeye geri dön
          </button>
        )}
      </div>
      
      <div className="flex min-h-[500px]">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SOL PANEL - ŞABLON LİSTESİ */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-64 border-r border-slate-200 flex flex-col">
          {/* Liste başlığı */}
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase">Optik Form Adı</span>
              <button
                onClick={() => setYeniSablonModalAcik(true)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="Yeni Şablon Ekle"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          {/* Şablon listesi */}
          <div className="flex-1 overflow-y-auto">
            {sayfaliSablonlar.map((sablon, idx) => (
              <div
                key={sablon.id}
                className={`flex items-center gap-2 px-3 py-2 border-b border-slate-100 cursor-pointer transition-colors ${
                  seciliSablonId === sablon.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => setSeciliSablonId(sablon.id)}
              >
                <span className="w-6 h-6 rounded bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">
                  {(sayfa - 1) * SAYFA_BOYUTU + idx + 1}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSeciliSablonId(sablon.id); }}
                  className="p-1 text-amber-500 hover:bg-amber-100 rounded"
                  title="Düzenle"
                >
                  <Edit2 size={14} />
                </button>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                  {sablon.ad}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                  {sablon.sinifTipi}
                </span>
              </div>
            ))}
          </div>
          
          {/* Sayfalama */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setSayfa(s => Math.max(1, s - 1))}
              disabled={sayfa === 1}
              className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(toplamSayfa, 5) }, (_, i) => i + 1).map(s => (
                <button
                  key={s}
                  onClick={() => setSayfa(s)}
                  className={`w-6 h-6 text-xs font-medium rounded ${
                    sayfa === s ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSayfa(s => Math.min(toplamSayfa, s + 1))}
              disabled={sayfa >= toplamSayfa}
              className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SAĞ PANEL - ALAN TANIMLARI */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col">
          {seciliSablon ? (
            <>
              {/* Şablon başlığı */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{seciliSablon.ad}</h3>
                  <p className="text-xs text-slate-500">{seciliSablon.alanlar.length} alan tanımı</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSablonKopyala(seciliSablon)}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded"
                    title="Kopyala"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleSablonSil(seciliSablon.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {/* Alan listesi */}
              <div className="flex-1 overflow-y-auto p-4">
                <Reorder.Group
                  axis="y"
                  values={seciliSablon.alanlar}
                  onReorder={handleAlanlarReorder}
                  className="space-y-2"
                >
                  {seciliSablon.alanlar.map((alan) => (
                    <Reorder.Item
                      key={alan.id}
                      value={alan}
                      className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg hover:shadow-sm cursor-grab active:cursor-grabbing"
                    >
                      {/* Sürükleme tutamağı */}
                      <div className="text-slate-400">
                        <GripVertical size={16} />
                      </div>
                      
                      {/* Alan adı */}
                      <input
                        type="text"
                        value={alan.label}
                        onChange={(e) => handleAlanGuncelle(alan.id, 'label', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                        style={{ minWidth: '200px' }}
                      />
                      
                      {/* Başlangıç */}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={alan.baslangic}
                        onChange={(e) => handleAlanGuncelle(alan.id, 'baslangic', e.target.value)}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded text-sm text-center font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                        placeholder="1"
                      />
                      
                      {/* Bitiş */}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={alan.bitis}
                        onChange={(e) => handleAlanGuncelle(alan.id, 'bitis', e.target.value)}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded text-sm text-center font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                        placeholder="10"
                      />
                      
                      {/* Sil butonu */}
                      <button
                        onClick={() => handleAlanSil(alan.id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                        title="Sil"
                      >
                        <X size={16} />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                {/* Yeni alan ekle butonu */}
                <button
                  onClick={() => setYeniAlanModalAcik(true)}
                  className="mt-4 w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Yeni Alan Ekle
                </button>
              </div>
              
              {/* Hazır alanlar */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-2">HIZLI EKLE:</p>
                <div className="flex flex-wrap gap-1">
                  {[...STANDART_ALANLAR, ...DERS_ALANLARI].slice(0, 8).map((alan) => (
                    <button
                      key={alan.id}
                      onClick={() => handleHazirAlanEkle(alan.label)}
                      className="px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      {alan.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setYeniAlanModalAcik(true)}
                    className="px-2 py-1 text-xs bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100"
                  >
                    + Diğer
                  </button>
                </div>
              </div>
              
              {/* Kaydet */}
              <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={openKaydetModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Save size={16} />
                  {isKnownSaved ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </>
          ) : (
            /* Şablon seçilmediğinde */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Şablon Seçin</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Sol taraftan bir şablon seçin veya yeni oluşturun
                </p>
                <button
                  onClick={() => setYeniSablonModalAcik(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  Yeni Şablon Oluştur
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* YENİ ŞABLON MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {yeniSablonModalAcik && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setYeniSablonModalAcik(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-[400px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">Yeni Şablon Oluştur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şablon Adı</label>
                  <input
                    type="text"
                    value={yeniSablonAdi}
                    onChange={(e) => setYeniSablonAdi(e.target.value.toUpperCase())}
                    placeholder="Örn: ÖZDEBİR LGS"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none uppercase"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sınav/Sınıf Tipi</label>
                  <select
                    value={yeniSablonTipi}
                    onChange={(e) => setYeniSablonTipi(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none bg-white"
                  >
                    <option value="LGS">LGS (8. Sınıf)</option>
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="4">4. Sınıf</option>
                    <option value="5">5. Sınıf</option>
                    <option value="6">6. Sınıf</option>
                    <option value="7">7. Sınıf</option>
                    <option value="8">8. Sınıf</option>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf</option>
                    <option value="KURUM">Kurum Denemesi</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setYeniSablonModalAcik(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={handleYeniSablonEkle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Check size={16} />
                  Oluştur
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* YENİ ALAN MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {yeniAlanModalAcik && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setYeniAlanModalAcik(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-[450px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">Yeni Alan Ekle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alan Adı</label>
                  <input
                    type="text"
                    value={yeniAlanLabel}
                    onChange={(e) => setYeniAlanLabel(e.target.value.toUpperCase())}
                    placeholder="Örn: TÜRKÇE, ÖĞRENCİ NO"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none uppercase"
                  />
                </div>
                
                {/* Hazır alan önerileri */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">Veya Hazır Seçin:</label>
                  <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                    {[...STANDART_ALANLAR, ...DERS_ALANLARI].map((alan) => (
                      <button
                        key={alan.id}
                        onClick={() => setYeniAlanLabel(alan.label)}
                        className={`px-2 py-1 text-xs text-left rounded transition-colors ${
                          yeniAlanLabel === alan.label
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50'
                        }`}
                      >
                        {alan.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Karakteri</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={String(yeniAlanBaslangic)}
                      onChange={(e) => {
                        const only = e.target.value.replace(/[^\d]/g, '');
                        if (!only) return;
                        setYeniAlanBaslangic(Math.max(1, Number(only)));
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Karakteri</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={String(yeniAlanBitis)}
                      onChange={(e) => {
                        const only = e.target.value.replace(/[^\d]/g, '');
                        if (!only) return;
                        setYeniAlanBitis(Math.max(1, Number(only)));
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none text-center font-mono"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-slate-400">
                  💡 TXT dosyasındaki karakter pozisyonlarını girin. Örn: İsim 11-35 arası ise Başlangıç: 11, Bitiş: 35
                </p>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => { setYeniAlanModalAcik(false); setYeniAlanLabel(''); }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={handleYeniAlanEkle}
                  disabled={!yeniAlanLabel.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus size={16} />
                  Ekle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KAYDET / GÜNCELLE MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {kaydetModalAcik && seciliSablon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setKaydetModalAcik(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-[420px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {isKnownSaved ? 'Şablonu Güncelle' : 'Şablonu Kaydet'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Hazır şablonlar listesine eklemek için şablon adını kaydetmelisiniz.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şablon Adı</label>
                  <input
                    type="text"
                    value={kaydetAd}
                    onChange={(e) => {
                      setKaydetHata(null);
                      setKaydetAd(e.target.value.toUpperCase());
                    }}
                    placeholder="Örn: ÖZDEBİR LGS 2025"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none uppercase"
                  />
                </div>

                {kaydetHata && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div>{kaydetHata}</div>
                  </div>
                )}

                <div className="text-xs text-slate-500">
                  - Alan adları otomatik <b>BÜYÜK HARF</b> kaydedilir
                  <br />
                  - Öğrenci eşleşmesi için <b>ÖĞRENCİ NO</b> ve <b>AD SOYAD</b> alanlarının tanımlı olması önerilir
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setKaydetModalAcik(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={doSaveOrUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Save size={16} />
                  {isKnownSaved ? 'Güncelle ve Devam Et' : 'Kaydet ve Devam Et'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
