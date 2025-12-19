// K12 Enrollment System Types

export interface Student {
  firstName: string;
  lastName: string;
  tcNo: string;
  studentNo: string; // Otomatik oluşturulan öğrenci numarası
  birthDate: string;
  birthPlace: string; // Doğum yeri
  nationality: string; // Uyruk
  gender: 'male' | 'female';
  bloodGroup: string;
  enrolledClass: string; // Kayıt yapılan sınıf
  phone: string;
  phone2: string; // İkinci telefon
  email: string;
  city: string;
  district: string;
  address: string;
  previousSchool: string;
  healthNotes: string;
  photoUrl?: string;
}

export interface Guardian {
  id: string;
  type: 'mother' | 'father' | 'legal' | 'sponsor';
  firstName: string;
  lastName: string;
  tcNo: string;
  phone: string;
  email: string;
  // İş bilgileri
  job: string;
  workplace: string;
  workAddress: string;
  workPhone: string;
  // Ev adresi
  homeAddress: string;
  homeCity: string;
  homeDistrict: string;
  isEmergency: boolean;
}

export interface Education {
  programId: string;
  programName: string;
  gradeId: string;
  gradeName: string;
  branchId: string;
  branchName: string;
  academicYear: string;
  studentType: 'new' | 'transfer' | 'scholarship' | 'renewal' | 'edit';
}

export interface Installment {
  no: number;
  amount: number;
  dueDate: string;
  date?: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Discount {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  amount?: number;
}

export interface Payment {
  totalFee: number;
  discountPercent: number; // Yüzdelik indirim oranı
  discount: number; // Hesaplanmış indirim tutarı (₺)
  discountReason: string;
  netFee: number;
  downPayment: number;
  downPaymentDate: string; // Peşin ödeme tarihi
  installmentCount: number;
  firstInstallmentDate: string; // İlk taksit başlangıç tarihi
  monthlyInstallment: number;
  installments: Installment[];
  paymentMethod: 'cash' | 'credit' | 'transfer';
}

export interface Contract {
  guardianSignature: string;
  guardianSignedAt: string;
  institutionOfficer: string;
  institutionSignedAt: string;
  kvkkApproved: boolean;
  termsApproved: boolean;
  paymentApproved: boolean;
}

export interface EnrollmentData {
  id?: string;
  student: Student;
  guardians: Guardian[];
  education: Education;
  payment: Payment;
  contract: Contract;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

// Constants
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

// Uyruk listesi
export const NATIONALITIES = [
  { id: 'TC', name: 'T.C. Vatandaşı' },
  { id: 'KKTC', name: 'K.K.T.C. Vatandaşı' },
  { id: 'OTHER', name: 'Yabancı Uyruklu' },
];

// Türkiye illeri
export const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 
  'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 
  'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];

export const GRADES = [
  { id: '1', name: '1. Sınıf' },
  { id: '2', name: '2. Sınıf' },
  { id: '3', name: '3. Sınıf' },
  { id: '4', name: '4. Sınıf' },
  { id: '5', name: '5. Sınıf' },
  { id: '6', name: '6. Sınıf' },
  { id: '7', name: '7. Sınıf' },
  { id: '8', name: '8. Sınıf' },
  { id: '9', name: '9. Sınıf' },
  { id: '10', name: '10. Sınıf' },
  { id: '11', name: '11. Sınıf' },
  { id: '12', name: '12. Sınıf' },
  { id: 'mezun', name: 'Mezun' },
];

export const PROGRAMS = [
  { id: 'lgs', name: 'LGS Hazırlık', basePrice: 120000 },
  { id: 'yks', name: 'YKS Hazırlık', basePrice: 150000 },
  { id: 'ib', name: 'IB Diploma', basePrice: 250000 },
  { id: 'general', name: 'Genel Eğitim', basePrice: 80000 },
  { id: 'summer', name: 'Yaz Okulu', basePrice: 45000 },
];

export const BRANCHES = [
  { id: 'say', name: 'Sayısal' },
  { id: 'ea', name: 'Eşit Ağırlık' },
  { id: 'soz', name: 'Sözel' },
  { id: 'dil', name: 'Dil' },
];

export const STUDENT_TYPES = [
  { id: 'new', name: 'Yeni Kayıt' },
  { id: 'transfer', name: 'Nakil' },
  { id: 'scholarship', name: 'Burslu' },
  { id: 'renewal', name: 'Kayıt Yenileme' },
];

export const GUARDIAN_TYPES = [
  { id: 'mother', name: 'Anne' },
  { id: 'father', name: 'Baba' },
  { id: 'legal', name: 'Yasal Veli' },
  { id: 'sponsor', name: 'Sponsor Veli' },
];

// Çoklu Eğitim Yılları - Manuel olarak eklenebilir
export const ACADEMIC_YEARS = [
  { id: '2023-2024', name: '2023-2024', status: 'past' },
  { id: '2024-2025', name: '2024-2025', status: 'past' },
  { id: '2025-2026', name: '2025-2026', status: 'current' },
  { id: '2026-2027', name: '2026-2027', status: 'future' },
  { id: '2026-2027', name: '2026-2027', status: 'future' },
];

// Otomatik öğrenci numarası oluştur
export const generateStudentNo = (): string => {
  if (typeof window === 'undefined') {
    return '250000'; // SSR için sabit değer
  }
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${year}${random}`;
};

// Default Values
export const defaultStudent: Student = {
  firstName: '',
  lastName: '',
  tcNo: '',
  studentNo: '', // Client tarafında generateStudentNo() ile set edilecek
  birthDate: '',
  birthPlace: '',
  nationality: 'TC',
  gender: 'male',
  bloodGroup: '',
  enrolledClass: '',
  phone: '',
  phone2: '',
  email: '',
  city: '',
  district: '',
  address: '',
  previousSchool: '',
  healthNotes: '',
};

export const defaultGuardian: Guardian = {
  id: '',
  type: 'mother',
  firstName: '',
  lastName: '',
  tcNo: '',
  phone: '',
  email: '',
  job: '',
  workplace: '',
  workAddress: '',
  workPhone: '',
  homeAddress: '',
  homeCity: '',
  homeDistrict: '',
  isEmergency: false,
};

export const defaultEducation: Education = {
  programId: '',
  programName: '',
  gradeId: '',
  gradeName: '',
  branchId: '',
  branchName: '',
  academicYear: '2025-2026',
  studentType: 'new',
};

export const defaultPayment: Payment = {
  totalFee: 0,
  discountPercent: 0,
  discount: 0,
  discountReason: '',
  netFee: 0,
  downPayment: 0,
  downPaymentDate: '', // Client tarafında set edilecek
  installmentCount: 1,
  firstInstallmentDate: '', // İlk taksit başlangıç tarihi
  monthlyInstallment: 0,
  installments: [],
  paymentMethod: 'transfer',
};

export const defaultContract: Contract = {
  guardianSignature: '',
  guardianSignedAt: '',
  institutionOfficer: '',
  institutionSignedAt: '',
  kvkkApproved: false,
  termsApproved: false,
  paymentApproved: false,
};

export const defaultEnrollment: EnrollmentData = {
  student: defaultStudent,
  guardians: [
    { ...defaultGuardian, id: 'g1', type: 'mother', isEmergency: true },
    { ...defaultGuardian, id: 'g2', type: 'father' },
  ],
  education: defaultEducation,
  payment: defaultPayment,
  contract: defaultContract,
  status: 'draft',
};

