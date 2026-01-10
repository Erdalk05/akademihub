// ============================================================================
// STUDENT ROW - Öğrenci Satırı (Kompakt + Genişletilmiş)
// Akordiyon yapısı ile detay gösterimi
// ============================================================================

'use client';

import React from 'react';
import { ChevronDown, Award, TrendingUp, User } from 'lucide-react';
import type { StudentRowCompact, StudentRowDetailed, ExamFormat } from '@/types/spectra-detail';
import { SubjectCell, PuanCell, EmptyCell } from './SubjectCell';
import { cn } from '@/lib/utils';

interface StudentRowProps {
  data: StudentRowDetailed;
  format: ExamFormat;
  isExpanded: boolean;
  onToggle: () => void;
  showPuanTurleri?: boolean;
  cellFormat?: 'ozdebir' | 'k12net' | 'standart';
  highlightTop3?: boolean;
}

export function StudentRow({
  data,
  format,
  isExpanded,
  onToggle,
  showPuanTurleri = true,
  cellFormat = 'ozdebir',
  highlightTop3 = true,
}: StudentRowProps) {
  const isTop3 = data.sira <= 3 && highlightTop3;
  const isTop1 = data.sira === 1;

  return (
    <div className={cn(
      'border-b border-gray-200',
      isTop1 && 'bg-gradient-to-r from-yellow-50 to-amber-50',
      isTop3 && !isTop1 && 'bg-emerald-50/30'
    )}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KOMPAKT SATIR (Kapalı Görünüm) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <button
        onClick={onToggle}
        className="w-full grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors text-left"
      >
        {/* Sıra Numarası */}
        <div className="col-span-1 flex items-center justify-center">
          {isTop3 ? (
            <div className="relative">
              <Award className={cn(
                'w-6 h-6',
                isTop1 && 'text-yellow-500',
                data.sira === 2 && 'text-gray-400',
                data.sira === 3 && 'text-amber-600'
              )} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {data.sira}
              </span>
            </div>
          ) : (
            <span className="text-base font-bold text-gray-700">{data.sira}</span>
          )}
        </div>

        {/* Grup/Sınıf */}
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">{data.grup}</span>
        </div>

        {/* Öğrenci Adı */}
        <div className="col-span-3 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-bold text-gray-900">{data.ogrenciAdi}</div>
            <div className="text-xs text-gray-500">No: {data.ogrenciNo}</div>
          </div>
        </div>

        {/* Toplam Net */}
        <div className="col-span-2 text-center">
          <div className="text-lg font-bold text-gray-900">{data.toplamNet.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Net</div>
        </div>

        {/* Puan (Ana puan türü) */}
        <div className="col-span-2 text-center">
          <div className="text-lg font-bold text-blue-600">
            {getPrimaryScore(data, format).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">{getPrimaryScoreLabel(format)}</div>
        </div>

        {/* Sıralamalar */}
        <div className="col-span-2 flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-sm font-bold text-emerald-600">{data.sinifSirasi}</div>
            <div className="text-[10px] text-gray-500">Sınıf</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-indigo-600">{data.genelSira}</div>
            <div className="text-[10px] text-gray-500">Genel</div>
          </div>
        </div>

        {/* Expand Icon */}
        <div className="col-span-1 flex justify-end">
          <ChevronDown className={cn(
            'w-5 h-5 text-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </div>
      </button>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GENİŞLETİLMİŞ GÖRÜNÜM (Akordiyon İçeriği) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isExpanded && (
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
          {/* Puan Türleri (LGS/AYT için) */}
          {showPuanTurleri && format !== 'TYT' && format !== 'CUSTOM' && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Puan Türleri
              </h4>
              <div className="grid grid-cols-8 gap-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                {renderPuanTurleri(data, format)}
              </div>
            </div>
          )}

          {/* Ders Detayları */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
              Ana Ders Listesi
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Tablo Başlığı */}
              <div className="grid gap-0 bg-gray-100 border-b border-gray-200"
                style={{ gridTemplateColumns: `repeat(${data.dersSonuclari.length}, minmax(80px, 1fr))` }}
              >
                {data.dersSonuclari.map(ders => (
                  <div key={ders.sectionId} className="px-2 py-2 text-center border-r border-gray-200 last:border-r-0">
                    <div className="text-[10px] text-gray-500 font-bold">({ders.soruSayisi})</div>
                    <div className="text-xs font-bold text-gray-700">{ders.dersAdi}</div>
                  </div>
                ))}
              </div>

              {/* Ders Hücreleri */}
              <div className="grid gap-0"
                style={{ gridTemplateColumns: `repeat(${data.dersSonuclari.length}, minmax(80px, 1fr))` }}
              >
                {data.dersSonuclari.map(ders => (
                  <SubjectCell
                    key={ders.sectionId}
                    subject={ders}
                    format={cellFormat}
                    compact={false}
                    showPercentage={false}
                    highlightTop={true}
                    highlightLow={true}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Özet İstatistikler */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
              <div className="text-xs text-gray-500">Toplam Doğru</div>
              <div className="text-lg font-bold text-emerald-600">{data.toplamDogru}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
              <div className="text-xs text-gray-500">Toplam Yanlış</div>
              <div className="text-lg font-bold text-red-600">{data.toplamYanlis}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
              <div className="text-xs text-gray-500">Toplam Boş</div>
              <div className="text-lg font-bold text-gray-600">{data.toplamBos}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
              <div className="text-xs text-gray-500">Başarı Yüzdesi</div>
              <div className="text-lg font-bold text-blue-600">{data.basariYuzdesi.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function getPrimaryScore(data: StudentRowDetailed, format: ExamFormat): number {
  switch (format) {
    case 'LGS':
      return data.puanTurleri.lgs || data.puanTurleri.genel || 0;
    case 'TYT':
      return data.puanTurleri.tyt || 0;
    case 'AYT_SAY':
      return data.puanTurleri.say || 0;
    case 'AYT_EA':
      return data.puanTurleri.ea || 0;
    case 'AYT_SOZ':
      return data.puanTurleri.soz || 0;
    case 'YDT':
      return data.puanTurleri.dil || 0;
    default:
      return data.puanTurleri.genel || 0;
  }
}

function getPrimaryScoreLabel(format: ExamFormat): string {
  switch (format) {
    case 'LGS': return 'LGS';
    case 'TYT': return 'TYT';
    case 'AYT_SAY': return 'SAY';
    case 'AYT_EA': return 'EA';
    case 'AYT_SOZ': return 'SÖZ';
    case 'YDT': return 'DİL';
    default: return 'Puan';
  }
}

function renderPuanTurleri(data: StudentRowDetailed, format: ExamFormat) {
  const { puanTurleri } = data;

  if (format === 'LGS') {
    return (
      <>
        {puanTurleri.lgs !== undefined && <PuanCell label="LGS" value={puanTurleri.lgs} highlight />}
        {puanTurleri.sozel !== undefined && <PuanCell label="Sözel" value={puanTurleri.sozel} />}
        {puanTurleri.sayisal !== undefined && <PuanCell label="Sayısal" value={puanTurleri.sayisal} />}
        {puanTurleri.turkceDil !== undefined && <PuanCell label="Türkçe" value={puanTurleri.turkceDil} />}
        {puanTurleri.sosyalBilimler !== undefined && <PuanCell label="Sosyal" value={puanTurleri.sosyalBilimler} />}
      </>
    );
  }

  if (format === 'AYT_SAY') {
    return (
      <>
        {puanTurleri.say !== undefined && <PuanCell label="SAY" value={puanTurleri.say} highlight />}
        {puanTurleri.tyt !== undefined && <PuanCell label="TYT" value={puanTurleri.tyt} />}
      </>
    );
  }

  if (format === 'AYT_EA') {
    return (
      <>
        {puanTurleri.ea !== undefined && <PuanCell label="EA" value={puanTurleri.ea} highlight />}
        {puanTurleri.tyt !== undefined && <PuanCell label="TYT" value={puanTurleri.tyt} />}
      </>
    );
  }

  if (format === 'AYT_SOZ') {
    return (
      <>
        {puanTurleri.soz !== undefined && <PuanCell label="SÖZ" value={puanTurleri.soz} highlight />}
        {puanTurleri.tyt !== undefined && <PuanCell label="TYT" value={puanTurleri.tyt} />}
      </>
    );
  }

  return null;
}
