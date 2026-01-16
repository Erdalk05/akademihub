-- ============================================================================
-- EXAM RESULTS CANONICAL QUERIES - Supabase SQL Editor Compatible
-- ============================================================================
-- Replace '<EXAM_ID>' with actual UUID before running
-- ============================================================================

-- Query 1: Count results for an exam
SELECT COUNT(*) AS result_count
FROM exam_results er
JOIN exam_participants ep ON ep.id = er.exam_participant_id
WHERE ep.exam_id = '<EXAM_ID>'::uuid;

-- Query 2: Top 10 performers (name, net, score)
SELECT 
  ep.participant_name,
  er.total_net,
  er.total_score
FROM exam_results er
JOIN exam_participants ep ON ep.id = er.exam_participant_id
WHERE ep.exam_id = '<EXAM_ID>'::uuid
ORDER BY er.total_net DESC
LIMIT 10;

-- Query 3: Full ordered result list
SELECT 
  ep.participant_name,
  er.total_net,
  er.total_score
FROM exam_results er
JOIN exam_participants ep ON ep.id = er.exam_participant_id
WHERE ep.exam_id = '<EXAM_ID>'::uuid
ORDER BY er.total_net DESC;
