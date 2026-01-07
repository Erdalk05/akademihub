// ============================================================================
// SPECTRA MODULE - PDF EXPORT
// jsPDF ile sınav verilerini PDF'e aktarma
// ============================================================================

import type { Exam, ExamSection, StudentTableRow, ExamStatistics } from '@/types/spectra-detail';

// jsPDF dynamic import
let jsPDF: any = null;
let autoTable: any = null;

async function getJsPDF() {
  if (!jsPDF) {
    const jsPDFModule = await import('jspdf');
    jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    const autoTableModule = await import('jspdf-autotable');
    autoTable = autoTableModule.default;
  }
  return { jsPDF, autoTable };
}

interface ExportPDFOptions {
  exam: Exam;
  sections: ExamSection[];
  rows: StudentTableRow[];
  statistics: ExamStatistics;
  organizationName?: string;
  logoUrl?: string;
}

/**
 * Sınav verilerini PDF dosyasına aktarır
 */
export async function exportToPDF({
  exam,
  sections,
  rows,
  statistics,
  organizationName = 'AkademiHub',
}: ExportPDFOptions): Promise<void> {
  const { jsPDF: JsPDF } = await getJsPDF();

  // Create PDF (landscape for more columns)
  const doc = new JsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors
  const primaryColor = [16, 185, 129] as [number, number, number]; // Emerald
  const textColor = [51, 51, 51] as [number, number, number];
  const lightGray = [243, 244, 246] as [number, number, number];

  // ============================================
  // PAGE 1: HEADER & SUMMARY
  // ============================================

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(exam.name, margin, 15);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = exam.exam_date
    ? new Date(exam.exam_date).toLocaleDateString('tr-TR')
    : '-';
  doc.text(`${organizationName} | ${dateStr} | ${exam.exam_type}`, margin, 23);

  // Organization name (right side)
  doc.setFontSize(12);
  doc.text(organizationName, pageWidth - margin, 15, { align: 'right' });

  // Reset text color
  doc.setTextColor(...textColor);

  // Statistics section
  let yPos = 40;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Genel İstatistikler', margin, yPos);
  yPos += 10;

  // Stats table
  const statsData = [
    ['Toplam Katılımcı', String(statistics.totalParticipants)],
    ['Asil / Misafir', `${statistics.institutionCount} / ${statistics.guestCount}`],
    ['Ortalama Net', statistics.averageNet.toFixed(2)],
    ['Medyan Net', statistics.medianNet.toFixed(2)],
    ['Standart Sapma', statistics.stdDeviation.toFixed(2)],
    ['En Yüksek', `${statistics.maxNet.toFixed(2)} (${statistics.maxNetStudent?.name || '-'})`],
    ['En Düşük', `${statistics.minNet.toFixed(2)} (${statistics.minNetStudent?.name || '-'})`],
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [],
    body: statsData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 80 },
    },
    margin: { left: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Net Distribution
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Dağılımı', margin, yPos);
  yPos += 8;

  const distData = statistics.netDistribution.map((d) => [
    d.range,
    String(d.count),
    `%${d.percentage}`,
  ]);

  (doc as any).autoTable({
    startY: yPos,
    head: [['Aralık', 'Öğrenci', 'Oran']],
    body: distData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    margin: { left: margin },
    tableWidth: 80,
  });

  // Class Comparison (right side)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Sınıf Karşılaştırması', pageWidth / 2, 40);

  const classData = statistics.classAverages.slice(0, 10).map((c, i) => [
    String(i + 1),
    c.className,
    String(c.studentCount),
    c.averageNet.toFixed(2),
  ]);

  (doc as any).autoTable({
    startY: 48,
    head: [['Sıra', 'Sınıf', 'Öğrenci', 'Ort. Net']],
    body: classData,
    theme: 'striped',
    headStyles: {
      fillColor: [245, 158, 11] as [number, number, number], // Amber
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    margin: { left: pageWidth / 2 },
    tableWidth: 100,
  });

  // ============================================
  // PAGE 2+: STUDENT LIST
  // ============================================
  doc.addPage('a4', 'landscape');

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Öğrenci Sıralaması', margin, 13);
  doc.setTextColor(...textColor);

  // Table headers
  const tableHead = [
    'Sıra',
    'No',
    'Öğrenci',
    'Sınıf',
    'Tip',
    ...sections.slice(0, 4).map((s) => s.code),
    'Top.Net',
    'LGS',
  ];

  // Table body (limit to fit on pages)
  const tableBody = rows.slice(0, 50).map((row) => {
    const sectionNets = sections.slice(0, 4).map((s) => {
      const sec = row.sections.find((rs) => rs.sectionId === s.id);
      return sec?.net.toFixed(1) ?? '-';
    });

    return [
      String(row.rank),
      row.studentNo,
      row.name.length > 20 ? row.name.substring(0, 20) + '...' : row.name,
      row.className,
      row.participantType === 'institution' ? 'Asil' : 'Misafir',
      ...sectionNets,
      row.totalNet.toFixed(1),
      String(row.lgsScore),
    ];
  });

  (doc as any).autoTable({
    startY: 25,
    head: [tableHead],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246] as [number, number, number], // Blue
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 20 },
      2: { cellWidth: 45 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data: any) => {
      // Top 3 medal emojis
      if (data.column.index === 0 && data.section === 'body') {
        const rank = parseInt(data.cell.raw);
        if (rank === 1) {
          doc.setTextColor(255, 215, 0);
          doc.text('🥇', data.cell.x + 1, data.cell.y + 4);
        } else if (rank === 2) {
          doc.setTextColor(192, 192, 192);
          doc.text('🥈', data.cell.x + 1, data.cell.y + 4);
        } else if (rank === 3) {
          doc.setTextColor(205, 127, 50);
          doc.text('🥉', data.cell.x + 1, data.cell.y + 4);
        }
      }
    },
  });

  // Footer on each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${organizationName} - ${exam.name} | Sayfa ${i}/${totalPages} | ${new Date().toLocaleDateString('tr-TR')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // ============================================
  // SAVE
  // ============================================
  const fileName = `${exam.name.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ\s]/g, '')}_${
    new Date().toISOString().split('T')[0]
  }.pdf`;

  doc.save(fileName);
}

/**
 * Tek öğrenci için PDF raporu oluşturur
 */
export async function exportStudentPDF({
  student,
  exam,
  sections,
  classAverage,
  sectionAverages,
  organizationName = 'AkademiHub',
}: {
  student: StudentTableRow;
  exam: Exam;
  sections: ExamSection[];
  classAverage: number;
  sectionAverages: Map<string, number>;
  organizationName?: string;
}): Promise<void> {
  const { jsPDF: JsPDF } = await getJsPDF();

  const doc = new JsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const primaryColor = [16, 185, 129] as [number, number, number];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ÖĞRENCİ PERFORMANS RAPORU', margin, 15);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name, margin, 25);

  doc.setFontSize(10);
  const dateStr = exam.exam_date
    ? new Date(exam.exam_date).toLocaleDateString('tr-TR')
    : '-';
  doc.text(`${exam.name} | ${dateStr}`, margin, 32);

  // Student info
  let yPos = 45;
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Öğrenci Bilgileri', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Öğrenci No: ${student.studentNo}`, margin, yPos);
  doc.text(`Sınıf: ${student.className}`, margin + 60, yPos);
  doc.text(`Tip: ${student.participantType === 'institution' ? 'Asil' : 'Misafir'}`, margin + 100, yPos);
  yPos += 15;

  // Summary box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Toplam Net', margin + 10, yPos + 10);
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text(student.totalNet.toFixed(1), margin + 10, yPos + 22);

  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  doc.text('Kurum Sırası', margin + 50, yPos + 10);
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text(`${student.rank}`, margin + 50, yPos + 22);

  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  doc.text('Yüzdelik', margin + 90, yPos + 10);
  doc.setFontSize(18);
  doc.setTextColor(139, 92, 246);
  doc.text(`%${student.percentile}`, margin + 90, yPos + 22);

  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  doc.text('Tahmini LGS', margin + 130, yPos + 10);
  doc.setFontSize(18);
  doc.setTextColor(245, 158, 11);
  doc.text(student.lgsScore.toLocaleString('tr-TR'), margin + 130, yPos + 22);

  yPos += 45;

  // Subject table
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ders Bazlı Performans', margin, yPos);
  yPos += 8;

  const subjectData = student.sections.map((sec) => {
    const avg = sectionAverages.get(sec.sectionId) || 0;
    const diff = sec.net - avg;
    const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    return [sec.sectionName, String(sec.correct), String(sec.wrong), String(sec.blank), sec.net.toFixed(1), avg.toFixed(1), diffStr];
  });

  (doc as any).autoTable({
    startY: yPos,
    head: [['Ders', 'Doğru', 'Yanlış', 'Boş', 'Net', 'Sınıf Ort.', 'Fark']],
    body: subjectData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      6: { 
        cellWidth: 20,
        halign: 'center',
      },
    },
    didParseCell: (data: any) => {
      // Color the diff column
      if (data.column.index === 6 && data.section === 'body') {
        const val = parseFloat(data.cell.raw);
        if (val > 0) {
          data.cell.styles.textColor = [34, 197, 94];
        } else if (val < 0) {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
    margin: { left: margin },
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${organizationName} | Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Save
  const fileName = `${student.name}_${exam.name.replace(/[^a-zA-Z0-9]/g, '')}_rapor.pdf`;
  doc.save(fileName);
}

