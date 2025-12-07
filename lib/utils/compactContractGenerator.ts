/**
 * COMPACT K12 Registration Form Generator - V4
 * Yeni form yapısına uygun
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ContractData {
  parent: {
    fullName: string;
    tcKimlikNo?: string;
    phone: string;
    email?: string;
    address?: string;
  };
  student: {
    fullName: string;
    dob?: string;
    grade?: string;
    studentNo?: string;
    tcKimlikNo?: string;
  };
  program: {
    schoolYear: string;
    programName: string;
    startDate?: string;
    endDate?: string;
    tuitionTRY: number;
    discountCode?: string;
    registrationFeeTRY?: number;
    registrationFeePaid?: boolean;
    registrationFeePaymentMethod?: string;
  };
  installments?: Array<{
    dueDate: string;
    amountTRY: number;
    method?: string;
  }>;
}

export async function generateCompactContract(data: ContractData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('helvetica');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // ============================================
  // HEADER
  // ============================================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KAYIT SÖZLEŞMESİ', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AKADEMİHUB Özel Eğitim Kurumları', pageWidth / 2, y, { align: 'center' });
  y += 6;

  const today = new Date().toLocaleDateString('tr-TR');
  doc.text(`Tarih: ${today}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ============================================
  // VELİ BİLGİLERİ
  // ============================================
  doc.setFillColor(79, 70, 229);
  doc.rect(15, y, pageWidth - 30, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VELİ BİLGİLERİ', 17, y + 5);
  y += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Ad Soyad: ${data.parent.fullName}`, 20, y);
  y += 6;
  doc.text(`TC Kimlik: ${data.parent.tcKimlikNo || '-'}`, 20, y);
  y += 6;
  doc.text(`Telefon: ${data.parent.phone}`, 20, y);
  y += 6;
  doc.text(`E-posta: ${data.parent.email || '-'}`, 20, y);
  y += 6;
  doc.text(`Adres: ${data.parent.address || '-'}`, 20, y);
  y += 10;

  // ============================================
  // ÖĞRENCİ BİLGİLERİ
  // ============================================
  doc.setFillColor(147, 51, 234);
  doc.rect(15, y, pageWidth - 30, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ÖĞRENCİ BİLGİLERİ', 17, y + 5);
  y += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  doc.text(`Ad Soyad: ${data.student.fullName}`, 20, y);
  y += 6;
  doc.text(`Öğrenci No: ${data.student.studentNo || 'Otomatik atanacak'}`, 20, y);
  y += 6;
  doc.text(`Doğum Tarihi: ${data.student.dob || '-'}`, 20, y);
  y += 6;
  doc.text(`Sınıf: ${data.student.grade || '-'}`, 20, y);
  y += 6;
  doc.text(`TC Kimlik: ${data.student.tcKimlikNo || '-'}`, 20, y);
  y += 10;

  // ============================================
  // PROGRAM & ÜCRET
  // ============================================
  doc.setFillColor(34, 197, 94);
  doc.rect(15, y, pageWidth - 30, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAM & ÜCRET', 17, y + 5);
  y += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  doc.text(`Dönem: ${data.program.schoolYear}`, 20, y);
  y += 6;
  doc.text(`Program: ${data.program.programName}`, 20, y);
  y += 6;
  doc.text(`Brüt Ücret: ₺${data.program.tuitionTRY.toLocaleString('tr-TR')}`, 20, y);
  y += 6;
  
  if (data.program.discountCode) {
    doc.text(`İndirim Kodu: ${data.program.discountCode}`, 20, y);
    y += 6;
  }
  
  if (data.program.registrationFeeTRY && data.program.registrationFeeTRY > 0) {
    doc.text(`Kayıt Ücreti: ₺${data.program.registrationFeeTRY.toLocaleString('tr-TR')} ${data.program.registrationFeePaid ? '(Tahsil edildi)' : ''}`, 20, y);
    y += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Net Tutar: ₺${data.program.tuitionTRY.toLocaleString('tr-TR')}`, 20, y);
  y += 12;

  // ============================================
  // TAKSİT PLANI
  // ============================================
  if (data.installments && data.installments.length > 0) {
    doc.setFillColor(251, 146, 60);
    doc.rect(15, y, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TAKSİT PLANI', 17, y + 5);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const tableData = data.installments.slice(0, 12).map((inst, idx) => [
      `${idx + 1}. Taksit`,
      inst.dueDate,
      `₺${inst.amountTRY.toLocaleString('tr-TR')}`,
      inst.method || 'Havale/EFT'
    ]);

    (doc as any).autoTable({
      startY: y,
      head: [['Taksit', 'Vade Tarihi', 'Tutar', 'Ödeme Yöntemi']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [251, 146, 60], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30, halign: 'left' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 'auto', halign: 'center' }
      },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    
    if (data.installments.length > 12) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`* İlk 12 taksit gösterilmiştir. Toplam ${data.installments.length} taksit planlanmıştır.`, 20, y);
      y += 6;
    }
  }

  // Yeni sayfa kontrolü
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // ============================================
  // YASAL BEYAN
  // ============================================
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const legalText = 'MEB Özel Öğretim Kurumları Yönetmeliği gereği hazırlanmıştır. Yukarıdaki bilgilerin doğruluğunu, ödeme planına uyacağımı, KVKK kapsamında kişisel verilerimin işlenmesini kabul ettiğimi beyan ederim.';
  const splitText = doc.splitTextToSize(legalText, pageWidth - 30);
  doc.text(splitText, 15, y);
  y += splitText.length * 4 + 10;

  // ============================================
  // İMZA ALANLARI
  // ============================================
  const signatureY = y;

  // Sol: Kurum
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('KURUM YETKİLİSİ', 35, signatureY);
  doc.line(15, signatureY + 15, 80, signatureY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('İmza / Tarih / Kaşe', 30, signatureY + 20);

  // Sağ: Veli
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VELİ / MALİ SORUMLU', pageWidth - 65, signatureY);
  doc.line(pageWidth - 80, signatureY + 15, pageWidth - 15, signatureY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('İmza / Tarih', pageWidth - 55, signatureY + 20);

  // ============================================
  // FOOTER
  // ============================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Sayfa ${i}/${totalPages} • AkademiHub © ${new Date().getFullYear()}`,
      pageWidth / 2,
      285,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `Kayit_Sozlesmesi_${data.student.fullName.replace(/\s+/g, '_')}_${today.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}


