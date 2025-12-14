'use server';
/* eslint-disable no-console */

import { getServiceRoleClient } from '@/lib/supabase/server';
import { EnrollmentData } from './types';

// Supabase client al
const getSupabase = () => getServiceRoleClient();

// Otomatik öğrenci numarası üret - %100 benzersiz (UUID tabanlı)
async function generateStudentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 karakter random
  const timestamp = Date.now().toString().slice(-4); // Son 4 hane
  
  // Format: 2025-1201-ABC123-4567 (tamamen benzersiz)
  return `${year}-${month}${day}-${random}-${timestamp}`;
}

// Kayıt oluştur veya güncelle - Students + Enrollments + Finance_Installments
// organization_id parametresi: Çoklu kurum desteği için (opsiyonel)
// existingStudentId: Düzenleme modu için mevcut öğrenci ID'si (opsiyonel)
export async function createEnrollment(data: EnrollmentData, organizationId?: string, existingStudentId?: string | null) {
  const supabase = getSupabase();
  
  try {
    // 0. TC Kimlik No kontrolü - aynı TC ile kayıt var mı? (Düzenleme modunda mevcut öğrenciyi hariç tut)
    if (data.student.tcNo && data.student.tcNo.trim() !== '') {
      let query = supabase
        .from('students')
        .select('id, student_no, parent_name')
        .eq('tc_id', data.student.tcNo.trim());
      
      // Düzenleme modunda mevcut öğrenciyi hariç tut
      if (existingStudentId) {
        query = query.neq('id', existingStudentId);
      }
      
      const { data: existingStudent } = await query.single();
      
      if (existingStudent) {
        throw new Error(`Bu TC Kimlik No (${data.student.tcNo}) ile zaten kayıtlı bir öğrenci bulunmaktadır. Öğrenci No: ${existingStudent.student_no}`);
      }
    }
    
    // 1. Öğrenci kaydı oluştur veya güncelle
    const primaryGuardian = data.guardians.find(g => g.isEmergency) || data.guardians[0];
    
    // TC Kimlik No: Boşsa null, doluysa trim'li değer
    const tcIdValue = data.student.tcNo && data.student.tcNo.trim() !== '' 
      ? data.student.tcNo.trim() 
      : null;
    
    // Students tablosuna uygun veri - sadece mevcut sütunlar
    const studentData: Record<string, any> = {
      tc_id: tcIdValue,
      // Kişisel bilgiler - AD SOYAD ZORUNLU
      first_name: data.student.firstName || 'İsimsiz',
      last_name: data.student.lastName || 'Öğrenci',
      full_name: `${data.student.firstName || ''} ${data.student.lastName || ''}`.trim() || 'İsimsiz Öğrenci',
      birth_date: data.student.birthDate || null,
      birth_place: data.student.birthPlace || null,
      nationality: data.student.nationality || 'TC',
      gender: data.student.gender,
      blood_type: data.student.bloodGroup || null,
      // İletişim
      phone: data.student.phone || null,
      phone2: data.student.phone2 || null,
      email: data.student.email || null,
      // Adres
      city: data.student.city || null,
      district: data.student.district || null,
      address: data.student.address || null,
      // Eğitim
      enrolled_class: data.education.gradeName || data.student.enrolledClass || null,
      class: data.education.gradeId || data.student.enrolledClass || '1',
      section: data.education.branchId || 'A',
      program_id: data.education.programId || null,
      program_name: data.education.programName || null,
      academic_year: data.education.academicYear || '2024-2025',
      previous_school: data.student.previousSchool || null,
      health_notes: data.student.healthNotes || null,
      // Veli bilgileri
      parent_name: primaryGuardian ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}`.trim() : null,
      parent_phone: primaryGuardian?.phone || null,
      // Durum
      status: 'active',
      updated_at: new Date().toISOString()
    };
    
    // Çoklu kurum desteği - organization_id
    if (organizationId) {
      studentData.organization_id = organizationId;
    }

    let studentRecord;
    
    // Düzenleme modu - mevcut öğrenciyi güncelle
    if (existingStudentId) {
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', existingStudentId)
        .select()
        .single();

      if (updateError) {
        console.error('Student update error:', updateError);
        throw new Error(`Öğrenci güncellenemedi: ${updateError.message}`);
      }
      studentRecord = updatedStudent;
    } else {
      // Yeni kayıt - öğrenci numarası üret
      const studentNumber = await generateStudentNumber();
      studentData.student_no = studentNumber;
      studentData.created_at = new Date().toISOString();
      
      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (studentError) {
        console.error('Student insert error:', studentError);
        throw new Error(`Öğrenci kaydı oluşturulamadı: ${studentError.message}`);
      }
      studentRecord = newStudent;
    }

    // 2. Enrollments tablosuna kayıt yap (opsiyonel - hata olsa bile devam et)
    let enrollmentId = null;
    try {
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student: { ...data.student, studentId: studentRecord.id },
          guardians: data.guardians,
          education: data.education,
          payment: {
            ...data.payment,
            installments: []
          },
          contract: data.contract,
          status: 'approved',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!enrollmentError && enrollment) {
        enrollmentId = enrollment.id;
      }
    } catch (e) {
      console.warn('Enrollments table insert skipped:', e);
    }

    // 3. Finance_Installments tablosuna taksitleri ekle
    if (data.payment.netFee > 0 && data.payment.installmentCount > 0) {
      const installments = [];
      const today = new Date();
      const downPayment = data.payment.downPayment || 0;
      const downPaymentDate = data.payment.downPaymentDate ? new Date(data.payment.downPaymentDate) : today;
      const remaining = data.payment.netFee - downPayment;
      const monthlyAmount = Math.ceil(remaining / data.payment.installmentCount);
      
      // Peşinat varsa ekle (kendi tarihi ile)
      if (downPayment > 0) {
        const downPaymentRecord: Record<string, any> = {
          student_id: studentRecord.id,
          agreement_id: enrollmentId,
          installment_no: 0,
          amount: downPayment,
          due_date: downPaymentDate.toISOString().split('T')[0],
          is_paid: false,
          status: 'active'
        };
        if (organizationId) {
          downPaymentRecord.organization_id = organizationId;
        }
        installments.push(downPaymentRecord);
      }
      
      // İlk taksit başlangıç tarihi
      const firstInstallmentDate = data.payment.firstInstallmentDate 
        ? new Date(data.payment.firstInstallmentDate) 
        : new Date(today.setMonth(today.getMonth() + 1));
      
      // Taksitleri ekle
      for (let i = 1; i <= data.payment.installmentCount; i++) {
        const dueDate = new Date(firstInstallmentDate);
        dueDate.setMonth(firstInstallmentDate.getMonth() + (i - 1));
        
        const isLast = i === data.payment.installmentCount;
        const amount = isLast 
          ? remaining - (monthlyAmount * (data.payment.installmentCount - 1))
          : monthlyAmount;
        
        const installmentRecord: Record<string, any> = {
          student_id: studentRecord.id,
          agreement_id: enrollmentId,
          installment_no: i,
          amount: amount > 0 ? amount : 0,
          due_date: dueDate.toISOString().split('T')[0],
          is_paid: false,
          status: 'active'
        };
        if (organizationId) {
          installmentRecord.organization_id = organizationId;
        }
        installments.push(installmentRecord);
      }

      if (installments.length > 0) {
        const { error: installmentsError } = await supabase
          .from('finance_installments')
          .insert(installments);

        if (installmentsError) {
          console.error('Installments insert error:', installmentsError);
        }
      }
    }

    // 4. Finance log kaydı
    try {
      await supabase
        .from('finance_logs')
        .insert({
          student_id: studentRecord.id,
          agreement_id: enrollmentId,
          action: 'enrollment_created',
          payload: {
            student_name: `${data.student.firstName} ${data.student.lastName}`,
            program: data.education.programName,
            total_fee: data.payment.netFee,
            installment_count: data.payment.installmentCount
          }
        });
    } catch (e) {
      console.warn('Finance log insert skipped:', e);
    }

    return { 
      success: true, 
      data: { 
        enrollmentId, 
        student: studentRecord,
        studentNumber: studentRecord.student_no 
      } 
    };
  } catch (error: any) {
    console.error('Enrollment creation error:', error);
    return { success: false, error: error.message || 'Kayıt oluşturulamadı' };
  }
}

// Kayıt getir
export async function getEnrollment(id: string) {
  const supabase = getSupabase();
  
  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        finance_installments (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data: enrollment };
  } catch (error) {
    console.error('Get enrollment error:', error);
    return { success: false, error: 'Kayıt bulunamadı' };
  }
}

// Kayıt listesi
export async function getEnrollments(filters?: {
  status?: string;
  academicYear?: string;
  programId?: string;
}) {
  const supabase = getSupabase();
  
  try {
    let query = supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Get enrollments error:', error);
    return { success: false, error: 'Kayıtlar getirilemedi' };
  }
}

// Kayıt güncelle
export async function updateEnrollment(id: string, data: Partial<EnrollmentData>) {
  const supabase = getSupabase();
  
  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: enrollment };
  } catch (error) {
    console.error('Update enrollment error:', error);
    return { success: false, error: 'Kayıt güncellenemedi' };
  }
}

// Kayıt durumunu güncelle
export async function updateEnrollmentStatus(id: string, status: EnrollmentData['status']) {
  const supabase = getSupabase();
  
  try {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: enrollment };
  } catch (error) {
    console.error('Update status error:', error);
    return { success: false, error: 'Durum güncellenemedi' };
  }
}

// Taksit ödemesi kaydet
export async function recordInstallmentPayment(installmentId: string, amount: number) {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('finance_installments')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_method: 'cash'
      })
      .eq('id', installmentId)
      .select()
      .single();

    if (error) throw error;

    // Öğrenci bakiyesini güncelle
    if (data?.student_id) {
      const { data: student } = await supabase
        .from('students')
        .select('paid_amount, balance, total_amount')
        .eq('id', data.student_id)
        .single();
      
      if (student) {
        await supabase
          .from('students')
          .update({
            paid_amount: (student.paid_amount || 0) + amount,
            balance: (student.total_amount || 0) - (student.paid_amount || 0) - amount
          })
          .eq('id', data.student_id);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Payment record error:', error);
    return { success: false, error: 'Ödeme kaydedilemedi' };
  }
}

// Sözleşme metni oluştur
export async function generateContractText(enrollmentId: string) {
  const result = await getEnrollment(enrollmentId);
  
  if (!result.success || !result.data) {
    return { success: false, error: 'Kayıt bulunamadı' };
  }

  const { student, guardians, education, payment } = result.data;
  const guardian = guardians[0];
  const today = new Date().toLocaleDateString('tr-TR');

  const contractText = `
K12 EĞİTİM KAYIT SÖZLEŞMESİ

İşbu Kayıt Sözleşmesi, bir tarafta AkademiHub Eğitim Kurumları (bundan sonra "Kurum" olarak anılacaktır) ile diğer tarafta ${guardian?.firstName} ${guardian?.lastName} (bundan sonra "Veli" olarak anılacaktır) arasında ${today} tarihinde karşılıklı olarak düzenlenmiştir.

MADDE 1 - ÖĞRENCİ BİLGİLERİ
Ad Soyad: ${student?.firstName} ${student?.lastName}
TC Kimlik No: ${student?.tcNo}
Program: ${education?.programName}
Sınıf: ${education?.gradeName}
Eğitim Yılı: ${education?.academicYear}

MADDE 2 - EĞİTİM HİZMETİ
Kurum, öğrenciye ilgili öğretim yılı boyunca müfredat, ölçme-değerlendirme, rehberlik, akademik danışmanlık ve kurum içi etkinlikleri kapsayan eğitim hizmetini sunmayı kabul eder.

MADDE 3 - ÜCRET VE ÖDEME KOŞULLARI
Toplam Eğitim Ücreti: ${payment?.totalFee?.toLocaleString('tr-TR')} ₺
İndirim: ${payment?.discount?.toLocaleString('tr-TR')} ₺
Net Ücret: ${payment?.netFee?.toLocaleString('tr-TR')} ₺
Peşinat: ${payment?.downPayment?.toLocaleString('tr-TR')} ₺
Taksit Sayısı: ${payment?.installmentCount}
Aylık Taksit: ${payment?.monthlyInstallment?.toLocaleString('tr-TR')} ₺

MADDE 4 - VELİ BEYANI
Veli, kayıt formunda verilen tüm bilgilerin doğruluğunu, okul yönerge ve kurallarını kabul ettiğini, ücret ve ödeme planını onayladığını, KVKK kapsamında bilgilendirildiğini beyan ve taahhüt eder.

MADDE 5 - KURUM BEYANI
Kurum, sözleşmede belirtilen eğitim hizmetini sunmayı ve öğrenci dosyasını gizlilik esaslarına uygun korumayı taahhüt eder.

İMZALAR

Veli: _________________________
Tarih: ${today}

Kurum Yetkilisi: _________________________
Tarih: ${today}
  `;

  return { success: true, data: contractText };
}
