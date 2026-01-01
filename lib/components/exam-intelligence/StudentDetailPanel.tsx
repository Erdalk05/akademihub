'use client';

/**
 * Student Detail Panel - Öğrenci detay görüntüleme paneli
 * Sağ tarafta açılan çekmece stili panel
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  Phone,
  Mail,
  BookOpen,
  Target,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { StudentResult } from '@/types/exam-intelligence';

interface StudentDetailPanelProps {
  student: StudentResult | null;
  onClose: () => void;
}

export default function StudentDetailPanel({ student, onClose }: StudentDetailPanelProps) {
  if (!student) return null;

  const subjectChartData = student.subjects.map((s) => ({
    subject: s.subjectCode,
    net: s.net,
    success: s.successRate,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-slate-700 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Öğrenci Detayı</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="text-white" size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{student.fullName}</h3>
                <p className="text-slate-400">{student.className}</p>
                <p className="text-sm text-slate-500">No: {student.studentNo}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{student.totalNet.toFixed(1)}</p>
                <p className="text-xs text-slate-400">Net</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{student.percentile}%</p>
                <p className="text-xs text-slate-400">Yüzdelik</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">{student.schoolRank}</p>
                <p className="text-xs text-slate-400">Sıra</p>
              </div>
            </div>

            {/* Trend & Risk */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
                {student.trendDirection === 'up' && (
                  <>
                    <TrendingUp className="text-emerald-400" size={24} />
                    <div>
                      <p className="text-sm font-medium text-emerald-400">Yükseliş</p>
                      <p className="text-xs text-slate-400">
                        {student.netChange !== undefined && `+${student.netChange.toFixed(1)} net`}
                      </p>
                    </div>
                  </>
                )}
                {student.trendDirection === 'down' && (
                  <>
                    <TrendingDown className="text-red-400" size={24} />
                    <div>
                      <p className="text-sm font-medium text-red-400">Düşüş</p>
                      <p className="text-xs text-slate-400">
                        {student.netChange !== undefined && `${student.netChange.toFixed(1)} net`}
                      </p>
                    </div>
                  </>
                )}
                {student.trendDirection === 'stable' && (
                  <>
                    <Minus className="text-slate-400" size={24} />
                    <div>
                      <p className="text-sm font-medium text-slate-400">Stabil</p>
                      <p className="text-xs text-slate-500">Değişim yok</p>
                    </div>
                  </>
                )}
              </div>

              <div
                className={`flex-1 rounded-xl p-3 flex items-center gap-3 ${
                  student.riskLevel === 'critical'
                    ? 'bg-red-500/20'
                    : student.riskLevel === 'high'
                    ? 'bg-orange-500/20'
                    : student.riskLevel === 'medium'
                    ? 'bg-yellow-500/20'
                    : 'bg-emerald-500/20'
                }`}
              >
                <AlertTriangle
                  className={
                    student.riskLevel === 'critical'
                      ? 'text-red-400'
                      : student.riskLevel === 'high'
                      ? 'text-orange-400'
                      : student.riskLevel === 'medium'
                      ? 'text-yellow-400'
                      : 'text-emerald-400'
                  }
                  size={24}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      student.riskLevel === 'critical'
                        ? 'text-red-400'
                        : student.riskLevel === 'high'
                        ? 'text-orange-400'
                        : student.riskLevel === 'medium'
                        ? 'text-yellow-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {student.riskLevel === 'critical' && 'Kritik Risk'}
                    {student.riskLevel === 'high' && 'Yüksek Risk'}
                    {student.riskLevel === 'medium' && 'Orta Risk'}
                    {student.riskLevel === 'low' && 'Düşük Risk'}
                    {student.riskLevel === 'none' && 'Risk Yok'}
                  </p>
                  <p className="text-xs text-slate-400">Z-Score: {student.zScore}</p>
                </div>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-purple-400" />
                Ders Kırılımı
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="subject"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="net" name="Net" radius={[0, 4, 4, 0]}>
                      {subjectChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.success >= 70
                              ? '#10b981'
                              : entry.success >= 50
                              ? '#eab308'
                              : '#ef4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Table */}
            <div className="bg-slate-800/50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400">Ders</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">D</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">Y</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">B</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">Net</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">%</th>
                  </tr>
                </thead>
                <tbody>
                  {student.subjects.map((sub) => (
                    <tr key={sub.subjectCode} className="border-b border-slate-700/50">
                      <td className="py-2 px-3 text-sm text-white">{sub.subjectName}</td>
                      <td className="py-2 px-3 text-center text-sm text-emerald-400">{sub.correct}</td>
                      <td className="py-2 px-3 text-center text-sm text-red-400">{sub.wrong}</td>
                      <td className="py-2 px-3 text-center text-sm text-slate-400">{sub.empty}</td>
                      <td className="py-2 px-3 text-center text-sm font-bold text-white">
                        {sub.net.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-xs font-semibold ${
                            sub.successRate >= 70
                              ? 'text-emerald-400'
                              : sub.successRate >= 50
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {sub.successRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Parent Contact */}
            {(student.parentName || student.parentPhone) && (
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">Veli Bilgileri</h4>
                {student.parentName && (
                  <p className="text-sm text-slate-300 mb-1">{student.parentName}</p>
                )}
                {student.parentPhone && (
                  <a
                    href={`tel:${student.parentPhone}`}
                    className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    <Phone size={14} />
                    {student.parentPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

