'use client';

import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CircleDollarSign } from 'lucide-react';

type Props = {
  total: number;
  paid: number;
  remaining: number;
  overdueDays: number;
  onRestructure?: () => void;
  onAddInstallment?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void | Promise<void>;
};

const COLORS = ['#22c55e', '#f97316', '#e5e7eb'];

export default function FinanceSummaryCard({
  total,
  paid,
  remaining,
  overdueDays,
  onRestructure,
  onAddInstallment,
  onExportExcel,
  onExportPDF,
}: Props) {
  const unpaid = Math.max(total - paid, 0);

  const data = [
    { name: 'Ödenen', value: paid },
    { name: 'Kalan', value: unpaid },
  ];

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm animate-fadeIn"
    >
      {/* Üst başlık */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Finans Özeti</h2>
        <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
          <CircleDollarSign className="h-3 w-3" />
          <span>Tüm tutarlar ₺</span>
        </div>
      </div>

      {/* 2 kolon */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sol taraf */}
        <div className="space-y-2">
          <Metric label="Toplam Borç" value={total} color="text-sky-600" bg="bg-sky-50" />
          <Metric label="Ödenen" value={paid} color="text-emerald-600" bg="bg-emerald-50" />
          <Metric
            label="Kalan"
            value={remaining}
            color={remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}
            bg={remaining > 0 ? 'bg-rose-50' : 'bg-emerald-50'}
          />

          <div className="rounded-xl bg-red-50 px-3 py-2 text-xs">
            <p className="text-[11px] font-medium text-red-700">Toplam Gecikme Günü</p>
            <p className="text-sm font-semibold text-red-600">{overdueDays} gün</p>
          </div>
        </div>

        {/* Sağ tarafta grafik */}
        <div className="flex flex-col items-center justify-center">
          <div className="h-28 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={45}
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value: number) =>
                    `₺${Number(value || 0).toLocaleString('tr-TR')}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Ödenen / Kalan oranı</p>
        </div>
      </div>

      {/* Butonlar */}
      <div className="mt-1 flex flex-wrap gap-2">
        {onRestructure && (
          <button
            type="button"
            onClick={onRestructure}
            className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yeniden Taksitlendir
          </button>
        )}

        {onAddInstallment && (
          <button
            type="button"
            onClick={onAddInstallment}
            className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-all"
          >
            + Yeni Taksit Ekle
          </button>
        )}
      </div>

      {/* Export butonları */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {onExportExcel && (
          <button
            type="button"
            onClick={onExportExcel}
            className="rounded-lg bg-gray-50 px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
          >
            Planı Excel
          </button>
        )}

        {onExportPDF && (
          <button
            type="button"
            onClick={onExportPDF}
            className="rounded-lg bg-gray-50 px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
          >
            Planı PDF
          </button>
        )}
      </div>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: number;
  color: string;
  bg: string;
};

function Metric({ label, value, color, bg }: MetricProps) {
  return (
    <div className={`rounded-xl ${bg} px-3 py-2`}>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>₺{value.toLocaleString('tr-TR')}</p>
    </div>
  );
}
