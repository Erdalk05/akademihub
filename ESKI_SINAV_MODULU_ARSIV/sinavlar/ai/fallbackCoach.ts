/**
 * ============================================
 * AkademiHub - Fallback AI Coach
 * ============================================
 * 
 * PHASE 5 - AI Hata Durumu İçin Statik Ama Akıllı Yanıtlar
 * 
 * BU DOSYA:
 * - API hatası durumunda kullanılır
 * - Veriye dayalı statik yanıtlar üretir
 * - Hesaplama YAPMAZ, sadece var olan veriyi formatlar
 */

import type { StudentAnalyticsOutput } from '../analytics/orchestrator/types';
import type { 
  AICoachInput, 
  AICoachOutput, 
  StructuredCoachOutput, 
  ActionableAdvice,
  AIRole 
} from './types';

// ==================== ANA FONKSİYON ====================

/**
 * Fallback coach yanıtı üretir
 * 
 * API hatası durumunda çağrılır.
 * Veriye dayalı ama statik yanıtlar üretir.
 */
export function generateFallbackResponse(input: AICoachInput): AICoachOutput {
  const startTime = Date.now();
  const { role, analytics } = input;
  
  try {
    const structured = buildStructuredOutput(role, analytics);
    const message = formatAsMessage(role, structured);
    
    return {
      success: true,
      message,
      structured,
      metadata: {
        role,
        model: 'fallback-v1',
        durationMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
        usedFallback: true,
        version: '1.0.0',
        dataQuality: calculateDataQuality(analytics)
      }
    };
  } catch (error) {
    return {
      success: false,
      message: getMinimalFallbackMessage(role),
      structured: getEmptyStructuredOutput(),
      metadata: {
        role,
        model: 'fallback-v1',
        durationMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
        usedFallback: true,
        version: '1.0.0',
        dataQuality: 'low'
      },
      error: error instanceof Error ? error.message : 'Fallback error'
    };
  }
}

// ==================== YAPILANDIRILMIŞ ÇIKTI ====================

function buildStructuredOutput(
  role: AIRole,
  analytics: StudentAnalyticsOutput
): StructuredCoachOutput {
  const { summary, trends, risk, strengths, weaknesses } = analytics;
  
  return {
    greeting: getGreeting(role),
    performanceSummary: getPerformanceSummary(role, summary),
    strengthsAnalysis: getStrengthsAnalysis(role, strengths),
    areasForImprovement: getAreasForImprovement(role, weaknesses),
    trendAnalysis: getTrendAnalysis(role, trends),
    riskAnalysis: getRiskAnalysis(role, risk),
    actionableAdvice: getActionableAdvice(role, analytics),
    motivationalClosing: getMotivationalClosing(role, summary.percentile),
    additionalInsights: getAdditionalInsights(role, analytics)
  };
}

// ==================== SELAMLAMA ====================

function getGreeting(role: AIRole): string {
  const greetings: Record<AIRole, string> = {
    student: 'Merhaba! 👋',
    parent: 'Sayın Veli,',
    teacher: 'Değerli Öğretmenimiz,'
  };
  return greetings[role];
}

// ==================== PERFORMANS ÖZETİ ====================

function getPerformanceSummary(
  role: AIRole,
  summary: StudentAnalyticsOutput['summary']
): string {
  const { total_net, percentile, rank_in_class, vs_class_avg } = summary;
  
  // Performans seviyesi belirle
  const level = getPerformanceLevel(percentile);
  
  if (role === 'student') {
    if (level === 'high') {
      return `Bu sınavda ${total_net.toFixed(2)} net yaptın. Harika bir performans sergiliyorsun!`;
    } else if (level === 'medium') {
      return `Bu sınavda ${total_net.toFixed(2)} net yaptın. İyi gidiyorsun, biraz daha çalışmayla daha da ilerleyebilirsin!`;
    } else {
      return `Bu sınavda ${total_net.toFixed(2)} net yaptın. Endişelenme, birlikte gelişim alanlarına bakacağız.`;
    }
  }
  
  if (role === 'parent') {
    const classContext = rank_in_class ? ` Sınıf sıralaması: ${rank_in_class}.` : '';
    if (level === 'high') {
      return `Öğrenciniz bu sınavda ${total_net.toFixed(2)} net yaparak başarılı bir performans sergiledi.${classContext}`;
    } else if (level === 'medium') {
      return `Öğrenciniz bu sınavda ${total_net.toFixed(2)} net yaptı.${classContext} Genel olarak iyi bir performans.`;
    } else {
      return `Öğrenciniz bu sınavda ${total_net.toFixed(2)} net yaptı.${classContext} Birlikte destekleyebileceğimiz alanlar var.`;
    }
  }
  
  // teacher
  const avgContext = vs_class_avg !== null 
    ? ` (Sınıf ort. farkı: ${vs_class_avg >= 0 ? '+' : ''}${vs_class_avg.toFixed(2)})` 
    : '';
  return `Öğrenci bu sınavda ${total_net.toFixed(2)} net performans göstermiştir.${avgContext}`;
}

// ==================== GÜÇLÜ YÖNLER ====================

function getStrengthsAnalysis(
  role: AIRole,
  strengths: StudentAnalyticsOutput['strengths']
): string {
  if (!strengths || strengths.length === 0) {
    return role === 'student' 
      ? 'Güçlü yönlerini belirlemek için daha fazla veriye ihtiyacımız var.'
      : 'Güçlü yönlerin belirlenmesi için ek veri gereklidir.';
  }
  
  const strengthsList = strengths.slice(0, 3).map(s => 
    typeof s === 'string' ? s : s.topic || ''
  ).filter(Boolean);
  
  if (role === 'student') {
    return `Güçlü olduğun konular: ${strengthsList.join(', ')}. Bunları korumaya devam et!`;
  }
  
  if (role === 'parent') {
    return `Öğrencinizin güçlü olduğu alanlar: ${strengthsList.join(', ')}.`;
  }
  
  return `Güçlü alanlar: ${strengthsList.join(', ')}.`;
}

// ==================== GELİŞİM ALANLARI ====================

function getAreasForImprovement(
  role: AIRole,
  weaknesses: StudentAnalyticsOutput['weaknesses']
): string {
  if (!weaknesses || weaknesses.length === 0) {
    return role === 'student'
      ? 'Gelişim alanlarını belirlemek için analiz devam ediyor.'
      : 'Belirgin gelişim alanı tespit edilmedi.';
  }
  
  const weaknessList = weaknesses.slice(0, 3).map(w =>
    typeof w === 'string' ? w : w.topic || ''
  ).filter(Boolean);
  
  if (role === 'student') {
    return `Üzerinde çalışabileceğin konular: ${weaknessList.join(', ')}. Bu konulara biraz daha zaman ayırabilirsin.`;
  }
  
  if (role === 'parent') {
    return `Destek olabileceğiniz alanlar: ${weaknessList.join(', ')}. Bu konularda ek çalışma faydalı olabilir.`;
  }
  
  return `Müdahale gerektiren alanlar: ${weaknessList.join(', ')}.`;
}

// ==================== TREND ANALİZİ ====================

function getTrendAnalysis(
  role: AIRole,
  trends: StudentAnalyticsOutput['trends']
): string | null {
  if (!trends.net_trend || trends.net_trend.length < 2) {
    return null;
  }
  
  const direction = trends.direction;
  
  if (role === 'student') {
    if (direction === 'up') {
      return 'Son sınavlarına bakıldığında performansın yükseliyor! Bu tempoyu koru.';
    } else if (direction === 'down') {
      return 'Son sınavlarda biraz düşüş var. Endişelenme, birlikte üstesinden geleceğiz.';
    }
    return 'Son sınavlarda performansın stabil seyrediyor.';
  }
  
  if (role === 'parent') {
    if (direction === 'up') {
      return 'Son sınavlarda yükseliş trendi görülmektedir. Mevcut çalışma düzenini desteklemeye devam edin.';
    } else if (direction === 'down') {
      return 'Son sınavlarda bir miktar düşüş yaşanmıştır. Öğretmenle görüşmenizi öneriyoruz.';
    }
    return 'Son sınavlarda performans stabil seyretmektedir.';
  }
  
  // teacher
  const velocity = trends.velocity !== undefined ? ` (Velocity: ${trends.velocity.toFixed(2)} net/sınav)` : '';
  if (direction === 'up') {
    return `Pozitif trend gözlemlenmektedir.${velocity}`;
  } else if (direction === 'down') {
    return `Negatif trend gözlemlenmektedir.${velocity} Müdahale önerilir.`;
  }
  return `Stabil performans.${velocity}`;
}

// ==================== RİSK ANALİZİ ====================

function getRiskAnalysis(
  role: AIRole,
  risk: StudentAnalyticsOutput['risk']
): string | null {
  if (!risk.level || risk.level === 'low') {
    return null;
  }
  
  const primaryConcern = risk.primary_concern ? ` Ana odak: ${risk.primary_concern}.` : '';
  
  if (role === 'student') {
    if (risk.level === 'critical') {
      return `Bazı konulara ekstra dikkat etmen gerekiyor.${primaryConcern} Ama endişelenme, birlikte çözeceğiz!`;
    }
    return `Dikkat etmen gereken alanlar var.${primaryConcern}`;
  }
  
  if (role === 'parent') {
    if (risk.level === 'critical' || risk.level === 'high') {
      return `Öğrenciniz için bazı dikkat edilmesi gereken alanlar tespit edilmiştir.${primaryConcern} Öğretmenle görüşmenizi tavsiye ederiz.`;
    }
    return `Desteklenebilecek bazı alanlar bulunmaktadır.${primaryConcern}`;
  }
  
  // teacher
  return `Risk seviyesi: ${risk.level.toUpperCase()}.${primaryConcern} ${risk.action_required ? 'Aksiyon gereklidir.' : ''}`;
}

// ==================== SOMUT ÖNERİLER ====================

function getActionableAdvice(
  role: AIRole,
  analytics: StudentAnalyticsOutput
): ActionableAdvice[] {
  const advice: ActionableAdvice[] = [];
  const { weaknesses, study_recommendations, risk } = analytics;
  
  // Çalışma önerilerinden
  if (study_recommendations && study_recommendations.length > 0) {
    study_recommendations.slice(0, 2).forEach((rec, i) => {
      advice.push({
        title: `Öneri ${i + 1}`,
        description: rec,
        priority: i + 1,
        category: 'study'
      });
    });
  }
  
  // Zayıf yönlerden
  if (weaknesses && weaknesses.length > 0 && advice.length < 3) {
    const weakness = weaknesses[0];
    const topic = typeof weakness === 'string' ? weakness : weakness.topic || '';
    if (topic) {
      advice.push({
        title: 'Konu Çalışması',
        description: `${topic} konusuna ek çalışma yapılması önerilir.`,
        priority: advice.length + 1,
        category: 'review'
      });
    }
  }
  
  // Risk durumuna göre
  if (risk.level === 'high' || risk.level === 'critical') {
    advice.push({
      title: 'Takip',
      description: role === 'teacher' 
        ? 'Öğrenci ile birebir görüşme yapılması önerilir.'
        : 'Öğretmenle görüşme yapılması faydalı olabilir.',
      priority: 1,
      category: 'focus'
    });
  }
  
  // Minimum 2 öneri
  if (advice.length === 0) {
    advice.push(
      {
        title: 'Düzenli Çalışma',
        description: 'Her gün düzenli çalışma alışkanlığı edinmek önemlidir.',
        priority: 1,
        category: 'study'
      },
      {
        title: 'Konu Tekrarı',
        description: 'Anlaşılmayan konuları tekrar etmek faydalı olacaktır.',
        priority: 2,
        category: 'review'
      }
    );
  }
  
  return advice;
}

// ==================== MOTİVASYONEL KAPANIŞ ====================

function getMotivationalClosing(role: AIRole, percentile: number | null): string {
  if (role === 'student') {
    if (percentile !== null && percentile >= 80) {
      return 'Harika gidiyorsun! Bu başarını sürdür. 🌟';
    } else if (percentile !== null && percentile >= 50) {
      return 'İyi bir yoldasın! Biraz daha çabayla hedeflerine ulaşacaksın. 💪';
    }
    return 'Her sınav bir öğrenme fırsatı. Birlikte başaracağız! 🚀';
  }
  
  if (role === 'parent') {
    return 'Öğrencinizin yanında olmanız en büyük destek. Birlikte başaracaksınız.';
  }
  
  return 'Detaylı analiz ve öneriler için sistem raporlarını inceleyebilirsiniz.';
}

// ==================== EK BİLGİLER ====================

function getAdditionalInsights(
  role: AIRole,
  analytics: StudentAnalyticsOutput
): string | undefined {
  if (role === 'teacher') {
    const { calculation_metadata } = analytics;
    return `Veri kalitesi: %${((calculation_metadata?.data_completeness ?? 0) * 100).toFixed(0)}. Güven skoru: %${((calculation_metadata?.confidence_score ?? 0) * 100).toFixed(0)}.`;
  }
  
  return undefined;
}

// ==================== MESAJ FORMATLAMA ====================

function formatAsMessage(role: AIRole, structured: StructuredCoachOutput): string {
  let message = '';
  
  message += `### ${structured.greeting}\n\n`;
  message += `${structured.performanceSummary}\n\n`;
  message += `**Güçlü Yönler:** ${structured.strengthsAnalysis}\n\n`;
  message += `**Gelişim Alanları:** ${structured.areasForImprovement}\n\n`;
  
  if (structured.trendAnalysis) {
    message += `**Trend:** ${structured.trendAnalysis}\n\n`;
  }
  
  if (structured.riskAnalysis) {
    message += `**Dikkat:** ${structured.riskAnalysis}\n\n`;
  }
  
  message += `**Öneriler:**\n`;
  for (const advice of structured.actionableAdvice) {
    message += `- ${advice.description}\n`;
  }
  
  message += `\n${structured.motivationalClosing}`;
  
  if (structured.additionalInsights) {
    message += `\n\n_${structured.additionalInsights}_`;
  }
  
  return message;
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function getPerformanceLevel(percentile: number | null): 'high' | 'medium' | 'low' {
  if (percentile === null) return 'medium';
  if (percentile >= 70) return 'high';
  if (percentile >= 40) return 'medium';
  return 'low';
}

function calculateDataQuality(analytics: StudentAnalyticsOutput): 'high' | 'medium' | 'low' {
  const completeness = analytics.calculation_metadata?.data_completeness ?? 0;
  if (completeness >= 0.8) return 'high';
  if (completeness >= 0.5) return 'medium';
  return 'low';
}

function getMinimalFallbackMessage(role: AIRole): string {
  const messages: Record<AIRole, string> = {
    student: 'Sınav sonuçların incelendi. Detaylı analiz için tekrar dene.',
    parent: 'Öğrencinizin sonuçları değerlendirildi. Detaylar için lütfen tekrar deneyin.',
    teacher: 'Analiz tamamlandı. Detaylı rapor için sistemi tekrar kullanın.'
  };
  return messages[role];
}

function getEmptyStructuredOutput(): StructuredCoachOutput {
  return {
    greeting: 'Merhaba,',
    performanceSummary: 'Veriler yükleniyor...',
    strengthsAnalysis: 'Analiz devam ediyor.',
    areasForImprovement: 'Analiz devam ediyor.',
    trendAnalysis: null,
    riskAnalysis: null,
    actionableAdvice: [],
    motivationalClosing: 'Daha sonra tekrar deneyin.'
  };
}

// ==================== EXPORT ====================

export default {
  generateFallbackResponse
};

