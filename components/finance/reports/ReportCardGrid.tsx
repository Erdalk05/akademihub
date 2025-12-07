'use client';

import React from 'react';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Zap,
  History,
  MoreVertical,
  Star,
  Clock,
} from 'lucide-react';
import {
  REPORT_DEFINITIONS,
  ReportCategory,
  ReportDefinition,
} from './reportConfig';

function categoryBorder(category: ReportCategory) {
  switch (category) {
    case 'income':
      return 'bg-[hsl(142,76%,36%)]';
    case 'expense':
      return 'bg-[hsl(0,72%,51%)]';
    case 'student':
      return 'bg-[hsl(221,83%,53%)]';
    case 'analysis':
      return 'bg-[hsl(262,83%,58%)]';
    case 'risk':
      return 'bg-[hsl(38,92%,50%)]';
    default:
      return 'bg-gray-300';
  }
}

type Props = {
  onCreateReport?: (report: ReportDefinition) => void;
};

export default function ReportCardGrid({ onCreateReport }: Props) {
  const reports = REPORT_DEFINITIONS;

  if (!reports.length) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-900">
          Henüz kayıtlı rapor şablonu yok
        </p>
        <p className="mt-1 max-w-md text-xs text-gray-600">
          İlk rapor şablonunuzu oluşturarak başlayın. Sık kullandığınız finans,
          öğrenci veya akademik raporları burada kaydedebilirsiniz.
        </p>
        {onCreateReport && (
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            onClick={() => onCreateReport(REPORT_DEFINITIONS[0])}
          >
            <FileText className="h-4 w-4" />
            Yeni Rapor Oluştur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => {
        const Icon = report.icon;
        const borderClass = categoryBorder(report.category);
        return (
          <div
            key={report.id}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${borderClass}`} />

            {/* Favori badge */}
            {report.isFavorite && (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                <Star className="h-3 w-3" />
                Favori
              </span>
            )}

            <div className="p-5 pb-4">
              {/* Icon + title */}
              <div className="mb-4 flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${report.gradient} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">
                        {report.name}
                      </h2>
                      <p className="mt-1 text-xs text-gray-600">
                        {report.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                  <Clock className="h-3 w-3" />
                  {report.estimatedTime}
                </span>
                {report.lastGenerated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                    <History className="h-3 w-3" />
                    {report.lastGenerated}
                  </span>
                )}
                {report.isAutomatic && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-100">
                    <Zap className="h-3 w-3" />
                    Otomatik
                  </span>
                )}
              </div>

              {/* Mini preview */}
              {report.lastTotal && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                  <p className="mb-1 text-[11px] font-medium text-gray-500">
                    Son Rapor Özeti
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{report.lastTotal}</span>
                    {report.lastTrend && report.lastChange && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          report.lastTrend === 'up'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {report.lastTrend === 'up' ? '↑' : '↓'}{' '}
                        {report.lastChange}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-auto border-t border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  onClick={() => onCreateReport?.(report)}
                >
                  <FileText className="h-4 w-4" />
                  Rapor Oluştur
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
                    title="Hızlı PDF indir"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
                    title="Hızlı Excel indir"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        );
      })}
    </div>
  );
}


