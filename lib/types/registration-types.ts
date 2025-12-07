/**
 * Type Definitions for Student Registration System V2
 * 
 * Production-grade types with strict validation requirements
 * Matches Supabase database schema
 */

import { InstallmentPlan, TuitionCalculationOutput } from '@/lib/hooks/useTuitionCalculator';

/**
 * Student Personal Information
 */
export interface StudentPersonalInfo {
  // Identity
  tcKimlikNo: string;           // 11-digit Turkish ID
  firstName: string;
  lastName: string;
  dateOfBirth: string;          // ISO date
  placeOfBirth: string;
  gender: 'male' | 'female';
  nationality: string;
  
  // Contact
  phone?: string;
  email?: string;
  
  // Photo
  photoUrl?: string;            // Supabase storage URL or base64
  
  // Address
  address: {
    city: string;
    district: string;
    fullAddress: string;
  };
}

/**
 * Parent Information
 */
export interface ParentInfo {
  // Mother
  mother: {
    firstName: string;
    lastName: string;
    tcKimlikNo?: string;
    phone: string;
    email?: string;
  };
  
  // Father
  father: {
    firstName: string;
    lastName: string;
    tcKimlikNo?: string;
    phone?: string;
    email?: string;
  };
  
  // Financial Responsible
  financialResponsible: 'mother' | 'father';
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    phone: string;
    relation?: string;
  };
  
  // Addresses
  homeAddress?: string;
  workAddress?: string;
}

/**
 * Health Information
 */
export interface HealthInfo {
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string;
  chronicDiseases?: string;
  medications?: string;
  emergencyMedicalConsent: boolean;
}

/**
 * Education Information
 */
export interface EducationInfo {
  grade: string;                // e.g., "9. Sınıf" or custom like "Hazırlık Grubu"
  section: string;              // e.g., "A Şubesi" or custom like "Özel Grup"
  isCustomGrade: boolean;       // Flag: true if grade is custom entry
  isCustomSection: boolean;     // Flag: true if section is custom entry
  academicYear: string;         // e.g., "2025-2026"
  enrollmentDate: string;       // ISO date
  startDate: string;            // Course start date (ISO)
}

/**
 * Financial Information
 */
export interface FinancialInfo {
  feePackageId: string;         // Reference to fee package
  basePrice: number;
  
  // Manual Price Override
  isManualPricing: boolean;     // Flag: true if user bypassed standard packages
  manualPriceReason?: string;   // Optional: reason for manual pricing
  
  // Discounts
  discounts: {
    sibling: number;
    earlyBird: number;
    staff: number;
    scholarship: number;
  };
  
  // Payment
  paymentMethod: 'cash' | 'upfront' | 'installment';
  installmentCount?: number;
  
  // Calculation Result
  calculation: TuitionCalculationOutput;
}

/**
 * Contract Information
 */
export interface ContractInfo {
  contractAccepted: boolean;
  acceptedAt?: string;          // ISO timestamp
  ipAddress?: string;
  digitalSignature?: string;    // Base64 or signature pad data
  smsVerified: boolean;
  smsVerificationCode?: string;
  contractPdfUrl?: string;      // Supabase storage URL
}

/**
 * Complete Registration Data
 */
export interface StudentRegistrationData {
  // Step 1: Personal Info
  personal: StudentPersonalInfo;
  
  // Step 2: Parent & Health
  parent: ParentInfo;
  health: HealthInfo;
  
  // Step 3: Education & Finance
  education: EducationInfo;
  finance: FinancialInfo;
  contract: ContractInfo;
  
  // Metadata
  status: 'draft' | 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;           // User ID who created the registration
}

/**
 * Supabase RPC Input
 */
export interface RegisterStudentTransactionInput {
  // Student
  student: {
    tc_kimlik_no: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    place_of_birth: string;
    gender: string;
    nationality: string;
    phone: string | null;
    email: string | null;
    photo_url: string | null;
    address_city: string;
    address_district: string;
    address_full: string;
    grade: string;
    section: string;
    academic_year: string;
    enrollment_date: string;
    start_date: string;
    status: 'active' | 'inactive';
  };
  
  // Parent
  parent: {
    student_tc_kimlik_no: string;
    mother_first_name: string;
    mother_last_name: string;
    mother_tc_kimlik_no: string | null;
    mother_phone: string;
    mother_email: string | null;
    father_first_name: string;
    father_last_name: string;
    father_tc_kimlik_no: string | null;
    father_phone: string | null;
    father_email: string | null;
    financial_responsible: 'mother' | 'father';
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relation: string | null;
    home_address: string | null;
    work_address: string | null;
    blood_type: string;
    allergies: string | null;
    chronic_diseases: string | null;
    medications: string | null;
    emergency_medical_consent: boolean;
  };
  
  // Payment Plan
  payment_plan: {
    student_tc_kimlik_no: string;
    base_price: number;
    total_discount: number;
    discounted_price: number;
    vat_amount: number;
    total_price: number;
    payment_method: 'cash' | 'upfront' | 'installment';
    installment_count: number | null;
    discount_details: any; // JSONB
    calculation_data: any; // JSONB - Full calculation output
  };
  
  // Installments (array)
  installments: Array<{
    student_tc_kimlik_no: string;
    installment_number: number;
    due_date: string;
    amount: number;
    is_paid: boolean;
    description: string;
  }>;
  
  // First Transaction (down payment or full payment)
  transaction: {
    student_tc_kimlik_no: string;
    amount: number;
    transaction_type: 'payment' | 'refund';
    payment_method: 'cash' | 'credit_card' | 'bank_transfer';
    description: string;
    transaction_date: string;
    reference_number: string | null;
  };
  
  // Contract
  contract: {
    student_tc_kimlik_no: string;
    contract_accepted: boolean;
    accepted_at: string;
    ip_address: string | null;
    digital_signature: string | null;
    sms_verified: boolean;
    contract_pdf_url: string | null;
  };
}

/**
 * Supabase RPC Output
 */
export interface RegisterStudentTransactionOutput {
  success: boolean;
  student_id: string | null;       // TC Kimlik No
  parent_id: string | null;
  payment_plan_id: string | null;
  transaction_id: string | null;
  error: string | null;
  message: string;
}

/**
 * Fee Package Definition
 */
export interface FeePackage {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
  basePrice: number;
  vatRate: number;
  discountLimits: {
    sibling: number;
    earlyBird: number;
    staff: number;
    scholarship: number;
  };
  installmentOptions: number[];  // e.g., [1, 2, 4, 6, 8, 10, 12]
  description?: string;
}

/**
 * Form Validation Errors
 */
export interface ValidationErrors {
  [key: string]: string | ValidationErrors;
}

/**
 * Form State
 */
export interface RegistrationFormState {
  data: Partial<StudentRegistrationData>;
  currentStep: number;
  errors: ValidationErrors;
  isSubmitting: boolean;
  isDraft: boolean;
}

