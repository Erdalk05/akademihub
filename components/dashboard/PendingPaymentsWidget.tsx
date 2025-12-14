'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, DollarSign, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';

interface PendingStats {
  overdueAmount: number;
  overdueCount: number;
  overdueStudents: number;
  todayDueAmount: number;
  todayDueCount: number;
  weekDueAmount: number;
  weekDueCount: number;
}

interface Props {
  onRefresh?: () => void;
  academicYear?: string;
}

export default function PendingPaymentsWidget({ onRefresh, academicYear }: Props) {
  const [stats, setStats] = useState<PendingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { currentOrganization } = useOrganizationStore();

  useEffect(() => {
    fetchPendingStats();
  }, [academicYear, currentOrganization]);

  const fetchPendingStats = async () => {
    setIsRefreshing(true);
    try {
      // Organization filtresi ekle
      const orgParam = currentOrganization?.id ? `&organization_id=${currentOrganization.id}` : '';
      const url = `/api/installments?academicYear=${academicYear || ''}${orgParam}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const installments = result.data || [];
        const now = new Date();
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);

        const unpaid = installments.filter((inst: any) => !inst.is_paid);
        
        const overdue = unpaid.filter((inst: any) => {
          if (!inst.due_date) return false;
          return new Date(inst.due_date) < now;
        });
        
        const overdueAmount = overdue.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
        const overdueCount = overdue.length;
        const overdueStudents = new Set(overdue.map((i: any) => i.student_id)).size;

        const todayDue = unpaid.filter((inst: any) => {
          if (!inst.due_date) return false;
          const dueDate = new Date(inst.due_date);
          return dueDate >= now && dueDate <= todayEnd;
        });
        
        const todayDueAmount = todayDue.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
        const todayDueCount = todayDue.length;

        const weekDue = unpaid.filter((inst: any) => {
          if (!inst.due_date) return false;
          const dueDate = new Date(inst.due_date);
          return dueDate > todayEnd && dueDate <= weekEnd;
        });
        
        const weekDueAmount = weekDue.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
        const weekDueCount = weekDue.length;

        setStats({
          overdueAmount,
          overdueCount,
          overdueStudents,
          todayDueAmount,
          todayDueCount,
          weekDueAmount,
          weekDueCount,
        });
      }
    } catch (error) {
      console.error('Pending stats error:', error);
      setStats({
        overdueAmount: 0,
        overdueCount: 0,
        overdueStudents: 0,
        todayDueAmount: 0,
        todayDueCount: 0,
        weekDueAmount: 0,
        weekDueCount: 0,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-md border-2 border-red-200">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };


  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-md border-2 border-red-200 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          Bekleyen Ödemeler
        </h3>
        <button 
          onClick={fetchPendingStats}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-semibold bg-white px-3 py-1 rounded-lg shadow-sm"
        >
          {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Yenile
        </button>
      </div>

      {/* Overdue Section (Critical) */}
      <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-red-900">Vadesi Geçmiş</span>
          </div>
          <div className="text-xl font-bold text-red-700">
            {formatCurrency(stats?.overdueAmount || 0)}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1">
          <span className="font-medium">{stats?.overdueCount || 0} taksit</span>
          <span>•</span>
          <span className="font-medium">{stats?.overdueStudents || 0} öğrenci</span>
        </div>
      </div>

      {/* Today & Week Due */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-orange-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-orange-900">Bugün</span>
          </div>
          <div className="text-lg font-bold text-orange-700">
            {formatCurrency(stats?.todayDueAmount || 0)}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            {stats?.todayDueCount || 0} taksit
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-yellow-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-900">Bu Hafta</span>
          </div>
          <div className="text-lg font-bold text-yellow-700">
            {formatCurrency(stats?.weekDueAmount || 0)}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            {stats?.weekDueCount || 0} taksit
          </div>
        </div>
      </div>

      {/* Action Button - WhatsApp styled */}
      <Link 
        href="/finance/payments"
        className="w-full bg-gradient-to-r from-[#075E54] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        <DollarSign className="w-5 h-5" />
        Tahsilat Yap
        <ChevronRight className="w-5 h-5" />
      </Link>

      {/* Alert if critical */}
      {stats && stats.overdueAmount > 10000 && (
        <div className="mt-3 pt-3 border-t-2 border-red-200">
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold">Acil takip gerekiyor!</span>
          </div>
        </div>
      )}
    </div>
  );
}
