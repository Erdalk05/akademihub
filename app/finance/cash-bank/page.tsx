'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, Building2, ArrowUpRight, ArrowDownRight, ArrowLeftRight,
  Plus, Download, Search, RefreshCw, Banknote, X, Check, CreditCard,
  TrendingUp, TrendingDown, Calendar, Filter, Eye, FileText, 
  PiggyBank, Receipt, CircleDollarSign, ChevronRight, Printer,
  BarChart3, Clock, Users, AlertTriangle, CheckCircle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
  kaynak?: string;
  ogrenciAdi?: string;
  hedefHesap?: HesapTipi;
  kategori?: string;
}

interface AylikVeri {
  ay: string;
  giris: number;
  cikis: number;
}

// ==================== RENKLER ====================
const CHART_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function KasaBankaPage() {
  const { isAdmin, isAccounting } = usePermission();
  const { currentOrganization } = useOrganizationStore();
  
  const [hareketler, setHareketler] = useState<Hareket[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics'>('overview');
  
  // Filtreler
  const [tarihFiltre, setTarihFiltre] = useState<'bugun' | 'hafta' | 'ay' | 'tum'>('ay');
  const [tipFiltre, setTipFiltre] = useState<'tum' | 'giris' | 'cikis' | 'transfer'>('tum');
  const [hesapFiltre, setHesapFiltre] = useState<'tum' | HesapTipi>('tum');
  const [aramaMetni, setAramaMetni] = useState('');
  
  // Modal state
  const [modalAcik, setModalAcik] = useState(false);
  const [modalTip, setModalTip] = useState<'giris' | 'cikis' | 'transfer'>('transfer');
  
  // Form state
  const [form, setForm] = useState({
    tutar: '',
    aciklama: '',
    hesap: 'nakit' as HesapTipi,
    hedefHesap: 'banka' as HesapTipi,
    tarih: new Date().toISOString().split('T')[0],
    kategori: ''
  });

  // ==================== VERİ YÜKLE ====================
  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const orgParam = currentOrganization?.id ? `?organization_id=${currentOrganization.id}` : '';
      
      const [taksitlerRes, giderlerRes, digerGelirlerRes] = await Promise.all([
        fetch(`/api/installments${orgParam}`),
        fetch(`/api/finance/expenses${orgParam}`),
        fetch(`/api/finance/other-income${orgParam}`)
      ]);
      
      const [taksitlerJson, giderlerJson, digerGelirlerJson] = await Promise.all([
        taksitlerRes.json(),
        giderlerRes.json(),
        digerGelirlerRes.json()
      ]);
      
      const tumHareketler: Hareket[] = [];
      
      // Ödenen taksitler → GİRİŞ
      if (taksitlerJson.success && Array.isArray(taksitlerJson.data)) {
        taksitlerJson.data
          .filter((t: any) => t.is_paid && t.paid_at)
          .forEach((t: any) => {
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
              kategori: 'egitim'
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
              kategori: 'diger'
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
            kategori: g.category || 'genel'
          });
        });
      }
      
      tumHareketler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
      setHareketler(tumHareketler);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  // ==================== YARDIMCI FONKSİYONLAR ====================
  const odemeYonteminiHesabaCevir = (yontem: string | undefined): HesapTipi => {
    if (!yontem) return 'nakit';
    const y = yontem.toLowerCase();
    if (y === 'cash' || y === 'nakit') return 'nakit';
    if (y === 'card' || y === 'kart' || y === 'pos' || y === 'kredi_karti') return 'pos';
    if (y === 'bank' || y === 'banka' || y === 'eft' || y === 'havale') return 'banka';
    return 'nakit';
  };

  const formatPara = (tutar: number) => `₺${Math.abs(tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  const formatTarih = (tarih: string) => new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTarihKisa = (tarih: string) => new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

  // ==================== FİLTRELEME ====================
  const filtrelenmisHareketler = useMemo(() => {
    const simdi = new Date();
    const bugun = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
    
    return hareketler.filter(h => {
      const hTarih = new Date(h.tarih);
      if (tarihFiltre === 'bugun' && hTarih < bugun) return false;
      if (tarihFiltre === 'hafta') {
        const haftaOnce = new Date(bugun);
        haftaOnce.setDate(haftaOnce.getDate() - 7);
        if (hTarih < haftaOnce) return false;
      }
      if (tarihFiltre === 'ay') {
        const ayOnce = new Date(bugun);
        ayOnce.setMonth(ayOnce.getMonth() - 1);
        if (hTarih < ayOnce) return false;
      }
      if (tipFiltre !== 'tum' && h.tip !== tipFiltre) return false;
      if (hesapFiltre !== 'tum' && h.hesap !== hesapFiltre) return false;
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

  // ==================== HESAPLAMALAR ====================
  const hesapBakiyeleri = useMemo(() => {
    const bakiyeler: Record<HesapTipi, number> = { nakit: 0, banka: 0, pos: 0 };
    hareketler.forEach(h => {
      if (h.tip === 'giris') bakiyeler[h.hesap] += h.tutar;
      else if (h.tip === 'cikis') bakiyeler[h.hesap] -= h.tutar;
      else if (h.tip === 'transfer' && h.hedefHesap) {
        bakiyeler[h.hesap] -= h.tutar;
        bakiyeler[h.hedefHesap] += h.tutar;
      }
    });
    return bakiyeler;
  }, [hareketler]);

  const toplamBakiye = hesapBakiyeleri.nakit + hesapBakiyeleri.banka + hesapBakiyeleri.pos;

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

  // Aylık trend verisi
  const aylikTrend = useMemo(() => {
    const aylar: Record<string, { giris: number; cikis: number }> = {};
    const son6Ay: string[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const tarih = new Date();
      tarih.setMonth(tarih.getMonth() - i);
      const key = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
      son6Ay.push(key);
      aylar[key] = { giris: 0, cikis: 0 };
    }
    
    hareketler.forEach(h => {
      const key = h.tarih.slice(0, 7);
      if (aylar[key]) {
        if (h.tip === 'giris') aylar[key].giris += h.tutar;
        else if (h.tip === 'cikis') aylar[key].cikis += h.tutar;
      }
    });
    
    return son6Ay.map(key => {
      const [yil, ay] = key.split('-');
      const ayIsimleri = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return {
        ay: ayIsimleri[parseInt(ay) - 1],
        giris: aylar[key].giris,
        cikis: aylar[key].cikis
      };
    });
  }, [hareketler]);

  // Hesap dağılımı (Pie chart)
  const hesapDagilimi = useMemo(() => [
    { name: 'Nakit Kasa', value: Math.max(0, hesapBakiyeleri.nakit), color: '#10B981' },
    { name: 'Banka', value: Math.max(0, hesapBakiyeleri.banka), color: '#3B82F6' },
    { name: 'POS', value: Math.max(0, hesapBakiyeleri.pos), color: '#8B5CF6' }
  ].filter(h => h.value > 0), [hesapBakiyeleri]);

  // Son 5 işlem
  const sonIslemler = useMemo(() => hareketler.slice(0, 5), [hareketler]);

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
    
    const yeniHareket: Hareket = {
      id: `transfer-${Date.now()}`,
      hesap: form.hesap,
      tip: 'transfer',
      tutar: parseFloat(form.tutar),
      aciklama: form.aciklama || `${form.hesap === 'nakit' ? 'Nakit' : form.hesap === 'banka' ? 'Banka' : 'POS'} → ${form.hedefHesap === 'nakit' ? 'Nakit' : form.hedefHesap === 'banka' ? 'Banka' : 'POS'} Transfer`,
      tarih: form.tarih,
      hedefHesap: form.hedefHesap,
      kaynak: 'Dahili Transfer'
    };
    
    setHareketler(prev => [yeniHareket, ...prev]);
    toast.success('Transfer kaydedildi');
    modalKapat();
  };

  const modalKapat = () => {
    setModalAcik(false);
    setForm({
      tutar: '',
      aciklama: '',
      hesap: 'nakit',
      hedefHesap: 'banka',
      tarih: new Date().toISOString().split('T')[0],
      kategori: ''
    });
  };

  // ==================== PDF ====================
  const pdfOlustur = () => {
    const today = new Date().toLocaleDateString('tr-TR');
    const html = `<!DOCTYPE html>
<html><head>
  <title>Kasa & Banka Raporu</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; margin-bottom: 5px; }
    .header p { font-size: 11px; opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
    .summary-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
    .summary-card .value { font-size: 18px; font-weight: bold; margin-top: 5px; }
    .summary-card .value.green { color: #10B981; }
    .summary-card .value.red { color: #EF4444; }
    .summary-card .value.blue { color: #3B82F6; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #10B981; color: white; padding: 10px 8px; text-align: left; font-size: 10px; }
    td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #059669; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-purple { background: #ede9fe; color: #7c3aed; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #9ca3af; }
  </style>
</head><body>
  <div class="header">
    <h1>💰 Kasa & Banka Hesap Raporu</h1>
    <p>Tarih: ${today} | Toplam ${filtrelenmisHareketler.length} işlem</p>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <div class="label">Toplam Bakiye</div>
      <div class="value green">${formatPara(toplamBakiye)}</div>
    </div>
    <div class="summary-card">
      <div class="label">💵 Nakit Kasa</div>
      <div class="value">${formatPara(hesapBakiyeleri.nakit)}</div>
    </div>
    <div class="summary-card">
      <div class="label">🏦 Banka</div>
      <div class="value blue">${formatPara(hesapBakiyeleri.banka)}</div>
    </div>
    <div class="summary-card">
      <div class="label">💳 POS</div>
      <div class="value">${formatPara(hesapBakiyeleri.pos)}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>TARİH</th>
        <th>AD SOYAD</th>
        <th>AÇIKLAMA</th>
        <th class="text-center">HESAP</th>
        <th class="text-center">TİP</th>
        <th class="text-right">TUTAR</th>
      </tr>
    </thead>
    <tbody>
      ${filtrelenmisHareketler.map(h => `
        <tr>
          <td>${formatTarih(h.tarih)}</td>
          <td>${h.ogrenciAdi || '-'}</td>
          <td>${h.aciklama}<br><small style="color:#9ca3af">${h.kaynak || ''}</small></td>
          <td class="text-center"><span class="badge ${h.hesap === 'nakit' ? 'badge-green' : h.hesap === 'banka' ? '' : 'badge-purple'}" style="${h.hesap === 'banka' ? 'background:#dbeafe;color:#2563eb' : ''}">${h.hesap === 'nakit' ? '💵 Nakit' : h.hesap === 'banka' ? '🏦 Banka' : '💳 POS'}</span></td>
          <td class="text-center"><span class="badge ${h.tip === 'giris' ? 'badge-green' : h.tip === 'cikis' ? 'badge-red' : 'badge-purple'}">${h.tip === 'giris' ? '↑ Giriş' : h.tip === 'cikis' ? '↓ Çıkış' : '↔ Transfer'}</span></td>
          <td class="text-right" style="font-weight:bold;color:${h.tip === 'giris' ? '#10B981' : h.tip === 'cikis' ? '#EF4444' : '#8B5CF6'}">${h.tip === 'giris' ? '+' : h.tip === 'cikis' ? '-' : '↔'}${formatPara(h.tutar)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>${new Date().toLocaleString('tr-TR')} | AkademiHub - Kasa & Banka Modülü</p>
  </div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
    toast.success('PDF hazırlandı');
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Kasa & Banka</h1>
                <p className="text-emerald-100 mt-1">Profesyonel hesap yönetimi ve nakit akış takibi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setModalTip('transfer'); setModalAcik(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition font-medium text-sm"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Transfer
              </button>
              <button
                onClick={pdfOlustur}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 transition font-medium text-sm shadow-sm"
              >
                <Printer className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={verileriYukle}
                className="p-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition"
              >
                <RefreshCw className={`w-5 h-5 ${yukleniyor ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {[
              { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
              { id: 'transactions', label: 'İşlemler', icon: Receipt },
              { id: 'analytics', label: 'Analiz', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-700 shadow-lg' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ==================== GENEL BAKIŞ TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hesap Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Toplam Bakiye */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Toplam Bakiye</span>
                    <PiggyBank className="w-6 h-6 text-emerald-200" />
                  </div>
                  <p className="text-4xl font-bold">{formatPara(toplamBakiye)}</p>
                  <p className="text-sm text-emerald-200 mt-2">Tüm hesapların toplamı</p>
                </div>
              </div>

              {/* Nakit Kasa */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                    <Banknote className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-2xl">💵</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">Nakit Kasa</p>
                <p className={`text-3xl font-bold mt-1 ${hesapBakiyeleri.nakit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatPara(hesapBakiyeleri.nakit)}
                </p>
                <Link href="/finance/payments" className="flex items-center gap-1 text-xs text-emerald-600 mt-3 hover:underline">
                  Tahsilatlar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Banka */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl">🏦</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">Banka Hesabı</p>
                <p className={`text-3xl font-bold mt-1 ${hesapBakiyeleri.banka >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {formatPara(hesapBakiyeleri.banka)}
                </p>
                <button className="flex items-center gap-1 text-xs text-blue-600 mt-3 hover:underline">
                  Ekstre Görüntüle <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* POS */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl">💳</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">POS Cihazı</p>
                <p className={`text-3xl font-bold mt-1 ${hesapBakiyeleri.pos >= 0 ? 'text-purple-600' : 'text-red-500'}`}>
                  {formatPara(hesapBakiyeleri.pos)}
                </p>
                <button className="flex items-center gap-1 text-xs text-purple-600 mt-3 hover:underline">
                  Kart İşlemleri <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Dönem Özeti + Grafik */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sol: Dönem Özeti */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Dönem Özeti
                </h3>
                
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-700 font-medium">Toplam Giriş</p>
                      <p className="text-2xl font-bold text-emerald-700">+{formatPara(donemOzeti.giris)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-red-700 font-medium">Toplam Çıkış</p>
                      <p className="text-2xl font-bold text-red-600">-{formatPara(donemOzeti.cikis)}</p>
                    </div>
                  </div>
                </div>
                
                <div className={`border rounded-2xl p-5 ${donemOzeti.net >= 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${donemOzeti.net >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${donemOzeti.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Durum</p>
                      <p className={`text-2xl font-bold ${donemOzeti.net >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                        {donemOzeti.net >= 0 ? '+' : ''}{formatPara(donemOzeti.net)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ: Aylık Trend */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Son 6 Ay Nakit Akışı
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aylikTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="ay" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                      <Tooltip 
                        formatter={(value: number) => formatPara(value)}
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="giris" name="Giriş" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="cikis" name="Çıkış" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Hızlı Erişim & Son İşlemler */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hızlı Erişim */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                  Hızlı Erişim
                </h3>
                <div className="space-y-3">
                  <Link href="/finance/payments" className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Tahsilatlar</p>
                        <p className="text-xs text-slate-500">Taksit ödemeleri</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition" />
                  </Link>
                  
                  <Link href="/finance/expenses" className="flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Giderler</p>
                        <p className="text-xs text-slate-500">Harcamalar</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition" />
                  </Link>
                  
                  <Link href="/finance/other-income" className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Diğer Gelirler</p>
                        <p className="text-xs text-slate-500">Ek satışlar</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition" />
                  </Link>
                  
                  <Link href="/finance/reports/founder" className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Kurucu Raporu</p>
                        <p className="text-xs text-slate-500">Detaylı analiz</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition" />
                  </Link>
                </div>
              </div>

              {/* Son İşlemler */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Son İşlemler
                  </h3>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    Tümünü Gör <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {sonIslemler.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Banknote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz işlem yok</p>
                    </div>
                  ) : (
                    sonIslemler.map(h => (
                      <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            h.tip === 'giris' ? 'bg-emerald-100' : h.tip === 'cikis' ? 'bg-red-100' : 'bg-purple-100'
                          }`}>
                            {h.tip === 'giris' ? (
                              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                            ) : h.tip === 'cikis' ? (
                              <ArrowDownRight className="w-5 h-5 text-red-500" />
                            ) : (
                              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{h.aciklama}</p>
                            <p className="text-xs text-slate-500">{h.ogrenciAdi || h.kaynak} • {formatTarihKisa(h.tarih)}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${
                          h.tip === 'giris' ? 'text-emerald-600' : h.tip === 'cikis' ? 'text-red-500' : 'text-purple-600'
                        }`}>
                          {h.tip === 'giris' ? '+' : h.tip === 'cikis' ? '-' : '↔'}{formatPara(h.tutar)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== İŞLEMLER TAB ==================== */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Filtreler */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
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
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {['bugun', 'hafta', 'ay', 'tum'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setTarihFiltre(opt as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          tarihFiltre === opt ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt === 'bugun' ? 'Bugün' : opt === 'hafta' ? 'Hafta' : opt === 'ay' ? 'Ay' : 'Tümü'}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {[
                      { value: 'tum', label: 'Tümü', color: 'bg-slate-200 text-slate-700' },
                      { value: 'giris', label: '↑ Giriş', color: 'bg-emerald-100 text-emerald-700' },
                      { value: 'cikis', label: '↓ Çıkış', color: 'bg-red-100 text-red-600' },
                      { value: 'transfer', label: '↔ Transfer', color: 'bg-purple-100 text-purple-700' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTipFiltre(opt.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          tipFiltre === opt.value ? opt.color : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {[
                      { value: 'tum', label: 'Tüm Hesaplar' },
                      { value: 'nakit', label: '💵 Nakit' },
                      { value: 'banka', label: '🏦 Banka' },
                      { value: 'pos', label: '💳 POS' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setHesapFiltre(opt.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          hesapFiltre === opt.value ? 'bg-slate-200 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  
                  <span className="text-sm text-slate-500 ml-auto">{donemOzeti.islemSayisi} hareket</span>
                </div>
              </div>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto">
              {yukleniyor ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filtrelenmisHareketler.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Banknote className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-medium text-lg">Hareket bulunamadı</p>
                  <p className="text-sm">Bu dönemde kayıtlı hareket yok</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tarih</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wide">Ad Soyad</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wide">Açıklama</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wide">Hesap</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wide">Hareket</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtrelenmisHareketler.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">{formatTarih(h.tarih)}</td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-800">{h.ogrenciAdi || '-'}</td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-slate-700">{h.aciklama}</p>
                          {h.kaynak && <span className="text-xs text-slate-400">{h.kaynak}</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            h.hesap === 'nakit' ? 'bg-emerald-100 text-emerald-700' :
                            h.hesap === 'banka' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {h.hesap === 'nakit' ? '💵 Nakit' : h.hesap === 'banka' ? '🏦 Banka' : '💳 POS'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            h.tip === 'giris' ? 'bg-emerald-100 text-emerald-700' : 
                            h.tip === 'cikis' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {h.tip === 'giris' ? '↑ Giriş' : h.tip === 'cikis' ? '↓ Çıkış' : '↔ Transfer'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`text-lg font-bold ${
                            h.tip === 'giris' ? 'text-emerald-600' : h.tip === 'cikis' ? 'text-red-500' : 'text-purple-600'
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
        )}

        {/* ==================== ANALİZ TAB ==================== */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hesap Dağılımı Pie Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Hesap Dağılımı</h3>
              <div className="h-72">
                {hesapDagilimi.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hesapDagilimi}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {hesapDagilimi.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatPara(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Veri yok
                  </div>
                )}
              </div>
            </div>

            {/* Aylık Karşılaştırma */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Aylık Karşılaştırma</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aylikTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="ay" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatPara(value)} />
                    <Legend />
                    <Bar dataKey="giris" name="Giriş" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cikis" name="Çıkış" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Özet İstatistikler</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-sm text-emerald-700 font-medium">Toplam Giriş</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {formatPara(hareketler.filter(h => h.tip === 'giris').reduce((t, h) => t + h.tutar, 0))}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-medium">Toplam Çıkış</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatPara(hareketler.filter(h => h.tip === 'cikis').reduce((t, h) => t + h.tutar, 0))}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700 font-medium">İşlem Sayısı</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{hareketler.length}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700 font-medium">Ortalama İşlem</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {formatPara(hareketler.length > 0 ? hareketler.reduce((t, h) => t + h.tutar, 0) / hareketler.length : 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {modalAcik && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
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
            
            <div className="p-6 space-y-5">
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
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama</label>
                <input
                  type="text"
                  value={form.aciklama}
                  onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                  placeholder="Transfer notu..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              
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
