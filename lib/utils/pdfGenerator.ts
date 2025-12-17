/**
 * PDF Oluşturma Yardımcı Fonksiyonları
 * html2canvas + jsPDF kullanarak güvenilir PDF oluşturma
 */

export interface PDFOptions {
  filename: string;
  format?: 'a4' | 'a5' | [number, number]; // [width, height] in mm
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  scale?: number;
}

/**
 * HTML elementini PDF'e çevirir ve indirir
 * @param element - PDF'e çevrilecek HTML elementi
 * @param options - PDF ayarları
 * @returns Promise<Blob> - PDF blob
 */
export async function generatePDF(
  element: HTMLElement,
  options: PDFOptions
): Promise<Blob> {
  // Dinamik import - client-side only
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default;
  const { jsPDF } = await import('jspdf');

  const {
    filename,
    format = 'a4',
    orientation = 'portrait',
    margin = 10,
    scale = 2,
  } = options;

  // Element'i canvas'a çevir
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  // PDF boyutlarını hesapla
  let pageWidth: number;
  let pageHeight: number;

  if (Array.isArray(format)) {
    pageWidth = format[0];
    pageHeight = format[1];
  } else if (format === 'a4') {
    pageWidth = orientation === 'portrait' ? 210 : 297;
    pageHeight = orientation === 'portrait' ? 297 : 210;
  } else {
    // a5
    pageWidth = orientation === 'portrait' ? 148 : 210;
    pageHeight = orientation === 'portrait' ? 210 : 148;
  }

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // PDF oluştur
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: Array.isArray(format) ? format : format,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // Tek sayfa veya çok sayfa
  if (imgHeight <= pageHeight - margin * 2) {
    // Tek sayfaya sığıyor
    pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
  } else {
    // Çok sayfa gerekiyor
    let heightLeft = imgHeight;
    let position = margin;
    
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);
    }
  }

  return pdf.output('blob');
}

/**
 * HTML elementini PDF olarak indirir
 */
export async function downloadPDF(
  element: HTMLElement,
  options: PDFOptions
): Promise<void> {
  const blob = await generatePDF(element, options);
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * HTML string'inden PDF oluşturur
 */
export async function createPDFFromHTML(
  htmlContent: string,
  options: PDFOptions
): Promise<Blob> {
  // Geçici container oluştur
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 genişlik
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const blob = await generatePDF(container, options);
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * HTML string'ini PDF olarak indirir
 */
export async function downloadPDFFromHTML(
  htmlContent: string,
  options: PDFOptions
): Promise<void> {
  const blob = await createPDFFromHTML(htmlContent, options);
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
