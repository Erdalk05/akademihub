'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Star, Calendar, Share2, Loader2 } from 'lucide-react';

type StatCardProps = {
  icon: React.ElementType;
  title: string;
  value: number;
  subtitle: string;
  gradient: string;
  loading?: boolean;
};

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 800;

    const animate = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      setDisplay(Math.round(value * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span>{display.toLocaleString('tr-TR')}</span>;
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  gradient,
  loading,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80" />
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div
            className={`rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-sm`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {title}
        </p>
        {loading ? (
          <div className="mt-2 flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">Yükleniyor...</span>
          </div>
        ) : (
          <>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              <AnimatedNumber value={value} />
            </p>
            <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReportQuickStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    favoriteReports: 0,
    automaticReports: 0,
    sharedReports: 0,
  });

  useEffect(() => {
    // Gerçek veriler için API çağrısı
    const fetchStats = async () => {
      try {
        // TODO: Gerçek API endpoint bağlanacak
        // const res = await fetch('/api/reports/stats');
        // const data = await res.json();
        // if (data.success) setStats(data.data);
        
        // Şimdilik sıfır veri
        setStats({
          totalReports: 0,
          favoriteReports: 0,
          automaticReports: 0,
          sharedReports: 0,
        });
      } catch (error) {
        console.error('Rapor istatistikleri yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      icon: FileText,
      title: 'Toplam Rapor',
      value: stats.totalReports,
      subtitle: stats.totalReports === 0 ? 'Henüz rapor oluşturulmadı' : 'Bu ay oluşturulan',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: Star,
      title: 'Favori Raporlar',
      value: stats.favoriteReports,
      subtitle: stats.favoriteReports === 0 ? 'Favori rapor yok' : 'Sık kullanılan şablonlar',
      gradient: 'from-amber-400 to-amber-500',
    },
    {
      icon: Calendar,
      title: 'Otomatik Raporlar',
      value: stats.automaticReports,
      subtitle: stats.automaticReports === 0 ? 'Otomatik rapor yok' : 'Zamanlanmış raporlar',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Share2,
      title: 'Paylaşılan Raporlar',
      value: stats.sharedReports,
      subtitle: stats.sharedReports === 0 ? 'Paylaşılan rapor yok' : 'Ekip ile paylaşılan',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
      {statCards.map((s) => (
        <StatCard key={s.title} {...s} loading={loading} />
      ))}
    </div>
  );
}
