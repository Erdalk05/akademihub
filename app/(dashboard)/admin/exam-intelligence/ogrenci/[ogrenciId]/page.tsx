import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function Page({ params }: { params: { ogrenciId: string } }) {
  redirect(`/admin/exam-intelligence/ogrenciler/${encodeURIComponent(params.ogrenciId)}`)
}
