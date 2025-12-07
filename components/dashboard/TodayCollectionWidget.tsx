'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, CreditCard, Users, Loader2 } from 'lucide-react';

interface TodayStats {
  totalCollected: number;
  paymentCount: number;
  studentCount: number;
  averagePayment: number;
  dailyTarget: number;
  targetPercentage: number;
}

interface Props {
  onRefresh?: () => void;
  academicYear?: string;
}

export default function TodayCollectionWidget({ onRefresh, academicYear }: Props) {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodayStats();
  }, [academicYear]);

  const fetchTodayStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString();

      const url = academicYear 
        ? `/api/installments?academicYear=${academicYear}` 
        : '/api/installments';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const installments = result.data || [];
        
        const todayPayments = installments.filter((inst: any) => {
          if (!inst.is_paid || !inst.paid_at) return false;
          const paidDate = new Date(inst.paid_at);
          return paidDate >= new Date(todayStart) && paidDate < new Date(todayEnd);
        });

        const totalCollected = todayPayments.reduce((sum: number, p: any) => 
          sum + (p.paid_amount || 0), 0
        );
        
        const paymentCount = todayPayments.length;
        const uniqueStudents = new Set(todayPayments.map((p: any) => p.student_id));
        const studentCount = uniqueStudents.size;
        const averagePayment = paymentCount > 0 ? totalCollected / paymentCount : 0;

        const monthlyTarget = 500000;
        const dailyTarget = monthlyTarget / 30;
        const targetPercentage = dailyTarget > 0 ? (totalCollected / dailyTarget) * 100 : 0;

        setStats({
          totalCollected,
          paymentCount,
          studentCount,
          averagePayment,
          dailyTarget,
          targetPercentage,
        });
      }
    } catch (error) {
      console.error('Today stats error:', error);
      setStats({
        totalCollected: 0,
        paymentCount: 0,
        studentCount: 0,
        averagePayment: 0,
        dailyTarget: 500000 / 30,
        targetPercentage: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#DCF8C6] to-[#E7FFDB] rounded-2xl p-6 shadow-md border-2 border-[#25D366]/30">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-[#075E54] animate-spin" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-gradient-to-br from-[#DCF8C6] to-[#E7FFDB] rounded-2xl p-6 shadow-md border-2 border-[#25D366]/30 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#075E54] flex items-center gap-2">
          <div className="w-8 h-8 bg-[#25D366] rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          Bugünkü Tahsilat
        </h3>
        <button 
          onClick={fetchTodayStats}
          className="text-[#128C7E] hover:text-[#075E54] text-sm font-semibold bg-white px-3 py-1 rounded-lg shadow-sm"
        >
          Yenile
        </button>
      </div>

      {/* Main Amount */}
      <div className="mb-4 bg-white/60 rounded-2xl p-4">
        <div className="text-4xl font-bold text-[#075E54]">
          {formatCurrency(stats?.totalCollected || 0)}
        </div>
        <div className="text-sm text-[#128C7E] mt-1 font-medium">
          Toplam Tahsilat
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#25D366]/20">
          <div className="flex items-center justify-center mb-1">
            <CreditCard className="w-5 h-5 text-[#25D366]" />
          </div>
          <div className="text-xl font-bold text-[#075E54]">{stats?.paymentCount || 0}</div>
          <div className="text-xs text-gray-600">İşlem</div>
        </div>

        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#25D366]/20">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-5 h-5 text-[#25D366]" />
          </div>
          <div className="text-xl font-bold text-[#075E54]">{stats?.studentCount || 0}</div>
          <div className="text-xs text-gray-600">Öğrenci</div>
        </div>

        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#25D366]/20">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-5 h-5 text-[#25D366]" />
          </div>
          <div className="text-xl font-bold text-[#075E54]">
            {formatCurrency(stats?.averagePayment || 0)}
          </div>
          <div className="text-xs text-gray-600">Ortalama</div>
        </div>
      </div>

      {/* Hedef Karşılaştırma */}
      {stats && (
        <div className="mt-4 pt-4 border-t-2 border-[#25D366]/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#075E54] font-medium">Günlük Hedef</span>
            <span className="text-[#075E54] font-bold">
              {formatCurrency(stats.dailyTarget)}
            </span>
          </div>
          
          {/* Progress Bar - WhatsApp styled */}
          <div className="relative w-full h-4 bg-white rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                stats.targetPercentage >= 100 
                  ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E]' 
                  : stats.targetPercentage >= 50
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                  : 'bg-gradient-to-r from-orange-400 to-orange-500'
              }`}
              style={{ width: `${Math.min(stats.targetPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs font-semibold ${
              stats.targetPercentage >= 100 
                ? 'text-[#075E54]' 
                : stats.targetPercentage >= 50
                ? 'text-yellow-700'
                : 'text-orange-700'
            }`}>
              {stats.targetPercentage >= 100 ? '🎉 Hedef aşıldı!' : 
               stats.targetPercentage >= 50 ? '💪 Hedefe yakın' : 
               '📈 Devam edelim'}
            </span>
            <span className="text-sm font-bold text-[#075E54] bg-white px-2 py-0.5 rounded-lg">
              %{stats.targetPercentage.toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
