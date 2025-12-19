'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Download,
  CreditCard,
  FileText,
  RefreshCw,
  Book,
  Shirt,
  UtensilsCrossed,
  Pencil,
  Package,
  Plus,
  Trash2,
  Clock,
  X,
  Wallet,
  Sparkles,
  Banknote,
  Building,
  Calendar,
  CheckCircle2,
  Printer,
  MessageCircle
} from 'lucide-react';
import RestructurePlanModal from '@/components/finance/RestructurePlanModal';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { downloadPDFFromHTML } from '@/lib/utils/pdfGenerator';
import toast from 'react-hot-toast';

interface Installment {
  id: string;
  installment_no: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_at?: string;
  payment_method?: string;
  note?: string | null;
}

interface OtherIncome {
  id: string;
  title: string;
  category: string;
  amount: number;
  paidAmount: number;
  isPaid: boolean;
  dueDate: string | null;
  paidAt: string | null;
  date: string;
  payment_type: string;
  notes?: string;
}

// Kategori bilgileri
const CATEGORY_INFO: Record<string, { label: string; icon: any; color: string }> = {
  book: { label: 'Kitap', icon: Book, color: 'bg-blue-500' },
  uniform: { label: 'Üniforma', icon: Shirt, color: 'bg-purple-500' },
  meal: { label: 'Yemek', icon: UtensilsCrossed, color: 'bg-orange-500' },
  stationery: { label: 'Kırtasiye', icon: Pencil, color: 'bg-green-500' },
  other: { label: 'Diğer', icon: Package, color: 'bg-gray-500' },
};

interface Props {
  student: any;
  onRefresh?: () => void;
}

// Türkçe karakterleri PDF için düzgün göster
// jsPDF helvetica fontu Türkçe karakterleri desteklemediği için
// karakterleri koruyan bir map kullanıyoruz
const turkishCharMap: Record<string, string> = {
  'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I',
  'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
  'İ': 'I', '₺': 'TL'
};

// PDF'de Türkçe karakterleri okunabilir hale getir
const turkishToAscii = (text: string): string => {
  if (!text) return '';
  return text.split('').map(char => turkishCharMap[char] || char).join('');
};

// PDF Başlık Metinleri - Daha okunabilir format
const PDF_LABELS = {
  CONTRACT_TITLE: 'KAYIT SOZLESMESI',
  STUDENT_INFO: 'OGRENCI BILGILERI', 
  GUARDIAN_INFO: 'VELI BILGILERI',
  PAYMENT_PLAN: 'ODEME PLANI VE TAKSIT DURUMU',
  RECEIPT_TITLE: 'ODEME MAKBUZU',
  STUDENT: 'Ogrenci',
  CLASS: 'Sinif',
  DEPOSIT: 'Pesinat',
  PAID: 'Odendi',
  PAID_AMOUNT: 'Odenen',
  OVERDUE: 'Gecikmis',
  WAITING: 'Bekliyor',
  DESCRIPTION: 'Aciklama',
  GUARDIAN_NAME: 'Veli Adi',
  REGISTRATION_DATE: 'Kayit Tarihi',
  TC_ID: 'TC Kimlik No'
};

// A4 Standart Tahsilat Makbuzu Şablonu - Tüm Ödemeler İçin Ortak Format
// TEK SAYFA - ZEMİN YOK - TÖNER TASARRUFU
interface ReceiptParams {
  type: 'education' | 'other';
  organizationName: string;
  receiptNo: string;
  currentDateTime: string;
  formattedDate: string;
  studentName: string;
  studentNo: string;
  parentName: string;
  paymentMethod: string;
  amount: number;
  category: string;
  description: string;
  installmentNo?: number;
}

const generateA4ReceiptHTML = (params: ReceiptParams): string => {
  const isEducation = params.type === 'education';
  const receiptTitle = isEducation ? 'EĞİTİM ÖDEMESİ TAHSİLAT MAKBUZU' : 'DİĞER GELİR TAHSİLAT MAKBUZU';
  
  // TEK SAYFA A4 - KOMPAKT TASARIM - ZEMİN YOK
  return `
    <div style="width: 794px; height: 1123px; margin: 0 auto; padding: 40px 50px; font-family: Arial, sans-serif; background: white; box-sizing: border-box;">
      
      <!-- HEADER -->
      <div style="border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 50px; height: 50px; border: 3px solid #1a1a1a; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px; font-weight: 900; color: #1a1a1a;">İ</span>
            </div>
            <div>
              <h1 style="font-size: 22px; color: #1a1a1a; font-weight: 700; margin: 0;">${params.organizationName}</h1>
              <p style="font-size: 12px; color: #666; margin: 3px 0 0 0;">Eğitim Yönetim Sistemi</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 11px; color: #666; margin: 0;">Belge No: <strong>${params.receiptNo}</strong></p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">${params.currentDateTime}</p>
          </div>
        </div>
      </div>
      
      <!-- BAŞLIK -->
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0; padding: 12px 0; border: 2px solid #1a1a1a;">
          ${receiptTitle}
        </h2>
      </div>
      
      <!-- ÖĞRENCİ VE VELİ BİLGİLERİ -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div style="border: 1px solid #1a1a1a; padding: 15px;">
          <h3 style="font-size: 12px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 8px;">Öğrenci Bilgileri</h3>
          <p style="font-size: 11px; color: #666; margin: 0;">Adı Soyadı:</p>
          <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 2px 0 8px 0;">${params.studentName}</p>
          <p style="font-size: 11px; color: #666; margin: 0;">Öğrenci No:</p>
          <p style="font-size: 12px; color: #1a1a1a; margin: 2px 0 0 0;">${params.studentNo}</p>
        </div>
        
        <div style="border: 1px solid #1a1a1a; padding: 15px;">
          <h3 style="font-size: 12px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 8px;">Ödeme Yapan</h3>
          <p style="font-size: 11px; color: #666; margin: 0;">Veli Adı:</p>
          <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 2px 0 8px 0;">${params.parentName}</p>
          <p style="font-size: 11px; color: #666; margin: 0;">Ödeme Tarihi:</p>
          <p style="font-size: 12px; color: #1a1a1a; margin: 2px 0 0 0;">${params.formattedDate}</p>
        </div>
      </div>
      
      <!-- ÖDEME DETAYLARI - ZEMİN YOK -->
      <div style="border: 2px solid #1a1a1a; margin-bottom: 25px;">
        <div style="border-bottom: 2px solid #1a1a1a; padding: 10px 15px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0;">ÖDEME DETAYLARI</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 10px 15px; font-size: 12px; color: #666; width: 35%;">Kategori</td>
              <td style="padding: 10px 15px; font-size: 14px; font-weight: 600; color: #1a1a1a;">${params.category}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 10px 15px; font-size: 12px; color: #666;">Açıklama</td>
              <td style="padding: 10px 15px; font-size: 14px; font-weight: 600; color: #1a1a1a;">${params.description}</td>
            </tr>
            <tr>
              <td style="padding: 10px 15px; font-size: 12px; color: #666;">Ödeme Yöntemi</td>
              <td style="padding: 10px 15px; font-size: 14px; font-weight: 500; color: #1a1a1a;">${params.paymentMethod}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- TAHSİL EDİLEN TUTAR - ZEMİN YOK, SADECE KENARLK -->
      <div style="border: 3px solid #1a1a1a; padding: 25px; text-align: center; margin-bottom: 30px;">
        <p style="font-size: 14px; color: #666; margin: 0;">Tahsil Edilen Tutar</p>
        <p style="font-size: 36px; font-weight: 700; color: #1a1a1a; margin: 10px 0 0 0;">₺${params.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      
      <!-- İMZA ALANLARI -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 25px;">
        <div style="text-align: center; border: 1px solid #1a1a1a; padding: 15px;">
          <p style="font-size: 12px; color: #666; margin: 0 0 5px 0;">Teslim Alan</p>
          <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 25px 0;">Muhasebe Birimi</p>
          <div style="border-top: 1px solid #1a1a1a; padding-top: 8px;">
            <p style="font-size: 10px; color: #666; margin: 0;">İmza / Kaşe</p>
          </div>
        </div>
          <p style="font-size: 12px; color: #666; margin: 0 0 5px 0;">Teslim Eden</p>
          <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 25px 0;">${params.parentName}</p>
          <div style="border-top: 1px solid #1a1a1a; padding-top: 8px;">
            <p style="font-size: 10px; color: #666; margin: 0;">İmza</p>
          </div>
        </div>
      </div>
      
      <!-- FOOTER -->
      <div style="border-top: 1px solid #1a1a1a; padding-top: 15px; text-align: center;">
        <p style="font-size: 10px; color: #666; margin: 0;">Bu belge elektronik ortamda üretilmiştir ve geçerli bir tahsilat belgesi yerine geçer.</p>
        <p style="font-size: 11px; color: #1a1a1a; font-weight: 600; margin: 5px 0 0 0;">${params.organizationName} - Eğitim Yönetim Sistemi</p>
      </div>
      
    </div>
  `;
};

export default function StudentFinanceTab({ student, onRefresh }: Props) {
  const { canCollectPayment, canEditInstallment, canAddInstallment, canExportPdf } = usePermission();
  const { currentOrganization } = useOrganizationStore();
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';
  
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showRestructureModal, setShowRestructureModal] = useState(false);
  
  // Ödeme Modal State
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [isBackdatedPayment, setIsBackdatedPayment] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  
  // Diğer Gelirler State
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [loadingOtherIncomes, setLoadingOtherIncomes] = useState(false);
  
  // Diğer Gelirler Tahsilat State
  const [showOtherPaymentModal, setShowOtherPaymentModal] = useState(false);
  const [selectedOtherIncome, setSelectedOtherIncome] = useState<OtherIncome | null>(null);
  const [otherPaymentAmount, setOtherPaymentAmount] = useState('');
  const [otherPaymentMethod, setOtherPaymentMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [otherPaymentLoading, setOtherPaymentLoading] = useState(false);
  
  // Eski Kayıt Formu Accordion
  const [showOldEnrollmentInfo, setShowOldEnrollmentInfo] = useState(false);
  
  // Arşivlenmiş (eski ödenmiş) taksitler
  const [archivedInstallments, setArchivedInstallments] = useState<Installment[]>([]);
  const [showArchivedPayments, setShowArchivedPayments] = useState(false);
  
  // Taksit silme
  const [deletingInstallmentId, setDeletingInstallmentId] = useState<string | null>(null);
  
  // Taksit Sil Fonksiyonu
  const handleDeleteInstallment = async (installmentId: string, isPaid: boolean) => {
    const confirmMessage = isPaid 
      ? '⚠️ DİKKAT: Bu taksit için ödeme yapılmış!\n\nYine de silmek istiyor musunuz? Ödeme tutarı bakiyeden düşülecektir.'
      : 'Bu taksiti silmek istediğinizden emin misiniz?';
    
    if (!confirm(confirmMessage)) return;
    
    setDeletingInstallmentId(installmentId);
    try {
      const response = await fetch(`/api/installments/${installmentId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Taksit silindi');
        fetchInstallments();
        onRefresh?.();
      } else {
        toast.error(data.error || 'Taksit silinemedi');
      }
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setDeletingInstallmentId(null);
    }
  };

  const fetchInstallments = useCallback(async () => {
    setLoading(true);
    console.log('[StudentFinanceTab] Taksitler çekiliyor... Student ID:', student.id);
    
    try {
      // Aktif taksitleri çek
      const response = await fetch(`/api/installments?student_id=${student.id}`);
      const data = await response.json();
      
      console.log('[StudentFinanceTab] API yanıtı:', {
        success: data.success,
        count: data.data?.length || 0,
        error: data.error
      });
      
      if (data.success && data.data) {
        const allInstallments = data.data;
        
        console.log('[StudentFinanceTab] Tüm taksitler:', allInstallments.map((i: any) => ({
          id: i.id?.substring(0, 8),
          no: i.installment_no,
          amount: i.amount,
          db_status: i.db_status,
          status: i.status
        })));
        
        // Aktif taksitler (db_status = 'active' veya null/undefined)
        // ÖNEMLİ: API'den gelen 'db_status' alanını kullan, 'status' değil!
        const activeInstallments = allInstallments.filter((i: any) => 
          !i.db_status || i.db_status === 'active'
        );
        
        // Arşivlenmiş ödenmiş taksitler (db_status = 'archived_paid')
        const archived = allInstallments.filter((i: any) => 
          i.db_status === 'archived_paid'
        );
        
        console.log('[StudentFinanceTab] Filtreleme sonucu:', {
          aktif: activeInstallments.length,
          arsivlenmis: archived.length
        });
        
        if (activeInstallments.length > 20) {
          toast.error(`⚠️ DİKKAT: Bu öğrenci için ${activeInstallments.length} aktif taksit bulundu!`, {
            duration: 8000,
          });
        }
        
        setInstallments(activeInstallments.slice(0, 20));
        setArchivedInstallments(archived);
      } else {
        console.warn('[StudentFinanceTab] Taksit verisi yok veya hata:', data.error);
      }
    } catch (err) {
      console.error('[StudentFinanceTab] Taksit çekme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  // Diğer gelirleri çek
  const fetchOtherIncomes = useCallback(async () => {
    setLoadingOtherIncomes(true);
    try {
      const response = await fetch(`/api/finance/other-income?student_id=${student.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const mapped = (data.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          amount: Number(item.amount) || 0,
          paidAmount: Number(item.paid_amount) || 0,
          isPaid: item.is_paid || false,
          dueDate: item.due_date,
          paidAt: item.paid_at,
          date: item.date,
          payment_type: item.payment_type,
          notes: item.notes
        }));
        // Önce kategoriye göre, sonra vade tarihine göre sırala (1. taksit üstte)
        mapped.sort((a: OtherIncome, b: OtherIncome) => {
          // Önce kategoriye göre grupla
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category, 'tr');
          }
          // Aynı kategoride vade tarihine göre sırala (erken tarih üstte)
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.date).getTime();
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.date).getTime();
          return dateA - dateB;
        });
        setOtherIncomes(mapped);
      }
    } catch {
      // Error handled silently
    } finally {
      setLoadingOtherIncomes(false);
    }
  }, [student.id]);

  useEffect(() => {
    fetchOtherIncomes();
  }, [fetchOtherIncomes]);

  // Diğer Gelir Tahsilat Fonksiyonları
  const handleOpenOtherPayment = (income: OtherIncome) => {
    setSelectedOtherIncome(income);
    const remaining = income.amount - income.paidAmount;
    setOtherPaymentAmount(remaining.toString());
    setOtherPaymentMethod('cash');
    setShowOtherPaymentModal(true);
  };

  const handleCollectOtherPayment = async () => {
    if (!selectedOtherIncome) return;
    
    const amount = Number(otherPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    setOtherPaymentLoading(true);
    try {
      const newPaidAmount = selectedOtherIncome.paidAmount + amount;
      const isFullyPaid = newPaidAmount >= selectedOtherIncome.amount;

      const res = await fetch('/api/finance/other-income', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOtherIncome.id,
          paid_amount: newPaidAmount,
          is_paid: isFullyPaid,
          paid_at: new Date().toISOString(),
          payment_type: otherPaymentMethod
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`✅ ₺${amount.toLocaleString('tr-TR')} tahsil edildi!`);
        setShowOtherPaymentModal(false);
        setSelectedOtherIncome(null);
        fetchOtherIncomes();
        onRefresh?.();
      } else {
        toast.error(json.error || 'Tahsilat başarısız');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setOtherPaymentLoading(false);
    }
  };

  // Diğer Gelirler Makbuz İndir - A4 Standart Format
  const downloadOtherIncomeReceipt = async (income: OtherIncome) => {
    const toastId = toast.loading('Makbuz hazırlanıyor...');
    
    try {
      const receiptNo = `DG-${new Date().getFullYear()}-${income.id.slice(0, 8).toUpperCase()}`;
      const formattedDate = income.paidAt 
        ? new Date(income.paidAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
      const currentDateTime = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Öğrenci';
      const parentName = student.parent_name || 'Sayın Veli';
      const categoryLabel = CATEGORY_INFO[income.category]?.label || 'Diğer';

      // A4 Standart Tahsilat Makbuzu - Diğer Gelirler için
      const htmlContent = generateA4ReceiptHTML({
        type: 'other',
        organizationName,
        receiptNo,
        currentDateTime,
        formattedDate,
        studentName,
        studentNo: student.student_no || '-',
        parentName,
        paymentMethod: income.payment_type === 'cash' ? 'Nakit' : income.payment_type === 'card' ? 'Kredi Kartı' : 'Havale/EFT',
        amount: income.paidAmount,
        category: categoryLabel,
        description: income.title,
      });

      await downloadPDFFromHTML(htmlContent, {
        filename: `Makbuz_${categoryLabel}_${student.last_name}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`,
        format: 'a4',
        margin: 10,
      });
      
      toast.success(
        `✅ Makbuz İndirildi!\n\n${categoryLabel} - ₺${income.paidAmount.toLocaleString('tr-TR')}`,
        { id: toastId, duration: 4000, icon: '🧾' }
      );
    } catch (error: any) {
      toast.error(`❌ Makbuz oluşturulamadı: ${error.message}`, { id: toastId });
    }
  };

  const handlePayment = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentAmount(String(installment.amount - installment.paid_amount));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setPaymentNote('');
    setIsBackdatedPayment(false);
    setShowPaymentModal(true);
  };

  // Tarih değişikliği kontrolü
  const handlePaymentDateChange = (newDate: string) => {
    setPaymentDate(newDate);
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    setIsBackdatedPayment(selectedDate < today);
  };

  const processPayment = async (paymentAmount?: number, paymentMethod?: string) => {
    if (!selectedInstallment) return;

    const amount = paymentAmount || selectedInstallment.amount;
    const toastId = toast.loading('Ödeme işleniyor...');
    
    try {
      // Gerçek API çağrısı
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installment_id: selectedInstallment.id,
          student_id: student.id,
          amount,
          payment_method: paymentMethod || 'cash',
          notes: `${selectedInstallment.installment_no}. taksit ödemesi`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ödeme işlenemedi');
      }
      
      toast.success(
        `✅ Ödeme Kaydedildi!\n\n` +
        `Taksit: ${selectedInstallment.installment_no}\n` +
        `Tutar: ₺${amount.toLocaleString('tr-TR')}\n` +
        `${data.data.is_fully_paid ? '🎉 Taksit tamamen ödendi!' : `Kalan: ₺${data.data.remaining.toLocaleString('tr-TR')}`}`,
        { id: toastId, duration: 6000, icon: '💰' }
      );
      
      setShowPaymentModal(false);
      setSelectedInstallment(null);
      
      // Listeyi hemen yenile
      await fetchInstallments();
      onRefresh?.();
    } catch (error: any) {
      toast.error(`❌ Ödeme hatası: ${error.message}`, { id: toastId });
    }
  };

  const downloadReceipt = async (installment: Installment) => {
    const toastId = toast.loading('Makbuz hazırlanıyor...');
    
    try {
      const receiptNo = `MKB-${new Date().getFullYear()}-${installment.id.slice(0, 8).toUpperCase()}`;
      const formattedDate = installment.paid_at 
        ? new Date(installment.paid_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
      const currentDateTime = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Öğrenci';
      const parentName = student.parent_name || 'Sayın Veli';
      const paymentMethod = installment.payment_method === 'cash' ? 'Nakit' :
                            installment.payment_method === 'card' ? 'Kredi Kartı' :
                            installment.payment_method === 'bank' ? 'Havale/EFT' : 'Belirtilmedi';
      const installmentLabel = installment.installment_no > 0 ? `${installment.installment_no}. Taksit` : 'Peşin Ödeme';
      const paidAmount = installment.paid_amount || installment.amount;

      // A4 Standart Tahsilat Makbuzu - Eğitim Ödemesi için
      const htmlContent = generateA4ReceiptHTML({
        type: 'education',
        organizationName,
        receiptNo,
        currentDateTime,
        formattedDate,
        studentName,
        studentNo: student.student_no || '-',
        parentName,
        paymentMethod,
        amount: paidAmount,
        category: 'Eğitim Ödemesi',
        description: installmentLabel,
        installmentNo: installment.installment_no,
      });

      await downloadPDFFromHTML(htmlContent, {
        filename: `Makbuz_Egitim_${installment.installment_no}_${student.last_name}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`,
        format: 'a4',
        margin: 10,
      });
      
      toast.success(
        `✅ Makbuz İndirildi!\n\n${installmentLabel} - ₺${paidAmount.toLocaleString('tr-TR')}`,
        { id: toastId, duration: 4000, icon: '🧾' }
      );
    } catch (error: any) {
      toast.error(`❌ Makbuz oluşturulamadı: ${error.message}`, { id: toastId });
    }
  };

  // Eğitim Taksitleri Özet PDF
  const downloadEducationSummaryPDF = async () => {
    const toastId = toast.loading('Eğitim ödemeleri PDF hazırlanıyor...');
    
    try {
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
      const today = new Date().toLocaleDateString('tr-TR');
      const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
      const paidAmount = installments.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
      const remainingAmount = totalAmount - paidAmount;
      
      const htmlContent = `
        <div style="width: 700px; padding: 30px; font-family: Arial, sans-serif; background: white;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 15px;">
            <h1 style="color: #4f46e5; margin: 0;">EĞİTİM ÖDEME PLANI</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Tarih: ${today}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div><strong>Öğrenci:</strong> ${studentName}</div>
              <div><strong>Öğrenci No:</strong> ${student.student_no || '-'}</div>
              <div><strong>Veli:</strong> ${student.parent_name || '-'}</div>
              <div><strong>Sınıf:</strong> ${student.class || student.section || '-'}</div>
          </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #4f46e5; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Toplam</div>
              <div style="font-size: 20px; font-weight: bold;">₺${totalAmount.toLocaleString('tr-TR')}</div>
            </div>
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Ödenen</div>
              <div style="font-size: 20px; font-weight: bold;">₺${paidAmount.toLocaleString('tr-TR')}</div>
            </div>
            <div style="background: #f97316; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Kalan</div>
              <div style="font-size: 20px; font-weight: bold;">₺${remainingAmount.toLocaleString('tr-TR')}</div>
            </div>
            </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Taksit</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Vade</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Tutar</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Ödenen</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Durum</th>
              </tr>
            </thead>
            <tbody>
              ${installments.map(inst => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${inst.installment_no > 0 ? inst.installment_no + '. Taksit' : 'Peşinat'}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">₺${inst.amount.toLocaleString('tr-TR')}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">₺${(inst.paid_amount || 0).toLocaleString('tr-TR')}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <span style="padding: 2px 8px; border-radius: 10px; font-size: 10px; background: ${inst.status === 'paid' ? '#d1fae5' : '#fef3c7'}; color: ${inst.status === 'paid' ? '#065f46' : '#92400e'};">
                      ${inst.status === 'paid' ? 'Ödendi' : 'Beklemede'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 10px;">
            ${organizationName} - Eğitim Yönetim Sistemi
            </div>
            </div>
      `;

      await downloadPDFFromHTML(htmlContent, {
        filename: `Egitim_Odemeler_${studentName.replace(/\s/g, '_')}_${today.replace(/\./g, '-')}.pdf`,
        format: 'a4',
        margin: 10,
      });
      
      toast.success('✅ Eğitim Ödemeleri PDF indirildi!', { id: toastId });
    } catch (error: any) {
      toast.error('PDF oluşturulamadı: ' + error.message, { id: toastId });
    }
  };

  // Diğer Gelirler Özet PDF
  const downloadOtherIncomeSummaryPDF = async () => {
    const toastId = toast.loading('Diğer gelirler PDF hazırlanıyor...');
    
    try {
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
      const today = new Date().toLocaleDateString('tr-TR');
      const totalAmount = otherIncomes.reduce((sum, i) => sum + i.amount, 0);
      const paidAmount = otherIncomes.reduce((sum, i) => sum + i.paidAmount, 0);
      const remainingAmount = totalAmount - paidAmount;
      
      const htmlContent = `
        <div style="width: 700px; padding: 30px; font-family: Arial, sans-serif; background: white;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #9333ea; padding-bottom: 15px;">
            <h1 style="color: #9333ea; margin: 0;">DİĞER GELİRLER</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Kitap, Üniforma, Yemek ve Diğer</p>
            <p style="color: #666; margin: 5px 0 0 0;">Tarih: ${today}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div><strong>Öğrenci:</strong> ${studentName}</div>
              <div><strong>Öğrenci No:</strong> ${student.student_no || '-'}</div>
              <div><strong>Veli:</strong> ${student.parent_name || '-'}</div>
              <div><strong>Sınıf:</strong> ${student.class || student.section || '-'}</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #9333ea; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Toplam</div>
              <div style="font-size: 20px; font-weight: bold;">₺${totalAmount.toLocaleString('tr-TR')}</div>
            </div>
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Ödenen</div>
              <div style="font-size: 20px; font-weight: bold;">₺${paidAmount.toLocaleString('tr-TR')}</div>
            </div>
            <div style="background: #f97316; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Kalan</div>
              <div style="font-size: 20px; font-weight: bold;">₺${remainingAmount.toLocaleString('tr-TR')}</div>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Ödenen</div>
              <div style="font-size: 20px; font-weight: bold;">₺${paidAmount.toLocaleString('tr-TR')}</div>
          </div>
            <div style="background: #f97316; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px;">Kalan</div>
              <div style="font-size: 20px; font-weight: bold;">₺${remainingAmount.toLocaleString('tr-TR')}</div>
        </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Açıklama</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Kategori</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Tutar</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Ödenen</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Durum</th>
              </tr>
            </thead>
            <tbody>
              ${otherIncomes.map(inc => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${inc.title}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${CATEGORY_INFO[inc.category]?.label || 'Diğer'}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">₺${inc.amount.toLocaleString('tr-TR')}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">₺${inc.paidAmount.toLocaleString('tr-TR')}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <span style="padding: 2px 8px; border-radius: 10px; font-size: 10px; background: ${inc.isPaid ? '#d1fae5' : '#fef3c7'}; color: ${inc.isPaid ? '#065f46' : '#92400e'};">
                      ${inc.isPaid ? 'Ödendi' : 'Beklemede'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 10px;">
            ${organizationName} - Eğitim Yönetim Sistemi
          </div>
        </div>
      `;

      await downloadPDFFromHTML(htmlContent, {
        filename: `Diger_Gelirler_${studentName.replace(/\s/g, '_')}_${today.replace(/\./g, '-')}.pdf`,
        format: 'a4',
        margin: 10,
      });
      
      toast.success('✅ Diğer Gelirler PDF indirildi!', { id: toastId });
    } catch (error: any) {
      toast.error('PDF oluşturulamadı: ' + error.message, { id: toastId });
    }
  };

  const downloadContract = async () => {
    const toastId = toast.loading('Sözleşme PDF\'i hazırlanıyor...');
    
    try {
      const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      
      // Diğer satışlar toplamları
      const otherTotalAmount = otherIncomes.reduce((sum, i) => sum + i.amount, 0);
      const otherPaidAmount = otherIncomes.reduce((sum, i) => sum + i.paidAmount, 0);
      const grandTotal = totalAmount + otherTotalAmount;
      const grandPaid = paidAmount + otherPaidAmount;
      
      // STANDART 2 SAYFA A4 FORMAT - PrintLayout.tsx ile AYNI
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; width: 794px;">
          
          <!-- ===== SAYFA 1 - KAYIT FORMU ===== -->
          <div style="width: 794px; padding: 30px 40px; box-sizing: border-box; background: #fff;">
            
            <!-- Başlık -->
            <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="border: 2px solid #000; padding: 4px 10px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 14px; font-weight: 900; letter-spacing: -0.5px;">AkademiHub</span>
              </div>
                <div>
                  <h1 style="font-size: 18px; font-weight: 800; margin: 0;">${organizationName.toUpperCase()}</h1>
                  <p style="font-size: 10px; color: #666; margin: 0;">Eğitim Kurumu</p>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="border: 1px solid #000; padding: 5px 15px; display: inline-block;">
                  <h2 style="font-size: 13px; font-weight: 800; margin: 0;">KAYIT FORMU</h2>
                </div>
                <p style="font-size: 10px; margin: 4px 0 0 0;">Tarih: ${today} | No: ${student.student_no || '____'}</p>
              </div>
            </div>
            
            <!-- ÖĞRENCİ BİLGİLERİ -->
            <div style="margin-bottom: 8px;">
              <div style="border: 1px solid #000; border-bottom: none; padding: 4px 10px; background: #f5f5f5;">
                <h3 style="font-weight: bold; font-size: 11px; margin: 0;">ÖĞRENCİ BİLGİLERİ</h3>
              </div>
              <table style="width: 100%; border: 1px solid #000; font-size: 10px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 8px; width: 12%; font-weight: 600; border-right: 1px solid #ccc;">Ad Soyad</td>
                  <td style="padding: 5px 8px; width: 28%; font-weight: bold; border-right: 1px solid #ccc;">${student.first_name || ''} ${student.last_name || ''}</td>
                  <td style="padding: 5px 8px; width: 12%; font-weight: 600; border-right: 1px solid #ccc;">TC Kimlik</td>
                  <td style="padding: 5px 8px; width: 20%; font-family: monospace; border-right: 1px solid #ccc;">${student.tc_no || '_____________'}</td>
                  <td style="padding: 5px 8px; width: 10%; font-weight: 600; border-right: 1px solid #ccc;">Sınıf</td>
                  <td style="padding: 5px 8px;">${student.class || '-'}-${student.section || 'A'}</td>
                </tr>
              </table>
              </div>

            <!-- VELİ BİLGİLERİ -->
            <div style="margin-bottom: 8px;">
              <div style="border: 1px solid #000; border-bottom: none; padding: 4px 10px; background: #f5f5f5;">
                <h3 style="font-weight: bold; font-size: 11px; margin: 0;">VELİ BİLGİLERİ</h3>
            </div>
              <table style="width: 100%; border: 1px solid #000; font-size: 10px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 8px; width: 12%; font-weight: 600; border-right: 1px solid #ccc;">Veli Adı</td>
                  <td style="padding: 5px 8px; width: 30%; font-weight: bold; border-right: 1px solid #ccc;">${student.parent_name || '-'}</td>
                  <td style="padding: 5px 8px; width: 10%; font-weight: 600; border-right: 1px solid #ccc;">Telefon</td>
                  <td style="padding: 5px 8px; font-weight: bold;">${student.parent_phone || '-'}</td>
                </tr>
              </table>
          </div>
          
            <!-- TAKSİT PLANI - KOMPAKT -->
            ${installments.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="border: 1px solid #000; border-bottom: none; padding: 4px 10px; background: #f5f5f5;">
                <h3 style="font-weight: bold; font-size: 11px; margin: 0;">EĞİTİM TAKSİT PLANI (${installments.length} Taksit)</h3>
            </div>
              <table style="width: 100%; border: 1px solid #000; font-size: 9px; border-collapse: collapse; table-layout: fixed;">
              <thead>
                  <tr style="background: #f0f0f0;">
                    <th style="padding: 4px 3px; text-align: center; width: 8%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 1px solid #000;">Taksit</th>
                    <th style="padding: 4px 3px; text-align: center; width: 14%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 1px solid #000;">Vade Tarihi</th>
                    <th style="padding: 4px 3px; text-align: right; width: 14%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 1px solid #000;">Tutar</th>
                    <th style="padding: 4px 3px; text-align: right; width: 14%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 1px solid #000;">Ödenen</th>
                    <th style="padding: 4px 3px; text-align: center; width: 14%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 1px solid #000;">Ödeme Tarihi</th>
                    <th style="padding: 4px 3px; text-align: left; width: 36%; font-weight: bold; border-bottom: 1px solid #000;">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                  ${installments.slice(0, 12).map((inst, i) => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 3px; text-align: center; font-weight: bold; border-right: 1px solid #ddd;">${inst.installment_no === 0 ? 'Peşinat' : inst.installment_no + '. Taksit'}</td>
                      <td style="padding: 3px; text-align: center; border-right: 1px solid #ddd;">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                      <td style="padding: 3px; text-align: right; font-weight: bold; border-right: 1px solid #ddd;">${inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td style="padding: 3px; text-align: right; border-right: 1px solid #ddd; ${inst.status === 'paid' ? 'color: #059669; font-weight: bold;' : 'color: #999;'}">${inst.status === 'paid' ? (inst.paid_amount || inst.amount).toLocaleString('tr-TR') + ' TL' : '—'}</td>
                      <td style="padding: 3px; text-align: center; border-right: 1px solid #ddd; ${inst.status === 'paid' ? 'color: #059669;' : 'color: #999;'}">${inst.status === 'paid' && inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('tr-TR') : '—'}</td>
                      <td style="padding: 3px 4px;">${inst.note || ''}</td>
                  </tr>
                `).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: #f0f0f0;">
                    <td colspan="2" style="padding: 5px; font-size: 10px; font-weight: bold; border-right: 1px solid #ccc; border-top: 1px solid #000;">TOPLAM</td>
                    <td style="padding: 5px; text-align: right; font-size: 11px; font-weight: bold; border-right: 1px solid #ccc; border-top: 1px solid #000;">${totalAmount.toLocaleString('tr-TR')} TL</td>
                    <td style="padding: 5px; text-align: right; font-size: 10px; font-weight: bold; border-right: 1px solid #ccc; border-top: 1px solid #000; color: #059669;">${paidAmount.toLocaleString('tr-TR')} TL</td>
                    <td style="border-top: 1px solid #000; border-right: 1px solid #ccc;"></td>
                    <td style="border-top: 1px solid #000;"></td>
                </tr>
                </tfoot>
              </table>
            </div>
            ` : ''}

            <!-- DİĞER SATIŞLAR -->
            ${otherIncomes.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <div style="border: 1px solid #000; border-bottom: none; padding: 4px 10px; background: #f5f5f5;">
                <h3 style="font-weight: bold; font-size: 11px; margin: 0;">DİĞER SATIŞLAR</h3>
              </div>
              <table style="width: 100%; border: 1px solid #000; font-size: 9px; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f0f0f0;">
                    <th style="padding: 4px; text-align: left; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 1px solid #000;">Açıklama</th>
                    <th style="padding: 4px; text-align: center; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 1px solid #000;">Kategori</th>
                    <th style="padding: 4px; text-align: right; width: 70px; font-weight: bold; border-bottom: 1px solid #000;">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  ${otherIncomes.map(inc => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 3px 4px; border-right: 1px solid #ddd;">${inc.title}</td>
                      <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #ddd;">${CATEGORY_INFO[inc.category]?.label || 'Diğer'}</td>
                      <td style="padding: 3px 4px; text-align: right; font-weight: bold;">${inc.amount.toLocaleString('tr-TR')} TL</td>
                    </tr>
                  `).join('')}
              </tbody>
                <tfoot>
                  <tr style="background: #f0f0f0;">
                    <td colspan="2" style="padding: 5px; font-size: 10px; font-weight: bold; border-right: 1px solid #ccc; border-top: 1px solid #000;">TOPLAM</td>
                    <td style="padding: 5px; text-align: right; font-size: 11px; font-weight: bold; border-top: 1px solid #000;">${otherTotalAmount.toLocaleString('tr-TR')} TL</td>
                  </tr>
                </tfoot>
            </table>
          </div>
            ` : ''}

            <!-- GENEL ÖZET -->
            <div style="border: 1px solid #000; margin-bottom: 10px;">
              <div style="border-bottom: 1px solid #000; padding: 4px 10px; background: #f5f5f5;">
                <h4 style="font-weight: bold; font-size: 10px; margin: 0;">ÖDEME ÖZETİ</h4>
              </div>
              <div style="display: flex; padding: 8px 10px; font-size: 9px;">
                <div style="flex: 1;"><strong>Genel Toplam:</strong> ${grandTotal.toLocaleString('tr-TR')} TL</div>
                <div style="flex: 1;"><strong>Ödenen:</strong> ${grandPaid.toLocaleString('tr-TR')} TL</div>
                <div style="flex: 1;"><strong>Kalan:</strong> <span style="font-weight: bold; font-size: 11px;">${(grandTotal - grandPaid).toLocaleString('tr-TR')} TL</span></div>
              </div>
            </div>

            <!-- İMZA ALANI -->
            <div style="display: flex; gap: 20px; margin-top: 15px;">
              <div style="flex: 1; border: 1px solid #000; padding: 8px; text-align: center;">
                <p style="font-weight: bold; font-size: 10px; margin: 0 0 25px 0;">VELİ İMZASI</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                <p style="font-size: 9px; margin: 0;">${student.parent_name || '________________'}</p>
                <p style="font-size: 8px; color: #666; margin: 0;">Tarih: ${today}</p>
              </div>
              <div style="flex: 1; border: 1px solid #000; padding: 8px; text-align: center;">
                <p style="font-weight: bold; font-size: 10px; margin: 0 0 25px 0;">KURUM YETKİLİSİ</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                <p style="font-size: 9px; margin: 0;">________________</p>
                <p style="font-size: 8px; color: #666; margin: 0;">Tarih: ${today}</p>
            </div>
              </div>

            <p style="text-align: center; font-size: 8px; color: #666; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 5px;">Sayfa 1/2 - Kayıt Formu | ${organizationName}</p>
          </div>

          <!-- ===== SAYFA 2 - SÖZLEŞME ===== -->
          <div style="width: 794px; padding: 30px 40px; box-sizing: border-box; background: #fff; border-top: 2px dashed #ccc;">
            
            <!-- Başlık -->
            <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="font-size: 16px; font-weight: 800; margin: 0;">EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
                <p style="font-size: 10px; margin: 4px 0 0 0;">${student.first_name || ''} ${student.last_name || ''} - ${student.academic_year || '2025-2026'}</p>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="text-align: right;">
                  <p style="font-weight: 800; font-size: 14px; margin: 0;">${organizationName.toUpperCase()}</p>
                  <p style="font-size: 10px; margin: 0;">${today}</p>
                </div>
                <div style="border: 2px solid #000; padding: 4px 10px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 12px; font-weight: 900; letter-spacing: -0.5px;">AkademiHub</span>
                </div>
            </div>
          </div>
          
            <!-- Sözleşme Metni -->
            <div style="border: 1px solid #000; padding: 12px; font-size: 9px; line-height: 1.6; margin-bottom: 10px;">
EĞİTİM HİZMETİ SÖZLEŞMESİ

İşbu sözleşme, ${organizationName} ("Kurum") ile aşağıda bilgileri bulunan veli arasında karşılıklı olarak düzenlenmiştir.

MADDE 1 - TARAFLAR
Kurum eğitim hizmetini sunmayı, Veli belirlenen ücret ve koşulları kabul etmeyi taahhüt eder.

MADDE 2 - EĞİTİM HİZMETİ
Kurum, öğretim yılı boyunca müfredat, ölçme-değerlendirme, rehberlik ve akademik danışmanlık hizmetlerini sunacaktır.

MADDE 3 - ÖDEME KOŞULLARI
Belirlenen ücret ve taksit planı her iki tarafça kabul edilmiştir. Taksitlerin zamanında ödenmemesi halinde kurum yasal işlem başlatma hakkını saklı tutar.

MADDE 4 - VELİ BEYANI
Veli; bilgilerin doğruluğunu, okul kurallarını kabul ettiğini, ödeme planını onayladığını ve KVKK kapsamında bilgilendirildiğini beyan eder.

MADDE 5 - KURUM BEYANI
Kurum, eğitim hizmetini sunmayı ve öğrenci dosyasını gizlilik esaslarına uygun korumayı taahhüt eder.

Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.
          </div>

            <!-- Taraf Bilgileri -->
            <div style="display: flex; gap: 12px; margin-bottom: 10px;">
              <div style="flex: 1; border: 1px solid #000;">
                <div style="border-bottom: 1px solid #000; padding: 4px 10px; background: #f5f5f5;">
                  <h4 style="font-weight: bold; font-size: 10px; margin: 0;">VELİ BİLGİLERİ</h4>
        </div>
                <div style="padding: 8px 10px; font-size: 9px;">
                  <p style="margin: 0 0 4px 0;"><strong>Ad Soyad:</strong> ${student.parent_name || '-'}</p>
                  <p style="margin: 0;"><strong>Telefon:</strong> ${student.parent_phone || '-'}</p>
                </div>
              </div>
              <div style="flex: 1; border: 1px solid #000;">
                <div style="border-bottom: 1px solid #000; padding: 4px 10px; background: #f5f5f5;">
                  <h4 style="font-weight: bold; font-size: 10px; margin: 0;">ÖĞRENCİ BİLGİLERİ</h4>
                </div>
                <div style="padding: 8px 10px; font-size: 9px;">
                  <p style="margin: 0 0 4px 0;"><strong>Ad Soyad:</strong> ${student.first_name || ''} ${student.last_name || ''}</p>
                  <p style="margin: 0;"><strong>Sınıf:</strong> ${student.class || '-'}-${student.section || 'A'}</p>
                </div>
              </div>
            </div>

            <!-- Ödeme Özeti -->
            <div style="border: 1px solid #000; margin-bottom: 10px;">
              <div style="border-bottom: 1px solid #000; padding: 4px 10px; background: #f5f5f5;">
                <h4 style="font-weight: bold; font-size: 10px; margin: 0;">ÖDEME PLANI ÖZETİ</h4>
              </div>
              <div style="display: flex; padding: 8px 10px; font-size: 9px;">
                <div style="flex: 1;"><strong>Toplam:</strong> ${grandTotal.toLocaleString('tr-TR')} TL</div>
                <div style="flex: 1;"><strong>Ödenen:</strong> ${grandPaid.toLocaleString('tr-TR')} TL</div>
                <div style="flex: 1;"><strong>Kalan:</strong> <span style="font-weight: bold; font-size: 11px;">${(grandTotal - grandPaid).toLocaleString('tr-TR')} TL</span></div>
              </div>
            </div>

            <!-- Onaylar -->
            <div style="border: 1px solid #000; margin-bottom: 10px;">
              <div style="border-bottom: 1px solid #000; padding: 4px 10px; background: #f5f5f5;">
                <h4 style="font-weight: bold; font-size: 10px; margin: 0;">ONAYLAR</h4>
              </div>
              <div style="display: flex; padding: 8px 10px; font-size: 8px; gap: 15px;">
                <div style="flex: 1; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 12px; height: 12px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold;">✓</span>
                  <span>KVKK kabul edildi</span>
                </div>
                <div style="flex: 1; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 12px; height: 12px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold;">✓</span>
                  <span>Okul kuralları kabul edildi</span>
                </div>
                <div style="flex: 1; display: flex; align-items: center; gap: 5px;">
                  <span style="width: 12px; height: 12px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold;">✓</span>
                  <span>Ödeme planı kabul edildi</span>
                </div>
              </div>
            </div>

            <!-- İMZA ALANI -->
            <div style="display: flex; gap: 20px; margin-top: 15px;">
              <div style="flex: 1; border: 1px solid #000; padding: 8px; text-align: center;">
                <p style="font-weight: bold; font-size: 10px; margin: 0 0 25px 0;">VELİ İMZASI</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                <p style="font-size: 9px; margin: 0;">${student.parent_name || '________________'}</p>
                <p style="font-size: 8px; color: #666; margin: 0;">Tarih: ${today}</p>
              </div>
              <div style="flex: 1; border: 1px solid #000; padding: 8px; text-align: center;">
                <p style="font-weight: bold; font-size: 10px; margin: 0 0 25px 0;">KURUM YETKİLİSİ</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                <p style="font-size: 9px; margin: 0;">________________</p>
                <p style="font-size: 8px; color: #666; margin: 0;">Tarih: ${today}</p>
              </div>
            </div>

            <!-- Alt Bilgi -->
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #ddd; text-align: center; font-size: 8px;">
              <p style="font-weight: 600; margin: 0;">Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
              <p style="color: #666; margin: 3px 0 0 0;">Bu sözleşme iki nüsha olarak düzenlenmiştir. | ${organizationName} - ${today}</p>
            </div>
          </div>
        </div>
      `;
      
      await downloadPDFFromHTML(htmlContent, {
        filename: `Kayit_Satislar_Sozlesme_${student.first_name || ''}_${student.last_name || ''}_${today.replace(/\./g, '-')}.pdf`,
        format: 'a4',
        margin: 8,
      });
      
      toast.success(
        '✅ Kayıt ve Satışlar Sözleşmesi İndirildi!',
        { id: toastId, duration: 4000, icon: '📄' }
      );
    } catch (error: any) {
      toast.error('PDF oluşturulamadı: ' + error.message, { id: toastId });
    }
  };

  const handleQuickPayment = () => {
    // En yakın ödenmemiş taksiti bul
    const unpaidInstallment = installments.find(i => i.status !== 'paid');
    
    if (!unpaidInstallment) {
      toast.success('🎉 Tüm taksitler ödendi!');
      return;
    }
    
    setSelectedInstallment(unpaidInstallment);
    setShowPaymentModal(true);
  };

  // Taksitlerden otomatik hesaplama
  const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = installments.reduce((sum, i) => sum + i.paid_amount, 0);
  const balance = totalAmount - paidAmount;

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { label: 'Ödendi', className: 'bg-green-100 text-green-700 border-green-300' },
      pending: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      overdue: { label: 'Gecikmiş', className: 'bg-red-100 text-red-700 border-red-300' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <>
    <div className="space-y-6">
      {/* ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700">Toplam Sözleşme</p>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">₺{totalAmount.toLocaleString('tr-TR')}</p>
        </div>

        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-700">Tahsil Edilen</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">₺{paidAmount.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-green-600 mt-1">
            %{totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0} ödendi
          </p>
        </div>

        <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-orange-700">Kalan Borç</p>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-900">₺{balance.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-orange-600 mt-1">
            {installments.filter(i => i.status !== 'paid').length} taksit bekliyor
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-3 justify-center">
          <button 
            onClick={handleQuickPayment}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 transition flex items-center justify-center gap-2"
          >
            <CreditCard className="h-5 w-5" />
            Hızlı Ödeme Al
          </button>
          <button 
            onClick={() => setShowRestructureModal(true)}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 transition flex items-center justify-center gap-2 shadow-md"
          >
            <RefreshCw className="h-5 w-5" />
            Yeniden Taksitlendir
          </button>
        </div>
      </div>

      {/* ESKİ KAYIT FORMU ACCORDION */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowOldEnrollmentInfo(!showOldEnrollmentInfo)}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-600" />
            <span className="font-bold text-gray-900">Eski Kayıt Formu</span>
            <span className="text-sm text-gray-500">(Kayıt bilgileri, taksit planı)</span>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${showOldEnrollmentInfo ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showOldEnrollmentInfo && (
          <div className="p-6 border-t border-gray-200 bg-white">
            {/* Öğrenci Bilgileri */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">👤</span>
                Öğrenci Bilgileri
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Ad Soyad:</span>
                  <p className="font-medium">{student.first_name} {student.last_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Öğrenci No:</span>
                  <p className="font-medium font-mono">{student.student_no}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sınıf:</span>
                  <p className="font-medium">{student.class} / {student.section || 'A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Kayıt Tarihi:</span>
                  <p className="font-medium">{student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : '-'}</p>
                </div>
              </div>
            </div>
            
            {/* Veli Bilgileri */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">👨‍👩‍👧</span>
                Veli Bilgileri
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Veli Adı:</span>
                  <p className="font-medium">{student.parent_name || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telefon:</span>
                  <p className="font-medium">{student.parent_phone || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">E-posta:</span>
                  <p className="font-medium">{student.parent_email || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* Ödeme Özeti */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">💰</span>
                Ödeme Özeti
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Toplam Sözleşme</p>
                  <p className="text-lg font-bold text-gray-800">₺{(student.total_amount || 0).toLocaleString('tr-TR')}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Tahsil Edilen</p>
                  <p className="text-lg font-bold text-green-600">₺{(student.paid_amount || 0).toLocaleString('tr-TR')}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Kalan Borç</p>
                  <p className="text-lg font-bold text-orange-600">₺{(student.balance || (student.total_amount || 0) - (student.paid_amount || 0)).toLocaleString('tr-TR')}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Taksit Sayısı</p>
                  <p className="text-lg font-bold text-blue-600">{installments.length}</p>
                </div>
              </div>
            </div>
            
            {/* Taksit Listesi Özeti */}
            {installments.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">📋</span>
                  Taksit Planı
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Taksit</th>
                        <th className="px-3 py-2 text-left">Vade Tarihi</th>
                        <th className="px-3 py-2 text-right">Tutar</th>
                        <th className="px-3 py-2 text-right">Ödenen</th>
                        <th className="px-3 py-2 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((inst, idx) => (
                        <tr key={inst.id} className="border-b border-gray-100">
                          <td className="px-3 py-2">{inst.installment_no === 0 ? 'Peşinat' : `${inst.installment_no}. Taksit`}</td>
                          <td className="px-3 py-2">{new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                          <td className="px-3 py-2 text-right font-medium">₺{inst.amount.toLocaleString('tr-TR')}</td>
                          <td className="px-3 py-2 text-right text-green-600">₺{(inst.paid_amount || 0).toLocaleString('tr-TR')}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              inst.status === 'paid' ? 'bg-green-100 text-green-700' :
                              inst.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {inst.status === 'paid' ? 'Ödendi' : inst.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ESKİ ÖDEMELER (ARŞİV) - Önceki taksitlerden alınan ödemeler */}
      {archivedInstallments.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowArchivedPayments(!showArchivedPayments)}
            className="w-full p-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between hover:bg-orange-100 transition"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Eski Ödemeler (Arşiv)
              </h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {archivedInstallments.length} kayıt
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-bold">
                Toplam: ₺{archivedInstallments.reduce((sum, i) => sum + (i.paid_amount || i.amount), 0).toLocaleString('tr-TR')}
              </span>
              <span className={`transform transition-transform ${showArchivedPayments ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </button>
          
          {showArchivedPayments && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-orange-50 text-gray-600 font-medium border-b border-orange-200">
                  <tr>
                    <th className="p-3 text-left">Taksit</th>
                    <th className="p-3 text-left">Ödeme Tarihi</th>
                    <th className="p-3 text-right">Tutar</th>
                    <th className="p-3 text-center">Durum</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedInstallments.map((inst) => (
                    <tr key={inst.id} className="border-b border-gray-100 bg-orange-50/30">
                      <td className="p-3 font-medium text-gray-700">
                        {inst.installment_no === 0 ? 'Peşinat' : `${inst.installment_no}. Taksit`}
                        <span className="ml-2 text-xs text-orange-500">(Eski Plan)</span>
                      </td>
                      <td className="p-3 text-gray-600">
                        {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">
                        ₺{(inst.paid_amount || inst.amount).toLocaleString('tr-TR')}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Tahsil Edildi
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteInstallment(inst.id, true)}
                          disabled={deletingInstallmentId === inst.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition disabled:opacity-50"
                          title="Arşivden Sil"
                        >
                          {deletingInstallmentId === inst.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-orange-50 border-t border-orange-200 text-xs text-orange-700">
                ⚠️ Bu ödemeler önceki taksit planından tahsil edilmiştir. Kayıt güncellendiğinde otomatik arşivlendi.
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAKSİT LİSTESİ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Ödeme Planı ve Hareketler
          </h3>
            {installments.length > 0 && (
              <button
                onClick={downloadEducationSummaryPDF}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition"
              >
                <Download className="h-4 w-4" />
                PDF İndir
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : installments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Henüz taksit planı oluşturulmamış.</p>
            
            {/* Debug bilgileri - Sorunu anlamak için */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left text-sm">
              <p className="font-semibold text-yellow-800 mb-2">📊 Öğrenci Finans Durumu:</p>
              <ul className="text-yellow-700 space-y-1">
                <li>• Toplam Tutar (students.total_amount): <strong>₺{(student.total_amount || 0).toLocaleString('tr-TR')}</strong></li>
                <li>• Ödenen (students.paid_amount): <strong>₺{(student.paid_amount || 0).toLocaleString('tr-TR')}</strong></li>
                <li>• Kalan Borç (students.balance): <strong>₺{(student.balance || 0).toLocaleString('tr-TR')}</strong></li>
                <li>• Öğrenci ID: <code className="bg-yellow-100 px-1 rounded">{student.id}</code></li>
              </ul>
              
              {(student.total_amount || 0) > 0 ? (
                <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                  <p className="text-green-800">
                    ✅ <strong>Çözüm:</strong> Toplam tutar mevcut. "Yeniden Taksitlendir" butonunu kullanarak taksit planı oluşturabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                  <p className="text-red-800">
                    ❌ <strong>Sorun:</strong> Öğrencinin toplam tutarı 0. Önce "Bilgileri Güncelle" ile ödeme bilgilerini girin.
                  </p>
                </div>
              )}
            </div>
            
            {/* Çözüm Butonları */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
              {(student.total_amount || 0) > 0 && (
                <button
                  onClick={() => setShowRestructureModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  <RefreshCw className="h-5 w-5" />
                  Taksit Planı Oluştur
                </button>
              )}
              <button
                onClick={() => window.location.href = `/enrollment/new?edit=${student.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300"
              >
                <Pencil className="h-5 w-5" />
                Bilgileri Güncelle
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="p-4 text-left">Taksit</th>
                  <th className="p-4 text-left">Vade Tarihi</th>
                  <th className="p-4 text-right">Tutar</th>
                  <th className="p-4 text-right">Ödenen</th>
                  <th className="p-4 text-right">Kalan</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((installment, index) => {
                  const remaining = installment.amount - installment.paid_amount;
                  const statusBadge = getStatusBadge(installment.status);
                  const isOverdue = installment.status === 'overdue';

                  return (
                    <tr
                      key={installment.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                        isOverdue ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{index + 1}. Taksit</span>
                      </td>
                      <td className={`p-4 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                        {isOverdue && <span className="ml-2 text-xs">(Gecikmede)</span>}
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        ₺{installment.amount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-right text-green-600 font-medium">
                        ₺{installment.paid_amount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        ₺{remaining.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {installment.status === 'paid' ? (
                            <button
                              onClick={() => downloadReceipt(installment)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition"
                            >
                              <Download className="h-3 w-3" />
                              Makbuz
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePayment(installment)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium transition"
                            >
                              <CreditCard className="h-3 w-3" />
                              Tahsil Et
                            </button>
                          )}
                          {/* SİL BUTONU */}
                          <button
                            onClick={() => handleDeleteInstallment(installment.id, installment.status === 'paid')}
                            disabled={deletingInstallmentId === installment.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition disabled:opacity-50"
                            title="Taksiti Sil"
                          >
                            {deletingInstallmentId === installment.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DİĞER GELİRLER - Kitap, Üniforma, Yemek vb. */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Diğer Gelirler
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-emerald-600 font-medium">
                Ödenen: ₺{otherIncomes.reduce((sum, i) => sum + i.paidAmount, 0).toLocaleString('tr-TR')}
              </span>
              <span className="text-orange-600 font-medium">
                Bekleyen: ₺{otherIncomes.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0).toLocaleString('tr-TR')}
              </span>
              {otherIncomes.length > 0 && (
                <button
                  onClick={downloadOtherIncomeSummaryPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium transition"
                >
                  <Download className="h-4 w-4" />
                  PDF İndir
                </button>
              )}
            </div>
          </div>
        </div>

        {loadingOtherIncomes ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600"></div>
          </div>
        ) : otherIncomes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Bu öğrenci için diğer gelir kaydı bulunmuyor.</p>
            <p className="text-sm mt-1">Kitap, üniforma, yemek gibi gelirleri buradan takip edebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="p-4 text-left">Başlık</th>
                  <th className="p-4 text-center">Kategori</th>
                  <th className="p-4 text-right">Tutar</th>
                  <th className="p-4 text-right">Ödenen</th>
                  <th className="p-4 text-right">Kalan</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {otherIncomes.map((income) => {
                  const categoryInfo = CATEGORY_INFO[income.category] || CATEGORY_INFO.other;
                  const CategoryIcon = categoryInfo.icon;
                  const remaining = income.amount - income.paidAmount;

                  return (
                    <tr
                      key={income.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition ${!income.isPaid ? 'bg-orange-50/30' : ''}`}
                    >
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{income.title}</span>
                        {income.notes && (
                          <p className="text-xs text-gray-500 mt-0.5">{income.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {income.dueDate ? new Date(income.dueDate).toLocaleDateString('tr-TR') : new Date(income.date).toLocaleDateString('tr-TR')}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${categoryInfo.color}`}>
                          <CategoryIcon className="h-3 w-3" />
                          {categoryInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        ₺{income.amount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-right font-medium text-emerald-600">
                        ₺{income.paidAmount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-right font-medium text-orange-600">
                        ₺{remaining.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-center">
                        {income.isPaid ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Ödendi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            Beklemede
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {!income.isPaid ? (
                          <button
                            onClick={() => handleOpenOtherPayment(income)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition"
                          >
                            <CreditCard className="h-3 w-3" />
                            Tahsil Et
                          </button>
                        ) : (
                          <button
                            onClick={() => downloadOtherIncomeReceipt(income)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-medium transition"
                          >
                            <Download className="h-3 w-3" />
                            Makbuz
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SÖZLEŞME ÖNİZLEMESİ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Kayıt ve Satışlar Sözleşmesi
          </h3>
          <button 
            onClick={downloadContract}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition"
          >
            <Download className="h-4 w-4" />
            PDF İndir
          </button>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Dijital sözleşme önizlemesi yakında...</p>
        </div>
      </div>
    </div>

    {/* YENİDEN TAKSİTLENDİRME MODAL */}
    <RestructurePlanModal
      isOpen={showRestructureModal}
      onClose={() => setShowRestructureModal(false)}
      studentId={student.id}
      currentSummary={{
        total: totalAmount,
        paid: paidAmount,
        unpaid: balance,
        balance: balance,
        installments: installments.map(i => ({
          id: i.id,
          student_id: student.id,
          installment_no: i.installment_no,
          amount: i.amount,
          due_date: i.due_date,
          is_paid: i.status === 'paid',
          paid_amount: i.paid_amount,
          paid_at: null,
          created_at: new Date().toISOString(),
        })),
      }}
      onSuccess={() => {
        fetchInstallments();
        onRefresh?.();
      }}
    />

    {/* ÖDEME MODAL - MODERN TASARIM */}
    {showPaymentModal && selectedInstallment && (() => {
      const remainingAmount = selectedInstallment.amount - selectedInstallment.paid_amount;
      const inputAmount = Number(paymentAmount) || 0;
      const isPartialPayment = inputAmount < remainingAmount && inputAmount > 0;
      const progressPercent = selectedInstallment.amount > 0 
        ? Math.round((selectedInstallment.paid_amount / selectedInstallment.amount) * 100) 
        : 0;
      
      // Gecikme hesaplama
      let delayDays = 0;
      const dueDate = new Date(selectedInstallment.due_date);
      const today = new Date();
      if (today > dueDate) {
        delayDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-emerald-900/50 backdrop-blur-md p-4">
          <div className="w-full max-w-lg animate-in fade-in zoom-in duration-300 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header - Gradyan */}
            <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white overflow-hidden shrink-0">
              {/* Dekoratif arka plan */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
            <button
              onClick={() => setShowPaymentModal(false)}
                className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
            >
                <X size={18} />
            </button>
              
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Wallet size={28} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">Ödeme Tahsilatı</h2>
                    <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                  </div>
                  <p className="text-emerald-100 text-sm font-medium">{student.first_name} {student.last_name}</p>
                </div>
          </div>

              {/* Taksit Bilgi Kartı */}
              <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Taksit</p>
                    <p className="text-2xl font-bold">#{selectedInstallment.installment_no}</p>
                  </div>
                  <div className="h-12 w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Vade</p>
                    <p className={`text-lg font-bold ${delayDays > 0 ? 'text-red-300' : ''}`}>
                      {new Date(selectedInstallment.due_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-white/20" />
                  <div className="text-right">
                    <p className="text-xs text-emerald-100 uppercase tracking-wider font-medium">Kalan</p>
                    <p className="text-lg font-bold">₺{remainingAmount.toLocaleString('tr-TR')}</p>
                  </div>
            </div>

                {/* Progress Bar */}
                {progressPercent > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-emerald-100 mb-1">
                      <span>Ödeme İlerlemesi</span>
                      <span className="font-bold">%{progressPercent}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* İçerik */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Gecikme Uyarısı */}
              {delayDays > 0 && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-2xl border border-red-100">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-red-600" />
                  </div>
                  <div>
                    <span className="font-bold text-red-800">{delayDays} gün gecikme!</span>
                    <p className="text-xs text-red-600 mt-0.5">Vade tarihi geçmiş bir taksit.</p>
                  </div>
                </div>
              )}

              {/* Ana Tutar Alanı */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl p-5 border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                Tahsil Edilecek Tutar
              </label>
              <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-emerald-600">₺</span>
                <input
                  type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 text-3xl font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    placeholder="0"
                />
              </div>
                {isPartialPayment && (
                  <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 rounded-xl p-2">
                    <span className="text-sm font-medium">Kısmi ödeme • Kalan: ₺{(remainingAmount - inputAmount).toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>

              {/* Tarih ve Yöntem */}
              <div className="grid grid-cols-2 gap-4">
                {/* Ödeme Tarihi */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
                    Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => handlePaymentDateChange(e.target.value)}
                    className={`w-full px-4 py-3 text-sm font-medium border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isBackdatedPayment 
                        ? 'border-orange-400 bg-orange-50 text-orange-800' 
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  />
                  {isBackdatedPayment && (
                    <p className="mt-1.5 text-xs text-orange-600 flex items-center gap-1">
                      <Clock size={12} />
                      Geçmiş tarihli
                    </p>
                  )}
            </div>

                {/* Ödeme Yöntemi */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ödeme Yöntemi</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                        paymentMethod === 'cash' 
                        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-100' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote size={20} />
                      <span className="text-[10px] font-semibold">Nakit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                        paymentMethod === 'card' 
                        ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-500 text-indigo-700 shadow-md shadow-indigo-100' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-[10px] font-semibold">Kart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                        paymentMethod === 'bank' 
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 text-blue-700 shadow-md shadow-blue-100' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Building size={20} />
                      <span className="text-[10px] font-semibold">EFT</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Not Alanı */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama (opsiyonel)</label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all"
                  placeholder="Ödeme ile ilgili not ekleyin..."
                />
              </div>

              {/* Modern Toggle Switches */}
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div 
                    onClick={() => setPrintReceipt(!printReceipt)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${
                      printReceipt 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                        : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                      printReceipt ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Printer size={14} /> Makbuz
                  </span>
              </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div 
                    onClick={() => setSendWhatsApp(!sendWhatsApp)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${
                      sendWhatsApp 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                      sendWhatsApp ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <MessageCircle size={14} /> WhatsApp
                  </span>
                </label>
            </div>
          </div>

            {/* Footer */}
            <div className="p-5 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-t border-slate-100 flex gap-3 shrink-0">
            <button
              onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-5 py-3.5 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              İptal
            </button>
            <button
              onClick={() => {
                  const amount = parseFloat(paymentAmount) || remainingAmount;
                  processPayment(amount, paymentMethod);
                }}
                disabled={paymentSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
                className="flex-[2] px-5 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
              >
                {paymentSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                    Ödemeyi Onayla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* DİĞER GELİRLER TAHSİLAT MODAL */}
    {showOtherPaymentModal && selectedOtherIncome && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Diğer Gelir Tahsilatı</h3>
                  <p className="text-purple-200 text-sm">{selectedOtherIncome.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOtherPaymentModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Bilgi Kartı */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Kategori</span>
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${CATEGORY_INFO[selectedOtherIncome.category]?.color || 'bg-gray-500'}`}>
                  {CATEGORY_INFO[selectedOtherIncome.category]?.label || 'Diğer'}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Toplam Tutar</span>
                <span className="font-bold text-gray-900">₺{selectedOtherIncome.amount.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Ödenen</span>
                <span className="font-bold text-emerald-600">₺{selectedOtherIncome.paidAmount.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Kalan Borç</span>
                <span className="font-bold text-lg text-orange-600">₺{(selectedOtherIncome.amount - selectedOtherIncome.paidAmount).toLocaleString('tr-TR')}</span>
              </div>
            </div>

            {/* Tutar Girişi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tahsil Edilecek Tutar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otherPaymentAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                    setOtherPaymentAmount(val);
                  }}
                  className="w-full pl-10 pr-4 py-3 text-xl font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ödeme Yöntemi</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: '💵 Nakit' },
                  { value: 'card', label: '💳 Kart' },
                  { value: 'bank', label: '🏦 Banka' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setOtherPaymentMethod(method.value as 'cash' | 'card' | 'bank')}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      otherPaymentMethod === method.value
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowOtherPaymentModal(false)}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Vazgeç
            </button>
            <button
              onClick={handleCollectOtherPayment}
              disabled={otherPaymentLoading || !otherPaymentAmount || Number(otherPaymentAmount) <= 0}
              className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              {otherPaymentLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
              <CreditCard className="h-4 w-4" />
                  Tahsil Et
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

