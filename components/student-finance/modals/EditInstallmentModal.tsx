'use client';

import React from 'react';
import {
  X,
  Edit3,
  Banknote,
  CreditCard,
  Building,
  FileEdit,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Installment } from '@/lib/utils/financeTabUtils';

interface EditInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment;
  // Form state
  editInstallmentAmount: string;
  setEditInstallmentAmount: (value: string) => void;
  editDueDate: string;
  setEditDueDate: (value: string) => void;
  editPaidAmount: string;
  setEditPaidAmount: (value: string) => void;
  editPaymentDate: string;
  setEditPaymentDate: (value: string) => void;
  editPaymentMethod: 'cash' | 'card' | 'bank' | 'manual';
  setEditPaymentMethod: (value: 'cash' | 'card' | 'bank' | 'manual') => void;
  editSubmitting: boolean;
  onSave: () => void;
}

export default function EditInstallmentModal({
  isOpen,
  onClose,
  installment,
  editInstallmentAmount,
  setEditInstallmentAmount,
  editDueDate,
  setEditDueDate,
  editPaidAmount,
  setEditPaidAmount,
  editPaymentDate,
  setEditPaymentDate,
  editPaymentMethod,
  setEditPaymentMethod,
  editSubmitting,
  onSave
}: EditInstallmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Ödeme Düzenle</h3>
                <p className="text-blue-200 text-sm">
                  {installment.installment_no === 0 ? 'Peşinat' : `${installment.installment_no}. Taksit`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Taksit Bilgisi - Düzenlenebilir */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1">
              <Edit3 size={12} /> TAKSİT BİLGİLERİ (Düzenlenebilir)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Taksit Tutarı</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₺</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editInstallmentAmount}
                    onChange={(e) => setEditInstallmentAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Vade Tarihi</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Ödenen Tutar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ödenen Tutar</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
              <input
                type="text"
                inputMode="numeric"
                value={editPaidAmount}
                onChange={(e) => setEditPaidAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                className="w-full pl-10 pr-4 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Ödeme Tarihi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ödeme Tarihi</label>
            <input
              type="date"
              value={editPaymentDate}
              onChange={(e) => setEditPaymentDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Ödeme Yöntemi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ödeme Yöntemi</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'cash', icon: Banknote, label: 'Nakit', colors: 'bg-emerald-50 border-emerald-500 text-emerald-700' },
                { key: 'card', icon: CreditCard, label: 'Kart', colors: 'bg-indigo-50 border-indigo-500 text-indigo-700' },
                { key: 'bank', icon: Building, label: 'EFT', colors: 'bg-blue-50 border-blue-500 text-blue-700' },
                { key: 'manual', icon: FileEdit, label: 'Manual', colors: 'bg-orange-50 border-orange-500 text-orange-700' }
              ].map((method) => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => setEditPaymentMethod(method.key as any)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition ${
                    editPaymentMethod === method.key 
                      ? method.colors
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <method.icon size={18} />
                  <span className="text-[10px] font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            İptal
          </button>
          <button
            onClick={onSave}
            disabled={editSubmitting}
            className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {editSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
