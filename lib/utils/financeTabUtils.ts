/**
 * financeTabUtils.ts
 * StudentFinanceTab için paylaşılan yardımcı fonksiyonlar ve sabitler
 */

import { Book, Shirt, UtensilsCrossed, Pencil, Package } from 'lucide-react';

// ========================
// TYPES
// ========================

export interface Installment {
  id: string;
  installment_no: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_at?: string;
  payment_method?: string;
  note?: string | null;
}

export interface OtherIncome {
  id: string;
  title: string;
  category: string;
  amount: number;
  paidAmount: number;
  isPaid: boolean;
  dueDate: string | null;
  paidAt: string | null;
  date: string;
  payment_type: string;
  paymentMethod?: string;
  notes?: string;
}

export interface ReceiptParams {
  studentName: string;
  studentNo: string;
  className: string;
  parentName: string;
  installmentNo: number;
  amount: number;
  paidAmount: number;
  paymentMethod: string;
  paymentDate: string;
  remainingTotal: number;
  organizationName: string;
}

// ========================
// CONSTANTS
// ========================

export const CATEGORY_INFO: Record<string, { label: string; icon: any; color: string }> = {
  book: { label: 'Kitap', icon: Book, color: 'bg-blue-500' },
  uniform: { label: 'Üniforma', icon: Shirt, color: 'bg-purple-500' },
  meal: { label: 'Yemek', icon: UtensilsCrossed, color: 'bg-orange-500' },
  stationery: { label: 'Kırtasiye', icon: Pencil, color: 'bg-green-500' },
  other: { label: 'Diğer', icon: Package, color: 'bg-gray-500' },
};

export const PAYMENT_METHODS = {
  cash: { label: 'Nakit', color: 'bg-green-100 text-green-800' },
  card: { label: 'Kart', color: 'bg-blue-100 text-blue-800' },
  bank: { label: 'Havale/EFT', color: 'bg-purple-100 text-purple-800' },
  manual: { label: 'Serbest Giriş', color: 'bg-gray-100 text-gray-800' },
};

export const PDF_LABELS = {
  receipt: 'TAHSILAT MAKBUZU',
  studentInfo: 'Ogrenci Bilgileri',
  studentName: 'Ogrenci Adi',
  studentNo: 'Ogrenci No',
  class: 'Sinif',
  parentName: 'Veli Adi',
  paymentInfo: 'Odeme Bilgileri',
  installmentNo: 'Taksit No',
  amount: 'Taksit Tutari',
  paidAmount: 'Odenen Tutar',
  paymentMethod: 'Odeme Yontemi',
  paymentDate: 'Odeme Tarihi',
  remainingTotal: 'Kalan Borc',
  signature: 'Imza',
  thankYou: 'Odemeniz icin tesekkur ederiz.',
  paymentMethods: {
    cash: 'Nakit',
    card: 'Kredi Karti',
    bank: 'Havale/EFT',
    manual: 'Serbest Giris'
  }
};

// ========================
// TURKISH CHARACTER HELPERS
// ========================

const turkishCharMap: Record<string, string> = {
  'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I',
  'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
  'İ': 'I', '₺': 'TL'
};

export const turkishToAscii = (text: string): string => {
  if (!text) return '';
  return text.split('').map(char => turkishCharMap[char] || char).join('');
};

// ========================
// FORMATTING HELPERS
// ========================

export const formatCurrency = (amount: number): string => {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  } catch {
    return dateStr;
  }
};

export const getPaymentMethodLabel = (method: string): string => {
  return PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS]?.label || method;
};

export const getPaymentMethodColor = (method: string): string => {
  return PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS]?.color || 'bg-gray-100 text-gray-800';
};

// ========================
// STATUS HELPERS
// ========================

export const getInstallmentStatusColor = (status: string): string => {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-amber-100 text-amber-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getInstallmentStatusLabel = (status: string): string => {
  switch (status) {
    case 'paid': return 'Ödendi';
    case 'overdue': return 'Gecikmiş';
    case 'pending': return 'Bekliyor';
    default: return status;
  }
};

// ========================
// PDF GENERATION
// ========================

export const generateA4ReceiptHTML = (params: ReceiptParams): string => {
  const {
    studentName,
    studentNo,
    className,
    parentName,
    installmentNo,
    amount,
    paidAmount,
    paymentMethod,
    paymentDate,
    remainingTotal,
    organizationName
  } = params;

  const paymentMethodLabel = PDF_LABELS.paymentMethods[paymentMethod as keyof typeof PDF_LABELS.paymentMethods] || paymentMethod;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${PDF_LABELS.receipt}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }
        .header p {
          margin: 5px 0 0;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-weight: bold;
          font-size: 14px;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dotted #eee;
        }
        .row:last-child {
          border-bottom: none;
        }
        .label {
          color: #666;
          font-size: 13px;
        }
        .value {
          font-weight: 600;
          font-size: 13px;
          color: #333;
        }
        .amount {
          font-size: 18px;
          color: #059669;
        }
        .remaining {
          color: #dc2626;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .signature {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 200px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 10px;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${turkishToAscii(organizationName)}</h1>
        <p>${turkishToAscii(PDF_LABELS.receipt)}</p>
      </div>
      
      <div class="section">
        <div class="section-title">${turkishToAscii(PDF_LABELS.studentInfo)}</div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.studentName)}:</span>
          <span class="value">${turkishToAscii(studentName)}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.studentNo)}:</span>
          <span class="value">${studentNo}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.class)}:</span>
          <span class="value">${turkishToAscii(className)}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.parentName)}:</span>
          <span class="value">${turkishToAscii(parentName)}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">${turkishToAscii(PDF_LABELS.paymentInfo)}</div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.installmentNo)}:</span>
          <span class="value">${installmentNo}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.amount)}:</span>
          <span class="value">${formatCurrency(amount)}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.paidAmount)}:</span>
          <span class="value amount">${formatCurrency(paidAmount)}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.paymentMethod)}:</span>
          <span class="value">${turkishToAscii(paymentMethodLabel)}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.paymentDate)}:</span>
          <span class="value">${formatDate(paymentDate)}</span>
        </div>
        <div class="row">
          <span class="label">${turkishToAscii(PDF_LABELS.remainingTotal)}:</span>
          <span class="value remaining">${formatCurrency(remainingTotal)}</span>
        </div>
      </div>
      
      <div class="signature">
        <div class="signature-box">
          <div class="signature-line">${turkishToAscii(PDF_LABELS.signature)}</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Tarih: ${formatDate(paymentDate)}</div>
        </div>
      </div>
      
      <div class="footer">
        <p>${turkishToAscii(PDF_LABELS.thankYou)}</p>
      </div>
    </body>
    </html>
  `;
};

// ========================
// WHATSAPP HELPERS
// ========================

export const generateWhatsAppPaymentMessage = (
  studentName: string,
  installmentNo: number,
  paidAmount: number,
  remainingTotal: number
): string => {
  return encodeURIComponent(
    `Sayın Veli,\n\n` +
    `${studentName} adlı öğrencinizin ${installmentNo}. taksit ödemesi alınmıştır.\n\n` +
    `Ödenen Tutar: ${formatCurrency(paidAmount)}\n` +
    `Kalan Borç: ${formatCurrency(remainingTotal)}\n\n` +
    `İlginiz için teşekkür ederiz.`
  );
};

export const generateWhatsAppPlanMessage = (
  studentName: string,
  installments: Installment[],
  paidInstallments: Installment[]
): string => {
  let message = `📋 *${studentName}* - Ödeme Planı\n\n`;
  
  // Ödenen taksitler
  if (paidInstallments.length > 0) {
    message += `✅ *Ödenen Taksitler:*\n`;
    paidInstallments.forEach(inst => {
      message += `  ${inst.installment_no}. Taksit: ${formatCurrency(inst.paid_amount)} (${formatDate(inst.paid_at || '')})\n`;
    });
    message += `\n`;
  }
  
  // Bekleyen taksitler
  const pendingInstallments = installments.filter(i => !i.paid_at && i.status !== 'paid');
  if (pendingInstallments.length > 0) {
    message += `⏳ *Bekleyen Taksitler:*\n`;
    pendingInstallments.forEach(inst => {
      const isOverdue = new Date(inst.due_date) < new Date();
      const status = isOverdue ? '🔴' : '🟡';
      message += `${status} ${inst.installment_no}. Taksit: ${formatCurrency(inst.amount)} (${formatDate(inst.due_date)})\n`;
    });
  }
  
  // Toplam
  const totalRemaining = pendingInstallments.reduce((sum, i) => sum + (i.amount - (i.paid_amount || 0)), 0);
  message += `\n💰 *Kalan Toplam:* ${formatCurrency(totalRemaining)}`;
  
  return encodeURIComponent(message);
};
