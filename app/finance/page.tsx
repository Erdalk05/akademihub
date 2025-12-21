'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Download, CreditCard, X, Search, Check, Calendar, FileText, Filter, Loader2, ShieldAlert, Package } from 'lucide-react';
import FinanceOverview from '@/components/finance/FinanceOverview';
import CashFlowChart from '@/components/finance/CashFlowChart';
import IncomeExpenseChart from '@/components/finance/IncomeExpenseChart';
import DebtorsList from '@/components/finance/DebtorsList';
// CategoryPieChart kaldırıldı - Sınıf Bazında Ortalama Ücretler grafiği kullanılıyor
import ClassAverageChart from '@/components/finance/ClassAverageChart';
import PaymentCalendar from '@/components/finance/PaymentCalendar';
import CollectionReport from '@/components/finance/CollectionReport';
import { exportDashboardSummaryPDF } from '@/lib/services/exportService';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

type InstallmentSummary = {
  total: number;       // tüm taksitlerin toplamı
  paid: number;        // ödenmiş taksitlerin toplamı
  unpaid: number;      // kalan
  totalCount: number;  // toplam taksit adedi
  paidCount: number;   // ödenmiş taksit sayısı
};

type DebtorRow = {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dayOverdue: number;
  riskScore: number;
  paymentNo: string;
};

type MonthlyPoint = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  cashFlow: number;
};

type ExpenseSummary = {
  total: number;
  thisMonth: number;
  lastMonth: number;
};

type CategoryAmount = {
  category: string;
  amount: number;
};

type MonthlyInstallmentRow = {
  id: string;
  studentId: string;
  studentName: string;
  classLabel: string;
  amount: number;
  paidAmount: number;
  remaining: number;
  status: 'Ödendi' | 'Bekliyor' | 'Gecikmiş';
  dueDate: string | null;
};

type CalendarDay = {
  date: string;
  income: number;
  expense: number;
  hasOverdue: boolean;
};

export default function FinancePage() {
  const { isAdmin, isAccounting, isLoading: permissionLoading } = usePermission();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expense' | 'cashflow'>(
    'overview',
  );
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  
  // TÜM HOOKS'LAR BURADA - EARLY RETURN'DEN ÖNCE
  const [installmentSummary, setInstallmentSummary] = useState<InstallmentSummary>({
    total: 0,
    paid: 0,
    unpaid: 0,
    totalCount: 0,
    paidCount: 0,
  });
  const [debtors, setDebtors] = useState<DebtorRow[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [rawInstallments, setRawInstallments] = useState<
    {
      id: string;
      student_id: string;
      amount: number;
      is_paid: boolean;
      due_date: string | null;
      paid_at: string | null;
    }[]
  >([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
  });
  const [incomeCategories, setIncomeCategories] = useState<CategoryAmount[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryAmount[]>([]);
  const [thisMonthInstallments, setThisMonthInstallments] = useState<
    MonthlyInstallmentRow[]
  >([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // finance_installments üzerinden özet çek
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/installments', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) return;
        const data = (js.data || []) as {
          id: string;
          student_id: string;
          amount: number;
          is_paid: boolean;
          due_date: string | null;
          paid_at: string | null;
        }[];

        const total = data.reduce((s, r) => s + Number(r.amount || 0), 0);
        const paid = data
          .filter((r) => r.is_paid)
          .reduce((s, r) => s + Number(r.amount || 0), 0);
        const unpaid = total - paid;
        const totalCount = data.length;
        const paidCount = data.filter((r) => r.is_paid).length;
        setInstallmentSummary({ total, paid, unpaid, totalCount, paidCount });
        setRawInstallments(data);

        // Son 12 ay için aylık gelir (ödenen taksitler) verisini hesapla
        const now = new Date();
        const buckets = new Map<string, { income: number; expense: number }>();

        data.forEach((r) => {
          if (!r.is_paid || !r.paid_at) return;
          const paidDate = new Date(r.paid_at);
          // Sadece son 12 ay içindeki kayıtları dikkate al
          const diffMonths =
            (now.getFullYear() - paidDate.getFullYear()) * 12 +
            (now.getMonth() - paidDate.getMonth());
          if (diffMonths < 0 || diffMonths > 11) return;

          const key = `${paidDate.getFullYear()}-${String(
            paidDate.getMonth() + 1,
          ).padStart(2, '0')}`;
          const bucket = buckets.get(key) || { income: 0, expense: 0 };
          bucket.income += Number(r.amount || 0);
          buckets.set(key, bucket);
        });

        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        const points: MonthlyPoint[] = [];

        // Şu anki ay dahil son 12 ayı, en eski aydan yeniye doğru sırala
        for (let i = 11; i >= 0; i -= 1) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const bucket = buckets.get(key) || { income: 0, expense: 0 };
          const income = bucket.income;
          const expense = bucket.expense;
          const balance = income - expense;
          const cashFlow = income - expense;

          points.push({
            month: monthNames[date.getMonth()],
            income,
            expense,
            balance,
            cashFlow,
          });
        }

        setMonthlyData(points);

        // Sınıflara göre gelir dağılımı için, öğrenci sınıf bilgisine ihtiyaç var.
        // Öğrenci verilerini ayrı effect içinde çekip burada joinlemek yerine,
        // sınıf bazlı gelir hesaplamasını aşağıdaki effect'te students ile beraber yapacağız.
        // Bu yüzden burada sadece taksit verisini state'e saklamamız yeterli.

        // Taksit verisini classIncomeData için global state yerine
        // aşağıdaki effect ile /api/students verisiyle birleştireceğiz.

      } catch {
        // dashboard hata verse de uygulama çalışmaya devam etsin
      }
    })();
  }, []);

  // Gider özetlerini çek (toplam + bu ay + geçen ay)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/finance/expenses/stats', {
          cache: 'no-store',
        });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) return;
        const d = js.data as {
          totalAmount?: number;
          thisMonthTotal?: number;
          lastMonthTotal?: number;
          byCategory?: Record<string, number>;
        };

        const expenseCats: CategoryAmount[] = Object.entries(
          d.byCategory || {},
        ).map(([category, amount]) => ({
          category,
          amount: Number(amount || 0),
        }));

        setExpenseSummary({
          total: Number(d.totalAmount || 0),
          thisMonth: Number(d.thisMonthTotal || 0),
          lastMonth: Number(d.lastMonthTotal || 0),
        });
        setExpenseCategories(expenseCats);
      } catch {
        // gider istatistikleri okunamazsa dashboard yine de çalışsın
      }
    })();
  }, []);

  // Gelir kategorilerini basitçe taksitlerden türet (şimdilik tek kategori: 'taksit')
  useEffect(() => {
    if (!installmentSummary.paid) {
      setIncomeCategories([]);
      return;
    }
    setIncomeCategories([
      {
        category: 'taksit',
        amount: installmentSummary.paid,
      },
    ]);
  }, [installmentSummary.paid]);

  // Ödeme takvimi için günlük gelir/gider özetleri
  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Bu ayki giderleri tarih bazında topla
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        const startStr = start.toISOString().slice(0, 10);
        const endStr = end.toISOString().slice(0, 10);

        const expenseMap: Record<string, number> = {};
        const res = await fetch(
          `/api/finance/expenses?minDate=${startStr}&maxDate=${endStr}`,
          { cache: 'no-store' },
        );
        const js = await res.json().catch(() => null);
        if (res.ok && js?.success && Array.isArray(js.data)) {
          (js.data as any[]).forEach((e) => {
            if (!e.date) return;
            const d = new Date(e.date);
            if (Number.isNaN(d.getTime())) return;
            const key = d.toISOString().slice(0, 10);
            expenseMap[key] = (expenseMap[key] || 0) + Number(e.amount || 0);
          });
        }

        const baseMap: Record<string, CalendarDay> = {};
        for (let day = 1; day <= daysInMonth; day += 1) {
          const dateObj = new Date(year, month, day);
          const key = dateObj.toISOString().slice(0, 10);
          baseMap[key] = {
            date: key,
            income: 0,
            expense: expenseMap[key] || 0,
            hasOverdue: false,
          };
        }

        // Taksitlerden beklenen gelir ve gecikme bilgisi
        rawInstallments.forEach((inst) => {
          if (!inst.due_date) return;
          const due = new Date(inst.due_date);
          if (due.getFullYear() !== year || due.getMonth() !== month) return;
          const key = due.toISOString().slice(0, 10);
          const day = baseMap[key];
          if (!day) return;
          day.income += Number(inst.amount || 0);
          if (!inst.is_paid && due < now) {
            day.hasOverdue = true;
          }
        });

        setCalendarDays(
          Object.values(baseMap).sort((a, b) => a.date.localeCompare(b.date)),
        );
      } catch {
        // takvim hatası dashboard'u bozmasın
      }
    })();
  }, [rawInstallments]);

  // Toplam öğrenci sayısını ve sınıf bazlı gelir dağılımını Supabase'ten çek
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/students', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) return;
        const data = (js.data || []) as {
          id: string;
          class?: string | null;
          section?: string | null;
        }[];

        setTotalStudents(Array.isArray(data) ? data.length : 0);

        if (!rawInstallments.length || !Array.isArray(data)) {
          return;
        }

        // Öğrencileri haritalandır
        const studentMap = new Map<
          string,
          {
            class?: string | null;
            section?: string | null;
          }
        >(
          data.map((s) => [
            s.id,
            {
              class: s.class,
              section: s.section,
            },
          ]),
        );

        const classBuckets = new Map<string, number>();
        const monthlyRows: MonthlyInstallmentRow[] = [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        rawInstallments.forEach((inst) => {
          if (!inst.student_id) return;
          const stu = studentMap.get(inst.student_id);
          const label =
            stu?.class && stu.section
              ? `${stu.class}-${stu.section}`
              : stu?.class || 'Diğer';

          // Sınıf bazlı gelir dağılımı için, sadece ödenmiş taksitleri say
          if (inst.is_paid) {
          const current = classBuckets.get(label) || 0;
          classBuckets.set(label, current + Number(inst.amount || 0));
          }

          // Bu ayki taksit tablosu için, vadesi bu ay olan tüm taksitler
          if (!inst.due_date) return;
          const due = new Date(inst.due_date);
          if (
            due.getFullYear() !== currentYear ||
            due.getMonth() !== currentMonth
          ) {
            return;
          }

          const amount = Number(inst.amount || 0);
          const paidAmount = inst.is_paid ? amount : 0;
          const remaining = amount - paidAmount;
          let status: 'Ödendi' | 'Bekliyor' | 'Gecikmiş' = 'Bekliyor';
          if (inst.is_paid) {
            status = 'Ödendi';
          } else if (due < now) {
            status = 'Gecikmiş';
          }

          monthlyRows.push({
            id: inst.id,
            studentId: inst.student_id,
            studentName: label === 'Diğer' ? inst.student_id : label,
            classLabel: label,
            amount,
            paidAmount,
            remaining,
            status,
            dueDate: inst.due_date,
          });
        });

        // classData hesaplaması - daha sonra kullanılacak
        // const classData = Array.from(classBuckets.entries())
        //   .map(([label, amount]) => ({ label, amount }))
        //   .sort((a, b) => b.amount - a.amount);

        setThisMonthInstallments(
          monthlyRows.sort((a, b) =>
            (a.dueDate || '').localeCompare(b.dueDate || ''),
          ),
        );
      } catch {
        // sessiz geç
      }
    })();
  }, [rawInstallments]);

  // Borçlu öğrencileri hesapla (gecikmiş ve ödenmemiş taksitler) - /api/installments/overdue
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/installments/overdue', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) return;
        const raw = (js.data || []) as Array<{
          student_id: string;
          student_name: string;
          installment_id: string;
          amount: number;
          due_date: string;
          days_overdue: number;
        }>;

        const mapped: DebtorRow[] = raw.map((r) => {
          // Basit risk skoru: gün sayısına göre band
          const d = r.days_overdue;
          let riskScore = 40;
          if (d >= 90) riskScore = 90;
          else if (d >= 60) riskScore = 75;
          else if (d >= 30) riskScore = 60;

          return {
            id: r.installment_id,
            studentId: r.student_id,
            studentName: r.student_name,
            amount: Number(r.amount || 0),
            dayOverdue: r.days_overdue,
            riskScore,
            paymentNo: r.installment_id.slice(0, 8),
          };
        });

        setDebtors(mapped);
      } catch {
        // sessiz geç
      }
    })();
  }, []);

  // Hesaplamalar (gelir/gider özetleri)
  const stats = useMemo(() => {
    const totalIncome = installmentSummary.paid;
    const totalExpenses = expenseSummary.total;

    const netProfit = totalIncome - totalExpenses;
    const outstandingAmount = installmentSummary.unpaid;

    const thisMonthIncome = monthlyData.length
      ? monthlyData[monthlyData.length - 1]?.income || 0
      : 0;
    const lastMonthIncome = monthlyData.length > 1
      ? monthlyData[monthlyData.length - 2]?.income || 0
      : 0;

    const incomeChange =
      thisMonthIncome === 0 && lastMonthIncome === 0
        ? 0
        : ((thisMonthIncome - lastMonthIncome) /
            (lastMonthIncome || thisMonthIncome || 1)) *
          100;

    const thisMonthExpense = expenseSummary.thisMonth;
    const lastMonthExpense = expenseSummary.lastMonth;

    const expenseChange =
      thisMonthExpense === 0 && lastMonthExpense === 0
        ? 0
        : ((thisMonthExpense - lastMonthExpense) /
            (lastMonthExpense || thisMonthExpense || 1)) *
          100;

    const profitChange = incomeChange - expenseChange;

    const outstandingChange = -5;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      outstandingAmount,
      incomeChange: Number(incomeChange.toFixed(1)),
      expenseChange: Number(expenseChange.toFixed(1)),
      profitChange: Number(profitChange.toFixed(1)),
      outstandingChange,
    };
  }, [installmentSummary, expenseSummary, monthlyData]);

  // Tahsilat oranı ve gecikmiş taksit sayısı
  const collectionRate =
    installmentSummary.total > 0
      ? Math.round((installmentSummary.paid / installmentSummary.total) * 1000) / 10
      : 0;
  const overdueInstallmentCount = debtors.length;

  // Export fonksiyonları (gelecekte kullanılacak)
  const _handleExportPayments = (format: 'excel' | 'pdf') => {
    const label = format === 'excel' ? 'Excel' : 'PDF';
    alert(`Ödemeler için ${label} dışa aktarma henüz gerçek veriye bağlanmadı.`);
  };
  void _handleExportPayments; // unused warning suppress

  // Not: Giderler için henüz gerçek tablo olmadığı için ayrı bir export butonu gösterilmiyor.

  const handleExportDashboard = () => {
    exportDashboardSummaryPDF(
      {
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        netProfit: stats.netProfit,
        outstandingAmount: stats.outstandingAmount,
        paymentCount: installmentSummary.paidCount,
        expenseCount: 0,
        saleCount: 0,
      },
      `finansal-ozet-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const tabs = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'income', label: 'Gelir Analizi' },
    { id: 'expense', label: 'Gider Analizi' },
    { id: 'cashflow', label: 'Nakit Akışı' },
  ];

  // Hızlı Ödeme Modal State
  const [showQuickPaymentModal, setShowQuickPaymentModal] = useState(false);
  const [quickPaymentSearch, setQuickPaymentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [studentInstallments, setStudentInstallments] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // ========== TARİH BAZLI RAPOR STATE'LERİ ==========
  const [showDateReportModal, setShowDateReportModal] = useState(false);
  const [reportDateType, setReportDateType] = useState<'single' | 'range'>('single');
  const [reportStartDate, setReportStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFilteredData, setDateFilteredData] = useState<{
    income: number;
    expense: number;
    payments: any[];
    expenses: any[];
  }>({ income: 0, expense: 0, payments: [], expenses: [] });
  const [loadingDateReport, setLoadingDateReport] = useState(false);

  // Öğrenci listesi çek
  useEffect(() => {
    if (showQuickPaymentModal && allStudents.length === 0) {
      setLoadingStudents(true);
      fetch('/api/students')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setAllStudents(data.data || []);
          }
        })
        .finally(() => setLoadingStudents(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickPaymentModal]);

  // Öğrenci seçildiğinde taksitlerini çek
  useEffect(() => {
    if (selectedStudent?.id) {
      fetch(`/api/installments?studentId=${selectedStudent.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // Sadece ödenmemiş taksitler
            const unpaid = (data.data || []).filter((i: any) => !i.is_paid);
            setStudentInstallments(unpaid);
          }
        });
    } else {
      setStudentInstallments([]);
    }
  }, [selectedStudent?.id]);

  // Filtrelenmiş öğrenci listesi
  const filteredStudents = useMemo(() => {
    if (!quickPaymentSearch.trim()) return [];
    const term = quickPaymentSearch.toLowerCase();
    return allStudents.filter(s => {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const studentNo = (s.student_no || '').toLowerCase();
      return fullName.includes(term) || studentNo.includes(term);
    }).slice(0, 10);
  }, [quickPaymentSearch, allStudents]);

  // ========== TARİH BAZLI VERİ FİLTRELEME ==========
  const fetchDateFilteredData = async () => {
    setLoadingDateReport(true);
    try {
      const startDate = reportStartDate;
      const endDate = reportDateType === 'single' ? reportStartDate : reportEndDate;

      // Ödemeleri (gelir) filtrele
      const paymentsRes = await fetch('/api/installments', { cache: 'no-store' });
      const paymentsJson = await paymentsRes.json();
      
      let payments: any[] = [];
      let totalIncome = 0;

      if (paymentsJson.success && Array.isArray(paymentsJson.data)) {
        payments = paymentsJson.data.filter((p: any) => {
          if (!p.is_paid || !p.paid_at) return false;
          const paidDate = p.paid_at.split('T')[0];
          return paidDate >= startDate && paidDate <= endDate;
        });
        totalIncome = payments.reduce((sum, p) => sum + (p.paid_amount || p.amount || 0), 0);
      }

      // Giderleri filtrele
      const expensesRes = await fetch(`/api/finance/expenses?minDate=${startDate}&maxDate=${endDate}`, { cache: 'no-store' });
      const expensesJson = await expensesRes.json();
      
      let expenses: any[] = [];
      let totalExpense = 0;

      if (expensesJson.success && Array.isArray(expensesJson.data)) {
        expenses = expensesJson.data;
        totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      }

      setDateFilteredData({
        income: totalIncome,
        expense: totalExpense,
        payments,
        expenses,
      });

      toast.success(`${payments.length} gelir, ${expenses.length} gider kaydı bulundu`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Tarih filtresi hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoadingDateReport(false);
    }
  };

  // ========== TARİH BAZLI PDF İNDİRME ==========
  const handleDownloadDatePDF = () => {
    const startDate = new Date(reportStartDate).toLocaleDateString('tr-TR');
    const endDate = reportDateType === 'single' 
      ? startDate 
      : new Date(reportEndDate).toLocaleDateString('tr-TR');

    const dateLabel = reportDateType === 'single' 
      ? startDate 
      : `${startDate} - ${endDate}`;

    // PDF içeriği oluştur
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Finansal Rapor - ${dateLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
          .header h1 { font-size: 28px; color: #1e40af; margin-bottom: 8px; }
          .header p { font-size: 14px; color: #666; }
          .date-badge { background: #1e40af; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
          .summary { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 20px; }
          .summary-card { flex: 1; padding: 24px; border-radius: 12px; text-align: center; }
          .summary-card.income { background: #dcfce7; border: 2px solid #22c55e; }
          .summary-card.expense { background: #fee2e2; border: 2px solid #ef4444; }
          .summary-card.net { background: #dbeafe; border: 2px solid #3b82f6; }
          .summary-card h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .summary-card .amount { font-size: 28px; font-weight: bold; }
          .summary-card.income .amount { color: #16a34a; }
          .summary-card.expense .amount { color: #dc2626; }
          .summary-card.net .amount { color: #2563eb; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 18px; color: #1e40af; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f3f4f6; padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
          tr:hover { background: #f9fafb; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #16a34a; }
          .text-red { color: #dc2626; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .no-data { text-align: center; padding: 30px; color: #9ca3af; font-style: italic; }
          @media print {
            body { padding: 20px; }
            .summary-card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Finansal Rapor</h1>
          <p>Gelir ve Gider Detayları</p>
          <div class="date-badge">📅 ${dateLabel}</div>
        </div>

        <div class="summary">
          <div class="summary-card income">
            <h3>Toplam Gelir</h3>
            <div class="amount">₺${dateFilteredData.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">${dateFilteredData.payments.length} işlem</p>
          </div>
          <div class="summary-card expense">
            <h3>Toplam Gider</h3>
            <div class="amount">₺${dateFilteredData.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">${dateFilteredData.expenses.length} işlem</p>
          </div>
          <div class="summary-card net">
            <h3>Net Durum</h3>
            <div class="amount">₺${(dateFilteredData.income - dateFilteredData.expense).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">Gelir - Gider</p>
          </div>
        </div>

        <div class="section">
          <h2>💰 Gelir Detayları (Tahsilatlar)</h2>
          ${dateFilteredData.payments.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Öğrenci</th>
                  <th>Taksit No</th>
                  <th class="text-center">Ödeme Tarihi</th>
                  <th class="text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                ${dateFilteredData.payments.map((p: any) => `
                  <tr>
                    <td>${p.studentName || p.student_id?.substring(0, 8) || '-'}</td>
                    <td>${p.installment_no || '-'}. Taksit</td>
                    <td class="text-center">${p.paid_at ? new Date(p.paid_at).toLocaleDateString('tr-TR') : '-'}</td>
                    <td class="text-right text-green">₺${(p.paid_amount || p.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">Bu tarihte gelir kaydı bulunamadı.</div>'}
        </div>

        <div class="section">
          <h2>💸 Gider Detayları</h2>
          ${dateFilteredData.expenses.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Açıklama</th>
                  <th>Kategori</th>
                  <th class="text-center">Tarih</th>
                  <th class="text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                ${dateFilteredData.expenses.map((e: any) => `
                  <tr>
                    <td>${e.description || e.title || '-'}</td>
                    <td>${e.category || 'Diğer'}</td>
                    <td class="text-center">${e.date ? new Date(e.date).toLocaleDateString('tr-TR') : '-'}</td>
                    <td class="text-right text-red">₺${(e.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">Bu tarihte gider kaydı bulunamadı.</div>'}
        </div>

        <div class="footer">
          <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
          <p style="margin-top: 4px;">AkademiHub - Finansal Yönetim Sistemi</p>
        </div>
      </body>
      </html>
    `;

    // Yeni pencere aç ve yazdır
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Yazdırma işlemi
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    toast.success('PDF raporu hazırlandı');
  };

  // Ödeme işlemi
  const handleQuickPayment = async () => {
    if (!selectedInstallment) {
      alert('Lütfen bir taksit seçin');
      return;
    }
    
    const amount = parseFloat(paymentAmount) || selectedInstallment.amount;
    
    setProcessingPayment(true);
    try {
      const res = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInstallment.id,
          is_paid: true,
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
          paid_amount: amount,
        }),
      });
      
      if (res.ok) {
        alert(`✅ ${selectedStudent?.first_name} ${selectedStudent?.last_name} - ₺${amount.toLocaleString('tr-TR')} ödeme alındı!`);
        // Modal kapat ve sıfırla
        setShowQuickPaymentModal(false);
        setSelectedStudent(null);
        setSelectedInstallment(null);
        setPaymentAmount('');
        setQuickPaymentSearch('');
        // Verileri yenile
        window.location.reload();
      } else {
        alert('❌ Ödeme işlemi başarısız oldu');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Ödeme hatası:', e);
      alert('❌ Ödeme işlenirken hata oluştu');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Erişim kontrolü - Yükleniyor
  if (permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#25D366] animate-spin" />
      </div>
    );
  }
  
  // Erişim kontrolü - Yetkisiz
  if (!isAdmin && !isAccounting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-800">Erişim Reddedildi</h1>
        <p className="text-gray-500">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finansal Yönetim</h1>
          <p className="text-gray-600">Mali durum ve işlemlerin izlenmesi</p>
        </div>
        
        {/* Action Butonları */}
        <div className="flex flex-wrap gap-2">
          {/* Hızlı Ödeme Al Butonu */}
          <button
            onClick={() => setShowQuickPaymentModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-200"
          >
            <CreditCard size={16} />
            Hızlı Ödeme Al
          </button>

          {/* 📅 TARİH BAZLI RAPOR BUTONU */}
          <button
            onClick={() => setShowDateReportModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 text-sm font-medium shadow-lg shadow-purple-200"
          >
            <Calendar size={16} />
            Günlük Rapor
          </button>
          
          <button
            onClick={handleExportDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
          >
            <Download size={16} />
            Özet Rapor
          </button>
        </div>
      </div>

      {/* Zaman Aralığı Seçici */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(['today', 'week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {
              {
                today: 'Bugün',
                week: 'Hafta',
                month: 'Ay',
                year: 'Yıl',
              }[range]
            }
          </button>
        ))}
      </div>

      {/* Özet Kartları */}
      <FinanceOverview data={stats} />

      {/* Ek Finans Kartları: Tahsilat Oranı, Gecikmiş Taksit, Aktif Öğrenci, Diğer Gelirler */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Tahsilat Oranı</p>
          <p className="text-2xl font-bold text-emerald-600">
            %{collectionRate.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Ödenen / toplam taksit tutarı
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Gecikmiş Taksit Sayısı</p>
          <p className="text-2xl font-bold text-rose-600">{overdueInstallmentCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            En çok geciken 10 kayıt aşağıdaki listede
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Aktif Öğrenci</p>
          <p className="text-2xl font-bold text-indigo-600">{totalStudents}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            Supabase öğrenci tablosundan okunan toplam
          </p>
        </div>
        <a href="/finance/other-income" className="rounded-lg bg-white p-4 shadow-sm border border-blue-100 hover:border-blue-300 hover:shadow-md transition cursor-pointer block">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-blue-600">Diğer Gelirler</p>
            <Package size={16} className="text-blue-500" />
          </div>
          <p className="text-lg font-bold text-blue-600">
            Görüntüle →
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Kitap, kırtasiye, yemek vb.
          </p>
        </a>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab İçerikleri */}
      <div className="bg-white rounded-b-lg p-6">
        {/* Genel Bakış */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Üst Satır: Gelir/Gider ve Sınıf Ücretleri yan yana */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gelir & Gider Grafiği */}
              <div>
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Aylık Gelir &amp; Gider
                </h2>
                <IncomeExpenseChart
                  data={monthlyData}
                  title="Gelir vs Gider Karşılaştırması (Son 12 Ay)"
                />
              </div>
              
              {/* Sınıf Bazında Ortalama Ücretler - Büyük ve Estetik */}
              <ClassAverageChart />
            </div>

            {/* Bu Ayki Taksitler - Kompakt Özet */}
            {(() => {
              const paidCount = thisMonthInstallments.filter(i => i.status === 'Ödendi').length;
              const pendingCount = thisMonthInstallments.filter(i => i.status === 'Bekliyor').length;
              const overdueCount = thisMonthInstallments.filter(i => i.status === 'Gecikmiş').length;
              const _totalAmount = thisMonthInstallments.reduce((s, i) => s + i.amount, 0); void _totalAmount;
              const paidAmount = thisMonthInstallments.filter(i => i.status === 'Ödendi').reduce((s, i) => s + i.amount, 0);
              const pendingAmount = thisMonthInstallments.filter(i => i.status !== 'Ödendi').reduce((s, i) => s + i.remaining, 0);
              
              // Bugün ve yaklaşan taksitler (max 5)
              const today = new Date().toISOString().slice(0, 10);
              const upcomingInstallments = thisMonthInstallments
                .filter(i => i.status !== 'Ödendi')
                .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .slice(0, 5);

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">Bu Ay Özeti</h2>
                          <p className="text-xs text-white/70">
                            {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/60 uppercase">Toplam Taksit</p>
                        <p className="text-xl font-bold text-white">{thisMonthInstallments.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Özet Kartları */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100">
                    <div className="p-4 text-center bg-emerald-50/50">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Ödendi</p>
                      <p className="text-xs font-medium text-emerald-600 mt-1">
                        ₺{paidAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="p-4 text-center bg-amber-50/50">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Bekliyor</p>
                      <p className="text-xs font-medium text-amber-600 mt-1">
                        ₺{pendingAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="p-4 text-center bg-red-50/50">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                        <X className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Gecikmiş</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>Tahsilat Durumu</span>
                      <span>{thisMonthInstallments.length > 0 ? Math.round((paidCount / thisMonthInstallments.length) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${thisMonthInstallments.length > 0 ? (paidCount / thisMonthInstallments.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Yaklaşan Taksitler */}
                  {upcomingInstallments.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Bekleyen Taksitler
                      </h3>
                      <div className="space-y-2">
                        {upcomingInstallments.map((inst) => {
                          const isOverdue = inst.status === 'Gecikmiş';
                          const isToday = inst.dueDate?.slice(0, 10) === today;
                          return (
                            <div 
                              key={inst.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                isOverdue 
                                  ? 'bg-red-50 border-red-200' 
                                  : isToday 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : 'bg-gray-50 border-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isOverdue ? 'bg-red-100 text-red-600' : isToday ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {inst.dueDate ? new Date(inst.dueDate).getDate() : '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{inst.studentName}</p>
                                  <p className="text-[10px] text-gray-500">
                                    {isToday ? '📍 Bugün' : isOverdue ? '⚠️ Gecikmiş' : inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                  ₺{inst.remaining.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {thisMonthInstallments.filter(i => i.status !== 'Ödendi').length > 5 && (
                        <a 
                          href="/finance/payments" 
                          className="block mt-3 text-center text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          +{thisMonthInstallments.filter(i => i.status !== 'Ödendi').length - 5} taksit daha →
                        </a>
                      )}
                    </div>
                  )}

                  {thisMonthInstallments.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Bu ay için taksit kaydı bulunamadı</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Ödeme Takvimi ve Tahsilat Raporu - Yan Yana */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentCalendar days={calendarDays} />
              <CollectionReport />
            </div>

            {/* Risk Analizi – İlk 10 Öğrenci */}
            <DebtorsList debtors={debtors} />
          </div>
        )}

        {/* Gelir Analizi */}
        {activeTab === 'income' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">Gelir Kaynakları</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <p className="text-gray-600 text-sm mb-2">Tamamlanmış Ödemeler</p>
                <p className="text-2xl font-bold text-green-600">
                  {installmentSummary.paidCount}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                <p className="text-gray-600 text-sm mb-2">Toplam Gelir</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(stats.totalIncome / 1000).toFixed(0)}K ₺
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                <p className="text-gray-600 text-sm mb-2">Ort. Ödeme Tutarı</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {installmentSummary.paidCount > 0
                    ? (stats.totalIncome / installmentSummary.paidCount / 1000).toFixed(1)
                    : '0'}K ₺
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gider Analizi */}
        {activeTab === 'expense' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">Gider Kategorileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
                <p className="text-gray-600 text-sm mb-2">Toplam Gider</p>
                <p className="text-2xl font-bold text-red-600">
                  {(stats.totalExpenses / 1000).toFixed(0)}K ₺
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
                <p className="text-gray-600 text-sm mb-2">Ödenen Giderler</p>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                <p className="text-gray-600 text-sm mb-2">Ort. Gider Tutarı</p>
                <p className="text-2xl font-bold text-indigo-600">0K ₺</p>
              </div>
            </div>
          </div>
        )}

        {/* Nakit Akışı */}
        {activeTab === 'cashflow' && (
          <div>
            <CashFlowChart data={monthlyData} title="Aylık Nakit Akışı Tahmini" />
          </div>
        )}

        {/* AI Öngörüler - Daha sonra eklenecek */}
      </div>

      {/* Hızlı Ödeme Modal */}
      {showQuickPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard size={24} />
                Hızlı Ödeme Al
              </h2>
              <button
                onClick={() => {
                  setShowQuickPaymentModal(false);
                  setSelectedStudent(null);
                  setSelectedInstallment(null);
                  setQuickPaymentSearch('');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Öğrenci Arama */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  1. Öğrenci Seçin
                </label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        {selectedStudent.first_name?.charAt(0)}{selectedStudent.last_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                        <p className="text-xs text-gray-500">{selectedStudent.student_no || 'No yok'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setSelectedInstallment(null);
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={quickPaymentSearch}
                      onChange={(e) => setQuickPaymentSearch(e.target.value)}
                      placeholder="Öğrenci adı veya numarası ile ara..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {/* Arama Sonuçları */}
                    {filteredStudents.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredStudents.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedStudent(s);
                              setQuickPaymentSearch('');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                              {s.first_name?.charAt(0)}{s.last_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                              <p className="text-xs text-gray-500">{s.student_no || ''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {loadingStudents && (
                      <p className="text-sm text-gray-500 mt-2">Öğrenciler yükleniyor...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Taksit Seçimi */}
              {selectedStudent && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    2. Taksit Seçin
                  </label>
                  {studentInstallments.length > 0 ? (
                    <div className="space-y-2">
                      {studentInstallments.map((inst: any) => (
                        <button
                          key={inst.id}
                          onClick={() => {
                            setSelectedInstallment(inst);
                            setPaymentAmount(inst.amount.toString());
                          }}
                          className={`w-full p-3 rounded-lg border text-left transition flex items-center justify-between ${
                            selectedInstallment?.id === inst.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{inst.installment_no}. Taksit</p>
                            <p className="text-xs text-gray-500">
                              Vade: {inst.due_date ? new Date(inst.due_date).toLocaleDateString('tr-TR') : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₺{inst.amount?.toLocaleString('tr-TR')}</p>
                            {inst.due_date && new Date(inst.due_date) < new Date() && (
                              <span className="text-xs text-red-600 font-medium">Gecikmiş!</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                      Bu öğrencinin ödenmemiş taksiti bulunmuyor.
                    </p>
                  )}
                </div>
              )}

              {/* Ödeme Detayları */}
              {selectedInstallment && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      3. Ödeme Tutarı
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      4. Ödeme Yöntemi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'cash', label: 'Nakit' },
                        { value: 'bank_transfer', label: 'Havale/EFT' },
                        { value: 'credit_card', label: 'Kredi Kartı' },
                        { value: 'check', label: 'Çek' },
                      ].map((method) => (
                        <button
                          key={method.value}
                          onClick={() => setPaymentMethod(method.value)}
                          className={`p-3 rounded-lg border text-sm font-medium transition ${
                            paymentMethod === method.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <button
                onClick={() => setShowQuickPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                İptal
              </button>
              <button
                onClick={handleQuickPayment}
                disabled={!selectedInstallment || processingPayment}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {processingPayment ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Ödemeyi Onayla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== TARİH BAZLI RAPOR MODAL ========== */}
      {showDateReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar size={24} />
                Tarih Bazlı Gelir/Gider Raporu
              </h2>
              <button
                onClick={() => setShowDateReportModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Tarih Tipi Seçimi */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rapor Türü
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportDateType('single')}
                    className={`flex-1 p-4 rounded-xl border-2 transition ${
                      reportDateType === 'single'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">📅</div>
                    <div className="font-semibold">Tek Gün</div>
                    <div className="text-xs text-gray-500 mt-1">Belirli bir günün raporu</div>
                  </button>
                  <button
                    onClick={() => setReportDateType('range')}
                    className={`flex-1 p-4 rounded-xl border-2 transition ${
                      reportDateType === 'range'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">📆</div>
                    <div className="font-semibold">Tarih Aralığı</div>
                    <div className="text-xs text-gray-500 mt-1">İki tarih arası rapor</div>
                  </button>
                </div>
              </div>

              {/* Tarih Seçimi */}
              <div className="mb-6">
                <div className={`grid gap-4 ${reportDateType === 'range' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {reportDateType === 'single' ? 'Tarih Seçin' : 'Başlangıç Tarihi'}
                    </label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    />
                  </div>
                  {reportDateType === 'range' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        min={reportStartDate}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Verileri Getir Butonu */}
              <button
                onClick={fetchDateFilteredData}
                disabled={loadingDateReport}
                className="w-full mb-6 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                {loadingDateReport ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Veriler Yükleniyor...
                  </>
                ) : (
                  <>
                    <Filter size={18} />
                    Verileri Getir
                  </>
                )}
              </button>

              {/* Sonuç Özeti */}
              {(dateFilteredData.payments.length > 0 || dateFilteredData.expenses.length > 0) && (
                <div className="space-y-4">
                  {/* Özet Kartları */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-emerald-600 uppercase">Toplam Gelir</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">
                        ₺{dateFilteredData.income.toLocaleString('tr-TR')}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">{dateFilteredData.payments.length} işlem</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-red-600 uppercase">Toplam Gider</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">
                        ₺{dateFilteredData.expense.toLocaleString('tr-TR')}
                      </p>
                      <p className="text-xs text-red-600 mt-1">{dateFilteredData.expenses.length} işlem</p>
                    </div>
                    <div className={`border rounded-xl p-4 text-center ${
                      dateFilteredData.income - dateFilteredData.expense >= 0 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <p className={`text-xs font-medium uppercase ${
                        dateFilteredData.income - dateFilteredData.expense >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>Net Durum</p>
                      <p className={`text-2xl font-bold mt-1 ${
                        dateFilteredData.income - dateFilteredData.expense >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>
                        ₺{(dateFilteredData.income - dateFilteredData.expense).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  {/* Gelir Listesi */}
                  {dateFilteredData.payments.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        💰 Gelirler ({dateFilteredData.payments.length})
                      </h3>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {dateFilteredData.payments.slice(0, 10).map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                            <div>
                              <span className="font-medium">{p.studentName || 'Öğrenci'}</span>
                              <span className="text-gray-500 ml-2">- {p.installment_no}. Taksit</span>
                            </div>
                            <span className="font-bold text-emerald-600">
                              ₺{(p.paid_amount || p.amount || 0).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))}
                        {dateFilteredData.payments.length > 10 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{dateFilteredData.payments.length - 10} kayıt daha (PDF&apos;de görünür)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gider Listesi */}
                  {dateFilteredData.expenses.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        💸 Giderler ({dateFilteredData.expenses.length})
                      </h3>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {dateFilteredData.expenses.slice(0, 10).map((e: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                            <div>
                              <span className="font-medium">{e.description || e.title || 'Gider'}</span>
                              <span className="text-gray-500 ml-2">- {e.category || 'Diğer'}</span>
                            </div>
                            <span className="font-bold text-red-600">
                              ₺{(e.amount || 0).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Veri yoksa mesaj */}
              {!loadingDateReport && dateFilteredData.payments.length === 0 && dateFilteredData.expenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Yukarıdan tarih seçip &quot;Verileri Getir&quot; butonuna tıklayın.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <button
                onClick={() => setShowDateReportModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Kapat
              </button>
              <button
                onClick={handleDownloadDatePDF}
                disabled={dateFilteredData.payments.length === 0 && dateFilteredData.expenses.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <Download size={18} />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
