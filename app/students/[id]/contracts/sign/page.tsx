'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import PasswordConfirmModal from '@/components/modals/PasswordConfirmModal';

export default function SignContractPage() {
  const { id } = useParams();
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleFinalize = async (password: string) => {
    // TODO: finalize signature with password
    console.log('finalize with password', password);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sözleşme İmzalama</h1>
        <Link href={`/students/${id}`} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Geri</Link>
      </div>
      <div className="p-6 bg-white border rounded-xl">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">İmza alanı ve sözleşme önizlemesi burada yer alacak.</p>
          <div className="flex justify-end">
            <button onClick={() => setOpenConfirm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">İmzayı Finalize Et</button>
          </div>
        </div>
      </div>
      <PasswordConfirmModal isOpen={openConfirm} onClose={() => setOpenConfirm(false)} onConfirm={handleFinalize} title="İmzayı Onayla" description="İşlemi tamamlamak için şifrenizi girin" />
    </div>
  );
}


