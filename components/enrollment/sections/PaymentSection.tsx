'use client';

import React, { useEffect, useCallback } from 'react';
import { CreditCard, Calculator, Percent, Coins, CalendarDays, CheckCircle, Sparkles } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { Section, InfoCard, Divider } from '../ui/Section';
import { FormSelect } from '../ui/FormField';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

export const PaymentSection = () => {
  const { payment, updatePayment, calculateInstallments } = useEnrollmentStore();

  // Taksit hesapla - otomatik güncelleme
  const recalculate = useCallback(() => {
    if (payment.netFee > 0 && payment.installmentCount > 0 && payment.firstInstallmentDate) {
      calculateInstallments();
    }
  }, [payment.netFee, payment.downPayment, payment.installmentCount, payment.firstInstallmentDate, payment.downPaymentDate, calculateInstallments]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Varsayılan tarihler ayarla
  useEffect(() => {
    if (!payment.firstInstallmentDate) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(15); // Ayın 15'i varsayılan
      const dateStr = nextMonth.toISOString().split('T')[0];
      updatePayment({ firstInstallmentDate: dateStr });
    }
    if (!payment.downPaymentDate) {
      const today = new Date().toISOString().split('T')[0];
      updatePayment({ downPaymentDate: today });
    }
  }, []);

  return (
    <Section title="Ödeme Bilgileri" icon={CreditCard}>
      <div className="space-y-6">
        {/* Ücret Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Toplam Ücret (₺)
            </label>
            <div className="relative">
              <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={payment.totalFee || ''}
                onChange={(e) => updatePayment({ totalFee: Number(e.target.value) })}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              İndirim (₺)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={payment.discount || ''}
                onChange={(e) => updatePayment({ discount: Number(e.target.value) })}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              İndirim Nedeni
            </label>
            <input
              type="text"
              value={payment.discountReason}
              onChange={(e) => updatePayment({ discountReason: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="Kardeş indirimi, erken kayıt vb."
            />
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard 
            label="Toplam Ücret" 
            value={`${payment.totalFee.toLocaleString('tr-TR')} ₺`}
            variant="default"
          />
          <InfoCard 
            label="İndirim" 
            value={`-${payment.discount.toLocaleString('tr-TR')} ₺`}
            icon={Percent}
            variant="warning"
          />
          <InfoCard 
            label="Net Ücret" 
            value={`${payment.netFee.toLocaleString('tr-TR')} ₺`}
            variant="primary"
          />
          <InfoCard 
            label="Aylık Taksit" 
            value={`${payment.monthlyInstallment.toLocaleString('tr-TR')} ₺`}
            icon={Coins}
            variant="success"
          />
        </div>

        <Divider label="Taksit Planı" />

        {/* Otomatik Taksit Bilgi */}
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <p className="text-sm text-indigo-700">
            <span className="font-semibold">Otomatik Hesaplama:</span> Toplam ücret ve taksit sayısını girdiğinizde taksitler otomatik oluşturulur.
          </p>
        </div>

        {/* Peşinat ve Tarih */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Peşinat (₺)
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={payment.downPayment || ''}
                onChange={(e) => updatePayment({ downPayment: Number(e.target.value) })}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <ModernDatePicker
            label="Peşinat Tarihi"
            value={payment.downPaymentDate || ''}
            onChange={(date) => updatePayment({ downPaymentDate: date })}
            minYear={2024}
            maxYear={2030}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Taksit Sayısı
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="48"
                value={payment.installmentCount || ''}
                onChange={(e) => {
                  const count = Number(e.target.value);
                  if (count >= 1 && count <= 48) {
                    updatePayment({ installmentCount: count });
                  }
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Örn: 12"
              />
            </div>
            {/* Hızlı seçim butonları */}
            <div className="flex gap-1 mt-1">
              {[1, 3, 6, 9, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updatePayment({ installmentCount: n })}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    payment.installmentCount === n
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <ModernDatePicker
            label="İlk Taksit Başlangıç Tarihi"
            value={payment.firstInstallmentDate || ''}
            onChange={(date) => updatePayment({ firstInstallmentDate: date })}
            required
            minYear={2024}
            maxYear={2030}
          />
        </div>

        {/* Ödeme Yöntemi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormSelect
            label="Ödeme Yöntemi"
            options={[
              { value: 'cash', label: 'Nakit' },
              { value: 'credit', label: 'Kredi Kartı' },
              { value: 'transfer', label: 'Havale/EFT' },
            ]}
            value={payment.paymentMethod}
            onChange={(e) => updatePayment({ paymentMethod: e.target.value as any })}
          />
        </div>

        {/* Taksit Tablosu */}
        {payment.installments.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Vade Tarihi</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Tutar</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payment.installments.map((inst) => (
                  <tr key={inst.no} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                        ${inst.no === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}
                      `}>
                        {inst.no === 0 ? 'P' : inst.no}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        {new Date(inst.dueDate).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {inst.amount.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                        ${inst.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : inst.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      `}>
                        {inst.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {inst.status === 'paid' ? 'Ödendi' : inst.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-bold text-slate-700">TOPLAM</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600 text-lg">
                    {payment.netFee.toLocaleString('tr-TR')} ₺
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </Section>
  );
};


