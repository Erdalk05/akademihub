// ============================================================================
// SPECTRA MODULE - EXCEL EXPORT
// ExcelJS ile sınav verilerini Excel'e aktarma
// ============================================================================

import type { Exam, ExamSection, StudentTableRow, ExamStatistics } from '@/types/spectra-detail';

// ExcelJS dynamic import (client-side only)
let ExcelJS: any = null;

async function getExcelJS() {
  if (!ExcelJS) {
    ExcelJS = await import('exceljs');
  }
  return ExcelJS;
}

interface ExportExcelOptions {
  exam: Exam;
  sections: ExamSection[];
  rows: StudentTableRow[];
  statistics: ExamStatistics;
  organizationName?: string;
}

/**
 * Sınav verilerini Excel dosyasına aktarır
 */
export async function exportToExcel({
  exam,
  sections,
  rows,
  statistics,
  organizationName = 'AkademiHub',
}: ExportExcelOptions): Promise<void> {
  const { Workbook } = await getExcelJS();
  const workbook = new Workbook();

  // Workbook metadata
  workbook.creator = organizationName;
  workbook.created = new Date();

  // ============================================
  // SHEET 1: GENEL ÖZET
  // ============================================
  const summarySheet = workbook.addWorksheet('Özet', {
    properties: { tabColor: { argb: '10B981' } },
  });

  // Header
  summarySheet.mergeCells('A1:F1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = exam.name;
  titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '10B981' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 35;

  // Info row
  summarySheet.mergeCells('A2:F2');
  const infoCell = summarySheet.getCell('A2');
  infoCell.value = `${organizationName} | ${exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('tr-TR') : '-'} | ${exam.exam_type}`;
  infoCell.font = { size: 11, color: { argb: '666666' } };
  infoCell.alignment = { horizontal: 'center' };

  // Empty row
  summarySheet.addRow([]);

  // Statistics
  const statsData = [
    ['Toplam Katılımcı', statistics.totalParticipants],
    ['Asil Öğrenci', statistics.institutionCount],
    ['Misafir Öğrenci', statistics.guestCount],
    ['', ''],
    ['Ortalama Net', statistics.averageNet.toFixed(2)],
    ['Medyan Net', statistics.medianNet.toFixed(2)],
    ['Standart Sapma', statistics.stdDeviation.toFixed(2)],
    ['', ''],
    ['En Yüksek Net', statistics.maxNet.toFixed(2)],
    ['En Yüksek (Öğrenci)', statistics.maxNetStudent?.name || '-'],
    ['En Düşük Net', statistics.minNet.toFixed(2)],
    ['En Düşük (Öğrenci)', statistics.minNetStudent?.name || '-'],
  ];

  statsData.forEach((row) => {
    const addedRow = summarySheet.addRow(row);
    if (row[0]) {
      addedRow.getCell(1).font = { bold: true };
    }
  });

  // Column widths
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 20;

  // ============================================
  // SHEET 2: ÖĞRENCİ LİSTESİ
  // ============================================
  const studentsSheet = workbook.addWorksheet('Öğrenci Listesi', {
    properties: { tabColor: { argb: '3B82F6' } },
  });

  // Header columns
  const headerColumns = [
    'Sıra',
    'Öğrenci No',
    'Öğrenci Adı',
    'Sınıf',
    'Tip',
    ...sections.map((s) => `${s.name} D`),
    ...sections.map((s) => `${s.name} Y`),
    ...sections.map((s) => `${s.name} Net`),
    'Toplam D',
    'Toplam Y',
    'Toplam B',
    'Toplam Net',
    'Tahmini LGS',
    '% Dilim',
  ];

  const headerRow = studentsSheet.addRow(headerColumns);
  headerRow.eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' },
    };
    cell.alignment = { horizontal: 'center' };
  });
  headerRow.height = 25;

  // Data rows
  rows.forEach((row) => {
    const sectionCorrects = sections.map((s) => {
      const sec = row.sections.find((rs) => rs.sectionId === s.id);
      return sec?.correct ?? 0;
    });
    const sectionWrongs = sections.map((s) => {
      const sec = row.sections.find((rs) => rs.sectionId === s.id);
      return sec?.wrong ?? 0;
    });
    const sectionNets = sections.map((s) => {
      const sec = row.sections.find((rs) => rs.sectionId === s.id);
      return sec?.net.toFixed(2) ?? '0.00';
    });

    const dataRow = studentsSheet.addRow([
      row.rank,
      row.studentNo,
      row.name,
      row.className,
      row.participantType === 'institution' ? 'Asil' : 'Misafir',
      ...sectionCorrects,
      ...sectionWrongs,
      ...sectionNets,
      row.totalCorrect,
      row.totalWrong,
      row.totalBlank,
      row.totalNet.toFixed(2),
      row.lgsScore,
      `%${row.percentile}`,
    ]);

    // Alternating row colors
    if (row.rank % 2 === 0) {
      dataRow.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F3F4F6' },
        };
      });
    }

    // Top 3 highlighting
    if (row.rank <= 3) {
      dataRow.getCell(1).font = { bold: true };
      const colors = ['FFD700', 'C0C0C0', 'CD7F32'];
      dataRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors[row.rank - 1] },
      };
    }
  });

  // Auto-fit columns
  studentsSheet.columns.forEach((column: any) => {
    column.width = 12;
  });
  studentsSheet.getColumn(2).width = 15;
  studentsSheet.getColumn(3).width = 25;

  // ============================================
  // SHEET 3: SINIF KARŞILAŞTIRMA
  // ============================================
  const classSheet = workbook.addWorksheet('Sınıf Karşılaştırma', {
    properties: { tabColor: { argb: 'F59E0B' } },
  });

  const classHeader = classSheet.addRow(['Sıra', 'Sınıf', 'Öğrenci Sayısı', 'Ortalama Net']);
  classHeader.eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F59E0B' },
    };
  });

  statistics.classAverages.forEach((cls, index) => {
    classSheet.addRow([index + 1, cls.className, cls.studentCount, cls.averageNet.toFixed(2)]);
  });

  classSheet.columns.forEach((column: any) => {
    column.width = 18;
  });

  // ============================================
  // SHEET 4: NET DAĞILIMI
  // ============================================
  const distSheet = workbook.addWorksheet('Net Dağılımı', {
    properties: { tabColor: { argb: '8B5CF6' } },
  });

  const distHeader = distSheet.addRow(['Aralık', 'Öğrenci Sayısı', 'Yüzde']);
  distHeader.eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '8B5CF6' },
    };
  });

  statistics.netDistribution.forEach((dist) => {
    distSheet.addRow([dist.range, dist.count, `%${dist.percentage}`]);
  });

  distSheet.columns.forEach((column: any) => {
    column.width = 18;
  });

  // ============================================
  // EXPORT
  // ============================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Download
  const fileName = `${exam.name.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ\s]/g, '')}_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

