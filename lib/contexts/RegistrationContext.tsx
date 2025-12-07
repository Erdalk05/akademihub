'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface RegistrationFormData {
  // Step 1: Personal Info
  studentNo: string; // Otomatik üretilen öğrenci numarası
  firstName: string;
  lastName: string;
  tcId: string;
  birthDate: string;
  birthPlace: string;
  gender: 'Erkek' | 'Kız';
  nationality: string;
  phone: string;
  email: string;
  photo?: string | null;
  
  // Manual Override Flags
  tcDataOverridden: boolean; // User edited TC-fetched data
  addressOverridden: boolean; // User edited address data
  
  // Step 1: Address
  province: string;
  district: string;
  street: string;
  buildingNo: string;
  apartmentNo: string;
  fullAddress: string;
  
  // Step 2: Parent Info
  motherName: string;
  motherSurname: string;
  motherTc: string;
  motherPhone: string;
  motherEmail: string;
  fatherName: string;
  fatherSurname: string;
  fatherTc: string;
  fatherPhone: string;
  fatherEmail: string;
  financialResponsible: 'mother' | 'father';
  emergencyContactName: string;
  emergencyContactPhone: string;
  parentHomeAddress: string;
  parentWorkAddress: string;
  
  // Step 2: Health Info
  bloodType: string;
  allergies: string;
  chronicIllness: string;
  regularMedications: string;
  emergencyInterventionConsent: boolean;
  
  // Step 3: Education
  class: string;
  section: string;
  academicYear: string;
  registrationDate: string;
  courseStartDate: string;
  
  // Step 3: Finance
  selectedPackageId?: string;
  grossFee: number;
  discountSibling: number;
  discountEarlyBird: number;
  discountStaff: number;
  discountScholarship: number;
  netFee: number;
  
  // Step 3: Payment Plan
  paymentMethod: 'cash' | 'installment' | 'upfront';
  installmentCount: number;
  installments: Installment[];
  
  // Step 3: Bank Info
  bankName: string;
  accountName: string;
  iban: string;
  
  // Step 3: Contract
  acceptTerms: boolean;
  parentSignature: string;
  studentSignature: string;
  smsVerificationCode?: string;
  smsVerified: boolean;
  
  // Step 4: Documents
  diplomaUploaded: boolean;
  idCopyUploaded: boolean;
  
  // Step 4: Final
  finalApproval: boolean;
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  method: 'CC' | 'EFT' | 'Cash' | 'Check';
  description?: string;
}

export interface FeePackage {
  id: string;
  name: string;
  grade: string;
  year: string;
  grossFee: number;
  availableDiscounts: {
    sibling: number;
    earlyBird: number;
    staff: number;
    scholarship: number;
  };
  installmentOptions: number[];
}

interface RegistrationContextType {
  formData: RegistrationFormData;
  updateFormData: (updates: Partial<RegistrationFormData>) => void;
  resetForm: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  saveProgress: () => void;
  loadProgress: () => void;
  isAutoSaving: boolean;
  lastSaved: Date | null;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_FORM_DATA: RegistrationFormData = {
  studentNo: '', // Otomatik üretilecek
  firstName: '',
  lastName: '',
  tcId: '',
  birthDate: '',
  birthPlace: '',
  gender: 'Erkek',
  nationality: 'Türkiye Cumhuriyeti',
  phone: '',
  email: '',
  photo: null,
  
  // Manual Override Flags
  tcDataOverridden: false,
  addressOverridden: false,
  
  province: '',
  district: '',
  street: '',
  buildingNo: '',
  apartmentNo: '',
  fullAddress: '',
  
  motherName: '',
  motherSurname: '',
  motherTc: '',
  motherPhone: '',
  motherEmail: '',
  fatherName: '',
  fatherSurname: '',
  fatherTc: '',
  fatherPhone: '',
  fatherEmail: '',
  financialResponsible: 'mother',
  emergencyContactName: '',
  emergencyContactPhone: '',
  parentHomeAddress: '',
  parentWorkAddress: '',
  
  bloodType: 'O+',
  allergies: '',
  chronicIllness: '',
  regularMedications: '',
  emergencyInterventionConsent: false,
  
  class: '9',
  section: 'A',
  academicYear: '2025-2026',
  registrationDate: new Date().toISOString().slice(0, 10),
  courseStartDate: '',
  
  grossFee: 100000,
  discountSibling: 0,
  discountEarlyBird: 0,
  discountStaff: 0,
  discountScholarship: 0,
  netFee: 100000,
  
  paymentMethod: 'installment',
  installmentCount: 8,
  installments: [],
  
  bankName: '',
  accountName: '',
  iban: '',
  
  acceptTerms: false,
  parentSignature: '',
  studentSignature: '',
  smsVerified: false,
  
  diplomaUploaded: false,
  idCopyUploaded: false,
  
  finalApproval: false,
};

// ============================================
// CONTEXT
// ============================================

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within RegistrationProvider');
  }
  return context;
};

// ============================================
// PROVIDER
// ============================================

interface ProviderProps {
  children: ReactNode;
}

export const RegistrationProvider: React.FC<ProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<RegistrationFormData>(DEFAULT_FORM_DATA);
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveProgress = React.useCallback(() => {
    setIsAutoSaving(true);
    try {
      localStorage.setItem('registrationDraft', JSON.stringify(formData));
      localStorage.setItem('registrationStep', currentStep.toString());
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setTimeout(() => setIsAutoSaving(false), 500);
    }
  }, [formData, currentStep]);

  const loadProgress = React.useCallback(() => {
    try {
      const savedData = localStorage.getItem('registrationDraft');
      const savedStep = localStorage.getItem('registrationStep');
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData({ ...DEFAULT_FORM_DATA, ...parsed });
      }
      
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData, currentStep, saveProgress]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const updateFormData = (updates: Partial<RegistrationFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      
      // Auto-calculate net fee
      if ('grossFee' in updates || 'discountSibling' in updates || 
          'discountEarlyBird' in updates || 'discountStaff' in updates || 
          'discountScholarship' in updates) {
        const totalDiscount = 
          updated.discountSibling + 
          updated.discountEarlyBird + 
          updated.discountStaff + 
          updated.discountScholarship;
        updated.netFee = Math.max(0, updated.grossFee - totalDiscount);
      }
      
      return updated;
    });
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setCurrentStep(1);
    localStorage.removeItem('registrationDraft');
    localStorage.removeItem('registrationStep');
  };

  const value: RegistrationContextType = {
    formData,
    updateFormData,
    resetForm,
    currentStep,
    setCurrentStep,
    saveProgress,
    loadProgress,
    isAutoSaving,
    lastSaved,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

