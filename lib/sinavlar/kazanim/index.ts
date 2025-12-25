/**
 * Kazanım Bazlı Değerlendirme Modülü
 * 
 * Bu modül şunları içerir:
 * - Kazanım bazlı cevap anahtarı yönetimi
 * - Optik şablon editörü (karakter aralık tanımları)
 * - Optik veri parser (TXT dosya işleme)
 * - Öğrenci kazanım karnesi (PDF A4)
 * - Ana sınav sihirbazı (tüm adımları birleştirir)
 */

// Tipler
export * from './types';

// Bileşenler
export { default as KazanimCevapAnahtari } from './KazanimCevapAnahtari';
export { default as OptikSablonEditor } from './OptikSablonEditor';
export { default as OptikVeriParser } from './OptikVeriParser';
export { default as KazanimKarnesi } from './KazanimKarnesi';
export { default as SinavSihirbazi } from './SinavSihirbazi';

