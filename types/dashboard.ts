/**
 * AkademiHub Dashboard TypeScript Interfaces
 * Tüm veri yapıları ve tip tanımları
 */

// Trend yönü tipleri
export type TrendDirection = 'up' | 'down' | 'same';

// Risk seviyesi tipleri
export type RiskLevel = 'low' | 'medium' | 'high';

// Risk türü tipleri
export type RiskType = 'devamsizlik' | 'akademik' | 'finansal';

// Aktivite tipleri
export type ActivityType = 'odeme' | 'kayit' | 'not' | 'devamsizlik';

// Aktivite durumu tipleri
export type ActivityStatus = 'basarili' | 'beklemede' | 'basarisiz';

// Toast tipi
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// KPI metrikleri interface'i
export interface KPIData {
  toplamCiro: number;
  odemeOrani: number;
  gecikmisTaksit: number;
  aktifOgrenci: number;
  trend: {
    ciro: TrendDirection;
    odeme: TrendDirection;
    taksit: TrendDirection;
    ogrenci: TrendDirection;
  };
}

// Finans akış verisi interface'i
export interface FinansAkisData {
  ay: string;
  gelir: number;
  gider: number;
  net: number;
}

// Öğrenci kayıt verisi interface'i
export interface OgrenciKayit {
  id: string;
  ad: string;
  soyad: string;
  sinif: string;
  kayitTarihi: string;
  foto: string;
}

// Risk grubu öğrenci verisi interface'i
export interface RiskOgrenci {
  id: string;
  ad: string;
  soyad: string;
  riskTuru: RiskType;
  riskSeviyesi: RiskLevel;
  aciklama: string;
}

// Başarılı öğrenci verisi interface'i
export interface BasariliOgrenci {
  id: string;
  ad: string;
  soyad: string;
  ortalama: number;
  siralama: number;
}

// AI tahmin verisi interface'i
export interface AITahmin {
  baslik: string;
  icerik: string;
  guven: number; // 0-100 arası
}

// AI öneriler interface'i
export interface AIOneriler {
  finansal: string;
  akademik: string;
  risk: string;
  genel: string;
  tahminler: AITahmin[];
}

// Aktivite verisi interface'i
export interface Aktivite {
  id: string;
  tip: ActivityType;
  aciklama: string;
  tarih: string;
  yapan: string;
  durum: ActivityStatus;
}

// Öğrenci verileri interface'i
export interface OgrenciVerileri {
  sonKayitlar: OgrenciKayit[];
  riskGrubu: RiskOgrenci[];
  basarililar: BasariliOgrenci[];
}

// Ana dashboard verisi interface'i
export interface DashboardData {
  kpi: KPIData;
  finansAkis: FinansAkisData[];
  ogrenciler: OgrenciVerileri;
  aiOneriler: AIOneriler;
  aktiviteler: Aktivite[];
}

// Filtreler interface'i
export interface DashboardFilters {
  dateRange: string;
  studentType: string;
  riskLevel: string;
}

// KPI kartı props interface'i
export interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: TrendDirection;
  icon: React.ReactNode; // JSX elemanı olarak ikon
  onClick?: () => void;
  loading?: boolean;
}

// Öğrenci kartı props interface'i
export interface StudentCardProps {
  ogrenci: OgrenciKayit | RiskOgrenci | BasariliOgrenci;
  type: 'kayit' | 'risk' | 'basarili';
  onClick?: () => void;
}

// AI panel props interface'i
export interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: AIOneriler;
  loading?: boolean;
}

// Grafik props interface'i
export interface ChartProps {
  data: FinansAkisData[];
  loading?: boolean;
}

// Toast props interface'i
export interface ToastProps {
  type: ToastType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

// Modal props interface'i
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Hızlı aksiyon props interface'i
export interface QuickActionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

// Arama ve filtre props interface'i
export interface SearchFilterProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFilter?: () => void;
  loading?: boolean;
}

// Tablo props interface'i
export interface TableProps {
  headers: string[];
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  pagination?: boolean;
  pageSize?: number;
}

// Loading skeleton props interface'i
export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

// Responsive breakpoint tipleri
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Theme tipleri
export type Theme = 'light' | 'dark';

// Dil tipleri
export type Language = 'tr' | 'en';

// Kullanıcı verisi interface'i
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  preferences: {
    theme: Theme;
    language: Language;
  };
}

// API response interface'i
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Form validation interface'i
export interface ValidationError {
  field: string;
  message: string;
}

// Modal interface'i
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Form validation interface'i
export interface ValidationError {
  field: string;
  message: string;
}

// API response interface'i
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Kullanıcı verisi interface'i
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  preferences: {
    theme: Theme;
    language: Language;
  };
}

// Filter interface'i
export interface FilterOptions {
  dateRange: string;
  studentType: string;
  riskLevel: string;
  searchQuery?: string;
}

// Notification interface'i
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  timestamp: string;
  read: boolean;
}

// Settings interface'i
export interface DashboardSettings {
  theme: Theme;
  language: Language;
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}
