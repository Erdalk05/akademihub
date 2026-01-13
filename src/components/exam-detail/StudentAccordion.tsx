'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { StudentTableRow } from '@/types/exam-detail';

// =============================================================================
// PROPS
// =============================================================================

interface StudentAccordionProps {
  student: StudentTableRow;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function StudentAccordion({ student }: StudentAccordionProps) {
  const [open, setOpen] = useState(false);

  const hasSections =
    Array.isArray(student.sectionResults) &&
    student.sectionResults.length > 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* HEADER */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-900">
            {student.name}
          </p>
          <p className="text-xs text-gray-500">
            Net: <span className="font-medium">{student.totalNet.toFixed(1)}</span>
          </p>
        </div>

        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* CONTENT */}
      {open && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          {/* SUMMARY */}
          <div className="grid grid-cols-4 gap-2 mb-3 text-center">
            <Stat label="Doğru" value={student.totalCorrect} />
            <Stat label="Yanlış" value={student.totalWrong} />
            <Stat label="Boş" value={student.totalBlank} />
            <Stat label="Net" value={student.totalNet.toFixed(1)} />
          </div>

          {/* SECTION RESULTS */}
          {hasSections ? (
            <div className="space-y-2">
              {student.sectionResults!.map((sec) => (
                <div
                  key={sec.sectionId}
                  className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-200"
                >
                  <span className="text-sm text-gray-700">
                    {sec.sectionName}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {sec.net.toFixed(1)} net
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              Ders bazlı sonuç yok
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SMALL STAT COMPONENT
// =============================================================================

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg px-2 py-2 border border-gray-200">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
