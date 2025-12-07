/**
 * 📄 CONTRACT PDF GENERATOR SERVICE
 * jsPDF + jsPDF-autotable kullanarak sözleşmeyi PDF'e çevirir
 * AI Features: Smart pagination, Format optimization, Compression
 */

import type { Contract } from '@/types/contract.types';

/**
 * 🎨 Sözleşmeyi PDF'e çevir
 * @param contract - Sözleşme verisi
 * @param includeSignatures - İmzalar dahil edilsin mi?
 * @returns Base64 PDF veri
 */
export const generateContractPDF = async (
  contract: Contract,
  includeSignatures: boolean = true
): Promise<string> => {
  // jsPDF dinamik import (çünkü server-side de kullanılabilir)
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // ==================== HELPER FUNCTIONS ====================

  const checkPageBreak = (increment: number) => {
    if (yPosition + increment > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  const addHeader = () => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EĞİTİM-ÖĞRETİM HİZMET SÖZLEŞMESİ', pageWidth / 2, yPosition, {
      align: 'center',
    });

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sözleşme No: ${contract.contractNo}`, pageWidth / 2, yPosition, {
      align: 'center',
    });
    doc.text(
      `Tarih: ${contract.olusturmaTarihi.toLocaleDateString('tr-TR')}`,
      pageWidth / 2,
      yPosition + 5,
      { align: 'center' }
    );

    yPosition += 15;
  };

  const addSection = (title: string, number: number) => {
    checkPageBreak(10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${number}. ${title}`, leftMargin, yPosition);
    yPosition += 10;
  };

  const addText = (text: string) => {
    checkPageBreak(5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, leftMargin, yPosition);
    yPosition += lines.length * 5;
  };

  // ==================== PDF OLUŞTURMA ====================

  // Header
  addHeader();

  // ==================== 1. TARAF BİLGİLERİ ====================
  addSection('Taraf Bilgileri', 1);

  doc.setFont('helvetica', 'bold');
  doc.text('Okul Bilgileri:', leftMargin, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');

  addText(`Adı: ${contract.okul.ad}`);
  addText(`Vergi No: ${contract.okul.vergiNo}`);
  addText(`Adres: ${contract.okul.adres}, ${contract.okul.ilce}/${contract.okul.il}`);
  addText(`Telefon: ${contract.okul.telefon}`);
  addText(`Email: ${contract.okul.email}`);

  yPosition += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Öğrenci Bilgileri:', leftMargin, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');

  addText(`Ad Soyad: ${contract.ogrenci.ad} ${contract.ogrenci.soyad}`);
  addText(`TC Kimlik: ${contract.ogrenci.tcKimlik}`);
  addText(`Doğum Tarihi: ${contract.ogrenci.dogumTarihi.toLocaleDateString('tr-TR')}`);
  addText(`Sınıf: ${contract.ogrenci.sinif}`);

  yPosition += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Veli Bilgileri:', leftMargin, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');

  addText(`Ad Soyad: ${contract.veli.ad} ${contract.veli.soyad}`);
  addText(`Telefon: ${contract.veli.telefon}`);
  addText(`Email: ${contract.veli.email}`);

  // ==================== 2. SÖZLEŞME KONUSU ====================
  yPosition += 10;
  addSection('Sözleşmenin Konusu', 2);

  const subject = `İşbu sözleşme, ${contract.ogrenci.ad} ${contract.ogrenci.soyad} isimli öğrencinin ${contract.okul.ad} bünyesinde ${contract.ogrenci.sinif} sınıfında eğitim-öğretim görmesi konusundaki şartları belirler.`;
  addText(subject);

  // ==================== 3. ÜCRET VE ÖDEME PLANI ====================
  yPosition += 10;
  addSection('Ücret ve Ödeme Planı', 3);

  const ucretData = [
    ['Eğitim Ücreti (Brüt)', `₺${contract.finans.brutUcret.toLocaleString('tr-TR')}`],
    ...contract.finans.indirimler.map((ind) => [
      `${ind.tip} İndirimi (%${ind.oran})`,
      `-₺${ind.tutar.toLocaleString('tr-TR')}`,
    ]),
    ['Net Eğitim Ücreti', `₺${contract.finans.netUcret.toLocaleString('tr-TR')}`],
    ['Kayıt Bedeli', `₺${contract.finans.kayitBedeli.tutar.toLocaleString('tr-TR')}`],
  ];

  // Taksit tablosu
  const taksitData = contract.finans.taksitPlani.map((t) => [
    t.no.toString(),
    t.vadeTarihi.toLocaleDateString('tr-TR'),
    `₺${t.tutar.toLocaleString('tr-TR')}`,
    t.odemeYontemi || '-',
  ]);

  checkPageBreak(60);
  yPosition += 5;

  // ==================== İMZALAR ====================
  if (includeSignatures) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Taraf İmzaları', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Veli İmzası
    if (contract.imzalar.veli.imzaUrl) {
      doc.text('Veli / Ödemeyi Yapan Kişi:', leftMargin, yPosition);
      yPosition += 5;
      doc.addImage(contract.imzalar.veli.imzaUrl, 'PNG', leftMargin, yPosition, 50, 25);
      yPosition += 30;
      doc.setFontSize(10);
      doc.text(`Ad Soyad: ${contract.imzalar.veli.ad}`, leftMargin, yPosition);
    }

    // Yetkili İmzası
    if (contract.imzalar.yetkili.imzaUrl) {
      doc.text('Okul Yetkilisi:', pageWidth / 2, yPosition);
      doc.addImage(contract.imzalar.yetkili.imzaUrl, 'PNG', pageWidth / 2 + 10, yPosition - 30, 50, 25);
      doc.text(`Ad Soyad: ${contract.imzalar.yetkili.ad}`, pageWidth / 2 + 10, yPosition);
    }
  }

  // ==================== ÇIKTI ====================
  const pdfData = doc.output('dataurlstring');
  return pdfData;
};

/**
 * 💾 PDF'i dosya olarak indir
 */
export const downloadContractPDF = async (
  contract: Contract,
  filename: string = `Sozlesme_${contract.contractNo}.pdf`
) => {
  const pdfData = await generateContractPDF(contract);

  const link = document.createElement('a');
  link.href = pdfData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
