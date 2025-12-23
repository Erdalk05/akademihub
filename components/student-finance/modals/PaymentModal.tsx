'use client';

import React from 'react';
import {
  X,
  Wallet,
  Sparkles,
  Clock,
  TrendingUp,
  Calendar,
  Banknote,
  CreditCard,
  Building,
  FileEdit,
  Printer,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { Installment, formatCurrency, formatDate } from '@/lib/utils/financeTabUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment;
  student: {
    first_name?: string;
    last_name?: string;
  };
  // Payment form state
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
  paymentDate: string;
  onPaymentDateChange: (value: string) => void;
  paymentMethod: 'cash' | 'card' | 'bank' | 'manual';
  setPaymentMethod: (value: 'cash' | 'card' | 'bank' | 'manual') => void;
  paymentNote: string;
  setPaymentNote: (value: string) => void;
  isBackdatedPayment: boolean;
  printReceipt: boolean;
  setPrintReceipt: (value: boolean) => void;
  sendWhatsApp: boolean;
  setSendWhatsApp: (value: boolean) => void;
  paymentSubmitting: boolean;
  onSubmit: (amount: number, method: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  installment,
  student,
  paymentAmount,
  setPaymentAmount,
  paymentDate,
  onPaymentDateChange,
  paymentMethod,
  setPaymentMethod,
  paymentNote,
  setPaymentNote,
  isBackdatedPayment,
  printReceipt,
  setPrintReceipt,
  sendWhatsApp,
  setSendWhatsApp,
  paymentSubmitting,
  onSubmit
}: PaymentModalProps) {
  if (!isOpen) return null;

  const remainingAmount = installment.amount - installment.paid_amount;
  const inputAmount = Number(paymentAmount) || 0;
  const isPartialPayment = inputAmount < remainingAmount && inputAmount > 0;
  const progressPercent = installment.amount > 0 
    ? Math.round((installment.paid_amount / installment.amount) * 100) 
    : 0;
  
  // Gecikme hesaplama
  let delayDays = 0;
  const dueDate = new Date(installment.due_date);
  const today = new Date();
  if (today > dueDate) {
    delayDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-emerald-900/50 backdrop-blur-md p-4">
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
              <p className="text-emerald-100 text-sm font-medium">
                {student.first_name} {student.last_name}
              </p>
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
                  {new Date(installment.due_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="text-right">
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Kalan</p>
                <p className="text-lg font-bold">{formatCurrency(remainingAmount)}</p>
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

        {/* İçerik */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
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
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full pl-14 pr-5 py-4 text-3xl font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                placeholder="0"
              />
            </div>
            {isPartialPayment && (
              <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 rounded-xl p-2">
                <span className="text-sm font-medium">Kısmi ödeme • Kalan: {formatCurrency(remainingAmount - inputAmount)}</span>
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
                onChange={(e) => onPaymentDateChange(e.target.value)}
                className={`w-full px-4 py-3 text-sm font-medium border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isBackdatedPayment 
                    ? 'border-orange-400 bg-orange-50 text-orange-800' 
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              />
              {isBackdatedPayment && (
                <p className="mt-1.5 text-xs text-orange-600 flex items-center gap-1">
                  <Clock size={12} />
                  Geçmiş tarihli
                </p>
              )}
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ödeme Yöntemi</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'cash', icon: Banknote, label: 'Nakit', color: 'emerald' },
                  { key: 'card', icon: CreditCard, label: 'Kart', color: 'indigo' },
                  { key: 'bank', icon: Building, label: 'EFT', color: 'blue' },
                  { key: 'manual', icon: FileEdit, label: 'Manual', color: 'orange' }
                ].map((method) => (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => setPaymentMethod(method.key as any)}
                    className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                      paymentMethod === method.key 
                        ? `bg-gradient-to-br from-${method.color}-50 to-${method.color}-100 border-${method.color}-500 text-${method.color}-700 shadow-md shadow-${method.color}-100`
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <method.icon size={20} />
                    <span className="text-[10px] font-semibold">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Not Alanı */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama (opsiyonel)</label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
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
        <div className="p-5 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3.5 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            İptal
          </button>
          <button
            onClick={() => {
              const amount = parseFloat(paymentAmount) || remainingAmount;
              onSubmit(amount, paymentMethod);
            }}
            disabled={paymentSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
            className="flex-[2] px-5 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
          >
            {paymentSubmitting ? (
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
