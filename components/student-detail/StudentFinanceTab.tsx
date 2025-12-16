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
  Trash2
} from 'lucide-react';
import RestructurePlanModal from '@/components/finance/RestructurePlanModal';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
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

export default function StudentFinanceTab({ student, onRefresh }: Props) {
  const { canCollectPayment, canEditInstallment, canAddInstallment, canExportPdf } = usePermission();
  const { currentOrganization } = useOrganizationStore();
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';
  
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showRestructureModal, setShowRestructureModal] = useState(false);
  
  // Diğer Gelirler State
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [loadingOtherIncomes, setLoadingOtherIncomes] = useState(false);
  
  // Diğer Gelirler Tahsilat State
  const [showOtherPaymentModal, setShowOtherPaymentModal] = useState(false);
  const [selectedOtherIncome, setSelectedOtherIncome] = useState<OtherIncome | null>(null);
  const [otherPaymentAmount, setOtherPaymentAmount] = useState('');
  const [otherPaymentMethod, setOtherPaymentMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [otherPaymentLoading, setOtherPaymentLoading] = useState(false);

  const fetchInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/installments?student_id=${student.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const allInstallments = data.data;
        
        if (allInstallments.length > 20) {
          toast.error(`⚠️ DİKKAT: Bu öğrenci için ${allInstallments.length} taksit bulundu!\n\nBu normalin üzerinde. Veritabanında hata olabilir.\n\nSadece ilk 20 taksit gösteriliyor.`, {
            duration: 8000,
          });
        }
        
        setInstallments(allInstallments.slice(0, 20));
      }
    } catch {
      // Error handled silently
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

  // Diğer Gelirler Makbuz İndir
  const downloadOtherIncomeReceipt = async (income: OtherIncome) => {
    const toastId = toast.loading('Makbuz hazırlanıyor...');
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const receiptNo = `DG-${new Date().getFullYear()}-${income.id.slice(0, 8).toUpperCase()}`;
      const formattedDate = income.paidAt 
        ? new Date(income.paidAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
      const currentDateTime = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Öğrenci';
      const parentName = student.parent_name || 'Sayın Veli';
      const categoryLabel = CATEGORY_INFO[income.category]?.label || 'Diğer';
      const receiptOrgName = organizationName;

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      const receiptDiv = document.createElement('div');
      receiptDiv.innerHTML = `
        <div style="width: 260px; margin: 0 auto; padding: 12px; border: 2px solid #9333ea; border-radius: 10px; font-family: Arial, sans-serif; background: white;">
          <div style="display: flex; justify-content: space-between; font-size: 8px; color: #666; margin-bottom: 6px;">
            <span>${currentDateTime}</span>
            <span>Diğer Gelir Makbuzu</span>
          </div>
          <div style="text-align: center; margin-bottom: 8px;">
            <h1 style="font-size: 16px; color: #9333ea; font-weight: 700; margin: 0;">${organizationName}</h1>
          </div>
          <div style="text-align: center; font-size: 11px; font-weight: 600; color: #333; padding: 5px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">DİĞER GELİR MAKBUZU</div>
          <div style="text-align: center; font-size: 8px; color: #666; margin-bottom: 8px;">Belge No: ${receiptNo}</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
            <div>
              <div style="font-size: 7px; color: #888; text-transform: uppercase;">Öğrenci</div>
              <div style="font-size: 9px; color: #333; font-weight: 500;">${studentName}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 7px; color: #888; text-transform: uppercase;">Tarih</div>
              <div style="font-size: 9px; color: #333; font-weight: 500;">${formattedDate}</div>
            </div>
            <div>
              <div style="font-size: 7px; color: #888; text-transform: uppercase;">Ödeme Yapan</div>
              <div style="font-size: 9px; color: #333; font-weight: 500;">${parentName}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 7px; color: #888; text-transform: uppercase;">Kategori</div>
              <div style="font-size: 9px; color: #333; font-weight: 500;">${categoryLabel}</div>
            </div>
            <div style="grid-column: span 2;">
              <div style="font-size: 7px; color: #888; text-transform: uppercase;">Açıklama</div>
              <div style="font-size: 9px; color: #333; font-weight: 500;">${income.title}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #9333ea, #c026d3); color: white; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 10px;">
            <div style="font-size: 8px; opacity: 0.9;">Tahsil Edilen Tutar</div>
            <div style="font-size: 20px; font-weight: 700; margin-top: 3px;">₺${income.paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px dashed #ccc;">
            <div style="text-align: center; width: 45%;">
              <div style="font-size: 7px; color: #888;">Teslim Alan</div>
              <div style="font-size: 8px; color: #333; font-weight: 500;">Muhasebe Birimi</div>
              <div style="border-top: 1px solid #333; margin-top: 15px;"></div>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="font-size: 7px; color: #888;">Teslim Eden</div>
              <div style="font-size: 8px; color: #333; font-weight: 500;">${studentName} / Veli</div>
              <div style="border-top: 1px solid #333; margin-top: 15px;"></div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 6px; color: #888; margin: 0;">Bu belge elektronik ortamda üretilmiştir. Geçerli bir tahsilat belgesi yerine geçer.</p>
            <p style="font-size: 6px; color: #9333ea; font-weight: 500; margin-top: 2px;">${organizationName} Eğitim Yönetim Sistemi</p>
          </div>
        </div>
      `;
      container.appendChild(receiptDiv);

      const opt = {
        margin: 2,
        filename: `DigerGelir_Makbuz_${categoryLabel}_${student.last_name}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: [80, 120] as [number, number], orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(receiptDiv).save();
      document.body.removeChild(container);
      
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
    setShowPaymentModal(true);
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
      
      // Listeyi yenile
      setTimeout(() => {
        fetchInstallments();
        onRefresh?.();
      }, 500);
    } catch (error: any) {
      toast.error(`❌ Ödeme hatası: ${error.message}`, { id: toastId });
    }
  };

  const downloadReceipt = async (installment: Installment) => {
    const toastId = toast.loading('Makbuz hazırlanıyor...');
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
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
      const receiptOrgName = organizationName;

      // HTML'i DOM'a ekle
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      // Sadece receipt div'ini al (HTML wrapper olmadan)
      const receiptDiv = document.createElement('div');
      receiptDiv.innerHTML = `
        <div style="width: 280px; margin: 0 auto; padding: 20px; border: 2px solid #059669; border-radius: 12px; font-family: Arial, sans-serif; background: white;">
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #666; margin-bottom: 10px;">
            <span>${currentDateTime}</span>
            <span>Tahsilat Makbuzu</span>
          </div>
          <div style="text-align: center; margin-bottom: 15px;">
            <h1 style="font-size: 20px; color: #059669; font-weight: 700; margin: 0;">${organizationName}</h1>
          </div>
          <div style="text-align: center; font-size: 14px; font-weight: 600; color: #333; padding: 8px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin-bottom: 15px;">TAHSİLAT MAKBUZU</div>
          <div style="text-align: center; font-size: 10px; color: #666; margin-bottom: 15px;">Belge No: ${receiptNo}</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div>
              <div style="font-size: 9px; color: #888; text-transform: uppercase;">Öğrenci Adı Soyadı</div>
              <div style="font-size: 11px; color: #333; font-weight: 500; margin-top: 2px;">${studentName}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; color: #888; text-transform: uppercase;">Tarih</div>
              <div style="font-size: 11px; color: #333; font-weight: 500; margin-top: 2px;">${formattedDate}</div>
            </div>
            <div>
              <div style="font-size: 9px; color: #888; text-transform: uppercase;">Ödeme Yapan</div>
              <div style="font-size: 11px; color: #333; font-weight: 500; margin-top: 2px;">${parentName}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; color: #888; text-transform: uppercase;">Ödeme Yöntemi</div>
              <div style="font-size: 11px; color: #333; font-weight: 500; margin-top: 2px;">${paymentMethod}</div>
            </div>
            <div>
              <div style="font-size: 9px; color: #888; text-transform: uppercase;">Öğrenci No</div>
              <div style="font-size: 11px; color: #333; font-weight: 500; margin-top: 2px;">${student.student_no || '-'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; color: #888; text-transform: uppercase;">Taksit No</div>
              <div style="font-size: 11px; color: #333; font-weight: 500; margin-top: 2px;">${installmentLabel}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 10px; opacity: 0.9;">Tahsil Edilen Tutar</div>
            <div style="font-size: 24px; font-weight: 700; margin-top: 5px;">₺${paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 25px; padding-top: 15px; border-top: 1px dashed #ccc;">
            <div style="text-align: center; width: 45%;">
              <div style="font-size: 9px; color: #888;">Teslim Alan</div>
              <div style="font-size: 10px; color: #333; margin-top: 3px; font-weight: 500;">Muhasebe Birimi</div>
              <div style="border-top: 1px solid #333; margin-top: 30px;"></div>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="font-size: 9px; color: #888;">Teslim Eden</div>
              <div style="font-size: 10px; color: #333; margin-top: 3px; font-weight: 500;">${studentName} / Veli</div>
              <div style="border-top: 1px solid #333; margin-top: 30px;"></div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 8px; color: #888; line-height: 1.5; margin: 0;">Bu belge elektronik ortamda üretilmiştir.<br>Geçerli bir tahsilat belgesi yerine geçer.</p>
            <p style="font-size: 8px; color: #059669; font-weight: 500; margin-top: 5px;">${organizationName} Eğitim Yönetim Sistemi</p>
          </div>
        </div>
      `;
      container.appendChild(receiptDiv);

      const opt = {
        margin: 5,
        filename: `Makbuz_${installment.installment_no}_${student.last_name}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: [100, 160] as [number, number], orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(receiptDiv).save();
      document.body.removeChild(container);
      
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
      const html2pdf = (await import('html2pdf.js')).default;
      
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
      const today = new Date().toLocaleDateString('tr-TR');
      const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
      const paidAmount = installments.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
      const remainingAmount = totalAmount - paidAmount;
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      const pdfDiv = document.createElement('div');
      pdfDiv.innerHTML = `
        <div style="width: 700px; padding: 30px; font-family: Arial, sans-serif;">
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
      container.appendChild(pdfDiv);

      const opt = {
        margin: 10,
        filename: 'Egitim_Odemeler_' + studentName.replace(/\\s/g, '_') + '_' + today.replace(/\\./g, '-') + '.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(pdfDiv).save();
      document.body.removeChild(container);
      
      toast.success('✅ Eğitim Ödemeleri PDF indirildi!', { id: toastId });
    } catch (error: any) {
      toast.error('PDF oluşturulamadı: ' + error.message, { id: toastId });
    }
  };

  // Diğer Gelirler Özet PDF
  const downloadOtherIncomeSummaryPDF = async () => {
    const toastId = toast.loading('Diğer gelirler PDF hazırlanıyor...');
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
      const today = new Date().toLocaleDateString('tr-TR');
      const totalAmount = otherIncomes.reduce((sum, i) => sum + i.amount, 0);
      const paidAmount = otherIncomes.reduce((sum, i) => sum + i.paidAmount, 0);
      const remainingAmount = totalAmount - paidAmount;
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      const pdfDiv = document.createElement('div');
      pdfDiv.innerHTML = `
        <div style="width: 700px; padding: 30px; font-family: Arial, sans-serif;">
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
      container.appendChild(pdfDiv);

      const opt = {
        margin: 10,
        filename: 'Diger_Gelirler_' + studentName.replace(/\\s/g, '_') + '_' + today.replace(/\\./g, '-') + '.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(pdfDiv).save();
      document.body.removeChild(container);
      
      toast.success('✅ Diğer Gelirler PDF indirildi!', { id: toastId });
    } catch (error: any) {
      toast.error('PDF oluşturulamadı: ' + error.message, { id: toastId });
    }
  };

  const downloadContract = async () => {
    const toastId = toast.loading('Sözleşme PDF\'i hazırlanıyor...');
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const today = new Date().toLocaleDateString('tr-TR');
      
      // Diğer satışlar toplamları
      const otherTotalAmount = otherIncomes.reduce((sum, i) => sum + i.amount, 0);
      const otherPaidAmount = otherIncomes.reduce((sum, i) => sum + i.paidAmount, 0);
      
      // HTML içerik oluştur
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; max-width: 800px; margin: 0 auto;">
          <!-- BAŞLIK -->
          <div style="text-align: center; margin-bottom: 15px;">
            <h1 style="font-size: 16px; font-weight: bold; margin: 0; color: #1e293b;">KAYIT VE SATIŞLAR SÖZLEŞMESİ</h1>
            <p style="font-size: 9px; color: #64748b; margin-top: 4px;">
              Tarih: ${today} | Öğrenci No: ${student.student_no || '-'}
            </p>
          </div>
          
          <!-- ÖĞRENCİ VE VELİ BİLGİLERİ -->
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 6px 10px; font-size: 10px; font-weight: bold;">
                ÖĞRENCİ BİLGİLERİ
              </div>
              <div style="padding: 8px; font-size: 9px; color: #334155; line-height: 1.5;">
                <div><strong>Ad Soyad:</strong> ${student.first_name || ''} ${student.last_name || ''}</div>
                <div><strong>TC Kimlik No:</strong> ${student.tc_no || '-'}</div>
                <div><strong>Sınıf:</strong> ${student.class || '-'}-${student.section || 'A'}</div>
                <div><strong>Kayıt Tarihi:</strong> ${today}</div>
              </div>
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #9333ea, #c026d3); color: white; padding: 6px 10px; font-size: 10px; font-weight: bold;">
                VELİ BİLGİLERİ
              </div>
              <div style="padding: 8px; font-size: 9px; color: #334155; line-height: 1.5;">
                <div><strong>Veli Adı:</strong> ${student.parent_name || '-'}</div>
                <div><strong>Telefon:</strong> ${student.parent_phone || '-'}</div>
                <div><strong>E-posta:</strong> ${student.parent_email || '-'}</div>
              </div>
            </div>
          </div>
          
          <!-- EĞİTİM ÖDEME PLANI -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 6px 10px; font-size: 10px; font-weight: bold;">
              EĞİTİM ÖDEME PLANI
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 5px; text-align: center; border-bottom: 1px solid #e2e8f0; width: 30px;">No</th>
                  <th style="padding: 5px; text-align: left; border-bottom: 1px solid #e2e8f0;">Açıklama</th>
                  <th style="padding: 5px; text-align: center; border-bottom: 1px solid #e2e8f0;">Vade</th>
                  <th style="padding: 5px; text-align: center; border-bottom: 1px solid #e2e8f0;">Ödeme Tarihi</th>
                  <th style="padding: 5px; text-align: right; border-bottom: 1px solid #e2e8f0;">Tutar</th>
                  <th style="padding: 5px; text-align: center; border-bottom: 1px solid #e2e8f0;">Durum</th>
                </tr>
              </thead>
              <tbody>
                ${installments.slice(0, 12).map((inst, index) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 4px 5px; text-align: center; font-weight: bold;">${inst.installment_no === 0 ? 'P' : index + 1}</td>
                    <td style="padding: 4px 5px;">${inst.installment_no === 0 ? 'Peşinat' : inst.installment_no + '. Taksit'}</td>
                    <td style="padding: 4px 5px; text-align: center;">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                    <td style="padding: 4px 5px; text-align: center; color: ${inst.status === 'paid' ? '#059669' : '#9ca3af'};">
                      ${inst.status === 'paid' && inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td style="padding: 4px 5px; text-align: right; font-weight: bold;">${inst.amount.toLocaleString('tr-TR')} TL</td>
                    <td style="padding: 4px 5px; text-align: center;">
                      <span style="padding: 1px 6px; border-radius: 10px; font-size: 7px; font-weight: bold; 
                        ${inst.status === 'paid' ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
                        ${inst.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
                <tr style="background: #f8fafc; font-weight: bold;">
                  <td colspan="4" style="padding: 5px;">EĞİTİM TOPLAM</td>
                  <td style="padding: 5px; text-align: right;">${totalAmount.toLocaleString('tr-TR')} TL</td>
                  <td style="padding: 5px; text-align: center; font-size: 7px;">Ödenen: ${paidAmount.toLocaleString('tr-TR')} TL</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- DİĞER SATIŞLAR -->
          ${otherIncomes.length > 0 ? `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
            <div style="background: linear-gradient(135deg, #9333ea, #c026d3); color: white; padding: 6px 10px; font-size: 10px; font-weight: bold;">
              DİĞER SATIŞLAR (Kitap, Üniforma, Yemek vb.)
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 5px; text-align: left; border-bottom: 1px solid #e2e8f0;">Açıklama</th>
                  <th style="padding: 5px; text-align: center; border-bottom: 1px solid #e2e8f0;">Kategori</th>
                  <th style="padding: 5px; text-align: right; border-bottom: 1px solid #e2e8f0;">Tutar</th>
                  <th style="padding: 5px; text-align: right; border-bottom: 1px solid #e2e8f0;">Ödenen</th>
                  <th style="padding: 5px; text-align: center; border-bottom: 1px solid #e2e8f0;">Durum</th>
                </tr>
              </thead>
              <tbody>
                ${otherIncomes.map(inc => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 4px 5px;">${inc.title}</td>
                    <td style="padding: 4px 5px; text-align: center;">${CATEGORY_INFO[inc.category]?.label || 'Diğer'}</td>
                    <td style="padding: 4px 5px; text-align: right; font-weight: bold;">${inc.amount.toLocaleString('tr-TR')} TL</td>
                    <td style="padding: 4px 5px; text-align: right; color: #059669;">${inc.paidAmount.toLocaleString('tr-TR')} TL</td>
                    <td style="padding: 4px 5px; text-align: center;">
                      <span style="padding: 1px 6px; border-radius: 10px; font-size: 7px; font-weight: bold; 
                        ${inc.isPaid ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
                        ${inc.isPaid ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
                <tr style="background: #f8fafc; font-weight: bold;">
                  <td colspan="2" style="padding: 5px;">DİĞER SATIŞLAR TOPLAM</td>
                  <td style="padding: 5px; text-align: right;">${otherTotalAmount.toLocaleString('tr-TR')} TL</td>
                  <td style="padding: 5px; text-align: right; color: #059669;">${otherPaidAmount.toLocaleString('tr-TR')} TL</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <!-- GENEL TOPLAM -->
          <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 10px 15px; border-radius: 6px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
              <div>
                <div style="opacity: 0.8; font-size: 8px;">GENEL TOPLAM</div>
                <div style="font-size: 14px; font-weight: bold;">${(totalAmount + otherTotalAmount).toLocaleString('tr-TR')} TL</div>
              </div>
              <div style="text-align: center;">
                <div style="opacity: 0.8; font-size: 8px;">ÖDENEN</div>
                <div style="font-size: 14px; font-weight: bold; color: #4ade80;">${(paidAmount + otherPaidAmount).toLocaleString('tr-TR')} TL</div>
              </div>
              <div style="text-align: right;">
                <div style="opacity: 0.8; font-size: 8px;">KALAN BORÇ</div>
                <div style="font-size: 14px; font-weight: bold; color: #fbbf24;">${((totalAmount + otherTotalAmount) - (paidAmount + otherPaidAmount)).toLocaleString('tr-TR')} TL</div>
              </div>
            </div>
          </div>
          
          <!-- YASAL BEYAN -->
          <p style="font-size: 7px; color: #64748b; font-style: italic; margin-bottom: 15px; line-height: 1.3;">
            MEB Özel Öğretim Kurumları Yönetmeliği gereği hazırlanmıştır. Yukarıdaki bilgilerin doğruluğunu, ödeme planına uyacağımı, KVKK kapsamında kişisel verilerimin işlenmesini kabul ettiğimi beyan ederim.
          </p>
          
          <!-- İMZA ALANLARI -->
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <div style="text-align: center; width: 45%;">
              <p style="font-size: 9px; font-weight: bold; margin-bottom: 25px;">KURUM YETKİLİSİ</p>
              <div style="border-top: 1px solid #334155; padding-top: 4px;">
                <p style="font-size: 7px; color: #64748b;">İmza / Tarih / Kaşe</p>
              </div>
            </div>
            <div style="text-align: center; width: 45%;">
              <p style="font-size: 9px; font-weight: bold; margin-bottom: 25px;">VELİ / MALİ SORUMLU</p>
              <div style="border-top: 1px solid #334155; padding-top: 4px;">
                <p style="font-size: 7px; color: #64748b;">İmza / Tarih</p>
              </div>
            </div>
          </div>
          
          <!-- FOOTER -->
          <div style="text-align: center; margin-top: 15px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 6px; color: #94a3b8;">
              ${organizationName} © ${new Date().getFullYear()} | ${student.first_name} ${student.last_name} | ${today}
            </p>
          </div>
        </div>
      `;
      
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      
      const opt = {
        margin: 8,
        filename: 'Kayit_Satislar_Sozlesme_' + (student.first_name || '') + '_' + (student.last_name || '') + '_' + today.replace(/\\./g, '-') + '.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      
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
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz taksit planı oluşturulmamış.</p>
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

    {/* ÖDEME MODAL */}
    {showPaymentModal && selectedInstallment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Ödeme Al</h3>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-700 mb-1">Taksit Bilgisi</p>
              <p className="text-2xl font-bold text-indigo-900">
                {selectedInstallment.installment_no}. Taksit
              </p>
              <p className="text-sm text-indigo-600 mt-1">
                Vade: {new Date(selectedInstallment.due_date).toLocaleDateString('tr-TR')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tahsil Edilecek Tutar
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₺</span>
                <input
                  type="number"
                  defaultValue={selectedInstallment.amount - selectedInstallment.paid_amount}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
                  id="payment-amount"
                />
              </div>
              <p className="text-xs text-gray-500">
                Kalan: ₺{(selectedInstallment.amount - selectedInstallment.paid_amount).toLocaleString('tr-TR')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ödeme Yöntemi
              </label>
              <select 
                id="payment-method"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="cash">💵 Nakit</option>
                <option value="card">💳 Kredi Kartı</option>
                <option value="transfer">🏦 Banka Transferi</option>
                <option value="eft">📱 Havale/EFT</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              İptal
            </button>
            <button
              onClick={() => {
                const input = document.getElementById('payment-amount') as HTMLInputElement;
                const select = document.getElementById('payment-method') as HTMLSelectElement;
                const amount = parseFloat(input.value) || selectedInstallment.amount;
                const method = select.value;
                processPayment(amount, method);
              }}
              className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Ödemeyi Kaydet
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

