// ============================================================================
// OTOMATİK KARNE OLUŞTURUCU
// Dönem sonu ve sınav bazlı karne PDF'leri
// ============================================================================

import type { StudentTableRow, ExamSection, ExamStatistics } from '@/types/spectra-detail';

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

// ============================================================================
// TİPLER
// ============================================================================

export interface ReportCardData {
  student: {
    id: string;
    name: string;
    studentNo: string;
    className: string;
    photoUrl?: string;
  };
  organization: {
    name: string;
    logoUrl?: string;
  };
  period: {
    name: string; // "2025-2026 1. Dönem"
    startDate: string;
    endDate: string;
  };
  exams: {
    id: string;
    name: string;
    date: string;
    net: number;
    rank: number;
    percentile: number;
    sections: {
      name: string;
      correct: number;
      wrong: number;
      blank: number;
      net: number;
    }[];
  }[];
  summary: {
    examCount: number;
    avgNet: number;
    bestNet: number;
    worstNet: number;
    trend: number;
    classRank: number;
    classSize: number;
    predictedLGS: number;
  };
  aiAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

// ============================================================================
// KARNE PDF OLUŞTUR
// ============================================================================

export async function generateReportCardPDF(data: ReportCardData): Promise<Blob> {
  const { jsPDF: JsPDF } = await getJsPDF();

  const doc = new JsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Renkler
  const primaryColor = [16, 185, 129] as [number, number, number];
  const textColor = [51, 51, 51] as [number, number, number];
  const lightGray = [245, 245, 245] as [number, number, number];

  // ============================================
  // SAYFA 1: KAPAK & ÖZET
  // ============================================

  // Header - Logo & Kurum Adı
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Kurum adı
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.organization.name, pageWidth / 2, 20, { align: 'center' });

  // Dönem
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.period.name} Karnesi`, pageWidth / 2, 32, { align: 'center' });

  // Öğrenci Bilgileri
  let yPos = 55;
  doc.setTextColor(...textColor);
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.student.name, margin + 10, yPos + 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Öğrenci No: ${data.student.studentNo}`, margin + 10, yPos + 22);
  doc.text(`Sınıf: ${data.student.className}`, margin + 10, yPos + 30);

  // Sınıf Sırası (sağ üst köşe)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.summary.classRank}`, pageWidth - margin - 30, yPos + 18, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`/ ${data.summary.classSize}`, pageWidth - margin - 15, yPos + 18);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Sınıf Sırası', pageWidth - margin - 22, yPos + 28, { align: 'center' });

  // ÖZET KARTLAR
  yPos = 100;
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DÖNEM ÖZETİ', margin, yPos);

  yPos += 8;
  const cardWidth = (contentWidth - 10) / 4;
  const cardHeight = 28;

  const summaryCards = [
    { label: 'Sınav Sayısı', value: data.summary.examCount.toString(), color: primaryColor },
    { label: 'Ort. Net', value: data.summary.avgNet.toFixed(1), color: primaryColor },
    { label: 'En İyi', value: data.summary.bestNet.toFixed(1), color: [34, 197, 94] as [number, number, number] },
    { label: 'Trend', value: `${data.summary.trend > 0 ? '+' : ''}${data.summary.trend.toFixed(1)}`, color: data.summary.trend >= 0 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
  ];

  summaryCards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 3.33);
    
    doc.setFillColor(...lightGray);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'F');

    doc.setTextColor(...(card.color as [number, number, number]));
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, yPos + 12, { align: 'center' });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + cardWidth / 2, yPos + 22, { align: 'center' });
  });

  // LGS TAHMİNİ
  yPos += cardHeight + 15;
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Tahmini LGS Puanı:', margin + 10, yPos + 10);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.summary.predictedLGS.toLocaleString('tr-TR'), margin + 10, yPos + 20);

  // SINAV LİSTESİ
  yPos += 35;
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SINAV SONUÇLARI', margin, yPos);

  yPos += 5;
  const examTableData = data.exams.map((exam, index) => [
    (index + 1).toString(),
    exam.name,
    new Date(exam.date).toLocaleDateString('tr-TR'),
    exam.net.toFixed(1),
    exam.rank.toString(),
    `%${exam.percentile}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Sınav', 'Tarih', 'Net', 'Sıra', 'Yüzdelik']],
    body: examTableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
  });

  // ============================================
  // SAYFA 2: DERS BAZLI DETAY
  // ============================================
  doc.addPage();

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DERS BAZLI PERFORMANS', pageWidth / 2, 15, { align: 'center' });

  yPos = 35;

  // Her sınav için ders bazlı tablo
  for (const exam of data.exams.slice(0, 3)) { // Son 3 sınav
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(...textColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${exam.name} (${new Date(exam.date).toLocaleDateString('tr-TR')})`, margin, yPos);

    yPos += 5;
    const sectionTableData = exam.sections.map((s) => [
      s.name,
      s.correct.toString(),
      s.wrong.toString(),
      s.blank.toString(),
      s.net.toFixed(1),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Ders', 'Doğru', 'Yanlış', 'Boş', 'Net']],
      body: sectionTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [100, 100, 100],
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center',
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // AI ANALİZ (varsa)
  if (data.aiAnalysis) {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, yPos, contentWidth, 60, 3, 3, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('AI ÖNERİLERİ', margin + 5, yPos + 10);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    yPos += 18;
    doc.setTextColor(34, 197, 94);
    doc.text('✓ Güçlü Alanlar:', margin + 5, yPos);
    doc.setTextColor(100, 100, 100);
    doc.text(data.aiAnalysis.strengths.join(', ') || '-', margin + 35, yPos);

    yPos += 8;
    doc.setTextColor(239, 68, 68);
    doc.text('✗ Gelişim Alanları:', margin + 5, yPos);
    doc.setTextColor(100, 100, 100);
    doc.text(data.aiAnalysis.weaknesses.join(', ') || '-', margin + 40, yPos);

    yPos += 8;
    doc.setTextColor(59, 130, 246);
    doc.text('💡 Öneriler:', margin + 5, yPos);
    doc.setTextColor(100, 100, 100);
    const recommendations = data.aiAnalysis.recommendations.slice(0, 2).join(' | ') || '-';
    doc.text(recommendations.substring(0, 80), margin + 28, yPos);
  }

  // FOOTER
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Oluşturma: ${new Date().toLocaleDateString('tr-TR')} | Sayfa ${i}/${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text('AkademiHub Spectra', pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return doc.output('blob');
}

// ============================================================================
// TOPLU KARNE OLUŞTUR
// ============================================================================

export async function generateBulkReportCards(
  students: ReportCardData[]
): Promise<{ studentId: string; blob: Blob }[]> {
  const results: { studentId: string; blob: Blob }[] = [];

  for (const student of students) {
    const blob = await generateReportCardPDF(student);
    results.push({ studentId: student.student.id, blob });
  }

  return results;
}

// ============================================================================
// KARNE VERİSİ HAZIRLA
// ============================================================================

export function prepareReportCardData(
  student: {
    id: string;
    name: string;
    studentNo: string;
    className: string;
  },
  exams: {
    id: string;
    name: string;
    date: string;
    net: number;
    rank: number;
    totalStudents: number;
    sections: { name: string; correct: number; wrong: number; blank: number; net: number }[];
  }[],
  organization: { name: string; logoUrl?: string },
  period: { name: string; startDate: string; endDate: string },
  aiAnalysis?: ReportCardData['aiAnalysis']
): ReportCardData {
  const nets = exams.map((e) => e.net);
  const avgNet = nets.reduce((a, b) => a + b, 0) / nets.length;
  const bestNet = Math.max(...nets);
  const worstNet = Math.min(...nets);
  
  // Trend hesapla (son 3 sınav ortalaması - ilk 3 sınav ortalaması)
  let trend = 0;
  if (nets.length >= 4) {
    const recent = nets.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = nets.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    trend = recent - older;
  }

  // Son sınavdan class rank ve size
  const lastExam = exams[exams.length - 1];

  return {
    student,
    organization,
    period,
    exams: exams.map((e) => ({
      ...e,
      percentile: Math.round(((e.totalStudents - e.rank + 1) / e.totalStudents) * 100),
    })),
    summary: {
      examCount: exams.length,
      avgNet: Math.round(avgNet * 10) / 10,
      bestNet,
      worstNet,
      trend: Math.round(trend * 10) / 10,
      classRank: lastExam?.rank || 0,
      classSize: lastExam?.totalStudents || 0,
      predictedLGS: Math.round(200 + avgNet * 4.5),
    },
    aiAnalysis,
  };
}

