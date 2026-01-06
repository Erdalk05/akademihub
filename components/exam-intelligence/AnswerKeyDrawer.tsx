/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, X } from 'lucide-react'

export type AnswerKeyRow = {
  soruNo?: number
  dogruCevap?: string
  dersKodu?: string
  dersAdi?: string
  kitapcikCevaplari?: Record<string, string | undefined>
}

export type AnswerKeyExam = { id: string; name: string; exam_type?: string | null; booklets: string[] }

export function AnswerKeyDrawer({
  open,
  loading,
  error,
  exam,
  rows,
  initialBooklet,
  onClose,
}: {
  open: boolean
  loading: boolean
  error: string | null
  exam: AnswerKeyExam | null
  rows: AnswerKeyRow[]
  initialBooklet: 'A' | 'B' | 'C' | 'D'
  onClose: () => void
}) {
  const [booklet, setBooklet] = useState<'A' | 'B' | 'C' | 'D'>(initialBooklet)

  useEffect(() => {
    if (!open) return
    setBooklet(initialBooklet)
  }, [initialBooklet, open])

  const grouped = useMemo(() => {
    const by: Record<string, AnswerKeyRow[]> = {}
    for (const r of rows || []) {
      const code = String(r.dersKodu || 'DERS').toUpperCase()
      if (!by[code]) by[code] = []
      by[code].push(r)
    }
    const entries = Object.entries(by).map(([code, rs]) => {
      const sorted = [...rs].sort((a, b) => Number(a.soruNo || 0) - Number(b.soruNo || 0))
      return { code, label: sorted[0]?.dersAdi || code, rows: sorted }
    })
    entries.sort((a, b) => Number(a.rows[0]?.soruNo || 0) - Number(b.rows[0]?.soruNo || 0))
    return entries
  }, [rows])

  const copyAnswerKey = async () => {
    try {
      const lines: string[] = []
      lines.push(['DERS', 'SORU_NO', `DOGRU(${booklet})`].join('\t'))
      for (const g of grouped) {
        for (const r of g.rows) {
          const ans = String((r.kitapcikCevaplari as any)?.[booklet] || r.dogruCevap || '').toUpperCase()
          lines.push([g.code, String(r.soruNo ?? ''), ans].join('\t'))
        }
      }
      await navigator.clipboard.writeText(lines.join('\n'))
    } catch {
      // ignore
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[720px] bg-white shadow-2xl border-l flex flex-col">
        <div className="p-4 border-b flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black text-gray-900">Cevap Anahtarı</div>
            <div className="text-sm text-gray-600">{exam?.name || '-'}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200" title="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-gray-500">Kitapçık</div>
            {(exam?.booklets?.length ? exam.booklets : ['A']).map((b) => (
              <button
                key={b}
                onClick={() => setBooklet((b as any) || 'A')}
                className={`w-10 h-10 rounded-xl font-black border transition ${
                  booklet === b ? 'bg-[#25D366] text-white border-[#25D366]' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <button
            onClick={copyAnswerKey}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800"
          >
            <Copy className="w-4 h-4" />
            Kopyala (TSV)
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {loading ? (
            <div className="min-h-[200px] flex items-center justify-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Yükleniyor...
            </div>
          ) : error ? (
            <div className="p-4 bg-white border rounded-2xl text-red-700 font-semibold">{error}</div>
          ) : grouped.length === 0 ? (
            <div className="p-4 bg-white border rounded-2xl text-gray-600">Cevap anahtarı bulunamadı.</div>
          ) : (
            <div className="space-y-4">
              {grouped.map((g) => (
                <div key={g.code} className="bg-white border rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <div className="font-black text-gray-900">{g.label}</div>
                    <div className="text-xs text-gray-500">
                      {g.code} • {g.rows.length} soru
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2 font-bold">Soru No</th>
                          <th className="text-left px-4 py-2 font-bold">Doğru Cevap ({booklet})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r, idx) => {
                          const ans = String((r.kitapcikCevaplari as any)?.[booklet] || r.dogruCevap || '').toUpperCase()
                          return (
                            <tr key={`${g.code}-${idx}`} className="border-t">
                              <td className="px-4 py-2 font-semibold text-gray-900">{r.soruNo ?? '-'}</td>
                              <td className="px-4 py-2 font-mono font-black text-[#075E54] select-text">{ans || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


