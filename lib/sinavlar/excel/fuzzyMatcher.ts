/**
 * 🔍 Fuzzy Column Matcher
 * Excel sütunlarını akıllı eşleştirme
 */

import { similarity } from './levenshtein';
import { turkishNormalize, cleanText } from './turkish';
import { FuzzyMatchConfig } from './types';

/**
 * Predefined column configurations
 */
export const COLUMN_CONFIGS: Record<string, FuzzyMatchConfig> = {
  // DERS KODU (yazım hataları dahil)
  TEST_KODU: {
    target: 'DERS_KODU',
    aliases: [
      'ders kodu',
      'derskodu',
      'ders kod',
      'dders kodu',     // yazım hatası
      'derrs kodu',     // yazım hatası
      'ders koduu',     // yazım hatası
      'test kodu',
      'testkodu',
      'test',
      'kod',
      'test no',
      'test numarası',
      'test id',
      'kodu'
    ],
    threshold: 0.65,  // daha toleranslı
    caseSensitive: false,
    turkishNormalize: true
  },
  
  // DERS ADI
  DERS: {
    target: 'DERS',
    aliases: [
      'ders',
      'dersler',
      'ders adı',
      'ders adi',
      'dersadi',
      'ders adii',      // yazım hatası
      'derss',          // yazım hatası
      'derss adı',      // yazım hatası
      'subject',
      'lesson',
      'alan',
      'alan adı',
      'test adı',
      'branş',
      'brans'
    ],
    threshold: 0.65,  // daha toleranslı
    caseSensitive: false,
    turkishNormalize: true
  },
  
  // SORU DEĞERİ / PUAN (Sorunun puanı/ağırlığı)
  // ÖNEMLİ: "SORU DEĞERİ" sütunu puan anlamına gelir, soru numarası DEĞİL!
  SORU_DEGERI: {
    target: 'SORU_DEGERI',
    aliases: [
      'soru değeri',
      'soru degeri',
      'sorudegeri',
      'soru degerı',     // yazım hatası
      'değer',
      'deger',
      'puan',
      'puanı',
      'ağırlık',
      'agirlik',
      'katsayı',
      'katsayi',
      'soru puanı',
      'soru puani'
    ],
    threshold: 0.75,  // Yüksek threshold - yanlış eşleşme önlenir
    caseSensitive: false,
    turkishNormalize: true
  },
  
  // CEVAP (A kitapçığı doğru cevabı)
  DOGRU_CEVAP: {
    target: 'CEVAP',
    aliases: [
      'cevap',
      'cevab',           // yazım hatası
      'cevapp',          // yazım hatası
      'doğru cevap',
      'dogru cevap',
      'dogrucevap',
      'doğru cevab',     // yazım hatası
      'cevap anahtarı',
      'cevap anahtari',
      'doğru',
      'dogru',
      'answer',
      'correct answer',
      'key',
      'yanıt',
      'yanit',
      'a cevap',
      'a cevabı',
      'a cevabi'
    ],
    threshold: 0.60,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  // KİTAPÇIK A - A Kitapçığındaki soru numarası
  KITAPCIK_A: {
    target: 'KITAPCIK_A',
    aliases: [
      'kitapçık a',
      'kitapcik a',
      'kitapcık a',
      'kıtapçık a',
      'a kitapçık',
      'a kitapcik',
      'a soru no',
      'a soru',
      'soru no',        // Varsayılan soru no = A kitapçık
      'soru numarası',
      'soru numarasi',
      'soruno'
    ],
    threshold: 0.70,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  // B KİTAPÇIĞI CEVABI - B kitapçığının doğru cevabı (A'dan farklı olabilir!)
  B_CEVAP: {
    target: 'B_CEVAP',
    aliases: [
      'b kitapçığı cevap',
      'b kitapcigi cevap',
      'b kitapçığı cevabı',
      'b kitapcigi cevabi',
      'b cevap',
      'b cevabı',
      'b cevabi',
      'b kit cevap',
      'b kit. cevap',
      'kitapçık b cevap',
      'kitapcik b cevap'
    ],
    threshold: 0.70,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  // C KİTAPÇIĞI CEVABI
  C_CEVAP: {
    target: 'C_CEVAP',
    aliases: [
      'c kitapçığı cevap',
      'c kitapcigi cevap',
      'c kitapçığı cevabı',
      'c cevap',
      'c cevabı',
      'c kit cevap',
      'kitapçık c cevap'
    ],
    threshold: 0.70,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  // D KİTAPÇIĞI CEVABI
  D_CEVAP: {
    target: 'D_CEVAP',
    aliases: [
      'd kitapçığı cevap',
      'd kitapcigi cevap',
      'd kitapçığı cevabı',
      'd cevap',
      'd cevabı',
      'd kit cevap',
      'kitapçık d cevap'
    ],
    threshold: 0.70,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  ANA_KONU: {
    target: 'ANA_KONU',
    aliases: [
      'ana konu',
      'üst konu',
      'ust konu',
      'konu',
      'main topic',
      'topic',
      'ünite',
      'unite'
    ],
    threshold: 0.7,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  ALT_KONU: {
    target: 'ALT_KONU',
    aliases: [
      'alt konu',
      'alt başlık',
      'alt baslik',
      'subtopic',
      'sub topic',
      'konu detay'
    ],
    threshold: 0.7,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  KAZANIM_KODU: {
    target: 'KAZANIM_KODU',
    aliases: [
      'kazanım kodu',
      'kazanim kodu',
      'kazanım',
      'kazanim',
      'kazanm kodu',      // yazım hatası
      'kazanıım kodu',    // yazım hatası
      'outcome code',
      'kazanim kod',
      'kzanim kodu'       // yazım hatası
    ],
    threshold: 0.60,
    caseSensitive: false,
    turkishNormalize: true
  },
  
  KAZANIM_METNI: {
    target: 'KAZANIM_METNI',
    aliases: [
      'kazanım metni',
      'kazanim metni',
      'kazanım açıklama',
      'kazanim aciklama',
      'kazanım açıklaması',
      'kazanim aciklamasi',
      'kazanım metnı',    // yazım hatası
      'açıklama',
      'aciklama',
      'description',
      'metin',
      'kazanım tanımı',
      'kazanim tanimi'
    ],
    threshold: 0.60,
    caseSensitive: false,
    turkishNormalize: true
  }
};

/**
 * Match a single file column name against a system column config
 */
export function fuzzyMatch(
  fileColumn: string,
  config: FuzzyMatchConfig
): number {
  // Clean and normalize
  let normalized = cleanText(fileColumn).toLowerCase();
  
  if (config.turkishNormalize) {
    normalized = turkishNormalize(normalized);
  }
  
  const target = config.turkishNormalize 
    ? turkishNormalize(config.target.toLowerCase().replace(/_/g, ' '))
    : config.target.toLowerCase().replace(/_/g, ' ');
  
  // 1. Exact match
  if (normalized === target) {
    return 1.0;
  }
  
  // 2. Check aliases
  for (const alias of config.aliases) {
    const aliasNorm = config.turkishNormalize
      ? turkishNormalize(alias.toLowerCase())
      : alias.toLowerCase();
    
    // Exact alias match
    if (normalized === aliasNorm) {
      return 0.95;
    }
    
    // Contains alias
    if (normalized.includes(aliasNorm)) {
      return 0.85;
    }
    
    // Alias contains input (e.g., "Soru" in file, "Soru No" in alias)
    if (aliasNorm.includes(normalized) && normalized.length >= 2) {
      return 0.80;
    }
  }
  
  // 3. Levenshtein similarity against target
  const targetSimilarity = similarity(normalized, target);
  
  // 4. Best similarity against any alias
  const aliasSimilarities = config.aliases.map(alias => {
    const aliasNorm = config.turkishNormalize
      ? turkishNormalize(alias.toLowerCase())
      : alias.toLowerCase();
    return similarity(normalized, aliasNorm);
  });
  
  const bestAliasSimilarity = Math.max(...aliasSimilarities, 0);
  
  // Return best score
  return Math.max(targetSimilarity, bestAliasSimilarity);
}

/**
 * Find best match for each system column in file headers
 */
export function matchAllColumns(
  fileHeaders: string[]
): Record<string, { fileColumn: string; confidence: number; alternatives: string[] }> {
  
  const results: Record<string, any> = {};
  const usedColumns = new Set<string>();
  
  // Sort configs by priority (required first)
  // Düzeltilmiş sıralama - Excel sütun sırasına göre
  const priorityOrder = [
    'TEST_KODU',      // DERS KODU
    'DERS',           // DERS ADI
    'KITAPCIK_A',     // KİTAPÇIK A (Soru No)
    'SORU_DEGERI',    // SORU DEĞERİ (Puan)
    'DOGRU_CEVAP',    // CEVAP (A Kitapçığı Cevabı)
    'B_CEVAP',        // B KİTAPÇIĞI CEVABI
    'C_CEVAP',        // C KİTAPÇIĞI CEVABI  
    'D_CEVAP',        // D KİTAPÇIĞI CEVABI
    'KAZANIM_KODU',   // KAZANIM KODU
    'KAZANIM_METNI',  // KAZANIM METNİ
    'ANA_KONU', 
    'ALT_KONU'
  ];
  
  for (const systemColumn of priorityOrder) {
    const config = COLUMN_CONFIGS[systemColumn];
    if (!config) continue;
    
    const scores = fileHeaders
      .filter(h => !usedColumns.has(h))
      .map(header => ({
        header,
        score: fuzzyMatch(header, config)
      }));
    
    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    const bestMatch = scores[0];
    
    if (bestMatch && bestMatch.score >= config.threshold) {
      results[systemColumn] = {
        fileColumn: bestMatch.header,
        confidence: Math.round(bestMatch.score * 100),
        alternatives: scores
          .slice(1, 4)
          .filter(s => s.score >= config.threshold * 0.7)
          .map(s => s.header)
      };
      
      // Mark column as used
      usedColumns.add(bestMatch.header);
    }
  }
  
  return results;
}

/**
 * Quick detect subject distribution from data
 */
export function detectSubjectDistribution(
  data: any[],
  dersColumn: string
): { dersAdi: string; soruSayisi: number; baslangicNo?: number; bitisNo?: number }[] {
  
  const subjects = new Map<string, { count: number; firstRow: number; lastRow: number }>();
  
  // Skip header, start from row 1
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const ders = cleanText(row[dersColumn]);
    
    if (ders) {
      if (!subjects.has(ders)) {
        subjects.set(ders, { count: 0, firstRow: i, lastRow: i });
      }
      
      const entry = subjects.get(ders)!;
      entry.count++;
      entry.lastRow = i;
    }
  }
  
  // Convert to array, preserving order
  const result: { dersAdi: string; soruSayisi: number; baslangicNo?: number; bitisNo?: number }[] = [];
  const seen = new Set<string>();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const ders = cleanText(row[dersColumn]);
    
    if (ders && !seen.has(ders)) {
      seen.add(ders);
      const entry = subjects.get(ders)!;
      result.push({
        dersAdi: ders,
        soruSayisi: entry.count,
        baslangicNo: entry.firstRow,
        bitisNo: entry.lastRow
      });
    }
  }
  
  return result;
}

