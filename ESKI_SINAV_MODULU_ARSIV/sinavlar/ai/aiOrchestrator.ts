/**
 * ============================================
 * AkademiHub - AI Coach Orchestrator
 * ============================================
 * 
 * PHASE 5.1.1 - Cache-Aware AI Orchestrator
 * 
 * BU DOSYA:
 * - Tek giriş noktası (Single Entry Point)
 * - Cache-aware: Önce cache kontrol eder
 * - Race-safe: Aynı key için tek AI çağrısı
 * - Fail-safe: API hatası durumunda fallback
 * - HESAPLAMA YAPMAZ
 * 
 * FLOW:
 * 1. buildContext
 * 2. generateAnalyticsHash
 * 3. check inFlightGuard
 * 4. snapshotReader
 * 5. IF snapshot READY → RETURN
 * 6. IF snapshot COMPUTING → WAIT / RETURN LAST
 * 7. SET status = computing
 * 8. AI call OR fallback
 * 9. snapshotWriter (UPSERT)
 * 10. SET status = ready
 * 11. RETURN
 */

import type {
  AICoachInput,
  AICoachOutput,
  AICoachOptions,
  AIRole,
  StreamChunk,
  StreamCallback,
  AIError,
  AIErrorType,
  StructuredCoachOutput
} from './types';
import { DEFAULT_AI_OPTIONS } from './types';
import { buildLLMContext, buildTemplateVariables } from './contextBuilder';
import { generateFallbackResponse } from './fallbackCoach';
import { getSystemPrompt, validateOutput } from './prompts/systemRules';
import { getStudentAdditions } from './prompts/templates.student';
import { getParentAdditions } from './prompts/templates.parent';
import { getTeacherAdditions } from './prompts/templates.teacher';

// Cache imports
import {
  generateAnalyticsHash,
  readSnapshot,
  writeSnapshot,
  markAsComputing,
  markAsFailed,
  acquireLock,
  releaseLock,
  waitForLock,
  DEFAULT_CACHE_CONFIG
} from './cache';
import type { SnapshotKey, TriggerReason } from './cache';

// ==================== CACHE CONFIG ====================

/**
 * Cache bypass seçenekleri
 */
interface CacheOptions {
  /** Cache'i atla, her zaman AI çağır */
  bypassCache?: boolean;
  /** Tetikleyici sebep */
  triggerReason?: TriggerReason;
  /** Stale snapshot kabul et */
  acceptStale?: boolean;
  /** Computing bekle (ms) */
  waitForComputing?: number;
}

// ==================== ANA FONKSİYON (CACHE-AWARE) ====================

/**
 * AI Coach ana fonksiyonu (Cache-Aware)
 * 
 * 1. Önce cache kontrol eder
 * 2. Cache hit → Hemen döndür
 * 3. Cache miss → AI çağır, cache'e kaydet
 * 4. Race condition koruması aktif
 * 
 * @param input - AI Coach girdi
 * @param cacheOptions - Cache seçenekleri
 * @returns AI Coach çıktı
 */
export async function generateAICoachResponse(
  input: AICoachInput,
  cacheOptions?: CacheOptions
): Promise<AICoachOutput> {
  const startTime = Date.now();
  const options = mergeOptions(input.options);
  
  try {
    // Input validasyonu
    const validationError = validateInput(input);
    if (validationError) {
      throw createAIError('INVALID_INPUT', validationError);
    }
    
    // Snapshot key oluştur
    const snapshotKey: SnapshotKey = {
      examId: input.analytics.exam_id,
      studentId: input.analytics.student_id,
      role: input.role
    };
    
    // Analytics hash oluştur
    const hashResult = generateAnalyticsHash(input.analytics);
    const currentHash = hashResult.hash;
    
    // Cache bypass kontrolü
    if (!cacheOptions?.bypassCache) {
      // 1. Cache oku
      const cacheResult = await readSnapshot(snapshotKey, currentHash);
      
      if (cacheResult.status === 'hit' && cacheResult.snapshot) {
        // CACHE HIT - Hemen döndür
        console.log(`[AICoach] Cache HIT for ${snapshotKey.studentId}:${snapshotKey.role}`);
        
        return {
          success: true,
          message: cacheResult.snapshot.message || '',
          structured: cacheResult.snapshot.content as StructuredCoachOutput,
          metadata: {
            role: input.role,
            model: cacheResult.snapshot.model,
            durationMs: Date.now() - startTime,
            generatedAt: cacheResult.snapshot.created_at,
            usedFallback: cacheResult.snapshot.source === 'fallback',
            version: '5.1.1',
            dataQuality: mapConfidenceToQuality(cacheResult.snapshot.confidence_score)
          },
          cached: true,
          cacheStatus: 'hit'
        };
      }
      
      if (cacheResult.status === 'computing') {
        // Başka process çalışıyor
        console.log(`[AICoach] Computing in progress for ${snapshotKey.studentId}:${snapshotKey.role}`);
        
        const waitTime = cacheOptions?.waitForComputing ?? 5000;
        if (waitTime > 0) {
          // Bekle
          const released = await waitForLock(snapshotKey, waitTime);
          if (released) {
            // Tekrar dene
            const retryResult = await readSnapshot(snapshotKey, currentHash);
            if (retryResult.status === 'hit' && retryResult.snapshot) {
              return {
                success: true,
                message: retryResult.snapshot.message || '',
                structured: retryResult.snapshot.content as StructuredCoachOutput,
                metadata: {
                  role: input.role,
                  model: retryResult.snapshot.model,
                  durationMs: Date.now() - startTime,
                  generatedAt: retryResult.snapshot.created_at,
                  usedFallback: retryResult.snapshot.source === 'fallback',
                  version: '5.1.1',
                  dataQuality: mapConfidenceToQuality(retryResult.snapshot.confidence_score)
                },
                cached: true,
                cacheStatus: 'hit'
              };
            }
          }
        }
        
        // Stale kabul et
        if (cacheOptions?.acceptStale && cacheResult.snapshot) {
          return {
            success: true,
            message: cacheResult.snapshot.message || '',
            structured: cacheResult.snapshot.content as StructuredCoachOutput,
            metadata: {
              role: input.role,
              model: cacheResult.snapshot.model,
              durationMs: Date.now() - startTime,
              generatedAt: cacheResult.snapshot.created_at,
              usedFallback: cacheResult.snapshot.source === 'fallback',
              version: '5.1.1',
              dataQuality: mapConfidenceToQuality(cacheResult.snapshot.confidence_score)
            },
            cached: true,
            cacheStatus: 'stale'
          };
        }
      }
      
      if (cacheResult.status === 'stale' && cacheOptions?.acceptStale && cacheResult.snapshot) {
        // Stale ama kabul edilebilir
        console.log(`[AICoach] Using stale snapshot for ${snapshotKey.studentId}:${snapshotKey.role}`);
        
        // Arka planda yenile (async)
        refreshSnapshotAsync(input, snapshotKey, currentHash).catch(err => {
          console.error('[AICoach] Async refresh error:', err);
        });
        
        return {
          success: true,
          message: cacheResult.snapshot.message || '',
          structured: cacheResult.snapshot.content as StructuredCoachOutput,
          metadata: {
            role: input.role,
            model: cacheResult.snapshot.model,
            durationMs: Date.now() - startTime,
            generatedAt: cacheResult.snapshot.created_at,
            usedFallback: cacheResult.snapshot.source === 'fallback',
            version: '5.1.1',
            dataQuality: mapConfidenceToQuality(cacheResult.snapshot.confidence_score)
          },
          cached: true,
          cacheStatus: 'stale'
        };
      }
    }
    
    // 2. CACHE MISS - AI çağrısı gerekli
    console.log(`[AICoach] Cache MISS for ${snapshotKey.studentId}:${snapshotKey.role}`);
    
    // Race lock al
    const lockResult = acquireLock(snapshotKey);
    if (!lockResult.acquired) {
      console.log(`[AICoach] Lock not acquired: ${lockResult.reason}`);
      
      // Fallback döndür
      if (options.useFallback) {
        const fallback = generateFallbackResponse(input);
        // Fallback'i cache'e KAYDETME (lock yok)
        return {
          ...fallback,
          cached: false,
          cacheStatus: 'miss'
        };
      }
      
      throw createAIError('RATE_LIMIT', 'AI generation in progress, please retry');
    }
    
    try {
      // DB'de computing olarak işaretle
      await markAsComputing(snapshotKey);
      
      // Context oluştur
      const context = buildLLMContext(input);
      
      // Prompt hazırla
      const prompt = buildPrompt(input, context.markdown);
      
      // LLM çağrısı
      let llmResponse: string;
      let usedFallback = false;
      let source: 'ai' | 'fallback' = 'ai';
      
      try {
        llmResponse = await callLLM(prompt, options);
        
        // Çıktı doğrulama
        const validation = validateOutput(llmResponse);
        if (!validation.valid) {
          console.warn('[AICoach] Output validation warnings:', validation.violations);
        }
      } catch (llmError) {
        console.error('[AICoach] LLM error, using fallback:', llmError);
        
        if (!options.useFallback) {
          throw llmError;
        }
        
        // Fallback kullan
        const fallbackResult = generateFallbackResponse(input);
        llmResponse = fallbackResult.message;
        usedFallback = true;
        source = 'fallback';
      }
      
      // Yapılandırılmış çıktı oluştur
      const structured = parseStructuredResponse(llmResponse, input.role);
      const dataQuality = calculateDataQuality(input.analytics);
      const confidenceScore = mapQualityToConfidence(dataQuality);
      
      // Sonuç objesi
      const result: AICoachOutput = {
        success: true,
        message: llmResponse,
        structured,
        metadata: {
          role: input.role,
          model: options.model,
          durationMs: Date.now() - startTime,
          generatedAt: new Date().toISOString(),
          usedFallback,
          version: '5.1.1',
          dataQuality
        },
        dataQuality: confidenceScore,
        model: options.model,
        generationDurationMs: Date.now() - startTime,
        cached: false,
        cacheStatus: 'miss'
      };
      
      // Cache'e kaydet
      const writeResult = await writeSnapshot({
        key: snapshotKey,
        analyticsHash: currentHash,
        output: result,
        source,
        triggerReason: cacheOptions?.triggerReason || 'initial'
      });
      
      if (!writeResult.success) {
        console.error('[AICoach] Cache write failed:', writeResult.error);
      }
      
      return result;
      
    } finally {
      // Lock'u serbest bırak
      releaseLock(snapshotKey);
    }
    
  } catch (error) {
    console.error('[AICoach] Error:', error);
    
    // Fallback kullan
    if (options.useFallback) {
      console.log('[AICoach] Using fallback response');
      const fallback = generateFallbackResponse(input);
      return {
        ...fallback,
        cached: false,
        cacheStatus: 'error'
      };
    }
    
    // Hata döndür
    return {
      success: false,
      message: '',
      structured: getEmptyStructuredOutput(),
      metadata: {
        role: input.role,
        model: options.model,
        durationMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
        usedFallback: false,
        version: '5.1.1',
        dataQuality: 'low'
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      cacheStatus: 'error'
    };
  }
}

// ==================== ASYNC REFRESH ====================

/**
 * Stale snapshot'u arka planda yeniler
 */
async function refreshSnapshotAsync(
  input: AICoachInput,
  key: SnapshotKey,
  currentHash: string
): Promise<void> {
  try {
    // Lock al
    const lockResult = acquireLock(key);
    if (!lockResult.acquired) {
      console.log('[AICoach] Async refresh: Lock not acquired');
      return;
    }
    
    try {
      await markAsComputing(key);
      
      const context = buildLLMContext(input);
      const prompt = buildPrompt(input, context.markdown);
      const options = mergeOptions(input.options);
      
      let llmResponse: string;
      let source: 'ai' | 'fallback' = 'ai';
      
      try {
        llmResponse = await callLLM(prompt, options);
      } catch {
        const fallback = generateFallbackResponse(input);
        llmResponse = fallback.message;
        source = 'fallback';
      }
      
      const structured = parseStructuredResponse(llmResponse, input.role);
      const dataQuality = calculateDataQuality(input.analytics);
      
      const result: AICoachOutput = {
        success: true,
        message: llmResponse,
        structured,
        metadata: {
          role: input.role,
          model: options.model,
          durationMs: 0,
          generatedAt: new Date().toISOString(),
          usedFallback: source === 'fallback',
          version: '5.1.1',
          dataQuality
        },
        dataQuality: mapQualityToConfidence(dataQuality),
        model: options.model
      };
      
      await writeSnapshot({
        key,
        analyticsHash: currentHash,
        output: result,
        source,
        triggerReason: 'ttl_refresh'
      });
      
      console.log(`[AICoach] Async refresh completed for ${key.studentId}:${key.role}`);
      
    } finally {
      releaseLock(key);
    }
  } catch (error) {
    console.error('[AICoach] Async refresh error:', error);
    await markAsFailed(key, error instanceof Error ? error.message : 'Unknown');
  }
}

// ==================== STREAMING FONKSİYON ====================

/**
 * Streaming AI Coach yanıtı
 * 
 * NOT: Streaming cache'lenmez, sadece final sonuç cache'lenir
 */
export async function generateAICoachResponseStreaming(
  input: AICoachInput,
  onChunk: StreamCallback
): Promise<AICoachOutput> {
  const startTime = Date.now();
  const options = mergeOptions({ ...input.options, streaming: true });
  
  // Snapshot key
  const snapshotKey: SnapshotKey = {
    examId: input.analytics.exam_id,
    studentId: input.analytics.student_id,
    role: input.role
  };
  
  // Hash
  const hashResult = generateAnalyticsHash(input.analytics);
  const currentHash = hashResult.hash;
  
  // Önce cache kontrol et
  const cacheResult = await readSnapshot(snapshotKey, currentHash);
  if (cacheResult.status === 'hit' && cacheResult.snapshot) {
    // Cache hit - chunk olarak gönder
    const message = cacheResult.snapshot.message || '';
    const chunks = message.split(/(?<=\. )/);
    
    for (let i = 0; i < chunks.length; i++) {
      onChunk({ content: chunks[i], type: 'text', index: i });
      await new Promise(resolve => setTimeout(resolve, 50)); // Simüle delay
    }
    
    onChunk({ content: '', type: 'done', index: chunks.length });
    
    return {
      success: true,
      message,
      structured: cacheResult.snapshot.content as StructuredCoachOutput,
      metadata: {
        role: input.role,
        model: cacheResult.snapshot.model,
        durationMs: Date.now() - startTime,
        generatedAt: cacheResult.snapshot.created_at,
        usedFallback: cacheResult.snapshot.source === 'fallback',
        version: '5.1.1',
        dataQuality: mapConfidenceToQuality(cacheResult.snapshot.confidence_score)
      },
      cached: true,
      cacheStatus: 'hit'
    };
  }
  
  try {
    const validationError = validateInput(input);
    if (validationError) {
      throw createAIError('INVALID_INPUT', validationError);
    }
    
    // Lock al
    const lockResult = acquireLock(snapshotKey);
    if (!lockResult.acquired) {
      throw createAIError('RATE_LIMIT', 'AI generation in progress');
    }
    
    try {
      await markAsComputing(snapshotKey);
      
      const context = buildLLMContext(input);
      const prompt = buildPrompt(input, context.markdown);
      
      // Streaming LLM çağrısı
      let fullResponse = '';
      let chunkIndex = 0;
      
      await callLLMStreaming(prompt, options, (chunk) => {
        fullResponse += chunk;
        onChunk({
          content: chunk,
          type: 'text',
          index: chunkIndex++
        });
      });
      
      // Tamamlandı sinyali
      onChunk({
        content: '',
        type: 'done',
        index: chunkIndex
      });
      
      const structured = parseStructuredResponse(fullResponse, input.role);
      const dataQuality = calculateDataQuality(input.analytics);
      
      const result: AICoachOutput = {
        success: true,
        message: fullResponse,
        structured,
        metadata: {
          role: input.role,
          model: options.model,
          durationMs: Date.now() - startTime,
          generatedAt: new Date().toISOString(),
          usedFallback: false,
          version: '5.1.1',
          dataQuality
        },
        dataQuality: mapQualityToConfidence(dataQuality),
        model: options.model,
        generationDurationMs: Date.now() - startTime,
        cached: false,
        cacheStatus: 'miss'
      };
      
      // Cache'e kaydet
      await writeSnapshot({
        key: snapshotKey,
        analyticsHash: currentHash,
        output: result,
        source: 'ai',
        triggerReason: 'initial'
      });
      
      return result;
      
    } finally {
      releaseLock(snapshotKey);
    }
    
  } catch (error) {
    console.error('[AICoach Streaming] Error:', error);
    
    onChunk({
      content: error instanceof Error ? error.message : 'Error',
      type: 'error',
      index: 0
    });
    
    if (options.useFallback) {
      const fallback = generateFallbackResponse(input);
      
      // Fallback'i cache'e kaydet
      await writeSnapshot({
        key: snapshotKey,
        analyticsHash: currentHash,
        output: fallback,
        source: 'fallback',
        triggerReason: 'initial'
      });
      
      return {
        ...fallback,
        cached: false,
        cacheStatus: 'miss'
      };
    }
    
    return {
      success: false,
      message: '',
      structured: getEmptyStructuredOutput(),
      metadata: {
        role: input.role,
        model: options.model,
        durationMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
        usedFallback: false,
        version: '5.1.1',
        dataQuality: 'low'
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      cacheStatus: 'error'
    };
  }
}

// ==================== PROMPT BUILDER ====================

interface BuiltPrompt {
  system: string;
  user: string;
}

function buildPrompt(input: AICoachInput, contextMarkdown: string): BuiltPrompt {
  const { role, analytics } = input;
  
  // Base system prompt
  let system = getSystemPrompt(role);
  
  // Role-specific additions
  const additions = getRoleAdditions(role, analytics);
  if (additions) {
    system += '\n\n' + additions;
  }
  
  // User prompt (context ile)
  const user = contextMarkdown;
  
  return { system, user };
}

function getRoleAdditions(role: AIRole, analytics: AICoachInput['analytics']): string {
  const percentile = analytics.summary.percentile;
  const trendDirection = analytics.trends.direction;
  const riskLevel = analytics.risk.level;
  const consistency = analytics.analytics?.consistency_score ?? null;
  
  switch (role) {
    case 'student':
      return getStudentAdditions(percentile, trendDirection);
    case 'parent':
      return getParentAdditions(percentile, trendDirection, riskLevel);
    case 'teacher':
      return getTeacherAdditions(percentile, riskLevel, consistency);
    default:
      return '';
  }
}

// ==================== LLM ÇAĞRISI ====================

/**
 * LLM API çağrısı (non-streaming)
 * 
 * NOT: Gerçek implementasyon için OpenAI, Anthropic veya Azure API'si kullanılmalı
 */
async function callLLM(
  prompt: BuiltPrompt,
  options: Required<AICoachOptions>
): Promise<string> {
  // TODO: Gerçek LLM API implementasyonu
  // Şu an için placeholder - gerçek implementasyon için:
  // - OpenAI: openai.chat.completions.create()
  // - Anthropic: anthropic.messages.create()
  // - Azure: azure.chat.completions.create()
  
  // Timeout kontrolü
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);
  
  try {
    // Placeholder: Simüle edilmiş LLM yanıtı
    // Gerçek implementasyonda bu kısım API çağrısı olacak
    
    // Simülasyon için kısa bekleme
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fallback response'u döndür (gerçek API olmadığı için)
    throw new Error('LLM API not configured. Using fallback.');
    
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * LLM API çağrısı (streaming)
 */
async function callLLMStreaming(
  prompt: BuiltPrompt,
  options: Required<AICoachOptions>,
  onChunk: (chunk: string) => void
): Promise<void> {
  // TODO: Gerçek streaming LLM API implementasyonu
  
  // Placeholder: Streaming simülasyonu
  throw new Error('Streaming LLM API not configured. Using fallback.');
}

// ==================== VALİDASYON ====================

function validateInput(input: AICoachInput): string | null {
  if (!input.analytics) {
    return 'Analytics verisi eksik';
  }
  
  if (!input.role) {
    return 'Rol belirtilmedi';
  }
  
  const validRoles: AIRole[] = ['student', 'parent', 'teacher'];
  if (!validRoles.includes(input.role)) {
    return `Geçersiz rol: ${input.role}`;
  }
  
  if (!input.examContext) {
    return 'Sınav bağlamı eksik';
  }
  
  if (!input.examContext.examType) {
    return 'Sınav türü belirtilmedi';
  }
  
  return null;
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function mergeOptions(options?: AICoachOptions): Required<AICoachOptions> {
  return {
    ...DEFAULT_AI_OPTIONS,
    ...options
  };
}

function createAIError(type: AIErrorType, message: string): AIError {
  return {
    type,
    message,
    retryable: type !== 'INVALID_INPUT'
  };
}

function calculateDataQuality(analytics: AICoachInput['analytics']): 'high' | 'medium' | 'low' {
  const completeness = analytics.calculation_metadata?.data_completeness ?? 0;
  if (completeness >= 0.8) return 'high';
  if (completeness >= 0.5) return 'medium';
  return 'low';
}

function mapQualityToConfidence(quality: 'high' | 'medium' | 'low'): number {
  switch (quality) {
    case 'high': return 85;
    case 'medium': return 60;
    case 'low': return 35;
  }
}

function mapConfidenceToQuality(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 70) return 'high';
  if (confidence >= 40) return 'medium';
  return 'low';
}

function parseStructuredResponse(
  response: string,
  role: AIRole
): StructuredCoachOutput {
  // Markdown'dan yapılandırılmış çıktı parse et
  // Basit regex-based parsing
  
  const sections: Record<string, string> = {};
  const sectionPattern = /###\s*([^\n]+)\n([\s\S]*?)(?=###|$)/g;
  let match;
  
  while ((match = sectionPattern.exec(response)) !== null) {
    sections[match[1].trim()] = match[2].trim();
  }
  
  return {
    greeting: extractSection(sections, ['Merhaba', 'Sayın', 'Değerli']) || 'Merhaba!',
    performanceSummary: extractSection(sections, ['Performans', 'Özet', 'Durum']) || response.slice(0, 200),
    strengthsAnalysis: extractSection(sections, ['Güçlü', 'İyi']) || '',
    areasForImprovement: extractSection(sections, ['Gelişim', 'Eksik', 'Dikkat']) || '',
    trendAnalysis: extractSection(sections, ['Trend', 'Gidiş']) || null,
    riskAnalysis: extractSection(sections, ['Risk', 'Uyarı']) || null,
    actionableAdvice: extractAdvice(sections),
    motivationalClosing: extractSection(sections, ['Son', 'Kapanış', 'Sonuç']) || ''
  };
}

function extractSection(sections: Record<string, string>, keywords: string[]): string {
  for (const [key, value] of Object.entries(sections)) {
    for (const keyword of keywords) {
      if (key.toLowerCase().includes(keyword.toLowerCase())) {
        return value;
      }
    }
  }
  return '';
}

function extractAdvice(sections: Record<string, string>): StructuredCoachOutput['actionableAdvice'] {
  const adviceSection = extractSection(sections, ['Öneri', 'Yapılabilecek', 'Tavsiye']);
  
  if (!adviceSection) return [];
  
  const lines = adviceSection.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
  
  return lines.slice(0, 5).map((line, i) => ({
    title: `Öneri ${i + 1}`,
    description: line.replace(/^[-•]\s*/, '').trim(),
    priority: i + 1,
    category: 'study' as const
  }));
}

function getEmptyStructuredOutput(): StructuredCoachOutput {
  return {
    greeting: '',
    performanceSummary: '',
    strengthsAnalysis: '',
    areasForImprovement: '',
    trendAnalysis: null,
    riskAnalysis: null,
    actionableAdvice: [],
    motivationalClosing: ''
  };
}

// ==================== QUICK API ENDPOINTS ====================

/**
 * Öğrenci için hızlı AI Coach
 */
export async function getStudentCoachResponse(
  analytics: AICoachInput['analytics'],
  examContext: AICoachInput['examContext'],
  cacheOptions?: CacheOptions
): Promise<AICoachOutput> {
  return generateAICoachResponse({
    role: 'student',
    analytics,
    examContext,
    language: 'tr'
  }, cacheOptions);
}

/**
 * Veli için hızlı AI Coach
 */
export async function getParentCoachResponse(
  analytics: AICoachInput['analytics'],
  examContext: AICoachInput['examContext'],
  cacheOptions?: CacheOptions
): Promise<AICoachOutput> {
  return generateAICoachResponse({
    role: 'parent',
    analytics,
    examContext,
    language: 'tr'
  }, cacheOptions);
}

/**
 * Öğretmen için hızlı AI Coach
 */
export async function getTeacherCoachResponse(
  analytics: AICoachInput['analytics'],
  examContext: AICoachInput['examContext'],
  cacheOptions?: CacheOptions
): Promise<AICoachOutput> {
  return generateAICoachResponse({
    role: 'teacher',
    analytics,
    examContext,
    language: 'tr'
  }, cacheOptions);
}

// ==================== CACHE MANAGEMENT ====================

/**
 * Belirli bir snapshot'u invalidate eder
 */
export async function invalidateAISnapshot(
  examId: string,
  studentId: string,
  role: AIRole
): Promise<boolean> {
  const { invalidateSnapshot } = await import('./cache/snapshotWriter');
  return invalidateSnapshot({ examId, studentId, role }, 'Manual invalidation');
}

/**
 * Sınav için tüm snapshot'ları siler
 */
export async function clearExamAISnapshots(examId: string): Promise<number> {
  const { deleteSnapshotsForExam } = await import('./cache/snapshotWriter');
  return deleteSnapshotsForExam(examId);
}

/**
 * Öğrenci için tüm snapshot'ları siler
 */
export async function clearStudentAISnapshots(studentId: string): Promise<number> {
  const { deleteSnapshotsForStudent } = await import('./cache/snapshotWriter');
  return deleteSnapshotsForStudent(studentId);
}

// ==================== EXPORT ====================

const AIOrchestrator = {
  generateAICoachResponse,
  generateAICoachResponseStreaming,
  getStudentCoachResponse,
  getParentCoachResponse,
  getTeacherCoachResponse,
  invalidateAISnapshot,
  clearExamAISnapshots,
  clearStudentAISnapshots
};

export default AIOrchestrator;
