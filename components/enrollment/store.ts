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
  defaultPayment,
  defaultContract,
  generateStudentNo,
  PROGRAMS
} from './types';

interface EnrollmentStore extends EnrollmentData {
  // Düzenleme modu için mevcut öğrenci ID'si
  existingStudentId: string | null;
  
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
  updateInstallment: (no: number, data: Partial<Installment>) => void;
  addInstallment: () => void;
  removeInstallment: (no: number) => void;
  
  // Contract Actions
  updateContract: (data: Partial<Contract>) => void;
  signContract: (signature: string) => void;
  
  // General Actions
  setStatus: (status: EnrollmentData['status']) => void;
  reset: () => void;
  loadEnrollment: (data: EnrollmentData) => void;
  
  // Kayıt Yenileme - Mevcut öğrenciyi yükle
  loadFromExistingStudent: (studentData: any, nextAcademicYear: string) => void;
  
  // Düzenleme modu - Mevcut öğrenciyi düzenleme için yükle (öğrenci no değişmez)
  loadForEditing: (studentData: any) => void;
  
  // Düzenleme modu için öğrenci ID'sini sakla
  setExistingStudentId: (id: string | null) => void;
}

export const useEnrollmentStore = create<EnrollmentStore>()(
  persist(
    (set, get) => ({
      ...defaultEnrollment,
      existingStudentId: null,

      // Düzenleme modu için öğrenci ID'sini sakla
      setExistingStudentId: (id) => set({ existingStudentId: id }),

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
        
        // Yüzdelik indirim hesapla - totalFee değişirse discount'u yeniden hesapla
        if (data.totalFee !== undefined && newPayment.discountPercent > 0) {
          newPayment.discount = Math.round((newPayment.totalFee * newPayment.discountPercent) / 100);
        }
        
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

      // Tek bir taksiti güncelle (manuel düzenleme için)
      updateInstallment: (no, data) => set((state) => ({
        payment: {
          ...state.payment,
          installments: state.payment.installments.map((inst) =>
            inst.no === no ? { ...inst, ...data } : inst
          )
        }
      })),

      // Yeni taksit ekle
      addInstallment: () => set((state) => {
        const lastInst = state.payment.installments[state.payment.installments.length - 1];
        const newNo = lastInst ? lastInst.no + 1 : 1;
        const lastDate = lastInst ? new Date(lastInst.dueDate) : new Date();
        lastDate.setMonth(lastDate.getMonth() + 1);
        
        return {
          payment: {
            ...state.payment,
            installmentCount: state.payment.installmentCount + 1,
            installments: [
              ...state.payment.installments,
              {
                no: newNo,
                amount: 0,
                dueDate: lastDate.toISOString().split('T')[0],
                status: 'pending' as const
              }
            ]
          }
        };
      }),

      // Taksit sil
      removeInstallment: (no) => set((state) => ({
        payment: {
          ...state.payment,
          installmentCount: Math.max(0, state.payment.installmentCount - 1),
          installments: state.payment.installments
            .filter((inst) => inst.no !== no)
            .map((inst, idx) => ({
              ...inst,
              no: inst.no === 0 ? 0 : idx + (inst.no === 0 ? 0 : 1) // Peşinat hariç yeniden numarala
            }))
        }
      })),

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
        existingStudentId: null, // Düzenleme modunu sıfırla
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

      // Kayıt Yenileme - Mevcut öğrenciyi yükle
      loadFromExistingStudent: (studentData: any, nextAcademicYear: string) => set((state) => {
        // Öğrenci bilgilerini aktar
        const student: Student = {
          firstName: studentData.first_name || '',
          lastName: studentData.last_name || '',
          tcNo: studentData.tc_id || '',
          studentNo: generateStudentNo(), // Yeni numara üret
          birthDate: studentData.birth_date || '',
          birthPlace: studentData.birth_place || '',
          nationality: studentData.nationality || 'TC',
          gender: studentData.gender || 'male',
          bloodGroup: studentData.blood_type || '',
          enrolledClass: studentData.class || '',
          phone: studentData.phone || '',
          phone2: studentData.phone2 || '',
          email: studentData.email || '',
          city: studentData.city || '',
          district: studentData.district || '',
          address: studentData.address || '',
          previousSchool: studentData.previous_school || '',
          healthNotes: studentData.health_notes || '',
          photoUrl: studentData.photo_url || '',
        };

        // Veli bilgilerini aktar (parent_name'den parse et)
        const guardians: Guardian[] = [];
        if (studentData.parent_name) {
          guardians.push({
            ...defaultGuardian,
            id: 'g1',
            type: 'mother',
            firstName: studentData.parent_name.split(' ')[0] || '',
            lastName: studentData.parent_name.split(' ').slice(1).join(' ') || '',
            phone: studentData.parent_phone || '',
            isEmergency: true,
          });
        } else {
          guardians.push({ ...defaultGuardian, id: 'g1', type: 'mother', isEmergency: true });
        }
        guardians.push({ ...defaultGuardian, id: 'g2', type: 'father' });

        // Eğitim bilgilerini aktar - Yeni akademik yıl ile
        // Sınıfı bir üst sınıfa geçir
        let nextClass = studentData.class || '1';
        const classNumber = parseInt(nextClass);
        if (!isNaN(classNumber) && classNumber < 12) {
          nextClass = String(classNumber + 1);
        }

        const education: Education = {
          programId: studentData.program_id || '',
          programName: studentData.program_name || '',
          gradeId: nextClass,
          gradeName: `${nextClass}. Sınıf`,
          branchId: studentData.section || '',
          branchName: studentData.section || '',
          academicYear: nextAcademicYear, // Yeni akademik yıl
          studentType: 'renewal', // Kayıt yenileme
        };

        // Ödeme bilgileri sıfırdan başla
        const payment = {
          ...defaultPayment,
          downPaymentDate: new Date().toISOString().split('T')[0],
          firstInstallmentDate: (() => {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(15);
            return nextMonth.toISOString().split('T')[0];
          })(),
        };

        // Sözleşme sıfırdan başla
        const contract = { ...defaultContract };

        return {
          student,
          guardians,
          education,
          payment,
          contract,
          status: 'draft' as const,
          existingStudentId: studentData.id || null, // Düzenleme modu için mevcut öğrenci ID'si
        };
      }),

      // Düzenleme modu - Mevcut öğrenciyi düzenleme için yükle (öğrenci no değişmez)
      loadForEditing: (studentData: any) => set((state) => {
        console.log('[Store] loadForEditing called with:', studentData?.first_name, studentData?.last_name, studentData?.id);
        
        // Öğrenci bilgilerini aktar - öğrenci numarası AYNI KALIR
        const student: Student = {
          firstName: studentData.first_name || '',
          lastName: studentData.last_name || '',
          tcNo: studentData.tc_id || '',
          studentNo: studentData.student_no || '', // MEVCUT ÖĞRENCİ NUMARASI KORUNUR
          birthDate: studentData.birth_date || '',
          birthPlace: studentData.birth_place || '',
          nationality: studentData.nationality || 'TC',
          gender: studentData.gender || 'male',
          bloodGroup: studentData.blood_type || '',
          enrolledClass: studentData.class || '',
          phone: studentData.phone || '',
          phone2: studentData.phone2 || '',
          email: studentData.email || '',
          city: studentData.city || '',
          district: studentData.district || '',
          address: studentData.address || '',
          previousSchool: studentData.previous_school || '',
          healthNotes: studentData.health_notes || '',
          photoUrl: studentData.photo_url || '',
        };

        // Veli bilgilerini aktar
        const guardians: Guardian[] = [];
        if (studentData.parent_name) {
          guardians.push({
            ...defaultGuardian,
            id: 'g1',
            type: 'mother',
            firstName: studentData.parent_name.split(' ')[0] || '',
            lastName: studentData.parent_name.split(' ').slice(1).join(' ') || '',
            phone: studentData.parent_phone || '',
            email: studentData.parent_email || '',
            isEmergency: true,
          });
        } else {
          guardians.push({ ...defaultGuardian, id: 'g1', type: 'mother', isEmergency: true });
        }
        guardians.push({ ...defaultGuardian, id: 'g2', type: 'father' });

        // Eğitim bilgilerini aktar - MEVCUT AKADEMİK YIL İLE
        const education: Education = {
          programId: studentData.program_id || '',
          programName: studentData.program_name || '',
          gradeId: studentData.class || '1',
          gradeName: studentData.enrolled_class || `${studentData.class}. Sınıf`,
          branchId: studentData.section || '',
          branchName: studentData.section || '',
          academicYear: studentData.academic_year || '2024-2025',
          studentType: 'edit', // Düzenleme modu
        };

        // Ödeme bilgileri - mevcut taksit bilgilerinden yükle
        // ÖNEMLİ: Eğer total_amount 0 ise varsayılan bir değer kullan
        const totalAmount = studentData.total_amount || studentData.balance || 0;
        const instCount = studentData.installment_count || 9;
        const monthlyInst = totalAmount > 0 && instCount > 0 
          ? Math.ceil(totalAmount / instCount) 
          : studentData.monthly_installment || 0;
        
        const payment = {
          ...defaultPayment,
          totalFee: totalAmount,
          netFee: totalAmount,
          discount: 0,
          downPayment: studentData.down_payment || 0,
          downPaymentDate: new Date().toISOString().split('T')[0],
          installmentCount: instCount,
          monthlyInstallment: monthlyInst,
          firstInstallmentDate: studentData.first_installment_date || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
          installments: [], // Taksitler yeniden hesaplanacak
        };
        
        console.log('[Store] loadForEditing payment:', { totalAmount, instCount, monthlyInst });

        // Sözleşme bilgileri
        const contract = { ...defaultContract };

        console.log('[Store] loadForEditing complete. Student:', student.firstName, student.lastName, 'ID:', studentData.id);
        
        return {
          student,
          guardians,
          education,
          payment,
          contract,
          status: 'draft' as const,
          existingStudentId: studentData.id || null, // Düzenleme modu için mevcut öğrenci ID'si
        };
      }),
    }),
    {
      name: 'enrollment-store-v8', // Store versiyonunu artır - eski cache'i temizle
      partialize: (state) => ({
        student: state.student,
        guardians: state.guardians,
        education: state.education,
        payment: state.payment,
        contract: state.contract,
        status: state.status,
        existingStudentId: state.existingStudentId,
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


