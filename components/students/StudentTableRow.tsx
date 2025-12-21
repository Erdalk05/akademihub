'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, CheckCircle2, MessageCircle, CreditCard, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';

type StudentRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  parent_name?: string | null;
  class?: string | null;
  section?: string | null;
  debt: number;
  risk: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek';
  student_no?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  photo_url?: string | null;
  avgDelay?: number;
  status?: string | null;
};

interface StudentTableRowProps {
  student: StudentRow;
  canEditStudent: boolean;
  canDeleteStudent: boolean;
  canCollectPayment: boolean;
  onQuickView: (student: StudentRow) => void;
  onDelete: (id: string) => void;
}

// Skeleton for lazy loading
const RowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3.5"><div className="h-6 bg-gray-200 rounded w-24" /></td>
    <td className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
    </td>
    <td className="px-4 py-3.5"><div className="h-6 bg-gray-200 rounded w-12" /></td>
    <td className="px-4 py-3.5"><div className="h-5 bg-gray-200 rounded w-20" /></td>
    <td className="px-4 py-3.5"><div className="h-5 bg-gray-200 rounded w-16" /></td>
    <td className="px-4 py-3.5"><div className="h-6 bg-gray-200 rounded-full w-16" /></td>
    <td className="px-4 py-3.5"><div className="flex gap-1"><div className="h-8 w-8 bg-gray-100 rounded" /><div className="h-8 w-8 bg-gray-100 rounded" /></div></td>
  </tr>
);

/**
 * StudentTableRow - Lazy loaded öğrenci tablo satırı
 * Viewport'a girene kadar skeleton gösterir, sonra gerçek içeriği render eder
 */
function StudentTableRowComponent({
  student: s,
  canEditStudent,
  canDeleteStudent,
  canCollectPayment,
  onQuickView,
  onDelete
}: StudentTableRowProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLTableRowElement>({
    rootMargin: '100px',
    triggerOnce: true
  });

  // Viewport'a girmeden önce skeleton göster
  if (!isVisible) {
    return (
      <tr ref={ref as any}>
        <td className="px-4 py-3.5"><div className="h-6 bg-gray-100 rounded w-24 animate-pulse" /></td>
        <td className="px-4 py-3.5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" /><div className="h-4 bg-gray-100 rounded w-32 animate-pulse" /></div></td>
        <td className="px-4 py-3.5"><div className="h-6 bg-gray-100 rounded w-12 animate-pulse" /></td>
        <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 rounded w-20 animate-pulse" /></td>
        <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 rounded w-16 animate-pulse" /></td>
        <td className="px-4 py-3.5"><div className="h-6 bg-gray-100 rounded-full w-16 animate-pulse" /></td>
        <td className="px-4 py-3.5"><div className="flex gap-1"><div className="h-8 w-8 bg-gray-100 rounded animate-pulse" /></div></td>
      </tr>
    );
  }

  // İsim hesaplama
  const firstLast = `${s.first_name || ''} ${s.last_name || ''}`.trim();
  const fromParent = s.parent_name ? s.parent_name.split(' - ')[0].trim() : '';
  const fullName = s.full_name || firstLast || fromParent || 'İsimsiz';
  const initials = fullName.substring(0, 2).toUpperCase();
  const classLabel = s.class && s.section ? `${s.class}-${s.section}` : s.class || '-';

  return (
    <tr ref={ref as any} className="hover:bg-indigo-50/30 transition group">
      {/* Kayıt No */}
      <td className="px-4 py-3.5">
        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {s.student_no || '--'}
        </span>
      </td>
      
      {/* Öğrenci */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {s.photo_url ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 group-hover:scale-105 transition">
              <Image src={s.photo_url} alt={fullName} fill className="object-cover" sizes="40px" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md group-hover:scale-105 transition">
              {initials}
            </div>
          )}
          <div>
            <Link href={`/students/${s.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition">
              {fullName}
            </Link>
          </div>
        </div>
      </td>
      
      {/* Sınıf */}
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700">
          {classLabel}
        </span>
      </td>
      
      {/* Borç */}
      <td className="px-4 py-3.5">
        <div className="flex flex-col">
          <span className={`font-bold text-base ${s.debt > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
            ₺{s.debt.toLocaleString('tr-TR')}
          </span>
          {s.debt > 0 && s.avgDelay ? (
            <span className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5">
              <Clock size={9} />
              {s.avgDelay}g gecikme
            </span>
          ) : s.debt === 0 ? (
            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 size={9} />
              Güncel
            </span>
          ) : null}
        </div>
      </td>
      
      {/* Son Ödeme */}
      <td className="px-4 py-3.5">
        {s.lastPaymentDate ? (
          <div className="flex flex-col">
            <span className="font-semibold text-emerald-600">
              ₺{(s.lastPaymentAmount || 0).toLocaleString('tr-TR')}
            </span>
            <span className="text-[10px] text-slate-500">{s.lastPaymentDate}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </td>
      
      {/* Risk */}
      <td className="px-4 py-3.5">
        {s.risk === 'Yüksek' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Kritik
          </span>
        )}
        {s.risk === 'Orta' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            Orta
          </span>
        )}
        {s.risk === 'Düşük' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-400 to-indigo-400 text-white shadow-sm">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            Düşük
          </span>
        )}
        {s.risk === 'Yok' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-sm">
            <CheckCircle2 size={12} />
            Güncel
          </span>
        )}
      </td>
      
      {/* İşlemler */}
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => {
              const msg = encodeURIComponent(`Merhaba, ${fullName} hakkında bilgilendirme:`);
              window.open(`https://wa.me/?text=${msg}`, '_blank');
            }}
            className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition shadow-sm"
            title="WhatsApp"
          >
            <MessageCircle size={16} />
          </button>
          
          {canCollectPayment && (
            <button
              onClick={() => onQuickView(s)}
              className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
              title="Finans Detay"
            >
              <CreditCard size={16} />
            </button>
          )}
          
          {canEditStudent && (
            <Link
              href={`/students/${s.id}/edit`}
              className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition shadow-sm"
              title="Düzenle"
            >
              <Edit size={16} />
            </Link>
          )}
          
          {canDeleteStudent && (
            <button
              onClick={() => onDelete(s.id)}
              className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition shadow-sm"
              title="Sil"
            >
              <Trash2 size={16} />
            </button>
          )}
          
          <Link
            href={`/students/${s.id}`}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition shadow-sm"
            title="Detay"
          >
            <MoreHorizontal size={16} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

// memo ile gereksiz re-render'ları önle
export const StudentTableRow = memo(StudentTableRowComponent);

export default StudentTableRow;
