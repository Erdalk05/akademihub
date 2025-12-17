'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Settings, Building2, Users, Calendar, Mail, FileText, 
  CreditCard, Save, Plus, Trash2, Edit, Check, X, 
  ChevronRight, Shield, Eye, EyeOff,
  Smartphone, Globe, Upload, Loader2, Database, Server, Keyboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import BackupRestore from '@/components/settings/BackupRestore';
import APISettings from '@/components/settings/APISettings';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import DataMigrationSection from '@/components/settings/DataMigrationSection';

// Tab Types
type SettingsTab = 'general' | 'organizations' | 'users' | 'permissions' | 'academic' | 'communication' | 'contracts' | 'payments' | 'backup' | 'api' | 'shortcuts' | 'migration';

// Interfaces
interface SchoolInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  taxNo: string;
  mersisNo: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'accountant' | 'registrar' | 'staff' | 'accounting';
  status: 'active' | 'inactive';
  created_at: string;
  last_login: string | null;
  permissions: {
    finance: { view: boolean; edit: boolean; delete: boolean };
    students: { view: boolean; edit: boolean; delete: boolean };
    reports: { view: boolean; edit: boolean; delete: boolean };
  };
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'past' | 'future';
}

interface PaymentTemplate {
  id: string;
  name: string;
  base_price: number;
  max_installments: number;
  description: string;
}

// Rol Yetkileri Interface - Detaylı
interface RolePermissions {
  students: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    exportExcel: boolean;
    viewContract: boolean;
    printContract: boolean;
  };
  finance: {
    viewDashboard: boolean;
    collectPayment: boolean;
    addInstallment: boolean;
    editInstallment: boolean;
    deleteInstallment: boolean;
    addExpense: boolean;
    editExpense: boolean;
    deleteExpense: boolean;
    viewCashBank: boolean;
    manageCashBank: boolean;
  };
  reports: {
    viewFinancial: boolean;
    founderReport: boolean;
    reportBuilder: boolean;
    exportPdf: boolean;
    exportExcel: boolean;
  };
  communication: {
    sendWhatsapp: boolean;
    sendSms: boolean;
    sendEmail: boolean;
    bulkMessage: boolean;
  };
  system: {
    viewSettings: boolean;
    manageUsers: boolean;
    manageAcademicYear: boolean;
    manageTemplates: boolean;
  };
}

interface RoleConfig {
  accounting: RolePermissions;
  staff: RolePermissions;
}

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  // URL parametrelerinden tab ve org al
  const tabParam = searchParams.get('tab');
  const orgParam = searchParams.get('org');
  
  // Admin kontrolü
  const { isAdmin, isSuperAdmin, role } = usePermission();
  const { currentOrganization, organizations, fetchOrganizations } = useOrganizationStore();
  
  // Super Admin için seçilen kurum
  const [selectedOrgForUser, setSelectedOrgForUser] = useState<string>('');

  // State for each section
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    taxNo: '',
    mersisNo: ''
  });

  const [users, setUsers] = useState<User[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [paymentTemplates, setPaymentTemplates] = useState<PaymentTemplate[]>([]);
  
  // Rol Yetkileri State - Detaylı varsayılan değerler
  const [rolePermissions, setRolePermissions] = useState<RoleConfig>({
    accounting: {
      students: { 
        view: true, create: false, edit: false, delete: false, 
        exportExcel: true, viewContract: true, printContract: true 
      },
      finance: { 
        viewDashboard: true, collectPayment: true, 
        addInstallment: true, editInstallment: false, deleteInstallment: false,
        addExpense: true, editExpense: false, deleteExpense: false,
        viewCashBank: true, manageCashBank: false
      },
      reports: { 
        viewFinancial: true, founderReport: false, reportBuilder: true, 
        exportPdf: true, exportExcel: true 
      },
      communication: { 
        sendWhatsapp: true, sendSms: true, sendEmail: true, bulkMessage: false 
      },
      system: { 
        viewSettings: false, manageUsers: false, manageAcademicYear: false, manageTemplates: false 
      },
    },
    staff: {
      students: { 
        view: true, create: true, edit: false, delete: false, 
        exportExcel: false, viewContract: true, printContract: true 
      },
      finance: { 
        viewDashboard: true, collectPayment: false, 
        addInstallment: false, editInstallment: false, deleteInstallment: false,
        addExpense: false, editExpense: false, deleteExpense: false,
        viewCashBank: false, manageCashBank: false
      },
      reports: { 
        viewFinancial: false, founderReport: false, reportBuilder: false, 
        exportPdf: false, exportExcel: false 
      },
      communication: { 
        sendWhatsapp: true, sendSms: false, sendEmail: true, bulkMessage: false 
      },
      system: { 
        viewSettings: false, manageUsers: false, manageAcademicYear: false, manageTemplates: false 
      },
    },
  });

  const [communicationSettings, setCommunicationSettings] = useState({
    smsEnabled: false,
    smsProvider: 'netgsm',
    smsApiKey: '',
    emailEnabled: false,
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    whatsappEnabled: false,
    whatsappApiKey: ''
  });

  const [contractTemplate, setContractTemplate] = useState('');
  const [kvkkText, setKvkkText] = useState('');

  // Edit states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User & { password: string }> | null>(null);
  const [newYear, setNewYear] = useState<Partial<AcademicYear> | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<PaymentTemplate> | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userPassword, setUserPassword] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Kişi bazlı yetki yönetimi
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [userSpecificPermissions, setUserSpecificPermissions] = useState<Record<string, Record<string, boolean>>>({});
  
  // Tüm yetkiler listesi - 100 Yetki
  const allPermissionsList = [
    // 1. Dashboard (6 yetki)
    { category: 'Dashboard', icon: '🏠', permissions: [
      { key: 'dashboard_view', label: 'Dashboard Görüntüleme', desc: 'Ana sayfa erişimi' },
      { key: 'dashboard_stats', label: 'İstatistik Kartları', desc: 'Özet bilgiler' },
      { key: 'dashboard_charts', label: 'Grafikler', desc: 'Trend grafikleri' },
      { key: 'dashboard_widgets', label: 'Widget Erişimi', desc: 'Tüm widget\'lar' },
      { key: 'dashboard_quick_actions', label: 'Hızlı İşlemler', desc: 'Kısayol butonları' },
      { key: 'dashboard_ai_insights', label: 'AI Tahminleri', desc: 'Yapay zeka önerileri' },
    ]},
    // 2. Öğrenci İşlemleri (10 yetki)
    { category: 'Öğrenci İşlemleri', icon: '👥', permissions: [
      { key: 'students_view', label: 'Öğrenci Listesi', desc: 'Tüm öğrenciler' },
      { key: 'students_detail', label: 'Öğrenci Detay', desc: 'Detay sayfası' },
      { key: 'students_create', label: 'Yeni Kayıt', desc: 'Öğrenci ekle' },
      { key: 'students_edit', label: 'Bilgi Düzenleme', desc: 'Güncelle' },
      { key: 'students_delete', label: 'Kayıt Silme', desc: 'Öğrenci sil' },
      { key: 'students_export', label: 'Excel Aktarma', desc: 'Liste indir' },
      { key: 'students_search', label: 'Gelişmiş Arama', desc: 'Filtrele/Ara' },
      { key: 'students_payment_history', label: 'Ödeme Geçmişi', desc: 'Tüm ödemeler' },
      { key: 'students_photo_upload', label: 'Fotoğraf Yükleme', desc: 'Öğrenci fotosu' },
      { key: 'students_status_change', label: 'Durum Değiştirme', desc: 'Aktif/Pasif/Mezun' },
    ]},
    // 3. Kayıt İşlemleri (8 yetki)
    { category: 'Kayıt İşlemleri', icon: '📝', permissions: [
      { key: 'enrollment_access', label: 'Kayıt Sayfası Erişimi', desc: 'Kayıt formu' },
      { key: 'enrollment_create', label: 'Yeni Kayıt Oluşturma', desc: 'Form doldur' },
      { key: 'enrollment_guardian', label: 'Veli Bilgisi Girişi', desc: 'Veli ekle' },
      { key: 'enrollment_contract', label: 'Sözleşme Oluşturma', desc: 'Sözleşme yaz' },
      { key: 'enrollment_payment_plan', label: 'Ödeme Planı', desc: 'Taksit belirle' },
      { key: 'enrollment_print', label: 'Kayıt Formu Yazdırma', desc: 'Form yazdır' },
      { key: 'enrollment_tc_verify', label: 'TC Doğrulama', desc: 'Kimlik doğrula' },
      { key: 'enrollment_discount', label: 'İndirim Uygulama', desc: 'Kayıtta indirim' },
    ]},
    // 4. Sözleşme İşlemleri (7 yetki)
    { category: 'Sözleşme İşlemleri', icon: '📄', permissions: [
      { key: 'contract_view', label: 'Sözleşme Görüntüleme', desc: 'Sözleşme oku' },
      { key: 'contract_archive', label: 'Sözleşme Arşivi', desc: 'Tüm sözleşmeler' },
      { key: 'contract_print', label: 'Sözleşme Yazdırma', desc: 'PDF/Print' },
      { key: 'contract_download', label: 'Sözleşme İndirme', desc: 'PDF indir' },
      { key: 'contract_edit_template', label: 'Şablon Düzenleme', desc: 'Şablon güncelle' },
      { key: 'contract_sign', label: 'Dijital İmza', desc: 'E-imza onay' },
      { key: 'contract_cancel', label: 'Sözleşme İptal', desc: 'Sözleşme iptali' },
    ]},
    // 5. Finans Genel (6 yetki)
    { category: 'Finans Genel', icon: '💰', permissions: [
      { key: 'finance_dashboard', label: 'Finans Dashboard', desc: 'Özet görüntüle' },
      { key: 'finance_overview', label: 'Genel Bakış', desc: 'Gelir/Gider' },
      { key: 'finance_summary', label: 'Mali Özet', desc: 'Toplam rakamlar' },
      { key: 'finance_forecast', label: 'Nakit Akış Tahmini', desc: 'Gelecek tahmin' },
      { key: 'finance_comparison', label: 'Dönem Karşılaştırma', desc: 'Yıl bazlı analiz' },
      { key: 'finance_alerts', label: 'Finansal Uyarılar', desc: 'Kritik bildirimler' },
    ]},
    // 6. Tahsilat İşlemleri (8 yetki)
    { category: 'Tahsilat İşlemleri', icon: '💳', permissions: [
      { key: 'payment_view', label: 'Tahsilat Listesi', desc: 'Tüm ödemeler' },
      { key: 'payment_collect', label: 'Ödeme Alma', desc: 'Tahsilat yap' },
      { key: 'payment_receipt', label: 'Makbuz Oluşturma', desc: 'Makbuz yazdır' },
      { key: 'payment_history', label: 'Ödeme Geçmişi', desc: 'Geçmiş kayıtlar' },
      { key: 'payment_reminder', label: 'Ödeme Hatırlatma', desc: 'Bildirim gönder' },
      { key: 'payment_refund', label: 'Para İadesi', desc: 'Geri ödeme yap' },
      { key: 'payment_pos', label: 'POS İşlemleri', desc: 'Kredi kartı tahsilat' },
      { key: 'payment_invoice', label: 'Fatura Oluşturma', desc: 'E-fatura/Fatura' },
    ]},
    // 7. Taksit İşlemleri (7 yetki)
    { category: 'Taksit İşlemleri', icon: '📅', permissions: [
      { key: 'installment_view', label: 'Taksit Listesi', desc: 'Tüm taksitler' },
      { key: 'installment_add', label: 'Taksit Ekleme', desc: 'Yeni taksit' },
      { key: 'installment_edit', label: 'Taksit Düzenleme', desc: 'Tutar değiştir' },
      { key: 'installment_delete', label: 'Taksit Silme', desc: 'Taksit kaldır' },
      { key: 'installment_postpone', label: 'Taksit Erteleme', desc: 'Tarih değiştir' },
      { key: 'installment_bulk_edit', label: 'Toplu Düzenleme', desc: 'Çoklu değişiklik' },
      { key: 'installment_restructure', label: 'Yapılandırma', desc: 'Plan değiştir' },
    ]},
    // 8. Gider İşlemleri (7 yetki)
    { category: 'Gider İşlemleri', icon: '📤', permissions: [
      { key: 'expense_view', label: 'Gider Listesi', desc: 'Tüm giderler' },
      { key: 'expense_add', label: 'Gider Ekleme', desc: 'Yeni gider' },
      { key: 'expense_edit', label: 'Gider Düzenleme', desc: 'Gider güncelle' },
      { key: 'expense_delete', label: 'Gider Silme', desc: 'Gider kaldır' },
      { key: 'expense_category', label: 'Kategori Yönetimi', desc: 'Kategori ekle' },
      { key: 'expense_approve', label: 'Gider Onaylama', desc: 'Onay ver' },
      { key: 'expense_recurring', label: 'Tekrarlı Giderler', desc: 'Sabit giderler' },
    ]},
    // 9. Kasa & Banka (8 yetki)
    { category: 'Kasa & Banka', icon: '🏦', permissions: [
      { key: 'cashbank_view', label: 'Bakiye Görüntüleme', desc: 'Güncel bakiye' },
      { key: 'cashbank_income', label: 'Gelir Ekleme', desc: 'Kasa girişi' },
      { key: 'cashbank_expense', label: 'Çıkış Ekleme', desc: 'Kasa çıkışı' },
      { key: 'cashbank_transfer', label: 'Transfer Yapma', desc: 'Hesap arası' },
      { key: 'cashbank_account_manage', label: 'Hesap Yönetimi', desc: 'Hesap ekle/sil' },
      { key: 'cashbank_history', label: 'İşlem Geçmişi', desc: 'Tüm hareketler' },
      { key: 'cashbank_reconcile', label: 'Mutabakat', desc: 'Banka mutabakatı' },
      { key: 'cashbank_daily_close', label: 'Günlük Kapanış', desc: 'Kasa kapanış' },
    ]},
    // 10. Rapor İşlemleri (10 yetki)
    { category: 'Rapor İşlemleri', icon: '📊', permissions: [
      { key: 'reports_access', label: 'Rapor Merkezi', desc: 'Rapor sayfası' },
      { key: 'reports_financial', label: 'Finansal Raporlar', desc: 'Gelir/Gider' },
      { key: 'reports_founder', label: 'Kurucu Raporu', desc: 'Detaylı analiz' },
      { key: 'reports_collection', label: 'Tahsilat Raporu', desc: 'Tahsilat detay' },
      { key: 'reports_debt', label: 'Borç Raporu', desc: 'Borçlu listesi' },
      { key: 'reports_builder', label: 'Rapor Oluşturucu', desc: 'Özel rapor' },
      { key: 'reports_export_pdf', label: 'PDF İndirme', desc: 'Rapor PDF' },
      { key: 'reports_export_excel', label: 'Excel İndirme', desc: 'Rapor Excel' },
      { key: 'reports_schedule', label: 'Zamanlanmış Rapor', desc: 'Otomatik rapor' },
      { key: 'reports_share', label: 'Rapor Paylaşma', desc: 'Email ile gönder' },
    ]},
    // 11. İletişim (7 yetki)
    { category: 'İletişim', icon: '📱', permissions: [
      { key: 'comm_whatsapp', label: 'WhatsApp Gönderme', desc: 'Mesaj gönder' },
      { key: 'comm_sms', label: 'SMS Gönderme', desc: 'SMS gönder' },
      { key: 'comm_email', label: 'Email Gönderme', desc: 'Email gönder' },
      { key: 'comm_bulk', label: 'Toplu Mesaj', desc: 'Çoklu gönderim' },
      { key: 'comm_history', label: 'İletişim Geçmişi', desc: 'Gönderim kayıtları' },
      { key: 'comm_templates', label: 'Mesaj Şablonları', desc: 'Şablon yönetimi' },
      { key: 'comm_auto_reminder', label: 'Otomatik Hatırlatma', desc: 'Zamanlanmış bildirim' },
    ]},
    // 12. Sistem Ayarları (9 yetki)
    { category: 'Sistem Ayarları', icon: '⚙️', permissions: [
      { key: 'settings_access', label: 'Ayarlar Erişimi', desc: 'Ayar sayfası' },
      { key: 'settings_general', label: 'Genel Ayarlar', desc: 'Kurum bilgileri' },
      { key: 'settings_users', label: 'Kullanıcı Yönetimi', desc: 'Kullanıcı ekle/sil' },
      { key: 'settings_roles', label: 'Rol Yetkileri', desc: 'Yetki ata' },
      { key: 'settings_academic', label: 'Akademik Yıl', desc: 'Dönem ayarları' },
      { key: 'settings_communication', label: 'İletişim Ayarları', desc: 'SMS/Email/WhatsApp' },
      { key: 'settings_contract_template', label: 'Sözleşme Şablonu', desc: 'Şablon düzenle' },
      { key: 'settings_payment_template', label: 'Ödeme Şablonu', desc: 'Ücret şablonları' },
      { key: 'settings_backup', label: 'Yedekleme', desc: 'Veri yedekle' },
    ]},
    // 13. Akademik (7 yetki) - YENİ
    { category: 'Akademik', icon: '🎓', permissions: [
      { key: 'academic_schedule', label: 'Ders Programı', desc: 'Program görüntüle' },
      { key: 'academic_schedule_edit', label: 'Program Düzenleme', desc: 'Program değiştir' },
      { key: 'academic_exams', label: 'Sınav Sonuçları', desc: 'Not görüntüle' },
      { key: 'academic_exams_edit', label: 'Not Girişi', desc: 'Not düzenle' },
      { key: 'academic_attendance', label: 'Devamsızlık Takibi', desc: 'Yoklama görüntüle' },
      { key: 'academic_attendance_mark', label: 'Yoklama İşaretleme', desc: 'Yoklama al' },
      { key: 'academic_certificates', label: 'Belgeler', desc: 'Diploma/Sertifika' },
    ]},
    // 14. Personel/İK (6 yetki) - YENİ
    { category: 'Personel/İK', icon: '👔', permissions: [
      { key: 'hr_view', label: 'Personel Listesi', desc: 'Çalışan görüntüle' },
      { key: 'hr_create', label: 'Personel Ekleme', desc: 'Yeni çalışan' },
      { key: 'hr_edit', label: 'Personel Düzenleme', desc: 'Bilgi güncelle' },
      { key: 'hr_salary', label: 'Maaş Bilgileri', desc: 'Bordro görüntüle' },
      { key: 'hr_leave', label: 'İzin Yönetimi', desc: 'İzin takibi' },
      { key: 'hr_documents', label: 'Özlük Dosyaları', desc: 'Belgeler' },
    ]},
    // 15. Güvenlik/Log (5 yetki) - YENİ
    { category: 'Güvenlik & Log', icon: '🔒', permissions: [
      { key: 'security_logs', label: 'Aktivite Logları', desc: 'Sistem logları' },
      { key: 'security_login_history', label: 'Giriş Geçmişi', desc: 'Kullanıcı girişleri' },
      { key: 'security_audit', label: 'Denetim Raporu', desc: 'İşlem denetimi' },
      { key: 'security_sessions', label: 'Oturum Yönetimi', desc: 'Aktif oturumlar' },
      { key: 'security_ip_restrict', label: 'IP Kısıtlama', desc: 'Erişim kontrolü' },
    ]},
  ];
  
  // Toplam yetki sayısı hesaplama
  const totalPermissionsCount = allPermissionsList.reduce((acc, cat) => acc + cat.permissions.length, 0);

  // Rol tanımları - sistem genelinde tutarlı
  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    accounting: 'Muhasebe',
    staff: 'Personel'
  };

  const roleDescriptions: Record<string, string> = {
    admin: 'Tüm yetkilere sahip. Sistem ayarları, kullanıcı yönetimi, silme/düzenleme işlemleri.',
    accounting: 'Finansal işlemler, tahsilat, gider yönetimi, raporlama.',
    staff: 'Öğrenci kaydı, sözleşme işlemleri, temel görüntüleme.'
  };

  const roleColors: Record<string, string> = {
    admin: 'from-purple-500 to-violet-600',
    accounting: 'from-emerald-500 to-teal-600',
    staff: 'from-blue-500 to-indigo-600'
  };

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    accounting: 'bg-emerald-100 text-emerald-700',
    staff: 'bg-blue-100 text-blue-700'
  };

  const defaultPermissions: Record<string, User['permissions']> = {
    admin: {
      finance: { view: true, edit: true, delete: true },
      students: { view: true, edit: true, delete: true },
      reports: { view: true, edit: true, delete: true },
    },
    // Yeni isimler
    accounting: {
      finance: { view: true, edit: true, delete: false },
      students: { view: true, edit: false, delete: false },
      reports: { view: true, edit: false, delete: false },
    },
    staff: {
      finance: { view: true, edit: false, delete: false },
      students: { view: true, edit: true, delete: false },
      reports: { view: true, edit: false, delete: false },
    },
    // Eski isimler (geriye uyumluluk)
    accountant: {
      finance: { view: true, edit: true, delete: false },
      students: { view: true, edit: false, delete: false },
      reports: { view: true, edit: false, delete: false },
    },
    registrar: {
      finance: { view: true, edit: false, delete: false },
      students: { view: true, edit: true, delete: false },
      reports: { view: true, edit: false, delete: false },
    },
  };

  // URL parametrelerinden tab ve org ayarla
  useEffect(() => {
    if (tabParam && ['general', 'organizations', 'users', 'permissions', 'academic', 'communication', 'contracts', 'payments', 'backup', 'api', 'shortcuts'].includes(tabParam)) {
      setActiveTab(tabParam as SettingsTab);
    }
    if (orgParam) {
      setSelectedOrgForUser(orgParam);
    }
  }, [tabParam, orgParam]);

  // Verileri yükle
  useEffect(() => {
    setIsClient(true);
    loadAllData();
    
    // Super Admin için kurumları yükle
    if (isSuperAdmin && organizations.length === 0) {
      fetchOrganizations();
    }
    
    // Kayıtlı rol yetkilerini yükle
    if (typeof window !== 'undefined') {
      const savedPermissions = localStorage.getItem('akademi_role_permissions');
      if (savedPermissions) {
        try {
          const parsed = JSON.parse(savedPermissions);
          setRolePermissions(parsed);
        } catch (e) {
          console.log('Saved role permissions could not be parsed');
        }
      }
    }
  }, []);

  // currentOrganization değiştiğinde kullanıcıları yeniden yükle
  useEffect(() => {
    if (currentOrganization?.id || isSuperAdmin) {
      loadUsers();
    }
  }, [currentOrganization?.id, isSuperAdmin]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // localStorage'dan senkron yükle
      loadUsers();
      
      // API'den async yükle
      await Promise.all([
        loadSettings(),
        loadAcademicYears(),
        loadPaymentTemplates()
      ]);
    } catch (error) {
      console.error('Data load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSchoolInfo(data.data.school || schoolInfo);
        setContractTemplate(data.data.contractTemplate || '');
        setKvkkText(data.data.kvkkText || '');
      }
    } catch (error) {
      console.error('Settings load error:', error);
    }
  };

  // Supabase tabanlı kullanıcı yönetimi (Rol bazlı filtreleme)
  const loadUsers = async () => {
    try {
      // Franchise Yöneticisi TÜM kullanıcıları görür
      // Kurum Admin SADECE kendi kurumundaki kullanıcıları görür
      const params = new URLSearchParams();
      
      if (isSuperAdmin) {
        params.append('is_super_admin', 'true');
      } else {
        // Önce currentOrganization'dan, yoksa localStorage'dan organization_id al
        const orgId = currentOrganization?.id;
        if (!orgId) {
          // currentOrganization henüz yüklenmemişse localStorage'dan user'ın organization_id'sini al
          try {
            const savedUser = localStorage.getItem('akademi_current_user');
            if (savedUser) {
              const userData = JSON.parse(savedUser);
              if (userData.organization_id) {
                params.append('organization_id', userData.organization_id);
              }
            }
          } catch {
            console.log('User organization lookup failed');
          }
        } else {
          params.append('organization_id', orgId);
        }
      }
      
      const res = await fetch(`/api/settings/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        if (data.message) {
          console.log('Users API message:', data.message);
        }
      } else {
        console.error('Users load error:', data.error);
        setUsers([]);
      }
    } catch (error) {
      console.error('Users load error:', error);
      setUsers([]);
    }
  };

  const loadAcademicYears = async () => {
    try {
      const res = await fetch('/api/academic-years');
      const data = await res.json();
      if (data.success) {
        setAcademicYears(data.data || []);
      }
    } catch (error) {
      console.error('Academic years load error:', error);
    }
  };

  const loadPaymentTemplates = async () => {
    try {
      const res = await fetch('/api/settings/payment-templates');
      const data = await res.json();
      if (data.success) {
        setPaymentTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Payment templates load error:', error);
    }
  };

  // Logo yükleme
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setSchoolInfo({ ...schoolInfo, logo: data.data.url });
        toast.success('Logo yüklendi!');
      } else {
        toast.error(data.error || 'Logo yüklenemedi');
      }
    } catch (error) {
      toast.error('Logo yükleme hatası');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Kullanıcı yetki değişikliği handler
  const handleUserPermissionChange = (
    module: 'finance' | 'students' | 'reports',
    permission: 'view' | 'edit' | 'delete',
    value: boolean
  ) => {
    if (!selectedUser) return;
    
    const updatedPermissions = {
      ...selectedUser.permissions,
      [module]: {
        ...selectedUser.permissions?.[module],
        [permission]: value
      }
    };
    
    // selectedUser'ı güncelle
    setSelectedUser({
      ...selectedUser,
      permissions: updatedPermissions
    });
    
    // users listesini de güncelle
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, permissions: updatedPermissions }
        : u
    ));
  };

  // Kullanıcı yetkilerini kaydet
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch('/api/settings/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          permissions: selectedUser.permissions
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`${selectedUser.name} yetkileri güncellendi!`);
      } else {
        toast.error(data.error || 'Yetki kaydetme hatası');
      }
    } catch (error) {
      toast.error('Yetki kaydetme hatası');
    }
  };

  // Genel ayarları kaydet
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Genel ayarları kaydet
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school: schoolInfo,
          contractTemplate,
          kvkkText
        })
      });

      const data = await res.json();
      
      // 2. Rol yetkilerini localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('akademi_role_permissions', JSON.stringify(rolePermissions));
        
        // 3. Dinamik olarak ROLE_PERMISSIONS'ı güncelle (runtime)
        try {
          const { updateRolePermissions } = await import('@/lib/types/role-types');
          updateRolePermissions('accounting', rolePermissions.accounting);
          updateRolePermissions('staff', rolePermissions.staff);
        } catch (e) {
          console.log('Role permissions updated in localStorage only');
        }
      }
      
      // 4. Seçili kullanıcının yetkilerini kaydet
      if (selectedUser) {
        await handleSaveUserPermissions();
      }
      
      if (data.success) {
        toast.success('Tüm ayarlar ve yetkiler kaydedildi!');
      } else {
        toast.error(data.error || 'Kaydetme hatası');
      }
    } catch (error) {
      toast.error('Kaydetme hatası');
    } finally {
      setIsSaving(false);
    }
  };

  // Kullanıcı işlemleri
  const handleAddUser = async () => {
    if (!newUser?.name || !newUser?.email) {
      toast.error('Ad ve email zorunlu');
      return;
    }

    if (!userPassword) {
      toast.error('Şifre zorunlu');
      return;
    }

    // Email kontrolü
    if (users.some(u => u.email === newUser.email)) {
      toast.error('Bu email zaten kayıtlı');
      return;
    }

    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email.toLowerCase().trim(),
          phone: newUser.phone || '',
          role: newUser.role || 'registrar',
          password: userPassword,
          organization_id: isSuperAdmin ? (selectedOrgForUser || null) : currentOrganization?.id, // Kurum ataması
        }),
      });

      const data = await res.json();
      
      if (!data.success) {
        toast.error(data.error || 'Kullanıcı eklenemedi');
        return;
      }

      // Listeyi yeniden yükle
      await loadUsers();
      setNewUser(null);
      setUserPassword('');
      toast.success('Kullanıcı eklendi - Artık giriş yapabilir!');
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Kullanıcı eklenirken hata oluştu');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: Record<string, unknown> = {
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        status: editingUser.status,
      };

      // Şifre değiştirilmişse ekle
      if (userPassword) {
        updateData.password = userPassword;
      }

      const res = await fetch('/api/settings/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      
      if (!data.success) {
        toast.error(data.error || 'Kullanıcı güncellenemedi');
        return;
      }

      // Listeyi yeniden yükle
      await loadUsers();
      setEditingUser(null);
      setSelectedUser(null);
      setUserPassword('');
      toast.success('Kullanıcı güncellendi');
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Kullanıcı güncellenirken hata oluştu');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/settings/users?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      
      if (!data.success) {
        toast.error(data.error || 'Kullanıcı silinemedi');
        return;
      }

      // Listeyi yeniden yükle
      await loadUsers();
      setSelectedUser(null);
      toast.success('Kullanıcı silindi');
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    }
  };

  // Akademik yıl işlemleri
  const handleAddYear = async () => {
    if (!newYear?.name || !newYear?.start_date || !newYear?.end_date) {
      toast.error('Tüm alanlar zorunlu');
      return;
    }

    try {
      const res = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newYear)
      });

      const data = await res.json();
      if (data.success) {
        await loadAcademicYears();
        setNewYear(null);
        toast.success('Akademik yıl eklendi');
      } else {
        toast.error(data.error || 'Ekleme hatası');
      }
    } catch (error) {
      toast.error('Ekleme hatası');
    }
  };

  const handleSetActiveYear = async (id: string) => {
    try {
      const res = await fetch(`/api/academic-years?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true, status: 'active' })
      });

      const data = await res.json();
      if (data.success) {
        await loadAcademicYears();
        toast.success('Aktif dönem değiştirildi');
      } else {
        toast.error(data.error || 'Güncelleme hatası');
      }
    } catch (error) {
      toast.error('Güncelleme hatası');
    }
  };

  const handleDeleteYear = async (id: string, status: string) => {
    if (status === 'active') {
      toast.error('Aktif dönem silinemez');
      return;
    }
    if (!confirm('Bu dönemi silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/academic-years?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        await loadAcademicYears();
        toast.success('Dönem silindi');
      }
    } catch (error) {
      toast.error('Silme hatası');
    }
  };

  // Ödeme şablonu işlemleri
  const handleAddTemplate = async () => {
    if (!newTemplate?.name || !newTemplate?.base_price) {
      toast.error('Ad ve fiyat zorunlu');
      return;
    }

    try {
      const res = await fetch('/api/settings/payment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplate.name,
          basePrice: newTemplate.base_price,
          maxInstallments: newTemplate.max_installments || 10,
          description: newTemplate.description
        })
      });

      const data = await res.json();
      if (data.success) {
        await loadPaymentTemplates();
        setNewTemplate(null);
        toast.success('Şablon eklendi');
      }
    } catch (error) {
      toast.error('Ekleme hatası');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/settings/payment-templates?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        await loadPaymentTemplates();
        toast.success('Şablon silindi');
      }
    } catch (error) {
      toast.error('Silme hatası');
    }
  };

  const tabs = [
    { id: 'general', label: 'Genel Ayarlar', icon: Building2, description: 'Okul bilgileri ve logo' },
    { id: 'organizations', label: 'Kurum Yönetimi', icon: Globe, description: 'Çoklu kurum/şube' },
    { id: 'users', label: 'Kullanıcı Yönetimi', icon: Users, description: 'Kullanıcılar ve roller' },
    { id: 'permissions', label: 'Rol Yetkileri', icon: Shield, description: 'Rol bazlı erişim kontrolü' },
    { id: 'academic', label: 'Akademik Yıllar', icon: Calendar, description: 'Eğitim dönemleri' },
    { id: 'communication', label: 'İletişim Ayarları', icon: Mail, description: 'SMS, Email, WhatsApp' },
    { id: 'contracts', label: 'Sözleşme Şablonları', icon: FileText, description: 'KVKK ve kayıt sözleşmesi' },
    { id: 'payments', label: 'Ödeme Şablonları', icon: CreditCard, description: 'Program ücretleri' },
    { id: 'api', label: 'API Ayarları', icon: Server, description: 'SMS, E-posta provider' },
    { id: 'backup', label: 'Yedekleme', icon: Database, description: 'Veri yedekleme ve geri yükleme' },
    { id: 'migration', label: 'Veri Aktarımı', icon: Upload, description: 'Geçmiş yıllardan veri aktarımı' },
    { id: 'shortcuts', label: 'Klavye Kısayolları', icon: Keyboard, description: 'Hızlı erişim tuşları' },
  ];
  
  // Klavye kısayolları hook
  const { shortcuts, showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts();

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Admin değilse erişimi reddet
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-6">
            Ayarlar sayfası yalnızca <span className="font-semibold text-red-600">Admin</span> kullanıcılar tarafından görüntülenebilir.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Settings className="text-white h-6 w-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900">Sistem Ayarları</h1>
                <p className="text-sm text-slate-500">Tüm sistem konfigürasyonları</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Sidebar Tabs */}
            <div className="w-72 flex-shrink-0">
              <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all border-l-4 ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                          : 'border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-indigo-100' : 'bg-slate-100'
                      }`}>
                        <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{tab.label}</p>
                        <p className="text-xs text-slate-500 truncate">{tab.description}</p>
                      </div>
                      <ChevronRight size={16} className={isActive ? 'text-indigo-400' : 'text-slate-300'} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                
                {/* GENEL AYARLAR */}
                {activeTab === 'general' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                      <h2 className="text-xl font-bold text-slate-900">Kurum Bilgileri</h2>
                    </div>

                    {/* Logo Upload */}
                    <div className="flex items-start gap-6">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        ) : schoolInfo.logo ? (
                          <img src={schoolInfo.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <span className="text-xs text-slate-500">Logo Yükle</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kurum Adı</label>
                          <input
                            type="text"
                            value={schoolInfo.name}
                            onChange={(e) => setSchoolInfo({...schoolInfo, name: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adres</label>
                          <textarea
                            value={schoolInfo.address}
                            onChange={(e) => setSchoolInfo({...schoolInfo, address: e.target.value})}
                            rows={2}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon</label>
                        <input
                          type="text"
                          value={schoolInfo.phone}
                          onChange={(e) => setSchoolInfo({...schoolInfo, phone: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-posta</label>
                        <input
                          type="email"
                          value={schoolInfo.email}
                          onChange={(e) => setSchoolInfo({...schoolInfo, email: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website</label>
                        <input
                          type="text"
                          value={schoolInfo.website}
                          onChange={(e) => setSchoolInfo({...schoolInfo, website: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vergi No</label>
                        <input
                          type="text"
                          value={schoolInfo.taxNo}
                          onChange={(e) => setSchoolInfo({...schoolInfo, taxNo: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* KURUM YÖNETİMİ */}
                {activeTab === 'organizations' && (
                  <OrganizationSettings />
                )}

                {/* KULLANICI YÖNETİMİ */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">Kullanıcı Yönetimi</h2>
                      </div>
                      <button
                        onClick={() => setNewUser({ name: '', email: '', role: 'registrar', status: 'active', password: '' })}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <Plus size={16} />
                        Yeni Kullanıcı
                      </button>
                    </div>

                    {/* New User Form - Geliştirilmiş */}
                    {newUser && (
                      <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-indigo-900 text-lg">Yeni Kullanıcı Ekle</h3>
                          <button
                            onClick={() => { setNewUser(null); setUserPassword(''); }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad *</label>
                            <input
                              type="text"
                              placeholder="Örn: Ahmet Yılmaz"
                              value={newUser.name || ''}
                              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta *</label>
                            <input
                              type="email"
                              placeholder="ornek@akademihub.com"
                              value={newUser.email || ''}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input
                              type="text"
                              placeholder="05XX XXX XX XX"
                              value={newUser.phone || ''}
                              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                          
                          {/* Super Admin için Kurum Seçimi */}
                          {isSuperAdmin && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Kurum Ataması *</label>
                              <select
                                value={selectedOrgForUser}
                                onChange={(e) => setSelectedOrgForUser(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              >
                                <option value="">-- Kurum Seçin --</option>
                                {organizations.map(org => (
                                  <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                              </select>
                              <p className="text-xs text-slate-500 mt-1">Bu kullanıcı hangi kuruma ait olacak?</p>
                            </div>
                          )}
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre *</label>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="En az 8 karakter, büyük/küçük harf, rakam"
                              value={userPassword}
                              onChange={(e) => setUserPassword(e.target.value)}
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white pr-10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            {/* Şifre Gücü Göstergesi */}
                            {userPassword && (
                              <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                  <div className={`h-1 flex-1 rounded ${userPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(userPassword) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                  <div className={`h-1 flex-1 rounded ${/[a-z]/.test(userPassword) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                  <div className={`h-1 flex-1 rounded ${/[0-9]/.test(userPassword) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                </div>
                                <p className="text-xs text-slate-500">
                                  {userPassword.length < 8 && '• En az 8 karakter '}
                                  {!/[A-Z]/.test(userPassword) && '• Büyük harf '}
                                  {!/[a-z]/.test(userPassword) && '• Küçük harf '}
                                  {!/[0-9]/.test(userPassword) && '• Rakam '}
                                </p>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Rol Seçimi - Geliştirilmiş */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">Rol Seçimi *</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Admin */}
                            <label 
                              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                newUser.role === 'admin' 
                                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                                  : 'border-slate-200 bg-white hover:border-purple-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="role"
                                value="admin"
                                checked={newUser.role === 'admin'}
                                onChange={(e) => setNewUser({...newUser, role: 'admin'})}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                                  <Shield size={20} className="text-white" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900">Admin</span>
                                  <span className="block text-xs text-purple-600">Tam Yetki</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">Tüm sistem işlemleri, kullanıcı yönetimi, ayarlar</p>
                              {newUser.role === 'admin' && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                  <Check size={12} className="text-white" />
                                </div>
                              )}
                            </label>

                            {/* Muhasebe */}
                            <label 
                              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                newUser.role === 'accounting' 
                                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                                  : 'border-slate-200 bg-white hover:border-emerald-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="role"
                                value="accounting"
                                checked={newUser.role === 'accounting'}
                                onChange={(e) => setNewUser({...newUser, role: 'accounting'})}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                  <CreditCard size={20} className="text-white" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900">Muhasebe</span>
                                  <span className="block text-xs text-emerald-600">Finans Odaklı</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">Tahsilat, gider, kasa işlemleri, raporlar</p>
                              {newUser.role === 'accounting' && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <Check size={12} className="text-white" />
                                </div>
                              )}
                            </label>

                            {/* Personel */}
                            <label 
                              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                (newUser.role === 'staff' || newUser.role === 'registrar' || !newUser.role) 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-slate-200 bg-white hover:border-blue-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="role"
                                value="staff"
                                checked={newUser.role === 'staff' || newUser.role === 'registrar' || !newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: 'staff'})}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <Users size={20} className="text-white" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900">Personel</span>
                                  <span className="block text-xs text-blue-600">Kayıt Odaklı</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500">Öğrenci kaydı, sözleşme, temel işlemler</p>
                              {(newUser.role === 'staff' || newUser.role === 'registrar' || !newUser.role) && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check size={12} className="text-white" />
                                </div>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Yetki Önizleme */}
                        <div className="p-4 bg-white/60 rounded-lg border border-slate-200">
                          <p className="text-xs font-medium text-slate-500 mb-2">SEÇİLİ ROL YETKİLERİ</p>
                          <div className="flex flex-wrap gap-2">
                            {newUser.role === 'admin' && (
                              <>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">✓ Tüm İşlemler</span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">✓ Kullanıcı Yönetimi</span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">✓ Sistem Ayarları</span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">✓ Silme/Düzenleme</span>
                              </>
                            )}
                            {newUser.role === 'accounting' && (
                              <>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ Öğrenci Görüntüleme</span>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ Tahsilat</span>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ Gider Ekleme</span>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ Raporlar</span>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ Excel/PDF</span>
                              </>
                            )}
                            {(newUser.role === 'staff' || newUser.role === 'registrar' || !newUser.role) && (
                              <>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">✓ Öğrenci Görüntüleme</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">✓ Kayıt Ekleme</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">✓ Sözleşme</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">✓ WhatsApp/Email</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Ekle Butonu */}
                        <button
                          onClick={handleAddUser}
                          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                          <Check size={18} /> Kullanıcı Ekle
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Users List */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                          Kullanıcılar ({users.length})
                        </h3>
                        {users.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
                            Henüz kullanıcı yok
                          </div>
                        ) : (
                          users.map((user) => (
                            <div 
                              key={user.id} 
                              onClick={() => { setSelectedUser(user); setEditingUser(null); }}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedUser?.id === user.id 
                                  ? 'bg-indigo-50 border-indigo-300 shadow-md' 
                                  : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                                    user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                                    (user.role === 'accounting' || user.role === 'accountant') ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                    'bg-gradient-to-br from-blue-500 to-cyan-600'
                                  }`}>
                                    {user.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    (user.role === 'accounting' || user.role === 'accountant') ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {roleLabels[user.role] || (user.role === 'accountant' ? 'Muhasebe' : user.role === 'registrar' ? 'Personel' : user.role)}
                                  </span>
                                  <span className={`w-2 h-2 rounded-full ${
                                    user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* User Detail & Edit */}
                      <div className="space-y-4">
                        {selectedUser ? (
                          editingUser ? (
                            // Edit Mode
                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">Kullanıcı Düzenle</h3>
                                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                                  <X size={20} />
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  placeholder="Ad Soyad"
                                  value={editingUser.name}
                                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                                />
                                <input
                                  type="email"
                                  placeholder="E-posta"
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Telefon"
                                  value={editingUser.phone || ''}
                                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <select
                                    value={editingUser.role === 'accountant' ? 'accounting' : editingUser.role === 'registrar' ? 'staff' : editingUser.role}
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as User['role'], permissions: defaultPermissions[e.target.value]})}
                                    className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="accounting">Muhasebe</option>
                                    <option value="staff">Personel</option>
                                  </select>
                                  <select
                                    value={editingUser.status}
                                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value as 'active' | 'inactive'})}
                                    className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                                  >
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Pasif</option>
                                  </select>
                                </div>
                                
                                {/* Şifre Değiştirme */}
                                <div className="pt-3 border-t border-slate-100">
                                  <label className="text-sm font-medium text-slate-700 mb-1 block">Yeni Şifre (değiştirmek için)</label>
                                  <div className="relative">
                                    <input
                                      type={showPassword ? 'text' : 'password'}
                                      placeholder="Boş bırakılırsa değişmez"
                                      value={userPassword}
                                      onChange={(e) => setUserPassword(e.target.value)}
                                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={handleUpdateUser}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                                  >
                                    Kaydet
                                  </button>
                                  <button
                                    onClick={() => { setEditingUser(null); setUserPassword(''); }}
                                    className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm"
                                  >
                                    İptal
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <>
                              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl ${
                                      selectedUser.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                                      (selectedUser.role === 'accounting' || selectedUser.role === 'accountant') ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                      'bg-gradient-to-br from-blue-500 to-cyan-600'
                                    }`}>
                                      {selectedUser.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                                      <p className="text-sm text-slate-500">{roleLabels[selectedUser.role] || (selectedUser.role === 'accountant' ? 'Muhasebe' : selectedUser.role === 'registrar' ? 'Personel' : selectedUser.role)}</p>
                                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                        selectedUser.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {selectedUser.status === 'active' ? 'Aktif' : 'Pasif'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setEditingUser(selectedUser)}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(selectedUser.id)}
                                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-slate-500 text-xs mb-0.5">E-posta</p>
                                    <p className="font-medium text-slate-800">{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 text-xs mb-0.5">Telefon</p>
                                    <p className="font-medium text-slate-800">{selectedUser.phone || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 text-xs mb-0.5">Kayıt Tarihi</p>
                                    <p className="font-medium text-slate-800">
                                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('tr-TR') : '-'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 text-xs mb-0.5">Son Giriş</p>
                                    <p className="font-medium text-slate-800">
                                      {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('tr-TR') : '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Permission Matrix */}
                              <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <Shield className="w-5 h-5 text-indigo-600" />
                                  <h3 className="font-bold text-slate-900">Yetki Matrisi</h3>
                                </div>
                                
                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-slate-50">
                                        <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Modül</th>
                                        <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Görüntüle</th>
                                        <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Düzenle</th>
                                        <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Sil</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      <tr>
                                        <td className="py-2.5 px-3 font-medium text-slate-700">💰 Finans</td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.finance?.view || false} 
                                            onChange={(e) => handleUserPermissionChange('finance', 'view', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.finance?.edit || false} 
                                            onChange={(e) => handleUserPermissionChange('finance', 'edit', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.finance?.delete || false} 
                                            onChange={(e) => handleUserPermissionChange('finance', 'delete', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="py-2.5 px-3 font-medium text-slate-700">👥 Öğrenciler</td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.students?.view || false} 
                                            onChange={(e) => handleUserPermissionChange('students', 'view', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.students?.edit || false} 
                                            onChange={(e) => handleUserPermissionChange('students', 'edit', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.students?.delete || false} 
                                            onChange={(e) => handleUserPermissionChange('students', 'delete', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="py-2.5 px-3 font-medium text-slate-700">📊 Raporlar</td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.reports?.view || false} 
                                            onChange={(e) => handleUserPermissionChange('reports', 'view', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.reports?.edit || false} 
                                            onChange={(e) => handleUserPermissionChange('reports', 'edit', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedUser.permissions?.reports?.delete || false} 
                                            onChange={(e) => handleUserPermissionChange('reports', 'delete', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer focus:ring-indigo-500" 
                                          />
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                
                                {/* Yetkileri Kaydet Butonu */}
                                <div className="mt-4 flex justify-end">
                                  <button
                                    onClick={handleSaveUserPermissions}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
                                  >
                                    <Save size={16} />
                                    Yetkileri Kaydet
                                  </button>
                                </div>
                              </div>
                            </>
                          )
                        ) : (
                          <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-12">
                            <div className="text-center">
                              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-slate-500 font-medium">Kullanıcı seçin</p>
                              <p className="text-sm text-slate-400">Detayları görüntülemek için sol listeden bir kullanıcı seçin</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ROL YETKİLERİ - DETAYLI */}
                {activeTab === 'permissions' && (
                  <div className="space-y-6">
                    {/* Başlık */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">Kişi Bazlı Yetki Yönetimi</h2>
                          <p className="text-sm text-slate-500">Kullanıcıları seçin ve yetkilerini tek tek yönetin</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (selectedUserForPermissions && userSpecificPermissions[selectedUserForPermissions.id]) {
                            try {
                              // Supabase'e kaydet
                              const response = await fetch('/api/settings/users', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: selectedUserForPermissions.id,
                                  permissions: userSpecificPermissions[selectedUserForPermissions.id]
                                })
                              });
                              const result = await response.json();
                              if (result.success) {
                                toast.success(`${selectedUserForPermissions.name} için yetkiler kaydedildi!`);
                                // Sayfayı yenile
                                window.location.reload();
                              } else {
                                toast.error(result.error || 'Kayıt başarısız');
                              }
                            } catch (error) {
                              toast.error('Bir hata oluştu');
                            }
                          } else {
                            toast.error('Lütfen bir kullanıcı seçin');
                          }
                        }}
                        disabled={!selectedUserForPermissions}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Save size={16} />
                        Yetkileri Kaydet
                      </button>
                    </div>

                    {/* Bilgi Notu */}
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-amber-800">
                        <strong>💡 Nasıl Çalışır:</strong> Sol taraftan bir kullanıcı seçin. Sağ tarafta o kullanıcıya ait tüm yetkiler görünecek. 
                        İstediğiniz yetkileri açıp kapatın ve kaydedin. Admin kullanıcıları tüm yetkilere sahiptir.
                      </p>
                    </div>

                    {/* Ana İçerik - İki Sütun */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Sol Sütun - Kullanıcı Listesi */}
                      <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                            <h3 className="font-bold text-white flex items-center gap-2">
                              <Users size={18} /> Kullanıcılar ({users.length})
                            </h3>
                          </div>
                          
                          <div className="max-h-[600px] overflow-y-auto">
                            {users.length === 0 ? (
                              <div className="p-8 text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Henüz kullanıcı yok</p>
                                <p className="text-sm text-slate-400">Kullanıcı Yönetimi&apos;nden kullanıcı ekleyin</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {users.map((user) => {
                                  const isSelected = selectedUserForPermissions?.id === user.id;
                                  const isAdmin = user.role === 'admin';
                                  return (
                                    <button
                                      key={user.id}
                                      onClick={() => {
                                        setSelectedUserForPermissions(user);
                                        // Kullanıcının Supabase'deki yetkilerini yükle
                                        if (user.permissions && typeof user.permissions === 'object') {
                                          // Nested permissions objesini flat hale getir
                                          const flatPerms: Record<string, boolean> = {};
                                          const perms = user.permissions as Record<string, unknown>;
                                          Object.entries(perms).forEach(([category, catPerms]) => {
                                            if (typeof catPerms === 'object' && catPerms !== null) {
                                              Object.entries(catPerms as Record<string, boolean>).forEach(([key, val]) => {
                                                flatPerms[`${category}.${key}`] = Boolean(val);
                                              });
                                            } else if (typeof catPerms === 'boolean') {
                                              flatPerms[category] = catPerms;
                                            }
                                          });
                                          setUserSpecificPermissions(prev => ({
                                            ...prev,
                                            [user.id]: flatPerms
                                          }));
                                        } else if (!userSpecificPermissions[user.id]) {
                                          // Varsayılan yetkiler
                                          const defaultPerms: Record<string, boolean> = {};
                                          allPermissionsList.forEach(cat => {
                                            cat.permissions.forEach(p => {
                                              defaultPerms[p.key] = isAdmin;
                                            });
                                          });
                                          setUserSpecificPermissions(prev => ({
                                            ...prev,
                                            [user.id]: defaultPerms
                                          }));
                                        }
                                      }}
                                      className={`w-full p-4 text-left transition-all ${
                                        isSelected 
                                          ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                                          : 'hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                                          user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                                          (user.role === 'accounting' || user.role === 'accountant') ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                          'bg-gradient-to-br from-blue-500 to-indigo-600'
                                        }`}>
                                          {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            (user.role === 'accounting' || user.role === 'accountant') ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-blue-100 text-blue-700'
                                          }`}>
                                            {user.role === 'admin' ? 'Admin' : 
                                             (user.role === 'accounting' || user.role === 'accountant') ? 'Muhasebe' : 'Personel'}
                                          </span>
                                          {isAdmin && (
                                            <span className="text-[10px] text-purple-500">Tam Yetki</span>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sağ Sütun - Yetki Listesi */}
                      <div className="lg:col-span-2">
                        {!selectedUserForPermissions ? (
                          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-600 mb-2">Kullanıcı Seçin</h3>
                            <p className="text-slate-400">Sol listeden bir kullanıcı seçerek yetkilerini yönetebilirsiniz</p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Seçili Kullanıcı Başlığı */}
                            <div className={`px-5 py-4 flex items-center justify-between ${
                              selectedUserForPermissions.role === 'admin' 
                                ? 'bg-gradient-to-r from-purple-600 to-violet-600' 
                                : (selectedUserForPermissions.role === 'accounting' || selectedUserForPermissions.role === 'accountant')
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold">
                                  {selectedUserForPermissions.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-bold text-white text-lg">{selectedUserForPermissions.name}</h3>
                                  <p className="text-white/70 text-sm">{selectedUserForPermissions.email}</p>
                                </div>
                              </div>
                              {selectedUserForPermissions.role === 'admin' && (
                                <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                                  🔓 Tüm Yetkiler Aktif
                                </span>
                              )}
                            </div>

                            {/* Yetkiler */}
                            <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                              {selectedUserForPermissions.role === 'admin' ? (
                                <div className="text-center py-8">
                                  <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Admin Kullanıcısı</h3>
                                  <p className="text-slate-500">Bu kullanıcı tüm yetkilere sahiptir ve değiştirilemez.</p>
                                </div>
                              ) : (
                                <>
                                  {/* Genel Tümünü Aç/Kapat */}
                                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">🔐</span>
                                      <span className="font-bold text-indigo-800">TÜM YETKİLER</span>
                                      <span className="text-xs text-indigo-600 bg-indigo-200 px-2 py-0.5 rounded-full">
                                        {Object.values(userSpecificPermissions[selectedUserForPermissions.id] || {}).filter(Boolean).length} / {allPermissionsList.reduce((acc, cat) => acc + cat.permissions.length, 0)}
                                      </span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <span className="text-sm text-indigo-700">Tümünü Seç</span>
                                      <input
                                        type="checkbox"
                                        checked={
                                          allPermissionsList.every(cat => 
                                            cat.permissions.every(p => 
                                              userSpecificPermissions[selectedUserForPermissions.id]?.[p.key] === true
                                            )
                                          )
                                        }
                                        onChange={(e) => {
                                          const allPerms: Record<string, boolean> = {};
                                          allPermissionsList.forEach(cat => {
                                            cat.permissions.forEach(p => {
                                              allPerms[p.key] = e.target.checked;
                                            });
                                          });
                                          setUserSpecificPermissions(prev => ({
                                            ...prev,
                                            [selectedUserForPermissions.id]: allPerms
                                          }));
                                        }}
                                        className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                    </label>
                                  </div>

                                  {/* Kategoriler */}
                                  {allPermissionsList.map((category) => {
                                    // Kategorideki tüm yetkiler aktif mi?
                                    const categoryAllChecked = category.permissions.every(
                                      p => userSpecificPermissions[selectedUserForPermissions.id]?.[p.key] === true
                                    );
                                    // Kategorideki aktif yetki sayısı
                                    const categoryCheckedCount = category.permissions.filter(
                                      p => userSpecificPermissions[selectedUserForPermissions.id]?.[p.key] === true
                                    ).length;

                                    return (
                                      <div key={category.category} className={`rounded-xl overflow-hidden border-2 transition-all ${
                                        categoryAllChecked 
                                          ? 'border-emerald-400 bg-emerald-50/50' 
                                          : categoryCheckedCount > 0 
                                            ? 'border-amber-300 bg-amber-50/30'
                                            : 'border-slate-200 bg-slate-50'
                                      }`}>
                                        {/* Kategori Başlığı + Hepsini Seç */}
                                        <div className={`flex items-center justify-between p-3 border-b ${
                                          categoryAllChecked 
                                            ? 'bg-emerald-100 border-emerald-200' 
                                            : categoryCheckedCount > 0 
                                              ? 'bg-amber-100 border-amber-200'
                                              : 'bg-slate-100 border-slate-200'
                                        }`}>
                                          <div className="flex items-center gap-3">
                                            <span className="text-2xl">{category.icon}</span>
                                            <div>
                                              <span className="font-bold text-slate-800 text-base">{category.category}</span>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden`}>
                                                  <div 
                                                    className={`h-full rounded-full transition-all ${
                                                      categoryAllChecked ? 'bg-emerald-500' : categoryCheckedCount > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                                    }`}
                                                    style={{ width: `${(categoryCheckedCount / category.permissions.length) * 100}%` }}
                                                  />
                                                </div>
                                                <span className={`text-xs font-semibold ${
                                                  categoryAllChecked 
                                                    ? 'text-emerald-700' 
                                                    : categoryCheckedCount > 0 
                                                      ? 'text-amber-700'
                                                      : 'text-slate-500'
                                                }`}>
                                                  {categoryCheckedCount}/{category.permissions.length}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              const newPerms = { ...(userSpecificPermissions[selectedUserForPermissions.id] || {}) };
                                              const newValue = !categoryAllChecked;
                                              category.permissions.forEach(p => {
                                                newPerms[p.key] = newValue;
                                              });
                                              setUserSpecificPermissions(prev => ({
                                                ...prev,
                                                [selectedUserForPermissions.id]: newPerms
                                              }));
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
                                              categoryAllChecked 
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                                : 'bg-white text-slate-700 border border-slate-300 hover:border-emerald-400 hover:text-emerald-600'
                                            }`}
                                          >
                                            {categoryAllChecked ? (
                                              <>
                                                <Check size={16} />
                                                Tümü Seçili
                                              </>
                                            ) : (
                                              <>
                                                <Plus size={16} />
                                                Hepsini Seç
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        {/* Yetkiler */}
                                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {category.permissions.map((perm) => {
                                            const isChecked = userSpecificPermissions[selectedUserForPermissions.id]?.[perm.key] ?? false;
                                            return (
                                              <label
                                                key={perm.key}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                                  isChecked 
                                                    ? 'bg-emerald-50 border-emerald-300' 
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={(e) => {
                                                    setUserSpecificPermissions(prev => ({
                                                      ...prev,
                                                      [selectedUserForPermissions.id]: {
                                                        ...(prev[selectedUserForPermissions.id] || {}),
                                                        [perm.key]: e.target.checked
                                                      }
                                                    }));
                                                  }}
                                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-slate-700 text-sm truncate">{perm.label}</p>
                                                  <p className="text-xs text-slate-400 truncate">{perm.desc}</p>
                                                </div>
                                                {isChecked && (
                                                  <Check size={14} className="text-emerald-600 flex-shrink-0" />
                                                )}
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>

                            {/* Alt Butonlar */}
                            {selectedUserForPermissions.role !== 'admin' && (
                              <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const allPerms: Record<string, boolean> = {};
                                      allPermissionsList.forEach(cat => {
                                        cat.permissions.forEach(p => {
                                          allPerms[p.key] = true;
                                        });
                                      });
                                      setUserSpecificPermissions(prev => ({
                                        ...prev,
                                        [selectedUserForPermissions.id]: allPerms
                                      }));
                                    }}
                                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
                                  >
                                    Tümünü Aç
                                  </button>
                                  <button
                                    onClick={() => {
                                      const noPerms: Record<string, boolean> = {};
                                      allPermissionsList.forEach(cat => {
                                        cat.permissions.forEach(p => {
                                          noPerms[p.key] = false;
                                        });
                                      });
                                      setUserSpecificPermissions(prev => ({
                                        ...prev,
                                        [selectedUserForPermissions.id]: noPerms
                                      }));
                                    }}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                                  >
                                    Tümünü Kapat
                                  </button>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg">
                                    <span className="text-lg font-bold">
                                      {Object.values(userSpecificPermissions[selectedUserForPermissions.id] || {}).filter(Boolean).length}
                                    </span>
                                    <span className="text-emerald-100 ml-1">/ {totalPermissionsCount}</span>
                                    <span className="text-emerald-200 text-sm ml-2">yetki aktif</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* AKADEMİK YILLAR */}
                {activeTab === 'academic' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">Akademik Yıl Yönetimi</h2>
                      </div>
                      <button
                        onClick={() => setNewYear({ name: '', start_date: '', end_date: '', status: 'future' })}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                      >
                        <Plus size={16} />
                        Yeni Yıl Ekle
                      </button>
                    </div>

                    {/* New Year Form */}
                    {newYear && (
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
                        <h3 className="font-semibold text-indigo-900">Yeni Akademik Yıl</h3>
                        <div className="grid grid-cols-4 gap-4">
                          <input
                            type="text"
                            placeholder="2025-2026"
                            value={newYear.name || ''}
                            onChange={(e) => setNewYear({...newYear, name: e.target.value})}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                          <input
                            type="date"
                            value={newYear.start_date || ''}
                            onChange={(e) => setNewYear({...newYear, start_date: e.target.value})}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                          <input
                            type="date"
                            value={newYear.end_date || ''}
                            onChange={(e) => setNewYear({...newYear, end_date: e.target.value})}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                          <div className="flex gap-2">
                            <button onClick={handleAddYear} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                              <Check size={16} className="inline mr-1" /> Ekle
                            </button>
                            <button onClick={() => setNewYear(null)} className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Years List */}
                    <div className="space-y-3">
                      {academicYears.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
                          Henüz akademik yıl yok
                        </div>
                      ) : (
                        academicYears.map((year) => (
                          <div key={year.id} className={`p-4 rounded-xl border ${
                            year.status === 'active' ? 'bg-emerald-50 border-emerald-200' :
                            year.status === 'future' ? 'bg-blue-50 border-blue-200' :
                            'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  year.status === 'active' ? 'bg-emerald-500 text-white' :
                                  year.status === 'future' ? 'bg-blue-500 text-white' :
                                  'bg-slate-400 text-white'
                                }`}>
                                  <Calendar size={24} />
                                </div>
                                <div>
                                  <p className="font-bold text-lg">{year.name}</p>
                                  <p className="text-sm text-slate-600">
                                    {new Date(year.start_date).toLocaleDateString('tr-TR')} - {new Date(year.end_date).toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                  year.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                  year.status === 'future' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-200 text-slate-600'
                                }`}>
                                  {year.status === 'active' ? '✓ Aktif Dönem' : year.status === 'future' ? 'Gelecek' : 'Geçmiş'}
                                </span>
                                {year.status !== 'active' && (
                                  <button
                                    onClick={() => handleSetActiveYear(year.id)}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                                  >
                                    Aktif Yap
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteYear(year.id, year.status)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* İLETİŞİM AYARLARI */}
                {activeTab === 'communication' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <Mail className="w-6 h-6 text-indigo-600" />
                      <h2 className="text-xl font-bold text-slate-900">İletişim Ayarları</h2>
                    </div>

                    {/* SMS */}
                    <div className="p-6 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-orange-600" />
                          <h3 className="font-bold text-orange-900">SMS Ayarları</h3>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={communicationSettings.smsEnabled}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, smsEnabled: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-orange-600"
                          />
                          <span className="text-sm font-medium text-orange-700">Aktif</span>
                        </label>
                      </div>
                      {communicationSettings.smsEnabled && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <select
                            value={communicationSettings.smsProvider}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, smsProvider: e.target.value})}
                            className="px-4 py-2.5 border border-orange-200 rounded-lg text-sm bg-white"
                          >
                            <option value="netgsm">NetGSM</option>
                            <option value="iletimerkezi">İletişim Merkezi</option>
                            <option value="twilio">Twilio</option>
                          </select>
                          <input
                            type="text"
                            placeholder="API Anahtarı"
                            value={communicationSettings.smsApiKey}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, smsApiKey: e.target.value})}
                            className="px-4 py-2.5 border border-orange-200 rounded-lg text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <h3 className="font-bold text-blue-900">Email Ayarları (SMTP)</h3>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={communicationSettings.emailEnabled}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, emailEnabled: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600"
                          />
                          <span className="text-sm font-medium text-blue-700">Aktif</span>
                        </label>
                      </div>
                      {communicationSettings.emailEnabled && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <input type="text" placeholder="SMTP Host" value={communicationSettings.smtpHost}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, smtpHost: e.target.value})}
                            className="px-4 py-2.5 border border-blue-200 rounded-lg text-sm" />
                          <input type="text" placeholder="Port" value={communicationSettings.smtpPort}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, smtpPort: e.target.value})}
                            className="px-4 py-2.5 border border-blue-200 rounded-lg text-sm" />
                          <input type="text" placeholder="Kullanıcı" value={communicationSettings.smtpUser}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, smtpUser: e.target.value})}
                            className="px-4 py-2.5 border border-blue-200 rounded-lg text-sm" />
                          <input type="password" placeholder="Şifre" value={communicationSettings.smtpPassword}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, smtpPassword: e.target.value})}
                            className="px-4 py-2.5 border border-blue-200 rounded-lg text-sm" />
                        </div>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-emerald-600" />
                          <h3 className="font-bold text-emerald-900">WhatsApp Business API</h3>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={communicationSettings.whatsappEnabled}
                            onChange={(e) => setCommunicationSettings({...communicationSettings, whatsappEnabled: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600"
                          />
                          <span className="text-sm font-medium text-emerald-700">Aktif</span>
                        </label>
                      </div>
                      {communicationSettings.whatsappEnabled && (
                        <input type="text" placeholder="WhatsApp Business API Token" value={communicationSettings.whatsappApiKey}
                          onChange={(e) => setCommunicationSettings({...communicationSettings, whatsappApiKey: e.target.value})}
                          className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg text-sm mt-4" />
                      )}
                    </div>
                  </div>
                )}

                {/* SÖZLEŞME ŞABLONLARI */}
                {activeTab === 'contracts' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <FileText className="w-6 h-6 text-indigo-600" />
                      <h2 className="text-xl font-bold text-slate-900">Sözleşme & KVKK Şablonları</h2>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="font-semibold text-slate-700">Kayıt Sözleşmesi Şablonu</label>
                        <span className="text-xs text-slate-500">Değişkenler: [KURUM_ADI], [VELİ_AD_SOYAD], [ÖĞRENCİ_AD_SOYAD] vb.</span>
                      </div>
                      <textarea
                        value={contractTemplate}
                        onChange={(e) => setContractTemplate(e.target.value)}
                        rows={15}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-sm resize-none"
                        placeholder="Sözleşme metnini buraya yazın..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="font-semibold text-slate-700">KVKK Aydınlatma Metni</label>
                        <Shield className="w-5 h-5 text-slate-400" />
                      </div>
                      <textarea
                        value={kvkkText}
                        onChange={(e) => setKvkkText(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-sm resize-none"
                        placeholder="KVKK metnini buraya yazın..."
                      />
                    </div>
                  </div>
                )}

                {/* ÖDEME ŞABLONLARI */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">Ödeme Şablonları</h2>
                      </div>
                      <button
                        onClick={() => setNewTemplate({ name: '', base_price: 0, max_installments: 10, description: '' })}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                      >
                        <Plus size={16} />
                        Yeni Şablon
                      </button>
                    </div>

                    {/* New Template Form */}
                    {newTemplate && (
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
                        <h3 className="font-semibold text-indigo-900">Yeni Ödeme Şablonu</h3>
                        <div className="grid grid-cols-4 gap-4">
                          <input type="text" placeholder="Şablon Adı" value={newTemplate.name || ''}
                            onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white" />
                          <input type="number" placeholder="Temel Ücret" value={newTemplate.base_price || ''}
                            onChange={(e) => setNewTemplate({...newTemplate, base_price: Number(e.target.value)})}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white" />
                          <input type="number" placeholder="Max Taksit" value={newTemplate.max_installments || ''}
                            onChange={(e) => setNewTemplate({...newTemplate, max_installments: Number(e.target.value)})}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white" />
                          <div className="flex gap-2">
                            <button onClick={handleAddTemplate} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                              <Check size={16} className="inline mr-1" /> Ekle
                            </button>
                            <button onClick={() => setNewTemplate(null)} className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Templates Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {paymentTemplates.length === 0 ? (
                        <div className="col-span-2 p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
                          Henüz ödeme şablonu yok
                        </div>
                      ) : (
                        paymentTemplates.map((template) => (
                          <div key={template.id} className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg text-slate-900">{template.name}</h3>
                                <p className="text-sm text-slate-500">{template.description}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Temel Ücret</p>
                                <p className="text-xl font-bold text-indigo-600">
                                  ₺{Number(template.base_price).toLocaleString('tr-TR')}
                                </p>
          </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Max Taksit</p>
                                <p className="text-xl font-bold text-slate-700">{template.max_installments}</p>
              </div>
              </div>
              </div>
                        ))
                      )}
              </div>
              </div>
                )}

                {/* API Ayarları Sekmesi */}
                {activeTab === 'api' && (
                  <APISettings />
                )}

                {/* Yedekleme Sekmesi */}
                {activeTab === 'backup' && (
                  <BackupRestore />
                )}

                {/* Veri Aktarımı Sekmesi */}
                {activeTab === 'migration' && (
                  <DataMigrationSection organizationId={currentOrganization?.id} />
                )}

                {/* Klavye Kısayolları Sekmesi */}
                {activeTab === 'shortcuts' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Keyboard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Klavye Kısayolları</h2>
                        <p className="text-sm text-slate-500">Hızlı erişim için klavye kısayollarını kullanın</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <p className="text-sm text-blue-700">
                        💡 <strong>İpucu:</strong> Herhangi bir sayfada <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-xs font-mono">?</kbd> tuşlarına basarak kısayolları görebilirsiniz.
                      </p>
                    </div>

                    {/* Kısayol Kategorileri */}
                    {Object.entries(
                      shortcuts.reduce((acc: Record<string, typeof shortcuts>, s) => {
                        if (!acc[s.category]) acc[s.category] = [];
                        acc[s.category].push(s);
                        return acc;
                      }, {})
                    ).map(([category, items]) => (
                      <div key={category} className="bg-white border border-slate-200 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                          {category}
                        </h3>
                        <div className="space-y-3">
                          {items.map((shortcut, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition"
                            >
                              <span className="text-sm text-slate-700">{shortcut.description}</span>
                              <div className="flex items-center gap-1">
                                {shortcut.ctrlKey && (
                                  <>
                                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono">⌘/Ctrl</kbd>
                                    <span className="text-slate-400 text-xs">+</span>
                                  </>
                                )}
                                {shortcut.shiftKey && (
                                  <>
                                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono">Shift</kbd>
                                    <span className="text-slate-400 text-xs">+</span>
                                  </>
                                )}
                                {shortcut.altKey && (
                                  <>
                                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono">Alt</kbd>
                                    <span className="text-slate-400 text-xs">+</span>
                                  </>
                                )}
                                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono min-w-[28px] text-center">
                                  {shortcut.key === '?' ? '?' : shortcut.key.toUpperCase()}
                                </kbd>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Klavye Kısayolları Modal */}
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
        shortcuts={shortcuts}
      />
    </div>
  );
}

// Suspense ile sarmalanmış export
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
