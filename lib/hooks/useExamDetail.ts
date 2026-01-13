// ============================================================================
// useExamDetail Hook
// Sınav detay sayfası için veri yönetimi
// ============================================================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  Exam,
  ExamSection,
  ExamParticipant,
  ExamResult,
  ExamResultSection,
  StudentTableRow,
  ExamStatistics,
  StudentFilters,
} from '@/types/exam-detail';

// =============================================================================
// TYPES
// =============================================================================

interface UseExamDetailReturn {
  // Data
  exam: Exam | null;
  sections: ExamSection[];
  students: StudentTableRow[];
  statistics: ExamStatistics | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Filters
  filters: StudentFilters;
  setFilters: (filters: StudentFilters) => void;
  
  // Actions
  refresh: () => Promise<void>;
}

interface RawStudentData {
  participant: ExamParticipant;
  result: ExamResult;
  sectionResults: ExamResultSection[];
  studentNo?: string;
  className?: string;
}

// =============================================================================
// HOOK
// =============================================================================

export function useExamDetail(examId: string): UseExamDetailReturn {
  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [rawStudents, setRawStudents] = useState<RawStudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    participantType: 'all',
    sortBy: 'rank',
    sortOrder: 'asc',
  });

  const supabase = createClient();

  // ---------------------------------------------------------------------------
  // FETCH DATA
  // ---------------------------------------------------------------------------

  const fetchExamData = useCallback(async () => {
    if (!examId) {
      setError('Exam ID eksik');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Exam bilgisi
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, organization_id, name, exam_type, exam_date, total_questions, is_published, created_at')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      if (!examData) throw new Error('Sınav bulunamadı');

      setExam(examData as Exam);

      // 2. Sections (dersler)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('exam_sections')
        .select('id, exam_id, name, code, question_count, sort_order')
        .eq('exam_id', examId)
        .order('sort_order', { ascending: true });

      if (sectionsError) throw sectionsError;
      setSections((sectionsData || []) as ExamSection[]);

      // 3. Participants + Results (JOIN)
      const { data: participantsData, error: participantsError } = await supabase
        .from('exam_participants')
        .select(`
          id,
          exam_id,
          organization_id,
          person_id,
          student_id,
          participant_type,
          guest_name,
          match_status,
          match_confidence,
          created_at,
          exam_results (
            id,
            exam_participant_id,
            total_correct,
            total_wrong,
            total_blank,
            total_net,
            class_rank,
            organization_rank,
            percentile,
            created_at
          )
        `)
        .eq('exam_id', examId);

      if (participantsError) throw participantsError;

      // 4. Her participant için section results + student info al
      const studentsWithDetails: RawStudentData[] = [];

      for (const participant of (participantsData || [])) {
        const result = Array.isArray(participant.exam_results) 
          ? participant.exam_results[0] 
          : participant.exam_results;

        if (!result) continue;

        // Section results
        const { data: sectionResults } = await supabase
          .from('exam_result_sections')
          .select('id, exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net')
          .eq('exam_result_id', result.id);

        // Student info (eğer student_id varsa)
        let studentNo: string | undefined;
        let className: string | undefined;

        if (participant.student_id) {
          const { data: studentData } = await supabase
            .from('students')
            .select('student_no, class_id, classes(name)')
            .eq('id', participant.student_id)
            .single();

          if (studentData) {
            studentNo = studentData.student_no;
            className = (studentData as any).classes?.name;
          }
        }

        studentsWithDetails.push({
          participant: participant as ExamParticipant,
          result: result as ExamResult,
          sectionResults: (sectionResults || []) as ExamResultSection[],
          studentNo,
          className,
        });
      }

      setRawStudents(studentsWithDetails);

    } catch (err: any) {
      console.error('Exam detail fetch error:', err);
      setError(err.message || 'Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [examId, supabase]);

  // Initial load
  useEffect(() => {
    fetchExamData();
  }, [fetchExamData]);

  // ---------------------------------------------------------------------------
  // TRANSFORM TO TABLE ROWS
  // ---------------------------------------------------------------------------

  const students = useMemo(() => {
    let rows: StudentTableRow[] = rawStudents.map((item) => ({
      rank: item.result.organization_rank,
      participantId: item.participant.id,
      studentId: item.participant.student_id,
      studentNo: item.studentNo || null,
      name: item.participant.guest_name || 'Bilinmeyen',
      className: item.className || null,
      participantType: item.participant.participant_type,
      matchStatus: item.participant.match_status || null,
      totalCorrect: item.result.total_correct,
      totalWrong: item.result.total_wrong,
      totalBlank: item.result.total_blank,
      totalNet: item.result.total_net,
      percentile: item.result.percentile,
    }));

    // Filter: search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          (r.studentNo && r.studentNo.toLowerCase().includes(query))
      );
    }

    // Filter: participantType
    if (filters.participantType && filters.participantType !== 'all') {
      rows = rows.filter((r) => r.participantType === filters.participantType);
    }

    // Filter: classId (TODO: implement if needed)

    // Sort
    if (filters.sortBy) {
      rows.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (filters.sortBy) {
          case 'rank':
            aVal = a.rank ?? Infinity;
            bVal = b.rank ?? Infinity;
            break;
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'net':
            aVal = a.totalNet;
            bVal = b.totalNet;
            break;
          case 'percentile':
            aVal = a.percentile ?? -1;
            bVal = b.percentile ?? -1;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [rawStudents, filters]);

  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------

  const statistics = useMemo((): ExamStatistics | null => {
    if (rawStudents.length === 0) return null;

    const institutionStudents = rawStudents.filter(
      (s) => s.participant.participant_type === 'institution'
    );
    const guestStudents = rawStudents.filter(
      (s) => s.participant.participant_type === 'guest'
    );
    const pendingMatch = rawStudents.filter(
      (s) => s.participant.match_status === 'pending'
    );

    const nets = rawStudents.map((s) => s.result.total_net).sort((a, b) => a - b);
    const sum = nets.reduce((acc, val) => acc + val, 0);
    const avg = sum / nets.length;

    // Median
    const mid = Math.floor(nets.length / 2);
    const median = nets.length % 2 === 0 ? (nets[mid - 1] + nets[mid]) / 2 : nets[mid];

    // Std deviation
    const variance = nets.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / nets.length;
    const stdDev = Math.sqrt(variance);

    return {
      totalParticipants: rawStudents.length,
      institutionCount: institutionStudents.length,
      guestCount: guestStudents.length,
      pendingMatchCount: pendingMatch.length,
      averageNet: avg,
      maxNet: nets[nets.length - 1] || 0,
      minNet: nets[0] || 0,
      medianNet: median,
      stdDeviation: stdDev,
    };
  }, [rawStudents]);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    exam,
    sections,
    students,
    statistics,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchExamData,
  };
}
