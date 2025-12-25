'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Search,
  Filter,
  Check,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  Info,
  Star,
  Clock,
  FileText,
  Grid3X3,
  Sparkles
} from 'lucide-react';

import {
  OPTIK_FORM_SABLONLARI,
  SINAV_KONFIGURASYONLARI,
  SINIF_BILGILERI,
  OptikFormSablonu,
  SinavTuru,
  SinifSeviyesi,
  getUygunSinavTurleri,
  getSinifOptikSablonlari
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
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Filtrelenmiş şablonlar
  const filteredSablonlar = useMemo(() => {
    return OPTIK_FORM_SABLONLARI.filter(sablon => {
      // Arama filtresi
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!sablon.ad.toLowerCase().includes(search) && 
            !sablon.yayinevi.toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // Sınıf filtresi
      if (filterSinif !== 'all' && !sablon.sinifSeviyeleri.includes(filterSinif)) {
        return false;
      }
      
      // Sınav türü filtresi
      if (filterSinav !== 'all' && !sablon.sinavTurleri.includes(filterSinav)) {
        return false;
      }
      
      return true;
    });
  }, [searchTerm, filterSinif, filterSinav]);

  // Şablonu OptikSablon formatına dönüştür
  const convertToOptikSablon = (formSablon: OptikFormSablonu): OptikSablon => {
    const alanTanimlari: OptikAlanTanimi[] = [];
    
    // Öğrenci No
    alanTanimlari.push({
      alan: 'ogrenci_no',
      baslangic: formSablon.alanlar.ogrenciNo.baslangic,
      bitis: formSablon.alanlar.ogrenciNo.bitis,
      label: 'Öğrenci No',
      color: ALAN_RENKLERI.ogrenci_no
    });
    
    // Öğrenci Adı
    alanTanimlari.push({
      alan: 'ogrenci_adi',
      baslangic: formSablon.alanlar.ogrenciAdi.baslangic,
      bitis: formSablon.alanlar.ogrenciAdi.bitis,
      label: 'Öğrenci Adı',
      color: ALAN_RENKLERI.ogrenci_adi
    });
    
    // TC Kimlik (opsiyonel)
    if (formSablon.alanlar.tcKimlik) {
      alanTanimlari.push({
        alan: 'tc',
        baslangic: formSablon.alanlar.tcKimlik.baslangic,
        bitis: formSablon.alanlar.tcKimlik.bitis,
        label: 'TC Kimlik',
        color: ALAN_RENKLERI.tc
      });
    }
    
    // Sınıf (opsiyonel)
    if (formSablon.alanlar.sinif) {
      alanTanimlari.push({
        alan: 'sinif_no',
        baslangic: formSablon.alanlar.sinif.baslangic,
        bitis: formSablon.alanlar.sinif.bitis,
        label: 'Sınıf',
        color: ALAN_RENKLERI.sinif_no
      });
    }
    
    // Kitapçık (opsiyonel)
    if (formSablon.alanlar.kitapcik) {
      alanTanimlari.push({
        alan: 'kitapcik',
        baslangic: formSablon.alanlar.kitapcik.baslangic,
        bitis: formSablon.alanlar.kitapcik.bitis,
        label: 'Kitapçık',
        color: ALAN_RENKLERI.kitapcik
      });
    }
    
    // Cevaplar
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

  // Sınıf grupları
  const sinifGruplari = [
    { id: 'ilkokul', label: 'İlkokul', siniflar: ['4', '5'] as SinifSeviyesi[], icon: '🎒' },
    { id: 'ortaokul', label: 'Ortaokul', siniflar: ['6', '7', '8'] as SinifSeviyesi[], icon: '📚' },
    { id: 'lise', label: 'Lise', siniflar: ['9', '10', '11', '12'] as SinifSeviyesi[], icon: '🎓' },
    { id: 'mezun', label: 'Mezun', siniflar: ['mezun'] as SinifSeviyesi[], icon: '🏆' },
  ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Library className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Şablon Kütüphanesi</h2>
            <p className="text-sm text-slate-500">
              {filteredSablonlar.length} hazır şablon mevcut
            </p>
          </div>
        </div>
        
        {onCustom && (
          <button
            onClick={onCustom}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            <Sparkles size={18} />
            Özel Şablon Oluştur
          </button>
        )}
      </div>

      {/* Arama ve Filtreler */}
      <div className="flex flex-wrap gap-4">
        {/* Arama */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Şablon ara (yayınevi, ad...)"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>
        </div>
        
        {/* Sınıf Filtresi */}
        <select
          value={filterSinif}
          onChange={(e) => setFilterSinif(e.target.value as SinifSeviyesi | 'all')}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none bg-white"
        >
          <option value="all">Tüm Sınıflar</option>
          {Object.entries(SINIF_BILGILERI).map(([key, info]) => (
            <option key={key} value={key}>{info.ad}</option>
          ))}
        </select>
        
        {/* Sınav Türü Filtresi */}
        <select
          value={filterSinav}
          onChange={(e) => setFilterSinav(e.target.value as SinavTuru | 'all')}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none bg-white"
        >
          <option value="all">Tüm Sınav Türleri</option>
          {Object.entries(SINAV_KONFIGURASYONLARI).map(([key, info]) => (
            <option key={key} value={key}>{info.icon} {info.ad}</option>
          ))}
        </select>
      </div>

      {/* Şablon Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredSablonlar.map((sablon, index) => (
            <motion.div
              key={sablon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedSablon?.id === sablon.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => handleSelect(sablon)}
            >
              {/* Seçili işareti */}
              {selectedSablon?.id === sablon.id && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Şablon bilgisi */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{sablon.onerilenIcon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{sablon.ad}</h3>
                  <p className="text-sm text-slate-500">{sablon.yayinevi}</p>
                </div>
              </div>
              
              {/* Özellikler */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText size={14} className="text-slate-400" />
                  <span>{sablon.toplamSoru} Soru</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Grid3X3 size={14} className="text-slate-400" />
                  <span>{sablon.satirUzunlugu} Karakter</span>
                </div>
              </div>
              
              {/* Etiketler */}
              <div className="flex flex-wrap gap-1.5">
                {sablon.sinifSeviyeleri.map(sinif => (
                  <span
                    key={sinif}
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{ backgroundColor: `${sablon.renk}20`, color: sablon.renk }}
                  >
                    {SINIF_BILGILERI[sinif]?.ad || sinif}
                  </span>
                ))}
                {sablon.sinavTurleri.slice(0, 2).map(sinav => (
                  <span
                    key={sinav}
                    className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full"
                  >
                    {SINAV_KONFIGURASYONLARI[sinav]?.icon}
                  </span>
                ))}
              </div>
              
              {/* Detay butonu */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(showDetails === sablon.id ? null : sablon.id);
                }}
                className="absolute bottom-3 right-3 p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Info size={16} />
              </button>
              
              {/* Detaylar */}
              <AnimatePresence>
                {showDetails === sablon.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-200"
                  >
                    <p className="text-sm text-slate-600 mb-3">{sablon.aciklama}</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Öğrenci No:</span>
                        <span className="font-mono text-slate-700">
                          {sablon.alanlar.ogrenciNo.baslangic}-{sablon.alanlar.ogrenciNo.bitis}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Öğrenci Adı:</span>
                        <span className="font-mono text-slate-700">
                          {sablon.alanlar.ogrenciAdi.baslangic}-{sablon.alanlar.ogrenciAdi.bitis}
                        </span>
                      </div>
                      {sablon.alanlar.kitapcik && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Kitapçık:</span>
                          <span className="font-mono text-slate-700">
                            {sablon.alanlar.kitapcik.baslangic}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cevaplar:</span>
                        <span className="font-mono text-slate-700">
                          {sablon.alanlar.cevaplar.baslangic}-{sablon.alanlar.cevaplar.bitis}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sonuç bulunamadı */}
      {filteredSablonlar.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Şablon Bulunamadı</h3>
          <p className="text-slate-500 mb-4">
            Arama kriterlerinize uygun şablon yok.
          </p>
          {onCustom && (
            <button
              onClick={onCustom}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              Özel Şablon Oluştur
            </button>
          )}
        </div>
      )}

      {/* Seçim Onay */}
      {selectedSablon && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedSablon.onerilenIcon}</span>
              <div>
                <p className="font-bold">{selectedSablon.ad}</p>
                <p className="text-sm text-purple-200">
                  {selectedSablon.toplamSoru} soru · {selectedSablon.satirUzunlugu} karakter
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span className="font-medium">Şablon Seçildi</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

