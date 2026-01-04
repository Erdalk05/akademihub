import { normalizeKeyForMatch } from './normalize'

type StudentRow = Record<string, any>

type StudentIndex = {
  byId: Map<string, StudentRow>
  byStudentNo: Map<string, StudentRow>
  byTc: Map<string, StudentRow>
  byName: Map<string, StudentRow>
  tcKeys: string[]
  studentNoKeys: string[]
}

export function buildStudentIndex(students: StudentRow[]) : StudentIndex {
  const byId = new Map<string, StudentRow>()
  const byStudentNo = new Map<string, StudentRow>()
  const byTc = new Map<string, StudentRow>()
  const byName = new Map<string, StudentRow>()

  const sample = students[0] || {}
  const keys = Object.keys(sample)
  const tcKeys = keys.filter((k) => /(^tc(_|)id$)|(^tc(_|)no$)|tckn|kimlik/i.test(k))
  const studentNoKeys = keys.filter((k) => /student_no|ogrenci_no|ogrenciNo|school_no|okulNo/i.test(k))

  for (const s of students) {
    const id = String(s.id || '')
    if (id) byId.set(id, s)

    const fullName = String(s.full_name || `${s.first_name || ''} ${s.last_name || ''}` || '').trim()
    if (fullName) byName.set(normalizeKeyForMatch(fullName), s)

    for (const k of studentNoKeys) {
      const v = String(s[k] || '').trim()
      if (v) byStudentNo.set(v, s)
    }

    for (const k of tcKeys) {
      const v = String(s[k] || '').trim()
      if (v) byTc.set(v, s)
    }
  }

  return { byId, byStudentNo, byTc, byName, tcKeys, studentNoKeys }
}

export type MatchInput = {
  student_id?: string | null
  student_no?: string | null
  student_name?: string | null
  tc?: string | null
}

export function matchStudent(index: StudentIndex, input: MatchInput) {
  const id = String(input.student_id || '').trim()
  if (id && index.byId.has(id)) return index.byId.get(id) || null

  const tc = String(input.tc || '').trim()
  if (tc && index.byTc.has(tc)) return index.byTc.get(tc) || null

  const sno = String(input.student_no || '').trim()
  if (sno && index.byStudentNo.has(sno)) return index.byStudentNo.get(sno) || null

  const name = String(input.student_name || '').trim()
  if (name) {
    const key = normalizeKeyForMatch(name)
    if (index.byName.has(key)) return index.byName.get(key) || null
  }

  return null
}

export function classifyStudent(index: StudentIndex, input: MatchInput) {
  const matched = matchStudent(index, input)
  return {
    matched,
    studentType: matched ? 'asil' : 'misafir',
  } as const
}
