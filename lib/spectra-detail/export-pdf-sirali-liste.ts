// ============================================================================
// PDF EXPORT - Genel Sıralı Liste
// Özdebir/K12Net formatında PDF oluşturma
// ============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { 
  StudentRowDetailed, 
  ExamFormat, 
  PDFSiraliListeOptions,
  SubjectResult
} from '@/types/spectra-detail';

/**
 * Genel Sıralı Liste PDF'i oluşturur
 */
export async function generateSiraliListePDF(
  data: StudentRowDetailed[],
  options: PDFSiraliListeOptions
): Promise<void> {
  const doc = new jsPDF({
    orientation: options.pageOrientation || 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Sayfa boyutları
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ─────────────────────────────────────────────────────────────────────────
  // BAŞLIK
  // ─────────────────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(options.subtitle, pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Tarih: ${options.examDate} | Toplam: ${data.length} Öğrenci`, pageWidth / 2, 28, { align: 'center' });

  // ─────────────────────────────────────────────────────────────────────────
  // TABLO
  // ─────────────────────────────────────────────────────────────────────────
  
  if (options.format === 'compact') {
    // KOMPAKT FORMAT - Sadece özet bilgiler
    generateCompactTable(doc, data, options);
  } else {
    // DETAYLI FORMAT - Tüm ders detayları
    generateDetailedTable(doc, data, options);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Sayfa ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // PDF'i indir
  const fileName = `${options.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Kompakt Tablo - Sadece özet bilgiler
 */
function generateCompactTable(
  doc: jsPDF,
  data: StudentRowDetailed[],
  options: PDFSiraliListeOptions
) {
  const headers: string[] = [];
  
  if (options.showColumns.sira) headers.push('Sıra');
  if (options.showColumns.grup) headers.push('Sınıf');
  if (options.showColumns.ogrenciAdi) headers.push('Öğrenci Adı');
  if (options.showColumns.toplamNet) headers.push('Net');
  if (options.showColumns.puanlar) headers.push('Puan');
  if (options.showColumns.siralamalar) {
    headers.push('Sınıf Sırası');
    headers.push('Genel Sıra');
  }

  const rows = data.map(row => {
    const cells: any[] = [];
    
    if (options.showColumns.sira) cells.push(row.sira);
    if (options.showColumns.grup) cells.push(row.grup);
    if (options.showColumns.ogrenciAdi) cells.push(row.ogrenciAdi);
    if (options.showColumns.toplamNet) cells.push(row.toplamNet.toFixed(2));
    if (options.showColumns.puanlar) {
      const primaryScore = row.puanTurleri.lgs || row.puanTurleri.tyt || row.puanTurleri.genel || 0;
      cells.push(primaryScore.toFixed(2));
    }
    if (options.showColumns.siralamalar) {
      cells.push(row.sinifSirasi);
      cells.push(row.genelSira);
    }
    
    return cells;
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [16, 185, 129], // Emerald-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Gray-50
    },
    columnStyles: {
      0: { cellWidth: 15 }, // Sıra
      2: { halign: 'left' }, // Öğrenci Adı
    },
    didDrawCell: (data) => {
      // İlk 3'ü vurgula
      if (data.section === 'body' && data.column.index === 0) {
        const rank = parseInt(data.cell.text[0]);
        if (rank <= 3) {
          doc.setFillColor(254, 243, 199); // Amber-100
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(146, 64, 14); // Amber-900
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + 5, { align: 'center' });
        }
      }
    },
  });
}

/**
 * Detaylı Tablo - Tüm ders detayları
 */
function generateDetailedTable(
  doc: jsPDF,
  data: StudentRowDetailed[],
  options: PDFSiraliListeOptions
) {
  // Ders başlıkları
  const firstStudent = data[0];
  const dersler = firstStudent?.dersSonuclari || [];
  
  const headers: string[] = ['Sıra', 'Sınıf', 'Öğrenci', 'Net', 'Puan'];
  const dersHeaders = dersler.map(d => `${d.dersAdi}\n(${d.soruSayisi})`);
  headers.push(...dersHeaders);
  headers.push('S.Sıra', 'G.Sıra');

  const rows = data.map(row => {
    const cells: any[] = [
      row.sira,
      row.grup,
      row.ogrenciAdi,
      row.toplamNet.toFixed(2),
      (row.puanTurleri.lgs || row.puanTurleri.genel || 0).toFixed(2),
    ];

    // Her ders için Net + D/Y
    row.dersSonuclari.forEach(ders => {
      cells.push(`${ders.net.toFixed(1)}\n${ders.dogru}-${ders.yanlis}`);
    });

    cells.push(row.sinifSirasi, row.genelSira);

    return cells;
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 10 }, // Sıra
      1: { cellWidth: 12 }, // Sınıf
      2: { cellWidth: 35, halign: 'left' }, // Öğrenci
      3: { cellWidth: 12 }, // Net
      4: { cellWidth: 15 }, // Puan
    },
    didDrawCell: (data) => {
      // İlk 3'ü vurgula
      if (data.section === 'body' && data.column.index === 0) {
        const rank = parseInt(data.cell.text[0]);
        if (rank <= 3) {
          doc.setFillColor(254, 243, 199);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
      }
    },
  });
}

/**
 * Hızlı PDF export - Default ayarlarla
 */
export function quickExportPDF(
  data: StudentRowDetailed[],
  examName: string,
  subtitle: string,
  format: 'compact' | 'detailed' = 'compact'
): void {
  const options: PDFSiraliListeOptions = {
    title: `${examName} - Genel Sıralı Liste`,
    subtitle,
    examDate: new Date().toLocaleDateString('tr-TR'),
    format,
    sortBy: 'genelSira',
    showColumns: {
      sira: true,
      grup: true,
      ogrenciAdi: true,
      puanlar: true,
      toplamNet: true,
      dersDetaylari: format === 'detailed',
      siralamalar: true,
    },
    pageOrientation: format === 'detailed' ? 'landscape' : 'portrait',
  };

  generateSiraliListePDF(data, options);
}
