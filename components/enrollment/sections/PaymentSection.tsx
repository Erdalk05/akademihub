'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { CreditCard, Calculator, Percent, Coins, CalendarDays, CheckCircle, Sparkles, Edit3, Trash2, Plus, Zap, Settings2 } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { Section, InfoCard, Divider } from '../ui/Section';
import { FormSelect } from '../ui/FormField';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

type InstallmentMode = 'auto' | 'custom' | 'manual';

export const PaymentSection = () => {
  const { payment, updatePayment, calculateInstallments, updateInstallment, addInstallment, removeInstallment } = useEnrollmentStore();
  const [mode, setMode] = useState<InstallmentMode>('auto');
  const [customFirstAmount, setCustomFirstAmount] = useState<string>('');

  // Peşinat hariç toplam
  const totalAfterDownPayment = useMemo(() => {
    return payment.netFee - payment.downPayment;
  }, [payment.netFee, payment.downPayment]);

  // Otomatik mod: taksitleri hesapla
  useEffect(() => {
    if (mode === 'auto' && payment.netFee > 0 && payment.installmentCount > 0 && payment.firstInstallmentDate) {
      calculateInstallments();
    }
  }, [mode, payment.netFee, payment.downPayment, payment.installmentCount, payment.firstInstallmentDate, payment.downPaymentDate, calculateInstallments]);

  // Özel ilk taksit hesaplama
  const customCalculation = useMemo(() => {
    const firstAmount = parseInt(customFirstAmount.replace(/\D/g, '')) || 0;
    if (firstAmount <= 0 || firstAmount >= totalAfterDownPayment) {
      return null;
    }
    
    const remaining = totalAfterDownPayment - firstAmount;
    const count = payment.installmentCount - 1;
    if (count <= 0) return null;
    
    const each = Math.floor(remaining / count);
    const lastExtra = remaining - (each * count);
    
    return {
      firstAmount,
      remaining,
      count,
      each,
      lastExtra,
      lastAmount: each + lastExtra
    };
  }, [customFirstAmount, totalAfterDownPayment, payment.installmentCount]);

  // Özel ilk taksit uygula
  const applyCustomFirst = useCallback(() => {
    if (!customCalculation) return;
    
    const { firstAmount, each, lastAmount, count } = customCalculation;
    
    // Mevcut taksitleri güncelle
    const updatedInstallments = payment.installments.map((inst) => {
      if (inst.no <= 0) return inst; // Peşinat
      
      if (inst.no === 1) {
        return { ...inst, amount: firstAmount };
      } else if (inst.no === payment.installmentCount) {
        return { ...inst, amount: lastAmount };
      } else {
        return { ...inst, amount: each };
      }
    });
    
    updatePayment({ installments: updatedInstallments });
  }, [customCalculation, payment.installments, payment.installmentCount, updatePayment]);

  // Varsayılan tarihler
  useEffect(() => {
    if (!payment.firstInstallmentDate) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(15);
      updatePayment({ firstInstallmentDate: nextMonth.toISOString().split('T')[0] });
    }
    if (!payment.downPaymentDate) {
      updatePayment({ downPaymentDate: new Date().toISOString().split('T')[0] });
    }
  }, []);

  // Mod değiştiğinde özel ilk taksit alanını temizle
  useEffect(() => {
    if (mode !== 'custom') {
      setCustomFirstAmount('');
    }
  }, [mode]);

  return (
    <Section title="Ödeme Bilgileri" icon={CreditCard}>
      <div className="space-y-6">
        
        {/* Ücret Girişi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Toplam Ücret (₺)
            </label>
            <div className="relative">
              <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                value={payment.totalFee ? payment.totalFee.toLocaleString('tr-TR') : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  updatePayment({ totalFee: Number(value) || 0 });
                }}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              İndirim (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="0"
                max="100"
                value={payment.discountPercent || ''}
                onChange={(e) => {
                  const percent = Math.min(100, Math.max(0, Number(e.target.value)));
                  const discountAmount = Math.round((payment.totalFee * percent) / 100);
                  updatePayment({ discountPercent: percent, discount: discountAmount });
                }}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Toplam</p>
            <p className="text-lg font-bold text-slate-800">{payment.totalFee.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-xs text-amber-600 mb-1">İndirim</p>
            <p className="text-lg font-bold text-amber-700">-{payment.discount.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 mb-1">Net Ücret</p>
            <p className="text-lg font-bold text-emerald-700">{payment.netFee.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs text-indigo-600 mb-1">Aylık Taksit</p>
            <p className="text-lg font-bold text-indigo-700">{payment.monthlyInstallment.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>

        <Divider label="Taksit Planı" />

        {/* Mod Seçimi - Tab Şeklinde */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1">
          <button
            type="button"
            onClick={() => setMode('auto')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'auto'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Otomatik
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'custom'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Özel İlk Taksit
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'manual'
                ? 'bg-white text-orange-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Manuel
          </button>
        </div>

        {/* Mod Açıklaması */}
        <div className={`p-4 rounded-xl border ${
          mode === 'auto' ? 'bg-indigo-50 border-indigo-200' :
          mode === 'custom' ? 'bg-emerald-50 border-emerald-200' :
          'bg-orange-50 border-orange-200'
        }`}>
          <p className={`text-sm ${
            mode === 'auto' ? 'text-indigo-700' :
            mode === 'custom' ? 'text-emerald-700' :
            'text-orange-700'
          }`}>
            {mode === 'auto' && '🚀 Taksit sayısını seçin, tutarlar otomatik eşit bölünür.'}
            {mode === 'custom' && '✨ İlk taksit tutarını girin, kalanlar otomatik eşit bölünür.'}
            {mode === 'manual' && '✏️ Her taksiti ayrı ayrı düzenleyebilirsiniz.'}
          </p>
        </div>

        {/* Özel İlk Taksit Girişi */}
        {mode === 'custom' && (
          <div className="bg-white border-2 border-emerald-200 rounded-xl p-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-emerald-700 mb-2">
                  İlk Taksit Tutarı
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₺</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customFirstAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setCustomFirstAmount(value ? parseInt(value).toLocaleString('tr-TR') : '');
                    }}
                    placeholder="Örn: 5.000"
                    className="w-full pl-10 pr-4 py-3 text-lg font-bold border-2 border-emerald-300 rounded-xl 
                      focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {customCalculation && (
                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 bg-teal-100 rounded-lg">
                    <p className="text-xs text-teal-600">Kalan {customCalculation.count} taksit</p>
                    <p className="text-lg font-bold text-teal-700">{customCalculation.each.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <button
                    type="button"
                    onClick={applyCustomFirst}
                    className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                  >
                    Uygula
                  </button>
                </div>
              )}

              {!customCalculation && customFirstAmount && (
                <p className="text-sm text-red-500">
                  ⚠️ Geçersiz tutar (max: {totalAfterDownPayment.toLocaleString('tr-TR')} ₺)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Peşinat ve Tarih Ayarları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Peşinat (₺)
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                value={payment.downPayment ? payment.downPayment.toLocaleString('tr-TR') : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  updatePayment({ downPayment: Number(value) || 0 });
                }}
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
            <input
              type="number"
              min="1"
              max="48"
              value={payment.installmentCount || ''}
              onChange={(e) => {
                const count = Math.min(48, Math.max(1, Number(e.target.value)));
                updatePayment({ installmentCount: count });
              }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
            <div className="flex gap-1">
              {[1, 3, 6, 9, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updatePayment({ installmentCount: n })}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${
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
            label="İlk Taksit Tarihi"
            value={payment.firstInstallmentDate || ''}
            onChange={(date) => updatePayment({ firstInstallmentDate: date })}
            required
            minYear={2024}
            maxYear={2030}
          />
        </div>

        {/* Ödeme Yöntemi */}
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

        {/* Taksit Tablosu */}
        {payment.installments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Tablo Başlığı */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Vade Tarihi</div>
              <div className="col-span-3 text-right">Tutar</div>
              <div className="col-span-3 text-center">Durum</div>
              {mode === 'manual' && <div className="col-span-1"></div>}
            </div>

            {/* Taksit Satırları */}
            <div className="divide-y divide-slate-100">
              {payment.installments.map((inst, idx) => (
                <div 
                  key={inst.no} 
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  } hover:bg-indigo-50/30`}
                >
                  {/* Numara */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      inst.no === 0 
                        ? 'bg-indigo-500 text-white' 
                        : inst.no === 1 && mode === 'custom'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}>
                      {inst.no === 0 ? 'P' : inst.no}
                    </span>
                  </div>

                  {/* Tarih */}
                  <div className="col-span-4">
                    {mode === 'manual' ? (
                      <input
                        type="date"
                        value={inst.dueDate}
                        onChange={(e) => updateInstallment(inst.no, { dueDate: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        {new Date(inst.dueDate).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tutar */}
                  <div className="col-span-3 text-right">
                    {mode === 'manual' ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={inst.amount ? inst.amount.toLocaleString('tr-TR') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          updateInstallment(inst.no, { amount: Number(value) || 0 });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-right font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    ) : (
                      <span className={`font-bold ${
                        inst.no === 1 && mode === 'custom' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {inst.amount.toLocaleString('tr-TR')} ₺
                      </span>
                    )}
                  </div>

                  {/* Durum */}
                  <div className="col-span-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      inst.status === 'paid' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : inst.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inst.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                      {inst.status === 'paid' ? 'Ödendi' : inst.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                    </span>
                  </div>

                  {/* Sil Butonu (Manuel modda) */}
                  {mode === 'manual' && (
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeInstallment(inst.no)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Toplam */}
            <div className="grid grid-cols-12 gap-2 px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-100">
              <div className="col-span-5 font-bold text-indigo-800">TOPLAM</div>
              <div className="col-span-3 text-right">
                <span className="text-xl font-bold text-indigo-600">
                  {payment.installments.reduce((sum, i) => sum + i.amount, 0).toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <div className="col-span-4"></div>
            </div>

            {/* Manuel modda taksit ekle */}
            {mode === 'manual' && (
              <div className="p-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={addInstallment}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Taksit Ekle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Taksit yoksa */}
        {payment.installments.length === 0 && (
          <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center">
            <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-4">Taksit planı oluşturmak için taksit sayısını ve tarihi belirleyin</p>
            {mode === 'manual' && (
              <button
                type="button"
                onClick={addInstallment}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                İlk Taksiti Ekle
              </button>
            )}
          </div>
        )}

      </div>
    </Section>
  );
};
