export function trUpper(s: string) {
  return (s || '')
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase()
    .trim()
}

export function normalizeName(s: string) {
  return trUpper(s)
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeKeyForMatch(s: string) {
  return normalizeName(s).replace(/\s+/g, '')
}
