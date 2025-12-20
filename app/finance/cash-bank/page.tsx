'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowLeftRight,
  Plus,
  Download,
  Search,
  RefreshCw,
  Banknote,
  X,
  Check,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// ==================== TİPLER ====================
type HareketTipi = 'giris' | 'cikis' | 'transfer';
type HesapTipi = 'nakit' | 'banka' | 'pos';

interface Hareket {
  id: string;
  hesap: HesapTipi;
  tip: HareketTipi;
  tutar: number;
  aciklama: string;
  tarih: string;
  kaynak?: string; // Gelir kaynağı veya gider açıklaması
  ogrenciAdi?: string;
  hedefHesap?: HesapTipi; // Transfer için
}

interface Hesap {
  id: HesapTipi;
  ad: string;
  ikon: string;
  renk: string;
  bakiye: number;
}

// ==================== SABİTLER ====================
const HESAPLAR: Hesap[] = [
  { id: 'nakit', ad: 'Nakit Kasa', ikon: '💵', renk: 'emerald', bakiye: 0 },
  { id: 'banka', ad: 'Banka Hesabı', ikon: '🏦', renk: 'blue', bakiye: 0 },
  { id: 'pos', ad: 'POS Cihazı', ikon: '💳', renk: 'purple', bakiye: 0 },
];

export default function KasaBankaPage() {
  const { isAdmin } = usePermission();
  const { currentOrganization } = useOrganizationStore();
  
  const [hareketler, setHareketler] = useState<Hareket[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tarihFiltre, setTarihFiltre] = useState<'bugun' | 'hafta' | 'ay' | 'tum'>('ay');
  const [tipFiltre, setTipFiltre] = useState<'tum' | 'giris' | 'cikis' | 'transfer'>('tum');
  const [hesapFiltre, setHesapFiltre] = useState<'tum' | HesapTipi>('tum');
  const [aramaMetni, setAramaMetni] = useState('');
  
  // Modal state
  const [modalAcik, setModalAcik] = useState(false);
  const [modalTip, setModalTip] = useState<'giris' | 'cikis' | 'transfer'>('giris');
  
  // Form state
  const [form, setForm] = useState({
    tutar: '',
    aciklama: '',
    hesap: 'nakit' as HesapTipi,
    hedefHesap: 'banka' as HesapTipi,
    tarih: new Date().toISOString().split('T')[0]
  });

  // ==================== VERİ YÜKLE ====================
  useEffect(() => {
    verileriYukle();
  }, [currentOrganization]);

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      const orgParam = currentOrganization?.id ? `?organization_id=${currentOrganization.id}` : '';
      
      const [taksitlerRes, giderlerRes, digerGelirlerRes] = await Promise.all([
        fetch(`/api/installments${orgParam}`),
        fetch(`/api/finance/expenses${orgParam}`),
        fetch(`/api/other-income${orgParam}`)
      ]);
      
      const taksitlerJson = await taksitlerRes.json();
      const giderlerJson = await giderlerRes.json();
      const digerGelirlerJson = await digerGelirlerRes.json();
      
      const tumHareketler: Hareket[] = [];
      
      // Ödenen taksitler → GİRİŞ (Tahsilat'tan gelir)
      if (taksitlerJson.success && Array.isArray(taksitlerJson.data)) {
        taksitlerJson.data
          .filter((t: any) => t.is_paid && t.paid_at)
          .forEach((t: any) => {
            // Ödeme yöntemine göre hesap belirle
            const hesap = odemeYonteminiHesabaCevir(t.payment_method);
            
            tumHareketler.push({
              id: `taksit-${t.id}`,
              hesap,
              tip: 'giris',
              tutar: t.paid_amount || t.amount || 0,
              aciklama: `${t.installment_no || 1}. Taksit Ödemesi`,
              tarih: t.paid_at,
              kaynak: 'Eğitim Tahsilatı',
              ogrenciAdi: t.studentName || (t.student?.first_name ? `${t.student.first_name} ${t.student.last_name}` : '-'),
            });
          });
      }
      
      // Diğer gelirler → GİRİŞ
      if (digerGelirlerJson.success && Array.isArray(digerGelirlerJson.data)) {
        digerGelirlerJson.data
          .filter((g: any) => g.paid_amount > 0)
          .forEach((g: any) => {
            const hesap = odemeYonteminiHesabaCevir(g.payment_type);
            
            tumHareketler.push({
              id: `diger-${g.id}`,
              hesap,
              tip: 'giris',
              tutar: g.paid_amount || 0,
              aciklama: g.title || 'Diğer Gelir',
              tarih: g.date || g.created_at,
              kaynak: 'Diğer Gelir',
              ogrenciAdi: g.student_name || '-',
            });
          });
      }
      
      // Giderler → ÇIKIŞ
      if (giderlerJson.success && Array.isArray(giderlerJson.data)) {
        giderlerJson.data.forEach((g: any) => {
          const hesap = odemeYonteminiHesabaCevir(g.payment_method || 'nakit');
          
          tumHareketler.push({
            id: `gider-${g.id}`,
            hesap,
            tip: 'cikis',
            tutar: g.amount || 0,
            aciklama: g.title || g.description || 'Gider',
            tarih: g.date || g.created_at,
            kaynak: g.category || 'Gider',
          });
        });
      }
      
      // Tarihe göre sırala
      tumHareketler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
      
      setHareketler(tumHareketler);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  };

  // Ödeme yöntemini hesaba çevir
  const odemeYonteminiHesabaCevir = (yontem: string | undefined): HesapTipi => {
    if (!yontem) return 'nakit';
    const y = yontem.toLowerCase();
    if (y === 'cash' || y === 'nakit') return 'nakit';
    if (y === 'card' || y === 'kart' || y === 'pos' || y === 'kredi_karti') return 'pos';
    if (y === 'bank' || y === 'banka' || y === 'eft' || y === 'havale') return 'banka';
    return 'nakit';
  };

  // ==================== FİLTRELEME ====================
  const filtrelenmisHareketler = useMemo(() => {
    const simdi = new Date();
    const bugun = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
    
    return hareketler.filter(h => {
      // Tarih filtresi
      const hTarih = new Date(h.tarih);
      if (tarihFiltre === 'bugun') {
        if (hTarih < bugun) return false;
      } else if (tarihFiltre === 'hafta') {
        const haftaOnce = new Date(bugun);
        haftaOnce.setDate(haftaOnce.getDate() - 7);
        if (hTarih < haftaOnce) return false;
      } else if (tarihFiltre === 'ay') {
        const ayOnce = new Date(bugun);
        ayOnce.setMonth(ayOnce.getMonth() - 1);
        if (hTarih < ayOnce) return false;
      }
      
      // Tip filtresi
      if (tipFiltre !== 'tum' && h.tip !== tipFiltre) return false;
      
      // Hesap filtresi
      if (hesapFiltre !== 'tum' && h.hesap !== hesapFiltre) return false;
      
      // Arama filtresi
      if (aramaMetni) {
        const arama = aramaMetni.toLowerCase();
        if (!h.aciklama.toLowerCase().includes(arama) && 
            !(h.ogrenciAdi?.toLowerCase().includes(arama)) &&
            !(h.kaynak?.toLowerCase().includes(arama))) {
          return false;
        }
      }
      
      return true;
    });
  }, [hareketler, tarihFiltre, tipFiltre, hesapFiltre, aramaMetni]);

  // ==================== HESAP BAKİYELERİ ====================
  const hesapBakiyeleri = useMemo(() => {
    const bakiyeler: Record<HesapTipi, number> = { nakit: 0, banka: 0, pos: 0 };
    
    hareketler.forEach(h => {
      if (h.tip === 'giris') {
        bakiyeler[h.hesap] += h.tutar;
      } else if (h.tip === 'cikis') {
        bakiyeler[h.hesap] -= h.tutar;
      } else if (h.tip === 'transfer' && h.hedefHesap) {
        bakiyeler[h.hesap] -= h.tutar;
        bakiyeler[h.hedefHesap] += h.tutar;
      }
    });
    
    return bakiyeler;
  }, [hareketler]);

  const toplamBakiye = hesapBakiyeleri.nakit + hesapBakiyeleri.banka + hesapBakiyeleri.pos;

  // Dönem özeti
  const donemOzeti = useMemo(() => {
    const girisler = filtrelenmisHareketler.filter(h => h.tip === 'giris').reduce((t, h) => t + h.tutar, 0);
    const cikislar = filtrelenmisHareketler.filter(h => h.tip === 'cikis').reduce((t, h) => t + h.tutar, 0);
    
    return {
      giris: girisler,
      cikis: cikislar,
      net: girisler - cikislar,
      islemSayisi: filtrelenmisHareketler.length
    };
  }, [filtrelenmisHareketler]);

  // ==================== TRANSFER İŞLEMİ ====================
  const transferYap = async () => {
    if (!form.tutar || parseFloat(form.tutar) <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    
    if (form.hesap === form.hedefHesap) {
      toast.error('Kaynak ve hedef hesap aynı olamaz');
      return;
    }
    
    // Transfer hareketi ekle (local state)
    const yeniHareket: Hareket = {
      id: `transfer-${Date.now()}`,
      hesap: form.hesap,
      tip: 'transfer',
      tutar: parseFloat(form.tutar),
      aciklama: form.aciklama || `${hesapAdiGetir(form.hesap)} → ${hesapAdiGetir(form.hedefHesap)} Transfer`,
      tarih: form.tarih,
      hedefHesap: form.hedefHesap,
      kaynak: 'Dahili Transfer'
    };
    
    setHareketler(prev => [yeniHareket, ...prev]);
    toast.success('✅ Transfer kaydedildi');
    modalKapat();
  };

  // ==================== YARDIMCI FONKSİYONLAR ====================
  const hesapAdiGetir = (hesap: HesapTipi): string => {
    const h = HESAPLAR.find(x => x.id === hesap);
    return h?.ad || hesap;
  };

  const formatPara = (tutar: number) => `₺${tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  const formatTarih = (tarih: string) => new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const modalKapat = () => {
    setModalAcik(false);
    setForm({
      tutar: '',
      aciklama: '',
      hesap: 'nakit',
      hedefHesap: 'banka',
      tarih: new Date().toISOString().split('T')[0]
    });
  };

  // ==================== PDF OLUŞTUR ====================
  const pdfOlustur = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const sayfaGenisligi = doc.internal.pageSize.getWidth();
    
    // Başlık
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, sayfaGenisligi, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('Kasa & Banka Hesap Hareketleri', 15, 18);
    doc.setFontSize(11);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 15, 28);
    
    // Tablo
    const tabloVerisi = filtrelenmisHareketler.map(h => [
      formatTarih(h.tarih),
      h.ogrenciAdi || '-',
      h.aciklama,
      hesapAdiGetir(h.hesap),
      h.tip === 'giris' ? 'Giris' : h.tip === 'cikis' ? 'Cikis' : 'Transfer',
      `${h.tip === 'cikis' ? '-' : '+'}${h.tutar.toLocaleString('tr-TR')} TL`
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: [['Tarih', 'Ad Soyad', 'Aciklama', 'Hesap', 'Tip', 'Tutar']],
      body: tabloVerisi,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
    });
    
    doc.save(`Hesap_Hareketleri_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`);
    toast.success('PDF indirildi');
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Kasa & Banka</h1>
            <p className="text-sm text-slate-500">Hesap hareketleri defteri</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setModalTip('transfer'); setModalAcik(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition font-medium text-sm shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Hesaplar Arası Transfer
          </button>
          <button
            onClick={pdfOlustur}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition font-medium text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={verileriYukle}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${yukleniyor ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hesap Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Toplam Bakiye */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Toplam Bakiye</span>
            <Wallet className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold">{formatPara(toplamBakiye)}</p>
          <p className="text-xs text-emerald-200 mt-2">Tüm hesaplar</p>
        </div>

        {/* Nakit Kasa */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">💵 Nakit Kasa</span>
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <p className={`text-2xl font-bold ${hesapBakiyeleri.nakit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatPara(hesapBakiyeleri.nakit)}
          </p>
        </div>

        {/* Banka */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">🏦 Banka Hesabı</span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className={`text-2xl font-bold ${hesapBakiyeleri.banka >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {formatPara(hesapBakiyeleri.banka)}
          </p>
        </div>

        {/* POS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">💳 POS Cihazı</span>
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <p className={`text-2xl font-bold ${hesapBakiyeleri.pos >= 0 ? 'text-purple-600' : 'text-red-500'}`}>
            {formatPara(hesapBakiyeleri.pos)}
          </p>
        </div>
      </div>

      {/* Dönem Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">Dönem Giriş</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">+{formatPara(donemOzeti.giris)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 font-medium">Dönem Çıkış</span>
          </div>
          <p className="text-xl font-bold text-red-600">-{formatPara(donemOzeti.cikis)}</p>
        </div>
        <div className={`${donemOzeti.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className={`w-4 h-4 ${donemOzeti.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            <span className={`text-sm font-medium ${donemOzeti.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Durum</span>
          </div>
          <p className={`text-xl font-bold ${donemOzeti.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {donemOzeti.net >= 0 ? '+' : ''}{formatPara(donemOzeti.net)}
          </p>
        </div>
      </div>

      {/* Filtreler ve İşlem Listesi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filtreler */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Arama */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                placeholder="Hareket ara..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            
            {/* Tarih Filtresi */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {[
                { value: 'bugun', label: 'Bugün' },
                { value: 'hafta', label: 'Hafta' },
                { value: 'ay', label: 'Ay' },
                { value: 'tum', label: 'Tümü' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTarihFiltre(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    tarihFiltre === opt.value
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Tip Filtresi */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {[
                { value: 'tum', label: 'Tümü' },
                { value: 'giris', label: '↑ Giriş' },
                { value: 'cikis', label: '↓ Çıkış' },
                { value: 'transfer', label: '↔ Transfer' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTipFiltre(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    tipFiltre === opt.value
                      ? opt.value === 'giris' ? 'bg-emerald-100 text-emerald-700' 
                        : opt.value === 'cikis' ? 'bg-red-100 text-red-600'
                        : opt.value === 'transfer' ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-200 text-slate-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Hesap Filtresi */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {[
                { value: 'tum', label: 'Tüm Hesaplar' },
                { value: 'nakit', label: '💵 Nakit' },
                { value: 'banka', label: '🏦 Banka' },
                { value: 'pos', label: '💳 POS' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setHesapFiltre(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    hesapFiltre === opt.value
                      ? 'bg-slate-200 text-slate-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <span className="text-sm text-slate-500 ml-auto">
              {donemOzeti.islemSayisi} hareket
            </span>
          </div>
        </div>

        {/* Hareket Tablosu */}
        <div className="overflow-x-auto">
          {yukleniyor ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : filtrelenmisHareketler.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Banknote className="w-12 h-12 mb-3" />
              <p className="font-medium">Hareket bulunamadı</p>
              <p className="text-sm">Bu dönemde kayıtlı hareket yok</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tarih</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Ad Soyad</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Açıklama</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Hesap</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Hareket</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrelenmisHareketler.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatTarih(h.tarih)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">
                      {h.ogrenciAdi || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      <div>{h.aciklama}</div>
                      {h.kaynak && (
                        <span className="text-xs text-slate-400">{h.kaynak}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        h.hesap === 'nakit' ? 'bg-emerald-100 text-emerald-700' :
                        h.hesap === 'banka' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {h.hesap === 'nakit' ? '💵' : h.hesap === 'banka' ? '🏦' : '💳'}
                        {h.hesap === 'nakit' ? 'Nakit' : h.hesap === 'banka' ? 'Banka' : 'POS'}
                        {h.tip === 'transfer' && h.hedefHesap && (
                          <> → {h.hedefHesap === 'nakit' ? '💵' : h.hedefHesap === 'banka' ? '🏦' : '💳'}</>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        h.tip === 'giris' ? 'bg-emerald-100 text-emerald-700' : 
                        h.tip === 'cikis' ? 'bg-red-100 text-red-600' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {h.tip === 'giris' ? '↑ Giriş' : h.tip === 'cikis' ? '↓ Çıkış' : '↔ Transfer'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-bold ${
                        h.tip === 'giris' ? 'text-emerald-600' : 
                        h.tip === 'cikis' ? 'text-red-500' :
                        'text-purple-600'
                      }`}>
                        {h.tip === 'giris' ? '+' : h.tip === 'cikis' ? '-' : '↔'}{formatPara(h.tutar)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {modalAcik && modalTip === 'transfer' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <ArrowLeftRight className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Hesaplar Arası Transfer</h2>
                    <p className="text-white/80 text-sm">Nakit ↔ Banka ↔ POS</p>
                  </div>
                </div>
                <button onClick={modalKapat} className="p-2 hover:bg-white/20 rounded-xl transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Tutar */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Transfer Tutarı</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-purple-600">₺</span>
                  <input
                    type="number"
                    value={form.tutar}
                    onChange={(e) => setForm({ ...form, tutar: e.target.value })}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-center border-2 border-purple-200 rounded-xl focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              
              {/* Kaynak ve Hedef Hesap */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Kaynak Hesap</label>
                  <select
                    value={form.hesap}
                    onChange={(e) => setForm({ ...form, hesap: e.target.value as HesapTipi })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  >
                    <option value="nakit">💵 Nakit Kasa</option>
                    <option value="banka">🏦 Banka</option>
                    <option value="pos">💳 POS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Hesap</label>
                  <select
                    value={form.hedefHesap}
                    onChange={(e) => setForm({ ...form, hedefHesap: e.target.value as HesapTipi })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  >
                    <option value="nakit">💵 Nakit Kasa</option>
                    <option value="banka">🏦 Banka</option>
                    <option value="pos">💳 POS</option>
                  </select>
                </div>
              </div>
              
              {/* Açıklama */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama (Opsiyonel)</label>
                <input
                  type="text"
                  value={form.aciklama}
                  onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                  placeholder="Transfer notu..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tarih</label>
                <input
                  type="date"
                  value={form.tarih}
                  onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={modalKapat}
                className="flex-1 px-5 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-white transition font-semibold"
              >
                İptal
              </button>
              <button
                onClick={transferYap}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Transfer Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
