'use client';

import { Phone, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Props = {
  studentId: string;
  fullName: string;
  className?: string | null;
  branch?: string | null;
  contractNumber?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  notes?: string | null;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'Ö';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'Ö';
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

export default function StudentInfoCard({
  studentId,
  fullName,
  className,
  branch,
  contractNumber,
  parentName,
  parentPhone,
  notes,
}: Props) {
  const initials = getInitials(fullName);

  return (
    <div className="flex flex-col md:flex-row gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-semibold text-white shadow-md">
          <User className="hidden h-6 w-6 md:inline-block" />
          <span className="md:hidden">{initials}</span>
        </div>
        <div>
          <Link 
            href={`/students/${studentId}`}
            className="group flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
          >
            {fullName}
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <p className="text-xs text-gray-600">
            ID: <span className="font-mono">{studentId}</span>
          </p>
          {(className || branch) && (
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              {className && (
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                  Sınıf: {className}
                </span>
              )}
              {branch && (
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                  Şube: {branch}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 text-xs text-gray-700">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <p className="text-[11px] text-gray-500">Veli</p>
            <p className="font-medium">{parentName || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Veli Telefon</p>
            {parentPhone ? (
              <a href={`tel:${parentPhone}`} className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline">
                <Phone className="h-3 w-3" />
                {parentPhone}
              </a>
            ) : (
              <p className="font-medium text-gray-400">Tanımlı değil</p>
            )}
          </div>
          {contractNumber && (
            <div>
              <p className="text-[11px] text-gray-500">Sözleşme No</p>
              <p className="font-medium">{contractNumber}</p>
            </div>
          )}
        </div>
        {notes && (
          <p className="mt-1 line-clamp-2 rounded-lg bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
            {notes}
          </p>
        )}
      </div>
    </div>
  );
}
