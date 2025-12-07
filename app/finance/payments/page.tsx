'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, CheckCircle, Trash2, FileText, TrendingUp, Clock, AlertTriangle, Wallet, RefreshCw } from 'lucide-react';
import { PaymentStatusEnum, PaymentMethodEnum } from '@/types/finance.types';
import ReceiptModal from '@/components/finance/ReceiptModal';
import toast from 'react-hot-toast';

export default function PaymentManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatusEnum>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [remotePayments, setRemotePayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentIndex, setStudentIndex] = useState<Record<string, { name: string; code: string }>>({});
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null);
  
  const itemsPerPage = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/installments', { cache: 'no-store' });
      const json = await res.json();
      if (json?.success) setRemotePayments(json.data || []);
    } catch {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/students', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success || !Array.isArray(js.data)) return;

        const map: Record<string, { name: string; code: string }> = {};
        (js.data || []).forEach((stu: any) => {
          const fullName = `${stu.first_name || ''} ${stu.last_name || ''}`.trim() || stu.full_name || 'Ogrenci';
          const code = stu.student_no || stu.ogrenciNo || '';
          map[stu.id] = { name: fullName, code };
        });
        setStudentIndex(map);
      } catch {}
    })();
  }, []);

  const filteredPayments = useMemo(() => {
    const today = new Date();
    const all = (remotePayments || []).map((r: any) => {
      const stuInfo = r.student_id ? studentIndex[r.student_id] : undefined;
      const dueDate = r.due_date ? new Date(r.due_date) : undefined;
      const isPaid = !!r.is_paid;

      let status: PaymentStatusEnum;
      if (isPaid) {
        status = PaymentStatusEnum.PAID;
      } else if (dueDate && dueDate < today) {
        status = PaymentStatusEnum.OVERDUE;
      } else {
        status = PaymentStatusEnum.PENDING;
      }

      const methodRaw = (r.payment_method || '').toLowerCase();
      let paymentMethod: PaymentMethodEnum = PaymentMethodEnum.CASH;
      if (methodRaw === 'bank' || methodRaw === 'bank_transfer' || methodRaw === 'havale') {
        paymentMethod = PaymentMethodEnum.BANK_TRANSFER;
      } else if (methodRaw === 'eft') {
        paymentMethod = PaymentMethodEnum.EFT;
      } else if (methodRaw === 'card' || methodRaw === 'kredi' || methodRaw === 'credit_card') {
        paymentMethod = PaymentMethodEnum.CREDIT_CARD;
      }

      const studentName = r.studentName || stuInfo?.name || '-';
      const studentCode = r.studentNo || stuInfo?.code || '';
      const installmentNo = r.installment_no || 0;

      return {
        id: r.id,
        studentId: r.student_id,
        studentName,
        studentCode,
        installmentNo,
        amount: Number(r.amount) || 0,
        paymentMethod,
        status,
        paymentDate: r.paid_at ? new Date(r.paid_at) : dueDate || today,
        dueDate,
      };
    });

    return all.filter((p) => {
      const term = searchQuery.toLowerCase();
      const matchSearch = p.studentName.toLowerCase().includes(term) || (p.studentCode || '').toLowerCase().includes(term);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, statusFilter, remotePayments, studentIndex]);
  
  const stats = useMemo(() => {
    const paid = filteredPayments.filter(p => p.status === PaymentStatusEnum.PAID);
    const pending = filteredPayments.filter(p => p.status === PaymentStatusEnum.PENDING);
    const overdue = filteredPayments.filter(p => p.status === PaymentStatusEnum.OVERDUE);
    
    return {
      collected: paid.reduce((sum, p) => sum + p.amount, 0),
      pending: pending.reduce((sum, p) => sum + p.amount, 0),
      overdue: overdue.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [filteredPayments]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: PaymentStatusEnum) => {
    const config: Record<string, { bg: string; label: string }> = {
      [PaymentStatusEnum.PAID]: { bg: 'bg-emerald-100 text-emerald-700', label: 'Odendi' },
      [PaymentStatusEnum.PENDING]: { bg: 'bg-amber-100 text-amber-700', label: 'Bekliyor' },
      [PaymentStatusEnum.OVERDUE]: { bg: 'bg-red-100 text-red-700', label: 'Gecikmis' },
      [PaymentStatusEnum.REFUNDED]: { bg: 'bg-blue-100 text-blue-700', label: 'Iade' },
      [PaymentStatusEnum.CANCELLED]: { bg: 'bg-slate-100 text-slate-700', label: 'Iptal' },
    };
    return config[status] || config[PaymentStatusEnum.PENDING];
  };

  const handleMarkAsPaid = async (payment: any) => {
    if (!confirm(`"${payment.studentName}" - ${payment.installmentNo}. taksiti onaylamak istiyor musunuz?`)) return;

    try {
      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payment.id, is_paid: true, paid_at: new Date().toISOString() }),
      });
      
      if (res.ok) {
        setRemotePayments(prev => prev.map(r => r.id === payment.id ? { ...r, is_paid: true, paid_at: new Date().toISOString() } : r));
        toast.success('Odeme onaylandi');
      }
    } catch {
      toast.error('Hata olustu');
    }
  };

  const handleDelete = async (payment: any) => {
    if (!confirm(`"${payment.studentName}" odemesini silmek istiyor musunuz?`)) return;

    try {
      await fetch('/api/installments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payment.id }),
      });
      setRemotePayments(prev => prev.filter(r => r.id !== payment.id));
      toast.success('Odeme silindi');
    } catch {
      toast.error('Silme hatasi');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Odeme Yonetimi</h1>
            <p className="text-slate-500 text-sm">{filteredPayments.length} odeme kaydi</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
              title="Yenile"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
              <Download size={16} />
              Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tahsilat</p>
                <p className="text-lg font-bold text-emerald-600">{(stats.collected / 1000).toFixed(0)}K TL</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Bekleyen</p>
                <p className="text-lg font-bold text-amber-600">{(stats.pending / 1000).toFixed(0)}K TL</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Gecikmis</p>
                <p className="text-lg font-bold text-red-600">{(stats.overdue / 1000).toFixed(0)}K TL</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Wallet size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Alacak</p>
                <p className="text-lg font-bold text-indigo-600">{((stats.pending + stats.overdue) / 1000).toFixed(0)}K TL</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Ogrenci ara..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {[
                { value: 'all', label: 'Tumu' },
                { value: PaymentStatusEnum.PAID, label: 'Odendi' },
                { value: PaymentStatusEnum.PENDING, label: 'Bekliyor' },
                { value: PaymentStatusEnum.OVERDUE, label: 'Gecikmis' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value as any); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    statusFilter === opt.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : paginatedPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText size={48} className="mb-3" />
              <p>Odeme bulunamadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Tarih</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Ogrenci</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Tutar</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Durum</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Islem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.map((p) => {
                    const badge = getStatusBadge(p.status);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-slate-600">
                          {p.paymentDate.toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{p.studentName !== '-' ? p.studentName : 'Isimsiz'}</p>
                          {p.installmentNo > 0 && (
                            <p className="text-xs text-amber-600">{p.installmentNo}. Taksit</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {p.amount.toLocaleString('tr-TR')} TL
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {p.status !== PaymentStatusEnum.PAID && (
                              <button 
                                onClick={() => handleMarkAsPaid(p)}
                                className="p-2 hover:bg-emerald-100 rounded-lg transition text-emerald-600" 
                                title="Onayla"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {p.status === PaymentStatusEnum.PAID && (
                              <button
                                onClick={() => { setSelectedPaymentForReceipt(p); setShowReceiptModal(true); }}
                                className="p-2 hover:bg-indigo-100 rounded-lg transition text-indigo-600"
                                title="Makbuz"
                              >
                                <FileText size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Sayfa {currentPage} / {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Onceki
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showReceiptModal && selectedPaymentForReceipt && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => { setShowReceiptModal(false); setSelectedPaymentForReceipt(null); }}
          payment={{
            id: selectedPaymentForReceipt.id,
            studentName: selectedPaymentForReceipt.studentName,
            studentCode: selectedPaymentForReceipt.studentCode,
            amount: selectedPaymentForReceipt.amount,
            paymentDate: selectedPaymentForReceipt.paymentDate,
            paymentMethod: selectedPaymentForReceipt.paymentMethod,
            installmentNo: selectedPaymentForReceipt.installmentNo,
          }}
        />
      )}
    </div>
  );
}
