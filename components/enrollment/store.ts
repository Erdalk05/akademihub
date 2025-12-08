'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  EnrollmentData, 
  Student, 
  Guardian, 
  Education, 
  Payment, 
  Contract,
  Installment,
  defaultEnrollment,
  defaultGuardian,
  generateStudentNo,
  PROGRAMS
} from './types';

interface EnrollmentStore extends EnrollmentData {
  // Student Actions
  updateStudent: (data: Partial<Student>) => void;
  regenerateStudentNo: () => void;
  
  // Guardian Actions
  addGuardian: () => void;
  updateGuardian: (id: string, data: Partial<Guardian>) => void;
  removeGuardian: (id: string) => void;
  
  // Education Actions
  updateEducation: (data: Partial<Education>) => void;
  
  // Payment Actions
  updatePayment: (data: Partial<Payment>) => void;
  calculateInstallments: () => void;
  
  // Contract Actions
  updateContract: (data: Partial<Contract>) => void;
  signContract: (signature: string) => void;
  
  // General Actions
  setStatus: (status: EnrollmentData['status']) => void;
  reset: () => void;
  loadEnrollment: (data: EnrollmentData) => void;
}

export const useEnrollmentStore = create<EnrollmentStore>()(
  persist(
    (set, get) => ({
      ...defaultEnrollment,

      // Student Actions
      updateStudent: (data) => set((state) => ({
        student: { ...state.student, ...data }
      })),

      // Guardian Actions
      addGuardian: () => set((state) => ({
        guardians: [
          ...state.guardians,
          { ...defaultGuardian, id: `g${Date.now()}`, type: 'legal' }
        ]
      })),

      updateGuardian: (id, data) => set((state) => ({
        guardians: state.guardians.map((g) =>
          g.id === id ? { ...g, ...data } : g
        )
      })),

      removeGuardian: (id) => set((state) => ({
        guardians: state.guardians.filter((g) => g.id !== id)
      })),

      // Education Actions
      updateEducation: (data) => set((state) => {
        const newEducation = { ...state.education, ...data };
        
        // Program seçildiğinde otomatik fiyat güncelle
        if (data.programId) {
          const program = PROGRAMS.find(p => p.id === data.programId);
          if (program) {
            newEducation.programName = program.name;
            // Payment'ı da güncelle
            const netFee = program.basePrice - state.payment.discount;
            return {
              education: newEducation,
              payment: {
                ...state.payment,
                totalFee: program.basePrice,
                netFee: netFee > 0 ? netFee : 0
              }
            };
          }
        }
        
        return { education: newEducation };
      }),

      // Payment Actions
      updatePayment: (data) => set((state) => {
        const newPayment = { ...state.payment, ...data };
        
        // Net ücret hesapla
        newPayment.netFee = newPayment.totalFee - newPayment.discount;
        if (newPayment.netFee < 0) newPayment.netFee = 0;
        
        // Aylık taksit hesapla
        if (newPayment.installmentCount > 0) {
          const remaining = newPayment.netFee - newPayment.downPayment;
          newPayment.monthlyInstallment = Math.ceil(remaining / newPayment.installmentCount);
        }
        
        return { payment: newPayment };
      }),

      calculateInstallments: () => set((state) => {
        const { netFee, downPayment, downPaymentDate, installmentCount, firstInstallmentDate } = state.payment;
        const remaining = netFee - downPayment;
        const monthlyAmount = installmentCount > 0 ? Math.ceil(remaining / installmentCount) : 0;
        
        const installments: Installment[] = [];
        const today = new Date();
        
        // Peşinat (ayrı tarih ile)
        if (downPayment > 0) {
          const pesinDate = downPaymentDate ? new Date(downPaymentDate) : today;
          installments.push({
            no: 0,
            amount: downPayment,
            dueDate: pesinDate.toISOString().split('T')[0],
            status: 'pending'
          });
        }
        
        // Taksitler (ilk taksit başlangıç tarihinden itibaren)
        const startDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date(today.setMonth(today.getMonth() + 1));
        
        for (let i = 1; i <= installmentCount; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(startDate.getMonth() + (i - 1)); // İlk taksit başlangıç tarihinden itibaren
          
          const isLast = i === installmentCount;
          const amount = isLast 
            ? remaining - (monthlyAmount * (installmentCount - 1))
            : monthlyAmount;
          
          installments.push({
            no: i,
            amount: amount > 0 ? amount : 0,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'pending'
          });
        }
        
        return {
          payment: {
            ...state.payment,
            monthlyInstallment: monthlyAmount,
            installments
          }
        };
      }),

      // Contract Actions
      updateContract: (data) => set((state) => ({
        contract: { ...state.contract, ...data }
      })),

      signContract: (signature) => set((state) => ({
        contract: {
          ...state.contract,
          guardianSignature: signature,
          guardianSignedAt: new Date().toISOString()
        }
      })),

      // General Actions
      setStatus: (status) => set({ status }),

      reset: () => set({
        ...defaultEnrollment,
        student: {
          ...defaultEnrollment.student,
          studentNo: generateStudentNo() // Her sıfırlamada yeni numara üret
        }
      }),

      // Yeni numara üretme fonksiyonu
      regenerateStudentNo: () => set((state) => ({
        student: {
          ...state.student,
          studentNo: generateStudentNo()
        }
      })),

      loadEnrollment: (data) => set(data),
    }),
    {
      name: 'enrollment-store-v6',
      partialize: (state) => ({
        student: state.student,
        guardians: state.guardians,
        education: state.education,
        payment: state.payment,
        contract: state.contract,
        status: state.status,
      }),
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);

// Helper hook for form validation
export const useEnrollmentValidation = () => {
  const store = useEnrollmentStore();
  
  const isStudentValid = () => {
    const { student } = store;
    return (
      student.firstName.length >= 2 &&
      student.lastName.length >= 2 &&
      student.tcNo.length === 11 &&
      student.birthDate !== ''
    );
  };
  
  const isGuardiansValid = () => {
    const { guardians } = store;
    return guardians.length > 0 && guardians.some(g => 
      g.firstName.length >= 2 && 
      g.lastName.length >= 2 && 
      g.phone.length >= 10
    );
  };
  
  const isEducationValid = () => {
    const { education } = store;
    return education.programId !== '' && education.gradeId !== '';
  };
  
  const isPaymentValid = () => {
    const { payment } = store;
    return payment.netFee > 0;
  };
  
  const isContractValid = () => {
    const { contract } = store;
    return (
      contract.kvkkApproved &&
      contract.termsApproved &&
      contract.paymentApproved
    );
  };
  
  return {
    isStudentValid,
    isGuardiansValid,
    isEducationValid,
    isPaymentValid,
    isContractValid,
    isFormComplete: () => 
      isStudentValid() && 
      isGuardiansValid() && 
      isEducationValid() && 
      isPaymentValid() && 
      isContractValid()
  };
};


