import { Gender, BloodType, StudentStatus, BaseEntity } from './common.types';

// ============================================
// STUDENTS-DATABASE.MD - FULL STUDENT TYPES
// ============================================

// ==================== VELİ BİLGİLERİ ====================

export interface VeliDetay {
  ad: string;
  soyad: string;
  tcKimlik: string;
  dogumTarihi: Date;
  meslek: string;
  cepTelefonu: string;
  sabitTelefon?: string;
  email?: string;
  egitimDurumu: string;
  aylikGelir?: number;
  adres?: string;
}

// ==================== BELGE BİLGİLERİ ====================

export interface BelgeDetay {
  id: string;
  ad: string;
  kategori: string;
  url: string;
  format: string;
  boyut: number;
  yuklemeTarihi: Date;
  yukleyen: string;
  onayDurumu: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
  onaylayan?: string;
  onayTarihi?: Date;
  aciklama?: string;
}

// ==================== İMZA BİLGİLERİ ====================

export interface ImzaDetay {
  ad: string;
  imzaUrl?: string;
  imzaTarihi?: Date;
  ipAdresi?: string;
  cihazBilgisi?: string;
}

// ==================== FİNANSAL BİLGİLER ====================

export interface OdemePlaniBilgisi {
  tip: 'Peşin' | 'Taksitli';
  pesinIndirim?: number;
  taksitSayisi?: number;
  taksitTutari?: number;
  ilkOdemeTarihi?: Date;
}

export interface OdemeDurumuBilgisi {
  toplamBorc: number;
  odenenmiktar: number;
  kalanBorc: number;
  odemeOrani: number;
  gecikmisTaksitSayisi: number;
  sonOdemeTarihi?: Date;
}

export interface FinansalBilgiler {
  yillikUcret: number;
  indirimler: {
    kardes: number;
    erkenKayit: number;
    basari: number;
    ozel: number;
    toplam: number;
  };
  netUcret: number;
  odemePlani: OdemePlaniBilgisi;
  odemeDurumu: OdemeDurumuBilgisi;
}

// ==================== AKADEMİK BİLGİLER ====================

export interface DersNotları {
  dersId: string;
  dersAdi: string;
  ogretmenId: string;
  notlar: {
    yazili1?: number;
    yazili2?: number;
    yazili3?: number;
    sozlu?: number;
    proje?: number;
    performans?: number;
    ortalama: number;
  };
  devamsizlik: number;
  davranis: number;
}

export interface DevamsizlikBilgisi {
  toplam: number;
  ozurlu: number;
  ozursuz: number;
  oran: number;
}

export interface OdevBilgisi {
  toplam: number;
  tamamlanan: number;
  geciken: number;
  bekleyen: number;
  tamamlamaOrani: number;
}

export interface AkademikBilgiler {
  genelOrtalama: number;
  donememOrtalamasi: number;
  gecenDonemOrtalamasi: number;
  dersler: DersNotları[];
  devamsizlik: DevamsizlikBilgisi;
  odevler: OdevBilgisi;
}

// ==================== REHBERLİK BİLGİLERİ ====================

export interface PsikolojikDurum {
  genelDurum: 'İyi' | 'Orta' | 'Risk Altında';
  riskSeviyesi: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek';
  sonDegerlendirme?: Date;
}

export interface DavranisDeğerlendirmesi {
  puan: number;
  gucluYonler: string[];
  gelisimAlanlari: string[];
}

export interface Test {
  id: string;
  ad: string;
  tip: 'Meslek' | 'Kişilik' | 'Yetenek' | 'İlgi';
  tarih: Date;
  sonuclar: any;
  raporUrl?: string;
}

export interface Görüşme {
  id: string;
  tarih: Date;
  tur: 'Veli' | 'Öğrenci' | 'Aile';
  katilimcilar: string[];
  konu: string;
  notlar: string;
  kararlar: string[];
  sonrakiGorisme?: Date;
}

export interface DestekProgrami {
  id: string;
  ad: string;
  baslangic: Date;
  bitis?: Date;
  durum: 'Aktif' | 'Tamamlandı' | 'İptal';
  hedefler: Array<{
    hedef: string;
    tamamlandi: boolean;
  }>;
  ilerleme: number;
}

export interface RehberlikBilgiler {
  psikolojikDurum: PsikolojikDurum;
  davranis: DavranisDeğerlendirmesi;
  testler: Test[];
  gorusmeler: Görüşme[];
  destekProgramlari: DestekProgrami[];
}

// ==================== SÖZLEŞME BİLGİLERİ ====================

export interface SözlesmeBilgisi {
  sozlesmeNo: string;
  sablon: 'Standart' | 'İndirimli' | 'Özel';
  olusturmaTarihi: Date;
  imzaTarihi?: Date;
  gecerlilikTarihi: Date;
  imzalar: {
    veli: ImzaDetay;
    yetkili: ImzaDetay;
  };
  kvkkOnay: boolean;
  kvkkOnayTarihi?: Date;
  acikRiza: boolean;
  acikRizaTarihi?: Date;
  pdfUrl?: string;
}

// ==================== AI VE RİSK ANALİZİ ====================

export interface AIRiskSkoru {
  riskSkoru: number;
  riskKategorisi: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek';
  riskFaktorleri: string[];
  oneriler: string[];
  tahminler: {
    akademikBasari: number;
    mezuniyetOrtalamasi: number;
    universiteSinavBasarisi: number;
    kariyerYonelimi?: string[];
  };
  sonAnalizTarihi: Date;
}

// ==================== ANA STUDENT INTERFACE ====================

export interface Student extends BaseEntity {
  // Temel bilgiler
  ogrenciNo: string;
  tcKimlik: string;
  ad: string;
  soyad: string;
  dogumTarihi: Date;
  dogumYeri: string;
  cinsiyet: 'Erkek' | 'Kız';
  kanGrubu?: string;
  uyruk: string;
  fotoUrl?: string;

  // İletişim
  cepTelefonu?: string;
  email?: string;

  // Adres
  adres: {
    il: string;
    ilce: string;
    mahalle: string;
    sokak: string;
    binaNo: string;
    daireNo?: string;
    postaKodu?: string;
    tamAdres: string;
  };

  // Eğitim bilgileri
  sinif: string;
  sube: string;
  okulNo: string;
  durum: 'Aktif' | 'İzinli' | 'Pasif' | 'Mezun' | 'Ayrıldı';
  kayitTarihi: Date;
  mezuniyetTarihi?: Date;

  // Önceki okul
  oncekiOkul?: {
    ad: string;
    tur: 'Devlet' | 'Özel';
    il: string;
    ilce: string;
    sonSinif: string;
    mezuniyetNotu?: number;
    ayrilmaNedeni?: string;
  };

  // Ders seçimi
  dersSecimi?: {
    dil: 'İngilizce' | 'Almanca' | 'Fransızca';
    secimliler: string[];
  };

  // Veli bilgileri
  veli: {
    anne: VeliDetay;
    baba: VeliDetay;
    vasi?: VeliDetay;
    acilDurumKisi: 'Anne' | 'Baba' | 'Vasi' | 'Diğer';
    acilDurumTelefon: string;
    acilDurumKisiAdi?: string;
    iletisimTercihi: 'SMS' | 'Email' | 'Telefon' | 'Hepsi';
    iletisimDili: 'Türkçe' | 'İngilizce';
  };

  // Kardeş bilgileri
  kardesler: Array<{
    id: string;
    ad: string;
    soyad: string;
    dogumTarihi: Date;
    okuldaMi: boolean;
    ogrenciId?: string;
    sinif?: string;
    indirimOrani?: number;
  }>;

  // Sağlık bilgileri
  saglik: {
    genelDurum: 'İyi' | 'Kronik Hastalık' | 'Özel Durum';
    kronikHastaliklar: string[];
    alerjiler: string[];
    kullanilanIlaclar: Array<{
      ad: string;
      doz: string;
      kulanimSaatleri: string[];
    }>;
    asiKartiVarMi: boolean;
    asiKartiUrl?: string;
    ozelEgitimIhtiyaci: boolean;
    ozelEgitimDetay?: string;
    psikolojikDestek: boolean;
    psikolojikDestekDetay?: string;
    acilDurumNotu?: string;
  };

  // Finansal bilgiler
  finans: FinansalBilgiler;

  // Akademik bilgiler
  akademik: AkademikBilgiler;

  // Rehberlik bilgileri
  rehberlik: RehberlikBilgiler;

  // Belgeler
  belgeler: {
    zorunlu: {
      nufusCuzdani: BelgeDetay;
      ikametgah: BelgeDetay;
      saglikRaporu: BelgeDetay;
    };
    opsiyonel: {
      nakilBelgesi?: BelgeDetay;
      asiKarti?: BelgeDetay;
      veliKimlik?: BelgeDetay;
    };
    sertifikalar: BelgeDetay[];
    diger: BelgeDetay[];
  };

  // Sözleşme
  sozlesme: SözlesmeBilgisi;

  // AI ve risk analizi
  ai: AIRiskSkoru;

  // Metadata
  metadata: {
    kayitYapan: string;
    sonGuncelleyen: string;
    sonGuncellemeTarihi: Date;
    aktifMi: boolean;
    silindiMi: boolean;
    silmeTarihi?: Date;
    notlar?: string;
  };
}

// ==================== INPUT TYPES ====================

export interface StudentCreateInput {
  tcKimlik: string;
  ad: string;
  soyad: string;
  dogumTarihi: Date;
  dogumYeri: string;
  cinsiyet: 'Erkek' | 'Kız';
  kanGrubu?: string;
  sinif: string;
  sube: string;
  veli: {
    anne: VeliDetay;
    baba: VeliDetay;
    acilDurumTelefon: string;
    iletisimTercihi: 'SMS' | 'Email' | 'Telefon' | 'Hepsi';
  };
  saglik?: Student['saglik'];
  finans?: FinansalBilgiler;
}

export interface StudentUpdateInput {
  ad?: string;
  soyad?: string;
  sinif?: string;
  sube?: string;
  durum?: Student['durum'];
  fotoUrl?: string;
  veli?: Partial<Student['veli']>;
  saglik?: Partial<Student['saglik']>;
  akademik?: Partial<AkademikBilgiler>;
  finans?: Partial<FinansalBilgiler>;
  rehberlik?: Partial<RehberlikBilgiler>;
}

// ==================== ESKI TYPES (KOMPATİBİLİTE İÇİN) ====================

export interface ParentInfo {
  motherName: string;
  motherPhone?: string;
  motherEmail?: string;
  motherProfession?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherProfession?: string;
  address: string;
  emergencyPhone: string;
}

export interface HealthInfo {
  status: string;
  chronicDiseases: string[];
  allergies: string[];
  medications: string[];
  emergencyInfo?: string;
  lastCheckupDate?: Date;
}

export interface StudentStats {
  averageGrade: number;
  attendance: {
    present: number;
    absent: number;
    excused: number;
    total: number;
  };
  subjects: Array<{
    name: string;
    grade: number;
    trend: 'up' | 'down' | 'same';
  }>;
}

export interface StudentWithStats extends Student {
  stats: StudentStats;
}

export interface Attendance extends BaseEntity {
  studentId: string;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  notes?: string;
}
