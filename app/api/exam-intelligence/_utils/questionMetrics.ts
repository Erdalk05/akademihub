export type QuestionMetric = {
  code: string
  label: string
  prefix: string
  correctKey?: string
  wrongKey?: string
  blankKey?: string
  questionCountKey?: string
}

const rxCorrect = /(doğru|dogru|correct)$/i
const rxWrong = /(yanlış|yanlis|wrong)$/i
const rxBlank = /(boş|bos|blank|empty)$/i
const rxSplit = /[_\s-]+/g

function normalizePrefix(prefix: string) {
  return String(prefix || '')
    .trim()
    .toLowerCase()
    .replace(rxSplit, '_')
}

function labelFromPrefix(p: string) {
  const lk = p.toLowerCase()
  if (/(turk|türk|turkce)/.test(lk)) return { code: 'TUR', label: 'Türkçe' }
  if (/(matematik|mat)/.test(lk)) return { code: 'MAT', label: 'Matematik' }
  if (/(fen|science)/.test(lk)) return { code: 'FEN', label: 'Fen' }
  if (/(ink|inkilap)/.test(lk)) return { code: 'INK', label: 'İnkılap' }
  if (/(sosyal|sos)/.test(lk)) return { code: 'SOS', label: 'Sosyal' }
  if (/(ingilizce|ing)/.test(lk)) return { code: 'ING', label: 'İngilizce' }
  if (/(din|religion)/.test(lk)) return { code: 'DIN', label: 'Din' }
  // fallback
  return { code: lk.toUpperCase().slice(0, 6), label: p }
}

/**
 * student_exam_results satırından doğru/yanlış/boş kolonlarını otomatik keşfeder.
 * Beklenen örnek kolonlar:
 * - turkce_dogru / turkce_yanlis / turkce_bos
 * - matematik_correct / matematik_wrong / matematik_blank
 * - fen_dogru gibi...
 */
export function inferQuestionMetrics(sampleRow: any): QuestionMetric[] {
  if (!sampleRow) return []
  const keys = Object.keys(sampleRow)

  const map = new Map<string, QuestionMetric>()
  const ensure = (prefix: string) => {
    const np = normalizePrefix(prefix)
    if (!map.has(np)) {
      const { code, label } = labelFromPrefix(np)
      map.set(np, { code, label, prefix: np })
    }
    return map.get(np)!
  }

  for (const k of keys) {
    const lk = k.toLowerCase()
    // total_net vb. yanlış eşleşmesin
    if (lk.includes('total_') || lk.includes('totalnet') || lk.includes('total_net')) continue

    if (rxCorrect.test(lk)) {
      const prefix = lk.replace(rxCorrect, '').replace(rxSplit, '_').replace(/_+$/, '')
      if (prefix) ensure(prefix).correctKey = k
    } else if (rxWrong.test(lk)) {
      const prefix = lk.replace(rxWrong, '').replace(rxSplit, '_').replace(/_+$/, '')
      if (prefix) ensure(prefix).wrongKey = k
    } else if (rxBlank.test(lk)) {
      const prefix = lk.replace(rxBlank, '').replace(rxSplit, '_').replace(/_+$/, '')
      if (prefix) ensure(prefix).blankKey = k
    } else {
      // soru sayısı varsa yakala (opsiyonel)
      // örn: turkce_soru, turkce_question_count, turkce_q
      if (/(soru|question).*count/i.test(lk) || /_soru$/.test(lk) || /_q$/.test(lk)) {
        const prefix = lk
          .replace(/(_question_count|_questioncount|question_count|_soru|_q)$/i, '')
          .replace(rxSplit, '_')
          .replace(/_+$/, '')
        if (prefix) ensure(prefix).questionCountKey = k
      }
    }
  }

  const out = Array.from(map.values()).filter((m) => m.correctKey || m.wrongKey || m.blankKey)

  // stabil sıralama
  const order = ['TUR', 'MAT', 'FEN', 'SOS', 'INK', 'ING', 'DIN']
  out.sort((a, b) => {
    const ai = order.indexOf(a.code)
    const bi = order.indexOf(b.code)
    if (ai === -1 && bi === -1) return a.label.localeCompare(b.label, 'tr')
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
  return out
}


