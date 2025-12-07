'use client';

import React from 'react';
import { FinanceInstallment } from '@/lib/types/finance';
import { CheckCircle2, Calendar, FileText, Edit } from 'lucide-react';

interface Props {
  installments: FinanceInstallment[];
  onEdit?: (id: string) => void;
  onReceipt?: (id: string) => void;
}

export default function OldPaymentsTable({ installments, onEdit, onReceipt }: Props) {
  if (!installments || installments.length === 0) {
    return null;
  }

  // Ödeme sırasına göre sırala: önce paid_at, yoksa due_date
  const sorted = [...installments].sort((a, b) => {
    const aDateStr = a.paid_at || a.due_date;
    const bDateStr = b.paid_at || b.due_date;
    if (!aDateStr || !bDateStr) return 0;
    const aTime = new Date(aDateStr).getTime();
    const bTime = new Date(bDateStr).getTime();
    return aTime - bTime;
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Ödenmiş Taksitler (Eski Plan)
          </h2>
          <p className="text-xs text-slate-500">
            Yapılandırmadan önce tahsil edilen eski taksitler. Sadece görüntüleme içindir.
          </p>
        </div>
      </div>

      <table className="w-full min-w-[720px] text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 font-semibold text-slate-600">Taksit</th>
            <th className="px-6 py-3 font-semibold text-slate-600">Vade</th>
            <th className="px-6 py-3 font-semibold text-slate-600">Ödeme Tarihi</th>
            <th className="px-6 py-3 font-semibold text-slate-600 text-right">Tutar</th>
            <th className="px-6 py-3 font-semibold text-slate-600 text-center">Durum</th>
            <th className="px-6 py-3 font-semibold text-slate-600 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((inst, idx) => {
            const amount = Number(inst.amount) || 0;

            return (
              <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3 font-medium text-slate-900">
                  E{idx + 1}
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {inst.due_date
                    ? new Date(inst.due_date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {inst.paid_at ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(inst.paid_at).toLocaleDateString('tr-TR')}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-3 text-right font-medium text-slate-900">
                  ₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    Ödendi
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onReceipt && (
                      <button
                        type="button"
                        onClick={() => onReceipt(inst.id)}
                        className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        title="Ödeme Makbuzu"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(inst.id)}
                        className="p-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                        title="Ödemeyi Düzelt"
                      >
                        <Edit size={16} />
                      </button>
                    )}
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


