'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Library,
  Search,
  Plus,
  Check,
  ChevronDown,
  Edit3,
  Trash2,
  Save,
  X,
  FileText,
  Grid3X3,
  Info,
  Star,
  GripVertical,
  Sparkles
} from 'lucide-react';

import {
  OPTIK_FORM_SABLONLARI,
  SINAV_KONFIGURASYONLARI,
  SINIF_BILGILERI,
  OptikFormSablonu,
  SinavTuru,
  SinifSeviyesi,
} from './sinavKonfigurasyonlari';
import { OptikSablon, OptikAlanTanimi, ALAN_RENKLERI } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// BASİT ŞABLON OLUŞTURMA FORMU - MODERN VE KOLAY
// ═══════════════════════════════════════════════════════════════════════════

interface DersItem {
  id: string;
  ad: string;
  kod: string;
  soruSayisi: number;
  renk: string;
}

// Hazır ders şablonları
const LGS_DERSLER: DersItem[] = [
  { id: 'tur', ad: 'Türkçe', kod: 'TUR', soruSayisi: 20, renk: '#3B82F6' },
  { id: 'ink', ad: 'T.C. İnkılap Tarihi', kod: 'INK', soruSayisi: 10, renk: '#EF4444' },
  { id: 'din', ad: 'Din Kültürü', kod: 'DIN', soruSayisi: 10, renk: '#8B5CF6' },
  { id: 'ing', ad: 'İngilizce', kod: 'ING', soruSayisi: 10, renk: '#10B981' },
  { id: 'mat', ad: 'Matematik', kod: 'MAT', soruSayisi: 20, renk: '#F59E0B' },
  { id: 'fen', ad: 'Fen Bilimleri', kod: 'FEN', soruSayisi: 20, renk: '#06B6D4' },
];

const TYT_DERSLER: DersItem[] = [
  { id: 'tur', ad: 'Türkçe', kod: 'TUR', soruSayisi: 40, renk: '#3B82F6' },
  { id: 'sos', ad: 'Sosyal Bilimler', kod: 'SOS', soruSayisi: 20, renk: '#EF4444' },
  { id: 'mat', ad: 'Temel Matematik', kod: 'MAT', soruSayisi: 40, renk: '#F59E0B' },
  { id: 'fen', ad: 'Fen Bilimleri', kod: 'FEN', soruSayisi: 20, renk: '#06B6D4' },
];

const BOSLUK_DERSLER: DersItem[] = [];

interface SimpleSablonFormProps {
  onSave: (sablon: OptikFormSablonu) => void;
  onCancel: () => void;
}

function SimpleSablonForm({ onSave, onCancel }: SimpleSablonFormProps) {
  const [sablonAdi, setSablonAdi] = useState('');
  const [sinavTipi, setSinavTipi] = useState<'LGS' | 'TYT' | 'OZEL'>('LGS');
  const [dersler, setDersler] = useState<DersItem[]>(LGS_DERSLER);
  
  // Sınav tipi değiştiğinde dersleri güncelle
  const handleSinavTipiChange = (tip: 'LGS' | 'TYT' | 'OZEL') => {
    setSinavTipi(tip);
    if (tip === 'LGS') {
      setDersler([...LGS_DERSLER]);
    } else if (tip === 'TYT') {
      setDersler([...TYT_DERSLER]);
    } else {
      setDersler([...BOSLUK_DERSLER]);
    }
  };
  
  // Yeni ders ekle
  const handleAddDers = () => {
    const yeniDers: DersItem = {
      id: `ders-${Date.now()}`,
      ad: 'Yeni Ders',
      kod: 'YNI',
      soruSayisi: 10,
      renk: '#6B7280'
    };
    setDersler([...dersler, yeniDers]);
  };
  
  // Ders sil
  const handleRemoveDers = (id: string) => {
    setDersler(dersler.filter(d => d.id !== id));
  };
  
  // Ders güncelle
  const handleUpdateDers = (id: string, field: 'ad' | 'soruSayisi', value: string | number) => {
    setDersler(dersler.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };
  
  // Toplam soru sayısı
  const toplamSoru = dersler.reduce((sum, d) => sum + d.soruSayisi, 0);
  
  // Kaydet
  const handleSave = () => {
    if (!sablonAdi.trim()) {
      alert('Lütfen şablon adı girin!');
      return;
    }
    if (dersler.length === 0) {
      alert('En az bir ders eklemelisiniz!');
      return;
    }
    
    const yeniSablon: OptikFormSablonu = {
      id: `custom-${Date.now()}`,
      ad: sablonAdi,
      yayinevi: 'Özel',
      aciklama: `${toplamSoru} soru, ${dersler.length} ders`,
      sinifSeviyeleri: sinavTipi === 'LGS' ? ['8'] : sinavTipi === 'TYT' ? ['12'] : ['8'],
      sinavTurleri: ['DENEME'],
      toplamSoru: toplamSoru,
      satirUzunlugu: 200,
      alanlar: {
        ogrenciNo: { baslangic: 1, bitis: 10 },
        ogrenciAdi: { baslangic: 11, bitis: 40 },
        kitapcik: { baslangic: 41, bitis: 41 },
        cevaplar: { baslangic: 42, bitis: 42 + toplamSoru - 1 },
      },
      onerilenIcon: '📋',
      renk: '#6366F1',
      // Ders yapısını da sakla
      dersYapisi: dersler.map(d => ({
        kod: d.kod,
        ad: d.ad,
        soruSayisi: d.soruSayisi
      }))
    };
    
    onSave(yeniSablon);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 shadow-lg"
    >
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Yeni Optik Form Şablonu</h3>
            <p className="text-xs text-slate-500">Kolay ve hızlı şablon oluşturun</p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-white/60 rounded-lg transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>
      </div>
      
      {/* ADIM 1: Şablon Adı */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          📝 Şablon Adı
        </label>
        <input
          type="text"
          value={sablonAdi}
          onChange={(e) => setSablonAdi(e.target.value)}
          placeholder="Örn: Okulumuz LGS Deneme 1"
          className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
        />
      </div>
      
      {/* ADIM 2: Sınav Tipi Seçimi */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          📚 Sınav Tipi
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'LGS', label: 'LGS', desc: '90 Soru', icon: '🎓', color: 'blue' },
            { value: 'TYT', label: 'TYT', desc: '120 Soru', icon: '📖', color: 'amber' },
            { value: 'OZEL', label: 'Özel', desc: 'Kendin Oluştur', icon: '✨', color: 'purple' },
          ].map((tip) => (
            <button
              key={tip.value}
              onClick={() => handleSinavTipiChange(tip.value as 'LGS' | 'TYT' | 'OZEL')}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                sinavTipi === tip.value
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <span className="text-2xl block mb-1">{tip.icon}</span>
              <span className="font-bold text-slate-800 block">{tip.label}</span>
              <span className="text-xs text-slate-500">{tip.desc}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* ADIM 3: Dersler */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            📐 Dersler ve Soru Sayıları
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              Toplam: {toplamSoru} soru
            </span>
          </label>
          <button
            onClick={handleAddDers}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Ders Ekle
          </button>
        </div>
        
        {dersler.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-sm mb-3">Henüz ders eklenmedi</p>
            <button
              onClick={handleAddDers}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              + İlk Dersi Ekle
            </button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={dersler}
            onReorder={setDersler}
            className="space-y-2"
          >
            {dersler.map((ders, index) => (
              <Reorder.Item
                key={ders.id}
                value={ders}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
              >
                {/* Sıra numarası ve sürükleme */}
                <div className="flex items-center gap-2 text-slate-400">
                  <GripVertical size={16} className="opacity-50 group-hover:opacity-100" />
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                </div>
                
                {/* Ders rengi */}
                <div 
                  className="w-3 h-10 rounded-full"
                  style={{ backgroundColor: ders.renk }}
                />
                
                {/* Ders adı */}
                <input
                  type="text"
                  value={ders.ad}
                  onChange={(e) => handleUpdateDers(ders.id, 'ad', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm font-medium"
                  placeholder="Ders adı"
                />
                
                {/* Soru sayısı */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ders.soruSayisi}
                    onChange={(e) => handleUpdateDers(ders.id, 'soruSayisi', parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-center text-sm font-bold"
                    min={1}
                    max={100}
                  />
                  <span className="text-xs text-slate-400">soru</span>
                </div>
                
                {/* Sil butonu */}
                <button
                  onClick={() => handleRemoveDers(ders.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
        
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <GripVertical size={12} />
          Dersleri sürükleyerek sıralayabilirsiniz
        </p>
      </div>
      
      {/* KAYDET / İPTAL */}
      <div className="flex justify-end gap-3 pt-4 border-t border-indigo-100">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-slate-600 hover:bg-white rounded-xl text-sm font-medium transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleSave}
          disabled={!sablonAdi.trim() || dersler.length === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Save size={16} />
          Şablonu Kaydet
        </button>
      </div>
    </motion.div>
  );
}

interface SablonKutuphanesiProps {
  sinifSeviyesi?: SinifSeviyesi;
  sinavTuru?: SinavTuru;
  organizationId?: string;  // Supabase'den şablon çekmek için
  onSelect: (sablon: OptikSablon) => void;
  onCustom?: () => void;
}

export default function SablonKutuphanesi({
  sinifSeviyesi,
  sinavTuru,
  organizationId,
  onSelect,
  onCustom
}: SablonKutuphanesiProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSinif, setFilterSinif] = useState<SinifSeviyesi | 'all'>(sinifSeviyesi || 'all');
  const [filterSinav, setFilterSinav] = useState<SinavTuru | 'all'>(sinavTuru || 'all');
  const [selectedSablon, setSelectedSablon] = useState<OptikFormSablonu | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ TEK VERİ KAYNAĞI: Supabase API
  // localStorage KALDIRILDI - Artık tüm bilgisayarlarda aynı şablonlar görünür
  // ═══════════════════════════════════════════════════════════════════════════
  const [dbSablonlar, setDbSablonlar] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // API'den şablonları yükle
  React.useEffect(() => {
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
          console.log('✅ Optik şablonlar API\'den yüklendi:', json.data.opticTemplates.length);
          setDbSablonlar(json.data.opticTemplates);
        } else {
          console.warn('⚠️ Optik şablon API hatası:', json.error);
        }
      } catch (e) {
        console.error('❌ Şablon yükleme hatası:', e);
      } finally {
        setLoadingTemplates(false);
      }
    };
    
    fetchTemplates();
  }, [organizationId]);
  
  // Gizli şablonlar (sadece UI state - kalıcı değil)
  const [hiddenSablonlar, setHiddenSablonlar] = useState<string[]>([]);
  
  // Yeni şablon formu - GENİŞLETİLMİŞ (Kurum Kodu ve Cinsiyet eklendi)
  const [newSablon, setNewSablon] = useState({
    ad: '',
    yayinevi: 'Özel',
    toplamSoru: 90,
    satirUzunlugu: 204,
    sinifSeviyeleri: ['8'] as SinifSeviyesi[],
    sinavTurleri: ['DENEME'] as SinavTuru[],
    kurumKodu: { baslangic: 1, bitis: 10 },    // YENİ: Kurum Kodu
    ogrenciNo: { baslangic: 11, bitis: 14 },
    tcKimlik: { baslangic: 15, bitis: 25 },
    sinif: { baslangic: 26, bitis: 27 },
    kitapcik: { baslangic: 28, bitis: 28 },
    cinsiyet: { baslangic: 29, bitis: 29 },    // YENİ: Cinsiyet
    ogrenciAdi: { baslangic: 30, bitis: 54 },
    cevaplar: { baslangic: 55, bitis: 204 },
    ozelAlanlar: [] as { ad: string; baslangic: number; bitis: number }[]
  });
  
  // Özel alan ekleme modal
  const [showOzelAlanModal, setShowOzelAlanModal] = useState(false);
  const [yeniOzelAlan, setYeniOzelAlan] = useState({ ad: '', baslangic: 0, bitis: 0 });
  
  // Silme onay
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Gizli şablonları göster/gizle toggle
  const [showHidden, setShowHidden] = useState(false);
  
  // Gizli şablonları temizle
  const clearHiddenSablonlar = () => {
    setHiddenSablonlar([]);
    alert('✅ Tüm şablonlar tekrar gösteriliyor!');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Tüm şablonlar: Supabase API'den gelenler + hazır şablonlar (fallback)
  // ═══════════════════════════════════════════════════════════════════════════
  const allSablonlar = useMemo(() => {
    // API'den şablonlar geldiyse onları kullan
    if (dbSablonlar.length > 0) {
      // DB şablonlarını OptikFormSablonu formatına dönüştür
      const converted = dbSablonlar.map((s: any) => ({
        id: s.id,
        ad: s.sablon_adi,
        yayinevi: s.is_default ? 'Sistem' : 'Kurum',
        aciklama: s.aciklama || '',
        sinifSeviyeleri: ['8'] as SinifSeviyesi[], // Varsayılan
        sinavTurleri: ['LGS', 'DENEME'] as SinavTuru[],
        toplamSoru: s.toplam_soru,
        satirUzunlugu: s.alan_tanimlari?.length > 0 
          ? Math.max(...s.alan_tanimlari.map((a: any) => a.bitis || 0)) 
          : 200,
        alanlar: {
          ogrenciNo: s.alan_tanimlari?.find((a: any) => a.alan === 'ogrenci_no') 
            ? { baslangic: s.alan_tanimlari.find((a: any) => a.alan === 'ogrenci_no').baslangic, bitis: s.alan_tanimlari.find((a: any) => a.alan === 'ogrenci_no').bitis }
            : { baslangic: 1, bitis: 10 },
          ogrenciAdi: s.alan_tanimlari?.find((a: any) => a.alan === 'ogrenci_adi')
            ? { baslangic: s.alan_tanimlari.find((a: any) => a.alan === 'ogrenci_adi').baslangic, bitis: s.alan_tanimlari.find((a: any) => a.alan === 'ogrenci_adi').bitis }
            : { baslangic: 11, bitis: 40 },
          kitapcik: s.kitapcik_pozisyon 
            ? { baslangic: s.kitapcik_pozisyon, bitis: s.kitapcik_pozisyon }
            : undefined,
          cevaplar: { baslangic: s.cevap_baslangic, bitis: s.cevap_baslangic + s.toplam_soru - 1 },
        },
        onerilenIcon: s.is_default ? '📋' : '🏢',
        renk: s.is_default ? '#6366F1' : '#10B981',
      }));
      
      // Gizlileri filtrele
      return showHidden ? converted : converted.filter(s => !hiddenSablonlar.includes(s.id));
    }
    
    // API'den veri gelmediyse hazır şablonları kullan (fallback)
    const hazirlar = showHidden 
      ? OPTIK_FORM_SABLONLARI 
      : OPTIK_FORM_SABLONLARI.filter(s => !hiddenSablonlar.includes(s.id));
    return hazirlar;
  }, [dbSablonlar, hiddenSablonlar, showHidden]);

  // Filtrelenmiş şablonlar
  const filteredSablonlar = useMemo(() => {
    return allSablonlar.filter(sablon => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!sablon.ad.toLowerCase().includes(search) && 
            !sablon.yayinevi.toLowerCase().includes(search)) {
          return false;
        }
      }
      if (filterSinif !== 'all' && !sablon.sinifSeviyeleri.includes(filterSinif)) {
        return false;
      }
      if (filterSinav !== 'all' && !sablon.sinavTurleri.includes(filterSinav)) {
        return false;
      }
      return true;
    });
  }, [allSablonlar, searchTerm, filterSinif, filterSinav]);

  // Şablonu OptikSablon formatına dönüştür
  const convertToOptikSablon = (formSablon: OptikFormSablonu): OptikSablon => {
    const alanTanimlari: OptikAlanTanimi[] = [];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // GÜVENLİ ERİŞİM: formSablon.alanlar veya alt alanlar undefined olabilir
    // ═══════════════════════════════════════════════════════════════════════════
    const alanlar = formSablon.alanlar || {};
    
    // Kurum Kodu (Özdebir formatı için)
    if (alanlar.kurumKodu?.baslangic && alanlar.kurumKodu.baslangic > 0) {
      alanTanimlari.push({
        alan: 'kurum_kodu',
        baslangic: alanlar.kurumKodu.baslangic,
        bitis: alanlar.kurumKodu.bitis || alanlar.kurumKodu.baslangic,
        label: 'Kurum Kodu',
        color: '#6366F1' // indigo
      });
    }
    
    // Öğrenci No (zorunlu alan - varsayılan değerlerle)
    if (alanlar.ogrenciNo?.baslangic) {
      alanTanimlari.push({
        alan: 'ogrenci_no',
        baslangic: alanlar.ogrenciNo.baslangic,
        bitis: alanlar.ogrenciNo.bitis || alanlar.ogrenciNo.baslangic,
        label: 'Öğrenci No',
        color: ALAN_RENKLERI.ogrenci_no
      });
    }
    
    if (alanlar.tcKimlik?.baslangic && alanlar.tcKimlik.baslangic > 0) {
      alanTanimlari.push({
        alan: 'tc',
        baslangic: alanlar.tcKimlik.baslangic,
        bitis: alanlar.tcKimlik.bitis || alanlar.tcKimlik.baslangic,
        label: 'TC Kimlik',
        color: ALAN_RENKLERI.tc
      });
    }
    
    if (alanlar.sinif?.baslangic && alanlar.sinif.baslangic > 0) {
      alanTanimlari.push({
        alan: 'sinif_no',
        baslangic: alanlar.sinif.baslangic,
        bitis: alanlar.sinif.bitis || alanlar.sinif.baslangic,
        label: 'Sınıf',
        color: ALAN_RENKLERI.sinif_no
      });
    }
    
    if (alanlar.kitapcik?.baslangic && alanlar.kitapcik.baslangic > 0) {
      alanTanimlari.push({
        alan: 'kitapcik',
        baslangic: alanlar.kitapcik.baslangic,
        bitis: alanlar.kitapcik.bitis || alanlar.kitapcik.baslangic,
        label: 'Kitapçık',
        color: ALAN_RENKLERI.kitapcik
      });
    }
    
    // Cinsiyet (Özdebir formatı için)
    if (alanlar.cinsiyet?.baslangic && alanlar.cinsiyet.baslangic > 0) {
      alanTanimlari.push({
        alan: 'cinsiyet',
        baslangic: alanlar.cinsiyet.baslangic,
        bitis: alanlar.cinsiyet.bitis || alanlar.cinsiyet.baslangic,
        label: 'Cinsiyet',
        color: '#EC4899' // pink
      });
    }
    
    // Öğrenci Adı (zorunlu alan)
    if (alanlar.ogrenciAdi?.baslangic) {
      alanTanimlari.push({
        alan: 'ogrenci_adi',
        baslangic: alanlar.ogrenciAdi.baslangic,
        bitis: alanlar.ogrenciAdi.bitis || alanlar.ogrenciAdi.baslangic,
        label: 'Öğrenci Adı',
        color: ALAN_RENKLERI.ogrenci_adi
      });
    }
    
    // Cevaplar (zorunlu alan)
    if (alanlar.cevaplar?.baslangic) {
      alanTanimlari.push({
        alan: 'cevaplar',
        baslangic: alanlar.cevaplar.baslangic,
        bitis: alanlar.cevaplar.bitis || alanlar.cevaplar.baslangic,
        label: 'Cevaplar',
        color: ALAN_RENKLERI.cevaplar
      });
    }
    
    return {
      id: formSablon.id,
      sablonAdi: formSablon.ad,
      aciklama: formSablon.aciklama,
      alanTanimlari,
      cevapBaslangic: alanlar.cevaplar?.baslangic || 1,
      toplamSoru: formSablon.toplamSoru,
      isDefault: false,
      isActive: true
    };
  };

  // Şablon seç
  const handleSelect = (sablon: OptikFormSablonu) => {
    setSelectedSablon(sablon);
    const optikSablon = convertToOptikSablon(sablon);
    onSelect(optikSablon);
  };

  // Şablon sil/gizle - Sadece UI'dan gizleme (DB silme için ayrı API gerekir)
  const handleDeleteSablon = (sablonId: string) => {
    console.log('🗑️ Şablon gizleniyor:', sablonId);
    
    // Şablonu UI'dan gizle (session içinde geçerli)
    setHiddenSablonlar(prev => [...prev, sablonId]);
    alert('✅ Şablon bu oturum için gizlendi.');
    
    setDeleteConfirm(null);
    if (selectedSablon?.id === sablonId) {
      setSelectedSablon(null);
    }
  };
  
  // Özel alan ekle
  const handleAddOzelAlan = () => {
    if (!yeniOzelAlan.ad.trim() || yeniOzelAlan.baslangic <= 0 || yeniOzelAlan.bitis <= 0) {
      alert('Tüm alanları doldurun!');
      return;
    }
    setNewSablon(prev => ({
      ...prev,
      ozelAlanlar: [...prev.ozelAlanlar, yeniOzelAlan]
    }));
    setYeniOzelAlan({ ad: '', baslangic: 0, bitis: 0 });
    setShowOzelAlanModal(false);
  };
  
  // Özel alan sil
  const handleRemoveOzelAlan = (index: number) => {
    setNewSablon(prev => ({
      ...prev,
      ozelAlanlar: prev.ozelAlanlar.filter((_, i) => i !== index)
    }));
  };

  // Yeni şablon ekle - Artık API üzerinden yapılmalı (TODO: POST endpoint ekle)
  const handleAddSablon = () => {
    console.log('➕ Yeni şablon ekleme - Supabase API gerekli');
    alert('⚠️ Yeni şablon eklemek için yönetici panelini kullanın.\n\nŞablonlar artık veritabanında tutulmaktadır.');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Başlık ve Kontroller */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-slate-700">Şablon Kütüphanesi</span>
          <span className="text-xs text-slate-400">({filteredSablonlar.length} şablon)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Gizli şablonlar varsa göster butonu */}
          {hiddenSablonlar.length > 0 && (
            <button
              onClick={clearHiddenSablonlar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors"
              title={`${hiddenSablonlar.length} gizli şablon var`}
            >
              <Star size={16} />
              Gizlileri Göster ({hiddenSablonlar.length})
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Yeni Şablon
          </button>
          
          {onCustom && (
            <button
              onClick={onCustom}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm transition-colors"
            >
              <Edit3 size={16} />
              Görsel Editör
            </button>
          )}
        </div>
      </div>

      {/* Arama ve Filtreler - Kompakt */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Şablon ara..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-purple-500 outline-none"
            />
          </div>
        </div>
        
        <select
          value={filterSinif}
          onChange={(e) => setFilterSinif(e.target.value as SinifSeviyesi | 'all')}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-purple-500 outline-none bg-white"
        >
          <option value="all">Tüm Sınıflar</option>
          {Object.entries(SINIF_BILGILERI).map(([key, info]) => (
            <option key={key} value={key}>{info.ad}</option>
          ))}
        </select>
        
        <select
          value={filterSinav}
          onChange={(e) => setFilterSinav(e.target.value as SinavTuru | 'all')}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-purple-500 outline-none bg-white"
        >
          <option value="all">Tüm Türler</option>
          {Object.entries(SINAV_KONFIGURASYONLARI).map(([key, info]) => (
            <option key={key} value={key}>{info.icon} {key}</option>
          ))}
        </select>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* YENİ ŞABLON EKLEME FORMU - BASİT VE MODERN */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddForm && (
          <SimpleSablonForm
            onSave={(sablon) => {
              // TODO: API POST endpoint ile Supabase'e kaydet
              console.log('📋 Yeni şablon (API kaydı gerekli):', sablon);
              alert('⚠️ Şablon oluşturma şu an için devre dışı.\nŞablonlar veritabanında yönetilmektedir.');
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </AnimatePresence>

      {/* KOMPAKT Şablon Kartları - Liste Görünümü */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {filteredSablonlar.map((sablon) => (
          <motion.div
            key={sablon.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`group flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
              selectedSablon?.id === sablon.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50'
            }`}
            onClick={() => handleSelect(sablon)}
          >
            <div className="flex items-center gap-3">
              {/* İkon */}
              <span className="text-2xl">{sablon.onerilenIcon}</span>
              
              {/* Bilgi */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">{sablon.ad}</span>
                  {sablon.id.startsWith('custom-') && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-medium">ÖZEL</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{sablon.yayinevi}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FileText size={10} />
                    {sablon.toplamSoru} soru
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Grid3X3 size={10} />
                    {sablon.satirUzunlugu} kr
                  </span>
                </div>
              </div>
            </div>
            
            {/* Etiketler ve Butonlar */}
            <div className="flex items-center gap-3">
              {/* Sınıf Etiketleri */}
              <div className="flex gap-1">
                {sablon.sinifSeviyeleri.slice(0, 2).map(sinif => (
                  <span
                    key={sinif}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                    style={{ backgroundColor: `${sablon.renk}20`, color: sablon.renk }}
                  >
                    {sinif}. Sınıf
                  </span>
                ))}
                {sablon.sinifSeviyeleri.length > 2 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded-full">
                    +{sablon.sinifSeviyeleri.length - 2}
                  </span>
                )}
              </div>
              
              {/* Aksiyon Butonları - HER ZAMAN GÖRÜNÜR */}
              <div className="flex items-center gap-1">
                {/* Düzenle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Şablonu düzenleme moduna al
                    setNewSablon({
                      ad: sablon.ad,
                      yayinevi: sablon.yayinevi,
                      toplamSoru: sablon.toplamSoru,
                      satirUzunlugu: sablon.satirUzunlugu,
                      sinifSeviyeleri: sablon.sinifSeviyeleri,
                      sinavTurleri: sablon.sinavTurleri,
                      kurumKodu: sablon.alanlar.kurumKodu || { baslangic: 0, bitis: 0 },
                      ogrenciNo: sablon.alanlar.ogrenciNo,
                      ogrenciAdi: sablon.alanlar.ogrenciAdi,
                      tcKimlik: sablon.alanlar.tcKimlik || { baslangic: 0, bitis: 0 },
                      sinif: sablon.alanlar.sinif || { baslangic: 0, bitis: 0 },
                      kitapcik: sablon.alanlar.kitapcik || { baslangic: 0, bitis: 0 },
                      cinsiyet: sablon.alanlar.cinsiyet || { baslangic: 0, bitis: 0 },
                      cevaplar: sablon.alanlar.cevaplar,
                      ozelAlanlar: (sablon.alanlar as any).ozelAlanlar || []
                    });
                    setShowAddForm(true);
                  }}
                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Edit3 size={14} />
                </button>
                
                {/* Sil */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🗑️ Silme onayı isteniyor:', sablon.id);
                    setDeleteConfirm(sablon.id);
                  }}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Silme Onay - DAHA BELİRGİN */}
              {deleteConfirm === sablon.id && (
                <div className="flex items-center gap-2 bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg animate-pulse">
                  <span className="text-sm font-bold text-red-700">Silmek istediğinize emin misiniz?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('✅ Silme onaylandı:', sablon.id);
                      handleDeleteSablon(sablon.id);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm"
                  >
                    Evet, Sil
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(null);
                    }}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium text-sm"
                  >
                    İptal
                  </button>
                </div>
              )}
              
              {/* Seçili işareti */}
              {selectedSablon?.id === sablon.id && deleteConfirm !== sablon.id && (
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sonuç bulunamadı */}
      {filteredSablonlar.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Şablon bulunamadı</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            Yeni Şablon Oluştur
          </button>
        </div>
      )}

      {/* Seçim Onay Barı */}
      {selectedSablon && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedSablon.onerilenIcon}</span>
            <div>
              <p className="font-semibold text-sm">{selectedSablon.ad}</p>
              <p className="text-xs text-purple-200">
                {selectedSablon.toplamSoru} soru · {selectedSablon.satirUzunlugu} karakter
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={18} />
            <span className="text-sm font-medium">Seçildi</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
