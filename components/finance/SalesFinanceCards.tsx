'use client';

import React from 'react';
import { ShoppingCart, Users, Wallet, PieChart } from 'lucide-react';

type SalesFinanceStats = {
  totalSales: number;
  last30Net: number;
  studentNet: number;
  externalNet: number;
  topProductName: string | null;
};

interface Props {
  stats: SalesFinanceStats;
}

export default function SalesFinanceCards({ stats }: Props) {
  const cards = [
    {
      label: 'Toplam Satış',
      value: stats.totalSales,
      icon: ShoppingCart,
      color: 'bg-purple-500/15 text-purple-300',
      desc: 'Kayıtlı satış adedi',
    },
    {
      label: 'Son 30 Gün Net Satış',
      value: `₺${stats.last30Net.toLocaleString('tr-TR')}`,
      icon: Wallet,
      color: 'bg-cyan-500/15 text-cyan-300',
      desc: 'Tüm müşteriler',
    },
    {
      label: 'Öğrenci Satışları',
      value: `₺${stats.studentNet.toLocaleString('tr-TR')}`,
      icon: Users,
      color: 'bg-emerald-500/15 text-emerald-300',
      desc: 'Öğrenci müşteriler',
    },
    {
      label: 'Harici Müşteri Satışları',
      value: `₺${stats.externalNet.toLocaleString('tr-TR')}`,
      icon: Users,
      color: 'bg-amber-500/15 text-amber-300',
      desc: 'Okul dışı müşteriler',
    },
    {
      label: 'En Çok Satan Ürün',
      value: stats.topProductName || '-',
      icon: PieChart,
      color: 'bg-pink-500/15 text-pink-300',
      desc: 'Son 30 gün',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, idx) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.65)] transition-all hover:shadow-[0_24px_60px_rgba(15,23,42,0.9)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-300/80">
                {card.label}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">{card.value}</h3>
              <p className="mt-1 text-[10px] text-slate-400">{card.desc}</p>
            </div>
            <div className={`rounded-xl p-2.5 shadow-inner ${card.color}`}>
              <card.icon size={20} />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-6 bottom-1 flex justify-end opacity-20">
            <div className="h-6 w-24 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 blur-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

