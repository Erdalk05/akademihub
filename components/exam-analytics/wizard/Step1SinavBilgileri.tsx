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
  { value: 'lgs', label: 'LGS', icon: '🎓', desc: '90 soru (6 ders)' },
  { value: 'tyt', label: 'TYT', icon: '📚', desc: '120 soru (4 ders)' },
  { value: 'ayt', label: 'AYT', icon: '✍️', desc: '80 soru' },
  { value: 'kurum_deneme', label: 'Kurum Denemesi', icon: '🏢', desc: 'Özel' },
  { value: 'konu_testi', label: 'Konu Testi', icon: '📝', desc: 'Özel' },
  { value: 'yazili', label: 'Yazılı', icon: '✏️', desc: 'Özel' },
];

export function Step1SinavBilgileri({ wizard, organizationId }: Step1Props) {
  const { state, setSinavAdi, setSinavTarihi, setSinifSeviyesi, setSinavTuru, addDers, removeDers, updateDersSoruSayisi } = wizard;
  const { step1 } = state;

  const [dersListesi, setDersListesi] = useState<EADers[]>([]);
  const [dersYukleniyor, setDersYukleniyor] = useState(false);
  const [dersEkleModalAcik, setDersEkleModalAcik] = useState(false);
  const [dersYuklemeHatasi, setDersYuklemeHatasi] = useState<string | null>(null);

  // Ders listesini yükle
  useEffect(() => {
    async function fetchDersler() {
      setDersYukleniyor(true);
      setDersYuklemeHatasi(null);
      try {
        const res = await fetch(`/api/admin/exam-analytics/dersler?organizationId=${organizationId}`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setDersListesi(json.data);
        } else {
          setDersYuklemeHatasi('Sistemde kayıtlı ders bulunamadı. Lütfen önce dersleri ekleyin.');
        }
      } catch (err) {
        console.error('Ders listesi yüklenemedi:', err);
        setDersYuklemeHatasi('Ders listesi yüklenirken bir hata oluştu.');
      } finally {
        setDersYukleniyor(false);
      }
    }
    
    if (organizationId) {
      fetchDersler();
    }
  }, [organizationId]);

  const buildVarsayilanDersler = (tur: SinavTipi): { dersler: SinavDers[]; eksikler: string[] } => {
    const config = SINAV_TURLERI[tur];
    if (!config?.varsayilanDersler?.length) return { dersler: [], eksikler: [] };

    const eksikDersler: string[] = [];
    let baslangic = 1;
    
    const dersler = config.varsayilanDersler.map((d, index) => {
      const eslesen = dersListesi.find(
        (ders) => ders.ders_kodu.toUpperCase() === d.kod.toUpperCase()
      );

      if (!eslesen) {
        eksikDersler.push(d.ad);
      }

      const soruSayisi = d.soru;
      const kayit = {
        dersId: eslesen?.id || '',
        dersKodu: d.kod,
        dersAdi: eslesen?.ders_adi || d.ad,
        renkKodu: eslesen?.renk_kodu || getDersRenk(d.kod),
        soruSayisi,
        siraNo: index + 1,
        baslangicSoru: baslangic,
        bitisSoru: baslangic + soruSayisi - 1,
      };
      baslangic += soruSayisi;
      return kayit;
    });

    return { dersler, eksikler: eksikDersler };
  };

  const handleSinavTuruSec = (tur: SinavTipi) => {
    const { dersler, eksikler } = buildVarsayilanDersler(tur);
    
    if (eksikler.length > 0 && dersListesi.length === 0) {
      // Hiç ders yoksa uyarı göster
      alert('⚠️ Sistemde kayıtlı ders bulunamadı!\n\nLütfen önce Supabase\'de migration 008 (seed_dersler) dosyasını çalıştırın.');
      return;
    }
    
    setSinavTuru(tur, dersler.length > 0 ? dersler : undefined);
  };

  // Varsayılana sıfırla
  const handleVarsayilanaSifirla = () => {
    if (step1.sinavTuru) {
      handleSinavTuruSec(step1.sinavTuru as SinavTipi);
    }
  };

  // Ders ekle
  const handleDersEkle = (ders: EADers) => {
    const varsayilanSoru = Math.max(1, ders.min_soru_sayisi || 10);
    addDers({
      dersId: ders.id,
      dersKodu: ders.ders_kodu,
      dersAdi: ders.ders_adi,
      renkKodu: ders.renk_kodu || getDersRenk(ders.ders_kodu),
      soruSayisi: varsayilanSoru,
    });
    setDersEkleModalAcik(false);
  };

  // Toplam soru ve süre hesapla
  const toplamSoru = step1.dersler.reduce((t, d) => t + d.soruSayisi, 0);
  const eksikDersKodlari = step1.dersler.filter(d => !d.dersId).map(d => d.dersKodu);
  const tumDerslerGecerli = step1.dersler.length > 0 && eksikDersKodlari.length === 0;

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

      {/* Ders Yükleme Durumu */}
      {dersYukleniyor && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">Ders listesi yükleniyor...</span>
        </div>
      )}

      {dersYuklemeHatasi && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Ders Listesi Yüklenemedi</h3>
              <p className="text-sm text-red-700 mb-3">{dersYuklemeHatasi}</p>
              <div className="bg-red-100 rounded p-3 text-xs text-red-800 font-mono">
                <p className="font-semibold mb-2">Çözüm:</p>
                <p>1. Supabase Dashboard &gt; SQL Editor açın</p>
                <p>2. <code className="bg-red-200 px-1 rounded">20260118_ea_008_seed_dersler.sql</code> dosyasını çalıştırın</p>
                <p>3. Bu sayfayı yenileyin</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => handleSinavTuruSec(tur.value)}
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

          {/* Eksik Dersler Uyarısı */}
          {eksikDersKodlari.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-600 text-xl">❌</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">Eksik Dersler Tespit Edildi</h3>
                  <p className="text-sm text-red-700 mb-2">
                    Aşağıdaki dersler sistemde bulunamadı: <strong>{eksikDersKodlari.join(', ')}</strong>
                  </p>
                  <div className="bg-red-100 rounded p-3 text-xs text-red-800">
                    <p className="font-semibold mb-1">Bu sorunu çözmek için:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Supabase Dashboard &gt; SQL Editor açın</li>
                      <li><code className="bg-red-200 px-1 rounded">20260118_ea_008_seed_dersler.sql</code> dosyasını çalıştırın</li>
                      <li>Bu sayfayı yenileyin (F5)</li>
                      <li>Veya "Varsayılana Sıfırla" butonuna tıklayın</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Başarılı Durum */}
          {tumDerslerGecerli && step1.dersler.length > 0 && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-green-600 text-lg">✅</span>
              <span className="text-sm text-green-700 font-medium">
                Tüm dersler başarıyla yüklendi! ({step1.dersler.length} ders)
              </span>
            </div>
          )}
        </div>

        {/* Özet Bar */}
        <div className={cn(
          'border rounded-lg p-4 transition-all',
          tumDerslerGecerli && step1.sinavAdi.length >= 3 && step1.sinavTuru
            ? 'bg-green-50 border-green-300'
            : 'bg-gray-50 border-gray-300'
        )}>
          <div className="flex items-center justify-between">
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
                <span className="ml-2 font-semibold text-gray-900">
                  {step1.yanlisKatsayi > 0 ? `1/${Math.round(1 / step1.yanlisKatsayi)}` : 'Yok'}
                </span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div>
                <span className="text-sm text-gray-500">Dersler:</span>
                <span className={cn(
                  'ml-2 font-semibold',
                  tumDerslerGecerli ? 'text-green-600' : 'text-red-600'
                )}>
                  {step1.dersler.length} / {step1.dersler.length}
                  {tumDerslerGecerli ? ' ✓' : ' ⚠️'}
                </span>
              </div>
            </div>
            
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              step1.isCompleted && tumDerslerGecerli 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            )}>
              {step1.isCompleted && tumDerslerGecerli ? '✓ Hazır' : '⏳ Eksik bilgiler var'}
            </div>
          </div>

          {/* Eksik Bilgiler Listesi */}
          {(!step1.isCompleted || !tumDerslerGecerli) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Devam etmek için:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                {!step1.sinavAdi && <li>• Sınav adı girin (en az 3 karakter)</li>}
                {!step1.sinavTuru && <li>• Sınav türü seçin</li>}
                {step1.dersler.length === 0 && <li>• En az 1 ders ekleyin</li>}
                {!tumDerslerGecerli && <li className="text-red-600 font-medium">• Eksik dersleri sisteme ekleyin (migration 008)</li>}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Ders Ekle Modal */}
      {dersEkleModalAcik && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Ders Ekle</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {dersListesi.length} ders mevcut
                </p>
              </div>
              <button
                onClick={() => setDersEkleModalAcik(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dersYukleniyor ? (
              <div className="py-8 text-center text-gray-500 flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                Yükleniyor...
              </div>
            ) : dersListesi.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-700 font-medium mb-2">Sistemde ders bulunamadı</p>
                <p className="text-sm text-gray-500 mb-4">
                  Lütfen önce dersleri ekleyin
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-left">
                  <p className="font-semibold text-yellow-800 mb-1">Çözüm:</p>
                  <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                    <li>Supabase Dashboard açın</li>
                    <li>SQL Editor &gt; <code className="bg-yellow-100 px-1">20260118_ea_008_seed_dersler.sql</code></li>
                    <li>Run tuşuna basın</li>
                    <li>Bu sayfayı yenileyin</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {dersListesi
                  .filter(d => !step1.dersler.find(sd => sd.dersId === d.id))
                  .map((ders) => (
                    <button
                      key={ders.id}
                      onClick={() => handleDersEkle(ders)}
                      className="w-full p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-3"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ders.renk_kodu || getDersRenk(ders.ders_kodu) }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{ders.ders_adi}</div>
                        <div className="text-xs text-gray-500">{ders.ders_kodu}</div>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                
                {dersListesi.filter(d => !step1.dersler.find(sd => sd.dersId === d.id)).length === 0 && (
                  <div className="py-8 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-700 font-medium">Tüm dersler eklenmiş</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Sınavda {step1.dersler.length} ders bulunuyor
                    </p>
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
