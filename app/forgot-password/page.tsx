'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || 'Bir hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center p-4">
      {/* Dekoratif Elementler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm mb-6 shadow-2xl border border-white/20">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">AkademiHub</h1>
          <p className="text-[#DCF8C6] text-lg">Şifre Sıfırlama</p>
        </div>

        {/* Kart */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          {isSuccess ? (
            // Başarı Durumu
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-300" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">E-posta Gönderildi!</h2>
              <p className="text-white/70 mb-6">
                Eğer bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
                Lütfen e-posta kutunuzu kontrol edin.
              </p>
              <p className="text-white/50 text-sm mb-6">
                E-posta gelmediyse spam klasörünü kontrol edin.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            // Form
            <>
              <div className="flex items-center gap-3 justify-center mb-6">
                <Mail className="w-6 h-6 text-[#25D366]" />
                <h2 className="text-xl font-semibold text-white">Şifremi Unuttum</h2>
              </div>

              <p className="text-white/70 text-center mb-6">
                E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@kurum.com"
                      required
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
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <span>Sıfırlama Bağlantısı Gönder</span>
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
