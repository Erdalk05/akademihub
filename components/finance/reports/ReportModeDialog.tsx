'use client';

import React from 'react';
import { LayoutTemplate, Sparkles, Zap } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface ReportModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuick: () => void;
  onSelectBuilder: () => void;
}

export default function ReportModeDialog({
  isOpen,
  onClose,
  onSelectQuick,
  onSelectBuilder,
}: ReportModeDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nasıl rapor oluşturmak istersiniz?"
      size="lg"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Hızlı Rapor kartı */}
        <button
          type="button"
          onClick={onSelectQuick}
          className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              ÖNERİLEN
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Hızlı Rapor
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Hazır şablonlardan seçerek 3 adımda rapor oluşturun. Finans, öğrenci
            ve akademik raporlar için idealdir.
          </p>
          <ul className="mt-3 space-y-1 text-[11px] text-slate-700">
            <li>• Başlangıç için ideal</li>
            <li>• 3 adımda hazır</li>
            <li>• Kolay ve hızlı</li>
          </ul>
          <div className="mt-4 inline-flex items-center text-[11px] font-semibold text-indigo-600">
            ŞABLON SEÇ
          </div>
        </button>

        {/* Gelişmiş Oluşturucu kartı */}
        <button
          type="button"
          onClick={onSelectBuilder}
          className="flex h-full flex-col rounded-2xl border-2 border-violet-500 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              YENİ
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Gelişmiş Oluşturucu
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Tamamen özelleştirilebilir serbest rapor builder. Sürükle-bırak
            bileşenler, gelişmiş filtreler ve AI destekli tasarım.
          </p>
          <ul className="mt-3 space-y-1 text-[11px] text-slate-700">
            <li>• Sürükle-bırak arayüz</li>
            <li>• Tam kontrol ve esneklik</li>
            <li>• AI destekli rapor önerileri</li>
          </ul>
          <div className="mt-4 inline-flex items-center text-[11px] font-semibold text-violet-600">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            BUILDER'I AÇ
          </div>
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        İpucu: Günlük kullanım için <span className="font-semibold">Hızlı Rapor</span>, yönetim
        sunumları ve özel tasarımlar için{' '}
        <span className="font-semibold">Gelişmiş Oluşturucu</span> önerilir.
      </div>
    </Modal>
  );
}


