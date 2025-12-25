'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  BookOpen,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  User,
  Calendar,
  Hash,
  School,
  Medal
} from 'lucide-react';
import { KazanimKarnesi as KazanimKarnesiType, OgrenciKazanimSonuc, DERS_RENKLERI, DERS_ISIMLERI } from './types';

interface KazanimKarnesiProps {
  data: KazanimKarnesiType;
  logoUrl?: string;
  kurumAdi?: string;
  onPdfDownload?: () => void;
  onPrint?: () => void;
}

export default function KazanimKarnesi({
  data,
  logoUrl,
  kurumAdi = 'AkademiHub',
  onPdfDownload,
  onPrint
}: KazanimKarnesiProps) {
  const [expandedDers, setExpandedDers] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Genel başarı oranı
  const genelBasari = useMemo(() => {
    const toplamSoru = data.toplamDogru + data.toplamYanlis + data.toplamBos;
    return toplamSoru > 0 ? (data.toplamDogru / toplamSoru) * 100 : 0;
  }, [data]);

  // Ders rengi getir
  const getDersRenk = (dersKodu: string) => DERS_RENKLERI[dersKodu] || '#6B7280';

  // Başarı durumu
  const getBasariDurum = (oran: number) => {
    if (oran >= 80) return { label: 'Mükemmel', color: '#10B981', icon: Award };
    if (oran >= 60) return { label: 'İyi', color: '#3B82F6', icon: TrendingUp };
    if (oran >= 40) return { label: 'Orta', color: '#F59E0B', icon: Target };
    return { label: 'Geliştirilmeli', color: '#EF4444', icon: TrendingDown };
  };

  // Yazdır
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Aksiyon Butonları */}
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-xl font-bold text-slate-800">Kazanım Bazlı Karne</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Printer size={18} />
            Yazdır
          </button>
          <button
            onClick={onPdfDownload}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Download size={18} />
            PDF İndir
          </button>
        </div>
      </div>

      {/* Karne İçeriği - A4 */}
      <div
        ref={printRef}
        className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none"
        style={{ maxWidth: '210mm' }}
      >
        {/* Başlık */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 bg-white rounded-lg p-2" />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <School className="w-8 h-8" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{kurumAdi}</h1>
                <p className="text-emerald-100">Konu Analizli Sınav Sonuç Belgesi</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-emerald-100">Sınav Tarihi</p>
              <p className="font-semibold">{data.sinavTarihi}</p>
            </div>
          </div>
        </div>

        {/* Öğrenci ve Sınav Bilgisi */}
        <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 border-b border-slate-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Öğrenci Adı:</span>
              <span className="font-semibold text-slate-800">{data.ogrenciAdi}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Sınıf:</span>
              <span className="font-semibold text-slate-800">{data.sinif}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Sınav Adı:</span>
              <span className="font-semibold text-slate-800">{data.sinavAdi}</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Sınıf Sıralaması:</span>
              <span className="font-bold text-emerald-600">{data.sinifSiralamasi}.</span>
              <span className="text-sm text-slate-400">/ Genel: {data.genelSiralama}.</span>
            </div>
          </div>
        </div>

        {/* Genel Sonuçlar */}
        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <div className="text-2xl font-bold text-emerald-600">{data.toplamDogru}</div>
              <div className="text-xs text-slate-500">Doğru</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-2xl font-bold text-red-600">{data.toplamYanlis}</div>
              <div className="text-xs text-slate-500">Yanlış</div>
            </div>
            <div className="text-center p-4 bg-slate-100 rounded-xl">
              <div className="text-2xl font-bold text-slate-600">{data.toplamBos}</div>
              <div className="text-xs text-slate-500">Boş</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{data.toplamNet.toFixed(2)}</div>
              <div className="text-xs text-slate-500">Net</div>
            </div>
            <div 
              className="text-center p-4 rounded-xl"
              style={{ backgroundColor: `${getBasariDurum(genelBasari).color}15` }}
            >
              <div 
                className="text-2xl font-bold"
                style={{ color: getBasariDurum(genelBasari).color }}
              >
                %{genelBasari.toFixed(0)}
              </div>
              <div className="text-xs text-slate-500">Başarı</div>
            </div>
          </div>
        </div>

        {/* Ders Bazlı Sonuçlar */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Ders Bazlı Sonuçlar
          </h3>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Ders</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-600">Soru</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-600">Doğru</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-600">Yanlış</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-600">Net</th>
                  <th className="px-2 py-3 text-center font-semibold text-slate-600">%</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Cevap Karşılaştırma</th>
                </tr>
              </thead>
              <tbody>
                {data.dersler.map((ders, index) => (
                  <React.Fragment key={ders.dersKodu}>
                    <tr 
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedDers(expandedDers === ders.dersKodu ? null : ders.dersKodu)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getDersRenk(ders.dersKodu) }}
                          />
                          <span className="font-medium">{ders.dersAdi}</span>
                          {ders.kazanimlar.length > 0 && (
                            expandedDers === ders.dersKodu 
                              ? <ChevronUp size={14} className="text-slate-400" />
                              : <ChevronDown size={14} className="text-slate-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center text-slate-600">
                        {ders.dogru + ders.yanlis + ders.bos}
                      </td>
                      <td className="px-2 py-3 text-center font-semibold text-emerald-600">{ders.dogru}</td>
                      <td className="px-2 py-3 text-center font-semibold text-red-600">{ders.yanlis}</td>
                      <td className="px-2 py-3 text-center font-bold text-blue-600">{ders.net.toFixed(2)}</td>
                      <td className="px-2 py-3 text-center">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ 
                            backgroundColor: `${getBasariDurum(ders.basariOrani).color}20`,
                            color: getBasariDurum(ders.basariOrani).color
                          }}
                        >
                          {ders.basariOrani.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 text-xs font-mono">
                          <span className="text-slate-400">A:</span>
                          <span className="text-emerald-600">{ders.cevapAnahtari}</span>
                        </div>
                        <div className="flex gap-1 text-xs font-mono">
                          <span className="text-slate-400">Ö:</span>
                          <span className="text-blue-600">{ders.ogrenciCevabi}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Kazanım Detayları */}
                    <AnimatePresence>
                      {expandedDers === ders.dersKodu && ders.kazanimlar.length > 0 && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan={7} className="p-0">
                            <div className="bg-slate-50 p-4">
                              <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1">
                                <Target size={12} />
                                Kazanım Analizi
                              </p>
                              <div className="space-y-2">
                                {ders.kazanimlar.map((kazanim, ki) => (
                                  <KazanimSatir key={ki} kazanim={kazanim} />
                                ))}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zayıf ve Güçlü Kazanımlar */}
        <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50">
          {/* Zayıf Kazanımlar */}
          <div className="space-y-3">
            <h4 className="font-semibold text-red-600 flex items-center gap-2">
              <AlertTriangle size={16} />
              Geliştirilmesi Gereken Kazanımlar
            </h4>
            {data.zayifKazanimlar.length > 0 ? (
              <div className="space-y-2">
                {data.zayifKazanimlar.slice(0, 5).map((k, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <code className="text-xs bg-red-100 text-red-700 px-1 rounded">
                          {k.kazanimKodu}
                        </code>
                        <p className="text-xs text-slate-600 mt-1">{k.kazanimMetni}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {k.dogru}/{k.toplamSoru} doğru (%{k.basariOrani.toFixed(0)})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Zayıf kazanım bulunmuyor 🎉</p>
            )}
          </div>

          {/* Güçlü Kazanımlar */}
          <div className="space-y-3">
            <h4 className="font-semibold text-emerald-600 flex items-center gap-2">
              <Award size={16} />
              Başarılı Kazanımlar
            </h4>
            {data.gucluKazanimlar.length > 0 ? (
              <div className="space-y-2">
                {data.gucluKazanimlar.slice(0, 5).map((k, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-emerald-200">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <code className="text-xs bg-emerald-100 text-emerald-700 px-1 rounded">
                          {k.kazanimKodu}
                        </code>
                        <p className="text-xs text-slate-600 mt-1">{k.kazanimMetni}</p>
                        <p className="text-xs text-emerald-600 mt-1">
                          {k.dogru}/{k.toplamSoru} doğru (%{k.basariOrani.toFixed(0)})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Henüz güçlü kazanım yok</p>
            )}
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>Bu belge {new Date().toLocaleDateString('tr-TR')} tarihinde {kurumAdi} tarafından oluşturulmuştur.</p>
        </div>
      </div>

      {/* Yazdırma Stilleri */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Kazanım Satır Bileşeni
function KazanimSatir({ kazanim }: { kazanim: OgrenciKazanimSonuc }) {
  const basari = kazanim.basariOrani;
  
  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
      <div className="flex-shrink-0">
        {basari >= 50 ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <X className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs bg-slate-100 px-1 rounded">{kazanim.kazanimKodu}</code>
          <span className="text-xs text-slate-600 truncate">{kazanim.kazanimMetni}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">
          {kazanim.dogru}/{kazanim.toplamSoru}
        </span>
        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${basari}%`,
              backgroundColor: basari >= 80 ? '#10B981' : basari >= 50 ? '#3B82F6' : '#EF4444'
            }}
          />
        </div>
        <span 
          className="text-xs font-bold w-10 text-right"
          style={{ color: basari >= 80 ? '#10B981' : basari >= 50 ? '#3B82F6' : '#EF4444' }}
        >
          %{basari.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

