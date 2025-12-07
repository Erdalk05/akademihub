/**
 * MEB Compliant Contract Generator
 * 
 * Generates legally-binding student registration contracts
 * compliant with Turkish Ministry of Education (MEB) regulations
 * 
 * @author AkademiHub System Architect
 * @version 2.0.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentRegistrationData } from '@/lib/types/registration-types';
import { formatTRY } from '@/lib/hooks/useTuitionCalculator';

/**
 * Contract Generation Options
 */
export interface ContractGenerationOptions {
  includeQRCode?: boolean;
  includeDigitalSignature?: boolean;
  includeSchoolLogo?: boolean;
  schoolLogoUrl?: string;
}

/**
 * Generate COMPACT K12-compliant registration form (1-2 pages max)
 * Optimized for essential information only
 */
export async function generateRegistrationContract(
  data: StudentRegistrationData,
  options: ContractGenerationOptions = {}
): Promise<Blob> {
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set Turkish font support (if available)
  try {
    // You may need to add custom font for Turkish characters
    // doc.addFont('path/to/font.ttf', 'CustomFont', 'normal');
    // doc.setFont('CustomFont');
  } catch (error) {
    console.warn('Custom font not available, using default');
  }
  
  doc.setFont('helvetica');
  
  let yPosition = 20;
  
  // ============================================
  // HEADER: School Logo & Title
  // ============================================
  if (options.includeSchoolLogo && options.schoolLogoUrl) {
    try {
      doc.addImage(options.schoolLogoUrl, 'PNG', 15, yPosition, 30, 30);
      yPosition += 35;
    } catch (error) {
      console.warn('Logo could not be added:', error);
    }
  }
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ÖĞRENCİ KAYIT VE EĞİTİM SÖZLEŞMESİ', 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Millî Eğitim Bakanlığı Özel Öğretim Kurumları Yönetmeliği Gereği)', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  // ============================================
  // SECTION 1: Contract Parties
  // ============================================
    doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MADDE 1: TARAFLAR', 15, yPosition);
  yPosition += 7;
  
    doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // School Information
  const schoolInfo = [
    'Kurum Adı: AKADEMİHUB ÖZEL EĞİTİM KURUMLARI',
    'Adres: [Kurum Adresi]',
    'Vergi Dairesi: [Vergi Dairesi]',
    'Vergi No: [Vergi No]',
    'Telefon: [Telefon]'
  ];
  
  schoolInfo.forEach(line => {
    doc.text(line, 15, yPosition);
    yPosition += 5;
  });
  
  yPosition += 3;
  doc.text('(Bundan sonra "KURUM" olarak anılacaktır)', 15, yPosition);
  yPosition += 10;
  
  // Parent Information
  const responsibleParent = data.finance.contract.contractAccepted 
    ? (data.parent.financialResponsible === 'mother' ? data.parent.mother : data.parent.father)
    : data.parent.mother;
  
  const parentInfo = [
    `Veli Adı Soyadı: ${responsibleParent.firstName} ${responsibleParent.lastName}`,
    `TC Kimlik No: ${responsibleParent.tcKimlikNo || 'Belirtilmemiş'}`,
    `Telefon: ${responsibleParent.phone}`,
    `E-posta: ${responsibleParent.email || 'Belirtilmemiş'}`,
    `Adres: ${data.parent.homeAddress || 'Belirtilmemiş'}`
  ];
  
  parentInfo.forEach(line => {
    doc.text(line, 15, yPosition);
    yPosition += 5;
  });
  
  yPosition += 3;
  doc.text('(Bundan sonra "VELİ" olarak anılacaktır)', 15, yPosition);
  yPosition += 10;
  
  // ============================================
  // SECTION 2: Student Information
  // ============================================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MADDE 2: ÖĞRENCİ BİLGİLERİ', 15, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const studentInfo = [
    `Adı Soyadı: ${data.personal.firstName} ${data.personal.lastName}`,
    `TC Kimlik No: ${data.personal.tcKimlikNo}`,
    `Doğum Tarihi: ${new Date(data.personal.dateOfBirth).toLocaleDateString('tr-TR')}`,
    `Doğum Yeri: ${data.personal.placeOfBirth}`,
    `Sınıf: ${data.education.grade}`,
    `Şube: ${data.education.section}`,
    `Akademik Yıl: ${data.education.academicYear}`,
    `Kayıt Tarihi: ${new Date(data.education.enrollmentDate).toLocaleDateString('tr-TR')}`
  ];
  
  studentInfo.forEach(line => {
    doc.text(line, 15, yPosition);
    yPosition += 5;
  });
  
  yPosition += 10;
  
  // ============================================
  // SECTION 3: Financial Terms
  // ============================================
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MADDE 3: ÜCRET VE ÖDEME KOŞULLARI', 15, yPosition);
  yPosition += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const calculation = data.finance.calculation;
  
  doc.text(`Brüt Eğitim Ücreti: ${formatTRY(calculation.basePrice)}`, 15, yPosition);
  yPosition += 5;
  
  if (calculation.appliedDiscounts.length > 0) {
    doc.text('Uygulanan İndirimler:', 15, yPosition);
    yPosition += 5;
    
    calculation.appliedDiscounts.forEach(discount => {
      doc.text(`  • ${discount.label}: ${formatTRY(discount.amount)}`, 20, yPosition);
      yPosition += 5;
    });
  }
  
  doc.text(`Toplam İndirim: ${formatTRY(calculation.totalDiscount)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`İndirimli Fiyat: ${formatTRY(calculation.discountedPrice)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`KDV (%18): ${formatTRY(calculation.vatAmount)}`, 15, yPosition);
  yPosition += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`TOPLAM ÜCRET: ${formatTRY(calculation.totalPrice)}`, 15, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  
  // Payment Method
  let paymentMethodText = '';
  switch (data.finance.paymentMethod) {
    case 'cash':
      paymentMethodText = 'Peşin Ödeme';
      break;
    case 'upfront':
      paymentMethodText = 'Ön Ödeme';
      break;
    case 'installment':
      paymentMethodText = `${data.finance.installmentCount} Taksit`;
      break;
  }
  
  doc.text(`Ödeme Yöntemi: ${paymentMethodText}`, 15, yPosition);
  yPosition += 10;
  
  // Installment Schedule (if applicable)
  if (calculation.installmentPlan && calculation.installmentPlan.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('TAKSİT PLANI:', 15, yPosition);
    yPosition += 7;
    
    // Check if we need a new page
    if (yPosition + (calculation.installmentPlan.length * 5) > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Use autoTable for better formatting
    autoTable(doc, {
      startY: yPosition,
      head: [['Taksit No', 'Vade Tarihi', 'Tutar']],
      body: calculation.installmentPlan.map(inst => [
        inst.installmentNumber.toString(),
        new Date(inst.dueDate).toLocaleDateString('tr-TR'),
        formatTRY(inst.amount)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 15 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // ============================================
  // SECTION 4: General Terms
  // ============================================
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MADDE 4: GENEL HÜKÜMLER', 15, yPosition);
  yPosition += 7;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const generalTerms = [
    '4.1. Veli, öğrencinin kurumun düzenlediği eğitim-öğretim programına, yönetmelik ve mevzuata uygun olarak katılmasını sağlamayı taahhüt eder.',
    '4.2. Ücret ödemeleri, belirlenen vade tarihlerine göre yapılacaktır. Geciken ödemeler için yasal faiz uygulanacaktır.',
    '4.3. Öğrencinin devamsızlığı veya kendi isteğiyle okuldan ayrılması durumunda, ödenen ücretler iade edilmez.',
    '4.4. Kurum, eğitim-öğretim programında değişiklik yapma hakkını saklı tutar.',
    '4.5. Öğrencinin disiplin kurallarına aykırı davranışları nedeniyle okulla ilişiği kesilebilir.',
    '4.6. Bu sözleşme MEB Özel Öğretim Kurumları Yönetmeliği çerçevesinde düzenlenmiştir.'
  ];
  
  generalTerms.forEach(term => {
    const lines = doc.splitTextToSize(term, 180);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
    doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 15, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });
  
  // ============================================
  // SECTION 5: Signature Block
  // ============================================
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }
  
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.text(`Sözleşme Tarihi: ${new Date(data.finance.contract.acceptedAt || Date.now()).toLocaleDateString('tr-TR')}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Sözleşme Saati: ${new Date(data.finance.contract.acceptedAt || Date.now()).toLocaleTimeString('tr-TR')}`, 15, yPosition);
  yPosition += 15;
  
  // Signature areas
  doc.line(15, yPosition, 80, yPosition); // Veli imza çizgisi
  doc.line(130, yPosition, 195, yPosition); // Kurum imza çizgisi
  yPosition += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('VELİ', 15, yPosition);
  doc.text('KURUM YETKİLİSİ', 130, yPosition);
  yPosition += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${responsibleParent.firstName} ${responsibleParent.lastName}`, 15, yPosition);
  doc.text('[Yetkili Adı Soyadı]', 130, yPosition);

  // Digital signature indicator
  if (options.includeDigitalSignature && data.finance.contract.digitalSignature) {
    yPosition += 10;
  doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('✓ Bu sözleşme dijital olarak imzalanmıştır', 15, yPosition);
    doc.text(`SMS Doğrulama: ${data.finance.contract.smsVerified ? 'Onaylandı' : 'Bekliyor'}`, 15, yPosition + 4);
    
    if (data.finance.contract.ipAddress) {
      doc.text(`IP Adresi: ${data.finance.contract.ipAddress}`, 15, yPosition + 8);
    }
  }

  // Footer
  yPosition = 285;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Bu sözleşme elektronik ortamda oluşturulmuş olup yasal geçerliliğe sahiptir.', 105, yPosition, { align: 'center' });
  
  // Generate PDF as Blob
  return doc.output('blob');
}

/**
 * Generate HTML preview of contract (for web display)
 */
export function generateContractHTML(data: StudentRegistrationData): string {
  const responsibleParent = data.parent.financialResponsible === 'mother' 
    ? data.parent.mother 
    : data.parent.father;
  
  const calculation = data.finance.calculation;
  
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kayıt Sözleşmesi</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          background: #f5f5f5;
        }
        .contract {
          background: white;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        h1 {
          color: #2563eb;
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        h2 {
          color: #1e40af;
          font-size: 16px;
          margin: 20px 0 10px 0;
        }
        .subtitle {
          color: #666;
          font-size: 12px;
        }
        .section {
          margin: 20px 0;
        }
        .info-row {
          margin: 5px 0;
          padding: 5px 0;
        }
        .label {
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        th {
          background: #f3f4f6;
          font-weight: bold;
        }
        .total-row {
          background: #fef3c7;
          font-weight: bold;
        }
        .signature-block {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 40px;
          border-top: 1px solid #ddd;
        }
        .signature {
          text-align: center;
          width: 45%;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin: 40px 0 10px 0;
        }
        .digital-badge {
          background: #d1fae5;
          border: 1px solid #34d399;
          padding: 10px;
          margin-top: 20px;
          border-radius: 4px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="contract">
        <div class="header">
          <h1>ÖĞRENCİ KAYIT VE EĞİTİM SÖZLEŞMESİ</h1>
          <p class="subtitle">(Millî Eğitim Bakanlığı Özel Öğretim Kurumları Yönetmeliği Gereği)</p>
        </div>
        
        <div class="section">
          <h2>MADDE 1: TARAFLAR</h2>
          <div class="info-row">
            <span class="label">Kurum Adı:</span> AKADEMİHUB ÖZEL EĞİTİM KURUMLARI
          </div>
          <div class="info-row">
            <span class="label">Veli Adı Soyadı:</span> ${responsibleParent.firstName} ${responsibleParent.lastName}
          </div>
          <div class="info-row">
            <span class="label">TC Kimlik No:</span> ${responsibleParent.tcKimlikNo || 'Belirtilmemiş'}
          </div>
          <div class="info-row">
            <span class="label">Telefon:</span> ${responsibleParent.phone}
          </div>
        </div>
        
        <div class="section">
          <h2>MADDE 2: ÖĞRENCİ BİLGİLERİ</h2>
          <div class="info-row">
            <span class="label">Adı Soyadı:</span> ${data.personal.firstName} ${data.personal.lastName}
          </div>
          <div class="info-row">
            <span class="label">TC Kimlik No:</span> ${data.personal.tcKimlikNo}
          </div>
          <div class="info-row">
            <span class="label">Sınıf:</span> ${data.education.grade} - ${data.education.section}
          </div>
          <div class="info-row">
            <span class="label">Akademik Yıl:</span> ${data.education.academicYear}
          </div>
        </div>
        
        <div class="section">
          <h2>MADDE 3: ÜCRET VE ÖDEME KOŞULLARI</h2>
          
          <table>
            <tr>
              <td>Brüt Eğitim Ücreti</td>
              <td style="text-align: right">${formatTRY(calculation.basePrice)}</td>
            </tr>
            <tr>
              <td>Toplam İndirim</td>
              <td style="text-align: right">-${formatTRY(calculation.totalDiscount)}</td>
            </tr>
            <tr>
              <td>İndirimli Fiyat</td>
              <td style="text-align: right">${formatTRY(calculation.discountedPrice)}</td>
            </tr>
            <tr>
              <td>KDV (%18)</td>
              <td style="text-align: right">${formatTRY(calculation.vatAmount)}</td>
            </tr>
            <tr class="total-row">
              <td>TOPLAM ÜCRET</td>
              <td style="text-align: right">${formatTRY(calculation.totalPrice)}</td>
            </tr>
          </table>
          
          ${calculation.installmentPlan ? `
            <h3>Taksit Planı</h3>
            <table>
              <thead>
                <tr>
                  <th>Taksit No</th>
                  <th>Vade Tarihi</th>
                  <th style="text-align: right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                ${calculation.installmentPlan.map(inst => `
                  <tr>
                    <td>${inst.installmentNumber}</td>
                    <td>${new Date(inst.dueDate).toLocaleDateString('tr-TR')}</td>
                    <td style="text-align: right">${formatTRY(inst.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </div>
        
        <div class="signature-block">
          <div class="signature">
            <div class="signature-line"></div>
            <strong>VELİ</strong><br>
            ${responsibleParent.firstName} ${responsibleParent.lastName}
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <strong>KURUM YETKİLİSİ</strong><br>
            [Yetkili Adı Soyadı]
          </div>
        </div>
        
        ${data.finance.contract.smsVerified ? `
          <div class="digital-badge">
            ✓ Bu sözleşme dijital olarak imzalanmıştır<br>
            SMS Doğrulama: Onaylandı<br>
            Tarih: ${new Date(data.finance.contract.acceptedAt || Date.now()).toLocaleString('tr-TR')}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
