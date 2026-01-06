import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRls } from '../../_utils/supabaseRls'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getSupabaseRls()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')
  const examId = url.searchParams.get('examId')
  const dersKodu = url.searchParams.get('dersKodu')

  const empty = { overview: { totalKazanım: 0, totalSoru: 0 }, weakest: [], strongest: [] }
  if (!organizationId) return NextResponse.json(empty)

  try {
    let q = supabase
      .from('ogrenci_kazanim_sonuclari')
      .select('kazanim_kodu, toplam_soru, dogru_sayisi, yanlis_sayisi, bos_sayisi, basari_orani')
      .eq('organization_id', organizationId)

    if (examId) q = q.eq('exam_id', examId)

    const { data: rows } = await q

    if (!rows || rows.length === 0) return NextResponse.json(empty)

    // ders_kodu ve konu_adi sinav_cevap_anahtari üzerinden
    const kazanımKodlari = Array.from(new Set(rows.map((r: any) => r.kazanim_kodu).filter(Boolean)))

    const { data: keyRows } = await supabase
      .from('sinav_cevap_anahtari')
      .select('kazanim_kodu, ders_kodu, ders_adi, konu_adi, kazanim_metni')
      .eq('organization_id', organizationId)
      .in('kazanim_kodu', kazanımKodlari)

    const metaByKod: Record<string, { ders_kodu: string | null; ders_adi: string | null; konu_adi: string | null; kazanim_metni: string | null }> = {}
    ;(keyRows || []).forEach((k: any) => {
      if (!k?.kazanim_kodu) return
      if (!metaByKod[k.kazanim_kodu]) {
        metaByKod[k.kazanim_kodu] = {
          ders_kodu: k.ders_kodu || null,
          ders_adi: k.ders_adi || null,
          konu_adi: k.konu_adi || null,
          kazanim_metni: k.kazanim_metni || null,
        }
      }
    })

    const agg: Record<
      string,
      { toplamSoru: number; dogru: number; yanlis: number; bos: number; weightedSum: number; weightedCount: number }
    > = {}

    for (const r of rows as any[]) {
      const kod = r.kazanim_kodu as string
      if (!kod) continue
      if (!agg[kod]) agg[kod] = { toplamSoru: 0, dogru: 0, yanlis: 0, bos: 0, weightedSum: 0, weightedCount: 0 }

      const ts = Number(r.toplam_soru) || 0
      const basari = Number(r.basari_orani)

      agg[kod].toplamSoru += ts
      agg[kod].dogru += Number(r.dogru_sayisi) || 0
      agg[kod].yanlis += Number(r.yanlis_sayisi) || 0
      agg[kod].bos += Number(r.bos_sayisi) || 0

      // başarı oranı varsa ağırlıklı ortalama: soru sayısı
      if (!Number.isNaN(basari)) {
        agg[kod].weightedSum += basari * (ts || 1)
        agg[kod].weightedCount += (ts || 1)
      }
    }

    let items = Object.entries(agg).map(([kazanim_kodu, a]) => {
      const meta = metaByKod[kazanim_kodu] || { ders_kodu: null, ders_adi: null, konu_adi: null, kazanim_metni: null }
      const basari = a.weightedCount > 0 ? a.weightedSum / a.weightedCount : 0
      return {
        kazanim_kodu,
        ders_kodu: meta.ders_kodu,
        ders_adi: meta.ders_adi,
        konu_adi: meta.konu_adi,
        kazanim_metni: meta.kazanim_metni,
        toplam_soru: a.toplamSoru,
        dogru: a.dogru,
        yanlis: a.yanlis,
        bos: a.bos,
        basari_orani: Math.round(basari * 10) / 10,
      }
    })

    if (dersKodu) {
      items = items.filter((i) => (i.ders_kodu || '') === dersKodu)
    }

    const totalSoru = items.reduce((s, i) => s + (Number(i.toplam_soru) || 0), 0)

    const sorted = [...items].sort((a, b) => (a.basari_orani || 0) - (b.basari_orani || 0))

    return NextResponse.json({
      overview: { totalKazanım: items.length, totalSoru },
      weakest: sorted.slice(0, 20),
      strongest: sorted.slice(-20).reverse(),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(empty)
  }
}
