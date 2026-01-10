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

      // 1. Sınav ve bölümleri çek
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw new Error('Sınav bulunamadı: ' + examError.message);

      // 2. Sınav bölümlerini çek (exam_sections tablosu varsa)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('exam_sections')
        .select('*')
        .eq('exam_id', examId)
        .order('sort_order', { ascending: true });

      const sections: ExamSection[] = sectionsData || [];

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

      if (participantsError) {
        console.warn('Katılımcı çekme hatası:', participantsError);
      }

      // 4. Exam results ve result sections'ları çek (Fallback: exam_participants)
      let examResultsData: any[] = [];
      let examResultsError: any = null;

      // Önce exam_results tablosundan çekmeyi dene (answers kolonu olmadan)
      const resultsQuery = await supabase
        .from('exam_results')
        .select(`
          id,
          exam_participant_id,
          total_correct,
          total_wrong,
          total_blank,
          total_net,
          class_rank,
          organization_rank,
          percentile,
          ai_analysis,
          exam_result_sections (
            id,
            exam_section_id,
            correct_count,
            wrong_count,
            blank_count,
            net
          )
        `)
        .in('exam_participant_id', (participantsData || []).map((p: any) => p.id));

      if (resultsQuery.error) {
        console.warn('⚠️ exam_results tablosu bulunamadı, fallback kullanılıyor:', resultsQuery.error.message);
        examResultsError = resultsQuery.error;
        // Fallback: exam_participants verisini kullan
        examResultsData = [];
      } else {
        examResultsData = resultsQuery.data || [];
      }

      // Exam results map oluştur (participant_id -> exam_result)
      const resultsMap = new Map();
      (examResultsData || []).forEach((result: any) => {
        resultsMap.set(result.exam_participant_id, result);
      });

      // Katılımcı verisini ExamParticipant formatına dönüştür
      const participants: ExamParticipant[] = (participantsData || []).map((p: any) => {
        const examResult = resultsMap.get(p.id);
        
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
          exam_results: examResult ? [examResult] : [
            {
              id: p.id,
              exam_participant_id: p.id,
              total_correct: p.correct_count || 0,
              total_wrong: p.wrong_count || 0,
              total_blank: p.empty_count || 0,
              total_net: p.net || 0,
              class_rank: null,
              organization_rank: p.rank || null,
              percentile: null,
              ai_analysis: null,
              exam_result_sections: [],
            },
          ],
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

