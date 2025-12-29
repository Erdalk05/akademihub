# Optik Analiz Güvenlik Checklist’i (Zorunlu)

Bu dosya, AkademiHub optik sınav analiz sisteminde **sessiz yanlış sonuç** riskini (silent wrong scoring) engellemek için Cursor’a verilecek **zorunlu prompt** standardıdır.

> Amaç: **Sistem yanlış çalışıyorsa “çalışıyor gibi” davranmamalı.** Çökme kabul; sessiz yanlış puanlama kabul değil.

---

## CURSOR PROMPT (AYNEN)

```txt
You are working on AkademiHub’s optical exam analysis system.

Your PRIMARY responsibility is to PREVENT SILENT WRONG RESULTS.
Crashes are acceptable. Silent wrong scoring is NOT.

Apply the following OPTICAL ANALYSIS SAFETY CHECKLIST as HARD RULES.
If any rule is violated, you MUST:
- log explicitly
- warn loudly
- and if required, stop the operation

==============================
OPTICAL ANALYSIS SAFETY CHECKLIST
==============================

1) DATA MODEL GUARANTEE
- Every student answer MUST have:
  - exam_id
  - student_id
  - answers[]
  - booklet (A/B/C)
- If booklet is missing or invalid:
  -> STOP processing
  -> log:
     [DATA-GUARD] Missing booklet for student_id=...

2) ANSWER KEY GUARANTEE
- For each exam:
  - If booklet A exists -> A answer key MUST exist
  - If booklet B exists -> B answer key MUST exist
- If a booklet answer key is missing:
  -> DO NOT silently fallback
  -> log:
     [KEY-GUARD] Missing answer key for booklet=B examId=...

3) MATCHING GUARANTEE
- During scoring:
  student.booklet MUST equal usedAnswerKey.booklet
- Always log (INFO):
  [SCORING] student=ID booklet=B keyUsed=B
- If mismatch occurs:
  -> WARN:
     [MATCHING-ERROR] student=ID booklet=B used=A

4) FALLBACK RULE (CRITICAL)
- Any fallback (e.g. B -> A) MUST:
  - be explicitly logged
  - never be silent
- Required log:
  [FALLBACK] booklet=B used=A count=N examId=...

5) SANITY CHECK
- After scoring:
  - compute average correct / net
- If results are statistically abnormal:
  -> WARN:
     [SANITY-ALERT] Abnormal results detected examId=...

6) REFERENCE STUDENT
- System MUST support at least one reference student
- Used to validate scoring correctness

7) REPAIRABILITY
- System MUST support:
  - POST /api/admin/recalculate-exam
  - POST /api/admin/rebuild-booklet-keys
- If repair endpoints are missing:
  -> WARN that system is not safely repairable

8) LOG LEVEL STANDARD
- ERROR: stop system
- WARN: data inconsistency, fallback, mismatch
- INFO: summary flow
- DEBUG: optional, temporary

==============================
ABSOLUTE RULE
==============================
Silent fallback or silent mismatch is FORBIDDEN.

If you detect any place in the codebase where:
- fallback exists without logging
- booklet is assumed instead of validated
- answer key selection is implicit

YOU MUST refactor or add guards.

Your goal is not to make the system “work”,
but to make it IMPOSSIBLE for it to work incorrectly without shouting.

Proceed accordingly.
```


