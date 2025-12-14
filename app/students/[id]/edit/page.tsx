'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEnrollmentStore } from '@/components/enrollment/store';
import { usePermission } from '@/lib/hooks/usePermission';

export default function StudentEditPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;
  const { canEditStudent, isLoading: permLoading } = usePermission();
  const store = useEnrollmentStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId && !permLoading) {
      loadStudentAndRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, permLoading]);

  const loadStudentAndRedirect = async () => {
    // Yetki kontrolü
    if (!canEditStudent) {
      setError('Bu işlem için yetkiniz yok.');
      setLoading(false);
      return;
    }

    try {
      // Öğrenci bilgilerini getir
      const response = await fetch(`/api/students/${studentId}`);
      
      if (!response.ok) {
        // Fallback - öğrenci listesinden bul
        const listRes = await fetch('/api/students');
        const listData = await listRes.json();
        const found = (listData.data || []).find((s: any) => s.id === studentId);
        
        if (!found) {
          throw new Error('Öğrenci bulunamadı');
        }
        
        // Store'a yükle ve yönlendir
        store.loadForEditing(found);
        toast.success(`${found.first_name} ${found.last_name} bilgileri yüklendi`);
        router.push('/enrollment/new');
        return;
      }

      const data = await response.json();
      const studentData = data.data || data;
      
      if (!studentData) {
        throw new Error('Öğrenci bulunamadı');
      }

      // Store'a düzenleme için yükle
      store.loadForEditing(studentData);
      
      toast.success(`${studentData.first_name} ${studentData.last_name} bilgileri yüklendi`);
      
      // Enrollment formuna yönlendir
      router.push('/enrollment/new');
      
    } catch (err: any) {
      setError(err.message || 'Öğrenci yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  // Yetki yok
  if (!permLoading && !canEditStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Erişim Reddedildi</h1>
          <p className="text-slate-600 mb-6">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Hata varsa
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Hata</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Yükleniyor
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Öğrenci Bilgileri Yükleniyor</h2>
        <p className="text-white/70">Kayıt formuna yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
