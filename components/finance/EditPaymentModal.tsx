'use client';

import { useEffect, useState, useTransition } from 'react';
import { X, CheckCircle2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { FinanceInstallment } from '@/lib/types/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  installment: FinanceInstallment | null;
  studentName: string;
  onSuccess: () => void;
}

export default function EditPaymentModal({ isOpen, onClose, installment, studentName, onSuccess }: Props) {
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paidDate, setPaidDate] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  
  const [isSubmitting, startTransition] = useTransition();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (installment) {
      setPaidAmount(installment.paid_amount?.toString() || '0');
      setPaidDate(installment.paid_at ? new Date(installment.paid_at).toISOString().slice(0, 10) : '');
      setMethod(installment.payment_method || 'cash');
      setNote(installment.note || '');
    }
  }, [installment, isOpen]);

  const handleUpdate = async () => {
    if (!installment) return;

    const newAmount = parseFloat(paidAmount);
    if (isNaN(newAmount) || newAmount < 0) {
      showToast('error', 'Geçerli bir tutar giriniz.');
      return;
    }

    startTransition(async () => {
      try {
        // Updating payment via a new endpoint or reuse pay with 'update' flag? 
        // Let's use a dedicated update endpoint to be safe.
        const res = await fetch('/api/installments/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installment_id: installment.id,
            paid_amount: newAmount,
            payment_date: paidDate ? new Date(paidDate).toISOString() : null,
            payment_method: method,
            note: note,
          }),
        });

        const data = await res.json();
        
        if (data.success) {
          showToast('success', 'Ödeme kaydı güncellendi.');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        } else {
          showToast('error', data.error || 'Güncelleme başarısız.');
        }
      } catch (error) {
        showToast('error', 'Bağlantı hatası oluştu.');
      }
    });
  };

  const handleResetPayment = async () => {
      if (!installment || !window.confirm('Bu ödemeyi tamamen iptal etmek/sıfırlamak istiyor musunuz?')) return;
      
      startTransition(async () => {
        try {
          const res = await fetch('/api/installments/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              installment_id: installment.id,
              paid_amount: 0,
              payment_date: null,
              payment_method: null,
              note: 'Ödeme sıfırlandı',
              reset: true // Flag to handle full reset logic easily in backend if needed
            }),
          });
          const data = await res.json();
          if (data.success) {
             showToast('success', 'Ödeme sıfırlandı.');
             setTimeout(() => { onSuccess(); onClose(); }, 1000);
          } else {
             showToast('error', data.error || 'İşlem başarısız.');
          }
        } catch (e) {
            showToast('error', 'Hata oluştu.');
        }
      });
  }

  if (!isOpen || !installment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <ToastContainer />
      
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-200 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-5 text-white flex justify-between items-center">
           <div>
              <h2 className="text-lg font-semibold">Ödeme Düzenle</h2>
              <p className="text-xs text-gray-400">{studentName} - Taksit #{installment.installment_no}</p>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-6 space-y-4">
           <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-2 text-yellow-800 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>
                 Burada yapılan değişiklikler finansal raporları etkiler. Lütfen dikkatli işlem yapınız.
              </p>
           </div>

           {/* Paid Amount */}
           <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Ödenen Tutar</label>
               <input 
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
               />
               <p className="text-xs text-gray-500 mt-1">Planlanan Taksit: ₺{Number(installment.amount).toLocaleString('tr-TR')}</p>
           </div>

           {/* Date */}
           <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi</label>
               <input 
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
           </div>

           {/* Method */}
           <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
               <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                   <option value="cash">Nakit</option>
                   <option value="card">Kredi Kartı</option>
                   <option value="bank">Havale/EFT</option>
               </select>
           </div>

           {/* Note */}
           <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
               <textarea 
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                   rows={2}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
               />
           </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-between gap-3">
            <button 
                onClick={handleResetPayment}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
            >
                <Trash2 size={16} /> Sıfırla
            </button>
            <div className="flex gap-2">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    İptal
                </button>
                <button 
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-200"
                >
                    {isSubmitting ? 'Kaydediliyor...' : (
                        <>
                          <Save size={16} /> Güncelle
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

