'use client';

import type { FinanceSummary } from '@/lib/types/finance';
import CreateInstallmentsModal from '@/components/finance/CreateInstallmentsModal';

type Props = {
  open: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess?: () => void;
  summary?: FinanceSummary | null;
};

// Basit sarmalayıcı: mevcut CreateInstallmentsModal bileşenini
// "Yapılandırma" modali olarak kullanır.
export default function RestructureModal({ open, onClose, studentId, onSuccess, summary }: Props) {
  return (
    <CreateInstallmentsModal
      open={open}
      onClose={onClose}
      studentId={studentId}
      onSuccess={onSuccess}
      summary={summary}
    />
  );
}


