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
  const [customSablonlar, setCustomSablonlar] = useState<OptikFormSablonu[]>([]);
  
  // Yeni şablon formu
  const [newSablon, setNewSablon] = useState({
    ad: '',
    yayinevi: 'Özel',
    toplamSoru: 90,
    satirUzunlugu: 150,
    ogrenciNo: { baslangic: 1, bitis: 8 },
    ogrenciAdi: { baslangic: 9, bitis: 28 },
    tcKimlik: { baslangic: 0, bitis: 0 },
    sinif: { baslangic: 0, bitis: 0 },
    kitapcik: { baslangic: 0, bitis: 0 },
    cevaplar: { baslangic: 50, bitis: 139 },
  });

  // Tüm şablonlar (hazır + özel)
  const allSablonlar = useMemo(() => {
    return [...OPTIK_FORM_SABLONLARI, ...customSablonlar];
  }, [customSablonlar]);

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

  // Yeni şablon ekle
  const handleAddSablon = () => {
    if (!newSablon.ad.trim()) {
      alert('Şablon adı gerekli!');
      return;
    }
    
    const yeniSablon: OptikFormSablonu = {
      id: `custom-${Date.now()}`,
      ad: newSablon.ad,
      yayinevi: newSablon.yayinevi,
      aciklama: 'Özel oluşturulmuş şablon',
      sinifSeviyeleri: ['8'],
      sinavTurleri: ['DENEME'],
      toplamSoru: newSablon.toplamSoru,
      satirUzunlugu: newSablon.satirUzunlugu,
      alanlar: {
        ogrenciNo: newSablon.ogrenciNo,
        ogrenciAdi: newSablon.ogrenciAdi,
        tcKimlik: newSablon.tcKimlik.baslangic > 0 ? newSablon.tcKimlik : undefined,
        sinif: newSablon.sinif.baslangic > 0 ? newSablon.sinif : undefined,
        kitapcik: newSablon.kitapcik.baslangic > 0 ? newSablon.kitapcik : undefined,
        cevaplar: newSablon.cevaplar,
      },
      onerilenIcon: '📄',
      renk: '#64748B'
    };
    
    setCustomSablonlar(prev => [...prev, yeniSablon]);
    setShowAddForm(false);
    setNewSablon({
      ad: '',
      yayinevi: 'Özel',
      toplamSoru: 90,
      satirUzunlugu: 150,
      ogrenciNo: { baslangic: 1, bitis: 8 },
      ogrenciAdi: { baslangic: 9, bitis: 28 },
      tcKimlik: { baslangic: 0, bitis: 0 },
      sinif: { baslangic: 0, bitis: 0 },
      kitapcik: { baslangic: 0, bitis: 0 },
      cevaplar: { baslangic: 50, bitis: 139 },
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
            
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="col-span-2">
                <label className="block text-xs text-purple-600 mb-1">Şablon Adı *</label>
                <input
                  type="text"
                  value={newSablon.ad}
                  onChange={(e) => setNewSablon({...newSablon, ad: e.target.value})}
                  placeholder="Örn: Özel LGS 90 Soru"
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-600 mb-1">Toplam Soru</label>
                <input
                  type="number"
                  value={newSablon.toplamSoru}
                  onChange={(e) => setNewSablon({...newSablon, toplamSoru: parseInt(e.target.value) || 90})}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-600 mb-1">Satır Uzunluğu</label>
                <input
                  type="number"
                  value={newSablon.satirUzunlugu}
                  onChange={(e) => setNewSablon({...newSablon, satirUzunlugu: parseInt(e.target.value) || 150})}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-6 gap-2 text-sm">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Öğr No Baş</label>
                <input
                  type="number"
                  value={newSablon.ogrenciNo.baslangic}
                  onChange={(e) => setNewSablon({...newSablon, ogrenciNo: {...newSablon.ogrenciNo, baslangic: parseInt(e.target.value) || 0}})}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Bit</label>
                <input
                  type="number"
                  value={newSablon.ogrenciNo.bitis}
                  onChange={(e) => setNewSablon({...newSablon, ogrenciNo: {...newSablon.ogrenciNo, bitis: parseInt(e.target.value) || 0}})}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ad Baş</label>
                <input
                  type="number"
                  value={newSablon.ogrenciAdi.baslangic}
                  onChange={(e) => setNewSablon({...newSablon, ogrenciAdi: {...newSablon.ogrenciAdi, baslangic: parseInt(e.target.value) || 0}})}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Bit</label>
                <input
                  type="number"
                  value={newSablon.ogrenciAdi.bitis}
                  onChange={(e) => setNewSablon({...newSablon, ogrenciAdi: {...newSablon.ogrenciAdi, bitis: parseInt(e.target.value) || 0}})}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cevap Baş</label>
                <input
                  type="number"
                  value={newSablon.cevaplar.baslangic}
                  onChange={(e) => setNewSablon({...newSablon, cevaplar: {...newSablon.cevaplar, baslangic: parseInt(e.target.value) || 0}})}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Bit</label>
                <input
                  type="number"
                  value={newSablon.cevaplar.bitis}
                  onChange={(e) => setNewSablon({...newSablon, cevaplar: {...newSablon.cevaplar, bitis: parseInt(e.target.value) || 0}})}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-center"
                />
              </div>
            </div>
            
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
            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
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
            
            {/* Etiketler ve Seçim */}
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
              
              {/* Seçili işareti */}
              {selectedSablon?.id === sablon.id && (
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
