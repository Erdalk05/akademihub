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
import {
  parseOpticalFile,
  toBatchOptikSatir,
  LGS_EXAM_STRUCTURE,
  type ParseTemplate,
  type BatchParseResult,
} from '../core/parseEngine';
import {
  detectTxtKind,
  parseReportExportTxt,
  type ReportStudentResult,
  type TxtImportKind,
} from '../import/txt';

interface OptikVeriParserProps {
  sablon: OptikSablon | null;
  ogrenciListesi?: { id: string; ogrenciNo: string; ad: string; soyad: string; sinif: string }[];
  onParsed?: (data: ParsedOptikSatir[]) => void;
  onMatchStudents?: (matches: { satir: ParsedOptikSatir; ogrenciId?: string; status: 'matched' | 'unmatched' | 'conflict' }[]) => void;
  onContinue?: () => void;  // Devam butonuna basıldığında çağrılır
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT_EXPORT CALLBACK
  // REPORT_EXPORT formatı tespit edilirse, bu callback çağrılır.
  // Cevaplar yeniden inşa EDİLMEZ, direkt sonuçlar döner.
  // ═══════════════════════════════════════════════════════════════════════════
  onReportParsed?: (results: ReportStudentResult[], meta: { kind: TxtImportKind; reason: string }) => void;
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
  onMatchStudents,
  onContinue,
  onReportParsed
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

  // 🇹🇷 Türkçe büyük harf dönüşümü
  const turkishToUpperCase = useCallback((text: string): string => {
    if (!text) return '';
    return text
      .replace(/i/g, 'İ')
      .replace(/ı/g, 'I')
      .replace(/ş/g, 'Ş')
      .replace(/ğ/g, 'Ğ')
      .replace(/ü/g, 'Ü')
      .replace(/ö/g, 'Ö')
      .replace(/ç/g, 'Ç')
      .toUpperCase();
  }, []);

  // Öğrenci adını temizle ve TÜRKÇE BÜYÜK HARFE çevir
  const cleanStudentName = useCallback((name: string): string => {
    if (!name) return '';
    
    let cleaned = name;
    
    // 1. Baştaki TÜM sayıları kaldır (örn: "99999ÖYKÜ" -> "ÖYKÜ", "00292SUDEN" -> "SUDEN")
    cleaned = cleaned.replace(/^[\d\s]+/, '').trim();
    
    // 2. Ortadaki sayıları da kaldır (eğer harflerle birleşikse)
    cleaned = cleaned.replace(/\d+/g, ' ').trim();
    
    // 3. Sondaki gereksiz karakterleri kaldır
    cleaned = cleaned.replace(/[\d\s]+$/, '').trim();
    
    // 4. CEVAP SIZINTISINI TEMİZLE - İsim sonundaki A, B, C, D karakterlerini kaldır
    cleaned = cleaned.replace(/\s+[ABCD]{1,5}$/i, '').trim();
    cleaned = cleaned.replace(/\s{2,}[ABCD]+$/i, '').trim();
    
    // 5. Birden fazla boşluğu tek boşluğa indir
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // 6. Türkçe karakterleri düzelt
    cleaned = fixTurkishChars(cleaned);
    
    // 7. Çok kısa isimleri filtrele (en az 2 karakter)
    if (cleaned.length < 2) return name;
    
    // 🇹🇷 8. TÜRKÇE BÜYÜK HARFE ÇEVİR (tüm isimler büyük harf olacak)
    cleaned = turkishToUpperCase(cleaned);
    
    return cleaned;
  }, [fixTurkishChars, turkishToUpperCase]);

  // Öğrenci eşleştirme - parseData'dan ÖNCE tanımlanmalı
  const matchStudentsInternal = useCallback((data: ParsedOptikSatir[]) => {
    console.log('═══════════════════════════════════════════════════');
    console.log('👥 ÖĞRENCİ EŞLEŞTİRME BAŞLATILIYOR');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Sistemdeki öğrenci sayısı:', ogrenciListesi.length);
    console.log('📋 Parse edilen öğrenci sayısı:', data.length);
    
    if (ogrenciListesi.length === 0) {
      console.warn('⚠️ Sistemde kayıtlı öğrenci yok! Eşleştirme yapılamıyor.');
      console.log('💡 İpucu: Supabase\'de students tablosunda aktif öğrenci olduğundan emin olun.');
      
      // Tüm öğrencileri eşleşmedi olarak işaretle
      const matches = new Map<number, { ogrenciId?: string; status: 'matched' | 'unmatched' | 'conflict' }>();
      data.forEach((_, index) => {
        matches.set(index, { status: 'unmatched' });
      });
      setMatchResults(matches);
      return;
    }
    
    // İlk 3 sistemdeki öğrenciyi logla
    console.log('📋 Sistemdeki öğrenci örnekleri:');
    ogrenciListesi.slice(0, 3).forEach((o, i) => {
      console.log(`   ${i + 1}. No: "${o.ogrenciNo}", Ad: "${o.ad} ${o.soyad}", Sınıf: "${o.sinif}"`);
    });

    const matches = new Map<number, { ogrenciId?: string; status: 'matched' | 'unmatched' | 'conflict' }>();
    let matchCount = 0;

    data.forEach((satir, index) => {
      // 1. Önce öğrenci numarasıyla TAM eşleştir
      let matched = ogrenciListesi.find(o => {
        const sistemNo = (o.ogrenciNo || '').trim().toLowerCase();
        const optikNo = (satir.ogrenciNo || '').trim().toLowerCase();
        return sistemNo === optikNo && sistemNo.length > 0;
      });
      
      // 2. Numara eşleşmediyse, numaranın SONUNDA eşleşme ara (örn: "123" içinde "23")
      if (!matched && satir.ogrenciNo) {
        matched = ogrenciListesi.find(o => {
          const sistemNo = (o.ogrenciNo || '').trim();
          const optikNo = (satir.ogrenciNo || '').trim();
          return sistemNo.endsWith(optikNo) || optikNo.endsWith(sistemNo);
        });
      }
      
      // 3. Hala eşleşmediyse, isim benzerliğiyle eşleştir
      if (!matched && satir.ogrenciAdi) {
        matched = ogrenciListesi.find(o => {
          const sistemAd = `${o.ad} ${o.soyad}`.toLowerCase().trim();
          const optikAd = (satir.ogrenciAdi || '').toLowerCase().trim();
          
          // Tam eşleşme
          if (sistemAd === optikAd) return true;
          
          // Kısmi eşleşme (en az %70)
          const sistemParcalar = sistemAd.split(/\s+/);
          const optikParcalar = optikAd.split(/\s+/);
          
          // En az bir parça eşleşmeli
          const eslesenParca = sistemParcalar.filter(s => 
            optikParcalar.some(o => o.includes(s) || s.includes(o))
          );
          
          return eslesenParca.length >= 1;
        });
      }

      if (matched) {
        matches.set(index, { ogrenciId: matched.id, status: 'matched' });
        matchCount++;
        if (matchCount <= 3) {
          console.log(`   ✅ Eşleşti: "${satir.ogrenciNo} - ${satir.ogrenciAdi}" → "${matched.ogrenciNo} - ${matched.ad} ${matched.soyad}"`);
        }
      } else {
        matches.set(index, { status: 'unmatched' });
        if (index < 3) {
          console.log(`   ❌ Eşleşmedi: "${satir.ogrenciNo} - ${satir.ogrenciAdi}"`);
        }
      }
    });

    console.log('───────────────────────────────────────────────────');
    console.log(`📊 SONUÇ: ${matchCount}/${data.length} öğrenci eşleşti (%${Math.round(matchCount/data.length*100)})`);
    console.log('═══════════════════════════════════════════════════');

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

  // ═══════════════════════════════════════════════════════════════════════════
  // DUAL PARSER: OPTIC_RAW + REPORT_EXPORT
  // 
  // 1) OPTIC_RAW: Ham optik veri → cevaplar çıkar → puanlama motoru değerlendirir
  // 2) REPORT_EXPORT: Hazır sonuç → direkt doğru/yanlış/net al → puanlama BYPASS
  //
  // OTOMATİK TESPİT: detectTxtKind() ile format belirlenir
  // ═══════════════════════════════════════════════════════════════════════════
  const parseData = useCallback(() => {
    if (!rawContent.trim()) return;
    
    setIsParsing(true);
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADIM 1: FORMAT TESPİTİ
    // ═══════════════════════════════════════════════════════════════════════
    const detectResult = detectTxtKind(rawContent);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 TXT FORMAT TESPİTİ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Format: ${detectResult.kind}`);
    console.log(`   Sebep: ${detectResult.reason}`);
    console.log(`   Güven: ${(detectResult.confidence * 100).toFixed(0)}%`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADIM 2: REPORT_EXPORT FORMATIYSA → DİREKT SONUÇLARI AL
    // Cevapları yeniden inşa ETME, puanlama motoru ÇALIŞMASIN
    // ═══════════════════════════════════════════════════════════════════════
    if (detectResult.kind === 'REPORT_EXPORT') {
      console.log('📊 REPORT_EXPORT modu aktif - Hazır sonuçlar parse ediliyor...');
      
      const reportResult = parseReportExportTxt(rawContent);
      
      // Callback ile sonuçları gönder
      if (onReportParsed) {
        onReportParsed(reportResult.students, { 
          kind: detectResult.kind, 
          reason: detectResult.reason 
        });
      }
      
      // Optik raw listesi boş (çünkü REPORT_EXPORT)
      setParsedData([]);
      setIsParsing(false);
      
      // Uyarıları göster
      if (reportResult.warnings.length > 0) {
        console.warn('⚠️ Report parse uyarıları:', reportResult.warnings);
      }
      
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADIM 3: OPTIC_RAW FORMATIYSA → MEVCUT ENGINE İLE PARSE
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📋 OPTIC_RAW modu aktif - Optik veriler parse ediliyor...');
    
    // Şablon kontrolü (sadece OPTIC_RAW için gerekli)
    if (!sablon) {
      alert('Optik raw veri için şablon seçilmeli! Lütfen bir şablon seçin.');
      setIsParsing(false);
      return;
    }
    
    // Alan tanımı kontrolü
    if (!sablon.alanTanimlari || sablon.alanTanimlari.length === 0) {
      alert('Şablonda alan tanımı yok! Lütfen geri dönüp şablonu tamamlayın.');
      setIsParsing(false);
      return;
    }
    
    // Şablonu yeni formata dönüştür
    const template: ParseTemplate = {
      sablonAdi: sablon.sablonAdi,
      toplamSoru: sablon.toplamSoru,
      alanTanimlari: sablon.alanTanimlari.map(alan => ({
        alan: alan.alan,
        baslangic: alan.baslangic,
        bitis: alan.bitis,
        label: alan.label,
      })),
    };
    
    // Yeni deterministik parse engine kullan
    const batchResult = parseOpticalFile(rawContent, template, LGS_EXAM_STRUCTURE);
    
    // Eski formata dönüştür (geriye uyumluluk)
    const results = toBatchOptikSatir(batchResult);
    
    // İstatistikleri logla
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 PARSE SONUÇLARI (Yeni Engine V1.0)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   ✅ Başarılı: ${batchResult.stats.successCount}`);
    console.log(`   ⚠️ İnceleme Gerekli: ${batchResult.stats.needsReviewCount}`);
    console.log(`   ❌ Reddedildi: ${batchResult.stats.rejectedCount}`);
    console.log(`   📈 Ortalama Güven: ${(batchResult.stats.averageConfidence * 100).toFixed(1)}%`);
    
    if (batchResult.warnings.length > 0) {
      console.log('   ⚠️ Uyarılar:');
      batchResult.warnings.forEach(w => console.log(`      - ${w}`));
    }
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Reddedilen öğrenciler için uyarı göster
    if (batchResult.stats.rejectedCount > 0) {
      console.warn(`⚠️ ${batchResult.stats.rejectedCount} öğrenci cevap hizalama hatası nedeniyle "REJECTED" işaretlendi!`);
      console.warn('   Bu öğrenciler puanlamaya dahil EDİLMEYECEK. Manuel inceleme gerekli.');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 🔬 DEBUG: OPTIC_RAW CEVAP BAŞLANGIÇ ANALİZİ
    // Mevcut sisteme DOKUNMAZ - sadece teşhis amaçlı
    // ═══════════════════════════════════════════════════════════════════════
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔬 DEBUG: OPTIC_RAW CEVAP BAŞLANGIÇ ANALİZİ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   Bu analiz SADECE teşhis amaçlıdır. Puanlama/parse etkilenmez.');
    console.log('───────────────────────────────────────────────────────────────');
    
    const lines = rawContent.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
    const debugRows: { ad: string; startIdx: number; first20: string; rawLen: number }[] = [];
    
    lines.slice(0, Math.min(20, lines.length)).forEach((line, idx) => {
      // Ham satırda A-E dizisi arama
      const upperLine = line.toUpperCase();
      
      // İlk anlamlı A-E başlangıcını bul
      // "Anlamlı" = en az 3 ardışık A-E karakteri (boşluk hariç)
      let answerStartIdx = -1;
      let consecutiveCount = 0;
      let firstConsecutiveStart = -1;
      
      for (let i = 0; i < upperLine.length; i++) {
        const ch = upperLine[i];
        if (ch === 'A' || ch === 'B' || ch === 'C' || ch === 'D' || ch === 'E') {
          if (consecutiveCount === 0) {
            firstConsecutiveStart = i;
          }
          consecutiveCount++;
          if (consecutiveCount >= 3 && answerStartIdx === -1) {
            answerStartIdx = firstConsecutiveStart;
          }
        } else if (ch !== ' ') {
          // Boşluk değilse sıfırla
          consecutiveCount = 0;
          firstConsecutiveStart = -1;
        }
        // Boşluksa devam et (boşluk sırayı bozmaz)
      }
      
      // İlk 20 cevabı çıkar (sadece A-E karakterleri)
      let first20 = '';
      if (answerStartIdx >= 0) {
        for (let i = answerStartIdx; i < upperLine.length && first20.length < 20; i++) {
          const ch = upperLine[i];
          if (ch === 'A' || ch === 'B' || ch === 'C' || ch === 'D' || ch === 'E') {
            first20 += ch;
          } else if (ch === ' ') {
            first20 += '_'; // Boşluğu görünür yap
          }
        }
      }
      
      // Öğrenci adını çıkar (şablondan)
      const ogrenciAdi = results[idx]?.ogrenciAdi || `Satır ${idx + 1}`;
      
      debugRows.push({
        ad: ogrenciAdi.substring(0, 20).padEnd(20),
        startIdx: answerStartIdx,
        first20: first20.padEnd(20),
        rawLen: line.length
      });
    });
    
    // Tablo formatında logla
    console.log('');
    console.log('   ÖĞRENCİ ADI          | START | İLK 20 CEVAP         | SATIR UZ.');
    console.log('   ─────────────────────┼───────┼──────────────────────┼──────────');
    
    debugRows.forEach(row => {
      console.log(`   ${row.ad} | ${String(row.startIdx).padStart(5)} | ${row.first20} | ${row.rawLen}`);
    });
    
    console.log('───────────────────────────────────────────────────────────────');
    console.log('   NOT: "_" = boşluk karakteri');
    console.log('   START = İlk anlamlı A-E dizisinin başladığı karakter indeksi');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    setParsedData(results);
    setIsParsing(false);
    onParsed?.(results);

    // Öğrenci eşleştirme
    matchStudentsInternal(results);
  }, [sablon, rawContent, onParsed, onReportParsed, matchStudentsInternal]);


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
          {(sablon.alanTanimlari || []).map((alan, i) => (
            alan && typeof alan.baslangic === 'number' ? (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: `${alan.color || '#64748B'}20`, color: alan.color || '#64748B' }}
              >
                <span className="font-medium">{alan.label || 'Alan'}</span>
                <span className="text-xs opacity-70">({alan.baslangic ?? '?'}-{alan.bitis ?? '?'})</span>
              </div>
            ) : null
          ))}
        </div>
        {(!sablon.alanTanimlari || sablon.alanTanimlari.length === 0) && (
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
                    <th className="px-3 py-3 text-center text-slate-600 font-semibold">İşlem</th>
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
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const originalIndex = parsedData.indexOf(satir);
                              setSelectedSatir(index);
                              setEditingIndex(originalIndex);
                              setEditForm({
                                ogrenciNo: satir.ogrenciNo || '',
                                ogrenciAdi: satir.ogrenciAdi || '',
                                kitapcik: satir.kitapcik || ''
                              });
                            }}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 size={14} />
                          </button>
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
              console.log('🚀 Devam Et butonuna tıklandı');
              console.log('📊 Geçerli öğrenci sayısı:', stats.valid);
              
              // 1. Eşleştirme sonuçlarını callback ile gönder
              const matches = parsedData.map((satir, index) => ({
                satir,
                ogrenciId: matchResults.get(index)?.ogrenciId,
                status: matchResults.get(index)?.status || 'unmatched'
              }));
              
              console.log('📋 Eşleştirme sonuçları:', matches.length);
              onMatchStudents?.(matches as any);
              
              // 2. Sonraki adıma geç
              if (onContinue) {
                console.log('➡️ Sonraki adıma geçiliyor...');
                onContinue();
              } else {
                console.warn('⚠️ onContinue callback tanımlı değil!');
              }
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

