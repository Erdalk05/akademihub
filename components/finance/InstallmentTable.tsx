'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FinanceInstallment } from '@/lib/types/finance';
import { CheckCircle2, Clock, AlertCircle, CreditCard, FileText, Edit, User, Calendar, MessageSquare, MoreVertical, Trash2, DollarSign, MessageCircle } from 'lucide-react';
import { usePermission } from '@/lib/hooks/usePermission';

interface Props {
  installments: FinanceInstallment[];
  onPay: (id: string) => void;
  onEdit: (id: string) => void;
  onReceipt: (id: string) => void;
  onWhatsApp?: (installment: FinanceInstallment) => void;
  /**
   * Kaynak bağlamı:
   * - 'education' → Eğitim taksitleri
   * - 'sale'      → Satış taksitleri
   * Not: Eğer taksit kaydının kendi source alanı doluysa o önceliklidir.
   *
   * Eski dokümantasyondaki <InstallmentsTable source="sale" ... /> kullanımını
   * desteklemek için hem source hem sourceContext alanları okunur.
   */
  source?: 'education' | 'sale';
  /**
   * Opsiyonel bağlam bilgisi:
   * - education: Öğrenci eğitim taksitleri ekranı
   * - sale: Satış taksitleri ekranı
   * Not: Eğer taksit kaydının kendi source alanı doluysa o önceliklidir.
   */
  sourceContext?: 'education' | 'sale';
  /** İlgili satış kaydı (varsa) – sadece satış ekranında kullanılır */
  saleId?: string | null;
  /** İlgili öğrenci kimliği – hem eğitim hem satış taksitlerinde ortak alan */
  studentId?: string | null;
}

export default function InstallmentTable({
  installments,
  onPay,
  onEdit,
  onReceipt,
  onWhatsApp,
  source,
  sourceContext,
}: Props) {
  const router = useRouter();
  const { canCollectPayment, canEditInstallment, canDeleteInstallment } = usePermission();
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Sort by due date
  const sorted = useMemo(() => {
    if (!installments || installments.length === 0) return [];
    return [...installments].sort((a, b) => 
      (a.due_date && b.due_date) ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : 0
    );
  }, [installments]);

  // Calculate unpaid installments (for bulk payment)
  const unpaidInstallments = useMemo(() => {
    return sorted.filter(inst => {
      const amount = Number(inst.amount) || 0;
      const paid = Number(inst.paid_amount) || 0;
      const remaining = amount - paid;
      return !inst.is_paid && remaining > 0.01;
    });
  }, [sorted]);

  // Calculate selected total
  const selectedTotal = useMemo(() => {
    return selectedIds.reduce((sum, id) => {
      const inst = sorted.find(i => i.id === id);
      if (!inst) return sum;
      const amount = Number(inst.amount) || 0;
      const paid = Number(inst.paid_amount) || 0;
      const remaining = amount - paid;
      return sum + remaining;
    }, 0);
  }, [selectedIds, sorted]);

  // Early return after all hooks
  if (!installments || installments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="bg-gray-100 p-4 rounded-full mb-3">
          <FileText size={24} className="text-gray-400" />
        </div>
        <p>Henüz bir ödeme planı oluşturulmamış.</p>
      </div>
    );
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.length === unpaidInstallments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unpaidInstallments.map(i => i.id));
    }
  };

  // Handle single select
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Handle bulk payment
  const handleBulkPayment = () => {
    if (selectedIds.length === 0) return;
    // Call onPay for each selected installment
    // In a real scenario, you might want to create a bulk payment modal
    const confirmed = confirm(`${selectedIds.length} taksit için toplam ₺${selectedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} tahsil edilecek. Onaylıyor musunuz?`);
    if (confirmed) {
      selectedIds.forEach(id => onPay(id));
      setSelectedIds([]);
    }
  };

  return (
    <div className="pb-12 relative">
      {/* Floating Action Bar - Shows when items are selected */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 min-w-[500px] border border-indigo-400/30">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full h-8 w-8 flex items-center justify-center font-bold">
              {selectedIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium opacity-90">Seçili Taksit</span>
              <span className="text-lg font-bold">
                ₺{selectedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div className="flex-1" />
          
          <button
            onClick={handleBulkPayment}
            className="bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
          >
            <DollarSign size={18} />
            Toplu Tahsil Et
          </button>
          
          <button
            onClick={() => setSelectedIds([])}
            className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
          >
            İptal
          </button>
        </div>
      )}

      <table className="w-full min-w-0 text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {/* Checkbox Column */}
            <th className="px-4 py-3 w-12">
              <input
                type="checkbox"
                checked={unpaidInstallments.length > 0 && selectedIds.length === unpaidInstallments.length}
                onChange={handleSelectAll}
                disabled={unpaidInstallments.length === 0}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </th>
            <th className="px-6 py-3 font-semibold text-gray-600">Taksit</th>
            <th className="px-6 py-3 font-semibold text-gray-600">Kaynak</th>
            <th className="px-6 py-3 font-semibold text-gray-600">Vade Tarihi</th>
            <th className="px-6 py-3 font-semibold text-gray-600">Ödeme Tarihi</th>
            <th className="px-6 py-3 font-semibold text-gray-600 text-right">Planlanan</th>
            <th className="px-6 py-3 font-semibold text-gray-600 text-right">Ödenen</th>
            <th className="px-6 py-3 font-semibold text-gray-600 text-right">Kalan</th>
            <th className="px-6 py-3 font-semibold text-gray-600 text-center">Durum</th>
            <th className="px-6 py-3 font-semibold text-gray-600">Tahsil Eden</th>
            <th className="px-6 py-3 font-semibold text-gray-600 text-center">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((inst) => {
            const amount = Number(inst.amount) || 0;
            const paid = Number(inst.paid_amount) || 0;
            const remaining = amount - paid;
            // Precision check for float comparisons
            const isFullyPaid = inst.is_paid || remaining <= 0.01;
            
            // Status Logic
            const today = new Date();
            const dueDate = inst.due_date ? new Date(inst.due_date) : null;
            const isOverdue = !isFullyPaid && dueDate && dueDate < today;
            const isPartial = !isFullyPaid && paid > 0;

            // education / sale ayrımı – taksit kaydında yoksa, tablo bağlamından al
            const effectiveSource = inst.source || source || sourceContext || 'education';
            const isSale = effectiveSource === 'sale';
            
            const isSelected = selectedIds.includes(inst.id);
            const canBeSelected = !isFullyPaid && remaining > 0.01;

            return (
              <tr 
                key={inst.id} 
                className={`transition-all ${
                  isSelected 
                    ? 'bg-indigo-50 border-l-4 border-indigo-500' 
                    : 'hover:bg-gray-50/50 border-l-4 border-transparent'
                }`}
              >
                {/* Checkbox */}
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectRow(inst.id)}
                    disabled={!canBeSelected}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </td>

                {/* No (Yeni Plan: Y1, Y2 ...) */}
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex flex-col gap-1">
                    <span>{`Y${inst.installment_no}`}</span>
                    {inst.note && inst.note.startsWith('Satış') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inst.agreement_id) {
                            router.push(`/finance/sales/${inst.agreement_id}`);
                          }
                        }}
                        className="inline-flex max-w-[180px] items-center truncate rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        {inst.note}
                      </button>
                    )}
                  </div>
                </td>

                {/* Source (Eğitim / Satış) */}
                <td className="px-6 py-4">
                  {isSale ? (
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 border border-purple-100">
                      Satış
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-100">
                      Eğitim
                    </span>
                  )}
                </td>

                {/* Due Date */}
                <td className="px-6 py-4 text-gray-600">
                  {dueDate ? dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  {isOverdue && (
                    <span className="block text-[10px] text-red-500 font-medium mt-0.5">
                         Gecikmede
                    </span>
                  )}
                </td>

                 {/* Paid Date */}
                 <td className="px-6 py-4 text-gray-600">
                  {inst.paid_at ? (
                      <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(inst.paid_at).toLocaleDateString('tr-TR')}
                      </div>
                  ) : '-'}
                </td>

                {/* Amounts */}
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  ₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                  {paid > 0 ? `₺${paid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">
                  {remaining > 0.01 ? `₺${remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : 
                   <span className="text-gray-400">0.00</span>
                  }
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4 text-center">
                  {isFullyPaid ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isSale ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                      <CheckCircle2 size={12} />
                      Ödendi
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      <AlertCircle size={12} />
                      Gecikmiş
                    </span>
                  ) : isPartial ? (
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isSale ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                      <Clock size={12} />
                      Kısmi Ödeme
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      <Clock size={12} />
                      Bekliyor
                    </span>
                  )}
                </td>

                 {/* Collected By */}
                 <td className="px-6 py-4 text-gray-600">
                  {inst.collected_by ? (
                      <div className="flex items-center gap-1.5 text-xs">
                          <User size={14} className="text-gray-400" />
                          <span title={inst.collected_by} className="max-w-[100px] truncate">
                              {inst.collected_by.length > 10 ? 'Admin' : inst.collected_by} 
                          </span>
                      </div>
                  ) : '-'}
                </td>

                {/* Actions - Three Dots Menu */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === inst.id ? null : inst.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openMenuId === inst.id && (
                        <>
                          {/* Backdrop to close menu */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenuId(null)}
                          />
                          
                          {/* Dropdown Menu */}
                          <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-20">
                            {/* Pay Single */}
                            {!isFullyPaid && canCollectPayment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPay(inst.id);
                                  setOpenMenuId(null);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-colors ${
                                  isSale
                                    ? 'text-purple-700 hover:bg-purple-50'
                                    : 'text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                <CreditCard size={16} />
                                Tek Ödeme Al
                              </button>
                            )}
                            
                            {/* WhatsApp Hatırlatma */}
                            {!isFullyPaid && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onWhatsApp) {
                                    onWhatsApp(inst);
                                  } else {
                                    // Fallback: Direkt WhatsApp aç
                                    const msg = encodeURIComponent(
                                      `Sayın Veli,\n\n${inst.installment_no}. taksit ödemesini hatırlatmak isteriz.\n\nVade: ${inst.due_date ? new Date(inst.due_date).toLocaleDateString('tr-TR') : '-'}\nTutar: ₺${((inst.amount || 0) - (inst.paid_amount || 0)).toLocaleString('tr-TR')}\n\nSaygılarımızla,\nAkademiHub`
                                    );
                                    window.open(`https://wa.me/?text=${msg}`, '_blank');
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-green-700 hover:bg-green-50 flex items-center gap-3 transition-colors"
                              >
                                <MessageCircle size={16} />
                                Hatırlatma Gönder
                              </button>
                            )}
                            
                            {/* View Receipt */}
                            {(isFullyPaid || isPartial) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReceipt(inst.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <FileText size={16} />
                                Makbuz Görüntüle
                              </button>
                            )}
                            
                            {/* WhatsApp ile Gönder */}
                            {(isFullyPaid || isPartial) && onWhatsApp && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onWhatsApp(inst);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-green-700 hover:bg-green-50 flex items-center gap-3 transition-colors"
                              >
                                <MessageCircle size={16} />
                                WhatsApp ile Gönder
                              </button>
                            )}
                            
                            {/* Edit Payment */}
                            {(isFullyPaid || isPartial) && canEditInstallment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(inst.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors"
                              >
                                <Edit size={16} />
                                Ödemeyi Düzenle
                              </button>
                            )}
                            
                            {/* Divider */}
                            {!isFullyPaid && canDeleteInstallment && (
                              <div className="my-1 h-px bg-gray-100" />
                            )}
                            
                            {/* Delete (Optional - can be removed if not needed) */}
                            {!isFullyPaid && canDeleteInstallment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Bu taksiti silmek istediğinize emin misiniz?')) {
                                    // Add onDelete handler if needed
                                    alert('Silme işlemi henüz aktif değil');
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 size={16} />
                                Taksiti Sil
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
    </div>
  );
}
