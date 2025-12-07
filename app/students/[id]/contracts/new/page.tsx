'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import PasswordConfirmModal from '@/components/modals/PasswordConfirmModal';

export default function NewContractPage() {
  const { id } = useParams();
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleSave = async (password: string) => {
    // TODO: backend doğrulama + kayıt
    console.log('confirm with password', password);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Sözleşme</h1>
        <Link href={`/students/${id}`} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Geri</Link>
      </div>
      <div className="p-6 bg-white border rounded-xl">
        <div className="space-y-4">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Sözleşme Başlığı" />
          <textarea className="w-full border rounded-lg px-3 py-2 h-60" placeholder="Sözleşme Metni" />
          <div className="flex justify-end">
            <button onClick={() => setOpenConfirm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Kaydet</button>
          </div>
        </div>
      </div>
      <PasswordConfirmModal isOpen={openConfirm} onClose={() => setOpenConfirm(false)} onConfirm={handleSave} title="Kaydı Onayla" description="Kaydetmek için şifrenizi girin" />
    </div>
  );
}


