/**
 * Kazanım Bazlı Değerlendirme Modülü
 * 
 * Bu modül şunları içerir:
 * - Kazanım bazlı cevap anahtarı yönetimi
 * - Optik şablon editörü (karakter aralık tanımları)
 * - Gelişmiş optik editör (drag-select, ruler, şablon kütüphanesi)
 * - Optik veri parser (TXT dosya işleme)
 * - Öğrenci kazanım karnesi (PDF A4)
 * - Çoklu sınav karşılaştırma (trend analizi)
 * - Veli paneli (basitleştirilmiş görünüm)
 * - AI takviye önerileri (kişiselleştirilmiş plan)
 * - Ana sınav sihirbazı (tüm adımları birleştirir)
 * - Sınav konfigürasyonları (LGS, TYT, AYT, DENEME)
 * - Şablon kütüphanesi (hazır optik form şablonları)
 */

// Tipler
export * from './types';

// Sınav Konfigürasyonları
export * from './sinavKonfigurasyonlari';

// Temel Bileşenler
export { default as KazanimCevapAnahtari } from './KazanimCevapAnahtari';
export { default as OptikSablonEditor } from './OptikSablonEditor';
export { default as OptikVeriParser } from './OptikVeriParser';
export { default as KazanimKarnesi } from './KazanimKarnesi';
export { default as SinavSihirbazi } from './SinavSihirbazi';
export { default as SablonKutuphanesi } from './SablonKutuphanesi';

// Gelişmiş Modüller
export { default as GelismisOptikEditor } from './GelismisOptikEditor';
export { default as CokluSinavKarsilastirma } from './CokluSinavKarsilastirma';
export { default as VeliPaneli } from './VeliPaneli';
export { default as AITakviyeOnerileri } from './AITakviyeOnerileri';

