'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Table, AlertCircle, CheckCircle, XCircle, Users, Link2 } from 'lucide-react';
import type { WizardStep3Data, WizardStep4Data, OptikParseResult, ParsedOptikSatir } from '@/types/spectra-wizard';
import { parseOptikData } from '@/lib/spectra-wizard/optical-parser';
import { cn } from '@/lib/utils';

interface Step4Props {
  step3Data: WizardStep3Data;
  data: WizardStep4Data | null;
  ogrenciListesi?: { id: string; ogrenciNo: string; ad: string; soyad: string; sinif: string }[];
  onChange: (data: WizardStep4Data) => void;
}

export function Step4VeriYukle({ step3Data, data, ogrenciListesi = [], onChange }: Step4Props) {
  const [yuklemeTuru, setYuklemeTuru] = useState<'txt' | 'dat' | 'excel' | 'manuel'>(data?.yuklemeTuru || 'txt');
  const [parseResult, setParseResult] = useState<OptikParseResult | null>(data?.parseResult || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya yükle
  const handleFileUpload = useCallback(async (file: File) => {
    const text = await file.text();
    const result = parseOptikData(text, step3Data.optikSablon);
    
    // Öğrenci eşleştirme
    const eslestirmeler = result.satirlar.map((satir) => {
      const eslesen = ogrenciListesi.find(
        (ogr) => ogr.ogrenciNo === satir.ogrenciNo || 
                 `${ogr.ad} ${ogr.soyad}`.toUpperCase() === satir.ogrenciAdi.toUpperCase()
      );
      
      return {
        optikOgrenciNo: satir.ogrenciNo,
        dbStudentId: eslesen?.id || null,
        isMisafir: !eslesen,
      };
    });

    setParseResult(result);
    onChange({
      yuklemeTuru,
      parseResult: result,
      dosyaAdi: file.name,
      eslestirmeler,
    });
  }, [step3Data.optikSablon, ogrenciListesi, yuklemeTuru, onChange]);

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  // İstatistikler
  const asilSayisi = parseResult?.satirlar.filter(s => 
    ogrenciListesi.some(o => o.ogrenciNo === s.ogrenciNo)
  ).length || 0;
  const misafirSayisi = (parseResult?.basariliSatir || 0) - asilSayisi;

  return (
    <div className="space-y-6">
      {/* Yükleme Türü */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {[
          { id: 'txt' as const, label: 'TXT/DAT', icon: <FileText size={16} /> },
          { id: 'excel' as const, label: 'Excel', icon: <Table size={16} /> },
          { id: 'manuel' as const, label: 'Manuel', icon: <Users size={16} /> },
        ].map((tur) => (
          <button
            key={tur.id}
            onClick={() => setYuklemeTuru(tur.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
              yuklemeTuru === tur.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tur.icon}
            {tur.label}
          </button>
        ))}
      </div>

      {/* DOSYA YÜKLEME */}
      {(yuklemeTuru === 'txt' || yuklemeTuru === 'excel') && !parseResult && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-12 text-center transition-all',
            isDragOver
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <Upload className={cn('w-12 h-12 mx-auto mb-4', isDragOver ? 'text-emerald-500' : 'text-gray-400')} />
          <p className="text-gray-600 mb-2">
            {yuklemeTuru === 'txt' ? 'TXT veya DAT dosyasını' : 'Excel dosyasını'} buraya sürükleyin
          </p>
          <p className="text-sm text-gray-400 mb-4">
            veya
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={yuklemeTuru === 'txt' ? '.txt,.dat' : '.xlsx,.xls,.csv'}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
          >
            Dosya Seç
          </button>
        </div>
      )}

      {/* PARSE SONUCU */}
      {parseResult && (
        <div className="space-y-4">
          {/* Özet Kartlar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{parseResult.toplamSatir}</p>
              <p className="text-sm text-gray-500">Toplam Satır</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-600">{parseResult.basariliSatir}</p>
              <p className="text-sm text-emerald-600">Başarılı</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{asilSayisi}</p>
              <p className="text-sm text-blue-600">Asil Öğrenci</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">{misafirSayisi}</p>
              <p className="text-sm text-amber-600">Misafir</p>
            </div>
          </div>

          {/* Hatalar */}
          {parseResult.hatalar.length > 0 && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-red-500" size={18} />
                <span className="font-semibold text-red-700">Hatalar ({parseResult.hatalar.length})</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {parseResult.hatalar.slice(0, 5).map((hata, i) => (
                  <li key={i}>• {hata}</li>
                ))}
                {parseResult.hatalar.length > 5 && (
                  <li className="text-red-500">... ve {parseResult.hatalar.length - 5} hata daha</li>
                )}
              </ul>
            </div>
          )}

          {/* Uyarılar */}
          {parseResult.uyarilar.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-amber-500" size={18} />
                <span className="font-semibold text-amber-700">Uyarılar</span>
              </div>
              <ul className="text-sm text-amber-600 space-y-1">
                {parseResult.uyarilar.map((uyari, i) => (
                  <li key={i}>• {uyari}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Öğrenci Listesi Önizleme */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-semibold text-gray-700">Öğrenci Önizleme</h4>
              <span className="text-sm text-gray-500">{parseResult.basariliSatir} öğrenci</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">#</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Öğrenci No</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Ad Soyad</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Sınıf</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Kitapçık</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parseResult.satirlar.slice(0, 20).map((satir, i) => {
                    const eslesen = ogrenciListesi.find(o => o.ogrenciNo === satir.ogrenciNo);
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2 font-mono">{satir.ogrenciNo}</td>
                        <td className="px-4 py-2">{satir.ogrenciAdi}</td>
                        <td className="px-4 py-2">{satir.sinif || '-'}</td>
                        <td className="px-4 py-2 font-bold">{satir.kitapcik}</td>
                        <td className="px-4 py-2">
                          {eslesen ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                              <Link2 size={12} />
                              Eşleşti
                            </span>
                          ) : satir.hatalar.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              <XCircle size={12} />
                              Hata
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                              <Users size={12} />
                              Misafir
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {parseResult.satirlar.length > 20 && (
                <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                  ... ve {parseResult.satirlar.length - 20} öğrenci daha
                </div>
              )}
            </div>
          </div>

          {/* Yeniden Yükle */}
          <button
            onClick={() => {
              setParseResult(null);
              onChange({ ...data!, parseResult: undefined, eslestirmeler: [] });
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Farklı dosya yükle
          </button>
        </div>
      )}

      {/* MANUEL GİRİŞ */}
      {yuklemeTuru === 'manuel' && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Manuel giriş henüz aktif değil.</p>
          <p className="text-sm">Dosya yükleyerek devam edin.</p>
        </div>
      )}
    </div>
  );
}

export default Step4VeriYukle;

