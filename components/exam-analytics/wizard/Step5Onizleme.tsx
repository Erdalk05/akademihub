'use client';

/**
 * Step 5 - Önizleme ve Yayınlama
 */

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Check, 
  X, 
  AlertTriangle, 
  Rocket, 
  Clock,
  FileText,
  Key,
  Users,
  Calculator,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step5Props {
  wizard: UseExamWizardReturn;
  organizationId: string;
  userId?: string;
  onPublish: () => Promise<void>;
}

type YayinSecenegi = 'taslak' | 'hemen' | 'zamanli';

export function Step5Onizleme({ wizard, organizationId, userId, onPublish }: Step5Props) {
  const { state, checkKontrolListesi } = wizard;
  const { step1, step2, step3, step4, step5 } = state;

  const [yayinSecenegi, setYayinSecenegi] = useState<YayinSecenegi>('hemen');
  const [yayinlaniyor, setYayinlaniyor] = useState(false);
  const [yayinHatasi, setYayinHatasi] = useState<string | null>(null);

  // Kontrol listesini güncelle
  useEffect(() => {
    checkKontrolListesi();
  }, [checkKontrolListesi]);

  // Yayınla
  const handleYayinla = async () => {
    if (!step5.hazirMi) return;
    
    setYayinlaniyor(true);
    setYayinHatasi(null);

    try {
      await onPublish();
    } catch (err: any) {
      setYayinHatasi(err.message || 'Yayınlama sırasında hata oluştu');
    } finally {
      setYayinlaniyor(false);
    }
  };

  const kontrolItems = [
    {
      key: 'sinavBilgileri',
      label: 'Sınav Bilgileri',
      icon: FileText,
      durum: step5.kontrolListesi.sinavBilgileri,
      detay: step1.isCompleted 
        ? `${step1.sinavAdi} - ${step1.dersler.length} ders, ${step1.toplamSoru} soru`
        : 'Tamamlanmadı',
    },
    {
      key: 'cevapAnahtari',
      label: 'Cevap Anahtarı',
      icon: Key,
      durum: step5.kontrolListesi.cevapAnahtari,
      detay: step2.isCompleted
        ? `${step2.girilenCevap}/${step2.toplamCevap} cevap girildi`
        : 'Tamamlanmadı',
    },
    {
      key: 'katilimcilar',
      label: 'Katılımcılar',
      icon: Users,
      durum: step5.kontrolListesi.katilimcilar,
      detay: step4.isCompleted
        ? `${step4.toplamKatilimci} katılımcı (${step4.eslesen} asıl, ${step4.eslesemeyen} misafir)`
        : 'Tamamlanmadı',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Eye className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Önizleme & Yayınla</h2>
          <p className="text-sm text-gray-500">Son kontrolleri yapın ve sınavı yayınlayın</p>
        </div>
      </div>

      {/* Kontrol Listesi */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-medium text-gray-900">Kontrol Listesi</h3>
        </div>
        
        <div className="divide-y">
          {kontrolItems.map((item) => (
            <div key={item.key} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  item.durum ? 'bg-green-100' : 'bg-red-100'
                )}>
                  <item.icon className={cn(
                    'w-5 h-5',
                    item.durum ? 'text-green-600' : 'text-red-600'
                  )} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.detay}</div>
                </div>
              </div>
              
              {item.durum ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Tamam</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <X className="w-5 h-5" />
                  <span className="font-medium">Eksik</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sınav Özeti */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Sınav Özeti</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Sınav Adı:</span>
            <p className="font-medium">{step1.sinavAdi || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Sınav Türü:</span>
            <p className="font-medium capitalize">{step1.sinavTuru || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Toplam Soru:</span>
            <p className="font-medium">{step1.toplamSoru}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Katılımcı Sayısı:</span>
            <p className="font-medium">{step4.toplamKatilimci}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Süre:</span>
            <p className="font-medium">{step1.sureDakika} dakika</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Yanlış Katsayısı:</span>
            <p className="font-medium">1/{Math.round(1/step1.yanlisKatsayi)}</p>
          </div>
        </div>

        {/* Ders Dağılımı */}
        <div className="mt-6">
          <span className="text-sm text-gray-500">Ders Dağılımı:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {step1.dersler.map((ders) => (
              <span
                key={ders.dersKodu}
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: ders.renkKodu + '20', color: ders.renkKodu }}
              >
                {ders.dersAdi}: {ders.soruSayisi}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Yayın Seçenekleri */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Yayın Seçenekleri</h3>
        
        <div className="space-y-3">
          {/* Taslak Kaydet */}
          <button
            onClick={() => setYayinSecenegi('taslak')}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4',
              yayinSecenegi === 'taslak'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              yayinSecenegi === 'taslak' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            )}>
              {yayinSecenegi === 'taslak' && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Taslak Kaydet</div>
              <div className="text-sm text-gray-500">Hesaplama yapılmaz, sadece kaydedilir</div>
            </div>
            <FileText className="w-5 h-5 text-gray-400" />
          </button>

          {/* Hemen Yayınla */}
          <button
            onClick={() => setYayinSecenegi('hemen')}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4',
              yayinSecenegi === 'hemen'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              yayinSecenegi === 'hemen' ? 'border-green-500 bg-green-500' : 'border-gray-300'
            )}>
              {yayinSecenegi === 'hemen' && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Hemen Yayınla</div>
              <div className="text-sm text-gray-500">Hesapla ve anında yayınla</div>
            </div>
            <Rocket className="w-5 h-5 text-green-500" />
          </button>

          {/* Zamanlı Yayın */}
          <button
            onClick={() => setYayinSecenegi('zamanli')}
            disabled
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 opacity-50 cursor-not-allowed',
              yayinSecenegi === 'zamanli'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              yayinSecenegi === 'zamanli' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
            )}>
              {yayinSecenegi === 'zamanli' && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Zamanlı Yayın (Yakında)</div>
              <div className="text-sm text-gray-500">Belirli bir tarih/saatte yayınla</div>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Hesaplama Bilgisi */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Hesaplama İşlemleri</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Her öğrenci için doğru/yanlış/boş sayıları hesaplanır</li>
            <li>Net puanlar hesaplanır (Doğru - Yanlış × {step1.yanlisKatsayi.toFixed(3)})</li>
            <li>Sıralama ve yüzdelik dilimler belirlenir</li>
            <li>Tahmini süre: ~{Math.max(1, Math.ceil(step4.toplamKatilimci / 50))} saniye</li>
          </ul>
        </div>
      </div>

      {/* Hata Mesajı */}
      {yayinHatasi && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Hata Oluştu</p>
            <p>{yayinHatasi}</p>
          </div>
        </div>
      )}

      {/* Yayınla Butonu */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {!step5.hazirMi && (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Önce eksik adımları tamamlayın</span>
            </div>
          )}
        </div>

        <button
          onClick={handleYayinla}
          disabled={!step5.hazirMi || yayinlaniyor}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all',
            step5.hazirMi && !yayinlaniyor
              ? yayinSecenegi === 'taslak'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          {yayinlaniyor ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {yayinSecenegi === 'taslak' ? 'Kaydediliyor...' : 'Hesaplanıyor...'}
            </>
          ) : (
            <>
              {yayinSecenegi === 'taslak' ? (
                <>
                  <FileText className="w-5 h-5" />
                  Taslak Kaydet
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Hesapla & Yayınla
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
