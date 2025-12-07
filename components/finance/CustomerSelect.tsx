'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SalesCustomer } from '@/types/finance.types';

type StudentOption = {
  id: string;
  type: 'student';
  label: string;
  subtitle?: string;
};

type ExternalOption = {
  id: string;
  type: 'external';
  label: string;
  subtitle?: string;
};

export type CustomerOption = StudentOption | ExternalOption;

type Props = {
  value?: CustomerOption | null;
  onChange: (val: CustomerOption | null) => void;
  onCreateExternal?: () => void;
  initialStudentId?: string | null;
};

export default function CustomerSelect({
  value,
  onChange,
  onCreateExternal,
  initialStudentId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [externals, setExternals] = useState<ExternalOption[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const [studentsRes, externalsRes] = await Promise.all([
          fetch('/api/students', { cache: 'no-store' }),
          fetch('/api/finance/sales-customers', { cache: 'no-store' }),
        ]);

        const stuJson = await studentsRes.json().catch(() => null);
        const extJson = await externalsRes.json().catch(() => null);

        if (stuJson?.success && Array.isArray(stuJson.data)) {
          const mapped: StudentOption[] = stuJson.data.map((s: any) => ({
            id: s.id,
            type: 'student',
            label: `${s.first_name || s.name || ''} ${s.last_name || ''}`.trim() ||
              s.parent_name ||
              s.student_no ||
              'Öğrenci',
            subtitle: s.class || s.section ? `${s.class || ''} ${s.section || ''}`.trim() : undefined,
          }));
          setStudents(mapped);
        }

        if (extJson?.success && Array.isArray(extJson.data)) {
          const mappedExt: ExternalOption[] = extJson.data.map((c: any) => ({
            id: c.id,
            type: 'external',
            label: c.full_name,
            subtitle: c.phone || undefined,
          }));
          setExternals(mappedExt);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Eğer URL'den gelen bir öğrenci ID'si varsa ve henüz seçim yapılmadıysa, otomatik seç
  useEffect(() => {
    if (!initialStudentId || value || students.length === 0) return;
    const match = students.find((s) => s.id === initialStudentId);
    if (match) {
      onChange(match);
    }
  }, [initialStudentId, value, students, onChange]);

  const filteredStudents = useMemo(
    () =>
      students.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query],
  );

  const filteredExternals = useMemo(
    () =>
      externals.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [externals, query],
  );

  const handleSelect = (option: CustomerOption) => {
    onChange(option);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">Müşteri Seçin</label>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="İsim ile ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {onCreateExternal && (
          <button
            type="button"
            onClick={onCreateExternal}
            className="rounded-lg border border-dashed border-indigo-400 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Yeni Müşteri
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm">
        {loading ? (
          <div className="p-3 text-xs text-gray-500">Yükleniyor...</div>
        ) : (
          <>
            <div className="border-b border-gray-100 bg-gray-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Öğrenciler
            </div>
            {filteredStudents.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">Sonuç bulunamadı</div>
            ) : (
              filteredStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-indigo-50 ${
                    value?.id === s.id && value.type === 'student'
                      ? 'bg-indigo-50'
                      : ''
                  }`}
                >
                  <span className="text-gray-800">{s.label}</span>
                  {s.subtitle && (
                    <span className="text-xs text-gray-500">{s.subtitle}</span>
                  )}
                </button>
              ))
            )}

            <div className="border-y border-gray-100 bg-gray-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Harici Müşteriler
            </div>
            {filteredExternals.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">Kayıtlı harici müşteri yok</div>
            ) : (
              filteredExternals.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-indigo-50 ${
                    value?.id === c.id && value.type === 'external'
                      ? 'bg-indigo-50'
                      : ''
                  }`}
                >
                  <span className="text-gray-800">{c.label}</span>
                  {c.subtitle && (
                    <span className="text-xs text-gray-500">{c.subtitle}</span>
                  )}
                </button>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}


