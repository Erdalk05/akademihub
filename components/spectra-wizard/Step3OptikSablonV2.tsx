'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: OPTİK ŞABLON BUILDER V2
// Wizard entegrasyonlu, localStorage kullanmayan versiyon
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import type { WizardStep1Data, WizardStep3Data } from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Step3Props {
  step1Data: WizardStep1Data;
  data: WizardStep3Data | null;
  onChange: (data: WizardStep3Data) => void;
}

interface AlanTanimi {
  id: number;
  ad: string;
  baslangic: number;
  uzunluk: number;
}

interface DersTanimi {
  id: number;
  kod: string;
  ad: string;
  soru: number;
  baslangic: number;
  uzunluk: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SINIF_SINAVLAR: Record<string, { ad: string; dersler: { kod: string; ad: string; soru: number }[] }> = {
  '4': { ad: '4. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 15 }, { kod: 'MAT', ad: 'Matematik', soru: 15 }, { kod: 'FEN', ad: 'Fen Bilimleri', soru: 10 }, { kod: 'SOS', ad: 'Sosyal Bilgiler', soru: 10 }] },
  '5': { ad: '5. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 15 }, { kod: 'MAT', ad: 'Matematik', soru: 15 }, { kod: 'FEN', ad: 'Fen Bilimleri', soru: 10 }, { kod: 'SOS', ad: 'Sosyal Bilgiler', soru: 10 }, { kod: 'ING', ad: 'İngilizce', soru: 10 }] },
  '6': { ad: '6. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 15 }, { kod: 'MAT', ad: 'Matematik', soru: 15 }, { kod: 'FEN', ad: 'Fen Bilimleri', soru: 10 }, { kod: 'SOS', ad: 'Sosyal Bilgiler', soru: 10 }, { kod: 'ING', ad: 'İngilizce', soru: 10 }, { kod: 'DIN', ad: 'Din Kültürü', soru: 10 }] },
  '7': { ad: '7. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 15 }, { kod: 'MAT', ad: 'Matematik', soru: 15 }, { kod: 'FEN', ad: 'Fen Bilimleri', soru: 10 }, { kod: 'SOS', ad: 'Sosyal Bilgiler', soru: 10 }, { kod: 'ING', ad: 'İngilizce', soru: 10 }, { kod: 'DIN', ad: 'Din Kültürü', soru: 10 }] },
  '8-LGS': { ad: '8. Sınıf (LGS)', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 20 }, { kod: 'MAT', ad: 'Matematik', soru: 20 }, { kod: 'FEN', ad: 'Fen Bilimleri', soru: 20 }, { kod: 'SOS', ad: 'Sosyal Bilgiler', soru: 10 }, { kod: 'ING', ad: 'İngilizce', soru: 10 }, { kod: 'DIN', ad: 'Din Kültürü', soru: 10 }] },
  '9': { ad: '9. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 15 }, { kod: 'MAT', ad: 'Matematik', soru: 15 }, { kod: 'FIZ', ad: 'Fizik', soru: 10 }, { kod: 'KIM', ad: 'Kimya', soru: 10 }, { kod: 'BIY', ad: 'Biyoloji', soru: 10 }] },
  '10': { ad: '10. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 15 }, { kod: 'MAT', ad: 'Matematik', soru: 15 }, { kod: 'FIZ', ad: 'Fizik', soru: 10 }, { kod: 'KIM', ad: 'Kimya', soru: 10 }, { kod: 'BIY', ad: 'Biyoloji', soru: 10 }] },
  '11': { ad: '11. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 20 }, { kod: 'MAT', ad: 'Matematik', soru: 20 }, { kod: 'FIZ', ad: 'Fizik', soru: 10 }, { kod: 'KIM', ad: 'Kimya', soru: 10 }, { kod: 'BIY', ad: 'Biyoloji', soru: 10 }] },
  '12': { ad: '12. Sınıf', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 20 }, { kod: 'MAT', ad: 'Matematik', soru: 20 }, { kod: 'FIZ', ad: 'Fizik', soru: 10 }, { kod: 'KIM', ad: 'Kimya', soru: 10 }, { kod: 'BIY', ad: 'Biyoloji', soru: 10 }] },
  'TYT': { ad: 'TYT', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 40 }, { kod: 'SOS', ad: 'Sosyal', soru: 20 }, { kod: 'MAT', ad: 'Matematik', soru: 40 }, { kod: 'FEN', ad: 'Fen', soru: 20 }] },
  'AYT-SAY': { ad: 'AYT Sayısal', dersler: [{ kod: 'MAT', ad: 'Matematik', soru: 40 }, { kod: 'FIZ', ad: 'Fizik', soru: 14 }, { kod: 'KIM', ad: 'Kimya', soru: 13 }, { kod: 'BIY', ad: 'Biyoloji', soru: 13 }] },
  'AYT-EA': { ad: 'AYT Eşit Ağırlık', dersler: [{ kod: 'EDE', ad: 'Edebiyat', soru: 24 }, { kod: 'TAR', ad: 'Tarih', soru: 10 }, { kod: 'COG', ad: 'Coğrafya', soru: 6 }, { kod: 'MAT', ad: 'Matematik', soru: 40 }] },
  'AYT-SOZ': { ad: 'AYT Sözel', dersler: [{ kod: 'EDE', ad: 'Edebiyat', soru: 24 }, { kod: 'TAR', ad: 'Tarih', soru: 21 }, { kod: 'COG', ad: 'Coğrafya', soru: 17 }, { kod: 'FEL', ad: 'Felsefe', soru: 12 }, { kod: 'DIN', ad: 'Din', soru: 6 }] },
  'MEZUN': { ad: 'Mezun', dersler: [{ kod: 'TUR', ad: 'Türkçe', soru: 40 }, { kod: 'MAT', ad: 'Matematik', soru: 40 }, { kod: 'FEN', ad: 'Fen', soru: 20 }, { kod: 'SOS', ad: 'Sosyal', soru: 20 }] },
};

const VARSAYILAN_ALANLAR: AlanTanimi[] = [
  { id: 1, ad: 'T.C. Kimlik No', baslangic: 1, uzunluk: 11 },
  { id: 2, ad: 'Öğrenci No', baslangic: 12, uzunluk: 10 },
  { id: 3, ad: 'Ad Soyad', baslangic: 22, uzunluk: 20 },
  { id: 4, ad: 'Sınıf', baslangic: 42, uzunluk: 2 },
  { id: 5, ad: 'Şube', baslangic: 44, uzunluk: 1 },
  { id: 6, ad: 'Kurum Kodu', baslangic: 45, uzunluk: 8 },
  { id: 7, ad: 'Cep Telefonu', baslangic: 53, uzunluk: 11 },
  { id: 8, ad: 'Cinsiyet', baslangic: 64, uzunluk: 1 },
  { id: 9, ad: 'Kitapçık', baslangic: 65, uzunluk: 1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 4px',
  border: '1px solid #dbeafe',
  borderRadius: '6px',
  fontSize: '12px',
  textAlign: 'center',
  background: 'white',
  fontWeight: 500,
  MozAppearance: 'textfield',
  WebkitAppearance: 'none',
};

const inputStyleLarge: React.CSSProperties = {
  width: '55px',
  margin: '0 auto',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '8px 6px',
  fontSize: '13px',
  textAlign: 'center',
  fontWeight: 600,
  MozAppearance: 'textfield',
  WebkitAppearance: 'none',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Step3OptikSablonV2({ step1Data, data, onChange }: Step3Props) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE - Wizard data'dan başlat
  // ─────────────────────────────────────────────────────────────────────────
  
  const [sablonAdi, setSablonAdi] = useState(() => data?.ozelSablon?.ad || '');
  const [acikSinif, setAcikSinif] = useState(() => data?.ozelSablon?.sinifTuru || '8-LGS');
  const [satirUzunlugu, setSatirUzunlugu] = useState(() => data?.ozelSablon?.satirUzunlugu || 200);
  const [alanlar, setAlanlar] = useState<AlanTanimi[]>(() => data?.ozelSablon?.alanlar || VARSAYILAN_ALANLAR);
  const [dersler, setDersler] = useState<DersTanimi[]>(() => {
    if (data?.ozelSablon?.dersler) return data.ozelSablon.dersler;
    const sinif = SINIF_SINAVLAR['8-LGS'];
    return sinif.dersler.map((d, i) => ({ ...d, id: i + 1, baslangic: 1, uzunluk: d.soru }));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SYNC TO WIZARD - Her değişiklikte onChange çağır
  // ─────────────────────────────────────────────────────────────────────────

  const syncToWizard = useCallback(() => {
    const toplamSoru = dersler.reduce((t, d) => t + d.soru, 0);
    
    const wizardData: WizardStep3Data = {
      sablonKaynagi: 'ozel',
      optikSablon: {
        id: `ozel-${Date.now()}`,
        ad: sablonAdi || 'İsimsiz Şablon',
        sinavTurleri: [step1Data.sinavTuru],
        sinifSeviyeleri: [step1Data.sinifSeviyesi],
        yayinevi: 'Özel',
        toplamSoru,
        satirUzunlugu,
        alanlar: {
          ogrenciNo: alanlar.find(a => a.ad.toLowerCase().includes('öğrenci no')) 
            ? { baslangic: alanlar.find(a => a.ad.toLowerCase().includes('öğrenci no'))!.baslangic, bitis: alanlar.find(a => a.ad.toLowerCase().includes('öğrenci no'))!.baslangic + alanlar.find(a => a.ad.toLowerCase().includes('öğrenci no'))!.uzunluk - 1 }
            : { baslangic: 1, bitis: 10 },
          ogrenciAdi: alanlar.find(a => a.ad.toLowerCase().includes('ad soyad') || a.ad.toLowerCase().includes('ad'))
            ? { baslangic: alanlar.find(a => a.ad.toLowerCase().includes('ad soyad') || a.ad.toLowerCase().includes('ad'))!.baslangic, bitis: alanlar.find(a => a.ad.toLowerCase().includes('ad soyad') || a.ad.toLowerCase().includes('ad'))!.baslangic + alanlar.find(a => a.ad.toLowerCase().includes('ad soyad') || a.ad.toLowerCase().includes('ad'))!.uzunluk - 1 }
            : { baslangic: 11, bitis: 40 },
          cevaplar: { baslangic: 66, bitis: 66 + toplamSoru - 1 },
        },
      },
      ozelSablon: {
        ad: sablonAdi,
        sinifTuru: acikSinif,
        satirUzunlugu,
        alanlar,
        dersler,
      },
      alanlar: alanlar.map(a => ({
        id: String(a.id),
        label: a.ad,
        zorunlu: false,
        aktif: true,
        baslangic: a.baslangic,
        bitis: a.baslangic + a.uzunluk - 1,
      })),
      dersler: dersler.map(d => ({
        id: String(d.id),
        dersKodu: d.kod,
        dersAdi: d.ad,
        soruSayisi: d.soru,
        sira: d.id,
        baslangic: d.baslangic,
        bitis: d.baslangic + d.uzunluk - 1,
      })),
    };

    onChange(wizardData);
  }, [sablonAdi, acikSinif, satirUzunlugu, alanlar, dersler, step1Data.sinavTuru, onChange]);

  useEffect(() => {
    syncToWizard();
  }, [sablonAdi, acikSinif, satirUzunlugu, alanlar, dersler]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const sinifSec = (key: string) => {
    if (acikSinif === key) {
      setAcikSinif('');
    } else {
      setAcikSinif(key);
      const sinif = SINIF_SINAVLAR[key];
      if (sinif) {
        setDersler(sinif.dersler.map((d, i) => ({ ...d, id: i + 1, baslangic: 1, uzunluk: d.soru })));
      }
    }
  };

  const dersGuncelle = (id: number, alan: keyof DersTanimi, deger: string | number) => {
    setDersler(dersler.map(d => d.id === id ? { ...d, [alan]: alan === 'ad' || alan === 'kod' ? deger : (parseInt(String(deger)) || 0) } : d));
  };

  const dersEkle = () => {
    setDersler([...dersler, { id: Date.now(), kod: '', ad: '', soru: 10, baslangic: 1, uzunluk: 10 }]);
  };

  const dersSil = (id: number) => {
    if (dersler.length > 1) setDersler(dersler.filter(d => d.id !== id));
  };

  const alanGuncelle = (id: number, alan: keyof AlanTanimi, deger: string | number) => {
    setAlanlar(alanlar.map(a => a.id === id ? { ...a, [alan]: alan === 'ad' ? deger : (parseInt(String(deger)) || 0) } : a));
  };

  const alanEkle = () => {
    const sonAlan = alanlar[alanlar.length - 1];
    const yeniBaslangic = sonAlan ? sonAlan.baslangic + sonAlan.uzunluk : 1;
    setAlanlar([...alanlar, { id: Date.now(), ad: '', baslangic: yeniBaslangic, uzunluk: 10 }]);
  };

  const alanSil = (id: number) => {
    if (alanlar.length > 1) setAlanlar(alanlar.filter(a => a.id !== id));
  };

  const boslukEkle = () => {
    const sonAlan = alanlar[alanlar.length - 1];
    const yeniBaslangic = sonAlan ? sonAlan.baslangic + sonAlan.uzunluk : 1;
    setAlanlar([...alanlar, { id: Date.now(), ad: '(Boşluk)', baslangic: yeniBaslangic, uzunluk: 5 }]);
  };

  const toplamSoru = dersler.reduce((t, d) => t + d.soru, 0);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f1f5f9', minHeight: '100%', padding: '16px' }}>
      <style>{`input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ÜST TOOLBAR */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '12px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Sol: Logo ve Şablon Adı */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <input
              type="text"
              value={sablonAdi}
              onChange={(e) => setSablonAdi(e.target.value)}
              placeholder="Şablon adı girin..."
              style={{ flex: 1, maxWidth: '240px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}
            />
          </div>

          {/* Orta: Satır ve Soru */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Satır:</span>
              <input
                type="number"
                value={satirUzunlugu}
                onChange={(e) => setSatirUzunlugu(parseInt(e.target.value) || 0)}
                style={{ width: '60px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: '#3b82f6', textAlign: 'center' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Soru:</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>{toplamSoru}</span>
            </div>
          </div>

          {/* Sağ: Durum */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#10b981', background: '#d1fae5', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>
              ✓ Otomatik kaydediliyor
            </span>
          </div>
        </div>

        {/* ANA İÇERİK */}
        <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '16px' }}>

          {/* SOL: SINIFLAR */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sınıf / Sınav Türü</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(SINIF_SINAVLAR).map(([key, sinif]) => (
                <div key={key}>
                  <button
                    onClick={() => sinifSec(key)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      borderRadius: acikSinif === key ? '10px 10px 0 0' : '10px',
                      background: acikSinif === key ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f8fafc',
                      color: acikSinif === key ? 'white' : '#475569',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{sinif.ad}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{acikSinif === key ? '▼' : '▶'}</span>
                  </button>

                  {acikSinif === key && (
                    <div style={{ background: '#eff6ff', borderRadius: '0 0 10px 10px', padding: '12px', marginBottom: '4px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px 20px', gap: '4px', marginBottom: '8px', fontSize: '10px', color: '#64748b', fontWeight: 600, paddingLeft: '14px' }}>
                        <span>Ders</span>
                        <span style={{ textAlign: 'center' }}>Baş.</span>
                        <span style={{ textAlign: 'center' }}>Bit.</span>
                        <span style={{ textAlign: 'center' }}>Uz.</span>
                        <span></span>
                      </div>
                      
                      {dersler.map((ders, index) => {
                        const RENKLER = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
                        return (
                          <div key={ders.id} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 50px 20px', gap: '4px', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: RENKLER[index % RENKLER.length], flexShrink: 0 }}></span>
                              <input value={ders.ad} onChange={(e) => dersGuncelle(ders.id, 'ad', e.target.value)} style={{ ...inputStyle, textAlign: 'left', padding: '6px 8px' }} />
                            </div>
                            <input type="number" value={ders.baslangic} onChange={(e) => dersGuncelle(ders.id, 'baslangic', e.target.value)} style={inputStyle} />
                            <input type="number" value={ders.baslangic + ders.uzunluk - 1} onChange={(e) => { const yeniBitis = parseInt(e.target.value) || 0; const yeniUzunluk = yeniBitis - ders.baslangic + 1; if (yeniUzunluk > 0) dersGuncelle(ders.id, 'uzunluk', yeniUzunluk); }} style={{ ...inputStyle, color: '#10b981' }} />
                            <input type="number" value={ders.uzunluk} onChange={(e) => dersGuncelle(ders.id, 'uzunluk', e.target.value)} style={inputStyle} />
                            <button onClick={() => dersSil(ders.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                          </div>
                        );
                      })}
                      
                      <button onClick={dersEkle} style={{ width: '100%', padding: '8px', border: '1px dashed #93c5fd', borderRadius: '6px', background: 'white', color: '#3b82f6', cursor: 'pointer', fontSize: '11px', marginTop: '6px', fontWeight: 500 }}>+ Ders Ekle</button>
                      <div style={{ marginTop: '10px', padding: '8px 12px', background: '#dbeafe', borderRadius: '6px', fontSize: '12px', color: '#1e40af', fontWeight: 600, textAlign: 'center' }}>Toplam: {toplamSoru} soru</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SAĞ: ALANLAR */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Şablon Alanları</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={boslukEkle} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fefce8', color: '#854d0e', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>⬜ Boşluk</button>
                <button onClick={alanEkle} style={{ padding: '6px 12px', border: '1px solid #3b82f6', borderRadius: '6px', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>+ Alan Ekle</button>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 32px', background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                <span>Alan Adı</span>
                <span style={{ textAlign: 'center' }}>Başlangıç</span>
                <span style={{ textAlign: 'center' }}>Bitiş</span>
                <span style={{ textAlign: 'center' }}>Uzunluk</span>
                <span></span>
              </div>

              {alanlar.map((alan, index) => {
                const bitis = alan.baslangic + alan.uzunluk - 1;
                const isBoşluk = alan.ad === '(Boşluk)';
                return (
                  <div key={alan.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 32px', padding: '8px 14px', borderBottom: index < alanlar.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', background: isBoşluk ? '#fefce8' : (index % 2 === 0 ? 'white' : '#fafafa') }}>
                    <input value={alan.ad} onChange={(e) => alanGuncelle(alan.id, 'ad', e.target.value)} placeholder="Alan adı" style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box', background: isBoşluk ? '#fef9c3' : 'white', fontWeight: 500, color: '#334155' }} />
                    <input type="number" value={alan.baslangic} onChange={(e) => alanGuncelle(alan.id, 'baslangic', e.target.value)} style={{ ...inputStyleLarge, color: '#3b82f6' }} />
                    <input type="number" value={bitis} onChange={(e) => { const yeniBitis = parseInt(e.target.value) || 0; const yeniUzunluk = yeniBitis - alan.baslangic + 1; if (yeniUzunluk > 0) alanGuncelle(alan.id, 'uzunluk', yeniUzunluk); }} style={{ ...inputStyleLarge, color: '#10b981' }} />
                    <input type="number" value={alan.uzunluk} onChange={(e) => alanGuncelle(alan.id, 'uzunluk', e.target.value)} style={{ ...inputStyleLarge, color: '#64748b' }} />
                    <button onClick={() => alanSil(alan.id)} style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '18px', padding: '4px', borderRadius: '4px' }}>×</button>
                  </div>
                );
              })}
            </div>

            {/* Harita */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Karakter Haritası</div>
              <div style={{ height: '32px', borderRadius: '8px', overflow: 'hidden', display: 'flex', background: '#e2e8f0' }}>
                {alanlar.map((alan, index) => {
                  const yuzde = (alan.uzunluk / satirUzunlugu) * 100;
                  const isBoşluk = alan.ad === '(Boşluk)';
                  return (
                    <div key={alan.id} style={{ width: `${yuzde}%`, height: '100%', background: isBoşluk ? '#fde047' : `hsl(${200 + index * 25}, 65%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isBoşluk ? '#854d0e' : 'white', fontSize: '9px', fontWeight: 500, minWidth: '2px', borderRight: '1px solid rgba(255,255,255,0.3)' }} title={`${alan.ad}: ${alan.baslangic}-${alan.baslangic + alan.uzunluk - 1}`}>
                      {yuzde >= 6 && alan.ad.substring(0, 10)}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
                <span>1</span>
                <span>{satirUzunlugu}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step3OptikSablonV2;
