'use client';

/**
 * Akademik Analiz - Sınav Sihirbazı
 * 3 adımlı kolay sınav oluşturma - Supabase entegreli
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ExamWizard } from '@/lib/sinavlar/ui';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore } from '@/lib/store/academicYearStore';

export default function SihirbazPage() {
  const router = useRouter();
  const { selectedOrganization } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore();

  const handleComplete = (examId: string) => {
    router.push(`/admin/akademik-analiz/sonuclar?examId=${examId}`);
  };

  return (
    <ExamWizard
      organizationId={selectedOrganization?.id}
      academicYearId={selectedYear?.id}
      onComplete={handleComplete}
    />
  );
}
