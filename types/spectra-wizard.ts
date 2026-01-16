// ============================================================================
// SPECTRA WIZARD TYPES
// ============================================================================

export interface WizardStep1Data {
  sinavAdi: string;
  sinavTuru: string;
  sinavTarihi?: string;
  sinifSeviyesi?: string;
  aciklama?: string;
}

export interface WizardStep2Data {
  cevapAnahtari: {
    toplamSoru: number;
    dersSirasi?: string[];
    items: Array<{
      soruNo: number;
      dersKodu: string;
      dersAdi?: string;
      dogruCevap?: string;
      kazanimKodu?: string;
      kazanimAciklamasi?: string;
      iptal?: boolean;
      kitapcikCevaplari?: any;
    }>;
  };
}

export interface WizardStep3Data {
  [key: string]: any;
}

export interface WizardStep4Data {
  parseResult: {
    satirlar: any[];
    hatalar?: any[];
  };
}

export interface OgrenciSonuc {
  studentId?: string;
  ogrenciAdi: string;
  sinif?: string;
  isMisafir: boolean;
  eslesmeDurumu?: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  tahminiPuan?: number;
  kurumSirasi?: number;
  sinifSirasi?: number;
  yuzdelikDilim?: number;
  cevaplar?: any;
  dersSonuclari?: any[];
}

export interface OptikFormSablonu {
  id: string;
  name: string;
  questionCount: number;
  fields: any;
}
