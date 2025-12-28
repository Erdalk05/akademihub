/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AKADEMIHUB DETERMINISTIK PARSE ENGINE V3.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * V3.0 GÜNCELLEMELER:
 * - SLOT TESPİTİ: Boşluk karakterlerinin 3 farklı anlamını ayırt et
 *   1) SEPARATOR: Sabit format boşluğu (satırlar arası tutarlı)
 *   2) PADDING: Sabit genişlik dolgusu
 *   3) BLANK_ANSWER: Gerçek boş cevap (öğrenci boş bırakmış)
 * 
 * - Tüm satırları analiz ederek QUESTION_SLOT pozisyonlarını bul
 * - A-E varyansı olan pozisyonlar = QUESTION_SLOT
 * - Sürekli boş kalan pozisyonlar = SEPARATOR
 * - Sadece QUESTION_SLOT'lardan cevap oku
 * 
 * V2.0'DAN DEVAM:
 * - Satır bazlı dinamik START tespiti
 * - FIXED COLUMN varsayımı yok
 * - Eksikse NEEDS_REVIEW, REJECT değil
 * 
 * SORUN (V2.0'da çözülmemiş):
 * - Tüm boşluklar "boş cevap" sayılıyordu
 * - Bu yüzden boş sayısı çok yüksek, netler düşük
 * 
 * ÇÖZÜM (V3.0):
 * - Pozisyon bazlı frekans analizi
 * - QUESTION_SLOT vs SEPARATOR ayrımı
 * - LGS için tam 90 slot yakalanmalı
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
  
  // V2.0: Satır bazlı dinamik START
  lineStartIndex: number;            // Bu satırda cevapların başladığı index
  lineStartMethod: 'DYNAMIC' | 'TEMPLATE' | 'FALLBACK';  // Tespit yöntemi
  rawAnswersFromStart: string;       // lineStart'tan itibaren ham cevap string'i
  
  // V3.0: Slot tespiti
  questionSlotPositions: number[];   // QUESTION_SLOT olarak tespit edilen pozisyonlar
  separatorSlotPositions: number[];  // SEPARATOR olarak tespit edilen pozisyonlar
  slotDetectionMethod: 'V3_FREQUENCY' | 'V2_DYNAMIC' | 'FALLBACK';
}

// ════════════════════════════════════════════════════════════════════════════════
// V3.0: SLOT TİPLERİ
// ════════════════════════════════════════════════════════════════════════════════

export type SlotType = 'QUESTION_SLOT' | 'SEPARATOR' | 'PADDING' | 'UNKNOWN';

export interface SlotAnalysisResult {
  // Pozisyon bazlı slot haritası
  slotMap: Map<number, SlotType>;
  
  // QUESTION_SLOT pozisyonları (sıralı)
  questionSlots: number[];
  
  // SEPARATOR pozisyonları
  separatorSlots: number[];
  
  // İstatistikler
  stats: {
    totalPositionsAnalyzed: number;
    questionSlotCount: number;
    separatorCount: number;
    confidence: number;
  };
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
// V3.0: SLOT TESPİTİ - Boşluk/Separator/Cevap Ayrımı
// ════════════════════════════════════════════════════════════════════════════════

const VALID_ANSWERS_SET = new Set(['A', 'B', 'C', 'D', 'E']);

/**
 * V3.0: Tüm satırları analiz ederek QUESTION_SLOT pozisyonlarını tespit et.
 * 
 * MANTIK:
 * - Her pozisyon için A-E frekansı hesapla
 * - A-E karakteri görülen pozisyonlar = muhtemel QUESTION_SLOT
 * - Hiç A-E görülmeyen veya çok nadir görülen pozisyonlar = SEPARATOR
 * - En yüksek frekanslı N pozisyonu seç (N = beklenen soru sayısı)
 * 
 * @param lines Tüm TXT satırları
 * @param minStart Cevapların başlayabileceği minimum index (öğrenci bilgilerinden sonra)
 * @param expectedSlots Beklenen soru slot sayısı (LGS için 90)
 */
export function detectQuestionSlots(
  lines: string[],
  minStart: number = 30,
  expectedSlots: number = 90,
): SlotAnalysisResult {
  const validLines = lines.filter(l => l && l.trim().length > 0);
  
  if (validLines.length === 0) {
    return {
      slotMap: new Map(),
      questionSlots: [],
      separatorSlots: [],
      stats: { totalPositionsAnalyzed: 0, questionSlotCount: 0, separatorCount: 0, confidence: 0 },
    };
  }
  
  // Maksimum satır uzunluğu
  const maxLen = Math.max(...validLines.map(l => l.length));
  
  // Her pozisyon için frekans sayacı
  const positionStats: { 
    pos: number; 
    aeCount: number; 
    spaceCount: number; 
    totalLines: number;
    aeRatio: number;
  }[] = [];
  
  // minStart'tan itibaren her pozisyonu analiz et
  for (let pos = minStart; pos < maxLen; pos++) {
    let aeCount = 0;
    let spaceCount = 0;
    let totalLines = 0;
    
    for (const line of validLines) {
      if (pos < line.length) {
        totalLines++;
        const ch = line[pos].toUpperCase();
        if (VALID_ANSWERS_SET.has(ch)) {
          aeCount++;
        } else if (ch === ' ' || ch === '' || ch === '_' || ch === '-') {
          spaceCount++;
        }
      }
    }
    
    const aeRatio = totalLines > 0 ? aeCount / totalLines : 0;
    
    positionStats.push({
      pos,
      aeCount,
      spaceCount,
      totalLines,
      aeRatio,
    });
  }
  
  // A-E oranına göre sırala (yüksekten düşüğe)
  const sortedByAE = [...positionStats]
    .filter(p => p.aeRatio > 0) // En az 1 A-E görülmüş olmalı
    .sort((a, b) => b.aeRatio - a.aeRatio);
  
  // En iyi N pozisyonu QUESTION_SLOT olarak seç
  const questionSlots = sortedByAE
    .slice(0, expectedSlots)
    .map(p => p.pos)
    .sort((a, b) => a - b); // Pozisyona göre sırala
  
  // SEPARATOR: A-E oranı çok düşük olan pozisyonlar
  const separatorSlots = positionStats
    .filter(p => p.aeRatio < 0.05) // %5'ten az A-E görülen
    .map(p => p.pos);
  
  // Slot haritası oluştur
  const slotMap = new Map<number, SlotType>();
  for (const pos of questionSlots) {
    slotMap.set(pos, 'QUESTION_SLOT');
  }
  for (const pos of separatorSlots) {
    if (!slotMap.has(pos)) {
      slotMap.set(pos, 'SEPARATOR');
    }
  }
  
  // Güven skoru
  const avgAERatio = questionSlots.length > 0
    ? sortedByAE.slice(0, expectedSlots).reduce((sum, p) => sum + p.aeRatio, 0) / expectedSlots
    : 0;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔬 V3.0 SLOT TESPİTİ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Analiz edilen pozisyon: ${positionStats.length}`);
  console.log(`   QUESTION_SLOT sayısı: ${questionSlots.length}`);
  console.log(`   SEPARATOR sayısı: ${separatorSlots.length}`);
  console.log(`   Ortalama A-E oranı: ${(avgAERatio * 100).toFixed(1)}%`);
  if (questionSlots.length > 0) {
    console.log(`   İlk 10 slot: [${questionSlots.slice(0, 10).join(', ')}]`);
    console.log(`   Son 10 slot: [${questionSlots.slice(-10).join(', ')}]`);
  }
  console.log('═══════════════════════════════════════════════════════════════');
  
  return {
    slotMap,
    questionSlots,
    separatorSlots,
    stats: {
      totalPositionsAnalyzed: positionStats.length,
      questionSlotCount: questionSlots.length,
      separatorCount: separatorSlots.length,
      confidence: avgAERatio,
    },
  };
}

/**
 * V3.0: Bir satırdan QUESTION_SLOT pozisyonlarına göre cevapları çıkar.
 * 
 * @param line Ham satır
 * @param questionSlots QUESTION_SLOT pozisyonları (sıralı)
 */
function extractAnswersBySlots(
  line: string,
  questionSlots: number[],
): (string | null)[] {
  const answers: (string | null)[] = [];
  const upperLine = line.toUpperCase();
  
  for (const pos of questionSlots) {
    if (pos < upperLine.length) {
      const ch = upperLine[pos];
      if (VALID_ANSWERS_SET.has(ch)) {
        answers.push(ch);
      } else {
        // Bu pozisyon QUESTION_SLOT ama karakter A-E değil = BOŞ CEVAP
        answers.push(null);
      }
    } else {
      // Satır yeterince uzun değil = BOŞ CEVAP
      answers.push(null);
    }
  }
  
  return answers;
}

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
 * V2.0: Güven seviyesini belirle
 * Daha hoşgörülü - lineStart tespiti başarılıysa güven yüksek
 */
function determineConfidence(
  slotConfidence: number,
  warnings: AlignmentWarning[],
  lessonBlocks: LessonBlockResult[],
  lineStartResult?: LineStartResult,
): AlignmentConfidence {
  // V2.0: lineStart başarılıysa temel güven yüksek
  const baseConfidence = lineStartResult?.method === 'DYNAMIC' 
    ? lineStartResult.confidence 
    : slotConfidence;
  
  const errorCount = warnings.filter(w => w.severity === 'ERROR').length;
  const warningCount = warnings.filter(w => w.severity === 'WARNING').length;
  
  // V2.0: CRITICAL sadece hiç cevap bulunamadıysa
  if (baseConfidence === 0 || errorCount > 2) {
    return 'CRITICAL';
  }
  
  // V2.0: LOW - bazı sorunlar var ama işlenebilir
  if (baseConfidence < 0.6 || errorCount > 0) {
    return 'LOW';
  }
  
  // MEDIUM - küçük uyarılar
  if (baseConfidence < 0.8 || warningCount > 0) {
    return 'MEDIUM';
  }
  
  return 'HIGH';
}

/**
 * V2.0: Review durumunu belirle
 * REJECT oranını düşür - NEEDS_REVIEW tercih et
 */
function determineReviewStatus(
  confidence: AlignmentConfidence,
  warnings: AlignmentWarning[],
  detectedAnswerCount: number,
): ReviewStatus {
  // V2.0: En az 50 cevap varsa REJECT yapma
  if (detectedAnswerCount >= 50) {
    if (confidence === 'CRITICAL') {
      return 'NEEDS_REVIEW'; // REJECT yerine NEEDS_REVIEW
    }
    if (confidence === 'LOW') {
      return 'NEEDS_REVIEW';
    }
    return 'OK';
  }
  
  // Çok az cevap varsa
  if (detectedAnswerCount < 20) {
    return 'REJECTED';
  }
  
  // Orta düzey cevap
  if (confidence === 'CRITICAL') {
    return 'NEEDS_REVIEW';
  }
  
  return warnings.some(w => w.severity === 'ERROR') ? 'NEEDS_REVIEW' : 'OK';
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
// V2.0: SATIR BAZLI DİNAMİK START TESPİTİ
// ════════════════════════════════════════════════════════════════════════════════

interface LineStartResult {
  startIndex: number;
  method: 'DYNAMIC' | 'TEMPLATE' | 'FALLBACK';
  confidence: number;
  first20Answers: string;
}

/**
 * Tek bir satırda cevapların GERÇEK başladığı index'i tespit et.
 * 
 * YÖNTEM:
 * - İlk anlamlı A-E dizisini bul (en az 3 ardışık A-E)
 * - Boşluklar diziyi bozmaz
 * - Bu index = lineStart
 * 
 * @param line Ham TXT satırı
 * @returns LineStartResult
 */
function detectLineStart(line: string): LineStartResult {
  const upperLine = line.toUpperCase();
  
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
      // En az 3 ardışık A-E bulunca kabul et
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
      }
    }
  }
  
  if (answerStartIdx >= 0) {
    return {
      startIndex: answerStartIdx,
      method: 'DYNAMIC',
      confidence: consecutiveCount >= 5 ? 0.95 : (consecutiveCount >= 3 ? 0.8 : 0.5),
      first20Answers: first20,
    };
  }
  
  // Fallback: bulunamadı
  return {
    startIndex: -1,
    method: 'FALLBACK',
    confidence: 0,
    first20Answers: '',
  };
}

/**
 * lineStart'tan itibaren 90 cevap slotu çıkar.
 * Padding YAPMAZ - eksikse eksik kalır.
 * 
 * @param line Ham satır
 * @param startIndex Cevapların başladığı index
 * @param expectedSlots Beklenen slot sayısı
 */
function extractAnswersFromLineStart(
  line: string,
  startIndex: number,
  expectedSlots: number,
): (string | null)[] {
  const answers: (string | null)[] = [];
  const upperLine = line.toUpperCase();
  
  // startIndex'ten itibaren sadece A-E karakterlerini al
  for (let i = startIndex; i < upperLine.length && answers.length < expectedSlots; i++) {
    const ch = upperLine[i];
    if (ch === 'A' || ch === 'B' || ch === 'C' || ch === 'D' || ch === 'E') {
      answers.push(ch);
    } else if (ch === ' ' || ch === '_' || ch === '-' || ch === '.') {
      // Boşluk/separator = boş cevap
      answers.push(null);
    }
    // Diğer karakterler (rakam, harf) atlanır
  }
  
  return answers;
}

// ════════════════════════════════════════════════════════════════════════════════
// ANA EXPORT: parseStudentAnswers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tek bir öğrenci satırını parse et
 * 
 * V2.0: Satır bazlı dinamik START tespiti kullanır.
 * Global slot analizi SADECE fallback olarak kullanılır.
 * 
 * @param rawTxtLine Ham TXT satırı
 * @param template Optik şablon
 * @param globalSlots Global slot analizi sonucu (fallback)
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
  
  // V2.0: Satır bazlı dinamik START tespiti
  const lineStartResult = detectLineStart(rawTxtLine);
  
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
      // V2.0
      lineStartIndex: lineStartResult.startIndex,
      lineStartMethod: lineStartResult.method,
      rawAnswersFromStart: lineStartResult.first20Answers,
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
      
      // ═══════════════════════════════════════════════════════════════════════
      // V2.0: SATIR BAZLI DİNAMİK START
      // Global slot analizi yerine her satır için ayrı START index kullan.
      // ═══════════════════════════════════════════════════════════════════════
      
      if (lineStartResult.startIndex >= 0 && lineStartResult.method === 'DYNAMIC') {
        // YENİ: Satır bazlı dinamik parse
        // Tüm satırdan lineStart'tan itibaren cevapları al
        const answers = extractAnswersFromLineStart(
          rawTxtLine, 
          lineStartResult.startIndex, 
          examStructure.toplamSoru
        );
        result.finalAnswers = answers;
        result.slotCount = answers.length;
        result.detectedAnswerCount = answers.filter(a => a !== null).length;
        result.debug.rawAnswersFromStart = rawTxtLine.substring(lineStartResult.startIndex, lineStartResult.startIndex + 100);
        
      } else if (globalSlots.slots.length > 0) {
        // FALLBACK 1: Global slot analizi (eski yöntem)
        const answers = extractAnswersFromLine(rawValue, globalSlots.slots);
        result.finalAnswers = answers;
        result.slotCount = answers.length;
        result.detectedAnswerCount = answers.filter(a => a !== null).length;
        result.debug.lineStartMethod = 'TEMPLATE';
        
      } else {
        // FALLBACK 2: Şablon bazlı karakter karakter oku
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
        result.debug.lineStartMethod = 'FALLBACK';
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // V2.0: CEVAP SAYISI KONTROLÜ
  // Eksikse NEEDS_REVIEW (REJECT değil!) - padding YAPMA
  // ═══════════════════════════════════════════════════════════════════════════
  if (result.finalAnswers.length !== examStructure.toplamSoru) {
    // Eksik sayıya göre severity belirle
    const eksikOran = result.finalAnswers.length / examStructure.toplamSoru;
    const severity: 'WARNING' | 'ERROR' = eksikOran >= 0.8 ? 'WARNING' : 'ERROR';
    
    warnings.push({
      type: 'TOTAL_MISMATCH',
      message: `Toplam cevap uyuşmazlığı: Beklenen ${examStructure.toplamSoru}, alınan ${result.finalAnswers.length} (${(eksikOran * 100).toFixed(0)}%)`,
      severity,
      expectedCount: examStructure.toplamSoru,
      actualCount: result.finalAnswers.length,
    });
    
    // V2.0: Eksikse REJECT yerine doldur ve NEEDS_REVIEW yap
    // Puanlama motorunun çalışması için 90 slot gerekli
    while (result.finalAnswers.length < examStructure.toplamSoru) {
      result.finalAnswers.push(null);
    }
    result.slotCount = result.finalAnswers.length;
  }
  
  // Ders bazlı blok doğrulaması
  result.lessonBlocks = validateLessonBlocks(result.finalAnswers, examStructure);
  
  // Blok uyarılarını topla
  for (const block of result.lessonBlocks) {
    warnings.push(...block.warnings);
  }
  
  // V2.0: Güven seviyesi - lineStartResult'ı da kullan
  result.alignmentConfidence = determineConfidence(
    globalSlots.confidence,
    warnings,
    result.lessonBlocks,
    lineStartResult,
  );
  
  // V2.0: Review durumu - detectedAnswerCount'ı da kullan
  result.reviewStatus = determineReviewStatus(
    result.alignmentConfidence, 
    warnings,
    result.detectedAnswerCount,
  );
  
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
// V3.0: SLOT TABANLI PARSE
// ════════════════════════════════════════════════════════════════════════════════

/**
 * V3.0: Slot tabanlı öğrenci parse
 * 
 * QUESTION_SLOT pozisyonlarından cevapları çıkarır.
 * Separator pozisyonlarını atlar.
 * Gerçek boş cevapları sadece QUESTION_SLOT içinde sayar.
 */
function parseStudentAnswersV3(
  rawTxtLine: string,
  template: ParseTemplate,
  globalSlots: GlobalSlotAnalysis,
  slotAnalysis: SlotAnalysisResult,
  useV3: boolean,
  examStructure: ExamStructure = LGS_EXAM_STRUCTURE,
  lineNumber: number = 0,
): ParsedStudentResult {
  const warnings: AlignmentWarning[] = [];
  const hatalar: string[] = [];
  
  // V2.0: Satır bazlı dinamik START tespiti (hala gerekli - öğrenci bilgileri için)
  const lineStartResult = detectLineStart(rawTxtLine);
  
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
      lineStartIndex: lineStartResult.startIndex,
      lineStartMethod: lineStartResult.method,
      rawAnswersFromStart: lineStartResult.first20Answers,
      questionSlotPositions: slotAnalysis.questionSlots,
      separatorSlotPositions: slotAnalysis.separatorSlots,
      slotDetectionMethod: useV3 ? 'V3_FREQUENCY' : 'V2_DYNAMIC',
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
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÖĞRENCİ BİLGİLERİNİ PARSE ET (şablondan)
  // ═══════════════════════════════════════════════════════════════════════════
  for (const alan of template.alanTanimlari) {
    const startIdx = alan.baslangic - 1;
    const endIdx = alan.bitis;
    
    if (startIdx >= rawTxtLine.length) continue;
    
    const rawValue = rawTxtLine.substring(startIdx, Math.min(endIdx, rawTxtLine.length));
    const trimmedValue = rawValue.trim();
    const fixedValue = fixTurkishChars(trimmedValue);
    
    const alanLower = (alan.alan || '').toLowerCase();
    const labelLower = (alan.label || '').toLowerCase();
    
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
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // V3.0: QUESTION_SLOT POZİSYONLARINDAN CEVAPLARI ÇEK
  // ═══════════════════════════════════════════════════════════════════════════
  if (useV3 && slotAnalysis.questionSlots.length > 0) {
    // V3.0: Slot tabanlı okuma
    result.finalAnswers = extractAnswersBySlots(rawTxtLine, slotAnalysis.questionSlots);
    result.slotCount = result.finalAnswers.length;
    result.detectedAnswerCount = result.finalAnswers.filter(a => a !== null).length;
    result.debug.slotDetectionMethod = 'V3_FREQUENCY';
    result.cleanedString = result.finalAnswers.map(a => a || '_').join('');
    
  } else if (lineStartResult.startIndex >= 0) {
    // V2.0 Fallback: Dinamik START
    result.finalAnswers = extractAnswersFromLineStart(
      rawTxtLine, 
      lineStartResult.startIndex, 
      examStructure.toplamSoru
    );
    result.slotCount = result.finalAnswers.length;
    result.detectedAnswerCount = result.finalAnswers.filter(a => a !== null).length;
    result.debug.slotDetectionMethod = 'V2_DYNAMIC';
    result.cleanedString = result.finalAnswers.map(a => a || '_').join('');
    
  } else {
    // Son fallback
    result.debug.slotDetectionMethod = 'FALLBACK';
    warnings.push({
      type: 'ENTROPY_ANOMALY',
      message: 'Slot tespiti başarısız, fallback kullanıldı',
      severity: 'WARNING',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CEVAP SAYISI KONTROLÜ
  // ═══════════════════════════════════════════════════════════════════════════
  if (result.finalAnswers.length !== examStructure.toplamSoru) {
    const eksikOran = result.finalAnswers.length / examStructure.toplamSoru;
    const severity: 'WARNING' | 'ERROR' = eksikOran >= 0.8 ? 'WARNING' : 'ERROR';
    
    warnings.push({
      type: 'TOTAL_MISMATCH',
      message: `Slot uyuşmazlığı: Beklenen ${examStructure.toplamSoru}, bulunan ${result.finalAnswers.length}`,
      severity,
      expectedCount: examStructure.toplamSoru,
      actualCount: result.finalAnswers.length,
    });
    
    // 90'a tamamla (puanlama için)
    while (result.finalAnswers.length < examStructure.toplamSoru) {
      result.finalAnswers.push(null);
    }
    result.slotCount = result.finalAnswers.length;
  }
  
  // Ders bazlı blok doğrulaması
  result.lessonBlocks = validateLessonBlocks(result.finalAnswers, examStructure);
  
  for (const block of result.lessonBlocks) {
    warnings.push(...block.warnings);
  }
  
  // Güven seviyesi
  result.alignmentConfidence = determineConfidence(
    slotAnalysis.stats.confidence,
    warnings,
    result.lessonBlocks,
    lineStartResult,
  );
  
  // Review durumu
  result.reviewStatus = determineReviewStatus(
    result.alignmentConfidence, 
    warnings,
    result.detectedAnswerCount,
  );
  
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
  
  // V3.0: Slot analizi
  slotAnalysis: SlotAnalysisResult;
  
  stats: {
    totalLines: number;
    successCount: number;
    needsReviewCount: number;
    rejectedCount: number;
    averageConfidence: number;
    // V3.0
    v3SlotCount: number;
    v3Confidence: number;
  };
  warnings: string[];
}

/**
 * Tüm TXT dosyasını parse et
 * V3.0: Slot tespiti ile boşluk/separator ayrımı
 */
export function parseOpticalFile(
  fileContent: string,
  template: ParseTemplate,
  examStructure: ExamStructure = LGS_EXAM_STRUCTURE,
): BatchParseResult {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 DETERMINISTIK PARSE ENGINE V3.0 BAŞLATILIYOR');
  console.log('   ✨ V3.0: Slot tespiti ile boşluk/separator ayrımı');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const lines = fileContent.replace(/\r\n/g, '\n').split('\n');
  const validLines = lines.filter(l => l && l.trim().length > 0);
  
  console.log(`📋 Şablon: ${template.sablonAdi}`);
  console.log(`📊 Toplam Satır: ${validLines.length}`);
  console.log(`🎯 Beklenen Soru: ${examStructure.toplamSoru}`);
  
  // 1. V3.0: QUESTION_SLOT pozisyonlarını tespit et
  // Şablondan minimum start pozisyonunu bul (öğrenci bilgilerinden sonra)
  const minStart = Math.min(
    ...template.alanTanimlari
      .filter(a => {
        const alanLower = (a.alan || '').toLowerCase();
        return alanLower.includes('cevap') || alanLower === 'answers';
      })
      .map(a => a.baslangic - 1)
  ) || 30;
  
  const slotAnalysis = detectQuestionSlots(lines, minStart, examStructure.toplamSoru);
  
  // 2. Global slot analizi (geriye uyumluluk için)
  const globalSlots = analyzeGlobalSlots(lines, template, examStructure);
  
  // V3.0 başarılı mı kontrol et
  const useV3 = slotAnalysis.questionSlots.length >= examStructure.toplamSoru * 0.9; // En az %90
  
  if (useV3) {
    console.log(`✅ V3.0 slot tespiti başarılı: ${slotAnalysis.questionSlots.length} slot bulundu`);
  } else {
    console.warn(`⚠️ V3.0 yetersiz (${slotAnalysis.questionSlots.length} slot), V2.0 fallback kullanılacak`);
  }
  
  // 3. Her satırı parse et
  const students: ParsedStudentResult[] = [];
  
  for (let i = 0; i < validLines.length; i++) {
    const line = validLines[i];
    const result = parseStudentAnswersV3(
      line, 
      template, 
      globalSlots, 
      slotAnalysis,
      useV3,
      examStructure, 
      i + 1
    );
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
  console.log(`🔬 V3.0 Slot: ${slotAnalysis.questionSlots.length} / ${examStructure.toplamSoru}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  const batchWarnings: string[] = [];
  if (rejectedCount > 0) {
    batchWarnings.push(`${rejectedCount} öğrenci cevap hizalama hatası nedeniyle reddedildi`);
  }
  if (slotAnalysis.questionSlots.length < examStructure.toplamSoru) {
    batchWarnings.push(`V3.0: Beklenen ${examStructure.toplamSoru} slot, bulunan ${slotAnalysis.questionSlots.length}`);
  }
  
  return {
    students,
    globalSlots,
    slotAnalysis,
    stats: {
      totalLines: validLines.length,
      successCount,
      needsReviewCount,
      rejectedCount,
      averageConfidence: avgConfidence,
      v3SlotCount: slotAnalysis.questionSlots.length,
      v3Confidence: slotAnalysis.stats.confidence,
    },
    warnings: batchWarnings,
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

