'use client';

// ============================================================================
// SPECTRA STEP 2 — DERS VE SORU YAPISI
// ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { EXAM_CONFIGS, type Lesson } from '@/lib/spectra/exam-configs';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type LessonInput = {
  code: string;
  name: string;
  questionCount: number;
  order: number;
};

type ErrorState = {
  message: string;
  statusCode?: number;
} | null;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Step2LessonsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const { currentOrganization } = useOrganizationStore();

  const [lessons, setLessons] = useState<LessonInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ErrorState>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // LESSON CRUD
  // ─────────────────────────────────────────────────────────────────────────

  const addLesson = () => {
    setLessons((prev) => [
      ...prev,
      {
        code: '',
        name: '',
        questionCount: 0,
        order: prev.length + 1,
      },
    ]);
  };

  const removeLesson = (index: number) => {
    setLessons((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Sıraları yeniden ayarla
      return updated.map((lesson, i) => ({ ...lesson, order: i + 1 }));
    });
  };

  const updateLesson = (
    index: number,
    field: keyof LessonInput,
    value: string | number
  ) => {
    setLessons((prev) =>
      prev.map((lesson, i) =>
        i === index ? { ...lesson, [field]: value } : lesson
      )
    );
  };

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === lessons.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...lessons];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    // Sıraları güncelle
    setLessons(reordered.map((lesson, i) => ({ ...lesson, order: i + 1 })));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  const validateLessons = (): boolean => {
    if (lessons.length === 0) {
      setError({ message: 'En az 1 ders tanımlanmalıdır' });
      return false;
    }

    const totalQuestions = lessons.reduce((sum, l) => sum + l.questionCount, 0);
    if (totalQuestions === 0) {
      setError({ message: 'Toplam soru sayısı 0\'dan büyük olmalıdır' });
      return false;
    }

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      if (!lesson.code.trim()) {
        setError({ message: `Ders ${i + 1}: Ders kodu boş olamaz` });
        return false;
      }
      if (!lesson.name.trim()) {
        setError({ message: `Ders ${i + 1}: Ders adı boş olamaz` });
        return false;
      }
      if (lesson.questionCount <= 0) {
        setError({ message: `Ders ${i + 1}: Soru sayısı 0\'dan büyük olmalıdır` });
        return false;
      }
    }

    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────────

  const saveLessons = async () => {
    setError(null);

    if (!validateLessons()) {
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/spectra/exams/${examId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Hata kodlarına göre mesaj
        const errorMessages: Record<number, string> = {
          400: 'Geçersiz veri formatı',
          401: 'Oturum süreniz dolmuş, lütfen yeniden giriş yapın',
          404: 'Sınav bulunamadı',
          409: 'Bu sınav için dersler zaten tanımlanmış',
        };

        setError({
          message: errorMessages[res.status] || data.error || 'Dersler kaydedilemedi',
          statusCode: res.status,
        });
        toast.error(errorMessages[res.status] || 'Kayıt başarısız');
        return;
      }

      // Başarılı → Step 3'e yönlendir
      toast.success('Dersler başarıyla kaydedildi');
      router.push(`/spectra/exams/${examId}/step-3-answer-key`);
    } catch (err) {
      console.error('Save error:', err);
      setError({ message: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
      toast.error('Bağlantı hatası');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────────────────────────────────

  const totalQuestions = lessons.reduce((sum, l) => sum + l.questionCount, 0);
  const canSave = lessons.length > 0 && totalQuestions > 0 && !isSaving;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">Step 2 — Ders Yapısı</h1>
              <p className="text-sm text-gray-500">
                {currentOrganization?.name || 'Kurum'} • Sınav ID: {examId.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Toplam Ders</p>
            <p className="text-2xl font-bold text-emerald-600">{lessons.length}</p>
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

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle>Dersler ve Soru Dağılımı</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Her ders için kod, ad ve soru sayısını girin. Sıralama yukarı/aşağı okları ile değiştirilebilir.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Henüz ders eklenmedi. Başlamak için "+ Ders Ekle" butonunu kullanın.
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[auto_1fr_1fr_120px_auto_auto] gap-3 items-center p-4 bg-gray-50 rounded-lg border"
                >
                  {/* Order Badge */}
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {lesson.order}
                  </div>

                  {/* Code */}
                  <Input
                    placeholder="Ders Kodu (TUR, MAT...)"
                    value={lesson.code}
                    onChange={(e) => updateLesson(index, 'code', e.target.value.toUpperCase())}
                    maxLength={10}
                  />

                  {/* Name */}
                  <Input
                    placeholder="Ders Adı (Türkçe, Matematik...)"
                    value={lesson.name}
                    onChange={(e) => updateLesson(index, 'name', e.target.value)}
                  />

                  {/* Question Count */}
                  <Input
                    type="number"
                    placeholder="Soru"
                    value={lesson.questionCount || ''}
                    onChange={(e) =>
                      updateLesson(index, 'questionCount', Number(e.target.value) || 0)
                    }
                    min={0}
                    max={200}
                  />

                  {/* Move Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveLesson(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveLesson(index, 'down')}
                      disabled={index === lessons.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLesson(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {lessons.length > 0 && (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Toplam Soru Sayısı</p>
                  <p className="text-3xl font-bold text-emerald-900">{totalQuestions}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-emerald-700">Ders Sayısı</p>
                  <p className="text-2xl font-bold text-emerald-900">{lessons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={addLesson}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Ders Ekle
          </Button>

          <Button
            onClick={saveLessons}
            disabled={!canSave}
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
                Kaydet ve Step 3'e Geç
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
