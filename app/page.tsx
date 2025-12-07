import { redirect } from 'next/navigation';

export default function Home() {
  // Sunucu tarafında anında yönlendirme: ilk yüklemede bekleme olmaz
  redirect('/login');
}

