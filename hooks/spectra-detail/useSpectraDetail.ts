'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import type {
  Exam,
  ExamSection,
  ExamParticipant,
  ExamStatistics,
  StudentTableRow,
  SpectraDetailData,
} from '@/types/spectra-detail';
import {
  calculateStatistics,
  createTableRows,
} from '@/lib/spectra-detail/calculations';

// ============================================================================
// SPECTRA DETAIL HOOK
// Sınav detay verisini çeker ve işler
// ============================================================================

interface UseSpectraDetailOptions {
  examId: string;
  organizationId?: string;
}

interface UseSpectraDetailResult {
  data: SpectraDetailData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSpectraDetail({
  examId,
  organizationId,
}: UseSpectraDetailOptions): UseSpectraDetailResult {
  const [data, setData] = useState<SpectraDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // #region agent log - examId validation
    console.log('🔑 [HOOK] examId received from props:', {
      examId,
      examIdType: typeof examId,
      examIdLength: examId?.length,
      examIdTrimmed: examId?.trim(),
      examIdIsEqual: examId === examId?.trim(),
    });
    // #endregion

    if (!examId) {
      setError(new Error('Exam ID gerekli'));
      setIsLoading(false);
      return;
    }

    // Her fetch'te state'i sıfırla - stale data gösterme
    setData(null);
    setError(null);
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getBrowserClient();

      // #region agent log - exams query
      console.log('🔍 [QUERY 1] exams table - examId used:', {
        examId,
        examIdType: typeof examId,
        queryType: 'exams.select().eq(id, examId)',
      });
      // #endregion

      // 1. Sınav ve bölümleri çek
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw new Error('Sınav bulunamadı: ' + examError.message);

      // #region agent log - exam_sections query
      console.log('🔍 [QUERY 2] exam_sections table - examId used:', {
        examId,
        examIdType: typeof examId,
        queryType: 'exam_sections.select().eq(exam_id, examId)',
      });
      // #endregion

      // 2. Sınav bölümlerini çek (exam_sections tablosu varsa)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('exam_sections')
        .select('*')
        .eq('exam_id', examId)
        .order('sort_order', { ascending: true });

      console.log('📚 exam_sections response:', {
        data: sectionsData,
        error: sectionsError,
        count: sectionsData?.length || 0,
      });

      if (sectionsError) {
        throw new Error('exam_sections fetch hatası: ' + sectionsError.message);
      }

      if (!sectionsData || sectionsData.length === 0) {
        throw new Error('❌ exam_sections tablosunda veri yok! SQL populator çalıştırılmalı.');
      }

      const sections: ExamSection[] = sectionsData || [];

      // #region agent log - exam_participants query
      console.log('🔍 [QUERY 3] exam_participants table - examId used:', {
        examId,
        examIdType: typeof examId,
        queryType: 'exam_participants.select().eq(exam_id, examId)',
      });
      // #endregion

      // 3. Katılımcıları ve sonuçları çek
      // Önce exam_participants'tan çek
      const { data: participantsData, error: participantsError } = await supabase
        .from('exam_participants')
        .select(`
          id,
          exam_id,
          organization_id,
          student_id,
          guest_name,
          class_name,
          answers,
          correct_count,
          wrong_count,
          empty_count,
          net,
          score,
          rank
        `)
        .eq('exam_id', examId)
        .order('rank', { ascending: true });

      // #region agent log - participants response
      console.log('📊 [QUERY 3 RESPONSE] exam_participants result:', {
        participantsCount: participantsData?.length || 0,
        firstParticipant: participantsData?.[0],
        firstParticipantExamId: participantsData?.[0]?.exam_id,
        examIdMatch: participantsData?.[0]?.exam_id === examId,
      });
      // #endregion

      if (participantsError) {
        console.warn('Katılımcı çekme hatası:', participantsError);
      }

      // 4. Exam results ve result sections'ları çek (nested join ile exam_sections dahil)
      console.log('🔍 Fetching exam_results for participants:', (participantsData || []).length);
      
      const { data: examResultsData, error: examResultsError } = await supabase
        .from('exam_results')
        .select(`
          *,
          exam_result_sections (
            *,
            exam_sections (*)
          )
        `)
        .in('exam_participant_id', (participantsData || []).map((p: any) => p.id));

      console.log('📊 exam_results response:', {
        data: examResultsData,
        error: examResultsError,
        count: examResultsData?.length || 0,
        firstResult: examResultsData?.[0],
      });

      if (examResultsError) {
        throw new Error('exam_results fetch hatası: ' + examResultsError.message);
      }

      if (!examResultsData || examResultsData.length === 0) {
        throw new Error('❌ exam_results tablosunda veri yok! SQL populator çalıştırılmalı.');
      }

      // Exam results map oluştur (participant_id -> exam_result)
      const resultsMap = new Map();
      (examResultsData || []).forEach((result: any) => {
        resultsMap.set(result.exam_participant_id, result);
      });

      // Katılımcı verisini ExamParticipant formatına dönüştür
      const participants: ExamParticipant[] = (participantsData || []).map((p: any) => {
        const examResult = resultsMap.get(p.id);
        
        if (!examResult) {
          console.warn(`⚠️ Participant ${p.id} için exam_result bulunamadı!`);
        } else {
          console.log(`✅ Participant ${p.id}:`, {
            sections: examResult.exam_result_sections?.length || 0,
            firstSection: examResult.exam_result_sections?.[0],
          });
        }
        
        return {
          id: p.id,
          exam_id: p.exam_id,
          organization_id: p.organization_id,
          person_id: null,
          student_id: p.student_id,
          participant_type: p.student_id ? 'institution' : 'guest',
          guest_name: p.guest_name,
          guest_school: null,
          guest_class: p.class_name,
          match_status: p.student_id ? 'matched' : 'guest',
          match_confidence: null,
          optical_student_no: null,
          optical_name: p.guest_name,
          exam_results: examResult ? [examResult] : [],
        };
      });

      // Eğer katılımcı yoksa, students tablosundan öğrenci bilgilerini çekelim
      if (participants.length > 0 && participants.some((p) => p.student_id)) {
        const studentIds = participants
          .filter((p) => p.student_id)
          .map((p) => p.student_id);

        const { data: studentsData } = await supabase
          .from('students')
          .select('id, student_no, first_name, last_name, class')
          .in('id', studentIds);

        // Öğrenci bilgilerini katılımcılara ekle
        if (studentsData) {
          const studentMap = new Map(studentsData.map((s: any) => [s.id, s]));
          participants.forEach((p) => {
            if (p.student_id && studentMap.has(p.student_id)) {
              const student = studentMap.get(p.student_id);
              p.student = {
                id: student.id,
                student_no: student.student_no || '',
                class: {
                  id: student.class || '',
                  name: student.class || '',
                },
              };
              p.person = {
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                tc_no: '',
              };
            }
          });
        }
      }

      // İstatistikleri hesapla
      const statistics = calculateStatistics(participants, sections);

      // Tablo satırlarını oluştur
      const tableRows = createTableRows(participants, sections);

      setData({
        exam: examData as Exam,
        sections,
        participants,
        statistics,
        tableRows,
      });
    } catch (err: any) {
      console.error('Spectra detail fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [examId, organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

