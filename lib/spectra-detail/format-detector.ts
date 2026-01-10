// ============================================================================
// FORMAT DETECTOR - Sınav Formatını Otomatik Algılama
// LGS, TYT, AYT-SAY, AYT-EA, AYT-SÖZ, YDT, CUSTOM
// ============================================================================

import type { ExamSection, ExamFormat, ExamFormatConfig } from '@/types/spectra-detail';

/**
 * Sınav formatını otomatik olarak algılar
 * Ders kodlarına ve sınıf bilgisine göre format tespiti yapar
 */
export function detectExamFormat(
  sections: ExamSection[],
  sinif?: string,
  examType?: string
): ExamFormatConfig {
  const dersKodlari = sections.map(s => s.code.toUpperCase());
  const sinifNumara = sinif ? parseInt(sinif) : null;

  // LGS kontrolü (8. sınıf + TUR, MAT, FEN, SOS, ING, DIN)
  if (
    (sinifNumara === 8 || examType === 'LGS') &&
    hasAllCodes(dersKodlari, ['TUR', 'MAT', 'FEN']) &&
    (hasAnyCode(dersKodlari, ['SOS', 'INK', 'TAR']) || hasAnyCode(dersKodlari, ['ING', 'DIN']))
  ) {
    return {
      format: 'LGS',
      displayName: 'LGS (8. Sınıf)',
      dersKodlari: ['TUR', 'MAT', 'FEN', 'SOS', 'INK', 'DIN', 'ING'],
      puanTurleriKolonlari: ['lgs', 'sozel', 'sayisal', 'turkceDil', 'sosyalBilimler'],
      showGroupedSubjects: true,
      pdfExportLayout: 'detailed',
    };
  }

  // TYT kontrolü (TYT_TUR, TYT_MAT, TYT_FEN, TYT_SOS)
  if (hasAnyCode(dersKodlari, ['TYT_TUR', 'TYT_MAT']) || examType === 'TYT') {
    return {
      format: 'TYT',
      displayName: 'TYT (Temel Yeterlilik Testi)',
      dersKodlari: ['TYT_TUR', 'TYT_SOS', 'TYT_MAT', 'TYT_FEN'],
      puanTurleriKolonlari: ['tyt'],
      showGroupedSubjects: false,
      pdfExportLayout: 'compact',
    };
  }

  // AYT-SAY kontrolü
  if (hasAllCodes(dersKodlari, ['AYT_MAT', 'AYT_FIZ']) || examType === 'AYT_SAY') {
    return {
      format: 'AYT_SAY',
      displayName: 'AYT - Sayısal',
      dersKodlari: ['AYT_MAT', 'AYT_FIZ', 'AYT_KIM', 'AYT_BIY'],
      puanTurleriKolonlari: ['say'],
      showGroupedSubjects: false,
      pdfExportLayout: 'compact',
    };
  }

  // AYT-EA kontrolü
  if (hasAllCodes(dersKodlari, ['AYT_MAT', 'AYT_EDEB']) || examType === 'AYT_EA') {
    return {
      format: 'AYT_EA',
      displayName: 'AYT - Eşit Ağırlık',
      dersKodlari: ['AYT_MAT', 'AYT_EDEB', 'AYT_TAR1', 'AYT_COG'],
      puanTurleriKolonlari: ['ea'],
      showGroupedSubjects: false,
      pdfExportLayout: 'compact',
    };
  }

  // AYT-SÖZ kontrolü
  if (hasAnyCode(dersKodlari, ['AYT_EDEB', 'AYT_TAR1']) && !hasAnyCode(dersKodlari, ['AYT_MAT']) || examType === 'AYT_SOZ') {
    return {
      format: 'AYT_SOZ',
      displayName: 'AYT - Sözel',
      dersKodlari: ['AYT_EDEB', 'AYT_TAR1', 'AYT_COG', 'AYT_TAR2', 'AYT_DIN', 'AYT_FEL'],
      puanTurleriKolonlari: ['soz'],
      showGroupedSubjects: false,
      pdfExportLayout: 'compact',
    };
  }

  // YDT kontrolü
  if (hasAnyCode(dersKodlari, ['YDT_ING', 'YDT_ALM']) || examType === 'YDT') {
    return {
      format: 'YDT',
      displayName: 'YDT (Yabancı Dil Testi)',
      dersKodlari: ['YDT_ING', 'YDT_ALM', 'YDT_FRA', 'YDT_ARA'],
      puanTurleriKolonlari: ['dil'],
      showGroupedSubjects: false,
      pdfExportLayout: 'compact',
    };
  }

  // 7. Sınıf veya CUSTOM
  return {
    format: 'CUSTOM',
    displayName: sinif ? `${sinif}. Sınıf Deneme` : 'Özel Sınav',
    dersKodlari: dersKodlari,
    puanTurleriKolonlari: ['genel'],
    showGroupedSubjects: false,
    pdfExportLayout: 'detailed',
  };
}

/**
 * Tüm kodların listede olup olmadığını kontrol eder
 */
function hasAllCodes(dersKodlari: string[], requiredCodes: string[]): boolean {
  return requiredCodes.every(code => 
    dersKodlari.some(dk => dk.includes(code))
  );
}

/**
 * Kodlardan herhangi birinin listede olup olmadığını kontrol eder
 */
function hasAnyCode(dersKodlari: string[], codes: string[]): boolean {
  return codes.some(code => 
    dersKodlari.some(dk => dk.includes(code))
  );
}

/**
 * Ders kodlarını formata göre sıralar ve gruplandırır
 */
export function sortSectionsByFormat(
  sections: ExamSection[],
  format: ExamFormat
): ExamSection[] {
  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  if (format === 'LGS') {
    // LGS sırası: TUR, MAT, FEN, SOS/INK, DIN, ING
    const order = ['TUR', 'MAT', 'FEN', 'SOS', 'INK', 'TAR', 'DIN', 'ING'];
    return sorted.sort((a, b) => {
      const indexA = order.findIndex(code => a.code.includes(code));
      const indexB = order.findIndex(code => b.code.includes(code));
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  if (format === 'TYT') {
    // TYT sırası: TUR, SOS, MAT, FEN
    const order = ['TYT_TUR', 'TYT_SOS', 'TYT_MAT', 'TYT_FEN'];
    return sorted.sort((a, b) => {
      const indexA = order.indexOf(a.code);
      const indexB = order.indexOf(b.code);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  return sorted;
}

/**
 * Dersleri gruplandırır (Sözel/Sayısal) - LGS için
 */
export function groupSectionsByType(sections: ExamSection[]): {
  sozel: ExamSection[];
  sayisal: ExamSection[];
  diger: ExamSection[];
} {
  const sozel: ExamSection[] = [];
  const sayisal: ExamSection[] = [];
  const diger: ExamSection[] = [];

  sections.forEach(section => {
    const code = section.code.toUpperCase();
    if (['TUR', 'SOS', 'INK', 'TAR', 'DIN', 'ING'].some(c => code.includes(c))) {
      sozel.push(section);
    } else if (['MAT', 'FEN', 'FIZ', 'KIM', 'BIY'].some(c => code.includes(c))) {
      sayisal.push(section);
    } else {
      diger.push(section);
    }
  });

  return { sozel, sayisal, diger };
}
