export interface FinanceInstallment {
  id: string;
  student_id: string;
  agreement_id?: string | null;
  // Satış / eğitim birleşik yapı alanları
  sale_id?: string | null;
  source?: 'education' | 'sale' | string;
  installment_no: number;
  amount: number; // planlanan taksit tutarı
  due_date: string;
  is_paid: boolean;
  payment_id?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
  collected_by?: string | null;
  note?: string | null;
  created_at: string;
  // Yeni alanlar (kısmi ödeme desteği)
  paid_amount?: number; // bu taksit için şimdiye kadar ödenen toplam
  status?: 'active' | 'partial' | 'paid' | 'void' | 'refunded' | 'deleted' | string;
  // Eski / yeni plan bayrakları (yapılandırma sonrası kullanım için)
  is_old?: boolean;
  is_new?: boolean;
}

export interface FinanceSummary {
  total: number; // tüm taksitlerin toplamı
  paid: number; // yapılan ödemeler toplamı
  unpaid: number; // ödenmemiş kısım
  balance: number; // aynı: total - paid
  installments: FinanceInstallment[];
}







