'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * SPECTRA Exam Wizard Entry Point
 * Auto-redirects to Step 2 (Lessons)
 */
export default function SpectraExamWizardEntry() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  useEffect(() => {
    if (examId) {
      // Redirect to Step 2 (Lessons)
      router.replace(`/spectra/exams/${examId}/step-2-lessons`);
    }
  }, [examId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-gray-500">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}
