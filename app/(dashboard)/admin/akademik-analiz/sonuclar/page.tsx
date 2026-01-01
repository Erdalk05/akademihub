'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  BarChart3, FileText, Trash2, Edit, Filter, Search,
  Calendar, Users, TrendingUp, Brain, Target, FileSpreadsheet,
  AlertCircle, Loader2, CheckCircle2, XCircle
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface Exam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  created_at: string;
  total_students: number;
  average_net: number;
  status: 'completed' | 'processing' | 'draft';
}

export default function SonuclarPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sınavları yükle
  useEffect(() => {
    fetchExams();
  }, [currentOrganization?.id]);

  const fetchExams = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/akademik-analiz/wizard?organizationId=${currentOrganization.id}`);
      if (!response.ok) throw new Error('Sınavlar yüklenemedi');
      
      const data = await response.json();
      setExams(data.exams || []);
    } catch (error) {
      console.error('Sınav listesi hatası:', error);
      toast({
        title: "Hata",
        description: "Sınavlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sınav sil
  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/akademik-analiz/exams/${examToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Sınav silinemedi');
      
      toast({
        title: "Başarılı",
        description: "Sınav başarıyla silindi",
      });
      
      // Listeden kaldır
      setExams(exams.filter(exam => exam.id !== examToDelete));
      setDeleteModalOpen(false);
      setExamToDelete(null);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sınav silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtreleme
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || exam.exam_type === filterType;
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Durum badge'i
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      processing: { label: 'İşleniyor', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      draft: { label: 'Taslak', className: 'bg-slate-50 text-slate-700 border-slate-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="outline" className={config.className}>
        {status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
        {status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
        {status === 'draft' && <Edit className="w-3 h-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <Brain className="w-16 h-16 text-emerald-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Sınavlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Başlık ve Aksiyonlar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <Target className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Sınav Listesi</h1>
                <p className="text-slate-600 mt-1">Tüm sınavlarınızı buradan yönetebilirsiniz</p>
              </div>
            </div>
            
            <Button
              onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Yeni Sınav Ekle
            </Button>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Toplam Sınav</p>
                    <p className="text-2xl font-bold text-slate-800">{exams.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Toplam Öğrenci</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {exams.reduce((sum, exam) => sum + exam.total_students, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Ort. Net</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {(exams.reduce((sum, exam) => sum + exam.average_net, 0) / exams.length || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Bu Ay</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {exams.filter(exam => {
                        const examDate = new Date(exam.exam_date);
                        const now = new Date();
                        return examDate.getMonth() === now.getMonth() && examDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtreler */}
          <Card className="bg-white/90 backdrop-blur border-none shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Sınav ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-slate-200 focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Sınav Tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Tipler</SelectItem>
                    <SelectItem value="LGS">LGS</SelectItem>
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="processing">İşleniyor</SelectItem>
                    <SelectItem value="draft">Taslak</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrele
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sınav Tablosu */}
        <Card className="bg-white/90 backdrop-blur border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sınav Sonuçları ({filteredExams.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredExams.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Henüz sınav eklenmemiş</p>
                <Button
                  onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  İlk Sınavı Ekle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Sınav Adı</TableHead>
                    <TableHead className="font-semibold">Tarih</TableHead>
                    <TableHead className="font-semibold">Tip</TableHead>
                    <TableHead className="font-semibold text-center">Öğrenci</TableHead>
                    <TableHead className="font-semibold text-center">Ort. Net</TableHead>
                    <TableHead className="font-semibold">Durum</TableHead>
                    <TableHead className="font-semibold text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam, index) => (
                    <TableRow
                      key={exam.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(exam.exam_date), 'dd MMM yyyy', { locale: tr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {exam.exam_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">{exam.total_students}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-semibold">{exam.average_net.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/akademik-analiz/exam-dashboard?examId=${exam.id}`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Brain className="w-4 h-4 mr-1" />
                            Analiz
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/admin/akademik-analiz/karne?examId=${exam.id}`)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Karne
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setExamToDelete(exam.id);
                              setDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Silme Onay Modal */}
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sınavı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu sınavı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve
                sınava ait tüm veriler silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
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
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}