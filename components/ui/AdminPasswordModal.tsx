'use client';

import { useState } from 'react';
import { X, Lock, AlertTriangle, Eye, EyeOff, Shield, Trash2 } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  dangerAction?: boolean;
}

/**
 * Admin Şifre Doğrulama Modalı
 * 
 * Kritik işlemler (silme, düzenleme vb.) için admin şifresi doğrulaması yapar.
 * Sadece admin yetkisi olan kullanıcılar bu modalı görebilir.
 */
export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Admin Doğrulaması Gerekli',
  description = 'Bu işlemi gerçekleştirmek için şifrenizi girin.',
  confirmText = 'Onayla',
  dangerAction = true,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Şifre boş olamaz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // API'ye şifre doğrulama isteği gönder
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setPassword('');
        onConfirm();
        onClose();
      } else {
        setError(data.error || 'Şifre yanlış');
      }
    } catch (err) {
      setError('Doğrulama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-red-900/50 backdrop-blur-md p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`relative p-6 text-white overflow-hidden ${
          dangerAction 
            ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500' 
            : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500'
        }`}>
          {/* Dekoratif arka plan */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <button 
            onClick={handleClose}
            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
          
          <div className="relative flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg ${
              dangerAction ? 'bg-white/20' : 'bg-white/20'
            }`}>
              {dangerAction ? (
                <AlertTriangle size={28} className="text-white" />
              ) : (
                <Shield size={28} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className={`text-sm mt-0.5 ${dangerAction ? 'text-red-100' : 'text-indigo-100'}`}>
                Güvenlik doğrulaması
              </p>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Uyarı Mesajı */}
          {dangerAction && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-2xl border border-red-100">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <span className="font-bold text-red-800">Dikkat!</span>
                <p className="text-xs text-red-600 mt-0.5">{description}</p>
              </div>
            </div>
          )}

          {/* Şifre Alanı */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Lock size={14} className="text-slate-500" />
              Admin Şifresi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Şifrenizi girin..."
                autoFocus
                className={`w-full px-4 py-3 pr-12 text-lg font-medium border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all ${
                  error 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-slate-200 bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle size={14} />
                {error}
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 bg-gradient-to-r from-slate-50 to-red-50/30 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-5 py-3.5 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Vazgeç
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !password.trim()}
            className={`flex-[2] px-5 py-3.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 ${
              dangerAction
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-red-200'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-indigo-200'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={18} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordModal;
