'use client';

import { useEffect, useState, useTransition } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { 
  MessageCircle, 
  CheckCircle2, 
  X, 
  Wallet, 
  Calendar, 
  Clock, 
  Banknote, 
  CreditCard, 
  Building, 
  Sparkles,
  TrendingUp,
  Printer
} from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  installment?: {
    id: string;
    installment_no: number;
    amount: number;
    due_date?: string;
    paid_amount?: number;
  } | null;
  onSuccess?: () => void;
  studentId?: string;
  studentName?: string;
  parentPhone?: string;
};

export default function TakePaymentModal({ open, onClose, installment, onSuccess, studentId, studentName, parentPhone }: Props) {
  const [method, setMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isBackdatedPayment, setIsBackdatedPayment] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  
  const { showToast, ToastContainer } = useToast();
  const { currentOrganization } = useOrganizationStore();
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';

  // WhatsApp ile makbuz gönder
  const handleSendWhatsApp = () => {
    if (!parentPhone) {
      showToast('error', 'Telefon numarası bulunamadı');
      return;
    }
    
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
      `👨‍🎓 Öğrenci: ${studentName || '-'}\n` +
      `💰 Ödenen: ₺${Number(amountPaid).toLocaleString('tr-TR')}\n` +
      `📅 Tarih: ${new Date(paymentDate).toLocaleDateString('tr-TR')}\n` +
      `💳 Yöntem: ${methodLabels[method] || 'Nakit'}\n` +
      `📝 Taksit No: #${installment?.installment_no || '-'}\n\n` +
      `✅ Ödemeniz başarıyla alınmıştır.\n` +
      `Teşekkür ederiz. 🙏\n\n` +
      `_${organizationName} Eğitim Kurumları_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  // Tarih değişikliği kontrolü
  const handleDateChange = (newDate: string) => {
    setPaymentDate(newDate);
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    setIsBackdatedPayment(selectedDate < today);
  };

  useEffect(() => {
    if (open && installment) {
      setAmountPaid(String(installment.amount ?? 0));
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentSuccess(false);
      setError(null);
      setIsBackdatedPayment(false);
      setNotes('');
    }
  }, [installment, open]);

  const handleSubmit = () => {
    if (!installment?.id) {
      setError('Geçersiz taksit');
      return;
    }
    if (!studentId) {
      setError('Öğrenci bilgisi eksik');
      return;
    }
    if (!amountPaid || Number(amountPaid) <= 0) {
      setError('Geçerli bir ödeme tutarı girin');
      return;
    }
    if (!paymentDate) {
      setError('Ödeme tarihi seçilmelidir');
      return;
    }
    setError(null);
    
    startTransition(async () => {
      try {
        const selectedPaymentDate = new Date(paymentDate);
        selectedPaymentDate.setHours(12, 0, 0, 0);
        
        const res = await fetch('/api/installments/pay', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installment_id: installment.id,
            payment_method: method,
            amount_paid: Number(amountPaid),
            payment_date: selectedPaymentDate.toISOString(),
            note: notes + (isBackdatedPayment ? ' [Geçmiş tarihli ödeme]' : ''),
            student_id: studentId,
          }),
        });
        const js = await res.json();
        if (!res.ok || !js?.success) {
          setError(js?.error || 'Ödeme alınamadı');
          return;
        }
        
        setPaymentSuccess(true);
        showToast('success', '✅ Ödeme başarıyla alındı!');
        
        // WhatsApp gönder
        if (sendWhatsApp && parentPhone) {
          setTimeout(() => handleSendWhatsApp(), 500);
        }
        
        onSuccess?.();
      } catch (e: any) {
        setError(e?.message || 'Ödeme alınamadı');
      }
    });
  };

  if (!open) return null;

  // Hesaplamalar
  const totalAmount = Number(installment?.amount) || 0;
  const paidAmount = Number(installment?.paid_amount) || 0;
  const remainingAmount = totalAmount - paidAmount;
  const inputAmount = Number(amountPaid) || 0;
  const isPartialPayment = inputAmount < remainingAmount && inputAmount > 0;

  // Gecikme hesaplama
  let delayDays = 0;
  if (installment?.due_date) {
    const dueDate = new Date(installment.due_date);
    const today = new Date();
    if (today > dueDate) {
      delayDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-emerald-900/50 backdrop-blur-md p-4">
      <ToastContainer />
      
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-300 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header - Gradyan */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white overflow-hidden shrink-0">
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
              <p className="text-emerald-100 text-sm font-medium">{studentName || 'Öğrenci'}</p>
            </div>
          </div>

          {/* Taksit Bilgi Kartı */}
          {installment && (
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
                    {installment.due_date 
                      ? new Date(installment.due_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) 
                      : '-'}
                  </p>
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div className="text-right">
                  <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Kalan</p>
                  <p className="text-lg font-bold">₺{remainingAmount.toLocaleString('tr-TR')}</p>
                </div>
            </div>
            </div>
          )}
          </div>

        {/* İçerik - Scroll edilebilir */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {!installment ? (
            <div className="text-center py-8 text-slate-500">Taksit seçilmedi.</div>
          ) : paymentSuccess ? (
            /* Başarılı Ödeme Ekranı */
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-600" />
          </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ödeme Başarılı!</h3>
              <p className="text-slate-500 mb-6">₺{Number(amountPaid).toLocaleString('tr-TR')} tutarında ödeme alındı.</p>
              
              <div className="flex gap-3 justify-center">
                {parentPhone && (
                <button
                  onClick={handleSendWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  <MessageCircle size={18} />
                  WhatsApp Gönder
                </button>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          ) : (
            /* Ödeme Formu */
            <>
              {/* Gecikme Uyarısı */}
              {delayDays > 0 && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-2xl border border-red-100">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-red-600" />
                  </div>
                  <div>
                    <span className="font-bold text-red-800">{delayDays} gün gecikme!</span>
                    <p className="text-xs text-red-600 mt-0.5">Vade tarihi geçmiş bir taksit.</p>
                  </div>
                </div>
              )}

              {/* Ana Tutar Alanı */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl p-5 border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                  Tahsil Edilecek Tutar
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-emerald-600">₺</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 text-3xl font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    placeholder="0"
                  />
                </div>
                {isPartialPayment && (
                  <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 rounded-xl p-2">
                    <span className="text-sm font-medium">Kısmi ödeme • Kalan: ₺{(remainingAmount - inputAmount).toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>

              {/* Tarih ve Yöntem */}
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

                {/* Ödeme Yöntemi */}
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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

              {/* Hata Mesajı */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!paymentSuccess && installment && (
          <div className="p-5 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-t border-slate-100 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3.5 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              İptal
            </button>
              <button
                onClick={handleSubmit}
              disabled={submitting || !amountPaid || Number(amountPaid) <= 0}
              className="flex-[2] px-5 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                  Ödemeyi Onayla
                </>
              )}
              </button>
            </div>
          )}
        </div>
    </div>
  );
}
