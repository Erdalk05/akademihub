'use client';

import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';

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
  };
}

export default function ReceiptModal({ isOpen, onClose, payment }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    // iframe kullanarak yazdırma - popup blocker'ı aşar
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
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: white; color: black; }
          .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 24px; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 16px; margin-bottom: 16px; }
          .header h1 { font-size: 24px; color: #1e40af; }
          .header p { font-size: 12px; color: #666; margin-top: 4px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #666; font-size: 13px; }
          .info-value { font-weight: 600; font-size: 14px; }
          .amount-section { background: #e8f5e9; padding: 16px; margin: 16px 0; border-radius: 8px; text-align: center; border: 1px solid #4caf50; }
          .amount { font-size: 32px; font-weight: 700; color: #059669; }
          .footer { text-align: center; font-size: 11px; color: #666; margin-top: 16px; padding-top: 16px; border-top: 2px dashed #333; }
          @media print { 
            @page { size: 80mm auto; margin: 5mm; }
            body { padding: 0; } 
            .receipt { border: none; max-width: 100%; } 
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 100);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();

    // Yazdırma tamamlandığında iframe'i temizle
    iframe.contentWindow?.addEventListener('afterprint', () => {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 100);
    });

    // Fallback: 5 saniye sonra temizle
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
      eft: 'EFT',
      credit_card: 'Kredi Kartı',
      check: 'Çek',
    };
    return labels[method] || method;
  };

  const receiptNo = `MKB-${new Date().getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;
  const formattedDate = payment.paymentDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Makbuz Önizleme</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div ref={printRef} className="border-2 border-gray-300 rounded-lg p-6 bg-white">
            {/* Receipt Header */}
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-indigo-700">AkademiHub</h1>
              <p className="text-xs text-gray-500 mt-1">Eğitim Yönetim Sistemi</p>
              <p className="text-sm font-medium text-gray-700 mt-2">TAHSİLAT MAKBUZU</p>
            </div>

            {/* Receipt Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Makbuz No</span>
                <span className="font-semibold text-sm">{receiptNo}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Tarih</span>
                <span className="font-semibold text-sm">{formattedDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Öğrenci</span>
                <span className="font-semibold text-sm">{payment.studentName}</span>
              </div>
              {payment.studentCode && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Öğrenci No</span>
                  <span className="font-semibold text-sm">{payment.studentCode}</span>
                </div>
              )}
              {payment.installmentNo && payment.installmentNo > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Taksit No</span>
                  <span className="font-semibold text-sm">{payment.installmentNo}. Taksit</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Ödeme Yöntemi</span>
                <span className="font-semibold text-sm">{getPaymentMethodLabel(payment.paymentMethod)}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-emerald-50 rounded-lg p-4 text-center mb-4">
              <p className="text-xs text-emerald-600 font-medium mb-1">TAHSİL EDİLEN TUTAR</p>
              <p className="text-3xl font-bold text-emerald-700">
                {payment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </p>
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-dashed border-gray-300 pt-4">
              <p className="text-xs text-gray-400">
                Bu belge AkademiHub Eğitim Yönetim Sistemi tarafından oluşturulmuştur.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date().toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium"
          >
            <Printer size={18} />
            Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}


