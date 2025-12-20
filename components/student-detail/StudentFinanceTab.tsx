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
  CalendarCheck,
  CheckCircle2,
  Printer,
  MessageCircle,
  Edit3,
  FileEdit,
  Percent,
  BarChart3,
  Check
} from 'lucide-react';
import RestructurePlanModal from '@/components/finance/RestructurePlanModal';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { downloadPDFFromHTML } from '@/lib/utils/pdfGenerator';
import { exportInstallmentPlanToExcel } from '@/lib/services/exportService';
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
  paymentMethod?: string;
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
  
  // TEK SAYFA A4 - KOMPAKT TASARIM
  return `
    <div style="width: 794px; max-height: 1100px; margin: 0 auto; padding: 30px 40px; font-family: Arial, sans-serif; background: white; box-sizing: border-box;">
      
      <!-- HEADER -->
      <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border: 2px solid #1a1a1a; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px; font-weight: 900; color: #1a1a1a;">A</span>
          </div>
          <div>
            <h1 style="font-size: 18px; color: #1a1a1a; font-weight: 700; margin: 0;">${params.organizationName}</h1>
            <p style="font-size: 10px; color: #666; margin: 2px 0 0 0;">Eğitim Yönetim Sistemi</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 10px; color: #666; margin: 0;">Belge No: <strong>${params.receiptNo}</strong></p>
          <p style="font-size: 10px; color: #666; margin: 3px 0 0 0;">${params.currentDateTime}</p>
        </div>
      </div>
      
      <!-- BAŞLIK -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0; padding: 10px 0; border: 2px solid #1a1a1a; background: #f8f8f8;">
          ${receiptTitle}
        </h2>
      </div>
      
      <!-- ÖĞRENCİ VE VELİ BİLGİLERİ - KOMPAKT -->
      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1; border: 1px solid #ccc; padding: 12px;">
          <h3 style="font-size: 11px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px;">Öğrenci Bilgileri</h3>
          <p style="font-size: 10px; color: #666; margin: 0;">Ad Soyad: <strong style="color: #1a1a1a; font-size: 12px;">${params.studentName}</strong></p>
          <p style="font-size: 10px; color: #666; margin: 4px 0 0 0;">Öğrenci No: <strong style="color: #1a1a1a;">${params.studentNo}</strong></p>
        </div>
        <div style="flex: 1; border: 1px solid #ccc; padding: 12px;">
          <h3 style="font-size: 11px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px;">Ödeme Yapan</h3>
          <p style="font-size: 10px; color: #666; margin: 0;">Veli: <strong style="color: #1a1a1a; font-size: 12px;">${params.parentName}</strong></p>
          <p style="font-size: 10px; color: #666; margin: 4px 0 0 0;">Tarih: <strong style="color: #1a1a1a;">${params.formattedDate}</strong></p>
        </div>
      </div>
      
      <!-- ÖDEME DETAYLARI - KOMPAKT TABLO -->
      <div style="border: 1px solid #1a1a1a; margin-bottom: 15px;">
        <div style="background: #1a1a1a; color: white; padding: 8px 12px;">
          <h3 style="font-size: 12px; font-weight: 700; margin: 0;">ÖDEME DETAYLARI</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 12px; color: #666; width: 30%;">Kategori</td>
              <td style="padding: 8px 12px; font-weight: 600; color: #1a1a1a;">${params.category}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 12px; color: #666;">Açıklama</td>
              <td style="padding: 8px 12px; font-weight: 600; color: #1a1a1a;">${params.description}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; color: #666;">Ödeme Yöntemi</td>
              <td style="padding: 8px 12px; font-weight: 500; color: #1a1a1a;">${params.paymentMethod}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- TAHSİL EDİLEN TUTAR -->
      <div style="border: 2px solid #1a1a1a; padding: 20px; text-align: center; margin-bottom: 20px; background: #f8f8f8;">
        <p style="font-size: 12px; color: #666; margin: 0;">Tahsil Edilen Tutar</p>
        <p style="font-size: 32px; font-weight: 700; color: #1a1a1a; margin: 8px 0 0 0;">₺${params.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      
      <!-- İMZA ALANLARI - TEK SATIR -->
      <div style="display: flex; gap: 30px; margin-bottom: 20px;">
        <div style="flex: 1; text-align: center; border: 1px solid #ccc; padding: 12px;">
          <p style="font-size: 10px; color: #666; margin: 0;">Teslim Alan</p>
          <p style="font-size: 12px; font-weight: 600; color: #1a1a1a; margin: 3px 0 20px 0;">Muhasebe Birimi</p>
          <div style="border-top: 1px solid #1a1a1a; padding-top: 5px;">
            <p style="font-size: 9px; color: #666; margin: 0;">İmza / Kaşe</p>
          </div>
        </div>
        <div style="flex: 1; text-align: center; border: 1px solid #ccc; padding: 12px;">
          <p style="font-size: 10px; color: #666; margin: 0;">Teslim Eden</p>
          <p style="font-size: 12px; font-weight: 600; color: #1a1a1a; margin: 3px 0 20px 0;">${params.parentName}</p>
          <div style="border-top: 1px solid #1a1a1a; padding-top: 5px;">
            <p style="font-size: 9px; color: #666; margin: 0;">İmza</p>
          </div>
        </div>
      </div>
      
      <!-- FOOTER -->
      <div style="border-top: 1px solid #ccc; padding-top: 12px; text-align: center;">
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'manual'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [isBackdatedPayment, setIsBackdatedPayment] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  
  // Düzenle Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInstallment, setEditInstallment] = useState<Installment | null>(null);
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editInstallmentAmount, setEditInstallmentAmount] = useState(''); // Taksit tutarı düzenleme
  const [editDueDate, setEditDueDate] = useState(''); // Vade tarihi düzenleme
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'manual'>('cash');
  const [editSubmitting, setEditSubmitting] = useState(false);
  
  // Diğer Gelirler State
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [loadingOtherIncomes, setLoadingOtherIncomes] = useState(false);
  
  // Diğer Gelirler Tahsilat State
  const [showOtherPaymentModal, setShowOtherPaymentModal] = useState(false);
  const [selectedOtherIncome, setSelectedOtherIncome] = useState<OtherIncome | null>(null);
  const [otherPaymentAmount, setOtherPaymentAmount] = useState('');
  const [otherPaymentMethod, setOtherPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'manual'>('cash');
  const [otherPaymentLoading, setOtherPaymentLoading] = useState(false);
  
  // Eski Kayıt Formu Accordion
  const [showOldEnrollmentInfo, setShowOldEnrollmentInfo] = useState(false);
  
  // Arşivlenmiş (eski ödenmiş) taksitler
  const [archivedInstallments, setArchivedInstallments] = useState<Installment[]>([]);
  const [showArchivedPayments, setShowArchivedPayments] = useState(false);
  
  // Taksit silme
  const [deletingInstallmentId, setDeletingInstallmentId] = useState<string | null>(null);
  
  // Toplu Tahsilat State
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<Set<string>>(new Set());
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'manual'>('cash');
  const [bulkPaymentLoading, setBulkPaymentLoading] = useState(false);
  
  // Diğer Gelir Ekleme State
  const [showAddOtherIncomeModal, setShowAddOtherIncomeModal] = useState(false);
  const [newOtherIncome, setNewOtherIncome] = useState({
    title: '',
    category: 'book' as 'book' | 'uniform' | 'meal' | 'stationery' | 'other',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
    installmentCount: 1
  });
  const [addingOtherIncome, setAddingOtherIncome] = useState(false);
  
  // Diğer Gelir Düzenleme State
  const [showEditOtherIncomeModal, setShowEditOtherIncomeModal] = useState(false);
  const [editingOtherIncome, setEditingOtherIncome] = useState<OtherIncome | null>(null);
  const [editOtherIncomeData, setEditOtherIncomeData] = useState({
    title: '',
    amount: '',
    dueDate: '',
    paidAmount: '',
    paidAt: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank' | 'eft' | 'manual',
    notes: ''
  });
  const [savingOtherIncome, setSavingOtherIncome] = useState(false);
  const [deletingOtherIncomeId, setDeletingOtherIncomeId] = useState<string | null>(null);
  
  // Taksit Ekleme State
  const [showAddInstallmentModal, setShowAddInstallmentModal] = useState(false);
  const [newInstallment, setNewInstallment] = useState({
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [addingInstallment, setAddingInstallment] = useState(false);
  
  // Taksit Düzenle Modal Aç
  const handleEditInstallment = (installment: Installment) => {
    setEditInstallment(installment);
    setEditPaidAmount(String(installment.paid_amount || 0));
    setEditPaymentDate(installment.paid_at ? installment.paid_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditInstallmentAmount(String(installment.amount || 0));
    setEditDueDate(installment.due_date ? installment.due_date.split('T')[0] : '');
    setEditPaymentMethod((installment.payment_method as 'cash' | 'card' | 'bank') || 'cash');
    setShowEditModal(true);
  };

  // Taksit Düzenle Kaydet
  const saveEditInstallment = async () => {
    if (!editInstallment) return;
    
    const newPaidAmount = parseFloat(editPaidAmount) || 0;
    const newInstallmentAmount = parseFloat(editInstallmentAmount) || editInstallment.amount;
    const toastId = toast.loading('Güncelleniyor...');
    setEditSubmitting(true);
    
    try {
      const isPaid = newPaidAmount >= newInstallmentAmount;
      
      const response = await fetch('/api/installments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editInstallment.id,
          amount: newInstallmentAmount, // Yeni: Taksit tutarı
          due_date: editDueDate, // Yeni: Vade tarihi
          paid_amount: newPaidAmount,
          is_paid: isPaid,
          paid_at: editPaymentDate,
          payment_method: editPaymentMethod,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Güncelleme başarısız');
      }
      
      toast.success('✅ Taksit güncellendi!', { id: toastId });
      setShowEditModal(false);
      setEditInstallment(null);
      
      // Listeyi yenile
      setTimeout(() => fetchInstallments(), 300);
      onRefresh?.();
    } catch (error: any) {
      toast.error(`❌ Hata: ${error.message}`, { id: toastId });
    } finally {
      setEditSubmitting(false);
    }
  };

  // WhatsApp ile Ödeme Bildirimi Gönder
  const sendPaymentWhatsApp = (installment: Installment) => {
    if (!student.parent_phone) {
      toast.error('Veli telefon numarası bulunamadı!');
      return;
    }
    
    const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const installmentLabel = installment.installment_no === 0 ? 'Peşinat' : `${installment.installment_no}. Taksit`;
    const paymentDate = installment.paid_at 
      ? new Date(installment.paid_at).toLocaleDateString('tr-TR')
      : new Date().toLocaleDateString('tr-TR');
    
    let formattedPhone = student.parent_phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '90' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('90') && formattedPhone.length === 10) {
      formattedPhone = '90' + formattedPhone;
    }
    
    const isPaid = installment.status === 'paid';
    const paidAmount = installment.paid_amount || 0;
    const remaining = installment.amount - paidAmount;
    
    const message = isPaid 
      ? `💰 *ÖDEME BİLGİLENDİRME*

🏫 *${organizationName}*

👤 Öğrenci: ${studentName}
📋 ${installmentLabel}
💵 Ödenen: ${paidAmount.toLocaleString('tr-TR')} TL
📅 Ödeme Tarihi: ${paymentDate}
✅ Taksit tamamen ödendi!

Teşekkür ederiz. 🙏`
      : `💰 *ÖDEME BİLGİLENDİRME*

🏫 *${organizationName}*

👤 Öğrenci: ${studentName}
📋 ${installmentLabel}
💵 Ödenen: ${paidAmount.toLocaleString('tr-TR')} TL
⏳ Kalan: ${remaining.toLocaleString('tr-TR')} TL
📅 Tarih: ${paymentDate}

Teşekkür ederiz. 🙏`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

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

  // Toplu Tahsilat Toggle
  const toggleInstallmentSelection = (id: string) => {
    const newSet = new Set(selectedInstallmentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedInstallmentIds(newSet);
  };

  // Toplu Tahsilat - Tümünü Seç/Kaldır
  const toggleSelectAll = () => {
    const unpaidInstallments = installments.filter(i => i.status !== 'paid');
    if (selectedInstallmentIds.size === unpaidInstallments.length) {
      setSelectedInstallmentIds(new Set());
    } else {
      setSelectedInstallmentIds(new Set(unpaidInstallments.map(i => i.id)));
    }
  };

  // Seçili Taksitlerin Toplam Borcu
  const selectedTotalAmount = installments
    .filter(i => selectedInstallmentIds.has(i.id))
    .reduce((sum, i) => sum + (i.amount - i.paid_amount), 0);

  // Toplu Tahsilat İşlemi
  const handleBulkPayment = async () => {
    if (selectedInstallmentIds.size === 0) return;
    
    const toastId = toast.loading(`${selectedInstallmentIds.size} taksit tahsil ediliyor...`);
    setBulkPaymentLoading(true);
    
    try {
      const selectedItems = installments.filter(i => selectedInstallmentIds.has(i.id));
      
      for (const installment of selectedItems) {
        const fullAmount = installment.amount;
        await fetch('/api/installments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: installment.id,
            paid_amount: fullAmount,
            is_paid: true,
            paid_at: new Date().toISOString().split('T')[0],
            payment_method: bulkPaymentMethod,
          }),
        });
      }
      
      toast.success(`✅ ${selectedInstallmentIds.size} taksit tahsil edildi!`, { id: toastId });
      setShowBulkPaymentModal(false);
      setSelectedInstallmentIds(new Set());
      fetchInstallments();
      onRefresh?.();
    } catch (error: any) {
      toast.error(`❌ Hata: ${error.message}`, { id: toastId });
    } finally {
      setBulkPaymentLoading(false);
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
        
        // Aktif taksitler: active, paid, partial, pending durumları
        // Sadece 'archived_paid' ve 'deleted' olanları hariç tut
        const activeInstallments = allInstallments.filter((i: any) => {
          const dbStatus = i.db_status || 'active';
          // Arşivlenmiş veya silinmiş değilse göster
          return dbStatus !== 'archived_paid' && dbStatus !== 'deleted';
        });
        
        // Arşivlenmiş ödenmiş taksitler (db_status = 'archived_paid')
        const archived = allInstallments.filter((i: any) => 
          i.db_status === 'archived_paid'
        );
        
        console.log('[StudentFinanceTab] Filtreleme:', {
          toplam: allInstallments.length,
          aktif: activeInstallments.length,
          arsivlenmis: archived.length,
          durumlar: allInstallments.map((i: any) => ({ no: i.installment_no, db_status: i.db_status, paid_amount: i.paid_amount }))
        });
        
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
          paymentMethod: item.payment_method,
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

  // Diğer Gelir Ekleme Fonksiyonu
  const handleAddOtherIncome = async () => {
    const amount = parseFloat(newOtherIncome.amount);
    if (!newOtherIncome.title.trim() || isNaN(amount) || amount <= 0) {
      toast.error('Başlık ve geçerli tutar girin');
      return;
    }
    
    setAddingOtherIncome(true);
    const toastId = toast.loading('Ekleniyor...');
    
    try {
      // Taksit sayısına göre kayıt oluştur
      const installmentCount = newOtherIncome.installmentCount || 1;
      const installmentAmount = amount / installmentCount;
      
      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date(newOtherIncome.dueDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        const title = installmentCount > 1 
          ? `${newOtherIncome.title} (${i + 1}/${installmentCount})`
          : newOtherIncome.title;
        
        await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: student.id,
            organization_id: student.organization_id,
            title,
            category: newOtherIncome.category,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split('T')[0],
            notes: newOtherIncome.notes,
            is_paid: false,
            paid_amount: 0
          })
        });
      }
      
      toast.success(`✅ ${installmentCount > 1 ? `${installmentCount} taksit olarak` : ''} eklendi!`, { id: toastId });
      setShowAddOtherIncomeModal(false);
      setNewOtherIncome({
        title: '',
        category: 'book',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        notes: '',
        installmentCount: 1
      });
      fetchOtherIncomes();
      onRefresh?.();
    } catch (error: any) {
      toast.error(`❌ Hata: ${error.message}`, { id: toastId });
    } finally {
      setAddingOtherIncome(false);
    }
  };

  // Diğer Gelir Düzenleme Fonksiyonu
  const handleEditOtherIncome = (income: OtherIncome) => {
    setEditingOtherIncome(income);
    setEditOtherIncomeData({
      title: income.title,
      amount: String(income.amount),
      dueDate: income.dueDate || income.date || new Date().toISOString().split('T')[0],
      paidAmount: String(income.paidAmount || 0),
      paidAt: income.paidAt ? income.paidAt.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: (income.paymentMethod as 'cash' | 'card' | 'bank' | 'eft' | 'manual') || 'cash',
      notes: income.notes || ''
    });
    setShowEditOtherIncomeModal(true);
  };

  // Diğer Gelir Güncelleme
  const handleSaveOtherIncome = async () => {
    if (!editingOtherIncome) return;
    
    setSavingOtherIncome(true);
    const toastId = toast.loading('Kaydediliyor...');
    
    try {
      const paidAmount = parseFloat(editOtherIncomeData.paidAmount) || 0;
      const amount = parseFloat(editOtherIncomeData.amount) || 0;
      const isPaid = paidAmount >= amount;
      
      await fetch('/api/finance/other-income', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOtherIncome.id,
          title: editOtherIncomeData.title,
          amount: amount,
          due_date: editOtherIncomeData.dueDate,
          paid_amount: paidAmount,
          paid_at: paidAmount > 0 ? editOtherIncomeData.paidAt : null,
          payment_method: editOtherIncomeData.paymentMethod,
          is_paid: isPaid,
          notes: editOtherIncomeData.notes
        })
      });
      
      toast.success('Guncellendi!', { id: toastId });
      setShowEditOtherIncomeModal(false);
      setEditingOtherIncome(null);
      fetchOtherIncomes();
      onRefresh?.();
    } catch (error: any) {
      toast.error('Hata: ' + error.message, { id: toastId });
    } finally {
      setSavingOtherIncome(false);
    }
  };

  // Diğer Gelir Silme
  const handleDeleteOtherIncome = async (incomeId: string, isPaid: boolean) => {
    const confirmMsg = isPaid 
      ? '⚠️ Bu kalem ödenmiş! Silmek finansal kayıtları etkileyecek. Devam?'
      : 'Bu kalemi silmek istediğinize emin misiniz?';
    
    if (!confirm(confirmMsg)) return;
    
    setDeletingOtherIncomeId(incomeId);
    
    try {
      await fetch(`/api/finance/other-income?id=${incomeId}`, {
        method: 'DELETE'
      });
      
      toast.success('Silindi');
      fetchOtherIncomes();
      onRefresh?.();
    } catch (error: any) {
      toast.error('Silinemedi: ' + error.message);
    } finally {
      setDeletingOtherIncomeId(null);
    }
  };

  // Taksit Ekleme Fonksiyonu
  const handleAddInstallment = async () => {
    const amount = parseFloat(newInstallment.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    
    setAddingInstallment(true);
    const toastId = toast.loading('Taksit ekleniyor...');
    
    try {
      // En son taksit numarasını bul
      const maxInstallmentNo = installments.reduce((max, i) => Math.max(max, i.installment_no), 0);
      
      await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          organization_id: student.organization_id,
          installment_no: maxInstallmentNo + 1,
          amount,
          due_date: newInstallment.dueDate,
          note: newInstallment.note,
          paid_amount: 0,
          status: 'pending'
        })
      });
      
      toast.success('✅ Taksit eklendi!', { id: toastId });
      setShowAddInstallmentModal(false);
      setNewInstallment({
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        note: ''
      });
      fetchInstallments();
      onRefresh?.();
    } catch (error: any) {
      toast.error(`❌ Hata: ${error.message}`, { id: toastId });
    } finally {
      setAddingInstallment(false);
    }
  };

  // Excel'e Aktar Fonksiyonu
  const handleExportExcel = () => {
    try {
      if (installments.length === 0) {
        toast.error('Taksit planı bulunamadı');
        return;
      }
      
      const exportData = installments.map(i => ({
        id: i.id,
        installment_no: i.installment_no,
        amount: i.amount,
        paid_amount: i.paid_amount,
        due_date: i.due_date,
        is_paid: i.status === 'paid',
        payment_method: i.payment_method,
        student_id: student.id,
        created_at: new Date().toISOString()
      }));
      
      exportInstallmentPlanToExcel(exportData as any, {
        studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        className: student.class || null,
        parentName: student.parent_name || null,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingAmount: balance
      });
      
      toast.success('Excel dosyası indirildi!');
    } catch (error: any) {
      toast.error('Excel oluşturulamadı: ' + error.message);
    }
  };

  // Taksit Planını WhatsApp ile Gönder
  const handleWhatsAppPlan = () => {
    if (!student.parent_phone) {
      toast.error('Veli telefon numarası bulunamadı!');
      return;
    }
    
    const phone = student.parent_phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('0') ? '90' + phone.slice(1) : 
                           phone.length === 10 ? '90' + phone : phone;
    
    const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    
    let planText = `📋 *TAKSİT PLANI*\n\n`;
    planText += `👤 Öğrenci: ${studentName}\n`;
    planText += `📊 Toplam: ₺${totalAmount.toLocaleString('tr-TR')}\n`;
    planText += `✅ Ödenen: ₺${paidAmount.toLocaleString('tr-TR')}\n`;
    planText += `⏳ Kalan: ₺${balance.toLocaleString('tr-TR')}\n\n`;
    planText += `📅 *TAKSİTLER:*\n`;
    
    installments.slice(0, 10).forEach(inst => {
      const status = inst.status === 'paid' ? '✅' : inst.status === 'overdue' ? '🔴' : '⏳';
      const label = inst.installment_no === 0 ? 'Peşinat' : `${inst.installment_no}. Taksit`;
      const date = new Date(inst.due_date).toLocaleDateString('tr-TR');
      planText += `${status} ${label}: ₺${inst.amount.toLocaleString('tr-TR')} (${date})\n`;
    });
    
    if (installments.length > 10) {
      planText += `\n... ve ${installments.length - 10} taksit daha\n`;
    }
    
    planText += `\n💼 ${organizationName}`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(planText)}`, '_blank');
    toast.success('WhatsApp açılıyor...');
  };

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
          payment_type: otherPaymentMethod,
          payment_method: otherPaymentMethod
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
    setPaymentSubmitting(true);
    
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
          notes: paymentNote || `${selectedInstallment.installment_no}. taksit ödemesi`,
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
      
      // Güncellenmiş taksit bilgisi
      const updatedInstallment: Installment = {
        ...selectedInstallment,
        paid_amount: data.data.new_paid_amount,
        status: data.data.is_fully_paid ? 'paid' : 'pending',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod || 'cash',
      };
      
      // Local state'i anında güncelle (UI hemen değişsin)
      setInstallments(prev => prev.map(inst => 
        inst.id === selectedInstallment.id ? updatedInstallment : inst
      ));
      
      // Modal'ı kapat
      setShowPaymentModal(false);
      
      // Makbuz oluştur (toggle açıksa)
      if (printReceipt) {
        setTimeout(() => {
          downloadReceipt(updatedInstallment);
        }, 500);
      }
      
      // WhatsApp gönder (toggle açıksa)
      if (sendWhatsApp && student.parent_phone) {
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
        const installmentLabel = selectedInstallment.installment_no === 0 ? 'Peşinat' : `${selectedInstallment.installment_no}. Taksit`;
        const today = new Date().toLocaleDateString('tr-TR');
        
        let formattedPhone = student.parent_phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '90' + formattedPhone.slice(1);
        } else if (!formattedPhone.startsWith('90') && formattedPhone.length === 10) {
          formattedPhone = '90' + formattedPhone;
        }
        
        const message = `💰 *ÖDEME ALINDI*

🏫 *${organizationName}*

👤 Öğrenci: ${studentName}
📋 ${installmentLabel}
💵 Tutar: ${amount.toLocaleString('tr-TR')} TL
📅 Tarih: ${today}
${data.data.is_fully_paid ? '✅ Taksit tamamen ödendi!' : `⏳ Kalan: ${data.data.remaining.toLocaleString('tr-TR')} TL`}

Teşekkür ederiz. 🙏`;
        
        const encodedMessage = encodeURIComponent(message);
        
        setTimeout(() => {
          window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
        }, 1000);
      }
      
      setSelectedInstallment(null);
      
      // Veritabanı güncellemesi yansısın diye kısa bekle, sonra listeyi yenile
      setTimeout(async () => {
        await fetchInstallments();
        onRefresh?.();
      }, 500);
    } catch (error: any) {
      toast.error(`❌ Ödeme hatası: ${error.message}`, { id: toastId });
    } finally {
      setPaymentSubmitting(false);
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
          
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Taksit</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Vade</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Tutar</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Ödenen</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Ödeme Tarihi</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Ödeme Biçimi</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Durum</th>
              </tr>
            </thead>
            <tbody>
              ${installments.map(inst => {
                const paymentMethodText = inst.payment_method === 'cash' ? '💵 Nakit' :
                                          inst.payment_method === 'card' ? '💳 Kart' :
                                          inst.payment_method === 'bank' ? '🏦 Havale' :
                                          inst.payment_method === 'eft' ? '🏦 EFT' : '—';
                return `
                <tr style="background: ${inst.status === 'paid' ? '#f0fdf4' : 'white'};">
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 500;">${inst.installment_no > 0 ? inst.installment_no + '. Taksit' : 'Peşinat'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right;">₺${inst.amount.toLocaleString('tr-TR')}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; color: ${inst.paid_amount > 0 ? '#059669' : '#9ca3af'}; font-weight: 600;">₺${(inst.paid_amount || 0).toLocaleString('tr-TR')}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px;">${inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('tr-TR') : '—'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px;">${paymentMethodText}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <span style="padding: 2px 8px; border-radius: 10px; font-size: 10px; background: ${inst.status === 'paid' ? '#d1fae5' : inst.status === 'overdue' ? '#fee2e2' : '#fef3c7'}; color: ${inst.status === 'paid' ? '#065f46' : inst.status === 'overdue' ? '#991b1b' : '#92400e'};">
                      ${inst.status === 'paid' ? '✓ Ödendi' : inst.status === 'overdue' ? '⚠ Gecikmiş' : '⏳ Beklemede'}
                    </span>
                  </td>
                </tr>
              `}).join('')}
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
            <div style="background: #0d9488; color: white; padding: 15px; border-radius: 8px; text-align: center;">
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
          
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #ccfbf1;">
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: left;">Başlık</th>
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: center;">Kategori</th>
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: left;">Vade</th>
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: right;">Tutar</th>
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: right;">Ödenen</th>
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: center;">Ödeme Tarihi</th>
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: center;">Ödeme Biçimi</th>
                <th style="padding: 8px; border: 1px solid #99f6e4; text-align: center;">Durum</th>
              </tr>
            </thead>
            <tbody>
              ${otherIncomes.map(inc => {
                const paymentMethodText = inc.paymentMethod === 'cash' ? '💵 Nakit' :
                                          inc.paymentMethod === 'card' ? '💳 Kart' :
                                          inc.paymentMethod === 'bank' ? '🏦 Havale' :
                                          inc.paymentMethod === 'eft' ? '🏦 EFT' : '—';
                const dueDate = inc.dueDate ? new Date(inc.dueDate).toLocaleDateString('tr-TR') : new Date(inc.date).toLocaleDateString('tr-TR');
                return `
                <tr style="background: ${inc.isPaid ? '#f0fdfa' : 'white'};">
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 500;">${inc.title}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px;">${CATEGORY_INFO[inc.category]?.label || 'Diğer'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 10px;">${dueDate}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right;">₺${inc.amount.toLocaleString('tr-TR')}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; color: ${inc.paidAmount > 0 ? '#0d9488' : '#9ca3af'}; font-weight: 600;">₺${inc.paidAmount.toLocaleString('tr-TR')}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px;">${inc.paidAt ? new Date(inc.paidAt).toLocaleDateString('tr-TR') : '—'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px;">${paymentMethodText}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <span style="padding: 2px 8px; border-radius: 10px; font-size: 10px; background: ${inc.isPaid ? '#ccfbf1' : '#fef3c7'}; color: ${inc.isPaid ? '#0d9488' : '#92400e'};">
                      ${inc.isPaid ? '✓ Ödendi' : '⏳ Beklemede'}
                    </span>
                  </td>
                </tr>
              `}).join('')}
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
      
      // Taksit sayısına göre font boyutu
      const instCount = installments.length;
      const instFontSize = instCount <= 6 ? '12px' : instCount <= 9 ? '11px' : instCount <= 12 ? '10px' : '9px';
      const instPadding = instCount <= 6 ? '8px 10px' : instCount <= 9 ? '6px 8px' : '5px 6px';

      // STANDART 2 SAYFA A4 FORMAT - PrintLayout.tsx ile AYNI
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; width: 794px;">
          
          <!-- ===== SAYFA 1 - KAYIT FORMU ===== -->
          <div style="width: 794px; height: 1123px; padding: 45px 55px; box-sizing: border-box; background: #fff; position: relative;">
            
            <!-- Başlık -->
            <div style="border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <div style="border: 2px solid #000; padding: 8px 16px;">
                  <span style="font-size: 18px; font-weight: 900;">AkademiHub</span>
              </div>
                <div>
                  <h1 style="font-size: 22px; font-weight: 800; margin: 0;">${organizationName.toUpperCase()}</h1>
                  <p style="font-size: 12px; color: #666; margin: 0;">Eğitim Kurumu</p>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="border: 2px solid #000; padding: 8px 20px; background: #f5f5f5;">
                  <h2 style="font-size: 16px; font-weight: 800; margin: 0;">KAYIT FORMU</h2>
                </div>
                <p style="font-size: 12px; margin: 6px 0 0 0;">Tarih: ${today}</p>
              </div>
            </div>
            
            <!-- ÖĞRENCİ BİLGİLERİ -->
            <div style="margin-bottom: 15px;">
              <div style="background: #1a1a1a; color: #fff; padding: 8px 15px; font-size: 13px; font-weight: bold;">ÖĞRENCİ BİLGİLERİ</div>
              <table style="width: 100%; border: 2px solid #000; border-top: none; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 12px; width: 15%; font-weight: 600; border-right: 1px solid #ccc; background: #f9f9f9;">Ad Soyad</td>
                  <td style="padding: 10px 12px; width: 35%; font-weight: bold; font-size: 14px; border-right: 1px solid #ccc;">${student.first_name || ''} ${student.last_name || ''}</td>
                  <td style="padding: 10px 12px; width: 15%; font-weight: 600; border-right: 1px solid #ccc; background: #f9f9f9;">TC Kimlik</td>
                  <td style="padding: 10px 12px; font-family: monospace; font-size: 13px;">${student.tc_no || '_____________'}</td>
                </tr>
              </table>
            </div>

            <!-- VELİ BİLGİLERİ -->
            <div style="margin-bottom: 15px;">
              <div style="background: #1a1a1a; color: #fff; padding: 8px 15px; font-size: 13px; font-weight: bold;">VELİ BİLGİLERİ</div>
              <table style="width: 100%; border: 2px solid #000; border-top: none; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 12px; width: 15%; font-weight: 600; border-right: 1px solid #ccc; background: #f9f9f9;">Veli Adı</td>
                  <td style="padding: 10px 12px; width: 35%; font-weight: bold; font-size: 14px; border-right: 1px solid #ccc;">${student.parent_name || '-'}</td>
                  <td style="padding: 10px 12px; width: 15%; font-weight: 600; border-right: 1px solid #ccc; background: #f9f9f9;">Telefon</td>
                  <td style="padding: 10px 12px; font-weight: bold;">${student.parent_phone || '-'}</td>
                </tr>
              </table>
            </div>
          
            <!-- TAKSİT PLANI -->
            ${installments.length > 0 ? `
            <div style="margin-bottom: 15px;">
              <div style="background: #1a1a1a; color: #fff; padding: 8px 15px; font-size: 13px; font-weight: bold;">TAKSİT PLANI (${installments.length} Taksit)</div>
              <table style="width: 100%; border: 2px solid #000; border-top: none; font-size: ${instFontSize}; border-collapse: collapse;">
              <thead>
                  <tr style="background: #f0f0f0;">
                    <th style="padding: ${instPadding}; text-align: center; width: 8%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 2px solid #000;">#</th>
                    <th style="padding: ${instPadding}; text-align: center; width: 22%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 2px solid #000;">Vade Tarihi</th>
                    <th style="padding: ${instPadding}; text-align: right; width: 20%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 2px solid #000;">Tutar</th>
                    <th style="padding: ${instPadding}; text-align: right; width: 20%; font-weight: bold; border-right: 1px solid #ccc; border-bottom: 2px solid #000;">Ödenen</th>
                    <th style="padding: ${instPadding}; text-align: center; width: 30%; font-weight: bold; border-bottom: 2px solid #000;">İmza</th>
                </tr>
              </thead>
              <tbody>
                  ${installments.map((inst, i) => `
                    <tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: ${instPadding}; text-align: center; font-weight: bold; border-right: 1px solid #ddd;">${inst.installment_no === 0 ? 'P' : inst.installment_no}</td>
                      <td style="padding: ${instPadding}; text-align: center; border-right: 1px solid #ddd;">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                      <td style="padding: ${instPadding}; text-align: right; font-weight: bold; border-right: 1px solid #ddd;">${inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td style="padding: ${instPadding}; text-align: right; border-right: 1px solid #ddd; ${inst.status === 'paid' ? 'color: #059669; font-weight: bold;' : 'color: #999;'}">${inst.status === 'paid' ? (inst.paid_amount || inst.amount).toLocaleString('tr-TR') + ' TL' : '—'}</td>
                      <td style="padding: ${instPadding}; text-align: center;"></td>
                  </tr>
                `).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: #f0f0f0;">
                    <td colspan="2" style="padding: 10px 12px; font-size: 13px; font-weight: bold; border-top: 2px solid #000;">TOPLAM</td>
                    <td style="padding: 10px 12px; text-align: right; font-size: 14px; font-weight: bold; border-top: 2px solid #000;">${totalAmount.toLocaleString('tr-TR')} TL</td>
                    <td style="padding: 10px 12px; text-align: right; font-size: 13px; font-weight: bold; border-top: 2px solid #000; color: #059669;">${paidAmount.toLocaleString('tr-TR')} TL</td>
                    <td style="border-top: 2px solid #000;"></td>
                </tr>
                </tfoot>
              </table>
            </div>
            ` : ''}

            <!-- İMZA ALANI -->
            <div style="display: flex; gap: 25px; margin-top: auto;">
              <div style="flex: 1; border: 2px solid #000; padding: 15px; text-align: center;">
                <p style="font-weight: bold; font-size: 13px; margin: 0 0 35px 0;">VELİ İMZASI</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 8px;"></div>
                <p style="font-size: 12px; font-weight: bold; margin: 0;">${student.parent_name || '________________'}</p>
                <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">Tarih: ${today}</p>
              </div>
              <div style="flex: 1; border: 2px solid #000; padding: 15px; text-align: center;">
                <p style="font-weight: bold; font-size: 13px; margin: 0 0 35px 0;">KURUM YETKİLİSİ</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 8px;"></div>
                <p style="font-size: 12px; margin: 0;">________________</p>
                <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">Tarih: ${today}</p>
            </div>
              </div>

            <p style="position: absolute; bottom: 40px; left: 55px; right: 55px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 8px;">Sayfa 1/2 - Kayıt Formu | ${organizationName}</p>
          </div>

          <!-- ===== SAYFA 2 - SÖZLEŞME ===== -->
          <div style="width: 794px; height: 1123px; padding: 45px 55px; box-sizing: border-box; background: #fff; position: relative; page-break-before: always;">
            
            <!-- Başlık -->
            <div style="border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="font-size: 20px; font-weight: 800; margin: 0;">EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
                <p style="font-size: 13px; margin: 5px 0 0 0;">${student.first_name || ''} ${student.last_name || ''} - ${student.academic_year || '2025-2026'}</p>
              </div>
              <div style="display: flex; align-items: center; gap: 15px;">
                <div style="text-align: right;">
                  <p style="font-weight: 800; font-size: 16px; margin: 0;">${organizationName.toUpperCase()}</p>
                  <p style="font-size: 12px; margin: 3px 0 0 0;">${today}</p>
                </div>
                <div style="border: 2px solid #000; padding: 8px 14px;">
                  <span style="font-size: 15px; font-weight: 900;">AkademiHub</span>
                </div>
            </div>
          </div>
          
            <!-- Sözleşme Metni -->
            <div style="border: 2px solid #000; padding: 20px; font-size: 12px; line-height: 1.8; margin-bottom: 20px; background: #fafafa;">
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
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              <div style="flex: 1; border: 2px solid #000;">
                <div style="background: #1a1a1a; color: #fff; padding: 8px 12px; font-size: 12px; font-weight: bold;">VELİ BİLGİLERİ</div>
                <div style="padding: 12px 15px; font-size: 12px;">
                  <p style="margin: 0 0 6px 0;"><strong>Ad Soyad:</strong> ${student.parent_name || '-'}</p>
                  <p style="margin: 0;"><strong>Telefon:</strong> ${student.parent_phone || '-'}</p>
                </div>
              </div>
              <div style="flex: 1; border: 2px solid #000;">
                <div style="background: #1a1a1a; color: #fff; padding: 8px 12px; font-size: 12px; font-weight: bold;">ÖĞRENCİ BİLGİLERİ</div>
                <div style="padding: 12px 15px; font-size: 12px;">
                  <p style="margin: 0 0 6px 0;"><strong>Ad Soyad:</strong> ${student.first_name || ''} ${student.last_name || ''}</p>
                  <p style="margin: 0;"><strong>Sınıf:</strong> ${student.class || '-'}-${student.section || 'A'}</p>
                </div>
              </div>
            </div>

            <!-- Ödeme Özeti -->
            <div style="border: 2px solid #000; margin-bottom: 20px;">
              <div style="background: #1a1a1a; color: #fff; padding: 8px 12px; font-size: 12px; font-weight: bold;">ÖDEME PLANI ÖZETİ</div>
              <div style="display: flex; padding: 12px 15px; font-size: 12px;">
                <div style="flex: 1;"><strong>Toplam:</strong> ${grandTotal.toLocaleString('tr-TR')} TL</div>
                <div style="flex: 1;"><strong>Ödenen:</strong> ${grandPaid.toLocaleString('tr-TR')} TL</div>
                <div style="flex: 1;"><strong>Kalan:</strong> <span style="font-weight: bold; font-size: 14px;">${(grandTotal - grandPaid).toLocaleString('tr-TR')} TL</span></div>
              </div>
            </div>

            <!-- Onaylar -->
            <div style="border: 2px solid #000; margin-bottom: 20px;">
              <div style="background: #1a1a1a; color: #fff; padding: 8px 12px; font-size: 12px; font-weight: bold;">ONAYLAR</div>
              <div style="display: flex; padding: 12px 15px; font-size: 12px; gap: 20px;">
                <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 16px; height: 16px; border: 2px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">✓</span>
                  <span>KVKK kabul edildi</span>
                </div>
                <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 16px; height: 16px; border: 2px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">✓</span>
                  <span>Okul kuralları kabul edildi</span>
                </div>
                <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 16px; height: 16px; border: 2px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">✓</span>
                  <span>Ödeme planı kabul edildi</span>
                </div>
              </div>
            </div>

            <!-- İMZA ALANI -->
            <div style="display: flex; gap: 25px;">
              <div style="flex: 1; border: 2px solid #000; padding: 15px; text-align: center;">
                <p style="font-weight: bold; font-size: 13px; margin: 0 0 35px 0;">VELİ İMZASI</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 8px;"></div>
                <p style="font-size: 12px; font-weight: bold; margin: 0;">${student.parent_name || '________________'}</p>
                <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">Tarih: ${today}</p>
              </div>
              <div style="flex: 1; border: 2px solid #000; padding: 15px; text-align: center;">
                <p style="font-weight: bold; font-size: 13px; margin: 0 0 35px 0;">KURUM YETKİLİSİ</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 8px;"></div>
                <p style="font-size: 12px; margin: 0;">________________</p>
                <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">Tarih: ${today}</p>
              </div>
            </div>

            <!-- Alt Bilgi -->
            <div style="position: absolute; bottom: 40px; left: 55px; right: 55px; text-align: center; font-size: 10px; border-top: 1px solid #ddd; padding-top: 8px;">
              <p style="font-weight: 600; margin: 0;">Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
              <p style="color: #666; margin: 4px 0 0 0;">Bu sözleşme iki nüsha olarak düzenlenmiştir. | ${organizationName} - ${today}</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-blue-700">Toplam Sözleşme</p>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-900">₺{totalAmount.toLocaleString('tr-TR')}</p>
        </div>

        {/* İNDİRİM/BURS KARTI */}
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-purple-700">İndirim/Burs</p>
            <Percent className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-900">
            ₺{(student.discount_amount || 0).toLocaleString('tr-TR')}
          </p>
          {student.discount_type && (
            <p className="text-[10px] text-purple-600 mt-0.5 truncate">
              {student.discount_type === 'scholarship' ? '🎓 Burs' : 
               student.discount_type === 'sibling' ? '👨‍👩‍👧‍👦 Kardeş' : 
               student.discount_type === 'early' ? '⏰ Erken Kayıt' : 
               '🏷️ İndirim'}
            </p>
          )}
        </div>

        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-green-700">Tahsil Edilen</p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-900">₺{paidAmount.toLocaleString('tr-TR')}</p>
          <p className="text-[10px] text-green-600 mt-0.5">
            %{totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0} ödendi
          </p>
        </div>

        <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-orange-700">Kalan Borç</p>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-xl font-bold text-orange-900">₺{balance.toLocaleString('tr-TR')}</p>
          <p className="text-[10px] text-orange-600 mt-0.5">
            {installments.filter(i => i.status !== 'paid').length} taksit bekliyor
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-2 justify-center">
          <button 
            onClick={handleQuickPayment}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 transition flex items-center justify-center gap-2 text-sm"
          >
            <CreditCard className="h-4 w-4" />
            Hızlı Ödeme Al
          </button>
          <button 
            onClick={() => setShowRestructureModal(true)}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 transition flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
            Yeniden Taksitlendir
          </button>
          {/* WhatsApp Ödeme Hatırlatıcısı */}
          {student.parent_phone && balance > 0 && (
            <a
              href={`https://wa.me/90${student.parent_phone?.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                `Sayın ${student.parent_name || 'Veli'},\n\n` +
                `${student.first_name} ${student.last_name} için ödeme hatırlatmasıdır.\n\n` +
                `📋 Kalan Borç: ₺${balance.toLocaleString('tr-TR')}\n` +
                `📅 Bekleyen Taksit: ${installments.filter(i => i.status !== 'paid').length} adet\n\n` +
                (installments.find(i => i.status === 'overdue') 
                  ? `⚠️ Gecikmiş taksitiniz bulunmaktadır.\n\n` 
                  : '') +
                `Ödeme için bizimle iletişime geçebilirsiniz.\n\nSaygılarımızla`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 transition flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Hatırlatma
            </a>
          )}
        </div>
      </div>

      {/* ÖDEME TRENDİ MİNİ GRAFİĞİ */}
      {installments.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Ödeme Durumu Grafiği
            </h4>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ödendi</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Beklemede</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Gecikmiş</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-20">
            {installments.slice(0, 12).map((inst, idx) => {
              const maxAmount = Math.max(...installments.map(i => i.amount));
              const height = (inst.amount / maxAmount) * 100;
              const paidPercent = inst.paid_amount / inst.amount * 100;
              
              return (
                <div 
                  key={inst.id} 
                  className="flex-1 flex flex-col items-center group relative"
                  title={`${inst.installment_no}. Taksit: ₺${inst.amount.toLocaleString('tr-TR')}`}
                >
                  <div 
                    className={`w-full rounded-t transition-all cursor-pointer hover:opacity-80 ${
                      inst.status === 'paid' ? 'bg-emerald-500' :
                      inst.status === 'overdue' ? 'bg-red-500' :
                      'bg-amber-400'
                    }`}
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  >
                    {/* Kısmi ödeme göstergesi */}
                    {inst.status !== 'paid' && paidPercent > 0 && (
                      <div 
                        className="w-full bg-emerald-500 rounded-t absolute bottom-0 left-0"
                        style={{ height: `${(paidPercent / 100) * height}%` }}
                      ></div>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1">{inst.installment_no}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
                      <p className="font-bold">{inst.installment_no}. Taksit</p>
                      <p>Tutar: ₺{inst.amount.toLocaleString('tr-TR')}</p>
                      <p>Ödenen: ₺{inst.paid_amount.toLocaleString('tr-TR')}</p>
                      <p className={inst.status === 'paid' ? 'text-emerald-400' : inst.status === 'overdue' ? 'text-red-400' : 'text-amber-400'}>
                        {inst.status === 'paid' ? '✓ Ödendi' : inst.status === 'overdue' ? '⚠ Gecikmiş' : '⏳ Beklemede'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Özet İstatistik */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-emerald-600 font-medium">
                ✓ {installments.filter(i => i.status === 'paid').length} Ödendi
              </span>
              <span className="text-amber-600 font-medium">
                ⏳ {installments.filter(i => i.status === 'pending').length} Bekliyor
              </span>
              <span className="text-red-600 font-medium">
                ⚠ {installments.filter(i => i.status === 'overdue').length} Gecikmiş
              </span>
            </div>
            <span className={`font-bold ${
              installments.filter(i => i.status === 'overdue').length > 0 ? 'text-red-600' :
              installments.filter(i => i.status === 'paid').length === installments.length ? 'text-emerald-600' :
              'text-gray-600'
            }`}>
              {installments.filter(i => i.status === 'paid').length === installments.length 
                ? '🎉 Tüm Ödemeler Tamamlandı!' 
                : installments.filter(i => i.status === 'overdue').length > 0
                  ? '⚠️ Gecikmiş Ödeme Var!'
                  : '📊 Ödemeler Düzenli'}
            </span>
          </div>
        </div>
      )}

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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Ödeme Planı ve Hareketler
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toplu Tahsilat Butonu */}
              {selectedInstallmentIds.size > 0 && (
                <button
                  onClick={() => setShowBulkPaymentModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold transition shadow-lg animate-pulse"
                >
                  <Check className="h-4 w-4" />
                  {selectedInstallmentIds.size} Taksit Tahsil Et (₺{selectedTotalAmount.toLocaleString('tr-TR')})
                </button>
              )}
              {/* Taksit Ekle Butonu */}
              <button
                onClick={() => setShowAddInstallmentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 text-sm font-medium transition shadow-md"
              >
                <Plus className="h-4 w-4" />
                Taksit Ekle
              </button>
              {installments.length > 0 && (
                <button
                  onClick={downloadEducationSummaryPDF}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
              )}
              {/* Excel Export */}
              {installments.length > 0 && (
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium transition"
                >
                  <FileText className="h-4 w-4" />
                  Excel
                </button>
              )}
              {/* WhatsApp Plan Gönder */}
              {installments.length > 0 && student.parent_phone && (
                <button
                  onClick={handleWhatsAppPlan}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm font-medium transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  Plan Gönder
                </button>
              )}
            </div>
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
              <thead className="bg-gray-50 text-gray-600 font-medium border-b-2 border-gray-200">
                <tr>
                  {/* Toplu Seçim Checkbox */}
                  <th className="p-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedInstallmentIds.size === installments.filter(i => i.status !== 'paid').length && installments.filter(i => i.status !== 'paid').length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Tümünü Seç"
                    />
                  </th>
                  <th className="p-3 text-left">Taksit</th>
                  <th className="p-3 text-left">Vade Tarihi</th>
                  <th className="p-3 text-right">Tutar</th>
                  <th className="p-3 text-right">Ödenen</th>
                  <th className="p-3 text-center">Ödeme Tarihi</th>
                  <th className="p-3 text-center">Ödeme Biçimi</th>
                  <th className="p-3 text-right">Kalan</th>
                  <th className="p-3 text-center">Durum</th>
                  <th className="p-3 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((installment, index) => {
                  const remaining = installment.amount - installment.paid_amount;
                  const statusBadge = getStatusBadge(installment.status);
                  const isOverdue = installment.status === 'overdue';
                  const isPaid = installment.status === 'paid';
                  const isPartial = installment.paid_amount > 0 && !isPaid;

                  return (
                    <tr
                      key={installment.id}
                      className={`border-b transition-all ${
                        selectedInstallmentIds.has(installment.id) ? 'ring-2 ring-emerald-400 ring-inset' : ''
                      } ${
                        isPaid 
                          ? 'bg-gradient-to-r from-emerald-50/80 to-green-50/50 border-emerald-200 hover:from-emerald-100/80 hover:to-green-100/50' 
                          : isPartial
                            ? 'bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border-amber-200 hover:from-amber-100/50'
                            : isOverdue 
                              ? 'bg-red-50/30 border-red-200 hover:bg-red-50/50' 
                              : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {/* Toplu Seçim Checkbox */}
                      <td className="p-3 text-center">
                        {!isPaid && (
                          <input
                            type="checkbox"
                            checked={selectedInstallmentIds.has(installment.id)}
                            onChange={() => toggleInstallmentSelection(installment.id)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        )}
                        {isPaid && (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isPaid && <div className="w-1 h-8 bg-emerald-500 rounded-full" />}
                          {isPartial && <div className="w-1 h-8 bg-amber-500 rounded-full" />}
                          <span className={`font-medium ${isPaid ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {installment.installment_no === 0 ? 'Peşinat' : `${installment.installment_no}. Taksit`}
                          </span>
                        </div>
                      </td>
                      <td className={`p-3 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                        {isOverdue && <span className="ml-1 text-xs">(Gecikmiş)</span>}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900">
                        ₺{installment.amount.toLocaleString('tr-TR')}
                      </td>
                      <td className={`p-3 text-right font-bold ${isPaid ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-gray-400'}`}>
                        ₺{installment.paid_amount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-3 text-center text-gray-600">
                        {installment.paid_at ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <CalendarCheck className="h-3 w-3 text-emerald-500" />
                            {new Date(installment.paid_at).toLocaleDateString('tr-TR')}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      {/* ÖDEME BİÇİMİ */}
                      <td className="p-3 text-center">
                        {installment.payment_method ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            installment.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                            installment.payment_method === 'card' ? 'bg-blue-100 text-blue-700' :
                            installment.payment_method === 'bank' ? 'bg-purple-100 text-purple-700' :
                            installment.payment_method === 'eft' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {installment.payment_method === 'cash' && <Banknote className="h-3 w-3" />}
                            {installment.payment_method === 'card' && <CreditCard className="h-3 w-3" />}
                            {installment.payment_method === 'bank' && <Building className="h-3 w-3" />}
                            {installment.payment_method === 'eft' && <Building className="h-3 w-3" />}
                            {installment.payment_method === 'cash' ? 'Nakit' :
                             installment.payment_method === 'card' ? 'Kart' :
                             installment.payment_method === 'bank' ? 'Havale' :
                             installment.payment_method === 'eft' ? 'EFT' : '—'}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-medium ${remaining === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        ₺{remaining.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* TAHSİL ET / MAKBUZ */}
                          {isPaid ? (
                            <button
                              onClick={() => downloadReceipt(installment)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition"
                              title="Makbuz İndir"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePayment(installment)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium transition shadow-sm"
                              title="Tahsil Et"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Tahsil</span>
                            </button>
                          )}
                          
                          {/* WHATSAPP */}
                          {installment.paid_amount > 0 && (
                            <button
                              onClick={() => sendPaymentWhatsApp(installment)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 text-xs font-medium transition shadow-sm"
                              title="WhatsApp ile Bildir"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          
                          {/* DÜZENLE */}
                          {installment.paid_amount > 0 && (
                            <button
                              onClick={() => handleEditInstallment(installment)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition"
                              title="Ödemeyi Düzenle"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          
                          {/* SİL */}
                          <button
                            onClick={() => handleDeleteInstallment(installment.id, isPaid)}
                            disabled={deletingInstallmentId === installment.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-medium transition disabled:opacity-50"
                            title="Taksiti Sil"
                          >
                            {deletingInstallmentId === installment.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ÖZET ÇİZGİSİ */}
            <div className="border-t-2 border-dashed border-gray-300 mt-2" />
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-sm text-gray-600">Ödendi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-sm text-gray-600">Kısmi Ödeme</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <span className="text-sm text-gray-600">Beklemede</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-emerald-600">
                  Ödenen: ₺{installments.reduce((s, i) => s + i.paid_amount, 0).toLocaleString('tr-TR')}
                </span>
                <span className="text-orange-600">
                  Kalan: ₺{installments.reduce((s, i) => s + (i.amount - i.paid_amount), 0).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DİĞER GELİRLER - Kitap, Üniforma, Yemek vb. */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-600" />
              Diğer Gelirler
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* YENİ EKLE BUTONU */}
              <button
                onClick={() => setShowAddOtherIncomeModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 text-sm font-medium transition shadow-md"
              >
                <Plus className="h-4 w-4" />
                Yeni Ekle
              </button>
              {otherIncomes.length > 0 && (
                <button
                  onClick={downloadOtherIncomeSummaryPDF}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium transition"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {loadingOtherIncomes ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600"></div>
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
              <thead className="bg-teal-50 text-gray-600 font-medium border-b-2 border-teal-200">
                <tr>
                  <th className="p-3 text-left">Başlık</th>
                  <th className="p-3 text-center">Kategori</th>
                  <th className="p-3 text-left">Vade Tarihi</th>
                  <th className="p-3 text-right">Tutar</th>
                  <th className="p-3 text-right">Ödenen</th>
                  <th className="p-3 text-center">Ödeme Tarihi</th>
                  <th className="p-3 text-center">Ödeme Biçimi</th>
                  <th className="p-3 text-right">Kalan</th>
                  <th className="p-3 text-center">Durum</th>
                  <th className="p-3 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {otherIncomes.map((income) => {
                  const categoryInfo = CATEGORY_INFO[income.category] || CATEGORY_INFO.other;
                  const CategoryIcon = categoryInfo.icon;
                  const remaining = income.amount - income.paidAmount;
                  const isOverdue = !income.isPaid && income.dueDate && new Date(income.dueDate) < new Date();

                  return (
                    <tr
                      key={income.id}
                      className={`border-b transition-all ${
                        income.isPaid 
                          ? 'bg-gradient-to-r from-teal-50/80 to-emerald-50/50 border-teal-200 hover:from-teal-100/80 hover:to-emerald-100/50' 
                          : income.paidAmount > 0
                            ? 'bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border-amber-200 hover:from-amber-100/50'
                            : isOverdue 
                              ? 'bg-red-50/30 border-red-200 hover:bg-red-50/50' 
                              : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {income.isPaid && <div className="w-1 h-8 bg-teal-500 rounded-full" />}
                          {income.paidAmount > 0 && !income.isPaid && <div className="w-1 h-8 bg-amber-500 rounded-full" />}
                          <div>
                            <span className={`font-medium ${income.isPaid ? 'text-teal-700' : 'text-gray-900'}`}>
                              {income.title}
                            </span>
                            {income.notes && (
                              <p className="text-xs text-gray-500 mt-0.5">{income.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${categoryInfo.color}`}>
                          <CategoryIcon className="h-3 w-3" />
                          {categoryInfo.label}
                        </span>
                      </td>
                      <td className={`p-3 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {income.dueDate ? new Date(income.dueDate).toLocaleDateString('tr-TR') : new Date(income.date).toLocaleDateString('tr-TR')}
                        {isOverdue && <span className="ml-1 text-xs">(Gecikmiş)</span>}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900">
                        ₺{income.amount.toLocaleString('tr-TR')}
                      </td>
                      <td className={`p-3 text-right font-bold ${income.isPaid ? 'text-teal-600' : income.paidAmount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        ₺{income.paidAmount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-3 text-center text-gray-600">
                        {income.paidAt ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <CalendarCheck className="h-3 w-3 text-teal-500" />
                            {new Date(income.paidAt).toLocaleDateString('tr-TR')}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      {/* ÖDEME BİÇİMİ */}
                      <td className="p-3 text-center">
                        {income.paymentMethod ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            income.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                            income.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                            income.paymentMethod === 'bank' ? 'bg-purple-100 text-purple-700' :
                            income.paymentMethod === 'eft' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {income.paymentMethod === 'cash' && <Banknote className="h-3 w-3" />}
                            {income.paymentMethod === 'card' && <CreditCard className="h-3 w-3" />}
                            {income.paymentMethod === 'bank' && <Building className="h-3 w-3" />}
                            {income.paymentMethod === 'eft' && <Building className="h-3 w-3" />}
                            {income.paymentMethod === 'cash' ? 'Nakit' :
                             income.paymentMethod === 'card' ? 'Kart' :
                             income.paymentMethod === 'bank' ? 'Havale' :
                             income.paymentMethod === 'eft' ? 'EFT' : '—'}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-medium ${remaining === 0 ? 'text-teal-600' : 'text-orange-600'}`}>
                        ₺{remaining.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-3 text-center">
                        {income.isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-teal-100 text-teal-700 border-teal-300">
                            Ödendi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-yellow-100 text-yellow-700 border-yellow-300">
                            Beklemede
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* TAHSİL ET / MAKBUZ */}
                          {income.isPaid ? (
                            <button
                              onClick={() => downloadOtherIncomeReceipt(income)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition"
                              title="Makbuz İndir"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenOtherPayment(income)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium transition shadow-sm"
                              title="Tahsil Et"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Tahsil</span>
                            </button>
                          )}
                          
                          {/* WHATSAPP */}
                          {income.paidAmount > 0 && (
                            <button
                              onClick={() => {
                                if (!student.parent_phone) {
                                  toast.error('Veli telefon numarası bulunamadı!');
                                  return;
                                }
                                const phone = student.parent_phone.replace(/\D/g, '');
                                const formattedPhone = phone.startsWith('0') ? '90' + phone.slice(1) : phone.length === 10 ? '90' + phone : phone;
                                const message = `💰 *ÖDEME BİLGİLENDİRME*\n\n🏫 *${organizationName}*\n\n👤 Öğrenci: ${student.first_name} ${student.last_name}\n📋 ${income.title}\n💵 Ödenen: ${income.paidAmount.toLocaleString('tr-TR')} TL\n${income.isPaid ? '✅ Tamamen ödendi!' : `⏳ Kalan: ${remaining.toLocaleString('tr-TR')} TL`}\n\nTeşekkür ederiz. 🙏`;
                                window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 text-xs font-medium transition shadow-sm"
                              title="WhatsApp ile Bildir"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          
                          {/* DÜZENLE - Her zaman görünür */}
                          <button
                            onClick={() => handleEditOtherIncome(income)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 text-xs font-medium transition"
                            title="Duzenle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* SİL */}
                          <button
                            onClick={() => handleDeleteOtherIncome(income.id, income.isPaid)}
                            disabled={deletingOtherIncomeId === income.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-medium transition disabled:opacity-50"
                            title="Sil"
                          >
                            {deletingOtherIncomeId === income.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ÖZET ÇİZGİSİ */}
            <div className="border-t-2 border-dashed border-teal-300 mt-2" />
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full" />
                  <span className="text-sm text-gray-600">Ödendi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-sm text-gray-600">Kısmi Ödeme</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <span className="text-sm text-gray-600">Beklemede</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-teal-600">
                  Ödenen: ₺{otherIncomes.reduce((s, i) => s + i.paidAmount, 0).toLocaleString('tr-TR')}
                </span>
                <span className="text-orange-600">
                  Kalan: ₺{otherIncomes.reduce((s, i) => s + (i.amount - i.paidAmount), 0).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
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
        {/* Sözleşme Önizleme Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sol: Öğrenci & Veli Bilgileri */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
              👤 Taraf Bilgileri
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Öğrenci:</span>
                <span className="font-bold text-gray-800">{student.first_name} {student.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sınıf:</span>
                <span className="font-medium text-gray-800">{student.class || '-'}-{student.section || 'A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Veli:</span>
                <span className="font-bold text-gray-800">{student.parent_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telefon:</span>
                <span className="font-medium text-emerald-600">{student.parent_phone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Sağ: Finansal Özet */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              💰 Finansal Özet
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Toplam Sözleşme:</span>
                <span className="font-bold text-gray-800">₺{totalAmount.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tahsil Edilen:</span>
                <span className="font-bold text-emerald-600">₺{paidAmount.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Kalan Borç:</span>
                <span className={`font-bold text-lg ${balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                  ₺{balance.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taksit Sayısı:</span>
                <span className="font-medium text-gray-800">{installments.length} adet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Onay Durumları */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📋 Sözleşme Onayları</h4>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg">
              <CheckCircle2 size={14} />
              <span>KVKK Onayı</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg">
              <CheckCircle2 size={14} />
              <span>Okul Kuralları</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg">
              <CheckCircle2 size={14} />
              <span>Ödeme Planı</span>
            </div>
          </div>
        </div>

        {/* Kayıt Tarihi */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Kayıt Tarihi: {student.registration_date ? new Date(student.registration_date).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR')}
          {' • '}Akademik Yıl: {student.academic_year || '2024-2025'}
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
                  <div className="grid grid-cols-4 gap-2">
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
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('manual')}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                        paymentMethod === 'manual' 
                        ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500 text-orange-700 shadow-md shadow-orange-100' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <FileEdit size={20} />
                      <span className="text-[10px] font-semibold">Manual</span>
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

    {/* TAKSİT DÜZENLE MODAL */}
    {showEditModal && editInstallment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Ödeme Düzenle</h3>
                  <p className="text-blue-200 text-sm">
                    {editInstallment.installment_no === 0 ? 'Peşinat' : `${editInstallment.installment_no}. Taksit`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Taksit Bilgisi - Düzenlenebilir */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1">
                <Edit3 size={12} /> TAKSİT BİLGİLERİ (Düzenlenebilir)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Taksit Tutarı</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₺</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editInstallmentAmount}
                      onChange={(e) => setEditInstallmentAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                      className="w-full pl-8 pr-3 py-2 text-sm font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Vade Tarihi</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Ödenen Tutar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ödenen Tutar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full pl-10 pr-4 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Ödeme Tarihi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ödeme Tarihi</label>
              <input
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ödeme Yöntemi</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('cash')}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition ${
                    editPaymentMethod === 'cash' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Banknote size={18} />
                  <span className="text-[10px] font-medium">Nakit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('card')}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition ${
                    editPaymentMethod === 'card' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={18} />
                  <span className="text-[10px] font-medium">Kart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('bank')}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition ${
                    editPaymentMethod === 'bank' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Building size={18} />
                  <span className="text-[10px] font-medium">EFT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('manual')}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition ${
                    editPaymentMethod === 'manual' 
                      ? 'bg-orange-50 border-orange-500 text-orange-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <FileEdit size={18} />
                  <span className="text-[10px] font-medium">Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              İptal
            </button>
            <button
              onClick={saveEditInstallment}
              disabled={editSubmitting}
              className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {editSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

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
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'cash', label: '💵 Nakit' },
                  { value: 'card', label: '💳 Kart' },
                  { value: 'bank', label: '🏦 Banka' },
                  { value: 'manual', label: '📝 Manual' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setOtherPaymentMethod(method.value as 'cash' | 'card' | 'bank' | 'manual')}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
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

    {/* TOPLU TAHSİLAT MODAL */}
    {showBulkPaymentModal && selectedInstallmentIds.size > 0 && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Toplu Tahsilat</h3>
                  <p className="text-emerald-200 text-sm">{selectedInstallmentIds.size} taksit seçildi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBulkPaymentModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Seçili Taksitler Özeti */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 mb-3">SEÇİLİ TAKSİTLER</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {installments
                  .filter(i => selectedInstallmentIds.has(i.id))
                  .map(inst => (
                    <div key={inst.id} className="flex justify-between items-center text-sm bg-white px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700">
                        {inst.installment_no === 0 ? 'Peşinat' : `${inst.installment_no}. Taksit`}
                      </span>
                      <span className="font-bold text-emerald-600">
                        ₺{(inst.amount - inst.paid_amount).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200 flex justify-between items-center">
                <span className="font-bold text-emerald-800">Toplam Tahsilat</span>
                <span className="text-xl font-bold text-emerald-700">₺{selectedTotalAmount.toLocaleString('tr-TR')}</span>
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ödeme Yöntemi</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod('cash')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    bulkPaymentMethod === 'cash' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Banknote size={20} />
                  <span className="text-xs font-medium">Nakit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod('card')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    bulkPaymentMethod === 'card' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={20} />
                  <span className="text-xs font-medium">Kart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod('bank')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    bulkPaymentMethod === 'bank' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Building size={20} />
                  <span className="text-xs font-medium">EFT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod('manual')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    bulkPaymentMethod === 'manual' 
                      ? 'bg-orange-50 border-orange-500 text-orange-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <FileEdit size={20} />
                  <span className="text-xs font-medium">Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => {
                setShowBulkPaymentModal(false);
                setSelectedInstallmentIds(new Set());
              }}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              İptal
            </button>
            <button
              onClick={handleBulkPayment}
              disabled={bulkPaymentLoading}
              className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              {bulkPaymentLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Tümünü Tahsil Et
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* DİĞER GELİR EKLEME MODAL */}
    {showAddOtherIncomeModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Yeni Satış Ekle</h3>
                  <p className="text-purple-200 text-sm">Kitap, Üniforma, Yemek vb.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddOtherIncomeModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Başlık */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Başlık *</label>
              <input
                type="text"
                value={newOtherIncome.title}
                onChange={(e) => setNewOtherIncome(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Örn: 11. Sınıf Kitap Seti"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                  const Icon = info.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewOtherIncome(prev => ({ ...prev, category: key as any }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                        newOtherIncome.category === key 
                          ? `${info.color} text-white border-transparent` 
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[10px] font-medium">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tutar ve Taksit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Toplam Tutar *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newOtherIncome.amount}
                    onChange={(e) => setNewOtherIncome(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9.,]/g, '') }))}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Taksit Sayısı</label>
                <select
                  value={newOtherIncome.installmentCount}
                  onChange={(e) => setNewOtherIncome(prev => ({ ...prev, installmentCount: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} Taksit</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vade Tarihi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">İlk Vade Tarihi</label>
              <input
                type="date"
                value={newOtherIncome.dueDate}
                onChange={(e) => setNewOtherIncome(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            {/* Not */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Not (Opsiyonel)</label>
              <textarea
                value={newOtherIncome.notes}
                onChange={(e) => setNewOtherIncome(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ek açıklama..."
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
              />
            </div>

            {/* Özet */}
            {newOtherIncome.amount && parseFloat(newOtherIncome.amount) > 0 && newOtherIncome.installmentCount > 1 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-700">
                  <strong>{newOtherIncome.installmentCount} taksit</strong> × ₺{(parseFloat(newOtherIncome.amount) / newOtherIncome.installmentCount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} = <strong>₺{parseFloat(newOtherIncome.amount).toLocaleString('tr-TR')}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowAddOtherIncomeModal(false)}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              İptal
            </button>
            <button
              onClick={handleAddOtherIncome}
              disabled={addingOtherIncome || !newOtherIncome.title.trim() || !newOtherIncome.amount}
              className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              {addingOtherIncome ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Ekle
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* DİĞER GELİR DÜZENLEME MODAL - Eğitim Taksitleri ile Aynı */}
    {showEditOtherIncomeModal && editingOtherIncome && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Pencil className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Odeme Duzenle</h3>
                  <p className="text-teal-200 text-sm">{editingOtherIncome.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditOtherIncomeModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* KALEM BİLGİLERİ (Düzenlenebilir) */}
            <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Pencil className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-bold text-teal-700">KALEM BILGILERI (Duzenlenebilir)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tutar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₺</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editOtherIncomeData.amount}
                      onChange={(e) => setEditOtherIncomeData(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9.,]/g, '') }))}
                      className="w-full pl-8 pr-3 py-2.5 border-2 border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vade Tarihi</label>
                  <input
                    type="date"
                    value={editOtherIncomeData.dueDate}
                    onChange={(e) => setEditOtherIncomeData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ödenen Tutar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Odenen Tutar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editOtherIncomeData.paidAmount}
                  onChange={(e) => setEditOtherIncomeData(prev => ({ ...prev, paidAmount: e.target.value.replace(/[^0-9.,]/g, '') }))}
                  className="w-full pl-10 pr-4 py-3 text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Ödeme Tarihi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Odeme Tarihi</label>
              <input
                type="date"
                value={editOtherIncomeData.paidAt}
                onChange={(e) => setEditOtherIncomeData(prev => ({ ...prev, paidAt: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Odeme Yontemi</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 'cash', label: 'Nakit', icon: Banknote },
                  { value: 'card', label: 'Kart', icon: CreditCard },
                  { value: 'eft', label: 'EFT', icon: Building },
                  { value: 'bank', label: 'Havale', icon: Building },
                  { value: 'manual', label: 'Manuel', icon: FileText }
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setEditOtherIncomeData(prev => ({ ...prev, paymentMethod: method.value as any }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        editOtherIncomeData.paymentMethod === method.value
                          ? 'bg-teal-100 text-teal-700 border-teal-500'
                          : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowEditOtherIncomeModal(false)}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Iptal
            </button>
            <button
              onClick={handleSaveOtherIncome}
              disabled={savingOtherIncome}
              className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl hover:from-teal-700 hover:to-emerald-700 disabled:opacity-60 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {savingOtherIncome ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* TAKSİT EKLEME MODAL */}
    {showAddInstallmentModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Yeni Taksit Ekle</h3>
                  <p className="text-indigo-200 text-sm">Manuel taksit oluşturma</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddInstallmentModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Bilgi */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-sm text-indigo-700">
                Yeni taksit <strong>{installments.length > 0 ? Math.max(...installments.map(i => i.installment_no)) + 1 : 1}. Taksit</strong> olarak eklenecek.
              </p>
            </div>

            {/* Tutar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Taksit Tutarı *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newInstallment.amount}
                  onChange={(e) => setNewInstallment(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9.,]/g, '') }))}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Vade Tarihi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vade Tarihi *</label>
              <input
                type="date"
                value={newInstallment.dueDate}
                onChange={(e) => setNewInstallment(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Not */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Not (Opsiyonel)</label>
              <input
                type="text"
                value={newInstallment.note}
                onChange={(e) => setNewInstallment(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ek açıklama..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowAddInstallmentModal(false)}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              İptal
            </button>
            <button
              onClick={handleAddInstallment}
              disabled={addingInstallment || !newInstallment.amount}
              className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {addingInstallment ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Taksit Ekle
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

