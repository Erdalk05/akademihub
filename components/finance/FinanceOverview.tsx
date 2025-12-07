'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  AlertCircle,
  Activity,
} from 'lucide-react';

interface KPIData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  outstandingAmount: number;
  incomeChange: number;
  expenseChange: number;
  profitChange: number;
  outstandingChange: number;
}

interface FinanceOverviewProps {
  data: KPIData;
}

export default function FinanceOverview({ data }: FinanceOverviewProps) {
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* KART 1 — NET DURUM */}
      <div className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium opacity-80">Net Durum (Gelir - Gider)</p>
            <p className="mt-2 text-3xl font-bold">
              {data.netProfit.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </p>
          </div>
          <div className="bg-white/15 rounded-full p-3">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {data.profitChange >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-200" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-200" />
          )}
          <span className="font-semibold">
            {data.profitChange >= 0 ? '+' : ''}
            {data.profitChange}% Geçen aya göre
          </span>
        </div>
      </div>

      {/* KART 2 — TOPLAM GELİR */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Toplam Gelir
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {data.totalIncome.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-full p-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {data.incomeChange >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-500" />
          )}
              <span
            className={`font-semibold ${
              data.incomeChange >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
            {data.incomeChange >= 0 ? '+' : ''}
            {data.incomeChange}% Bu ay
              </span>
            </div>
      </div>

      {/* KART 3 — TOPLAM GİDER */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-rose-100 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
              Toplam Gider
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {data.totalExpenses.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </p>
          </div>
          <div className="bg-rose-50 rounded-full p-3">
            <CreditCard className="w-6 h-6 text-rose-600" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {data.expenseChange >= 0 ? (
            <TrendingUp className="w-4 h-4 text-rose-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          )}
          <span
            className={`font-semibold ${
              data.expenseChange >= 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {data.expenseChange >= 0 ? '+' : ''}
            {data.expenseChange}% Bu ay
          </span>
        </div>
      </div>

      {/* KART 4 — NAKİT AKIŞI (Önümüzdeki 30 Gün) */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-indigo-100 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Nakit Akışı (30 Gün)
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {(data.netProfit > 0 ? data.netProfit : data.totalIncome - data.totalExpenses).toLocaleString(
                'tr-TR',
                { style: 'currency', currency: 'TRY' },
              )}
            </p>
          </div>
          <div className="bg-indigo-50 rounded-full p-3">
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
            <span>Beklenen giriş / çıkış dengesi</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                data.netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    5,
                    Math.abs(
                      data.totalIncome > 0
                        ? (data.netProfit / data.totalIncome) * 100
                        : 50,
                    ),
                  ),
                )}%`,
              }}
      />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
          <span>Gelir</span>
          <span>
            {data.totalIncome.toLocaleString('tr-TR', {
              style: 'currency',
              currency: 'TRY',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
