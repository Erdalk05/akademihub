'use client';

import { useEffect, useState, useTransition } from 'react';
import { X, CreditCard, Banknote, Building, Printer, MessageSquare, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { FinanceInstallment } from '@/lib/types/finance';

// Makbuz yazdırma fonksiyonu
function printReceiptDocument(payment: {
  id: string;
  studentName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  installmentNo?: number;
}) {
  const receiptNo = `MKB-${new Date().getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;
  const formattedDate = payment.paymentDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  
  const methodLabels: Record<string, string> = {
    cash: 'Nakit',
    card: 'Kredi Kartı',
    bank: 'Havale/EFT',
    bank_transfer: 'Banka Havalesi',
    eft: 'EFT',
    credit_card: 'Kredi Kartı',
    check: 'Çek',
  };

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
        .header h1 { font-size: 24px; color: #075E54; }
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
      <div class="receipt">
        <div class="header">
          <h1>AkademiHub</h1>
          <p>Eğitim Yönetim Sistemi</p>
          <p style="font-size: 14px; font-weight: 600; margin-top: 8px;">TAHSİLAT MAKBUZU</p>
        </div>
        <div>
          <div class="info-row">
            <span class="info-label">Makbuz No</span>
            <span class="info-value">${receiptNo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tarih</span>
            <span class="info-value">${formattedDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Öğrenci</span>
            <span class="info-value">${payment.studentName}</span>
          </div>
          ${payment.installmentNo ? `
          <div class="info-row">
            <span class="info-label">Taksit No</span>
            <span class="info-value">${payment.installmentNo}. Taksit</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Ödeme Yöntemi</span>
            <span class="info-value">${methodLabels[payment.paymentMethod] || payment.paymentMethod}</span>
          </div>
        </div>
        <div class="amount-section">
          <p style="font-size: 12px; color: #059669; font-weight: 500; margin-bottom: 4px;">TAHSİL EDİLEN TUTAR</p>
          <p class="amount">₺${payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div class="footer">
          <p>Bu belge AkademiHub Eğitim Yönetim Sistemi tarafından oluşturulmuştur.</p>
          <p style="margin-top: 4px;">${new Date().toLocaleString('tr-TR')}</p>
        </div>
      </div>
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
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  installment: FinanceInstallment | null;
  studentName: string;
  onSuccess: () => void;
}

export default function PaymentCollectionModal({ isOpen, onClose, installment, studentName, onSuccess }: Props) {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [note, setNote] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  
  // Calculate penalty/delay
  const [delayDays, setDelayDays] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  const [isSubmitting, startTransition] = useTransition();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (installment) {
      const totalAmt = Number(installment.amount) || 0;
      const paidAmt = Number(installment.paid_amount) || 0;
      // Kalan tutarı kuruş hassasiyeti ile hesapla
      const remaining = Math.round((totalAmt - paidAmt) * 100) / 100;
      setAmount(remaining.toString()); // Varsayılan: kalan borcun tamamı
      
      // Calculate delay
      if (installment.due_date) {
        const due = new Date(installment.due_date);
        const today = new Date();
        if (today > due && !installment.is_paid) {
          const diff = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          setDelayDays(diff);
          // Simple penalty logic: 0.1% per day (Example)
          setPenaltyAmount(Math.floor(remaining * 0.001 * diff));
        } else {
          setDelayDays(0);
          setPenaltyAmount(0);
        }
      }
    } else {
      setAmount('');
      setDelayDays(0);
      setPenaltyAmount(0);
    }
  }, [installment, isOpen]);

  const handlePayment = async () => {
    if (!installment) return;

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('error', 'Geçerli bir tutar giriniz.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/installments/pay', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installment_id: installment.id,
            payment_method: method,
            amount_paid: payAmount,
            payment_date: new Date().toISOString(),
            note: note + (penaltyAmount > 0 ? ` (Gecikme Cezası Dahil: ${penaltyAmount})` : ''),
            student_id: installment.student_id,
          }),
        });

        const data = await res.json();
        
        if (data.success) {
          showToast('success', 'Ödeme başarıyla alındı.');
          
          // Print Receipt
          if (printReceipt && data.data) {
            printReceiptDocument({
              id: data.data.payment_id || installment.id,
              studentName: studentName,
              amount: payAmount,
              paymentDate: new Date(),
              paymentMethod: method,
              installmentNo: installment.installment_no
            });
          }

          // Mock Action: Send SMS
          if (sendSms) {
            console.log('Sending SMS to parent...');
          }

          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        } else {
          showToast('error', data.error || 'Ödeme alınamadı.');
        }
      } catch (error) {
        showToast('error', 'Bağlantı hatası oluştu.');
      }
    });
  };

  if (!isOpen || !installment) return null;

  const totalDue = parseFloat(amount) || 0;
  const originalAmount = (Number(installment.amount) || 0) - (Number(installment.paid_amount) || 0);
  const isPartial = totalDue < originalAmount && totalDue > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <ToastContainer />
      
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-200 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gray-900 p-6 text-white">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
               <CreditCard size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Ödeme Tahsilatı</h2>
              <p className="text-sm text-gray-400">{studentName}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Card */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
             <div>
                <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Taksit No</p>
                <p className="text-lg font-bold text-gray-900">#{installment.installment_no}</p>
             </div>
             <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Vade Tarihi</p>
                <p className={`text-lg font-bold ${delayDays > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {installment.due_date ? new Date(installment.due_date).toLocaleDateString('tr-TR') : '-'}
                </p>
             </div>
          </div>

          {/* Delay Warning */}
          {delayDays > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
               <AlertCircle size={18} className="shrink-0 mt-0.5" />
               <div>
                  <span className="font-bold">{delayDays} gün gecikme mevcut.</span>
                  <p className="text-xs opacity-90 mt-0.5">
                    Sistem tarafından hesaplanan gecikme cezası: <strong>₺{penaltyAmount.toLocaleString('tr-TR')}</strong>
                  </p>
               </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tahsil Edilecek Tutar</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 text-lg font-bold text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            {isPartial && (
                <p className="mt-2 text-xs text-orange-600 flex items-center gap-1 font-medium">
                    <Calculator size={14} />
                    Kısmi ödeme yapılıyor. Kalan borç: ₺{(originalAmount - totalDue).toLocaleString('tr-TR')}
                </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  method === 'cash' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Banknote size={24} />
                <span className="text-xs font-medium">Nakit</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  method === 'card' 
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CreditCard size={24} />
                <span className="text-xs font-medium">Kredi Kartı</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  method === 'bank' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building size={24} />
                <span className="text-xs font-medium">Havale/EFT</span>
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama / Not</label>
             <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Varsa notunuzu buraya girin..."
             />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-2">
             <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${printReceipt ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                   {printReceipt && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={printReceipt} onChange={() => setPrintReceipt(!printReceipt)} />
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Printer size={14} /> Makbuz Yazdır
                </span>
             </label>

             <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sendSms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                   {sendSms && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={sendSms} onChange={() => setSendSms(!sendSms)} />
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <MessageSquare size={14} /> SMS Gönder
                </span>
             </label>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
           <button
             onClick={onClose}
             className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
           >
             İptal
           </button>
           <button
             onClick={handlePayment}
             disabled={isSubmitting}
             className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
                <>
                    <CheckCircle2 size={18} />
                    Ödemeyi Onayla
                </>
             )}
           </button>
        </div>

      </div>
    </div>
  );
}

