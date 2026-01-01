'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, LineChart, Line, RadarChart, 
  PolarGrid, PolarAngleAxis, Radar, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  Trophy, Users, Target, Zap, AlertTriangle, 
  ArrowLeft, Download, Brain, TrendingUp,
  Award, Activity, Star, Flame, GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ========================================================= */
/* EXAM DASHBOARD - AKADEMİKHUB PREMIUM ANALİZ SİSTEMİ */
/* ========================================================= */

function ExamDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // KURUMSAL RENKLERİMİZ
  const COLORS = {
    brand: '#25D366',
    brandDark: '#128C7E',
    deep: '#075E54',
    blue: '#34B7F1',
    amber: '#FFD700',
    red: '#EF4444'
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Analiz verisi çekilemedi", e);
      } finally {
        setLoading(false);
      }
    };
    if (examId) fetchAnalysis();
  }, [examId]);

  // MOCK VERİ ZENGİNLEŞTİRME (Gerçek API gelene kadar analizleri besler)
  const dashboardData = useMemo(() => {
    if (!data) return null;
    return {
      subeAnalizi: [
        { name: '8-A', ort: 72.4, hedef: 80, katilim: 24 },
        { name: '8-B', ort: 65.8, hedef: 80, katilim: 22 },
        { name: '8-C', ort: 78.2, hedef: 80, katilim: 25 },
        { name: '8-D', ort: 54.5, hedef: 80, katilim: 21 },
      ],
      dersRadar: [
        { subject: 'Türkçe', ort: 16.5, okul: 14.2, tam: 20 },
        { subject: 'Matematik', ort: 12.8, okul: 10.5, tam: 20 },
        { subject: 'Fen Bil.', ort: 15.2, okul: 13.8, tam: 20 },
        { subject: 'İnkılap', ort: 8.4, okul: 7.2, tam: 10 },
        { subject: 'İngilizce', ort: 9.1, okul: 8.0, tam: 10 },
        { subject: 'Din Kül.', ort: 8.8, okul: 8.2, tam: 10 },
      ]
    };
  }, [data]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5]">
      <div className="w-16 h-16 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-black text-[#075E54] tracking-[0.3em] text-xs uppercase animate-pulse">Analiz Motoru Hazırlanıyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 font-sans">
      
      {/* 🟢 HEADER: COMMAND CENTER (WhatsApp Green Style) */}
      <div className="bg-gradient-to-b from-[#075E54] to-[#128C7E] text-white pt-10 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <Button 
                onClick={() => router.back()} 
                variant="ghost" 
                className="bg-white/10 text-white hover:bg-white/20 border-none rounded-xl font-bold px-4"
              >
                <ArrowLeft className="mr-2" size={18} /> LİSTEYE DÖN
              </Button>
              <div>
                <h1 className="text-5xl font-black tracking-tighter uppercase italic drop-shadow-lg">
                  {data?.exam?.name || 'GENEL ANALİZ MASASI'}
                </h1>
                <div className="flex flex-wrap gap-4 mt-4">
                  <Badge className="bg-[#25D366] text-white py-1.5 px-4 rounded-lg font-bold shadow-lg border-none">
                    📅 {new Date(data?.exam?.exam_date).toLocaleDateString('tr-TR')}
                  </Badge>
                  <Badge className="bg-white/10 text-white py-1.5 px-4 rounded-lg font-bold border-white/20">
                    👥 {data?.results?.length || 0} ÖĞRENCİ ANALİZİ
                  </Badge>
                  <Badge className="bg-amber-500 text-white py-1.5 px-4 rounded-lg font-bold shadow-lg border-none">
                    🏆 ORTALAMA: {data?.stats?.avgNet || '74.2'} NET
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-[10px] font-black text-[#25D366] uppercase tracking-[0.3em] mb-1">Akademik Başarı Skoru</p>
                <div className="text-7xl font-black text-white tracking-tighter">84<span className="text-[#25D366]">.2</span></div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-[#25D366] hover:bg-[#1ebd5b] text-white font-black px-6 py-6 rounded-2xl shadow-xl transition-all">
                   <Download className="mr-2" /> PDF KARNE PAKETİ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 space-y-6">
        
        {/* 📊 1. ADIM: STRATEJİK KPI KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalizCard title="En Yüksek Net" value="88.25" sub="8-C / Melis Demir" icon={<Trophy className="text-amber-500"/>} trend="+2.4" />
          <AnalizCard title="Okul Ortalaması" value="64.12" sub="Hedef: 70.00" icon={<Target className="text-[#25D366]"/>} trend="-1.2" />
          <AnalizCard title="Kritik Limit" value="14 Öğrenci" sub="Netleri düşenler" icon={<AlertTriangle className="text-red-500"/>} />
          <AnalizCard title="AI Tahmin" value="412.5" sub="LGS Puan Projeksiyonu" icon={<Brain className="text-blue-500"/>} trend="+5.0" />
        </div>

        {/* 📉 2. ADIM: KARŞILAŞTIRMALI GRAFİKLER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ŞUBE BAZLI KARŞILAŞTIRMA */}
          <Card className="lg:col-span-2 shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between bg-white">
              <CardTitle className="text-[#075E54] font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <Activity size={20} className="text-[#25D366]" /> Şube Performans Kıyaslaması
              </CardTitle>
              <Badge variant="outline" className="border-[#25D366] text-[#25D366] font-bold">K12 STANDARDI</Badge>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dashboardData?.subeAnalizi}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="ort" fill="#25D366" radius={[15, 15, 0, 0]} barSize={50} name="Şube Ortalaması" />
                    <Line type="monotone" dataKey="hedef" stroke="#075E54" strokeWidth={4} dot={{ r: 6, fill: '#075E54' }} name="Okul Hedefi" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* DERS BAZLI RADAR (DNA) */}
          <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 p-8 bg-white">
              <CardTitle className="text-[#075E54] font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <Zap size={20} className="text-amber-500" /> Sınavın Zorluk DNA'sı
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dashboardData?.dersRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 'black'}} />
                    <Radar name="Sınıf Ort" dataKey="ort" stroke="#25D366" fill="#25D366" fillOpacity={0.5} />
                    <Radar name="Okul Geneli" dataKey="okul" stroke="#075E54" fill="#075E54" fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📋 3. ADIM: DETAYLI ÖĞRENCİ ANALİZ TABLOSU */}
        <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-[#075E54] p-8">
            <div className="flex justify-between items-center text-white">
              <CardTitle className="font-black uppercase text-sm tracking-[0.2em] flex items-center gap-2">
                <GraduationCap /> Başarı Sıralaması ve Risk Analizi
              </CardTitle>
              <div className="flex gap-2">
                 <Badge className="bg-[#25D366] hover:bg-[#25D366] border-none font-black px-3">EN BAŞARILI 10</Badge>
                 <Badge variant="outline" className="text-white border-white/20">TÜMÜNÜ GÖR</Badge>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-10 py-6">Öğrenci & Şube</th>
                  <th className="px-10 py-6 text-center">Doğru / Yanlış / Boş</th>
                  <th className="px-10 py-6 text-center">Net</th>
                  <th className="px-10 py-6 text-center">Puan</th>
                  <th className="px-10 py-6 text-right">Momentum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.results?.slice(0, 10).map((res: any, i: number) => (
                  <tr key={i} className="hover:bg-[#25D366]/5 transition-all group cursor-pointer" onClick={() => router.push(`/admin/akademik-analiz/ogrenci-kart?studentId=${res.student_id}`)}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-[#075E54] group-hover:bg-[#25D366] group-hover:text-white transition-all shadow-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase tracking-tighter">{res.student?.full_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Şube: 8-C</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                       <div className="flex justify-center items-center gap-2 font-black text-xs">
                          <span className="text-emerald-500">{res.total_correct}D</span>
                          <span className="text-slate-200">/</span>
                          <span className="text-red-500">{res.total_wrong}Y</span>
                          <span className="text-slate-200">/</span>
                          <span className="text-slate-400">{res.total_empty}B</span>
                       </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="inline-block bg-[#075E54] text-white font-black px-4 py-1.5 rounded-xl text-lg shadow-lg">
                        {res.total_net}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center font-black text-slate-700 text-lg tracking-tighter">
                      482.4
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-2xl font-black text-[10px] tracking-widest">
                          <TrendingUp size={14} /> +4.2%
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ========================================================= */
/* YARDIMCI BİLEŞEN: ANALİZ KARTI */
/* ========================================================= */

function AnalizCard({ title, value, sub, icon, trend }: any) {
  return (
    <Card className="shadow-2xl border-none rounded-[2rem] hover:translate-y-[-8px] transition-all duration-300 bg-white group">
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{title}</p>
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-[#25D366]/10 group-hover:scale-110 transition-all text-slate-400 group-hover:text-[#25D366]">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <h4 className="text-4xl font-black text-[#075E54] tracking-tighter">{value}</h4>
          {trend && (
            <span className={`text-xs font-black ${trend.startsWith('+') ? 'text-[#25D366]' : 'text-red-500'}`}>
              {trend}%
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function ExamDashboardPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ExamDashboardContent />
    </Suspense>
  );
}