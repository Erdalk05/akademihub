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

// Türkçe karakter düzeltme haritası - GENİŞLETİLMİŞ
const TURKISH_CHAR_MAP: Record<string, string> = {
  // Standart bozuk karakterler
  'Ý': 'İ',
  'ý': 'ı',
  'Ð': 'Ğ',
  'ð': 'ğ',
  'Þ': 'Ş',
  'þ': 'ş',
  
  // Optik okuyucu kaynaklı bozuk karakterler
  '«': 'ç',  // Kılı« → Kılıç
  '»': 'ş',  // 
  '¼': 'ğ',
  '½': 'ü',
  '¾': 'ö',
  '¿': 'ı',
  'Ã': 'Ç',
  'ã': 'ç',
  'Â': 'Ş',
  'â': 'ş',
  'á': 'ğ',
  'À': 'Ğ',
  'à': 'ğ',
  'ñ': 'ğ',
  'Ñ': 'Ğ',
  'ê': 'ş',
  'Ê': 'Ş',
  'é': 'ş',
  'É': 'Ş',
  'è': 'ğ',
  'È': 'Ğ',
  'ë': 'ı',
  'Ë': 'İ',
  'î': 'ı',
  'Î': 'İ',
  'ï': 'ı',
  'Ï': 'İ',
  'ô': 'ö',
  'Ô': 'Ö',
  'û': 'ü',
  'Û': 'Ü',
  
  // İsim içindeki tire - genellikle ğ
  // Bu ayrı işlenecek
  
  // Latin-1 ve Windows-1254 dönüşümleri
  '\u00c7': 'Ç',
  '\u00e7': 'ç',
  '\u011e': 'Ğ',
  '\u011f': 'ğ',
  '\u0130': 'İ',
  '\u0131': 'ı',
  '\u00d6': 'Ö',
  '\u00f6': 'ö',
  '\u015e': 'Ş',
  '\u015f': 'ş',
  '\u00dc': 'Ü',
  '\u00fc': 'ü',
};

// Yaygın bozuk isim kalıplarını düzelt
const COMMON_NAME_FIXES: Record<string, string> = {
  'Do-an': 'Doğan',
  'DO-AN': 'DOĞAN',
  'Ya-mur': 'Yağmur',
  'YA-MUR': 'YAĞMUR',
  'Er-an': 'Ergan',
  'ER-AN': 'ERGAN',
  'O-uz': 'Oğuz',
  'O-UZ': 'OĞUZ',
  'Tu-ba': 'Tuğba',
  'TU-BA': 'TUĞBA',
  'Tu-çe': 'Tuğçe',
  'TU-ÇE': 'TUĞÇE',
  'Ça-la': 'Çağla',
  'ÇA-LA': 'ÇAĞLA',
  'Ça-lar': 'Çağlar',
  'ÇA-LAR': 'ÇAĞLAR',
  'Da-': 'Dağ',
  'DA-': 'DAĞ',
  '-ul': 'ğul',
  '-UL': 'ĞUL',
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
  
  // Düzenleme modu
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ ogrenciNo: string; ogrenciAdi: string; kitapcik: string }>({ ogrenciNo: '', ogrenciAdi: '', kitapcik: '' });

  // Türkçe karakter düzeltme - GELİŞMİŞ
  const fixTurkishChars = useCallback((text: string): string => {
    let result = text;
    
    // 1. Önce yaygın isim kalıplarını düzelt
    Object.entries(COMMON_NAME_FIXES).forEach(([from, to]) => {
      result = result.replace(new RegExp(from, 'gi'), to);
    });
    
    // 2. Sonra karakter haritasını uygula
    Object.entries(TURKISH_CHAR_MAP).forEach(([from, to]) => {
      result = result.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
    });
    
    // 3. İsim içindeki tek tire genellikle ğ (harfler arasındaysa)
    result = result.replace(/([a-zA-ZğüşıöçĞÜŞİÖÇ])-([a-zA-ZğüşıöçĞÜŞİÖÇ])/gi, '$1ğ$2');
    
    // 4. Çift karakterleri düzelt
    result = result.replace(/ğğ/g, 'ğ');
    result = result.replace(/şş/g, 'ş');
    result = result.replace(/çç/g, 'ç');
    
    return result;
  }, []);

  // Öğrenci adını temizle - baştaki sayıları ve gereksiz karakterleri kaldır
  const cleanStudentName = useCallback((name: string): string => {
    if (!name) return '';
    
    let cleaned = name;
    
    // 1. Baştaki TÜM sayıları kaldır (örn: "99999ÖYKÜ" -> "ÖYKÜ", "00292SUDEN" -> "SUDEN")
    cleaned = cleaned.replace(/^[\d\s]+/, '').trim();
    
    // 2. Ortadaki sayıları da kaldır (eğer harflerle birleşikse)
    // Örn: "ÖYKÜ123ELİ" -> "ÖYKÜ ELİ"
    cleaned = cleaned.replace(/\d+/g, ' ').trim();
    
    // 3. Sondaki gereksiz karakterleri kaldır
    cleaned = cleaned.replace(/[\d\s]+$/, '').trim();
    
    // 4. Birden fazla boşluğu tek boşluğa indir
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // 5. Türkçe karakterleri düzelt
    cleaned = fixTurkishChars(cleaned);
    
    // 6. Çok kısa isimleri filtrele (en az 2 karakter)
    if (cleaned.length < 2) return name; // Orijinali döndür
    
    // 7. Ad Soyad formatına dönüştür (başharfler büyük)
    cleaned = cleaned.split(' ')
      .filter(word => word.length > 0) // Boş kelimelerı filtrele
      .map(word => {
        // Türkçe karakterler için özel işlem
        const firstChar = word.charAt(0).toUpperCase();
        const rest = word.slice(1).toLowerCase();
        return firstChar + rest;
      })
      .join(' ');
    
    return cleaned;
  }, [fixTurkishChars]);

  // Öğrenci eşleştirme - parseData'dan ÖNCE tanımlanmalı
  const matchStudentsInternal = useCallback((data: ParsedOptikSatir[]) => {
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
          const satirAd = satir.ogrenciAdi?.toLowerCase() || '';
          return fullName.includes(satirAd) || satirAd.includes(fullName);
        });

        if (byName) {
          matches.set(index, { ogrenciId: byName.id, status: 'matched' });
        } else {
          matches.set(index, { status: 'unmatched' });
        }
      }
    });

    setMatchResults(matches);
    
    // Callback'i çağır
    if (onMatchStudents) {
      const matchArray = data.map((satir, i) => ({
        satir,
        ogrenciId: matches.get(i)?.ogrenciId,
        status: matches.get(i)?.status || 'unmatched'
      }));
      onMatchStudents(matchArray);
    }
  }, [ogrenciListesi, onMatchStudents]);

  // Veriyi parse et
  const parseData = useCallback(() => {
    if (!sablon || !rawContent.trim()) return;
    
    // Alan tanımı kontrolü
    if (!sablon.alanTanimlari || sablon.alanTanimlari.length === 0) {
      alert('Şablonda alan tanımı yok! Lütfen geri dönüp şablonu tamamlayın.');
      return;
    }

    console.log('📊 Parse başlatılıyor...');
    console.log('Şablon:', sablon.sablonAdi);
    console.log('Alan tanımları:', sablon.alanTanimlari);

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

      // Debug: İlk satır için detaylı log
      if (index === 0) {
        console.log('📝 İlk satır:', line);
        console.log('📏 Uzunluk:', line.length);
      }

      // Her alanı parse et
      sablon.alanTanimlari.forEach((alan) => {
        // 0-indexed için -1
        const startIdx = alan.baslangic - 1;
        const endIdx = alan.bitis;
        
        // Satır yeterince uzun mu?
        if (startIdx >= line.length) {
          hatalar.push(`${alan.label}: Satır çok kısa (${line.length} karakter)`);
          return;
        }
        
        const value = line.substring(startIdx, endIdx).trim();
        const fixedValue = fixTurkishChars(value);

        // Debug: İlk satır için alan değerlerini logla
        if (index === 0) {
          console.log(`  ${alan.label} [${alan.baslangic}-${alan.bitis}]: "${value}"`);
        }

        switch (alan.alan) {
          case 'sinif_no':
          case 'sinif':
            parsed.sinifNo = fixedValue;
            break;
          case 'ogrenci_no':
            parsed.ogrenciNo = fixedValue;
            if (!fixedValue || fixedValue.length < 1) {
              hatalar.push('Öğrenci numarası boş');
            }
            break;
          case 'ogrenci_adi':
            // Öğrenci adını temizle - baştaki sayıları kaldır
            parsed.ogrenciAdi = cleanStudentName(fixedValue);
            if (!parsed.ogrenciAdi || parsed.ogrenciAdi.length < 2) {
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
            // Kitapçık tek karakter olabilir
            const kitapcikRaw = value.trim();
            const kitapcik = kitapcikRaw.length > 0 ? kitapcikRaw[kitapcikRaw.length - 1].toUpperCase() : '';
            if (['A', 'B', 'C', 'D'].includes(kitapcik)) {
              parsed.kitapcik = kitapcik as 'A' | 'B' | 'C' | 'D';
            } else if (kitapcik) {
              // Sayıdan sonra harf varsa onu al (örn: "8C" -> "C")
              const match = kitapcikRaw.match(/[A-D]$/i);
              if (match) {
                parsed.kitapcik = match[0].toUpperCase() as 'A' | 'B' | 'C' | 'D';
              }
            }
            break;
          case 'cevaplar':
            // Cevapları ayrıştır - boşlukları da dahil et
            const cevapStr = line.substring(startIdx, Math.min(endIdx, line.length));
            for (let i = 0; i < sablon.toplamSoru; i++) {
              if (i >= cevapStr.length) {
                parsed.cevaplar.push(null);
                continue;
              }
              const cevap = cevapStr[i]?.toUpperCase();
              if (['A', 'B', 'C', 'D', 'E'].includes(cevap)) {
                parsed.cevaplar.push(cevap);
              } else {
                parsed.cevaplar.push(null); // Boş veya geçersiz
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
      parsed.isValid = hatalar.length === 0 && parsed.ogrenciNo && parsed.ogrenciAdi;
      results.push(parsed);
    });

    console.log('✅ Parse tamamlandı:', results.length, 'satır');
    setParsedData(results);
    setIsParsing(false);
    onParsed?.(results);

    // Öğrenci eşleştirme
    matchStudentsInternal(results);
  }, [sablon, rawContent, fixTurkishChars, cleanStudentName, onParsed, matchStudentsInternal]);


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

  // Şablon alan sayısı kontrolü
  if (!sablon.alanTanimlari || sablon.alanTanimlari.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-red-50 rounded-xl border-2 border-dashed border-red-300">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg font-medium text-red-800">Şablon Eksik!</p>
        <p className="text-sm text-red-600 mt-1">Şablonda hiç alan tanımlanmamış. Lütfen geri dönüp alan tanımlayın.</p>
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
          <p className="text-sm text-slate-500">Şablon: {sablon.sablonAdi || 'Adsız'}</p>
        </div>
      </div>

      {/* Şablon Bilgisi */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            <Eye size={16} />
            Aktif Şablon Bilgisi
          </h3>
          <span className="text-sm text-blue-600">{sablon.toplamSoru} soru</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sablon.alanTanimlari.map((alan, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: `${alan.color || '#64748B'}20`, color: alan.color || '#64748B' }}
            >
              <span className="font-medium">{alan.label}</span>
              <span className="text-xs opacity-70">({alan.baslangic}-{alan.bitis})</span>
            </div>
          ))}
        </div>
        {sablon.alanTanimlari.length === 0 && (
          <p className="text-sm text-red-600 mt-2">⚠️ Şablonda alan tanımı yok!</p>
        )}
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
          
          {/* Eşleşme Bilgi Paneli */}
          {stats.unmatched > 0 && ogrenciListesi.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle size={18} />
                Öğrenci Eşleştirmesi Yapılamadı
              </h4>
              <p className="text-sm text-amber-700 mb-2">
                <strong>"Eşleşmedi"</strong> durumu, optik formdan gelen öğrenci bilgilerinin sistemdeki kayıtlı öğrenci listesiyle eşleştirilemediği anlamına gelir.
              </p>
              <p className="text-sm text-amber-600">
                Bu sorunun nedenleri:
              </p>
              <ul className="text-sm text-amber-600 list-disc list-inside mt-1 space-y-1">
                <li>🔸 Demo modda öğrenci listesi yüklenmemiş</li>
                <li>🔸 Öğrenci numarası sistemde kayıtlı değil</li>
                <li>🔸 Öğrenci adı farklı yazılmış</li>
              </ul>
              <p className="text-xs text-amber-500 mt-3 italic">
                💡 Not: Eşleştirme yapılmadan da sınav sonuçları kaydedilebilir. Öğrenci bilgileri optik formdan alınacaktır.
              </p>
            </div>
          )}

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
                
                {/* Düzenleme Formu veya Hatalar */}
                {editingIndex === selectedSatir ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                      <Edit2 size={16} />
                      Manuel Düzenleme
                    </h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Öğrenci No</label>
                        <input
                          type="text"
                          value={editForm.ogrenciNo}
                          onChange={(e) => setEditForm(prev => ({ ...prev, ogrenciNo: e.target.value }))}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Ad Soyad</label>
                        <input
                          type="text"
                          value={editForm.ogrenciAdi}
                          onChange={(e) => setEditForm(prev => ({ ...prev, ogrenciAdi: e.target.value }))}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Kitapçık</label>
                        <select
                          value={editForm.kitapcik}
                          onChange={(e) => setEditForm(prev => ({ ...prev, kitapcik: e.target.value }))}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none"
                        >
                          <option value="">-</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newData = [...parsedData];
                          const originalIndex = parsedData.indexOf(filteredData[selectedSatir]);
                          newData[originalIndex] = {
                            ...newData[originalIndex],
                            ogrenciNo: editForm.ogrenciNo,
                            ogrenciAdi: editForm.ogrenciAdi,
                            kitapcik: editForm.kitapcik as 'A' | 'B' | 'C' | 'D' | undefined,
                            isValid: true,
                            hatalar: []
                          };
                          setParsedData(newData);
                          setEditingIndex(null);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        <Save size={14} />
                        Kaydet
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Düzenle Butonu */}
                    <button
                      onClick={() => {
                        setEditingIndex(selectedSatir);
                        setEditForm({
                          ogrenciNo: filteredData[selectedSatir].ogrenciNo || '',
                          ogrenciAdi: filteredData[selectedSatir].ogrenciAdi || '',
                          kitapcik: filteredData[selectedSatir].kitapcik || ''
                        });
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                    >
                      <Edit2 size={14} />
                      Bu Satırı Düzenle
                    </button>
                    
                    {/* Hatalar */}
                    {filteredData[selectedSatir].hatalar.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-700 mb-1">⚠️ Tespit Edilen Hatalar:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {filteredData[selectedSatir].hatalar.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
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

