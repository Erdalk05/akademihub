'use client';

import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart } from 'lucide-react';

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

const COLORS = ['#4f46e5', '#f97316', '#e5e7eb'];

export default function SalesSummaryCard({
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
    <div className="flex flex-col gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm animate-fadeIn">
      {/* Üst başlık */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Satış Finans Özeti</h2>
        <div className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
          <ShoppingCart className="h-3 w-3" />
          <span>Satış Tutarları ₺</span>
        </div>
      </div>

      {/* 2 kolon */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sol taraf */}
        <div className="space-y-2">
          <Metric label="Toplam Satış Tutarı" value={total} color="text-purple-600" bg="bg-purple-50" />
          <Metric label="Ödenen" value={paid} color="text-emerald-600" bg="bg-emerald-50" />
          <Metric
            label="Kalan"
            value={remaining}
            color={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}
            bg={remaining > 0 ? 'bg-amber-50' : 'bg-emerald-50'}
          />

          <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs">
            <p className="text-[11px] font-medium text-rose-700">Toplam Gecikme Günü</p>
            <p className="text-sm font-semibold text-rose-600">{overdueDays} gün</p>
          </div>
        </div>

        {/* Sağ taraf: pasta grafik */}
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
                <Tooltip formatter={(value: number) => `₺${Number(value || 0).toLocaleString('tr-TR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Satış tahsilat oranı</p>
        </div>
      </div>

      {/* Butonlar */}
      <div className="mt-1 flex flex-wrap gap-2">
        {onRestructure && (
          <button type="button" onClick={onRestructure} className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-purple-700">
            Kalan Borcu Taksitlendir
          </button>
        )}
        {onAddInstallment && (
          <button type="button" onClick={onAddInstallment} className="flex-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
            Yeni Taksit Ekle
          </button>
        )}
      </div>

      {/* Export butonları */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {onExportExcel && (
          <button type="button" onClick={onExportExcel} className="rounded-lg bg-gray-50 px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-100">
            Planı Excel
          </button>
        )}
        {onExportPDF && (
          <button type="button" onClick={onExportPDF} className="rounded-lg bg-gray-50 px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-100">
            Planı PDF
          </button>
        )}
      </div>
    </div>
  );
}

type MetricProps = { label: string; value: number; color: string; bg: string; };

function Metric({ label, value, color, bg }: MetricProps) {
  return (
    <div className={`rounded-xl ${bg} px-3 py-2`}>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>₺{value.toLocaleString('tr-TR')}</p>
    </div>
  );
}
