import { PaymentStatus, BaseEntity } from './common.types';

// ============================================
// ENUMS - PAYMENT
// ============================================

export enum PaymentTypeEnum {
  STUDENT_FEE = 'student_fee',           // Öğrenci ücreti
  ACTIVITY_CHARGE = 'activity_charge',   // Aktivite harçı
  LIBRARY_CHARGE = 'library_charge',     // Kütüphane harçı
  PENALTY = 'penalty',                   // Ceza
  DONATION = 'donation',                 // Bağış
  OTHER = 'other',                       // Diğer
}

export enum PaymentMethodEnum {
  CASH = 'cash',                         // Nakit
  BANK_TRANSFER = 'bank_transfer',       // Banka havalesi
  EFT = 'eft',                           // Elektronik fon transferi
  CREDIT_CARD = 'credit_card',           // Kredi kartı
  CHECK = 'check',                       // Çek
  MANUAL = 'manual',                     // Manuel (taşıyıcı vb)
}

export enum PaymentStatusEnum {
  PENDING = 'pending',                   // Bekleniyor
  PAID = 'paid',                         // Ödendi
  OVERDUE = 'overdue',                   // Vadesi geçmiş
  REFUNDED = 'refunded',                 // İade edildi
  CANCELLED = 'cancelled',               // İptal
}

export enum CheckStatusEnum {
  ACTIVE = 'active',                     // Aktif
  DEPOSITED = 'deposited',               // Banka hesabına yatırıldı
  RETURNED = 'returned',                 // İade
  CASHED = 'cashed',                     // Tahsil edildi
}

// ============================================
// ENUMS - EXPENSE
// ============================================

export enum ExpenseTypeEnum {
  PAYROLL = 'payroll',                   // Bordro
  UTILITIES = 'utilities',               // Elektrik, su, doğalgaz
  MATERIALS = 'materials',               // Eğitim materyalleri
  EQUIPMENT = 'equipment',               // Ekipman
  MAINTENANCE = 'maintenance',           // Bakım ve onarım
  RENT = 'rent',                         // Kira
  ADMIN = 'admin',                       // İdari giderler
  OTHER = 'other',                       // Diğer
}

export enum ExpenseStatusEnum {
  DRAFT = 'draft',                       // Taslak
  PENDING = 'pending',                   // Onay bekleniyor
  APPROVED = 'approved',                 // Onaylandı
  PAID = 'paid',                         // Ödendi
  REJECTED = 'rejected',                 // Reddedildi
  CANCELLED = 'cancelled',               // İptal
}

// ============================================
// ENUMS - SALES
// ============================================

export enum SaleTypeEnum {
  BOOK = 'book',                         // Kitap
  UNIFORM = 'uniform',                   // Kıyafet/Üniforma
  STATIONERY = 'stationery',             // Kırtasiye
  CANTEEN = 'canteen',                   // Kantin
  ACTIVITY = 'activity',                 // Aktivite
  OTHER = 'other',                       // Diğer
}

export enum SaleStatusEnum {
  COMPLETED = 'completed',               // Tamamlandı
  PENDING = 'pending',                   // Bekleniyor
  CANCELLED = 'cancelled',               // İptal
  REFUNDED = 'refunded',                 // İade
}

// ============================================
// INTERFACES - PAYMENT
// ============================================

export interface Payment extends BaseEntity {
  paymentNo: string;
  studentId: string;
  studentName: string;
  receivedById?: string;
  
  // Ödeme Bilgileri
  amount: number;
  paymentType: PaymentTypeEnum;
  paymentMethod: PaymentMethodEnum;
  status: PaymentStatusEnum;
  description?: string;
  
  // Tarihler
  paymentDate: Date;
  dueDate?: Date;
  
  // İlişkiler
  installmentId?: string;
  contractId?: string;
  invoiceId?: string;
  
  // Belgeler
  receiptUrl?: string;
  
  // AI Insights
  riskScore?: number;          // 0-100 (yüksek = riskli)
  reminderCount: number;
  autoPaymentFailed?: boolean;
}

export interface Installment extends BaseEntity {
  installmentNo: string;
  studentId: string;
  studentName: string;
  
  // Plan
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentCount: number;
  currentInstallment: number;
  
  // Tarihler
  startDate: Date;
  endDate: Date;
  
  // Durum
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  
  // Detaylar
  installmentPlans: Array<{
    installmentNo: number;
    dueDate: Date;
    amount: number;
    status: PaymentStatusEnum;
    paymentDate?: Date;
  }>;
  
  notes?: string;
  payments?: Payment[];
}

export interface CheckManagement extends BaseEntity {
  checkNo: string;
  draweeBank: string;
  amount: number;
  issuedDate: Date;
  dueDate: Date;
  drawerName: string;
  status: CheckStatusEnum;
  depositedDate?: Date;
  cachedDate?: Date;
  notes?: string;
}

export interface PaymentCreateInput {
  studentId: string;
  amount: number;
  paymentType: PaymentTypeEnum;
  paymentMethod: PaymentMethodEnum;
  description?: string;
  dueDate?: Date;
  installmentId?: string;
}

export interface PaymentReceipt {
  receiptNo: string;
  payment: Payment;
  receivedBy: string;
  receiptDate: Date;
  notes?: string;
  printCount: number;
  emailSent: boolean;
}

// ============================================
// INTERFACES - EXPENSE
// ============================================

export interface Expense extends BaseEntity {
  // Gider Bilgileri
  title: string;
  description: string;
  amount: number;
  category: ExpenseTypeEnum;
  
  // Tarihler
  date: Date;
  dueDate?: Date;
  paidDate?: Date;
  
  // Durumlar
  status: ExpenseStatusEnum;
  
  // İlişkiler
  departmentId?: string;
  vendorId?: string;
  approvedBy?: string;
  
  // Belgeler
  invoiceUrl?: string;
  receiptUrl?: string;
  receiptNo?: string;
  
  // Bütçe
  budgetCategory?: string;
}

export interface Payroll extends BaseEntity {
  payrollNo: string;
  employeeId: string;
  employeeName: string;
  
  // Dönem
  month: number;        // 1-12
  year: number;
  
  // Tutarlar
  baseSalary: number;
  allowances: number;   // Yemek, ulaşım vb.
  deductions: number;   // Vergi, kesinti vb.
  netSalary: number;
  
  // Status
  status: 'draft' | 'approved' | 'paid' | 'failed';
  
  // Tarihler
  paidAt?: Date;
  
  // İlişkiler
  departmentId: string;
  approvedBy?: string;
  
  // AI Insights
  anomalies?: string[]; // Anormal ödeme tespiti
}

export interface ExpenseCreateInput {
  title: string;
  description: string;
  amount: number;
  category: ExpenseTypeEnum;
  dueDate?: Date;
  departmentId?: string;
  vendorId?: string;
}

// ============================================
// INTERFACES - SALES
// ============================================

export interface SalesCustomer extends BaseEntity {
  fullName: string;
  phone?: string;
  note?: string;
}

export interface Sale extends BaseEntity {
  saleNo: string;
  customerId?: string;    // Öğrenci ID
  customerName: string;
  
  // Satış Bilgileri
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  tax: number;
  netAmount: number;
  
  // Ödeme
  paymentMethod: PaymentMethodEnum;
  status: SaleStatusEnum;
  
  // Tarihler
  saleDate: Date;
  
  // Fatura
  invoiceNo?: string;
  invoiceUrl?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  category: SaleTypeEnum;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Product extends BaseEntity {
  name: string;
  category: SaleTypeEnum;
  price: number;
  stock: number;
  minimumStock: number;
  description?: string;
  imageUrl?: string;
}

// ============================================
// INTERFACES - CASH & BANK
// ============================================

export interface CashRegister extends BaseEntity {
  name: string;                  // "Ana Kasa", "Kantin Kasası"
  responsible: string;           // Kasa sorumlusu
  
  // Bakiye
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  
  // Tarih
  openDate: Date;
  closeDate?: Date;
  
  // İşlemler
  transactions: CashTransaction[];
  
  status: 'open' | 'closed';
}

export interface CashTransaction extends BaseEntity {
  transactionNo: string;
  cashRegisterId: string;
  type: 'in' | 'out';           // Giriş / Çıkış
  amount: number;
  description: string;
  reference?: string;
  
  date: Date;
  time: string;
  recordedBy: string;
}

export interface CashCountReport extends BaseEntity {
  cashRegisterId: string;
  cashRegisterName: string;
  
  // Bakiyeler
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  
  // Tarih
  countDate: Date;
  countTime: string;
  
  // Onay
  countedBy: string;
  approvedBy?: string;
  notes?: string;
  status: 'draft' | 'approved' | 'rejected';
}

export interface BankAccount extends BaseEntity {
  accountNo: string;
  bankName: string;
  accountType: string;           // Vadesiz, Vadeli vb.
  accountHolder: string;
  
  // Bakiye
  balance: number;
  
  // Tarihler
  openDate: Date;
  
  // Durumlar
  status: 'active' | 'inactive' | 'closed';
}

export interface BankTransaction extends BaseEntity {
  transactionNo: string;
  bankAccountId: string;
  type: 'in' | 'out';           // Giriş / Çıkış
  amount: number;
  description: string;
  
  transactionDate: Date;
  valueDate: Date;
  
  reference?: string;           // Çek no, hareket no vb.
  status: 'completed' | 'pending' | 'failed';
}

// ============================================
// INTERFACES - BUDGET
// ============================================

export interface Budget extends BaseEntity {
  name: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Kategoriler
  categories: BudgetCategory[];
  
  // Toplam
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  
  status: 'draft' | 'approved' | 'active' | 'closed';
  approvedBy?: string;
}

export interface BudgetCategory {
  category: ExpenseTypeEnum;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;           // spent / budgeted * 100
}

// ============================================
// INTERFACES - REPORTS
// ============================================

export interface IncomeExpenseReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  income: {
    studentFees: number;
    charges: number;
    donations: number;
    sales: number;
    other: number;
    total: number;
  };
  
  expenses: {
    payroll: number;
    utilities: number;
    materials: number;
    maintenance: number;
    admin: number;
    other: number;
    total: number;
  };
  
  summary: {
    balance: number;          // income - expenses
    percentage: number;        // balance / income * 100
    trend: 'up' | 'down' | 'stable';
  };
}

export interface StudentPaymentReport {
  totalStudents: number;
  paid: number;              // Ödeme tamamı yapılmış
  partial: number;           // Kısmen ödeme yapılmış
  pending: number;           // Ödeme bekleniyor
  overdue: number;           // Vadesi geçmiş
  
  totalAmount: {
    expected: number;        // Beklenen toplam
    received: number;        // Alınan toplam
    outstanding: number;     // Ödenmemiş toplam
  };
  
  riskStudents: Array<{
    studentId: string;
    studentName: string;
    outstanding: number;
    riskScore: number;
    overdueDays: number;
  }>;
}

export interface MonthlySummary {
  month: number;
  year: number;
  
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;  // net / income * 100
  };
  
  comparison: {
    previousMonth: number;
    change: number;         // %
    trend: 'increase' | 'decrease' | 'stable';
  };
}

// ============================================
// INPUT/OUTPUT TYPES
// ============================================

export interface InstallmentCreateInput {
  studentId: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  installmentCount: number;
  notes?: string;
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

export interface FinancialDashboard {
  totalRevenue: number;
  paymentRate: number;
  latePayments: number;
  overdueAmount: number;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
}

export interface StudentFinance {
  studentId: string;
  totalDue: number;
  totalPaid: number;
  remainingDue: number;
  lastPaymentDate?: Date;
  installmentCount: number;
  completedInstallments: number;
  payments: Payment[];
  installments: Installment[];
}
