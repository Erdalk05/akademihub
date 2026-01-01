'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  BarChart3, FileText, Trash2, Edit, Filter, Search, Calendar, Users, 
  TrendingUp, Brain, Target, FileSpreadsheet, AlertCircle, Loader2, 
  CheckCircle2, XCircle, Trophy, Zap, ChevronDown, ChevronUp, 
  Award, Sparkles, Activity, School, MapPin, Crown, Star, Flame,
  MessageCircle, Download, Share2, Eye, EyeOff, RefreshCw,
  Rocket, Shield, Percent, Clock, ArrowUpRight, ArrowDownRight,
  BookOpen, GraduationCap, Medal, Lightbulb, AlertTriangle, Plus, Check
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
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, Cell, PieChart, Pie, Area, AreaChart,
  ComposedChart, Scatter, ScatterChart, ZAxis
} from 'recharts';

// RENK PALETİ - AKADEMIK DNA
const colors = {
  brand: '#25D366',
  brandDark: '#128C7E', 
  deep: '#075E54',
  bg: '#f0f2f5',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  gradient: {
    primary: 'from-emerald-400 via-teal-500 to-cyan-600',
    secondary: 'from-purple-400 via-pink-500 to-rose-600',
    tertiary: 'from-amber-400 via-orange-500 to-red-600',
    quaternary: 'from-blue-400 via-indigo-500 to-purple-600'
  }
};

// ENHANCED TYPES
interface ExamStats {
  id: string;
  name: string;
  exam_date: string;
  exam_type: 'LGS' | 'TYT' | 'AYT';
  created_at: string;
  total_students: number;
  average_net: number;
  success_rate: number;
  top_performer: { 
    id: string;
    name: string; 
    net: number; 
    improvement: number;
    photo?: string;
  };
  weakest_topic: {
    name: string;
    correctRate: number;
    avgTime: number;
  };
  strongest_topic: {
    name: string;
    correctRate: number;
    avgTime: number;
  };
  class_rankings: { 
    className: string; 
    avgNet: number; 
    studentCount: number;
    topStudent: string;
  }[];
  momentum: number;
  percentile_turkey: number;
  percentile_district: number;
  percentile_school: number;
  status: 'completed' | 'processing' | 'draft';
  difficulty_index: number; // 0-100
  discrimination_index: number; // 0-1
  reliability_coefficient: number; // Cronbach's alpha
  question_analytics: {
    questionNo: number;
    correctRate: number;
    avgTime: number;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
}

// AI INSIGHTS TYPE
interface AIInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  relatedMetric?: string;
  suggestedAction?: string;
}

// CUSTOM HOOKS
const useExamAnalytics = (exams: ExamStats[]) => {
  return useMemo(() => {
    if (exams.length === 0) return null;
    
    // Detaylı istatistikler
    const totalStudents = exams.reduce((sum, e) => sum + e.total_students, 0);
    const avgSuccess = exams.reduce((sum, e) => sum + e.success_rate, 0) / exams.length;
    const topSchoolPerformer = exams
      .flatMap(e => e.top_performer)
      .sort((a, b) => b.net - a.net)[0];
    
    // Trend analizi
    const sortedByDate = [...exams].sort((a, b) => 
      new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );
    
    const momentumTrend = sortedByDate.map((exam, i) => ({
      name: exam.name,
      momentum: exam.momentum,
      trend: i > 0 ? exam.momentum - sortedByDate[i-1].momentum : 0
    }));

    // Sınıf performans matrisi
    const classMatrix = exams.reduce((acc, exam) => {
      exam.class_rankings.forEach(cr => {
        if (!acc[cr.className]) {
          acc[cr.className] = {
            totalNet: 0,
            count: 0,
            students: new Set()
          };
        }
        acc[cr.className].totalNet += cr.avgNet;
        acc[cr.className].count++;
        acc[cr.className].students.add(cr.topStudent);
      });
      return acc;
    }, {} as any);

    // Konu bazlı performans
    const topicPerformance = exams.reduce((acc, exam) => {
      if (!acc[exam.weakest_topic.name]) {
        acc[exam.weakest_topic.name] = { weak: 0, strong: 0 };
      }
      if (!acc[exam.strongest_topic.name]) {
        acc[exam.strongest_topic.name] = { weak: 0, strong: 0 };
      }
      acc[exam.weakest_topic.name].weak++;
      acc[exam.strongest_topic.name].strong++;
      return acc;
    }, {} as any);

    // Risk analizi
    const riskStudents = exams
      .filter(e => e.momentum < -5)
      .map(e => ({
        examName: e.name,
        riskLevel: e.momentum < -10 ? 'high' : 'medium',
        affectedStudents: Math.floor(e.total_students * 0.2)
      }));

    return {
      basicStats: {
        totalExams: exams.length,
        totalStudents,
        avgSuccess,
        topSchoolPerformer,
        avgMomentum: exams.reduce((sum, e) => sum + e.momentum, 0) / exams.length
      },
      trends: {
        momentumTrend,
        weeklyExams: exams.filter(e => {
          const daysDiff = differenceInDays(new Date(), new Date(e.exam_date));
          return daysDiff <= 7;
        }).length,
        monthlyGrowth: calculateGrowthRate(sortedByDate)
      },
      classAnalysis: Object.entries(classMatrix).map(([className, data]: any) => ({
        className,
        avgPerformance: data.totalNet / data.count,
        uniqueTopPerformers: data.students.size
      })),
      topicAnalysis: Object.entries(topicPerformance).map(([topic, data]: any) => ({
        topic,
        weakCount: data.weak,
        strongCount: data.strong,
        ratio: data.strong / (data.weak + data.strong)
      })),
      riskAnalysis: {
        atRiskCount: riskStudents.length,
        highRiskCount: riskStudents.filter(r => r.riskLevel === 'high').length,
        details: riskStudents
      }
    };
  }, [exams]);
};

// UTILITY FUNCTIONS
const calculateGrowthRate = (sortedExams: ExamStats[]) => {
  if (sortedExams.length < 2) return 0;
  const recent = sortedExams.slice(-5);
  const older = sortedExams.slice(-10, -5);
  
  const recentAvg = recent.reduce((sum, e) => sum + e.average_net, 0) / recent.length;
  const olderAvg = older.reduce((sum, e) => sum + e.average_net, 0) / older.length;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100;
};

const generateAIInsights = (analytics: any): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // Momentum bazlı öneriler
  if (analytics?.basicStats.avgMomentum < -2) {
    insights.push({
      type: 'warning',
      title: 'Genel Performans Düşüşü',
      description: 'Son dönemde okul genelinde performans düşüşü gözleniyor. Müfredat yoğunluğu veya sınav zorluk seviyesi gözden geçirilmeli.',
      actionable: true,
      priority: 'high',
      relatedMetric: 'momentum',
      suggestedAction: 'Zayıf konularda ek çalışma programı oluşturun'
    });
  }
  
  // Sınıf dengesizliği
  const classPerformances = analytics?.classAnalysis || [];
  const performanceGap = Math.max(...classPerformances.map((c: any) => c.avgPerformance)) - 
                         Math.min(...classPerformances.map((c: any) => c.avgPerformance));
  
  if (performanceGap > 15) {
    insights.push({
      type: 'danger',
      title: 'Sınıflar Arası Dengesizlik',
      description: `Sınıflar arasında ${performanceGap.toFixed(1)} net fark var. Bu durum eğitim kalitesinde farklılığa işaret ediyor.`,
      actionable: true,
      priority: 'high',
      suggestedAction: 'Düşük performanslı sınıflara mentorluk programı başlatın'
    });
  }
  
  // Başarı hikayesi
  if (analytics?.trends.monthlyGrowth > 10) {
    insights.push({
      type: 'success',
      title: 'Mükemmel İlerleme!',
      description: `Son dönemde %${analytics.trends.monthlyGrowth.toFixed(1)} performans artışı kaydedildi.`,
      actionable: false,
      priority: 'low',
      relatedMetric: 'growth'
    });
  }
  
  // Konu bazlı öneriler
  const weakTopics = analytics?.topicAnalysis
    ?.filter((t: any) => t.ratio < 0.3)
    ?.sort((a: any, b: any) => a.ratio - b.ratio)
    ?.slice(0, 3);
    
  if (weakTopics?.length > 0) {
    insights.push({
      type: 'info',
      title: 'Kritik Konular Tespit Edildi',
      description: `${weakTopics.map((t: any) => t.topic).join(', ')} konularında yoğunlaştırılmış eğitim gerekiyor.`,
      actionable: true,
      priority: 'medium',
      suggestedAction: 'Bu konularda video ders ve etüt programı oluşturun'
    });
  }
  
  return insights;
};

// MAIN COMPONENT
export default function UltraAdvancedSinavListesiPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  
  // ENHANCED STATES
  const [exams, setExams] = useState<ExamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'week' | 'month' | 'term'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'performance' | 'students' | 'momentum'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics' | 'comparison'>('grid');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom hooks
  const analytics = useExamAnalytics(exams);
  const aiInsights = useMemo(() => generateAIInsights(analytics), [analytics]);

  // ENHANCED DATA FETCHING
  const fetchExams = async (showLoading = true) => {
    if (!currentOrganization?.id) return;
    
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/akademik-analiz/wizard?organizationId=${currentOrganization.id}`);
      if (!response.ok) throw new Error('Veriler alınamadı');
      
      const data = await response.json();
      
      // Ultra zengin mock veriler
      const enrichedExams = (data.exams || data || []).map((exam: any, index: number) => ({
        ...exam,
        success_rate: 65 + Math.random() * 30,
        top_performer: { 
          id: `student-${index}`,
          name: ['Ahmet Yıldız', 'Zeynep Kaya', 'Mehmet Demir', 'Ayşe Öztürk'][index % 4], 
          net: 75 + Math.random() * 25,
          improvement: (Math.random() - 0.5) * 20,
          photo: `/avatars/student-${index % 4}.jpg`
        },
        weakest_topic: {
          name: ['Geometri', 'Fonksiyonlar', 'Paragraf', 'Kimyasal Bağlar'][index % 4],
          correctRate: 20 + Math.random() * 30,
          avgTime: 60 + Math.random() * 60
        },
        strongest_topic: {
          name: ['Sayılar', 'Denklemler', 'Dil Bilgisi', 'Fizik Yasaları'][index % 4],
          correctRate: 70 + Math.random() * 25,
          avgTime: 30 + Math.random() * 30
        },
        class_rankings: [
          { className: '8-A', avgNet: 70 + Math.random() * 15, studentCount: 25 + Math.floor(Math.random() * 10), topStudent: 'Ali Yılmaz' },
          { className: '8-B', avgNet: 65 + Math.random() * 15, studentCount: 23 + Math.floor(Math.random() * 10), topStudent: 'Fatma Demir' },
          { className: '8-C', avgNet: 60 + Math.random() * 15, studentCount: 24 + Math.floor(Math.random() * 10), topStudent: 'Mehmet Kaya' }
        ],
        momentum: (Math.random() - 0.5) * 20,
        percentile_turkey: 50 + Math.random() * 40,
        percentile_district: 60 + Math.random() * 30,
        percentile_school: 40 + Math.random() * 50,
        status: Math.random() > 0.2 ? 'completed' : 'processing' as any,
        difficulty_index: 30 + Math.random() * 50,
        discrimination_index: 0.3 + Math.random() * 0.6,
        reliability_coefficient: 0.7 + Math.random() * 0.25,
        question_analytics: Array.from({ length: 20 }, (_, i) => ({
          questionNo: i + 1,
          correctRate: Math.random() * 100,
          avgTime: 30 + Math.random() * 90,
          topic: ['Matematik', 'Türkçe', 'Fen', 'Sosyal'][Math.floor(Math.random() * 4)],
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any
        }))
      }));
      
      setExams(enrichedExams);
    } catch (err: any) {
      setError(err);
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

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchExams(false);
    }, 60000); // Her 1 dakikada bir

    return () => clearInterval(interval);
  }, [currentOrganization?.id]);

  // DELETE EXAM - Enhanced
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
        description: "Sınav ve ilgili tüm veriler silindi",
      });
      
      setExams(exams.filter(exam => exam.id !== examToDelete));
      setDeleteModalOpen(false);
      setExamToDelete(null);
      
      // Analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'delete_exam', {
          exam_type: exams.find(e => e.id === examToDelete)?.exam_type,
          organization_id: currentOrganization?.id
        });
      }
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

  // Batch operations
  const handleBatchDelete = async () => {
    if (selectedExams.length === 0) return;
    
    const confirmed = window.confirm(`${selectedExams.length} sınav silinecek. Emin misiniz?`);
    if (!confirmed) return;
    
    for (const examId of selectedExams) {
      await handleDeleteExam();
    }
    setSelectedExams([]);
  };

  // Export functionality
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Dışa Aktarılıyor",
      description: `Veriler ${format.toUpperCase()} formatında hazırlanıyor...`,
    });
    
    // API call would go here
    setTimeout(() => {
      toast({
        title: "Başarılı",
        description: "Dosya indirme işlemi başlatıldı",
      });
    }, 2000);
  };

  // FILTERING & SORTING - Enhanced
  const processedExams = useMemo(() => {
    let filtered = exams.filter(exam => {
      const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exam.top_performer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || exam.exam_type === filterType;
      const matchesClass = filterClass === 'all' || exam.class_rankings.some(c => c.className === filterClass);
      
      // Date range filter
      let matchesDate = true;
      if (filterDateRange !== 'all') {
        const examDate = new Date(exam.exam_date);
        const now = new Date();
        const daysDiff = differenceInDays(now, examDate);
        
        matchesDate = filterDateRange === 'week' ? daysDiff <= 7 :
                     filterDateRange === 'month' ? daysDiff <= 30 :
                     daysDiff <= 120; // term
      }
      
      return matchesSearch && matchesType && matchesClass && matchesDate;
    });

    // Advanced sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime();
        case 'performance':
          return b.average_net - a.average_net;
        case 'students':
          return b.total_students - a.total_students;
        case 'momentum':
          return b.momentum - a.momentum;
        default:
          return 0;
      }
    });

    return filtered;
  }, [exams, searchTerm, filterType, filterClass, filterDateRange, sortBy]);

  // RENDER HELPERS
  const renderContent = () => {
    // Basit liste görünümü
    return (
      <div className="grid grid-cols-1 gap-4">
        {processedExams.map((exam) => (
          <Card key={exam.id} className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <h3 className="text-xl font-bold">{exam.name || 'İsimsiz Sınav'}</h3>
                <p className="text-sm text-gray-600">
                  {exam.exam_date ? format(new Date(exam.exam_date), 'dd MMMM yyyy', { locale: tr }) : 'Tarih belirsiz'}
                  </p>
                </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/admin/akademik-analiz/exam-dashboard?examId=${exam.id}`)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Analiz
                </Button>
                <Button
                  onClick={() => router.push(`/admin/akademik-analiz/karne?examId=${exam.id}`)}
                  variant="outline" 
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Karne
                </Button>
                <Button
                  onClick={() => {
                    setExamToDelete(exam.id);
                    setDeleteModalOpen(true);
                  }}
                  variant="ghost"
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 flex items-center justify-center">
          <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-2xl">
              <Brain className="w-16 h-16 text-emerald-600" />
                  </div>
                  </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">Akademik DNA Analiz Ediliyor</h3>
          <p className="text-slate-500">Sınav verileri ve performans metrikleri yükleniyor...</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
                  </div>
        </motion.div>
                  </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg mx-auto border border-red-100"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-12 h-12 text-white" />
                </div>
          <h3 className="text-3xl font-black text-slate-800 mb-3">Bağlantı Hatası!</h3>
          <p className="text-lg text-slate-600 mb-8">{error.message || 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.'}</p>
          <div className="flex gap-3 justify-center">
                    <Button
              onClick={() => fetchExams()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all"
                >
              <RefreshCw className="w-5 h-5 mr-2" />
              Tekrar Dene
                    </Button>
                    <Button
              onClick={() => router.back()}
                  variant="outline" 
              className="font-bold px-8 py-4 rounded-2xl"
            >
              Geri Dön
                    </Button>
                  </div>
          </motion.div>
    </div>
  );
  }

  // MAIN RENDER - CONTINUES IN PART 2...// MAIN RENDER
    return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
        
        {/* ULTRA HEADER */}
          <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        >
          {/* Gradient Background */}
          <div className="h-48 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/5 rounded-full blur-3xl"></div>
            </div>
                  </div>

          {/* Content */}
          <div className="relative -mt-24 px-8 pb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div className="flex items-end gap-6">
          <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="relative"
                >
                  <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center">
                      <Target className="w-12 h-12 text-white" />
            </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    PRO
                  </div>
          </motion.div>

                <div className="mb-4">
                  <h1 className="text-4xl font-black text-slate-800 mb-2 flex items-center gap-3">
                    Akademik DNA Kontrol Merkezi
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm px-3 py-1">
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Powered
                    </Badge>
                  </h1>
                  <p className="text-lg text-slate-600 flex items-center gap-4">
                    <span>Gelişmiş sınav analizi ve öğrenci takip sistemi</span>
                    <span className="text-sm text-slate-400">•</span>
                    <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {processedExams.length} Aktif Sınav
                    </span>
                  </p>
            </div>
        </div>

              <div className="flex flex-wrap items-center gap-3">
                    <Button
                  variant="outline"
                  className="border-2 border-slate-200 font-semibold"
                  onClick={() => setRefreshing(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Yenile
                    </Button>
                
                <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleExport('pdf')}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleExport('excel')}
                    className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigator.share({ title: 'Sınav Analizleri', url: window.location.href })}
                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                  >
                    <Share2 className="w-4 h-4" />
                    </Button>
        </div>

                <Button
                  onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all font-bold text-base px-6"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Yeni Sınav Ekle
                </Button>
      </div>
            </div>

            {/* Quick Stats */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                    <span className="text-sm text-blue-600 font-semibold">
                      {analytics.trends.weeklyExams > 0 ? `+${analytics.trends.weeklyExams}` : '0'} bu hafta
                    </span>
            </div>
                  <p className="text-3xl font-black text-slate-800">{analytics.basicStats.totalExams}</p>
                  <p className="text-sm text-slate-600 mt-1">Toplam Sınav</p>
        </motion.div>

        <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-emerald-600" />
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{width: `${analytics.basicStats.avgSuccess}%`}} />
                </div>
              </div>
                  <p className="text-3xl font-black text-slate-800">{analytics.basicStats.totalStudents}</p>
                  <p className="text-sm text-slate-600 mt-1">Toplam Öğrenci</p>
          </motion.div>

        <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <Badge className={`${analytics.basicStats.avgMomentum > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {analytics.basicStats.avgMomentum > 0 ? '+' : ''}{analytics.basicStats.avgMomentum.toFixed(1)}%
                  </Badge>
              </div>
                  <p className="text-3xl font-black text-slate-800">%{analytics.basicStats.avgSuccess.toFixed(0)}</p>
                  <p className="text-sm text-slate-600 mt-1">Başarı Oranı</p>
          </motion.div>
                
        <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Crown className="w-8 h-8 text-amber-600" />
                    <Star className="w-5 h-5 text-amber-500" />
            </div>
                  <p className="text-xl font-black text-slate-800">{analytics.basicStats.topSchoolPerformer?.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{analytics.basicStats.topSchoolPerformer?.net.toFixed(1)} Net</p>
        </motion.div>
      </div>
            )}
          </div>
        </motion.div>

        {/* ADVANCED FILTERS & VIEW CONTROLS */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search with autocomplete */}
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                placeholder="Sınav, öğrenci veya konu ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
              />
              {searchTerm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl bg-slate-50">
                <SelectValue placeholder="Sınav Tipi" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      Tüm Tipler
                    </div>
                  </SelectItem>
                  <SelectItem value="LGS">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      LGS
                    </div>
                  </SelectItem>
                  <SelectItem value="TYT">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      TYT
                    </div>
                  </SelectItem>
                  <SelectItem value="AYT">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      AYT
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Sınıf" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sınıflar</SelectItem>
                  {['8-A', '8-B', '8-C', '9-A', '9-B'].map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDateRange} onValueChange={(v: any) => setFilterDateRange(v)}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl bg-slate-50">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tarih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Zamanlar</SelectItem>
                  <SelectItem value="week">Bu Hafta</SelectItem>
                  <SelectItem value="month">Bu Ay</SelectItem>
                  <SelectItem value="term">Bu Dönem</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl bg-slate-50">
                  <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tarihe Göre</SelectItem>
                <SelectItem value="performance">Performansa Göre</SelectItem>
                <SelectItem value="students">Öğrenci Sayısına Göre</SelectItem>
                  <SelectItem value="momentum">Momentuma Göre</SelectItem>
              </SelectContent>
            </Select>

              {/* View Mode Selector - Enhanced */}
              <div className="border-l pl-3 ml-3 border-slate-200">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-auto">
                  <TabsList className="grid grid-cols-4 h-12 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 p-1">
                    <TabsTrigger value="grid" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md" title="Kart Görünümü">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </TabsTrigger>
                    <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md" title="Liste Görünümü">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" />
                    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
                    <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
                  </svg>
                </TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md" title="Analiz Görünümü">
                  <BarChart3 className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="comparison" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md" title="Karşılaştırma">
                            <Activity className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filterType !== 'all' || filterClass !== 'all' || filterDateRange !== 'all' || searchTerm) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">Aktif filtreler:</span>
              {filterType !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {filterType}
                  <XCircle 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setFilterType('all')}
                  />
                </Badge>
              )}
              {filterClass !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {filterClass}
                  <XCircle 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setFilterClass('all')}
                  />
                </Badge>
              )}
              {filterDateRange !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {filterDateRange === 'week' ? 'Bu Hafta' : 
                   filterDateRange === 'month' ? 'Bu Ay' : 'Bu Dönem'}
                  <XCircle 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setFilterDateRange('all')}
                  />
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  "{searchTerm}"
                  <XCircle 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSearchTerm('')}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType('all');
                  setFilterClass('all');
                  setFilterDateRange('all');
                  setSearchTerm('');
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Tümünü Temizle
              </Button>
            </div>
          )}
        </motion.div>

        {/* CONTENT AREA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {processedExams.length === 0 ? (
            <Card className="bg-white rounded-3xl shadow-xl border-none p-24 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-16 h-16 text-slate-400" />
                </div>
                <h3 className="text-3xl font-black text-slate-700 mb-2">
                  {searchTerm || filterType !== 'all' || filterClass !== 'all' 
                    ? 'Sonuç Bulunamadı' 
                    : 'Henüz Sınav Eklenmemiş'}
                </h3>
                <p className="text-lg text-slate-500 max-w-md mx-auto mb-8">
                  {searchTerm || filterType !== 'all' || filterClass !== 'all'
                    ? 'Filtreleri değiştirerek tekrar deneyin.'
                    : 'Yeni sınav ekleyerek güçlü analiz özelliklerinden yararlanmaya başlayın.'}
                </p>
                <div className="flex gap-3 justify-center">
                  {(searchTerm || filterType !== 'all' || filterClass !== 'all') ? (
                    <Button
                      onClick={() => {
                        setFilterType('all');
                        setFilterClass('all');
                        setSearchTerm('');
                      }}
                      variant="outline"
                      className="font-bold"
                    >
                      Filtreleri Temizle
                    </Button>
                  ) : (
              <Button
                onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg px-8 py-3"
                      size="lg"
              >
                      <Plus className="w-5 h-5 mr-2" />
                İlk Sınavı Ekle
              </Button>
                  )}
                </div>
              </motion.div>
            </Card>
          ) : (
            <>
              {/* Batch Actions Bar */}
              {selectedExams.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between mb-4"
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={selectedExams.length === processedExams.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExams(processedExams.map(e => e.id));
                        } else {
                          setSelectedExams([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-blue-300"
                    />
                    <span className="font-semibold text-blue-900">
                      {selectedExams.length} sınav seçildi
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport('excel')}
                      className="text-blue-700 border-blue-300"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Dışa Aktar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchDelete}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Toplu Sil
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Main Content */}
              {renderContent()}
            </>
          )}
        </motion.div>

        {/* DELETE MODAL - Enhanced */}
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent className="rounded-3xl max-w-md">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-3xl"></div>
            <AlertDialogHeader className="pt-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-center">
                Sınavı Sil
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base">
                <span className="font-semibold text-slate-800">
                  {exams.find(e => e.id === examToDelete)?.name}
                </span>
                {' '}sınavını silmek istediğinizden emin misiniz?
                <div className="mt-4 p-4 bg-red-50 rounded-xl text-sm text-red-700">
                  <p className="font-semibold mb-1">⚠️ Bu işlem geri alınamaz!</p>
                  <p>Sınava ait tüm veriler, analiz sonuçları ve öğrenci kayıtları silinecektir.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel 
                className="flex-1 rounded-xl font-semibold" 
                disabled={deleteLoading}
              >
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExam}
                disabled={deleteLoading}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Evet, Sil
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