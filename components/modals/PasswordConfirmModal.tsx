'use client';

import { useState } from 'react';

export default function PasswordConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'İşlemi Onayla',
  description = 'Devam etmek için şifrenizi girin',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void> | void;
  title?: string;
  description?: string;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError('');
    if (!password) {
      setError('Şifre zorunludur');
      return;
    }
    try {
      setLoading(true);
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Onay başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="p-4 space-y-3">
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">İptal</button>
          <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm">Onayla</button>
        </div>
      </div>
    </div>
  );
}


