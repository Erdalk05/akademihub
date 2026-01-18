// ============================================================================
// SCORING ENGINE - DEMO RUNNER (v1.0)
// Demonstrates end-to-end flow: WizardPayload → Adapter → scoreExam → JSON
// Console.log is ALLOWED in this file (demo purpose)
// ============================================================================

import { adaptWizardPayloadToScoringInput } from '../adapters/wizard-adapter';
import { scoreExam } from '../core';

/**
 * Demo: LGS sınavı örneği
 * - Toplam 10 soru (MAT: 5, FEN: 3, TUR: 2)
 * - Öğrenci B kitapçığı kullanıyor
 * - Karışık doğru/yanlış/boş
 * - 1 iptal soru (exclude_from_total)
 */
function demoLGSExam() {
  console.log('\n========================================');
  console.log('DEMO: LGS Sınavı (B Kitapçığı)');
  console.log('========================================\n');

  const payload = {
    presetName: 'LGS',
    bookletType: 'B' as const,
    studentId: 'student-demo-001',
    
    // Cevap Anahtarı (Master A kitapçığı)
    answerKey: [
      { questionNo: 1, correctOption: 'A', lessonCode: 'MAT' },
      { questionNo: 2, correctOption: 'B', lessonCode: 'MAT' },
      { questionNo: 3, correctOption: 'C', lessonCode: 'MAT' },
      { questionNo: 4, correctOption: 'A', lessonCode: 'MAT' },
      { questionNo: 5, correctOption: 'D', lessonCode: 'MAT' },
      { questionNo: 6, correctOption: 'A', lessonCode: 'FEN' },
      { questionNo: 7, correctOption: 'B', lessonCode: 'FEN' },
      { questionNo: 8, correctOption: 'E', lessonCode: 'FEN' },
      { questionNo: 9, correctOption: 'A', lessonCode: 'TUR' },
      { questionNo: 10, correctOption: 'C', lessonCode: 'TUR' },
    ],
    
    // Öğrenci Cevapları (B kitapçığı)
    // B kitapçığı rotation: A→B, B→C, C→D, D→E, E→A
    studentAnswers: [
      { questionNo: 1, markedOption: 'B' },  // B kitapçığında B → Master A (DOĞRU)
      { questionNo: 2, markedOption: 'C' },  // B kitapçığında C → Master B (DOĞRU)
      { questionNo: 3, markedOption: 'A' },  // B kitapçığında A → Master E (YANLIŞ)
      { questionNo: 4, markedOption: null }, // BOŞ
      { questionNo: 5, markedOption: 'E' },  // B kitapçığında E → Master D (DOĞRU)
      { questionNo: 6, markedOption: 'B' },  // B kitapçığında B → Master A (DOĞRU)
      { questionNo: 7, markedOption: 'D' },  // B kitapçığında D → Master C (YANLIŞ)
      // Soru 8: İPTAL (exclude_from_total)
      { questionNo: 9, markedOption: 'B' },  // B kitapçığında B → Master A (DOĞRU)
      { questionNo: 10, markedOption: 'D' }, // B kitapçığında D → Master C (DOĞRU)
    ],
    
    // İptal Edilmiş Sorular
    cancelledQuestions: [
      { questionNo: 8, policy: 'exclude_from_total' as const },
    ],
  };

  console.log('📥 Input Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n');

  // Adapter ile dönüştür
  const scoringInput = adaptWizardPayloadToScoringInput(payload);
  
  console.log('🔄 ScoringInput (after adapter):');
  console.log(`- Preset: ${scoringInput.preset.name}`);
  console.log(`- Answer Key Items: ${scoringInput.answerKey.length}`);
  console.log(`- Student Answers: ${scoringInput.studentAnswers.length}`);
  console.log(`- Cancelled Questions: ${scoringInput.answerKey.filter(q => q.isCancelled).length}`);
  console.log('\n');

  // Puanlama yap
  const result = scoreExam(scoringInput);
  
  console.log('📊 Scoring Result (JSON):');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n');

  // Manuel doğrulama
  console.log('✅ Manuel Doğrulama:');
  console.log(`- Doğru: ${result.totalCorrect} (beklenen: 6)`);
  console.log(`- Yanlış: ${result.totalWrong} (beklenen: 2)`);
  console.log(`- Boş: ${result.totalEmpty} (beklenen: 1)`);
  console.log(`- Net: ${result.totalNet} (beklenen: 6 - 2/3 = 5.333...)`);
  console.log(`- İptal Sorular: Toplam dışı bırakıldı (Soru 8)`);
  console.log('\n');
}

/**
 * Demo: TYT sınavı örneği
 * - Toplam 8 soru (TYT_TUR: 4, TYT_MAT: 4)
 * - Öğrenci C kitapçığı kullanıyor
 * - Tüm sorular doğru (perfect score)
 */
function demoTYTExam() {
  console.log('\n========================================');
  console.log('DEMO: TYT Sınavı (C Kitapçığı - Perfect Score)');
  console.log('========================================\n');

  const payload = {
    presetName: 'TYT',
    bookletType: 'C' as const,
    studentId: 'student-demo-002',
    
    answerKey: [
      { questionNo: 1, correctOption: 'A', lessonCode: 'TYT_TUR' },
      { questionNo: 2, correctOption: 'A', lessonCode: 'TYT_TUR' },
      { questionNo: 3, correctOption: 'A', lessonCode: 'TYT_TUR' },
      { questionNo: 4, correctOption: 'A', lessonCode: 'TYT_TUR' },
      { questionNo: 5, correctOption: 'A', lessonCode: 'TYT_MAT' },
      { questionNo: 6, correctOption: 'A', lessonCode: 'TYT_MAT' },
      { questionNo: 7, correctOption: 'A', lessonCode: 'TYT_MAT' },
      { questionNo: 8, correctOption: 'A', lessonCode: 'TYT_MAT' },
    ],
    
    // C kitapçığı rotation: A→C, B→D, C→E, D→A, E→B
    // Tüm doğru cevaplar: C kitapçığında 'C' işaretlemek → Master 'A'
    studentAnswers: [
      { questionNo: 1, markedOption: 'C' },
      { questionNo: 2, markedOption: 'C' },
      { questionNo: 3, markedOption: 'C' },
      { questionNo: 4, markedOption: 'C' },
      { questionNo: 5, markedOption: 'C' },
      { questionNo: 6, markedOption: 'C' },
      { questionNo: 7, markedOption: 'C' },
      { questionNo: 8, markedOption: 'C' },
    ],
  };

  const scoringInput = adaptWizardPayloadToScoringInput(payload);
  const result = scoreExam(scoringInput);
  
  console.log('📊 Scoring Result (JSON):');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n');

  console.log('✅ Manuel Doğrulama:');
  console.log(`- Doğru: ${result.totalCorrect} (beklenen: 8)`);
  console.log(`- Yanlış: ${result.totalWrong} (beklenen: 0)`);
  console.log(`- Net: ${result.totalNet} (beklenen: 8)`);
  console.log('\n');
}

/**
 * Ana demo runner
 * İki demo senaryoyu sırayla çalıştırır
 */
export function runDemos() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SCORING ENGINE - DEMO RUNNER (FAZ 2 - ADIM 2)            ║');
  console.log('║  Payload → Adapter → scoreExam → JSON Output              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  demoLGSExam();
  demoTYTExam();
  
  console.log('========================================');
  console.log('✅ All demos completed successfully!');
  console.log('========================================\n');
}

// Eğer dosya doğrudan çalıştırılırsa demo'yu başlat
if (require.main === module) {
  runDemos();
}
