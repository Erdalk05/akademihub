// Export Service - PDF ve Excel'e veri aktarma
import { Payment, Expense, Sale } from '@/types/finance.types';
import type { FinanceInstallment } from '@/lib/types/finance';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Türkçe karakterleri ASCII'ye çevir
const turkishToAscii = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/₺/g, 'TL');
};

// Ödeme yöntemlerini İngilizce'den Türkçe'ye çevir
const translatePaymentMethod = (method: string): string => {
  if (!method) return '';
  const translations: Record<string, string> = {
    'cash': 'Nakit',
    'credit_card': 'Kredi Karti',
    'bank_transfer': 'Havale/EFT',
    'check': 'Cek',
    'other': 'Diger',
    'pos': 'POS',
    'online': 'Online',
  };
  return translations[method.toLowerCase()] || method;
};

// Tarih formatı - gün ve ay için sıfır ekle (02.12.2025)
const formatDateWithZero = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// PDF belgesi oluştur - varsayılan Helvetica font kullan
export const createTurkishPdfDoc = async (
  orientation: 'portrait' | 'landscape' = 'landscape',
) => {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });
  
  // Helvetica font kullan (Türkçe karaktersiz ama çalışıyor)
  doc.setFont('helvetica', 'normal');
  
  return doc;
};

// PDF için metin hazırla - Türkçe karakterleri ASCII'ye çevir
export const normalizeTrForPdf = (value: string): string => {
  if (!value) return '';
  return turkishToAscii(value);
};

// Para formatı - TL sonda (6.500,00 TL)
export const formatCurrency = (amount: number): string => {
  const formatted = amount.toLocaleString('tr-TR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
  return `${formatted} TL`;
};

/**
 * Ödemeleri Excel'e aktar
 */
export const exportPaymentsToExcel = (payments: Payment[], fileName: string = 'odemeler.xlsx') => {
  const data = payments.map((p) => ({
    'Ödeme No': p.paymentNo,
    'Tarih': new Date(p.paymentDate).toLocaleDateString('tr-TR'),
    'Öğrenci': p.studentName,
    'Kategori': p.paymentType,
    'Tutar': `₺${p.amount.toLocaleString('tr-TR')}`,
    'Yöntem': p.paymentMethod,
    'Durum': p.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ödemeler');

  // Sütun genişliği
  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.writeFile(wb, fileName);
};

/**
 * Giderleri Excel'e aktar
 */
export const exportExpensesToExcel = (expenses: Expense[], fileName: string = 'giderler.xlsx') => {
  const data = expenses.map((e) => ({
    'Gider No': e.receiptNo || e.id,
    'Tarih': new Date(e.date).toLocaleDateString('tr-TR'),
    'Başlık': e.title,
    'Açıklama': e.description,
    'Tutar': `₺${e.amount.toLocaleString('tr-TR')}`,
    'Durum': e.status,
    'Kategori': e.category,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Giderler');

  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.writeFile(wb, fileName);
};

/**
 * Satışları Excel'e aktar
 */
export const exportSalesToExcel = (sales: Sale[], fileName: string = 'satislar.xlsx') => {
  const data = sales.map((s) => ({
    'Satış No': s.saleNo,
    'Tarih': new Date(s.saleDate).toLocaleDateString('tr-TR'),
    'Müşteri': s.customerName,
    'Ürün Sayısı': s.items.length,
    'Toplam': `₺${s.totalAmount.toLocaleString('tr-TR')}`,
    'KDV': `₺${s.tax.toLocaleString('tr-TR')}`,
    'Net': `₺${s.netAmount.toLocaleString('tr-TR')}`,
    'Durum': s.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Satışlar');

  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.writeFile(wb, fileName);
};

/**
 * Ödemeleri PDF'e aktar
 */
export const exportPaymentsToPDF = async (
  payments: Payment[],
  title: string = 'Odeme Raporu',
  fileName: string = 'odemeler.pdf'
) => {
  const doc = await createTurkishPdfDoc();

  // Başlık
  doc.setFontSize(16);
  doc.text(normalizeTrForPdf(title), 14, 15);

  // Tarih
  doc.setFontSize(10);
  doc.text(
    normalizeTrForPdf('Olusturma Tarihi: ') + formatDateWithZero(new Date()),
    14,
    25,
  );

  // Tablo
  const columns = [
    normalizeTrForPdf('Odeme No'), 
    'Tarih', 
    normalizeTrForPdf('Ogrenci'), 
    'Kategori', 
    'Tutar', 
    normalizeTrForPdf('Yontem'), 
    'Durum'
  ];
  const rows = payments.map((p) => [
    p.paymentNo,
    formatDateWithZero(new Date(p.paymentDate)),
    normalizeTrForPdf(p.studentName || '-'),
    normalizeTrForPdf(p.paymentType),
    formatCurrency(p.amount),
    normalizeTrForPdf(translatePaymentMethod(p.paymentMethod)),
    normalizeTrForPdf(p.status),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
  });

  doc.save(fileName);
};

/**
 * Giderleri PDF'e aktar
 */
export const exportExpensesToPDF = async (
  expenses: Expense[],
  title: string = 'Gider Raporu',
  fileName: string = 'giderler.pdf'
) => {
  const doc = await createTurkishPdfDoc();

  doc.setFontSize(16);
  doc.text(normalizeTrForPdf(title), 14, 15);

  doc.setFontSize(10);
  doc.text(
    normalizeTrForPdf('Olusturma Tarihi: ') + formatDateWithZero(new Date()),
    14,
    25,
  );

  const columns = [
    'Gider No', 
    'Tarih', 
    normalizeTrForPdf('Baslik'), 
    normalizeTrForPdf('Aciklama'), 
    'Tutar', 
    'Durum', 
    'Kategori'
  ];
  const rows = expenses.map((e) => [
    e.receiptNo || e.id,
    formatDateWithZero(new Date(e.date)),
    normalizeTrForPdf(e.title),
    normalizeTrForPdf(e.description.substring(0, 20)),
    formatCurrency(e.amount),
    normalizeTrForPdf(e.status),
    normalizeTrForPdf(e.category),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
  });

  doc.save(fileName);
};

/**
 * Satış Raporu PDF'e aktar
 */
export const exportSalesToPDF = async (
  sales: Sale[],
  title: string = 'Satis Raporu',
  fileName: string = 'satislar.pdf'
) => {
  const doc = await createTurkishPdfDoc();

  doc.setFontSize(16);
  doc.text(normalizeTrForPdf(title), 14, 15);

  doc.setFontSize(10);
  doc.text(
    normalizeTrForPdf('Olusturma Tarihi: ') + formatDateWithZero(new Date()),
    14,
    25,
  );

  const columns = [
    normalizeTrForPdf('Satis No'), 
    'Tarih', 
    normalizeTrForPdf('Musteri'), 
    normalizeTrForPdf('Urun'), 
    'Toplam', 
    'KDV', 
    'Net', 
    'Durum'
  ];
  const rows = sales.map((s) => [
    s.saleNo,
    formatDateWithZero(new Date(s.saleDate)),
    normalizeTrForPdf(s.customerName),
    s.items.length.toString(),
    formatCurrency(s.totalAmount),
    formatCurrency(s.tax),
    formatCurrency(s.netAmount),
    normalizeTrForPdf(s.status),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
  });

  doc.save(fileName);
};

/**
 * Özet Rapor (Dashboard Raporu)
 */
export const exportDashboardSummaryPDF = async (
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    outstandingAmount: number;
    paymentCount: number;
    expenseCount: number;
    saleCount: number;
  },
  fileName: string = 'dashboard-ozeti.pdf'
) => {
  const doc = await createTurkishPdfDoc();

  doc.setFontSize(18);
  doc.text(normalizeTrForPdf('Finansal Ozet Raporu'), 14, 15);

  doc.setFontSize(10);
  doc.text(
    normalizeTrForPdf('Olusturma Tarihi: ') + formatDateWithZero(new Date()),
    14,
    25,
  );

  // Özet Bilgiler
  const sections = [
    {
      title: 'Gelir',
      value: formatCurrency(summary.totalIncome),
    },
    {
      title: 'Gider',
      value: formatCurrency(summary.totalExpenses),
    },
    {
      title: 'Net Kar',
      value: formatCurrency(summary.netProfit),
    },
    {
      title: normalizeTrForPdf('Odenmemis Tutar'),
      value: formatCurrency(summary.outstandingAmount),
    },
    {
      title: normalizeTrForPdf('Toplam Islem'),
      value: `${
        summary.paymentCount + summary.expenseCount + summary.saleCount
      }`,
    },
  ];

  let yPosition = 40;
  doc.setFontSize(12);
  sections.forEach((section) => {
    doc.text(normalizeTrForPdf(`${section.title}:`), 20, yPosition);
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(14);
    doc.text(section.value, 120, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    yPosition += 15;
  });

  doc.save(fileName);
};

type InstallmentPlanMeta = {
  studentName: string;
  className?: string | null;
  parentName?: string | null;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
};

/**
 * Öğrenci taksit planını Excel'e aktar
 */
export const exportInstallmentPlanToExcel = (
  installments: FinanceInstallment[],
  meta: InstallmentPlanMeta,
  fileName: string = 'odeme-plani.xlsx',
) => {
  const totalPlanned = installments.reduce(
    (sum, it) => sum + Number(it.amount || 0),
    0,
  );
  const totalPaid = installments.reduce(
    (sum, it) => sum + Number(it.paid_amount || 0),
    0,
  );
  const totalRemaining = Math.max(0, totalPlanned - totalPaid);

  const studentName = meta.studentName;

  // Eski ödenmiş taksitler (Eski Plan)
  const oldPaid = installments
    .filter((it) => it.is_paid)
    .sort((a, b) => {
      const aDateStr = a.paid_at || a.due_date;
      const bDateStr = b.paid_at || b.due_date;
      if (!aDateStr || !bDateStr) return 0;
      return new Date(aDateStr).getTime() - new Date(bDateStr).getTime();
    });

  // Yeni taksit planı (Yapılandırma sonrası / bekleyen)
  const newPlan = installments
    .filter((it) => !it.is_paid)
    .sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const oldSheetData = oldPaid.map((it, idx) => ({
    Taksit: `E${idx + 1}`,
    Vade: it.due_date ? new Date(it.due_date).toLocaleDateString('tr-TR') : '',
    'Ödeme Tarihi': it.paid_at ? new Date(it.paid_at).toLocaleDateString('tr-TR') : '',
    Tutar: `₺${Number(it.amount || 0).toLocaleString('tr-TR')}`,
    Durum: 'Ödendi',
  }));

  const newSheetData = newPlan.map((it, idx) => {
    const amount = Number(it.amount || 0);
    const paid = Number(it.paid_amount || 0);
    const remaining = Math.max(0, amount - paid);
    let status = 'Bekliyor';
    if (it.is_paid || remaining <= 0.01) status = 'Ödendi';
    else if (paid > 0) status = 'Kısmi Ödeme';

    return {
      Taksit: `Y${idx + 1}`,
      'Vade Tarihi': it.due_date ? new Date(it.due_date).toLocaleDateString('tr-TR') : '',
      'Ödeme Tarihi': it.paid_at ? new Date(it.paid_at).toLocaleDateString('tr-TR') : '-', // ✅ ÖDEME TARİHİ
      Planlanan: `₺${amount.toLocaleString('tr-TR')}`,
      Ödenen: paid > 0 ? `₺${paid.toLocaleString('tr-TR')}` : '-',
      Kalan: `₺${remaining.toLocaleString('tr-TR')}`,
      Durum: status,
    };
  });

  const wb = XLSX.utils.book_new();

  // Özet sayfası (kayıt formu tarzı üst bilgi)
  const infoSheet = XLSX.utils.aoa_to_sheet([
    ['Öğrenci Adı Soyadı', studentName],
    ['Sınıf / Şube', meta.className || '-'],
    ['Veli Adı Soyadı', meta.parentName || '-'],
    [
      'Toplam Planlanan Tutar',
      `₺${(meta.totalAmount ?? totalPlanned).toLocaleString('tr-TR')}`,
    ],
    [
      'Toplam Ödenen',
      `₺${(meta.paidAmount ?? totalPaid).toLocaleString('tr-TR')}`,
    ],
    [
      'Kalan Borç',
      `₺${(meta.remainingAmount ?? totalRemaining).toLocaleString('tr-TR')}`,
    ],
    ['Plan Oluşturma Tarihi', new Date().toLocaleDateString('tr-TR')],
  ]);
  infoSheet['!cols'] = [
    { wch: 24 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Özet');

  if (oldSheetData.length > 0) {
    const wsOld = XLSX.utils.json_to_sheet(oldSheetData);
    wsOld['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsOld, 'Eski Plan');
  }

  const wsNew = XLSX.utils.json_to_sheet(newSheetData);
  wsNew['!cols'] = [
    { wch: 6 },  // Taksit
    { wch: 14 }, // Vade Tarihi
    { wch: 14 }, // Ödeme Tarihi
    { wch: 14 }, // Planlanan
    { wch: 14 }, // Ödenen
    { wch: 14 }, // Kalan
    { wch: 12 }, // Durum
  ];
  XLSX.utils.book_append_sheet(wb, wsNew, 'Yeni Plan');

  const safeName = studentName.replace(/\s+/g, '-');
  XLSX.writeFile(wb, fileName.replace('.xlsx', `-${safeName}.xlsx`));
};

// ============================
// CARI HESAP (LEDGER) EXPORT
// ============================

type LedgerExportRow = {
  date: string;
  label: string;
  description?: string;
  debit: number;
  credit: number;
  balance?: number;
};

type LedgerMeta = {
  studentName: string;
  total: number;
  paid: number;
  remaining: number;
};

export const exportLedgerToExcel = (
  rows: LedgerExportRow[],
  meta: LedgerMeta,
  fileName: string = 'cari-hesap.xlsx',
) => {
  const sheetRows = rows.map((r) => ({
    Tarih: new Date(r.date).toLocaleDateString('tr-TR'),
    Tür: r.label,
    Açıklama: r.description || '',
    Borç: r.debit > 0 ? `₺${r.debit.toLocaleString('tr-TR')}` : '-',
    Alacak: r.credit > 0 ? `₺${r.credit.toLocaleString('tr-TR')}` : '-',
    Bakiye:
      typeof r.balance === 'number'
        ? `₺${r.balance.toLocaleString('tr-TR')}`
        : '-',
  }));

  const infoSheet = XLSX.utils.aoa_to_sheet([
    ['Öğrenci Adı Soyadı', meta.studentName],
    ['Toplam Borç', `₺${meta.total.toLocaleString('tr-TR')}`],
    ['Toplam Ödenen', `₺${meta.paid.toLocaleString('tr-TR')}`],
    ['Kalan', `₺${meta.remaining.toLocaleString('tr-TR')}`],
    ['Rapor Tarihi', new Date().toLocaleDateString('tr-TR')],
  ]);
  infoSheet['!cols'] = [
    { wch: 24 },
    { wch: 32 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Özet');

  const ws = XLSX.utils.json_to_sheet(sheetRows);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Hareketler');

  const safeName = meta.studentName.replace(/\s+/g, '-');
  XLSX.writeFile(wb, fileName.replace('.xlsx', `-${safeName}.xlsx`));
};

export const exportLedgerToPDF = async (
  rows: LedgerExportRow[],
  meta: LedgerMeta,
  fileName: string = 'cari-hesap.pdf',
) => {
  const doc = await createTurkishPdfDoc('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.text(normalizeTrForPdf('Cari Hesap - ') + normalizeTrForPdf(meta.studentName), 14, 16);

  doc.setFontSize(9);
  doc.text(
    normalizeTrForPdf('Olusturma Tarihi: ') + formatDateWithZero(new Date()),
    pageWidth - 14,
    16,
    { align: 'right' },
  );

  doc.setFontSize(9);
  doc.text(
    normalizeTrForPdf('Toplam Borc: ') + formatCurrency(meta.total) + 
    '   ' + normalizeTrForPdf('Odenen: ') + formatCurrency(meta.paid) + 
    '   ' + normalizeTrForPdf('Kalan: ') + formatCurrency(meta.remaining),
    14,
    25,
  );

  const columns = [
    'Tarih', 
    normalizeTrForPdf('Tur'), 
    normalizeTrForPdf('Aciklama'), 
    normalizeTrForPdf('Borc'), 
    'Alacak', 
    'Bakiye'
  ];
  const body = rows.map((r) => [
    formatDateWithZero(new Date(r.date)),
    normalizeTrForPdf(r.label),
    normalizeTrForPdf(r.description || ''),
    r.debit > 0 ? formatCurrency(r.debit) : '-',
    r.credit > 0 ? formatCurrency(r.credit) : '-',
    typeof r.balance === 'number' ? formatCurrency(r.balance) : '-',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [columns.map((c) => normalizeTrForPdf(c))],
    body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
  });

  doc.save(fileName);
};

/**
 * Öğrenci taksit planını PDF'e aktar
 */
export const exportInstallmentPlanToPDF = async (
  installments: FinanceInstallment[],
  meta: InstallmentPlanMeta,
  fileName: string = 'odeme-plani.pdf',
) => {
  // A4, dikey, tek renk (siyah / gri) belge
  const doc = await createTurkishPdfDoc('portrait');

  const totalPlanned = installments.reduce(
    (sum, it) => sum + Number(it.amount || 0),
    0,
  );
  const totalPaid = installments.reduce(
    (sum, it) => sum + Number(it.paid_amount || 0),
    0,
  );
  const totalRemaining = Math.max(0, totalPlanned - totalPaid);

  const studentName = normalizeTrForPdf(meta.studentName);
  const createdAt = new Date();
  const createdDate = formatDateWithZero(createdAt);
  const createdTime = createdAt.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Başlık
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(
    normalizeTrForPdf('Odeme Plani') + ' - ' + studentName,
    14,
    16,
  );

  // Oluşturma tarihi
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    normalizeTrForPdf('Olusturma Tarihi: ') + createdDate,
    pageWidth - 14,
    16,
    { align: 'right' },
  );

  // Öğrenci / veli / finans özeti bloğu
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  doc.text(
    normalizeTrForPdf('Ogrenci Adi Soyadi: ') + studentName,
    14,
    25,
  );
  doc.text(
    normalizeTrForPdf('Sinif / Sube: ') + normalizeTrForPdf(meta.className || '-'),
    14,
    31,
  );
  doc.text(
    normalizeTrForPdf('Ogrenci ID: -'),
    14,
    37,
  );

  doc.text(
    normalizeTrForPdf('Veli Adi Soyadi: ') + normalizeTrForPdf(meta.parentName || '-'),
    pageWidth / 2,
    25,
  );
  doc.text(
    normalizeTrForPdf('Veli Telefon: -'),
    pageWidth / 2,
    31,
  );

  doc.text(
    normalizeTrForPdf('Toplam Planlanan Tutar: ') + formatCurrency(meta.totalAmount ?? totalPlanned),
    pageWidth / 2,
    37,
  );
  doc.text(
    normalizeTrForPdf('Toplam Odenen: ') + formatCurrency(meta.paidAmount ?? totalPaid),
    pageWidth / 2,
    43,
  );
  doc.text(
    normalizeTrForPdf('Kalan Borc: ') + formatCurrency(meta.remainingAmount ?? totalRemaining),
    pageWidth / 2,
    49,
  );

  // Açıklama metni
  const infoText = normalizeTrForPdf(
    'Bu odeme plani, ' + createdDate + ' tarihinde otomatik olarak olusturulmustur. ' +
      'Taksitler belirlenen vadelerde odenmek uzere duzenlenmistir. ' +
      `Ödemesi yapılmış taksitler yeniden yapılandırmadan etkilenmez.`,
  );
  const wrappedInfo = doc.splitTextToSize(infoText, pageWidth - 28);
  doc.setTextColor(60, 60, 60);
  doc.text(wrappedInfo, 14, 58);

  // Tablonun başlayacağı Y konumu
  let tableStartY = 58 + wrappedInfo.length * 4 + 4;
  if (tableStartY < 72) tableStartY = 72;

  // Eski (ödenmiş) ve yeni (bekleyen) taksitleri ayır ama tek tabloda göster
  const oldPaid = installments
    .filter((it) => it.is_paid)
    .sort((a, b) => {
      const aDateStr = a.paid_at || a.due_date;
      const bDateStr = b.paid_at || b.due_date;
      if (!aDateStr || !bDateStr) return 0;
      return new Date(aDateStr).getTime() - new Date(bDateStr).getTime();
    });

  const newPlan = installments
    .filter((it) => !it.is_paid)
    .sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const today = new Date();

  // Opsiyonel kolonlar için bayraklar
  const hasPaymentMethod = installments.some((it) => !!it.payment_method);
  const hasCollector = installments.some((it) => !!it.collected_by);

  const computeDelayDays = (it: FinanceInstallment): number | null => {
    if (!it.due_date) return null;
    const due = new Date(it.due_date);
    const refDate = it.paid_at ? new Date(it.paid_at) : today;
    const diffMs = refDate.getTime() - due.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };
  const hasDelay = installments.some((it) => {
    const d = computeDelayDays(it);
    return d !== null && d > 0;
  });

  // Tablo kolonları - Türkçe karakter normalize edilmiş
  const columns: string[] = [
    normalizeTrForPdf('Taksit Kodu'),
    normalizeTrForPdf('Vade Tarihi'),
    normalizeTrForPdf('Odeme Tarihi'), // ✅ ÖDEME TARİHİ EKLENDİ
    normalizeTrForPdf('Planlanan Tutar'),
    normalizeTrForPdf('Odenen Tutar'),
    normalizeTrForPdf('Kalan Tutar'),
    normalizeTrForPdf('Durum'),
  ];
  const delayIndex = columns.length;
  if (hasDelay) columns.push(normalizeTrForPdf('Gecikme Gunu'));
  const payMethodIndex = columns.length;
  if (hasPaymentMethod) columns.push(normalizeTrForPdf('Odeme Yontemi'));
  const collectorIndex = columns.length;
  if (hasCollector) columns.push(normalizeTrForPdf('Tahsil Eden'));

  // Satırlar
  const rows: (string | number)[][] = [];
  let oldCounter = 1;
  let newCounter = 1;

  const pushRow = (it: FinanceInstallment, isOld: boolean) => {
    const amount = Number(it.amount || 0);
    const paid = Number(it.paid_amount || 0);
    const isPaid = isOld || it.is_paid || amount - paid <= 0.01;
    const remaining = Math.max(0, amount - paid);

    let status = 'Bekliyor';
    if (isPaid) status = 'Odendi';
    else if (paid > 0) status = 'Kismi Odeme';

    const code = isOld ? `E${oldCounter}` : `Y${newCounter}`;
    if (isOld) oldCounter += 1;
    else newCounter += 1;

    const row: (string | number)[] = [
      code,
      it.due_date ? formatDateWithZero(new Date(it.due_date)) : '',
      it.paid_at ? formatDateWithZero(new Date(it.paid_at)) : '-', // ✅ ÖDEME TARİHİ
      formatCurrency(amount),
      paid > 0 ? formatCurrency(paid) : '-',
      formatCurrency(remaining),
      normalizeTrForPdf(status),
    ];

    if (hasDelay) {
      const d = computeDelayDays(it);
      row[delayIndex] = d ?? '';
    }
    if (hasPaymentMethod) {
      row[payMethodIndex] = normalizeTrForPdf(translatePaymentMethod(it.payment_method || ''));
    }
    if (hasCollector) {
      row[collectorIndex] = normalizeTrForPdf((it.collected_by as string) || '');
    }

    rows.push(row);
  };

  oldPaid.forEach((it) => pushRow(it, true));
  newPlan.forEach((it) => pushRow(it, false));

  // Otomatik tablo (ince gri çizgiler, tek renk)
  autoTable(doc, {
    startY: tableStartY,
    head: [columns.map((c) => normalizeTrForPdf(c))],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [170, 170, 170],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 0,
      fontStyle: 'bold',
      lineColor: [150, 150, 150],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'left' }, // Taksit Kodu
      1: { halign: 'center' }, // Vade Tarihi
      2: { halign: 'center' }, // Ödeme Tarihi
      3: { halign: 'right' }, // Planlanan
      4: { halign: 'right' }, // Ödenen
      5: { halign: 'right' }, // Kalan
      6: { halign: 'left' }, // Durum
      ...(hasDelay ? { [delayIndex]: { halign: 'right' as const } } : {}),
      ...(hasPaymentMethod ? { [payMethodIndex]: { halign: 'left' as const } } : {}),
      ...(hasCollector ? { [collectorIndex]: { halign: 'left' as const } } : {}),
    },
    didDrawPage(data) {
      // Üstteki başlık / açıklama zaten çizildi; burada ek bir şey yapmıyoruz.
      // Footer ve sayfa numarası aşağıda ayrıca eklenecek.
      // data kullanılmazsa lint uyarısı gelmesin
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = data;
    },
  });

  // Footer + sayfa numarası
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    const footerText = normalizeTrForPdf(
      'Dokuman AkademiHub tarafindan otomatik olusturulmustur. Saat: ' + createdTime,
    );
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

    const pageText = 'Sayfa ' + i + ' / ' + pageCount;
    doc.text(pageText, pageWidth - 14, pageHeight - 4, { align: 'right' });
  }

  const safeName = normalizeTrForPdf(studentName).replace(/\s+/g, '-');
  doc.save(fileName.replace('.pdf', `-${safeName}.pdf`));
};
