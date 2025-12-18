'use client';

import { useEffect, useState, useTransition } from 'react';
import { X, CreditCard, Banknote, Building, Printer, MessageCircle, Calculator, AlertCircle, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { FinanceInstallment } from '@/lib/types/finance';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// Makbuz yazdırma fonksiyonu - Profesyonel Format
function printReceiptDocument(payment: {
  id: string;
  studentName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  installmentNo?: number;
}, organizationName: string = 'Eğitim Kurumu') {
  const docNo = `#${payment.id.slice(0, 8).toUpperCase()}`;
  const currentDateTime = new Date().toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const formattedDate = payment.paymentDate.toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  
  const methodLabels: Record<string, string> = {
    cash: 'Nakit', card: 'Kredi Kartı', bank: 'Havale/EFT',
    bank_transfer: 'Banka Havalesi', eft: 'EFT', credit_card: 'Kredi Kartı', check: 'Çek',
  };
  const installmentLabel = payment.installmentNo ? `#${payment.installmentNo}` : '-';

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;left:-9999px';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tahsilat Makbuzu - ${payment.studentName}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;background:#fff;color:#1a1a1a;font-size:14px}
        .receipt{max-width:600px;margin:0 auto}
        .header-top{display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:30px}
        .brand{text-align:center;margin-bottom:10px}
        .brand h1{font-size:28px;color:#059669;font-weight:700}
        .title{text-align:center;font-size:16px;font-weight:600;color:#374151;letter-spacing:2px;margin-bottom:8px}
        .doc-no{text-align:center;font-size:13px;color:#6b7280;margin-bottom:25px}
        hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}
        .info-label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
        .info-value{font-size:15px;font-weight:600;color:#1f2937}
        .amount-box{border:2px solid #059669;border-radius:8px;padding:25px;text-align:center;margin:30px 0}
        .amount-label{font-size:12px;color:#059669;font-weight:500;letter-spacing:1px;margin-bottom:8px}
        .amount-value{font-size:32px;font-weight:700;color:#059669}
        .signatures{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin:40px 0 30px}
        .sig-item{text-align:center}
        .sig-label{font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px}
        .sig-name{font-size:14px;font-weight:600;color:#374151;margin-bottom:25px}
        .sig-line{border-bottom:1px solid #d1d5db;width:80%;margin:0 auto}
        .footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb}
        .footer p{font-size:11px;color:#9ca3af;line-height:1.6}
        .footer .green{font-weight:600;color:#059669}
        @media print{@page{size:A5;margin:15mm}body{padding:0}}
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header-top"><span>${currentDateTime}</span><span>Tahsilat Makbuzu - ${payment.studentName}</span></div>
        <div class="brand"><h1>${organizationName}</h1></div>
        <div class="title">TAHSİLAT MAKBUZU</div>
        <div class="doc-no">Belge No: ${docNo}</div>
        <hr>
        <div class="info-grid">
          <div><div class="info-label">Öğrenci Adı Soyadı</div><div class="info-value">${payment.studentName}</div></div>
          <div style="text-align:right"><div class="info-label">Tarih</div><div class="info-value">${formattedDate}</div></div>
          <div><div class="info-label">Ödeme Yapan</div><div class="info-value">Sayın Veli</div></div>
          <div style="text-align:right"><div class="info-label">Ödeme Yöntemi</div><div class="info-value">${methodLabels[payment.paymentMethod] || payment.paymentMethod || 'Belirtilmedi'}</div></div>
          <div></div>
          <div style="text-align:right"><div class="info-label">Taksit No</div><div class="info-value">${installmentLabel}</div></div>
        </div>
        <div class="amount-box">
          <div class="amount-label">Tahsil Edilen Tutar</div>
          <div class="amount-value">₺${payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="signatures">
          <div class="sig-item"><div class="sig-label">Teslim Alan</div><div class="sig-name">Muhasebe Birimi</div><div class="sig-line"></div></div>
          <div class="sig-item"><div class="sig-label">Teslim Eden</div><div class="sig-name">${payment.studentName} / Veli</div><div class="sig-line"></div></div>
        </div>
        <div class="footer">
          <p>Bu belge elektronik ortamda üretilmiştir. Geçerli bir tahsilat belgesi yerine geçer.</p>
          <p><span class="green">${organizationName}</span> Eğitim Kurumları Yönetim Sistemi</p>
        </div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},100)};</script>
    </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.addEventListener('afterprint', () => { setTimeout(() => { document.body.removeChild(iframe); }, 100); });
  setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 5000);
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  installment: FinanceInstallment | null;
  studentName: string;
  onSuccess: () => void;
  parentPhone?: string;
}

export default function PaymentCollectionModal({ isOpen, onClose, installment, studentName, onSuccess, parentPhone }: Props) {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [note, setNote] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isBackdatedPayment, setIsBackdatedPayment] = useState(false);

  // WhatsApp ile makbuz gönder - Seçilen tarihle
  const handleSendWhatsApp = (payAmount: number, selectedDate: Date) => {
    if (!parentPhone) return;
    
    let phone = parentPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '90' + phone.slice(1);
    } else if (!phone.startsWith('90') && phone.length === 10) {
      phone = '90' + phone;
    }
    
    const methodLabels: Record<string, string> = {
      cash: 'Nakit', card: 'Kredi Kartı', bank: 'Havale/EFT'
    };
    
    const message = `🧾 *TAHSİLAT MAKBUZU*\n\n` +
      `📌 *${organizationName}*\n\n` +
      `👨‍🎓 Öğrenci: ${studentName}\n` +
      `💰 Ödenen: ₺${payAmount.toLocaleString('tr-TR')}\n` +
      `📅 Tarih: ${selectedDate.toLocaleDateString('tr-TR')}\n` +
      `💳 Yöntem: ${methodLabels[method] || 'Nakit'}\n` +
      `📝 Taksit No: #${installment?.installment_no || '-'}\n\n` +
      `✅ Ödemeniz başarıyla alınmıştır.\n` +
      `Teşekkür ederiz. 🙏\n\n` +
      `_${organizationName} Eğitim Kurumları_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };
  
  // Calculate penalty/delay
  const [delayDays, setDelayDays] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  const [isSubmitting, startTransition] = useTransition();
  const { showToast, ToastContainer } = useToast();
  const { currentOrganization } = useOrganizationStore();
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';

  // Tarih değişikliğini kontrol et - geçmiş tarih mi?
  const handleDateChange = (newDate: string) => {
    setPaymentDate(newDate);
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setIsBackdatedPayment(true);
    } else {
      setIsBackdatedPayment(false);
    }
  };

  useEffect(() => {
    if (installment) {
      const totalAmt = Number(installment.amount) || 0;
      const paidAmt = Number(installment.paid_amount) || 0;
      // Kalan tutarı kuruş hassasiyeti ile hesapla
      const remaining = Math.round((totalAmt - paidAmt) * 100) / 100;
      setAmount(remaining.toString()); // Varsayılan: kalan borcun tamamı
      
      // Tarih varsayılan bugün
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsBackdatedPayment(false);
      
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
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsBackdatedPayment(false);
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
        // Seçilen tarihi kullan
        const selectedPaymentDate = new Date(paymentDate);
        selectedPaymentDate.setHours(12, 0, 0, 0); // Saat dilimi sorunlarını önle
        
        const res = await fetch('/api/installments/pay', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installment_id: installment.id,
            payment_method: method,
            amount_paid: payAmount,
            payment_date: selectedPaymentDate.toISOString(),
            note: note + (isBackdatedPayment ? ' [Geçmiş tarihli ödeme]' : '') + (penaltyAmount > 0 ? ` (Gecikme Cezası Dahil: ${penaltyAmount})` : ''),
            student_id: installment.student_id,
          }),
        });

        const data = await res.json();
        
        if (data.success) {
          showToast('success', 'Ödeme başarıyla alındı.');
          
          // Print Receipt - Seçilen tarihle
          if (printReceipt && data.data) {
            printReceiptDocument({
              id: data.data.payment_id || installment.id,
              studentName: studentName,
              amount: payAmount,
              paymentDate: selectedPaymentDate,
              paymentMethod: method,
              installmentNo: installment.installment_no
            }, organizationName);
          }

          // WhatsApp ile makbuz gönder - Seçilen tarihle
          if (sendWhatsApp && parentPhone) {
            handleSendWhatsApp(payAmount, selectedPaymentDate);
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

          {/* Ödeme Tarihi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                Ödeme Tarihi
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-4 py-3 text-base font-medium bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                  isBackdatedPayment 
                    ? 'border-orange-400 bg-orange-50' 
                    : 'border-gray-200 text-gray-900'
                }`}
              />
            </div>
            {isBackdatedPayment && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-700 flex items-center gap-1.5">
                  <Clock size={14} />
                  <span><strong>Geçmiş tarihli ödeme:</strong> Bu ödeme {new Date(paymentDate).toLocaleDateString('tr-TR')} tarihine kaydedilecek.</span>
                </p>
              </div>
            )}
          </div>

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
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sendWhatsApp ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                   {sendWhatsApp && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={sendWhatsApp} onChange={() => setSendWhatsApp(!sendWhatsApp)} />
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <MessageCircle size={14} /> WhatsApp Gönder
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

