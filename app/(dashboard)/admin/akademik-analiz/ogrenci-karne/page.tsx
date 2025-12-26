'use client';

/**
 * Akademik Analiz - Detaylı Öğrenci Karnesi
 * K12Net benzeri konu analizli sınav sonuç belgesi
 */

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Printer,
  Loader2,
  User,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  MinusCircle,
  BarChart3,
  Target,
  FileText
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// =============================================================================
// TYPES
// =============================================================================

interface DersDetay {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  basariOrani: number;
  cevapAnahtari?: string[];
  ogrenciCevaplari?: string[];
}

interface KazanimDetay {
  kazanimKodu: string;
  kazanimMetni: string;
  dersKodu: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  basariOrani: number;
}

interface OgrenciKarne {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinifNo?: string;
  sube?: string;
  okul?: string;
  kitapcik?: string;
  sinavAdi: string;
  sinavTarihi: string;
  sinavTipi: string;
  
  // Genel sonuçlar
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamPuan: number;
  basariOrani: number;
  
  // Sıralamalar
  genelSira: number;
  subeSira?: number;
  okulSira?: number;
  toplamOgrenci: number;
  
  // Ders bazlı detaylar
  dersler: DersDetay[];
  
  // Kazanım bazlı analiz
  kazanimlar?: KazanimDetay[];
  
  // Önceki sınavlar (karşılaştırma için)
  oncekiSinavlar?: {
    sinavAdi: string;
    tarih: string;
    net: number;
    puan: number;
  }[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DERS_RENKLERI: Record<string, { bg: string; text: string; border: string }> = {
  'TUR': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'TURKCE': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'MAT': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'MATEMATIK': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'FEN': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'FEN_BILIMLERI': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'SOS': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'SOSYAL_BILGILER': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'ING': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'INGILIZCE': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'DIN': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'DIN_KULTURU': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'INKILAP': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const getDersRenk = (kod: string) => {
  return DERS_RENKLERI[kod] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function OgrenciKarneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const studentNo = searchParams.get('studentNo');
  const { currentOrganization } = useOrganizationStore();
  
  const [loading, setLoading] = useState(true);
  const [karne, setKarne] = useState<OgrenciKarne | null>(null);

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadData = useCallback(async () => {
    if (!examId) return;
    
    setLoading(true);
    try {
      // Sınav sonuçlarını yükle
      const response = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
      const data = await response.json();
      
      if (response.ok && data.exam) {
        const exam = data.exam;
        
        // Öğrenciyi bul
        const student = studentNo 
          ? exam.ogrenciler.find((o: any) => o.ogrenciNo === studentNo)
          : exam.ogrenciler[0];
        
        if (student) {
          // Karne verisini oluştur
          const karneData: OgrenciKarne = {
            ogrenciNo: student.ogrenciNo || '-',
            ogrenciAdi: student.ogrenciAdi || 'Bilinmeyen',
            sinifNo: student.sinifNo,
            sube: student.sinifNo,
            okul: currentOrganization?.name || 'Dikmen Çözüm Kurs',
            kitapcik: student.kitapcik || 'A',
            sinavAdi: exam.ad,
            sinavTarihi: exam.tarih,
            sinavTipi: exam.tip || 'LGS',
            
            toplamDogru: student.toplamDogru || 0,
            toplamYanlis: student.toplamYanlis || 0,
            toplamBos: student.toplamBos || 0,
            toplamNet: student.toplamNet || 0,
            toplamPuan: student.toplamPuan || (student.toplamNet * 5),
            basariOrani: exam.toplamSoru > 0 
              ? Math.round((student.toplamDogru / exam.toplamSoru) * 100) 
              : 0,
            
            genelSira: student.siralama || 1,
            subeSira: student.sinifSira,
            okulSira: student.siralama,
            toplamOgrenci: exam.ogrenciler.length,
            
            dersler: student.dersBazli?.map((d: any) => ({
              dersKodu: d.dersKodu,
              dersAdi: d.dersAdi,
              soruSayisi: d.dogru + d.yanlis + d.bos,
              dogru: d.dogru,
              yanlis: d.yanlis,
              bos: d.bos,
              net: d.net,
              basariOrani: d.basariOrani || 0
            })) || generateDefaultDersler(student, exam.toplamSoru),
            
            kazanimlar: [],
            
            // Örnek önceki sınavlar (gerçek veriler için API gerekir)
            oncekiSinavlar: [
              // { sinavAdi: 'Deneme 1', tarih: '2025-10-15', net: student.toplamNet - 2, puan: (student.toplamNet - 2) * 5 },
              // { sinavAdi: 'Deneme 2', tarih: '2025-11-10', net: student.toplamNet + 1, puan: (student.toplamNet + 1) * 5 },
            ]
          };
          
          setKarne(karneData);
        }
      }
    } catch (error) {
      console.error('Karne yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [examId, studentNo, currentOrganization?.name]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Default ders dağılımı oluştur
  const generateDefaultDersler = (student: any, toplamSoru: number): DersDetay[] => {
    const lgsDistribution = [
      { kod: 'TUR', adi: 'Türkçe', soru: 20 },
      { kod: 'MAT', adi: 'Matematik', soru: 20 },
      { kod: 'FEN', adi: 'Fen Bilimleri', soru: 20 },
      { kod: 'SOS', adi: 'Sosyal Bilgiler', soru: 10 },
      { kod: 'DIN', adi: 'Din Kültürü', soru: 10 },
      { kod: 'ING', adi: 'İngilizce', soru: 10 },
    ];
    
    const totalQ = toplamSoru || 90;
    const totalD = student.toplamDogru || 0;
    const totalY = student.toplamYanlis || 0;
    
    return lgsDistribution.map(d => {
      const ratio = d.soru / totalQ;
      const dogru = Math.round(totalD * ratio);
      const yanlis = Math.round(totalY * ratio);
      const bos = d.soru - dogru - yanlis;
      const net = dogru - (yanlis / 3);
      
      return {
        dersKodu: d.kod,
        dersAdi: d.adi,
        soruSayisi: d.soru,
        dogru,
        yanlis,
        bos: Math.max(0, bos),
        net: parseFloat(net.toFixed(2)),
        basariOrani: Math.round((dogru / d.soru) * 100)
      };
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // =============================================================================
  // LOADING
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-500">Öğrenci karnesi yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!karne) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Öğrenci Bulunamadı</h2>
          <button
            onClick={() => router.back()}
            className="text-emerald-600 hover:underline"
          >
            ← Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Header - Print'te gizle */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-800">Öğrenci Karnesi</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Printer size={18} />
                Yazdır
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <Download size={18} />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Karne İçeriği */}
      <div className="max-w-5xl mx-auto p-6 print:p-0">
        <div className="bg-white rounded-xl shadow-sm print:shadow-none border border-slate-200 print:border-0 overflow-hidden">
          
          {/* Başlık */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 print:bg-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">KONU ANALİZLİ SINAV SONUÇ BELGESİ</h2>
                <p className="text-emerald-100">{karne.okul}</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Öğrenci Bilgileri */}
          <div className="p-6 border-b border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Öğrenci Adı</label>
                <p className="text-lg font-bold text-slate-800">{karne.ogrenciAdi}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Numara</label>
                <p className="text-lg font-semibold text-slate-700">{karne.ogrenciNo}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Şube</label>
                <p className="text-lg font-semibold text-slate-700">{karne.sube || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Kitapçık</label>
                <p className="text-lg font-semibold text-slate-700">{karne.kitapcik}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Sınav Adı</label>
                <p className="text-lg font-semibold text-slate-700">{karne.sinavAdi}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Sınav Tarihi</label>
                <p className="text-lg font-semibold text-slate-700">{formatDate(karne.sinavTarihi)}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Sınav Tipi</label>
                <p className="text-lg font-semibold text-slate-700">{karne.sinavTipi}</p>
              </div>
            </div>
          </div>

          {/* Ders Bazlı Sonuçlar Tablosu */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              DERS BAZLI SONUÇLAR
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 border border-slate-200">DERSLER</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700 border border-slate-200">Soru<br/>Sayısı</th>
                    <th className="px-4 py-3 text-center font-semibold text-green-600 border border-slate-200">Doğru</th>
                    <th className="px-4 py-3 text-center font-semibold text-red-600 border border-slate-200">Yanlış</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-500 border border-slate-200">Boş</th>
                    <th className="px-4 py-3 text-center font-semibold text-emerald-600 border border-slate-200">Net</th>
                    <th className="px-4 py-3 text-center font-semibold text-blue-600 border border-slate-200">Başarı %</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700 border border-slate-200 print:hidden">Grafik</th>
                  </tr>
                </thead>
                <tbody>
                  {karne.dersler.map((ders, i) => {
                    const renk = getDersRenk(ders.dersKodu);
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className={`px-4 py-3 font-medium border border-slate-200 ${renk.text} ${renk.bg}`}>
                          {ders.dersAdi}
                        </td>
                        <td className="px-4 py-3 text-center border border-slate-200 font-semibold">{ders.soruSayisi}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 font-bold text-green-600">{ders.dogru}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 font-bold text-red-600">{ders.yanlis}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 text-slate-500">{ders.bos}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 font-bold text-emerald-700">{ders.net.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 font-bold text-blue-600">{ders.basariOrani}%</td>
                        <td className="px-4 py-3 border border-slate-200 print:hidden">
                          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                ders.basariOrani >= 70 ? 'bg-green-500' :
                                ders.basariOrani >= 50 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${ders.basariOrani}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Toplam Satırı */}
                  <tr className="bg-emerald-50 font-bold">
                    <td className="px-4 py-3 border border-slate-200 text-emerald-800">TOPLAM</td>
                    <td className="px-4 py-3 text-center border border-slate-200">{karne.dersler.reduce((s, d) => s + d.soruSayisi, 0)}</td>
                    <td className="px-4 py-3 text-center border border-slate-200 text-green-600">{karne.toplamDogru}</td>
                    <td className="px-4 py-3 text-center border border-slate-200 text-red-600">{karne.toplamYanlis}</td>
                    <td className="px-4 py-3 text-center border border-slate-200">{karne.toplamBos}</td>
                    <td className="px-4 py-3 text-center border border-slate-200 text-emerald-700 text-lg">{karne.toplamNet.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center border border-slate-200 text-blue-700 text-lg">{karne.basariOrani}%</td>
                    <td className="px-4 py-3 border border-slate-200 print:hidden"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Puan ve Sıralama */}
          <div className="p-6 border-b border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-4 text-center">
                <div className="text-sm opacity-80 mb-1">{karne.sinavTipi} Puanı</div>
                <div className="text-3xl font-bold">{karne.toplamPuan.toFixed(0)}</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center">
                <div className="text-sm opacity-80 mb-1">Genel Sıralama</div>
                <div className="text-3xl font-bold">{karne.genelSira}<span className="text-lg">/{karne.toplamOgrenci}</span></div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center">
                <div className="text-sm opacity-80 mb-1">Şube Sırası</div>
                <div className="text-3xl font-bold">{karne.subeSira || '-'}</div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 text-center">
                <div className="text-sm opacity-80 mb-1">Başarı Oranı</div>
                <div className="text-3xl font-bold">{karne.basariOrani}%</div>
              </div>
            </div>
          </div>

          {/* Önceki Sınavlarla Karşılaştırma */}
          {karne.oncekiSinavlar && karne.oncekiSinavlar.length > 0 && (
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                ÖNCEKİ SINAVLARLA KARŞILAŞTIRMA
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2 text-left font-semibold border border-slate-200">Sınav</th>
                      <th className="px-4 py-2 text-center font-semibold border border-slate-200">Tarih</th>
                      <th className="px-4 py-2 text-center font-semibold border border-slate-200">Net</th>
                      <th className="px-4 py-2 text-center font-semibold border border-slate-200">Puan</th>
                      <th className="px-4 py-2 text-center font-semibold border border-slate-200">Değişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {karne.oncekiSinavlar.map((sinav, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 border border-slate-200">{sinav.sinavAdi}</td>
                        <td className="px-4 py-2 text-center border border-slate-200">{formatDate(sinav.tarih)}</td>
                        <td className="px-4 py-2 text-center border border-slate-200 font-semibold">{sinav.net.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center border border-slate-200 font-semibold">{sinav.puan.toFixed(0)}</td>
                        <td className="px-4 py-2 text-center border border-slate-200">
                          {sinav.net < karne.toplamNet ? (
                            <span className="text-green-600 flex items-center justify-center gap-1">
                              <TrendingUp size={14} /> +{(karne.toplamNet - sinav.net).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center justify-center gap-1">
                              <TrendingDown size={14} /> {(karne.toplamNet - sinav.net).toFixed(2)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Mevcut sınav */}
                    <tr className="bg-emerald-50 font-semibold">
                      <td className="px-4 py-2 border border-slate-200">{karne.sinavAdi} (Bu Sınav)</td>
                      <td className="px-4 py-2 text-center border border-slate-200">{formatDate(karne.sinavTarihi)}</td>
                      <td className="px-4 py-2 text-center border border-slate-200 text-emerald-700">{karne.toplamNet.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center border border-slate-200 text-emerald-700">{karne.toplamPuan.toFixed(0)}</td>
                      <td className="px-4 py-2 text-center border border-slate-200">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alt Bilgi */}
          <div className="p-6 bg-slate-50 text-center text-sm text-slate-500">
            <p>Bu belge {new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
            <p className="mt-1">{karne.okul} - {karne.sinavAdi}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export default function OgrenciKarnePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <OgrenciKarneContent />
    </Suspense>
  );
}

