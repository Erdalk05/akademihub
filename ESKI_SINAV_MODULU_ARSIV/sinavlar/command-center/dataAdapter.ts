/**
 * ============================================
 * AkademiHub - Command Center Data Adapter
 * ============================================
 * 
 * PHASE 8.5 - Core Intelligence Hub
 * 
 * BU DOSYA:
 * - Snapshot cache'den veri çeker
 * - Intelligence narrative oluşturur
 * - Signal cards hesaplar
 * - AI next step belirler
 * 
 * KURAL:
 * ❌ Hesaplama YAPMA
 * ❌ AI tetikleme YAPMA
 * ✅ Sadece mevcut snapshot'ları oku
 */

import { createClient } from '@/lib/supabase/client';
import type {
  CommandCenterData,
  IntelligenceNarrative,
  SignalCard,
  ActionTile,
  AINextStep,
  RoleConfig,
  ROLE_CONFIGS
} from './types';

// ==================== MAIN ADAPTER ====================

export async function getCommandCenterData(
  organizationId: string,
  userRole: 'admin' | 'teacher' | 'founder' = 'admin',
  userId?: string
): Promise<CommandCenterData> {
  const supabase = createClient();
  
  try {
    // 1. Kurum bilgisi
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();
    
    // 2. Son sınav
    const { data: lastExam } = await supabase
      .from('exams')
      .select('id, name, created_at, status')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // 3. Toplam sınav sayısı
    const { count: examCount } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    // 4. Öğrenci sayısı
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    
    // 5. Son sınav analytics
    let lastExamAnalytics: any[] = [];
    if (lastExam?.id) {
      const { data } = await supabase
        .from('exam_student_analytics')
        .select('student_id, output')
        .eq('exam_id', lastExam.id);
      
      lastExamAnalytics = data || [];
    }
    
    // 6. AI Kurumsal özet
    let aiSummary: any = null;
    if (lastExam?.id) {
      const { data } = await supabase
        .from('exam_student_ai_snapshots')
        .select('content, metadata')
        .eq('exam_id', lastExam.id)
        .eq('role', 'teacher')
        .limit(1)
        .single();
      
      aiSummary = data;
    }
    
    // Intelligence Narrative oluştur
    const narrative = buildNarrative(lastExamAnalytics, aiSummary, studentCount || 0);
    
    // Signal Cards oluştur
    const signalCards = buildSignalCards(
      examCount || 0,
      lastExam,
      lastExamAnalytics,
      studentCount || 0
    );
    
    // Action Tiles
    const actionTiles = buildActionTiles(userRole);
    
    // AI Next Step
    const nextStep = buildNextStep(lastExamAnalytics, aiSummary);
    
    return {
      userRole,
      organization: {
        id: organizationId,
        name: orgData?.name || 'Kurum'
      },
      narrative,
      signalCards,
      actionTiles,
      nextStep,
      lastUpdated: new Date().toISOString(),
      isLoading: false
    };
    
  } catch (error) {
    console.error('[CommandCenter] Data fetch error:', error);
    
    return {
      userRole,
      organization: { id: organizationId, name: '' },
      narrative: {
        message: 'Akademik veriler yükleniyor...',
        mood: 'neutral',
        dataSource: 'system',
        updatedAt: new Date().toISOString()
      },
      signalCards: [],
      actionTiles: buildActionTiles(userRole),
      nextStep: null,
      lastUpdated: new Date().toISOString(),
      isLoading: false
    };
  }
}

// ==================== NARRATIVE BUILDER ====================

function buildNarrative(
  analytics: any[],
  aiSummary: any,
  studentCount: number
): IntelligenceNarrative {
  // AI özeti varsa kullan
  if (aiSummary?.content?.summary) {
    return {
      message: aiSummary.content.summary,
      mood: 'neutral',
      dataSource: 'ai',
      updatedAt: new Date().toISOString()
    };
  }
  
  // Analytics'ten narrative oluştur
  if (analytics.length > 0) {
    const participationRate = Math.round((analytics.length / studentCount) * 100);
    
    // Ortalama başarı
    const scores = analytics
      .map(a => a.output?.overall?.percentage || 0)
      .filter(s => s > 0);
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    
    // En zayıf konu bul
    const subjectScores = new Map<string, number[]>();
    for (const a of analytics) {
      for (const subj of a.output?.subjects || []) {
        if (!subjectScores.has(subj.subject_name)) {
          subjectScores.set(subj.subject_name, []);
        }
        subjectScores.get(subj.subject_name)!.push(subj.percentage || 0);
      }
    }
    
    let weakestSubject = '';
    let weakestScore = 100;
    for (const [name, scores] of subjectScores) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < weakestScore) {
        weakestScore = avg;
        weakestSubject = name;
      }
    }
    
    // Mood belirle
    let mood: IntelligenceNarrative['mood'] = 'neutral';
    if (avgScore >= 70) mood = 'positive';
    else if (avgScore < 50) mood = 'attention';
    
    // Mesaj oluştur
    let message = '';
    if (weakestSubject && weakestScore < 50) {
      message = `${weakestSubject} dersinde akademik odak alanı tespit edildi. Kurum geneli başarı ortalaması %${avgScore}.`;
    } else if (avgScore >= 70) {
      message = `Kurum genelinde akademik performans olumlu seyrediyor. Ortalama başarı %${avgScore}.`;
    } else {
      message = `Son sınav değerlendirmesi tamamlandı. ${analytics.length} öğrenci katıldı, ortalama başarı %${avgScore}.`;
    }
    
    return {
      message,
      detail: participationRate < 90 ? `Katılım oranı: %${participationRate}` : undefined,
      mood,
      dataSource: 'analytics',
      updatedAt: new Date().toISOString()
    };
  }
  
  // Varsayılan
  return {
    message: 'Akademik analiz için sınav verisi yükleyin. İlk adım olarak Excel veya optik form aktarımı yapabilirsiniz.',
    mood: 'neutral',
    dataSource: 'system',
    updatedAt: new Date().toISOString()
  };
}

// ==================== SIGNAL CARDS BUILDER ====================

function buildSignalCards(
  examCount: number,
  lastExam: any,
  analytics: any[],
  studentCount: number
): SignalCard[] {
  const cards: SignalCard[] = [];
  
  // 1. Sınav Durumu
  cards.push({
    id: 'exams',
    title: 'Sınav Durumu',
    icon: '📝',
    primaryValue: examCount,
    valueLabel: 'Toplam Sınav',
    context: lastExam ? `Son: ${lastExam.name}` : 'Henüz sınav yok',
    signal: examCount > 0 ? 'positive' : 'neutral',
    deepLink: '/admin/akademik-analiz/sinavlar',
    deepLinkText: 'Sınavları Görüntüle'
  });
  
  // 2. Kazanım Analizi
  const riskTopics = countRiskTopics(analytics);
  cards.push({
    id: 'achievement',
    title: 'Kazanım Analizi',
    icon: '📊',
    primaryValue: riskTopics.count,
    valueLabel: riskTopics.count > 0 ? 'Odak Alanı' : 'İncelenen Kazanım',
      context: riskTopics.weakest ? `En zayıf: ${riskTopics.weakest}` : '',
    signal: riskTopics.count > 3 ? 'attention' : riskTopics.count > 0 ? 'opportunity' : 'positive',
    deepLink: '/admin/akademik-analiz/kazanim',
    deepLinkText: 'Kazanım Detayları'
  });
  
  // 3. Katılım & Devam
  const participationRate = studentCount > 0 
    ? Math.round((analytics.length / studentCount) * 100) 
    : 0;
  const absentCount = studentCount - analytics.length;
  
  cards.push({
    id: 'participation',
    title: 'Katılım & Devam',
    icon: '👥',
    primaryValue: `${analytics.length}/${studentCount}`,
    valueLabel: 'Sınava Giren',
    context: absentCount > 0 ? `${absentCount} öğrenci katılmadı` : 'Tam katılım',
    signal: participationRate >= 90 ? 'positive' : participationRate >= 70 ? 'neutral' : 'attention',
    deepLink: '/admin/akademik-analiz/katilim',
    deepLinkText: 'Katılım Detayları'
  });
  
  // 4. AI Akademik Uyarı
  const aiInsight = getAIInsight(analytics);
  cards.push({
    id: 'ai_alert',
    title: 'AI Akademik Rehber',
    icon: '🤖',
    primaryValue: aiInsight.actionCount,
    valueLabel: 'Önerilen Aksiyon',
    context: aiInsight.summary || '',
    signal: aiInsight.actionCount > 0 ? 'opportunity' : 'neutral',
    deepLink: '/admin/akademik-analiz/ai-rapor',
    deepLinkText: 'AI Raporları'
  });
  
  return cards;
}

function countRiskTopics(analytics: any[]): { count: number; weakest: string | null } {
  const topicScores = new Map<string, number[]>();
  
  for (const a of analytics) {
    for (const topic of a.output?.topics || []) {
      if (!topicScores.has(topic.topic_name)) {
        topicScores.set(topic.topic_name, []);
      }
      topicScores.get(topic.topic_name)!.push(topic.percentage || 0);
    }
  }
  
  let riskCount = 0;
  let weakest: string | null = null;
  let weakestScore = 100;
  
  for (const [name, scores] of topicScores) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 50) riskCount++;
    if (avg < weakestScore) {
      weakestScore = avg;
      weakest = name;
    }
  }
  
  return { count: riskCount, weakest };
}

function getAIInsight(analytics: any[]): { actionCount: number; summary: string | null } {
  // Basit analiz - gerçek AI verisi snapshot'tan gelecek
  if (analytics.length === 0) {
    return { actionCount: 0, summary: 'Veri bekleniyor' };
  }
  
  const avgScore = analytics
    .map(a => a.output?.overall?.percentage || 0)
    .filter(s => s > 0)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);
  
  if (avgScore < 50) {
    return { actionCount: 2, summary: 'Akademik destek önerisi mevcut' };
  } else if (avgScore < 70) {
    return { actionCount: 1, summary: 'Kazanım pekiştirme öneriliyor' };
  }
  
  return { actionCount: 0, summary: 'Performans olumlu' };
}

// ==================== ACTION TILES BUILDER ====================

function buildActionTiles(userRole: string): ActionTile[] {
  const tiles: ActionTile[] = [
    {
      id: 'exam_management',
      title: 'Sınav Yönetimi',
      description: 'Sınav oluştur, düzenle ve analiz sonuçlarını incele',
      icon: '📝',
      href: '/admin/akademik-analiz/sinavlar',
      colorTheme: 'blue'
    },
    {
      id: 'data_import',
      title: 'Veri Aktarımı',
      description: 'Excel, optik form veya fotoğraf ile sonuç yükle',
      icon: '📷',
      href: '/admin/akademik-analiz/yukle',
      colorTheme: 'emerald',
      badge: 'Yeni'
    },
    {
      id: 'academic_xray',
      title: 'Akademik Röntgen',
      description: 'Sınıf, ders ve konu bazlı karşılaştırmalı analiz',
      icon: '📊',
      href: '/admin/akademik-analiz/rontgen',
      colorTheme: 'purple'
    },
    {
      id: 'ai_coach',
      title: 'AI Koç Merkezi',
      description: 'Öğrenci, veli ve öğretmen için kişiselleştirilmiş AI raporları',
      icon: '🤖',
      href: '/admin/akademik-analiz/ai-koc',
      colorTheme: 'amber'
    }
  ];
  
  // Rol bazlı filtreleme
  if (userRole === 'teacher') {
    return tiles.filter(t => t.id !== 'academic_xray');
  }
  
  return tiles;
}

// ==================== NEXT STEP BUILDER ====================

function buildNextStep(analytics: any[], aiSummary: any): AINextStep | null {
  // AI özeti varsa öneri çıkar
  if (aiSummary?.content?.priorities?.[0]) {
    return {
      id: 'ai-priority-1',
      recommendation: aiSummary.content.priorities[0],
      actionText: 'Önerilen Adıma Git',
      actionLink: '/admin/akademik-analiz/ai-rapor',
      source: 'ai',
      priority: 'high'
    };
  }
  
  // Analytics'ten öneri oluştur
  if (analytics.length === 0) {
    return {
      id: 'first-import',
      recommendation: 'İlk adım olarak sınav sonuçlarını sisteme yükleyin.',
      actionText: 'Veri Yükle',
      actionLink: '/admin/akademik-analiz/yukle',
      source: 'system',
      priority: 'high'
    };
  }
  
  const riskTopics = countRiskTopics(analytics);
  if (riskTopics.count > 0 && riskTopics.weakest) {
    return {
      id: 'risk-topic',
      recommendation: `"${riskTopics.weakest}" konusunda akademik odak öneriliyor.`,
      actionText: 'Kazanım Analizini İncele',
      actionLink: '/admin/akademik-analiz/kazanim',
      source: 'analytics',
      priority: 'medium'
    };
  }
  
  return null;
}

// ==================== EXPORT ====================

export default {
  getCommandCenterData
};

