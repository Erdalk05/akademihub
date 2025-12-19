'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { CreditCard, Calculator, Percent, Coins, CalendarDays, CheckCircle, Sparkles, Edit3, Trash2, Plus, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { Section, InfoCard, Divider } from '../ui/Section';
import { FormSelect } from '../ui/FormField';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

export const PaymentSection = () => {
  const { payment, updatePayment, calculateInstallments, updateInstallment, addInstallment, removeInstallment } = useEnrollmentStore();
  const [isManualMode, setIsManualMode] = useState(false);
  const [customFirstInstallment, setCustomFirstInstallment] = useState<number>(0);
  const [useCustomFirst, setUseCustomFirst] = useState(false);

  // Taksit hesapla - otomatik güncelleme (sadece otomatik modda ve özel ilk taksit kapalıyken)
  const recalculate = useCallback(() => {
    if (!isManualMode && !useCustomFirst && payment.netFee > 0 && payment.installmentCount > 0 && payment.firstInstallmentDate) {
      calculateInstallments();
    }
  }, [payment.netFee, payment.downPayment, payment.installmentCount, payment.firstInstallmentDate, payment.downPaymentDate, calculateInstallments, isManualMode, useCustomFirst]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Toggle açıldığında mevcut ilk taksitin değerini al
  useEffect(() => {
    if (useCustomFirst && payment.installments.length > 0) {
      const firstInstallment = payment.installments.find(inst => inst.no === 1);
      if (firstInstallment && customFirstInstallment === 0) {
        setCustomFirstInstallment(firstInstallment.amount);
      }
    }
  }, [useCustomFirst, payment.installments]);

  // İlk taksit değiştiğinde diğer taksitleri yeniden hesapla
  const applyCustomFirstInstallment = useCallback((firstAmount: number) => {
    if (!useCustomFirst || firstAmount <= 0) return;
    if (payment.installments.length === 0) return;
    
    // Peşinat hariç taksitleri filtrele
    const regularInstallments = payment.installments.filter(inst => inst.no > 0);
    if (regularInstallments.length === 0) return;
    
    // Peşinat düşüldükten sonraki toplam
    const afterDownPayment = payment.netFee - payment.downPayment;
    
    // İlk taksit çıkınca kalan tutar
    const remainingAfterFirst = afterDownPayment - firstAmount;
    
    // Kalan taksit sayısı (ilk taksit hariç)
    const remainingInstallmentCount = regularInstallments.length - 1;
    
    if (remainingInstallmentCount <= 0 || remainingAfterFirst < 0) return;
    
    // Her kalan taksit için tutar (küsurat son taksitte)
    const eachRemaining = Math.floor(remainingAfterFirst / remainingInstallmentCount);
    const lastInstallmentExtra = remainingAfterFirst - (eachRemaining * remainingInstallmentCount);
    
    // Taksitleri güncelle
    regularInstallments.forEach((inst, index) => {
      if (index === 0) {
        // İlk taksit (kullanıcının girdiği)
        updateInstallment(inst.no, { amount: firstAmount });
      } else if (index === regularInstallments.length - 1) {
        // Son taksit (küsurat dahil)
        updateInstallment(inst.no, { amount: eachRemaining + lastInstallmentExtra });
      } else {
        // Diğer taksitler (eşit)
        updateInstallment(inst.no, { amount: eachRemaining });
      }
    });
  }, [useCustomFirst, payment.netFee, payment.downPayment, payment.installments, updateInstallment]);

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
                  updatePayment({ 
                    discountPercent: percent,
                    discount: discountAmount 
                  });
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

        {/* Küsüratlı Satış - Sade Tasarım */}
        <div className={`p-4 rounded-xl border transition-all ${
          useCustomFirst 
            ? 'border-emerald-300 bg-emerald-50' 
            : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Toggle + Label */}
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => {
                  const newValue = !useCustomFirst;
                  setUseCustomFirst(newValue);
                  if (!newValue) {
                    setCustomFirstInstallment(0);
                    if (!isManualMode) calculateInstallments();
                  }
                }}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  useCustomFirst ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  useCustomFirst ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
              <span className={`text-sm font-medium ${useCustomFirst ? 'text-emerald-700' : 'text-slate-600'}`}>
                Özel İlk Taksit
              </span>
            </label>

            {/* Input - Sadece açıkken görünür */}
            {useCustomFirst && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">→</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-medium">₺</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customFirstInstallment > 0 ? customFirstInstallment.toLocaleString('tr-TR') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        const numValue = Number(value) || 0;
                        setCustomFirstInstallment(numValue);
                      }}
                      onBlur={() => {
                        // Blur olduğunda taksitleri güncelle
                        if (customFirstInstallment > 0) {
                          applyCustomFirstInstallment(customFirstInstallment);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Enter'a basınca da taksitleri güncelle
                        if (e.key === 'Enter' && customFirstInstallment > 0) {
                          applyCustomFirstInstallment(customFirstInstallment);
                        }
                      }}
                      placeholder="İlk taksit tutarı"
                      className="w-36 pl-8 pr-3 py-2 text-sm font-semibold border-2 border-emerald-300 rounded-lg 
                        focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none bg-white"
                    />
                  </div>
                  {/* Uygula Butonu */}
                  <button
                    type="button"
                    onClick={() => {
                      if (customFirstInstallment > 0) {
                        applyCustomFirstInstallment(customFirstInstallment);
                      }
                    }}
                    disabled={customFirstInstallment <= 0}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      customFirstInstallment > 0
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Uygula
                  </button>
                </div>

                {/* Kalan Taksitler Özeti */}
                {customFirstInstallment && customFirstInstallment > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">→</span>
                    {(() => {
                      const afterDownPayment = payment.netFee - payment.downPayment;
                      const remaining = afterDownPayment - customFirstInstallment;
                      const count = payment.installmentCount - 1;
                      
                      if (customFirstInstallment > afterDownPayment) {
                        return <span className="text-red-500 font-medium">⚠️ Tutar çok yüksek!</span>;
                      }
                      if (count <= 0) return null;
                      
                      const eachRemaining = Math.floor(remaining / count);
                      const lastExtra = remaining - (eachRemaining * count);
                      
                      return (
                        <span className="text-teal-600 font-medium bg-teal-100 px-3 py-1.5 rounded-lg">
                          Kalan {count} taksit: {eachRemaining.toLocaleString('tr-TR')} ₺
                          {lastExtra > 0 && <span className="text-xs text-teal-500 ml-1">(+{lastExtra} ₺ son)</span>}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Otomatik/Manuel Mod Seçimi */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            {isManualMode ? (
              <Edit3 className="w-5 h-5 text-orange-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isManualMode ? 'Manuel Düzenleme Modu' : 'Otomatik Hesaplama Modu'}
              </p>
              <p className="text-xs text-slate-500">
                {isManualMode 
                  ? 'Her taksiti ayrı ayrı düzenleyebilirsiniz' 
                  : 'Taksit sayısına göre otomatik hesaplanır'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsManualMode(!isManualMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isManualMode 
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            {isManualMode ? (
              <>
                <ToggleRight className="w-5 h-5" />
                Otomatiğe Geç
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                Manuale Geç
              </>
            )}
          </button>
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
            dropdownPosition="right"
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
                  {isManualMode && (
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">İşlem</th>
                  )}
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
                      {isManualMode ? (
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => updateInstallment(inst.no, { dueDate: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                          {new Date(inst.dueDate).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isManualMode ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={inst.amount || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            updateInstallment(inst.no, { amount: Number(value) || 0 });
                          }}
                          className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          placeholder="0"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {inst.amount.toLocaleString('tr-TR')} ₺
                        </span>
                      )}
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
                    {isManualMode && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeInstallment(inst.no)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Taksiti Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={isManualMode ? 2 : 2} className="px-4 py-3 font-bold text-slate-700">
                    TOPLAM
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600 text-lg">
                    {payment.installments.reduce((sum, i) => sum + i.amount, 0).toLocaleString('tr-TR')} ₺
                  </td>
                  <td colSpan={isManualMode ? 2 : 1}></td>
                </tr>
              </tfoot>
            </table>
            
            {/* Manuel modda taksit ekle butonu */}
            {isManualMode && (
              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={addInstallment}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Taksit Ekle
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Manuel modda taksit yoksa başlat butonu */}
        {isManualMode && payment.installments.length === 0 && (
          <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center">
            <p className="text-slate-500 mb-3">Henüz taksit eklenmedi</p>
            <button
              type="button"
              onClick={addInstallment}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              İlk Taksiti Ekle
            </button>
          </div>
        )}
      </div>
    </Section>
  );
};


