// AkademiHub Free Report Builder 7.0
// ------------------------------------------------------------
// Veri katmanı: tablolar, alanlar ve join ilişkileri
// Bu dosya sadece şema bilgisini tutar; gerçek SQL burada çalıştırılmaz.

export type FieldType = 'text' | 'number' | 'date' | 'category' | 'boolean';

export interface ReportField {
  name: string;
  label: string;
  type: FieldType;
}

export type TableCategory =
  | 'Öğrenciler'
  | 'Kaydı Silinen Öğrenciler'
  | 'Aile / Veli'
  | 'Akademik'
  | 'Finans - Gelir'
  | 'Finans - Gider'
  | 'Finans - Taksit'
  | 'Finans - Diğer Gelirler'
  | 'Cari Hesap';

export interface ReportTable {
  name: string; // Supabase tablo adı
  label: string; // UI'da gösterilecek isim
  category: TableCategory;
  primaryKey: string;
  fields: ReportField[];
}

export interface TableRelation {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
}

// ------------------------------------------------------------
// Tablolar
// ------------------------------------------------------------

export const REPORT_TABLES: ReportTable[] = [
  // ================== ÖĞRENCİLER ==================
  {
    name: 'students',
    label: 'Öğrenciler',
    category: 'Öğrenciler',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Öğrenci ID', type: 'text' },
      { name: 'student_no', label: 'Öğrenci No', type: 'text' },
      { name: 'first_name', label: 'Ad', type: 'text' },
      { name: 'last_name', label: 'Soyad', type: 'text' },
      { name: 'full_name', label: 'Ad Soyad', type: 'text' },
      { name: 'parent_name', label: 'Veli Adı', type: 'text' },
      { name: 'parent_phone', label: 'Veli Telefonu', type: 'text' },
      { name: 'parent_email', label: 'Veli Email', type: 'text' },
      { name: 'class', label: 'Sınıf', type: 'category' },
      { name: 'section', label: 'Şube', type: 'category' },
      { name: 'enrolled_class', label: 'Kayıtlı Sınıf', type: 'category' },
      { name: 'status', label: 'Durum', type: 'category' },
      { name: 'birth_date', label: 'Doğum Tarihi', type: 'date' },
      { name: 'birth_place', label: 'Doğum Yeri', type: 'text' },
      { name: 'gender', label: 'Cinsiyet', type: 'category' },
      { name: 'tc_id', label: 'TC Kimlik No', type: 'text' },
      { name: 'blood_type', label: 'Kan Grubu', type: 'category' },
      { name: 'nationality', label: 'Uyruk', type: 'text' },
      { name: 'address', label: 'Adres', type: 'text' },
      { name: 'city', label: 'Şehir', type: 'text' },
      { name: 'district', label: 'İlçe', type: 'text' },
      { name: 'phone', label: 'Telefon', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'program_id', label: 'Program ID', type: 'text' },
      { name: 'program_name', label: 'Program Adı', type: 'text' },
      { name: 'academic_year', label: 'Akademik Yıl', type: 'text' },
      { name: 'total_fee', label: 'Toplam Ücret', type: 'number' },
      { name: 'discount', label: 'İndirim', type: 'number' },
      { name: 'net_fee', label: 'Net Ücret', type: 'number' },
      { name: 'installment_count', label: 'Taksit Sayısı', type: 'number' },
      { name: 'down_payment', label: 'Peşinat', type: 'number' },
      { name: 'monthly_payment', label: 'Aylık Ödeme', type: 'number' },
      { name: 'health_notes', label: 'Sağlık Notları', type: 'text' },
      { name: 'notes', label: 'Notlar', type: 'text' },
      { name: 'photo_url', label: 'Fotoğraf URL', type: 'text' },
      { name: 'created_at', label: 'Kayıt Tarihi', type: 'date' },
      { name: 'updated_at', label: 'Güncelleme Tarihi', type: 'date' },
      { name: 'deleted_at', label: 'Silinme Tarihi', type: 'date' },
    ],
  },

  // ================== VELİLER ==================
  {
    name: 'guardians',
    label: 'Veliler',
    category: 'Aile / Veli',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Veli ID', type: 'text' },
      { name: 'student_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'first_name', label: 'Veli Adı', type: 'text' },
      { name: 'last_name', label: 'Veli Soyadı', type: 'text' },
      { name: 'relation', label: 'Yakınlık', type: 'category' },
      { name: 'tc_no', label: 'TC Kimlik No', type: 'text' },
      { name: 'phone', label: 'Telefon', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'occupation', label: 'Meslek', type: 'text' },
      { name: 'workplace', label: 'İş Yeri', type: 'text' },
      { name: 'address', label: 'Adres', type: 'text' },
      { name: 'is_primary', label: 'Birincil Veli', type: 'boolean' },
      { name: 'created_at', label: 'Kayıt Tarihi', type: 'date' },
    ],
  },

  // ================== TAKSİTLER ==================
  {
    name: 'finance_installments',
    label: 'Taksitler',
    category: 'Finans - Taksit',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Taksit ID', type: 'text' },
      { name: 'student_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'installment_no', label: 'Taksit No', type: 'number' },
      { name: 'amount', label: 'Tutar', type: 'number' },
      { name: 'paid_amount', label: 'Ödenen Tutar', type: 'number' },
      { name: 'due_date', label: 'Vade Tarihi', type: 'date' },
      { name: 'paid_at', label: 'Ödeme Tarihi', type: 'date' },
      { name: 'is_paid', label: 'Ödendi mi', type: 'boolean' },
      { name: 'status', label: 'Durum', type: 'category' },
      { name: 'payment_method', label: 'Ödeme Yöntemi', type: 'category' },
      { name: 'description', label: 'Açıklama', type: 'text' },
      { name: 'academic_year', label: 'Akademik Yıl', type: 'text' },
      { name: 'created_at', label: 'Oluşturulma Tarihi', type: 'date' },
    ],
  },

  // ================== ÖDEMELER ==================
  {
    name: 'payments',
    label: 'Ödemeler',
    category: 'Finans - Gelir',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Ödeme ID', type: 'text' },
      { name: 'student_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'installment_id', label: 'Taksit ID', type: 'text' },
      { name: 'amount', label: 'Tutar', type: 'number' },
      { name: 'payment_type', label: 'Ödeme Tipi', type: 'category' },
      { name: 'payment_method', label: 'Ödeme Yöntemi', type: 'category' },
      { name: 'payment_date', label: 'Ödeme Tarihi', type: 'date' },
      { name: 'status', label: 'Durum', type: 'category' },
      { name: 'receipt_no', label: 'Makbuz No', type: 'text' },
      { name: 'notes', label: 'Notlar', type: 'text' },
      { name: 'created_by', label: 'Oluşturan', type: 'text' },
      { name: 'created_at', label: 'Oluşturulma Tarihi', type: 'date' },
    ],
  },

  // ================== GİDERLER ==================
  {
    name: 'expenses',
    label: 'Giderler',
    category: 'Finans - Gider',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Gider ID', type: 'text' },
      { name: 'title', label: 'Başlık', type: 'text' },
      { name: 'category', label: 'Kategori', type: 'category' },
      { name: 'amount', label: 'Tutar', type: 'number' },
      { name: 'date', label: 'Tarih', type: 'date' },
      { name: 'status', label: 'Durum', type: 'category' },
      { name: 'payment_method', label: 'Ödeme Yöntemi', type: 'category' },
      { name: 'vendor', label: 'Tedarikçi', type: 'text' },
      { name: 'invoice_no', label: 'Fatura No', type: 'text' },
      { name: 'description', label: 'Açıklama', type: 'text' },
      { name: 'is_recurring', label: 'Tekrarlayan mı', type: 'boolean' },
      { name: 'created_by', label: 'Oluşturan', type: 'text' },
      { name: 'created_at', label: 'Oluşturulma Tarihi', type: 'date' },
    ],
  },

  // ================== DİĞER GELİRLER ==================
  {
    name: 'other_income',
    label: 'Diğer Gelirler',
    category: 'Finans - Diğer Gelirler',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Gelir ID', type: 'text' },
      { name: 'student_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'title', label: 'Başlık', type: 'text' },
      { name: 'category', label: 'Kategori', type: 'category' },
      { name: 'amount', label: 'Tutar', type: 'number' },
      { name: 'payment_type', label: 'Ödeme Tipi', type: 'category' },
      { name: 'date', label: 'Tarih', type: 'date' },
      { name: 'notes', label: 'Notlar', type: 'text' },
      { name: 'created_by', label: 'Oluşturan', type: 'text' },
      { name: 'created_at', label: 'Oluşturulma Tarihi', type: 'date' },
    ],
  },

  // ================== SÖZLEŞMELER ==================
  {
    name: 'contracts',
    label: 'Sözleşmeler',
    category: 'Akademik',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Sözleşme ID', type: 'text' },
      { name: 'student_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'contract_type', label: 'Sözleşme Tipi', type: 'category' },
      { name: 'total_amount', label: 'Toplam Tutar', type: 'number' },
      { name: 'discount', label: 'İndirim', type: 'number' },
      { name: 'net_amount', label: 'Net Tutar', type: 'number' },
      { name: 'start_date', label: 'Başlangıç Tarihi', type: 'date' },
      { name: 'end_date', label: 'Bitiş Tarihi', type: 'date' },
      { name: 'status', label: 'Durum', type: 'category' },
      { name: 'signed_at', label: 'İmza Tarihi', type: 'date' },
      { name: 'academic_year', label: 'Akademik Yıl', type: 'text' },
      { name: 'created_at', label: 'Oluşturulma Tarihi', type: 'date' },
    ],
  },

  // ================== AKADEMİK YILLAR ==================
  {
    name: 'academic_years',
    label: 'Akademik Yıllar',
    category: 'Akademik',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'name', label: 'Yıl Adı', type: 'text' },
      { name: 'start_date', label: 'Başlangıç', type: 'date' },
      { name: 'end_date', label: 'Bitiş', type: 'date' },
      { name: 'is_active', label: 'Aktif mi', type: 'boolean' },
    ],
  },

  // ================== KULLANICILAR ==================
  {
    name: 'app_users',
    label: 'Kullanıcılar',
    category: 'Akademik',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Kullanıcı ID', type: 'text' },
      { name: 'name', label: 'Ad', type: 'text' },
      { name: 'surname', label: 'Soyad', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'role', label: 'Rol', type: 'category' },
      { name: 'phone', label: 'Telefon', type: 'text' },
      { name: 'is_active', label: 'Aktif mi', type: 'boolean' },
      { name: 'last_login', label: 'Son Giriş', type: 'date' },
      { name: 'created_at', label: 'Kayıt Tarihi', type: 'date' },
    ],
  },

  // ================== AKTİVİTE LOGLARI ==================
  {
    name: 'activity_logs',
    label: 'Aktivite Logları',
    category: 'Akademik',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Log ID', type: 'text' },
      { name: 'user_id', label: 'Kullanıcı ID', type: 'text' },
      { name: 'action', label: 'İşlem', type: 'category' },
      { name: 'entity_type', label: 'Varlık Tipi', type: 'category' },
      { name: 'entity_id', label: 'Varlık ID', type: 'text' },
      { name: 'description', label: 'Açıklama', type: 'text' },
      { name: 'ip_address', label: 'IP Adresi', type: 'text' },
      { name: 'created_at', label: 'Tarih', type: 'date' },
    ],
  },

  // ================== AYARLAR ==================
  {
    name: 'settings',
    label: 'Ayarlar',
    category: 'Akademik',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'key', label: 'Anahtar', type: 'text' },
      { name: 'value', label: 'Değer', type: 'text' },
      { name: 'category', label: 'Kategori', type: 'category' },
      { name: 'updated_at', label: 'Güncelleme Tarihi', type: 'date' },
    ],
  },
];

// ------------------------------------------------------------
// Tablolar arası ilişkiler (JOIN graph)
// ------------------------------------------------------------

export const REPORT_RELATIONS: TableRelation[] = [
  // Öğrenci ilişkileri
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'guardians',
    toField: 'student_id',
  },
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'finance_installments',
    toField: 'student_id',
  },
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'payments',
    toField: 'student_id',
  },
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'other_income',
    toField: 'student_id',
  },
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'contracts',
    toField: 'student_id',
  },
  // Taksit -> Ödeme ilişkisi
  {
    fromTable: 'finance_installments',
    fromField: 'id',
    toTable: 'payments',
    toField: 'installment_id',
  },
  // Kullanıcı ilişkileri
  {
    fromTable: 'app_users',
    fromField: 'id',
    toTable: 'activity_logs',
    toField: 'user_id',
  },
];

export function findTable(name: string): ReportTable | undefined {
  return REPORT_TABLES.find((t) => t.name === name);
}

export function fieldExists(tableName: string, fieldName: string): boolean {
  const table = findTable(tableName);
  if (!table) return false;
  return table.fields.some((f) => f.name === fieldName);
}

export function getField(
  tableName: string,
  fieldName: string,
): ReportField | undefined {
  const table = findTable(tableName);
  if (!table) return undefined;
  return table.fields.find((f) => f.name === fieldName);
}
