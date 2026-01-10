// ============================================================================
// DATA TRANSFORMER - Mevcut veriyi UniversalExamTable formatına çevirir
// ============================================================================

import type {
  StudentTableRow,
  ExamSection,
  StudentRowDetailed,
  SubjectResult,
  PuanTurleri,
  ExamFormat,
} from '@/types/spectra-detail';

/**
 * Mevcut StudentTableRow verilerini StudentRowDetailed formatına dönüştürür
 */
export function transformToUniversalTableData(
  rows: StudentTableRow[],
  sections: ExamSection[],
  format: ExamFormat
): StudentRowDetailed[] {
  return rows.map((row, index) => {
    // Ders sonuçlarını dönüştür
    const dersSonuclari: SubjectResult[] = row.sections.map(section => {
      const examSection = sections.find(s => s.id === section.sectionId);
      const soruSayisi = examSection?.question_count || 0;
      const basariYuzdesi = soruSayisi > 0 ? (section.net / soruSayisi) * 100 : 0;

      return {
        sectionId: section.sectionId,
        dersKodu: section.sectionCode,
        dersAdi: section.sectionName,
        soruSayisi,
        dogru: section.correct,
        yanlis: section.wrong,
        bos: section.blank,
        net: section.net,
        basariYuzdesi,
      };
    });

    // Puan türlerini hesapla
    const puanTurleri = calculatePuanTurleri(dersSonuclari, format, row.lgsScore);

    // Toplam değerleri hesapla
    const toplamDogru = row.totalCorrect;
    const toplamYanlis = row.totalWrong;
    const toplamBos = row.totalBlank;
    const toplamSoru = sections.reduce((sum, s) => sum + s.question_count, 0);
    const basariYuzdesi = toplamSoru > 0 ? (row.totalNet / toplamSoru) * 100 : 0;

    return {
      sira: row.rank,
      grup: formatGrup(row.className),
      ogrenciId: row.participantId,
      ogrenciNo: row.studentNo,
      ogrenciAdi: row.name,
      sinif: extractSinif(row.className),
      sube: extractSube(row.className),
      puanTurleri,
      toplamNet: row.totalNet,
      sinifSirasi: calculateClassRank(row, rows),
      genelSira: row.rank,
      yuzdelik: row.percentile,
      participantType: row.participantType,
      dersSonuclari,
      toplamDogru,
      toplamYanlis,
      toplamBos,
      basariYuzdesi,
    };
  });
}

/**
 * Puan türlerini hesaplar (LGS, TYT, AYT formatlarına göre)
 */
function calculatePuanTurleri(
  dersSonuclari: SubjectResult[],
  format: ExamFormat,
  lgsScore?: number
): PuanTurleri {
  const puanTurleri: PuanTurleri = {};

  if (format === 'LGS') {
    // LGS puan hesaplaması
    puanTurleri.lgs = lgsScore || 0;
    puanTurleri.genel = lgsScore || 0;

    // Sözel: TUR + SOS + INK + DIN + ING
    const sozelDersler = dersSonuclari.filter(d =>
      ['TUR', 'SOS', 'INK', 'TAR', 'DIN', 'ING'].some(kod => d.dersKodu.includes(kod))
    );
    puanTurleri.sozel = sozelDersler.reduce((sum, d) => sum + d.net, 0);

    // Sayısal: MAT + FEN
    const sayisalDersler = dersSonuclari.filter(d =>
      ['MAT', 'FEN'].some(kod => d.dersKodu.includes(kod))
    );
    puanTurleri.sayisal = sayisalDersler.reduce((sum, d) => sum + d.net, 0);

    // Türkçe
    const turkceDers = dersSonuclari.find(d => d.dersKodu.includes('TUR'));
    puanTurleri.turkceDil = turkceDers?.net || 0;

    // Sosyal Bilimler
    const sosyalDers = dersSonuclari.find(d => d.dersKodu.includes('SOS') || d.dersKodu.includes('INK'));
    puanTurleri.sosyalBilimler = sosyalDers?.net || 0;
  } else if (format === 'TYT') {
    // TYT puan hesaplaması (basitleştirilmiş)
    const toplamNet = dersSonuclari.reduce((sum, d) => sum + d.net, 0);
    puanTurleri.tyt = toplamNet * 3.5; // Yaklaşık katsayı
    puanTurleri.genel = puanTurleri.tyt;
  } else if (format.startsWith('AYT')) {
    // AYT puan hesaplaması
    const toplamNet = dersSonuclari.reduce((sum, d) => sum + d.net, 0);
    const puan = toplamNet * 4; // Yaklaşık katsayı

    if (format === 'AYT_SAY') {
      puanTurleri.say = puan;
    } else if (format === 'AYT_EA') {
      puanTurleri.ea = puan;
    } else if (format === 'AYT_SOZ') {
      puanTurleri.soz = puan;
    }
    puanTurleri.genel = puan;
  } else {
    // CUSTOM veya diğer formatlar
    puanTurleri.genel = lgsScore || dersSonuclari.reduce((sum, d) => sum + d.net, 0) * 3;
  }

  return puanTurleri;
}

/**
 * Sınıf bilgisinden grup formatı oluşturur
 * Örnek: "8A" -> "8/A", "8. Sınıf" -> "8"
 */
function formatGrup(className: string): string {
  if (!className) return '-';

  // "8A", "8B" gibi formatlar
  const match = className.match(/^(\d+)([A-Z])$/i);
  if (match) {
    return `${match[1]}/${match[2].toUpperCase()}`;
  }

  // "8. Sınıf", "8-A" gibi formatlar
  const numMatch = className.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    const letter = className.match(/[A-Z]/i)?.[0];
    return letter ? `${num}/${letter.toUpperCase()}` : num;
  }

  return className;
}

/**
 * Sınıf numarasını çıkarır
 */
function extractSinif(className: string): string {
  const match = className.match(/\d+/);
  return match ? match[0] : className;
}

/**
 * Şube harfini çıkarır
 */
function extractSube(className: string): string | undefined {
  const match = className.match(/[A-Z]/i);
  return match ? match[0].toUpperCase() : undefined;
}

/**
 * Sınıf içi sırayı hesaplar
 */
function calculateClassRank(row: StudentTableRow, allRows: StudentTableRow[]): number {
  // Aynı sınıftaki öğrencileri filtrele ve sırala
  const sameClassStudents = allRows
    .filter(r => r.className === row.className)
    .sort((a, b) => b.totalNet - a.totalNet);

  // Bu öğrencinin sınıf içindeki sırasını bul
  const rank = sameClassStudents.findIndex(r => r.participantId === row.participantId);
  return rank + 1;
}
