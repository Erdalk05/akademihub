'use client';

import dynamic from 'next/dynamic';

// Enrollment formunu dinamik olarak yükle - SSR'ı bypass et
const EnrollmentForm = dynamic(
  () => import('@/components/enrollment/EnrollmentForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#075E54] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-white">Yükleniyor...</span>
        </div>
      </div>
    )
  }
);

export default function NewEnrollmentPage() {
  return <EnrollmentForm />;
}
