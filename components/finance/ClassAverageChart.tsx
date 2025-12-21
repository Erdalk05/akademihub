'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { GraduationCap, TrendingUp, RefreshCw, Users, DollarSign } from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

interface ClassData {
  class: string;
  averageFee: number;
  studentCount: number;
  totalAmount: number;
}

// Gradient renk paleti - daha estetik
const COLORS = [
  '#10B981', // emerald-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#06B6D4', // cyan-500
  '#EC4899', // pink-500
  '#84CC16', // lime-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
];

export default function ClassAverageChart() {
  const { currentOrganization } = useOrganizationStore();
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, [currentOrganization?.id]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
      
      const [studentsRes, installmentsRes] = await Promise.all([
        fetch(`/api/students?${orgParam}`),
        fetch(`/api/installments?${orgParam}&raw=true`)
      ]);

      const studentsData = await studentsRes.json();
      const installmentsData = await installmentsRes.json();

      const students = studentsData.data || [];
      const installments = installmentsData.data || [];

      const classMap = new Map<string, { students: Set<string>; totalAmount: number }>();

      installments.forEach((inst: any) => {
        const student = students.find((s: any) => s.id === inst.student_id);
        if (!student) return;

        const className = student.class || 'Belirsiz';
        
        if (!classMap.has(className)) {
          classMap.set(className, { students: new Set(), totalAmount: 0 });
        }

        const classInfo = classMap.get(className)!;
        classInfo.students.add(student.id);
        classInfo.totalAmount += Number(inst.amount) || 0;
      });

      const data: ClassData[] = Array.from(classMap.entries())
        .map(([className, info]) => ({
          class: className,
          averageFee: info.students.size > 0 ? Math.round(info.totalAmount / info.students.size) : 0,
          studentCount: info.students.size,
          totalAmount: info.totalAmount
        }))
        .filter(d => d.averageFee > 0)
        .sort((a, b) => {
          const aNum = parseInt(a.class);
          const bNum = parseInt(b.class);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          if (!isNaN(aNum)) return -1;
          if (!isNaN(bNum)) return 1;
          return a.class.localeCompare(b.class);
        });

      setClassData(data);
    } catch (error) {
      console.error('Sınıf verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (classData.length === 0) return { totalStudents: 0, overallAverage: 0, maxFee: 0, minFee: 0 };
    const totalStudents = classData.reduce((s, d) => s + d.studentCount, 0);
    const totalAmount = classData.reduce((s, d) => s + d.totalAmount, 0);
    const fees = classData.map(d => d.averageFee);
    return {
      totalStudents,
      overallAverage: totalStudents > 0 ? Math.round(totalAmount / totalStudents) : 0,
      maxFee: Math.max(...fees),
      minFee: Math.min(...fees)
    };
  }, [classData]);

  // Custom Tooltip - Daha büyük ve estetik
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const colorIndex = classData.findIndex(d => d.class === data.class);
      return (
        <div className="bg-white px-5 py-4 rounded-2xl shadow-2xl border border-gray-100 min-w-[180px]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: COLORS[colorIndex % COLORS.length] }}
            />
            <p className="font-bold text-gray-900 text-lg">{data.class}. Sınıf</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Ortalama Ücret:</span>
              <span className="font-bold text-emerald-600 text-lg">
                ₺{data.averageFee.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Öğrenci Sayısı:</span>
              <span className="font-semibold text-blue-600">
                {data.studentCount} kişi
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-400 text-xs">Toplam Ciro:</span>
              <span className="font-medium text-gray-600 text-sm">
                ₺{data.totalAmount.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-full">
      {/* Header - Daha büyük ve gradient */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xl">Sınıf Bazında Ortalama Ücretler</h3>
              <p className="text-emerald-100 text-sm mt-0.5">Her sınıfın ortalama eğitim ücreti karşılaştırması</p>
            </div>
          </div>
          <button 
            onClick={fetchClassData}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Veriler yükleniyor...</p>
            </div>
          </div>
        ) : classData.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-gray-400">
            <GraduationCap className="w-16 h-16 mb-3 opacity-40" />
            <p className="text-lg font-medium">Henüz sınıf verisi yok</p>
            <p className="text-sm mt-1">Öğrenci ve taksit verisi eklendiğinde burada görünecek</p>
          </div>
        ) : (
          <>
            {/* Summary Cards - Daha büyük ve 4 kart */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-200" />
                  <p className="text-emerald-100 text-sm font-medium">Genel Ortalama</p>
                </div>
                <p className="text-2xl font-bold">
                  ₺{summary.overallAverage.toLocaleString('tr-TR')}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-200" />
                  <p className="text-blue-100 text-sm font-medium">Toplam Öğrenci</p>
                </div>
                <p className="text-2xl font-bold">
                  {summary.totalStudents}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-200" />
                  <p className="text-green-100 text-sm font-medium">En Yüksek</p>
                </div>
                <p className="text-2xl font-bold">
                  ₺{summary.maxFee.toLocaleString('tr-TR')}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-200 rotate-180" />
                  <p className="text-amber-100 text-sm font-medium">En Düşük</p>
                </div>
                <p className="text-2xl font-bold">
                  ₺{summary.minFee.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            {/* Bar Chart - Daha yüksek */}
            <div className="h-72 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classData}
                  margin={{ top: 30, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="class" 
                    tick={{ fontSize: 14, fill: '#374151', fontWeight: 500 }}
                    tickFormatter={(value) => `${value}. Sınıf`}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K ₺`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                  <Bar 
                    dataKey="averageFee" 
                    radius={[12, 12, 0, 0]}
                    maxBarSize={80}
                  >
                    {classData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList 
                      dataKey="averageFee" 
                      position="top" 
                      formatter={(value: number) => `₺${(value / 1000).toFixed(0)}K`}
                      style={{ fontSize: 13, fill: '#374151', fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend - Daha büyük */}
            <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-gray-100">
              {classData.map((item, index) => (
                <div 
                  key={item.class} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 font-medium text-sm">{item.class}. Sınıf</span>
                  <span className="text-gray-400 text-xs">({item.studentCount} öğrenci)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
