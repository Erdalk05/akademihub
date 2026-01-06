'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  MinusCircle,
  BarChart3,
  PieChart,
  AlertTriangle,
  Star,
  Medal,
  Download,
  Printer
} from 'lucide-react';
import { KazanimKarnesi, CevapAnahtariSatir, DERS_RENKLERI, DERS_ISIMLERI } from './types';

interface OgrenciSonuc {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik?: 'A' | 'B' | 'C' | 'D';
  cevaplar: (string | null)[];
}

interface DetayliOgrenciKarnesiProps {
  ogrenci: OgrenciSonuc;
  cevapAnahtari: CevapAnahtariSatir[];
  sinavBilgisi: {
    ad: string;
    tarih: string;
    tip: 'LGS' | 'TYT' | 'AYT' | 'DENEME';
  };
  sinifSiralamasi?: number;
  genelSiralama?: number;
  toplamOgrenci?: number;
  onExportPDF?: () => void;
}

export default function DetayliOgrenciKarnesi({
  ogrenci,
  cevapAnahtari,
  sinavBilgisi,
  sinifSiralamasi,
  genelSiralama,
  toplamOgrenci,
  onExportPDF
}: DetayliOgrenciKarnesiProps) {
  
  // Yanlış katsayısı - sınav tipine göre
  const yanlisKatsayisi = sinavBilgisi.tip === 'LGS' ? 3 : 4;

  // Ders bazlı sonuçları hesapla
  const dersSonuclari = useMemo(() => {
    const sonuclar: Record<string, {
      dersKodu: string;
      dersAdi: string;
      sorular: {
        soruNo: number;
        dogruCevap: string;
        ogrenciCevabi: string | null;
        durum: 'dogru' | 'yanlis' | 'bos';
        kazanimKodu?: string;
        kazanimMetni?: string;
      }[];
      dogru: number;
      yanlis: number;
      bos: number;
      net: number;
      basariOrani: number;
    }> = {};

    cevapAnahtari.forEach((soru) => {
      const dersKodu = soru.dersKodu;
      if (!sonuclar[dersKodu]) {
        sonuclar[dersKodu] = {
          dersKodu,
          dersAdi: DERS_ISIMLERI[dersKodu] || dersKodu,
          sorular: [],
          dogru: 0,
          yanlis: 0,
          bos: 0,
          net: 0,
          basariOrani: 0
        };
      }

      const ogrenciCevabi = ogrenci.cevaplar[soru.soruNo - 1] || null;
      let durum: 'dogru' | 'yanlis' | 'bos' = 'bos';

      if (!ogrenciCevabi) {
        sonuclar[dersKodu].bos++;
        durum = 'bos';
      } else if (ogrenciCevabi === soru.dogruCevap) {
        sonuclar[dersKodu].dogru++;
        durum = 'dogru';
      } else {
        sonuclar[dersKodu].yanlis++;
        durum = 'yanlis';
      }

      sonuclar[dersKodu].sorular.push({
        soruNo: soru.soruNo,
        dogruCevap: soru.dogruCevap,
        ogrenciCevabi,
        durum,
        kazanimKodu: soru.kazanimKodu,
        kazanimMetni: soru.kazanimMetni
      });
    });

    // Net ve başarı oranı hesapla
    Object.values(sonuclar).forEach((ders) => {
      ders.net = ders.dogru - (ders.yanlis / yanlisKatsayisi);
      const toplamSoru = ders.sorular.length;
      ders.basariOrani = toplamSoru > 0 ? Math.round((ders.dogru / toplamSoru) * 100) : 0;
    });

    return sonuclar;
  }, [cevapAnahtari, ogrenci.cevaplar, yanlisKatsayisi]);

  // Genel sonuçları hesapla
  const genelSonuc = useMemo(() => {
    let toplamDogru = 0;
    let toplamYanlis = 0;
    let toplamBos = 0;

    Object.values(dersSonuclari).forEach((ders) => {
      toplamDogru += ders.dogru;
      toplamYanlis += ders.yanlis;
      toplamBos += ders.bos;
    });

    const toplamNet = toplamDogru - (toplamYanlis / yanlisKatsayisi);
    const toplamSoru = cevapAnahtari.length;
    const puan = (toplamNet / toplamSoru) * 500; // Basit puan hesabı

    return {
      toplamDogru,
      toplamYanlis,
      toplamBos,
      toplamNet,
      toplamSoru,
      puan: Math.round(puan * 100) / 100,
      basariOrani: Math.round((toplamDogru / toplamSoru) * 100)
    };
  }, [dersSonuclari, cevapAnahtari.length, yanlisKatsayisi]);

  // Zayıf kazanımlar
  const zayifKazanimlar = useMemo(() => {
    const kazanimlar: { kazanimKodu: string; kazanimMetni: string; dersKodu: string; dogru: number; toplam: number }[] = [];
    
    Object.values(dersSonuclari).forEach((ders) => {
      const kazanimGruplari: Record<string, { dogru: number; toplam: number; metni: string }> = {};
      
      ders.sorular.forEach((soru) => {
        if (soru.kazanimKodu) {
          if (!kazanimGruplari[soru.kazanimKodu]) {
            kazanimGruplari[soru.kazanimKodu] = { dogru: 0, toplam: 0, metni: soru.kazanimMetni || '' };
          }
          kazanimGruplari[soru.kazanimKodu].toplam++;
          if (soru.durum === 'dogru') {
            kazanimGruplari[soru.kazanimKodu].dogru++;
          }
        }
      });

      Object.entries(kazanimGruplari).forEach(([kod, veri]) => {
        const basari = (veri.dogru / veri.toplam) * 100;
        if (basari < 50) {
          kazanimlar.push({
            kazanimKodu: kod,
            kazanimMetni: veri.metni,
            dersKodu: ders.dersKodu,
            dogru: veri.dogru,
            toplam: veri.toplam
          });
        }
      });
    });

    return kazanimlar;
  }, [dersSonuclari]);

  // Güçlü kazanımlar
  const gucluKazanimlar = useMemo(() => {
    const kazanimlar: { kazanimKodu: string; kazanimMetni: string; dersKodu: string; dogru: number; toplam: number }[] = [];
    
    Object.values(dersSonuclari).forEach((ders) => {
      const kazanimGruplari: Record<string, { dogru: number; toplam: number; metni: string }> = {};
      
      ders.sorular.forEach((soru) => {
        if (soru.kazanimKodu) {
          if (!kazanimGruplari[soru.kazanimKodu]) {
            kazanimGruplari[soru.kazanimKodu] = { dogru: 0, toplam: 0, metni: soru.kazanimMetni || '' };
          }
          kazanimGruplari[soru.kazanimKodu].toplam++;
          if (soru.durum === 'dogru') {
            kazanimGruplari[soru.kazanimKodu].dogru++;
          }
        }
      });

      Object.entries(kazanimGruplari).forEach(([kod, veri]) => {
        const basari = (veri.dogru / veri.toplam) * 100;
        if (basari >= 80) {
          kazanimlar.push({
            kazanimKodu: kod,
            kazanimMetni: veri.metni,
            dersKodu: ders.dersKodu,
            dogru: veri.dogru,
            toplam: veri.toplam
          });
        }
      });
    });

    return kazanimlar;
  }, [dersSonuclari]);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto print:shadow-none print:max-w-full">
      {/* Başlık */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">📄 Öğrenci Karnesi</h1>
            <p className="text-emerald-100">{sinavBilgisi.ad}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-200">{sinavBilgisi.tarih}</p>
            <div className="mt-2 flex gap-2 print:hidden">
              <button
                onClick={onExportPDF}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-1"
              >
                <Download size={14} />
                PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-1"
              >
                <Printer size={14} />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Öğrenci Bilgisi */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {ogrenci.ogrenciAdi?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">{ogrenci.ogrenciAdi}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              <span>No: <strong>{ogrenci.ogrenciNo}</strong></span>
              {ogrenci.sinif && <span>Sınıf: <strong>{ogrenci.sinif}</strong></span>}
              {ogrenci.kitapcik && <span>Kitapçık: <strong>{ogrenci.kitapcik}</strong></span>}
            </div>
          </div>
          {genelSiralama && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-emerald-600">
                <Medal className="w-8 h-8" />
                <div>
                  <p className="text-3xl font-bold">{genelSiralama}.</p>
                  <p className="text-xs text-slate-500">{toplamOgrenci && `/ ${toplamOgrenci}`}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Genel Sonuç Kartları */}
      <div className="p-6 bg-white">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-600">{genelSonuc.toplamDogru}</p>
            <p className="text-xs text-emerald-700">Doğru</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-600">{genelSonuc.toplamYanlis}</p>
            <p className="text-xs text-red-700">Yanlış</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <MinusCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-slate-500">{genelSonuc.toplamBos}</p>
            <p className="text-xs text-slate-600">Boş</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-600">{genelSonuc.toplamNet.toFixed(2)}</p>
            <p className="text-xs text-blue-700">Net</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-purple-600">{genelSonuc.puan.toFixed(1)}</p>
            <p className="text-xs text-purple-700">Puan</p>
          </div>
        </div>

        {/* Başarı Oranı Çubuğu */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Genel Başarı Oranı</span>
            <span className="font-bold text-emerald-600">%{genelSonuc.basariOrani}</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${genelSonuc.basariOrani}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
            />
          </div>
        </div>

        {/* Ders Bazlı Sonuçlar */}
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Ders Bazlı Performans
        </h3>
        
        <div className="space-y-3 mb-6">
          {Object.values(dersSonuclari).map((ders) => (
            <div
              key={ders.dersKodu}
              className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: DERS_RENKLERI[ders.dersKodu] || '#64748B' }}
                  />
                  <span className="font-semibold text-slate-800">{ders.dersAdi}</span>
                  <span className="text-sm text-slate-500">({ders.sorular.length} soru)</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-600 font-medium">{ders.dogru} D</span>
                  <span className="text-red-600 font-medium">{ders.yanlis} Y</span>
                  <span className="text-slate-400">{ders.bos} B</span>
                  <span className="font-bold text-blue-600">{ders.net.toFixed(2)} Net</span>
                </div>
              </div>
              
              {/* Başarı çubuğu */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ders.basariOrani}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: DERS_RENKLERI[ders.dersKodu] || '#64748B' }}
                />
              </div>
              
              {/* Soru detayları - küçük kutucuklar */}
              <div className="flex flex-wrap gap-1 mt-3">
                {ders.sorular.map((soru) => (
                  <div
                    key={soru.soruNo}
                    title={`Soru ${soru.soruNo}: ${soru.ogrenciCevabi || 'Boş'} (Doğru: ${soru.dogruCevap})${soru.kazanimKodu ? ` - ${soru.kazanimKodu}` : ''}`}
                    className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center cursor-help ${
                      soru.durum === 'dogru' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : soru.durum === 'yanlis'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {soru.soruNo}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Kazanım Analizi */}
        <div className="grid grid-cols-2 gap-4">
          {/* Zayıf Kazanımlar */}
          <div className="bg-red-50 rounded-xl p-4">
            <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Geliştirilmesi Gereken ({zayifKazanimlar.length})
            </h4>
            {zayifKazanimlar.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {zayifKazanimlar.map((kaz, i) => (
                  <div key={i} className="bg-white p-2 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: DERS_RENKLERI[kaz.dersKodu] }}
                      />
                      <code className="text-xs bg-red-100 px-1 rounded">{kaz.kazanimKodu}</code>
                      <span className="text-red-600 font-medium text-xs">
                        {kaz.dogru}/{kaz.toplam}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-2">{kaz.kazanimMetni}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-red-600">Tebrikler! Zayıf kazanım yok. 🎉</p>
            )}
          </div>

          {/* Güçlü Kazanımlar */}
          <div className="bg-emerald-50 rounded-xl p-4">
            <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Güçlü Yönler ({gucluKazanimlar.length})
            </h4>
            {gucluKazanimlar.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {gucluKazanimlar.slice(0, 5).map((kaz, i) => (
                  <div key={i} className="bg-white p-2 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <code className="text-xs bg-emerald-100 px-1 rounded">{kaz.kazanimKodu}</code>
                      <span className="text-emerald-600 font-medium text-xs">
                        {kaz.dogru}/{kaz.toplam}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-2">{kaz.kazanimMetni}</p>
                  </div>
                ))}
                {gucluKazanimlar.length > 5 && (
                  <p className="text-xs text-emerald-600">+{gucluKazanimlar.length - 5} daha...</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-emerald-600">Henüz güçlü kazanım belirlenmedi.</p>
            )}
          </div>
        </div>

        {/* Öğretmen Notu Alanı */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-xl border-2 border-dashed border-yellow-300">
          <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
            ✏️ Öğretmen Notu
          </h4>
          <p className="text-sm text-yellow-700 italic">
            Bu alan öğretmenin değerlendirmesi için ayrılmıştır.
          </p>
          <div className="mt-2 min-h-[60px] bg-white rounded-lg border border-yellow-200 p-2 print:border-slate-300">
            {/* Yazdırma için boş alan */}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-100 p-4 text-center text-xs text-slate-500 print:bg-white">
        <p>Bu karne {new Date().toLocaleDateString('tr-TR')} tarihinde AkademiHub tarafından oluşturulmuştur.</p>
        <p className="mt-1">Sınav: {sinavBilgisi.ad} | {yanlisKatsayisi} yanlış = 1 doğru</p>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:border-slate-300 { border-color: #cbd5e1 !important; }
        }
      `}</style>
    </div>
  );
}

