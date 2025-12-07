/**
 * Role Guard Utilities
 * Kapsamlı Rol Tabanlı Erişim Kontrolü
 * 
 * Bu modül tüm rol tabanlı erişim kontrollerini yönetir.
 * Admin, Muhasebe ve Personel rolleri için güvenlik kuralları.
 */

import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/types/role-types';

/**
 * Kullanıcının belirli bir yetkiye sahip olup olmadığını kontrol eder
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === UserRole.ADMIN) return true; // Admin her şeye erişebilir
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Kullanıcının muhasebe olup olmadığını kontrol eder
 */
export function isAccounting(role: UserRole): boolean {
  return role === UserRole.ACCOUNTING;
}

/**
 * Kullanıcının personel olup olmadığını kontrol eder
 */
export function isStaff(role: UserRole): boolean {
  return role === UserRole.STAFF;
}

// ===== ÖĞRENCİ YETKİLERİ =====

export function canViewStudents(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.STUDENTS_VIEW);
}

export function canCreateStudent(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.STUDENTS_CREATE);
}

export function canEditStudent(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.STUDENTS_EDIT);
}

export function canDeleteStudent(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.STUDENTS_DELETE);
}

export function canExportStudents(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.STUDENTS_EXPORT);
}

export function canViewContract(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.STUDENTS_CONTRACT_VIEW);
}

export function canPrintContract(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.STUDENTS_CONTRACT_PRINT);
}

// ===== FİNANS YETKİLERİ =====

export function canViewFinance(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_VIEW);
}

export function canCollectPayment(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_COLLECT_PAYMENT);
}

export function canAddInstallment(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_INSTALLMENT_ADD) || hasPermission(role, Permission.FINANCE_CREATE);
}

export function canEditInstallment(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_INSTALLMENT_EDIT) || hasPermission(role, Permission.FINANCE_EDIT);
}

export function canDeleteInstallment(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_INSTALLMENT_DELETE) || hasPermission(role, Permission.FINANCE_DELETE);
}

export function canAddExpense(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_EXPENSE_ADD);
}

export function canEditExpense(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_EXPENSE_EDIT);
}

export function canDeleteExpense(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_EXPENSE_DELETE);
}

export function canViewCashBank(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_CASHBANK_VIEW);
}

export function canManageCashBank(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.FINANCE_CASHBANK_MANAGE);
}

// Legacy uyumluluk
export function canCreatePayment(role: UserRole): boolean {
  return canAddInstallment(role);
}

export function canEditPayment(role: UserRole): boolean {
  return canEditInstallment(role);
}

export function canDeletePayment(role: UserRole): boolean {
  return canDeleteInstallment(role);
}

export function canModifyPaymentPlan(role: UserRole): boolean {
  return isAdmin(role);
}

// ===== RAPOR YETKİLERİ =====

export function canViewFinancialReports(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.REPORTS_FINANCIAL) || hasPermission(role, Permission.FINANCE_VIEW_REPORTS);
}

export function canViewFounderReport(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.REPORTS_FOUNDER);
}

export function canUseReportBuilder(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.REPORTS_BUILDER) || hasPermission(role, Permission.REPORTS_VIEW);
}

export function canExportPdf(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.REPORTS_EXPORT_PDF);
}

export function canExportExcel(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.REPORTS_EXPORT_EXCEL);
}

// Legacy uyumluluk
export function canViewReports(role: UserRole): boolean {
  return canViewFinancialReports(role) || canViewFounderReport(role) || canUseReportBuilder(role);
}

// ===== İLETİŞİM YETKİLERİ =====

export function canSendWhatsapp(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.COMM_WHATSAPP) || hasPermission(role, Permission.SEND_WHATSAPP);
}

export function canSendSms(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.COMM_SMS) || hasPermission(role, Permission.SEND_SMS);
}

export function canSendEmail(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.COMM_EMAIL) || hasPermission(role, Permission.SEND_EMAIL);
}

export function canSendBulkMessage(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.COMM_BULK);
}

// ===== SİSTEM YETKİLERİ =====

export function canViewSettings(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.SETTINGS_VIEW) || hasPermission(role, Permission.SETTINGS_MANAGE);
}

export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.SETTINGS_USERS) || hasPermission(role, Permission.USERS_MANAGE);
}

export function canManageAcademicYear(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.SETTINGS_ACADEMIC_YEAR);
}

export function canManageTemplates(role: UserRole): boolean {
  return isAdmin(role) || hasPermission(role, Permission.SETTINGS_TEMPLATES);
}

// ===== MENÜ GÖRÜNÜRLÜĞÜ =====

export interface MenuVisibility {
  dashboard: boolean;
  students: boolean;
  studentCreate: boolean;
  studentEdit: boolean;
  studentDelete: boolean;
  studentExport: boolean;
  studentContract: boolean;
  finance: boolean;
  financeCollect: boolean;
  financeCreate: boolean;
  financeEdit: boolean;
  financeDelete: boolean;
  reports: boolean;
  reportsFounder: boolean;
  settings: boolean;
}

export function getMenuVisibility(role: UserRole): MenuVisibility {
  return {
    dashboard: true,
    students: canViewStudents(role),
    studentCreate: canCreateStudent(role),
    studentEdit: canEditStudent(role),
    studentDelete: canDeleteStudent(role),
    studentExport: canExportStudents(role),
    studentContract: canViewContract(role),
    finance: canViewFinance(role),
    financeCollect: canCollectPayment(role),
    financeCreate: canAddInstallment(role),
    financeEdit: canEditInstallment(role),
    financeDelete: canDeleteInstallment(role),
    reports: canViewReports(role),
    reportsFounder: canViewFounderReport(role),
    settings: canViewSettings(role),
  };
}

// ===== API ERİŞİM KONTROLLERI =====

export interface RoleCheckResult {
  allowed: boolean;
  message: string;
  requiredRole?: UserRole;
}

export function checkApiAccess(
  userRole: UserRole,
  requiredPermission: Permission
): RoleCheckResult {
  const hasAccess = hasPermission(userRole, requiredPermission);
  
  return {
    allowed: hasAccess,
    message: hasAccess 
      ? 'Erişim izni verildi' 
      : 'Bu işlem için yetkiniz bulunmamaktadır',
    requiredRole: hasAccess ? undefined : UserRole.ADMIN,
  };
}

export function checkDeleteAccess(userRole: UserRole): RoleCheckResult {
  const isAllowed = isAdmin(userRole);
  
  return {
    allowed: isAllowed,
    message: isAllowed 
      ? 'Silme işlemi için yetki verildi' 
      : 'Silme işlemi sadece Admin tarafından yapılabilir',
    requiredRole: UserRole.ADMIN,
  };
}

export function checkUpdateAccess(userRole: UserRole): RoleCheckResult {
  const isAllowed = isAdmin(userRole);
  
  return {
    allowed: isAllowed,
    message: isAllowed 
      ? 'Güncelleme işlemi için yetki verildi' 
      : 'Güncelleme işlemi sadece Admin tarafından yapılabilir',
    requiredRole: UserRole.ADMIN,
  };
}

// Kritik işlem kontrolü
export function canPerformCriticalAction(role: UserRole): boolean {
  return isAdmin(role);
}
