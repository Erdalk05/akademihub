import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sınav Analizi - AkademiHub',
  description: 'Exam Analytics modülü - Sınav yönetimi ve analiz sistemi',
};

export default function ExamAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
