'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ModernDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Tarih seçin',
  required = false,
  error,
  minYear = 1950,
  maxYear = 2030,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or use today
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDate = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  // Update viewDate when value changes
  useEffect(() => {
    if (value) {
      setViewDate(parseDate(value));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = newDate.getFullYear();
    const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setViewMode('days');
  };

  const handleSelectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('months');
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      const isToday = 
        today.getDate() === day && 
        today.getMonth() === month && 
        today.getFullYear() === year;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleSelectDate(day)}
          className={`
            w-8 h-8 rounded-lg text-sm font-medium transition-all
            ${isSelected 
              ? 'bg-indigo-600 text-white shadow-md' 
              : isToday 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'text-slate-700 hover:bg-slate-100'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const renderMonths = () => {
    return MONTHS_TR.map((month, index) => {
      const isSelected = viewDate.getMonth() === index;
      return (
        <button
          key={month}
          type="button"
          onClick={() => handleSelectMonth(index)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${isSelected 
              ? 'bg-indigo-600 text-white' 
              : 'text-slate-700 hover:bg-slate-100'
            }
          `}
        >
          {month}
        </button>
      );
    });
  };

  const renderYears = () => {
    const years = [];
    const currentDecade = Math.floor(viewDate.getFullYear() / 10) * 10;
    
    for (let year = currentDecade - 10; year <= currentDecade + 19; year++) {
      if (year >= minYear && year <= maxYear) {
        const isSelected = viewDate.getFullYear() === year;
        years.push(
          <button
            key={year}
            type="button"
            onClick={() => handleSelectYear(year)}
            className={`
              px-2 py-1.5 rounded-lg text-sm font-medium transition-all
              ${isSelected 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-700 hover:bg-slate-100'
              }
            `}
          >
            {year}
          </button>
        );
      }
    }
    return years;
  };

  const handlePrevYears = () => {
    setViewDate(new Date(viewDate.getFullYear() - 10, viewDate.getMonth(), 1));
  };

  const handleNextYears = () => {
    setViewDate(new Date(viewDate.getFullYear() + 10, viewDate.getMonth(), 1));
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2.5 pl-10
            border rounded-lg text-sm cursor-pointer
            transition-all duration-200
            flex items-center justify-between
            ${error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}
            ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}
          `}
        >
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <span className={selectedDate ? 'text-slate-900' : 'text-slate-400'}>
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </span>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 hover:bg-slate-100 rounded"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              {viewMode === 'days' && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('months')}
                      className="px-2 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {MONTHS_TR[viewDate.getMonth()]}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('years')}
                      className="px-2 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {viewDate.getFullYear()}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </>
              )}
              
              {viewMode === 'months' && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('years')}
                    className="px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {viewDate.getFullYear()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </>
              )}
              
              {viewMode === 'years' && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevYears}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800">
                    {Math.floor(viewDate.getFullYear() / 10) * 10} - {Math.floor(viewDate.getFullYear() / 10) * 10 + 9}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextYears}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </>
              )}
            </div>

            {/* Calendar Grid */}
            {viewMode === 'days' && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_TR.map((day) => (
                    <div key={day} className="w-8 h-6 flex items-center justify-center text-xs font-semibold text-slate-500">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderDays()}
                </div>
              </>
            )}

            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2">
                {renderMonths()}
              </div>
            )}

            {viewMode === 'years' && (
              <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto">
                {renderYears()}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = (today.getMonth() + 1).toString().padStart(2, '0');
                  const day = today.getDate().toString().padStart(2, '0');
                  onChange(`${year}-${month}-${day}`);
                  setIsOpen(false);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('days');
                  setIsOpen(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
      
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ModernDatePicker;

