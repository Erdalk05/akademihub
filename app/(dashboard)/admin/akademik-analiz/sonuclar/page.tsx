export const dynamic = 'force-dynamic';

export default function Page() {
  // Legacy route: artık kullanılmıyor. Kullanıcıları yeni sonuç merkezine yönlendir.
  // Not: Sihirbaz akışına dokunmuyoruz; sadece eski URL'i yönlendiriyoruz.
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/exam-intelligence/sinavlar';
  }
  return null;
}
