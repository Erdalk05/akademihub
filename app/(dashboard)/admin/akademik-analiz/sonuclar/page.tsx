'use client';

/**
 * AkademiHub - Sınav Sonuçları Listesi
 * Enterprise-grade • Gerçek Veri • MEB Uyumlu
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  BarChart3, FileText, Trash2, Filter, Search, Calendar, Users,
  TrendingUp, Brain, Target, AlertCircle, Loader2, CheckCircle2,
  XCircle, Award, RefreshCw, Download, Plus, Activity, Eye
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

const normalizeExamType = (examType: any): string =>
  typeof examType === 'string'
    ? examType
    : typeof examType?.name === 'string'
    ? examType.name
    : 'LGS';

interface ExamData {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  created_at: string;
  total_students: number;
  average_net: number;
  status: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SonuclarPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  
  // State
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'students'>('date');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // ========================================================================
  // DATA FETCHING - ONLY REAL API DATA
  // ========================================================================

  const fetchExams = async (showLoading = true) => {
    if (!currentOrganization?.id) return;
    
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/akademik-analiz/exams?organizationId=${currentOrganization.id}`);
      if (!response.ok) throw new Error('Veriler alınamadı');
      
      const data = await response.json();
      const rawExams = Array.isArray(data.exams) ? data.exams : Array.isArray(data) ? data : [];
      setExams(rawExams);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
      toast({
        title: "Hata",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [currentOrganization?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
      fetchExams(false);
  };

  // ========================================================================
  // DELETE EXAM
  // ========================================================================

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/akademik-analiz/exams/${examToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Silme işlemi başarısız');
      
      toast({
        title: "Başarılı",
        description: "Sınav silindi",
      });
      
      setExams(exams.filter(exam => exam.id !== examToDelete));
      setDeleteModalOpen(false);
      setExamToDelete(null);
    } catch (error) {
      toast({
        title: "Hata", 
        description: "Silme sırasında hata oluştu",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ========================================================================
  // FILTERING & SORTING
  // ========================================================================

  const processedExams = useMemo(() => {
    const safeExams = Array.isArray(exams) ? exams : [];

    let filtered = safeExams.filter((exam: any) => {
      const nameSafe = typeof exam.name === 'string' ? exam.name : '';
      const searchSafe = typeof searchTerm === 'string' ? searchTerm : '';
      const matchesSearch = nameSafe.toLowerCase().includes(searchSafe.toLowerCase());
      const safeExamType = normalizeExamType(exam.exam_type);
      const matchesType = filterType === 'all' || safeExamType === filterType;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.exam_date || 0).getTime() - new Date(a.exam_date || 0).getTime();
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'students':
          return (b.total_students || 0) - (a.total_students || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [exams, searchTerm, filterType, sortBy]);

  // ========================================================================
  // ANALYTICS
  // ========================================================================

  const analytics = useMemo(() => {
    const safeExams = Array.isArray(exams) ? exams : [];
    if (safeExams.length === 0) return null;

    const totalStudents = safeExams.reduce((sum, e) => sum + (e.total_students || 0), 0);
    const avgNet = safeExams.reduce((sum, e) => sum + (e.average_net || 0), 0) / safeExams.length;

    return {
      totalExams: safeExams.length,
      totalStudents,
      avgNet: isNaN(avgNet) ? 0 : avgNet,
    };
  }, [exams]);

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/30 flex items-center justify-center">
          <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-cyan-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-600 rounded-full animate-spin" />
            <Brain className="absolute inset-0 m-auto w-10 h-10 text-cyan-600" />
                  </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Sınavlar Yükleniyor</h3>
          <p className="text-slate-500">Lütfen bekleyin...</p>
        </motion.div>
                  </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-red-100"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Bağlantı Hatası</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => fetchExams()} className="bg-cyan-600 hover:bg-cyan-700">
            <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
                    </Button>
          </motion.div>
    </div>
  );
  }

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-indigo-50/20">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        
        {/* HEADER */}
          <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200"
        >
          <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-indigo-600 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Target className="w-7 h-7 text-white" />
            </div>
                <div>
                  <h1 className="text-2xl font-bold">Sınav Sonuçları</h1>
                  <p className="text-cyan-100 text-sm">{currentOrganization?.name || 'AkademiHub'}</p>
            </div>
        </div>

              <div className="flex items-center gap-3">
                    <Button
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Yenile
                    </Button>
                <Button
                  onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                  className="bg-white text-cyan-700 hover:bg-cyan-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Sınav
                </Button>
              </div>
      </div>
            </div>

          {/* Stats */}
            {analytics && (
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{analytics.totalExams}</p>
                <p className="text-sm text-slate-500">Toplam Sınav</p>
            </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{analytics.totalStudents}</p>
                <p className="text-sm text-slate-500">Toplam Öğrenci</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{analytics.avgNet.toFixed(2)}</p>
                <p className="text-sm text-slate-500">Ort. Net</p>
              </div>
      </div>
            )}
        </motion.div>

        {/* FILTERS */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-4 border border-slate-200"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                placeholder="Sınav ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-slate-200"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-11 bg-slate-50">
                <SelectValue placeholder="Sınav Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="LGS">LGS</SelectItem>
                <SelectItem value="TYT">TYT</SelectItem>
                <SelectItem value="AYT">AYT</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[140px] h-11 bg-slate-50">
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tarihe Göre</SelectItem>
                <SelectItem value="name">İsme Göre</SelectItem>
                <SelectItem value="students">Öğrenci Sayısına</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* EXAM LIST */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {processedExams.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-slate-400" />
                </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                {searchTerm || filterType !== 'all' ? 'Sonuç Bulunamadı' : 'Henüz Sınav Yok'}
                </h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || filterType !== 'all'
                    ? 'Filtreleri değiştirerek tekrar deneyin.'
                  : 'Yeni sınav ekleyerek başlayın.'}
              </p>
              {!(searchTerm || filterType !== 'all') && (
              <Button
                onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                  className="bg-cyan-600 hover:bg-cyan-700"
              >
                  <Plus className="w-4 h-4 mr-2" />
                İlk Sınavı Ekle
              </Button>
                  )}
            </Card>
          ) : (
            processedExams.map((exam, idx) => (
                <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-5 hover:shadow-lg transition-shadow border border-slate-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {(() => {
                          const safeType = normalizeExamType(exam.exam_type);
                          return typeof safeType === 'string' ? safeType.slice(0, 3) : 'LGS';
                        })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {typeof exam.name === 'string' ? exam.name : 'İsimsiz Sınav'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {exam.exam_date ? format(new Date(exam.exam_date), 'dd MMMM yyyy', { locale: tr }) : 'Tarih yok'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {exam.total_students || 0} öğrenci
                          </span>
                          {exam.average_net !== undefined && (
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              Ort: {(exam.average_net || 0).toFixed(2)} net
                    </span>
                          )}
                        </div>
                      </div>
                  </div>

                  <div className="flex items-center gap-2">
                      <Badge variant={exam.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {exam.status === 'completed' ? 'Tamamlandı' : 'İşleniyor'}
                      </Badge>
                    <Button
                        variant="outline"
                      size="sm"
                        onClick={() => router.push(`/admin/akademik-analiz/exam-dashboard?examId=${exam.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Analiz
                      </Button>
                      <Button
                      variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/akademik-analiz/karne?examId=${exam.id}`)}
                    >
                        <FileText className="w-4 h-4 mr-1" />
                        Karne
                    </Button>
                    <Button
                        variant="ghost"
                      size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setExamToDelete(exam.id);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    </div>
                  </div>
                </Card>
                </motion.div>
            ))
          )}
        </motion.div>

        {/* DELETE MODAL */}
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <AlertDialogTitle className="text-center text-xl">Sınavı Sil</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Bu sınavı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel disabled={deleteLoading}>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExam}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  'Evet, Sil'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
