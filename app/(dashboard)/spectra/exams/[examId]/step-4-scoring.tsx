'use client';

// ============================================================================
// SPECTRA STEP 4 — PUANLAMA KONFIGÜRASYONU
// ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
// ============================================================================
// - Shadcn UI kullanır
// - Preset seçimi: LGS / TYT / AYT / CUSTOM
// - Preset default'ları uygular
// - lesson_weights: ARRAY format (lesson_id + weight)
// - cancelled_question_policy seçilebilir
// - Status modeli: draft | ready
// - "Kaydet (Taslak)" → sadece config kaydet
// - "Kaydet ve Hesapla" → POST /recalculate çağır
// - Success → Step 5'e yönlendir
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Calculator,
  Loader2,
  AlertCircle,
  Settings,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PresetName = 'LGS' | 'TYT' | 'AYT' | 'CUSTOM';
type CancelledPolicy = 'count_as_correct' | 'exclude_from_total';
type Status = 'draft' | 'ready';

interface Lesson {
  id: string;
  code: string;
  name: string;
  questionCount: number;
  order: number;
}

interface LessonWeight {
  lesson_id: string;
  weight: number;
}

interface ScoringConfig {
  scoring_type: 'preset' | 'custom';
  preset_name?: PresetName;
  correct_score: number;
  wrong_penalty: number;
  empty_score: number;
  cancelled_question_policy: CancelledPolicy;
  lesson_weights: LessonWeight[];
  status: Status;
}

type ErrorState = {
  message: string;
  statusCode?: number;
} | null;

// ─────────────────────────────────────────────────────────────────────────────
// PRESET DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const PRESET_DEFAULTS: Record<string, Partial<ScoringConfig>> = {
  LGS: {
    correct_score: 1.0,
    wrong_penalty: 0.33, // yanlış / 3
    empty_score: 0,
    cancelled_question_policy: 'count_as_correct',
  },
  TYT: {
    correct_score: 1.0,
    wrong_penalty: 0.25, // yanlış / 4
    empty_score: 0,
    cancelled_question_policy: 'count_as_correct',
  },
  AYT: {
    correct_score: 1.0,
    wrong_penalty: 0.25, // yanlış / 4
    empty_score: 0,
    cancelled_question_policy: 'count_as_correct',
  },
  CUSTOM: {
    correct_score: 1.0,
    wrong_penalty: 0.25,
    empty_score: 0,
    cancelled_question_policy: 'count_as_correct',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Step4ScoringPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const { currentOrganization } = useOrganizationStore();

  // State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [preset, setPreset] = useState<PresetName>('LGS');
  const [correctScore, setCorrectScore] = useState(1.0);
  const [wrongPenalty, setWrongPenalty] = useState(0.33);
  const [emptyScore, setEmptyScore] = useState(0);
  const [cancelledPolicy, setCancelledPolicy] = useState<CancelledPolicy>('count_as_correct');
  const [lessonWeights, setLessonWeights] = useState<LessonWeight[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<ErrorState>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/spectra/exams/${examId}/scoring`);
        const data = await res.json();

        if (!res.ok) {
          const errorMessages: Record<number, string> = {
            401: 'Oturum süreniz dolmuş, lütfen yeniden giriş yapın',
            404: 'Bu sınav için ders tanımlaması bulunamadı. Önce Step 2\'yi tamamlayın.',
            500: 'Sunucu hatası',
          };
          setError({
            message: errorMessages[res.status] || data.error || 'Veriler yüklenemedi',
            statusCode: res.status,
          });
          return;
        }

        setLessons(data.lessons);

        // Mevcut config varsa yükle
        if (data.exists && data.config) {
          const config = data.config;
          setPreset(
            config.scoring_type === 'preset' 
              ? (config.preset_name as PresetName) 
              : 'CUSTOM'
          );
          setCorrectScore(config.correct_score);
          setWrongPenalty(config.wrong_penalty);
          setEmptyScore(config.empty_score);
          setCancelledPolicy(config.cancelled_question_policy);
          setLessonWeights(config.lesson_weights || []);
        } else {
          // Yeni config → default weights (hepsi 1.0)
          initializeDefaultWeights(data.lessons);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError({ message: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZE DEFAULT WEIGHTS
  // ─────────────────────────────────────────────────────────────────────────

  const initializeDefaultWeights = (lessonList: Lesson[]) => {
    const weights: LessonWeight[] = lessonList.map((lesson) => ({
      lesson_id: lesson.id,
      weight: 1.0,
    }));
    setLessonWeights(weights);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PRESET CHANGE
  // ─────────────────────────────────────────────────────────────────────────

  const handlePresetChange = (newPreset: PresetName) => {
    setPreset(newPreset);

    const defaults = PRESET_DEFAULTS[newPreset];
    if (defaults) {
      setCorrectScore(defaults.correct_score || 1.0);
      setWrongPenalty(defaults.wrong_penalty || 0.25);
      setEmptyScore(defaults.empty_score || 0);
      setCancelledPolicy(defaults.cancelled_question_policy || 'count_as_correct');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LESSON WEIGHT CHANGE
  // ─────────────────────────────────────────────────────────────────────────

  const updateLessonWeight = (lessonId: string, weight: number) => {
    setLessonWeights((prev) =>
      prev.map((lw) =>
        lw.lesson_id === lessonId ? { ...lw, weight } : lw
      )
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE (DRAFT)
  // ─────────────────────────────────────────────────────────────────────────

  const saveDraft = async () => {
    await saveConfig('draft');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE AND CALCULATE
  // ─────────────────────────────────────────────────────────────────────────

  const saveAndCalculate = async () => {
    const saved = await saveConfig('ready');
    if (!saved) return;

    // Recalculate API çağır
    setIsCalculating(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Oturum bulunamadı');
        return;
      }

      const res = await fetch(`/api/spectra/exams/${examId}/recalculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Hesaplama başarısız');
        return;
      }

      toast.success('Puanlar başarıyla hesaplandı');
      router.push(`/spectra/exams/${examId}/step-5-results`);
    } catch (err) {
      console.error('Calculate error:', err);
      toast.error('Hesaplama sırasında hata oluştu');
    } finally {
      setIsCalculating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE CONFIG (HELPER)
  // ─────────────────────────────────────────────────────────────────────────

  const saveConfig = async (status: Status): Promise<boolean> => {
    setError(null);
    setIsSaving(true);

    try {
      const payload: ScoringConfig = {
        scoring_type: preset === 'CUSTOM' ? 'custom' : 'preset',
        preset_name: preset === 'CUSTOM' ? undefined : preset,
        correct_score: correctScore,
        wrong_penalty: wrongPenalty,
        empty_score: emptyScore,
        cancelled_question_policy: cancelledPolicy,
        lesson_weights: lessonWeights,
        status,
      };

      const res = await fetch(`/api/spectra/exams/${examId}/scoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessages: Record<number, string> = {
          400: data.error || 'Geçersiz veri formatı',
          401: 'Oturum süreniz dolmuş, lütfen yeniden giriş yapın',
          404: 'Sınav bulunamadı',
          409: data.error || 'Ders bilgisi eksik',
        };

        setError({
          message: errorMessages[res.status] || data.error || 'Config kaydedilemedi',
          statusCode: res.status,
        });
        toast.error(errorMessages[res.status] || 'Kayıt başarısız');
        return false;
      }

      toast.success('Puanlama config kaydedildi');
      return true;
    } catch (err) {
      console.error('Save error:', err);
      setError({ message: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
      toast.error('Bağlantı hatası');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GET AUTH TOKEN (for recalculate)
  // ─────────────────────────────────────────────────────────────────────────

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (err) {
      console.error('Token fetch error:', err);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="mt-2 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Step 4 — Puanlama Konfigürasyonu</h1>
              <p className="text-sm text-gray-500">
                {currentOrganization?.name || 'Kurum'} • Sınav ID: {examId.slice(0, 8)}
              </p>
            </div>
          </div>

          {/* Lesson Count Badge */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-600">{lessons.length} Ders</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">{error.message}</p>
                  {error.statusCode && (
                    <p className="text-red-600 text-sm mt-1">Hata Kodu: {error.statusCode}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preset Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Sınav Tipi (Preset)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preset Seçimi</Label>
              <Select value={preset} onValueChange={(v) => handlePresetChange(v as PresetName)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Preset seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LGS">LGS (Yanlış / 3)</SelectItem>
                  <SelectItem value="TYT">TYT (Yanlış / 4)</SelectItem>
                  <SelectItem value="AYT">AYT (Yanlış / 4)</SelectItem>
                  <SelectItem value="CUSTOM">Özel Puanlama</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Doğru Puan</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={correctScore}
                  onChange={(e) => setCorrectScore(Number(e.target.value))}
                  disabled={preset !== 'CUSTOM'}
                />
              </div>

              <div>
                <Label>Yanlış Ceza</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={wrongPenalty}
                  onChange={(e) => setWrongPenalty(Number(e.target.value))}
                  disabled={preset !== 'CUSTOM'}
                />
              </div>

              <div>
                <Label>Boş Puan</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={emptyScore}
                  onChange={(e) => setEmptyScore(Number(e.target.value))}
                  disabled={preset !== 'CUSTOM'}
                />
              </div>
            </div>

            <div>
              <Label>İptal Soru Politikası</Label>
              <Select
                value={cancelledPolicy}
                onValueChange={(v) => setCancelledPolicy(v as CancelledPolicy)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count_as_correct">Herkese Doğru Say</SelectItem>
                  <SelectItem value="exclude_from_total">Toplam Sorudan Çıkar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Weights */}
        <Card>
          <CardHeader>
            <CardTitle>Ders Ağırlıkları</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Her ders için ağırlık katsayısı belirleyin. Varsayılan: 1.0
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => {
                const weight = lessonWeights.find((lw) => lw.lesson_id === lesson.id)?.weight || 1.0;
                return (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{lesson.name}</p>
                      <p className="text-xs text-gray-500">
                        {lesson.code} • {lesson.questionCount} soru
                      </p>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => updateLessonWeight(lesson.id, Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">Puanlama Hazır</p>
                <p className="text-blue-700 text-sm mt-1">
                  Config'i taslak olarak kaydedebilir veya doğrudan hesaplama başlatabilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={isSaving || isCalculating}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Kaydet (Taslak)
              </>
            )}
          </Button>

          <Button
            onClick={saveAndCalculate}
            disabled={isSaving || isCalculating}
            size="lg"
            className="gap-2"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Hesaplanıyor...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                Kaydet ve Hesapla
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
