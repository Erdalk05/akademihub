/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AKADEMIHUB DETERMINISTIK PARSE ENGINE V1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Bu modül TXT optik verilerini parse ederken:
 * - Sessiz düzeltme YAPMAZ
 * - Hatalı veriyi flag'ler
 * - Entropy tabanlı slot tespiti yapar
 * - Ders bazlı blok doğrulaması yapar
 * 
 * KRİTİK KABULLER:
 * 1. Cevap anahtarları DOĞRU
 * 2. Şablon soru sayıları DOĞRU
 * 3. Puanlama formülü DOĞRU
 * 4. Sorun SADECE TXT parse + hizalama
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════════
// TİP TANIMLARI
// ════════════════════════════════════════════════════════════════════════════════

export interface LessonBlock {
  kod: string;           // 'TUR', 'INK', 'DIN', 'ING', 'MAT', 'FEN'
  ad: string;            // 'Türkçe', 'T.C. İnkılap Tarihi', vb.
  soruSayisi: number;    // Bu dersteki soru sayısı
  baslangic: number;     // Global başlangıç indeksi (0-indexed)
  bitis: number;         // Global bitiş indeksi (exclusive)
}

export interface ExamStructure {
  toplamSoru: number;
  dersler: LessonBlock[];
}

export interface TemplateField {
  alan: string;
  baslangic: number;  // 1-indexed (kullanıcı dostu)
  bitis: number;      // 1-indexed (kullanıcı dostu)
  label: string;
}

export interface ParseTemplate {
  sablonAdi: string;
  toplamSoru: number;
  alanTanimlari: TemplateField[];
}

export type AlignmentConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
export type ReviewStatus = 'OK' | 'NEEDS_REVIEW' | 'REJECTED';

export interface AlignmentWarning {
  type: 'LESSON_MISMATCH' | 'TOTAL_MISMATCH' | 'ENTROPY_ANOMALY' | 'SEPARATOR_CONFUSION' | 'SHORT_LINE';
  message: string;
  severity: 'WARNING' | 'ERROR';
  dersKodu?: string;
  expectedCount?: number;
  actualCount?: number;
}

export interface LessonBlockResult {
  dersKodu: string;
  dersAdi: string;
  expectedCount: number;
  actualCount: number;        // A-E harf sayısı (boşlar hariç)
  slotCount: number;          // Slot sayısı (boşlar dahil)
  cevaplar: (string | null)[];
  isComplete: boolean;
  warnings: AlignmentWarning[];
}

export interface ParseDebugInfo {
  rawString: string;
  cleanedString: string;
  rawAnswerField: string;
  detectedSlots: number[];           // Tespit edilen soru slot pozisyonları
  separatorPositions: number[];      // Separator olarak tespit edilen pozisyonlar
  entropyScores: number[];           // Her pozisyonun entropy skoru
  slotConfidence: number;            // 0-1 arası güven skoru
}

export interface ParsedStudentResult {
  // Öğrenci Bilgileri
  ogrenciNo: string;
  ogrenciAdi: string;
  tc?: string;
  sinifNo?: string;
  kitapcik: 'A' | 'B' | 'C' | 'D' | null;
  
  // Parse Sonuçları
  rawString: string;
  cleanedString: string;
  
  // Cevaplar
  detectedAnswerCount: number;       // Tespit edilen A-E harf sayısı
  slotCount: number;                 // Tespit edilen soru slot sayısı
  finalAnswers: (string | null)[];   // 90 uzunlukta final cevap dizisi
  
  // Ders Bazlı Sonuçlar
  lessonBlocks: LessonBlockResult[];
  
  // Doğrulama
  alignmentConfidence: AlignmentConfidence;
  reviewStatus: ReviewStatus;
  alignmentWarnings: AlignmentWarning[];
  
  // Debug
  debug: ParseDebugInfo;
  
  // Meta
  satırNo: number;
  isValid: boolean;
  hatalar: string[];
}

// ════════════════════════════════════════════════════════════════════════════════
// LGS SINAV YAPISI (8. SINIF)
// ════════════════════════════════════════════════════════════════════════════════

export const LGS_EXAM_STRUCTURE: ExamStructure = {
  toplamSoru: 90,
  dersler: [
    { kod: 'TUR', ad: 'Türkçe', soruSayisi: 20, baslangic: 0, bitis: 20 },
    { kod: 'INK', ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, baslangic: 20, bitis: 30 },
    { kod: 'DIN', ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, baslangic: 30, bitis: 40 },
    { kod: 'ING', ad: 'Yabancı Dil (İngilizce)', soruSayisi: 10, baslangic: 40, bitis: 50 },
    { kod: 'MAT', ad: 'Matematik', soruSayisi: 20, baslangic: 50, bitis: 70 },
    { kod: 'FEN', ad: 'Fen Bilimleri', soruSayisi: 20, baslangic: 70, bitis: 90 },
  ],
};

// ════════════════════════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ════════════════════════════════════════════════════════════════════════════════

const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D', 'E']);

/**
 * Türkçe karakter düzeltme
 */
function fixTurkishChars(text: string): string {
  if (!text) return '';
  return text
    .replace(/ı/g, 'I')
    .replace(/«/g, 'C')
    .replace(/»/g, '')
    .replace(/÷/g, 'O')
    .replace(/×/g, '')
    .replace(/\?/g, '')
    .replace(/Ý/g, 'İ')
    .replace(/ý/g, 'ı')
    .replace(/Þ/g, 'Ş')
    .replace(/þ/g, 'ş')
    .replace(/Ð/g, 'Ğ')
    .replace(/ð/g, 'ğ');
}

/**
 * İsim temizleme ve büyük harfe çevirme
 */
function cleanStudentName(name: string): string {
  if (!name) return '';
  
  let cleaned = name
    .replace(/^[\d\s]+/, '')      // Baştaki rakamları kaldır
    .replace(/\d+/g, ' ')         // Ortadaki rakamları kaldır
    .replace(/\s+[ABCD]{1,5}$/i, '') // Sondaki cevap sızıntısını kaldır
    .replace(/\s+/g, ' ')         // Çoklu boşlukları tekle
    .trim();
  
  cleaned = fixTurkishChars(cleaned);
  
  // Türkçe büyük harfe çevir
  return cleaned
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase();
}

/**
 * Kitapçık karakterini parse et
 */
function parseBooklet(char: string): 'A' | 'B' | 'C' | 'D' | null {
  const upper = (char || '').toUpperCase().trim();
  if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D') {
    return upper as 'A' | 'B' | 'C' | 'D';
  }
  // İçinde A veya B var mı?
  const match = upper.match(/[ABCD]/);
  return match ? (match[0] as 'A' | 'B' | 'C' | 'D') : null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTROPY TABANLI SLOT TESPİTİ
// ════════════════════════════════════════════════════════════════════════════════

interface PositionStats {
  position: number;
  answerCount: number;      // A-E görülme sayısı
  spaceCount: number;       // Boşluk görülme sayısı
  totalLines: number;       // Toplam satır sayısı
  answerRatio: number;      // answerCount / totalLines
  entropy: number;          // Shannon entropy
  isLikelySlot: boolean;    // Soru slotu mu?
  isLikelySeparator: boolean; // Separator mı?
}

/**
 * Shannon Entropy hesaplama
 * Yüksek entropy = değişken değerler = muhtemel soru slotu
 * Düşük entropy = sabit değer (genellikle boşluk) = separator
 */
function calculateEntropy(charCounts: Map<string, number>, total: number): number {
  if (total === 0) return 0;
  
  let entropy = 0;
  for (const count of charCounts.values()) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Tüm satırları analiz ederek her pozisyonun istatistiklerini hesapla
 */
function analyzePositions(
  lines: string[],
  answerFieldStart: number, // 0-indexed
  answerFieldEnd: number,   // exclusive
): PositionStats[] {
  const fieldLength = answerFieldEnd - answerFieldStart;
  const stats: PositionStats[] = [];
  
  // Her pozisyon için karakter dağılımı
  const charDistributions: Map<string, number>[] = Array.from(
    { length: fieldLength },
    () => new Map()
  );
  
  // Tüm satırları tara
  const validLines = lines.filter(l => l && l.trim().length > 0);
  
  for (const line of validLines) {
    const answerField = line.substring(answerFieldStart, Math.min(answerFieldEnd, line.length));
    
    for (let i = 0; i < fieldLength; i++) {
      const char = (answerField[i] || ' ').toUpperCase();
      const dist = charDistributions[i];
      dist.set(char, (dist.get(char) || 0) + 1);
    }
  }
  
  // Her pozisyon için istatistik hesapla
  for (let i = 0; i < fieldLength; i++) {
    const dist = charDistributions[i];
    const totalLines = validLines.length;
    
    // A-E sayısı
    let answerCount = 0;
    for (const c of VALID_ANSWERS) {
      answerCount += dist.get(c) || 0;
    }
    
    // Boşluk sayısı
    const spaceCount = dist.get(' ') || 0;
    
    // Entropy
    const entropy = calculateEntropy(dist, totalLines);
    
    // Oranlar
    const answerRatio = totalLines > 0 ? answerCount / totalLines : 0;
    
    // Karar
    // Yüksek answerRatio + yüksek entropy = soru slotu
    // Düşük answerRatio + düşük entropy = separator
    const isLikelySlot = answerRatio >= 0.15 && entropy >= 0.5;
    const isLikelySeparator = answerRatio < 0.1 && spaceCount > totalLines * 0.8;
    
    stats.push({
      position: i,
      answerCount,
      spaceCount,
      totalLines,
      answerRatio,
      entropy,
      isLikelySlot,
      isLikelySeparator,
    });
  }
  
  return stats;
}

/**
 * Entropy tabanlı soru slotlarını seç
 */
function selectQuestionSlots(
  positionStats: PositionStats[],
  expectedSlots: number,
): { slots: number[]; confidence: number; separators: number[]; entropyScores: number[] } {
  // Slot adaylarını sırala: önce answerRatio, sonra entropy
  const candidates = positionStats
    .filter(s => !s.isLikelySeparator)
    .sort((a, b) => {
      // Önce answerRatio'ya göre (yüksek = iyi)
      const ratioScore = b.answerRatio - a.answerRatio;
      if (Math.abs(ratioScore) > 0.1) return ratioScore;
      // Sonra entropy'ye göre (yüksek = iyi)
      return b.entropy - a.entropy;
    });
  
  // En iyi N slot'u seç
  const selectedSlots = candidates
    .slice(0, expectedSlots)
    .map(s => s.position)
    .sort((a, b) => a - b);
  
  // Separator pozisyonları
  const separators = positionStats
    .filter(s => s.isLikelySeparator)
    .map(s => s.position);
  
  // Entropy skorları
  const entropyScores = positionStats.map(s => s.entropy);
  
  // Güven skoru hesapla
  let confidence = 1.0;
  
  // Yeterli slot bulunamadıysa güven düşer
  if (selectedSlots.length < expectedSlots) {
    confidence *= selectedSlots.length / expectedSlots;
  }
  
  // Seçilen slotların ortalama answerRatio'su düşükse güven düşer
  if (candidates.length > 0) {
    const avgRatio = candidates.slice(0, expectedSlots).reduce((s, c) => s + c.answerRatio, 0) / 
                     Math.min(candidates.length, expectedSlots);
    confidence *= Math.min(1, avgRatio / 0.5);
  }
  
  return { slots: selectedSlots, confidence, separators, entropyScores };
}

// ════════════════════════════════════════════════════════════════════════════════
// ANA PARSE FONKSİYONU
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tek bir satırdan cevapları çıkar (slot pozisyonları biliniyor)
 */
function extractAnswersFromLine(
  answerField: string,
  slots: number[],
): (string | null)[] {
  const answers: (string | null)[] = [];
  
  for (const slotPos of slots) {
    const char = (answerField[slotPos] || '').toUpperCase();
    if (VALID_ANSWERS.has(char)) {
      answers.push(char);
    } else {
      answers.push(null); // Boş cevap
    }
  }
  
  return answers;
}

/**
 * Ders bazlı blok doğrulaması
 */
function validateLessonBlocks(
  answers: (string | null)[],
  examStructure: ExamStructure,
): LessonBlockResult[] {
  const results: LessonBlockResult[] = [];
  
  for (const ders of examStructure.dersler) {
    const blockAnswers = answers.slice(ders.baslangic, ders.bitis);
    const actualCount = blockAnswers.filter(a => a !== null).length;
    const warnings: AlignmentWarning[] = [];
    
    // Blok uzunluğu kontrolü
    if (blockAnswers.length !== ders.soruSayisi) {
      warnings.push({
        type: 'LESSON_MISMATCH',
        message: `${ders.ad}: Beklenen ${ders.soruSayisi} soru, alınan ${blockAnswers.length} slot`,
        severity: 'ERROR',
        dersKodu: ders.kod,
        expectedCount: ders.soruSayisi,
        actualCount: blockAnswers.length,
      });
    }
    
    results.push({
      dersKodu: ders.kod,
      dersAdi: ders.ad,
      expectedCount: ders.soruSayisi,
      actualCount,
      slotCount: blockAnswers.length,
      cevaplar: blockAnswers,
      isComplete: blockAnswers.length === ders.soruSayisi,
      warnings,
    });
  }
  
  return results;
}

/**
 * Güven seviyesini belirle
 */
function determineConfidence(
  slotConfidence: number,
  warnings: AlignmentWarning[],
  lessonBlocks: LessonBlockResult[],
): AlignmentConfidence {
  const errorCount = warnings.filter(w => w.severity === 'ERROR').length;
  const incompleteBlocks = lessonBlocks.filter(b => !b.isComplete).length;
  
  if (errorCount > 0 || incompleteBlocks > 0 || slotConfidence < 0.5) {
    return 'CRITICAL';
  }
  if (slotConfidence < 0.7 || warnings.length > 2) {
    return 'LOW';
  }
  if (slotConfidence < 0.85 || warnings.length > 0) {
    return 'MEDIUM';
  }
  return 'HIGH';
}

/**
 * Review durumunu belirle
 */
function determineReviewStatus(
  confidence: AlignmentConfidence,
  warnings: AlignmentWarning[],
): ReviewStatus {
  if (confidence === 'CRITICAL') {
    return 'REJECTED';
  }
  if (confidence === 'LOW' || warnings.some(w => w.severity === 'ERROR')) {
    return 'NEEDS_REVIEW';
  }
  return 'OK';
}

// ════════════════════════════════════════════════════════════════════════════════
// GLOBAL SLOT ANALİZİ (TÜM SATIRLAR İÇİN BİR KEZ)
// ════════════════════════════════════════════════════════════════════════════════

export interface GlobalSlotAnalysis {
  slots: number[];
  separators: number[];
  entropyScores: number[];
  confidence: number;
  positionStats: PositionStats[];
}

/**
 * Tüm TXT satırlarını analiz ederek global slot pozisyonlarını belirle
 */
export function analyzeGlobalSlots(
  lines: string[],
  template: ParseTemplate,
  examStructure: ExamStructure = LGS_EXAM_STRUCTURE,
): GlobalSlotAnalysis {
  // Cevap alanını bul
  const cevapAlan = template.alanTanimlari.find(a => {
    const alanLower = (a.alan || '').toLowerCase();
    const labelLower = (a.label || '').toLowerCase();
    return alanLower.includes('cevap') || labelLower.includes('cevap') || alanLower === 'answers';
  });
  
  if (!cevapAlan) {
    console.error('❌ Cevap alanı bulunamadı!');
    return {
      slots: [],
      separators: [],
      entropyScores: [],
      confidence: 0,
      positionStats: [],
    };
  }
  
  const fieldStart = cevapAlan.baslangic - 1; // 0-indexed
  const fieldEnd = cevapAlan.bitis;           // exclusive
  const fieldLength = fieldEnd - fieldStart;
  
  console.log(`📊 Global Slot Analizi Başlıyor...`);
  console.log(`   Cevap alanı: [${cevapAlan.baslangic}-${cevapAlan.bitis}] (${fieldLength} karakter)`);
  console.log(`   Beklenen soru: ${examStructure.toplamSoru}`);
  console.log(`   Satır sayısı: ${lines.filter(l => l?.trim()).length}`);
  
  // Pozisyon analizi
  const positionStats = analyzePositions(lines, fieldStart, fieldEnd);
  
  // Slot seçimi
  const { slots, confidence, separators, entropyScores } = selectQuestionSlots(
    positionStats,
    examStructure.toplamSoru,
  );
  
  console.log(`   Tespit edilen slot: ${slots.length}`);
  console.log(`   Separator sayısı: ${separators.length}`);
  console.log(`   Güven skoru: ${(confidence * 100).toFixed(1)}%`);
  
  if (slots.length >= 15) {
    console.log(`   İlk 15 slot: [${slots.slice(0, 15).join(', ')}]`);
  }
  
  return { slots, separators, entropyScores, confidence, positionStats };
}

// ════════════════════════════════════════════════════════════════════════════════
// ANA EXPORT: parseStudentAnswers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tek bir öğrenci satırını parse et
 * 
 * @param rawTxtLine Ham TXT satırı
 * @param template Optik şablon
 * @param globalSlots Global slot analizi sonucu
 * @param examStructure Sınav yapısı (LGS varsayılan)
 * @param lineNumber Satır numarası
 */
export function parseStudentAnswers(
  rawTxtLine: string,
  template: ParseTemplate,
  globalSlots: GlobalSlotAnalysis,
  examStructure: ExamStructure = LGS_EXAM_STRUCTURE,
  lineNumber: number = 0,
): ParsedStudentResult {
  const warnings: AlignmentWarning[] = [];
  const hatalar: string[] = [];
  
  // Varsayılan sonuç
  const result: ParsedStudentResult = {
    ogrenciNo: '',
    ogrenciAdi: '',
    tc: undefined,
    sinifNo: undefined,
    kitapcik: null,
    rawString: rawTxtLine,
    cleanedString: '',
    detectedAnswerCount: 0,
    slotCount: 0,
    finalAnswers: [],
    lessonBlocks: [],
    alignmentConfidence: 'CRITICAL',
    reviewStatus: 'REJECTED',
    alignmentWarnings: [],
    debug: {
      rawString: rawTxtLine,
      cleanedString: '',
      rawAnswerField: '',
      detectedSlots: globalSlots.slots,
      separatorPositions: globalSlots.separators,
      entropyScores: globalSlots.entropyScores,
      slotConfidence: globalSlots.confidence,
    },
    satırNo: lineNumber,
    isValid: false,
    hatalar: [],
  };
  
  // Boş satır kontrolü
  if (!rawTxtLine || rawTxtLine.trim().length === 0) {
    hatalar.push('Boş satır');
    result.hatalar = hatalar;
    return result;
  }
  
  // Satır uzunluğu kontrolü
  const minLength = Math.max(...template.alanTanimlari.map(a => a.bitis));
  if (rawTxtLine.length < minLength * 0.8) {
    warnings.push({
      type: 'SHORT_LINE',
      message: `Satır çok kısa: ${rawTxtLine.length} karakter (minimum ~${minLength} bekleniyor)`,
      severity: 'WARNING',
    });
  }
  
  // Alan tanımlarını parse et
  for (const alan of template.alanTanimlari) {
    const startIdx = alan.baslangic - 1; // 0-indexed
    const endIdx = alan.bitis;           // exclusive
    
    if (startIdx >= rawTxtLine.length) {
      continue;
    }
    
    const rawValue = rawTxtLine.substring(startIdx, Math.min(endIdx, rawTxtLine.length));
    const trimmedValue = rawValue.trim();
    const fixedValue = fixTurkishChars(trimmedValue);
    
    const alanLower = (alan.alan || '').toLowerCase();
    const labelLower = (alan.label || '').toLowerCase();
    
    // Alan tipine göre işle
    if (alanLower.includes('ogrenci_no') || alanLower === 'numara' || labelLower.includes('öğrenci no')) {
      result.ogrenciNo = fixedValue.replace(/\D/g, '') || fixedValue;
    } else if (alanLower.includes('ogrenci_adi') || alanLower.includes('ad_soyad') || labelLower.includes('ad')) {
      result.ogrenciAdi = cleanStudentName(rawValue);
    } else if (alanLower === 'tc' || alanLower.includes('kimlik')) {
      result.tc = fixedValue.replace(/\D/g, '');
    } else if (alanLower.includes('sinif') || labelLower.includes('sınıf')) {
      result.sinifNo = fixedValue;
    } else if (alanLower.includes('kitapcik') || labelLower.includes('kitapçık')) {
      result.kitapcik = parseBooklet(rawValue);
    } else if (alanLower.includes('cevap') || labelLower.includes('cevap') || alanLower === 'answers') {
      result.debug.rawAnswerField = rawValue;
      result.cleanedString = rawValue.toUpperCase();
      
      // Slot pozisyonlarını kullanarak cevapları çıkar
      if (globalSlots.slots.length > 0) {
        const answers = extractAnswersFromLine(rawValue, globalSlots.slots);
        result.finalAnswers = answers;
        result.slotCount = answers.length;
        result.detectedAnswerCount = answers.filter(a => a !== null).length;
      } else {
        // Fallback: karakter karakter oku
        for (let i = 0; i < examStructure.toplamSoru; i++) {
          const char = (rawValue[i] || '').toUpperCase();
          if (VALID_ANSWERS.has(char)) {
            result.finalAnswers.push(char);
          } else {
            result.finalAnswers.push(null);
          }
        }
        result.slotCount = result.finalAnswers.length;
        result.detectedAnswerCount = result.finalAnswers.filter(a => a !== null).length;
      }
    }
  }
  
  // Cevap sayısı kontrolü - SESSIZ PADDING YOK!
  if (result.finalAnswers.length !== examStructure.toplamSoru) {
    warnings.push({
      type: 'TOTAL_MISMATCH',
      message: `Toplam cevap uyuşmazlığı: Beklenen ${examStructure.toplamSoru}, alınan ${result.finalAnswers.length}`,
      severity: 'ERROR',
      expectedCount: examStructure.toplamSoru,
      actualCount: result.finalAnswers.length,
    });
    
    // REJECT - ama yine de ders bloklarını hesapla (analiz için)
    // Eksik cevapları null ile DOLDURMA - sadece mevcut veriyi kullan
  }
  
  // Ders bazlı blok doğrulaması
  result.lessonBlocks = validateLessonBlocks(result.finalAnswers, examStructure);
  
  // Blok uyarılarını topla
  for (const block of result.lessonBlocks) {
    warnings.push(...block.warnings);
  }
  
  // Güven seviyesi
  result.alignmentConfidence = determineConfidence(
    globalSlots.confidence,
    warnings,
    result.lessonBlocks,
  );
  
  // Review durumu
  result.reviewStatus = determineReviewStatus(result.alignmentConfidence, warnings);
  
  // Uyarıları kaydet
  result.alignmentWarnings = warnings;
  
  // Validasyon
  result.isValid = 
    result.ogrenciNo.length > 0 &&
    result.ogrenciAdi.length > 0 &&
    result.reviewStatus !== 'REJECTED';
  
  if (!result.ogrenciNo) hatalar.push('Öğrenci numarası eksik');
  if (!result.ogrenciAdi) hatalar.push('Öğrenci adı eksik');
  if (result.reviewStatus === 'REJECTED') hatalar.push('Cevap hizalama hatası');
  
  result.hatalar = hatalar;
  
  return result;
}

// ════════════════════════════════════════════════════════════════════════════════
// TOPLU PARSE
// ════════════════════════════════════════════════════════════════════════════════

export interface BatchParseResult {
  students: ParsedStudentResult[];
  globalSlots: GlobalSlotAnalysis;
  stats: {
    totalLines: number;
    successCount: number;
    needsReviewCount: number;
    rejectedCount: number;
    averageConfidence: number;
  };
  warnings: string[];
}

/**
 * Tüm TXT dosyasını parse et
 */
export function parseOpticalFile(
  fileContent: string,
  template: ParseTemplate,
  examStructure: ExamStructure = LGS_EXAM_STRUCTURE,
): BatchParseResult {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 DETERMINISTIK PARSE ENGINE V1.0 BAŞLATILIYOR');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const lines = fileContent.replace(/\r\n/g, '\n').split('\n');
  const validLines = lines.filter(l => l && l.trim().length > 0);
  
  console.log(`📋 Şablon: ${template.sablonAdi}`);
  console.log(`📊 Toplam Satır: ${validLines.length}`);
  console.log(`🎯 Beklenen Soru: ${examStructure.toplamSoru}`);
  
  // 1. Global slot analizi
  const globalSlots = analyzeGlobalSlots(lines, template, examStructure);
  
  if (globalSlots.slots.length === 0) {
    console.error('❌ Slot tespiti başarısız! Fallback mode kullanılacak.');
  }
  
  // 2. Her satırı parse et
  const students: ParsedStudentResult[] = [];
  
  for (let i = 0; i < validLines.length; i++) {
    const line = validLines[i];
    const result = parseStudentAnswers(line, template, globalSlots, examStructure, i + 1);
    students.push(result);
  }
  
  // 3. İstatistikler
  const successCount = students.filter(s => s.reviewStatus === 'OK').length;
  const needsReviewCount = students.filter(s => s.reviewStatus === 'NEEDS_REVIEW').length;
  const rejectedCount = students.filter(s => s.reviewStatus === 'REJECTED').length;
  const avgConfidence = students.length > 0
    ? students.reduce((sum, s) => {
        const conf = s.alignmentConfidence === 'HIGH' ? 1 : 
                     s.alignmentConfidence === 'MEDIUM' ? 0.75 :
                     s.alignmentConfidence === 'LOW' ? 0.5 : 0.25;
        return sum + conf;
      }, 0) / students.length
    : 0;
  
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`✅ Başarılı: ${successCount}`);
  console.log(`⚠️ İnceleme Gerekli: ${needsReviewCount}`);
  console.log(`❌ Reddedildi: ${rejectedCount}`);
  console.log(`📈 Ortalama Güven: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  const warnings: string[] = [];
  if (rejectedCount > 0) {
    warnings.push(`${rejectedCount} öğrenci cevap hizalama hatası nedeniyle reddedildi`);
  }
  if (globalSlots.confidence < 0.7) {
    warnings.push(`Slot tespit güveni düşük: ${(globalSlots.confidence * 100).toFixed(1)}%`);
  }
  
  return {
    students,
    globalSlots,
    stats: {
      totalLines: validLines.length,
      successCount,
      needsReviewCount,
      rejectedCount,
      averageConfidence: avgConfidence,
    },
    warnings,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// UYUMLULUK DÖNÜŞÜMÜ (ESKİ ParsedOptikSatir FORMATINA)
// ════════════════════════════════════════════════════════════════════════════════

import type { ParsedOptikSatir } from '../kazanim/types';

/**
 * Yeni format sonucunu eski ParsedOptikSatir formatına dönüştür
 * Geriye uyumluluk için
 */
export function toOptikSatir(result: ParsedStudentResult): ParsedOptikSatir {
  return {
    satırNo: result.satırNo,
    hamVeri: result.rawString,
    sinifNo: result.sinifNo,
    ogrenciNo: result.ogrenciNo,
    ogrenciAdi: result.ogrenciAdi,
    tc: result.tc,
    kitapcik: result.kitapcik || undefined,
    cevaplar: result.finalAnswers,
    hatalar: result.hatalar,
    isValid: result.isValid,
  };
}

/**
 * Batch sonucu eski formata dönüştür
 */
export function toBatchOptikSatir(batchResult: BatchParseResult): ParsedOptikSatir[] {
  return batchResult.students.map(toOptikSatir);
}

