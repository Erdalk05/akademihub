// ============================================================================
// STUDENT ROW - Öğrenci Satırı (Kompakt + Genişletilmiş)
// Akordiyon yapısı ile detay gösterimi
// ============================================================================

'use client';

import React from 'react';
import { ChevronDown, Award, TrendingUp, User, Brain, BarChart3 } from 'lucide-react';
import type { StudentRowCompact, StudentRowDetailed, ExamFormat, SubjectResult } from '@/types/spectra-detail';
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

// Ders bazlı net'i bulmak için yardımcı fonksiyon
function getDersNet(dersSonuclari: SubjectResult[], codes: string[]): number {
  const ders = dersSonuclari.find(d => 
    codes.some(code => d.dersKodu?.toUpperCase().includes(code) || d.dersAdi?.toUpperCase().includes(code))
  );
  return ders?.net ?? 0;
}

// Ders bazlı D-Y formatı
function formatDersCell(dersSonuclari: SubjectResult[], codes: string[]): { net: string; dy: string } {
  const ders = dersSonuclari.find(d => 
    codes.some(code => d.dersKodu?.toUpperCase().includes(code) || d.dersAdi?.toUpperCase().includes(code))
  );
  if (!ders) return { net: '-', dy: '-' };
  return {
    net: ders.net.toFixed(2),
    dy: `${ders.dogru}-${ders.yanlis}`
  };
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

  // Ders verilerini hazırla
  const turkce = formatDersCell(data.dersSonuclari, ['TUR', 'TÜRKÇE']);
  const mat = formatDersCell(data.dersSonuclari, ['MAT', 'MATEMATİK']);
  const fen = formatDersCell(data.dersSonuclari, ['FEN', 'FEN BİLİMLERİ']);
  const inkilap = formatDersCell(data.dersSonuclari, ['INK', 'İNKILAP', 'İNKİLAP', 'T.C.']);
  const din = formatDersCell(data.dersSonuclari, ['DIN', 'DİN', 'AHLAK']);
  const ing = formatDersCell(data.dersSonuclari, ['ING', 'İNG', 'İNGİLİZCE']);

  return (
    <div className={cn(
      'border-b border-gray-200',
      isTop1 && 'bg-gradient-to-r from-yellow-50 to-amber-50',
      isTop3 && !isTop1 && 'bg-emerald-50/30'
    )}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KOMPAKT SATIR - TÜM VERİLER TEK SATIRDA */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <button
        onClick={onToggle}
        className="w-full px-2 py-2 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-1 text-xs">
          {/* Sıra */}
          <div className="w-8 flex-shrink-0 text-center">
            {isTop3 ? (
              <div className="relative inline-block">
                <Award className={cn(
                  'w-5 h-5',
                  isTop1 && 'text-yellow-500',
                  data.sira === 2 && 'text-gray-400',
                  data.sira === 3 && 'text-amber-600'
                )} />
              </div>
            ) : (
              <span className="font-bold text-gray-700">{data.sira}</span>
            )}
          </div>

          {/* Öğrenci Adı + No */}
          <div className="w-32 flex-shrink-0 truncate">
            <div className="font-semibold text-gray-900 truncate">{data.ogrenciAdi}</div>
            <div className="text-[10px] text-gray-500">{data.ogrenciNo}</div>
          </div>

          {/* Sınıf */}
          <div className="w-12 flex-shrink-0 text-center">
            <span className="font-medium text-gray-600">{data.grup}</span>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* PUAN TÜRLERİ: Sözel & Sayısal */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="w-14 flex-shrink-0 text-center border-l border-gray-200 pl-1">
            <div className="font-bold text-purple-600">{(data.puanTurleri.sozel ?? 0).toFixed(1)}</div>
            <div className="text-[9px] text-gray-400">Sözel</div>
          </div>
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-blue-600">{(data.puanTurleri.sayisal ?? 0).toFixed(1)}</div>
            <div className="text-[9px] text-gray-400">Sayısal</div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* DERS BAZLI NET + D-Y */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* Türkçe */}
          <div className="w-14 flex-shrink-0 text-center border-l border-gray-200 pl-1">
            <div className="font-bold text-gray-800">{turkce.net}</div>
            <div className="text-[9px] text-gray-400">{turkce.dy}</div>
          </div>
          {/* Matematik */}
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-gray-800">{mat.net}</div>
            <div className="text-[9px] text-gray-400">{mat.dy}</div>
          </div>
          {/* Fen */}
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-gray-800">{fen.net}</div>
            <div className="text-[9px] text-gray-400">{fen.dy}</div>
          </div>
          {/* İnkılap */}
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-gray-800">{inkilap.net}</div>
            <div className="text-[9px] text-gray-400">{inkilap.dy}</div>
          </div>
          {/* Din */}
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-gray-800">{din.net}</div>
            <div className="text-[9px] text-gray-400">{din.dy}</div>
          </div>
          {/* İngilizce */}
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-gray-800">{ing.net}</div>
            <div className="text-[9px] text-gray-400">{ing.dy}</div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TOPLAMLAR */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="w-10 flex-shrink-0 text-center border-l border-gray-200 pl-1">
            <div className="font-bold text-emerald-600">{data.toplamDogru}</div>
            <div className="text-[9px] text-gray-400">D</div>
          </div>
          <div className="w-10 flex-shrink-0 text-center">
            <div className="font-bold text-red-500">{data.toplamYanlis}</div>
            <div className="text-[9px] text-gray-400">Y</div>
          </div>
          <div className="w-10 flex-shrink-0 text-center">
            <div className="font-bold text-gray-500">{data.toplamBos}</div>
            <div className="text-[9px] text-gray-400">B</div>
          </div>

          {/* Başarı % */}
          <div className="w-12 flex-shrink-0 text-center border-l border-gray-200 pl-1">
            <div className="font-bold text-indigo-600">{data.basariYuzdesi.toFixed(0)}%</div>
            <div className="text-[9px] text-gray-400">Başarı</div>
          </div>

          {/* Net */}
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-gray-900">{data.toplamNet.toFixed(2)}</div>
            <div className="text-[9px] text-gray-400">Net</div>
          </div>

          {/* Puan */}
          <div className="w-14 flex-shrink-0 text-center">
            <div className="font-bold text-blue-700">{getPrimaryScore(data, format).toFixed(1)}</div>
            <div className="text-[9px] text-gray-400">{getPrimaryScoreLabel(format)}</div>
          </div>

          {/* Expand Icon */}
          <div className="w-6 flex-shrink-0 flex justify-end">
            <ChevronDown className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </div>
        </div>
      </button>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GENİŞLETİLMİŞ GÖRÜNÜM - Sadece Ek Detaylar (Ana satırda olmayanlar) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* ─────────────────────────────────────────────────────────────── */}
            {/* DERS DETAYLARI - Doğru/Yanlış/Boş ayrıntılı tablo */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Ders Bazlı Detay
              </h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-gray-600">Ders</th>
                      <th className="px-2 py-1.5 text-center text-gray-600">Soru</th>
                      <th className="px-2 py-1.5 text-center text-emerald-600">Doğru</th>
                      <th className="px-2 py-1.5 text-center text-red-600">Yanlış</th>
                      <th className="px-2 py-1.5 text-center text-gray-500">Boş</th>
                      <th className="px-2 py-1.5 text-center text-gray-800">Net</th>
                      <th className="px-2 py-1.5 text-center text-indigo-600">Başarı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.dersSonuclari.map(ders => (
                      <tr key={ders.sectionId} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-medium text-gray-900">{ders.dersAdi}</td>
                        <td className="px-2 py-1.5 text-center text-gray-500">{ders.soruSayisi}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">{ders.dogru}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-red-500">{ders.yanlis}</td>
                        <td className="px-2 py-1.5 text-center text-gray-500">{ders.bos}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-gray-900">{ders.net.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-center">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            ders.basariYuzdesi >= 70 && 'bg-emerald-100 text-emerald-700',
                            ders.basariYuzdesi >= 40 && ders.basariYuzdesi < 70 && 'bg-amber-100 text-amber-700',
                            ders.basariYuzdesi < 40 && 'bg-red-100 text-red-700'
                          )}>
                            {ders.basariYuzdesi.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SAĞ PANEL: Karşılaştırma + Zorluk Analizi + AI */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="space-y-3">
              {/* Sınıf/Okul Karşılaştırması */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">📊 Karşılaştırma</h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sınıf Sırası:</span>
                    <span className="font-bold text-emerald-600">{data.sinifSirasi}.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Genel Sıra:</span>
                    <span className="font-bold text-indigo-600">{data.genelSira}.</span>
                  </div>
                  {data.yuzdelik && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yüzdelik Dilim:</span>
                      <span className="font-bold text-purple-600">%{data.yuzdelik}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Zorluk Analizi */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">📈 Zorluk Analizi</h5>
                <div className="space-y-1.5 text-xs">
                  {data.dersSonuclari.length > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-gray-600">En Güçlü:</span>
                        <span className="font-bold text-emerald-600">
                          {[...data.dersSonuclari].sort((a, b) => b.basariYuzdesi - a.basariYuzdesi)[0]?.dersAdi}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-gray-600">Gelişim Alanı:</span>
                        <span className="font-bold text-red-600">
                          {[...data.dersSonuclari].sort((a, b) => a.basariYuzdesi - b.basariYuzdesi)[0]?.dersAdi}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AI Değerlendirmesi */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-3">
                <h5 className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" />
                  AI Değerlendirmesi
                </h5>
                <p className="text-xs text-gray-600 italic">
                  {data.basariYuzdesi >= 70 
                    ? '🌟 Mükemmel performans! Tüm derslerde güçlü bir profil sergileniyor.'
                    : data.basariYuzdesi >= 50 
                      ? '📈 İyi bir gelişim süreci. Belirli alanlara odaklanarak daha yükseğe çıkılabilir.'
                      : '💪 Gelişim potansiyeli yüksek. Düzenli çalışma ile hızlı ilerleme sağlanabilir.'
                  }
                </p>
              </div>
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
