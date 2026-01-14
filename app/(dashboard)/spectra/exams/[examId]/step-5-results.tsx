'use client';

// ============================================================================
// SPECTRA STEP 5 — RESULTS (Production)
// ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
// ============================================================================
// - Shadcn UI kullanır (Card, Table, Badge, Button, Accordion)
// - exam_results tablosundan okur
// - Öğrenci bazlı sonuç listesi + detay breakdown
// - "Yeniden Hesapla" butonu
// - Hesaplama mantığı YOK, sadece görüntüleme
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface LessonBreakdown {
  lesson_id: string;
  lesson_code?: string;
  lesson_name?: string;
  correct: number;
  wrong: number;
  empty: number;
  cancelled: number;
  net: number;
  weighted_score: number;
}

interface ExamResult {
  id: string;
  student_id?: string;
  participant_name?: string;
  participant_identifier: string;
  booklet_type?: string;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  total_cancelled: number;
  total_net: number;
  total_score: number;
  lesson_breakdown: LessonBreakdown[];
  scoring_snapshot: any;
  calculated_at: string;
}

interface Stats {
  total_participants: number;
  avg_net: number;
  avg_score: number;
  max_net: number;
  min_net: number;
}

interface ErrorState {
  message: string;
  statusCode?: number;
} | null;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Step5ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const { currentOrganization } = useOrganizationStore();

  // State
  const [examName, setExamName] = useState<string>('');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<ErrorState>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH RESULTS
  // ─────────────────────────────────────────────────────────────────────────

  const fetchResults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/spectra/exams/${examId}/results`);
      const data = await res.json();

      if (!res.ok) {
        const errorMessages: Record<number, string> = {
          401: 'Oturum süreniz dolmuş, lütfen yeniden giriş yapın',
          404: 'Sınav bulunamadı',
          500: 'Sunucu hatası',
        };
        setError({
          message: errorMessages[res.status] || data.error || 'Sonuçlar yüklenemedi',
          statusCode: res.status,
        });
        return;
      }

      setExamName(data.exam?.name || 'Sınav');
      setResults(data.results || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError({ message: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [examId]);

  // ─────────────────────────────────────────────────────────────────────────
  // TOGGLE ROW EXPAND
  // ─────────────────────────────────────────────────────────────────────────

  const toggleRow = (resultId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RECALCULATE
  // ─────────────────────────────────────────────────────────────────────────

  const handleRecalculate = async () => {
    setIsRecalculating(true);

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

      toast.success('Puanlar başarıyla yeniden hesaplandı');
      
      // Sonuçları yeniden yükle
      await fetchResults();
    } catch (err) {
      console.error('Calculate error:', err);
      toast.error('Hesaplama sırasında hata oluştu');
    } finally {
      setIsRecalculating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GET AUTH TOKEN
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
          <p className="mt-2 text-gray-600">Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">Step 5 — Sonuçlar</h1>
              <p className="text-sm text-gray-500">
                {currentOrganization?.name || 'Kurum'} • {examName}
              </p>
            </div>
          </div>

          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            variant="outline"
            className="gap-2"
          >
            {isRecalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Hesaplanıyor...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Yeniden Hesapla
              </>
            )}
          </Button>
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

        {/* Stats Cards */}
        {stats && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Katılımcı</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_participants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-500">Ortalama Net</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avg_net.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="text-sm text-gray-500">En Yüksek Net</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.max_net.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calculator className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Ortalama Puan</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avg_score.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Results */}
        {results.length === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <p className="text-amber-800 font-medium">Henüz hesaplama yapılmamış</p>
                <p className="text-amber-700 text-sm mt-1">
                  Step 4'te puanlama config'i kaydedip "Hesapla" butonuna basın.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/spectra/exams/${examId}/step-4-scoring`)}
                  className="mt-4"
                >
                  Step 4'e Git
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Öğrenci Sonuçları</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Katılımcı</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-center">Kitapçık</TableHead>
                    <TableHead className="text-center">Doğru</TableHead>
                    <TableHead className="text-center">Yanlış</TableHead>
                    <TableHead className="text-center">Boş</TableHead>
                    <TableHead className="text-center">Net</TableHead>
                    <TableHead className="text-center">Puan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => {
                    const isExpanded = expandedRows.has(result.id);
                    return (
                      <>
                        <TableRow key={result.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell onClick={() => toggleRow(result.id)}>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {result.participant_name || 'İsimsiz'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {result.participant_identifier}
                          </TableCell>
                          <TableCell className="text-center">
                            {result.booklet_type ? (
                              <Badge variant="outline">{result.booklet_type}</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">
                            {result.total_correct}
                          </TableCell>
                          <TableCell className="text-center text-red-600 font-medium">
                            {result.total_wrong}
                          </TableCell>
                          <TableCell className="text-center text-gray-500">
                            {result.total_empty}
                          </TableCell>
                          <TableCell className="text-center font-bold text-blue-600">
                            {result.total_net.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-bold text-purple-600">
                            {result.total_score.toFixed(2)}
                          </TableCell>
                        </TableRow>

                        {/* Expanded Row - Lesson Breakdown */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-gray-50 p-6">
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Ders Bazlı Detay</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {result.lesson_breakdown.map((lesson, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 bg-white rounded-lg border border-gray-200"
                                    >
                                      <p className="font-medium text-sm mb-2">
                                        {lesson.lesson_name || lesson.lesson_code || `Ders ${idx + 1}`}
                                      </p>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-gray-500">Doğru:</span>{' '}
                                          <span className="text-emerald-600 font-medium">
                                            {lesson.correct}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Yanlış:</span>{' '}
                                          <span className="text-red-600 font-medium">
                                            {lesson.wrong}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Boş:</span>{' '}
                                          <span className="text-gray-600">{lesson.empty}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Net:</span>{' '}
                                          <span className="text-blue-600 font-medium">
                                            {lesson.net.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-gray-500">Ağırlıklı Puan:</span>{' '}
                                          <span className="text-purple-600 font-medium">
                                            {lesson.weighted_score.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
