'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Token geçerliliğini kontrol et
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();
        setIsValid(data.valid === true);
        if (!data.valid) {
          setError(data.error || 'Geçersiz bağlantı');
        }
      } catch (err) {
        setIsValid(false);
        setError('Bağlantı kontrol edilemedi');
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Şifre güncellenemedi');
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Yükleniyor durumu
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Bağlantı kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Geçersiz token
  if (!isValid && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-300" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">Geçersiz Bağlantı</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition"
            >
              Yeni Bağlantı İste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center p-4">
      {/* Dekoratif Elementler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm mb-6 shadow-2xl border border-white/20">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">AkademiHub</h1>
          <p className="text-[#DCF8C6] text-lg">Yeni Şifre Belirle</p>
        </div>

        {/* Kart */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          {isSuccess ? (
            // Başarı Durumu
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-300" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Şifreniz Güncellendi!</h2>
              <p className="text-white/70 mb-6">
                Yeni şifrenizle giriş yapabilirsiniz. Giriş sayfasına yönlendiriliyorsunuz...
              </p>
              <Loader className="w-6 h-6 text-white animate-spin mx-auto" />
            </div>
          ) : (
            // Form
            <>
              <div className="flex items-center gap-3 justify-center mb-6">
                <Lock className="w-6 h-6 text-[#25D366]" />
                <h2 className="text-xl font-semibold text-white">Yeni Şifre</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Şifre */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      style={{ textTransform: 'none' }}
                      className="w-full pl-12 pr-12 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#25D366] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Şifre Tekrar */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Şifre Tekrar
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      style={{ textTransform: 'none' }}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#25D366] transition"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Güncelleniyor...</span>
                    </>
                  ) : (
                    <span>Şifremi Güncelle</span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white transition text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Alt Bilgi */}
        <p className="text-center text-white/50 text-sm mt-8">
          © 2025 AkademiHub. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
