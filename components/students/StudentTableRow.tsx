'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, CheckCircle2, MessageCircle, CreditCard, Edit, Trash2, MoreHorizontal, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import { analyzeRisk, type RiskAnalysis } from '@/lib/risk/RiskEngine';

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

// ✅ RiskEngine Enhanced Risk Badge with Tooltip
const RiskBadge = memo(({ student }: { student: StudentRow }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // RiskEngine analizi - sadece görünürken hesapla
  const riskAnalysis = useMemo<RiskAnalysis>(() => {
    return analyzeRisk({
      totalDebt: student.debt,
      overdueDays: student.avgDelay || 0,
      overdueAmount: student.debt
    });
  }, [student.debt, student.avgDelay]);
  
  const getBadgeStyle = () => {
    switch (student.risk) {
      case 'Yüksek':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'Orta':
        return 'bg-gradient-to-r from-amber-400 to-orange-400 text-white';
      case 'Düşük':
        return 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white';
      default:
        return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white';
    }
  };
  
  const getLabel = () => {
    switch (student.risk) {
      case 'Yüksek': return 'Kritik';
      case 'Orta': return 'Orta';
      case 'Düşük': return 'Düşük';
      default: return 'Güncel';
    }
  };
  
  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getBadgeStyle()} shadow-sm cursor-default`}
      >
        {student.risk === 'Yüksek' && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
        {student.risk === 'Orta' && <span className="w-2 h-2 bg-white rounded-full" />}
        {student.risk === 'Düşük' && <span className="w-2 h-2 bg-white rounded-full" />}
        {student.risk === 'Yok' && <CheckCircle2 size={12} />}
        {getLabel()}
      </button>
      
      {/* Tooltip - Risk Detayları */}
      {showTooltip && riskAnalysis.reasons.length > 0 && (
        <div className="absolute z-50 left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-sm text-gray-800">Risk Analizi</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${riskAnalysis.bgColor} ${riskAnalysis.textColor}`}>
              {riskAnalysis.score}
            </span>
          </div>
          
          <div className="space-y-1.5">
            {riskAnalysis.reasons.slice(0, 3).map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  reason.severity === 'critical' ? 'bg-red-500' :
                  reason.severity === 'high' ? 'bg-orange-500' :
                  reason.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-700">{reason.title}</p>
                  <p className="text-gray-500 text-[10px]">{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {riskAnalysis.trend.direction !== 'unknown' && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs">
              {riskAnalysis.trend.direction === 'worsening' && (
                <>
                  <TrendingUp className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">Risk artıyor</span>
                </>
              )}
              {riskAnalysis.trend.direction === 'improving' && (
                <>
                  <TrendingDown className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Risk düşüyor</span>
                </>
              )}
              {riskAnalysis.trend.direction === 'stable' && (
                <span className="text-gray-500">Stabil</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
RiskBadge.displayName = 'RiskBadge';

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
      
      {/* Risk - RiskEngine Enhanced */}
      <td className="px-4 py-3.5">
        <RiskBadge student={s} />
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
