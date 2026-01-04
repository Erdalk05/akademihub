'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { GraduationCap, Loader2 } from 'lucide-react'

type ClassRow = {
  sinif: string
  ogrenci_sayisi: number
  ortalama_net: number
}

type ApiResp = { data: ClassRow[] }

export default function ClassesPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [rows, setRows] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/exam-intelligence/sinif?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ApiResp
        setRows(json.data || [])
      } catch (e) {
        console.error(e)
        setError('Sınıflar alınamadı.')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id])

  const sorted = useMemo(() => {
    return [...(rows || [])].sort((a, b) => (b.ortalama_net || 0) - (a.ortalama_net || 0))
  }, [rows])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Sınıflar</h1>
        <p className="text-sm text-gray-600">Toplam: {sorted.length}</p>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border text-gray-600">Henüz sınıf verisi yok.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorted.map((c) => (
            <button
              key={c.sinif}
              onClick={() => router.push(`/admin/exam-intelligence/siniflar/${encodeURIComponent(c.sinif)}`)}
              className="text-left bg-white rounded-2xl p-5 shadow-sm border hover:border-[#25D366] hover:shadow transition"
            >
              <div className="flex items-center justify-between">
                <div className="font-black text-gray-900">{c.sinif}</div>
                <GraduationCap className="w-5 h-5 text-[#25D366]" />
              </div>
              <div className="mt-3 text-3xl font-black text-[#075E54]">{Number(c.ortalama_net || 0).toFixed(1)}</div>
              <div className="mt-1 text-sm text-gray-600">{c.ogrenci_sayisi || 0} öğrenci</div>
              <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-[#25D366]" style={{ width: `${Math.min(100, (Number(c.ortalama_net || 0) / 80) * 100)}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
