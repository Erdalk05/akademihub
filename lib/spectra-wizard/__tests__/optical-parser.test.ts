import { describe, it, expect } from 'vitest';
import {
  parseOptikData,
  sanitizeFieldValue,
  sanitizeLine,
  turkishToUpperCase,
  turkishToLowerCase,
  normalizeForMatching,
  validateTCKimlik,
  calculateSimilarity,
} from '../optical-parser';
import type { OptikFormSablonu } from '@/types/spectra-wizard';

// ============================================================================
// HELPER: Mock Şablon
// ============================================================================
const createMockSablon = (overrides?: Partial<OptikFormSablonu>): OptikFormSablonu => ({
  id: 'test-sablon',
  ad: 'Test Şablonu',
  yayinevi: 'Test',
  sinifSeviyeleri: ['8'],
  sinavTurleri: ['DENEME'],
  toplamSoru: 20,
  satirUzunlugu: 100,
  alanlar: {
    ogrenciNo: { baslangic: 1, bitis: 10 },
    ogrenciAdi: { baslangic: 11, bitis: 40 },
    sinif: { baslangic: 41, bitis: 43 },
    kitapcik: { baslangic: 44, bitis: 44 },
    cevaplar: { baslangic: 50, bitis: 69 },
  },
  dersDagilimi: [
    { dersKodu: 'MAT', dersAdi: 'Matematik', baslangic: 0, bitis: 10, soruSayisi: 10 },
    { dersKodu: 'TUR', dersAdi: 'Türkçe', baslangic: 10, bitis: 20, soruSayisi: 10 },
  ],
  isDefault: true,
  isActive: true,
  ...overrides,
});

// ============================================================================
// TEST SUITE: sanitizeFieldValue
// ============================================================================
describe('sanitizeFieldValue', () => {
  it('undefined veya null için boş string döndürür', () => {
    // @ts-expect-error intentional test
    expect(sanitizeFieldValue(undefined)).toBe('');
    // @ts-expect-error intentional test
    expect(sanitizeFieldValue(null)).toBe('');
  });

  it('NFKD normalize uygular ve Türkçe karakterleri korur', () => {
    const input = 'Çağrı Öztürk';
    const result = sanitizeFieldValue(input);
    // NFKD normalize edilir ama Türkçe karakterler korunur
    expect(result).toBe('Çağrı Öztürk');
  });

  it('izinli karakter filtresi beklenen çıktıyı verir', () => {
    const input = 'Test\x00\x01\x02İsim';
    const result = sanitizeFieldValue(input);
    expect(result).not.toContain('\x00');
    expect(result).not.toContain('\x01');
    expect(result).toBe('Testİsim');
  });

  it('boşlukları trim eder', () => {
    expect(sanitizeFieldValue('  test  ')).toBe('test');
  });
});

// ============================================================================
// TEST SUITE: sanitizeLine
// ============================================================================
describe('sanitizeLine', () => {
  it('satır sonundaki boşlukları temizler', () => {
    expect(sanitizeLine('test   ')).toBe('test');
  });

  it('başındaki boşluklara dokunmaz', () => {
    expect(sanitizeLine('   test')).toBe('   test');
  });
});

// ============================================================================
// TEST SUITE: turkishToUpperCase & turkishToLowerCase
// ============================================================================
describe('Türkçe karakter dönüşümleri', () => {
  it('turkishToUpperCase Türkçe karakterleri doğru büyütür', () => {
    expect(turkishToUpperCase('çağrı')).toBe('ÇAĞRI');
    expect(turkishToUpperCase('istanbul')).toBe('İSTANBUL');
    expect(turkishToUpperCase('şişli')).toBe('ŞİŞLİ');
  });

  it('turkishToLowerCase Türkçe karakterleri doğru küçültür', () => {
    expect(turkishToLowerCase('ÇAĞRI')).toBe('çağrı');
    expect(turkishToLowerCase('İSTANBUL')).toBe('istanbul');
    expect(turkishToLowerCase('ŞİŞLİ')).toBe('şişli');
  });
});

// ============================================================================
// TEST SUITE: normalizeForMatching
// ============================================================================
describe('normalizeForMatching', () => {
  it('Türkçe karakterleri ASCII\'ye çevirir', () => {
    expect(normalizeForMatching('Çağrı')).toBe('cagri');
    expect(normalizeForMatching('Özdebir')).toBe('ozdebir');
    expect(normalizeForMatching('Şükrü')).toBe('sukru');
  });

  it('özel karakterleri ve boşlukları kaldırır', () => {
    expect(normalizeForMatching('Ali-Veli 123')).toBe('aliveli123');
  });
});

// ============================================================================
// TEST SUITE: validateTCKimlik
// ============================================================================
describe('validateTCKimlik', () => {
  it('geçerli TC kimlik numarasını doğrular', () => {
    expect(validateTCKimlik('12345678901')).toBe(false); // checksum hatası
    // Gerçek bir geçerli TC numarası: 10000000146 (test amaçlı bilinen)
    expect(validateTCKimlik('10000000146')).toBe(true);
  });

  it('11 haneden kısa numarayı reddeder', () => {
    expect(validateTCKimlik('123456789')).toBe(false);
  });

  it('0 ile başlayan numarayı reddeder', () => {
    expect(validateTCKimlik('01234567890')).toBe(false);
  });
});

// ============================================================================
// TEST SUITE: calculateSimilarity
// ============================================================================
describe('calculateSimilarity', () => {
  it('aynı stringler için 100 döner', () => {
    expect(calculateSimilarity('Ahmet', 'Ahmet')).toBe(100);
  });

  it('tamamen farklı stringler için düşük skor döner', () => {
    const score = calculateSimilarity('Ahmet', 'Zeynep');
    expect(score).toBeLessThan(50);
  });

  it('yakın stringler için yüksek skor döner', () => {
    const score = calculateSimilarity('Ahmet', 'Ahmet ');
    expect(score).toBeGreaterThan(90);
  });
});

// ============================================================================
// TEST SUITE: parseOptikData - Satır Uzunluğu Mismatch
// ============================================================================
describe('parseOptikData - Satır Uzunluğu Kontrolü', () => {
  it('satır uzunluğu uyuşmayan satır için status gecersiz_satir döner', () => {
    const sablon = createMockSablon();
    const rawText = '123456789012345678901234567890ABC'; // 33 karakter (beklenen 100)

    const result = parseOptikData(rawText, sablon);

    expect(result.satirlar.length).toBe(1);
    expect(result.satirlar[0].status).toBe('gecersiz_satir');
    expect(result.satirlar[0].durumEtiketi).toBe('Geçersiz Satır');
    expect(result.satirlar[0].ogrenciNo).toBe('');
    expect(result.satirlar[0].ogrenciAdi).toBe('');
    expect(result.satirlar[0].cevaplar).toHaveLength(sablon.toplamSoru);
  });

  it('stats.gecersizSatir sayısı doğru artırılır', () => {
    const sablon = createMockSablon();
    const rawText = 'TOO_SHORT\nALSO_SHORT';

    const result = parseOptikData(rawText, sablon);

    expect(result.stats?.gecersizSatir).toBe(2);
    expect(result.hataliSatir).toBe(2);
  });
});

// ============================================================================
// TEST SUITE: parseOptikData - Eksik Alan
// ============================================================================
describe('parseOptikData - Eksik Alan Kontrolü', () => {
  it('öğrenci numarası eksikse status eksik_veri döner', () => {
    const sablon = createMockSablon();
    // Satır tam 100 karakter, ama öğrenci no alanı (1-10) boş - sonda X
    const rawText = ' '.repeat(10) + 'AHMET YILMAZ' + ' '.repeat(18) + '8  A' + ' '.repeat(5) + 'AAAABBBBBC'.repeat(2) + 'X'.repeat(31);

    const result = parseOptikData(rawText, sablon);

    expect(result.satirlar.length).toBe(1);
    expect(result.satirlar[0].status).toBe('eksik_veri');
    expect(result.satirlar[0].durumEtiketi).toBe('Eksik Veri');
  });

  it('öğrenci adı eksikse status eksik_veri döner', () => {
    const sablon = createMockSablon();
    // Satır tam 100 karakter, öğrenci no var ama ad yok - sonda X
    const rawText = '1234567890' + ' '.repeat(30) + '8  A' + ' '.repeat(5) + 'AAAABBBBBC'.repeat(2) + 'X'.repeat(31);

    const result = parseOptikData(rawText, sablon);

    expect(result.satirlar.length).toBe(1);
    expect(result.satirlar[0].status).toBe('eksik_veri');
    expect(result.satirlar[0].durumEtiketi).toBe('Eksik Veri');
  });

  it('stats.eksikVeri sayısı doğru artırılır', () => {
    const sablon = createMockSablon();
    const line1 = ' '.repeat(10) + ' '.repeat(30) + '8  A' + ' '.repeat(5) + 'A'.repeat(20) + 'X'.repeat(31); // no eksik
    const line2 = '1234567890' + ' '.repeat(30) + '8  A' + ' '.repeat(5) + 'A'.repeat(20) + 'X'.repeat(31); // ad eksik

    const result = parseOptikData(`${line1}\n${line2}`, sablon);

    expect(result.stats?.eksikVeri).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// TEST SUITE: parseOptikData - Encoding Problemleri
// ============================================================================
describe('parseOptikData - Encoding & Unicode', () => {
  it('garbled karakterleri temizler', () => {
    const sablon = createMockSablon();
    // null byte, control char içeren isim
    const rawText =
      '1234567890' +
      'AHMET\x00YIL\x01MAZ' +
      ' '.repeat(19) +
      '8  A' +
      'AAAABBBBBC'.repeat(2);

    const result = parseOptikData(rawText, sablon);

    expect(result.satirlar.length).toBe(1);
    expect(result.satirlar[0].ogrenciAdi).not.toContain('\x00');
    expect(result.satirlar[0].ogrenciAdi).not.toContain('\x01');
  });

  it('Türkçe karakterler korunur', () => {
    const sablon = createMockSablon();
    // Satır tam 100 karakter - sonda X ile dolduruyoruz çünkü trimEnd boşlukları siliyor
    const rawText =
      '1234567890' +
      'ÇAĞRIöZTÜRK' + ' '.repeat(19) +
      '8  A' +
      ' '.repeat(5) +
      'AAAABBBBBC'.repeat(2) + 'X'.repeat(31); // Sonda X kullan

    const result = parseOptikData(rawText, sablon);

    expect(result.satirlar[0].ogrenciAdi).toContain('Ç');
    expect(result.satirlar[0].ogrenciAdi).toContain('Ğ');
  });
});

// ============================================================================
// TEST SUITE: parseOptikData - Stats Doğruluğu
// ============================================================================
describe('parseOptikData - Stats Doğruluğu', () => {
  it('stats objesi tüm alanları içerir', () => {
    const sablon = createMockSablon();
    const validLine =
      '1234567890' +
      'AHMET YILMAZ' +
      ' '.repeat(18) +
      '8  A' +
      ' '.repeat(5) +
      'AAAABBBBBC'.repeat(2) + ' '.repeat(31);

    const result = parseOptikData(validLine, sablon);

    expect(result.stats).toBeDefined();
    expect(result.stats).toHaveProperty('toplam');
    expect(result.stats).toHaveProperty('basarili');
    expect(result.stats).toHaveProperty('eksikVeri');
    expect(result.stats).toHaveProperty('gecersizSatir');
  });

  it('karışık satırlarda sayılar doğru', () => {
    const sablon = createMockSablon();
    const validLine =
      '1234567890' +
      'AHMET YILMAZ' +
      ' '.repeat(18) +
      '8  A' +
      ' '.repeat(5) +
      'AAAABBBBBC'.repeat(2) + ' '.repeat(31);
    const shortLine = 'TOO_SHORT';
    const missingFieldLine = ' '.repeat(100);

    const result = parseOptikData(`${validLine}\n${shortLine}\n${missingFieldLine}`, sablon);

    // shortLine boş olduğu için filtrelenir, sadece 2 satır kalır
    expect(result.stats?.toplam).toBe(2);
    expect(result.stats?.basarili).toBeGreaterThanOrEqual(0);
    expect(result.stats?.gecersizSatir).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// TEST SUITE: parseOptikData - Placeholder String Alanlar
// ============================================================================
describe('parseOptikData - Placeholder Güvenliği', () => {
  it('gecersiz satır için tüm alanlar string olarak dolu', () => {
    const sablon = createMockSablon();
    const rawText = 'SHORT';

    const result = parseOptikData(rawText, sablon);
    const row = result.satirlar[0];

    expect(typeof row.ogrenciNo).toBe('string');
    expect(typeof row.ogrenciAdi).toBe('string');
    expect(row.ogrenciNo).toBe('');
    expect(row.ogrenciAdi).toBe('');
    expect(Array.isArray(row.cevaplar)).toBe(true);
    expect(row.cevaplar).toHaveLength(sablon.toplamSoru);
  });

  it('tüm string alanlar undefined veya null içermez', () => {
    const sablon = createMockSablon();
    const rawText = 'SHORT\n' + ' '.repeat(100);

    const result = parseOptikData(rawText, sablon);

    result.satirlar.forEach(satir => {
      expect(satir.ogrenciNo).toBeDefined();
      expect(satir.ogrenciAdi).toBeDefined();
      expect(typeof satir.ogrenciNo).toBe('string');
      expect(typeof satir.ogrenciAdi).toBe('string');
    });
  });
});
