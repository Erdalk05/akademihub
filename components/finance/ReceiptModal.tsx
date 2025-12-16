'use client';

import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    studentName: string;
    studentCode?: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    installmentNo?: number;
    parentName?: string;
  };
}

export default function ReceiptModal({ isOpen, onClose, payment }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { currentOrganization } = useOrganizationStore();
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tahsilat Makbuzu - ${payment.studentName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            background: white; 
            color: #1a1a1a;
            font-size: 14px;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
          }
          .receipt-header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #666;
            margin-bottom: 30px;
          }
          .receipt-brand {
            text-align: center;
            margin-bottom: 10px;
          }
          .receipt-brand h1 {
            font-size: 28px;
            color: #059669;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .receipt-title {
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            letter-spacing: 2px;
            margin-bottom: 8px;
          }
          .receipt-doc-no {
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 25px;
          }
          .receipt-divider {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
          }
          .receipt-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .receipt-info-item {
            padding: 0;
          }
          .receipt-info-label {
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .receipt-info-value {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
          }
          .receipt-amount-box {
            border: 2px solid #059669;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .receipt-amount-label {
            font-size: 12px;
            color: #059669;
            font-weight: 500;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .receipt-amount-value {
            font-size: 32px;
            font-weight: 700;
            color: #059669;
          }
          .receipt-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin: 40px 0 30px 0;
          }
          .receipt-signature-item {
            text-align: center;
          }
          .receipt-signature-label {
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .receipt-signature-name {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 25px;
          }
          .receipt-signature-line {
            border-bottom: 1px solid #d1d5db;
            width: 80%;
            margin: 0 auto;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .receipt-footer p {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.6;
          }
          .receipt-footer .system-name {
            font-weight: 600;
            color: #059669;
          }
          @media print { 
            @page { size: A5; margin: 15mm; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 100);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.addEventListener('afterprint', () => {
      setTimeout(() => { document.body.removeChild(iframe); }, 100);
    });

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Nakit',
      bank_transfer: 'Banka Havalesi',
      bank: 'Havale/EFT',
      eft: 'EFT',
      credit_card: 'Kredi Kartı',
      card: 'Kredi Kartı',
      check: 'Çek',
    };
    return labels[method] || method || 'Belirtilmedi';
  };

  const docNo = `#${payment.id.slice(0, 8).toUpperCase()}`;
  const currentDateTime = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const formattedDate = payment.paymentDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const installmentLabel = payment.installmentNo !== undefined ? `#${payment.installmentNo}` : '-';
  const parentName = payment.parentName || 'Sayın Veli';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Makbuz Önizleme</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 bg-gray-50">
          <div ref={printRef} className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            
            {/* Top Header - Date & Document Title */}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-6">
              <span>{currentDateTime}</span>
              <span>Tahsilat Makbuzu - {payment.studentName}</span>
            </div>

            {/* Brand */}
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-emerald-600 tracking-tight">{organizationName}</h1>
            </div>

            {/* Title */}
            <div className="text-center mb-2">
              <p className="text-base font-semibold text-gray-700 tracking-widest">TAHSİLAT MAKBUZU</p>
            </div>

            {/* Document Number */}
            <div className="text-center text-sm text-gray-500 mb-6">
              Belge No: {docNo}
            </div>

            {/* Divider */}
            <hr className="border-gray-200 mb-6" />

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Öğrenci Adı Soyadı</p>
                <p className="text-[15px] font-semibold text-gray-800">{payment.studentName}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Tarih</p>
                <p className="text-[15px] font-semibold text-gray-800">{formattedDate}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Ödeme Yapan</p>
                <p className="text-[15px] font-semibold text-gray-800">{parentName}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Ödeme Yöntemi</p>
                <p className="text-[15px] font-semibold text-gray-800">{getPaymentMethodLabel(payment.paymentMethod)}</p>
              </div>
              <div>
                {payment.studentCode && (
                  <>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Öğrenci No</p>
                    <p className="text-[15px] font-semibold text-gray-800">{payment.studentCode}</p>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Taksit No</p>
                <p className="text-[15px] font-semibold text-gray-800">{installmentLabel}</p>
              </div>
            </div>

            {/* Amount Box */}
            <div className="border-2 border-emerald-500 rounded-lg p-6 text-center my-8">
              <p className="text-xs text-emerald-600 font-medium tracking-widest mb-2">Tahsil Edilen Tutar</p>
              <p className="text-3xl font-bold text-emerald-600">
                ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-16 my-10">
              <div className="text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Teslim Alan</p>
                <p className="text-sm font-semibold text-gray-700 mb-8">Muhasebe Birimi</p>
                <div className="border-b border-gray-300 w-4/5 mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Teslim Eden</p>
                <p className="text-sm font-semibold text-gray-700 mb-8">{payment.studentName} / Veli</p>
                <div className="border-b border-gray-300 w-4/5 mx-auto"></div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-10 pt-6 border-t border-gray-200">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Bu belge elektronik ortamda üretilmiştir. Geçerli bir tahsilat belgesi yerine geçer.
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                <span className="font-semibold text-emerald-600">{organizationName}</span> Eğitim Kurumları Yönetim Sistemi
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium"
          >
            <Printer size={18} />
            Yazdır / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
