'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student } from '@/types/student.types';

export interface PaymentPlan {
  id: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  installmentCount: number;
  paidCount: number;
  nextDueDate: string;
  status: 'Aktif' | 'Tamamlandı' | 'Gecikmiş';
  createdAt: Date;
}

interface StudentStoreState {
  students: Student[];
  paymentPlans: PaymentPlan[];
  
  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'metadata'>) => Student;
  getStudents: () => Student[];
  getStudentById: (id: string) => Student | undefined;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  searchStudents: (query: string) => Student[];
  filterStudents: (filters: Partial<{
    sinif: string;
    durum: string;
    riskLevel: string;
  }>) => Student[];
  
  // Yeni Filtreleme Methods
  getStudentsByAcademicPerformance: (minAverage: number) => Student[];
  getStudentsByFinancialStatus: (status: 'Borçlu' | 'Ödedi' | 'Kısmen') => Student[];
  getStudentsByRiskLevel: (level: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek') => Student[];
  getStudentsByClass: (sinif: string) => Student[];
  getTopPerformers: (limit?: number) => Student[];
  getAtRiskStudents: () => Student[];
  getDebtorStudents: () => Student[];
  getStudentsByHealthStatus: (status: string) => Student[];
  
  // Update Methods
  updateStudentAcademics: (id: string, akademik: Partial<import('@/types/student.types').AkademikBilgiler>) => void;
  recordCommunication: (studentId: string, type: 'SMS' | 'Email' | 'Telefon' | 'Ziyaret', content: string) => void;
  
  // Statistics Methods
  getTotalStats: () => {
    totalStudents: number;
    activeStudents: number;
    atRiskStudents: number;
    totalDebt: number;
    averageGrade: number;
    attendanceRate: number;
  };
  getClassStats: (sinif: string) => {
    count: number;
    averageGrade: number;
    atRiskCount: number;
    totalDebt: number;
  };
  
  // Payment Actions
  getPaymentPlansForStudent: (studentId: string) => PaymentPlan[];
  getAllPaymentPlans: () => PaymentPlan[];
  updatePaymentPlan: (id: string, data: Partial<PaymentPlan>) => void;
  addPayment: (planId: string, amount: number) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const mockPaymentPlans: PaymentPlan[] = [];

export const useStudentStore = create<StudentStoreState>()(
  persist(
    (set, get) => ({
      // Initial State (mock öğrenciler kapatıldı; başlangıç boş liste)
      students: [],
      paymentPlans: mockPaymentPlans || [],

      // Student Actions
      addStudent: (studentData) => {
        const id = generateId();
        const student: Student = {
          ...studentData,
          id,
          createdAt: new Date(),
          metadata: {
            kayitYapan: 'admin',
            sonGuncelleyen: 'admin',
            sonGuncellemeTarihi: new Date(),
            aktifMi: true,
            silindiMi: false
          },
          fotoUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          ogrenciNo: `STU-2025-${String(Date.now()).slice(-4)}`,
        } as Student;

        set((state) => ({
          students: [...state.students, student],
        }));

        // Otomatik ödeme planı oluştur
        const monthlyAmount = Math.floor(studentData.finans?.netUcret / (studentData.finans?.odemePlani.taksitSayisi || 3)) || 15000;
        const installmentCount = studentData.finans?.odemePlani.taksitSayisi || 3;
        const nextDueDate = new Date();
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        const paymentPlan: PaymentPlan = {
          id: generateId(),
          studentId: id,
          totalAmount: monthlyAmount * installmentCount,
          paidAmount: 0,
          installmentCount,
          paidCount: 0,
          nextDueDate: nextDueDate.toISOString().split('T')[0],
          status: 'Aktif',
          createdAt: new Date(),
        };

        set((state) => ({
          paymentPlans: [...state.paymentPlans, paymentPlan],
        }));

        return student;
      },

      getStudents: () => get().students,

      getStudentById: (id: string) => {
        return get().students.find((s) => s.id === id);
      },

      updateStudent: (id: string, data: Partial<Student>) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...data, metadata: { ...s.metadata, sonGuncellemeTarihi: new Date() } } : s
          ),
        }));
      },

      deleteStudent: (id: string) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          paymentPlans: state.paymentPlans.filter((p) => p.studentId !== id),
        }));
      },

      searchStudents: (query: string) => {
        const lowerQuery = query.toLowerCase();
        return get().students.filter((s) =>
          s.ad.toLowerCase().includes(lowerQuery) ||
          s.soyad.toLowerCase().includes(lowerQuery) ||
          s.tcKimlik.includes(query) ||
          s.ogrenciNo.includes(query) ||
          s.email?.toLowerCase().includes(lowerQuery)
        );
      },

      filterStudents: (filters) => {
        return get().students.filter((s) => {
          if (filters.sinif && s.sinif !== filters.sinif) return false;
          if (filters.durum && s.durum !== filters.durum) return false;
          if (filters.riskLevel && s.ai.riskKategorisi !== filters.riskLevel) return false;
          return true;
        });
      },

      // Yeni Filtreleme Methods
      getStudentsByAcademicPerformance: (minAverage: number) => {
        return get().students.filter(student => student.akademik.genelOrtalama >= minAverage);
      },
      getStudentsByFinancialStatus: (status: 'Borçlu' | 'Ödedi' | 'Kısmen') => {
        return get().students.filter(student => {
          const debt = student.finans.odemeDurumu.kalanBorc;
          if (status === 'Borçlu') return debt > 0;
          if (status === 'Ödedi') return debt === 0;
          if (status === 'Kısmen') return debt > 0 && debt < student.finans.odemeDurumu.toplamBorc;
          return false;
        });
      },
      getStudentsByRiskLevel: (level: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek') => {
        return get().students.filter(student => student.ai.riskKategorisi === level);
      },
      getStudentsByClass: (sinif: string) => {
        return get().students.filter(student => student.sinif === sinif);
      },
      getTopPerformers: (limit?: number) => {
        const sortedStudents = [...get().students].sort((a, b) => b.akademik.genelOrtalama - a.akademik.genelOrtalama);
        return limit ? sortedStudents.slice(0, limit) : sortedStudents;
      },
      getAtRiskStudents: () => {
        return get().students.filter(student => student.ai.riskKategorisi !== 'Yok');
      },
      getDebtorStudents: () => {
        return get().students.filter(student => student.finans.odemeDurumu.kalanBorc > 0);
      },
      getStudentsByHealthStatus: (status: string) => {
        return get().students.filter(student => student.saglik.genelDurum === status);
      },
      
      // Update Methods
      updateStudentAcademics: (id: string, akademik: Partial<import('@/types/student.types').AkademikBilgiler>) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, akademik: { ...s.akademik, ...akademik } } : s
          ),
        }));
      },
      recordCommunication: (studentId: string, type: 'SMS' | 'Email' | 'Telefon' | 'Ziyaret', content: string) => {
        // Basit implementasyon - ileri yapılarda communication modeli oluşturulacak
        set((state) => ({
          students: state.students.map((s) =>
            s.id === studentId ? { ...s, metadata: { ...s.metadata, notlar: `${s.metadata.notlar || ''}\n${type}: ${content} (${new Date().toLocaleString()})` } } : s
          ),
        }));
      },
      
      // Statistics Methods
      getTotalStats: () => {
        const students = get().students;
        const totalStudents = students.length;
        const activeStudents = students.filter(s => s.metadata.aktifMi).length;
        const atRiskStudents = students.filter(s => s.ai.riskKategorisi !== 'Yok').length;
        const totalDebt = students.reduce((sum, student) => sum + student.finans.odemeDurumu.kalanBorc, 0);
        const averageGrade = totalStudents > 0 ? students.reduce((sum, student) => sum + student.akademik.genelOrtalama, 0) / totalStudents : 0;
        const attendanceRate = totalStudents > 0 ? students.reduce((sum, student) => sum + student.akademik.devamsizlik.oran, 0) / totalStudents : 0;

        return {
          totalStudents,
          activeStudents,
          atRiskStudents,
          totalDebt,
          averageGrade: Math.round(averageGrade * 100) / 100,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
        };
      },
      getClassStats: (sinif: string) => {
        const studentsInClass = get().students.filter(student => student.sinif === sinif);
        const count = studentsInClass.length;
        const averageGrade = count > 0 ? studentsInClass.reduce((sum, student) => sum + student.akademik.genelOrtalama, 0) / count : 0;
        const atRiskCount = studentsInClass.filter(student => student.ai.riskKategorisi !== 'Yok').length;
        const totalDebt = studentsInClass.reduce((sum, student) => sum + student.finans.odemeDurumu.kalanBorc, 0);

        return {
          count,
          averageGrade: Math.round(averageGrade * 100) / 100,
          atRiskCount,
          totalDebt,
        };
      },
      
      // Payment Actions
      getPaymentPlansForStudent: (studentId: string) => {
        return get().paymentPlans.filter((p) => p.studentId === studentId);
      },

      getAllPaymentPlans: () => get().paymentPlans,

      updatePaymentPlan: (id: string, data: Partial<PaymentPlan>) => {
        set((state) => ({
          paymentPlans: state.paymentPlans.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }));
      },

      addPayment: (planId: string, amount: number) => {
        set((state) => ({
          paymentPlans: state.paymentPlans.map((p) => {
            if (p.id === planId) {
              const newPaidAmount = p.paidAmount + amount;
              const newPaidCount = Math.floor(
                newPaidAmount / (p.totalAmount / p.installmentCount)
              );
              const isCompleted = newPaidCount >= p.installmentCount;

              return {
                ...p,
                paidAmount: newPaidAmount,
                paidCount: newPaidCount,
                status: isCompleted ? 'Tamamlandı' : 'Aktif',
              };
            }
            return p;
          }),
        }));
      },
    }),
    {
      name: 'student-store',
    }
  )
);
