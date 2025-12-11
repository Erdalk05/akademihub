'use client';

import React, { useState } from 'react';
import { GraduationCap, Plus, X, Edit3 } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { Section } from '../ui/Section';
import { FormSelect } from '../ui/FormField';
import { PROGRAMS, GRADES, BRANCHES, STUDENT_TYPES, ACADEMIC_YEARS } from '../types';

export const EducationSection = () => {
  const { education, updateEducation } = useEnrollmentStore();
  const [customYears, setCustomYears] = useState<string[]>([]);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYearStart, setNewYearStart] = useState('');
  const [showCustomGrade, setShowCustomGrade] = useState(false);
  const [customGrade, setCustomGrade] = useState('');

  const handleProgramChange = (programId: string) => {
    const program = PROGRAMS.find(p => p.id === programId);
    if (program) {
      updateEducation({ 
        programId: program.id,
        programName: program.name 
      });
    }
  };

  const handleGradeChange = (gradeId: string) => {
    if (gradeId === 'other') {
      setShowCustomGrade(true);
      return;
    }
    setShowCustomGrade(false);
    const grade = GRADES.find(g => g.id === gradeId);
    if (grade) {
      updateEducation({ 
        gradeId: grade.id,
        gradeName: grade.name 
      });
    }
  };

  const handleCustomGradeSubmit = () => {
    if (customGrade.trim()) {
      updateEducation({ 
        gradeId: `custom:${customGrade.trim()}`,
        gradeName: customGrade.trim()
      });
    }
  };

  const handleBranchChange = (branchId: string) => {
    const branch = BRANCHES.find(b => b.id === branchId);
    if (branch) {
      updateEducation({ 
        branchId: branch.id,
        branchName: branch.name 
      });
    }
  };

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
        {/* Ana Alanlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormSelect
            label="Eğitim Programı"
            options={PROGRAMS.map((p) => ({ value: p.id, label: p.name }))}
            value={education.programId}
            onChange={(e) => handleProgramChange(e.target.value)}
            required
          />

          <div>
            <FormSelect
              label="Sınıf"
              options={[
                ...GRADES.map((g) => ({ value: g.id, label: g.name })),
                { value: 'other', label: '📝 Diğer (Manuel Giriş)' }
              ]}
              value={education.gradeId?.startsWith('custom:') ? 'other' : education.gradeId}
              onChange={(e) => handleGradeChange(e.target.value)}
              required
            />
            
            {/* Manuel Sınıf Girişi */}
            {(showCustomGrade || education.gradeId?.startsWith('custom:')) && (
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    value={education.gradeId?.startsWith('custom:') ? education.gradeId.replace('custom:', '') : customGrade}
                    onChange={(e) => {
                      setCustomGrade(e.target.value);
                      updateEducation({ 
                        gradeId: `custom:${e.target.value}`,
                        gradeName: e.target.value
                      });
                    }}
                    placeholder="Sınıf adını yazın (örn: Anaokulu, Hazırlık)"
                    className="w-full h-10 pl-10 pr-4 border-2 border-emerald-400 rounded-lg text-sm outline-none bg-emerald-50 focus:bg-white focus:ring-2 focus:ring-emerald-300"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomGrade(false);
                    setCustomGrade('');
                    updateEducation({ gradeId: '', gradeName: '' });
                  }}
                  className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <FormSelect
            label="Alan / Branş"
            options={BRANCHES.map((b) => ({ value: b.id, label: b.name }))}
            value={education.branchId}
            onChange={(e) => handleBranchChange(e.target.value)}
          />

          <FormSelect
            label="Kayıt Türü"
            options={STUDENT_TYPES.map((t) => ({ value: t.id, label: t.name }))}
            value={education.studentType}
            onChange={(e) => updateEducation({ studentType: e.target.value as any })}
          />
        </div>

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
                    <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'opacity-60'}`}>
                      {isPast && '(Geçmiş)'}
                      {isCurrent && '(Mevcut)'}
                      {year.status === 'future' && '(Gelecek)'}
                      {isCustom && '(Manuel)'}
                    </span>
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
