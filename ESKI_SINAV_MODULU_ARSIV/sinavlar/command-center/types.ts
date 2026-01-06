/**
 * ============================================
 * AkademiHub - Command Center Types
 * ============================================
 * 
 * PHASE 8.5 - Core Intelligence Hub
 */

// ==================== INTELLIGENCE STRIP ====================

export interface IntelligenceNarrative {
  /** Ana mesaj */
  message: string;
  
  /** Detay mesajı */
  detail?: string;
  
  /** Mood (UI rengi için) */
  mood: 'positive' | 'neutral' | 'attention' | 'opportunity';
  
  /** Kaynak veri */
  dataSource: 'ai' | 'analytics' | 'system';
  
  /** Son güncelleme */
  updatedAt: string;
}

// ==================== SIGNAL CARDS ====================

export interface SignalCard {
  /** Kart ID */
  id: string;
  
  /** Başlık */
  title: string;
  
  /** İkon */
  icon: string;
  
  /** Ana değer */
  primaryValue: string | number;
  
  /** Değer açıklaması */
  valueLabel: string;
  
  /** Bağlam (trend, karşılaştırma) */
  context?: string;
  
  /** Sinyal tipi */
  signal: 'positive' | 'neutral' | 'attention' | 'opportunity';
  
  /** Deep link */
  deepLink: string;
  
  /** Deep link metni */
  deepLinkText: string;
}

// ==================== ACTION TILES ====================

export interface ActionTile {
  /** Tile ID */
  id: string;
  
  /** Başlık */
  title: string;
  
  /** Açıklama (NEDEN) */
  description: string;
  
  /** İkon */
  icon: string;
  
  /** Link */
  href: string;
  
  /** Renk teması */
  colorTheme: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
  
  /** Badge (varsa) */
  badge?: string;
}

// ==================== AI NEXT STEP ====================

export interface AINextStep {
  /** Öneri ID */
  id: string;
  
  /** Öneri metni */
  recommendation: string;
  
  /** Aksiyon butonu metni */
  actionText: string;
  
  /** Aksiyon linki */
  actionLink: string;
  
  /** Öneri kaynağı */
  source: 'ai' | 'system' | 'analytics';
  
  /** Öncelik */
  priority: 'high' | 'medium' | 'low';
}

// ==================== COMMAND CENTER STATE ====================

export interface CommandCenterData {
  /** Kullanıcı rolü */
  userRole: 'admin' | 'teacher' | 'founder';
  
  /** Kurum bilgisi */
  organization: {
    id: string;
    name: string;
  };
  
  /** Intelligence Strip */
  narrative: IntelligenceNarrative;
  
  /** Signal Cards */
  signalCards: SignalCard[];
  
  /** Action Tiles */
  actionTiles: ActionTile[];
  
  /** AI Next Step */
  nextStep: AINextStep | null;
  
  /** Son güncelleme */
  lastUpdated: string;
  
  /** Yükleme durumu */
  isLoading: boolean;
}

// ==================== ROLE CONFIG ====================

export interface RoleConfig {
  /** Görünür signal card'lar */
  visibleSignals: string[];
  
  /** Görünür action tile'lar */
  visibleActions: string[];
  
  /** Kurum geneli mi? */
  isInstitutionalView: boolean;
  
  /** Filtre (sınıf/ders) */
  filters?: {
    classes?: string[];
    subjects?: string[];
  };
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    visibleSignals: ['exams', 'achievement', 'participation', 'ai_alert'],
    visibleActions: ['exam_management', 'data_import', 'academic_xray', 'ai_coach'],
    isInstitutionalView: true
  },
  founder: {
    visibleSignals: ['exams', 'achievement', 'participation', 'ai_alert'],
    visibleActions: ['exam_management', 'data_import', 'academic_xray', 'ai_coach'],
    isInstitutionalView: true
  },
  teacher: {
    visibleSignals: ['exams', 'achievement', 'participation'],
    visibleActions: ['exam_management', 'data_import', 'ai_coach'],
    isInstitutionalView: false
  }
};

