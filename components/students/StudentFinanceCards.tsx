import React from 'react';
import { Users, AlertCircle, Clock, CheckCircle, Wallet, UserPlus, UserMinus, GraduationCap, TrendingUp, Calendar } from 'lucide-react';

interface StudentFinanceStats {
  totalStudents: number;
  studentsWithDebt: number;
  delayedStudents: number;
  collectedThisMonth: number;
  totalOpenBalance: number;
  // Yeni alanlar
  newStudentsThisMonth?: number;
  newStudentsThisYear?: number;
  deletedStudents?: number;
  passiveStudents?: number;
  graduatedStudents?: number;
  paymentRate?: number;
}

interface Props {
  stats: StudentFinanceStats;
}

export default function StudentFinanceCards({ stats }: Props) {
  // Ana kartlar (her zaman görünür)
  const mainCards = [
    {
      label: 'Toplam Öğrenci',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      desc: 'Aktif kayıtlı',
    },
    {
      label: 'Borcu Olan',
      value: stats.studentsWithDebt,
      icon: AlertCircle,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      desc: 'Ödeme bekleyen',
    },
    {
      label: 'Gecikmede',
      value: stats.delayedStudents,
      icon: Clock,
      color: 'bg-red-50 text-red-600 border-red-200',
      desc: 'Vadesi geçmiş',
    },
    {
      label: 'Bu Ay Tahsilat',
      value: `₺${stats.collectedThisMonth.toLocaleString('tr-TR')}`,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      desc: 'Başarılı işlem',
    },
    {
      label: 'Açık Bakiye',
      value: `₺${stats.totalOpenBalance.toLocaleString('tr-TR')}`,
      icon: Wallet,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      desc: 'Toplam alacak',
    },
  ];

  // İkincil kartlar (ek istatistikler)
  const secondaryCards = [
    {
      label: 'Bu Ay Yeni Kayıt',
      value: stats.newStudentsThisMonth ?? 0,
      icon: UserPlus,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      desc: 'Son 30 gün',
    },
    {
      label: 'Bu Yıl Kayıt',
      value: stats.newStudentsThisYear ?? 0,
      icon: Calendar,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      desc: '2024-2025 dönemi',
    },
    {
      label: 'Pasif/Ayrılan',
      value: stats.passiveStudents ?? 0,
      icon: UserMinus,
      color: 'bg-gray-50 text-gray-600 border-gray-200',
      desc: 'Kaydı silinen',
    },
    {
      label: 'Mezun',
      value: stats.graduatedStudents ?? 0,
      icon: GraduationCap,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      desc: 'Tamamlayan',
    },
    {
      label: 'Tahsilat Oranı',
      value: `%${stats.paymentRate?.toFixed(1) ?? 0}`,
      icon: TrendingUp,
      color: stats.paymentRate && stats.paymentRate >= 70 
        ? 'bg-green-50 text-green-600 border-green-200' 
        : 'bg-amber-50 text-amber-600 border-amber-200',
      desc: 'Ödeme başarısı',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Ana Kartlar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {mainCards.map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${card.color.split(' ')[2] || 'border-gray-100'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <h3 className="mt-1 text-xl font-bold text-gray-900">{card.value}</h3>
                <p className="mt-1 text-[10px] text-gray-400">{card.desc}</p>
              </div>
              <div className={`rounded-lg p-2 ${card.color.split(' ').slice(0, 2).join(' ')}`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* İkincil Kartlar (Daha Küçük) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {secondaryCards.map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md ${card.color.split(' ')[2] || 'border-gray-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-1.5 ${card.color.split(' ').slice(0, 2).join(' ')}`}>
                <card.icon size={16} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-500">{card.label}</p>
                <h3 className="text-sm font-bold text-gray-900">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
