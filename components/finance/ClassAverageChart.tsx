'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { GraduationCap, TrendingUp, RefreshCw } from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

interface ClassData {
  class: string;
  averageFee: number;
  studentCount: number;
  totalAmount: number;
}

// Renk paleti - her sınıf için farklı renk
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
      // Öğrenci ve taksit verilerini çek
      const orgParam = currentOrganization?.id ? `organization_id=${currentOrganization.id}` : '';
      
      const [studentsRes, installmentsRes] = await Promise.all([
        fetch(`/api/students?${orgParam}`),
        fetch(`/api/installments?${orgParam}&raw=true`)
      ]);

      const studentsData = await studentsRes.json();
      const installmentsData = await installmentsRes.json();

      const students = studentsData.data || [];
      const installments = installmentsData.data || [];

      // Sınıf bazında grupla
      const classMap = new Map<string, { students: Set<string>; totalAmount: number }>();

      // Her taksiti sınıfına göre grupla
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

      // Veriyi formatla
      const data: ClassData[] = Array.from(classMap.entries())
        .map(([className, info]) => ({
          class: className,
          averageFee: info.students.size > 0 ? Math.round(info.totalAmount / info.students.size) : 0,
          studentCount: info.students.size,
          totalAmount: info.totalAmount
        }))
        .filter(d => d.averageFee > 0)
        .sort((a, b) => {
          // Sayısal sınıfları sırala (1, 2, 3...), sonra diğerleri
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

  // Toplam ve ortalama hesapla
  const summary = useMemo(() => {
    if (classData.length === 0) return { totalStudents: 0, overallAverage: 0 };
    const totalStudents = classData.reduce((s, d) => s + d.studentCount, 0);
    const totalAmount = classData.reduce((s, d) => s + d.totalAmount, 0);
    return {
      totalStudents,
      overallAverage: totalStudents > 0 ? Math.round(totalAmount / totalStudents) : 0
    };
  }, [classData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
          <p className="font-bold text-gray-900 mb-1">{data.class}. Sınıf</p>
          <p className="text-emerald-600 font-semibold">
            Ortalama: ₺{data.averageFee.toLocaleString('tr-TR')}
          </p>
          <p className="text-gray-500 text-sm">
            {data.studentCount} öğrenci
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Toplam: ₺{data.totalAmount.toLocaleString('tr-TR')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 border-b border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Sınıf Bazında Ortalama Ücretler</h3>
              <p className="text-xs text-gray-500">Her sınıfın ortalama eğitim ücreti</p>
            </div>
          </div>
          <button 
            onClick={fetchClassData}
            className="p-2 text-gray-400 hover:bg-white rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : classData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <GraduationCap className="w-12 h-12 mb-2 opacity-50" />
            <p>Henüz sınıf verisi yok</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-xs text-gray-500 mb-1">Genel Ortalama</p>
                <p className="text-lg font-bold text-emerald-600">
                  ₺{summary.overallAverage.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Toplam Öğrenci</p>
                <p className="text-lg font-bold text-blue-600">
                  {summary.totalStudents}
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="class" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `${value}.Sınıf`}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="averageFee" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  >
                    {classData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList 
                      dataKey="averageFee" 
                      position="top" 
                      formatter={(value: number) => `${(value / 1000).toFixed(0)}K`}
                      style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {classData.map((item, index) => (
                <div key={item.class} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-600">{item.class}. Sınıf</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
