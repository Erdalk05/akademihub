'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  ChevronDown,
  FileText,
  FileDown,
  FileSpreadsheet,
  Eye,
  Inbox,
} from 'lucide-react';

type RecentReport = {
  id: string;
  name: string;
  category: string;
  period: string;
  createdAt: string;
  createdBy: string;
  status: 'completed' | 'processing';
  size: string;
};

export default function ReportHistoryCollapsible() {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Şimdilik boş veri
        if (!cancelled) {
          setReports([]);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Rapor geçmişi alınırken beklenmeyen bir hata oluştu.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-600" />
          Son Oluşturulan Raporlar
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
            {loading ? '...' : reports.length}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm animate-fadeIn">
          {error && (
            <div className="border-b border-gray-200 bg-rose-50 px-4 py-2 text-[11px] text-rose-700">
              {error}
            </div>
          )}
          {loading && !error && (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-500">
              Rapor geçmişi yükleniyor...
            </div>
          )}
          
          {!loading && !error && reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Henüz Rapor Oluşturulmadı</p>
              <p className="mt-1 max-w-sm text-xs text-gray-500">
                Oluşturduğunuz raporlar burada listelenecektir. İlk raporunuzu oluşturmak için 
                yukarıdaki &quot;Yeni Rapor Oluştur&quot; butonunu kullanabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-left">Rapor Adı</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left">Kategori</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left">Dönem</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left">Oluşturulma</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left">Oluşturan</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left">Durum</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'
                      } hover:bg-indigo-50/40`}
                    >
                      <td className="border-b border-gray-100 px-4 py-2 font-medium text-gray-900">
                        {r.name}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-gray-700">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          <FileText className="h-3 w-3 text-gray-500" />
                          {r.category}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-gray-700">{r.period}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-gray-700">{r.createdAt}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-gray-700">{r.createdBy}</td>
                      <td className="border-b border-gray-100 px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                              : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                          }`}
                        >
                          {r.status === 'completed' ? 'Tamamlandı' : 'İşleniyor'}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-gray-600">
                          <button type="button" className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-50" title="Görüntüle">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button type="button" className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-50" title="PDF indir">
                            <FileDown className="h-4 w-4" />
                          </button>
                          <button type="button" className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-50" title="Excel indir">
                            <FileSpreadsheet className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
