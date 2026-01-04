export type SubjectDef = { key: string; code: string; label: string }

// Kolon adlarından ders tespiti (esnek)
export function inferSubjectsFromKeys(keys: string[]): SubjectDef[] {
  const out: SubjectDef[] = []

  const add = (key: string, code: string, label: string) => {
    if (!out.find((s) => s.key === key)) out.push({ key, code, label })
  }

  for (const k of keys) {
    const lk = k.toLowerCase()
    if (!lk.includes('net')) continue
    if (lk === 'total_net') continue

    if (/(turk|türk|turkce)/.test(lk)) add(k, 'TUR', 'Türkçe')
    else if (/(matematik|mat_)/.test(lk)) add(k, 'MAT', 'Matematik')
    else if (/(fen|science)/.test(lk)) add(k, 'FEN', 'Fen')
    else if (/(sosyal|sos_|ink|inkilap)/.test(lk)) {
      // Sosyal ve İnkılap ayrımı varsa iki ayrı kolon olabilir
      if (/(ink|inkilap)/.test(lk)) add(k, 'INK', 'İnkılap')
      else add(k, 'SOS', 'Sosyal')
    }
    else if (/(ingilizce|ing_)/.test(lk)) add(k, 'ING', 'İngilizce')
    else if (/(din|religion)/.test(lk)) add(k, 'DIN', 'Din')
    else if (/_net$/.test(lk)) {
      // fallback: bilinmeyen _net kolonlarını da göster (label=key)
      add(k, lk.toUpperCase().replace(/_NET$/, ''), k)
    }
  }

  // Stabil sıralama
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

export function pickSubjectNetKeys(sampleRow: any): string[] {
  if (!sampleRow) return []
  return Object.keys(sampleRow)
    .filter((k) => /net/i.test(k))
    .filter((k) => k !== 'total_net')
}
