import { getServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')
  const examId = url.searchParams.get('examId')
  const dersKodu = url.searchParams.get('dersKodu')

  const empty = { konular: [] }
  if (!organizationId) return NextResponse.json(empty)

  try {
    // Konu -> kazanım kodları (cevap anahtarı)
    let keyQ = supabase
      .from('sinav_cevap_anahtari')
      .select('exam_id, ders_kodu, ders_adi, konu_adi, kazanim_kodu')
      .eq('organization_id', organizationId)

    if (examId) keyQ = keyQ.eq('exam_id', examId)
    if (dersKodu) keyQ = keyQ.eq('ders_kodu', dersKodu)

    const { data: keys } = await keyQ
    if (!keys || keys.length === 0) return NextResponse.json(empty)

    const kazanımKodlari = Array.from(new Set(keys.map((k: any) => k.kazanim_kodu).filter(Boolean)))

    // kazanım sonuçları
    let resQ = supabase
      .from('ogrenci_kazanim_sonuclari')
      .select('exam_id, kazanim_kodu, toplam_soru, basari_orani')
      .eq('organization_id', organizationId)
      .in('kazanim_kodu', kazanımKodlari)

    if (examId) resQ = resQ.eq('exam_id', examId)

    const { data: results } = await resQ
    if (!results || results.length === 0) return NextResponse.json(empty)

    // kazanım -> konu meta
    const metaByKod: Record<string, { ders_kodu: string | null; ders_adi: string | null; konu_adi: string | null }> = {}
    ;(keys as any[]).forEach((k) => {
      if (!k?.kazanim_kodu) return
      if (!metaByKod[k.kazanim_kodu]) {
        metaByKod[k.kazanim_kodu] = {
          ders_kodu: k.ders_kodu || null,
          ders_adi: k.ders_adi || null,
          konu_adi: k.konu_adi || null,
        }
      }
    })

    const agg: Record<string, { ders_kodu: string | null; ders_adi: string | null; konu_adi: string | null; weightedSum: number; weightedCount: number; totalSoru: number }> = {}

    for (const r of results as any[]) {
      const kod = r.kazanim_kodu as string
      const meta = metaByKod[kod]
      if (!meta) continue
      const key = `${meta.ders_kodu || 'UNK'}::${meta.konu_adi || 'Belirsiz'}`
      if (!agg[key]) {
        agg[key] = { ders_kodu: meta.ders_kodu, ders_adi: meta.ders_adi, konu_adi: meta.konu_adi, weightedSum: 0, weightedCount: 0, totalSoru: 0 }
      }

      const ts = Number(r.toplam_soru) || 0
      const basari = Number(r.basari_orani)

      agg[key].totalSoru += ts
      if (!Number.isNaN(basari)) {
        agg[key].weightedSum += basari * (ts || 1)
        agg[key].weightedCount += (ts || 1)
      }
    }

    const konular = Object.values(agg)
      .map((a) => ({
        ders_kodu: a.ders_kodu,
        ders_adi: a.ders_adi,
        konu_adi: a.konu_adi,
        toplam_soru: a.totalSoru,
        basari_orani: a.weightedCount > 0 ? Math.round((a.weightedSum / a.weightedCount) * 10) / 10 : 0,
      }))
      .sort((a, b) => (a.basari_orani || 0) - (b.basari_orani || 0))

    return NextResponse.json({ konular })
  } catch (e) {
    console.error(e)
    return NextResponse.json(empty)
  }
}
