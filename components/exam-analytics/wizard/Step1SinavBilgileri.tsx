'use client';

/**
 * Step 1 - Sınav Bilgileri Formu
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Clock, 
  Plus, 
  X,
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SinavTipi, 
  SinavDers, 
  SINAV_TURLERI,
  EADers,
  getDersRenk,
} from '@/types/exam-analytics';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step1Props {
  wizard: UseExamWizardReturn;
  organizationId: string;
}

const SINIF_SEVIYELERI = [4, 5, 6, 7, 8, 9, 10, 11, 12];

const SINAV_TURU_OPTIONS: { value: SinavTipi; label: string; icon: string; desc: string }[] = [
  { value: 'lgs', label: 'LGS', icon: '🎓', desc: '90 soru' },
  { value: 'tyt', label: 'TYT', icon: '📚', desc: '120 soru' },
  { value: 'ayt', label: 'AYT', icon: '✍️', desc: '80 soru' },
  { value: 'kurum_deneme', label: 'Kurum Denemesi', icon: '🏢', desc: 'Özel' },
  { value: 'konu_testi', label: 'Konu Testi', icon: '📝', desc: 'Özel' },
  { value: 'yazili', label: 'Yazılı', icon: '✏️', desc: 'Özel' },
];

export function Step1SinavBilgileri({ wizard, organizationId }: Step1Props) {
  const { state, setSinavAdi, setSinavTarihi, setSinifSeviyesi, setSinavTuru, setDersler, addDers, removeDers, updateDersSoruSayisi } = wizard;
  const { step1 } = state;

  const [dersListesi, setDersListesi] = useState<EADers[]>([]);
  const [dersYukleniyor, setDersYukleniyor] = useState(false);
  const [dersEkleModalAcik, setDersEkleModalAcik] = useState(false);

  // Ders listesini yükle
  useEffect(() => {
    async function fetchDersler() {
      setDersYukleniyor(true);
      try {
        const res = await fetch(`/api/admin/exam-analytics/dersler?organizationId=${organizationId}`);
        const json = await res.json();
        if (json.data) {
          setDersListesi(json.data);
        }
      } catch (err) {
        console.error('Ders listesi yüklenemedi:', err);
      } finally {
        setDersYukleniyor(false);
      }
    }
    
    if (organizationId) {
      fetchDersler();
    }
  }, [organizationId]);

  // Varsayılana sıfırla
  const handleVarsayilanaSifirla = () => {
    if (step1.sinavTuru) {
      setSinavTuru(step1.sinavTuru as SinavTipi);
    }
  };

  // Ders ekle
  const handleDersEkle = (ders: EADers) => {
    addDers({
      dersId: ders.id,
      dersKodu: ders.ders_kodu,
      dersAdi: ders.ders_adi,
      renkKodu: ders.renk_kodu || getDersRenk(ders.ders_kodu),
      soruSayisi: 10,
    });
    setDersEkleModalAcik(false);
  };

  // Toplam soru ve süre hesapla
  const toplamSoru = step1.dersler.reduce((t, d) => t + d.soruSayisi, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sınav Bilgileri</h2>
          <p className="text-sm text-gray-500">Sınavın temel bilgilerini girin</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Sınav Adı ve Tarihi */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sınav Adı *
            </label>
            <input
              type="text"
              value={step1.sinavAdi}
              onChange={(e) => setSinavAdi(e.target.value)}
              placeholder="Örn: ÖZDEBİR LGS DENEME 1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {step1.sinavAdi.length > 0 && step1.sinavAdi.length < 3 && (
              <p className="text-xs text-red-500 mt-1">En az 3 karakter gerekli</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Sınav Tarihi
            </label>
            <input
              type="date"
              value={step1.sinavTarihi ? step1.sinavTarihi.toISOString().split('T')[0] : ''}
              onChange={(e) => setSinavTarihi(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sınıf Seviyesi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <GraduationCap className="inline w-4 h-4 mr-1" />
            Sınıf Seviyesi
          </label>
          <div className="flex flex-wrap gap-2">
            {SINIF_SEVIYELERI.map((seviye) => (
              <button
                key={seviye}
                onClick={() => setSinifSeviyesi(seviye)}
                className={cn(
                  'px-4 py-2 rounded-lg border transition-all',
                  step1.sinifSeviyesi === seviye
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                )}
              >
                {seviye}. Sınıf
              </button>
            ))}
            <button
              onClick={() => setSinifSeviyesi(0)}
              className={cn(
                'px-4 py-2 rounded-lg border transition-all',
                step1.sinifSeviyesi === 0
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              )}
            >
              Mezun
            </button>
          </div>
        </div>

        {/* Sınav Türü */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sınav Türü *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {SINAV_TURU_OPTIONS.map((tur) => (
              <button
                key={tur.value}
                onClick={() => setSinavTuru(tur.value)}
                className={cn(
                  'p-4 rounded-lg border transition-all text-left',
                  step1.sinavTuru === tur.value
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                    : 'bg-white border-gray-300 hover:border-blue-300'
                )}
              >
                <div className="text-2xl mb-1">{tur.icon}</div>
                <div className="font-medium text-gray-900">{tur.label}</div>
                <div className="text-xs text-gray-500">{tur.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Ders Dağılımı */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <BookOpen className="inline w-4 h-4 mr-1" />
                Ders Dağılımı
              </label>
              <p className="text-xs text-gray-500">Sınavdaki ders ve soru sayıları</p>
            </div>
            {step1.sinavTuru && (
              <button
                onClick={handleVarsayilanaSifirla}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Varsayılana Sıfırla
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {step1.dersler.map((ders) => (
              <div
                key={ders.dersKodu}
                className="p-4 border rounded-lg bg-white relative group"
                style={{ borderLeftColor: ders.renkKodu, borderLeftWidth: '4px' }}
              >
                {/* Sil butonu */}
                <button
                  onClick={() => removeDers(ders.dersId)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="font-medium text-gray-900 mb-2">{ders.dersAdi}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateDersSoruSayisi(ders.dersId, Math.max(1, ders.soruSayisi - 1))}
                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={ders.soruSayisi}
                    onChange={(e) => updateDersSoruSayisi(ders.dersId, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border rounded py-1"
                    min="1"
                    max="100"
                  />
                  <button
                    onClick={() => updateDersSoruSayisi(ders.dersId, Math.min(100, ders.soruSayisi + 1))}
                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500">Soru</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Soru {ders.baslangicSoru} - {ders.bitisSoru}
                </div>
              </div>
            ))}

            {/* Ders Ekle Butonu */}
            <button
              onClick={() => setDersEkleModalAcik(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-sm">Ders Ekle</span>
            </button>
          </div>
        </div>

        {/* Özet Bar */}
        <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-500">Toplam:</span>
              <span className="ml-2 font-semibold text-gray-900">{toplamSoru} soru</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Süre:</span>
              <span className="ml-1 font-semibold text-gray-900">{step1.sureDakika} dk</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              <span className="text-sm text-gray-500">Yanlış:</span>
              <span className="ml-2 font-semibold text-gray-900">1/{Math.round(1/step1.yanlisKatsayi)}</span>
            </div>
          </div>
          
          <div className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            step1.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          )}>
            {step1.isCompleted ? '✓ Tamamlandı' : 'Devam ediyor...'}
          </div>
        </div>
      </div>

      {/* Ders Ekle Modal */}
      {dersEkleModalAcik && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ders Ekle</h3>
              <button
                onClick={() => setDersEkleModalAcik(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dersYukleniyor ? (
              <div className="py-8 text-center text-gray-500">Yükleniyor...</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {dersListesi
                  .filter(d => !step1.dersler.find(sd => sd.dersId === d.id))
                  .map((ders) => (
                    <button
                      key={ders.id}
                      onClick={() => handleDersEkle(ders)}
                      className="w-full p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-3"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ders.renk_kodu || getDersRenk(ders.ders_kodu) }}
                      />
                      <div>
                        <div className="font-medium">{ders.ders_adi}</div>
                        <div className="text-xs text-gray-500">{ders.ders_kodu}</div>
                      </div>
                    </button>
                  ))}
                
                {dersListesi.filter(d => !step1.dersler.find(sd => sd.dersId === d.id)).length === 0 && (
                  <div className="py-4 text-center text-gray-500">
                    Tüm dersler eklenmiş
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
