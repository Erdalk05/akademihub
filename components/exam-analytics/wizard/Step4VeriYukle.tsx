'use client';

/**
 * Step 4 - TXT Veri Yükleme ve Parse
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  AlertCircle, 
  User,
  Users,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedKatilimci, EslesmeDurumu } from '@/types/exam-analytics';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step4Props {
  wizard: UseExamWizardReturn;
  organizationId: string;
}

export function Step4VeriYukle({ wizard, organizationId }: Step4Props) {
  const { state, setDosya, setKatilimcilar } = wizard;
  const { step1, step4 } = state;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseYukleniyor, setParseYukleniyor] = useState(false);
  const [eslestirmeYukleniyor, setEslestirmeYukleniyor] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');

  // Dosya yükle
  const handleDosyaSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseYukleniyor(true);

    try {
      const icerik = await file.text();
      setDosya(file.name, icerik);
      
      // TXT Parse
      const satirlar = icerik.split('\n').filter(s => s.trim());
      const parsedKatilimcilar: ParsedKatilimci[] = satirlar.map((satir, idx) => {
        // Basit parse - gerçek implementasyonda optik şablona göre parse edilecek
        // Format varsayımı: Öğrenci No | Ad Soyad | Sınıf | Şube | Kitapçık | Cevaplar
        const parcalar = satir.split('|').map(p => p.trim());
        
        return {
          satirNo: idx + 1,
          ogrenciNo: parcalar[0] || undefined,
          adSoyad: parcalar[1] || undefined,
          sinif: parcalar[2] || undefined,
          sube: parcalar[3] || undefined,
          kitapcik: (parcalar[4] as 'A' | 'B' | 'C' | 'D') || 'A',
          cevaplar: parcalar[5] || satir.slice(-step1.toplamSoru) || '',
          studentId: undefined,
          katilimciTipi: 'asil',
          eslestirmeDurumu: 'beklemede',
        };
      });

      setKatilimcilar(parsedKatilimcilar);
      
      // Otomatik eşleştirme
      await eslestirmeYap(parsedKatilimcilar);
    } catch (err) {
      console.error('Dosya parse hatası:', err);
    } finally {
      setParseYukleniyor(false);
    }
  };

  // Öğrenci eşleştirme
  const eslestirmeYap = async (katilimcilar: ParsedKatilimci[]) => {
    setEslestirmeYukleniyor(true);

    try {
      // Öğrenci numaralarını topla
      const ogrenciNolar = katilimcilar
        .filter(k => k.ogrenciNo)
        .map(k => k.ogrenciNo!);

      if (ogrenciNolar.length === 0) {
        setKatilimcilar(katilimcilar.map(k => ({
          ...k,
          katilimciTipi: 'misafir',
          eslestirmeDurumu: 'bulunamadi' as EslesmeDurumu,
        })));
        return;
      }

      // API'den eşleştirme yap
      const res = await fetch('/api/students/list?limit=1000&organizationId=' + organizationId);
      const json = await res.json();
      const students = json.data || [];

      // Eşleştirme haritası oluştur
      const studentMap = new Map<string, { id: string; name: string }>();
      students.forEach((s: any) => {
        if (s.student_no) {
          studentMap.set(s.student_no, { 
            id: s.id, 
            name: `${s.first_name} ${s.last_name}` 
          });
        }
      });

      // Eşleştirmeleri uygula
      const eslesmisKatilimcilar = katilimcilar.map(k => {
        const eslesen = k.ogrenciNo ? studentMap.get(k.ogrenciNo) : undefined;
        
        return {
          ...k,
          studentId: eslesen?.id,
          katilimciTipi: eslesen ? 'asil' as const : 'misafir' as const,
          eslestirmeDurumu: eslesen ? 'eslesti' as EslesmeDurumu : 'bulunamadi' as EslesmeDurumu,
        };
      });

      setKatilimcilar(eslesmisKatilimcilar);
    } catch (err) {
      console.error('Eşleştirme hatası:', err);
    } finally {
      setEslestirmeYukleniyor(false);
    }
  };

  // Filtrelenmiş katılımcılar
  const filtrelenmisKatilimcilar = step4.katilimcilar.filter(k => {
    if (!aramaMetni) return true;
    const arama = aramaMetni.toLowerCase();
    return (
      k.ogrenciNo?.toLowerCase().includes(arama) ||
      k.adSoyad?.toLowerCase().includes(arama) ||
      k.sinif?.toLowerCase().includes(arama)
    );
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Upload className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Veri Yükle</h2>
          <p className="text-sm text-gray-500">Optik sonuç dosyasını (TXT) yükleyin</p>
        </div>
      </div>

      {/* Dosya Yükleme Alanı */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          step4.dosyaAdi
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv"
          onChange={handleDosyaSec}
          className="hidden"
        />

        {parseYukleniyor ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
            <span className="text-gray-600">Dosya işleniyor...</span>
          </div>
        ) : step4.dosyaAdi ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{step4.dosyaAdi}</p>
              <p className="text-sm text-gray-500">{step4.toplamKatilimci} satır yüklendi</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Farklı dosya seç
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">Dosya yüklemek için tıklayın</p>
              <p className="text-sm text-gray-500">veya sürükleyip bırakın</p>
            </div>
            <p className="text-xs text-gray-400">Desteklenen: .txt, .csv</p>
          </div>
        )}
      </div>

      {/* Eşleştirme Özeti */}
      {step4.toplamKatilimci > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{step4.toplamKatilimci}</div>
            <div className="text-sm text-blue-600">Toplam Katılımcı</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">{step4.eslesen}</div>
            <div className="text-sm text-green-600">Eşleşen (Asıl)</div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <XCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">{step4.eslesemeyen}</div>
            <div className="text-sm text-orange-600">Eşleşmeyen (Misafir)</div>
          </div>
        </div>
      )}

      {/* Katılımcı Listesi */}
      {step4.toplamKatilimci > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Katılımcı Listesi</h3>
            
            <div className="flex items-center gap-3">
              {/* Arama */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  placeholder="Ara..."
                  className="pl-9 pr-4 py-1.5 border rounded-lg text-sm w-48"
                />
              </div>
              
              {/* Yeniden eşleştir */}
              <button
                onClick={() => eslestirmeYap(step4.katilimcilar)}
                disabled={eslestirmeYukleniyor}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', eslestirmeYukleniyor && 'animate-spin')} />
                Yeniden Eşleştir
              </button>
            </div>
          </div>
          
          {/* Tablo */}
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600">#</th>
                  <th className="px-4 py-2 text-left text-gray-600">Öğrenci No</th>
                  <th className="px-4 py-2 text-left text-gray-600">Ad Soyad</th>
                  <th className="px-4 py-2 text-left text-gray-600">Sınıf</th>
                  <th className="px-4 py-2 text-left text-gray-600">Kitapçık</th>
                  <th className="px-4 py-2 text-left text-gray-600">Cevap</th>
                  <th className="px-4 py-2 text-left text-gray-600">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtrelenmisKatilimcilar.slice(0, 100).map((katilimci) => (
                  <tr key={katilimci.satirNo} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{katilimci.satirNo}</td>
                    <td className="px-4 py-2 font-mono">{katilimci.ogrenciNo || '-'}</td>
                    <td className="px-4 py-2">{katilimci.adSoyad || '-'}</td>
                    <td className="px-4 py-2">{katilimci.sinif || '-'}{katilimci.sube ? `/${katilimci.sube}` : ''}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                        {katilimci.kitapcik}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-gray-500">
                        {katilimci.cevaplar.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {katilimci.eslestirmeDurumu === 'eslesti' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" />
                          Eşleşti
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600">
                          <User className="w-4 h-4" />
                          Misafir
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filtrelenmisKatilimcilar.length > 100 && (
              <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                + {filtrelenmisKatilimcilar.length - 100} daha fazla kayıt
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bilgi Kutusu */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-1">Önemli Bilgi</p>
          <p>
            Eşleşmeyen öğrenciler "Misafir" olarak kaydedilecektir. Bu öğrencilerin sonuçları 
            sınav raporlarında görünür ancak öğrenci karnesine yansımaz. İsim benzerliği ile 
            eşleştirme yapılmaz - sadece öğrenci numarası kullanılır.
          </p>
        </div>
      </div>

      {/* Durum */}
      <div className={cn(
        'p-4 rounded-lg flex items-center gap-3',
        step4.isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
      )}>
        {step4.isCompleted ? (
          <>
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              {step4.toplamKatilimci} katılımcı yüklendi ({step4.eslesen} asıl, {step4.eslesemeyen} misafir)
            </span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              Sonuç dosyasını yükleyin
            </span>
          </>
        )}
      </div>
    </div>
  );
}
