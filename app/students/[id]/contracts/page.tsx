'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function StudentContractsPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sözleşmeler</h1>
        <div className="flex gap-2">
          <Link href={`/students/${id}/contracts/new`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Yeni Sözleşme</Link>
          <Link href={`/students/${id}`} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Geri</Link>
        </div>
      </div>
      <div className="p-6 bg-white border rounded-xl text-sm text-gray-600">
        Bu sayfa sözleşme listesini göstermek için placeholder’dır. Entegrasyonla birlikte öğrenciye ait tüm sözleşmeler burada listelenecek.
      </div>
    </div>
  );
}


