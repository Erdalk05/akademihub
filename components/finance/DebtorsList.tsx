'use client';

import React, { useState } from 'react';
import { AlertTriangle, Phone, Mail, CreditCard, User, Clock, ChevronRight, Search, Filter, MessageCircle } from 'lucide-react';

interface DebtorRow {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentNo: string;
  dayOverdue: number;
  riskScore: number;
}

interface DebtorsListProps {
  debtors: DebtorRow[];
  onPaymentClick?: (studentId: string) => void;
  onContactClick?: (studentId: string, type: 'phone' | 'email' | 'whatsapp') => void;
}

export default function DebtorsList({ debtors, onPaymentClick, onContactClick }: DebtorsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'days' | 'risk'>('risk');
  
  const getRiskLevel = (score: number): { color: string; bg: string; border: string; label: string; icon: string } => {
    if (score >= 75) return { 
      color: 'text-red-700', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      label: 'Kritik',
      icon: '🔴'
    };
    if (score >= 50) return { 
      color: 'text-amber-700', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200',
      label: 'Yüksek',
      icon: '🟠'
    };
    return { 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200',
      label: 'Normal',
      icon: '🟢'
    };
  };

  // Filtreleme ve sıralama
  const filteredDebtors = debtors
    .filter(d => d.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'days') return b.dayOverdue - a.dayOverdue;
      return b.riskScore - a.riskScore;
    });

  // Özet istatistikler
  const totalDebt = debtors.reduce((sum, d) => sum + d.amount, 0);
  const criticalCount = debtors.filter(d => d.riskScore >= 75).length;
  const avgOverdue = debtors.length > 0 
    ? Math.round(debtors.reduce((sum, d) => sum + d.dayOverdue, 0) / debtors.length)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Risk Analizi</h2>
              <p className="text-xs text-white/70">Gecikmiş ödemeler</p>
            </div>
          </div>
          
          {/* Mini Özet */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase">Toplam Borç</p>
              <p className="text-sm font-bold text-white">
                ₺{totalDebt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            {criticalCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg">
                <span className="text-xs font-medium text-white">{criticalCount} kritik</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{debtors.length}</p>
          <p className="text-[10px] text-gray-500 uppercase">Borçlu Öğrenci</p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-2xl font-bold text-red-600">{avgOverdue}</p>
          <p className="text-[10px] text-gray-500 uppercase">Ort. Gecikme (Gün)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{criticalCount}</p>
          <p className="text-[10px] text-gray-500 uppercase">Kritik Risk</p>
        </div>
      </div>

      {/* Arama ve Filtre */}
      {debtors.length > 0 && (
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Öğrenci ara..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">Sırala:</span>
            {[
              { value: 'risk', label: 'Risk' },
              { value: 'amount', label: 'Tutar' },
              { value: 'days', label: 'Gün' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value as any)}
                className={`px-2 py-1 rounded transition ${
                  sortBy === opt.value
                    ? 'bg-red-100 text-red-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredDebtors.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-3xl">✨</span>
            </div>
            <p className="text-gray-500 font-medium">Harika! Gecikmiş ödeme yok</p>
            <p className="text-sm text-gray-400 mt-1">Tüm öğrenciler ödemelerini zamanında yapmış</p>
          </div>
        ) : (
          filteredDebtors.slice(0, 10).map((debtor) => {
            const risk = getRiskLevel(debtor.riskScore);
            
            return (
              <div
                key={debtor.id}
                className={`p-4 hover:bg-gray-50 transition ${risk.bg}`}
              >
                <div className="flex items-center justify-between">
                  {/* Sol: Öğrenci Bilgisi */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                      {debtor.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{debtor.studentName}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{debtor.paymentNo}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-red-600">
                          <Clock className="w-3 h-3" />
                          {debtor.dayOverdue} gün gecikmiş
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Orta: Tutar ve Risk */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₺{debtor.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${risk.bg} ${risk.color} border ${risk.border}`}>
                      {risk.icon} {risk.label}
                    </div>
                  </div>

                  {/* Sağ: Aksiyonlar */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPaymentClick?.(debtor.studentId)}
                      className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition"
                      title="Ödeme Al"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onContactClick?.(debtor.studentId, 'whatsapp')}
                      className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onContactClick?.(debtor.studentId, 'phone')}
                      className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition"
                      title="Ara"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <a
                      href={`/students/${debtor.studentId}`}
                      className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                      title="Profil"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Progress Bar - Risk Göstergesi */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        debtor.riskScore >= 75 ? 'bg-red-500' :
                        debtor.riskScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${debtor.riskScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-8">{debtor.riskScore}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {debtors.length > 10 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <a 
            href="/finance/payments" 
            className="text-sm font-medium text-red-600 hover:text-red-700 transition inline-flex items-center gap-1"
          >
            Tüm borçluları gör ({debtors.length})
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
