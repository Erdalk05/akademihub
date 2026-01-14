'use client';

// ============================================================================
// SPECTRA STEP 3 — ANSWER KEY
// ANAYASA v2.0 + EK PROTOKOL v2.1 UYUMLU
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// ============================================================================
// TYPES
// ============================================================================

type BookletType = 'A' | 'B' | 'C' | 'D' | null;
type Answer = 'A' | 'B' | 'C' | 'D' | 'E' | null;

interface Lesson {
  id: string;
  code: string;
  name: string;
  questionCount: number;
  order: number;
}

interface AnswerEntry {
  questionNo: number;
  lessonCode: string;
  lessonName: string;
  correctAnswer: Answer;
  bookletType: BookletType;
}

interface ErrorState {
  message: string;
  statusCode?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ANSWER_OPTIONS: Exclude<Answer, null>[] = ['A', 'B', 'C', 'D', 'E'];
const BOOKLET_UI_OPTIONS = ['SINGLE', 'A', 'B', 'C', 'D'] as const;
type BookletUIValue = (typeof BOOKLET_UI_OPTIONS)[number];

// ============================================================================
// COMPONENT
// ============================================================================

export default function Step3AnswerKeyPage() {
  const router = useRouter();
  const { examId } = useParams<{ examId: string }>();
  const { currentOrganization } = useOrganizationStore();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [bookletType, setBookletType] = useState<BookletType>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  // ============================================================================
  // FETCH LESSONS + EXISTING ANSWER KEY
  // ============================================================================

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const lessonRes = await fetch(`/api/spectra/exams/${examId}/lessons`);
        const lessonData = await lessonRes.json();

        if (!lessonRes.ok) {
          throw new Error(
            lessonData?.error || 'Dersler yüklenemedi'
          );
        }

        const lessonList: Lesson[] = lessonData.lessons;
        setLessons(lessonList);

        const akRes = await fetch(`/api/spectra/exams/${examId}/answer-key`);
        const akData = await akRes.json();

        if (akData?.exists && Array.isArray(akData.answerKey)) {
          const loaded: AnswerEntry[] = akData.answerKey.map((a: any) => {
            const lesson = lessonList.find((l) => l.code === a.lessonCode);
            return {
              questionNo: a.questionNo,
              lessonCode: a.lessonCode,
              lessonName: lesson?.name ?? a.lessonCode,
              correctAnswer: a.correctAnswer,
              bookletType: a.bookletType ?? null,
            };
          });

          setAnswers(loaded);
          setBookletType(loaded[0]?.bookletType ?? null);
        } else {
          initEmptyAnswers(lessonList);
        }
      } catch (e: any) {
        setError({ message: e.message });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [examId]);

  // ============================================================================
  // INIT EMPTY ANSWERS
  // ============================================================================

  const initEmptyAnswers = (lessonList: Lesson[]) => {
    let q = 1;
    const list: AnswerEntry[] = [];

    for (const lesson of lessonList) {
      for (let i = 0; i < lesson.questionCount; i++) {
        list.push({
          questionNo: q++,
          lessonCode: lesson.code,
          lessonName: lesson.name,
          correctAnswer: null,
          bookletType: null,
        });
      }
    }

    setAnswers(list);
  };

  // ============================================================================
  // UPDATE HANDLERS
  // ============================================================================

  const updateAnswer = (questionNo: number, value: Answer) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionNo === questionNo
          ? { ...a, correctAnswer: value, bookletType }
          : a
      )
    );
  };

  const onBookletChange = (value: BookletUIValue) => {
    const bt: BookletType = value === 'SINGLE' ? null : value;
    setBookletType(bt);
    setAnswers((prev) => prev.map((a) => ({ ...a, bookletType: bt })));
  };

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const total = answers.length;
  const filled = answers.filter((a) => a.correctAnswer !== null).length;
  const isComplete = total > 0 && filled === total;

  const grouped = useMemo(() => {
    const map: Record<string, AnswerEntry[]> = {};
    for (const a of answers) {
      if (!map[a.lessonCode]) map[a.lessonCode] = [];
      map[a.lessonCode].push(a);
    }
    return map;
  }, [answers]);

  // ============================================================================
  // SAVE
  // ============================================================================

  const save = async () => {
    if (!isComplete) {
      toast.error('Tüm sorular cevaplanmalıdır');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/spectra/exams/${examId}/answer-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookletType,
          answers: answers.map((a) => ({
            questionNo: a.questionNo,
            lessonCode: a.lessonCode,
            correctAnswer: a.correctAnswer,
            bookletType: a.bookletType,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Kaydedilemedi');
      }

      toast.success('Cevap anahtarı kaydedildi');
      router.push(`/spectra/exams/${examId}/step-4-scoring`);
    } catch (e: any) {
      setError({ message: e.message });
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Step 3 — Cevap Anahtarı</h1>
            <p className="text-sm text-muted-foreground">
              {currentOrganization?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="text-emerald-600" />
          ) : (
            <AlertCircle className="text-amber-500" />
          )}
          <span>{filled}/{total}</span>
        </div>
      </header>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">
            {error.message}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Kitapçık Tipi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={bookletType ?? 'SINGLE'}
            onValueChange={onBookletChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Tek Tip</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardHeader>
            <CardTitle>
              {lesson.name} ({lesson.code})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-5 gap-3">
            {grouped[lesson.code]?.map((a) => (
              <div key={a.questionNo} className="p-2 border rounded">
                <div className="text-xs mb-1">Soru {a.questionNo}</div>
                <div className="flex gap-1">
                  {ANSWER_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateAnswer(a.questionNo, opt)}
                      className={`w-8 h-8 rounded ${
                        a.correctAnswer === opt
                          ? 'bg-emerald-600 text-white'
                          : 'border'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    onClick={() => updateAnswer(a.questionNo, null)}
                    className="w-8 h-8 rounded border text-red-500"
                  >
                    <XCircle className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={save} disabled={!isComplete || isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save />}
          <span className="ml-2">Kaydet ve Devam Et</span>
        </Button>
      </div>
    </div>
  );
}
