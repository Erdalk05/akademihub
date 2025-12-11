'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';
import { useOrganizationStore, Organization } from '@/lib/store/organizationStore';

export default function LoginPage() {
  const router = useRouter();
  const { organizations, fetchOrganizations, isLoading } = useOrganizationStore();
  const [isReady, setIsReady] = useState(false);

  // Kurumları yükle
  useEffect(() => {
    const loadOrgs = async () => {
      await fetchOrganizations();
      setIsReady(true);
    };
    loadOrgs();
  }, [fetchOrganizations]);

  // Kurum seçildiğinde o kurumun login sayfasına yönlendir
  const handleSelectOrganization = (org: Organization) => {
    router.push(`/login/${org.slug}`);
  };

  // Yükleniyor
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Kurumlar yükleniyor...</p>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo ve Başlık */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm mb-6 shadow-2xl border border-white/20">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">AkademiHub</h1>
          <p className="text-[#DCF8C6] text-lg">Kurumunuzu Seçin</p>
        </div>

        {/* Kurum Kartları */}
        <div className="grid gap-4">
          {organizations.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center">
              <Building2 className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/70 text-lg">Henüz kurum eklenmemiş.</p>
              <p className="text-white/50 text-sm mt-2">
                Sistem yöneticisiyle iletişime geçin.
              </p>
            </div>
          ) : (
            organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrganization(org)}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-[#25D366]/50 transition-all text-left flex items-center gap-5"
              >
                {/* Kurum Logosu/İkonu */}
                <div className="flex-shrink-0">
                  {org.logo_url ? (
                    <img 
                      src={org.logo_url} 
                      alt={org.name} 
                      className="w-16 h-16 object-contain rounded-xl bg-white/10 p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {org.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Kurum Bilgileri */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-white mb-1 truncate">
                    {org.name}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/60">
                    {org.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{org.address}</span>
                      </span>
                    )}
                    {org.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {org.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ok İkonu */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#25D366] flex items-center justify-center transition-colors">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Alt Bilgi */}
        <p className="text-center text-white/50 text-sm mt-10">
          © 2025 AkademiHub. AI Destekli Eğitim Yönetim Sistemi.
        </p>
      </div>
    </div>
  );
}
