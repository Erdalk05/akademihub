'use client';

import { useState, useTransition } from 'react';
import { X, PlusCircle, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

interface Props {
  open: boolean; // Changed to match typical prop naming, page passes 'open'
  onClose: () => void;
  studentId: string;
  nextInstallmentNo: number;
  defaultDueDate: string;
  onSuccess: () => void;
}

export default function AddInstallmentModal({
  open,
  onClose,
  studentId,
  nextInstallmentNo,
  defaultDueDate,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [isSubmitting, startTransition] = useTransition();
  const { showToast, ToastContainer } = useToast();

  if (!open) return null;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      showToast('error', 'Geçerli bir tutar giriniz.');
      return;
    }
    if (!dueDate) {
      showToast('error', 'Vade tarihi seçiniz.');
      return;
    }

    startTransition(async () => {
      try {
        // Using api/installments/add for single creation
        const res = await fetch('/api/installments/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            installment_no: nextInstallmentNo,
            amount: Number(amount),
            due_date: dueDate,
          }),
        });

        const data = await res.json();

        if (data.success) {
        showToast('success', 'Yeni taksit eklendi.');
        setTimeout(() => {
            onSuccess();
            onClose();
            setAmount(''); // Reset
          }, 1000);
        } else {
          showToast('error', data.error || 'Ekleme başarısız.');
        }
      } catch (error) {
        showToast('error', 'Bağlantı hatası oluştu.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <ToastContainer />
      
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-200 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <PlusCircle size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Ek Taksit Ekle</h2>
                    <p className="text-xs text-blue-100">Ödeme planına manuel ekleme</p>
                </div>
            </div>
            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-5">
           {/* Installment No */}
           <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
              <span className="text-sm font-medium">Eklenecek Taksit No</span>
              <span className="text-lg font-bold">#{nextInstallmentNo}</span>
           </div>

           {/* Amount */}
           <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Taksit Tutarı</label>
               <div className="relative">
                   <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                       type="number" 
                       min="0"
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900"
                       placeholder="0.00"
                   />
               </div>
           </div>

           {/* Date */}
           <ModernDatePicker
               label="Vade Tarihi"
               value={dueDate}
               onChange={setDueDate}
               required
               minYear={2024}
               maxYear={2030}
           />
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button 
                onClick={onClose} 
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                Vazgeç
            </button>
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70 flex items-center gap-2"
            >
                {isSubmitting ? 'Ekleniyor...' : 'Taksiti Ekle'}
            </button>
        </div>
      </div>
    </div>
  );
}
