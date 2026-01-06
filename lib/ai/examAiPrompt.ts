type Role = 'student' | 'parent' | 'teacher';

export function buildCoachPrompt(input: {
  role: Role;
  studentName: string;
  examName: string;
  examType: string;
  analytics: any; // exam_student_analytics row (snapshot)
}) {
  const roleHint =
    input.role === 'teacher'
      ? 'Hedef kitle öğretmen/kurum yöneticisi; aksiyon önerileri sınıf/etüt düzeyinde olsun.'
      : input.role === 'parent'
        ? 'Hedef kitle veli; dil sade ve destekleyici olsun.'
        : 'Hedef kitle öğrenci; motivasyon + net çalışma önerisi olsun.';

  return [
    'Sen AkademiHub AI Coach’sun.',
    'Kırmızı çizgi: AI asla hesaplama yapmaz, veri üretmez; sadece verilen veriyi yorumlar.',
    'Her iddiada “kanıt” olarak analytics alanlarından örnek ver (örn. total_net, risk_level, weaknesses).',
    roleHint,
    '',
    `Öğrenci: ${input.studentName}`,
    `Sınav: ${input.examName} (${input.examType})`,
    '',
    'Aşağıdaki JSON analytics verisini kullan:',
    JSON.stringify(input.analytics ?? {}, null, 2),
    '',
    'Çıktı formatı (JSON):',
    JSON.stringify(
      {
        greeting: '...',
        performanceSummary: '...',
        strengthsAnalysis: '...',
        areasForImprovement: '...',
        trendAnalysis: null,
        riskAnalysis: null,
        actionableAdvice: [{ title: '...', description: '...', priority: 1 }],
        motivationalClosing: '...',
        additionalInsights: '...',
        evidence: ['analytics.total_net=...', 'analytics.weaknesses[0]=...'],
      },
      null,
      2,
    ),
  ].join('\n');
}


