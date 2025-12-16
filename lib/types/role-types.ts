/**
 * Rol ve Yetki Tanımlamaları
 * AkademiHub - Kapsamlı Yetki Sistemi
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // Franchise Sahibi - Tüm kurumlara erişim
  ADMIN = 'admin',             // Kurum Yöneticisi - Tek kuruma erişim
  ACCOUNTING = 'accounting',
  STAFF = 'staff',
  TEACHER = 'teacher',
  PARENT = 'parent',
}

export enum Permission {
  // ===== ÖĞRENCİ İŞLEMLERİ =====
  STUDENTS_VIEW = 'students.view',
  STUDENTS_CREATE = 'students.create',
  STUDENTS_EDIT = 'students.edit',
  STUDENTS_DELETE = 'students.delete',
  STUDENTS_EXPORT = 'students.export',
  STUDENTS_CONTRACT_VIEW = 'students.contract_view',
  STUDENTS_CONTRACT_PRINT = 'students.contract_print',

  // ===== FİNANS İŞLEMLERİ =====
  FINANCE_VIEW = 'finance.view',
  FINANCE_COLLECT_PAYMENT = 'finance.collect_payment',
  FINANCE_INSTALLMENT_ADD = 'finance.installment_add',
  FINANCE_INSTALLMENT_EDIT = 'finance.installment_edit',
  FINANCE_INSTALLMENT_DELETE = 'finance.installment_delete',
  FINANCE_EXPENSE_ADD = 'finance.expense_add',
  FINANCE_EXPENSE_EDIT = 'finance.expense_edit',
  FINANCE_EXPENSE_DELETE = 'finance.expense_delete',
  FINANCE_CASHBANK_VIEW = 'finance.cashbank_view',
  FINANCE_CASHBANK_MANAGE = 'finance.cashbank_manage',

  // ===== RAPOR İŞLEMLERİ =====
  REPORTS_FINANCIAL = 'reports.financial',
  REPORTS_FOUNDER = 'reports.founder',
  REPORTS_BUILDER = 'reports.builder',
  REPORTS_EXPORT_PDF = 'reports.export_pdf',
  REPORTS_EXPORT_EXCEL = 'reports.export_excel',

  // ===== İLETİŞİM =====
  COMM_WHATSAPP = 'communication.whatsapp',
  COMM_SMS = 'communication.sms',
  COMM_EMAIL = 'communication.email',
  COMM_BULK = 'communication.bulk',

  // ===== SİSTEM AYARLARI =====
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_USERS = 'settings.users',
  SETTINGS_ACADEMIC_YEAR = 'settings.academic_year',
  SETTINGS_TEMPLATES = 'settings.templates',

  // ===== FRANCHISE / SUPER ADMIN =====
  FRANCHISE_VIEW_ALL = 'franchise.view_all',           // Tüm kurumları görme
  FRANCHISE_MANAGE_ORGS = 'franchise.manage_orgs',     // Kurum ekleme/silme
  FRANCHISE_CONSOLIDATED = 'franchise.consolidated',   // Konsolide raporlar
  FRANCHISE_SWITCH_ORG = 'franchise.switch_org',       // Kurumlar arası geçiş

  // ===== ESKİ UYUMLULUK (Legacy) =====
  FINANCE_CREATE = 'finance.create',
  FINANCE_EDIT = 'finance.edit',
  FINANCE_DELETE = 'finance.delete',
  FINANCE_VIEW_REPORTS = 'finance.view_reports',
  ACADEMIC_VIEW = 'academic.view',
  ACADEMIC_EDIT = 'academic.edit',
  GRADES_EDIT = 'grades.edit',
  ATTENDANCE_VIEW = 'attendance.view',
  ATTENDANCE_MARK = 'attendance.mark',
  SEND_WHATSAPP = 'communication.send_whatsapp',
  SEND_EMAIL = 'communication.send_email',
  SEND_SMS = 'communication.send_sms',
  USERS_MANAGE = 'users.manage',
  SETTINGS_MANAGE = 'settings.manage',
  LOGS_VIEW = 'logs.view',
  REPORTS_VIEW = 'reports.view',
  STAFF_VIEW = 'staff.view',
  STAFF_MANAGE = 'staff.manage',
}

// Dinamik yetki yapılandırması için interface
export interface DynamicRolePermissions {
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

// Varsayılan rol yetkileri
export const DEFAULT_ROLE_PERMISSIONS: Record<'accounting' | 'staff', DynamicRolePermissions> = {
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
};

// DynamicRolePermissions'ı Permission[] array'ine çevirme
export function convertToPermissionArray(config: DynamicRolePermissions): Permission[] {
  const permissions: Permission[] = [];

  // Öğrenci
  if (config.students.view) permissions.push(Permission.STUDENTS_VIEW);
  if (config.students.create) permissions.push(Permission.STUDENTS_CREATE);
  if (config.students.edit) permissions.push(Permission.STUDENTS_EDIT);
  if (config.students.delete) permissions.push(Permission.STUDENTS_DELETE);
  if (config.students.exportExcel) permissions.push(Permission.STUDENTS_EXPORT);
  if (config.students.viewContract) permissions.push(Permission.STUDENTS_CONTRACT_VIEW);
  if (config.students.printContract) permissions.push(Permission.STUDENTS_CONTRACT_PRINT);

  // Finans
  if (config.finance.viewDashboard) permissions.push(Permission.FINANCE_VIEW);
  if (config.finance.collectPayment) permissions.push(Permission.FINANCE_COLLECT_PAYMENT);
  if (config.finance.addInstallment) permissions.push(Permission.FINANCE_INSTALLMENT_ADD, Permission.FINANCE_CREATE);
  if (config.finance.editInstallment) permissions.push(Permission.FINANCE_INSTALLMENT_EDIT, Permission.FINANCE_EDIT);
  if (config.finance.deleteInstallment) permissions.push(Permission.FINANCE_INSTALLMENT_DELETE, Permission.FINANCE_DELETE);
  if (config.finance.addExpense) permissions.push(Permission.FINANCE_EXPENSE_ADD);
  if (config.finance.editExpense) permissions.push(Permission.FINANCE_EXPENSE_EDIT);
  if (config.finance.deleteExpense) permissions.push(Permission.FINANCE_EXPENSE_DELETE);
  if (config.finance.viewCashBank) permissions.push(Permission.FINANCE_CASHBANK_VIEW);
  if (config.finance.manageCashBank) permissions.push(Permission.FINANCE_CASHBANK_MANAGE);

  // Raporlar
  if (config.reports.viewFinancial) permissions.push(Permission.REPORTS_FINANCIAL, Permission.FINANCE_VIEW_REPORTS);
  if (config.reports.founderReport) permissions.push(Permission.REPORTS_FOUNDER);
  if (config.reports.reportBuilder) permissions.push(Permission.REPORTS_BUILDER, Permission.REPORTS_VIEW);
  if (config.reports.exportPdf) permissions.push(Permission.REPORTS_EXPORT_PDF);
  if (config.reports.exportExcel) permissions.push(Permission.REPORTS_EXPORT_EXCEL);

  // İletişim
  if (config.communication.sendWhatsapp) permissions.push(Permission.COMM_WHATSAPP, Permission.SEND_WHATSAPP);
  if (config.communication.sendSms) permissions.push(Permission.COMM_SMS, Permission.SEND_SMS);
  if (config.communication.sendEmail) permissions.push(Permission.COMM_EMAIL, Permission.SEND_EMAIL);
  if (config.communication.bulkMessage) permissions.push(Permission.COMM_BULK);

  // Sistem
  if (config.system.viewSettings) permissions.push(Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE);
  if (config.system.manageUsers) permissions.push(Permission.SETTINGS_USERS, Permission.USERS_MANAGE);
  if (config.system.manageAcademicYear) permissions.push(Permission.SETTINGS_ACADEMIC_YEAR);
  if (config.system.manageTemplates) permissions.push(Permission.SETTINGS_TEMPLATES);

  return [...new Set(permissions)]; // Duplicate'leri kaldır
}

// Admin her şeye erişebilir
const ALL_PERMISSIONS = Object.values(Permission);

// Role-Permission Mapping (statik başlangıç değerleri)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: ALL_PERMISSIONS, // Franchise Sahibi - TÜM yetkiler
  [UserRole.ADMIN]: ALL_PERMISSIONS.filter(p => !p.startsWith('franchise.')), // Kurum Admin - franchise hariç

  [UserRole.ACCOUNTING]: convertToPermissionArray(DEFAULT_ROLE_PERMISSIONS.accounting),

  [UserRole.STAFF]: convertToPermissionArray(DEFAULT_ROLE_PERMISSIONS.staff),

  [UserRole.TEACHER]: [
    Permission.STUDENTS_VIEW,
    Permission.ACADEMIC_VIEW,
    Permission.ACADEMIC_EDIT,
    Permission.GRADES_EDIT,
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.SEND_WHATSAPP,
    Permission.SEND_EMAIL,
  ],

  [UserRole.PARENT]: [
    Permission.STUDENTS_VIEW,
    Permission.FINANCE_VIEW,
    Permission.ACADEMIC_VIEW,
    Permission.ATTENDANCE_VIEW,
  ],
};

// Dinamik olarak ROLE_PERMISSIONS'ı güncelleme
export function updateRolePermissions(role: 'accounting' | 'staff', config: DynamicRolePermissions): void {
  const userRole = role === 'accounting' ? UserRole.ACCOUNTING : UserRole.STAFF;
  ROLE_PERMISSIONS[userRole] = convertToPermissionArray(config);
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization_id?: string | null; // Kullanıcının bağlı olduğu kurum
  is_super_admin?: boolean;
}

// Rol etiketleri
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Franchise Yöneticisi',
  [UserRole.ADMIN]: 'Kurum Yöneticisi',
  [UserRole.ACCOUNTING]: 'Muhasebe',
  [UserRole.STAFF]: 'Personel',
  [UserRole.TEACHER]: 'Öğretmen',
  [UserRole.PARENT]: 'Veli',
};

// Aktif roller (UI'da gösterilecek)
export const ACTIVE_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ACCOUNTING,
  UserRole.STAFF,
];
