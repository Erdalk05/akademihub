'use client';

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

type CalendarDay = {
  date: string;
  income: number;
  expense: number;
  hasOverdue: boolean;
};

interface PaymentCalendarProps {
  days: CalendarDay[];
}

const dayNames = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export default function PaymentCalendar({ days }: PaymentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  if (!days.length) {
    return null; // Veri yoksa hiç gösterme
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  
  const firstDate = new Date(days[0].date);
  const year = firstDate.getFullYear();
  const month = firstDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const startIndex = (startDay + 6) % 7;

  const map = new Map<string, CalendarDay>();
  days.forEach((d) => map.set(d.date, d));

  // Tüm ayın günlerini oluştur
  const allCells: (CalendarDay | null)[] = [];
  for (let i = 0; i < startIndex; i += 1) allCells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateObj = new Date(year, month, d);
    const key = dateObj.toISOString().slice(0, 10);
    allCells.push(map.get(key) || { date: key, income: 0, expense: 0, hasOverdue: false });
  }

  // Haftalık görünüm için bu haftanın günlerini al
  const getWeekDays = () => {
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekDays: (CalendarDay | null)[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      const key = date.toISOString().slice(0, 10);
      weekDays.push(map.get(key) || { date: key, income: 0, expense: 0, hasOverdue: false });
    }
    return weekDays;
  };

  const weekCells = getWeekDays();
  const displayCells = viewMode === 'week' ? weekCells : allCells;

  // Seçili günün detayları
  const selectedDayData = selectedDate ? map.get(selectedDate) : null;

  // Özet istatistikler
  const totalIncome = days.reduce((sum, d) => sum + d.income, 0);
  const overdueCount = days.filter(d => d.hasOverdue).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Kompakt Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/80" />
          <span className="text-sm font-semibold text-white">
            {monthNames[month]} {year}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Özet */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-white/60">Beklenen:</span>
            <span className="font-bold text-emerald-300">₺{(totalIncome / 1000).toFixed(0)}K</span>
            {overdueCount > 0 && (
              <span className="flex items-center gap-0.5 text-red-300">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount}
              </span>
            )}
          </div>
          
          {/* Görünüm Değiştirici */}
          <div className="flex bg-white/20 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('week')}
              className={`px-2 py-0.5 text-[10px] rounded transition ${
                viewMode === 'week' ? 'bg-white text-indigo-600 font-medium' : 'text-white/80'
              }`}
            >
              Hafta
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 py-0.5 text-[10px] rounded transition ${
                viewMode === 'month' ? 'bg-white text-indigo-600 font-medium' : 'text-white/80'
              }`}
            >
              Ay
            </button>
          </div>
        </div>
      </div>

      <div className="p-3">
        {/* Gün başlıkları */}
        <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-1 mb-1`}>
          {dayNames.map((d, i) => (
            <div key={i} className="text-center text-[9px] font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Takvim - Haftalık veya Aylık */}
        <div className={`grid grid-cols-7 gap-1 ${viewMode === 'month' ? 'max-h-32 overflow-hidden' : ''}`}>
          {displayCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            
            const dateObj = new Date(cell.date);
            const dayNum = dateObj.getDate();
            const isToday = todayStr === cell.date;
            const isSelected = selectedDate === cell.date;
            const hasData = cell.income > 0 || cell.expense > 0;
            
            return (
              <button
                key={cell.date}
                onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                className={`
                  aspect-square rounded flex flex-col items-center justify-center transition-all relative text-[10px]
                  ${isToday ? 'ring-1 ring-indigo-500 bg-indigo-50' : ''}
                  ${isSelected ? 'bg-indigo-100 shadow-sm' : 'hover:bg-gray-50'}
                  ${cell.hasOverdue ? 'bg-red-50' : ''}
                `}
              >
                <span className={`font-medium ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {dayNum}
                </span>
                
                {/* Göstergeler */}
                {(hasData || cell.hasOverdue) && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {cell.income > 0 && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                    {cell.expense > 0 && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                  </div>
                )}
                
                {/* Gecikme işareti */}
                {cell.hasOverdue && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Seçili Gün Detayı - Kompakt */}
        {selectedDayData && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">
              {new Date(selectedDayData.date).toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'short',
                weekday: 'short'
              })}
              {selectedDayData.hasOverdue && <span className="ml-1 text-red-500">⚠️</span>}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600">+₺{selectedDayData.income.toLocaleString('tr-TR')}</span>
              <span className="text-rose-600">-₺{selectedDayData.expense.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        )}

        {/* Lejant - Tek satır */}
        <div className="mt-2 flex items-center justify-center gap-4 text-[9px] text-gray-400">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Gelir</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Gider</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Gecikmiş</span>
        </div>
      </div>
    </div>
  );
}
