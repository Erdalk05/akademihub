import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface RegistrationReceiptData {
  studentName: string;
  studentNo: string;
  parentName: string;
  registrationFee: number;
  paymentMethod: string;
  paymentDate: string;
  receiptNo: string;
}

/**
 * Kayıt ücreti makbuzu oluşturur
 */
export function generateRegistrationReceipt(data: RegistrationReceiptData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('KAYIT ÜCRETİ MAKBUZU', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(process.env.NEXT_PUBLIC_ORG_NAME || 'AkademiHub', pageWidth / 2, yPos, { align: 'center' });
  
  // Makbuz No ve Tarih
  yPos += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Makbuz No: ${data.receiptNo}`, 20, yPos);
  doc.text(`Tarih: ${new Date(data.paymentDate).toLocaleDateString('tr-TR')}`, pageWidth - 70, yPos);

  // Divider
  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Öğrenci Bilgileri
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ÖĞRENCİ BİLGİLERİ', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ad Soyad: ${data.studentName}`, 20, yPos);
  
  yPos += 7;
  doc.text(`Öğrenci No: ${data.studentNo}`, 20, yPos);
  
  yPos += 7;
  doc.text(`Veli: ${data.parentName}`, 20, yPos);

  // Divider
  yPos += 10;
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Ödeme Detayları
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ÖDEME DETAYLARI', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Açıklama', 20, yPos);
  doc.text('Tutar', pageWidth - 50, yPos);
  
  yPos += 7;
  doc.text('Kayıt Ücreti', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.registrationFee.toLocaleString('tr-TR')} TL`, pageWidth - 50, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Ödeme Yöntemi: ${data.paymentMethod}`, 20, yPos);

  // Total Box
  yPos += 15;
  doc.setFillColor(240, 253, 244); // Light green
  doc.rect(20, yPos - 5, pageWidth - 40, 15, 'F');
  doc.setDrawColor(34, 197, 94); // Green border
  doc.rect(20, yPos - 5, pageWidth - 40, 15, 'S');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOPLAM ÖDENEN:', 25, yPos + 5);
  doc.text(`${data.registrationFee.toLocaleString('tr-TR')} TL`, pageWidth - 50, yPos + 5);

  // Footer
  yPos += 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Bu makbuz kayıt ücretinin tahsil edildiğini gösterir.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('Kayıt işlemleriniz tamamlanmıştır.', pageWidth / 2, yPos, { align: 'center' });

  // Stamp & Signature Area
  yPos += 25;
  doc.setDrawColor(150, 150, 150);
  doc.line(30, yPos, 80, yPos);
  doc.line(pageWidth - 80, yPos, pageWidth - 30, yPos);
  
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Teslim Eden', 55, yPos, { align: 'center' });
  doc.text('Teslim Alan', pageWidth - 55, yPos, { align: 'center' });

  // QR Code placeholder (optional)
  yPos += 15;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Makbuz ID: ${data.receiptNo}`, pageWidth / 2, yPos, { align: 'center' });

  // Save PDF
  const filename = `Kayit_Makbuz_${data.studentNo}_${data.receiptNo}.pdf`;
  doc.save(filename);
}

/**
 * Makbuz numarası üretir
 */
export function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  return `KM-${year}${month}${day}-${random}`;
}




