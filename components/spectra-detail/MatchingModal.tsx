'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserCheck, UserX, AlertTriangle, Check, Loader2 } from 'lucide-react';
import type { MatchingState, MatchCandidate } from '@/types/spectra-detail';

// ============================================================================
// MATCHING MODAL COMPONENT
// Manuel öğrenci eşleştirme modalı
// ============================================================================

interface MatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingParticipants: {
    id: string;
    opticalName: string;
    opticalStudentNo: string;
    guestClass: string;
  }[];
  availableStudents: {
    id: string;
    studentNo: string;
    name: string;
    className: string;
  }[];
  onMatch: (participantId: string, studentId: string | null, isGuest: boolean) => Promise<void>;
}

export function MatchingModal({
  isOpen,
  onClose,
  pendingParticipants,
  availableStudents,
  onMatch,
}: MatchingModalProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);

  // Seçili katılımcı bilgisi
  const currentParticipant = pendingParticipants.find((p) => p.id === selectedParticipant);

  // Filtrelenmiş öğrenci listesi
  const filteredStudents = availableStudents.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.studentNo.toLowerCase().includes(query) ||
      s.className.toLowerCase().includes(query)
    );
  });

  // Modal açıldığında ilk katılımcıyı seç
  useEffect(() => {
    if (isOpen && pendingParticipants.length > 0 && !selectedParticipant) {
      setSelectedParticipant(pendingParticipants[0].id);
    }
  }, [isOpen, pendingParticipants, selectedParticipant]);

  // Eşleştirme işlemi
  const handleMatch = async (studentId: string | null, isGuest: boolean) => {
    if (!selectedParticipant || isMatching) return;

    setIsMatching(true);
    try {
      await onMatch(selectedParticipant, studentId, isGuest);
      setMatchedCount((prev) => prev + 1);

      // Sonraki katılımcıya geç
      const currentIndex = pendingParticipants.findIndex((p) => p.id === selectedParticipant);
      if (currentIndex < pendingParticipants.length - 1) {
        setSelectedParticipant(pendingParticipants[currentIndex + 1].id);
      } else {
        // Tüm eşleştirmeler tamamlandı
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } finally {
      setIsMatching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Öğrenci Eşleştirme</h2>
              <p className="text-sm text-white/80">
                {pendingParticipants.length - matchedCount} öğrenci eşleşme bekliyor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sol: Bekleyen öğrenciler */}
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
            <div className="p-3 bg-gray-50 border-b border-slate-200 sticky top-0">
              <h3 className="font-semibold text-sm text-gray-700">Bekleyen Katılımcılar</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingParticipants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => setSelectedParticipant(participant.id)}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedParticipant === participant.id
                      ? 'bg-amber-50 border-l-4 border-amber-500'
                      : ''
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {participant.opticalName || 'İsimsiz'}
                  </p>
                  <p className="text-xs text-gray-500">
                    No: {participant.opticalStudentNo || '-'} • {participant.guestClass || '-'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Sağ: Eşleştirme alanı */}
          <div className="flex-1 flex flex-col">
            {currentParticipant ? (
              <>
                {/* Seçili katılımcı bilgisi */}
                <div className="p-4 bg-amber-50 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <UserX className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {currentParticipant.opticalName || 'İsimsiz'}
                      </p>
                      <p className="text-sm text-gray-600">
                        No: {currentParticipant.opticalStudentNo || '-'} •{' '}
                        {currentParticipant.guestClass || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arama */}
                <div className="p-3 border-b border-slate-200">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Öğrenci ara (isim, numara)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Öğrenci listesi */}
                <div className="flex-1 overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleMatch(student.id, false)}
                        disabled={isMatching}
                        className="w-full p-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                            <p className="text-xs text-gray-500">
                              No: {student.studentNo} • {student.className}
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {isMatching ? (
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                          ) : (
                            <Check className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                      </button>
                    ))}

                    {filteredStudents.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <p>Eşleşen öğrenci bulunamadı.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Misafir olarak işaretle */}
                <div className="p-3 border-t border-slate-200 bg-gray-50">
                  <button
                    onClick={() => handleMatch(null, true)}
                    disabled={isMatching}
                    className="w-full py-2.5 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isMatching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserX className="w-4 h-4" />
                    )}
                    Misafir Olarak İşaretle
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Eşleştirilecek katılımcı seçin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-emerald-600">{matchedCount}</span> /{' '}
            {pendingParticipants.length} eşleştirildi
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchingModal;

