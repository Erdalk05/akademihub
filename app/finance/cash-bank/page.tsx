'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, Building2, ArrowUpRight, ArrowDownRight, ArrowLeftRight,
  Plus, Download, Search, RefreshCw, Banknote, X, Check, CreditCard,
  TrendingUp, TrendingDown, Calendar, Filter, Eye, FileText, 
  PiggyBank, Receipt, CircleDollarSign, ChevronRight, Printer,
  BarChart3, Clock, Users, AlertTriangle, CheckCircle, ExternalLink, WifiOff
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
// ✅ Offline & Cache desteği
import { getInstallmentsCached, getExpensesCached, getOtherIncomeCached, invalidateFinanceCache } from '@/lib/data/financeDataProvider';
import { useNetworkStatus } from '@/lib/offline/networkStatus';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import { cacheManager } from '@/lib/offline/cacheManager';

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
  
  // ✅ Network status ve cache durumu
  const { isOnline, isOffline } = useNetworkStatus();
  const [isFromCache, setIsFromCache] = useState(false);
  
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

  // ==================== VERİ YÜKLE (Cache Destekli) ====================
  const verileriYukle = useCallback(async (forceRefresh: boolean = false) => {
    setYukleniyor(true);
    console.log(`[KASA-BANKA] 🔄 Veri yükleniyor (Online: ${isOnline}, ForceRefresh: ${forceRefresh})`);
    
    try {
      // ✅ Cache destekli paralel veri çekme
      const [taksitlerResult, giderlerResult, digerGelirlerResult] = await Promise.all([
        getInstallmentsCached(currentOrganization?.id, { forceRefresh }),
        getExpensesCached(currentOrganization?.id, { forceRefresh }),
        getOtherIncomeCached(currentOrganization?.id, { forceRefresh })
      ]);
      
      // Cache durumunu kontrol et (herhangi biri cache'den gelirse)
      const anyFromCache = taksitlerResult.fromCache || giderlerResult.fromCache || digerGelirlerResult.fromCache;
      setIsFromCache(anyFromCache);
      
      console.log(`[KASA-BANKA] ✅ Veriler yüklendi:`, {
        taksitFromCache: taksitlerResult.fromCache,
        giderFromCache: giderlerResult.fromCache,
        digerFromCache: digerGelirlerResult.fromCache
      });
      
      const taksitlerJson = { success: true, data: taksitlerResult.data };
      const giderlerJson = { success: true, data: giderlerResult.data };
      const digerGelirlerJson = { success: true, data: digerGelirlerResult.data };
      
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
      if (isOffline) {
        toast.error('Çevrimdışı mod - Kayıtlı veri bulunamadı');
      } else {
        toast.error('Veriler yüklenemedi');
      }
    } finally {
      setYukleniyor(false);
    }
  }, [currentOrganization?.id, isOnline, isOffline]);

  // ✅ Refresh handler
  const handleRefresh = useCallback(async () => {
    if (isOffline) {
      toast.error('İnternet bağlantısı yok - Yenileme yapılamıyor');
      return;
    }
    invalidateFinanceCache();
    await verileriYukle(true);
    toast.success('Veriler güncellendi');
  }, [isOffline, verileriYukle]);

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

  // ==================== RAPOR MODALI ====================
  const [raporModalAcik, setRaporModalAcik] = useState(false);

  // Tarihe göre hareketleri filtrele
  const getHareketlerByPeriod = useCallback((period: 'gunluk' | 'aylik' | 'yillik' | 'tum') => {
    const simdi = new Date();
    const bugun = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
    
    return hareketler.filter(h => {
      const hTarih = new Date(h.tarih);
      if (period === 'gunluk') {
        return hTarih >= bugun;
      } else if (period === 'aylik') {
        const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
        return hTarih >= ayBasi;
      } else if (period === 'yillik') {
        const yilBasi = new Date(simdi.getFullYear(), 0, 1);
        return hTarih >= yilBasi;
      }
      return true;
    });
  }, [hareketler]);

  // Hesap tipine göre hareketleri filtrele
  const getHareketlerByHesap = useCallback((hesapTip: HesapTipi) => {
    return hareketler.filter(h => h.hesap === hesapTip);
  }, [hareketler]);

  // PDF Oluştur - Genel veya Filtrelenmiş
  const pdfOlustur = useCallback((
    data: Hareket[], 
    baslik: string, 
    altBaslik: string,
    ozet?: { giris: number; cikis: number; net: number }
  ) => {
    const today = new Date().toLocaleDateString('tr-TR');
    const girisler = ozet?.giris ?? data.filter(h => h.tip === 'giris').reduce((t, h) => t + h.tutar, 0);
    const cikislar = ozet?.cikis ?? data.filter(h => h.tip === 'cikis').reduce((t, h) => t + h.tutar, 0);
    const net = ozet?.net ?? (girisler - cikislar);

    const html = `<!DOCTYPE html>
<html><head>
  <title>${baslik}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; font-size: 11px; background: #fff; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 25px; border-radius: 16px; margin-bottom: 25px; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { font-size: 12px; opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; text-align: center; }
    .summary-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-card .value { font-size: 20px; font-weight: bold; margin-top: 8px; }
    .summary-card .value.green { color: #10B981; }
    .summary-card .value.red { color: #EF4444; }
    .summary-card .value.blue { color: #3B82F6; }
    .summary-card .value.purple { color: #8B5CF6; }
    .section-title { font-size: 16px; font-weight: bold; color: #1e293b; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #10B981; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #10B981; color: white; padding: 12px 10px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child { border-radius: 0 8px 0 0; }
    td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    tr:hover { background: #f8fafc; }
    tr:last-child td:first-child { border-radius: 0 0 0 8px; }
    tr:last-child td:last-child { border-radius: 0 0 8px 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 9px; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #059669; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .badge-purple { background: #ede9fe; color: #7c3aed; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .total-row { background: #f1f5f9 !important; font-weight: bold; }
    .total-row td { border-top: 2px solid #10B981; }
    @media print { body { padding: 15px; } .header { padding: 20px; } }
  </style>
</head><body>
  <div class="header">
    <h1>💰 ${baslik}</h1>
    <p>${altBaslik} | Oluşturma: ${today} | Toplam ${data.length} işlem</p>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <div class="label">İşlem Sayısı</div>
      <div class="value blue">${data.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Toplam Giriş</div>
      <div class="value green">+${formatPara(girisler)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Toplam Çıkış</div>
      <div class="value red">-${formatPara(cikislar)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Net Bakiye</div>
      <div class="value ${net >= 0 ? 'green' : 'red'}">${net >= 0 ? '+' : ''}${formatPara(net)}</div>
    </div>
  </div>
  
  <div class="section-title">📋 İşlem Detayları</div>
  
  <table>
    <thead>
      <tr>
        <th style="width:12%">TARİH</th>
        <th style="width:18%">AD SOYAD</th>
        <th style="width:25%">AÇIKLAMA</th>
        <th style="width:10%" class="text-center">KAYNAK</th>
        <th style="width:10%" class="text-center">HESAP</th>
        <th style="width:10%" class="text-center">TİP</th>
        <th style="width:15%" class="text-right">TUTAR</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(h => `
        <tr>
          <td>${formatTarih(h.tarih)}</td>
          <td style="font-weight:500">${h.ogrenciAdi || '-'}</td>
          <td>${h.aciklama}</td>
          <td class="text-center"><span style="font-size:9px;color:#64748b">${h.kaynak || '-'}</span></td>
          <td class="text-center"><span class="badge ${h.hesap === 'nakit' ? 'badge-green' : h.hesap === 'banka' ? 'badge-blue' : 'badge-purple'}">${h.hesap === 'nakit' ? 'Nakit' : h.hesap === 'banka' ? 'Banka' : 'POS'}</span></td>
          <td class="text-center"><span class="badge ${h.tip === 'giris' ? 'badge-green' : h.tip === 'cikis' ? 'badge-red' : 'badge-purple'}">${h.tip === 'giris' ? 'Giriş' : h.tip === 'cikis' ? 'Çıkış' : 'Transfer'}</span></td>
          <td class="text-right" style="font-weight:bold;color:${h.tip === 'giris' ? '#10B981' : h.tip === 'cikis' ? '#EF4444' : '#8B5CF6'}">${h.tip === 'giris' ? '+' : h.tip === 'cikis' ? '-' : '↔'}${formatPara(h.tutar)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="6" class="text-right"><strong>TOPLAM:</strong></td>
        <td class="text-right" style="color:${net >= 0 ? '#10B981' : '#EF4444'}"><strong>${net >= 0 ? '+' : ''}${formatPara(net)}</strong></td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
    <p style="margin-top:5px"><strong>AkademiHub</strong> - Kasa & Banka Modülü</p>
  </div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
    toast.success('PDF hazırlandı');
  }, [formatPara, formatTarih]);

  // Excel Oluştur
  const excelOlustur = useCallback((data: Hareket[], dosyaAdi: string) => {
    // CSV formatında Excel uyumlu dosya
    const BOM = '\uFEFF'; // UTF-8 BOM for Turkish characters
    const headers = ['Tarih', 'Ad Soyad', 'Açıklama', 'Kaynak', 'Hesap', 'Tip', 'Tutar'];
    
    const rows = data.map(h => [
      formatTarih(h.tarih),
      h.ogrenciAdi || '-',
      h.aciklama.replace(/,/g, ' '),
      h.kaynak || '-',
      h.hesap === 'nakit' ? 'Nakit' : h.hesap === 'banka' ? 'Banka' : 'POS',
      h.tip === 'giris' ? 'Giriş' : h.tip === 'cikis' ? 'Çıkış' : 'Transfer',
      `${h.tip === 'giris' ? '+' : h.tip === 'cikis' ? '-' : ''}${h.tutar.toFixed(2)}`
    ]);

    // Özet satırları
    const girisler = data.filter(h => h.tip === 'giris').reduce((t, h) => t + h.tutar, 0);
    const cikislar = data.filter(h => h.tip === 'cikis').reduce((t, h) => t + h.tutar, 0);
    
    rows.push([]);
    rows.push(['', '', '', '', '', 'TOPLAM GİRİŞ:', `+${girisler.toFixed(2)}`]);
    rows.push(['', '', '', '', '', 'TOPLAM ÇIKIŞ:', `-${cikislar.toFixed(2)}`]);
    rows.push(['', '', '', '', '', 'NET BAKİYE:', `${(girisler - cikislar).toFixed(2)}`]);

    const csvContent = BOM + [headers, ...rows].map(row => row.join(';')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dosyaAdi}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('Excel dosyası indirildi');
  }, [formatTarih]);

  // Hesap bazlı PDF
  const hesapPdfOlustur = useCallback((hesapTip: HesapTipi) => {
    const data = getHareketlerByHesap(hesapTip);
    const hesapAdi = hesapTip === 'nakit' ? 'Nakit Kasa' : hesapTip === 'banka' ? 'Banka Hesabı' : 'POS Cihazı';
    pdfOlustur(data, `${hesapAdi} Raporu`, `Tüm ${hesapAdi.toLowerCase()} hareketleri`);
  }, [getHareketlerByHesap, pdfOlustur]);

  // Hesap bazlı Excel
  const hesapExcelOlustur = useCallback((hesapTip: HesapTipi) => {
    const data = getHareketlerByHesap(hesapTip);
    const hesapAdi = hesapTip === 'nakit' ? 'Nakit_Kasa' : hesapTip === 'banka' ? 'Banka' : 'POS';
    excelOlustur(data, hesapAdi);
  }, [getHareketlerByHesap, excelOlustur]);

  // Dönem bazlı PDF
  const donemPdfOlustur = useCallback((period: 'gunluk' | 'aylik' | 'yillik' | 'tum') => {
    const data = getHareketlerByPeriod(period);
    const donemAdi = period === 'gunluk' ? 'Günlük' : period === 'aylik' ? 'Aylık' : period === 'yillik' ? 'Yıllık' : 'Tüm Dönem';
    const tarih = new Date();
    const altBaslik = period === 'gunluk' 
      ? tarih.toLocaleDateString('tr-TR')
      : period === 'aylik'
      ? `${tarih.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`
      : period === 'yillik'
      ? `${tarih.getFullYear()} Yılı`
      : 'Tüm kayıtlar';
    pdfOlustur(data, `${donemAdi} Kasa Raporu`, altBaslik);
  }, [getHareketlerByPeriod, pdfOlustur]);

  // Dönem bazlı Excel
  const donemExcelOlustur = useCallback((period: 'gunluk' | 'aylik' | 'yillik' | 'tum') => {
    const data = getHareketlerByPeriod(period);
    const donemAdi = period === 'gunluk' ? 'Gunluk' : period === 'aylik' ? 'Aylik' : period === 'yillik' ? 'Yillik' : 'Tum_Donem';
    excelOlustur(data, `Kasa_${donemAdi}`);
  }, [getHareketlerByPeriod, excelOlustur]);

  // Tip bazlı (Giriş/Çıkış) PDF
  const tipPdfOlustur = useCallback((tip: 'giris' | 'cikis') => {
    const data = hareketler.filter(h => h.tip === tip);
    const tipAdi = tip === 'giris' ? 'Giriş (Tahsilat)' : 'Çıkış (Gider)';
    pdfOlustur(data, `${tipAdi} Raporu`, 'Tüm kayıtlar');
  }, [hareketler, pdfOlustur]);

  // Tip bazlı Excel
  const tipExcelOlustur = useCallback((tip: 'giris' | 'cikis') => {
    const data = hareketler.filter(h => h.tip === tip);
    const tipAdi = tip === 'giris' ? 'Girisler' : 'Cikislar';
    excelOlustur(data, tipAdi);
  }, [hareketler, excelOlustur]);

  // Genel rapor PDF
  const genelRaporPdf = useCallback(() => {
    pdfOlustur(filtrelenmisHareketler, 'Genel Kasa & Banka Raporu', 'Tüm hesap hareketleri');
  }, [filtrelenmisHareketler, pdfOlustur]);

  // Genel rapor Excel
  const genelRaporExcel = useCallback(() => {
    excelOlustur(filtrelenmisHareketler, 'Kasa_Banka_Genel');
  }, [filtrelenmisHareketler, excelOlustur]);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* ✅ Offline Göstergesi */}
      <OfflineIndicator onRefresh={handleRefresh} />
      
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-emerald-100">Profesyonel hesap yönetimi ve nakit akış takibi</p>
                  {/* Cache durumu göstergesi */}
                  {isFromCache && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/30 text-amber-100 text-xs rounded-full">
                      <Clock className="w-2.5 h-2.5" />
                      Kayıtlı veri
                    </span>
                  )}
                  {isOffline && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-400/30 text-red-100 text-xs rounded-full">
                      <WifiOff className="w-2.5 h-2.5" />
                      Çevrimdışı
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setModalTip('transfer'); setModalAcik(true); }}
                disabled={isOffline}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition font-medium text-sm ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Transfer
              </button>
              <button
                onClick={() => setRaporModalAcik(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 transition font-medium text-sm shadow-sm"
              >
                <Download className="w-4 h-4" />
                Raporlar
              </button>
              <button
                onClick={handleRefresh}
                disabled={isOffline}
                className={`p-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Rapor Modal - Detaylı PDF ve Excel Export */}
      {raporModalAcik && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Rapor Merkezi</h2>
                    <p className="text-emerald-100 text-sm">PDF ve Excel formatında detaylı raporlar</p>
                  </div>
                </div>
                <button onClick={() => setRaporModalAcik(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* HESAP BAZLI RAPORLAR */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Hesap Bazlı Raporlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nakit Kasa */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Banknote className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-800">Nakit Kasa</p>
                        <p className="text-sm text-emerald-600">{getHareketlerByHesap('nakit').length} işlem</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 mb-4">{formatPara(hesapBakiyeleri.nakit)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { hesapPdfOlustur('nakit'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-medium"
                      >
                        <Printer className="w-4 h-4" /> PDF
                      </button>
                      <button
                        onClick={() => { hesapExcelOlustur('nakit'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-emerald-300 text-emerald-700 rounded-xl hover:bg-emerald-50 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Excel
                      </button>
                    </div>
                  </div>

                  {/* Banka */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-800">Banka Hesabı</p>
                        <p className="text-sm text-blue-600">{getHareketlerByHesap('banka').length} işlem</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 mb-4">{formatPara(hesapBakiyeleri.banka)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { hesapPdfOlustur('banka'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium"
                      >
                        <Printer className="w-4 h-4" /> PDF
                      </button>
                      <button
                        onClick={() => { hesapExcelOlustur('banka'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Excel
                      </button>
                    </div>
                  </div>

                  {/* POS */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-purple-800">POS Cihazı</p>
                        <p className="text-sm text-purple-600">{getHareketlerByHesap('pos').length} işlem</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-700 mb-4">{formatPara(hesapBakiyeleri.pos)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { hesapPdfOlustur('pos'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-sm font-medium"
                      >
                        <Printer className="w-4 h-4" /> PDF
                      </button>
                      <button
                        onClick={() => { hesapExcelOlustur('pos'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* DÖNEM BAZLI RAPORLAR */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Dönem Bazlı Raporlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Günlük */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-7 h-7 text-amber-600" />
                      </div>
                      <p className="font-bold text-slate-800">Günlük Rapor</p>
                      <p className="text-sm text-slate-500">{getHareketlerByPeriod('gunluk').length} işlem</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => donemPdfOlustur('gunluk')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-xs font-medium"
                      >
                        <Printer className="w-3 h-3" /> PDF
                      </button>
                      <button
                        onClick={() => donemExcelOlustur('gunluk')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition text-xs font-medium"
                      >
                        <Download className="w-3 h-3" /> Excel
                      </button>
                    </div>
                  </div>

                  {/* Aylık */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-7 h-7 text-cyan-600" />
                      </div>
                      <p className="font-bold text-slate-800">Aylık Rapor</p>
                      <p className="text-sm text-slate-500">{getHareketlerByPeriod('aylik').length} işlem</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => donemPdfOlustur('aylik')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition text-xs font-medium"
                      >
                        <Printer className="w-3 h-3" /> PDF
                      </button>
                      <button
                        onClick={() => donemExcelOlustur('aylik')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 border border-cyan-300 text-cyan-700 rounded-lg hover:bg-cyan-50 transition text-xs font-medium"
                      >
                        <Download className="w-3 h-3" /> Excel
                      </button>
                    </div>
                  </div>

                  {/* Yıllık */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="w-7 h-7 text-indigo-600" />
                      </div>
                      <p className="font-bold text-slate-800">Yıllık Rapor</p>
                      <p className="text-sm text-slate-500">{getHareketlerByPeriod('yillik').length} işlem</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => donemPdfOlustur('yillik')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-xs font-medium"
                      >
                        <Printer className="w-3 h-3" /> PDF
                      </button>
                      <button
                        onClick={() => donemExcelOlustur('yillik')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition text-xs font-medium"
                      >
                        <Download className="w-3 h-3" /> Excel
                      </button>
                    </div>
                  </div>

                  {/* Tüm Dönem */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-7 h-7 text-rose-600" />
                      </div>
                      <p className="font-bold text-slate-800">Tüm Dönem</p>
                      <p className="text-sm text-slate-500">{hareketler.length} işlem</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => donemPdfOlustur('tum')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition text-xs font-medium"
                      >
                        <Printer className="w-3 h-3" /> PDF
                      </button>
                      <button
                        onClick={() => donemExcelOlustur('tum')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 transition text-xs font-medium"
                      >
                        <Download className="w-3 h-3" /> Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* TİP BAZLI RAPORLAR */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  İşlem Tipi Raporları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Girişler */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                          <ArrowUpRight className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-green-800">Tüm Girişler (Tahsilatlar)</p>
                          <p className="text-sm text-green-600">{hareketler.filter(h => h.tip === 'giris').length} işlem</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        +{formatPara(hareketler.filter(h => h.tip === 'giris').reduce((t, h) => t + h.tutar, 0))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => tipPdfOlustur('giris')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-medium"
                      >
                        <Printer className="w-4 h-4" /> PDF İndir
                      </button>
                      <button
                        onClick={() => tipExcelOlustur('giris')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Excel İndir
                      </button>
                    </div>
                  </div>

                  {/* Çıkışlar */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                          <ArrowDownRight className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-red-800">Tüm Çıkışlar (Giderler)</p>
                          <p className="text-sm text-red-600">{hareketler.filter(h => h.tip === 'cikis').length} işlem</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        -{formatPara(hareketler.filter(h => h.tip === 'cikis').reduce((t, h) => t + h.tutar, 0))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => tipPdfOlustur('cikis')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium"
                      >
                        <Printer className="w-4 h-4" /> PDF İndir
                      </button>
                      <button
                        onClick={() => tipExcelOlustur('cikis')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Excel İndir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GENEL RAPOR */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                      <PiggyBank className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Genel Kasa & Banka Raporu</h3>
                      <p className="text-slate-300 text-sm mt-1">Tüm hesaplar ve tüm işlemler - Toplu rapor</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-emerald-400">↑ Giriş: +{formatPara(hareketler.filter(h => h.tip === 'giris').reduce((t, h) => t + h.tutar, 0))}</span>
                        <span className="text-red-400">↓ Çıkış: -{formatPara(hareketler.filter(h => h.tip === 'cikis').reduce((t, h) => t + h.tutar, 0))}</span>
                        <span className="text-white font-bold">Net: {formatPara(toplamBakiye)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={genelRaporPdf}
                      className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-medium"
                    >
                      <Printer className="w-5 h-5" />
                      Genel PDF
                    </button>
                    <button
                      onClick={genelRaporExcel}
                      className="flex items-center gap-2 px-5 py-3 bg-white text-slate-800 rounded-xl hover:bg-slate-100 transition font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Genel Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setRaporModalAcik(false)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
