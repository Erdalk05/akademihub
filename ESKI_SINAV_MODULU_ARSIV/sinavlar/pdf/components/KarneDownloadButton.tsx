'use client';

/**
 * ============================================
 * KARNE PDF İNDİRME BUTONU
 * ============================================
 * 
 * Basit ve Detaylı karne PDF'lerini indirme butonu
 */

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileText, Download, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import SinavKarnesiBasit, { SinavKarnesiBasitProps } from '../templates/SinavKarnesiBasit';
import SinavKarnesiDetayli, { SinavKarnesiDetayliProps } from '../templates/SinavKarnesiDetayli';
import { generateDemoBasitKarne, generateDemoDetayliKarne } from '../karneGenerator';

interface KarneDownloadButtonProps {
  // Gerçek veri varsa kullan, yoksa demo veri
  basitKarneData?: SinavKarnesiBasitProps;
  detayliKarneData?: SinavKarnesiDetayliProps;
  
  // Öğrenci adı (dosya ismi için)
  ogrenciAdi?: string;
  
  // Sadece belirli bir tipi göster
  showOnlyType?: 'basit' | 'detayli';
  
  // Buton boyutu
  size?: 'sm' | 'md' | 'lg';
  
  // Stil varyantı
  variant?: 'primary' | 'secondary' | 'outline';
}

export const KarneDownloadButton: React.FC<KarneDownloadButtonProps> = ({
  basitKarneData,
  detayliKarneData,
  ogrenciAdi = 'Ogrenci',
  showOnlyType,
  size = 'md',
  variant = 'primary',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Dosya ismi oluştur
  const generateFileName = (type: 'basit' | 'detayli') => {
    const safeName = ogrenciAdi.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ ]/g, '').replace(/\s+/g, '_');
    const date = new Date().toISOString().split('T')[0];
    return `Karne_${safeName}_${type === 'basit' ? 'Ozet' : 'Detayli'}_${date}.pdf`;
  };

  // PDF oluştur ve indir
  const downloadPDF = async (type: 'basit' | 'detayli') => {
    setIsGenerating(type);
    setIsOpen(false);

    try {
      let blob: Blob;
      const fileName = generateFileName(type);

      if (type === 'basit') {
        const data = basitKarneData || generateDemoBasitKarne();
        blob = await pdf(<SinavKarnesiBasit {...data} />).toBlob();
      } else {
        const data = detayliKarneData || generateDemoDetayliKarne();
        blob = await pdf(<SinavKarnesiDetayli {...data} />).toBlob();
      }

      // İndir
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(null);
    }
  };

  // Boyut sınıfları
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  // Varyant sınıfları
  const variantClasses = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-200',
    outline: 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50',
  };

  // Tek tip göster
  if (showOnlyType) {
    return (
      <button
        onClick={() => downloadPDF(showOnlyType)}
        disabled={isGenerating !== null}
        className={`
          flex items-center rounded-lg font-medium transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 size={size === 'lg' ? 20 : 16} className="animate-spin" />
            <span>Oluşturuluyor...</span>
          </>
        ) : (
          <>
            <Download size={size === 'lg' ? 20 : 16} />
            <span>{showOnlyType === 'basit' ? 'Özet Karne' : 'Detaylı Karne'}</span>
          </>
        )}
      </button>
    );
  }

  // Dropdown menü
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating !== null}
        className={`
          flex items-center rounded-lg font-medium transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 size={size === 'lg' ? 20 : 16} className="animate-spin" />
            <span>Oluşturuluyor...</span>
          </>
        ) : (
          <>
            <Download size={size === 'lg' ? 20 : 16} />
            <span>PDF İndir</span>
            <ChevronDown 
              size={size === 'lg' ? 18 : 14} 
              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
          >
            {/* Basit Karne */}
            <button
              onClick={() => downloadPDF('basit')}
              className="w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Özet Karne</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tek sayfa, ders özeti
                </p>
              </div>
            </button>

            {/* Detaylı Karne */}
            <button
              onClick={() => downloadPDF('detayli')}
              className="w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileText size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Detaylı Karne</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kazanım bazlı analiz (4+ sayfa)
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default KarneDownloadButton;

