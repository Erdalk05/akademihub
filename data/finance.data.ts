import {
  Payment,
  Expense,
  Sale,
  CashRegister,
  BankAccount,
  Budget,
  PaymentTypeEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  ExpenseTypeEnum,
  ExpenseStatusEnum,
  SaleTypeEnum,
  SaleStatusEnum,
} from '@/types/finance.types';

// ============================================
// MOCK STUDENT NAMES
// ============================================

const studentNames = [
  'Ahmet Yılmaz',
  'Ayşe Demir',
  'Mehmet Kaya',
  'Zeynep Çetin',
  'Fatih Ş ensoy',
  'Elif Güneş',
  'Kerem Taş',
  'Hale Özkan',
  'Serkan Aslan',
  'Nur Tekin',
  'İbrahim Varı',
  'Ceyda Polat',
  'Emre Aksu',
  'Merve Turan',
  'Barış Sezer',
  'Deniz Uçar',
  'Can Karaman',
  'İpek Sağlık',
  'Onur Toprak',
  'Şebnem Akşit',
];

// ============================================
// MOCK PAYMENT DATA - 120 Payments
// ============================================

export const mockPayments: Payment[] = [
  // 60 Completed Payments (Son 3 ay)
  ...Array.from({ length: 60 }, (_, i) => ({
    id: `payment_${i + 1}`,
    paymentNo: `PAY-2024-${String(i + 1).padStart(5, '0')}`,
    studentId: `student_${(i % 20) + 1}`,
    studentName: studentNames[i % 20],
    receivedById: 'user_sekreter',
    amount: [12750, 25500, 6375, 3000, 5000][i % 5],
    paymentType: [
      PaymentTypeEnum.STUDENT_FEE,
      PaymentTypeEnum.STUDENT_FEE,
      PaymentTypeEnum.ACTIVITY_CHARGE,
      PaymentTypeEnum.LIBRARY_CHARGE,
      PaymentTypeEnum.OTHER,
    ][i % 5],
    paymentMethod: [
      PaymentMethodEnum.CASH,
      PaymentMethodEnum.BANK_TRANSFER,
      PaymentMethodEnum.EFT,
      PaymentMethodEnum.CREDIT_CARD,
    ][i % 4],
    status: PaymentStatusEnum.PAID,
    description: `${['Eylül', 'Ağustos', 'Temmuz'][i % 3]} Ücreti`,
    paymentDate: new Date(2024, 10 - (i % 3), 15 + (i % 15)),
    dueDate: new Date(2024, 10 - (i % 3), 15),
    installmentId: i % 3 === 0 ? `inst_${i}` : undefined,
    riskScore: Math.floor(Math.random() * 30),
    reminderCount: 0,
    autoPaymentFailed: false,
    createdAt: new Date(2024, 10 - (i % 3), 15),
    updatedAt: new Date(2024, 10 - (i % 3), 15),
  })),

  // 20 Pending Payments
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `payment_pending_${i + 1}`,
    paymentNo: `PAY-2024-P${String(i + 1).padStart(4, '0')}`,
    studentId: `student_${(i % 20) + 1}`,
    studentName: studentNames[i % 20],
    amount: 12750,
    paymentType: PaymentTypeEnum.STUDENT_FEE,
    paymentMethod: [PaymentMethodEnum.CASH, PaymentMethodEnum.BANK_TRANSFER][i % 2],
    status: PaymentStatusEnum.PENDING,
    description: 'Ekim Ücreti',
    paymentDate: new Date(),
    dueDate: new Date(2024, 10, 30),
    riskScore: Math.floor(Math.random() * 50 + 20),
    reminderCount: i % 3,
    autoPaymentFailed: i % 5 === 0,
    createdAt: new Date(2024, 9, 20),
    updatedAt: new Date(2024, 9, 20),
  })),

  // 10 Overdue Payments
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `payment_overdue_${i + 1}`,
    paymentNo: `PAY-2024-OD${String(i + 1).padStart(3, '0')}`,
    studentId: `student_${(i % 20) + 1}`,
    studentName: studentNames[i % 20],
    amount: 12750,
    paymentType: PaymentTypeEnum.STUDENT_FEE,
    paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
    status: PaymentStatusEnum.OVERDUE,
    description: `${['Temmuz', 'Ağustos'][i % 2]} Ücreti (Vadesi Geçmiş)`,
    paymentDate: new Date(),
    dueDate: new Date(2024, 8 + (i % 2), 15),
    riskScore: Math.floor(Math.random() * 50 + 50),
    reminderCount: 3 + (i % 3),
    autoPaymentFailed: true,
    createdAt: new Date(2024, 7, 15),
    updatedAt: new Date(2024, 9, 1),
  })),

  // 10 Refunded Payments
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `payment_refund_${i + 1}`,
    paymentNo: `PAY-2024-RF${String(i + 1).padStart(3, '0')}`,
    studentId: `student_${(i % 20) + 1}`,
    studentName: studentNames[i % 20],
    amount: 6375,
    paymentType: PaymentTypeEnum.ACTIVITY_CHARGE,
    paymentMethod: PaymentMethodEnum.CREDIT_CARD,
    status: PaymentStatusEnum.REFUNDED,
    description: 'Aktivite iptali - İade',
    paymentDate: new Date(2024, 8 - (i % 2), 10),
    dueDate: undefined,
    riskScore: 0,
    reminderCount: 0,
    autoPaymentFailed: false,
    createdAt: new Date(2024, 8 - (i % 2), 10),
    updatedAt: new Date(2024, 9, 5),
  })),

  // 20 Cancelled Payments
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `payment_cancelled_${i + 1}`,
    paymentNo: `PAY-2024-CAN${String(i + 1).padStart(3, '0')}`,
    studentId: `student_${(i % 20) + 1}`,
    studentName: studentNames[i % 20],
    amount: [3000, 5000][i % 2],
    paymentType: [PaymentTypeEnum.PENALTY, PaymentTypeEnum.OTHER][i % 2],
    paymentMethod: PaymentMethodEnum.CASH,
    status: PaymentStatusEnum.CANCELLED,
    description: 'İptal edildi',
    paymentDate: new Date(2024, 7 - (i % 2), 20),
    dueDate: undefined,
    riskScore: 0,
    reminderCount: 0,
    autoPaymentFailed: false,
    createdAt: new Date(2024, 7 - (i % 2), 20),
    updatedAt: new Date(2024, 9, 10),
  })),
];

// ============================================
// MOCK EXPENSE DATA - 55 Expenses
// ============================================

export const mockExpenses: Expense[] = [
  // 15 Payroll Expenses
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `expense_payroll_${i + 1}`,
    title: `Eylül ${i + 1}. Hafta Bordrosu`,
    description: `${5 + (i % 3)} kişi bordrosu`,
    amount: [45000, 48000, 52000][i % 3],
    category: ExpenseTypeEnum.PAYROLL,
    date: new Date(2024, 8, 5 + i * 7),
    dueDate: new Date(2024, 8, 10 + i * 7),
    paidDate: i < 12 ? new Date(2024, 8, 6 + i * 7) : undefined,
    status: i < 12 ? ExpenseStatusEnum.PAID : ExpenseStatusEnum.APPROVED,
    departmentId: 'dept_hr',
    approvedBy: 'user_mudur',
    createdAt: new Date(2024, 8, 5),
    updatedAt: new Date(2024, 8, 5),
  })),

  // 12 Utilities Expenses
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `expense_utilities_${i + 1}`,
    title: `${['Elektrik', 'Su', 'Doğalgaz', 'İnternet'][i % 4]} - Eylül`,
    description: `${['Bölüm ', 'Blok ', 'Tümü '][i % 3]}${new Date(2024, 8, 1).toLocaleDateString('tr-TR')}`,
    amount: [12500, 8750, 6250, 4500][i % 4],
    category: ExpenseTypeEnum.UTILITIES,
    date: new Date(2024, 8, 10 + i),
    dueDate: new Date(2024, 8, 20),
    paidDate: i < 10 ? new Date(2024, 8, 21) : undefined,
    status: [ExpenseStatusEnum.PAID, ExpenseStatusEnum.PENDING, ExpenseStatusEnum.APPROVED][i % 3],
    departmentId: 'dept_maintenance',
    approvedBy: i < 10 ? 'user_mudur' : undefined,
    createdAt: new Date(2024, 8, 10),
    updatedAt: new Date(2024, 8, 10),
  })),

  // 10 Materials & Equipment
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `expense_materials_${i + 1}`,
    title: `${['Eğitim Materyali', 'Temizlik Malzemeleri', 'Ofis Ekipmanı', 'Kitap Alımı'][i % 4]} - Eylül`,
    description: 'Tedarikçi faturası',
    amount: [2500, 3500, 5000, 7500][i % 4],
    category: [ExpenseTypeEnum.MATERIALS, ExpenseTypeEnum.EQUIPMENT, ExpenseTypeEnum.MATERIALS][i % 3],
    date: new Date(2024, 8, 15 + i),
    dueDate: new Date(2024, 8, 25),
    paidDate: i < 8 ? new Date(2024, 8, 26) : undefined,
    status: [ExpenseStatusEnum.PAID, ExpenseStatusEnum.PENDING][i % 2],
    departmentId: `dept_${i % 3}`,
    approvedBy: i < 8 ? 'user_mudur' : undefined,
    createdAt: new Date(2024, 8, 15),
    updatedAt: new Date(2024, 8, 15),
  })),

  // 8 Maintenance
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `expense_maintenance_${i + 1}`,
    title: `${['Elektrik İşleri', 'Boyacılık', 'Tesisatçı', 'Cam Tamiri'][i % 4]} - Eylül`,
    description: 'Tamir ve bakım',
    amount: [3000, 4500, 6000, 8500][i % 4],
    category: ExpenseTypeEnum.MAINTENANCE,
    date: new Date(2024, 8, 8 + i * 2),
    dueDate: new Date(2024, 8, 15 + i * 2),
    paidDate: i < 6 ? new Date(2024, 8, 18 + i * 2) : undefined,
    status: [ExpenseStatusEnum.PAID, ExpenseStatusEnum.PENDING, ExpenseStatusEnum.APPROVED][i % 3],
    departmentId: 'dept_maintenance',
    approvedBy: i < 6 ? 'user_mudur' : undefined,
    createdAt: new Date(2024, 8, 8),
    updatedAt: new Date(2024, 8, 8),
  })),

  // 5 Rent
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `expense_rent_${i + 1}`,
    title: 'Aylık Kira Ödemesi',
    description: `${['Ana Bina', 'Yan Bina', 'Spor Salonu'][i % 3]} kirasıı`,
    amount: 120000,
    category: ExpenseTypeEnum.RENT,
    date: new Date(2024, 8, 1),
    dueDate: new Date(2024, 8, 5),
    paidDate: new Date(2024, 8, 5),
    status: ExpenseStatusEnum.PAID,
    departmentId: 'dept_admin',
    approvedBy: 'user_mudur',
    createdAt: new Date(2024, 8, 1),
    updatedAt: new Date(2024, 8, 1),
  })),

  // 5 Admin
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `expense_admin_${i + 1}`,
    title: `${['Reklam & Tanıtım', 'Sigorta', 'Yasal Danışmanlık', 'Muhasebe', 'Danışmanlık'][i % 5]}`,
    description: 'İdari gider',
    amount: [5000, 8000, 12000, 6000, 4500][i % 5],
    category: ExpenseTypeEnum.ADMIN,
    date: new Date(2024, 8, 5 + i * 5),
    dueDate: new Date(2024, 8, 15 + i * 5),
    paidDate: i < 4 ? new Date(2024, 8, 20 + i * 5) : undefined,
    status: [ExpenseStatusEnum.PAID, ExpenseStatusEnum.PENDING][i % 2],
    departmentId: 'dept_admin',
    approvedBy: i < 4 ? 'user_mudur' : undefined,
    createdAt: new Date(2024, 8, 5),
    updatedAt: new Date(2024, 8, 5),
  })),
];

// ============================================
// MOCK SALES DATA - 35 Sales
// ============================================

export const mockSales: Sale[] = [
  // 10 Book Sales
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `sale_book_${i + 1}`,
    saleNo: `SAL-BOOK-${String(i + 1).padStart(4, '0')}`,
    customerId: `student_${(i % 20) + 1}`,
    customerName: studentNames[i % 20],
    items: [
      {
        productId: `prod_math_${9 + (i % 2)}`,
        productName: `Matematik ${9 + (i % 2)}`,
        category: SaleTypeEnum.BOOK,
        quantity: 1,
        unitPrice: 125,
        totalPrice: 125,
      },
      {
        productId: `prod_book_${i % 4}`,
        productName: `Ders Kitabı ${i % 4}`,
        category: SaleTypeEnum.BOOK,
        quantity: 1,
        unitPrice: 85,
        totalPrice: 85,
      },
    ],
    totalAmount: 210,
    discount: 0,
    tax: 38,
    netAmount: 248,
    paymentMethod: PaymentMethodEnum.CASH,
    status: SaleStatusEnum.COMPLETED,
    saleDate: new Date(2024, 8, 5 + i),
    invoiceNo: `INV-BOOK-${String(i + 1).padStart(4, '0')}`,
    createdAt: new Date(2024, 8, 5 + i),
    updatedAt: new Date(2024, 8, 5 + i),
  })),

  // 8 Uniform Sales
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `sale_uniform_${i + 1}`,
    saleNo: `SAL-UNI-${String(i + 1).padStart(4, '0')}`,
    customerId: `student_${(i % 20) + 1}`,
    customerName: studentNames[i % 20],
    items: [
      {
        productId: 'prod_uniform_1',
        productName: 'Okul Üniforma - Kız',
        category: SaleTypeEnum.UNIFORM,
        quantity: 2,
        unitPrice: 450,
        totalPrice: 900,
      },
    ],
    totalAmount: 900,
    discount: 0,
    tax: 162,
    netAmount: 1062,
    paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
    status: SaleStatusEnum.COMPLETED,
    saleDate: new Date(2024, 7, 10 + i * 2),
    invoiceNo: `INV-UNI-${String(i + 1).padStart(4, '0')}`,
    createdAt: new Date(2024, 7, 10 + i * 2),
    updatedAt: new Date(2024, 7, 10 + i * 2),
  })),

  // 10 Stationery Sales
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `sale_stationery_${i + 1}`,
    saleNo: `SAL-STA-${String(i + 1).padStart(4, '0')}`,
    customerId: undefined,
    customerName: `Müşteri ${i + 1}`,
    items: [
      {
        productId: `prod_stat_${i % 5}`,
        productName: `${['Defter', 'Kalem', 'Silgi', 'Cetveli', 'Yapıştırıcı'][i % 5]}`,
        category: SaleTypeEnum.STATIONERY,
        quantity: [2, 3, 1, 5, 10][i % 5],
        unitPrice: [15, 5, 3, 2, 2][i % 5],
        totalPrice: [30, 15, 3, 10, 20][i % 5],
      },
    ],
    totalAmount: [30, 15, 3, 10, 20][i % 5],
    discount: 0,
    tax: 5,
    netAmount: [35, 20, 8, 15, 25][i % 5],
    paymentMethod: PaymentMethodEnum.CASH,
    status: SaleStatusEnum.COMPLETED,
    saleDate: new Date(2024, 8, 12 + i),
    invoiceNo: `INV-STA-${String(i + 1).padStart(4, '0')}`,
    createdAt: new Date(2024, 8, 12 + i),
    updatedAt: new Date(2024, 8, 12 + i),
  })),

  // 7 Canteen Sales
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `sale_canteen_${i + 1}`,
    saleNo: `SAL-CAN-${String(i + 1).padStart(4, '0')}`,
    customerId: undefined,
    customerName: 'Kantin Satışları',
    items: [
      {
        productId: 'prod_can_1',
        productName: 'Kahvaltı Seti',
        category: SaleTypeEnum.CANTEEN,
        quantity: 15,
        unitPrice: 25,
        totalPrice: 375,
      },
      {
        productId: 'prod_can_2',
        productName: 'Meşrubat',
        category: SaleTypeEnum.CANTEEN,
        quantity: 30,
        unitPrice: 10,
        totalPrice: 300,
      },
    ],
    totalAmount: 675,
    discount: 0,
    tax: 121,
    netAmount: 796,
    paymentMethod: PaymentMethodEnum.CASH,
    status: SaleStatusEnum.COMPLETED,
    saleDate: new Date(2024, 8, 18 + i),
    invoiceNo: undefined,
    createdAt: new Date(2024, 8, 18 + i),
    updatedAt: new Date(2024, 8, 18 + i),
  })),
];

// ============================================
// MOCK CASH REGISTERS
// ============================================

export const mockCashRegisters: CashRegister[] = [
  {
    id: 'cash_reg_1',
    name: 'Ana Kasa',
    responsible: 'Sekreter Ayşe',
    openingBalance: 10000,
    currentBalance: 45230,
    closingBalance: undefined,
    openDate: new Date(2024, 8, 1),
    closeDate: undefined,
    transactions: [],
    status: 'open',
    createdAt: new Date(2024, 8, 1),
    updatedAt: new Date(2024, 9, 19),
  },
  {
    id: 'cash_reg_2',
    name: 'Kantin Kasası',
    responsible: 'Kantin Görevlisi Mehmet',
    openingBalance: 2000,
    currentBalance: 8750,
    closingBalance: undefined,
    openDate: new Date(2024, 8, 1),
    closeDate: undefined,
    transactions: [],
    status: 'open',
    createdAt: new Date(2024, 8, 1),
    updatedAt: new Date(2024, 9, 19),
  },
  {
    id: 'cash_reg_3',
    name: 'Sekreterlik Kasası',
    responsible: 'Sekreter Zeynep',
    openingBalance: 5000,
    currentBalance: 12500,
    closingBalance: undefined,
    openDate: new Date(2024, 8, 1),
    closeDate: undefined,
    transactions: [],
    status: 'open',
    createdAt: new Date(2024, 8, 1),
    updatedAt: new Date(2024, 9, 19),
  },
];

// ============================================
// MOCK BANK ACCOUNTS
// ============================================

export const mockBankAccounts: BankAccount[] = [
  {
    id: 'bank_acc_1',
    accountNo: 'TR620006400519786457939999',
    bankName: 'Türkiye İş Bankası',
    accountType: 'Vadesiz',
    accountHolder: 'AkademiHub Okulu',
    balance: 450000,
    openDate: new Date(2020, 0, 15),
    status: 'active',
    createdAt: new Date(2020, 0, 15),
    updatedAt: new Date(2024, 9, 19),
  },
  {
    id: 'bank_acc_2',
    accountNo: 'TR880012900119533007339999',
    bankName: 'Garanti BBVA',
    accountType: 'Vadesiz',
    accountHolder: 'AkademiHub Okulu',
    balance: 250000,
    openDate: new Date(2021, 6, 1),
    status: 'active',
    createdAt: new Date(2021, 6, 1),
    updatedAt: new Date(2024, 9, 19),
  },
];

// ============================================
// MOCK BUDGET
// ============================================

export const mockBudget: Budget = {
  id: 'budget_2024',
  name: '2024 Yılı Bütçesi',
  period: {
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 11, 31),
  },
  categories: [
    {
      category: ExpenseTypeEnum.PAYROLL,
      budgeted: 600000,
      spent: 350000,
      remaining: 250000,
      percentage: 58,
    },
    {
      category: ExpenseTypeEnum.UTILITIES,
      budgeted: 120000,
      spent: 85000,
      remaining: 35000,
      percentage: 71,
    },
    {
      category: ExpenseTypeEnum.MATERIALS,
      budgeted: 80000,
      spent: 45000,
      remaining: 35000,
      percentage: 56,
    },
    {
      category: ExpenseTypeEnum.MAINTENANCE,
      budgeted: 60000,
      spent: 28000,
      remaining: 32000,
      percentage: 47,
    },
    {
      category: ExpenseTypeEnum.RENT,
      budgeted: 360000,
      spent: 360000,
      remaining: 0,
      percentage: 100,
    },
    {
      category: ExpenseTypeEnum.ADMIN,
      budgeted: 100000,
      spent: 55000,
      remaining: 45000,
      percentage: 55,
    },
    {
      category: ExpenseTypeEnum.EQUIPMENT,
      budgeted: 150000,
      spent: 75000,
      remaining: 75000,
      percentage: 50,
    },
    {
      category: ExpenseTypeEnum.OTHER,
      budgeted: 50000,
      spent: 20000,
      remaining: 30000,
      percentage: 40,
    },
  ],
  totalBudget: 1520000,
  totalSpent: 1018000,
  totalRemaining: 502000,
  status: 'active',
  approvedBy: 'user_mudur',
  createdAt: new Date(2023, 11, 20),
  updatedAt: new Date(2024, 8, 1),
};
