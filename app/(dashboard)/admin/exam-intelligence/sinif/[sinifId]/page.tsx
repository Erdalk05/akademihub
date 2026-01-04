import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function Page({ params }: { params: { sinifId: string } }) {
  redirect(`/admin/exam-intelligence/siniflar/${encodeURIComponent(params.sinifId)}`)
}
