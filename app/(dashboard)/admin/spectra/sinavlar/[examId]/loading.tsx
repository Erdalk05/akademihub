import { Loader2 } from 'lucide-react';

export default function SpectraExamDetailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  );
}

