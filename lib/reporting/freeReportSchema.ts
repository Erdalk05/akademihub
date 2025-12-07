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
  | 'Aile / Veli'
  | 'Akademik'
  | 'Finans - Gelir'
  | 'Finans - Gider'
  | 'Finans - Taksit'
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
  {
    name: 'students',
    label: 'Öğrenciler',
    category: 'Öğrenciler',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Öğrenci ID', type: 'text' },
      { name: 'student_no', label: 'Öğrenci No', type: 'text' },
      { name: 'parent_name', label: 'Veli Adı', type: 'text' },
      { name: 'class', label: 'Sınıf', type: 'category' },
      { name: 'section', label: 'Şube', type: 'category' },
      { name: 'status', label: 'Durum', type: 'category' },
      { name: 'birth_date', label: 'Doğum Tarihi', type: 'date' },
      { name: 'birth_place', label: 'Doğum Yeri', type: 'text' },
      { name: 'gender', label: 'Cinsiyet', type: 'category' },
      { name: 'tc_id', label: 'TC Kimlik No', type: 'text' },
      { name: 'blood_type', label: 'Kan Grubu', type: 'category' },
      { name: 'address', label: 'Adres', type: 'text' },
      { name: 'parent_phone', label: 'Veli Telefonu', type: 'text' },
      { name: 'created_at', label: 'Kayıt Tarihi', type: 'date' },
    ],
  },
  {
    name: 'parents',
    label: 'Veliler',
    category: 'Aile / Veli',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Veli ID', type: 'text' },
      { name: 'öğrenci_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'anne_adı', label: 'Anne Adı', type: 'text' },
      { name: 'baba_adı', label: 'Baba Adı', type: 'text' },
      { name: 'meslek', label: 'Meslek', type: 'text' },
      { name: 'telefon', label: 'Telefon', type: 'text' },
      { name: 'adres', label: 'Adres', type: 'text' },
    ],
  },
  {
    name: 'finance_payments',
    label: 'Finans Ödemeleri',
    category: 'Finans - Gelir',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Ödeme ID', type: 'text' },
      { name: 'öğrenci_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'amount', label: 'Tutar', type: 'number' },
      { name: 'payment_type', label: 'Ödeme Tipi', type: 'category' },
      { name: 'payment_date', label: 'Ödeme Tarihi', type: 'date' },
      { name: 'payment_method', label: 'Ödeme Yöntemi', type: 'category' },
      { name: 'status', label: 'Durum', type: 'category' },
    ],
  },
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
      { name: 'description', label: 'Açıklama', type: 'text' },
    ],
  },
  {
    name: 'finance_installments',
    label: 'Taksitler',
    category: 'Finans - Taksit',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Taksit ID', type: 'text' },
      { name: 'öğrenci_id', label: 'Öğrenci ID', type: 'text' },
      { name: 'installment_no', label: 'Taksit No', type: 'number' },
      { name: 'amount', label: 'Tutar', type: 'number' },
      { name: 'due_date', label: 'Vade Tarihi', type: 'date' },
      { name: 'is_paid', label: 'Ödendi mi', type: 'boolean' },
    ],
  },
  {
    name: 'v_cari_hesap',
    label: 'Cari Hesap',
    category: 'Cari Hesap',
    primaryKey: 'id',
    fields: [
      { name: 'id', label: 'Kayıt ID', type: 'text' },
      { name: 'hareket_türü', label: 'Hareket Türü', type: 'category' },
      { name: 'kaynak', label: 'Kaynak', type: 'category' },
      { name: 'tutar', label: 'Tutar', type: 'number' },
      { name: 'açıklama', label: 'Açıklama', type: 'text' },
      { name: 'tarih', label: 'Tarih', type: 'date' },
    ],
  },
];

// ------------------------------------------------------------
// Tablolar arası ilişkiler (JOIN graph)
// ------------------------------------------------------------

export const REPORT_RELATIONS: TableRelation[] = [
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'parents',
    toField: 'öğrenci_id',
  },
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'finance_payments',
    toField: 'öğrenci_id',
  },
  {
    fromTable: 'students',
    fromField: 'id',
    toTable: 'finance_installments',
    toField: 'öğrenci_id',
  },
  // Cari hesap; burada öğrencilerle doğrudan bağ olmayabilir,
  // ama ileride "source" alanıyla eşleştirilebilir.
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

