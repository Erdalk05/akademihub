'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Users } from 'lucide-react';

type StudentRow = {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  parent_name?: string;
  class_name?: string;
  class?: string;
  section?: string;
};

export default function CariListPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/students', { cache: 'no-store' });
        const js = await res.json().catch(() => null);

        let list: any[] = [];
        if (Array.isArray(js?.data)) {
          list = js.data;
        } else if (Array.isArray(js?.students)) {
          list = js.students;
        } else if (Array.isArray(js)) {
          list = js;
        }

        if (!res.ok) {
          setError(js?.error || 'Öğrenci listesi alınamadı');
        }

        if (list.length > 0) {
          setStudents(list as StudentRow[]);
        } else if (!error && !res.ok) {
          setStudents([]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const fullName =
        `${s.first_name || ''} ${s.last_name || ''}`.trim() ||
        s.full_name ||
        s.parent_name ||
        '';
      return fullName.toLowerCase().includes(q);
    });
  }, [students, search]);

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cari Hesaplar</h1>
            <p className="text-sm text-gray-500">
              Öğrencilerin eğitim ve satış hareketlerini tek ekrandan görüntüleyin.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Öğrenci adı ile ara..."
              className="w-full rounded-lg border border-gray-300 px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-600">Yükleniyor...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-600">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Cari hesabı görüntülenecek öğrenci bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const fullName =
                  `${s.first_name || ''} ${s.last_name || ''}`.trim() ||
                  s.full_name ||
                  s.parent_name ||
                  'Öğrenci';
                const cls = s.class_name || s.class || '';
                const sec = s.section || '';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => router.push(`/finance/cari/${s.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-indigo-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-500">
                          {cls && <span>{cls}</span>}
                          {cls && sec && <span className="mx-1">•</span>}
                          {sec && <span>{sec}</span>}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-indigo-600">
                      Cari Hesabı Görüntüle
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


