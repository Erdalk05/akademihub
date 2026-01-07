// ============================================================================
// SPECTRA MODULE - CALCULATIONS
// Net hesaplama, istatistik hesaplama, sıralama
// ============================================================================

import type {
  ExamParticipant,
  ExamSection,
  ExamStatistics,
  StudentTableRow,
} from '@/types/spectra-detail';
import { NET_RANGES } from './constants';

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

/**
 * Ortalama hesapla
 */
export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Medyan hesapla
 */
export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Standart sapma hesapla
 */
export function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const avg = average(arr);
  const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

// ============================================================================
// NET & PUAN HESAPLAMA
// ============================================================================

/**
 * Net hesapla (4 yanlış 1 doğruyu götürür - LGS/YKS standardı)
 */
export function calculateNet(correct: number, wrong: number): number {
  return correct - wrong / 4;
}

/**
 * LGS puan tahmini (yaklaşık formül)
 * Not: Gerçek ÖSYM formülü daha karmaşık, bu basitleştirilmiş tahmin
 */
export function estimateLGSScore(totalNet: number): number {
  // Yaklaşık: 200 taban + net × 4.5 katsayı
  return Math.round(200 + totalNet * 4.5);
}

/**
 * Yüzdelik dilim hesapla
 */
export function calculatePercentile(rank: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - rank + 1) / total) * 100);
}

// ============================================================================
// İSTATİSTİK HESAPLAMA
// ============================================================================

/**
 * Tüm istatistikleri hesapla
 */
export function calculateStatistics(
  participants: ExamParticipant[],
  sections: ExamSection[]
): ExamStatistics {
  // Sonuçları filtrele (exam_results olan katılımcılar)
  const resultsData = participants
    .filter((p) => p.exam_results && p.exam_results.length > 0)
    .map((p) => ({
      participant: p,
      result: p.exam_results![0],
    }));

  // Net değerleri
  const nets = resultsData.map((r) => r.result.total_net);

  // Temel sayılar
  const totalParticipants = participants.length;
  const institutionCount = participants.filter(
    (p) => p.participant_type === 'institution' || p.student_id
  ).length;
  const guestCount = participants.filter(
    (p) => p.participant_type === 'guest' || !p.student_id
  ).length;
  const pendingMatchCount = participants.filter(
    (p) => p.match_status === 'pending'
  ).length;

  // Temel istatistikler
  const averageNet = nets.length > 0 ? average(nets) : 0;
  const maxNet = nets.length > 0 ? Math.max(...nets) : 0;
  const minNet = nets.length > 0 ? Math.min(...nets) : 0;
  const medianNet = median(nets);
  const stdDeviation = standardDeviation(nets);

  // En yüksek/düşük net öğrencileri
  const maxNetStudent =
    resultsData.length > 0
      ? (() => {
          const max = resultsData.reduce((prev, curr) =>
            curr.result.total_net > prev.result.total_net ? curr : prev
          );
          return {
            name: getParticipantName(max.participant),
            net: max.result.total_net,
          };
        })()
      : null;

  const minNetStudent =
    resultsData.length > 0
      ? (() => {
          const min = resultsData.reduce((prev, curr) =>
            curr.result.total_net < prev.result.total_net ? curr : prev
          );
          return {
            name: getParticipantName(min.participant),
            net: min.result.total_net,
          };
        })()
      : null;

  // Ders bazlı ortalamalar
  const sectionAverages = sections.map((section) => {
    const sectionResults = resultsData
      .map((r) => {
        const sectionResult = r.result.exam_result_sections?.find(
          (s) => s.exam_section_id === section.id
        );
        return sectionResult;
      })
      .filter(Boolean);

    return {
      sectionId: section.id,
      sectionName: section.name,
      sectionCode: section.code,
      averageNet:
        sectionResults.length > 0
          ? average(sectionResults.map((s) => s!.net))
          : 0,
      averageCorrect:
        sectionResults.length > 0
          ? average(sectionResults.map((s) => s!.correct_count))
          : 0,
      averageWrong:
        sectionResults.length > 0
          ? average(sectionResults.map((s) => s!.wrong_count))
          : 0,
    };
  });

  // Sınıf bazlı ortalamalar
  const classMap = new Map<string, { id: string; name: string; nets: number[] }>();
  resultsData.forEach((r) => {
    const className =
      r.participant.student?.class?.name || r.participant.guest_class || 'Diğer';
    const classId = r.participant.student?.class?.id || 'other';

    if (!classMap.has(classId)) {
      classMap.set(classId, { id: classId, name: className, nets: [] });
    }
    classMap.get(classId)!.nets.push(r.result.total_net);
  });

  const classAverages = Array.from(classMap.values())
    .map((c) => ({
      classId: c.id,
      className: c.name,
      studentCount: c.nets.length,
      averageNet: average(c.nets),
    }))
    .sort((a, b) => b.averageNet - a.averageNet);

  // Net dağılımı
  const netDistribution = NET_RANGES.map((range) => {
    const count = nets.filter(
      (n) => n >= range.min && n < (range.max === Infinity ? 1000 : range.max)
    ).length;
    return {
      range: range.label,
      min: range.min,
      max: range.max,
      count,
      percentage: nets.length > 0 ? Math.round((count / nets.length) * 100) : 0,
    };
  });

  return {
    totalParticipants,
    institutionCount,
    guestCount,
    pendingMatchCount,
    averageNet: parseFloat(averageNet.toFixed(2)),
    maxNet: parseFloat(maxNet.toFixed(2)),
    minNet: parseFloat(minNet.toFixed(2)),
    medianNet: parseFloat(medianNet.toFixed(2)),
    stdDeviation: parseFloat(stdDeviation.toFixed(2)),
    maxNetStudent,
    minNetStudent,
    sectionAverages,
    classAverages,
    netDistribution,
  };
}

// ============================================================================
// TABLO VERİSİ OLUŞTURMA
// ============================================================================

/**
 * Katılımcı adını al
 */
export function getParticipantName(participant: ExamParticipant): string {
  if (participant.person) {
    return `${participant.person.first_name} ${participant.person.last_name}`;
  }
  if (participant.guest_name) {
    return participant.guest_name;
  }
  if (participant.optical_name) {
    return participant.optical_name;
  }
  return 'Bilinmeyen';
}

/**
 * Tablo satırlarını oluştur
 */
export function createTableRows(
  participants: ExamParticipant[],
  sections: ExamSection[]
): StudentTableRow[] {
  // Sonuçları olan katılımcıları filtrele ve sırala
  const withResults = participants
    .filter((p) => p.exam_results && p.exam_results.length > 0)
    .map((p) => ({
      participant: p,
      result: p.exam_results![0],
    }))
    .sort((a, b) => b.result.total_net - a.result.total_net);

  // Tablo satırlarını oluştur
  return withResults.map((item, index) => {
    const { participant, result } = item;
    const rank = index + 1;

    // Ders bazlı sonuçları hazırla
    const sectionData = sections.map((section) => {
      const sectionResult = result.exam_result_sections?.find(
        (s) => s.exam_section_id === section.id
      );
      return {
        sectionId: section.id,
        sectionName: section.name,
        sectionCode: section.code,
        correct: sectionResult?.correct_count ?? 0,
        wrong: sectionResult?.wrong_count ?? 0,
        blank: sectionResult?.blank_count ?? 0,
        net: sectionResult?.net ?? 0,
      };
    });

    return {
      rank,
      participantId: participant.id,
      studentId: participant.student_id,
      studentNo:
        participant.student?.student_no ||
        participant.optical_student_no ||
        '-',
      name: getParticipantName(participant),
      className:
        participant.student?.class?.name ||
        participant.guest_class ||
        '-',
      participantType: participant.student_id ? 'institution' : 'guest',
      matchStatus: participant.match_status,
      totalCorrect: result.total_correct,
      totalWrong: result.total_wrong,
      totalBlank: result.total_blank,
      totalNet: result.total_net,
      lgsScore: estimateLGSScore(result.total_net),
      percentile: calculatePercentile(rank, withResults.length),
      sections: sectionData,
    };
  });
}

// ============================================================================
// FİLTRELEME & SIRALAMA
// ============================================================================

/**
 * Tablo satırlarını filtrele
 */
export function filterTableRows(
  rows: StudentTableRow[],
  filters: {
    search: string;
    classId: string | null;
    participantType: 'all' | 'institution' | 'guest';
  }
): StudentTableRow[] {
  return rows.filter((row) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        row.name.toLowerCase().includes(searchLower) ||
        row.studentNo.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Class filter
    if (filters.classId && filters.classId !== 'all') {
      if (row.className !== filters.classId) return false;
    }

    // Participant type filter
    if (filters.participantType !== 'all') {
      if (row.participantType !== filters.participantType) return false;
    }

    return true;
  });
}

/**
 * Tablo satırlarını sırala
 */
export function sortTableRows(
  rows: StudentTableRow[],
  sortBy: 'rank' | 'name' | 'net' | 'class',
  sortOrder: 'asc' | 'desc'
): StudentTableRow[] {
  const sorted = [...rows].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'rank':
        comparison = a.rank - b.rank;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name, 'tr');
        break;
      case 'net':
        comparison = b.totalNet - a.totalNet;
        break;
      case 'class':
        comparison = a.className.localeCompare(b.className, 'tr');
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

