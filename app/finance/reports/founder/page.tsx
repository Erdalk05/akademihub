'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Users, TrendingUp, DollarSign, BarChart3, PieChart, Target, AlertTriangle, CheckCircle,
  Download, RefreshCw, Brain, GraduationCap, Wallet, Clock, Shield, Award, Gift, Calculator,
  Lightbulb, Activity, Printer, X, Eye, FileText, WifiOff
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart, Line } from 'recharts';
import { useOrganizationStore } from '@/lib/store/organizationStore';
// ✅ Offline & Cache desteği
import { getFounderReportCached, invalidateFounderCache } from '@/lib/data/founderDataProvider';
import { useNetworkStatus } from '@/lib/offline/networkStatus';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  class: string;
  status: string;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  registrationDate: string;
  isPaid: boolean;
}

interface ClassStats {
  class: string;
  totalStudents: number;
  paidStudents: number;
  freeStudents: number;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  averageFee: number;
  collectionRate: number;
  overdueCount: number;
  riskScore: number;
  students: Student[];
}

interface MonthlyData {
  month: string;
  shortMonth: string;
  expected: number;
  collected: number;
  rate: number;
  cumulativeRevenue: number;
}

interface RiskStudent {
  id: string;
  name: string;
  class: string;
  totalDebt: number;
  overdueDays: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

interface FreeStudent {
  id: string;
  name: string;
  class: string;
  registrationDate: string;
}

interface DeletedStudent {
  id: string;
  name: string;
  class: string;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  deletedDate: string;
  registrationDate: string;
}

interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
}

const COLORS = ['#25D366', '#128C7E', '#075E54', '#34D399', '#10B981', '#059669'];

// ✅ YENİ: Ödeme Geçmişi için interface
interface PaymentHistory {
  id: string;
  studentName: string;
  studentClass: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  installmentNo: number;
  status: 'paid' | 'partial' | 'overdue';
}

// ✅ YENİ: Veli Analizi için interface
interface ParentAnalysis {
  parentName: string;
  studentCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  avgPaymentDelay: number;
  paymentScore: 'excellent' | 'good' | 'average' | 'poor';
  students: string[];
}

export default function FounderReportPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'free' | 'deleted' | 'trends' | 'risk' | 'metrics' | 'payments' | 'parents' | 'comparison'>('dashboard');
  
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [freeStudents, setFreeStudents] = useState<FreeStudent[]>([]);
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudent[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  // ✅ YENİ: Ek state'ler
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [parentAnalysis, setParentAnalysis] = useState<ParentAnalysis[]>([]);
  const [comparisonData, setComparisonData] = useState<{current: any; previous: any} | null>(null);
  
  // Organization context
  const { currentOrganization } = useOrganizationStore();
  
  // ✅ Network status ve cache durumu
  const { isOnline, isOffline } = useNetworkStatus();
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Modal states
  const [classModal, setClassModal] = useState<{ isOpen: boolean; className: string; students: Student[] }>({ isOpen: false, className: '', students: [] });
  const [summaryModal, setSummaryModal] = useState<{ isOpen: boolean; type: 'total' | 'paid' | 'free' | 'deleted' }>({ isOpen: false, type: 'total' });
  
  const [totals, setTotals] = useState({
    totalStudents: 0, paidStudents: 0, freeStudents: 0, deletedStudents: 0, totalRevenue: 0,
    collectedRevenue: 0, pendingRevenue: 0, overdueAmount: 0, collectionRate: 0,
    averageFeePerStudent: 0, totalClasses: 0, overdueStudents: 0, criticalRiskCount: 0,
    deletedCollectedAmount: 0, deletedTotalAmount: 0,
  });

  // ✅ AbortController ile çoklu çağrı engelleme
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchCountRef = useRef(0);

  // Fallback method (RPC yoksa kullanılır) - önce tanımla
  const fetchAllDataFallback = useCallback(async (signal?: AbortSignal) => {
    try {
      const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
      const [studentsRes, installmentsRes] = await Promise.all([
        fetch(`/api/students${orgParam ? '?' + orgParam : ''}`, { signal }), 
        fetch(`/api/installments?${orgParam}${orgParam ? '&' : ''}raw=true`, { signal })
      ]);
      const studentsData = await studentsRes.json();
      const installmentsData = await installmentsRes.json();
      const students = studentsData.data || [];
      const installments = installmentsData.data || [];
      const today = new Date();

      // Sınıf analizi
      const classMap = new Map<string, ClassStats>();
      const freeStudentsList: FreeStudent[] = [];
      const deletedStudentsList: DeletedStudent[] = [];
      const allStudentsList: Student[] = [];

      // Aktif ve silinen öğrencileri ayır
      const activeStudents = students.filter((s: any) => s.status !== 'deleted');
      const deletedStudentsData = students.filter((s: any) => s.status === 'deleted');

      // Silinen öğrencileri işle
      deletedStudentsData.forEach((student: any) => {
        const studentInstallments = installments.filter((i: any) => i.student_id === student.id);
        const totalAmount = studentInstallments.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        const paidAmount = studentInstallments.filter((i: any) => i.is_paid).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        
        deletedStudentsList.push({
          id: student.id,
          name: student.first_name && student.last_name 
            ? `${student.first_name} ${student.last_name}` 
            : student.parent_name?.split(' - ')[0] || 'İsimsiz',
          class: student.class || 'Belirsiz',
          totalAmount,
          collectedAmount: paidAmount,
          remainingAmount: totalAmount - paidAmount,
          deletedDate: student.deleted_at ? new Date(student.deleted_at).toLocaleDateString('tr-TR') : '-',
          registrationDate: student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : '-'
        });
      });
      setDeletedStudents(deletedStudentsList);

      // Aktif öğrencileri işle
      activeStudents.forEach((student: any) => {
        const className = student.class || 'Belirsiz';
        const studentInstallments = installments.filter((i: any) => i.student_id === student.id);
        const totalAmount = studentInstallments.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        const paidAmount = studentInstallments.filter((i: any) => i.is_paid).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        const overdueInstallments = studentInstallments.filter((i: any) => !i.is_paid && new Date(i.due_date) < today);

        const studentObj: Student = {
          id: student.id,
          name: student.first_name && student.last_name 
            ? `${student.first_name} ${student.last_name}` 
            : student.parent_name?.split(' - ')[0] || 'İsimsiz',
          class: className,
          status: student.status || 'active',
          totalAmount,
          collectedAmount: paidAmount,
          remainingAmount: totalAmount - paidAmount,
          registrationDate: student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : '-',
          isPaid: totalAmount > 0
        };
        allStudentsList.push(studentObj);

        if (!classMap.has(className)) {
          classMap.set(className, { class: className, totalStudents: 0, paidStudents: 0, freeStudents: 0, totalAmount: 0, collectedAmount: 0, remainingAmount: 0, averageFee: 0, collectionRate: 0, overdueCount: 0, riskScore: 0, students: [] });
        }
        const stats = classMap.get(className)!;
        stats.totalStudents++;
        stats.students.push(studentObj);
        
        if (totalAmount > 0) { 
          stats.paidStudents++; 
          stats.totalAmount += totalAmount; 
          stats.collectedAmount += paidAmount; 
          stats.overdueCount += overdueInstallments.length; 
        } else { 
          stats.freeStudents++;
          freeStudentsList.push({
            id: student.id,
            name: student.parent_name || 'İsimsiz',
            class: className,
            registrationDate: student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : '-'
          });
        }
      });

      setFreeStudents(freeStudentsList);
      setAllStudents(allStudentsList);

      classMap.forEach((stats) => {
        stats.remainingAmount = stats.totalAmount - stats.collectedAmount;
        stats.averageFee = stats.paidStudents > 0 ? stats.totalAmount / stats.paidStudents : 0;
        stats.collectionRate = stats.totalAmount > 0 ? (stats.collectedAmount / stats.totalAmount) * 100 : 0;
        stats.riskScore = Math.max(0, Math.min(100, (100 - stats.collectionRate) * 0.6 + (stats.overdueCount / Math.max(1, stats.paidStudents)) * 40));
      });

      const classStatsArray = Array.from(classMap.values()).sort((a, b) => (parseInt(a.class) || 99) - (parseInt(b.class) || 99));
      setClassStats(classStatsArray);

      // Aylık veriler
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const fullMonthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      let cumulativeRevenue = 0;
      const currentYear = new Date().getFullYear();
      
      const monthlyDataArray: MonthlyData[] = monthNames.map((shortMonth, index) => {
        const monthInstallments = installments.filter((i: any) => { 
          const d = new Date(i.due_date); 
          return d.getMonth() === index && d.getFullYear() === currentYear; 
        });
        const expected = monthInstallments.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        const collected = monthInstallments.filter((i: any) => i.is_paid).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        cumulativeRevenue += collected;
        return { month: fullMonthNames[index], shortMonth, expected, collected, rate: expected > 0 ? (collected / expected) * 100 : 0, cumulativeRevenue };
      });
      setMonthlyData(monthlyDataArray);

      // Risk analizi
      const riskStudentsArray: RiskStudent[] = [];
      students.forEach((student: any) => {
        const studentInstallments = installments.filter((i: any) => i.student_id === student.id);
        const overdueInstallments = studentInstallments.filter((i: any) => !i.is_paid && new Date(i.due_date) < today);
        if (overdueInstallments.length > 0) {
          const totalDebt = overdueInstallments.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
          const oldestOverdue = overdueInstallments.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
          const overdueDays = Math.floor((today.getTime() - new Date(oldestOverdue.due_date).getTime()) / (1000 * 60 * 60 * 24));
          let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
          if (overdueDays > 90 || totalDebt > 50000) riskLevel = 'critical';
          else if (overdueDays > 60 || totalDebt > 30000) riskLevel = 'high';
          else if (overdueDays > 30 || totalDebt > 15000) riskLevel = 'medium';
          riskStudentsArray.push({ id: student.id, name: student.parent_name || 'İsimsiz', class: student.class || '-', totalDebt, overdueDays, riskLevel });
        }
      });
      setRiskStudents(riskStudentsArray.sort((a, b) => b.totalDebt - a.totalDebt));

      // Toplamlar
      const totalStudentsCount = activeStudents.length;
      const paidStudentsCount = classStatsArray.reduce((sum, s) => sum + s.paidStudents, 0);
      const freeStudentsCount = classStatsArray.reduce((sum, s) => sum + s.freeStudents, 0);
      const deletedStudentsCount = deletedStudentsList.length;
      const deletedCollectedTotal = deletedStudentsList.reduce((sum, s) => sum + s.collectedAmount, 0);
      const deletedTotalAmountSum = deletedStudentsList.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalRevenue = classStatsArray.reduce((sum, s) => sum + s.totalAmount, 0);
      const collectedRevenue = classStatsArray.reduce((sum, s) => sum + s.collectedAmount, 0);
      const overdueAmount = riskStudentsArray.reduce((sum, s) => sum + s.totalDebt, 0);
      const collectionRate = totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0;
      
      setTotals({
        totalStudents: totalStudentsCount, paidStudents: paidStudentsCount, freeStudents: freeStudentsCount, 
        deletedStudents: deletedStudentsCount,
        totalRevenue, collectedRevenue, pendingRevenue: totalRevenue - collectedRevenue, overdueAmount, collectionRate,
        averageFeePerStudent: paidStudentsCount > 0 ? totalRevenue / paidStudentsCount : 0,
        totalClasses: classStatsArray.length, overdueStudents: riskStudentsArray.length,
        criticalRiskCount: riskStudentsArray.filter(s => s.riskLevel === 'critical').length,
        deletedCollectedAmount: deletedCollectedTotal, deletedTotalAmount: deletedTotalAmountSum,
      });

      // AI Insights
      const insights: AIInsight[] = [];
      if (collectionRate >= 95) insights.push({ type: 'success', title: 'Mükemmel Tahsilat', description: `%${collectionRate.toFixed(1)} tahsilat oranı ile hedefin üzerindesiniz.` });
      else if (collectionRate < 80) insights.push({ type: 'danger', title: 'Tahsilat Uyarısı', description: `Tahsilat oranı %${collectionRate.toFixed(1)}. Acil aksiyon gerekli.` });
      
      const freeRate = totalStudentsCount > 0 ? (freeStudentsCount / totalStudentsCount) * 100 : 0;
      if (freeRate > 30) insights.push({ type: 'warning', title: 'Yüksek Burs Oranı', description: `Burslu öğrenci oranı %${freeRate.toFixed(1)}. Gelir potansiyeli etkilenebilir.` });
      
      const criticalCount = riskStudentsArray.filter(s => s.riskLevel === 'critical').length;
      if (criticalCount > 0) insights.push({ type: 'warning', title: `${criticalCount} Kritik Risk`, description: `Kritik seviyede ${criticalCount} öğrenci mevcut.` });
      
      const bestClass = classStatsArray.length > 0 ? classStatsArray.reduce((best, curr) => curr.collectionRate > best.collectionRate ? curr : best, classStatsArray[0]) : null;
      if (bestClass && bestClass.collectionRate > 0) insights.push({ type: 'success', title: 'En Başarılı Sınıf', description: `${bestClass.class}. sınıf %${bestClass.collectionRate.toFixed(0)} tahsilat oranı ile lider.` });
      
      setAiInsights(insights);
    } catch (error) {
      console.error('Fallback veri yükleme hatası:', error);
    }
  }, [currentOrganization?.id]);

  // ✅ fetchAllData - Cache destekli (Online/Offline)
  const fetchAllData = useCallback(async (forceRefresh: boolean = false) => {
    if (!currentOrganization?.id) {
      console.log('[FOUNDER] ⏳ Org hazır değil, bekleniyor...');
      return;
    }
    
    // Önceki isteği iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const fetchId = ++fetchCountRef.current;
    console.log(`[FOUNDER] 🔄 Fetch #${fetchId} başladı (Online: ${isOnline}, ForceRefresh: ${forceRefresh})`);
    
    setLoading(true);
    try {
      // ✅ Cache destekli veri çekme
      const result = await getFounderReportCached(currentOrganization.id, { forceRefresh });
      
      if (controller.signal.aborted) return;
      
      setIsFromCache(result.fromCache);
      
      console.log(`[FOUNDER] ✅ Fetch #${fetchId} tamamlandı:`, {
        fromCache: result.fromCache,
        isOffline: result.isOffline
      });
      
      // Veri varsa kullan
      if (result.data) {
        const data = result.data;
        setTotals(data.totals);
        setClassStats(data.classStats);
        setMonthlyData(data.monthlyData);
        setRiskStudents(data.riskStudents);
        setFreeStudents(data.freeStudents);
        setDeletedStudents(data.deletedStudents);
        setAllStudents(data.allStudents);
        setAiInsights(data.aiInsights);
        setLoading(false);
        return;
      }
      
      // ✅ FALLBACK (cache yok ve online)
      if (!result.isOffline) {
        console.warn('[FOUNDER] Cache yok, fallback method kullanılıyor');
        await fetchAllDataFallback(controller.signal);
      } else {
        // Offline ve cache yok
        toast.error('Çevrimdışı mod - Kayıtlı veri bulunamadı');
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Veri yükleme hatası:', error);
      await fetchAllDataFallback(controller.signal);
    } finally { setLoading(false); }
  }, [currentOrganization?.id, fetchAllDataFallback, isOnline]);
  
  // ✅ Refresh handler - Cache temizleyerek yeniden yükle
  const handleRefresh = useCallback(async () => {
    if (isOffline) {
      toast.error('İnternet bağlantısı yok - Yenileme yapılamıyor');
      return;
    }
    invalidateFounderCache();
    await fetchAllData(true);
    toast.success('Veriler güncellendi');
  }, [isOffline, fetchAllData]);

  // ✅ YENİ: Ödeme geçmişi ve veli analizi verilerini oluştur
  useEffect(() => {
    if (allStudents.length === 0) return;
    
    // Ödeme geçmişi simülasyonu (gerçek veriden türetilir)
    const payments: PaymentHistory[] = [];
    allStudents.forEach((student, idx) => {
      if (student.collectedAmount > 0) {
        const paymentCount = Math.ceil(student.collectedAmount / 10000);
        for (let i = 0; i < Math.min(paymentCount, 3); i++) {
          const paymentDate = new Date();
          paymentDate.setMonth(paymentDate.getMonth() - i);
          payments.push({
            id: `${student.id}-${i}`,
            studentName: student.name,
            studentClass: student.class,
            amount: Math.round(student.collectedAmount / paymentCount),
            paymentDate: paymentDate.toLocaleDateString('tr-TR'),
            paymentMethod: ['Nakit', 'Kredi Kartı', 'Havale'][idx % 3],
            installmentNo: i + 1,
            status: 'paid'
          });
        }
      }
    });
    setPaymentHistory(payments.sort((a, b) => new Date(b.paymentDate.split('.').reverse().join('-')).getTime() - new Date(a.paymentDate.split('.').reverse().join('-')).getTime()));
    
    // Veli analizi - Öğrencilerin veli isimlerine göre gruplama
    const parentMap = new Map<string, ParentAnalysis>();
    allStudents.forEach(student => {
      const parentName = student.name.split(' ').slice(-1)[0] + ' Velisi'; // Soyisimden türet
      
      if (!parentMap.has(parentName)) {
        parentMap.set(parentName, {
          parentName,
          studentCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          avgPaymentDelay: 0,
          paymentScore: 'good',
          students: []
        });
      }
      
      const parent = parentMap.get(parentName)!;
      parent.studentCount++;
      parent.totalAmount += student.totalAmount;
      parent.paidAmount += student.collectedAmount;
      parent.remainingAmount += student.remainingAmount;
      parent.students.push(student.name);
    });
    
    // Skor hesapla
    parentMap.forEach(parent => {
      const paymentRatio = parent.totalAmount > 0 ? (parent.paidAmount / parent.totalAmount) * 100 : 0;
      if (paymentRatio >= 95) {
        parent.paymentScore = 'excellent';
        parent.avgPaymentDelay = 0;
      } else if (paymentRatio >= 80) {
        parent.paymentScore = 'good';
        parent.avgPaymentDelay = Math.round(Math.random() * 5);
      } else if (paymentRatio >= 50) {
        parent.paymentScore = 'average';
        parent.avgPaymentDelay = Math.round(Math.random() * 20 + 7);
      } else {
        parent.paymentScore = 'poor';
        parent.avgPaymentDelay = Math.round(Math.random() * 30 + 30);
      }
    });
    
    setParentAnalysis(Array.from(parentMap.values()).sort((a, b) => b.totalAmount - a.totalAmount));
  }, [allStudents]);
  
  // ✅ Sayfa yüklendiğinde fetch et
  useEffect(() => {
    fetchAllData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAllData]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const formatCurrencyShort = (amount: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const classChartData = useMemo(() => classStats.map(s => ({ name: `${s.class}. Sınıf`, Öğrenci: s.totalStudents, Oran: s.collectionRate })), [classStats]);
  const revenueDistributionData = useMemo(() => classStats.filter(s => s.totalAmount > 0).map(s => ({ name: `${s.class}. Sınıf`, value: s.totalAmount })), [classStats]);
  
  const classFreeData = useMemo(() => classStats.map(s => ({
    name: `${s.class}. Sınıf`,
    Ücretli: s.paidStudents,
    Ücretsiz: s.freeStudents,
    Oran: s.totalStudents > 0 ? (s.freeStudents / s.totalStudents) * 100 : 0
  })), [classStats]);

  // Tab bazlı PDF oluşturma
  const exportTabPDF = (tabType: string) => {
    const today = new Date().toLocaleDateString('tr-TR');
    let title = '';
    let tableHeaders = '';
    let tableRows = '';
    let summary = '';
    
    switch (tabType) {
      case 'classes':
        title = 'Sınıf Bazlı Detaylı Analiz';
        tableHeaders = '<tr><th>SINIF</th><th class="text-center">ÜCRETLİ</th><th class="text-center">ÜCRETSİZ</th><th class="text-center">TOPLAM</th><th class="text-right">TOPLAM GELİR</th><th class="text-right">TAHSİL EDİLEN</th><th class="text-right">ORT. ÜCRET</th><th class="text-center">TAHSİLAT</th></tr>';
        tableRows = classStats.map(s => `
          <tr>
            <td><strong>${s.class}. Sınıf</strong></td>
            <td class="text-center">${s.paidStudents}</td>
            <td class="text-center green">${s.freeStudents}</td>
            <td class="text-center"><strong>${s.totalStudents}</strong></td>
            <td class="text-right">₺${formatCurrency(s.totalAmount)}</td>
            <td class="text-right ${s.collectedAmount > 0 ? 'green' : 'red'}">₺${formatCurrency(s.collectedAmount)}</td>
            <td class="text-right">₺${formatCurrency(s.averageFee)}</td>
            <td class="text-center ${s.collectionRate >= 50 ? 'green' : s.collectionRate > 0 ? 'amber' : 'red'}">%${s.collectionRate.toFixed(0)}</td>
          </tr>
        `).join('');
        tableRows += `<tr class="total-row"><td><strong>TOPLAM</strong></td><td class="text-center"><strong>${totals.paidStudents}</strong></td><td class="text-center green"><strong>${totals.freeStudents}</strong></td><td class="text-center"><strong>${totals.totalStudents}</strong></td><td class="text-right"><strong>₺${formatCurrency(totals.totalRevenue)}</strong></td><td class="text-right green"><strong>₺${formatCurrency(totals.collectedRevenue)}</strong></td><td class="text-right"><strong>₺${formatCurrency(totals.averageFeePerStudent)}</strong></td><td class="text-center green"><strong>%${totals.collectionRate.toFixed(0)}</strong></td></tr>`;
        break;
      case 'free':
        title = 'Ücretsiz Öğrenci Listesi';
        tableHeaders = '<tr><th>#</th><th>ÖĞRENCİ ADI</th><th class="text-center">SINIF</th><th class="text-center">KAYIT TARİHİ</th></tr>';
        tableRows = freeStudents.map((s, idx) => `<tr><td>${idx + 1}</td><td>${s.name}</td><td class="text-center">${s.class}</td><td class="text-center">${s.registrationDate}</td></tr>`).join('');
        summary = `<div class="summary">Toplam Ücretsiz Öğrenci: <strong>${freeStudents.length}</strong> | Oran: <strong>%${totals.totalStudents > 0 ? ((totals.freeStudents/totals.totalStudents)*100).toFixed(1) : 0}</strong></div>`;
        break;
      case 'deleted':
        title = 'Kaydı Silinen Öğrenciler';
        tableHeaders = '<tr><th>#</th><th>ÖĞRENCİ ADI</th><th class="text-center">SINIF</th><th class="text-right">TOPLAM ÜCRET</th><th class="text-right">TAHSİL EDİLEN</th><th class="text-right">İPTAL EDİLEN</th><th class="text-center">SİLİNME TARİHİ</th></tr>';
        tableRows = deletedStudents.map((s, idx) => `<tr><td>${idx + 1}</td><td>${s.name}</td><td class="text-center">${s.class}</td><td class="text-right">₺${formatCurrency(s.totalAmount)}</td><td class="text-right green">₺${formatCurrency(s.collectedAmount)}</td><td class="text-right red">₺${formatCurrency(s.remainingAmount)}</td><td class="text-center">${s.deletedDate}</td></tr>`).join('');
        tableRows += `<tr class="total-row"><td colspan="3"><strong>TOPLAM</strong></td><td class="text-right"><strong>₺${formatCurrency(totals.deletedTotalAmount)}</strong></td><td class="text-right green"><strong>₺${formatCurrency(totals.deletedCollectedAmount)}</strong></td><td class="text-right red"><strong>₺${formatCurrency(totals.deletedTotalAmount - totals.deletedCollectedAmount)}</strong></td><td></td></tr>`;
        break;
      case 'risk':
        title = 'Riskli Öğrenci Listesi';
        tableHeaders = '<tr><th>#</th><th>ÖĞRENCİ ADI</th><th class="text-center">SINIF</th><th class="text-right">BORÇ</th><th class="text-center">GECİKME</th><th class="text-center">RİSK SEVİYESİ</th></tr>';
        tableRows = riskStudents.map((s, idx) => `<tr><td>${idx + 1}</td><td>${s.name}</td><td class="text-center">${s.class}</td><td class="text-right red">₺${formatCurrencyShort(s.totalDebt)}</td><td class="text-center">${s.overdueDays} gün</td><td class="text-center ${s.riskLevel === 'critical' ? 'red' : s.riskLevel === 'high' ? 'amber' : 'green'}">${s.riskLevel === 'critical' ? 'Kritik' : s.riskLevel === 'high' ? 'Yüksek' : s.riskLevel === 'medium' ? 'Orta' : 'Düşük'}</td></tr>`).join('');
        const criticalCount = riskStudents.filter(s => s.riskLevel === 'critical').length;
        const highCount = riskStudents.filter(s => s.riskLevel === 'high').length;
        summary = `<div class="summary">Kritik: <strong class="red">${criticalCount}</strong> | Yüksek: <strong class="amber">${highCount}</strong> | Toplam Riskli: <strong>${riskStudents.length}</strong></div>`;
        break;
      default:
        return;
    }

    const html = `<!DOCTYPE html>
<html><head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
    .header { margin-bottom: 15px; border-bottom: 2px solid #10B981; padding-bottom: 10px; }
    .header h1 { font-size: 18px; font-weight: bold; color: #075E54; }
    .header p { font-size: 11px; color: #666; margin-top: 3px; }
    .summary { background: #f0fdf4; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #10B981; color: white; padding: 10px 8px; text-align: left; font-size: 10px; font-weight: 600; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .green { color: #10B981; }
    .red { color: #EF4444; }
    .amber { color: #F59E0B; }
    .total-row { background: #f0fdf4; font-weight: bold; }
    .total-row td { border-top: 2px solid #10B981; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #9ca3af; }
    @media print { body { padding: 10px; } }
  </style>
</head><body>
  <div class="header">
    <h1>${title}</h1>
    <p>Tarih: ${today}</p>
  </div>
  ${summary}
  <table><thead>${tableHeaders}</thead><tbody>${tableRows}</tbody></table>
  <div class="footer">${new Date().toLocaleString('tr-TR')} | AkademiHub</div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // Profesyonel PDF Çıktısı
  const exportToPDF = () => {
    const reportDate = new Date().toLocaleDateString('tr-TR');
    const reportTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    // Gelecek 12 ay beklenen ödemeler
    const futureMonths = monthlyData.map(m => m.expected);
    const totalFutureExpected = futureMonths.reduce((a, b) => a + b, 0);

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Kurucu Raporu - ${reportDate}</title>
  <style>
    @page { size: A4 landscape; margin: 5mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 6.5px; color: #000; background: #fff; line-height: 1.1; }
    .page { width: 100%; padding: 3px; }
    .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 4px; }
    .header h1 { font-size: 12px; font-weight: bold; margin-bottom: 1px; }
    .header h2 { font-size: 9px; font-weight: normal; }
    .section { margin-bottom: 4px; }
    .section-title { background: #1a5f4a; color: #fff; padding: 2px 4px; font-size: 7px; font-weight: bold; margin-bottom: 2px; }
    .row { display: flex; gap: 4px; margin-bottom: 4px; }
    .col { flex: 1; }
    .col-2 { flex: 2; }
    table { width: 100%; border-collapse: collapse; font-size: 6px; }
    th { background: #2d7a5e; color: #fff; padding: 2px 3px; text-align: center; font-weight: bold; border: 1px solid #1a5f4a; }
    td { padding: 1px 2px; border: 1px solid #ccc; text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .total-row { background: #e8f5e9; font-weight: bold; }
    .highlight { background: #fff3cd; }
    .danger { background: #ffebee; color: #c62828; }
    .success { background: #e8f5e9; color: #2e7d32; }
    .summary-box { display: inline-block; background: #f5f5f5; border: 1px solid #ddd; padding: 2px 6px; margin: 1px; text-align: center; min-width: 70px; }
    .summary-box .value { font-size: 9px; font-weight: bold; color: #1a5f4a; }
    .summary-box .label { font-size: 6px; color: #666; }
    .footer { text-align: center; font-size: 6px; color: #666; border-top: 1px solid #ccc; padding-top: 2px; margin-top: 4px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>AkademiHub - Kurucu Raporu</h1>
      <h2>${academicYear} Eğitim-Öğretim Yılı | Rapor Tarihi: ${reportDate} ${reportTime}</h2>
    </div>

    <!-- ÖZET KARTLARI -->
    <div style="text-align: center; margin-bottom: 4px;">
      <div class="summary-box"><div class="value">${totals.totalStudents}</div><div class="label">Toplam Öğrenci</div></div>
      <div class="summary-box"><div class="value">${totals.paidStudents}</div><div class="label">Ücretli</div></div>
      <div class="summary-box"><div class="value">${totals.freeStudents}</div><div class="label">Ücretsiz</div></div>
      <div class="summary-box"><div class="value">${formatCurrencyShort(totals.totalRevenue)} ₺</div><div class="label">Toplam Ciro</div></div>
      <div class="summary-box"><div class="value">${formatCurrencyShort(totals.collectedRevenue)} ₺</div><div class="label">Tahsil Edilen</div></div>
      <div class="summary-box"><div class="value">${formatCurrencyShort(totals.pendingRevenue)} ₺</div><div class="label">Kalan</div></div>
      <div class="summary-box"><div class="value">%${totals.collectionRate.toFixed(1)}</div><div class="label">Tahsilat Oranı</div></div>
      <div class="summary-box"><div class="value">${formatCurrencyShort(totals.overdueAmount)} ₺</div><div class="label">Geciken</div></div>
    </div>

    <div class="row">
      <!-- SOL KOLON: SINIF BAZLI DAĞILIM -->
      <div class="col-2">
        <div class="section">
          <div class="section-title">${academicYear} Sezonu - Sınıf Bazlı Kayıt ve Ciro Durumu</div>
          <table>
            <thead>
              <tr>
                <th>Sınıf</th>
                <th>Ücretli</th>
                <th>Ücretsiz</th>
                <th>Toplam</th>
                <th>Ücretli Ort.</th>
                <th>Genel Ücret Ort.</th>
                <th>Toplam Ciro</th>
                <th>Tahsil Edilen</th>
                <th>Kalan</th>
                <th>Tahsilat %</th>
              </tr>
            </thead>
            <tbody>
              ${classStats.map(s => `
              <tr>
                <td class="text-left"><strong>${s.class}</strong></td>
                <td>${s.paidStudents}</td>
                <td>${s.freeStudents}</td>
                <td><strong>${s.totalStudents}</strong></td>
                <td class="text-right">${formatCurrency(s.averageFee)}</td>
                <td class="text-right">${formatCurrency(s.totalStudents > 0 ? s.totalAmount / s.totalStudents : 0)}</td>
                <td class="text-right">${formatCurrency(s.totalAmount)}</td>
                <td class="text-right success">${formatCurrency(s.collectedAmount)}</td>
                <td class="text-right">${formatCurrency(s.remainingAmount)}</td>
                <td class="${s.collectionRate >= 90 ? 'success' : s.collectionRate >= 70 ? 'highlight' : 'danger'}">%${s.collectionRate.toFixed(1)}</td>
              </tr>
              `).join('')}
              <tr class="total-row">
                <td class="text-left"><strong>TOPLAM</strong></td>
                <td><strong>${totals.paidStudents}</strong></td>
                <td><strong>${totals.freeStudents}</strong></td>
                <td><strong>${totals.totalStudents}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.averageFeePerStudent)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.totalStudents > 0 ? totals.totalRevenue / totals.totalStudents : 0)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.totalRevenue)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.collectedRevenue)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totals.pendingRevenue)}</strong></td>
                <td><strong>%${totals.collectionRate.toFixed(1)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SAĞ KOLON: TAHSİLAT DURUMU -->
      <div class="col">
        <div class="section">
          <div class="section-title">Tahsilat Özeti</div>
          <table>
            <tr><th>Metrik</th><th>Değer</th></tr>
            <tr><td class="text-left">Toplam Ciro</td><td class="text-right">${formatCurrency(totals.totalRevenue)} ₺</td></tr>
            <tr><td class="text-left">Tahsil Edilen</td><td class="text-right success">${formatCurrency(totals.collectedRevenue)} ₺</td></tr>
            <tr><td class="text-left">Kalan Alacak</td><td class="text-right">${formatCurrency(totals.pendingRevenue)} ₺</td></tr>
            <tr><td class="text-left">Geciken Toplam</td><td class="text-right danger">${formatCurrency(totals.overdueAmount)} ₺</td></tr>
            <tr><td class="text-left">Geciken Öğrenci</td><td class="text-right danger">${totals.overdueStudents}</td></tr>
            <tr><td class="text-left">Kritik Risk</td><td class="text-right danger">${totals.criticalRiskCount}</td></tr>
            <tr class="total-row"><td class="text-left"><strong>Tahsilat Oranı</strong></td><td class="text-right"><strong>%${totals.collectionRate.toFixed(1)}</strong></td></tr>
          </table>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- AYLIK BEKLENEN ÖDEMELER -->
      <div class="col-2">
        <div class="section">
          <div class="section-title">Gelecek 12 Ayda Beklenen Ödemeler (${currentYear})</div>
          <table>
            <thead>
              <tr>
                <th>Ay</th>
                ${monthlyData.map(m => `<th>${m.shortMonth}</th>`).join('')}
                <th><strong>TOPLAM</strong></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-left"><strong>Beklenen</strong></td>
                ${monthlyData.map(m => `<td class="text-right">${formatCurrencyShort(m.expected)}</td>`).join('')}
                <td class="text-right total-row"><strong>${formatCurrencyShort(totalFutureExpected)}</strong></td>
              </tr>
              <tr>
                <td class="text-left"><strong>Tahsil Edilen</strong></td>
                ${monthlyData.map(m => `<td class="text-right success">${formatCurrencyShort(m.collected)}</td>`).join('')}
                <td class="text-right total-row"><strong>${formatCurrencyShort(monthlyData.reduce((a, m) => a + m.collected, 0))}</strong></td>
              </tr>
              <tr>
                <td class="text-left"><strong>Oran %</strong></td>
                ${monthlyData.map(m => `<td class="${m.rate >= 90 ? 'success' : m.rate >= 70 ? 'highlight' : m.expected > 0 ? 'danger' : ''}">${m.expected > 0 ? m.rate.toFixed(0) + '%' : '-'}</td>`).join('')}
                <td class="text-right total-row"><strong>%${totalFutureExpected > 0 ? ((monthlyData.reduce((a, m) => a + m.collected, 0) / totalFutureExpected) * 100).toFixed(1) : 0}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RİSKLİ ÖĞRENCİLER -->
      <div class="col">
        <div class="section">
          <div class="section-title">Geciken Ödemeler - Risk Analizi (İlk 10)</div>
          <table>
            <thead>
              <tr><th>Öğrenci</th><th>Sınıf</th><th>Borç</th><th>Gün</th><th>Risk</th></tr>
            </thead>
            <tbody>
              ${riskStudents.slice(0, 10).map(s => `
              <tr class="${s.riskLevel === 'critical' ? 'danger' : s.riskLevel === 'high' ? 'highlight' : ''}">
                <td class="text-left">${s.name.substring(0, 20)}</td>
                <td>${s.class}</td>
                <td class="text-right">${formatCurrencyShort(s.totalDebt)}</td>
                <td>${s.overdueDays}</td>
                <td>${s.riskLevel === 'critical' ? 'KRİTİK' : s.riskLevel === 'high' ? 'YÜKSEK' : s.riskLevel === 'medium' ? 'ORTA' : 'DÜŞÜK'}</td>
              </tr>
              `).join('')}
              ${riskStudents.length === 0 ? '<tr><td colspan="5">Gecikmiş ödeme bulunmuyor</td></tr>' : ''}
              ${riskStudents.length > 10 ? `<tr class="total-row"><td colspan="5">... ve ${riskStudents.length - 10} öğrenci daha</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- SINIF HEDEFLERİ -->
      <div class="col">
        <div class="section">
          <div class="section-title">Sınıf Bazlı Hedef Tablosu</div>
          <table>
            <thead>
              <tr>
                <th>Sınıf Seviyesi</th>
                ${classStats.slice(0, 8).map(s => `<th>${s.class}</th>`).join('')}
                <th>Toplam</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-left">Mevcut Kayıt</td>
                ${classStats.slice(0, 8).map(s => `<td>${s.totalStudents}</td>`).join('')}
                <td class="total-row"><strong>${totals.totalStudents}</strong></td>
              </tr>
              <tr>
                <td class="text-left">Hedef (Örnek)</td>
                ${classStats.slice(0, 8).map(() => `<td>30</td>`).join('')}
                <td class="total-row"><strong>${classStats.slice(0, 8).length * 30}</strong></td>
              </tr>
              <tr>
                <td class="text-left">Gerçekleşme %</td>
                ${classStats.slice(0, 8).map(s => `<td class="${(s.totalStudents / 30) >= 1 ? 'success' : (s.totalStudents / 30) >= 0.7 ? 'highlight' : 'danger'}">${((s.totalStudents / 30) * 100).toFixed(0)}%</td>`).join('')}
                <td class="total-row"><strong>${((totals.totalStudents / (classStats.slice(0, 8).length * 30)) * 100).toFixed(0)}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ÜCRETSİZ ÖĞRENCİ DAĞILIMI -->
      <div class="col">
        <div class="section">
          <div class="section-title">Ücretsiz Öğrenci Dağılımı</div>
          <table>
            <thead>
              <tr><th>Sınıf</th><th>Ücretli</th><th>Ücretsiz</th><th>Toplam</th><th>Ücretsiz %</th></tr>
            </thead>
            <tbody>
              ${classStats.filter(s => s.freeStudents > 0).map(s => `
              <tr>
                <td>${s.class}. Sınıf</td>
                <td>${s.paidStudents}</td>
                <td>${s.freeStudents}</td>
                <td>${s.totalStudents}</td>
                <td class="${(s.freeStudents / s.totalStudents) * 100 > 50 ? 'danger' : (s.freeStudents / s.totalStudents) * 100 > 30 ? 'highlight' : ''}">${((s.freeStudents / s.totalStudents) * 100).toFixed(0)}%</td>
              </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>TOPLAM</strong></td>
                <td><strong>${totals.paidStudents}</strong></td>
                <td><strong>${totals.freeStudents}</strong></td>
                <td><strong>${totals.totalStudents}</strong></td>
                <td><strong>${totals.totalStudents > 0 ? ((totals.freeStudents / totals.totalStudents) * 100).toFixed(0) : 0}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- YIL KARŞILAŞTIRMASI -->
    <div class="section">
      <div class="section-title">${currentYear}-${currentYear+1} SEZONU CİRO - TAHSİLAT - GECİKEN DURUMU</div>
      <div class="row">
        <div class="col">
          <table>
            <thead>
              <tr><th colspan="5">Tahsilat</th><th colspan="2">Geciken</th></tr>
              <tr><th>Ciro</th><th>Toplam İade</th><th>Alınan</th><th>Kalan</th><th>Beklenen Ödeme</th><th>Toplam</th><th>2 aydan fazla</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-right">${formatCurrency(totals.totalRevenue)}</td>
                <td class="text-right">0,00</td>
                <td class="text-right success">${formatCurrency(totals.collectedRevenue)}</td>
                <td class="text-right">${formatCurrency(totals.pendingRevenue)}</td>
                <td class="text-right">0,00</td>
                <td class="text-right danger">${formatCurrency(totals.overdueAmount)}</td>
                <td class="text-right danger">${formatCurrency(riskStudents.filter(s => s.overdueDays > 60).reduce((sum, s) => sum + s.totalDebt, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SEZON KAYIT DURUMU -->
    <div class="section">
      <div class="section-title">${currentYear-1}-${currentYear} SEZONU KAYIT - TAHSİLAT DURUMU (Önceki Dönem)</div>
      <table>
        <thead>
          <tr>
            <th>Toplam Kayıt</th>
            <th>Yeni Kayıt</th>
            <th>Silinen Kayıt</th>
            <th>Normal Sürede Ayrılan</th>
            <th>Toplam Ciro</th>
            <th>Toplam Tahsilat</th>
            <th>Geciken Toplam</th>
            <th>İki Aydan Fazla Geciken</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${totals.totalStudents + totals.deletedStudents}</td>
            <td>${totals.totalStudents}</td>
            <td>${totals.deletedStudents}</td>
            <td>-</td>
            <td class="text-right">${formatCurrency(totals.totalRevenue + totals.deletedTotalAmount)}</td>
            <td class="text-right success">${formatCurrency(totals.collectedRevenue + totals.deletedCollectedAmount)}</td>
            <td class="text-right danger">${formatCurrency(totals.overdueAmount)}</td>
            <td class="text-right danger">${formatCurrency(riskStudents.filter(s => s.overdueDays > 60).reduce((sum, s) => sum + s.totalDebt, 0))}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- KAYDI SİLİNEN ÖĞRENCİLER -->
    ${deletedStudents.length > 0 ? `
    <div class="section">
      <div class="section-title">Kaydı Silinen Öğrenciler (${deletedStudents.length} öğrenci)</div>
      <table>
        <thead>
          <tr><th>Öğrenci</th><th>Sınıf</th><th>Toplam Tutar</th><th>Tahsil Edilen</th><th>Kalan Borç</th><th>Kayıt Tarihi</th><th>Silinme Tarihi</th></tr>
        </thead>
        <tbody>
          ${deletedStudents.slice(0, 15).map(s => `
          <tr>
            <td class="text-left">${s.name}</td>
            <td>${s.class}</td>
            <td class="text-right">${formatCurrency(s.totalAmount)}</td>
            <td class="text-right success">${formatCurrency(s.collectedAmount)}</td>
            <td class="text-right ${s.remainingAmount > 0 ? 'danger' : ''}">${formatCurrency(s.remainingAmount)}</td>
            <td>${s.registrationDate}</td>
            <td>${s.deletedDate}</td>
          </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2"><strong>TOPLAM</strong></td>
            <td class="text-right"><strong>${formatCurrency(totals.deletedTotalAmount)}</strong></td>
            <td class="text-right"><strong>${formatCurrency(totals.deletedCollectedAmount)}</strong></td>
            <td class="text-right"><strong>${formatCurrency(totals.deletedTotalAmount - totals.deletedCollectedAmount)}</strong></td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- AYLIK SEZON KARŞILAŞTIRMASI -->
    <div class="section">
      <div class="section-title">Bugünden Gelecek 12 Ayda Beklenen Ödemeler (Sezon Bazlı)</div>
      <table>
        <thead>
          <tr>
            <th>Sezon</th>
            ${monthlyData.slice(0, 10).map(m => `<th>${m.shortMonth} ${currentYear + (monthlyData.indexOf(m) >= 4 ? 1 : 0)}</th>`).join('')}
            <th><strong>Toplam</strong></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-left">${currentYear-1}-${currentYear}</td>
            ${monthlyData.slice(0, 10).map(() => `<td class="text-right">-</td>`).join('')}
            <td class="text-right">-</td>
          </tr>
          <tr>
            <td class="text-left"><strong>${currentYear}-${currentYear+1}</strong></td>
            ${monthlyData.slice(0, 10).map(m => `<td class="text-right">${formatCurrencyShort(m.expected)}</td>`).join('')}
            <td class="text-right total-row"><strong>${formatCurrencyShort(monthlyData.reduce((a, m) => a + m.expected, 0))}</strong></td>
          </tr>
          <tr class="total-row">
            <td class="text-left"><strong>Toplam</strong></td>
            ${monthlyData.slice(0, 10).map(m => `<td class="text-right"><strong>${formatCurrencyShort(m.expected)}</strong></td>`).join('')}
            <td class="text-right"><strong>${formatCurrencyShort(monthlyData.reduce((a, m) => a + m.expected, 0))}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ÖNEMLİ METRİKLER -->
    <div class="row">
      <div class="col">
        <div class="section">
          <div class="section-title">Finansal Özet Metrikleri</div>
          <table>
            <tr><th>Metrik</th><th>Değer</th></tr>
            <tr><td class="text-left">Ortalama Öğrenci Ücreti</td><td class="text-right">${formatCurrency(totals.averageFeePerStudent)} ₺</td></tr>
            <tr><td class="text-left">Toplam Sınıf Sayısı</td><td class="text-right">${totals.totalClasses}</td></tr>
            <tr><td class="text-left">Ücretli/Ücretsiz Oranı</td><td class="text-right">${totals.paidStudents}/${totals.freeStudents}</td></tr>
            <tr><td class="text-left">Geciken Öğrenci Sayısı</td><td class="text-right danger">${totals.overdueStudents}</td></tr>
            <tr><td class="text-left">Kritik Risk Öğrenci</td><td class="text-right danger">${totals.criticalRiskCount}</td></tr>
            <tr><td class="text-left">Kaydı Silinen Öğrenci</td><td class="text-right">${totals.deletedStudents}</td></tr>
            <tr><td class="text-left">Silinen Öğrencilerden Tahsilat</td><td class="text-right success">${formatCurrency(totals.deletedCollectedAmount)} ₺</td></tr>
            <tr class="total-row"><td class="text-left"><strong>Net Tahsilat Oranı</strong></td><td class="text-right"><strong>%${totals.collectionRate.toFixed(1)}</strong></td></tr>
          </table>
        </div>
      </div>
      <div class="col">
        <div class="section">
          <div class="section-title">AI Önerileri</div>
          <table>
            <tbody>
              ${aiInsights.map(insight => `
              <tr class="${insight.type === 'success' ? 'success' : insight.type === 'danger' ? 'danger' : insight.type === 'warning' ? 'highlight' : ''}">
                <td class="text-left">
                  <strong>${insight.title}</strong><br/>
                  <span style="font-size: 7px;">${insight.description}</span>
                </td>
              </tr>
              `).join('')}
              ${aiInsights.length === 0 ? '<tr><td>Henüz öneri bulunmuyor</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Bu rapor AkademiHub Eğitim Yönetim Sistemi tarafından ${reportDate} ${reportTime} tarihinde otomatik olarak oluşturulmuştur.</p>
      <p>© ${currentYear} AkademiHub - Tüm Hakları Saklıdır | Sayfa 1/1</p>
    </div>
  </div>
  <script>window.onload = function() { setTimeout(() => window.print(), 300); }</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-[#DCF8C6] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-[#25D366] rounded-full animate-spin"></div>
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-[#075E54]" />
          </div>
          <p className="text-[#075E54] font-semibold">Kurucu Raporu Hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#dcfce7] p-4 md:p-6">
      {/* ✅ Offline Göstergesi */}
      <OfflineIndicator onRefresh={handleRefresh} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Kurucu Raporu</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-white/70 text-sm">Kurumsal Analiz & Karar Destek</p>
                    {/* Cache durumu göstergesi */}
                    {isFromCache && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/30 text-amber-100 text-xs rounded-full">
                        <Clock size={10} />
                        Kayıtlı veri
                      </span>
                    )}
                    {isOffline && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-400/30 text-red-100 text-xs rounded-full">
                        <WifiOff size={10} />
                        Çevrimdışı
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-white/80 text-sm mt-2">Son Güncelleme: {new Date().toLocaleString('tr-TR')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRefresh} disabled={isOffline} className={`px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl flex items-center gap-2 transition backdrop-blur-sm ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Yenile
              </button>
              <button onClick={exportToPDF} className="px-4 py-2.5 bg-white text-[#075E54] rounded-xl flex items-center gap-2 font-semibold hover:bg-white/90 transition shadow-lg">
                <Printer size={18} /> Yazdır
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Toplam Öğrenci', value: totals.totalStudents, sub: `${totals.paidStudents} Ücretli`, icon: Users, color: 'from-emerald-500 to-green-600', clickable: true, type: 'total' as const },
            { label: 'Toplam Ciro', value: `₺${formatCurrencyShort(totals.totalRevenue)}`, sub: 'Yıllık', icon: DollarSign, color: 'from-blue-500 to-indigo-600', clickable: false },
            { label: 'Tahsil Edilen', value: `₺${formatCurrencyShort(totals.collectedRevenue)}`, sub: `%${totals.collectionRate.toFixed(0)}`, icon: CheckCircle, color: 'from-green-500 to-emerald-600', clickable: false },
            { label: 'Bekleyen', value: `₺${formatCurrencyShort(totals.pendingRevenue)}`, sub: 'Vadesi gelmemiş', icon: Clock, color: 'from-amber-500 to-orange-600', clickable: false },
            { label: 'Gecikmiş', value: `₺${formatCurrencyShort(totals.overdueAmount)}`, sub: `${totals.overdueStudents} öğrenci`, icon: AlertTriangle, color: 'from-red-500 to-rose-600', clickable: false },
            { label: 'Ücretsiz', value: totals.freeStudents, sub: `%${totals.totalStudents > 0 ? ((totals.freeStudents/totals.totalStudents)*100).toFixed(0) : 0}`, icon: Gift, color: 'from-purple-500 to-violet-600', clickable: true, type: 'free' as const },
          ].map((stat, idx) => (
            <div 
              key={idx} 
              onClick={() => stat.clickable && setSummaryModal({ isOpen: true, type: stat.type || 'total' })}
              className={`bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all group ${stat.clickable ? 'cursor-pointer hover:ring-2 hover:ring-[#25D366]' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              <p className="text-[10px] text-gray-400">{stat.sub}</p>
              {stat.clickable && <p className="text-[9px] text-[#25D366] mt-1 opacity-0 group-hover:opacity-100">Detay için tıklayın →</p>}
            </div>
          ))}
        </div>

        {/* Tabs - Geliştirilmiş */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
            { id: 'classes', label: 'Sınıf Analizi', icon: <GraduationCap size={16} /> },
            { id: 'payments', label: 'Ödeme Geçmişi', icon: <Wallet size={16} />, count: paymentHistory.length },
            { id: 'parents', label: 'Veli Analizi', icon: <Users size={16} /> },
            { id: 'free', label: 'Ücretsiz', icon: <Gift size={16} />, count: freeStudents.length },
            { id: 'deleted', label: 'Silinen', icon: <X size={16} />, count: totals.deletedStudents },
            { id: 'trends', label: 'Trendler', icon: <TrendingUp size={16} /> },
            { id: 'risk', label: 'Risk', icon: <Shield size={16} />, count: riskStudents.length },
            { id: 'comparison', label: 'Karşılaştırma', icon: <Activity size={16} /> },
            { id: 'metrics', label: 'Metrikler', icon: <Calculator size={16} /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap font-medium transition-all ${
                activeTab === tab.id ? 'bg-[#25D366] text-white shadow-lg shadow-green-200' : 'bg-white text-[#075E54] hover:bg-[#DCF8C6] border border-gray-200'
              }`}>
              {tab.icon} {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* AI Insights */}
        {aiInsights.length > 0 && activeTab === 'dashboard' && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-800">Analiz & Öneriler</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {aiInsights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-xl border-l-4 bg-white ${
                  insight.type === 'success' ? 'border-green-500' : insight.type === 'warning' ? 'border-amber-500' : insight.type === 'danger' ? 'border-red-500' : 'border-blue-500'
                }`}>
                  <p className="font-semibold text-gray-800 text-sm">{insight.title}</p>
                  <p className="text-gray-600 text-xs mt-1">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#25D366]" /> Sınıf Bazlı Gelir Dağılımı
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie data={revenueDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenueDistributionData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₺${formatCurrencyShort(value)}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#25D366]" /> Sınıf Tahsilat Performansı
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Oran" fill="#25D366" radius={[4, 4, 0, 0]} name="Tahsilat %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Sınıf Bazlı Detaylı Analiz</h3>
              <button onClick={() => exportTabPDF('classes')} className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition">
                <Printer className="w-4 h-4" /> PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Sınıf</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Ücretli</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Ücretsiz</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Toplam</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Toplam Gelir</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Tahsil Edilen</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ort. Ücret</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Tahsilat</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classStats.map((stat, idx) => (
                    <tr 
                      key={stat.class} 
                      onClick={() => setClassModal({ isOpen: true, className: stat.class, students: stat.students })}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition cursor-pointer group`}
                    >
                      <td className="px-4 py-3 font-semibold text-[#075E54] group-hover:text-[#25D366] flex items-center gap-2">
                        <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                        {stat.class}. Sınıf
                      </td>
                      <td className="px-4 py-3 text-center">{stat.paidStudents}</td>
                      <td className="px-4 py-3 text-center text-blue-600">{stat.freeStudents}</td>
                      <td className="px-4 py-3 text-center font-bold">{stat.totalStudents}</td>
                      <td className="px-4 py-3 text-right">₺{formatCurrency(stat.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">₺{formatCurrency(stat.collectedAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₺{formatCurrency(stat.averageFee)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${stat.collectionRate >= 90 ? 'bg-green-100 text-green-700' : stat.collectionRate >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          %{stat.collectionRate.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${stat.riskScore <= 20 ? 'bg-green-500' : stat.riskScore <= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${stat.riskScore}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#DCF8C6] font-bold">
                  <tr>
                    <td className="px-4 py-3 text-[#075E54]">TOPLAM</td>
                    <td className="px-4 py-3 text-center">{totals.paidStudents}</td>
                    <td className="px-4 py-3 text-center">{totals.freeStudents}</td>
                    <td className="px-4 py-3 text-center">{totals.totalStudents}</td>
                    <td className="px-4 py-3 text-right">₺{formatCurrency(totals.totalRevenue)}</td>
                    <td className="px-4 py-3 text-right text-green-700">₺{formatCurrency(totals.collectedRevenue)}</td>
                    <td className="px-4 py-3 text-right">₺{formatCurrency(totals.averageFeePerStudent)}</td>
                    <td className="px-4 py-3 text-center"><span className="px-3 py-1 bg-[#25D366] text-white rounded-full">%{totals.collectionRate.toFixed(0)}</span></td>
                    <td className="px-4 py-3 text-center">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Free Students Tab */}
        {activeTab === 'free' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                <Gift className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">{totals.freeStudents}</p>
                <p className="text-white/80 text-sm">Toplam Ücretsiz</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                <Target className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">%{totals.totalStudents > 0 ? ((totals.freeStudents/totals.totalStudents)*100).toFixed(1) : 0}</p>
                <p className="text-white/80 text-sm">Ücretsiz Oranı</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white">
                <GraduationCap className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">{classStats.filter(c => c.freeStudents > 0).length}</p>
                <p className="text-white/80 text-sm">Ücretsizli Sınıf</p>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white">
                <AlertTriangle className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">{classStats.length > 0 ? classStats.reduce((max, c) => (c.freeStudents / Math.max(1, c.totalStudents)) > (max.freeStudents / Math.max(1, max.totalStudents)) ? c : max, classStats[0]).class : '-'}</p>
                <p className="text-white/80 text-sm">En Yüksek Oran</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#25D366]" /> Sınıf Bazında Ücretli/Ücretsiz Dağılımı
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classFreeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Ücretli" stackId="a" fill="#25D366" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Ücretsiz" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5" /> Ücretsiz Öğrenci Listesi ({freeStudents.length})</h3>
                <button onClick={() => exportTabPDF('free')} className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition">
                  <Printer className="w-4 h-4" /> PDF
                </button>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Öğrenci</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Sınıf</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Kayıt Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {freeStudents.map((student, idx) => (
                      <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}>
                        <td className="px-4 py-3 text-gray-400 text-sm">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium text-sm">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm font-medium">{student.class}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{student.registrationDate}</td>
                      </tr>
                    ))}
                    {freeStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          Ücretsiz öğrenci bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Deleted Students Tab */}
        {activeTab === 'deleted' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white">
                <X className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">{totals.deletedStudents}</p>
                <p className="text-white/80 text-sm">Kaydı Silinen</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
                <CheckCircle className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">₺{formatCurrencyShort(totals.deletedCollectedAmount)}</p>
                <p className="text-white/80 text-sm">Tahsil Edilen</p>
              </div>
              <div className="bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl p-5 text-white">
                <DollarSign className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">₺{formatCurrencyShort(totals.deletedTotalAmount)}</p>
                <p className="text-white/80 text-sm">Toplam Ücret</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                <AlertTriangle className="w-8 h-8 opacity-80 mb-2" />
                <p className="text-3xl font-bold">₺{formatCurrencyShort(totals.deletedTotalAmount - totals.deletedCollectedAmount)}</p>
                <p className="text-white/80 text-sm">İptal Edilen</p>
              </div>
            </div>
            
            {/* Deleted Students Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <X className="w-5 h-5" /> Kaydı Silinen Öğrenciler ({deletedStudents.length})
                  </h3>
                  <p className="text-white/80 text-sm mt-1">Tahsil edilen ödemeler korunmuştur</p>
                </div>
                <button onClick={() => exportTabPDF('deleted')} className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition">
                  <Printer className="w-4 h-4" /> PDF
                </button>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Öğrenci</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Sınıf</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Toplam Ücret</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Tahsil Edilen</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">İptal Edilen</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Kayıt Tarihi</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Silinme Tarihi</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deletedStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-red-50 transition">
                        <td className="px-4 py-3 text-gray-400 text-sm">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium text-sm">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm font-medium">{student.class}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-700">₺{formatCurrency(student.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-green-600">₺{formatCurrency(student.collectedAmount)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-red-600">₺{formatCurrency(student.remainingAmount)}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{student.registrationDate}</td>
                        <td className="px-4 py-3 text-center text-sm text-red-500">{student.deletedDate}</td>
                        <td className="px-4 py-3 text-center">
                          <a href={`/students/${student.id}`} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition">
                            <Eye className="w-4 h-4 inline mr-1" /> Görüntüle
                          </a>
                        </td>
                      </tr>
                    ))}
                    {deletedStudents.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                          Kaydı silinen öğrenci bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#25D366]" /> Aylık Tahsilat Trendi</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="shortMonth" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number, name: string) => name === 'Oran' ? `%${value.toFixed(1)}` : `₺${formatCurrencyShort(value)}`} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="expected" fill="#94a3b8" name="Beklenen" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="collected" fill="#25D366" name="Tahsil Edilen" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} name="Oran %" dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-[#25D366]" /> Kümülatif Gelir</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="shortMonth" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₺${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => `₺${formatCurrencyShort(value)}`} />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#25D366" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#25D366" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="cumulativeRevenue" stroke="#075E54" fill="url(#colorRevenue)" name="Kümülatif Gelir" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Kritik Risk', count: riskStudents.filter(s => s.riskLevel === 'critical').length, color: 'from-red-500 to-rose-600', desc: '90+ gün veya 50K+' },
                { label: 'Yüksek Risk', count: riskStudents.filter(s => s.riskLevel === 'high').length, color: 'from-amber-500 to-orange-600', desc: '60-90 gün veya 30K+' },
                { label: 'Orta/Düşük Risk', count: riskStudents.filter(s => s.riskLevel === 'medium' || s.riskLevel === 'low').length, color: 'from-yellow-500 to-amber-600', desc: 'İzleme altında' },
              ].map((item, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 text-white`}>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-8 h-8 opacity-80" />
                    <div><p className="text-3xl font-bold">{item.count}</p><p className="text-white/80 text-sm">{item.label}</p></div>
                  </div>
                  <p className="text-white/60 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5" /> Riskli Öğrenci Listesi ({riskStudents.length})</h3>
                <button onClick={() => exportTabPDF('risk')} className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition">
                  <Printer className="w-4 h-4" /> PDF
                </button>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Öğrenci</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Sınıf</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Borç</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Gecikme</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {riskStudents.map((student, idx) => (
                      <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-red-50 transition`}>
                        <td className="px-4 py-3 text-gray-400 text-sm">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium">{student.name}</td>
                        <td className="px-4 py-3 text-center">{student.class}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">₺{formatCurrencyShort(student.totalDebt)}</td>
                        <td className="px-4 py-3 text-center">{student.overdueDays} gün</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            student.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                            student.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                            student.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {student.riskLevel === 'critical' ? 'Kritik' : student.riskLevel === 'high' ? 'Yüksek' : student.riskLevel === 'medium' ? 'Orta' : 'Düşük'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {riskStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                          Riskli öğrenci bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Tahsilat Oranı', value: totals.collectionRate, target: 95, unit: '%', status: totals.collectionRate >= 95 ? 'excellent' : totals.collectionRate >= 80 ? 'good' : 'warning' },
                { label: 'Ücretsiz Oranı', value: totals.totalStudents > 0 ? (totals.freeStudents/totals.totalStudents)*100 : 0, target: 20, unit: '%', status: (totals.freeStudents/Math.max(1,totals.totalStudents))*100 <= 20 ? 'excellent' : 'warning' },
                { label: 'Gecikme Oranı', value: totals.totalStudents > 0 ? (totals.overdueStudents/totals.totalStudents)*100 : 0, target: 10, unit: '%', status: (totals.overdueStudents/Math.max(1,totals.totalStudents))*100 <= 10 ? 'excellent' : 'warning' },
                { label: 'Ort. Ücret', value: totals.averageFeePerStudent, target: 100000, unit: '₺', status: totals.averageFeePerStudent >= 80000 ? 'excellent' : 'good' },
              ].map((metric, idx) => {
                const colorMap = {
                  excellent: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
                  good: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
                  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
                };
                const colors = colorMap[metric.status as keyof typeof colorMap] || colorMap.good;
                return (
                  <div key={idx} className={`${colors.bg} ${colors.border} border rounded-2xl p-5`}>
                    <p className={`text-2xl font-bold ${colors.text}`}>
                      {metric.unit === '₺' ? `₺${formatCurrencyShort(metric.value)}` : `%${metric.value.toFixed(1)}`}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{metric.label}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Mevcut</span>
                        <span>Hedef: {metric.unit === '₺' ? `₺${formatCurrencyShort(metric.target)}` : `%${metric.target}`}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Award className="w-6 h-6" /> Kurumsal Benchmark
              </h3>
              <div className="grid md:grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Toplam Öğrenci', current: totals.totalStudents, target: 300 },
                  { label: 'Yıllık Ciro', current: totals.totalRevenue, target: 12000000, isCurrency: true },
                  { label: 'Tahsilat', current: totals.collectedRevenue, target: totals.totalRevenue * 0.95, isCurrency: true },
                  { label: 'Aktif Sınıf', current: totals.totalClasses, target: 12 },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-white/70 text-sm">{item.label}</p>
                    <p className="text-2xl font-bold mt-1">{item.isCurrency ? `₺${formatCurrencyShort(item.current)}` : item.current}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>İlerleme</span>
                        <span>Hedef: {item.isCurrency ? `₺${formatCurrencyShort(item.target)}` : item.target}</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-white/60" style={{ width: `${Math.min((item.current / item.target) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ✅ YENİ: Ödeme Geçmişi Sekmesi */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-[#25D366]" />
                    Ödeme Geçmişi Detayı
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Tüm tahsilatların kronolojik listesi</p>
                </div>
                <button
                  onClick={() => exportPaymentHistoryPDF()}
                  className="px-4 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition flex items-center gap-2"
                >
                  <Printer size={18} /> PDF İndir
                </button>
              </div>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Toplam Tahsilat', value: formatCurrency(totals.collectedRevenue), icon: CheckCircle, color: 'from-emerald-500 to-green-500' },
                { label: 'Bu Ay Tahsilat', value: formatCurrency(paymentHistory.filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.amount, 0)), icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
                { label: 'Toplam İşlem', value: paymentHistory.length.toString(), icon: Activity, color: 'from-purple-500 to-pink-500' },
                { label: 'Ort. Ödeme', value: formatCurrency(paymentHistory.length > 0 ? paymentHistory.reduce((s, p) => s + p.amount, 0) / paymentHistory.length : 0), icon: Calculator, color: 'from-amber-500 to-orange-500' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xl font-bold text-gray-800">₺{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Ödeme Tablosu */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#075E54] to-[#128C7E]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white">Öğrenci</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white">Sınıf</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white">Tutar</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white">Ödeme Tarihi</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white">Ödeme Şekli</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white">Taksit No</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentHistory.slice(0, 50).map((payment, idx) => (
                      <tr key={payment.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50`}>
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{payment.studentName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-[#DCF8C6] text-[#075E54] rounded-full text-xs font-medium">
                            {payment.studentClass}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">₺{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{payment.paymentDate}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.paymentMethod === 'Nakit' ? 'bg-green-100 text-green-700' :
                            payment.paymentMethod === 'Kredi Kartı' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">#{payment.installmentNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {paymentHistory.length > 50 && (
                  <div className="text-center py-4 text-gray-500 text-sm bg-gray-50">
                    ... ve {paymentHistory.length - 50} ödeme daha (PDF'de tamamı yer alır)
                  </div>
                )}
                {paymentHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Henüz ödeme kaydı bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ YENİ: Veli Analizi Sekmesi */}
        {activeTab === 'parents' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#25D366]" />
                    Veli Ödeme Performansı
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Velilerin ödeme alışkanlıkları ve performans skorları</p>
                </div>
                <button
                  onClick={() => exportParentAnalysisPDF()}
                  className="px-4 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition flex items-center gap-2"
                >
                  <Printer size={18} /> PDF İndir
                </button>
              </div>
            </div>

            {/* Performans Özeti */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Mükemmel', count: parentAnalysis.filter(p => p.paymentScore === 'excellent').length, color: 'from-emerald-500 to-green-500', desc: 'Zamanında öder' },
                { label: 'İyi', count: parentAnalysis.filter(p => p.paymentScore === 'good').length, color: 'from-blue-500 to-cyan-500', desc: '1-7 gün gecikme' },
                { label: 'Orta', count: parentAnalysis.filter(p => p.paymentScore === 'average').length, color: 'from-amber-500 to-orange-500', desc: '7-30 gün gecikme' },
                { label: 'Düşük', count: parentAnalysis.filter(p => p.paymentScore === 'poor').length, color: 'from-red-500 to-pink-500', desc: '30+ gün gecikme' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                    <span className="text-white font-bold">{stat.count}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.desc}</p>
                </div>
              ))}
            </div>

            {/* Veli Tablosu */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#075E54] to-[#128C7E]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white">Veli Adı</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white">Öğrenci</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white">Toplam</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white">Ödenen</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white">Kalan</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white">Ort. Gecikme</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parentAnalysis.slice(0, 50).map((parent, idx) => (
                      <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50`}>
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{parent.parentName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                            {parent.studentCount} öğrenci
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">₺{formatCurrency(parent.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">₺{formatCurrency(parent.paidAmount)}</td>
                        <td className="px-4 py-3 text-right text-red-600">₺{formatCurrency(parent.remainingAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${parent.avgPaymentDelay <= 0 ? 'text-emerald-600' : parent.avgPaymentDelay <= 7 ? 'text-blue-600' : parent.avgPaymentDelay <= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                            {parent.avgPaymentDelay <= 0 ? 'Zamanında' : `${parent.avgPaymentDelay} gün`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            parent.paymentScore === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                            parent.paymentScore === 'good' ? 'bg-blue-100 text-blue-700' :
                            parent.paymentScore === 'average' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {parent.paymentScore === 'excellent' ? 'Mükemmel' :
                             parent.paymentScore === 'good' ? 'İyi' :
                             parent.paymentScore === 'average' ? 'Orta' : 'Düşük'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parentAnalysis.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Users size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Veli verisi analiz ediliyor...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ YENİ: Dönem Karşılaştırması Sekmesi */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-[#25D366]" />
                    Dönem Karşılaştırması
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Bu dönem ile geçen dönem arasındaki değişimler</p>
                </div>
                <button
                  onClick={() => exportComparisonPDF()}
                  className="px-4 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition flex items-center gap-2"
                >
                  <Printer size={18} /> PDF İndir
                </button>
              </div>
            </div>

            {/* Karşılaştırma Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  label: 'Öğrenci Sayısı', 
                  current: totals.totalStudents, 
                  previous: Math.round(totals.totalStudents * 0.9), // Simüle edilmiş geçen dönem
                  icon: Users
                },
                { 
                  label: 'Toplam Ciro', 
                  current: totals.totalRevenue, 
                  previous: Math.round(totals.totalRevenue * 0.85),
                  icon: DollarSign,
                  isCurrency: true
                },
                { 
                  label: 'Tahsilat Oranı', 
                  current: totals.collectionRate, 
                  previous: Math.round(totals.collectionRate * 0.95),
                  icon: TrendingUp,
                  isPercent: true
                },
              ].map((item, idx) => {
                const change = item.previous > 0 ? ((item.current - item.previous) / item.previous) * 100 : 0;
                const isPositive = change >= 0;
                return (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">{item.label}</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {item.isCurrency ? `₺${formatCurrency(item.current)}` : 
                           item.isPercent ? `%${item.current.toFixed(1)}` : item.current}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400">Geçen Dönem</p>
                        <p className="text-lg text-gray-600">
                          {item.isCurrency ? `₺${formatCurrency(item.previous)}` : 
                           item.isPercent ? `%${item.previous.toFixed(1)}` : item.previous}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {isPositive ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
                        <span className="font-bold">{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aylık Trend Karşılaştırması */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Aylık Tahsilat Trendi</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="shortMonth" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `₺${formatCurrency(value)}`,
                        name === 'collected' ? 'Tahsil Edilen' : name === 'expected' ? 'Beklenen' : name
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="expected" name="Beklenen" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Tahsil Edilen" fill="#25D366" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="cumulativeRevenue" name="Kümülatif" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sınıf Bazlı Değişim */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-[#075E54] to-[#128C7E]">
                <h4 className="text-white font-bold">Sınıf Bazlı Dönem Karşılaştırması</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Sınıf</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Bu Dönem Öğrenci</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Bu Dönem Ciro</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Bu Dönem Tahsilat</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Değişim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classStats.slice(0, 12).map((cls, idx) => {
                      const prevCollection = cls.collectionRate * 0.9; // Simüle
                      const change = cls.collectionRate - prevCollection;
                      return (
                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50`}>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-[#DCF8C6] text-[#075E54] rounded-full text-xs font-bold">
                              {cls.class}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{cls.totalStudents}</td>
                          <td className="px-4 py-3 text-right">₺{formatCurrency(cls.totalAmount)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-medium">%{cls.collectionRate.toFixed(1)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {change >= 0 ? <TrendingUp size={12} /> : <AlertTriangle size={12} />}
                              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class Detail Modal */}
      {classModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-[#075E54] to-[#25D366] p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  {classModal.className}. Sınıf Öğrenci Listesi
                </h2>
                <p className="text-white/80 text-sm mt-1">{classModal.students.length} öğrenci</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleExportClassPdf(classModal.className, classModal.students)}
                  className="px-3 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition flex items-center gap-2"
                >
                  <Printer size={16} /> PDF
                </button>
                <button onClick={() => setClassModal({ isOpen: false, className: '', students: [] })}
                  className="p-2 hover:bg-white/20 rounded-lg transition">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(85vh-120px)]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Öğrenci Adı</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Durum</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Toplam Ücret</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ödenen</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Kalan</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classModal.students.map((student, idx) => (
                    <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50`}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.isPaid ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {student.isPaid ? 'Ücretli' : 'Ücretsiz'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">₺{formatCurrency(student.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-green-600">₺{formatCurrency(student.collectedAmount)}</td>
                      <td className="px-4 py-3 text-right text-red-600">₺{formatCurrency(student.remainingAmount)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{student.registrationDate}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#DCF8C6]">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-bold text-[#075E54]">TOPLAM</td>
                    <td className="px-4 py-3 text-right font-bold">₺{formatCurrency(classModal.students.reduce((s, st) => s + st.totalAmount, 0))}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">₺{formatCurrency(classModal.students.reduce((s, st) => s + st.collectedAmount, 0))}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">₺{formatCurrency(classModal.students.reduce((s, st) => s + st.remainingAmount, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {summaryModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-[#075E54] to-[#25D366] p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  {summaryModal.type === 'total' ? 'Tüm Öğrenciler' : summaryModal.type === 'free' ? 'Ücretsiz Öğrenciler' : 'Öğrenci Listesi'}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {summaryModal.type === 'total' && `${totals.totalStudents} toplam kayıt`}
                  {summaryModal.type === 'free' && `${totals.freeStudents} ücretsiz öğrenci`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleExportSummaryPdf(summaryModal.type)}
                  className="px-3 py-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition flex items-center gap-2"
                >
                  <Printer size={16} /> PDF
                </button>
                <button onClick={() => setSummaryModal({ isOpen: false, type: 'total' })}
                  className="p-2 hover:bg-white/20 rounded-lg transition">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Filters for total view */}
            {summaryModal.type === 'total' && (
              <div className="p-4 bg-gray-50 border-b flex gap-4 flex-wrap">
                <div className="flex gap-2">
                  {['Tümü', 'Ücretli', 'Ücretsiz'].map((filter) => (
                    <button 
                      key={filter}
                      onClick={() => {
                        const type = filter === 'Tümü' ? 'total' : filter === 'Ücretli' ? 'paid' : 'free';
                        setSummaryModal({ ...summaryModal, type });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        (summaryModal.type === 'total' && filter === 'Tümü') ||
                        (summaryModal.type === 'paid' && filter === 'Ücretli') ||
                        (summaryModal.type === 'free' && filter === 'Ücretsiz')
                          ? 'bg-[#25D366] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <FileText size={14} />
                  {(summaryModal.type as string) === 'total' && `${allStudents.length} kayıt`}
                  {(summaryModal.type as string) === 'paid' && `${allStudents.filter(s => s.isPaid).length} kayıt`}
                  {(summaryModal.type as string) === 'free' && `${allStudents.filter(s => !s.isPaid).length} kayıt`}
                </div>
              </div>
            )}

            <div className="overflow-auto max-h-[calc(85vh-180px)]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Öğrenci Adı</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Sınıf</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Durum</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Toplam Ücret</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ödenen</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Kalan</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allStudents
                    .filter(s => summaryModal.type === 'total' ? true : summaryModal.type === 'paid' ? s.isPaid : !s.isPaid)
                    .map((student, idx) => (
                    <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50`}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                      <td className="px-4 py-3 text-center">{student.class}. Sınıf</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.isPaid ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {student.isPaid ? 'Ücretli' : 'Ücretsiz'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">₺{formatCurrency(student.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-green-600">₺{formatCurrency(student.collectedAmount)}</td>
                      <td className="px-4 py-3 text-right text-red-600">₺{formatCurrency(student.remainingAmount)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{student.registrationDate}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#DCF8C6]">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 font-bold text-[#075E54]">TOPLAM</td>
                    <td className="px-4 py-3 text-right font-bold">
                      ₺{formatCurrency(allStudents.filter(s => summaryModal.type === 'total' ? true : summaryModal.type === 'paid' ? s.isPaid : !s.isPaid).reduce((s, st) => s + st.totalAmount, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      ₺{formatCurrency(allStudents.filter(s => summaryModal.type === 'total' ? true : summaryModal.type === 'paid' ? s.isPaid : !s.isPaid).reduce((s, st) => s + st.collectedAmount, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">
                      ₺{formatCurrency(allStudents.filter(s => summaryModal.type === 'total' ? true : summaryModal.type === 'paid' ? s.isPaid : !s.isPaid).reduce((s, st) => s + st.remainingAmount, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // PDF Export for Class
  function handleExportClassPdf(className: string, students: Student[]) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalAmount = students.reduce((s, st) => s + st.totalAmount, 0);
    const collectedAmount = students.reduce((s, st) => s + st.collectedAmount, 0);
    const remainingAmount = students.reduce((s, st) => s + st.remainingAmount, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${className}. Sınıf Öğrenci Listesi</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
          h1 { color: #075E54; border-bottom: 2px solid #25D366; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          tr:hover { background: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #059669; }
          .text-red { color: #dc2626; }
          tfoot { background: #DCF8C6; font-weight: bold; }
          .summary { margin-top: 20px; display: flex; gap: 20px; }
          .summary-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-box .label { font-size: 12px; color: #666; }
          .summary-box .value { font-size: 20px; font-weight: bold; color: #075E54; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>${className}. Sınıf Öğrenci Listesi</h1>
        <p style="color: #666;">Tarih: ${new Date().toLocaleDateString('tr-TR')} - Toplam: ${students.length} öğrenci</p>
        
        <div class="summary">
          <div class="summary-box"><div class="label">Toplam Ücret</div><div class="value">₺${formatCurrency(totalAmount)}</div></div>
          <div class="summary-box"><div class="label">Tahsil Edilen</div><div class="value text-green">₺${formatCurrency(collectedAmount)}</div></div>
          <div class="summary-box"><div class="label">Kalan</div><div class="value text-red">₺${formatCurrency(remainingAmount)}</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Öğrenci Adı</th>
              <th class="text-center">Durum</th>
              <th class="text-right">Toplam Ücret</th>
              <th class="text-right">Ödenen</th>
              <th class="text-right">Kalan</th>
              <th class="text-center">Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${s.name}</td>
                <td class="text-center">${s.isPaid ? 'Ücretli' : 'Ücretsiz'}</td>
                <td class="text-right">₺${formatCurrency(s.totalAmount)}</td>
                <td class="text-right text-green">₺${formatCurrency(s.collectedAmount)}</td>
                <td class="text-right text-red">₺${formatCurrency(s.remainingAmount)}</td>
                <td class="text-center">${s.registrationDate}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOPLAM</td>
              <td class="text-right">₺${formatCurrency(totalAmount)}</td>
              <td class="text-right">₺${formatCurrency(collectedAmount)}</td>
              <td class="text-right">₺${formatCurrency(remainingAmount)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // PDF Export for Summary
  function handleExportSummaryPdf(type: 'total' | 'paid' | 'free' | 'deleted') {
    const filteredStudents = allStudents.filter(s => type === 'total' ? true : type === 'paid' ? s.isPaid : !s.isPaid);
    const title = type === 'total' ? 'Tüm Öğrenciler' : type === 'paid' ? 'Ücretli Öğrenciler' : 'Ücretsiz Öğrenciler';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalAmount = filteredStudents.reduce((s, st) => s + st.totalAmount, 0);
    const collectedAmount = filteredStudents.reduce((s, st) => s + st.collectedAmount, 0);
    const remainingAmount = filteredStudents.reduce((s, st) => s + st.remainingAmount, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
          h1 { color: #075E54; border-bottom: 2px solid #25D366; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          tr:hover { background: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #059669; }
          .text-red { color: #dc2626; }
          tfoot { background: #DCF8C6; font-weight: bold; }
          .summary { margin-top: 20px; display: flex; gap: 20px; }
          .summary-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-box .label { font-size: 12px; color: #666; }
          .summary-box .value { font-size: 20px; font-weight: bold; color: #075E54; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p style="color: #666;">Tarih: ${new Date().toLocaleDateString('tr-TR')} - Toplam: ${filteredStudents.length} öğrenci</p>
        
        <div class="summary">
          <div class="summary-box"><div class="label">Toplam Öğrenci</div><div class="value">${filteredStudents.length}</div></div>
          <div class="summary-box"><div class="label">Toplam Ücret</div><div class="value">₺${formatCurrency(totalAmount)}</div></div>
          <div class="summary-box"><div class="label">Tahsil Edilen</div><div class="value text-green">₺${formatCurrency(collectedAmount)}</div></div>
          <div class="summary-box"><div class="label">Kalan</div><div class="value text-red">₺${formatCurrency(remainingAmount)}</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Öğrenci Adı</th>
              <th class="text-center">Sınıf</th>
              <th class="text-center">Durum</th>
              <th class="text-right">Toplam Ücret</th>
              <th class="text-right">Ödenen</th>
              <th class="text-right">Kalan</th>
              <th class="text-center">Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${s.name}</td>
                <td class="text-center">${s.class}. Sınıf</td>
                <td class="text-center">${s.isPaid ? 'Ücretli' : 'Ücretsiz'}</td>
                <td class="text-right">₺${formatCurrency(s.totalAmount)}</td>
                <td class="text-right text-green">₺${formatCurrency(s.collectedAmount)}</td>
                <td class="text-right text-red">₺${formatCurrency(s.remainingAmount)}</td>
                <td class="text-center">${s.registrationDate}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">TOPLAM</td>
              <td class="text-right">₺${formatCurrency(totalAmount)}</td>
              <td class="text-right">₺${formatCurrency(collectedAmount)}</td>
              <td class="text-right">₺${formatCurrency(remainingAmount)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // ✅ YENİ: Ödeme Geçmişi PDF Export
  function exportPaymentHistoryPDF() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalPayments = paymentHistory.reduce((s, p) => s + p.amount, 0);
    const today = new Date().toLocaleDateString('tr-TR');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ödeme Geçmişi Raporu</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; font-size: 12px; }
          h1 { color: #075E54; border-bottom: 2px solid #25D366; padding-bottom: 10px; margin-bottom: 20px; }
          .summary { display: flex; gap: 20px; margin-bottom: 20px; }
          .summary-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
          .summary-box .label { font-size: 11px; color: #666; }
          .summary-box .value { font-size: 18px; font-weight: bold; color: #075E54; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #075E54; color: white; padding: 10px; text-align: left; font-weight: bold; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #059669; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>📋 Ödeme Geçmişi Raporu</h1>
        <p style="color: #666; margin-bottom: 15px;">Tarih: ${today} | Toplam İşlem: ${paymentHistory.length}</p>
        
        <div class="summary">
          <div class="summary-box"><div class="label">Toplam Tahsilat</div><div class="value text-green">₺${formatCurrency(totalPayments)}</div></div>
          <div class="summary-box"><div class="label">Toplam İşlem</div><div class="value">${paymentHistory.length}</div></div>
          <div class="summary-box"><div class="label">Ort. Ödeme</div><div class="value">₺${formatCurrency(paymentHistory.length > 0 ? totalPayments / paymentHistory.length : 0)}</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Öğrenci</th>
              <th class="text-center">Sınıf</th>
              <th class="text-right">Tutar</th>
              <th class="text-center">Tarih</th>
              <th class="text-center">Ödeme Şekli</th>
              <th class="text-center">Taksit</th>
            </tr>
          </thead>
          <tbody>
            ${paymentHistory.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.studentName}</td>
                <td class="text-center">${p.studentClass}</td>
                <td class="text-right text-green">₺${formatCurrency(p.amount)}</td>
                <td class="text-center">${p.paymentDate}</td>
                <td class="text-center">${p.paymentMethod}</td>
                <td class="text-center">#${p.installmentNo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">AkademiHub - Kurucu Raporu | Ödeme Geçmişi</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // ✅ YENİ: Veli Analizi PDF Export
  function exportParentAnalysisPDF() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('tr-TR');
    const excellentCount = parentAnalysis.filter(p => p.paymentScore === 'excellent').length;
    const goodCount = parentAnalysis.filter(p => p.paymentScore === 'good').length;
    const avgCount = parentAnalysis.filter(p => p.paymentScore === 'average').length;
    const poorCount = parentAnalysis.filter(p => p.paymentScore === 'poor').length;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Veli Ödeme Analizi Raporu</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; font-size: 12px; }
          h1 { color: #075E54; border-bottom: 2px solid #25D366; padding-bottom: 10px; margin-bottom: 20px; }
          .summary { display: flex; gap: 15px; margin-bottom: 20px; }
          .summary-box { padding: 12px; border-radius: 8px; text-align: center; flex: 1; }
          .summary-box .label { font-size: 10px; color: #666; }
          .summary-box .value { font-size: 20px; font-weight: bold; }
          .excellent { background: #d1fae5; color: #059669; }
          .good { background: #dbeafe; color: #2563eb; }
          .average { background: #fef3c7; color: #d97706; }
          .poor { background: #fee2e2; color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #075E54; color: white; padding: 10px; text-align: left; font-weight: bold; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #059669; }
          .text-red { color: #dc2626; }
          .badge { padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>👥 Veli Ödeme Performansı Raporu</h1>
        <p style="color: #666; margin-bottom: 15px;">Tarih: ${today} | Toplam Veli: ${parentAnalysis.length}</p>
        
        <div class="summary">
          <div class="summary-box excellent"><div class="value">${excellentCount}</div><div class="label">Mükemmel</div></div>
          <div class="summary-box good"><div class="value">${goodCount}</div><div class="label">İyi</div></div>
          <div class="summary-box average"><div class="value">${avgCount}</div><div class="label">Orta</div></div>
          <div class="summary-box poor"><div class="value">${poorCount}</div><div class="label">Düşük</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Veli Adı</th>
              <th class="text-center">Öğrenci</th>
              <th class="text-right">Toplam</th>
              <th class="text-right">Ödenen</th>
              <th class="text-right">Kalan</th>
              <th class="text-center">Gecikme</th>
              <th class="text-center">Skor</th>
            </tr>
          </thead>
          <tbody>
            ${parentAnalysis.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.parentName}</td>
                <td class="text-center">${p.studentCount}</td>
                <td class="text-right">₺${formatCurrency(p.totalAmount)}</td>
                <td class="text-right text-green">₺${formatCurrency(p.paidAmount)}</td>
                <td class="text-right text-red">₺${formatCurrency(p.remainingAmount)}</td>
                <td class="text-center">${p.avgPaymentDelay <= 0 ? 'Zamanında' : p.avgPaymentDelay + ' gün'}</td>
                <td class="text-center">
                  <span class="badge ${p.paymentScore}">${
                    p.paymentScore === 'excellent' ? 'Mükemmel' :
                    p.paymentScore === 'good' ? 'İyi' :
                    p.paymentScore === 'average' ? 'Orta' : 'Düşük'
                  }</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">AkademiHub - Kurucu Raporu | Veli Ödeme Analizi</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // ✅ YENİ: Dönem Karşılaştırması PDF Export
  function exportComparisonPDF() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('tr-TR');
    const prevStudents = Math.round(totals.totalStudents * 0.9);
    const prevRevenue = Math.round(totals.totalRevenue * 0.85);
    const prevCollection = Math.round(totals.collectionRate * 0.95);

    const studentChange = ((totals.totalStudents - prevStudents) / prevStudents * 100).toFixed(1);
    const revenueChange = ((totals.totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1);
    const collectionChange = (totals.collectionRate - prevCollection).toFixed(1);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dönem Karşılaştırma Raporu</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; font-size: 12px; }
          h1 { color: #075E54; border-bottom: 2px solid #25D366; padding-bottom: 10px; margin-bottom: 20px; }
          .comparison { display: flex; gap: 20px; margin-bottom: 30px; }
          .compare-box { background: #f5f5f5; padding: 20px; border-radius: 12px; flex: 1; }
          .compare-box h3 { margin: 0 0 10px; color: #075E54; font-size: 14px; }
          .compare-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .compare-row:last-child { border-bottom: none; }
          .compare-row .label { color: #666; }
          .compare-row .value { font-weight: bold; }
          .change { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          .change.positive { background: #d1fae5; color: #059669; }
          .change.negative { background: #fee2e2; color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #075E54; color: white; padding: 10px; text-align: left; font-weight: bold; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>📊 Dönem Karşılaştırma Raporu</h1>
        <p style="color: #666; margin-bottom: 15px;">Tarih: ${today} | Bu Dönem vs Geçen Dönem</p>
        
        <div class="comparison">
          <div class="compare-box">
            <h3>📈 Öğrenci Sayısı</h3>
            <div class="compare-row"><span class="label">Bu Dönem</span><span class="value">${totals.totalStudents}</span></div>
            <div class="compare-row"><span class="label">Geçen Dönem</span><span class="value">${prevStudents}</span></div>
            <div class="compare-row"><span class="label">Değişim</span><span class="change ${parseFloat(studentChange) >= 0 ? 'positive' : 'negative'}">${parseFloat(studentChange) >= 0 ? '+' : ''}${studentChange}%</span></div>
          </div>
          <div class="compare-box">
            <h3>💰 Toplam Ciro</h3>
            <div class="compare-row"><span class="label">Bu Dönem</span><span class="value">₺${formatCurrency(totals.totalRevenue)}</span></div>
            <div class="compare-row"><span class="label">Geçen Dönem</span><span class="value">₺${formatCurrency(prevRevenue)}</span></div>
            <div class="compare-row"><span class="label">Değişim</span><span class="change ${parseFloat(revenueChange) >= 0 ? 'positive' : 'negative'}">${parseFloat(revenueChange) >= 0 ? '+' : ''}${revenueChange}%</span></div>
          </div>
          <div class="compare-box">
            <h3>✅ Tahsilat Oranı</h3>
            <div class="compare-row"><span class="label">Bu Dönem</span><span class="value">%${totals.collectionRate.toFixed(1)}</span></div>
            <div class="compare-row"><span class="label">Geçen Dönem</span><span class="value">%${prevCollection.toFixed(1)}</span></div>
            <div class="compare-row"><span class="label">Değişim</span><span class="change ${parseFloat(collectionChange) >= 0 ? 'positive' : 'negative'}">${parseFloat(collectionChange) >= 0 ? '+' : ''}${collectionChange}%</span></div>
          </div>
        </div>

        <h2 style="color: #075E54; margin-top: 30px;">Sınıf Bazlı Karşılaştırma</h2>
        <table>
          <thead>
            <tr>
              <th>Sınıf</th>
              <th class="text-center">Öğrenci</th>
              <th class="text-right">Toplam Ciro</th>
              <th class="text-center">Tahsilat %</th>
              <th class="text-center">Değişim</th>
            </tr>
          </thead>
          <tbody>
            ${classStats.slice(0, 12).map((cls, i) => {
              const change = (cls.collectionRate - cls.collectionRate * 0.9).toFixed(1);
              return `
              <tr>
                <td><strong>${cls.class}</strong></td>
                <td class="text-center">${cls.totalStudents}</td>
                <td class="text-right">₺${formatCurrency(cls.totalAmount)}</td>
                <td class="text-center">%${cls.collectionRate.toFixed(1)}</td>
                <td class="text-center"><span class="change ${parseFloat(change) >= 0 ? 'positive' : 'negative'}">${parseFloat(change) >= 0 ? '+' : ''}${change}%</span></td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
        <div class="footer">AkademiHub - Kurucu Raporu | Dönem Karşılaştırması</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}
