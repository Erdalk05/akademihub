'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Star
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

interface SablonKutuphanesiProps {
  sinifSeviyesi?: SinifSeviyesi;
  sinavTuru?: SinavTuru;
  onSelect: (sablon: OptikSablon) => void;
  onCustom?: () => void;
}

export default function SablonKutuphanesi({
  sinifSeviyesi,
  sinavTuru,
  onSelect,
  onCustom
}: SablonKutuphanesiProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSinif, setFilterSinif] = useState<SinifSeviyesi | 'all'>(sinifSeviyesi || 'all');
  const [filterSinav, setFilterSinav] = useState<SinavTuru | 'all'>(sinavTuru || 'all');
  const [selectedSablon, setSelectedSablon] = useState<OptikFormSablonu | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // LocalStorage'dan özel şablonları yükle
  const [customSablonlar, setCustomSablonlar] = useState<OptikFormSablonu[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('akademihub_optik_sablonlar');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Şablon yükleme hatası:', e);
      }
    }
    return [];
  });
  
  // Gizli (silinen hazır) şablonlar
  const [hiddenSablonlar, setHiddenSablonlar] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('akademihub_hidden_sablonlar');
        if (saved) return JSON.parse(saved);
      } catch (e) { console.warn('Gizli şablon yükleme hatası:', e); }
    }
    return [];
  });
  
  // Özel şablonları localStorage'a kaydet - HER DEĞİŞİKLİKTE
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Her zaman kaydet (boş array dahil - silme işlemi için)
        localStorage.setItem('akademihub_optik_sablonlar', JSON.stringify(customSablonlar));
        console.log('✅ Özel şablonlar kaydedildi:', customSablonlar.length);
      } catch (e) {
        console.error('Şablon kaydetme hatası:', e);
      }
    }
  }, [customSablonlar]);
  
  // Gizli şablonları localStorage'a kaydet
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('akademihub_hidden_sablonlar', JSON.stringify(hiddenSablonlar));
      } catch (e) {
        console.error('Gizli şablon kaydetme hatası:', e);
      }
    }
  }, [hiddenSablonlar]);
  
  // Yeni şablon formu - GENİŞLETİLMİŞ
  const [newSablon, setNewSablon] = useState({
    ad: '',
    yayinevi: 'Özel',
    toplamSoru: 90,
    satirUzunlugu: 150,
    sinifSeviyeleri: ['8'] as SinifSeviyesi[],
    sinavTurleri: ['DENEME'] as SinavTuru[],
    ogrenciNo: { baslangic: 1, bitis: 8 },
    ogrenciAdi: { baslangic: 9, bitis: 28 },
    tcKimlik: { baslangic: 0, bitis: 0 },
    sinif: { baslangic: 0, bitis: 0 },
    kitapcik: { baslangic: 0, bitis: 0 },
    cevaplar: { baslangic: 50, bitis: 139 },
    ozelAlanlar: [] as { ad: string; baslangic: number; bitis: number }[]
  });
  
  // Özel alan ekleme modal
  const [showOzelAlanModal, setShowOzelAlanModal] = useState(false);
  const [yeniOzelAlan, setYeniOzelAlan] = useState({ ad: '', baslangic: 0, bitis: 0 });
  
  // Silme onay
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Tüm şablonlar (hazır + özel) - gizlenenler hariç
  const allSablonlar = useMemo(() => {
    const hazirlar = OPTIK_FORM_SABLONLARI.filter(s => !hiddenSablonlar.includes(s.id));
    return [...hazirlar, ...customSablonlar];
  }, [customSablonlar, hiddenSablonlar]);

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
    
    alanTanimlari.push({
      alan: 'ogrenci_no',
      baslangic: formSablon.alanlar.ogrenciNo.baslangic,
      bitis: formSablon.alanlar.ogrenciNo.bitis,
      label: 'Öğrenci No',
      color: ALAN_RENKLERI.ogrenci_no
    });
    
    alanTanimlari.push({
      alan: 'ogrenci_adi',
      baslangic: formSablon.alanlar.ogrenciAdi.baslangic,
      bitis: formSablon.alanlar.ogrenciAdi.bitis,
      label: 'Öğrenci Adı',
      color: ALAN_RENKLERI.ogrenci_adi
    });
    
    if (formSablon.alanlar.tcKimlik && formSablon.alanlar.tcKimlik.baslangic > 0) {
      alanTanimlari.push({
        alan: 'tc',
        baslangic: formSablon.alanlar.tcKimlik.baslangic,
        bitis: formSablon.alanlar.tcKimlik.bitis,
        label: 'TC Kimlik',
        color: ALAN_RENKLERI.tc
      });
    }
    
    if (formSablon.alanlar.sinif && formSablon.alanlar.sinif.baslangic > 0) {
      alanTanimlari.push({
        alan: 'sinif_no',
        baslangic: formSablon.alanlar.sinif.baslangic,
        bitis: formSablon.alanlar.sinif.bitis,
        label: 'Sınıf',
        color: ALAN_RENKLERI.sinif_no
      });
    }
    
    if (formSablon.alanlar.kitapcik && formSablon.alanlar.kitapcik.baslangic > 0) {
      alanTanimlari.push({
        alan: 'kitapcik',
        baslangic: formSablon.alanlar.kitapcik.baslangic,
        bitis: formSablon.alanlar.kitapcik.bitis,
        label: 'Kitapçık',
        color: ALAN_RENKLERI.kitapcik
      });
    }
    
    alanTanimlari.push({
      alan: 'cevaplar',
      baslangic: formSablon.alanlar.cevaplar.baslangic,
      bitis: formSablon.alanlar.cevaplar.bitis,
      label: 'Cevaplar',
      color: ALAN_RENKLERI.cevaplar
    });
    
    return {
      id: formSablon.id,
      sablonAdi: formSablon.ad,
      aciklama: formSablon.aciklama,
      alanTanimlari,
      cevapBaslangic: formSablon.alanlar.cevaplar.baslangic,
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

  // Şablon sil - HEM ÖZEL HEM HAZIR ŞABLONLAR İÇİN ÇALIŞIR
  const handleDeleteSablon = (sablonId: string) => {
    console.log('🗑️ Şablon siliniyor:', sablonId);
    
    if (sablonId.startsWith('custom-')) {
      // Özel şablon - kalıcı olarak sil
      setCustomSablonlar(prev => {
        const yeni = prev.filter(s => s.id !== sablonId);
        console.log('✅ Özel şablon silindi, kalan:', yeni.length);
        return yeni;
      });
    } else {
      // Hazır şablon - gizle (silinmiş gibi göster)
      setHiddenSablonlar(prev => {
        if (!prev.includes(sablonId)) {
          const yeni = [...prev, sablonId];
          console.log('✅ Hazır şablon gizlendi:', sablonId);
          return yeni;
        }
        return prev;
      });
    }
    
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

  // Yeni şablon ekle
  const handleAddSablon = () => {
    console.log('➕ Yeni şablon ekleniyor...', newSablon);
    
    if (!newSablon.ad.trim()) {
      alert('Şablon adı gerekli!');
      return;
    }
    
    const yeniSablon: OptikFormSablonu = {
      id: `custom-${Date.now()}`,
      ad: newSablon.ad,
      yayinevi: newSablon.yayinevi,
      aciklama: `${newSablon.toplamSoru} soru, özel oluşturulmuş şablon`,
      sinifSeviyeleri: newSablon.sinifSeviyeleri,
      sinavTurleri: newSablon.sinavTurleri,
      toplamSoru: newSablon.toplamSoru,
      satirUzunlugu: newSablon.satirUzunlugu,
      alanlar: {
        ogrenciNo: newSablon.ogrenciNo,
        ogrenciAdi: newSablon.ogrenciAdi,
        tcKimlik: newSablon.tcKimlik.baslangic > 0 ? newSablon.tcKimlik : undefined,
        sinif: newSablon.sinif.baslangic > 0 ? newSablon.sinif : undefined,
        kitapcik: newSablon.kitapcik.baslangic > 0 ? newSablon.kitapcik : undefined,
        cevaplar: newSablon.cevaplar,
        // Özel alanları da ekle
        ...(newSablon.ozelAlanlar.length > 0 && {
          ozelAlanlar: newSablon.ozelAlanlar
        })
      },
      onerilenIcon: '📋',
      renk: '#6366F1'
    };
    
    setCustomSablonlar(prev => {
      const yeniListe = [...prev, yeniSablon];
      console.log('✅ Yeni şablon eklendi:', yeniSablon.ad, '| Toplam:', yeniListe.length);
      return yeniListe;
    });
    setShowAddForm(false);
    
    // Başarı bildirimi
    alert(`✅ "${yeniSablon.ad}" şablonu başarıyla eklendi!`);
    setNewSablon({
      ad: '',
      yayinevi: 'Özel',
      toplamSoru: 90,
      satirUzunlugu: 150,
      sinifSeviyeleri: ['8'],
      sinavTurleri: ['DENEME'],
      ogrenciNo: { baslangic: 1, bitis: 8 },
      ogrenciAdi: { baslangic: 9, bitis: 28 },
      tcKimlik: { baslangic: 0, bitis: 0 },
      sinif: { baslangic: 0, bitis: 0 },
      kitapcik: { baslangic: 0, bitis: 0 },
      cevaplar: { baslangic: 50, bitis: 139 },
      ozelAlanlar: []
    });
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

      {/* Yeni Şablon Ekleme Formu */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-purple-50 rounded-xl p-4 border border-purple-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                <Plus size={18} />
                Yeni Şablon Ekle
              </h4>
              <button onClick={() => setShowAddForm(false)} className="text-purple-500 hover:text-purple-700">
                <X size={18} />
              </button>
            </div>
            
            {/* TEMEL BİLGİLER */}
            <div className="grid grid-cols-6 gap-3 text-sm">
              <div className="col-span-2">
                <label className="block text-xs text-purple-600 mb-1 font-medium">📝 Şablon Adı *</label>
                <input
                  type="text"
                  value={newSablon.ad}
                  onChange={(e) => setNewSablon({...newSablon, ad: e.target.value})}
                  placeholder="Örn: Özel LGS 90 Soru"
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-600 mb-1 font-medium">🏢 Yayınevi</label>
                <input
                  type="text"
                  value={newSablon.yayinevi}
                  onChange={(e) => setNewSablon({...newSablon, yayinevi: e.target.value})}
                  placeholder="Yayınevi adı"
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-600 mb-1 font-medium">📊 Soru Sayısı</label>
                <input
                  type="number"
                  value={newSablon.toplamSoru}
                  onChange={(e) => setNewSablon({...newSablon, toplamSoru: parseInt(e.target.value) || 90})}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-600 mb-1 font-medium">📏 Satır Uzunluğu</label>
                <input
                  type="number"
                  value={newSablon.satirUzunlugu}
                  onChange={(e) => setNewSablon({...newSablon, satirUzunlugu: parseInt(e.target.value) || 150})}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-600 mb-1 font-medium">🎓 Sınıf</label>
                <select
                  value={newSablon.sinifSeviyeleri[0]}
                  onChange={(e) => setNewSablon({...newSablon, sinifSeviyeleri: [e.target.value as SinifSeviyesi]})}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none bg-white"
                >
                  {Object.entries(SINIF_BILGILERI).map(([key, info]) => (
                    <option key={key} value={key}>{info.ad}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* ALAN TANIMLARI */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
              <h5 className="text-xs font-bold text-purple-700 mb-3 flex items-center gap-2">
                📍 Karakter Pozisyonları (Başlangıç - Bitiş)
              </h5>
              
              <div className="grid grid-cols-7 gap-2 text-sm">
                {/* Öğrenci No */}
                <div className="col-span-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <label className="block text-[10px] text-amber-700 mb-1 font-medium">🔢 Öğr. No</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newSablon.ogrenciNo.baslangic}
                      onChange={(e) => setNewSablon({...newSablon, ogrenciNo: {...newSablon.ogrenciNo, baslangic: parseInt(e.target.value) || 0}})}
                      placeholder="Baş"
                      className="w-full px-1 py-1 border border-amber-200 rounded text-center text-xs"
                    />
                    <input
                      type="number"
                      value={newSablon.ogrenciNo.bitis}
                      onChange={(e) => setNewSablon({...newSablon, ogrenciNo: {...newSablon.ogrenciNo, bitis: parseInt(e.target.value) || 0}})}
                      placeholder="Bit"
                      className="w-full px-1 py-1 border border-amber-200 rounded text-center text-xs"
                    />
                  </div>
                </div>
                
                {/* Ad Soyad */}
                <div className="col-span-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <label className="block text-[10px] text-emerald-700 mb-1 font-medium">👤 Ad Soyad</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newSablon.ogrenciAdi.baslangic}
                      onChange={(e) => setNewSablon({...newSablon, ogrenciAdi: {...newSablon.ogrenciAdi, baslangic: parseInt(e.target.value) || 0}})}
                      placeholder="Baş"
                      className="w-full px-1 py-1 border border-emerald-200 rounded text-center text-xs"
                    />
                    <input
                      type="number"
                      value={newSablon.ogrenciAdi.bitis}
                      onChange={(e) => setNewSablon({...newSablon, ogrenciAdi: {...newSablon.ogrenciAdi, bitis: parseInt(e.target.value) || 0}})}
                      placeholder="Bit"
                      className="w-full px-1 py-1 border border-emerald-200 rounded text-center text-xs"
                    />
                  </div>
                </div>
                
                {/* TC */}
                <div className="col-span-1 bg-blue-50 p-2 rounded-lg border border-blue-200">
                  <label className="block text-[10px] text-blue-700 mb-1 font-medium">🆔 TC Kimlik</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newSablon.tcKimlik.baslangic || ''}
                      onChange={(e) => setNewSablon({...newSablon, tcKimlik: {...newSablon.tcKimlik, baslangic: parseInt(e.target.value) || 0}})}
                      placeholder="Baş"
                      className="w-full px-1 py-1 border border-blue-200 rounded text-center text-xs"
                    />
                    <input
                      type="number"
                      value={newSablon.tcKimlik.bitis || ''}
                      onChange={(e) => setNewSablon({...newSablon, tcKimlik: {...newSablon.tcKimlik, bitis: parseInt(e.target.value) || 0}})}
                      placeholder="Bit"
                      className="w-full px-1 py-1 border border-blue-200 rounded text-center text-xs"
                    />
                  </div>
                </div>
                
                {/* Sınıf */}
                <div className="col-span-1 bg-purple-50 p-2 rounded-lg border border-purple-200">
                  <label className="block text-[10px] text-purple-700 mb-1 font-medium">🏫 Sınıf</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newSablon.sinif.baslangic || ''}
                      onChange={(e) => setNewSablon({...newSablon, sinif: {...newSablon.sinif, baslangic: parseInt(e.target.value) || 0}})}
                      placeholder="Baş"
                      className="w-full px-1 py-1 border border-purple-200 rounded text-center text-xs"
                    />
                    <input
                      type="number"
                      value={newSablon.sinif.bitis || ''}
                      onChange={(e) => setNewSablon({...newSablon, sinif: {...newSablon.sinif, bitis: parseInt(e.target.value) || 0}})}
                      placeholder="Bit"
                      className="w-full px-1 py-1 border border-purple-200 rounded text-center text-xs"
                    />
                  </div>
                </div>
                
                {/* Kitapçık */}
                <div className="col-span-1 bg-pink-50 p-2 rounded-lg border border-pink-200">
                  <label className="block text-[10px] text-pink-700 mb-1 font-medium">📖 Kitapçık</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newSablon.kitapcik.baslangic || ''}
                      onChange={(e) => setNewSablon({...newSablon, kitapcik: {...newSablon.kitapcik, baslangic: parseInt(e.target.value) || 0}})}
                      placeholder="Baş"
                      className="w-full px-1 py-1 border border-pink-200 rounded text-center text-xs"
                    />
                    <input
                      type="number"
                      value={newSablon.kitapcik.bitis || ''}
                      onChange={(e) => setNewSablon({...newSablon, kitapcik: {...newSablon.kitapcik, bitis: parseInt(e.target.value) || 0}})}
                      placeholder="Bit"
                      className="w-full px-1 py-1 border border-pink-200 rounded text-center text-xs"
                    />
                  </div>
                </div>
                
                {/* Cevaplar */}
                <div className="col-span-1 bg-green-50 p-2 rounded-lg border border-green-200">
                  <label className="block text-[10px] text-green-700 mb-1 font-medium">✅ Cevaplar *</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newSablon.cevaplar.baslangic}
                      onChange={(e) => setNewSablon({...newSablon, cevaplar: {...newSablon.cevaplar, baslangic: parseInt(e.target.value) || 0}})}
                      placeholder="Baş"
                      className="w-full px-1 py-1 border border-green-200 rounded text-center text-xs"
                    />
                    <input
                      type="number"
                      value={newSablon.cevaplar.bitis}
                      onChange={(e) => setNewSablon({...newSablon, cevaplar: {...newSablon.cevaplar, bitis: parseInt(e.target.value) || 0}})}
                      placeholder="Bit"
                      className="w-full px-1 py-1 border border-green-200 rounded text-center text-xs"
                    />
                  </div>
                </div>
                
                {/* Özel Alan Ekle */}
                <div className="col-span-1">
                  <button
                    onClick={() => setShowOzelAlanModal(true)}
                    className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 bg-indigo-50 hover:bg-indigo-100 border-2 border-dashed border-indigo-300 rounded-lg transition-colors"
                  >
                    <Plus size={16} className="text-indigo-600" />
                    <span className="text-[10px] text-indigo-600 font-medium">Özel Alan</span>
                  </button>
                </div>
              </div>
              
              {/* Eklenen Özel Alanlar */}
              {newSablon.ozelAlanlar.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {newSablon.ozelAlanlar.map((alan, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 rounded-full text-sm">
                      <span className="text-indigo-700 font-medium">{alan.ad}</span>
                      <span className="text-indigo-500 text-xs">({alan.baslangic}-{alan.bitis})</span>
                      <button
                        onClick={() => handleRemoveOzelAlan(i)}
                        className="text-indigo-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Özel Alan Ekleme Modal */}
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
                    className="bg-white rounded-xl p-5 w-[350px] shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Plus size={18} className="text-indigo-600" />
                      Özel Alan Ekle
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Alan Adı *</label>
                        <input
                          type="text"
                          value={yeniOzelAlan.ad}
                          onChange={(e) => setYeniOzelAlan({...yeniOzelAlan, ad: e.target.value})}
                          placeholder="Örn: Veli Telefonu, Şube..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Başlangıç *</label>
                          <input
                            type="number"
                            value={yeniOzelAlan.baslangic || ''}
                            onChange={(e) => setYeniOzelAlan({...yeniOzelAlan, baslangic: parseInt(e.target.value) || 0})}
                            placeholder="Karakter no"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Bitiş *</label>
                          <input
                            type="number"
                            value={yeniOzelAlan.bitis || ''}
                            onChange={(e) => setYeniOzelAlan({...yeniOzelAlan, bitis: parseInt(e.target.value) || 0})}
                            placeholder="Karakter no"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-400">
                        💡 Örnek: Veli Telefonu (140-150), Şube (5-6)
                      </p>
                    </div>
                    
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setShowOzelAlanModal(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleAddOzelAlan}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center gap-2"
                      >
                        <Plus size={14} />
                        Ekle
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                İptal
              </button>
              <button
                onClick={handleAddSablon}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <Save size={16} />
                Kaydet
              </button>
            </div>
          </motion.div>
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
              
              {/* Aksiyon Butonları */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      ogrenciNo: sablon.alanlar.ogrenciNo,
                      ogrenciAdi: sablon.alanlar.ogrenciAdi,
                      tcKimlik: sablon.alanlar.tcKimlik || { baslangic: 0, bitis: 0 },
                      sinif: sablon.alanlar.sinif || { baslangic: 0, bitis: 0 },
                      kitapcik: sablon.alanlar.kitapcik || { baslangic: 0, bitis: 0 },
                      cevaplar: sablon.alanlar.cevaplar,
                      ozelAlanlar: (sablon.alanlar as any).ozelAlanlar || []
                    });
                    setShowAddForm(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Edit3 size={14} />
                </button>
                
                {/* Sil */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(sablon.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Silme Onay */}
              {deleteConfirm === sablon.id && (
                <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                  <span className="text-xs text-red-600">Sil?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSablon(sablon.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(null);
                    }}
                    className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                  >
                    <X size={12} />
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
