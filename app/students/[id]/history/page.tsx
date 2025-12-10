'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Clock, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  Hash,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HistoryGroup {
  date: string;
  restructure_date: string;
  reason: string;
  previous_total: number;
  new_total: number;
  previous_installment_count: number;
  new_installment_count: number;
  installments: HistoryRecord[];
  total_paid: number;
  total_amount: number;
}

interface HistoryRecord {
  id: string;
  installment_no: number;
  amount: number;
  paid_amount: number;
  due_date: string;
  paid_at: string | null;
  is_paid: boolean;
  status: string;
  payment_method: string | null;
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  student_no: string;
  class?: string;
}

export default function StudentHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [historyGroups, setHistoryGroups] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Öğrenci bilgilerini al
      const studentRes = await fetch(`/api/students/${studentId}`);
      const studentJson = await studentRes.json();
      if (studentJson.success || studentJson.data) {
        setStudent(studentJson.data || studentJson);
      }

      // Geçmiş bilgilerini al
      const historyRes = await fetch(`/api/students/${studentId}/history`);
      const historyJson = await historyRes.json();
      
      if (historyJson.success) {
        setHistoryGroups(historyJson.data || []);
        setTotalRecords(historyJson.total_records || 0);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number) => `₺${val.toLocaleString('tr-TR')}`;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'yeniden_taksitlendirme': return 'Yeniden Taksitlendirme';
      case 'indirim': return 'İndirim Uygulaması';
      case 'iade': return 'İade İşlemi';
      default: return reason;
    }
  };

  const getDifferenceInfo = (group: HistoryGroup) => {
    const diff = (group.new_total || 0) - (group.previous_total || 0);
    const isIncrease = diff > 0;
    const isDecrease = diff < 0;
    
    return {
      diff: Math.abs(diff),
      isIncrease,
      isDecrease,
      color: isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : 'text-gray-600',
      icon: isIncrease ? TrendingUp : TrendingDown,
      label: isIncrease ? 'Artış' : isDecrease ? 'Azalış' : 'Değişim yok'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Taksit Geçmişi</h1>
            <p className="text-slate-500 text-sm">
              {student ? `${student.first_name} ${student.last_name} • ${student.class || ''} • #${student.student_no}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl">
            <Clock size={18} />
            <span className="font-medium">{totalRecords} Kayıt</span>
          </div>
        </div>

        {/* No History */}
        {historyGroups.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Geçmiş Kaydı Yok</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Bu öğrenci için henüz taksit yeniden yapılandırması yapılmamış veya 
              geçmiş kayıtları oluşturulmadan önce işlem yapılmış olabilir.
            </p>
          </div>
        )}

        {/* History Groups */}
        <div className="space-y-6">
          {historyGroups.map((group, groupIdx) => {
            const diffInfo = getDifferenceInfo(group);
            const DiffIcon = diffInfo.icon;
            
            return (
              <div key={groupIdx} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                {/* Group Header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                        <RefreshCw size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{getReasonLabel(group.reason)}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(group.restructure_date)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Değişim Özeti */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Önceki</p>
                        <p className="font-bold text-slate-700">{formatMoney(group.previous_total || 0)}</p>
                        <p className="text-xs text-slate-400">{group.previous_installment_count} taksit</p>
                      </div>
                      <DiffIcon size={24} className={diffInfo.color} />
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Yeni</p>
                        <p className="font-bold text-slate-700">{formatMoney(group.new_total || 0)}</p>
                        <p className="text-xs text-slate-400">{group.new_installment_count} taksit</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fark Bilgisi */}
                  {diffInfo.diff > 0 && (
                    <div className={`mt-3 flex items-center gap-2 text-sm ${diffInfo.color}`}>
                      <DiffIcon size={16} />
                      <span className="font-medium">
                        {formatMoney(diffInfo.diff)} {diffInfo.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Taksit Tablosu */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Taksit</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vade</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tutar</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ödenen</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Durum</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ödeme Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.installments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Hash size={14} className="text-slate-400" />
                              <span className="font-medium">{inst.installment_no}. Taksit</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(inst.due_date)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatMoney(inst.amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {inst.paid_amount > 0 ? (
                              <span className="font-medium text-emerald-600">{formatMoney(inst.paid_amount)}</span>
                            ) : (
                              <span className="text-slate-400">₺0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {inst.is_paid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                <CheckCircle2 size={12} />
                                Ödendi
                              </span>
                            ) : inst.paid_amount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                <AlertTriangle size={12} />
                                Kısmi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                <XCircle size={12} />
                                Ödenmedi
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {inst.paid_at ? formatDate(inst.paid_at) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">
                          Toplam ({group.installments.length} taksit)
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatMoney(group.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {formatMoney(group.total_paid)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

