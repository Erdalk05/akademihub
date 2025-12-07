/**
 * usePermission Hook
 * Rol bazlı yetki kontrolleri için React hook
 * Tüm yetki kontrolleri burada merkezileştirilmiştir
 */

'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useRole } from '@/lib/contexts/RoleContext';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/types/role-types';

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
  financeInstallmentAdd: boolean;
  financeInstallmentEdit: boolean;
  financeInstallmentDelete: boolean;
  financeExpenseAdd: boolean;
  financeExpenseEdit: boolean;
  financeExpenseDelete: boolean;
  financeCashBank: boolean;
  financeCashBankManage: boolean;
  reports: boolean;
  reportsFinancial: boolean;
  reportsFounder: boolean;
  reportsBuilder: boolean;
  reportsExportPdf: boolean;
  reportsExportExcel: boolean;
  communication: boolean;
  commWhatsapp: boolean;
  commSms: boolean;
  commEmail: boolean;
  commBulk: boolean;
  settings: boolean;
  settingsUsers: boolean;
  settingsAcademicYear: boolean;
  settingsTemplates: boolean;
}

export interface UsePermissionReturn {
  // Yükleme durumu
  isLoading: boolean;
  
  // Rol kontrolleri
  role: UserRole;
  isAdmin: boolean;
  isAccounting: boolean;
  isStaff: boolean;
  
  // Yetki kontrolleri
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  
  // Öğrenci işlemleri
  canViewStudents: boolean;
  canCreateStudent: boolean;
  canEditStudent: boolean;
  canDeleteStudent: boolean;
  canExportStudents: boolean;
  canViewContract: boolean;
  canPrintContract: boolean;
  
  // Finans işlemleri
  canViewFinance: boolean;
  canCollectPayment: boolean;
  canAddInstallment: boolean;
  canEditInstallment: boolean;
  canDeleteInstallment: boolean;
  canAddExpense: boolean;
  canEditExpense: boolean;
  canDeleteExpense: boolean;
  canViewCashBank: boolean;
  canManageCashBank: boolean;
  
  // Rapor işlemleri
  canViewFinancialReports: boolean;
  canViewFounderReport: boolean;
  canUseReportBuilder: boolean;
  canExportPdf: boolean;
  canExportExcel: boolean;
  
  // İletişim
  canSendWhatsapp: boolean;
  canSendSms: boolean;
  canSendEmail: boolean;
  canSendBulkMessage: boolean;
  
  // Sistem ayarları
  canViewSettings: boolean;
  canManageUsers: boolean;
  canManageAcademicYear: boolean;
  canManageTemplates: boolean;
  
  // Menü görünürlüğü
  menuVisibility: MenuVisibility;
}

export function usePermission(): UsePermissionReturn {
  const { currentUser, reloadPermissions } = useRole();
  const role = currentUser?.role || UserRole.STAFF;
  
  // Client-side yüklenme kontrolü - currentUser henüz yüklenmediyse
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isLoading = !isClient;

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (role === UserRole.ADMIN) return true; // Admin her şeyi yapabilir
    const permissions = ROLE_PERMISSIONS[role];
    return permissions?.includes(permission) ?? false;
  }, [role]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  const permissions = useMemo(() => {
    const isAdmin = role === UserRole.ADMIN;
    const isAccounting = role === UserRole.ACCOUNTING;
    const isStaff = role === UserRole.STAFF;

    // Öğrenci yetkileri
    const canViewStudents = isAdmin || hasPermission(Permission.STUDENTS_VIEW);
    const canCreateStudent = isAdmin || hasPermission(Permission.STUDENTS_CREATE);
    const canEditStudent = isAdmin || hasPermission(Permission.STUDENTS_EDIT);
    const canDeleteStudent = isAdmin || hasPermission(Permission.STUDENTS_DELETE);
    const canExportStudents = isAdmin || hasPermission(Permission.STUDENTS_EXPORT);
    const canViewContract = isAdmin || hasPermission(Permission.STUDENTS_CONTRACT_VIEW);
    const canPrintContract = isAdmin || hasPermission(Permission.STUDENTS_CONTRACT_PRINT);

    // Finans yetkileri
    const canViewFinance = isAdmin || hasPermission(Permission.FINANCE_VIEW);
    const canCollectPayment = isAdmin || hasPermission(Permission.FINANCE_COLLECT_PAYMENT);
    const canAddInstallment = isAdmin || hasPermission(Permission.FINANCE_INSTALLMENT_ADD) || hasPermission(Permission.FINANCE_CREATE);
    const canEditInstallment = isAdmin || hasPermission(Permission.FINANCE_INSTALLMENT_EDIT) || hasPermission(Permission.FINANCE_EDIT);
    const canDeleteInstallment = isAdmin || hasPermission(Permission.FINANCE_INSTALLMENT_DELETE) || hasPermission(Permission.FINANCE_DELETE);
    const canAddExpense = isAdmin || hasPermission(Permission.FINANCE_EXPENSE_ADD);
    const canEditExpense = isAdmin || hasPermission(Permission.FINANCE_EXPENSE_EDIT);
    const canDeleteExpense = isAdmin || hasPermission(Permission.FINANCE_EXPENSE_DELETE);
    const canViewCashBank = isAdmin || hasPermission(Permission.FINANCE_CASHBANK_VIEW);
    const canManageCashBank = isAdmin || hasPermission(Permission.FINANCE_CASHBANK_MANAGE);

    // Rapor yetkileri
    const canViewFinancialReports = isAdmin || hasPermission(Permission.REPORTS_FINANCIAL) || hasPermission(Permission.FINANCE_VIEW_REPORTS);
    const canViewFounderReport = isAdmin || hasPermission(Permission.REPORTS_FOUNDER);
    const canUseReportBuilder = isAdmin || hasPermission(Permission.REPORTS_BUILDER) || hasPermission(Permission.REPORTS_VIEW);
    const canExportPdf = isAdmin || hasPermission(Permission.REPORTS_EXPORT_PDF);
    const canExportExcel = isAdmin || hasPermission(Permission.REPORTS_EXPORT_EXCEL);

    // İletişim yetkileri
    const canSendWhatsapp = isAdmin || hasPermission(Permission.COMM_WHATSAPP) || hasPermission(Permission.SEND_WHATSAPP);
    const canSendSms = isAdmin || hasPermission(Permission.COMM_SMS) || hasPermission(Permission.SEND_SMS);
    const canSendEmail = isAdmin || hasPermission(Permission.COMM_EMAIL) || hasPermission(Permission.SEND_EMAIL);
    const canSendBulkMessage = isAdmin || hasPermission(Permission.COMM_BULK);

    // Sistem yetkileri
    const canViewSettings = isAdmin || hasPermission(Permission.SETTINGS_VIEW) || hasPermission(Permission.SETTINGS_MANAGE);
    const canManageUsers = isAdmin || hasPermission(Permission.SETTINGS_USERS) || hasPermission(Permission.USERS_MANAGE);
    const canManageAcademicYear = isAdmin || hasPermission(Permission.SETTINGS_ACADEMIC_YEAR);
    const canManageTemplates = isAdmin || hasPermission(Permission.SETTINGS_TEMPLATES);

    // Menü görünürlüğü
    const menuVisibility: MenuVisibility = {
      dashboard: true,
      students: canViewStudents,
      studentCreate: canCreateStudent,
      studentEdit: canEditStudent,
      studentDelete: canDeleteStudent,
      studentExport: canExportStudents,
      studentContract: canViewContract,
      finance: canViewFinance,
      financeCollect: canCollectPayment,
      financeInstallmentAdd: canAddInstallment,
      financeInstallmentEdit: canEditInstallment,
      financeInstallmentDelete: canDeleteInstallment,
      financeExpenseAdd: canAddExpense,
      financeExpenseEdit: canEditExpense,
      financeExpenseDelete: canDeleteExpense,
      financeCashBank: canViewCashBank,
      financeCashBankManage: canManageCashBank,
      reports: canViewFinancialReports || canViewFounderReport || canUseReportBuilder,
      reportsFinancial: canViewFinancialReports,
      reportsFounder: canViewFounderReport,
      reportsBuilder: canUseReportBuilder,
      reportsExportPdf: canExportPdf,
      reportsExportExcel: canExportExcel,
      communication: canSendWhatsapp || canSendSms || canSendEmail,
      commWhatsapp: canSendWhatsapp,
      commSms: canSendSms,
      commEmail: canSendEmail,
      commBulk: canSendBulkMessage,
      settings: canViewSettings,
      settingsUsers: canManageUsers,
      settingsAcademicYear: canManageAcademicYear,
      settingsTemplates: canManageTemplates,
    };

    return {
      isLoading,
      role,
      isAdmin,
      isAccounting,
      isStaff,
      hasPermission,
      hasAnyPermission,
      
      // Öğrenci
      canViewStudents,
      canCreateStudent,
      canEditStudent,
      canDeleteStudent,
      canExportStudents,
      canViewContract,
      canPrintContract,
      
      // Finans
      canViewFinance,
      canCollectPayment,
      canAddInstallment,
      canEditInstallment,
      canDeleteInstallment,
      canAddExpense,
      canEditExpense,
      canDeleteExpense,
      canViewCashBank,
      canManageCashBank,
      
      // Rapor
      canViewFinancialReports,
      canViewFounderReport,
      canUseReportBuilder,
      canExportPdf,
      canExportExcel,
      
      // İletişim
      canSendWhatsapp,
      canSendSms,
      canSendEmail,
      canSendBulkMessage,
      
      // Sistem
      canViewSettings,
      canManageUsers,
      canManageAcademicYear,
      canManageTemplates,
      
      menuVisibility,
    };
  }, [role, hasPermission, hasAnyPermission]);

  return permissions;
}

export default usePermission;
