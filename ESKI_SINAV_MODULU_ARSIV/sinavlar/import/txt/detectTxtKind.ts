/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TXT FORMAT OTOMATİK TESPİTİ
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Dosyanın OPTIC_RAW mı yoksa REPORT_EXPORT mı olduğunu tespit eder.
 * 
 * OPTIC_RAW sinyalleri:
 * - Satır uzunluğu >= 140 karakter
 * - A-E yoğunluğu yüksek (>= 8%)
 * - Sabit genişlik formatı
 * 
 * REPORT_EXPORT sinyalleri:
 * - Header'da "doğru", "yanlış", "net", "puan" kelimeleri
 * - Tab/virgül/noktalı virgül ayraçlı tablo
 * - A-E yoğunluğu düşük (< 3%)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { DetectResult } from './types';

/**
 * Türkçe karakter normalleştirme (lowercase için)
 */
function trLower(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç');
}

/**
 * TXT formatını otomatik tespit et
 */
export function detectTxtKind(fileContent: string): DetectResult {
  const lines = fileContent
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trimEnd())
    .filter(l => l.trim().length > 0);

  if (lines.length === 0) {
    return { kind: 'UNKNOWN', reason: 'Dosya boş', confidence: 0 };
  }

  // İlk 3 satırı header olarak kontrol et
  const head = trLower(lines.slice(0, 3).join(' | '));
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT_EXPORT SİNYALLERİ
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Sonuç kelimeleri var mı?
  const hasDogruYanlis = 
    (head.includes('doğru') || head.includes('dogru')) &&
    (head.includes('yanlış') || head.includes('yanlis'));
  
  const hasNet = head.includes('net');
  const hasPuan = head.includes('puan');
  const hasLgsPuan = head.includes('lgs') && head.includes('puan');
  
  // Ders bazlı kolonlar var mı?
  const hasDersKolonlari = 
    (head.includes('türkçe') || head.includes('turkce')) ||
    (head.includes('matematik')) ||
    (head.includes('fen'));
  
  // Güçlü REPORT_EXPORT sinyali
  if ((hasDogruYanlis && hasNet) || hasLgsPuan) {
    return { 
      kind: 'REPORT_EXPORT', 
      reason: `Header'da sonuç kelimeleri bulundu (doğru/yanlış/net/puan)`,
      confidence: 0.95 
    };
  }
  
  if (hasPuan && hasDersKolonlari) {
    return { 
      kind: 'REPORT_EXPORT', 
      reason: `Header'da puan ve ders kolonları bulundu`,
      confidence: 0.85 
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIC_RAW SİNYALLERİ
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Örnek satırları analiz et (ilk 20 satır)
  const sampleLines = lines.slice(0, Math.min(20, lines.length));
  const sample = sampleLines.join('\n');
  
  // A-E yoğunluğu
  const onlyAE = (sample.match(/[ABCDE]/gi) || []).length;
  const totalChars = Math.max(1, sample.length);
  const aeRatio = onlyAE / totalChars;
  
  // Ortalama satır uzunluğu
  const avgLen = sampleLines.reduce((s, l) => s + l.length, 0) / sampleLines.length;
  
  // Min satır uzunluğu (boş olmayanlar)
  const minLen = Math.min(...sampleLines.map(l => l.length));
  
  // Güçlü OPTIC_RAW sinyali
  if (avgLen >= 140 && aeRatio >= 0.08) {
    return { 
      kind: 'OPTIC_RAW', 
      reason: `Sabit genişlik format tespit edildi (avgLen=${avgLen.toFixed(0)}, A-E oranı=${(aeRatio * 100).toFixed(1)}%)`,
      confidence: 0.9 
    };
  }
  
  // Orta kuvvetli OPTIC_RAW sinyali
  if (avgLen >= 100 && aeRatio >= 0.05 && minLen >= 90) {
    return { 
      kind: 'OPTIC_RAW', 
      reason: `Muhtemel optik raw (avgLen=${avgLen.toFixed(0)}, A-E oranı=${(aeRatio * 100).toFixed(1)}%)`,
      confidence: 0.7 
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLO FORMATI (ayraçlı)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Tab veya virgül ayraçlı tablo gibi mi?
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  
  const maxDelim = Math.max(tabCount, commaCount, semicolonCount);
  
  if (maxDelim >= 5 && aeRatio < 0.03) {
    return { 
      kind: 'REPORT_EXPORT', 
      reason: `Tablo formatı tespit edildi (${maxDelim + 1} kolon, düşük A-E yoğunluğu)`,
      confidence: 0.6 
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FALLBACK
  // ═══════════════════════════════════════════════════════════════════════════
  
  // A-E çok yüksekse muhtemelen optik
  if (aeRatio >= 0.1) {
    return { 
      kind: 'OPTIC_RAW', 
      reason: `Yüksek A-E yoğunluğu (${(aeRatio * 100).toFixed(1)}%), muhtemel optik raw`,
      confidence: 0.5 
    };
  }
  
  // Header gibi görünüyorsa report
  if (lines.length >= 2 && maxDelim >= 3) {
    return { 
      kind: 'REPORT_EXPORT', 
      reason: `Tablo benzeri yapı (ayraçlı kolonlar)`,
      confidence: 0.4 
    };
  }

  return { 
    kind: 'UNKNOWN', 
    reason: `Format tespit edilemedi (avgLen=${avgLen.toFixed(0)}, A-E=${(aeRatio * 100).toFixed(1)}%)`,
    confidence: 0.2 
  };
}

