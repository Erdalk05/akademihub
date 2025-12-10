'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, CheckCircle, ChevronDown, ChevronRight, TrendingUp, Clock, AlertTriangle, Wallet, RefreshCw, User } from 'lucide-react';
import { PaymentStatusEnum } from '@/types/finance.types';
import toast from 'react-hot-toast';

interface StudentGroup {
  studentId: string;
  studentName: string;
  studentCode: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  installments: any[];
  hasOverdue: boolean;
}

export default function PaymentManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [remotePayments, setRemotePayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentIndex, setStudentIndex] = useState<Record<string, { name: string; code: string }>>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

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

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/students', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success || !Array.isArray(js.data)) return;

        const map: Record<string, { name: string; code: string }> = {};
        (js.data || []).forEach((stu: any) => {
          const fullName = `${stu.first_name || ''} ${stu.last_name || ''}`.trim() || stu.full_name || 'Ogrenci';
          const code = stu.student_no || '';
          map[stu.id] = { name: fullName, code };
        });
        setStudentIndex(map);
      } catch {}
    })();
  }, []);

  // Öğrenci bazlı gruplama
  const studentGroups = useMemo(() => {
    const today = new Date();
    const groups: Record<string, StudentGroup> = {};

    (remotePayments || []).forEach((r: any) => {
      const studentId = r.student_id || 'unknown';
      const stuInfo = studentIndex[studentId];
      const dueDate = r.due_date ? new Date(r.due_date) : undefined;
      const isPaid = !!r.is_paid;
      const amount = Number(r.amount) || 0;

      let status: 'paid' | 'pending' | 'overdue';
      if (isPaid) {
        status = 'paid';
      } else if (dueDate && dueDate < today) {
        status = 'overdue';
      } else {
        status = 'pending';
      }

      if (!groups[studentId]) {
        groups[studentId] = {
          studentId,
          studentName: stuInfo?.name || r.studentName || 'Bilinmeyen',
          studentCode: stuInfo?.code || r.studentNo || '',
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          installments: [],
          hasOverdue: false,
        };
      }

      groups[studentId].totalAmount += amount;
      if (status === 'paid') groups[studentId].paidAmount += amount;
      if (status === 'pending') groups[studentId].pendingAmount += amount;
      if (status === 'overdue') {
        groups[studentId].overdueAmount += amount;
        groups[studentId].hasOverdue = true;
      }

      groups[studentId].installments.push({
        id: r.id,
        installmentNo: r.installment_no || 0,
        amount,
        dueDate,
        status,
        paidAt: r.paid_at,
      });
    });

    // Taksitleri sırala
    Object.values(groups).forEach(g => {
      g.installments.sort((a, b) => a.installmentNo - b.installmentNo);
    });

    return Object.values(groups);
  }, [remotePayments, studentIndex]);

  // Filtreleme
  const filteredGroups = useMemo(() => {
    return studentGroups.filter(g => {
      const term = searchQuery.toLowerCase();
      const matchSearch = g.studentName.toLowerCase().includes(term) || g.studentCode.toLowerCase().includes(term);
      
      if (!matchSearch) return false;
      
      if (statusFilter === 'all') return true;
      if (statusFilter === 'overdue') return g.overdueAmount > 0;
      if (statusFilter === 'pending') return g.pendingAmount > 0;
      if (statusFilter === 'paid') return g.paidAmount > 0 && g.pendingAmount === 0 && g.overdueAmount === 0;
      
      return true;
    });
  }, [studentGroups, searchQuery, statusFilter]);

  // İstatistikler
  const stats = useMemo(() => {
    return {
      collected: studentGroups.reduce((sum, g) => sum + g.paidAmount, 0),
      pending: studentGroups.reduce((sum, g) => sum + g.pendingAmount, 0),
      overdue: studentGroups.reduce((sum, g) => sum + g.overdueAmount, 0),
      studentCount: studentGroups.length,
    };
  }, [studentGroups]);

  const toggleStudent = (studentId: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleMarkAsPaid = async (installment: any, studentName: string) => {
    if (!confirm(`${studentName} - ${installment.installmentNo}. taksiti onayla?`)) return;

    try {
      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: installment.id, is_paid: true, paid_at: new Date().toISOString() }),
      });
      
      if (res.ok) {
        fetchData();
        toast.success('Ödeme onaylandı');
      }
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const formatMoney = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toLocaleString('tr-TR');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Ödeme Yönetimi</h1>
            <p className="text-slate-500 text-sm">{filteredGroups.length} öğrenci</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
              <Download size={14} />
              Excel
            </button>
          </div>
        </div>

        {/* Stats - Kompakt */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
            <p className="text-xs text-slate-500">Tahsilat</p>
            <p className="text-lg font-bold text-emerald-600">{formatMoney(stats.collected)} ₺</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
            <p className="text-xs text-slate-500">Bekleyen</p>
            <p className="text-lg font-bold text-amber-600">{formatMoney(stats.pending)} ₺</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
            <p className="text-xs text-slate-500">Gecikmiş</p>
            <p className="text-lg font-bold text-red-600">{formatMoney(stats.overdue)} ₺</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
            <p className="text-xs text-slate-500">Öğrenci</p>
            <p className="text-lg font-bold text-indigo-600">{stats.studentCount}</p>
          </div>
        </div>

        {/* Filtreler - Kompakt */}
        <div className="bg-white rounded-lg border border-slate-100 p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Öğrenci ara..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'pending', label: 'Bekleyen' },
                { value: 'overdue', label: 'Gecikmiş' },
                { value: 'paid', label: 'Tamamlanan' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value as any)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    statusFilter === opt.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Öğrenci Listesi - Accordion */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-100 p-10 text-center text-slate-400">
              <User size={40} className="mx-auto mb-2 opacity-50" />
              <p>Öğrenci bulunamadı</p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = expandedStudents.has(group.studentId);
              const remainingAmount = group.pendingAmount + group.overdueAmount;
              const progress = group.totalAmount > 0 ? (group.paidAmount / group.totalAmount) * 100 : 0;
              
              return (
                <div key={group.studentId} className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                  {/* Öğrenci Özet Satırı */}
                  <button
                    onClick={() => toggleStudent(group.studentId)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{group.studentName}</span>
                        {group.hasOverdue && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-medium rounded">
                            GECİKMİŞ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">{group.installments.length} taksit</span>
                        {/* Progress Bar */}
                        <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">%{progress.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {remainingAmount > 0 ? `${formatMoney(remainingAmount)} ₺` : '✓'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {group.paidAmount > 0 && `${formatMoney(group.paidAmount)} ₺ ödendi`}
                      </p>
                    </div>
                  </button>

                  {/* Taksit Detayları */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      <div className="divide-y divide-slate-100">
                        {group.installments.map((inst) => (
                          <div key={inst.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                            <span className="w-16 text-slate-500">
                              {inst.installmentNo === 0 ? 'Peşinat' : `${inst.installmentNo}. Taksit`}
                            </span>
                            <span className="w-20 text-slate-600">
                              {inst.dueDate?.toLocaleDateString('tr-TR') || '-'}
                            </span>
                            <span className="flex-1 font-medium text-slate-900">
                              {inst.amount.toLocaleString('tr-TR')} ₺
                            </span>
                            
                            {inst.status === 'paid' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                Ödendi
                              </span>
                            ) : inst.status === 'overdue' ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                Gecikmiş
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                Bekliyor
                              </span>
                            )}

                            {inst.status !== 'paid' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(inst, group.studentName); }}
                                className="p-1.5 hover:bg-emerald-100 rounded text-emerald-600"
                                title="Ödendi olarak işaretle"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
