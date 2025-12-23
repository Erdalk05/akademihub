'use client';

import React, { useMemo } from 'react';
import { Brain, Phone, MessageCircle, FileText, AlertTriangle, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { analyzeRisk, type RiskAnalysis } from '@/lib/risk/RiskEngine';

interface StudentData {
  id: string;
  name: string;
  totalDebt: number;
  overdueDays: number;
  phone?: string;
}

interface AIRecommendationCardProps {
  student: StudentData;
  className?: string;
}

/**
 * AIRecommendationCard - "Bu öğrenci için ne yapmalısın?" sorusuna cevap verir
 * RiskEngine tabanlı akıllı öneri sistemi
 */
export default function AIRecommendationCard({ student, className = '' }: AIRecommendationCardProps) {
  // RiskEngine analizi
  const analysis = useMemo<RiskAnalysis>(() => {
    return analyzeRisk({
      totalDebt: student.totalDebt,
      overdueDays: student.overdueDays,
      overdueAmount: student.totalDebt
    });
  }, [student.totalDebt, student.overdueDays]);

  // Aksiyon önerileri oluştur
  const actions = useMemo(() => {
    const items: {
      icon: React.ElementType;
      label: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      action?: () => void;
      href?: string;
    }[] = [];

    if (analysis.level === 'critical' || analysis.level === 'high') {
      // Kritik: Hemen ara
      items.push({
        icon: Phone,
        label: 'Hemen Ara',
        description: 'Veli ile acil görüşme yap',
        priority: 'high',
        action: () => {
          if (student.phone) {
            window.open(`tel:${student.phone}`, '_self');
          }
        }
      });
    }

    if (analysis.level !== 'none' && analysis.level !== 'low') {
      // WhatsApp hatırlatma
      items.push({
        icon: MessageCircle,
        label: 'WhatsApp Gönder',
        description: 'Ödeme hatırlatması gönder',
        priority: analysis.level === 'critical' ? 'high' : 'medium',
        action: () => {
          const msg = encodeURIComponent(
            `Sayın Veli, ${student.name} adlı öğrencinizin ₺${student.totalDebt.toLocaleString('tr-TR')} tutarında ödeme borcunu hatırlatmak isteriz.`
          );
          window.open(`https://wa.me/?text=${msg}`, '_blank');
        }
      });
    }

    // Ödeme planı önerisi
    if (student.totalDebt > 10000) {
      items.push({
        icon: FileText,
        label: 'Ödeme Planı Oluştur',
        description: 'Taksitlendirme planı öner',
        priority: 'medium',
        href: `/students/${student.id}?tab=education`
      });
    }

    // Risk analizi detayı
    items.push({
      icon: TrendingUp,
      label: 'Detaylı Analiz',
      description: 'Risk raporunu incele',
      priority: 'low',
      href: `/students/${student.id}`
    });

    return items;
  }, [analysis, student]);

  if (analysis.level === 'none') {
    return null; // Risk yoksa kart gösterme
  }

  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Brain className="w-5 h-5" />
          <span className="font-bold text-sm">AI Öneri</span>
          <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
        </div>
        <p className="text-indigo-100 text-xs mt-1">"{student.name} için ne yapmalısın?"</p>
      </div>

      {/* Risk Özeti */}
      <div className="px-4 py-3 border-b border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              analysis.level === 'critical' ? 'bg-red-500' :
              analysis.level === 'high' ? 'bg-orange-500' :
              analysis.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
            }`}>
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{analysis.label}</p>
              <p className="text-gray-500 text-xs">Skor: {analysis.score}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${analysis.bgColor} ${analysis.textColor}`}>
            {analysis.level === 'critical' ? 'ACİL' : 
             analysis.level === 'high' ? 'ÖNCELİKLİ' : 
             analysis.level === 'medium' ? 'TAKİP' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* Önerilen Aksiyonlar */}
      <div className="p-3 space-y-2">
        {actions.slice(0, 3).map((action, idx) => {
          const Icon = action.icon;
          const content = (
            <div className={`flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer ${
              action.priority === 'high' ? 'bg-red-50 hover:bg-red-100 border border-red-200' :
              action.priority === 'medium' ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200' :
              'bg-white hover:bg-gray-50 border border-gray-200'
            }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                action.priority === 'high' ? 'bg-red-500' :
                action.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
              }`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{action.label}</p>
                <p className="text-gray-500 text-xs truncate">{action.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          );

          if (action.href) {
            return <Link key={idx} href={action.href}>{content}</Link>;
          }

          return (
            <div key={idx} onClick={action.action}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Alt Bilgi */}
      {analysis.recommendations.length > 0 && (
        <div className="px-4 py-2 bg-indigo-100/50 border-t border-indigo-200">
          <p className="text-xs text-indigo-700">
            💡 {analysis.recommendations[0]?.action}
          </p>
        </div>
      )}
    </div>
  );
}
