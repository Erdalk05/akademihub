/**
 * AKADEMİHUB – MEGA JSON CONTRACT (v1)
 * ===================================
 * Amaç: Akademik analiz ekranlarının tükettiği veriyi tek bir kontratta standardize etmek.
 *
 * ⚠️ Guard prensibi:
 * - Bu kontrat, "analiz/görselleştirme" katmanıdır.
 * - Scoring/parse hattında (optik parse, answer key seçimi, net hesaplama, DB overwrite) fallback yasaktır.
 * - Analiz katmanında legacy veriyi gösterebilmek için kaynaklar arası "enrichment" yapılabilir,
 *   ancak mutlaka `meta.sources` ve `meta.warnings/guards` ile şeffaf belirtilmelidir.
 */

export type AkademikAnalizContractVersion = 'v1';

export type GuardLevel = 'INFO' | 'WARN' | 'ERROR';

export type GuardArea =
  | 'OPTIK_PARSE'
  | 'TXT_KIND_DETECT'
  | 'START_DETECT'
  | 'BLANK_VS_SEPARATOR'
  | 'ANSWER_SEQUENCE'
  | 'LESSON_SLICING'
  | 'STUDENT_MATCHING'
  | 'BOOKLET_DETECT'
  | 'ANSWER_KEY_SELECT'
  | 'SCORING_NET_SCORE'
  | 'DB_WRITE_RESULTS'
  | 'RECALCULATE'
  | 'ANALYTICS_CONTRACT';

export interface GuardEvent {
  level: GuardLevel;
  area: GuardArea;
  message: string;
  detail?: Record<string, unknown>;
  at: string; // ISO
}

export interface DataSourceInfo {
  /**
   * Kaynak tablolar / endpoint’ler (şeffaflık için).
   * Örn: ["exam_student_results", "exam_student_analytics", "student_exam_results"]
   */
  tables?: string[];
  /**
   * Ana kaynak açıklaması (insan okunur).
   * Örn: "exam_student_results.subject_results boş → analytics'ten enrichment"
   */
  note?: string;
  /**
   * Alan bazında kaynak kırılımı (opsiyonel)
   */
  fields?: Record<string, string>;
}

export type ExamTypeCode = 'LGS' | 'TYT' | 'AYT' | 'DENEME' | 'UNKNOWN';

export interface DersNetSatiri {
  dersKodu: string; // TUR, MAT, FEN, INK, DIN, ING ...
  dersAdi: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  /** Bu ders satırı hangi kaynaktan geldi? */
  source?: 'SUBJECT_RESULTS' | 'ANALYTICS' | 'LEGACY_COLS' | 'UNKNOWN';
}

export interface GuardianInfo {
  adSoyad: string;
  yakinlik?: string | null;
  telefon?: string | null;
  telefon2?: string | null;
  email?: string | null;
  tip?: string | null;
  /** Bu veli bilgisi hangi kaynaktan geldi? */
  source?: 'GUARDIANS_TABLE' | 'STUDENTS_PARENT_FIELDS' | 'UNKNOWN';
}

export type StudentDurum = 'cok-iyi' | 'iyi' | 'orta' | 'gelismeli';

export interface StudentSummaryV1 {
  sira: number;
  ogrenciNo: string;
  ogrenciAdi: string; // UI gösterimi için tam ad
  sinif?: string | null;
  kitapcik?: string | null;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  puan: number | null;
  basariOrani: number; // 0..100
  durum: StudentDurum;

  dersBazli: DersNetSatiri[];
  veli: GuardianInfo | null;
  veliler: GuardianInfo[];

  /** Öğrenci satırındaki kaynak şeffaflığı */
  sources?: DataSourceInfo;
}

export interface DersOrtalamaV1 {
  dersKodu: string;
  dersAdi: string;
  ortDogru: number;
  ortYanlis: number;
  ortBos: number;
  ortNet: number;
  source?: 'AGG_FROM_STUDENT_ROWS' | 'UNKNOWN';
}

export interface ExamSummaryV1 {
  id: string;
  ad: string;
  tarih: string; // ISO veya date string
  tip: ExamTypeCode | string;

  toplamSoru: number;
  toplamOgrenci: number;

  ortalamaNet: number;
  ortalamaPuan: number | null;
  enYuksekPuan: number | null;
  wrongPenaltyDivisor?: number; // LGS=3

  dersOrtalamalari: DersOrtalamaV1[];
  ogrenciler: StudentSummaryV1[];
}

export interface AkademikAnalizContractV1 {
  version: AkademikAnalizContractVersion;
  exam: ExamSummaryV1;

  meta: {
    generatedAt: string; // ISO
    sources: DataSourceInfo;
    warnings: string[];
    guards: GuardEvent[];
  };
}


