'use client';

import React, { useState } from 'react';
import { GraduationCap, Plus, X } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { Section } from '../ui/Section';
import { ACADEMIC_YEARS } from '../types';

export const EducationSection = () => {
  const { education, updateEducation } = useEnrollmentStore();
  const [customYears, setCustomYears] = useState<string[]>([]);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYearStart, setNewYearStart] = useState('');

  const handleAddCustomYear = () => {
    if (newYearStart && !isNaN(Number(newYearStart))) {
      const year = parseInt(newYearStart);
      const newYear = `${year}-${year + 1}`;
      if (!allYears.find(y => y.id === newYear)) {
        setCustomYears([...customYears, newYear]);
        updateEducation({ academicYear: newYear });
      }
      setNewYearStart('');
      setShowAddYear(false);
    }
  };

  const handleRemoveCustomYear = (year: string) => {
    setCustomYears(customYears.filter(y => y !== year));
    if (education.academicYear === year) {
      updateEducation({ academicYear: ACADEMIC_YEARS[1]?.id || '' });
    }
  };

  // Tüm yılları birleştir
  const allYears = [
    ...ACADEMIC_YEARS,
    ...customYears.map(y => ({ id: y, name: y, status: 'custom' }))
  ].sort((a, b) => b.id.localeCompare(a.id));

  const currentYear = new Date().getFullYear();

  return (
    <Section title="Eğitim Bilgileri" icon={GraduationCap}>
      <div className="space-y-4">
        {/* Eğitim Yılı Seçimi */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-indigo-800">
              📅 Eğitim Yılı Seçimi
            </label>
            <button
              type="button"
              onClick={() => setShowAddYear(!showAddYear)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={14} />
              Yıl Ekle
            </button>
          </div>

          {/* Yıl Ekleme Formu */}
          {showAddYear && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-indigo-200 flex items-center gap-3">
              <input
                type="number"
                value={newYearStart}
                onChange={(e) => setNewYearStart(e.target.value)}
                placeholder={`${currentYear}`}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="2020"
                max="2035"
              />
              <span className="text-slate-500">-</span>
              <span className="text-slate-600 font-medium">
                {newYearStart ? `${parseInt(newYearStart) + 1}` : '____'}
              </span>
              <button
                type="button"
                onClick={handleAddCustomYear}
                disabled={!newYearStart}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => { setShowAddYear(false); setNewYearStart(''); }}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Yıl Seçenekleri */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {allYears.map((year) => {
              const isSelected = education.academicYear === year.id;
              const isCustom = year.status === 'custom';
              const isPast = year.status === 'past';
              const isCurrent = year.status === 'current';
              
              return (
                <div key={year.id} className="relative">
                  <button
                    type="button"
                    onClick={() => updateEducation({ academicYear: year.id })}
                    className={`
                      w-full px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg'
                        : isPast
                          ? 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                          : isCurrent
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400'
                            : isCustom
                              ? 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400'
                              : 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300'
                      }
                    `}
                  >
                    <span className="block">{year.name}</span>
                  </button>
                  
                  {/* Manuel eklenen yılları silme butonu */}
                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveCustomYear(year.id); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Seçili Yıl Bilgisi */}
          {education.academicYear && (
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <p className="text-sm text-indigo-700">
                <strong>Seçili:</strong> {education.academicYear} Eğitim Yılı
                {education.programName && ` • ${education.programName}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};
