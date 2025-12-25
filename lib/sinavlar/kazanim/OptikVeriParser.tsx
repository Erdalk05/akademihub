'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Check,
  X,
  AlertTriangle,
  Users,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  Loader2,
  UserCheck,
  UserX,
  Edit2,
  Save,
  Download
} from 'lucide-react';
import { OptikSablon, OptikAlanTanimi, ParsedOptikSatir, ALAN_RENKLERI, DERS_RENKLERI } from './types';

interface OptikVeriParserProps {
  sablon: OptikSablon | null;
  ogrenciListesi?: { id: string; ogrenciNo: string; ad: string; soyad: string; sinif: string }[];
  onParsed?: (data: ParsedOptikSatir[]) => void;
  onMatchStudents?: (matches: { satir: ParsedOptikSatir; ogrenciId?: string; status: 'matched' | 'unmatched' | 'conflict' }[]) => void;
}

// Türkçe karakter düzeltme haritası
const TURKISH_CHAR_MAP: Record<string, string> = {
  'Ý': 'İ',
  'ý': 'ı',
  'Ð': 'Ğ',
  'ð': 'ğ',
  'Þ': 'Ş',
  'þ': 'ş',
  'Ü': 'Ü',
  'ü': 'ü',
  'Ö': 'Ö',
  'ö': 'ö',
  'Ç': 'Ç',
  'ç': 'ç',
  'I': 'I',
  'i': 'i',
};

export default function OptikVeriParser({
  sablon,
  ogrenciListesi = [],
  onParsed,
  onMatchStudents
}: OptikVeriParserProps) {
  const [rawContent, setRawContent] = useState('');
  const [parsedData, setParsedData] = useState<ParsedOptikSatir[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [selectedSatir, setSelectedSatir] = useState<number | null>(null);
  const [matchResults, setMatchResults] = useState<Map<number, { ogrenciId?: string; status: 'matched' | 'unmatched' | 'conflict' }>>(new Map());

  // Türkçe karakter düzeltme
  const fixTurkishChars = useCallback((text: string): string => {
    let result = text;
    Object.entries(TURKISH_CHAR_MAP).forEach(([from, to]) => {
      result = result.replace(new RegExp(from, 'g'), to);
    });
    return result;
  }, []);

  // Veriyi parse et
  const parseData = useCallback(() => {
    if (!sablon || !rawContent.trim()) return;

    setIsParsing(true);
    const lines = rawContent.trim().split('\n');
    const results: ParsedOptikSatir[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const hatalar: string[] = [];
      const parsed: ParsedOptikSatir = {
        satırNo: index + 1,
        hamVeri: line,
        cevaplar: [],
        hatalar: [],
        isValid: true
      };

      // Her alanı parse et
      sablon.alanTanimlari.forEach((alan) => {
        const value = line.substring(alan.baslangic - 1, alan.bitis).trim();
        const fixedValue = fixTurkishChars(value);

        switch (alan.alan) {
          case 'sinif_no':
            parsed.sinifNo = fixedValue;
            break;
          case 'ogrenci_no':
            parsed.ogrenciNo = fixedValue;
            if (!fixedValue || fixedValue.length < 1) {
              hatalar.push('Öğrenci numarası boş');
            }
            break;
          case 'ogrenci_adi':
            parsed.ogrenciAdi = fixedValue;
            if (!fixedValue || fixedValue.length < 2) {
              hatalar.push('Öğrenci adı eksik veya çok kısa');
            }
            break;
          case 'tc':
            parsed.tc = fixedValue.replace(/\D/g, ''); // Sadece rakamlar
            if (parsed.tc && parsed.tc.length !== 11) {
              hatalar.push(`TC kimlik hatalı: ${parsed.tc.length} karakter`);
            }
            break;
          case 'kitapcik':
            const kitapcik = fixedValue.toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(kitapcik)) {
              parsed.kitapcik = kitapcik as 'A' | 'B' | 'C' | 'D';
            } else if (kitapcik) {
              hatalar.push(`Geçersiz kitapçık: ${kitapcik}`);
            }
            break;
          case 'cevaplar':
            // Cevapları ayrıştır
            for (let i = 0; i < sablon.toplamSoru && i < fixedValue.length; i++) {
              const cevap = fixedValue[i]?.toUpperCase();
              if (['A', 'B', 'C', 'D', 'E'].includes(cevap)) {
                parsed.cevaplar.push(cevap);
              } else if (cevap === ' ' || cevap === '-' || cevap === '_' || cevap === '*') {
                parsed.cevaplar.push(null); // Boş
              } else {
                parsed.cevaplar.push(cevap || null);
              }
            }
            break;
        }
      });

      // Eksik cevapları doldur
      while (parsed.cevaplar.length < sablon.toplamSoru) {
        parsed.cevaplar.push(null);
      }

      parsed.hatalar = hatalar;
      parsed.isValid = hatalar.length === 0;
      results.push(parsed);
    });

    setParsedData(results);
    setIsParsing(false);
    onParsed?.(results);

    // Öğrenci eşleştirme
    matchStudents(results);
  }, [sablon, rawContent, fixTurkishChars, onParsed]);

  // Öğrenci eşleştirme
  const matchStudents = useCallback((data: ParsedOptikSatir[]) => {
    if (ogrenciListesi.length === 0) return;

    const matches = new Map<number, { ogrenciId?: string; status: 'matched' | 'unmatched' | 'conflict' }>();

    data.forEach((satir, index) => {
      // Önce öğrenci numarasıyla eşleştir
      const byNo = ogrenciListesi.find(o => o.ogrenciNo === satir.ogrenciNo);
      
      if (byNo) {
        matches.set(index, { ogrenciId: byNo.id, status: 'matched' });
      } else {
        // İsim benzerliğiyle eşleştir (fuzzy)
        const byName = ogrenciListesi.find(o => {
          const fullName = `${o.ad} ${o.soyad}`.toLowerCase();
          const satırAd = satir.ogrenciAdi?.toLowerCase() || '';
          return fullName.includes(satırAd) || satırAd.includes(fullName);
        });

        if (byName) {
          matches.set(index, { ogrenciId: byName.id, status: 'matched' });
        } else {
          matches.set(index, { status: 'unmatched' });
        }
      }
    });

    setMatchResults(matches);
  }, [ogrenciListesi]);

  // Dosya yükle
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawContent(content);
    };
    reader.readAsText(file, 'windows-1254'); // Türkçe encoding
  }, []);

  // Filtrelenmiş veri
  const filteredData = useMemo(() => {
    let result = parsedData;

    if (filterStatus === 'valid') {
      result = result.filter(d => d.isValid);
    } else if (filterStatus === 'invalid') {
      result = result.filter(d => !d.isValid);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.ogrenciAdi?.toLowerCase().includes(term) ||
        d.ogrenciNo?.toLowerCase().includes(term) ||
        d.tc?.includes(term)
      );
    }

    return result;
  }, [parsedData, filterStatus, searchTerm]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = parsedData.length;
    const valid = parsedData.filter(d => d.isValid).length;
    const matched = Array.from(matchResults.values()).filter(m => m.status === 'matched').length;

    return {
      total,
      valid,
      invalid: total - valid,
      matched,
      unmatched: total - matched
    };
  }, [parsedData, matchResults]);

  // Şablon yoksa uyarı
  if (!sablon) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-amber-50 rounded-xl border-2 border-dashed border-amber-300">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-lg font-medium text-amber-800">Önce Şablon Seçin</p>
        <p className="text-sm text-amber-600 mt-1">Optik veri yüklemek için bir şablon tanımlanmalı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Optik Veri Yükle</h2>
          <p className="text-sm text-slate-500">Şablon: {sablon.sablonAdi}</p>
        </div>
      </div>

      {/* Dosya Yükleme */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all">
          <Upload className="w-10 h-10 text-slate-400 mb-3" />
          <p className="font-medium text-slate-600">TXT Dosyası Yükle</p>
          <p className="text-xs text-slate-400 mt-1">Optik okuyucudan gelen dosya</p>
          <input
            type="file"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <div className="flex flex-col h-40 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
            veya direkt yapıştırın:
          </div>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="Optik veriyi buraya yapıştırın..."
            className="flex-1 p-3 font-mono text-sm resize-none focus:outline-none"
          />
        </div>
      </div>

      {/* Parse Butonu */}
      {rawContent && (
        <button
          onClick={parseData}
          disabled={isParsing}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              İşleniyor...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              Veriyi Ayrıştır ({rawContent.split('\n').filter(l => l.trim()).length} satır)
            </>
          )}
        </button>
      )}

      {/* Sonuçlar */}
      {parsedData.length > 0 && (
        <>
          {/* İstatistikler */}
          <div className="grid grid-cols-5 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <div className="text-xl font-bold text-slate-700">{stats.total}</div>
              <div className="text-xs text-slate-500">Toplam</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <div className="text-xl font-bold text-emerald-600">{stats.valid}</div>
              <div className="text-xs text-slate-500">Geçerli</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <div className="text-xl font-bold text-red-600">{stats.invalid}</div>
              <div className="text-xs text-slate-500">Hatalı</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="text-xl font-bold text-blue-600">{stats.matched}</div>
              <div className="text-xs text-slate-500">Eşleşen</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <div className="text-xl font-bold text-amber-600">{stats.unmatched}</div>
              <div className="text-xs text-slate-500">Eşleşmeyen</div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Öğrenci ara..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
              />
            </div>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'valid', 'invalid'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-white shadow text-purple-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {status === 'all' ? 'Tümü' : status === 'valid' ? 'Geçerli' : 'Hatalı'}
                </button>
              ))}
            </div>
          </div>

          {/* Veri Tablosu */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left text-slate-600 font-semibold">#</th>
                    <th className="px-3 py-3 text-left text-slate-600 font-semibold">Öğrenci No</th>
                    <th className="px-3 py-3 text-left text-slate-600 font-semibold">Ad Soyad</th>
                    <th className="px-3 py-3 text-center text-slate-600 font-semibold">Kitapçık</th>
                    <th className="px-3 py-3 text-center text-slate-600 font-semibold">Cevap</th>
                    <th className="px-3 py-3 text-center text-slate-600 font-semibold">Eşleşme</th>
                    <th className="px-3 py-3 text-center text-slate-600 font-semibold">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((satir, index) => {
                    const match = matchResults.get(parsedData.indexOf(satir));
                    
                    return (
                      <tr
                        key={index}
                        onClick={() => setSelectedSatir(selectedSatir === index ? null : index)}
                        className={`border-t border-slate-100 cursor-pointer transition-colors ${
                          !satir.isValid
                            ? 'bg-red-50 hover:bg-red-100'
                            : selectedSatir === index
                              ? 'bg-purple-50'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-500">{satir.satırNo}</td>
                        <td className="px-3 py-2 font-mono">{satir.ogrenciNo || '-'}</td>
                        <td className="px-3 py-2">{satir.ogrenciAdi || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          {satir.kitapcik ? (
                            <span className="w-7 h-7 inline-flex items-center justify-center bg-purple-100 text-purple-700 rounded-full font-bold text-xs">
                              {satir.kitapcik}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-xs text-slate-500">
                            {satir.cevaplar.filter(c => c).length}/{sablon.toplamSoru}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {match?.status === 'matched' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                              <UserCheck size={12} />
                              Eşleşti
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                              <UserX size={12} />
                              Eşleşmedi
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {satir.isValid ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seçili Satır Detayı */}
          <AnimatePresence>
            {selectedSatir !== null && filteredData[selectedSatir] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4"
              >
                <h4 className="font-semibold text-slate-700">
                  Satır Detayı: {filteredData[selectedSatir].ogrenciAdi}
                </h4>
                
                {/* Hatalar */}
                {filteredData[selectedSatir].hatalar.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-700 mb-1">Hatalar:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {filteredData[selectedSatir].hatalar.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cevaplar */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Cevaplar:</p>
                  <div className="flex flex-wrap gap-1">
                    {filteredData[selectedSatir].cevaplar.map((cevap, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold ${
                          cevap
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                        title={`Soru ${i + 1}`}
                      >
                        {cevap || '-'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ham Veri */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Ham Veri:</p>
                  <code className="block text-xs bg-slate-800 text-slate-100 p-2 rounded font-mono overflow-x-auto">
                    {filteredData[selectedSatir].hamVeri}
                  </code>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Devam Et Butonu */}
          <button
            onClick={() => {
              const matches = parsedData.map((satir, index) => ({
                satir,
                ...matchResults.get(index)
              }));
              onMatchStudents?.(matches as any);
            }}
            disabled={stats.valid === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <ArrowRight size={20} />
            {stats.valid} Öğrenciyle Devam Et
          </button>
        </>
      )}
    </div>
  );
}

