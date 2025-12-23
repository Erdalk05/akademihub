'use client';

import React, { useMemo } from 'react';
import { Brain, Phone, MessageCircle, Calendar, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { analyzeRisk, type RiskAnalysis } from '@/lib/risk/RiskEngine';

interface AIRecommendationCardProps {
  studentName: string;
  totalDebt: number;
  overdueDays?: number;
  className?: string;
}

/**
 * AIRecommendationCard - "Bu öğrenci için ne yapmalısın?" sorusuna cevap verir
 * RiskEngine tabanlı akıllı öneriler
 */
export default function AIRecommendationCard({
  studentName,
  totalDebt,
  overdueDays = 0,
  className = ''
}: AIRecommendationCardProps) {
  const analysis = useMemo<RiskAnalysis>(() => {
    return analyzeRisk({
      totalDebt,
      overdueDays,
      overdueAmount: totalDebt
    });
  }, [totalDebt, overdueDays]);

  // Risk yoksa gösterme
  if (analysis.level === 'none' || analysis.level === 'low') {
    return (
      <div className={`bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-800">Harika!</h4>
            <p className="text-sm text-emerald-600">{studentName} için acil aksiyon gerekmiyor.</p>
          </div>
        </div>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    if (action.includes('Ara') || action.includes('telefon')) return Phone;
    if (action.includes('WhatsApp') || action.includes('mesaj')) return MessageCircle;
    if (action.includes('plan') || action.includes('tarih')) return Calendar;
    if (action.includes('Risk')) return AlertTriangle;
    return TrendingUp;
  };

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-purple-800 flex items-center gap-2">
            AI Asistan
            <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Beta</span>
          </h4>
          <p className="text-sm text-purple-600">{studentName} için öneriler</p>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-2xl font-bold ${analysis.textColor}`}>{analysis.score}</div>
          <div className="text-xs text-gray-500">Risk Skoru</div>
        </div>
      </div>

      <div className="space-y-2">
        {analysis.recommendations.slice(0, 3).map((rec, idx) => {
          const Icon = getActionIcon(rec.action);
          return (
            <div 
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                rec.priority === 'medium' ? 'bg-amber-50 border border-amber-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                rec.priority === 'high' ? 'bg-red-500' :
                rec.priority === 'medium' ? 'bg-amber-500' :
                'bg-blue-500'
              }`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  rec.priority === 'high' ? 'text-red-800' :
                  rec.priority === 'medium' ? 'text-amber-800' :
                  'text-blue-800'
                }`}>
                  {rec.action}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                rec.priority === 'high' ? 'bg-red-200 text-red-700' :
                rec.priority === 'medium' ? 'bg-amber-200 text-amber-700' :
                'bg-blue-200 text-blue-700'
              }`}>
                {rec.priority === 'high' ? 'Acil' : rec.priority === 'medium' ? 'Bu hafta' : 'Planlı'}
              </span>
            </div>
          );
        })}
      </div>

      {analysis.reasons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-purple-200">
          <p className="text-xs text-purple-600 mb-2">Analiz Nedenleri:</p>
          <div className="flex flex-wrap gap-1">
            {analysis.reasons.slice(0, 3).map((reason, idx) => (
              <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
                {reason.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
