'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Eski sihirbaz URL'i yeni adrese yönlendirme
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/exam-intelligence/wizard');
  }, [router]);

  return null;
}