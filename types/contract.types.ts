/**
 * 📝 SÖZLEŞME MODÜLü - TypeScript Types
 * Dinamik sözleşme sistemi için tüm interface ve type tanımları
 * AI Nitelikli: Smart validation, Dynamic fields, Auto-generation
 */

// ==================== TEMEL SÖZLEŞME TYPES ====================

export type ContractStatus = 'Taslak' | 'Onay Bekliyor' | 'İmzalandı' | 'Geçersiz' | 'İptal Edildi';
export type ContractType = 'Standart' | 'İndirimli' | 'Özel' | 'Yabancı Uyruklu';
export type ApprovalStatus = 'Beklemede' | 'Onaylandı' | 'Reddedildi';
export type PaymentMethod = 'Nakit' | 'Kredi Kartı' | 'Havale' | 'EFT' | 'Çek';

// ==================== VERİ MODELLERİ ====================

/**
 * 📋 SÖZLEŞME ANA ENTITY
 * Tüm sözleşme bilgilerini içeren ana yapı
 */
export interface Contract {
  // ==================== TEMEL BİLGİLER ====================
  id: string;
  contractNo: string; // SOZ-2025-0001
  sablon: ContractTemplateType;
  durum: ContractStatus;
  olusturmaTarihi: Date;
  sonGuncellemeTarihi: Date;

  // ==================== TARAF BİLGİLERİ ====================
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    tcKimlik: string;
    dogumTarihi: Date;
    sinif: string;
    program: string;
    email?: string;
    telefon?: string;
  };

  veli: {
    ad: string;
    soyad: string;
    tcKimlik: string;
    adres: string;
    ilce: string;
    il: string;
    postaKodu?: string;
    telefon: string;
    sabitTelefon?: string;
    email: string;
  };

  okul: {
    ad: string;
    vergiNo: string;
    adres: string;
    ilce: string;
    il: string;
    telefon: string;
    email: string;
    yetkili: {
      ad: string;
      soyad: string;
      gorev: string;
    };
  };

  // ==================== FİNANSAL BİLGİLER ====================
  finans: {
    brutUcret: number; // Yıllık brüt ücret
    indirimler: Array<{
      tip: 'Kardeş' | 'Başarı' | 'Erken Kayıt' | 'Özel';
      oran: number; // %
      tutar: number; // ₺
      aciklama: string;
    }>;
    toplamIndirim: number; // ₺
    netUcret: number; // İndirimli tutar

    kayitBedeli: {
      tutar: number;
      odemeTarihi?: Date;
      odemeYontemi?: PaymentMethod;
      makbuzNo?: string;
    };

    kalanTutar: number;

    taksitPlani: Array<{
      no: number;
      vadeTarihi: Date;
      tutar: number;
      odemeYontemi?: PaymentMethod;
      aciklama?: string;
      odendiMi: boolean;
      odemeTarihi?: Date;
      makbuzNo?: string;
    }>;
  };

  // ==================== SÖZLEŞME İÇERİĞİ ====================
  maddeler: Array<{
    no: number;
    baslik: string;
    icerik: string; // HTML/Markdown
    zorunlu: boolean;
    duzenlenebilir: boolean;
    dinamik?: boolean; // AI tarafından oluşturuldu mu?
  }>;

  indirimSartlari: {
    aciklama: string;
    gecerlilikKosullari: string[];
    iptalDurumlari: string[];
  };

  // ==================== YASAL ONAYLAR ====================
  kvkk: {
    metni: string;
    onaylandi: boolean;
    onayTarihi?: Date;
    onayIpAdresi?: string;
  };

  acikRiza: {
    metni: string;
    onaylandi: boolean;
    onayTarihi?: Date;
    onayIpAdresi?: string;
  };

  // ==================== İMZALAR ====================
  imzalar: {
    veli: {
      ad: string;
      soyad: string;
      imzaUrl?: string; // Base64 Canvas imza
      imzaTarihi?: Date;
      ipAdresi?: string;
      cihazBilgisi?: string;
      geoKonum?: {
        lat: number;
        lng: number;
      };
      onayDurumu: ApprovalStatus;
    };

    yetkili: {
      ad: string;
      soyad: string;
      gorev: string;
      imzaUrl?: string;
      imzaTarihi?: Date;
      ipAdresi?: string;
      onayDurumu: ApprovalStatus;
    };
  };

  // ==================== EKLER & PDF ====================
  ekler: Array<{
    id: string;
    ad: string;
    tip: 'Bilgi Formu' | 'Kimlik' | 'Ödeme Dekontu' | 'İndirim Belgesi' | 'Diğer';
    url: string;
    yuklemeTarihi: Date;
    boyut: number;
  }>;

  pdf: {
    url?: string;
    olusturmaTarihi?: Date;
    dosyaBoyutu?: number;
    hash?: string;
  };

  // ==================== TARİHLER ====================
  tarihler: {
    olusturma: Date;
    sonGuncelleme: Date;
    imzalanma?: Date;
    gecerlilikBaslangic: Date;
    gecerlilikBitis: Date;
  };

  // ==================== AI ANALİZ ====================
  aiAnaliz?: {
    riskSkoru: number; // 0-100
    anomaliTespiti: {
      bulundu: boolean;
      detay?: string;
      oneriler?: string[];
    };
    benzerSozlesmeler: {
      count: number;
      benzerlikOrani: number;
    };
    otomatikDoldurma: {
      alanlar: string[];
      oranı: number; // %
    };
    analiz_Tarihi: Date;
  };

  // ==================== NOTLAR ====================
  notlar?: string;
  iptalNedeni?: string;
  
  // ==================== META ====================
  olusturan: string; // User ID
  sonGuncelleyen?: string;
  durum_Gecmisi: Array<{
    durum: ContractStatus;
    tarih: Date;
    yapan: string;
    neden?: string;
  }>;
}

// ==================== SÖZLEŞME ŞABLONU ====================

/**
 * 📄 CONTRACT TEMPLATE
 * Admin tarafından yönetilen sözleşme şablonları
 */
export interface ContractTemplate {
  id: string;
  ad: string; // "Standart Kayıt Sözleşmesi"
  tip: ContractType;
  versiyon: number; // v1, v2, vb.
  aktif: boolean;

  icerik: {
    baslik: string;
    giris: string; // {{OGRENCI_ADI}} gibi değişkenler
    maddeler: Array<{
      no: number;
      baslik: string;
      icerik: string;
      zorunlu: boolean;
      duzenlenebilir: boolean;
      kategori?: 'Genel' | 'Finans' | 'Yasal' | 'Akademik' | 'Sağlık';
    }>;
    sonuc: string;
  };

  degiskenler: {
    kisisel: string[]; // {{OGRENCI_ADI}}, {{OGRENCI_TC}}, vb.
    finansal: string[]; // {{NET_UCRET}}, {{TAKSIT_SAYISI}}, vb.
    okul: string[]; // {{OKUL_ADI}}, {{OKUL_TELEFON}}, vb.
    veli: string[]; // {{VELI_ADI}}, {{VELI_TELEFON}}, vb.
  };

  kvkkMetni: string;
  acikRizaMetni: string;

  // ==================== AI NİTELİKLER ====================
  aiOzellikleri?: {
    dinamikMaddeler: boolean; // AI risk'e göre madde ekler mi?
    akıllıIndirmi: boolean; // AI indirimi otomatik hesaplar mı?
    kisiselestirme: boolean; // AI, veli profiline göre customizer mi?
    otomatikSozlesmeSuggestion: boolean; // Otomatik önerilen sözleşme
  };

  // ==================== DÖKÜMAN ====================
  doküman: {
    pdfUrl?: string;
    previewUrl?: string;
    lastPreviewDate?: Date;
  };

  olusturan: string;
  sonGuncelleyen?: string;
  olusturmaTarihi: Date;
  sonGuncellemeTarihi: Date;
  kullanimSayisi: number; // Kaç kez kullanıldı?
}

// ==================== FORM STATES ====================

export interface ContractFormData {
  ogrenciId: string;
  sablon: ContractType;
  customMaddeler?: Array<{
    baslik: string;
    icerik: string;
  }>;
  indirimler?: Array<{
    tip: string;
    tutar: number;
  }>;
  taksitSayisi: number;
  ozelNotlar?: string;
}

export interface SignatureData {
  veliImza?: string;
  yetkiliImza?: string;
  kvkkOnay: boolean;
  acikRizaOnay: boolean;
  ipAdresi?: string;
  cihazBilgisi?: string;
  geoKonum?: {
    lat: number;
    lng: number;
  };
}

// ==================== RESPONSE TYPES ====================

export interface ContractGenerationResponse {
  success: boolean;
  contract?: Contract;
  error?: string;
  warnings?: string[];
  aiSuggestions?: string[];
}

export interface ContractValidationResult {
  isValid: boolean;
  errors: Array<{
    alan: string;
    mesaj: string;
    onem: 'Kritik' | 'Uyarı' | 'Bilgi';
  }>;
  uyarilar: string[];
}

export interface ContractPDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  fileSize?: number;
  generatedAt?: Date;
  error?: string;
}

// ==================== API REQUEST/RESPONSE ====================

export interface CreateContractRequest {
  ogrenciId: string;
  sablon: ContractType;
  customData?: Partial<Contract>;
}

export interface UpdateContractRequest {
  id: string;
  data: Partial<Contract>;
}

export interface SignContractRequest {
  contractId: string;
  signatureData: SignatureData;
}

export interface GeneratePDFRequest {
  contractId: string;
  includeSignatures?: boolean;
}

// ==================== AI NİTELİKLER ====================

export interface AIContractAnalysis {
  riskSkoru: number;
  anormalities: {
    bulundu: boolean;
    listesi: string[];
  };
  recommendations: string[];
  autoFillPercentage: number;
  estimatedSigningTime: number; // Dakika
  similarContracts: {
    contractNo: string;
    similarity: number;
  }[];
}

export interface AIContractSuggestions {
  tavsiye_edilen_sablonlar: Array<{
    templateId: string;
    adi: string;
    uygunlukOrani: number; // %
    neden: string[];
  }>;
  onerilen_indirimler: Array<{
    tip: string;
    tutar: number;
    neden: string;
  }>;
  onerilen_taksit_plani: {
    taksitSayisi: number;
    ilkTaksitTarihi: Date;
    taksitTutari: number;
    faydalar: string[];
  };
}

// ==================== UTILITY TYPES ====================

export type ContractTemplateType = 'Standart' | 'İndirimli' | 'Özel' | 'Yabancı Uyruklu';

export interface ContractEmailData {
  veliEmail: string;
  veliAd: string;
  ogrenciAd: string;
  sözlesmeNo: string;
  pdfUrl: string;
  ilkTaksitTarihi: Date;
  ilkTaksitTutari: number;
}

export interface ContractHistoryEntry {
  id: string;
  contractNo: string;
  ogrenci: {
    ad: string;
    soyad: string;
  };
  veli: {
    ad: string;
    soyad: string;
  };
  sablon: ContractType;
  durum: ContractStatus;
  imzaTarihi?: Date;
  olusturmaTarihi: Date;
  pdfUrl?: string;
}

// ==================== ENUM'LAR ====================

export const CONTRACT_STATUSES: Record<ContractStatus, string> = {
  'Taslak': '✏️ Taslak',
  'Onay Bekliyor': '⏳ Onay Bekliyor',
  'İmzalandı': '✅ İmzalandı',
  'Geçersiz': '❌ Geçersiz',
  'İptal Edildi': '🚫 İptal Edildi'
};

export const CONTRACT_TYPES: Record<ContractType, string> = {
  'Standart': '📄 Standart Sözleşme',
  'İndirimli': '💰 İndirimli Sözleşme',
  'Özel': '⚙️ Özel Sözleşme',
  'Yabancı Uyruklu': '🌍 Yabancı Uyruklu'
};

export const APPROVAL_STATUSES: Record<ApprovalStatus, string> = {
  'Beklemede': '⏳ Beklemede',
  'Onaylandı': '✅ Onaylandı',
  'Reddedildi': '❌ Reddedildi'
};
