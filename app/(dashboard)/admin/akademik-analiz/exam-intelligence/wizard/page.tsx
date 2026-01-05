'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Legacy URL: /admin/akademik-analiz/exam-intelligence/wizard
// Yeni Exam Intelligence sihirbazına yönlendir.
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/exam-intelligence/wizard');
  }, [router]);

  return null;
}


