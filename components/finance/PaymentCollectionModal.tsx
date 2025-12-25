'use client';

import { useEffect, useState, useTransition } from 'react';
import { X, CreditCard, Banknote, Building, Printer, MessageCircle, Calculator, AlertCircle, CheckCircle2, Calendar, Clock, Sparkles, TrendingUp, Wallet } from 'lucide-react';
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

  // Modal ilk açıldığında veya taksit ID'si değiştiğinde çalışacak
  // installment nesnesinin referansı değil, ID'si takip ediliyor
  const installmentId = installment?.id;
  
  useEffect(() => {
    // Sadece modal AÇILDIĞINDA ve taksit varsa tarihi sıfırla
    if (isOpen && installment) {
      const totalAmt = Number(installment.amount) || 0;
      const paidAmt = Number(installment.paid_amount) || 0;
      // Kalan tutarı kuruş hassasiyeti ile hesapla
      const remaining = Math.round((totalAmt - paidAmt) * 100) / 100;
      setAmount(remaining.toString()); // Varsayılan: kalan borcun tamamı
      
      // Tarih varsayılan bugün - SADECE modal açıldığında ayarlanır
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
    } else if (!isOpen) {
      // Modal kapandığında state'leri sıfırla
      setAmount('');
      setDelayDays(0);
      setPenaltyAmount(0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsBackdatedPayment(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installmentId, isOpen]); // installment yerine installmentId kullan

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

  // Ödeme ilerleme yüzdesi
  const totalInstallment = Number(installment.amount) || 0;
  const alreadyPaid = Number(installment.paid_amount) || 0;
  const progressPercent = totalInstallment > 0 ? Math.round((alreadyPaid / totalInstallment) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-emerald-900/50 backdrop-blur-md p-4">
      <ToastContainer />
      
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-300 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header - Gradyan */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white overflow-hidden">
          {/* Dekoratif arka plan */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
          
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Wallet size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Ödeme Tahsilatı</h2>
                <Sparkles size={16} className="text-yellow-300 animate-pulse" />
              </div>
              <p className="text-emerald-100 text-sm font-medium">{studentName}</p>
            </div>
          </div>

          {/* Taksit Bilgi Kartı */}
          <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Taksit</p>
                <p className="text-2xl font-bold">#{installment.installment_no}</p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Vade</p>
                <p className={`text-lg font-bold ${delayDays > 0 ? 'text-red-300' : ''}`}>
                  {installment.due_date ? new Date(installment.due_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '-'}
                </p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="text-right">
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Kalan</p>
                <p className="text-lg font-bold">₺{originalAmount.toLocaleString('tr-TR')}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            {progressPercent > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-emerald-100 mb-1">
                  <span>Ödeme İlerlemesi</span>
                  <span className="font-bold">%{progressPercent}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Delay Warning */}
          {delayDays > 0 && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-2xl border border-red-100">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <span className="font-bold text-red-800">{delayDays} gün gecikme!</span>
                <p className="text-xs text-red-600 mt-0.5">
                  Gecikme cezası: <strong>₺{penaltyAmount.toLocaleString('tr-TR')}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Ana Tutar Alanı - Büyük ve Etkileyici */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl p-5 border border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              Tahsil Edilecek Tutar
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-emerald-600">₺</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-5 py-4 text-3xl font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                placeholder="0"
              />
            </div>
            {isPartial && (
              <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 rounded-xl p-2">
                <Calculator size={16} />
                <span className="text-sm font-medium">Kısmi ödeme • Kalan: ₺{(originalAmount - totalDue).toLocaleString('tr-TR')}</span>
              </div>
            )}
          </div>

          {/* Tarih ve Yöntem - Yan Yana */}
          <div className="grid grid-cols-2 gap-4">
            {/* Ödeme Tarihi */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                Ödeme Tarihi
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-4 py-3 text-sm font-medium border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isBackdatedPayment 
                    ? 'border-orange-400 bg-orange-50 text-orange-800' 
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              />
              {isBackdatedPayment && (
                <p className="mt-1.5 text-xs text-orange-600 flex items-center gap-1">
                  <Clock size={12} />
                  Geçmiş tarihli ödeme
                </p>
              )}
            </div>

            {/* Ödeme Yöntemi Seçimi */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ödeme Yöntemi</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                    method === 'cash' 
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-100' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Banknote size={20} />
                  <span className="text-[10px] font-semibold">Nakit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                    method === 'card' 
                    ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-500 text-indigo-700 shadow-md shadow-indigo-100' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard size={20} />
                  <span className="text-[10px] font-semibold">Kart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                    method === 'bank' 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 text-blue-700 shadow-md shadow-blue-100' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Building size={20} />
                  <span className="text-[10px] font-semibold">EFT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Not Alanı */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama (opsiyonel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all"
              placeholder="Ödeme ile ilgili not ekleyin..."
            />
          </div>

          {/* Modern Toggle Switches */}
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div 
                onClick={() => setPrintReceipt(!printReceipt)}
                className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${
                  printReceipt 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                    : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                  printReceipt ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Printer size={14} /> Makbuz
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div 
                onClick={() => setSendWhatsApp(!sendWhatsApp)}
                className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${
                  sendWhatsApp 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                  sendWhatsApp ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <MessageCircle size={14} /> WhatsApp
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3.5 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            İptal
          </button>
          <button
            onClick={handlePayment}
            disabled={isSubmitting || !amount || Number(amount) <= 0}
            className="flex-[2] px-5 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                Ödemeyi Onayla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

