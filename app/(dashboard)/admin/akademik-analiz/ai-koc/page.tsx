/**
 * ============================================
 * AkademiHub - AI Koç Merkezi
 * ============================================
 * 
 * PHASE 8.5 - AI Coach Center
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Users, GraduationCap, Sparkles } from 'lucide-react';

type RoleFilter = 'student' | 'parent' | 'teacher';

export default function AIKocPage() {
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('student');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/akademik-analiz"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              AI Koç Merkezi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Kişiselleştirilmiş AI destekli akademik raporlar
            </p>
          </div>
        </div>
        
        {/* Role Filter */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-8 w-fit">
          <RoleButton
            active={selectedRole === 'student'}
            onClick={() => setSelectedRole('student')}
            icon={<User className="w-4 h-4" />}
            label="Öğrenci"
          />
          <RoleButton
            active={selectedRole === 'parent'}
            onClick={() => setSelectedRole('parent')}
            icon={<Users className="w-4 h-4" />}
            label="Veli"
          />
          <RoleButton
            active={selectedRole === 'teacher'}
            onClick={() => setSelectedRole('teacher')}
            icon={<GraduationCap className="w-4 h-4" />}
            label="Öğretmen"
          />
        </div>
        
        {/* Role Description */}
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              {selectedRole === 'student' ? '🎓' : selectedRole === 'parent' ? '👨‍👩‍👧' : '👩‍🏫'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedRole === 'student' && 'Öğrenci Raporları'}
                {selectedRole === 'parent' && 'Veli Raporları'}
                {selectedRole === 'teacher' && 'Öğretmen Raporları'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {selectedRole === 'student' && 'Motive edici, eylem odaklı ve kısa öneriler. Öğrencinin başarabileceğine olan güveni artırır.'}
                {selectedRole === 'parent' && 'Sakin, çözüm odaklı ve panik yaratmayan dil. "Birlikte ne yapabiliriz?" yaklaşımı.'}
                {selectedRole === 'teacher' && 'Analitik, veri referanslı ve müdahale önerili. Profesyonel pedagojik dil.'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Student List Placeholder */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {selectedRole === 'student' && 'Öğrenci Seç'}
              {selectedRole === 'parent' && 'Öğrenci Seç (Veli Raporu)'}
              {selectedRole === 'teacher' && 'Sınıf / Ders Seç'}
            </h2>
          </div>
          
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              AI Raporları Hazırlanıyor
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Sınav verisi yüklendikten sonra AI koç raporları otomatik oluşturulur.
            </p>
            <Link
              href="/admin/akademik-analiz/yukle"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Veri Yükle
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function RoleButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
        active
          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

