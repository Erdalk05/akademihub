'use client';

import { memo } from 'react';
import { Eye, Printer, Download } from 'lucide-react';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';

interface Student {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  parent_name?: string | null;
  student_no?: string | null;
  class?: string | null;
  section?: string | null;
  status?: string | null;
}

interface PaymentInfo {
  total: number;
  paid: number;
  remaining: number;
  paidCount: number;
  totalCount: number;
  overdueCount: number;
}

interface ContractTableRowProps {
  student: Student;
  paymentInfo: PaymentInfo;
  onView: (student: Student) => void;
  onPrint: (student: Student) => void;
  onDownload: (student: Student) => void;
}

// Skeleton for lazy loading
const RowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="py-3 px-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </td>
    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-12" /></td>
    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
    <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
    <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded-full w-20" /></td>
    <td className="py-3 px-4">
      <div className="flex gap-1 justify-center">
        <div className="h-8 w-8 bg-gray-100 rounded" />
        <div className="h-8 w-8 bg-gray-100 rounded" />
      </div>
    </td>
  </tr>
);

/**
 * ContractTableRow - Lazy loaded sözleşme tablo satırı
 * Viewport'a girene kadar skeleton gösterir
 */
function ContractTableRowComponent({
  student,
  paymentInfo: info,
  onView,
  onPrint,
  onDownload
}: ContractTableRowProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLTableRowElement>({
    rootMargin: '100px',
    triggerOnce: true
  });

  // Viewport'a girmeden önce skeleton göster
  if (!isVisible) {
    return (
      <tr ref={ref as any} className="animate-pulse">
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="space-y-1">
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="h-3 bg-gray-50 rounded w-20" />
            </div>
          </div>
        </td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-12" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-50 rounded w-16" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
        <td className="py-3 px-4"><div className="h-6 bg-gray-100 rounded-full w-20" /></td>
        <td className="py-3 px-4"><div className="flex gap-1 justify-center"><div className="h-8 w-8 bg-gray-50 rounded" /></div></td>
      </tr>
    );
  }

  // İsim hesaplama
  const getStudentName = (s: Student) => {
    if (s.full_name) return s.full_name;
    if (s.first_name && s.last_name) return `${s.first_name} ${s.last_name}`;
    if (s.parent_name) return s.parent_name.split(' - ')[0];
    return 'İsimsiz';
  };

  const name = getStudentName(student);
  const initials = name.substring(0, 2).toUpperCase();

  // Status badge hesaplama - sadece görünür olduğunda
  let statusBadge = { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Kayıt Yok' };
  if (info.totalCount > 0) {
    if (info.remaining === 0) {
      statusBadge = { bg: 'bg-green-100', text: 'text-green-700', label: 'Tamamlandı' };
    } else if (info.overdueCount > 0) {
      statusBadge = { bg: 'bg-red-100', text: 'text-red-700', label: `${info.overdueCount} Gecikmiş` };
    } else {
      statusBadge = { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Devam Ediyor' };
    }
  }

  return (
    <tr ref={ref as any} className="hover:bg-gray-50 transition">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DCF8C6] flex items-center justify-center text-[#128C7E] font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{student.student_no || '-'}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {student.class}{student.section ? `-${student.section}` : ''}
      </td>
      <td className="py-3 px-4 text-sm font-medium text-gray-900">
        {info.total > 0 ? `${info.total.toLocaleString('tr-TR')} ₺` : '-'}
      </td>
      <td className="py-3 px-4 text-sm text-green-600 font-medium">
        {info.paid > 0 ? `${info.paid.toLocaleString('tr-TR')} ₺` : '-'}
      </td>
      <td className="py-3 px-4 text-sm text-amber-600 font-medium">
        {info.remaining > 0 ? `${info.remaining.toLocaleString('tr-TR')} ₺` : '-'}
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
          {statusBadge.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onView(student)}
            className="p-2 text-gray-500 hover:text-[#128C7E] hover:bg-[#DCF8C6] rounded-lg transition"
            title="Görüntüle"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onPrint(student)}
            className="p-2 text-gray-500 hover:text-[#128C7E] hover:bg-[#DCF8C6] rounded-lg transition"
            title="Yazdır"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={() => onDownload(student)}
            className="p-2 text-gray-500 hover:text-[#128C7E] hover:bg-[#DCF8C6] rounded-lg transition"
            title="PDF İndir"
          >
            <Download size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export const ContractTableRow = memo(ContractTableRowComponent);

export default ContractTableRow;
