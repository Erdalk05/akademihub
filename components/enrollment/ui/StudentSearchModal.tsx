'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, X, User, Calendar, GraduationCap, 
  Phone, RefreshCw, UserCheck, ArrowRight 
} from 'lucide-react';

interface Student {
  id: string;
  student_no: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  tc_id?: string;
  class?: string;
  section?: string;
  academic_year?: string;
  program_name?: string;
  parent_name?: string;
  parent_phone?: string;
  photo_url?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;
  gender?: string;
  blood_type?: string;
  nationality?: string;
  birth_place?: string;
  previous_school?: string;
  health_notes?: string;
  phone2?: string;
}

interface StudentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (student: Student) => void;
  currentAcademicYear?: string;
}

export const StudentSearchModal: React.FC<StudentSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentAcademicYear = '2024-2025'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Öğrenci ara
  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      // Geçen yılın öğrencilerini ara
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&limit=20`);
      const json = await res.json();
      
      if (json.success) {
        // Sadece aktif öğrencileri göster
        const activeStudents = (json.data || []).filter(
          (s: Student) => s.academic_year === currentAcademicYear
        );
        setStudents(activeStudents.length > 0 ? activeStudents : json.data || []);
      }
    } catch (error) {
      console.error('Öğrenci arama hatası:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAcademicYear]);

  // Debounced arama
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchStudents(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchStudents]);

  // Modal kapandığında temizle
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setStudents([]);
      setSelectedStudent(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedStudent) {
      onSelect(selectedStudent);
      onClose();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <UserCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Kayıt Yenileme</h2>
                <p className="text-indigo-200 text-sm">
                  Geçen yıldan öğrenci seçin
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Arama */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrenci adı, soyadı veya numarası ile ara..."
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              autoFocus
            />
            {loading && (
              <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            En az 2 karakter girin. Mevcut yıl: <strong>{currentAcademicYear}</strong>
          </p>
        </div>

        {/* Sonuçlar */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {students.length === 0 && searchQuery.length >= 2 && !loading && (
            <div className="text-center py-8 text-slate-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Öğrenci bulunamadı</p>
            </div>
          )}

          {students.length === 0 && searchQuery.length < 2 && (
            <div className="text-center py-8 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aramaya başlamak için öğrenci bilgisi girin</p>
            </div>
          )}

          <div className="space-y-2">
            {students.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              const fullName = student.full_name || 
                `${student.first_name || ''} ${student.last_name || ''}`.trim() || 
                'İsimsiz';
              
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={fullName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold ${
                        isSelected 
                          ? 'bg-indigo-600' 
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                      }`}>
                        {getInitials(fullName)}
                      </div>
                    )}

                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 truncate">
                          {fullName}
                        </h3>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                            Seçili
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                            #{student.student_no}
                          </span>
                        </span>
                        
                        {student.class && (
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} className="text-slate-400" />
                            {student.class}{student.section ? `-${student.section}` : ''}
                          </span>
                        )}
                        
                        {student.academic_year && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-slate-400" />
                            {student.academic_year}
                          </span>
                        )}
                      </div>

                      {student.parent_name && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <User size={12} />
                          <span>{student.parent_name}</span>
                          {student.parent_phone && (
                            <>
                              <Phone size={12} />
                              <span>{student.parent_phone}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Seçim İkonu */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isSelected ? <UserCheck size={20} /> : <ArrowRight size={20} />}
                    </div>
                  </div>

                  {/* Program bilgisi */}
                  {student.program_name && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        <GraduationCap size={12} />
                        {student.program_name}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium"
          >
            Vazgeç
          </button>
          
          <button
            onClick={handleSelect}
            disabled={!selectedStudent}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition ${
              selectedStudent
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <UserCheck size={18} />
            Öğrenciyi Seç ve Devam Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSearchModal;

